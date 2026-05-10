use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("5JPjbA41yGiPKSFet9rW4C3zxKss8SEZBEknDG2NJi8D");

// ─── Pyth Price Feed Constants ───────────────────────────────────────────────
// DevNet — SOL/USD price feed account
pub const PYTH_SOL_USD_FEED_DEVNET: Pubkey =
    pubkey!("J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix");

// ─── Game Constants ──────────────────────────────────────────────────────────
pub const INITIAL_LIVES: u8 = 3;
pub const MAX_PLAYERS_CAP: u8 = 10;
pub const MIN_PLAYERS: u8 = 2;
pub const MIN_ROUND_DURATION: i64 = 30;
pub const MAX_ROUND_DURATION: i64 = 600;
pub const PRICE_STALENESS_SECONDS: i64 = 120;

// ─── Manual Pyth V2 price account parsing ────────────────────────────────────
// The Pyth V2 on-chain price account layout has fixed offsets.
// We only need: price (i64), conf (u64), status, and timestamp.
// Reference: https://github.com/pyth-network/pyth-client/blob/main/program/rust/src/state.rs

/// Parsed price from a Pyth V2 on-chain account
struct PythPrice {
    price: i64,
    conf: u64,
    timestamp: i64,
}

/// Parse price from a Pyth V2 price account's raw data.
/// Layout (offsets in bytes):
///   208..216 = price (i64 LE)
///   216..224 = conf (u64 LE)
///   224..228 = status (u32 LE) — 1 = Trading
///   232..240 = publish_time (i64 LE)
fn parse_pyth_price(data: &[u8]) -> Result<PythPrice> {
    require!(data.len() >= 240, ErrorCode::InvalidPriceFeed);

    let price = i64::from_le_bytes(
        data[208..216]
            .try_into()
            .map_err(|_| ErrorCode::InvalidPriceFeed)?,
    );
    let conf = u64::from_le_bytes(
        data[216..224]
            .try_into()
            .map_err(|_| ErrorCode::InvalidPriceFeed)?,
    );
    let status = u32::from_le_bytes(
        data[224..228]
            .try_into()
            .map_err(|_| ErrorCode::InvalidPriceFeed)?,
    );
    let timestamp = i64::from_le_bytes(
        data[232..240]
            .try_into()
            .map_err(|_| ErrorCode::InvalidPriceFeed)?,
    );

    // status == 1 means "Trading"
    require!(status == 1, ErrorCode::StalePriceData);

    Ok(PythPrice {
        price,
        conf,
        timestamp,
    })
}

#[program]
pub mod prediction_royale {
    use super::*;

    /// Initialize the global game config. Called once by the authority.
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.authority = ctx.accounts.authority.key();
        config.bump = ctx.bumps.config;
        msg!("Config initialized. Authority: {}", config.authority);
        Ok(())
    }

    /// Create a new game room. The creator must call join_room separately.
    pub fn create_room(
        ctx: Context<CreateRoom>,
        entry_fee: u64,
        max_players: u8,
        round_duration: i64,
        is_private: bool,
    ) -> Result<()> {
        require!(entry_fee > 0, ErrorCode::InvalidAmount);
        require!(
            max_players >= MIN_PLAYERS && max_players <= MAX_PLAYERS_CAP,
            ErrorCode::InvalidMaxPlayers
        );
        require!(
            round_duration >= MIN_ROUND_DURATION && round_duration <= MAX_ROUND_DURATION,
            ErrorCode::InvalidRoundDuration
        );

        let room = &mut ctx.accounts.room;
        room.creator = ctx.accounts.creator.key();
        room.entry_fee = entry_fee;
        room.max_players = max_players;
        room.round_duration = round_duration;
        room.is_private = is_private;
        room.status = RoomStatus::Open;
        room.current_round = 0;
        room.round_end_time = 0;
        room.total_prize = 0;
        room.last_price = 0;
        room.winner = None;
        room.players = Vec::new();
        room.bump = ctx.bumps.room;
        room.active_players = 0;

        msg!(
            "Room created by {}. Fee: {} lamports, Max: {} players",
            room.creator,
            entry_fee,
            max_players
        );
        Ok(())
    }

    /// Join an existing room. Pays entry fee and creates player data.
    pub fn join_room(ctx: Context<JoinRoom>) -> Result<()> {
        let room = &mut ctx.accounts.room;

        require!(room.status == RoomStatus::Open, ErrorCode::RoomNotOpen);
        require!(
            (room.players.len() as u8) < room.max_players,
            ErrorCode::RoomFull
        );
        require!(
            !room.players.contains(&ctx.accounts.player.key()),
            ErrorCode::AlreadyJoined
        );

        // Transfer entry fee from player to room PDA
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.player.to_account_info(),
                    to: room.to_account_info(),
                },
            ),
            room.entry_fee,
        )?;

        room.players.push(ctx.accounts.player.key());
        room.total_prize = room
            .total_prize
            .checked_add(room.entry_fee)
            .ok_or(ErrorCode::MathOverflow)?;
        room.active_players += 1;

        // Initialize player data
        let player_data = &mut ctx.accounts.player_data;
        player_data.authority = ctx.accounts.player.key();
        player_data.room = room.key();
        player_data.lives = INITIAL_LIVES;
        player_data.eliminated = false;
        player_data.current_prediction = None;
        player_data.prediction_round = 0;
        player_data.elimination_round = None;
        player_data.bump = ctx.bumps.player_data;

        msg!(
            "Player {} joined. {}/{} players",
            ctx.accounts.player.key(),
            room.players.len(),
            room.max_players
        );
        Ok(())
    }

    /// Submit a prediction (Up or Down) for the current round.
    pub fn predict(ctx: Context<Predict>, direction: PredictionDirection) -> Result<()> {
        let room = &ctx.accounts.room;
        let player_data = &mut ctx.accounts.player_data;

        require!(
            room.status == RoomStatus::InProgress,
            ErrorCode::GameNotInProgress
        );
        require!(!player_data.eliminated, ErrorCode::PlayerEliminated);
        require!(
            player_data.prediction_round != room.current_round,
            ErrorCode::AlreadyPredicted
        );

        let clock = Clock::get()?;
        require!(
            clock.unix_timestamp < room.round_end_time,
            ErrorCode::RoundExpired
        );

        player_data.current_prediction = Some(direction.clone());
        player_data.prediction_round = room.current_round;

        msg!(
            "Player {} predicted {:?} for round {}",
            ctx.accounts.player.key(),
            direction,
            room.current_round
        );
        Ok(())
    }

    /// Resolve the current round. Only the room creator (keeper) can call this.
    /// Reads the real SOL/USD price from the Pyth on-chain account.
    /// First call: sets initial price and starts the game.
    /// Subsequent calls: evaluates predictions, deducts lives.
    ///
    /// All active PlayerData accounts must be passed as remaining_accounts.
    pub fn resolve_round(ctx: Context<ResolveRound>) -> Result<()> {
        let clock = Clock::get()?;

        // ── Read and validate Pyth price ─────────────────────────────────
        let pyth_data = ctx.accounts.pyth_price_update.try_borrow_data()?;
        let pyth_price = parse_pyth_price(&pyth_data)?;
        drop(pyth_data);

        // SECURITY: reject stale prices
        require!(
            clock.unix_timestamp - pyth_price.timestamp <= PRICE_STALENESS_SECONDS,
            ErrorCode::StalePriceData
        );

        // SECURITY: reject if confidence interval > 5% of price
        require!(
            pyth_price.conf < (pyth_price.price.unsigned_abs() / 20),
            ErrorCode::PriceConfidenceTooWide
        );

        let current_price_value = pyth_price.price;
        let room = &mut ctx.accounts.room;

        // ── First resolution: start the game ─────────────────────────────
        if room.last_price == 0 {
            require!(
                room.status == RoomStatus::Open,
                ErrorCode::InvalidRoomState
            );
            require!(
                room.players.len() as u8 >= MIN_PLAYERS,
                ErrorCode::NotEnoughPlayers
            );

            room.last_price = current_price_value;
            room.status = RoomStatus::InProgress;
            room.current_round = 1;
            room.round_end_time = clock
                .unix_timestamp
                .checked_add(room.round_duration)
                .ok_or(ErrorCode::MathOverflow)?;

            msg!(
                "Game started! Price: {}. Round 1 ends at {}",
                current_price_value,
                room.round_end_time
            );
            return Ok(());
        }

        // ── Subsequent resolutions ───────────────────────────────────────
        require!(
            room.status == RoomStatus::InProgress,
            ErrorCode::GameNotInProgress
        );
        require!(
            clock.unix_timestamp >= room.round_end_time,
            ErrorCode::RoundNotEnded
        );

        let price_went_up = current_price_value > room.last_price;

        // Process each player from remaining_accounts
        for account_info in ctx.remaining_accounts.iter() {
            if !account_info.is_writable || account_info.owner != &crate::ID {
                continue;
            }

            let data = account_info.try_borrow_data()?;
            let mut player_data = match PlayerData::try_deserialize(&mut &data[..]) {
                Ok(pd) => pd,
                Err(_) => {
                    drop(data);
                    continue;
                }
            };
            drop(data);

            if player_data.room != room.key() || player_data.eliminated {
                continue;
            }

            // Evaluate prediction
            let predicted_correctly = if player_data.prediction_round == room.current_round {
                match &player_data.current_prediction {
                    Some(PredictionDirection::Up) => price_went_up,
                    Some(PredictionDirection::Down) => !price_went_up,
                    None => false,
                }
            } else {
                // No prediction = automatic miss
                false
            };

            if !predicted_correctly {
                player_data.lives = player_data.lives.saturating_sub(1);
                if player_data.lives == 0 {
                    player_data.eliminated = true;
                    player_data.elimination_round = Some(room.current_round);
                    room.active_players = room.active_players.saturating_sub(1);
                    msg!("Player {} ELIMINATED round {}", player_data.authority, room.current_round);
                }
            }

            // Reset for next round
            player_data.current_prediction = None;

            // Write back
            let mut data = account_info.try_borrow_mut_data()?;
            player_data
                .try_serialize(&mut &mut data[..])
                .map_err(|_| ErrorCode::SerializationError)?;
        }

        // ── Update room ─────────────────────────────────────────────────
        let old_price = room.last_price;
        room.last_price = current_price_value;

        if room.active_players <= 1 {
            room.status = RoomStatus::Resolved;
            // Find the last alive player
            for account_info in ctx.remaining_accounts.iter() {
                if !account_info.is_writable || account_info.owner != &crate::ID {
                    continue;
                }
                let data = account_info.try_borrow_data()?;
                if let Ok(pd) = PlayerData::try_deserialize(&mut &data[..]) {
                    if pd.room == room.key() && !pd.eliminated {
                        room.winner = Some(pd.authority);
                        msg!("WINNER: {}! Prize: {} lamports", pd.authority, room.total_prize);
                        break;
                    }
                }
            }
        } else {
            room.current_round += 1;
            room.round_end_time = clock
                .unix_timestamp
                .checked_add(room.round_duration)
                .ok_or(ErrorCode::MathOverflow)?;
            msg!(
                "Round done. Price {}→{}. Alive: {}. Next: round {}",
                old_price,
                current_price_value,
                room.active_players,
                room.current_round
            );
        }

        Ok(())
    }

    /// Winner claims the full prize pool. Closes room and player_data accounts.
    pub fn claim_prize(ctx: Context<ClaimPrize>) -> Result<()> {
        let prize = ctx.accounts.room.total_prize;
        msg!(
            "Prize {} lamports claimed by {}!",
            prize,
            ctx.accounts.winner.key()
        );
        // Anchor's `close = winner` on both accounts transfers all lamports.
        Ok(())
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// Account Contexts
// ═════════════════════════════════════════════════════════════════════════════

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        seeds = [b"config"],
        bump,
        payer = authority,
        space = 8 + Config::LEN
    )]
    pub config: Account<'info, Config>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateRoom<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(
        init,
        seeds = [b"room", creator.key().as_ref()],
        bump,
        payer = creator,
        space = 8 + Room::MAX_SIZE
    )]
    pub room: Account<'info, Room>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinRoom<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(
        mut,
        seeds = [b"room", room.creator.as_ref()],
        bump = room.bump,
        constraint = room.status == RoomStatus::Open @ ErrorCode::RoomNotOpen,
    )]
    pub room: Account<'info, Room>,
    #[account(
        init,
        seeds = [b"player", room.key().as_ref(), player.key().as_ref()],
        bump,
        payer = player,
        space = 8 + PlayerData::LEN
    )]
    pub player_data: Account<'info, PlayerData>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Predict<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(
        seeds = [b"room", room.creator.as_ref()],
        bump = room.bump,
    )]
    pub room: Account<'info, Room>,
    #[account(
        mut,
        seeds = [b"player", room.key().as_ref(), player.key().as_ref()],
        bump = player_data.bump,
        constraint = player_data.authority == player.key() @ ErrorCode::Unauthorized,
        constraint = player_data.room == room.key() @ ErrorCode::InvalidPlayerAccount,
    )]
    pub player_data: Account<'info, PlayerData>,
}

#[derive(Accounts)]
pub struct ResolveRound<'info> {
    #[account(mut)]
    pub keeper: Signer<'info>,
    #[account(
        mut,
        seeds = [b"room", room.creator.as_ref()],
        bump = room.bump,
        constraint = room.creator == keeper.key() @ ErrorCode::Unauthorized,
    )]
    pub room: Account<'info, Room>,
    /// CHECK: Validated against PYTH_SOL_USD_FEED_DEVNET in instruction logic
    #[account(
        constraint = pyth_price_update.key() == PYTH_SOL_USD_FEED_DEVNET @ ErrorCode::InvalidPriceFeed
    )]
    pub pyth_price_update: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct ClaimPrize<'info> {
    #[account(mut)]
    pub winner: Signer<'info>,
    #[account(
        mut,
        close = winner,
        seeds = [b"room", room.creator.as_ref()],
        bump = room.bump,
        constraint = room.status == RoomStatus::Resolved @ ErrorCode::GameNotResolved,
        constraint = room.winner == Some(winner.key()) @ ErrorCode::NotWinner,
    )]
    pub room: Account<'info, Room>,
    #[account(
        mut,
        close = winner,
        seeds = [b"player", room.key().as_ref(), winner.key().as_ref()],
        bump = player_data.bump,
        constraint = player_data.authority == winner.key() @ ErrorCode::Unauthorized,
    )]
    pub player_data: Account<'info, PlayerData>,
}

// ═════════════════════════════════════════════════════════════════════════════
// Account Structs
// ═════════════════════════════════════════════════════════════════════════════

#[account]
pub struct Config {
    pub authority: Pubkey,
    pub bump: u8,
}
impl Config {
    pub const LEN: usize = 32 + 1;
}

#[account]
pub struct Room {
    pub creator: Pubkey,        // 32
    pub entry_fee: u64,         // 8
    pub max_players: u8,        // 1
    pub round_duration: i64,    // 8
    pub is_private: bool,       // 1
    pub status: RoomStatus,     // 1
    pub current_round: u16,     // 2
    pub round_end_time: i64,    // 8
    pub total_prize: u64,       // 8
    pub last_price: i64,        // 8
    pub winner: Option<Pubkey>, // 1 + 32
    pub players: Vec<Pubkey>,   // 4 + 32*N
    pub bump: u8,               // 1
    pub active_players: u8,     // 1
}
impl Room {
    // With max 10 players: 32+8+1+8+1+1+2+8+8+8+33+(4+320)+1+1 = 436
    pub const MAX_SIZE: usize = 32 + 8 + 1 + 8 + 1 + 1 + 2 + 8 + 8 + 8 + 33 + (4 + 32 * 10) + 1 + 1;
}

#[account]
pub struct PlayerData {
    pub authority: Pubkey,                               // 32
    pub room: Pubkey,                                    // 32
    pub lives: u8,                                       // 1
    pub eliminated: bool,                                // 1
    pub current_prediction: Option<PredictionDirection>,  // 1 + 1
    pub prediction_round: u16,                           // 2
    pub elimination_round: Option<u16>,                  // 1 + 2
    pub bump: u8,                                        // 1
}
impl PlayerData {
    pub const LEN: usize = 32 + 32 + 1 + 1 + 2 + 2 + 3 + 1;
}

// ═════════════════════════════════════════════════════════════════════════════
// Enums
// ═════════════════════════════════════════════════════════════════════════════

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum PredictionDirection {
    Up,
    Down,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum RoomStatus {
    Open,
    InProgress,
    Resolved,
}

// ═════════════════════════════════════════════════════════════════════════════
// Error Codes
// ═════════════════════════════════════════════════════════════════════════════

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid entry fee amount")]
    InvalidAmount,
    #[msg("Max players must be between 2 and 10")]
    InvalidMaxPlayers,
    #[msg("Round duration must be between 30 and 600 seconds")]
    InvalidRoundDuration,
    #[msg("Room is not open for joining")]
    RoomNotOpen,
    #[msg("Room is full")]
    RoomFull,
    #[msg("Player already joined this room")]
    AlreadyJoined,
    #[msg("Game is not in progress")]
    GameNotInProgress,
    #[msg("Player has been eliminated")]
    PlayerEliminated,
    #[msg("Already submitted prediction for this round")]
    AlreadyPredicted,
    #[msg("Round has expired, cannot predict")]
    RoundExpired,
    #[msg("Round has not ended yet")]
    RoundNotEnded,
    #[msg("Invalid Pyth price feed account")]
    InvalidPriceFeed,
    #[msg("Price data is stale")]
    StalePriceData,
    #[msg("Price confidence interval too wide")]
    PriceConfidenceTooWide,
    #[msg("Not enough players to start")]
    NotEnoughPlayers,
    #[msg("Invalid room state for this operation")]
    InvalidRoomState,
    #[msg("Game has not been resolved yet")]
    GameNotResolved,
    #[msg("Only the winner can claim the prize")]
    NotWinner,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Invalid player account")]
    InvalidPlayerAccount,
    #[msg("Serialization error")]
    SerializationError,
}

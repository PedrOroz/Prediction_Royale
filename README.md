# Prediction Royale

A survival prediction game on Solana where players compete by predicting the direction of SOL/USD price movements.

## Overview

Players join rooms, predict whether the price will go up or down each round, and lose lives when wrong. Last survivor claims the prize pool.

## Tech Stack

**Frontend:** Next.js 14, React 18, Tailwind CSS, TypeScript
**Backend:** Solana (Anchor framework), Rust, Pyth Oracle
**Wallet:** Solana Wallet Adapter (Phantom, Solflare)

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Lobby - create/join rooms
│   ├── room/[id]/page.tsx # Game room with predictions
│   ├── layout.tsx         # Root layout with wallet providers
│   └── globals.css        # Global styles + Tailwind
├── programs/              # Anchor Solana programs
│   └── prediction_royale/
│       ├── src/lib.rs     # Main program logic
│       └── Cargo.toml     # Rust dependencies
├── src/
│   ├── components/       # UI components (PriceChart, LivesIndicator, etc.)
│   ├── hooks/            # Custom React hooks (useAnchorProgram, usePythPrice, etc.)
│   ├── types/            # TypeScript types matching IDL
│   └── providers.tsx      # Solana/Anchor wallet providers
├── tests/                 # Anchor integration tests
├── Anchor.toml           # Anchor workspace config
└── Cargo.toml            # Rust workspace config
```

## Smart Contract

- **Program ID:** `5JPjbA41yGiPKSFet9rW4C3zxKss8SEZBEknDG2NJi8D`
- **Network:** Solana Devnet
- **Pyth Feed:** SOL/USD on Devnet

### Instructions

| Instruction | Description |
|-------------|-------------|
| `initialize` | Initialize global config (authority only) |
| `createRoom` | Create a new game room with entry fee and settings |
| `joinRoom` | Join an existing room and pay entry fee |
| `predict` | Submit UP/DOWN prediction for current round |
| `resolveRound` | Resolve round (creator/keeper only), evaluates all predictions |
| `claimPrize` | Winner claims the prize pool |

### Game Flow

1. Creator creates room with entry fee, max players, round duration
2. Players join and pay entry fee
3. When enough players joined, creator calls `resolveRound` to start
4. Pyth price is recorded as baseline
5. Each round: players predict, creator resolves after time expires
6. Wrong predictions lose a life
7. Last survivor wins the prize pool

## Setup

### Prerequisites

- Node.js 18+
- Rust 1.89+
- Solana CLI
- Anchor CLI

### Installation

```bash
# Install dependencies
npm install

# Build the Anchor program
anchor build

# Deploy to devnet (requires keypair)
anchor deploy --provider.cluster devnet --program-name prediction_royale --program-keypair target/deploy/six_seven-keypair.json
```

### Configuration

Create `.env.local`:

```env
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=5JPjbA41yGiPKSFet9rW4C3zxKss8SEZBEknDG2NJi8D
NEXT_PUBLIC_PYTH_FEED=J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix
NEXT_PUBLIC_NETWORK=devnet
```

### Running

```bash
# Development server
npm run dev

# Run tests
anchor test

# Run frontend tests
npm test
```

## Keypair

The program is deployed with the keypair at `target/deploy/six_seven-keypair.json`.

## Security

- Price data validated via Pyth Oracle with staleness checks
- Confidence interval validation (>5% rejected)
- Creator-only access for resolve_round
- Winner-only access for claim_prize
- CPI transfers use Anchor system_program wrapper

## License

MIT

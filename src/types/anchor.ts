import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

export type PredictionDirection = { up: Record<string, never> } | { down: Record<string, never> };

export type RoomStatus = "open" | "inProgress" | "resolved";

export interface Room {
  creator: PublicKey;
  entryFee: BN;
  maxPlayers: number;
  roundDuration: BN;
  isPrivate: boolean;
  status: RoomStatus;
  currentRound: number;
  roundEndTime: BN;
  totalPrize: BN;
  lastPrice: BN;
  winner: PublicKey | null;
  players: PublicKey[];
}

export interface PlayerData {
  authority: PublicKey;
  room: PublicKey;
  lives: number;
  eliminated: boolean;
  currentPrediction: PredictionDirection | null;
  predictionRound: number;
  eliminationRound: number | null;
}

export interface PredictionRoyale {
  programId: PublicKey;
  account: {
    room: {
      fetch(address: PublicKey): Promise<Room>;
      fetchMultiple(addresses: PublicKey[]): Promise<(Room | null)[]>;
      all(): Promise<{ publicKey: PublicKey; account: Room }[]>;
    };
    playerData: {
      fetch(address: PublicKey): Promise<PlayerData>;
    };
  };
  coder: {
    accounts: {
      decode<T = unknown>(typeName: string, data: Buffer): T;
    };
  };
  methods: {
    createRoom(
      entryFee: BN,
      maxPlayers: number,
      roundDuration: BN,
      isPrivate: boolean
    ): {
      accounts(args: {
        creator: PublicKey;
        room: PublicKey;
        systemProgram?: PublicKey;
      }): {
        rpc(): Promise<string>;
      };
    };
    joinRoom(): {
      accounts(args: {
        player: PublicKey;
        room: PublicKey;
        playerData: PublicKey;
        systemProgram?: PublicKey;
      }): {
        rpc(): Promise<string>;
      };
    };
    predict(direction: PredictionDirection): {
      accounts(args: {
        player: PublicKey;
        room: PublicKey;
        playerData: PublicKey;
      }): {
        rpc(): Promise<string>;
      };
    };
    resolveRound(price: BN): {
      accounts(args: {
        keeper: PublicKey;
        room: PublicKey;
        pythPriceUpdate: PublicKey;
      }): {
        rpc(): Promise<string>;
      };
    };
    claimPrize(): {
      accounts(args: {
        winner: PublicKey;
        room: PublicKey;
        playerData: PublicKey;
      }): {
        rpc(): Promise<string>;
      };
    };
  };
}

export function truncateAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function getPlayerDataPda(
  programId: PublicKey,
  room: PublicKey,
  player: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("player"), room.toBuffer(), player.toBuffer()],
    programId
  );
}

export function getRoomPda(
  programId: PublicKey,
  creator: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("room"), creator.toBuffer()],
    programId
  );
}

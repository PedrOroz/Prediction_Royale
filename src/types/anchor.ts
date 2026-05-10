import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

// ── Program constants ────────────────────────────────────────────────────────
export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ||
    "5JPjbA41yGiPKSFet9rW4C3zxKss8SEZBEknDG2NJi8D"
);

export const PYTH_SOL_USD_FEED = new PublicKey(
  process.env.NEXT_PUBLIC_PYTH_FEED ||
    "J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix"
);

// ── Types matching the IDL ───────────────────────────────────────────────────
export type PredictionDirection =
  | { up: Record<string, never> }
  | { down: Record<string, never> };

export type RoomStatus =
  | { open: Record<string, never> }
  | { inProgress: Record<string, never> }
  | { resolved: Record<string, never> };

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
  bump: number;
  activePlayers: number;
}

export interface PlayerData {
  authority: PublicKey;
  room: PublicKey;
  lives: number;
  eliminated: boolean;
  currentPrediction: PredictionDirection | null;
  predictionRound: number;
  eliminationRound: number | null;
  bump: number;
}

// ── PDA helpers ──────────────────────────────────────────────────────────────
export function getConfigPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    PROGRAM_ID
  );
}

export function getRoomPda(creator: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("room"), creator.toBuffer()],
    PROGRAM_ID
  );
}

export function getPlayerDataPda(
  room: PublicKey,
  player: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("player"), room.toBuffer(), player.toBuffer()],
    PROGRAM_ID
  );
}

// ── Status helpers ───────────────────────────────────────────────────────────
export function getRoomStatusKey(status: RoomStatus): string {
  if ("open" in status) return "open";
  if ("inProgress" in status) return "inProgress";
  return "resolved";
}

export function truncateAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

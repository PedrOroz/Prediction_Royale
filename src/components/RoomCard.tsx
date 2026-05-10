"use client";

import { Room, getRoomStatusKey, truncateAddress } from "@/types/anchor";
import { PublicKey } from "@solana/web3.js";

interface Props {
  room: Room;
  roomPda: PublicKey;
  onJoin: (roomPda: PublicKey) => void;
  isLoading?: boolean;
}

function formatPrize(lamports: number): string {
  return (lamports / 1e9).toFixed(3);
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "open":
      return "ABIERTA";
    case "inProgress":
      return "EN CURSO";
    case "resolved":
      return "FINALIZADA";
    default:
      return status.toUpperCase();
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case "open":
      return "text-canary-yellow-500";
    case "inProgress":
      return "text-yale-blue-500";
    case "resolved":
      return "text-iron-grey-600";
    default:
      return "text-iron-grey-600";
  }
}

export default function RoomCard({ room, roomPda, onJoin, isLoading }: Props) {
  const statusKey = getRoomStatusKey(room.status);
  const entryFeeSol = formatPrize(Number(room.entryFee));
  const totalPrizeSol = formatPrize(Number(room.totalPrize));

  return (
    <div className="bg-iron-grey-800 border border-ash-grey-700 rounded-lg p-5 flex flex-col gap-3 hover:border-yale-blue-500/50 transition-colors">
      <div className="flex justify-between items-start">
        <span
          className={`font-mono text-xs uppercase tracking-wider ${getStatusColor(statusKey)}`}
        >
          {getStatusLabel(statusKey)}
        </span>
        <span className="font-mono text-xs text-iron-grey-600">
          {truncateAddress(roomPda.toBase58())}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm font-mono">
        <div>
          <p className="text-iron-grey-600 text-xs">ENTRY FEE</p>
          <p className="text-white">{entryFeeSol} SOL</p>
        </div>
        <div>
          <p className="text-iron-grey-600 text-xs">PRIZE POOL</p>
          <p className="text-canary-yellow-500">{totalPrizeSol} SOL</p>
        </div>
        <div>
          <p className="text-iron-grey-600 text-xs">PLAYERS</p>
          <p className="text-white">
            {room.activePlayers}/{room.maxPlayers}
          </p>
        </div>
        <div>
          <p className="text-iron-grey-600 text-xs">ROUND</p>
          <p className="text-white">{room.currentRound}</p>
        </div>
      </div>

      <button
        onClick={() => onJoin(roomPda)}
        disabled={isLoading || statusKey !== "open"}
        className="w-full font-mono text-sm py-3 px-4 rounded-lg border border-yale-blue-500 text-yale-blue-500 hover:bg-yale-blue-500 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-yale-blue-500"
      >
        {isLoading ? "CONFIRMANDO..." : "UNIRSE"}
      </button>
    </div>
  );
}

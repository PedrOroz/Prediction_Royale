"use client";

import { useState } from "react";
import RoomCard from "./RoomCard";
import { Room } from "@/types/anchor";
import { PublicKey } from "@solana/web3.js";

interface RoomEntry {
  pda: PublicKey;
  data: Room;
}

interface Props {
  rooms: RoomEntry[];
  onJoin: (roomPda: PublicKey) => void;
  isLoading: boolean;
  joiningRoom: string | null;
}

export default function RoomGrid({
  rooms,
  onJoin,
  isLoading,
  joiningRoom,
}: Props) {
  const [filter, setFilter] = useState<"public" | "private">("public");
  const [privateCode, setPrivateCode] = useState("");

  const filteredRooms = rooms.filter((r) => {
    if (filter === "public") return !r.data.isPrivate;
    return r.data.isPrivate;
  });

  return (
    <div className="w-full">
      <div className="flex items-center gap-4 mb-6 font-mono text-sm">
        <button
          onClick={() => setFilter("public")}
          className={`px-4 py-2 rounded-lg border transition-colors ${
            filter === "public"
              ? "border-yale-blue-500 text-yale-blue-500 bg-yale-blue-500/10"
              : "border-iron-grey-700 text-iron-grey-600 hover:text-white"
          }`}
        >
          SALAS PÚBLICAS
        </button>
        <button
          onClick={() => setFilter("private")}
          className={`px-4 py-2 rounded-lg border transition-colors ${
            filter === "private"
              ? "border-yale-blue-500 text-yale-blue-500 bg-yale-blue-500/10"
              : "border-iron-grey-700 text-iron-grey-600 hover:text-white"
          }`}
        >
          SALAS PRIVADAS
        </button>
        {filter === "private" && (
          <input
            type="text"
            value={privateCode}
            onChange={(e) => setPrivateCode(e.target.value)}
            placeholder="Código de sala..."
            className="bg-iron-grey-900 border border-ash-grey-700 rounded-lg px-4 py-2 text-white font-mono text-sm flex-1 focus:outline-none focus:border-yale-blue-500"
          />
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-iron-grey-800 border border-ash-grey-700 rounded-lg p-5 animate-pulse h-48"
            >
              <div className="h-4 bg-iron-grey-700 rounded w-1/3 mb-4" />
              <div className="h-3 bg-iron-grey-700 rounded w-1/2 mb-2" />
              <div className="h-3 bg-iron-grey-700 rounded w-2/3 mb-2" />
              <div className="h-3 bg-iron-grey-700 rounded w-1/2 mb-4" />
              <div className="h-10 bg-iron-grey-700 rounded mt-auto" />
            </div>
          ))}
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-iron-grey-600 font-mono text-lg">
            {filter === "public"
              ? "NO HAY SALAS PÚBLICAS ACTIVAS"
              : "INGRESA UN CÓDIGO DE SALA PRIVADA"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRooms.map((room) => (
            <RoomCard
              key={room.pda.toBase58()}
              room={room.data}
              roomPda={room.pda}
              onJoin={onJoin}
              isLoading={joiningRoom === room.pda.toBase58()}
            />
          ))}
        </div>
      )}
    </div>
  );
}

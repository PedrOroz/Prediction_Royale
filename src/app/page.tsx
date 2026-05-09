"use client";

import { useState, useEffect, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAnchorProgram } from "@/hooks/useAnchorProgram";
import { useGameActions } from "@/hooks/useGameActions";
import WalletConnectModal from "@/components/WalletConnectModal";
import RoomGrid from "@/components/RoomGrid";
import { Room } from "@/types/anchor";

export default function LobbyPage() {
  const { connected, publicKey } = useWallet();
  const { program } = useAnchorProgram();
  const { joinRoom, txError } = useGameActions(null);

  const [showWalletModal, setShowWalletModal] = useState(!connected);
  const [rooms, setRooms] = useState<
    { pda: PublicKey; data: Room }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [joiningRoom, setJoiningRoom] = useState<string | null>(null);

  useEffect(() => {
    if (!connected) {
      setShowWalletModal(true);
    } else {
      setShowWalletModal(false);
    }
  }, [connected]);

  useEffect(() => {
    if (!program) return;
    setLoading(true);

    const fetchRooms = async () => {
      try {
        const rooms = await program.account.room.all();
        setRooms(
          rooms.map((r: { publicKey: PublicKey; account: Room }) => ({
            pda: r.publicKey,
            data: r.account as unknown as Room,
          }))
        );
      } catch {
        // no rooms yet
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [program]);

  const handleJoin = useCallback(
    async (roomPda: PublicKey) => {
      setJoiningRoom(roomPda.toBase58());
      try {
        await joinRoom();
      } finally {
        setJoiningRoom(null);
      }
    },
    [joinRoom]
  );

  return (
    <div className="min-h-screen bg-iron-grey-900">
      <header className="border-b border-ash-grey-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="font-mono text-canary-yellow-500 text-2xl font-bold tracking-wider">
            SURVIVAL TERMINAL
          </h1>
          <div className="flex items-center gap-4">
            {publicKey && (
              <span className="font-mono text-xs text-iron-grey-600">
                {publicKey.toBase58().slice(0, 4)}...
                {publicKey.toBase58().slice(-4)}
              </span>
            )}
            <div className="w-3 h-3 rounded-full bg-canary-yellow-500 animate-glow-pulse" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <RoomGrid
          rooms={rooms}
          onJoin={handleJoin}
          isLoading={loading}
          joiningRoom={joiningRoom}
        />
      </main>

      {txError && (
        <div className="fixed bottom-6 right-6 bg-iron-grey-800 border border-tiger-orange-600 rounded-lg p-4 max-w-md z-40">
          <p className="text-tiger-orange-400 font-mono text-sm">{txError}</p>
        </div>
      )}

      <WalletConnectModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
      />
    </div>
  );
}

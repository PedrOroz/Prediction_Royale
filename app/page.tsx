"use client";

import { useState, useEffect, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { useAnchorProgram } from "@/hooks/useAnchorProgram";
import { useGameActions } from "@/hooks/useGameActions";
import WalletConnectModal from "@/components/WalletConnectModal";
import RoomGrid from "@/components/RoomGrid";
import { Room, getPlayerDataPda } from "@/types/anchor";

export default function LobbyPage() {
  const { connected, publicKey } = useWallet();
  const { program } = useAnchorProgram();
  const router = useRouter();

  const { createRoom, createStatus, txError, resetTx } = useGameActions(null);

  const [showWalletModal, setShowWalletModal] = useState(!connected);
  const [rooms, setRooms] = useState<{ pda: PublicKey; data: Room }[]>([]);
  const [loading, setLoading] = useState(false);
  const [joiningRoom, setJoiningRoom] = useState<string | null>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [entryFee, setEntryFee] = useState("0.01");
  const [maxPlayers, setMaxPlayers] = useState("4");
  const [roundDuration, setRoundDuration] = useState("60");

  useEffect(() => {
    if (!connected) {
      setShowWalletModal(true);
    } else {
      setShowWalletModal(false);
    }
  }, [connected]);

  const fetchRooms = useCallback(async () => {
    if (!program) return;
    setLoading(true);
    try {
      const allRooms = await program.account.room.all();
      setRooms(
        allRooms.map((r: { publicKey: PublicKey; account: unknown }) => ({
          pda: r.publicKey,
          data: r.account as unknown as Room,
        }))
      );
    } catch {
      // no rooms yet
    } finally {
      setLoading(false);
    }
  }, [program]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleJoin = useCallback(
    async (roomPda: PublicKey) => {
      if (!program || !publicKey) return;
      setJoiningRoom(roomPda.toBase58());
      try {
        const [playerDataPda] = getPlayerDataPda(roomPda, publicKey);
        await program.methods
          .joinRoom()
          .accounts({
            player: publicKey,
            room: roomPda,
            playerData: playerDataPda,
          } as any)
          .rpc();
        router.push(`/room/${roomPda.toBase58()}`);
      } catch (e) {
        console.error("Join error:", e);
      } finally {
        setJoiningRoom(null);
      }
    },
    [program, publicKey, router]
  );

  const handleCreateRoom = useCallback(async () => {
    if (!publicKey) return;
    const fee = parseFloat(entryFee);
    const players = parseInt(maxPlayers);
    const duration = parseInt(roundDuration);
    if (isNaN(fee) || isNaN(players) || isNaN(duration)) return;

    const roomPda = await createRoom(fee, players, duration, false);
    if (roomPda) {
      setShowCreateForm(false);
      await handleJoin(roomPda);
      await fetchRooms();
    }
  }, [createRoom, entryFee, maxPlayers, roundDuration, publicKey, handleJoin, fetchRooms]);

  return (
    <div className="min-h-screen bg-iron-grey-900">
      <header className="border-b border-ash-grey-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="font-mono text-canary-yellow-500 text-2xl font-bold tracking-wider">
            PREDICTION ROYALE
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
        {connected && !showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="mb-6 font-mono text-sm py-3 px-6 rounded-lg border-2 border-canary-yellow-500 text-canary-yellow-500 hover:bg-canary-yellow-500 hover:text-iron-grey-900 transition-all font-bold"
          >
            + CREAR SALA
          </button>
        )}

        {showCreateForm && (
          <div className="mb-8 bg-iron-grey-800 border border-ash-grey-700 rounded-lg p-6 max-w-md">
            <h2 className="font-mono text-canary-yellow-500 text-lg mb-4 font-bold">
              NUEVA SALA
            </h2>
            <div className="space-y-4">
              <div>
                <label className="font-mono text-xs text-iron-grey-600 block mb-1">
                  ENTRY FEE (SOL)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={entryFee}
                  onChange={(e) => setEntryFee(e.target.value)}
                  className="w-full bg-iron-grey-900 border border-ash-grey-700 rounded-lg px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-yale-blue-500"
                />
              </div>
              <div>
                <label className="font-mono text-xs text-iron-grey-600 block mb-1">
                  MAX JUGADORES (2-10)
                </label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(e.target.value)}
                  className="w-full bg-iron-grey-900 border border-ash-grey-700 rounded-lg px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-yale-blue-500"
                />
              </div>
              <div>
                <label className="font-mono text-xs text-iron-grey-600 block mb-1">
                  DURACIÓN RONDA (segundos)
                </label>
                <input
                  type="number"
                  min="30"
                  max="600"
                  value={roundDuration}
                  onChange={(e) => setRoundDuration(e.target.value)}
                  className="w-full bg-iron-grey-900 border border-ash-grey-700 rounded-lg px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-yale-blue-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCreateRoom}
                  disabled={createStatus === "confirming"}
                  className="flex-1 font-mono text-sm py-3 px-4 rounded-lg bg-canary-yellow-500 text-iron-grey-900 font-bold hover:bg-canary-yellow-600 transition-all disabled:opacity-50"
                >
                  {createStatus === "confirming" ? "CREANDO..." : "CREAR"}
                </button>
                <button
                  onClick={() => { setShowCreateForm(false); resetTx(); }}
                  className="font-mono text-sm py-3 px-4 rounded-lg border border-iron-grey-700 text-iron-grey-600 hover:text-white transition-all"
                >
                  CANCELAR
                </button>
              </div>
            </div>
          </div>
        )}

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

"use client";

import { useEffect, useCallback, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import { useAnchorProgram } from "./useAnchorProgram";
import { Room, PlayerData, getPlayerDataPda, getRoomStatusKey } from "@/types/anchor";
import { useWallet } from "@solana/wallet-adapter-react";

export function useRoomSubscription(roomPda: PublicKey | null) {
  const [room, setRoom] = useState<Room | null>(null);
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { connection } = useConnection();
  const { program } = useAnchorProgram();
  const { publicKey } = useWallet();

  // Fetch room data
  const fetchRoom = useCallback(async () => {
    if (!roomPda || !program) return;
    try {
      const r = await program.account.room.fetch(roomPda);
      setRoom(r as unknown as Room);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [roomPda, program]);

  // Fetch player data
  const fetchPlayerData = useCallback(async () => {
    if (!roomPda || !program || !publicKey) return;
    try {
      const [playerDataPda] = getPlayerDataPda(roomPda, publicKey);
      const pd = await program.account.playerData.fetch(playerDataPda);
      setPlayerData(pd as unknown as PlayerData);
    } catch {
      // Player hasn't joined yet — that's ok
      setPlayerData(null);
    }
  }, [roomPda, program, publicKey]);

  // Initial fetch
  useEffect(() => {
    fetchRoom();
    fetchPlayerData();
  }, [fetchRoom, fetchPlayerData]);

  // Subscribe to room changes
  useEffect(() => {
    if (!roomPda || !program) return;

    const subId = connection.onAccountChange(
      roomPda,
      (accountInfo) => {
        try {
          const decoded = program.coder.accounts.decode("room", accountInfo.data);
          setRoom(decoded as unknown as Room);
          setError(null);
        } catch (e) {
          setError((e as Error).message);
        }
      },
      "confirmed"
    );

    return () => {
      connection.removeAccountChangeListener(subId);
    };
  }, [roomPda, connection, program]);

  // Subscribe to player data changes
  useEffect(() => {
    if (!roomPda || !program || !publicKey) return;
    const [playerDataPda] = getPlayerDataPda(roomPda, publicKey);

    const subId = connection.onAccountChange(
      playerDataPda,
      (accountInfo) => {
        try {
          const decoded = program.coder.accounts.decode("playerData", accountInfo.data);
          setPlayerData(decoded as unknown as PlayerData);
        } catch {
          setPlayerData(null);
        }
      },
      "confirmed"
    );

    return () => {
      connection.removeAccountChangeListener(subId);
    };
  }, [roomPda, connection, program, publicKey]);

  const statusKey = room ? getRoomStatusKey(room.status) : null;

  return { room, playerData, error, statusKey, refetch: fetchRoom };
}

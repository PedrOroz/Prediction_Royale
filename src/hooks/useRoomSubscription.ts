"use client";

import { useEffect, useCallback, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import { useAnchorProgram } from "./useAnchorProgram";
import { Room, PlayerData } from "@/types/anchor";

export function useRoomSubscription(roomPda: PublicKey | null): {
  room: Room | null;
  playerData: PlayerData | null;
  error: string | null;
} {
  const [room, setRoom] = useState<Room | null>(null);
  const [playerData] = useState<PlayerData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { connection } = useConnection();
  const { program } = useAnchorProgram();

  const handleRoomChange = useCallback(
    (data: Buffer) => {
      if (!program) return;
      try {
        const decoded = program.coder.accounts.decode("Room", data);
        setRoom(decoded as unknown as Room);
        setError(null);
      } catch (e) {
        setError((e as Error).message);
      }
    },
    [program]
  );

  useEffect(() => {
    if (!roomPda || !program) return;

    program.account.room
      .fetch(roomPda)
      .then((r: Room) => setRoom(r))
      .catch((e: Error) => setError(e.message));

    const subId = connection.onAccountChange(
      roomPda,
      (accountInfo) => {
        handleRoomChange(accountInfo.data);
      },
      "confirmed"
    );

    return () => {
      connection.removeAccountChangeListener(subId);
    };
  }, [roomPda, connection, program, handleRoomChange]);

  return { room, playerData, error };
}

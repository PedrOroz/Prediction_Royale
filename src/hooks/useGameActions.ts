"use client";

import { useState, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import { useAnchorProgram } from "./useAnchorProgram";
import {
  PredictionDirection,
  getPlayerDataPda,
} from "@/types/anchor";
import { useWallet } from "@solana/wallet-adapter-react";

type TxStatus = "idle" | "confirming" | "confirmed" | "error";

export function useGameActions(roomPda: PublicKey | null) {
  const { program } = useAnchorProgram();
  const { publicKey } = useWallet();
  const [joinStatus, setJoinStatus] = useState<TxStatus>("idle");
  const [predictStatus, setPredictStatus] = useState<TxStatus>("idle");
  const [claimStatus, setClaimStatus] = useState<TxStatus>("idle");
  const [txError, setTxError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  const joinRoom = useCallback(async () => {
    if (!program || !publicKey || !roomPda) return;
    setJoinStatus("confirming");
    setTxError(null);

    try {
      const [playerDataPda] = getPlayerDataPda(
        program.programId,
        roomPda,
        publicKey
      );

      const sig = await program.methods
        .joinRoom()
        .accounts({
          player: publicKey,
          room: roomPda,
          playerData: playerDataPda,
        })
        .rpc();

      setTxSignature(sig);
      setJoinStatus("confirmed");
    } catch (e) {
      setTxError((e as Error).message);
      setJoinStatus("error");
    }
  }, [program, publicKey, roomPda]);

  const predict = useCallback(
    async (direction: PredictionDirection) => {
      if (!program || !publicKey || !roomPda) return;
      setPredictStatus("confirming");
      setTxError(null);

      try {
        const [playerDataPda] = getPlayerDataPda(
          program.programId,
          roomPda,
          publicKey
        );

        const sig = await program.methods
          .predict(direction)
          .accounts({
            player: publicKey,
            room: roomPda,
            playerData: playerDataPda,
          })
          .rpc();

        setTxSignature(sig);
        setPredictStatus("confirmed");
      } catch (e) {
        setTxError((e as Error).message);
        setPredictStatus("error");
      }
    },
    [program, publicKey, roomPda]
  );

  const claimPrize = useCallback(async () => {
    if (!program || !publicKey || !roomPda) return;
    setClaimStatus("confirming");
    setTxError(null);

    try {
      const [playerDataPda] = getPlayerDataPda(
        program.programId,
        roomPda,
        publicKey
      );

      const sig = await program.methods
        .claimPrize()
        .accounts({
          winner: publicKey,
          room: roomPda,
          playerData: playerDataPda,
        })
        .rpc();

      setTxSignature(sig);
      setClaimStatus("confirmed");
    } catch (e) {
      setTxError((e as Error).message);
      setClaimStatus("error");
    }
  }, [program, publicKey, roomPda]);

  const resetTx = useCallback(() => {
    setJoinStatus("idle");
    setPredictStatus("idle");
    setClaimStatus("idle");
    setTxError(null);
    setTxSignature(null);
  }, []);

  return {
    joinRoom,
    predict,
    claimPrize,
    joinStatus,
    predictStatus,
    claimStatus,
    txError,
    txSignature,
    resetTx,
  };
}

"use client";

import { useState, useCallback } from "react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useAnchorProgram } from "./useAnchorProgram";
import {
  PredictionDirection,
  getPlayerDataPda,
  getRoomPda,
  PYTH_SOL_USD_FEED,
} from "@/types/anchor";

type TxStatus = "idle" | "confirming" | "confirmed" | "error";

export function useGameActions(roomPda: PublicKey | null) {
  const { program } = useAnchorProgram();
  const { publicKey } = useWallet();
  const { connection } = useConnection();

  const [createStatus, setCreateStatus] = useState<TxStatus>("idle");
  const [joinStatus, setJoinStatus] = useState<TxStatus>("idle");
  const [predictStatus, setPredictStatus] = useState<TxStatus>("idle");
  const [claimStatus, setClaimStatus] = useState<TxStatus>("idle");
  const [txError, setTxError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  const confirmTx = useCallback(
    async (sig: string) => {
      await connection.confirmTransaction(sig, "confirmed");
    },
    [connection]
  );

  // ── Create Room ──────────────────────────────────────────────────────────
  const createRoom = useCallback(
    async (
      entryFee: number,
      maxPlayers: number,
      roundDuration: number,
      isPrivate: boolean
    ) => {
      if (!program || !publicKey) return;
      setCreateStatus("confirming");
      setTxError(null);

      try {
        const [roomPdaAddr] = getRoomPda(publicKey);
        const entryFeeLamports = new BN(Math.floor(entryFee * 1e9));

        const sig = await program.methods
          .createRoom(entryFeeLamports, maxPlayers, new BN(roundDuration), isPrivate)
          .accounts({
            creator: publicKey,
            room: roomPdaAddr,
            systemProgram: SystemProgram.programId,
          } as any)
          .rpc();

        await confirmTx(sig);
        setTxSignature(sig);
        setCreateStatus("confirmed");
        return roomPdaAddr;
      } catch (e) {
        setTxError((e as Error).message);
        setCreateStatus("error");
        return null;
      }
    },
    [program, publicKey, confirmTx]
  );

  // ── Join Room ────────────────────────────────────────────────────────────
  const joinRoom = useCallback(async () => {
    if (!program || !publicKey || !roomPda) return;
    setJoinStatus("confirming");
    setTxError(null);

    try {
      const [playerDataPda] = getPlayerDataPda(roomPda, publicKey);

      const sig = await program.methods
        .joinRoom()
        .accounts({
          player: publicKey,
          room: roomPda,
          playerData: playerDataPda,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();

      await confirmTx(sig);
      setTxSignature(sig);
      setJoinStatus("confirmed");
    } catch (e) {
      setTxError((e as Error).message);
      setJoinStatus("error");
    }
  }, [program, publicKey, roomPda, confirmTx]);

  // ── Predict ──────────────────────────────────────────────────────────────
  const predict = useCallback(
    async (direction: PredictionDirection) => {
      if (!program || !publicKey || !roomPda) return;
      setPredictStatus("confirming");
      setTxError(null);

      try {
        const [playerDataPda] = getPlayerDataPda(roomPda, publicKey);

        const sig = await program.methods
          .predict(direction)
          .accounts({
            player: publicKey,
            room: roomPda,
            playerData: playerDataPda,
          } as any)
          .rpc();

        await confirmTx(sig);
        setTxSignature(sig);
        setPredictStatus("confirmed");
      } catch (e) {
        setTxError((e as Error).message);
        setPredictStatus("error");
      }
    },
    [program, publicKey, roomPda, confirmTx]
  );

  // ── Resolve Round (keeper only) ──────────────────────────────────────────
  const resolveRound = useCallback(
    async (playerPdas: PublicKey[]) => {
      if (!program || !publicKey || !roomPda) return;
      setTxError(null);

      try {
        const remainingAccounts = playerPdas.map((pda) => ({
          pubkey: pda,
          isWritable: true,
          isSigner: false,
        }));

        const sig = await program.methods
          .resolveRound()
          .accounts({
            keeper: publicKey,
            room: roomPda,
            pythPriceUpdate: PYTH_SOL_USD_FEED,
          } as any)
          .remainingAccounts(remainingAccounts)
          .rpc();

        await confirmTx(sig);
        setTxSignature(sig);
      } catch (e) {
        setTxError((e as Error).message);
      }
    },
    [program, publicKey, roomPda, confirmTx]
  );

  // ── Claim Prize ──────────────────────────────────────────────────────────
  const claimPrize = useCallback(async () => {
    if (!program || !publicKey || !roomPda) return;
    setClaimStatus("confirming");
    setTxError(null);

    try {
      const [playerDataPda] = getPlayerDataPda(roomPda, publicKey);

      const sig = await program.methods
        .claimPrize()
        .accounts({
          winner: publicKey,
          room: roomPda,
          playerData: playerDataPda,
        } as any)
        .rpc();

      await confirmTx(sig);
      setTxSignature(sig);
      setClaimStatus("confirmed");
    } catch (e) {
      setTxError((e as Error).message);
      setClaimStatus("error");
    }
  }, [program, publicKey, roomPda, confirmTx]);

  // ── Reset ────────────────────────────────────────────────────────────────
  const resetTx = useCallback(() => {
    setCreateStatus("idle");
    setJoinStatus("idle");
    setPredictStatus("idle");
    setClaimStatus("idle");
    setTxError(null);
    setTxSignature(null);
  }, []);

  return {
    createRoom,
    joinRoom,
    predict,
    resolveRound,
    claimPrize,
    createStatus,
    joinStatus,
    predictStatus,
    claimStatus,
    txError,
    txSignature,
    resetTx,
  };
}

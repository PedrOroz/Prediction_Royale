"use client";

import { useMemo } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import idl from "../../idl/prediction_royale.json";
import { PredictionRoyale } from "@/types/anchor";

export function useAnchorProgram(): {
  program: PredictionRoyale | null;
  error: string | null;
} {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();

  const result = useMemo(() => {
    if (!wallet) return { program: null, error: "Wallet not connected" };

    try {
      const provider = new AnchorProvider(connection, wallet, {
        commitment: "confirmed",
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const program = new Program(idl as any, provider) as unknown as PredictionRoyale;
      return { program, error: null };
    } catch (e) {
      return { program: null, error: (e as Error).message };
    }
  }, [connection, wallet]);

  return result;
}

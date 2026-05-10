"use client";

import { useMemo } from "react";
import { Program } from "@coral-xyz/anchor";
import { useAnchorProviderCtx } from "@/providers";
import { PredictionRoyale } from "@/types/prediction_royale";
import idl from "../../idl/prediction_royale.json";

export type PredictionRoyaleProgram = Program<PredictionRoyale>;

export function useAnchorProgram(): {
  program: PredictionRoyaleProgram | null;
  error: string | null;
} {
  const provider = useAnchorProviderCtx();

  const result = useMemo(() => {
    if (!provider) return { program: null, error: "Wallet not connected" };
    try {
      const program = new Program(idl as PredictionRoyale, provider) as unknown as PredictionRoyaleProgram;
      return { program, error: null };
    } catch (e) {
      return { program: null, error: (e as Error).message };
    }
  }, [provider]);

  return result;
}

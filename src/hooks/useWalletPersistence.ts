"use client";

import { useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";

export function useWalletPersistence() {
  const [storedWallet, setStoredWallet] = useLocalStorage<string | null>(
    "survival_wallet",
    null
  );

  return useMemo(
    () => ({ storedWallet, setStoredWallet }),
    [storedWallet, setStoredWallet]
  );
}

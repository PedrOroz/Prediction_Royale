"use client";

import { useMemo, createContext, useContext } from "react";
import {
  ConnectionProvider,
  WalletProvider,
  useConnection,
  useAnchorWallet,
} from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { AnchorProvider } from "@coral-xyz/anchor";

const NETWORK_URL =
  process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";

// ── Anchor Provider Context ──────────────────────────────────────────────────
const AnchorProviderContext = createContext<AnchorProvider | null>(null);

export function useAnchorProviderCtx(): AnchorProvider | null {
  return useContext(AnchorProviderContext);
}

function AnchorProviderInternal({ children }: { children: React.ReactNode }) {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();

  const provider = useMemo(() => {
    if (!wallet) return null;
    return new AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });
  }, [connection, wallet]);

  return (
    <AnchorProviderContext.Provider value={provider}>
      {children}
    </AnchorProviderContext.Provider>
  );
}

// ── Root Providers ───────────────────────────────────────────────────────────
export default function Providers({ children }: { children: React.ReactNode }) {
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider endpoint={NETWORK_URL}>
      <WalletProvider wallets={wallets} autoConnect>
        <AnchorProviderInternal>{children}</AnchorProviderInternal>
      </WalletProvider>
    </ConnectionProvider>
  );
}

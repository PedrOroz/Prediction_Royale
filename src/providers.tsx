"use client";

import { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { clusterApiUrl, Connection } from "@solana/web3.js";
import { AnchorProvider, setProvider } from "@coral-xyz/anchor";
import { useAnchorWallet } from "@solana/wallet-adapter-react";

const NETWORK = "devnet";

function AnchorProviderInternal({ children }: { children: React.ReactNode }) {
  const wallet = useAnchorWallet();
  const connection = useMemo(
    () => new Connection(clusterApiUrl(NETWORK)),
    []
  );

  useMemo(() => {
    if (!wallet) return null;
    const p = new AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });
    setProvider(p);
    return p;
  }, [connection, wallet]);

  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );
  const endpoint = useMemo(() => clusterApiUrl(NETWORK), []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <AnchorProviderInternal>{children}</AnchorProviderInternal>
      </WalletProvider>
    </ConnectionProvider>
  );
}

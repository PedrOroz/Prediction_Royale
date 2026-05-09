"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { useWalletPersistence } from "@/hooks/useWalletPersistence";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletConnectModal({ isOpen, onClose }: Props) {
  const { wallets, select, connect, connected, connecting } = useWallet();
  const { setStoredWallet } = useWalletPersistence();
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async (walletName: string) => {
    setError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      select(walletName as any);
      setStoredWallet(walletName);
      await connect();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  useEffect(() => {
    if (connected) onClose();
  }, [connected, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-iron-grey-800 border border-ash-grey-700 rounded-lg p-8 w-full max-w-md">
        <h2 className="text-xl font-mono text-canary-yellow-500 mb-6 text-center">
          CONNECT WALLET
        </h2>

        <div className="space-y-4">
          {wallets
            .filter((w) => w.readyState !== "Unsupported")
            .map((wallet) => (
              <button
                key={wallet.adapter.name}
                onClick={() => handleConnect(wallet.adapter.name)}
                disabled={connecting}
                className="w-full bg-iron-grey-900 border border-ash-grey-700 hover:border-yale-blue-500 text-white font-mono py-4 px-6 rounded-lg transition-colors flex items-center justify-between disabled:opacity-50"
              >
                <span>{wallet.adapter.name}</span>
                <span className="text-yale-blue-500 text-sm">
                  {connecting ? "CONNECTING..." : "CONNECT"}
                </span>
              </button>
            ))}
        </div>

        {error && (
          <p className="text-tiger-orange-600 font-mono text-sm mt-4 text-center">
            {error}
          </p>
        )}

        <button
          onClick={onClose}
          className="w-full mt-6 text-iron-grey-600 font-mono text-sm hover:text-white transition-colors"
        >
          CANCEL
        </button>
      </div>
    </div>
  );
}

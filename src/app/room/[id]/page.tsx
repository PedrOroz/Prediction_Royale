"use client";

import { use, useCallback, useMemo, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { usePythPrice } from "@/hooks/usePythPrice";
import { useRoomSubscription } from "@/hooks/useRoomSubscription";
import { useGameActions } from "@/hooks/useGameActions";
import { PredictionDirection } from "@/types/anchor";
import PriceChart from "@/components/PriceChart";
import PredictionButtons from "@/components/PredictionButtons";
import RoundCountdown from "@/components/RoundCountdown";
import LivesIndicator from "@/components/LivesIndicator";
import RoundResultOverlay from "@/components/RoundResultOverlay";
import ClaimPrizeButton from "@/components/ClaimPrizeButton";

interface Props {
  params: Promise<{ id: string }>;
}

function formatPrice(price: number | null): string {
  if (price === null) return "---";
  return `$${price.toFixed(2)}`;
}

export default function RoomPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { publicKey } = useWallet();
  const { price } = usePythPrice();

  const roomPda = useMemo(() => {
    try {
      return new PublicKey(id);
    } catch {
      return null;
    }
  }, [id]);

  const { room, playerData } = useRoomSubscription(roomPda);
  const { predict, claimPrize, predictStatus, claimStatus, txError } =
    useGameActions(roomPda);

  const [selectedDirection, setSelectedDirection] =
    useState<PredictionDirection | null>(null);
  const [roundResult] = useState<
    "safe" | "eliminated" | "won" | null
  >(null);
  const [showResult] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  const myPlayerData = useMemo(() => {
    return playerData;
  }, [playerData]);

  const lives = myPlayerData?.lives ?? 3;
  const isEliminated = myPlayerData?.eliminated ?? false;
  const isWinner =
    room?.winner !== null &&
    publicKey !== null &&
    room?.winner?.equals(publicKey);

  const handlePredict = useCallback(
    async (direction: PredictionDirection) => {
      setSelectedDirection(direction);
      await predict(direction);
    },
    [predict]
  );

  const handleRoundEnd = useCallback(() => {
    setIsResolving(true);
    setTimeout(() => {
      setIsResolving(false);
    }, 2000);
  }, []);

  const handleClaim = useCallback(async () => {
    await claimPrize();
  }, [claimPrize]);

  if (!roomPda) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-mono text-tiger-orange-400 text-xl">
          SALA NO VÁLIDA
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-iron-grey-900 flex flex-col">
      <header className="border-b border-ash-grey-700 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="font-mono text-sm text-iron-grey-600 hover:text-white transition-colors"
          >
            ← LOBBY
          </button>
          <h1 className="font-mono text-canary-yellow-500 text-lg font-bold tracking-wider">
            SURVIVAL TERMINAL
          </h1>
          <LivesIndicator lives={lives} />
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 max-w-7xl mx-auto w-full">
        <div className="flex-1 min-h-[400px] lg:min-h-0">
          <PriceChart currentPrice={price?.price ?? null} />
        </div>

        <div className="w-full lg:w-80 flex flex-col gap-4">
          <div className="bg-iron-grey-800 border border-ash-grey-700 rounded-lg p-5 text-center">
            <p className="text-iron-grey-600 font-mono text-xs mb-1">
              PRECIO SOL/USD
            </p>
            <p className="text-canary-yellow-500 font-mono text-3xl font-bold">
              {formatPrice(price?.price ?? null)}
            </p>
            {price && (
              <p className="text-iron-grey-600 font-mono text-xs mt-1">
                ±${(price.confidence / 1e8).toFixed(2)}
              </p>
            )}
          </div>

          <div className="bg-iron-grey-800 border border-ash-grey-700 rounded-lg p-5">
            <RoundCountdown
              endTime={room ? Number(room.roundEndTime) : 0}
              onRoundEnd={handleRoundEnd}
            />
          </div>

          <div className="bg-iron-grey-800 border border-ash-grey-700 rounded-lg p-5">
            <PredictionButtons
              onPredict={handlePredict}
              disabled={
                isEliminated ||
                predictStatus === "confirmed" ||
                isResolving
              }
              selected={selectedDirection}
              confirming={predictStatus === "confirming"}
            />
          </div>

          <div className="bg-iron-grey-800 border border-ash-grey-700 rounded-lg p-5">
            <div className="grid grid-cols-2 gap-3 font-mono text-sm">
              <div>
                <p className="text-iron-grey-600 text-xs">RONDA</p>
                <p className="text-white">{room?.currentRound ?? 0}</p>
              </div>
              <div>
                <p className="text-iron-grey-600 text-xs">JUGADORES</p>
                <p className="text-white">{room?.players.length ?? 0}</p>
              </div>
              <div>
                <p className="text-iron-grey-600 text-xs">PREMIOS</p>
                <p className="text-canary-yellow-500">
                  {room
                    ? (Number(room.totalPrize) / 1e9).toFixed(3)
                    : "0"}{" "}
                  SOL
                </p>
              </div>
              <div>
                <p className="text-iron-grey-600 text-xs">ESTADO</p>
                <p className="text-yale-blue-500">
                  {room?.status === "inProgress"
                    ? "EN JUEGO"
                    : room?.status === "open"
                      ? "ESPERANDO"
                      : "---"}
                </p>
              </div>
            </div>
          </div>

          <ClaimPrizeButton
            onClaim={handleClaim}
            isWinner={!!isWinner}
            confirming={claimStatus === "confirming"}
          />
        </div>
      </div>

      {isResolving && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
          <p className="text-yale-blue-500 font-mono text-2xl animate-pulse">
            Resolviendo ronda...
          </p>
        </div>
      )}

      <RoundResultOverlay
        result={roundResult}
        visible={showResult}
      />

      {txError && (
        <div className="fixed bottom-6 right-6 bg-iron-grey-800 border border-tiger-orange-600 rounded-lg p-4 max-w-md z-50">
          <p className="text-tiger-orange-400 font-mono text-sm">{txError}</p>
        </div>
      )}
    </div>
  );
}

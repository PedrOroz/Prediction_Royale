"use client";

interface Props {
  onClaim: () => void;
  isWinner: boolean;
  confirming: boolean;
}

export default function ClaimPrizeButton({
  onClaim,
  isWinner,
  confirming,
}: Props) {
  if (!isWinner) return null;

  return (
    <button
      onClick={onClaim}
      disabled={confirming}
      className="w-full font-mono text-lg py-5 px-6 rounded-lg border-2 border-tiger-orange-400 text-tiger-orange-400 bg-yale-blue-900 hover:bg-yale-blue-900/80 transition-all animate-pulse font-bold disabled:opacity-50"
    >
      {confirming ? "CONFIRMANDO..." : "⚡ CLAIM PRIZE"}
    </button>
  );
}

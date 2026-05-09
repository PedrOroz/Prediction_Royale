"use client";

import { PredictionDirection } from "@/types/anchor";

interface Props {
  onPredict: (direction: PredictionDirection) => void;
  disabled: boolean;
  selected: PredictionDirection | null;
  confirming: boolean;
}

export default function PredictionButtons({
  onPredict,
  disabled,
  selected,
  confirming,
}: Props) {
  const isUpSelected = selected && "up" in selected;
  const isDownSelected = selected && "down" in selected;

  return (
    <div className="flex flex-col gap-3 w-full">
      <button
        onClick={() => onPredict({ up: {} })}
        disabled={disabled || confirming}
        className={`w-full font-mono text-lg py-5 px-6 rounded-lg border-2 transition-all font-bold ${
          isUpSelected
            ? "bg-yale-blue-500/20 border-yale-blue-500 text-yale-blue-500"
            : "border-yale-blue-500/50 text-yale-blue-500/70 hover:border-yale-blue-500 hover:text-yale-blue-500 hover:bg-yale-blue-500/10"
        } disabled:opacity-30 disabled:cursor-not-allowed`}
      >
        {confirming && isUpSelected ? "CONFIRMANDO..." : "▲ SUBE"}
      </button>
      <button
        onClick={() => onPredict({ down: {} })}
        disabled={disabled || confirming}
        className={`w-full font-mono text-lg py-5 px-6 rounded-lg border-2 transition-all font-bold ${
          isDownSelected
            ? "bg-tiger-orange-600/20 border-tiger-orange-600 text-tiger-orange-400"
            : "border-tiger-orange-600/50 text-tiger-orange-600/70 hover:border-tiger-orange-600 hover:text-tiger-orange-400 hover:bg-tiger-orange-600/10"
        } disabled:opacity-30 disabled:cursor-not-allowed`}
      >
        {confirming && isDownSelected ? "CONFIRMANDO..." : "▼ BAJA"}
      </button>
    </div>
  );
}

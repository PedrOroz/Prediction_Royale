"use client";

interface Props {
  lives: number;
  maxLives?: number;
}

export default function LivesIndicator({
  lives,
  maxLives = 3,
}: Props) {
  return (
    <div className="flex items-center gap-3">
      {Array.from({ length: maxLives }).map((_, i) => {
        const active = i < lives;
        return (
          <div
            key={i}
            className={`w-5 h-5 rounded-full transition-all duration-500 ${
              active
                ? "bg-canary-yellow-500 animate-glow-pulse"
                : "bg-iron-grey-600"
            }`}
          />
        );
      })}
      <span className="font-mono text-sm text-iron-grey-600 ml-2">
        {lives}/{maxLives} VIDAS
      </span>
    </div>
  );
}

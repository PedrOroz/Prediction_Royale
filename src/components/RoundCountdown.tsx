"use client";

import { useEffect, useState } from "react";

interface Props {
  endTime: number;
  onRoundEnd: () => void;
}

export default function RoundCountdown({ endTime, onRoundEnd }: Props) {
  const [remaining, setRemaining] = useState<string>("00:00");

  useEffect(() => {
    const tick = () => {
      const now = Math.floor(Date.now() / 1000);
      const diff = Math.max(0, endTime - now);

      const mins = Math.floor(diff / 60)
        .toString()
        .padStart(2, "0");
      const secs = (diff % 60).toString().padStart(2, "0");
      setRemaining(`${mins}:${secs}`);

      if (diff <= 0) {
        onRoundEnd();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endTime, onRoundEnd]);

  return (
    <div className="text-center">
      <p className="text-iron-grey-600 font-mono text-xs mb-1">
        TIEMPO RESTANTE
      </p>
      <p className="text-canary-yellow-500 font-mono text-4xl font-bold tracking-wider">
        {remaining}
      </p>
    </div>
  );
}

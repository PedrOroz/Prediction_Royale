"use client";

import { useEffect, useState } from "react";

interface Props {
  result: "safe" | "eliminated" | "won" | null;
  visible: boolean;
}

export default function RoundResultOverlay({ result, visible }: Props) {
  const [flash, setFlash] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (!visible || !result) return;

    if (result === "safe") {
      setShowMessage(true);
      const timer = setTimeout(() => setShowMessage(false), 3000);
      return () => clearTimeout(timer);
    }

    if (result === "eliminated") {
      setFlash(true);
      const flashTimer = setTimeout(() => {
        setFlash(false);
        setShowMessage(true);
      }, 400);
      return () => clearTimeout(flashTimer);
    }

    if (result === "won") {
      setShowMessage(true);
      return;
    }
  }, [visible, result]);

  if (!visible) return null;

  return (
    <>
      {flash && (
        <div className="fixed inset-0 z-50 bg-tiger-orange-600 transition-opacity duration-400 opacity-80" />
      )}

      {showMessage && result === "safe" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-iron-grey-800 border border-green-500 rounded-2xl px-12 py-8">
            <p className="text-green-500 font-mono text-3xl font-bold">
              ✓ SAFE
            </p>
          </div>
        </div>
      )}

      {showMessage && result === "eliminated" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-iron-grey-800 border border-tiger-orange-600 rounded-2xl px-12 py-8 text-center">
            <p className="text-tiger-orange-400 font-mono text-3xl font-bold mb-2">
              ELIMINADO
            </p>
            <p className="text-iron-grey-600 font-mono text-sm">
              3 STRIKES — HAS SIDO ELIMINADO
            </p>
          </div>
        </div>
      )}
    </>
  );
}

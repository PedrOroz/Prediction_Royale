"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { PriceServiceConnection } from "@pythnetwork/price-service-client";

const PRICE_FEED_ID_SOL =
  "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";
const HERMES_URL = "https://hermes.pyth.network";

export interface PythPriceData {
  price: number;
  confidence: number;
  timestamp: number;
}

export function usePythPrice(): {
  price: PythPriceData | null;
} {
  const [price, setPrice] = useState<PythPriceData | null>(null);
  const connectionRef = useRef<PriceServiceConnection | null>(null);

  const updatePrice = useCallback(async () => {
    try {
      if (!connectionRef.current) return;
      const feeds = await connectionRef.current.getLatestPriceFeeds([
        PRICE_FEED_ID_SOL,
      ]);
      if (!feeds || feeds.length === 0) {
        return;
      }
      const feed = feeds[0];
      const p = feed.getPriceUnchecked();
      setPrice({
        price: p.getPriceAsNumberUnchecked(),
        confidence: Number(p.conf) * 10 ** p.expo,
        timestamp: p.publishTime,
      });
    } catch {
      // silent retry on next tick
    }
  }, []);

  useEffect(() => {
    const connection = new PriceServiceConnection(HERMES_URL);
    connectionRef.current = connection;

    updatePrice();
    const interval = setInterval(updatePrice, 1000);

    return () => {
      clearInterval(interval);
      connectionRef.current = null;
    };
  }, [updatePrice]);

  return { price };
}

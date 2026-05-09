"use client";

import { useEffect, useRef } from "react";
import { createChart, IChartApi, ISeriesApi, LineData, Time } from "lightweight-charts";

interface Props {
  currentPrice: number | null;
}

export default function PriceChart({ currentPrice }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: "#161b1d" },
        textColor: "#5a6b72",
      },
      grid: {
        vertLines: { color: "#2d3639" },
        horzLines: { color: "#2d3639" },
      },
      crosshair: {
        vertLine: { color: "#5a6b72", style: 2, width: 1 },
        horzLine: { color: "#5a6b72", style: 2, width: 1 },
      },
      timeScale: {
        borderColor: "#3c5d53",
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: "#3c5d53",
      },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });

    const series = chart.addLineSeries({
      color: "#3696c9",
      lineWidth: 2,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
      priceFormat: {
        type: "price",
        precision: 2,
        minMove: 0.01,
      },
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (seriesRef.current && currentPrice !== null) {
      const time = Math.floor(Date.now() / 1000) as Time;
      seriesRef.current.update({
        time,
        value: currentPrice,
      } as LineData);
    }
  }, [currentPrice]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-lg overflow-hidden"
    />
  );
}

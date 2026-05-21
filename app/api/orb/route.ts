import { NextResponse } from "next/server";
import { serverGetCandles } from "@/lib/server-data";
import type { Candle } from "@/lib/ict-analysis";

export type ORBWindow = 5 | 15 | 30;

export interface ORBData {
  valid: boolean;
  symbol: string;
  window: ORBWindow;
  orbHigh: number;
  orbLow: number;
  orbRange: number;
  orbMidpoint: number;
  breakoutDirection: "long" | "short" | "none";
  breakoutPrice: number | null;
  breakoutStrength: "strong" | "moderate" | "weak" | "none";
  retestConfirmed: boolean;
  retestLevel: number | null;
  currentPrice: number;
  priceVsORB: "above" | "below" | "inside";
  breakoutVolRatio: number | null;
  avgVolume: number | null;
  candlesAnalyzed: number;
  marketOpen: boolean;
  message: string;
}

// Returns the Unix timestamp of today's market open (9:30 ET)
function todayMarketOpenTs(): number {
  const now = new Date();
  const m = now.getUTCMonth(); // 0-indexed
  // EDT = UTC-4 (March–October), EST = UTC-5 (Nov–Feb)
  const isEDT = m >= 2 && m <= 9;
  const openHourUTC = isEDT ? 13 : 14;
  return Math.floor(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), openHourUTC, 30, 0) / 1000
  );
}

function isMarketOpen(): boolean {
  const now = new Date();
  const utcH = now.getUTCHours();
  const utcM = now.getUTCMinutes();
  const utcDecimal = utcH + utcM / 60;
  const m = now.getUTCMonth();
  const isEDT = m >= 2 && m <= 9;
  const openUTC = isEDT ? 13.5 : 14.5; // 9:30 ET
  const closeUTC = isEDT ? 20.0 : 21.0; // 4:00 PM ET
  const dow = now.getUTCDay();
  return dow >= 1 && dow <= 5 && utcDecimal >= openUTC && utcDecimal < closeUTC;
}

function breakoutStrengthLabel(volRatio: number | null): ORBData["breakoutStrength"] {
  if (volRatio == null) return "weak";
  if (volRatio >= 2.0) return "strong";
  if (volRatio >= 1.3) return "moderate";
  return "weak";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get("symbol") ?? "SPY").trim().toUpperCase().slice(0, 8);
  const rawWindow = parseInt(searchParams.get("window") ?? "15", 10);
  const window: ORBWindow = ([5, 15, 30] as number[]).includes(rawWindow)
    ? (rawWindow as ORBWindow)
    : 15;

  const marketOpen = isMarketOpen();
  const openTs = todayMarketOpenTs();
  const nowTs = Math.floor(Date.now() / 1000);

  // If market hasn't opened yet today or it's the weekend, fetch most recent session
  const fromTs = marketOpen ? openTs : openTs - 24 * 3600;

  const candles = await serverGetCandles(symbol, "5", fromTs, nowTs);

  if (!candles.length) {
    return NextResponse.json({
      valid: false, symbol, window, marketOpen,
      message: candles.length === 0
        ? "No intraday candles — Finnhub key required, or market is closed"
        : "Insufficient data",
    } satisfies Partial<ORBData>);
  }

  // Sort by time ascending and filter to today's session
  const sorted = [...candles].sort((a, b) => a.time - b.time);
  const sessionCandles = sorted.filter(c => c.time >= openTs);

  if (sessionCandles.length < 1) {
    return NextResponse.json({
      valid: false, symbol, window, marketOpen,
      message: "Market has not opened yet for today's session",
    } satisfies Partial<ORBData>);
  }

  // ORB = first N candles of session (5m each)
  const candleCount = window / 5;
  const orbCandles = sessionCandles.slice(0, candleCount);
  const postCandles = sessionCandles.slice(candleCount);

  const orbHigh = Math.max(...orbCandles.map(c => c.high));
  const orbLow = Math.min(...orbCandles.map(c => c.low));
  const orbRange = orbHigh - orbLow;
  const orbMidpoint = (orbHigh + orbLow) / 2;

  // Average volume of ORB candles
  const avgOrbVol = orbCandles.reduce((s, c) => s + c.volume, 0) / orbCandles.length;

  // Detect breakout in post-ORB candles
  let breakoutDirection: ORBData["breakoutDirection"] = "none";
  let breakoutPrice: number | null = null;
  let breakoutVolRatio: number | null = null;
  let retestConfirmed = false;
  let retestLevel: number | null = null;

  for (let i = 0; i < postCandles.length; i++) {
    const c = postCandles[i];
    if (breakoutDirection === "none") {
      if (c.close > orbHigh) {
        breakoutDirection = "long";
        breakoutPrice = c.close;
        breakoutVolRatio = avgOrbVol > 0 ? c.volume / avgOrbVol : null;
      } else if (c.close < orbLow) {
        breakoutDirection = "short";
        breakoutPrice = c.close;
        breakoutVolRatio = avgOrbVol > 0 ? c.volume / avgOrbVol : null;
      }
    } else if (!retestConfirmed) {
      const tolerance = orbRange * 0.25;
      if (breakoutDirection === "long") {
        // Retest: price came back near orbHigh then bounced
        if (c.low <= orbHigh + tolerance && c.close > orbHigh) {
          retestConfirmed = true;
          retestLevel = orbHigh;
        }
      } else {
        // Retest: price came back near orbLow then rejected
        if (c.high >= orbLow - tolerance && c.close < orbLow) {
          retestConfirmed = true;
          retestLevel = orbLow;
        }
      }
    }
  }

  const currentCandle = sessionCandles[sessionCandles.length - 1];
  const currentPrice = currentCandle.close;
  const priceVsORB: ORBData["priceVsORB"] =
    currentPrice > orbHigh ? "above" : currentPrice < orbLow ? "below" : "inside";

  const data: ORBData = {
    valid: true,
    symbol,
    window,
    orbHigh: Math.round(orbHigh * 100) / 100,
    orbLow: Math.round(orbLow * 100) / 100,
    orbRange: Math.round(orbRange * 100) / 100,
    orbMidpoint: Math.round(orbMidpoint * 100) / 100,
    breakoutDirection,
    breakoutPrice: breakoutPrice ? Math.round(breakoutPrice * 100) / 100 : null,
    breakoutStrength: breakoutStrengthLabel(breakoutVolRatio),
    retestConfirmed,
    retestLevel: retestLevel ? Math.round(retestLevel * 100) / 100 : null,
    currentPrice: Math.round(currentPrice * 100) / 100,
    priceVsORB,
    breakoutVolRatio: breakoutVolRatio ? Math.round(breakoutVolRatio * 10) / 10 : null,
    avgVolume: Math.round(avgOrbVol),
    candlesAnalyzed: sessionCandles.length,
    marketOpen,
    message: marketOpen
      ? `${sessionCandles.length} candles from today's session`
      : "Showing most recent available session",
  };

  return NextResponse.json(data);
}

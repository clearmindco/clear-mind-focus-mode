import { NextResponse } from "next/server";
import { serverGetCandles, serverGetQuote } from "@/lib/server-data";
import { calcATR, calcSMA, calcRSI, calcRelativeVolume } from "@/lib/ict-analysis";

export type RegimeType =
  | "TREND_UP"
  | "TREND_DOWN"
  | "RANGE_BOUND"
  | "COMPRESSION"
  | "EXPANSION"
  | "GAP_AND_GO"
  | "REVERSAL_WATCH"
  | "UNKNOWN";

export interface MarketRegimeData {
  regime: RegimeType;
  label: string;
  description: string;
  beginnerExplanation: string;
  confidence: number; // 0–100
  signals: string[];
  tradeImplication: string;
  color: string;
  symbol: string;
  currentPrice: number | null;
  changePercent: number | null;
  rsi: number | null;
  sma20: number | null;
  atr: number | null;
  relativeVolume: number | null;
  gapPercent: number | null;
  timestamp: number;
}

function classifyRegime(params: {
  changePercent: number;
  gapPercent: number;
  rsi: number;
  relVol: number;
  atrPercent: number; // ATR as % of price
  smaDeviation: number; // % deviation from SMA20
}): { regime: RegimeType; confidence: number; signals: string[] } {
  const { changePercent, gapPercent, rsi, relVol, atrPercent, smaDeviation } = params;
  const signals: string[] = [];
  let confidence = 50;

  // Gap and Go: significant gap with follow-through
  if (Math.abs(gapPercent) >= 0.8 && Math.abs(changePercent) > 0.5 && relVol > 1.5) {
    const dir = gapPercent > 0 ? "up" : "down";
    signals.push(`Gap ${dir} ${Math.abs(gapPercent).toFixed(1)}%`);
    signals.push(`Relative volume ${relVol.toFixed(1)}x`);
    if (relVol > 2) { signals.push("High-volume gap extension"); confidence = 78; }
    else { confidence = 65; }
    return { regime: "GAP_AND_GO", confidence, signals };
  }

  // Trend Up: strong upward momentum
  if (changePercent >= 0.6 && rsi >= 55 && smaDeviation > 1.0) {
    signals.push(`+${changePercent.toFixed(2)}% intraday`);
    signals.push(`RSI ${rsi.toFixed(0)} — momentum`);
    signals.push(`${smaDeviation.toFixed(1)}% above SMA20`);
    confidence = Math.min(90, 60 + (changePercent * 5) + (rsi > 65 ? 10 : 0));
    return { regime: "TREND_UP", confidence, signals };
  }

  // Trend Down: strong downward momentum
  if (changePercent <= -0.6 && rsi <= 45 && smaDeviation < -1.0) {
    signals.push(`${changePercent.toFixed(2)}% intraday`);
    signals.push(`RSI ${rsi.toFixed(0)} — bearish`);
    signals.push(`${Math.abs(smaDeviation).toFixed(1)}% below SMA20`);
    confidence = Math.min(90, 60 + (Math.abs(changePercent) * 5) + (rsi < 35 ? 10 : 0));
    return { regime: "TREND_DOWN", confidence, signals };
  }

  // Expansion: elevated ATR but not trending
  if (atrPercent > 1.5 && relVol > 1.8) {
    signals.push(`ATR expansion ${atrPercent.toFixed(1)}% of price`);
    signals.push(`Volume surge ${relVol.toFixed(1)}x`);
    confidence = 70;
    return { regime: "EXPANSION", confidence, signals };
  }

  // Reversal Watch: extreme RSI with counter-move signs
  if ((rsi >= 72 && changePercent < 0.2) || (rsi <= 28 && changePercent > -0.2)) {
    signals.push(`RSI ${rsi.toFixed(0)} — extreme`);
    signals.push("Momentum divergence forming");
    confidence = 62;
    return { regime: "REVERSAL_WATCH", confidence, signals };
  }

  // Compression: low ATR, low volume, RSI near 50
  if (atrPercent < 0.8 && relVol < 0.9 && rsi > 42 && rsi < 58) {
    signals.push(`Low ATR: ${atrPercent.toFixed(1)}% of price`);
    signals.push(`Below-avg volume ${relVol.toFixed(1)}x`);
    signals.push(`RSI neutral ${rsi.toFixed(0)}`);
    confidence = 72;
    return { regime: "COMPRESSION", confidence, signals };
  }

  // Range Bound: small change, mid RSI, moderate conditions
  if (Math.abs(changePercent) < 0.4 && rsi > 38 && rsi < 62) {
    signals.push(`Range-bound: ${changePercent.toFixed(2)}% change`);
    signals.push(`RSI neutral ${rsi.toFixed(0)}`);
    confidence = 58;
    return { regime: "RANGE_BOUND", confidence, signals };
  }

  // Default
  signals.push("Mixed signals — no dominant regime");
  return { regime: "UNKNOWN", confidence: 35, signals };
}

const REGIME_META: Record<RegimeType, { label: string; description: string; beginnerExplanation: string; tradeImplication: string; color: string }> = {
  TREND_UP: {
    label: "Trending Up",
    description: "Price making higher highs with RSI momentum above SMA20. Institutional buying pressure confirmed.",
    beginnerExplanation: "The market is clearly moving up. Buyers are in control. Good time to look for dip entries in the direction of the trend.",
    tradeImplication: "Favor longs, buy pullbacks to key levels (VWAP, SMA20, FVG zones). Avoid shorting against trend.",
    color: "#10b981",
  },
  TREND_DOWN: {
    label: "Trending Down",
    description: "Price making lower lows below SMA20, RSI confirming bearish momentum. Distribution phase.",
    beginnerExplanation: "The market is clearly moving down. Sellers are in control. This is a risky time to buy — wait for stabilization.",
    tradeImplication: "Favor shorts or hedges. Do not buy breakdowns. Wait for reversal confirmation before going long.",
    color: "#ef4444",
  },
  RANGE_BOUND: {
    label: "Range Bound",
    description: "Price oscillating between defined support/resistance. Neither buyers nor sellers dominating.",
    beginnerExplanation: "The market is stuck in a range — going up and down without a clear direction. Wait for a breakout before trading.",
    tradeImplication: "Buy support, sell resistance within the range. Avoid momentum strategies. Wait for range breakout with volume.",
    color: "#f59e0b",
  },
  COMPRESSION: {
    label: "Compression",
    description: "ATR contracting, volume declining. Energy building for a potential breakout.",
    beginnerExplanation: "The market is very quiet and tight. Think of it like a coiled spring — a big move is coming, but direction unknown yet.",
    tradeImplication: "Prepare breakout watchlists. Don't trade inside the range. Wait for first confirmed expansion candle with volume.",
    color: "#00d4ff",
  },
  EXPANSION: {
    label: "Expansion",
    description: "ATR expanding with elevated volume. Institutional participation surging — big move in progress.",
    beginnerExplanation: "The market is making unusually big moves with heavy volume. High risk / high reward environment.",
    tradeImplication: "Momentum strategies work best. Larger stops needed (1.5–2× ATR). Trail stops aggressively.",
    color: "#a78bfa",
  },
  GAP_AND_GO: {
    label: "Gap & Go",
    description: "Significant gap from previous close with continuation volume. Classic institutional accumulation gap.",
    beginnerExplanation: "The market opened with a big jump (gap) and is continuing in that direction. Strong institutional move.",
    tradeImplication: "Trade in gap direction after the first 15-minute ORB confirms. Watch for gap fill before entry in counter-direction.",
    color: "#8b5cf6",
  },
  REVERSAL_WATCH: {
    label: "Reversal Watch",
    description: "Extreme RSI with momentum divergence forming. High probability of mean reversion.",
    beginnerExplanation: "The market has moved too far, too fast in one direction. It may start reversing — watch carefully.",
    tradeImplication: "Reduce position size. Do not chase extended moves. Wait for reversal confirmation candle before fading.",
    color: "#f97316",
  },
  UNKNOWN: {
    label: "Mixed Signals",
    description: "No dominant regime detected. Conflicting conditions — low-conviction environment.",
    beginnerExplanation: "The market signals are unclear. Best to watch and wait for a clearer setup.",
    tradeImplication: "Reduce position size or sit out. Wait for clearer regime before committing capital.",
    color: "#5a6075",
  },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get("symbol") ?? "SPY").toUpperCase().slice(0, 8);

  const now = Math.floor(Date.now() / 1000);
  const from35d = now - 35 * 86400;

  const [quote, candles] = await Promise.all([
    serverGetQuote(symbol),
    serverGetCandles(symbol, "D", from35d, now),
  ]);

  if (!quote.price || candles.length < 5) {
    const fallback: MarketRegimeData = {
      regime: "UNKNOWN",
      label: "Mixed Signals",
      description: "Insufficient data — Finnhub API key required for live regime analysis.",
      beginnerExplanation: "Need live data to classify the market regime.",
      confidence: 0,
      signals: ["No live data available"],
      tradeImplication: "Connect Finnhub API for live regime detection.",
      color: "#5a6075",
      symbol,
      currentPrice: null,
      changePercent: null,
      rsi: null,
      sma20: null,
      atr: null,
      relativeVolume: null,
      gapPercent: null,
      timestamp: now,
    };
    return NextResponse.json(fallback);
  }

  const sorted = [...candles].sort((a, b) => a.time - b.time);
  const rsi = calcRSI(sorted, 14);
  const sma20 = calcSMA(sorted, 20);
  const atr = calcATR(sorted, 14);
  const relVol = calcRelativeVolume(sorted, 20);

  const latestCandle = sorted[sorted.length - 1];
  const prevCandle = sorted[sorted.length - 2];

  const gapPercent = prevCandle
    ? ((latestCandle.open - prevCandle.close) / prevCandle.close) * 100
    : 0;

  const changePercent = quote.changePercent ?? ((latestCandle.close - prevCandle?.close) / (prevCandle?.close || 1)) * 100;
  const atrPercent = sma20 && atr ? (atr / sma20) * 100 : 0;
  const smaDeviation = sma20 ? ((quote.price! - sma20) / sma20) * 100 : 0;

  const { regime, confidence, signals } = classifyRegime({
    changePercent,
    gapPercent,
    rsi: rsi ?? 50,
    relVol: relVol ?? 1,
    atrPercent,
    smaDeviation,
  });

  const meta = REGIME_META[regime];

  const result: MarketRegimeData = {
    regime,
    label: meta.label,
    description: meta.description,
    beginnerExplanation: meta.beginnerExplanation,
    confidence,
    signals,
    tradeImplication: meta.tradeImplication,
    color: meta.color,
    symbol,
    currentPrice: quote.price,
    changePercent: Math.round(changePercent * 100) / 100,
    rsi: rsi ? Math.round(rsi * 10) / 10 : null,
    sma20: sma20 ? Math.round(sma20 * 100) / 100 : null,
    atr: atr ? Math.round(atr * 100) / 100 : null,
    relativeVolume: relVol ? Math.round(relVol * 10) / 10 : null,
    gapPercent: Math.round(gapPercent * 100) / 100,
    timestamp: now,
  };

  return NextResponse.json(result);
}

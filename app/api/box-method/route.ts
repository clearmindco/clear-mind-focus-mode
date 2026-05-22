import { NextResponse } from "next/server";
import { serverGetCandles, serverGetQuote, type CandleResolution } from "@/lib/server-data";
import { calcATR, calcSMA, calcRSI, calcRelativeVolume } from "@/lib/ict-analysis";

export type BoxZone = "above_box" | "top_zone" | "middle_zone" | "bottom_zone" | "below_box";

export type BoxSetupType =
  | "BULLISH_BREAKOUT"
  | "BULLISH_RETEST"
  | "RECLAIM_LONG"
  | "SHORT_REJECTION"
  | "BEARISH_BREAKDOWN"
  | "BEARISH_RETEST"
  | "NO_TRADE_MIDDLE"
  | "SUPPORT_WATCH"
  | "RESISTANCE_WATCH"
  | "WATCHING";

export interface ConfidenceFactor {
  name: string;
  score: number;
  max: number;
  reason: string;
}

export interface BoxCandle {
  open: number; high: number; low: number; close: number; volume: number; time: number;
}

export interface BoxMethodData {
  valid: boolean;
  symbol: string;
  resolution: string;

  // Box levels
  boxHigh: number;
  boxLow: number;
  boxMidpoint: number;
  boxRange: number;

  // Price context
  currentPrice: number | null;
  changePercent: number | null;
  priceZone: BoxZone;
  pricePositionPct: number; // 0=at boxLow, 100=at boxHigh

  // Setup classification
  setupType: BoxSetupType;
  setupLabel: string;
  setupColor: string;
  setupDescription: string;
  beginnerExplanation: string;

  // Trade decision
  bullishWatch: boolean;
  bearishWarning: boolean;
  noTrade: boolean;

  // Levels
  suggestedEntry: number | null;
  suggestedStop: number | null;
  suggestedTarget: number | null;
  rrRatio: number | null;

  // Confidence
  confidence: number;
  confidenceFactors: ConfidenceFactor[];

  // Displacement info
  hasDisplacement: boolean;
  displacementSize: number | null;
  displacementDirection: "up" | "down" | "none";

  // Technical
  rsi: number | null;
  relativeVolume: number | null;
  atr: number | null;
  sma20: number | null;

  // Recent candles for visualization (last 30)
  candles: BoxCandle[];

  candlesAnalyzed: number;
  message: string;
}

function getCurrentSessionScore(): number {
  const now = new Date();
  const m = now.getUTCMonth();
  const isEDT = m >= 2 && m <= 9;
  const offset = isEDT ? 4 : 5;
  const utcH = now.getUTCHours() + now.getUTCMinutes() / 60;
  const etH = ((utcH - offset) + 24) % 24;

  if (etH >= 9.5 && etH < 10.5) return 10;   // NY open
  if (etH >= 14.5 && etH < 16) return 10;    // power hour
  if (etH >= 8 && etH < 9.5) return 7;       // pre-market
  if (etH >= 10.5 && etH < 12) return 8;     // morning momentum
  if (etH >= 12 && etH < 13.5) return 4;     // midday chop
  if (etH >= 13.5 && etH < 14.5) return 5;   // afternoon drift
  return 3;                                    // after hours / asian
}

const SETUP_META: Record<BoxSetupType, { label: string; color: string; description: string; beginnerExplanation: string; bullish: boolean; bearish: boolean; noTrade: boolean }> = {
  BULLISH_BREAKOUT: {
    label: "Bullish Breakout",
    color: "#10b981",
    description: "Price has closed above the box high with confirmed displacement. The range is broken to the upside.",
    beginnerExplanation: "Price broke out above the top of the box! Think of the box lid being pushed open. If this happens with big volume, buyers are in control and the move may continue upward.",
    bullish: true, bearish: false, noTrade: false,
  },
  BULLISH_RETEST: {
    label: "Bullish Retest",
    color: "#059669",
    description: "Price broke above box high and has pulled back to retest box high as support. High-probability long entry if it holds.",
    beginnerExplanation: "Price broke out above the box, then came back down to test the top of the box. If the top holds as a floor, this could be a good place to consider a buy.",
    bullish: true, bearish: false, noTrade: false,
  },
  RECLAIM_LONG: {
    label: "Reclaim Long",
    color: "#00d4ff",
    description: "Price swept below box low (triggering shorts/stops), then reclaimed back inside the box. Bullish reversal signal.",
    beginnerExplanation: "Price dipped below the bottom of the box (tricking sellers into thinking it was breaking down), then quickly bounced back inside. This 'trap' move often leads to a rally back toward the top of the box.",
    bullish: true, bearish: false, noTrade: false,
  },
  SHORT_REJECTION: {
    label: "Short Rejection",
    color: "#ef4444",
    description: "Price swept above box high (triggering longs/stops), then was rejected back inside the box. Bearish reversal signal.",
    beginnerExplanation: "Price poked above the top of the box (tricking buyers), then got pushed back down inside. This 'fake breakout' often leads to a drop toward the bottom of the box.",
    bullish: false, bearish: true, noTrade: false,
  },
  BEARISH_BREAKDOWN: {
    label: "Bearish Breakdown",
    color: "#ef4444",
    description: "Price has closed below the box low with confirmed displacement. The range is broken to the downside.",
    beginnerExplanation: "Price broke below the bottom of the box! If this happens with big volume, sellers are in control and the move may continue downward.",
    bullish: false, bearish: true, noTrade: false,
  },
  BEARISH_RETEST: {
    label: "Bearish Retest",
    color: "#b91c1c",
    description: "Price broke below box low and has bounced back to retest box low as resistance. High-probability short entry if it rejects.",
    beginnerExplanation: "Price broke below the box, then bounced back up to test the bottom of the box from below. If the bottom holds as a ceiling, this could signal more downside.",
    bullish: false, bearish: true, noTrade: false,
  },
  NO_TRADE_MIDDLE: {
    label: "No Trade — Middle Zone",
    color: "#f59e0b",
    description: "Price is in the middle of the box. Risk/reward is poor in either direction. No clean setup — wait for price to reach an extreme.",
    beginnerExplanation: "Price is stuck in the middle of the box. This is the worst place to enter a trade — you're too far from support to buy, and too far from resistance to sell. Patient traders WAIT for price to reach the edges of the box.",
    bullish: false, bearish: false, noTrade: true,
  },
  SUPPORT_WATCH: {
    label: "Support Watch",
    color: "#10b981",
    description: "Price is approaching the box low. Watch for rejection or breakdown. Potential long at box low with confirmation.",
    beginnerExplanation: "Price is approaching the bottom edge of the box. The box bottom acts like a floor — if buyers defend it (show as rejection), it may be a buying opportunity. Wait for a bounce candle before acting.",
    bullish: true, bearish: false, noTrade: false,
  },
  RESISTANCE_WATCH: {
    label: "Resistance Watch",
    color: "#f59e0b",
    description: "Price is approaching the box high. Watch for breakout or rejection. Potential short at box high with confirmation.",
    beginnerExplanation: "Price is approaching the top edge of the box. The box top acts like a ceiling — if sellers defend it (show as rejection), it may be a selling opportunity. Wait for a rejection candle before acting.",
    bullish: false, bearish: true, noTrade: false,
  },
  WATCHING: {
    label: "Watching",
    color: "#9aa0b4",
    description: "Insufficient candle data to classify the setup. Box defined but price action is not yet conclusive.",
    beginnerExplanation: "Not enough information yet to call a setup. Keep watching.",
    bullish: false, bearish: false, noTrade: true,
  },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get("symbol") ?? "SPY").toUpperCase().slice(0, 8);
  const resolution = searchParams.get("resolution") ?? "D";
  const validResolutions: CandleResolution[] = ["5", "15", "60", "D"];
  const res: CandleResolution = (validResolutions as string[]).includes(resolution)
    ? (resolution as CandleResolution)
    : "D";

  const now = Math.floor(Date.now() / 1000);
  // Lookback: enough candles for box analysis + ATR calculation
  const lookbackSeconds = res === "D" ? 120 * 86400 :
    res === "60" ? 30 * 86400 :
    res === "15" ? 10 * 86400 :
    3 * 86400; // 5m
  const from = now - lookbackSeconds;

  const [quote, rawCandles] = await Promise.all([
    serverGetQuote(symbol),
    serverGetCandles(symbol, res, from, now),
  ]);

  if (!rawCandles.length || rawCandles.length < 10) {
    return NextResponse.json({
      valid: false, symbol, resolution: res, message: "Insufficient data — Finnhub API key required",
      candles: [],
    } satisfies Partial<BoxMethodData>);
  }

  const sorted = [...rawCandles].sort((a, b) => a.time - b.time);
  const WINDOW = Math.min(20, sorted.length);
  const recent = sorted.slice(-WINDOW);

  // Box = recent high/low
  const boxHigh = Math.max(...recent.map(c => c.high));
  const boxLow = Math.min(...recent.map(c => c.low));
  const boxRange = boxHigh - boxLow;
  const boxMidpoint = (boxHigh + boxLow) / 2;

  // Technical indicators from full history
  const atr = calcATR(sorted, 14);
  const sma20 = calcSMA(sorted, 20);
  const rsi = calcRSI(sorted, 14);
  const relVol = calcRelativeVolume(sorted, 20);

  const currentPrice = quote.price ?? sorted[sorted.length - 1].close;
  const changePercent = quote.changePercent;

  // Detect displacement candle in recent window
  let hasDisplacement = false;
  let displacementSize: number | null = null;
  let displacementDirection: "up" | "down" | "none" = "none";

  if (atr && atr > 0) {
    for (const c of recent) {
      const body = Math.abs(c.close - c.open);
      const bodyToAtr = body / atr;
      if (bodyToAtr >= 1.5) {
        hasDisplacement = true;
        if (!displacementSize || bodyToAtr > displacementSize) {
          displacementSize = bodyToAtr;
          displacementDirection = c.close > c.open ? "up" : "down";
        }
      }
    }
  }

  // Classify price zone
  const pricePct = boxRange > 0 ? ((currentPrice - boxLow) / boxRange) * 100 : 50;
  let priceZone: BoxZone;
  if (currentPrice > boxHigh) priceZone = "above_box";
  else if (currentPrice < boxLow) priceZone = "below_box";
  else if (pricePct >= 67) priceZone = "top_zone";
  else if (pricePct <= 33) priceZone = "bottom_zone";
  else priceZone = "middle_zone";

  // Detect specific patterns by looking at last 3 candles
  const last3 = sorted.slice(-3);
  const prevCandle = last3[last3.length - 2];
  const currCandle = last3[last3.length - 1];
  const tolerance = boxRange * 0.15; // 15% of box range = tolerance zone

  // Did price recently sweep above boxHigh and come back?
  const recentSweepAbove = last3.some(c => c.high > boxHigh + tolerance * 0.3 && c.close <= boxHigh + tolerance);
  // Did price recently sweep below boxLow and come back?
  const recentSweepBelow = last3.some(c => c.low < boxLow - tolerance * 0.3 && c.close >= boxLow - tolerance);

  const nearBoxHigh = Math.abs(currentPrice - boxHigh) / boxRange < 0.1;
  const nearBoxLow = Math.abs(currentPrice - boxLow) / boxRange < 0.1;
  const wasAboveBox = prevCandle && prevCandle.close > boxHigh;
  const wasBelowBox = prevCandle && prevCandle.close < boxLow;

  // Determine setup type
  let setupType: BoxSetupType;
  if (currentPrice > boxHigh + tolerance) {
    setupType = "BULLISH_BREAKOUT";
  } else if (wasAboveBox && nearBoxHigh && currCandle.close > boxHigh - tolerance) {
    setupType = "BULLISH_RETEST";
  } else if (recentSweepBelow && currentPrice > boxLow - tolerance) {
    setupType = "RECLAIM_LONG";
  } else if (recentSweepAbove && currentPrice < boxHigh + tolerance) {
    setupType = "SHORT_REJECTION";
  } else if (currentPrice < boxLow - tolerance) {
    setupType = "BEARISH_BREAKDOWN";
  } else if (wasBelowBox && nearBoxLow && currCandle.close < boxLow + tolerance) {
    setupType = "BEARISH_RETEST";
  } else if (priceZone === "middle_zone") {
    setupType = "NO_TRADE_MIDDLE";
  } else if (priceZone === "bottom_zone") {
    setupType = "SUPPORT_WATCH";
  } else if (priceZone === "top_zone") {
    setupType = "RESISTANCE_WATCH";
  } else {
    setupType = "WATCHING";
  }

  const meta = SETUP_META[setupType];

  // Entry / stop / target
  let suggestedEntry: number | null = null;
  let suggestedStop: number | null = null;
  let suggestedTarget: number | null = null;
  let rrRatio: number | null = null;

  const stopBuffer = atr ? atr * 0.5 : boxRange * 0.1;

  if (meta.bullish && !meta.noTrade) {
    if (setupType === "BULLISH_BREAKOUT") {
      suggestedEntry = boxHigh + stopBuffer * 0.3;
      suggestedStop = boxHigh - stopBuffer;
      suggestedTarget = boxHigh + boxRange;
    } else if (setupType === "BULLISH_RETEST") {
      suggestedEntry = boxHigh;
      suggestedStop = boxHigh - stopBuffer * 1.5;
      suggestedTarget = boxHigh + boxRange * 1.5;
    } else if (setupType === "RECLAIM_LONG") {
      suggestedEntry = boxLow + stopBuffer * 0.3;
      suggestedStop = boxLow - stopBuffer;
      suggestedTarget = boxMidpoint + (boxMidpoint - boxLow);
    } else if (setupType === "SUPPORT_WATCH") {
      suggestedEntry = boxLow + stopBuffer * 0.5;
      suggestedStop = boxLow - stopBuffer;
      suggestedTarget = boxHigh;
    }
  } else if (meta.bearish && !meta.noTrade) {
    if (setupType === "BEARISH_BREAKDOWN") {
      suggestedEntry = boxLow - stopBuffer * 0.3;
      suggestedStop = boxLow + stopBuffer;
      suggestedTarget = boxLow - boxRange;
    } else if (setupType === "BEARISH_RETEST") {
      suggestedEntry = boxLow;
      suggestedStop = boxLow + stopBuffer * 1.5;
      suggestedTarget = boxLow - boxRange * 1.5;
    } else if (setupType === "SHORT_REJECTION") {
      suggestedEntry = boxHigh - stopBuffer * 0.3;
      suggestedStop = boxHigh + stopBuffer;
      suggestedTarget = boxMidpoint - (boxHigh - boxMidpoint);
    } else if (setupType === "RESISTANCE_WATCH") {
      suggestedEntry = boxHigh - stopBuffer * 0.5;
      suggestedStop = boxHigh + stopBuffer;
      suggestedTarget = boxLow;
    }
  }

  if (suggestedEntry && suggestedStop && suggestedTarget) {
    const risk = Math.abs(suggestedEntry - suggestedStop);
    const reward = Math.abs(suggestedTarget - suggestedEntry);
    rrRatio = risk > 0 ? Math.round((reward / risk) * 10) / 10 : null;
  }

  // ── Confidence Scoring ────────────────────────────────────────────────────────
  const factors: ConfidenceFactor[] = [];

  // 1. Displacement size (0–20)
  let dispScore = 0;
  let dispReason = "No significant displacement candle detected";
  if (displacementSize !== null) {
    if (displacementSize >= 3) { dispScore = 20; dispReason = `Large displacement: ${displacementSize.toFixed(1)}x ATR`; }
    else if (displacementSize >= 2) { dispScore = 15; dispReason = `Moderate displacement: ${displacementSize.toFixed(1)}x ATR`; }
    else { dispScore = 10; dispReason = `Small displacement: ${displacementSize.toFixed(1)}x ATR`; }
  }
  factors.push({ name: "Displacement Size", score: dispScore, max: 20, reason: dispReason });

  // 2. Clean retest (0–20)
  let retestScore = 0;
  let retestReason = "No clean retest detected";
  if (setupType === "BULLISH_RETEST" || setupType === "BEARISH_RETEST") {
    retestScore = 20; retestReason = "Clean retest of broken level";
  } else if (setupType === "RECLAIM_LONG" || setupType === "SHORT_REJECTION") {
    retestScore = 18; retestReason = "Liquidity sweep + reclaim pattern";
  } else if (setupType === "SUPPORT_WATCH" || setupType === "RESISTANCE_WATCH") {
    retestScore = 12; retestReason = "Price approaching key level";
  } else if (setupType === "BULLISH_BREAKOUT" || setupType === "BEARISH_BREAKDOWN") {
    retestScore = 8; retestReason = "Breakout — no retest yet";
  } else {
    retestScore = 0; retestReason = "Middle zone — no actionable level";
  }
  factors.push({ name: "Retest Quality", score: retestScore, max: 20, reason: retestReason });

  // 3. Volume confirmation (0–20)
  let volScore = 0;
  let volReason = "No volume data";
  if (relVol !== null) {
    if (relVol >= 2.0) { volScore = 20; volReason = `Surge: ${relVol.toFixed(1)}x avg volume`; }
    else if (relVol >= 1.5) { volScore = 15; volReason = `Elevated: ${relVol.toFixed(1)}x avg volume`; }
    else if (relVol >= 1.0) { volScore = 10; volReason = `Average: ${relVol.toFixed(1)}x volume`; }
    else { volScore = 4; volReason = `Below average: ${relVol.toFixed(1)}x volume`; }
  }
  factors.push({ name: "Volume", score: volScore, max: 20, reason: volReason });

  // 4. RSI alignment (0–15)
  let rsiScore = 0;
  let rsiReason = "RSI unavailable";
  if (rsi !== null) {
    const isBullishSetup = meta.bullish;
    if (isBullishSetup) {
      if (rsi < 40) { rsiScore = 15; rsiReason = `RSI ${rsi.toFixed(0)} — oversold, supports bounce`; }
      else if (rsi >= 40 && rsi <= 60) { rsiScore = 12; rsiReason = `RSI ${rsi.toFixed(0)} — neutral, good base`; }
      else { rsiScore = 5; rsiReason = `RSI ${rsi.toFixed(0)} — overbought, caution for long`; }
    } else {
      if (rsi > 60) { rsiScore = 15; rsiReason = `RSI ${rsi.toFixed(0)} — overbought, supports rejection`; }
      else if (rsi >= 40 && rsi <= 60) { rsiScore = 12; rsiReason = `RSI ${rsi.toFixed(0)} — neutral`; }
      else { rsiScore = 5; rsiReason = `RSI ${rsi.toFixed(0)} — oversold, caution for short`; }
    }
  }
  factors.push({ name: "RSI Alignment", score: rsiScore, max: 15, reason: rsiReason });

  // 5. R:R quality (0–15)
  let rrScore = 0;
  let rrReason = "No setup — no R:R to calculate";
  if (rrRatio !== null) {
    if (rrRatio >= 3) { rrScore = 15; rrReason = `R:R ${rrRatio}:1 — excellent`; }
    else if (rrRatio >= 2) { rrScore = 12; rrReason = `R:R ${rrRatio}:1 — good`; }
    else if (rrRatio >= 1.5) { rrScore = 7; rrReason = `R:R ${rrRatio}:1 — acceptable`; }
    else { rrScore = 2; rrReason = `R:R ${rrRatio}:1 — poor, avoid`; }
  }
  factors.push({ name: "Risk/Reward", score: rrScore, max: 15, reason: rrReason });

  // 6. Session timing (0–10)
  const sessionScore = getCurrentSessionScore();
  const sessionLabel = sessionScore >= 9 ? "NY Open / Power Hour" :
    sessionScore >= 7 ? "Morning Momentum / Pre-market" :
    sessionScore >= 5 ? "Afternoon" : "Midday / After Hours";
  factors.push({ name: "Session Timing", score: sessionScore, max: 10, reason: `${sessionLabel} — ${sessionScore >= 7 ? "favorable" : "lower probability"} session` });

  const confidence = Math.min(100, factors.reduce((s, f) => s + f.score, 0));

  // Serialize candles for visualization (last 30)
  const vizCandles: BoxCandle[] = sorted.slice(-30).map(c => ({
    open: Math.round(c.open * 100) / 100,
    high: Math.round(c.high * 100) / 100,
    low: Math.round(c.low * 100) / 100,
    close: Math.round(c.close * 100) / 100,
    volume: c.volume,
    time: c.time,
  }));

  const data: BoxMethodData = {
    valid: true,
    symbol,
    resolution: res,

    boxHigh: Math.round(boxHigh * 100) / 100,
    boxLow: Math.round(boxLow * 100) / 100,
    boxMidpoint: Math.round(boxMidpoint * 100) / 100,
    boxRange: Math.round(boxRange * 100) / 100,

    currentPrice: Math.round(currentPrice * 100) / 100,
    changePercent: changePercent ? Math.round(changePercent * 100) / 100 : null,
    priceZone,
    pricePositionPct: Math.round(Math.max(0, Math.min(120, pricePct)) * 10) / 10,

    setupType,
    setupLabel: meta.label,
    setupColor: meta.color,
    setupDescription: meta.description,
    beginnerExplanation: meta.beginnerExplanation,

    bullishWatch: meta.bullish,
    bearishWarning: meta.bearish,
    noTrade: meta.noTrade,

    suggestedEntry: suggestedEntry ? Math.round(suggestedEntry * 100) / 100 : null,
    suggestedStop: suggestedStop ? Math.round(suggestedStop * 100) / 100 : null,
    suggestedTarget: suggestedTarget ? Math.round(suggestedTarget * 100) / 100 : null,
    rrRatio,

    confidence,
    confidenceFactors: factors,

    hasDisplacement,
    displacementSize: displacementSize ? Math.round(displacementSize * 10) / 10 : null,
    displacementDirection,

    rsi: rsi ? Math.round(rsi * 10) / 10 : null,
    relativeVolume: relVol ? Math.round(relVol * 10) / 10 : null,
    atr: atr ? Math.round(atr * 100) / 100 : null,
    sma20: sma20 ? Math.round(sma20 * 100) / 100 : null,

    candles: vizCandles,
    candlesAnalyzed: sorted.length,
    message: `${sorted.length} candles analyzed · Box range: $${Math.round(boxRange * 100) / 100}`,
  };

  return NextResponse.json(data);
}

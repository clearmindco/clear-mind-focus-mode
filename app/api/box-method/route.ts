import { NextResponse } from "next/server";
import { serverGetCandles, serverGetQuote, type CandleResolution } from "@/lib/server-data";
import { calcATR, calcSMA, calcRSI, calcRelativeVolume, type Candle } from "@/lib/ict-analysis";

// ─── Simple in-memory cache (per Netlify function instance) ──────────────────
const routeCache = new Map<string, { data: BoxMethodData; ts: number }>();
const CACHE_TTL_MS = 60_000;

// ─── Types ───────────────────────────────────────────────────────────────────

export type BoxType = "previous_day" | "intraday_range" | "opening_range";
export type BoxZone = "above_box" | "top_zone" | "middle_zone" | "bottom_zone" | "below_box";

export type BoxSetupType =
  | "LONG_SETUP_WATCH"
  | "SHORT_SETUP_WATCH"
  | "BREAKOUT_RETEST_LONG"
  | "BREAKOUT_RETEST_SHORT"
  | "FAILED_BREAKOUT_LONG"
  | "FAILED_BREAKOUT_SHORT"
  | "BREAKOUT_ABOVE"
  | "BREAKDOWN_BELOW"
  | "NO_TRADE"
  | "WATCHING";

export type ConfirmationStatus =
  | "long_confirmed"
  | "short_confirmed"
  | "watching_for_long"
  | "watching_for_short"
  | "not_triggered";

export interface ConfidenceFactor {
  name: string;
  score: number;
  max: number;
  reason: string;
}

export interface BoxCandle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  time: number;
}

export interface BoxMethodData {
  valid: boolean;
  symbol: string;
  boxType: BoxType;
  resolution: string;

  boxHigh: number;
  boxLow: number;
  midpoint: number;
  boxRange: number;

  currentPrice: number | null;
  changePercent: number | null;
  zone: BoxZone;
  pricePositionPct: number;

  setupType: BoxSetupType;
  setupLabel: string;
  setupColor: string;

  confirmationStatus: ConfirmationStatus;
  confirmationLabel: string;

  entryTrigger: string | null;
  stopLoss: number | null;
  target1: number | null;
  target2: number | null;
  riskReward: number | null;

  confidenceScore: number;
  confidenceLabel: string;
  confidenceFactors: ConfidenceFactor[];

  reasons: string[];
  risks: string[];
  beginnerExplanation: string;
  advancedExplanation: string;

  rsi: number | null;
  relativeVolume: number | null;
  atr: number | null;
  sma20: number | null;
  hasDisplacement: boolean;
  displacementSize: number | null;
  displacementDirection: "up" | "down" | "none";

  dataSource: string;
  lastUpdated: number;
  candles: BoxCandle[];
  candlesAnalyzed: number;
  message: string;
}

// ─── Session helpers ──────────────────────────────────────────────────────────

function getTodayMarketOpenTs(): number {
  const now = new Date();
  const m = now.getUTCMonth();
  const isEDT = m >= 2 && m <= 9;
  const openHourUTC = isEDT ? 13 : 14; // 9:30 ET in UTC
  return Math.floor(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), openHourUTC, 30, 0) / 1000
  );
}

function getSessionScore(): number {
  const now = new Date();
  const m = now.getUTCMonth();
  const isEDT = m >= 2 && m <= 9;
  const offset = isEDT ? 4 : 5;
  const etH = ((now.getUTCHours() + now.getUTCMinutes() / 60) - offset + 24) % 24;
  if (etH >= 9.5 && etH < 10.5) return 10;
  if (etH >= 14.5 && etH < 16) return 10;
  if (etH >= 8 && etH < 9.5) return 7;
  if (etH >= 10.5 && etH < 12) return 8;
  if (etH >= 12 && etH < 13.5) return 3;
  if (etH >= 13.5 && etH < 14.5) return 5;
  return 3;
}

function toBoxCandle(c: Candle): BoxCandle {
  return {
    open: Math.round(c.open * 100) / 100,
    high: Math.round(c.high * 100) / 100,
    low: Math.round(c.low * 100) / 100,
    close: Math.round(c.close * 100) / 100,
    volume: c.volume,
    time: c.time,
  };
}

// ─── Candle confirmation ──────────────────────────────────────────────────────

function getConfirmationStatus(
  candles: Candle[],
  boxHigh: number,
  boxLow: number
): ConfirmationStatus {
  if (candles.length < 3) return "not_triggered";

  const boxRange = boxHigh - boxLow;
  const tol = boxRange * 0.12;

  // Scan last 5 candles for confirmation patterns
  const check = candles.slice(-5);

  for (let i = 0; i < check.length - 2; i++) {
    const touch = check[i];
    const signal = check[i + 1];
    const confirm = check[i + 2];

    // Long confirmation: touch box low → green signal candle → next breaks above signal high
    if (touch.low <= boxLow + tol) {
      if (signal.close > signal.open) {
        if (confirm.high > signal.high && confirm.close > signal.high * 0.99) {
          return "long_confirmed";
        }
      }
    }

    // Short confirmation: touch box high → red signal candle → next breaks below signal low
    if (touch.high >= boxHigh - tol) {
      if (signal.close < signal.open) {
        if (confirm.low < signal.low && confirm.close < signal.low * 1.01) {
          return "short_confirmed";
        }
      }
    }
  }

  // Watching states — current candle at an edge
  const latest = check[check.length - 1];
  if (latest.low <= boxLow + tol || latest.close <= boxLow + tol) return "watching_for_long";
  if (latest.high >= boxHigh - tol || latest.close >= boxHigh - tol) return "watching_for_short";

  return "not_triggered";
}

// ─── Zone classification ──────────────────────────────────────────────────────

function classifyZone(price: number, boxHigh: number, boxLow: number, boxRange: number): BoxZone {
  if (price > boxHigh) return "above_box";
  if (price < boxLow) return "below_box";
  const pct = (price - boxLow) / boxRange;
  if (pct >= 0.67) return "top_zone";
  if (pct <= 0.33) return "bottom_zone";
  return "middle_zone";
}

// ─── Setup classification ─────────────────────────────────────────────────────

function classifySetup(
  zone: BoxZone,
  candles: Candle[],
  boxHigh: number,
  boxLow: number,
  boxRange: number,
  confirmStatus: ConfirmationStatus
): BoxSetupType {
  const tol = boxRange * 0.12;
  const last3 = candles.slice(-3);
  const prev = last3[last3.length - 2];
  const curr = last3[last3.length - 1];

  // Was previously above/below box (sweep / retest detection)
  const wasAboveBox = prev && prev.close > boxHigh;
  const wasBelowBox = prev && prev.close < boxLow;
  const nearBoxHigh = curr && Math.abs(curr.close - boxHigh) / boxRange < 0.1;
  const nearBoxLow = curr && Math.abs(curr.close - boxLow) / boxRange < 0.1;

  // Failed breakout: price went above box but rejected back inside
  const recentSweepAbove = last3.some(c => c.high > boxHigh + tol * 0.5 && c.close <= boxHigh + tol);
  const recentSweepBelow = last3.some(c => c.low < boxLow - tol * 0.5 && c.close >= boxLow - tol);

  if (zone === "above_box") {
    // Check if there's a rejected push (price is above but topping out)
    if (curr && curr.close < curr.open && curr.high > boxHigh + tol) return "FAILED_BREAKOUT_SHORT";
    return "BREAKOUT_ABOVE";
  }
  if (zone === "below_box") {
    // Check for reclaim pattern
    if (curr && curr.close > curr.open && curr.low < boxLow - tol) return "FAILED_BREAKOUT_LONG";
    return "BREAKDOWN_BELOW";
  }
  if (wasAboveBox && nearBoxHigh) return "BREAKOUT_RETEST_SHORT";
  if (wasBelowBox && nearBoxLow) return "BREAKOUT_RETEST_LONG";
  if (recentSweepBelow) return "FAILED_BREAKOUT_LONG";
  if (recentSweepAbove) return "FAILED_BREAKOUT_SHORT";
  if (zone === "middle_zone") return "NO_TRADE";
  if (zone === "bottom_zone") return "LONG_SETUP_WATCH";
  if (zone === "top_zone") return "SHORT_SETUP_WATCH";
  return "WATCHING";
}

// ─── Setup metadata ───────────────────────────────────────────────────────────

const SETUP_META: Record<BoxSetupType, {
  label: string;
  color: string;
  bullish: boolean;
  bearish: boolean;
  noTrade: boolean;
}> = {
  LONG_SETUP_WATCH:       { label: "Long Setup Watch",              color: "#10b981", bullish: true,  bearish: false, noTrade: false },
  SHORT_SETUP_WATCH:      { label: "Short Setup Watch",             color: "#f59e0b", bullish: false, bearish: true,  noTrade: false },
  BREAKOUT_RETEST_LONG:   { label: "Breakout Retest Long Watch",    color: "#059669", bullish: true,  bearish: false, noTrade: false },
  BREAKOUT_RETEST_SHORT:  { label: "Breakdown Retest Short Watch",  color: "#b91c1c", bullish: false, bearish: true,  noTrade: false },
  FAILED_BREAKOUT_LONG:   { label: "Failed Breakout Watch (Long)",  color: "#00d4ff", bullish: true,  bearish: false, noTrade: false },
  FAILED_BREAKOUT_SHORT:  { label: "Failed Breakout Watch (Short)", color: "#ef4444", bullish: false, bearish: true,  noTrade: false },
  BREAKOUT_ABOVE:         { label: "Breakout Above Box",            color: "#10b981", bullish: true,  bearish: false, noTrade: false },
  BREAKDOWN_BELOW:        { label: "Breakdown Below Box",           color: "#ef4444", bullish: false, bearish: true,  noTrade: false },
  NO_TRADE:               { label: "No Trade — Middle Zone",        color: "#f59e0b", bullish: false, bearish: false, noTrade: true  },
  WATCHING:               { label: "Watching",                      color: "#9aa0b4", bullish: false, bearish: false, noTrade: true  },
};

// ─── Entry / stop / target calculation ───────────────────────────────────────

function calcLevels(
  setupType: BoxSetupType,
  boxHigh: number,
  boxLow: number,
  midpoint: number,
  boxRange: number,
  atr: number | null,
  confirmCandles: Candle[]
): {
  entryTrigger: string | null;
  stopLoss: number | null;
  target1: number | null;
  target2: number | null;
  riskReward: number | null;
} {
  const meta = SETUP_META[setupType];
  const stopBuffer = atr ? atr * 0.4 : boxRange * 0.08;
  const last2 = confirmCandles.slice(-2);
  const signalCandle = last2[0];

  if (meta.noTrade) {
    return { entryTrigger: null, stopLoss: null, target1: null, target2: null, riskReward: null };
  }

  let entryTrigger: string | null = null;
  let stopLoss: number | null = null;
  let target1: number | null = null;
  let target2: number | null = null;

  if (setupType === "LONG_SETUP_WATCH" || setupType === "FAILED_BREAKOUT_LONG" || setupType === "BREAKOUT_RETEST_LONG") {
    entryTrigger = "Wait for first green candle at box low, then enter when next candle closes above that candle's high";
    if (signalCandle && signalCandle.close > signalCandle.open) {
      entryTrigger = `Long entry: next candle break above $${(signalCandle.high).toFixed(2)} (signal candle high)`;
    }
    stopLoss = boxLow - stopBuffer;
    target1 = midpoint;
    target2 = boxHigh;
  } else if (setupType === "SHORT_SETUP_WATCH" || setupType === "FAILED_BREAKOUT_SHORT" || setupType === "BREAKOUT_RETEST_SHORT") {
    entryTrigger = "Wait for first red candle at box high, then enter when next candle closes below that candle's low";
    if (signalCandle && signalCandle.close < signalCandle.open) {
      entryTrigger = `Short entry: next candle break below $${(signalCandle.low).toFixed(2)} (signal candle low)`;
    }
    stopLoss = boxHigh + stopBuffer;
    target1 = midpoint;
    target2 = boxLow;
  } else if (setupType === "BREAKOUT_ABOVE") {
    entryTrigger = `Breakout continuation: enter on pullback retest of box high ($${boxHigh.toFixed(2)}) from above`;
    stopLoss = boxHigh - stopBuffer;
    target1 = boxHigh + boxRange;
    target2 = boxHigh + boxRange * 1.618;
  } else if (setupType === "BREAKDOWN_BELOW") {
    entryTrigger = `Breakdown continuation: enter on bounce retest of box low ($${boxLow.toFixed(2)}) from below`;
    stopLoss = boxLow + stopBuffer;
    target1 = boxLow - boxRange;
    target2 = boxLow - boxRange * 1.618;
  }

  // Entry price estimate for R:R calculation
  let entryEstimate: number | null = null;
  if (meta.bullish && stopLoss !== null && target1 !== null) {
    entryEstimate = stopLoss + stopBuffer * 1.5;
    const risk = Math.abs(entryEstimate - stopLoss);
    const reward = Math.abs(target1 - entryEstimate);
    const rr = risk > 0 ? Math.round((reward / risk) * 10) / 10 : null;
    return {
      entryTrigger,
      stopLoss: Math.round(stopLoss * 100) / 100,
      target1: Math.round(target1 * 100) / 100,
      target2: target2 !== null ? Math.round(target2 * 100) / 100 : null,
      riskReward: rr,
    };
  } else if (meta.bearish && stopLoss !== null && target1 !== null) {
    entryEstimate = stopLoss - stopBuffer * 1.5;
    const risk = Math.abs(entryEstimate - stopLoss);
    const reward = Math.abs(target1 - entryEstimate);
    const rr = risk > 0 ? Math.round((reward / risk) * 10) / 10 : null;
    return {
      entryTrigger,
      stopLoss: Math.round(stopLoss * 100) / 100,
      target1: Math.round(target1 * 100) / 100,
      target2: target2 !== null ? Math.round(target2 * 100) / 100 : null,
      riskReward: rr,
    };
  }

  return {
    entryTrigger,
    stopLoss: stopLoss !== null ? Math.round(stopLoss * 100) / 100 : null,
    target1: target1 !== null ? Math.round(target1 * 100) / 100 : null,
    target2: target2 !== null ? Math.round(target2 * 100) / 100 : null,
    riskReward: null,
  };
}

// ─── Confidence scoring ───────────────────────────────────────────────────────

function calcConfidence(params: {
  zone: BoxZone;
  confirmStatus: ConfirmationStatus;
  relVol: number | null;
  rsi: number | null;
  setupType: BoxSetupType;
  boxRange: number;
  atr: number | null;
  riskReward: number | null;
  sessionScore: number;
  hasDisplacement: boolean;
  currentPrice: number;
  sma20: number | null;
}): { score: number; label: string; factors: ConfidenceFactor[] } {
  const { zone, confirmStatus, relVol, rsi, setupType, boxRange, atr, riskReward, sessionScore, hasDisplacement, currentPrice, sma20 } = params;
  const factors: ConfidenceFactor[] = [];
  const meta = SETUP_META[setupType];

  // 1. Candle confirmation (0-20)
  let confScore = 0;
  let confReason = "No confirmation signal";
  if (confirmStatus === "long_confirmed" || confirmStatus === "short_confirmed") {
    confScore = 20; confReason = "Two-candle confirmation triggered";
  } else if (confirmStatus === "watching_for_long" || confirmStatus === "watching_for_short") {
    confScore = 12; confReason = "At key level — watching for signal candle";
  }
  factors.push({ name: "Candle Confirmation", score: confScore, max: 20, reason: confReason });

  // 2. Price zone quality (0-15)
  let zoneScore = 0;
  let zoneReason = "Middle zone — poor risk/reward";
  if (zone === "bottom_zone" && meta.bullish) { zoneScore = 15; zoneReason = "At box low — clean long edge"; }
  else if (zone === "top_zone" && meta.bearish) { zoneScore = 15; zoneReason = "At box high — clean short edge"; }
  else if (zone === "above_box" && meta.bullish) { zoneScore = 12; zoneReason = "Breakout above box high"; }
  else if (zone === "below_box" && meta.bearish) { zoneScore = 12; zoneReason = "Breakdown below box low"; }
  else if (zone === "above_box" && meta.bearish) { zoneScore = 10; zoneReason = "Rejection from above box"; }
  else if (zone === "below_box" && meta.bullish) { zoneScore = 10; zoneReason = "Reclaim from below box"; }
  else if (meta.noTrade) { zoneScore = 0; zoneReason = "Middle zone — no setup"; }
  factors.push({ name: "Price Zone", score: zoneScore, max: 15, reason: zoneReason });

  // 3. Volume (0-15)
  let volScore = 0;
  let volReason = "No volume data";
  if (relVol !== null) {
    if (relVol >= 2.0) { volScore = 15; volReason = `Volume surge: ${relVol.toFixed(1)}x average`; }
    else if (relVol >= 1.5) { volScore = 12; volReason = `Elevated volume: ${relVol.toFixed(1)}x`; }
    else if (relVol >= 1.0) { volScore = 8; volReason = `Average volume: ${relVol.toFixed(1)}x`; }
    else { volScore = 3; volReason = `Below-average: ${relVol.toFixed(1)}x — weak`; }
  }
  factors.push({ name: "Volume", score: volScore, max: 15, reason: volReason });

  // 4. RSI alignment (0-15)
  let rsiScore = 0;
  let rsiReason = "RSI unavailable";
  if (rsi !== null) {
    if (meta.bullish) {
      if (rsi < 35) { rsiScore = 15; rsiReason = `RSI ${rsi.toFixed(0)} — oversold, supports bounce`; }
      else if (rsi <= 55) { rsiScore = 12; rsiReason = `RSI ${rsi.toFixed(0)} — neutral, supports long`; }
      else { rsiScore = 4; rsiReason = `RSI ${rsi.toFixed(0)} — overbought, caution on long`; }
    } else if (meta.bearish) {
      if (rsi > 65) { rsiScore = 15; rsiReason = `RSI ${rsi.toFixed(0)} — overbought, supports rejection`; }
      else if (rsi >= 45) { rsiScore = 12; rsiReason = `RSI ${rsi.toFixed(0)} — neutral, supports short`; }
      else { rsiScore = 4; rsiReason = `RSI ${rsi.toFixed(0)} — oversold, caution on short`; }
    } else {
      rsiScore = 5; rsiReason = `RSI ${rsi.toFixed(0)} — no directional setup`;
    }
  }
  factors.push({ name: "RSI Alignment", score: rsiScore, max: 15, reason: rsiReason });

  // 5. Box quality (0-15)
  let boxScore = 0;
  let boxReason = "No ATR data";
  if (atr !== null && atr > 0) {
    const rangeToAtr = boxRange / atr;
    if (rangeToAtr >= 2) { boxScore = 15; boxReason = `Wide box: ${rangeToAtr.toFixed(1)}x ATR — significant range`; }
    else if (rangeToAtr >= 1) { boxScore = 12; boxReason = `Normal box: ${rangeToAtr.toFixed(1)}x ATR`; }
    else { boxScore = 6; boxReason = `Narrow box: ${rangeToAtr.toFixed(1)}x ATR — may be noise`; }
    if (hasDisplacement) { boxScore = Math.min(15, boxScore + 3); boxReason += " · Displacement candle detected"; }
  }
  factors.push({ name: "Box Quality", score: boxScore, max: 15, reason: boxReason });

  // 6. R:R (0-10)
  let rrScore = 0;
  let rrReason = "No R:R — no setup";
  if (riskReward !== null) {
    if (riskReward >= 3) { rrScore = 10; rrReason = `R:R ${riskReward}:1 — excellent`; }
    else if (riskReward >= 2) { rrScore = 8; rrReason = `R:R ${riskReward}:1 — good`; }
    else if (riskReward >= 1.5) { rrScore = 5; rrReason = `R:R ${riskReward}:1 — marginal`; }
    else { rrScore = 2; rrReason = `R:R ${riskReward}:1 — poor`; }
  }
  factors.push({ name: "Risk / Reward", score: rrScore, max: 10, reason: rrReason });

  // 7. Session timing (0-10)
  const sessionLabel = sessionScore >= 9 ? "NY Open / Power Hour" :
    sessionScore >= 7 ? "Morning / Pre-market" : sessionScore >= 5 ? "Afternoon" : "Midday / Off-hours";
  factors.push({ name: "Session Timing", score: sessionScore, max: 10, reason: sessionLabel });

  const totalScore = Math.min(100, factors.reduce((s, f) => s + f.score, 0));
  const label =
    totalScore >= 85 ? "High Quality Setup" :
    totalScore >= 70 ? "Strong Watch" :
    totalScore >= 55 ? "Watchlist Only" :
    "No Trade";

  return { score: totalScore, label, factors };
}

// ─── Reasons and risks ────────────────────────────────────────────────────────

function buildReasons(
  setupType: BoxSetupType,
  boxType: BoxType,
  confirmStatus: ConfirmationStatus,
  zone: BoxZone,
  relVol: number | null,
  rsi: number | null,
  hasDisplacement: boolean
): string[] {
  const r: string[] = [];
  const bt = boxType === "previous_day" ? "PDH/PDL" : boxType === "opening_range" ? "ORB" : "recent range";

  if (setupType === "LONG_SETUP_WATCH") r.push(`Price is at the ${bt} low — institutional buyers have defended this level before`);
  if (setupType === "SHORT_SETUP_WATCH") r.push(`Price is at the ${bt} high — institutional sellers have defended this level before`);
  if (setupType === "BREAKOUT_RETEST_LONG" || setupType === "BREAKOUT_RETEST_SHORT") r.push("Prior support/resistance levels that are tested and hold become stronger with each test");
  if (setupType === "FAILED_BREAKOUT_LONG") r.push("Sweep below box low collected stop orders — price reclaimed, trapping shorts");
  if (setupType === "FAILED_BREAKOUT_SHORT") r.push("Sweep above box high collected stop orders — price rejected, trapping longs");
  if (confirmStatus === "long_confirmed") r.push("Two-candle confirmation triggered: signal candle + break above signal high");
  if (confirmStatus === "short_confirmed") r.push("Two-candle confirmation triggered: signal candle + break below signal low");
  if (relVol !== null && relVol >= 1.5) r.push(`Volume ${relVol.toFixed(1)}x average — institutional participation elevated`);
  if (rsi !== null && rsi < 35) r.push(`RSI ${rsi.toFixed(0)} — oversold condition at support`);
  if (rsi !== null && rsi > 65) r.push(`RSI ${rsi.toFixed(0)} — overbought condition at resistance`);
  if (hasDisplacement) r.push("Displacement candle present — shows institutional commitment");
  if (r.length === 0) r.push("No strong confluence detected — wait for better conditions");
  return r;
}

function buildRisks(
  setupType: BoxSetupType,
  zone: BoxZone,
  relVol: number | null,
  rsi: number | null,
  boxRange: number,
  currentPrice: number,
  boxHigh: number,
  boxLow: number,
  changePercent: number | null
): string[] {
  const r: string[] = [];
  const meta = SETUP_META[setupType];

  r.push("Box levels can be broken — institutional flows change without warning");
  if (meta.noTrade) r.push("Middle zone entry has poor R:R — stop is far in both directions");
  if (relVol !== null && relVol < 0.8) r.push("Below-average volume — move may not have institutional backing");
  if (rsi !== null && meta.bullish && rsi > 65) r.push("RSI is overbought for a long — momentum may be exhausting");
  if (rsi !== null && meta.bearish && rsi < 35) r.push("RSI is oversold for a short — may bounce before continuing down");
  if (changePercent !== null && Math.abs(changePercent) > 3) r.push(`Price already moved ${Math.abs(changePercent).toFixed(1)}% today — may be extended`);
  if (setupType === "BREAKOUT_ABOVE") r.push("Breakouts fail ~40% of the time and reverse back into the box — wait for retest");
  if (setupType === "BREAKDOWN_BELOW") r.push("Breakdowns fail frequently — reclaim back inside box is a common reversal");
  if (setupType === "FAILED_BREAKOUT_LONG" || setupType === "FAILED_BREAKOUT_SHORT") r.push("Failed breakout could resume in original direction — wait for candle confirmation");
  r.push("News or macro events can invalidate technical box levels instantly");
  return r;
}

// ─── Displacement detection ───────────────────────────────────────────────────

function detectDisplacement(candles: Candle[], atr: number | null): {
  hasDisplacement: boolean;
  displacementSize: number | null;
  displacementDirection: "up" | "down" | "none";
} {
  if (!atr || atr <= 0 || !candles.length) {
    return { hasDisplacement: false, displacementSize: null, displacementDirection: "none" };
  }
  let maxRatio = 0;
  let direction: "up" | "down" | "none" = "none";
  for (const c of candles) {
    const body = Math.abs(c.close - c.open);
    const ratio = body / atr;
    if (ratio > maxRatio) {
      maxRatio = ratio;
      direction = c.close > c.open ? "up" : "down";
    }
  }
  const hasDisplacement = maxRatio >= 1.5;
  return {
    hasDisplacement,
    displacementSize: hasDisplacement ? Math.round(maxRatio * 10) / 10 : null,
    displacementDirection: hasDisplacement ? direction : "none",
  };
}

// ─── Main GET handler ─────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get("symbol") ?? "SPY").toUpperCase().slice(0, 8);
  const rawBoxType = searchParams.get("boxType") ?? "previous_day";
  const boxType: BoxType = (["previous_day", "intraday_range", "opening_range"] as BoxType[]).includes(rawBoxType as BoxType)
    ? (rawBoxType as BoxType)
    : "previous_day";
  const rawRes = searchParams.get("resolution") ?? "15";
  const validRes: CandleResolution[] = ["5", "15", "30", "60", "D"];
  const resolution: CandleResolution = (validRes as string[]).includes(rawRes) ? (rawRes as CandleResolution) : "15";

  const cacheKey = `${symbol}:${boxType}:${resolution}`;
  const cached = routeCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return NextResponse.json(cached.data);
  }

  const now = Math.floor(Date.now() / 1000);

  // ── Fetch data based on box type ─────────────────────────────────────────────
  let boxHigh = 0;
  let boxLow = 0;
  let allCandles: Candle[] = [];     // full history for indicators
  let vizCandles: Candle[] = [];     // for mini-chart (last 30)
  let confirmCandles: Candle[] = []; // for confirmation detection (recent)
  let dataSource = "";

  try {
    if (boxType === "previous_day") {
      const [daily, intraday] = await Promise.all([
        serverGetCandles(symbol, "D", now - 90 * 86400, now),
        serverGetCandles(symbol, "15", now - 2 * 86400, now),
      ]);

      if (daily.length < 2) {
        return NextResponse.json({
          valid: false, symbol, boxType, resolution,
          message: "Insufficient daily candle data. Finnhub API key required — configure in /api-setup.",
          dataSource: "none", lastUpdated: now, candles: [],
        } satisfies Partial<BoxMethodData>);
      }

      const sortedDaily = [...daily].sort((a, b) => a.time - b.time);
      const prevDay = sortedDaily[sortedDaily.length - 2]; // yesterday
      boxHigh = prevDay.high;
      boxLow = prevDay.low;
      dataSource = "finnhub_daily_pdh_pdl";
      allCandles = sortedDaily;

      // Today's intraday for confirmation and mini-chart
      const todayOpen = getTodayMarketOpenTs();
      const todayIntra = [...intraday].sort((a, b) => a.time - b.time).filter(c => c.time >= todayOpen - 3600);
      vizCandles = todayIntra.length >= 3 ? todayIntra.slice(-30) : sortedDaily.slice(-30);
      confirmCandles = todayIntra.slice(-10);

    } else if (boxType === "opening_range") {
      // ORB window from resolution param: 5, 15, or 30 minutes
      const orbWindow = parseInt(rawRes) || 15;
      const actualOrbWindow = [5, 15, 30].includes(orbWindow) ? orbWindow : 15;

      const todayOpen = getTodayMarketOpenTs();
      const fiveMin = await serverGetCandles(symbol, "5", now - 2 * 86400, now);

      if (!fiveMin.length) {
        return NextResponse.json({
          valid: false, symbol, boxType, resolution,
          message: "No intraday data. Finnhub API key required — configure in /api-setup.",
          dataSource: "none", lastUpdated: now, candles: [],
        } satisfies Partial<BoxMethodData>);
      }

      const sorted5m = [...fiveMin].sort((a, b) => a.time - b.time);
      const todayCandles = sorted5m.filter(c => c.time >= todayOpen);
      const orbCount = actualOrbWindow / 5;
      const orbCandles = todayCandles.slice(0, orbCount);

      if (!orbCandles.length) {
        return NextResponse.json({
          valid: false, symbol, boxType, resolution,
          message: "Market has not opened yet or no opening range data available.",
          dataSource: "none", lastUpdated: now, candles: [],
        } satisfies Partial<BoxMethodData>);
      }

      boxHigh = Math.max(...orbCandles.map(c => c.high));
      boxLow = Math.min(...orbCandles.map(c => c.low));
      dataSource = `finnhub_opening_range_${actualOrbWindow}m`;
      allCandles = sorted5m.slice(-60);
      vizCandles = todayCandles.length >= 3 ? todayCandles.slice(-30) : sorted5m.slice(-30);
      confirmCandles = todayCandles.slice(-10);

    } else {
      // intraday_range: last 20 candles of chosen resolution
      const lookback = resolution === "D" ? 120 : resolution === "60" ? 30 : resolution === "15" ? 10 : 3;
      const raw = await serverGetCandles(symbol, resolution, now - lookback * 86400, now);

      if (!raw.length) {
        return NextResponse.json({
          valid: false, symbol, boxType, resolution,
          message: "No candle data. Finnhub API key required — configure in /api-setup.",
          dataSource: "none", lastUpdated: now, candles: [],
        } satisfies Partial<BoxMethodData>);
      }

      const sorted = [...raw].sort((a, b) => a.time - b.time);
      const recent20 = sorted.slice(-20);
      boxHigh = Math.max(...recent20.map(c => c.high));
      boxLow = Math.min(...recent20.map(c => c.low));
      dataSource = `finnhub_intraday_range_${resolution}`;
      allCandles = sorted;
      vizCandles = sorted.slice(-30);
      confirmCandles = sorted.slice(-10);
    }

    if (boxHigh <= boxLow) {
      return NextResponse.json({
        valid: false, symbol, boxType, resolution,
        message: "Invalid box — high must be greater than low.",
        dataSource, lastUpdated: now, candles: [],
      } satisfies Partial<BoxMethodData>);
    }

    // ── Indicators ───────────────────────────────────────────────────────────────
    const quote = await serverGetQuote(symbol);
    const currentPrice = quote.price ?? (confirmCandles[confirmCandles.length - 1]?.close ?? null);
    const changePercent = quote.changePercent ?? null;

    const atr = calcATR(allCandles, 14);
    const sma20 = calcSMA(allCandles, 20);
    const rsi = calcRSI(allCandles, 14);
    const relVol = calcRelativeVolume(allCandles, 20);
    const { hasDisplacement, displacementSize, displacementDirection } = detectDisplacement(
      allCandles.slice(-20), atr
    );

    const boxRange = boxHigh - boxLow;
    const midpoint = (boxHigh + boxLow) / 2;

    const price = currentPrice ?? midpoint;
    const pricePositionPct = boxRange > 0 ? Math.round(((price - boxLow) / boxRange) * 100 * 10) / 10 : 50;

    // ── Classification ───────────────────────────────────────────────────────────
    const zone = classifyZone(price, boxHigh, boxLow, boxRange);
    const confirmStatus = confirmCandles.length >= 3
      ? getConfirmationStatus(confirmCandles, boxHigh, boxLow)
      : "not_triggered";
    const setupType = classifySetup(zone, confirmCandles, boxHigh, boxLow, boxRange, confirmStatus);
    const meta = SETUP_META[setupType];

    const confirmationLabel: Record<ConfirmationStatus, string> = {
      long_confirmed: "Long Confirmation Triggered ✓",
      short_confirmed: "Short Confirmation Triggered ✓",
      watching_for_long: "Watching for Long Signal Candle...",
      watching_for_short: "Watching for Short Signal Candle...",
      not_triggered: "No confirmation — one candle signals, the next proves",
    };

    // ── Levels ───────────────────────────────────────────────────────────────────
    const levels = calcLevels(setupType, boxHigh, boxLow, midpoint, boxRange, atr, confirmCandles);
    const sessionScore = getSessionScore();

    // ── Confidence ───────────────────────────────────────────────────────────────
    const { score: confidenceScore, label: confidenceLabel, factors: confidenceFactors } = calcConfidence({
      zone, confirmStatus, relVol, rsi, setupType, boxRange, atr, riskReward: levels.riskReward,
      sessionScore, hasDisplacement, currentPrice: price, sma20,
    });

    // ── Explanations ─────────────────────────────────────────────────────────────
    const boxLevelLabel = boxType === "previous_day" ? "PDH/PDL" : boxType === "opening_range" ? "ORB High/Low" : "Range High/Low";

    const beginnerExplanation = meta.noTrade
      ? `Price is stuck in the middle of the box — between $${boxLow.toFixed(2)} (bottom) and $${boxHigh.toFixed(2)} (top). This is the worst place to enter. Risk is unclear in both directions. The middle is chop. Edges are where the opportunity is. Wait patiently for price to reach the top or bottom of the box.`
      : meta.bullish
      ? `The ${boxLevelLabel} bottom ($${boxLow.toFixed(2)}) is where buyers have stepped in before. Price is approaching or bouncing from that level. Look for a green candle to form here, then wait — the NEXT candle needs to break above the green candle's high before acting. One candle signals. The next candle proves.`
      : `The ${boxLevelLabel} top ($${boxHigh.toFixed(2)}) is where sellers have pushed back before. Price is approaching or rejecting from that level. Look for a red candle to form here, then wait — the NEXT candle needs to break below the red candle's low before acting. One candle signals. The next candle proves.`;

    const advancedExplanation = meta.noTrade
      ? `Price is in the mid-range equilibrium zone (${pricePositionPct.toFixed(1)}% of box). No directional edge — entries here lack clean invalidation points. Wait for price to reach a box extreme (PDH/PDL or ORB boundary) before considering any setup. Mid-range entries have poor R:R regardless of direction.`
      : meta.bullish
      ? `${setupType.replace(/_/g, " ")}: Price at or near ${boxLevelLabel} low ($${boxLow.toFixed(2)}). RSI: ${rsi?.toFixed(0) ?? "N/A"} · RelVol: ${relVol?.toFixed(1) ?? "N/A"}x. Confirmation status: ${confirmationLabel[confirmStatus]}. Stop below $${levels.stopLoss?.toFixed(2) ?? "N/A"}. Target 1 (EQ): $${midpoint.toFixed(2)} · Target 2 (${boxLevelLabel} high): $${boxHigh.toFixed(2)}. Liquidity sweep below PDL followed by reclaim is the highest-probability version of this setup.`
      : `${setupType.replace(/_/g, " ")}: Price at or near ${boxLevelLabel} high ($${boxHigh.toFixed(2)}). RSI: ${rsi?.toFixed(0) ?? "N/A"} · RelVol: ${relVol?.toFixed(1) ?? "N/A"}x. Confirmation status: ${confirmationLabel[confirmStatus]}. Stop above $${levels.stopLoss?.toFixed(2) ?? "N/A"}. Target 1 (EQ): $${midpoint.toFixed(2)} · Target 2 (${boxLevelLabel} low): $${boxLow.toFixed(2)}.`;

    const reasons = buildReasons(setupType, boxType, confirmStatus, zone, relVol, rsi, hasDisplacement);
    const risks = buildRisks(setupType, zone, relVol, rsi, boxRange, price, boxHigh, boxLow, changePercent);

    const data: BoxMethodData = {
      valid: true,
      symbol,
      boxType,
      resolution,

      boxHigh: Math.round(boxHigh * 100) / 100,
      boxLow: Math.round(boxLow * 100) / 100,
      midpoint: Math.round(midpoint * 100) / 100,
      boxRange: Math.round(boxRange * 100) / 100,

      currentPrice: currentPrice ? Math.round(currentPrice * 100) / 100 : null,
      changePercent: changePercent ? Math.round(changePercent * 100) / 100 : null,
      zone,
      pricePositionPct,

      setupType,
      setupLabel: meta.label,
      setupColor: meta.color,

      confirmationStatus: confirmStatus,
      confirmationLabel: confirmationLabel[confirmStatus],

      entryTrigger: levels.entryTrigger,
      stopLoss: levels.stopLoss,
      target1: levels.target1,
      target2: levels.target2,
      riskReward: levels.riskReward,

      confidenceScore,
      confidenceLabel,
      confidenceFactors,

      reasons,
      risks,
      beginnerExplanation,
      advancedExplanation,

      rsi: rsi ? Math.round(rsi * 10) / 10 : null,
      relativeVolume: relVol ? Math.round(relVol * 10) / 10 : null,
      atr: atr ? Math.round(atr * 100) / 100 : null,
      sma20: sma20 ? Math.round(sma20 * 100) / 100 : null,
      hasDisplacement,
      displacementSize,
      displacementDirection,

      dataSource,
      lastUpdated: now,
      candles: vizCandles.slice(-30).map(toBoxCandle),
      candlesAnalyzed: allCandles.length,
      message: `${boxType === "previous_day" ? "Previous Day Box" : boxType === "opening_range" ? "Opening Range Box" : "Intraday Range Box"} · ${allCandles.length} candles`,
    };

    routeCache.set(cacheKey, { data, ts: Date.now() });
    return NextResponse.json(data);

  } catch (err) {
    return NextResponse.json({
      valid: false, symbol, boxType, resolution,
      message: `Server error: ${err instanceof Error ? err.message : "unknown"}`,
      dataSource: "error", lastUpdated: now, candles: [],
    } satisfies Partial<BoxMethodData>);
  }
}

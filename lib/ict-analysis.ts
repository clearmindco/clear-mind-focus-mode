/**
 * ICT (Inner Circle Trader) market structure analysis algorithms.
 * Pure TypeScript — no external dependencies. All logic here is educational.
 */

export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  time: number; // unix timestamp
}

// ─── FVG ──────────────────────────────────────────────────────────────────────

export interface FairValueGap {
  type: "bullish" | "bearish";
  top: number;
  bottom: number;
  formationTime: number;
  status: "untouched" | "partially_filled" | "fully_filled";
  fillPercent: number;
}

export function detectFVGs(candles: Candle[], lastPrice: number): FairValueGap[] {
  const fvgs: FairValueGap[] = [];
  for (let i = 2; i < candles.length; i++) {
    const A = candles[i - 2];
    const C = candles[i];

    // Bullish FVG: gap between A.high and C.low (price ran up through B)
    if (C.low > A.high) {
      const top = C.low;
      const bottom = A.high;
      const gapSize = top - bottom;
      const filled = Math.max(0, bottom + gapSize - Math.max(lastPrice, bottom));
      const fillPct = Math.min(1, Math.max(0, 1 - (lastPrice - bottom) / gapSize));
      const status: FairValueGap["status"] =
        lastPrice <= bottom ? "fully_filled"
        : lastPrice < top ? "partially_filled"
        : "untouched";
      fvgs.push({ type: "bullish", top, bottom, formationTime: C.time, status, fillPercent: fillPct * 100 });
    }

    // Bearish FVG: gap between A.low and C.high (price ran down through B)
    if (C.high < A.low) {
      const top = A.low;
      const bottom = C.high;
      const gapSize = top - bottom;
      const status: FairValueGap["status"] =
        lastPrice >= top ? "fully_filled"
        : lastPrice > bottom ? "partially_filled"
        : "untouched";
      const fillPct = Math.min(1, Math.max(0, (lastPrice - bottom) / gapSize));
      fvgs.push({ type: "bearish", top, bottom, formationTime: C.time, status, fillPercent: fillPct * 100 });
    }
  }
  // Return the 5 most recent FVGs that are untouched or partially filled
  return fvgs
    .filter(f => f.status !== "fully_filled")
    .slice(-5)
    .reverse();
}

// ─── Market Structure ─────────────────────────────────────────────────────────

export interface SwingPoint {
  type: "high" | "low";
  price: number;
  time: number;
  index: number;
}

export interface StructureLabel {
  type: "HH" | "HL" | "LH" | "LL" | "BOS" | "MSS";
  price: number;
  time: number;
  description: string;
}

export type TrendBias = "Uptrend" | "Downtrend" | "Ranging";

function findSwingPoints(candles: Candle[], lookback = 3): SwingPoint[] {
  const points: SwingPoint[] = [];
  for (let i = lookback; i < candles.length - lookback; i++) {
    const c = candles[i];
    const leftHighs = candles.slice(i - lookback, i).map(x => x.high);
    const rightHighs = candles.slice(i + 1, i + lookback + 1).map(x => x.high);
    const leftLows = candles.slice(i - lookback, i).map(x => x.low);
    const rightLows = candles.slice(i + 1, i + lookback + 1).map(x => x.low);

    if (c.high > Math.max(...leftHighs) && c.high > Math.max(...rightHighs)) {
      points.push({ type: "high", price: c.high, time: c.time, index: i });
    } else if (c.low < Math.min(...leftLows) && c.low < Math.min(...rightLows)) {
      points.push({ type: "low", price: c.low, time: c.time, index: i });
    }
  }
  return points;
}

export interface MarketStructureResult {
  swingPoints: SwingPoint[];
  labels: StructureLabel[];
  trend: TrendBias;
  lastHigh: number | null;
  lastLow: number | null;
  bosDetected: boolean;
  mssDetected: boolean;
}

export function analyzeMarketStructure(candles: Candle[]): MarketStructureResult {
  if (candles.length < 10) {
    return { swingPoints: [], labels: [], trend: "Ranging", lastHigh: null, lastLow: null, bosDetected: false, mssDetected: false };
  }

  const swingPoints = findSwingPoints(candles, 3);
  const labels: StructureLabel[] = [];

  const highs = swingPoints.filter(p => p.type === "high");
  const lows = swingPoints.filter(p => p.type === "low");

  // Label HH/HL/LH/LL
  for (let i = 1; i < highs.length; i++) {
    const prev = highs[i - 1];
    const curr = highs[i];
    const label = curr.price > prev.price ? "HH" : "LH";
    labels.push({
      type: label,
      price: curr.price,
      time: curr.time,
      description: label === "HH" ? "Higher High — bullish continuation" : "Lower High — bearish pressure",
    });
  }
  for (let i = 1; i < lows.length; i++) {
    const prev = lows[i - 1];
    const curr = lows[i];
    const label = curr.price > prev.price ? "HL" : "LL";
    labels.push({
      type: label,
      price: curr.price,
      time: curr.time,
      description: label === "HL" ? "Higher Low — bullish structure intact" : "Lower Low — bearish continuation",
    });
  }

  // Determine trend from recent labels
  const recentLabels = labels.slice(-6);
  const bullCount = recentLabels.filter(l => l.type === "HH" || l.type === "HL").length;
  const bearCount = recentLabels.filter(l => l.type === "LH" || l.type === "LL").length;
  const trend: TrendBias = bullCount > bearCount + 1 ? "Uptrend" : bearCount > bullCount + 1 ? "Downtrend" : "Ranging";

  // Break of Structure detection: recent LH in uptrend gets broken (or vice versa)
  let bosDetected = false;
  let mssDetected = false;
  const lastCandle = candles[candles.length - 1];
  if (highs.length >= 2) {
    const prevHigh = highs[highs.length - 2];
    const lastHigh = highs[highs.length - 1];
    if (trend === "Downtrend" && lastCandle.close > lastHigh.price) {
      bosDetected = true;
      mssDetected = true;
      labels.push({ type: "MSS", price: lastHigh.price, time: lastCandle.time, description: "Market Structure Shift — bullish reversal signal" });
    }
    if (trend === "Uptrend" && lastCandle.close < lows[lows.length - 1]?.price) {
      bosDetected = true;
      labels.push({ type: "BOS", price: lows[lows.length - 1]?.price ?? 0, time: lastCandle.time, description: "Break of Structure — bullish continuation" });
    }
  }

  return {
    swingPoints,
    labels: labels.slice(-10),
    trend,
    lastHigh: highs.at(-1)?.price ?? null,
    lastLow: lows.at(-1)?.price ?? null,
    bosDetected,
    mssDetected,
  };
}

// ─── Equilibrium ──────────────────────────────────────────────────────────────

export interface EquilibriumResult {
  swingHigh: number;
  swingLow: number;
  equilibrium: number;
  zone: "premium" | "discount" | "equilibrium";
  percentFromEQ: number;
}

export function calcEquilibrium(candles: Candle[], lastPrice: number, lookback = 50): EquilibriumResult {
  const slice = candles.slice(-lookback);
  const swingHigh = Math.max(...slice.map(c => c.high));
  const swingLow = Math.min(...slice.map(c => c.low));
  const equilibrium = (swingHigh + swingLow) / 2;
  const pctFromEQ = ((lastPrice - equilibrium) / (swingHigh - swingLow)) * 100;

  let zone: EquilibriumResult["zone"] = "equilibrium";
  if (lastPrice > equilibrium * 1.002) zone = "premium";
  else if (lastPrice < equilibrium * 0.998) zone = "discount";

  return { swingHigh, swingLow, equilibrium, zone, percentFromEQ: pctFromEQ };
}

// ─── Order Blocks ─────────────────────────────────────────────────────────────

export interface OrderBlock {
  type: "bullish" | "bearish";
  top: number;
  bottom: number;
  time: number;
  strengthScore: number; // 0-100
  timeframe: string;
  mitigated: boolean;
}

export function detectOrderBlocks(candles: Candle[], lastPrice: number): OrderBlock[] {
  const blocks: OrderBlock[] = [];
  const atr = calcATR(candles, 14);

  for (let i = 3; i < candles.length - 1; i++) {
    const ob = candles[i];
    const next = candles[i + 1];
    const moveSize = Math.abs(next.close - next.open);

    // Bullish OB: last bearish candle before strong bullish displacement
    if (ob.close < ob.open && next.close > next.open && moveSize > atr * 1.5) {
      // Check if next candle breaks structure (goes above recent high)
      const recentHigh = Math.max(...candles.slice(Math.max(0, i - 10), i).map(c => c.high));
      if (next.high > recentHigh) {
        const strength = Math.min(100, Math.round((moveSize / atr) * 30 + 40));
        const mitigated = lastPrice < ob.low;
        blocks.push({
          type: "bullish",
          top: ob.high,
          bottom: ob.low,
          time: ob.time,
          strengthScore: strength,
          timeframe: "D",
          mitigated,
        });
      }
    }

    // Bearish OB: last bullish candle before strong bearish displacement
    if (ob.close > ob.open && next.close < next.open && moveSize > atr * 1.5) {
      const recentLow = Math.min(...candles.slice(Math.max(0, i - 10), i).map(c => c.low));
      if (next.low < recentLow) {
        const strength = Math.min(100, Math.round((moveSize / atr) * 30 + 40));
        const mitigated = lastPrice > ob.high;
        blocks.push({
          type: "bearish",
          top: ob.high,
          bottom: ob.low,
          time: ob.time,
          strengthScore: strength,
          timeframe: "D",
          mitigated,
        });
      }
    }
  }

  // Return 3 most recent unmitigated blocks
  return blocks.filter(b => !b.mitigated).slice(-3).reverse();
}

// ─── Liquidity Sweeps ─────────────────────────────────────────────────────────

export interface LiquiditySweep {
  type: "bullish" | "bearish";
  sweptLevel: number;
  rejectionClose: number;
  time: number;
  description: string;
}

export function detectLiquiditySweeps(candles: Candle[]): LiquiditySweep[] {
  const sweeps: LiquiditySweep[] = [];
  const tolerance = 0.002; // 0.2% for "equal" highs/lows

  for (let i = 10; i < candles.length; i++) {
    const c = candles[i];
    const prior = candles.slice(Math.max(0, i - 20), i - 1);

    // Find equal highs in prior candles
    const equalHighs = prior.filter(p => Math.abs(p.high - c.high) / c.high < tolerance);
    if (equalHighs.length >= 1 && c.close < c.high * 0.998) {
      // Wick swept above equal highs and closed back down
      const swept = Math.max(...equalHighs.map(p => p.high));
      if (c.high >= swept && c.close < swept) {
        sweeps.push({
          type: "bearish",
          sweptLevel: swept,
          rejectionClose: c.close,
          time: c.time,
          description: `Swept equal highs at $${swept.toFixed(2)} then rejected — potential bearish reversal`,
        });
      }
    }

    // Find equal lows in prior candles
    const equalLows = prior.filter(p => Math.abs(p.low - c.low) / c.low < tolerance);
    if (equalLows.length >= 1 && c.close > c.low * 1.002) {
      const swept = Math.min(...equalLows.map(p => p.low));
      if (c.low <= swept && c.close > swept) {
        sweeps.push({
          type: "bullish",
          sweptLevel: swept,
          rejectionClose: c.close,
          time: c.time,
          description: `Swept equal lows at $${swept.toFixed(2)} then reclaimed — potential bullish reversal`,
        });
      }
    }
  }

  return sweeps.slice(-3).reverse();
}

// ─── Breaker Blocks ───────────────────────────────────────────────────────────

export interface BreakerBlock {
  type: "bullish" | "bearish";
  top: number;
  bottom: number;
  time: number;
  description: string;
}

export function detectBreakerBlocks(candles: Candle[], structure: MarketStructureResult): BreakerBlock[] {
  const breakers: BreakerBlock[] = [];
  const lastCandle = candles[candles.length - 1];

  // Bullish breaker: a prior bearish OB that price has now broken above (flipped support)
  for (const point of structure.swingPoints) {
    if (point.type === "low") {
      const zoneCandle = candles.find(c => c.time === point.time);
      if (zoneCandle && lastCandle.close > zoneCandle.high) {
        breakers.push({
          type: "bullish",
          top: zoneCandle.high,
          bottom: zoneCandle.low,
          time: zoneCandle.time,
          description: "Prior supply zone broken — now acting as support (bullish breaker)",
        });
      }
    }
    if (point.type === "high") {
      const zoneCandle = candles.find(c => c.time === point.time);
      if (zoneCandle && lastCandle.close < zoneCandle.low) {
        breakers.push({
          type: "bearish",
          top: zoneCandle.high,
          bottom: zoneCandle.low,
          time: zoneCandle.time,
          description: "Prior demand zone broken — now acting as resistance (bearish breaker)",
        });
      }
    }
  }

  return breakers.slice(-3).reverse();
}

// ─── ATR helper ───────────────────────────────────────────────────────────────

export function calcATR(candles: Candle[], period = 14): number {
  if (candles.length < 2) return 0;
  const trs = candles.slice(1).map((c, i) => {
    const prev = candles[i];
    return Math.max(c.high - c.low, Math.abs(c.high - prev.close), Math.abs(c.low - prev.close));
  });
  const recent = trs.slice(-period);
  return recent.reduce((a, b) => a + b, 0) / recent.length;
}

// ─── Relative Volume ──────────────────────────────────────────────────────────

export function calcRelativeVolume(candles: Candle[], avgPeriod = 20): number {
  if (candles.length < 2) return 1;
  const today = candles[candles.length - 1];
  const prior = candles.slice(-avgPeriod - 1, -1);
  if (!prior.length) return 1;
  const avgVol = prior.reduce((a, c) => a + c.volume, 0) / prior.length;
  if (!avgVol) return 1;
  return today.volume / avgVol;
}

// ─── Full ICT Analysis ────────────────────────────────────────────────────────

export interface ICTAnalysis {
  ticker: string;
  timeframe: string;
  lastPrice: number;
  atr: number;
  relativeVolume: number;
  fvgs: FairValueGap[];
  marketStructure: MarketStructureResult;
  equilibrium: EquilibriumResult;
  orderBlocks: OrderBlock[];
  liquiditySweeps: LiquiditySweep[];
  breakerBlocks: BreakerBlock[];
  confluenceScore: number;
  confluenceBias: "Bullish" | "Bearish" | "Neutral";
  confluenceFactors: string[];
}

export function runICTAnalysis(ticker: string, candles: Candle[], timeframe: string): ICTAnalysis {
  if (!candles.length) {
    return {
      ticker, timeframe, lastPrice: 0, atr: 0, relativeVolume: 1,
      fvgs: [], marketStructure: { swingPoints: [], labels: [], trend: "Ranging", lastHigh: null, lastLow: null, bosDetected: false, mssDetected: false },
      equilibrium: { swingHigh: 0, swingLow: 0, equilibrium: 0, zone: "equilibrium", percentFromEQ: 0 },
      orderBlocks: [], liquiditySweeps: [], breakerBlocks: [],
      confluenceScore: 50, confluenceBias: "Neutral", confluenceFactors: [],
    };
  }

  const lastPrice = candles[candles.length - 1].close;
  const atr = calcATR(candles);
  const relativeVolume = calcRelativeVolume(candles);
  const fvgs = detectFVGs(candles, lastPrice);
  const marketStructure = analyzeMarketStructure(candles);
  const equilibrium = calcEquilibrium(candles, lastPrice);
  const orderBlocks = detectOrderBlocks(candles, lastPrice);
  const liquiditySweeps = detectLiquiditySweeps(candles);
  const breakerBlocks = detectBreakerBlocks(candles, marketStructure);

  // Confluence scoring
  let score = 50;
  const factors: string[] = [];
  let bullPoints = 0;
  let bearPoints = 0;

  if (marketStructure.trend === "Uptrend") { score += 15; bullPoints += 2; factors.push("Uptrend structure (HH/HL)"); }
  if (marketStructure.trend === "Downtrend") { score -= 15; bearPoints += 2; factors.push("Downtrend structure (LH/LL)"); }

  if (equilibrium.zone === "discount") { score += 8; bullPoints++; factors.push("Discounted price — below equilibrium"); }
  if (equilibrium.zone === "premium") { score -= 8; bearPoints++; factors.push("Premium price — above equilibrium (extended)"); }

  const bullFVGs = fvgs.filter(f => f.type === "bullish" && f.status !== "fully_filled");
  const bearFVGs = fvgs.filter(f => f.type === "bearish" && f.status !== "fully_filled");
  if (bullFVGs.length) { score += 8; bullPoints++; factors.push(`Bullish FVG present (${bullFVGs.length})`); }
  if (bearFVGs.length) { score -= 8; bearPoints++; factors.push(`Bearish FVG overhead (${bearFVGs.length})`); }

  const bullOBs = orderBlocks.filter(o => o.type === "bullish");
  const bearOBs = orderBlocks.filter(o => o.type === "bearish");
  if (bullOBs.length && lastPrice >= bullOBs[0].bottom && lastPrice <= bullOBs[0].top * 1.02) {
    score += 10; bullPoints++; factors.push("At/in bullish order block");
  }
  if (bearOBs.length && lastPrice >= bearOBs[0].bottom * 0.98 && lastPrice <= bearOBs[0].top) {
    score -= 10; bearPoints++; factors.push("At/in bearish order block");
  }

  if (relativeVolume >= 1.5) { score += 5; factors.push(`High relative volume (${relativeVolume.toFixed(1)}x)`); }

  const recentBullSweep = liquiditySweeps.find(s => s.type === "bullish");
  if (recentBullSweep) { score += 7; bullPoints++; factors.push("Recent bullish liquidity sweep (lows swept + reclaimed)"); }

  if (marketStructure.mssDetected) { score += 10; bullPoints++; factors.push("Market structure shift detected"); }

  score = Math.max(5, Math.min(95, score));
  const confluenceBias: ICTAnalysis["confluenceBias"] =
    bullPoints > bearPoints + 1 ? "Bullish"
    : bearPoints > bullPoints + 1 ? "Bearish"
    : "Neutral";

  return {
    ticker, timeframe, lastPrice, atr, relativeVolume,
    fvgs, marketStructure, equilibrium, orderBlocks, liquiditySweeps, breakerBlocks,
    confluenceScore: Math.round(score),
    confluenceBias,
    confluenceFactors: factors,
  };
}

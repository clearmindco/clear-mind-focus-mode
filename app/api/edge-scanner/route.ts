import { NextResponse } from "next/server";
import { serverGetQuote, serverGetCandles } from "@/lib/server-data";
import { calcATR, calcRelativeVolume, calcSMA, calcRSI } from "@/lib/ict-analysis";

// Focused universe for edge scanning — liquid, actively traded
const EDGE_UNIVERSE = [
  "SPY", "QQQ", "IWM",
  "AAPL", "MSFT", "NVDA", "AMD", "TSLA", "META", "AMZN", "GOOGL",
  "PLTR", "COIN", "SMCI", "MSTR", "HOOD",
  "JPM", "BAC", "GS",
  "XOM", "CVX",
  "MU", "AVGO", "QCOM",
  "NFLX", "UBER", "DIS",
];

export interface EdgeResult {
  ticker: string;
  price: number;
  changePercent: number;
  direction: "bullish" | "bearish" | "neutral";
  fairValue: number | null;
  edgePercent: number | null;
  edgeScore: number;
  signal: "STRONG EDGE" | "WATCH" | "NO EDGE" | "AVOID";
  relativeVolume: number | null;
  rsi: number | null;
  sma20: number | null;
  atr: number | null;
  atrPercent: number | null;
  reasons: string[];
  whyWrong: string[];
  confidence: "High" | "Medium" | "Low";
  dataSource: string;
  maxLoss: string;
  paperTradeSize: string;
  liquidityWarning: string | null;
  isPlaceholder: boolean;
}

function scoreEdge(params: {
  hasCandles: boolean;
  edgePct: number | null;
  relVol: number | null;
  rsi: number | null;
}): number {
  let score = 0;

  // 1. Data confidence (0–25)
  score += params.hasCandles ? 25 : 10;

  // 2. Mispricing size (0–25)
  const ep = params.edgePct != null ? Math.abs(params.edgePct) : 0;
  if (ep >= 10) score += 25;
  else if (ep >= 7) score += 20;
  else if (ep >= 5) score += 15;
  else if (ep >= 3) score += 10;
  else if (ep >= 1.5) score += 5;

  // 3. Liquidity / volume (0–20)
  const rv = params.relVol ?? 0;
  if (rv >= 3) score += 20;
  else if (rv >= 2) score += 15;
  else if (rv >= 1.5) score += 10;
  else if (rv >= 1) score += 6;
  else score += 3;

  // 4. Momentum alignment with edge direction (0–15)
  const rsi = params.rsi;
  const ep2 = params.edgePct;
  if (rsi != null && ep2 != null) {
    if (rsi < 30 && ep2 > 0) score += 15; // oversold + discount = bullish edge
    else if (rsi > 70 && ep2 < 0) score += 15; // overbought + extended = bearish fade
    else if ((rsi < 40 && ep2 > 0) || (rsi > 60 && ep2 < 0)) score += 8;
    else score += 3;
  } else {
    score += 5;
  }

  // 5. Freshness (0–15) — always fresh since just fetched
  score += 12;

  return Math.min(95, Math.max(5, score));
}

function signalFromScore(score: number, edgePct: number | null): EdgeResult["signal"] {
  const ep = edgePct != null ? Math.abs(edgePct) : 0;
  if (score >= 65 && ep >= 4) return "STRONG EDGE";
  if (score >= 48) return "WATCH";
  if (score >= 32) return "NO EDGE";
  return "AVOID";
}

function buildReasons(ticker: string, cp: number, edgePct: number | null, rsi: number | null, rv: number | null): string[] {
  const r: string[] = [];
  if (Math.abs(cp) >= 5) r.push(`Large ${cp > 0 ? "+" : ""}${cp.toFixed(1)}% intraday move — momentum event`);
  else if (Math.abs(cp) >= 3) r.push(`Significant ${cp > 0 ? "+" : ""}${cp.toFixed(1)}% move — above threshold`);
  if (edgePct != null && Math.abs(edgePct) >= 3) {
    r.push(edgePct > 0
      ? `Trading ${edgePct.toFixed(1)}% below 20-day SMA — discounted vs historical average`
      : `Trading ${Math.abs(edgePct).toFixed(1)}% above 20-day SMA — extended vs historical average`);
  }
  if (rsi != null) {
    if (rsi < 30) r.push(`RSI ${rsi.toFixed(0)} — technically oversold (below 30)`);
    else if (rsi > 70) r.push(`RSI ${rsi.toFixed(0)} — technically overbought (above 70)`);
    else if (rsi < 40) r.push(`RSI ${rsi.toFixed(0)} — approaching oversold territory`);
    else if (rsi > 60) r.push(`RSI ${rsi.toFixed(0)} — approaching overbought territory`);
  }
  if (rv != null && rv >= 1.5) r.push(`${rv.toFixed(1)}x relative volume — above-average participation`);
  if (!r.length) r.push("Within normal daily range — monitoring for catalyst");
  return r;
}

function buildWhyWrong(cp: number, edgePct: number | null, rsi: number | null): string[] {
  const w: string[] = [
    "SMA20 is a lagging indicator — price can stay extended for weeks in strong trends",
    "Fair value estimates use historical averages which may not reflect current fundamentals",
    "No prediction of direction is guaranteed; markets can remain irrational",
  ];
  if (cp > 0) w.push("Momentum stocks often continue trending; shorting strength has high risk");
  if (cp < 0) w.push("Falling assets may indicate deteriorating fundamentals, not just technicals");
  if (rsi != null && rsi < 35) w.push("Oversold can stay oversold — RSI alone does not mark bottoms");
  if (rsi != null && rsi > 65) w.push("Overbought can stay overbought in strong bull markets");
  if (edgePct != null && Math.abs(edgePct) < 3) w.push("Small edge % may be inside normal noise band — not statistically significant");
  return w.slice(0, 4);
}

export async function GET() {
  const toTs = Math.floor(Date.now() / 1000);
  const fromTs = toTs - 35 * 86400; // 35 days of daily candles

  const results = await Promise.allSettled(
    EDGE_UNIVERSE.map(async ticker => {
      const [quote, candles] = await Promise.all([
        serverGetQuote(ticker),
        serverGetCandles(ticker, "D", fromTs, toTs),
      ]);

      if (quote.isPlaceholder) {
        const r: EdgeResult = {
          ticker, price: 0, changePercent: 0, direction: "neutral",
          fairValue: null, edgePercent: null, edgeScore: 0, signal: "AVOID",
          relativeVolume: null, rsi: null, sma20: null, atr: null, atrPercent: null,
          reasons: ["API not connected"], whyWrong: [],
          confidence: "Low", dataSource: "No API key",
          maxLoss: "—", paperTradeSize: "—", liquidityWarning: null,
          isPlaceholder: true,
        };
        return r;
      }

      const rv = candles.length >= 5 ? Math.round(calcRelativeVolume(candles, 20) * 10) / 10 : null;
      const atr = candles.length >= 14 ? calcATR(candles, 14) : null;
      const sma20 = candles.length >= 20 ? calcSMA(candles, 20) : null;
      const rsi = candles.length >= 15 ? calcRSI(candles, 14) : null;
      const currentPrice = quote.price ?? 0;
      const atrPct = atr && currentPrice ? Math.round((atr / currentPrice) * 1000) / 10 : null;
      const edgePct = sma20 && currentPrice ? Math.round(((sma20 - currentPrice) / currentPrice) * 1000) / 10 : null;

      const score = scoreEdge({ hasCandles: candles.length >= 20, edgePct, relVol: rv, rsi });
      const signal = signalFromScore(score, edgePct);
      const cp = quote.changePercent ?? 0;
      const direction: EdgeResult["direction"] = cp > 0.2 ? "bullish" : cp < -0.2 ? "bearish" : "neutral";
      const confidence: EdgeResult["confidence"] = candles.length >= 20 ? "High" : candles.length >= 5 ? "Medium" : "Low";

      // Paper trade sizing (assume $10k account, 2% max risk per trade, stop = 1 ATR)
      const riskDollars = 200;
      const stopDist = atr ?? currentPrice * 0.02;
      const shares = stopDist > 0 ? Math.floor(riskDollars / stopDist) : 0;
      const tradeValue = shares * currentPrice;

      const r: EdgeResult = {
        ticker,
        price: currentPrice,
        changePercent: cp,
        direction,
        fairValue: sma20 ? Math.round(sma20 * 100) / 100 : null,
        edgePercent: edgePct,
        edgeScore: score,
        signal,
        relativeVolume: rv,
        rsi,
        sma20: sma20 ? Math.round(sma20 * 100) / 100 : null,
        atr: atr ? Math.round(atr * 100) / 100 : null,
        atrPercent: atrPct,
        reasons: buildReasons(ticker, cp, edgePct, rsi, rv),
        whyWrong: buildWhyWrong(cp, edgePct, rsi),
        confidence,
        dataSource: `Finnhub (quote + ${candles.length} daily candles)`,
        maxLoss: atr ? `$${(atr * shares).toFixed(0)} on ${shares} shares (1 ATR stop)` : "Define stop manually",
        paperTradeSize: tradeValue > 0 ? `~${shares} shares ($${tradeValue.toFixed(0)} notional, $${riskDollars} max risk)` : "Too small — low price stock",
        liquidityWarning: rv != null && rv < 0.5 ? "Low volume — wide spreads likely" : null,
        isPlaceholder: false,
      };
      return r;
    })
  );

  const items: EdgeResult[] = results
    .filter(r => r.status === "fulfilled")
    .map(r => (r as PromiseFulfilledResult<EdgeResult>).value);

  const real = items.filter(i => !i.isPlaceholder);
  const isPlaceholder = real.length === 0;

  // Sort: STRONG EDGE first, then WATCH, then by score desc
  const signalOrder = { "STRONG EDGE": 0, WATCH: 1, "NO EDGE": 2, AVOID: 3 };
  real.sort((a, b) => (signalOrder[a.signal] - signalOrder[b.signal]) || (b.edgeScore - a.edgeScore));

  return NextResponse.json({
    results: real,
    summary: {
      strongEdges: real.filter(r => r.signal === "STRONG EDGE").length,
      watches: real.filter(r => r.signal === "WATCH").length,
      noEdge: real.filter(r => r.signal === "NO EDGE").length,
      avoids: real.filter(r => r.signal === "AVOID").length,
      total: real.length,
    },
    isPlaceholder,
    generatedAt: new Date().toISOString(),
  });
}

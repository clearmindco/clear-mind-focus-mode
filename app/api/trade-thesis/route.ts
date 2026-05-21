import { NextResponse } from "next/server";
import { serverGetQuote, serverGetCandles } from "@/lib/server-data";
import {
  runICTAnalysis, calcSMA, calcRSI, calcATR, calcRelativeVolume,
  type Candle,
} from "@/lib/ict-analysis";
import type { ORBData, ORBWindow } from "@/app/api/orb/route";

// ─── Sector map ───────────────────────────────────────────────────────────────

const SECTOR_MAP: Record<string, string> = {
  AAPL: "XLK", MSFT: "XLK", NVDA: "XLK", AMD: "XLK", AVGO: "XLK",
  META: "XLK", GOOGL: "XLK", GOOG: "XLK", QCOM: "XLK", MU: "XLK",
  PLTR: "XLK", SMCI: "XLK", IONQ: "XLK",
  AMZN: "XLY", TSLA: "XLY", NFLX: "XLY", SHOP: "XLY", UBER: "XLY",
  ABNB: "XLY", DIS: "XLY",
  JPM: "XLF", BAC: "XLF", GS: "XLF", MS: "XLF",
  COIN: "XLF", HOOD: "XLF", MSTR: "XLF",
  XOM: "XLE", CVX: "XLE", OXY: "XLE",
  SPY: "SPY", QQQ: "QQQ", IWM: "IWM",
};

function sectorFor(ticker: string): string {
  return SECTOR_MAP[ticker] ?? "XLK";
}

// ─── Session logic ────────────────────────────────────────────────────────────

interface SessionInfo {
  name: string;
  note: string;
  isLunch: boolean;
  quality: "prime" | "good" | "caution" | "avoid";
}

function getSessionInfo(): SessionInfo {
  const now = new Date();
  const m = now.getUTCMonth();
  const isEDT = m >= 2 && m <= 9;
  const utcH = now.getUTCHours() + now.getUTCMinutes() / 60;
  const openUTC = isEDT ? 13.5 : 14.5;

  const etDecimal = utcH - (isEDT ? 4 : 5);
  const etHour = ((etDecimal % 24) + 24) % 24;

  if (etHour >= 9.5 && etHour < 11) {
    return { name: "New York Open (Prime)", note: "Best ORB window — institutional order flow at peak. Highest probability for ORB setups.", isLunch: false, quality: "prime" };
  }
  if (etHour >= 11 && etHour < 12) {
    return { name: "New York Mid-Morning", note: "ORB move often extending or reversing. Watch for VWAP reclaims.", isLunch: false, quality: "good" };
  }
  if (etHour >= 12 && etHour < 13.5) {
    return { name: "Lunch / Low Liquidity ⚠", note: "Noon–1:30 PM ET is the lowest liquidity window. Choppy price action, higher false breakout risk. Reduce size or wait.", isLunch: true, quality: "caution" };
  }
  if (etHour >= 13.5 && etHour < 15.5) {
    return { name: "New York Afternoon", note: "Afternoon continuation or reversal window. Watch for power hour setups after 3 PM ET.", isLunch: false, quality: "good" };
  }
  if (etHour >= 15.5 && etHour < 16) {
    return { name: "Power Hour (3:30–4 PM ET)", note: "Final 30 minutes — institutional repositioning. High volatility, strong directional moves.", isLunch: false, quality: "prime" };
  }
  if (utcH >= 7 && utcH < openUTC) {
    return { name: "London Session / Pre-Market", note: "London liquidity raids often set up the NY open direction. Watch for equal high/low sweeps.", isLunch: false, quality: "caution" };
  }
  if (utcH >= 0 && utcH < 7) {
    return { name: "Asian Session", note: "Accumulation — tight ranges, possible fake breakouts. Not recommended for ORB setups.", isLunch: false, quality: "avoid" };
  }
  return { name: "After Hours", note: "Low liquidity, price action unreliable for setup analysis.", isLunch: false, quality: "avoid" };
}

// ─── ORB detection (server-side duplicate, avoids cross-route call) ────────────

function todayOpenTs(): number {
  const now = new Date();
  const m = now.getUTCMonth();
  const isEDT = m >= 2 && m <= 9;
  return Math.floor(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), isEDT ? 13 : 14, 30, 0) / 1000
  );
}

function detectORB(sessionCandles: Candle[], window: ORBWindow): Omit<ORBData, "symbol" | "marketOpen" | "message"> {
  const candleCount = window / 5;
  const orbC = sessionCandles.slice(0, candleCount);
  const postC = sessionCandles.slice(candleCount);

  const orbHigh = Math.max(...orbC.map(c => c.high));
  const orbLow = Math.min(...orbC.map(c => c.low));
  const orbRange = orbHigh - orbLow;
  const avgVol = orbC.reduce((s, c) => s + c.volume, 0) / orbC.length;

  let brkDir: ORBData["breakoutDirection"] = "none";
  let brkPrice: number | null = null;
  let brkVolRatio: number | null = null;
  let retest = false;
  let retestLevel: number | null = null;

  for (const c of postC) {
    if (brkDir === "none") {
      if (c.close > orbHigh) { brkDir = "long"; brkPrice = c.close; brkVolRatio = avgVol > 0 ? c.volume / avgVol : null; }
      else if (c.close < orbLow) { brkDir = "short"; brkPrice = c.close; brkVolRatio = avgVol > 0 ? c.volume / avgVol : null; }
    } else if (!retest) {
      const tol = orbRange * 0.25;
      if (brkDir === "long" && c.low <= orbHigh + tol && c.close > orbHigh) { retest = true; retestLevel = orbHigh; }
      if (brkDir === "short" && c.high >= orbLow - tol && c.close < orbLow) { retest = true; retestLevel = orbLow; }
    }
  }

  const cur = sessionCandles[sessionCandles.length - 1];
  const currentPrice = cur.close;
  const priceVsORB: ORBData["priceVsORB"] = currentPrice > orbHigh ? "above" : currentPrice < orbLow ? "below" : "inside";
  const brkStr: ORBData["breakoutStrength"] = brkVolRatio == null ? "none" : brkVolRatio >= 2 ? "strong" : brkVolRatio >= 1.3 ? "moderate" : "weak";

  return {
    valid: orbC.length >= 1,
    window,
    orbHigh: Math.round(orbHigh * 100) / 100,
    orbLow: Math.round(orbLow * 100) / 100,
    orbRange: Math.round(orbRange * 100) / 100,
    orbMidpoint: Math.round(((orbHigh + orbLow) / 2) * 100) / 100,
    breakoutDirection: brkDir,
    breakoutPrice: brkPrice ? Math.round(brkPrice * 100) / 100 : null,
    breakoutStrength: brkStr,
    retestConfirmed: retest,
    retestLevel: retestLevel ? Math.round(retestLevel * 100) / 100 : null,
    currentPrice: Math.round(currentPrice * 100) / 100,
    priceVsORB,
    breakoutVolRatio: brkVolRatio ? Math.round(brkVolRatio * 10) / 10 : null,
    avgVolume: Math.round(avgVol),
    candlesAnalyzed: sessionCandles.length,
  };
}

// ─── Confidence scoring ───────────────────────────────────────────────────────

interface ScoreBucket {
  orbStructure: number;     // 0-20
  marketStructure: number;  // 0-15
  volumeConfirmation: number; // 0-15
  spyQqqContext: number;    // 0-10
  sectorLeadership: number; // 0-10
  liquidityConfluence: number; // 0-10
  ictConfluence: number;    // 0-10
  macroRisk: number;        // 0-10
}

export interface TradeThesis {
  ticker: string;
  decision: "ELITE LONG" | "ELITE SHORT" | "STRONG LONG" | "STRONG SHORT" | "WATCHLIST LONG" | "WATCHLIST SHORT" | "NO TRADE";
  direction: "long" | "short" | null;
  confidence: number;
  confidenceLabel: "Elite Setup" | "Strong Setup" | "Watchlist Only" | "No Trade";
  scoring: ScoreBucket;
  orb: ReturnType<typeof detectORB> | null;
  entry: number | null;
  entryZone: [number, number] | null;
  stop: number | null;
  target1: number | null;
  target2: number | null;
  rrRatio: number | null;
  riskAmount: number | null;
  rewardAmount: number | null;
  thesis: {
    marketContext: string[];
    structure: string[];
    volume: string[];
    session: SessionInfo;
    liquidity: string[];
    ictConfluence: string[];
  };
  whyCouldFail: string[];
  invalidation: string;
  paperTradeSize: string;
  currentPrice: number;
  spyChangePercent: number | null;
  qqqChangePercent: number | null;
  sectorChangePercent: number | null;
  sectorSymbol: string;
  rsi: number | null;
  sma20: number | null;
  relativeVolume: number | null;
  atr: number | null;
  isPlaceholder: boolean;
  generatedAt: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get("symbol") ?? "SPY").trim().toUpperCase().slice(0, 8);
  const rawWindow = parseInt(searchParams.get("orbWindow") ?? "15", 10);
  const orbWindow: ORBWindow = ([5, 15, 30] as number[]).includes(rawWindow)
    ? (rawWindow as ORBWindow) : 15;

  const sectorSym = sectorFor(symbol);
  const nowTs = Math.floor(Date.now() / 1000);
  const dayFromTs = nowTs - 60 * 86400;
  const openTs = todayOpenTs();

  // Fetch all data in parallel
  const [tickerQuote, spyQuote, qqqQuote, sectorQuote, dailyCandles, intradayCandles] =
    await Promise.all([
      serverGetQuote(symbol),
      serverGetQuote("SPY"),
      serverGetQuote("QQQ"),
      serverGetQuote(sectorSym),
      serverGetCandles(symbol, "D", dayFromTs, nowTs),
      serverGetCandles(symbol, "5", openTs - 300, nowTs), // extra 5m buffer
    ]);

  if (tickerQuote.isPlaceholder) {
    return NextResponse.json({ isPlaceholder: true, ticker: symbol, message: "No data — configure FINNHUB_API_KEY" });
  }

  const currentPrice = tickerQuote.price ?? 0;
  const spyPct = spyQuote.changePercent;
  const qqqPct = qqqQuote.changePercent;
  const sectorPct = sectorQuote.changePercent;

  // ICT daily analysis
  const ict = dailyCandles.length >= 10
    ? runICTAnalysis(symbol, dailyCandles, "D")
    : null;

  const sma20 = dailyCandles.length >= 20 ? calcSMA(dailyCandles, 20) : null;
  const rsi = dailyCandles.length >= 15 ? calcRSI(dailyCandles, 14) : null;
  const atr = dailyCandles.length >= 5 ? calcATR(dailyCandles, 14) : null;
  const relVol = dailyCandles.length >= 5 ? calcRelativeVolume(dailyCandles, 20) : null;

  // ORB detection
  const sessionC = intradayCandles.filter(c => c.time >= openTs).sort((a, b) => a.time - b.time);
  const orb = sessionC.length >= orbWindow / 5 + 1 ? detectORB(sessionC, orbWindow) : null;

  const session = getSessionInfo();

  // ─── Score each factor ───────────────────────────────────────────────────────

  const dir: "long" | "short" | null =
    orb?.breakoutDirection === "long" ? "long"
    : orb?.breakoutDirection === "short" ? "short"
    : null;

  // 1. ORB structure (0-20)
  let orbScore = 0;
  if (orb?.valid) {
    if (orb.breakoutDirection !== "none") orbScore += 10;
    if (orb.breakoutStrength === "strong") orbScore += 5;
    else if (orb.breakoutStrength === "moderate") orbScore += 3;
    if (orb.retestConfirmed) orbScore += 5;
  }

  // 2. Market structure (0-15)
  let structureScore = 7;
  if (ict) {
    if (ict.marketStructure.trend === "Uptrend" && dir === "long") structureScore = 14;
    else if (ict.marketStructure.trend === "Downtrend" && dir === "short") structureScore = 14;
    else if (ict.marketStructure.trend === "Ranging") structureScore = 6;
    else structureScore = 4; // counter-trend
    if (sma20 && currentPrice > sma20 * 1.001 && dir === "long") structureScore = Math.min(15, structureScore + 1);
    if (sma20 && currentPrice < sma20 * 0.999 && dir === "short") structureScore = Math.min(15, structureScore + 1);
  }

  // 3. Volume confirmation (0-15)
  let volScore = 5;
  if (relVol != null) {
    if (relVol >= 2.5) volScore = 15;
    else if (relVol >= 2.0) volScore = 12;
    else if (relVol >= 1.5) volScore = 9;
    else if (relVol >= 1.0) volScore = 6;
    else volScore = 3;
  }
  if (orb?.breakoutVolRatio != null) {
    if (orb.breakoutVolRatio >= 2) volScore = Math.min(15, volScore + 3);
    else if (orb.breakoutVolRatio < 1) volScore = Math.max(0, volScore - 3);
  }

  // 4. SPY/QQQ context (0-10)
  let spyScore = 5;
  if (spyPct != null && qqqPct != null) {
    const bothPos = spyPct > 0 && qqqPct > 0;
    const bothNeg = spyPct < 0 && qqqPct < 0;
    if (dir === "long" && bothPos) spyScore = 10;
    else if (dir === "short" && bothNeg) spyScore = 10;
    else if (dir === "long" && spyPct > 0) spyScore = 7;
    else if (dir === "short" && spyPct < 0) spyScore = 7;
    else if (dir === "long" && spyPct < -0.5) spyScore = 2;
    else if (dir === "short" && spyPct > 0.5) spyScore = 2;
  }

  // 5. Sector leadership (0-10)
  let sectorScore = 5;
  if (sectorPct != null) {
    if (dir === "long" && sectorPct > 0.5) sectorScore = 10;
    else if (dir === "short" && sectorPct < -0.5) sectorScore = 10;
    else if (dir === "long" && sectorPct > 0) sectorScore = 7;
    else if (dir === "short" && sectorPct < 0) sectorScore = 7;
    else sectorScore = 3;
  }

  // 6. Liquidity confluence (0-10)
  let liqScore = 3;
  if (ict) {
    const hasSweep = ict.liquiditySweeps.some(s => s.type === (dir === "long" ? "bullish" : "bearish"));
    if (hasSweep) liqScore += 5;
    const hasBreaker = ict.breakerBlocks.some(b => b.type === (dir === "long" ? "bullish" : "bearish"));
    if (hasBreaker) liqScore += 2;
  }
  liqScore = Math.min(10, liqScore);

  // 7. ICT confluence (0-10)
  let ictScore = 2;
  if (ict) {
    const eq = ict.equilibrium;
    if (dir === "long" && eq.zone === "discount") ictScore += 3;
    if (dir === "short" && eq.zone === "premium") ictScore += 3;
    const hasBullFVG = ict.fvgs.some(f => f.type === "bullish" && f.status !== "fully_filled");
    const hasBearFVG = ict.fvgs.some(f => f.type === "bearish" && f.status !== "fully_filled");
    if (dir === "long" && hasBullFVG) ictScore += 3;
    if (dir === "short" && hasBearFVG) ictScore += 3;
    const hasOB = ict.orderBlocks.some(o => o.type === (dir === "long" ? "bullish" : "bearish"));
    if (hasOB) ictScore += 2;
  }
  ictScore = Math.min(10, ictScore);

  // 8. Macro / session risk (0-10)
  let macroScore = 7;
  if (session.quality === "avoid") macroScore = 1;
  else if (session.quality === "caution") macroScore = 4;
  else if (session.quality === "prime") macroScore = 9;
  if (session.isLunch) macroScore = Math.min(macroScore, 3);
  if (spyPct != null && Math.abs(spyPct) > 1.5) macroScore = Math.max(2, macroScore - 3); // volatile macro day

  const scoring: ScoreBucket = {
    orbStructure: orbScore,
    marketStructure: structureScore,
    volumeConfirmation: Math.min(15, volScore),
    spyQqqContext: spyScore,
    sectorLeadership: sectorScore,
    liquidityConfluence: liqScore,
    ictConfluence: ictScore,
    macroRisk: macroScore,
  };

  const confidence = Math.min(99, Math.max(5,
    orbScore + structureScore + Math.min(15, volScore) + spyScore + sectorScore + liqScore + ictScore + macroScore
  ));

  // ─── Decision ────────────────────────────────────────────────────────────────

  const confLabel: TradeThesis["confidenceLabel"] =
    confidence >= 85 ? "Elite Setup"
    : confidence >= 70 ? "Strong Setup"
    : confidence >= 55 ? "Watchlist Only"
    : "No Trade";

  let decision: TradeThesis["decision"] = "NO TRADE";
  if (dir && confidence >= 85) decision = dir === "long" ? "ELITE LONG" : "ELITE SHORT";
  else if (dir && confidence >= 70) decision = dir === "long" ? "STRONG LONG" : "STRONG SHORT";
  else if (dir && confidence >= 55) decision = dir === "long" ? "WATCHLIST LONG" : "WATCHLIST SHORT";

  // ─── Risk Box ─────────────────────────────────────────────────────────────────

  let entry: number | null = null;
  let entryZone: [number, number] | null = null;
  let stop: number | null = null;
  let target1: number | null = null;
  let target2: number | null = null;

  if (orb?.valid && dir) {
    const atrVal = atr ?? orb.orbRange;
    if (dir === "long") {
      entry = orb.retestConfirmed && orb.retestLevel ? Math.round((orb.retestLevel * 1.001) * 100) / 100 : orb.orbHigh;
      entryZone = [orb.orbHigh, Math.round(orb.orbHigh * 1.003 * 100) / 100];
      stop = Math.round((orb.orbLow - atrVal * 0.1) * 100) / 100;
      target1 = Math.round((entry + orb.orbRange) * 100) / 100;
      target2 = Math.round((entry + orb.orbRange * 2) * 100) / 100;
    } else {
      entry = orb.retestConfirmed && orb.retestLevel ? Math.round((orb.retestLevel * 0.999) * 100) / 100 : orb.orbLow;
      entryZone = [Math.round(orb.orbLow * 0.997 * 100) / 100, orb.orbLow];
      stop = Math.round((orb.orbHigh + atrVal * 0.1) * 100) / 100;
      target1 = Math.round((entry - orb.orbRange) * 100) / 100;
      target2 = Math.round((entry - orb.orbRange * 2) * 100) / 100;
    }
  }

  const riskAmount = entry && stop ? Math.abs(entry - stop) : null;
  const rewardAmount = entry && target1 ? Math.abs(target1 - entry) : null;
  const rrRatio = riskAmount && rewardAmount && riskAmount > 0
    ? Math.round((rewardAmount / riskAmount) * 10) / 10 : null;

  const paperShares = riskAmount && riskAmount > 0 ? Math.floor(200 / riskAmount) : 0;
  const paperTradeSize = entry && paperShares > 0
    ? `${paperShares} shares (~$${(paperShares * entry).toFixed(0)} notional, $200 max risk on $10k paper account)`
    : "Too small — define stop manually";

  // ─── Thesis text (100% rule-based) ───────────────────────────────────────────

  const marketContext: string[] = [];
  if (spyPct != null) marketContext.push(`SPY ${spyPct > 0 ? "+" : ""}${spyPct.toFixed(2)}% — ${spyPct > 0.3 ? "supportive" : spyPct < -0.3 ? "headwind" : "neutral"}`);
  if (qqqPct != null) marketContext.push(`QQQ ${qqqPct > 0 ? "+" : ""}${qqqPct.toFixed(2)}% — ${qqqPct > 0.3 ? "tech leading" : qqqPct < -0.3 ? "tech lagging" : "neutral"}`);
  if (sectorPct != null) marketContext.push(`${sectorSym} sector ${sectorPct > 0 ? "+" : ""}${sectorPct.toFixed(2)}% — ${sectorPct > 0.3 ? "confirming" : sectorPct < -0.3 ? "not confirming" : "neutral"}`);

  const structure: string[] = [];
  if (ict) {
    structure.push(`Daily trend: ${ict.marketStructure.trend}`);
    if (ict.marketStructure.lastHigh) structure.push(`Last swing high: $${ict.marketStructure.lastHigh.toFixed(2)}`);
    if (ict.marketStructure.lastLow) structure.push(`Last swing low: $${ict.marketStructure.lastLow.toFixed(2)}`);
    if (ict.marketStructure.mssDetected) structure.push("Market structure shift detected (bullish reversal signal)");
    if (ict.marketStructure.bosDetected) structure.push("Break of structure detected");
    if (sma20) structure.push(`Price ${currentPrice > sma20 ? "above" : "below"} 20-day SMA ($${sma20.toFixed(2)})`);
    if (rsi) structure.push(`RSI-14: ${rsi.toFixed(0)} — ${rsi < 30 ? "oversold" : rsi > 70 ? "overbought" : rsi < 45 ? "bearish lean" : rsi > 55 ? "bullish lean" : "neutral"}`);
    structure.push(`Equilibrium zone: ${ict.equilibrium.zone} (${ict.equilibrium.percentFromEQ > 0 ? "+" : ""}${ict.equilibrium.percentFromEQ.toFixed(1)}% from midpoint)`);
  }

  const volume: string[] = [];
  if (relVol != null) {
    volume.push(`Relative volume: ${relVol.toFixed(1)}x daily average — ${relVol >= 2 ? "strong expansion" : relVol >= 1.3 ? "above average" : relVol < 0.8 ? "below average (caution)" : "average"}`);
  }
  if (orb?.breakoutVolRatio != null) {
    volume.push(`Breakout candle volume: ${orb.breakoutVolRatio.toFixed(1)}x ORB average — ${orb.breakoutVolRatio >= 2 ? "confirmed" : orb.breakoutVolRatio >= 1.3 ? "moderate" : "weak (caution)"}`);
  }

  const liquidity: string[] = [];
  if (ict) {
    ict.liquiditySweeps.forEach(s => liquidity.push(s.description));
    if (!ict.liquiditySweeps.length) liquidity.push("No recent liquidity sweeps detected on daily timeframe");
  }

  const ictConf: string[] = [];
  if (ict) {
    const eq = ict.equilibrium;
    ictConf.push(`EQ: ${eq.zone.toUpperCase()} zone — ${eq.zone === "discount" ? "favorable long entry zone" : eq.zone === "premium" ? "extended, short favorable" : "near midpoint"}`);
    ict.fvgs.slice(0, 2).forEach(f => ictConf.push(`${f.type} FVG at $${f.bottom.toFixed(2)}–$${f.top.toFixed(2)} (${f.status.replace("_", " ")})`));
    ict.orderBlocks.slice(0, 1).forEach(ob => ictConf.push(`${ob.type} order block: $${ob.bottom.toFixed(2)}–$${ob.top.toFixed(2)}, strength ${ob.strengthScore}/100`));
    if (ict.confluenceFactors.length) ictConf.push(...ict.confluenceFactors.slice(0, 2));
  }

  const whyCouldFail: string[] = [];
  if (session.isLunch) whyCouldFail.push("Lunch session — low liquidity increases false breakout risk");
  if (orb && orb.breakoutStrength === "weak") whyCouldFail.push("Breakout volume was below average — may be a false breakout");
  if (!orb?.retestConfirmed && dir) whyCouldFail.push("No retest confirmation yet — price has not proven the breakout level as support/resistance");
  if (spyPct != null && spyPct < -0.5 && dir === "long") whyCouldFail.push(`SPY weak (${spyPct.toFixed(2)}%) — headwind against long thesis`);
  if (rsi && rsi > 65 && dir === "long") whyCouldFail.push(`RSI overbought (${rsi.toFixed(0)}) — mean reversion risk`);
  if (ict?.equilibrium.zone === "premium" && dir === "long") whyCouldFail.push("Price in premium zone — extended above historical equilibrium");
  if (ict?.marketStructure.trend === "Downtrend" && dir === "long") whyCouldFail.push("Counter-trend long — daily structure is in a downtrend");
  whyCouldFail.push("No technical setup guarantees directional follow-through — always use a defined stop");
  if (!whyCouldFail.length) whyCouldFail.push("Insufficient data for risk assessment — paper trade only");

  const invalidation = stop
    ? `Close ${dir === "long" ? "below" : "above"} $${stop.toFixed(2)} invalidates thesis`
    : "Define stop based on ORB low/high before entry";

  const thesis: TradeThesis = {
    ticker: symbol,
    decision,
    direction: dir,
    confidence,
    confidenceLabel: confLabel,
    scoring,
    orb: orb ?? null,
    entry,
    entryZone,
    stop,
    target1,
    target2,
    rrRatio,
    riskAmount: riskAmount ? Math.round(riskAmount * 100) / 100 : null,
    rewardAmount: rewardAmount ? Math.round(rewardAmount * 100) / 100 : null,
    thesis: { marketContext, structure, volume, session, liquidity, ictConfluence: ictConf },
    whyCouldFail,
    invalidation,
    paperTradeSize,
    currentPrice: Math.round(currentPrice * 100) / 100,
    spyChangePercent: spyPct,
    qqqChangePercent: qqqPct,
    sectorChangePercent: sectorPct,
    sectorSymbol: sectorSym,
    rsi: rsi ? Math.round(rsi * 10) / 10 : null,
    sma20: sma20 ? Math.round(sma20 * 100) / 100 : null,
    relativeVolume: relVol ? Math.round(relVol * 10) / 10 : null,
    atr: atr ? Math.round(atr * 100) / 100 : null,
    isPlaceholder: false,
    generatedAt: new Date().toISOString(),
  };

  return NextResponse.json(thesis);
}

/**
 * /api/signal?ticker=SPY
 *
 * EDGE Signal Engine — 7-factor 0-100 rule-based educational signal.
 * NOT financial advice. NOT AI-generated. All output is clearly labelled as
 * educational decision-support. Signals must be confirmed by the user's own
 * analysis before any action is taken.
 */

import { type NextRequest, NextResponse } from "next/server";
import { serverGetQuote, serverGetCompanyNews } from "@/lib/server-data";
import type { QuoteData, SignalData, ScoreBreakdown } from "@/lib/data-providers";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return `$${n.toFixed(2)}`;
}

function fmtRange(lo: number, hi: number): string {
  return `${fmt(lo)}–${fmt(hi)}`;
}

// ─── Natural language analysis text ──────────────────────────────────────────

function generateAnalysisText(
  ticker: string,
  status: SignalData["status"],
  score: number,
  breakdown: ScoreBreakdown[],
): string {
  const f1 = breakdown.find(b => b.factor === "Trend Strength");
  const f2 = breakdown.find(b => b.factor === "VWAP Alignment");
  const f3 = breakdown.find(b => b.factor === "Momentum / Range Position");
  const f5 = breakdown.find(b => b.factor === "Market Context / Gap");

  const pct = (b: ScoreBreakdown) => Math.round((b.score / b.max) * 100);

  if (status === "Strong Bullish Watch") {
    return (
      `${ticker} is printing a strongly constructive setup today with a composite score of ${score}/100. ` +
      (f1 ? f1.description + ". " : "") +
      (f2 && pct(f2) >= 70 ? "Price is holding comfortably above approximate VWAP, confirming institutional buyers have the intraday edge. " : "") +
      (f3 && pct(f3) >= 70 ? "The range position confirms buyers are defending levels near the session high. " : "") +
      (f5 && pct(f5) >= 70 ? "Opening gap structure adds further bullish context. " : "") +
      "This is a strong watch signal — not a buy order. Always confirm with your own chart analysis, set a hard stop loss, and complete the pre-trade checklist before considering any paper trade. Never risk more than you can afford to lose."
    );
  }
  if (status === "Bullish Watch") {
    return (
      `${ticker} is showing constructive price action today with a composite score of ${score}/100. ` +
      (f1 ? f1.description + ". " : "") +
      (f2 && pct(f2) >= 60
        ? "Price structure vs approximate VWAP supports a cautiously bullish intraday bias. "
        : "VWAP alignment is mixed — watch for price to hold above VWAP on any dip. ") +
      "The setup suggests conditions that are more favourable for upside than downside, but the signal is not strong enough to be high-conviction without additional confluence from your own analysis. This is an educational watch signal only — paper trade first."
    );
  }
  if (status === "Wait") {
    return (
      `${ticker} is showing mixed or inconclusive price action with a composite score of ${score}/100. ` +
      (f1 ? f1.description + ". " : "") +
      "VWAP position and range structure show no decisive directional edge right now. " +
      "Sitting out and waiting for a lower-risk, higher-conviction setup is often the more disciplined — and more profitable — decision. Avoid forcing a trade on ambiguous conditions. This signal will update as the session develops."
    );
  }
  if (status === "Bearish Warning") {
    return (
      `${ticker} is showing negative price action today with a composite score of ${score}/100. ` +
      (f1 ? f1.description + ". " : "") +
      (f2 && pct(f2) <= 40 ? "Price is trading below approximate VWAP, indicating sellers have the intraday edge. " : "") +
      "This is an educational caution signal — not a short recommendation. Price could reverse at any time on a positive catalyst. If you hold a long position, review your stop levels. Never short based on this signal alone without a complete setup definition."
    );
  }
  // Strong Bearish Warning
  return (
    `${ticker} is printing a strongly negative setup today with a composite score of ${score}/100. ` +
    (f1 ? f1.description + ". " : "") +
    (f2 && pct(f2) <= 30 ? "Price is well below approximate VWAP — institutional sellers appear to be in control intraday. " : "") +
    (f3 && pct(f3) <= 30 ? "Range position near the session low confirms sustained selling pressure throughout the day. " : "") +
    "This is an educational warning signal — not a sell or short instruction. Could reverse sharply on any positive catalyst or support reclaim. Always define your risk before any trade. Paper trade first."
  );
}

// ─── 7-Factor Scoring Engine ──────────────────────────────────────────────────

function scoreSignal(quote: QuoteData, newsCount: number): SignalData {
  const { ticker } = quote;

  if (quote.isPlaceholder) {
    return {
      ticker,
      status: "Wait",
      score: 50,
      trendBias: "Neutral",
      scoreBreakdown: [],
      analysisText:
        "Live price data is not available. Add FINNHUB_API_KEY in your Netlify environment variables to see real signal analysis.",
      confirms: [],
      invalidates: [],
      riskLevel: "Low",
      entryZone: null,
      stopLevel: null,
      target1: null,
      target2: null,
      riskWarning: "Educational placeholder. Not real analysis.",
      isPlaceholder: true,
    };
  }

  const breakdown: ScoreBreakdown[] = [];

  // ── F1: Trend Strength (0-20) — daily change % ───────────────────────────
  const chg = quote.changePercent ?? 0;
  let f1: number;
  let f1Desc: string;
  if (chg > 3.5)        { f1 = 20; f1Desc = `Very strong upside momentum: +${chg.toFixed(2)}% today`; }
  else if (chg > 2.0)   { f1 = 17; f1Desc = `Strong bullish momentum: +${chg.toFixed(2)}% today`; }
  else if (chg > 1.0)   { f1 = 14; f1Desc = `Positive price action: +${chg.toFixed(2)}% today`; }
  else if (chg > 0.3)   { f1 = 11; f1Desc = `Mild upward drift: +${chg.toFixed(2)}% today`; }
  else if (chg >= -0.3) { f1 = 10; f1Desc = `Flat session: ${chg.toFixed(2)}% — no clear directional bias`; }
  else if (chg > -1.0)  { f1 = 8;  f1Desc = `Mild downward drift: ${chg.toFixed(2)}% today`; }
  else if (chg > -2.0)  { f1 = 5;  f1Desc = `Negative price action: ${chg.toFixed(2)}% today`; }
  else if (chg > -3.5)  { f1 = 3;  f1Desc = `Strong bearish momentum: ${chg.toFixed(2)}% today`; }
  else                   { f1 = 1;  f1Desc = `Extreme downside pressure: ${chg.toFixed(2)}% today`; }
  breakdown.push({ factor: "Trend Strength", score: f1, max: 20, description: f1Desc });

  // ── F2: VWAP Alignment (0-15) ────────────────────────────────────────────
  // Approximation: typical price = (high + low + prevClose) / 3
  let f2 = 7;
  let f2Desc = "VWAP data unavailable — defaulting to neutral";
  if (quote.high && quote.low && quote.prevClose && quote.price) {
    const approxVwap = (quote.high + quote.low + quote.prevClose) / 3;
    const vwapPct = ((quote.price - approxVwap) / approxVwap) * 100;
    if (vwapPct > 1.0)        { f2 = 15; f2Desc = `Price significantly above approx. VWAP (+${vwapPct.toFixed(2)}%) — strong institutional buying`; }
    else if (vwapPct > 0.3)   { f2 = 12; f2Desc = `Price above approx. VWAP (+${vwapPct.toFixed(2)}%) — buyers in control intraday`; }
    else if (vwapPct >= -0.3) { f2 = 8;  f2Desc = `Price near VWAP (${vwapPct.toFixed(2)}%) — contested territory, no clear edge`; }
    else if (vwapPct > -1.0)  { f2 = 4;  f2Desc = `Price below approx. VWAP (${vwapPct.toFixed(2)}%) — sellers in control intraday`; }
    else                       { f2 = 1;  f2Desc = `Price significantly below approx. VWAP (${vwapPct.toFixed(2)}%) — strong selling pressure`; }
  }
  breakdown.push({ factor: "VWAP Alignment", score: f2, max: 15, description: f2Desc });

  // ── F3: Momentum / Range Position (0-15) ────────────────────────────────
  let f3 = 7;
  let f3Desc = "Range data unavailable — defaulting to neutral";
  if (quote.high && quote.low && quote.price) {
    const range = quote.high - quote.low;
    if (range > 0) {
      const pos = (quote.price - quote.low) / range;
      const pctTop = Math.round((1 - pos) * 100);
      const pctBot = Math.round(pos * 100);
      if (pos >= 0.85)       { f3 = 15; f3Desc = `Holding near session high — in top ${pctTop}% of range, strong intraday buyers`; }
      else if (pos >= 0.70)  { f3 = 12; f3Desc = `Trading in upper third of today's range — buyers in control intraday`; }
      else if (pos >= 0.55)  { f3 = 9;  f3Desc = `Holding above range midpoint — mild bullish intraday structure`; }
      else if (pos >= 0.45)  { f3 = 8;  f3Desc = `Near the midpoint of today's range — no clear directional edge from range position`; }
      else if (pos >= 0.30)  { f3 = 5;  f3Desc = `Trading in lower half of today's range — mild bearish intraday structure`; }
      else if (pos >= 0.15)  { f3 = 3;  f3Desc = `Trading in lower quarter of today's range — sellers in control intraday`; }
      else                    { f3 = 1;  f3Desc = `Holding near session low — in bottom ${pctBot}% of range, strong intraday sellers`; }
    }
  }
  breakdown.push({ factor: "Momentum / Range Position", score: f3, max: 15, description: f3Desc });

  // ── F4: Volume Proxy / Range Structure (0-15) ────────────────────────────
  let f4 = 7;
  let f4Desc = "Range structure data unavailable — defaulting to neutral";
  if (quote.high && quote.low && quote.prevClose && quote.price) {
    const dayRangePct = ((quote.high - quote.low) / quote.prevClose) * 100;
    const range = quote.high - quote.low;
    const pos = range > 0 ? (quote.price - quote.low) / range : 0.5;
    if (dayRangePct > 2.0) {
      if (pos >= 0.70)      { f4 = 14; f4Desc = `Wide range (${dayRangePct.toFixed(1)}%) + price near high — signals strong institutional buying volume`; }
      else if (pos <= 0.30) { f4 = 2;  f4Desc = `Wide range (${dayRangePct.toFixed(1)}%) + price near low — signals strong institutional selling volume`; }
      else                   { f4 = 6;  f4Desc = `Wide range (${dayRangePct.toFixed(1)}%) with price mid-range — indecisive, two-sided volume`; }
    } else if (dayRangePct > 0.8) {
      if (pos >= 0.70)      { f4 = 11; f4Desc = `Normal range (${dayRangePct.toFixed(1)}%) + price near high — solid buying interest`; }
      else if (pos <= 0.30) { f4 = 4;  f4Desc = `Normal range (${dayRangePct.toFixed(1)}%) + price near low — consistent selling pressure`; }
      else                   { f4 = 8;  f4Desc = `Normal intraday range (${dayRangePct.toFixed(1)}%) — balanced, no extreme volume signal`; }
    } else {
      if (pos >= 0.70)      { f4 = 9;  f4Desc = `Tight range (${dayRangePct.toFixed(1)}%) + price near high — quiet accumulation`; }
      else if (pos <= 0.30) { f4 = 6;  f4Desc = `Tight range (${dayRangePct.toFixed(1)}%) + price near low — quiet distribution`; }
      else                   { f4 = 7;  f4Desc = `Low intraday range (${dayRangePct.toFixed(1)}%) — price is coiling, breakout watch`; }
    }
  }
  breakdown.push({ factor: "Volume / Range Structure", score: f4, max: 15, description: f4Desc });

  // ── F5: Market Context / Gap from close (0-15) ───────────────────────────
  let f5 = 7;
  let f5Desc = "Gap data unavailable — defaulting to neutral";
  if (quote.price && quote.prevClose && quote.prevClose > 0) {
    const gapPct = ((quote.price - quote.prevClose) / quote.prevClose) * 100;
    if (gapPct > 2.0)        { f5 = 14; f5Desc = `Significant gap up: +${gapPct.toFixed(2)}% from yesterday's close — strong bullish opening bias`; }
    else if (gapPct > 1.0)   { f5 = 11; f5Desc = `Gap up of ${gapPct.toFixed(2)}% from prior close — bullish opening context`; }
    else if (gapPct > 0.3)   { f5 = 9;  f5Desc = `Slight gap up of ${gapPct.toFixed(2)}% — mild bullish bias vs prior close`; }
    else if (gapPct >= -0.3) { f5 = 7;  f5Desc = `Opened near prior close (${gapPct.toFixed(2)}%) — neutral opening context`; }
    else if (gapPct > -1.0)  { f5 = 5;  f5Desc = `Slight gap down of ${Math.abs(gapPct).toFixed(2)}% — mild bearish bias vs prior close`; }
    else if (gapPct > -2.0)  { f5 = 3;  f5Desc = `Gap down of ${Math.abs(gapPct).toFixed(2)}% from prior close — bearish opening context`; }
    else                      { f5 = 1;  f5Desc = `Significant gap down: ${gapPct.toFixed(2)}% from yesterday's close — strong bearish opening bias`; }
  }
  breakdown.push({ factor: "Market Context / Gap", score: f5, max: 15, description: f5Desc });

  // ── F6: News Catalyst (0-10) ─────────────────────────────────────────────
  let f6: number;
  let f6Desc: string;
  if (newsCount >= 5)       { f6 = 10; f6Desc = `${newsCount} recent news articles — strong catalyst presence driving the move`; }
  else if (newsCount >= 3)  { f6 = 8;  f6Desc = `${newsCount} recent news articles — meaningful catalyst activity`; }
  else if (newsCount >= 1)  { f6 = 6;  f6Desc = `${newsCount} news article(s) — some catalyst information available`; }
  else                       { f6 = 3;  f6Desc = `No recent news — move appears technically driven with no visible fundamental catalyst`; }
  breakdown.push({ factor: "News Catalyst", score: f6, max: 10, description: f6Desc });

  // ── F7: R:R Setup Quality (0-10) — intraday volatility proxy ────────────
  let f7: number;
  let f7Desc: string;
  if (quote.high && quote.low && quote.prevClose) {
    const dayRangePct = ((quote.high - quote.low) / quote.prevClose) * 100;
    if (dayRangePct < 0.5)      { f7 = 9; f7Desc = `Very tight intraday range (${dayRangePct.toFixed(1)}%) — excellent potential R:R, minimal stop distance`; }
    else if (dayRangePct < 1.0) { f7 = 8; f7Desc = `Normal intraday range (${dayRangePct.toFixed(1)}%) — clean R:R achievable`; }
    else if (dayRangePct < 2.0) { f7 = 7; f7Desc = `Moderate intraday range (${dayRangePct.toFixed(1)}%) — wider stops required, manageable R:R`; }
    else if (dayRangePct < 3.0) { f7 = 4; f7Desc = `High intraday volatility (${dayRangePct.toFixed(1)}% range) — wider stops significantly erode R:R quality`; }
    else                         { f7 = 1; f7Desc = `Extreme intraday volatility (${dayRangePct.toFixed(1)}% range) — very poor R:R, whipsaw risk is severe`; }
  } else {
    f7 = 7;
    f7Desc = "Volatility data unavailable — defaulting to neutral";
  }
  breakdown.push({ factor: "R:R Setup Quality", score: f7, max: 10, description: f7Desc });

  // ── Total score & classification ─────────────────────────────────────────
  const totalScore = breakdown.reduce((sum, b) => sum + b.score, 0);

  let status: SignalData["status"];
  if (totalScore >= 80)      status = "Strong Bullish Watch";
  else if (totalScore >= 60) status = "Bullish Watch";
  else if (totalScore >= 40) status = "Wait";
  else if (totalScore >= 20) status = "Bearish Warning";
  else                        status = "Strong Bearish Warning";

  const trendBias: SignalData["trendBias"] =
    totalScore >= 60 ? "Bullish" :
    totalScore <= 39 ? "Bearish" : "Neutral";

  // ── Risk level matrix ─────────────────────────────────────────────────────
  let volatilityLabel: "Low" | "Medium" | "High" | "Very High" = "Medium";
  if (quote.high && quote.low && quote.prevClose) {
    const dayRangePct = ((quote.high - quote.low) / quote.prevClose) * 100;
    if (dayRangePct > 3.0)      volatilityLabel = "Very High";
    else if (dayRangePct > 2.0) volatilityLabel = "High";
    else if (dayRangePct > 0.8) volatilityLabel = "Medium";
    else                         volatilityLabel = "Low";
  }

  const riskMatrix: Record<string, Record<string, SignalData["riskLevel"]>> = {
    "Strong Bullish Watch":   { "Very High": "Very High", "High": "High",      "Medium": "Medium",    "Low": "Low"    },
    "Bullish Watch":          { "Very High": "Very High", "High": "High",      "Medium": "Medium",    "Low": "Medium" },
    "Bearish Warning":        { "Very High": "Very High", "High": "Very High", "Medium": "High",      "Low": "High"   },
    "Strong Bearish Warning": { "Very High": "Very High", "High": "Very High", "Medium": "Very High", "Low": "High"   },
    "Wait":                   { "Very High": "High",      "High": "Medium",    "Medium": "Low",       "Low": "Low"    },
  };
  const riskLevel: SignalData["riskLevel"] = riskMatrix[status]?.[volatilityLabel] ?? "Medium";

  // ── Signal levels ─────────────────────────────────────────────────────────
  let entryZone: string | null = null;
  let stopLevel: string | null = null;
  let target1: string | null = null;
  let target2: string | null = null;

  if (quote.price && quote.high && quote.low && status !== "Wait") {
    const p = quote.price;
    if (status === "Strong Bullish Watch" || status === "Bullish Watch") {
      const eLo  = p * 0.997;
      const eHi  = p * 1.001;
      const eMid = (eLo + eHi) / 2;
      const stop = quote.low * 0.997;
      const risk = eMid - stop;
      entryZone = fmtRange(eLo, eHi);
      stopLevel = fmt(stop);
      target1   = fmt(eMid + risk);
      target2   = fmt(eMid + risk * 2);
    } else {
      const eLo  = p * 0.999;
      const eHi  = p * 1.003;
      const eMid = (eLo + eHi) / 2;
      const stop = quote.high * 1.003;
      const risk = stop - eMid;
      entryZone = fmtRange(eLo, eHi);
      stopLevel = fmt(stop);
      target1   = fmt(eMid - risk);
      target2   = fmt(eMid - risk * 2);
    }
  }

  // ── Confirms / Invalidates ───────────────────────────────────────────────
  const confirms: string[] = [];
  const invalidates: string[] = [];

  if (status === "Strong Bullish Watch" || status === "Bullish Watch") {
    confirms.push(
      "Price holds its gains on any pullback — doesn't give them back to the open",
      "Volume increases on up candles, decreases on down candles",
      "Broader market (SPY) is also positive or trending up",
      "Price stays above VWAP on any dip and bounces from it"
    );
    invalidates.push(
      "Price falls below today's low — structure is broken, setup is invalidated",
      "Large volume spike on a red candle — institutional sellers stepping in",
      "Broader market (SPY) sells off sharply or breaks key support",
      "Negative news catalyst emerges for this ticker or sector"
    );
  } else if (status === "Bearish Warning" || status === "Strong Bearish Warning") {
    confirms.push(
      "Price fails to recover above VWAP on any bounce attempt",
      "Volume increases on down candles, decreases on bounces",
      "Broader market (SPY) is also negative or breaks key support",
      "Price makes new lows for the session on volume"
    );
    invalidates.push(
      "Price reclaims today's opening price and holds above it",
      "Strong bullish reversal candle with above-average volume",
      "Positive news catalyst or sector rotation into this ticker",
      "Price reclaims VWAP and holds for multiple candles"
    );
  } else {
    confirms.push(
      "Price breaks and holds above a key resistance level with volume",
      "A clear directional move forms on the 15m or 1h timeframe",
      "Volume spike in one direction signals institutional participation",
      "Broader market trend resolves in a clear direction"
    );
    invalidates.push(
      "No specific invalidation — currently in observe mode",
      "Wait for price to show its hand before committing to a direction"
    );
  }

  // ── Risk warnings ─────────────────────────────────────────────────────────
  const riskWarnings: Record<SignalData["status"], string> = {
    "Strong Bullish Watch":
      "Strong Bullish Watch means conditions look very constructive for potential upside — not a buy signal. Always confirm with your own analysis, check the broader market, set a stop loss. Paper trade first. Past momentum does not predict future returns.",
    "Bullish Watch":
      "Bullish Watch means conditions look constructive for potential upside — not a buy signal. Always confirm with your own analysis, check the broader market, and set a stop loss. Paper trade first.",
    "Bearish Warning":
      "Bearish Warning means downside momentum is present — not a short signal. Could reverse at any time. Never act on a warning without a complete setup, clearly defined risk, and a hard stop loss in place.",
    "Strong Bearish Warning":
      "Strong Bearish Warning means significant downside momentum is present — not a sell or short signal. Could reverse sharply at any time. Define your risk precisely before any trade. Paper trade first.",
    "Wait":
      "Wait means conditions are neutral or mixed. No clear edge detected from current price data. Avoid forcing a trade. Waiting for a higher-probability setup is the disciplined choice.",
  };

  const analysisText = generateAnalysisText(ticker, status, totalScore, breakdown);

  return {
    ticker,
    status,
    score: totalScore,
    trendBias,
    scoreBreakdown: breakdown,
    analysisText,
    confirms,
    invalidates,
    riskLevel,
    entryZone,
    stopLevel,
    target1,
    target2,
    riskWarning: riskWarnings[status],
    isPlaceholder: false,
  };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get("ticker")?.toUpperCase();
  if (!ticker) {
    return NextResponse.json({ error: "ticker query param required" }, { status: 400 });
  }

  const [quote, news] = await Promise.all([
    serverGetQuote(ticker),
    serverGetCompanyNews(ticker),
  ]);

  const realNewsCount = news.filter(n => !n.isPlaceholder).length;
  const signal = scoreSignal(quote, realNewsCount);

  return NextResponse.json({
    ...signal,
    quote,
    recentNews: news.filter(n => !n.isPlaceholder).slice(0, 3),
    disclaimer:
      "Educational signal only. Rule-based algorithm — not AI-generated, not financial advice. " +
      "No guarantee of accuracy or future returns. Signals are decision-support markers, not instructions. Always paper trade first.",
    generatedAt: new Date().toISOString(),
  });
}

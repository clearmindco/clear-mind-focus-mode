/**
 * /api/signal?ticker=SPY
 *
 * EDGE Signal Engine — rule-based educational momentum analysis.
 * NOT financial advice. NOT AI-generated. All output is clearly labelled as
 * educational decision-support. Signals must be confirmed by the user's own
 * analysis before any action is taken.
 */

import { type NextRequest, NextResponse } from "next/server";
import { serverGetQuote, serverGetCompanyNews } from "@/lib/server-data";
import type { QuoteData, SignalData } from "@/lib/data-providers";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return `$${n.toFixed(2)}`;
}

function fmtRange(lo: number, hi: number): string {
  return `${fmt(lo)}–${fmt(hi)}`;
}

// ─── Scoring engine ───────────────────────────────────────────────────────────

function scoreSignal(quote: QuoteData, newsCount: number): SignalData {
  const { ticker } = quote;

  if (quote.isPlaceholder) {
    return {
      ticker,
      status: "Wait",
      score: 0,
      confidence: 0,
      reasons: ["No live data — configure FINNHUB_API_KEY to enable signal scoring"],
      confirms: [],
      invalidates: [],
      riskLevel: "Low",
      beginnerExplanation:
        "Live price data is not available. Add FINNHUB_API_KEY in your Netlify environment variables to see real signal analysis.",
      entryZone: null,
      stopLevel: null,
      target1: null,
      target2: null,
      riskWarning: "Educational placeholder. Not real analysis.",
      isPlaceholder: true,
    };
  }

  let score = 0;
  const reasons: string[] = [];
  const confirms: string[] = [];
  const invalidates: string[] = [];
  let volatilityLabel: "Low" | "Medium" | "High" | "Very High" = "Medium";

  // ── Factor 1: Daily change % — primary driver (±3.0) ─────────────────────
  const chg = quote.changePercent ?? 0;
  if (chg > 3.5) {
    score += 3.0;
    reasons.push(`Very strong upside momentum: +${chg.toFixed(2)}% today`);
  } else if (chg > 2.0) {
    score += 2.5;
    reasons.push(`Strong bullish momentum: +${chg.toFixed(2)}% today`);
  } else if (chg > 1.0) {
    score += 1.5;
    reasons.push(`Positive price action: +${chg.toFixed(2)}% today`);
  } else if (chg > 0.3) {
    score += 0.75;
    reasons.push(`Mild upward drift: +${chg.toFixed(2)}% today`);
  } else if (chg >= -0.3) {
    reasons.push(`Flat session: ${chg.toFixed(2)}% — no directional edge from price change alone`);
  } else if (chg < -3.5) {
    score -= 3.0;
    reasons.push(`Extreme downside pressure: ${chg.toFixed(2)}% today`);
  } else if (chg < -2.0) {
    score -= 2.5;
    reasons.push(`Strong bearish momentum: ${chg.toFixed(2)}% today`);
  } else if (chg < -1.0) {
    score -= 1.5;
    reasons.push(`Negative price action: ${chg.toFixed(2)}% today`);
  } else {
    score -= 0.75;
    reasons.push(`Mild downward drift: ${chg.toFixed(2)}% today`);
  }

  // ── Factor 2: Range position — where in today's H/L (±1.0) ───────────────
  if (quote.high && quote.low && quote.price) {
    const range = quote.high - quote.low;
    if (range > 0) {
      const pos = (quote.price - quote.low) / range;
      const pctFromTop = Math.round((1 - pos) * 100);
      const pctFromBot = Math.round(pos * 100);
      if (pos >= 0.80) {
        score += 1.0;
        reasons.push(`Holding near session high — in top ${pctFromTop}% of range, strong intraday buyers`);
      } else if (pos >= 0.65) {
        score += 0.5;
        reasons.push(`Trading in upper third of today's range — buyers in control intraday`);
      } else if (pos >= 0.45) {
        score += 0.25;
        reasons.push(`Holding above range midpoint — mild bullish intraday structure`);
      } else if (pos <= 0.10) {
        score -= 1.0;
        reasons.push(`Holding near session low — in bottom ${pctFromBot}% of range, strong intraday sellers`);
      } else if (pos <= 0.25) {
        score -= 0.5;
        reasons.push(`Trading in lower quarter of today's range — sellers in control intraday`);
      } else {
        score -= 0.25;
        reasons.push(`Trading in lower half of today's range — mild bearish intraday structure`);
      }
    }
  }

  // ── Factor 3: Approximate VWAP relationship (±0.5) ───────────────────────
  // Approximation: typical price = (high + low + prevClose) / 3
  if (quote.high && quote.low && quote.prevClose && quote.price) {
    const approxVwap = (quote.high + quote.low + quote.prevClose) / 3;
    const vwapPct = ((quote.price - approxVwap) / approxVwap) * 100;
    if (vwapPct > 0.3) {
      score += 0.5;
      reasons.push(`Above approximate VWAP — institutional buyers have the intraday edge`);
    } else if (vwapPct < -0.3) {
      score -= 0.5;
      reasons.push(`Below approximate VWAP — sellers have the intraday edge`);
    } else {
      reasons.push(`Price near VWAP — contested territory, no clear VWAP edge`);
    }
  }

  // ── Factor 4: Intraday volatility (range %) — penalty for extremes (±0.5) ─
  if (quote.high && quote.low && quote.prevClose) {
    const dayRangePct = ((quote.high - quote.low) / quote.prevClose) * 100;
    if (dayRangePct > 3.0) {
      score -= 0.5;
      volatilityLabel = "Very High";
      reasons.push(`Extreme intraday volatility (${dayRangePct.toFixed(1)}% range today) — whipsaw risk is elevated`);
    } else if (dayRangePct > 2.0) {
      score -= 0.25;
      volatilityLabel = "High";
      reasons.push(`High intraday volatility (${dayRangePct.toFixed(1)}% range today) — wider stops required`);
    } else if (dayRangePct > 0.8) {
      volatilityLabel = "Medium";
      reasons.push(`Normal intraday volatility (${dayRangePct.toFixed(1)}% range today)`);
    } else {
      volatilityLabel = "Low";
      reasons.push(`Low intraday volatility (${dayRangePct.toFixed(1)}% range today) — price action may be choppy or slow`);
    }
  }

  // ── Factor 5: Gap from previous close (±0.75) ────────────────────────────
  if (quote.price && quote.prevClose && quote.prevClose > 0) {
    const gapPct = ((quote.price - quote.prevClose) / quote.prevClose) * 100;
    if (gapPct > 2.0) {
      score += 0.75;
      reasons.push(`Significant gap up: +${gapPct.toFixed(2)}% from yesterday's close`);
    } else if (gapPct > 1.0) {
      score += 0.5;
      reasons.push(`Gap up of ${gapPct.toFixed(2)}% from prior close — bullish opening bias`);
    } else if (gapPct < -2.0) {
      score -= 0.75;
      reasons.push(`Significant gap down: ${gapPct.toFixed(2)}% from yesterday's close`);
    } else if (gapPct < -1.0) {
      score -= 0.5;
      reasons.push(`Gap down of ${Math.abs(gapPct).toFixed(2)}% from prior close — bearish opening bias`);
    }
  }

  // ── Factor 6: News catalyst presence (±0.75) ─────────────────────────────
  if (newsCount >= 4) {
    score += 0.75;
    reasons.push(`${newsCount} recent news articles — significant catalyst activity`);
  } else if (newsCount >= 2) {
    score += 0.25;
    reasons.push(`${newsCount} recent news articles — moderate catalyst presence`);
  } else if (newsCount === 0) {
    score -= 0.25;
    reasons.push(`No recent news — move appears technically driven, no fundamental catalyst visible`);
  } else {
    reasons.push(`${newsCount} news article(s) — limited catalyst information available`);
  }

  // ── Determine status ──────────────────────────────────────────────────────
  const roundedScore = Math.round(score * 100) / 100;
  let status: SignalData["status"];
  if (score >= 2.5) status = "Bullish Watch";
  else if (score <= -2.0) status = "Bearish Warning";
  else status = "Wait";

  // ── Confidence: 35–80%, never claims certainty ────────────────────────────
  const confidence = Math.min(80, Math.max(35, Math.round(50 + Math.abs(score) * 8)));

  // ── Risk level matrix ─────────────────────────────────────────────────────
  const riskMatrix: Record<string, Record<string, SignalData["riskLevel"]>> = {
    "Bullish Watch":  { "Very High": "Very High", "High": "High",   "Medium": "Medium", "Low": "Medium" },
    "Bearish Warning":{ "Very High": "Very High", "High": "Very High", "Medium": "High", "Low": "High" },
    "Wait":           { "Very High": "High",      "High": "Medium", "Medium": "Low",    "Low": "Low"   },
  };
  const riskLevel: SignalData["riskLevel"] = riskMatrix[status]?.[volatilityLabel] ?? "Medium";

  // ── Signal levels ─────────────────────────────────────────────────────────
  let entryZone: string | null = null;
  let stopLevel: string | null = null;
  let target1: string | null = null;
  let target2: string | null = null;

  if (quote.price && quote.high && quote.low && status !== "Wait") {
    const p = quote.price;
    if (status === "Bullish Watch") {
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

  // ── Confirms / invalidates ────────────────────────────────────────────────
  if (status === "Bullish Watch") {
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
  } else if (status === "Bearish Warning") {
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

  // ── Beginner explanation ──────────────────────────────────────────────────
  let beginnerExplanation: string;
  if (status === "Bullish Watch") {
    beginnerExplanation = `${ticker} is showing constructive price action today — buyers appear to be in control based on momentum and where price sits within its daily range. This is a watch signal, not a buy order. It means conditions look set up for potential upside IF your other confluences (trend direction, VWAP, support level) also confirm. Complete the checklist below before considering any paper trade. Always set a stop loss before entering.`;
  } else if (status === "Bearish Warning") {
    beginnerExplanation = `${ticker} is showing negative price action today — sellers appear to be in control based on momentum and range position. This is an educational warning, not a sell or short signal. It means current conditions favour caution. Price could reverse at any time. If you are holding a long position, review your stop loss levels. Never short a stock based on a warning signal alone — you need a complete setup with a defined entry, stop, and target.`;
  } else {
    beginnerExplanation = `${ticker} is showing mixed or inconclusive price action right now. There is no clean directional edge visible from current data. Sitting out and waiting for a clearer, lower-risk setup is a valid — and often more profitable — trading decision. Avoid forcing trades in ambiguous conditions.`;
  }

  // ── Risk warnings ─────────────────────────────────────────────────────────
  const riskWarnings: Record<SignalData["status"], string> = {
    "Bullish Watch":
      "Bullish Watch means conditions look constructive for potential upside — not a buy signal. Always confirm with your own analysis, check the broader market, and set a stop loss. Paper trade first. Past momentum does not predict future returns.",
    "Bearish Warning":
      "Bearish Warning means downside momentum is present — not a short signal. Could reverse at any time. Never act on a warning without a complete setup, clearly defined risk, and a hard stop loss in place.",
    "Wait":
      "Wait means conditions are neutral or mixed. No clear edge detected from current price data. Avoid forcing a trade. Waiting for a higher-probability setup is the disciplined choice.",
  };

  return {
    ticker,
    status,
    score: roundedScore,
    confidence,
    reasons,
    confirms,
    invalidates,
    riskLevel,
    beginnerExplanation,
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

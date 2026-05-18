/**
 * /api/signal?ticker=SPY
 *
 * Educational signal scoring — rule-based momentum analysis.
 * NOT financial advice. Not AI-generated. Output is labelled as educational research.
 * All signals must be confirmed by the user's own analysis before any action.
 */

import { type NextRequest, NextResponse } from "next/server";
import { serverGetQuote, serverGetCompanyNews } from "@/lib/server-data";
import type { QuoteData, SignalData } from "@/lib/data-providers";

// ─── Scoring rules ────────────────────────────────────────────────────────────

function scoreSignal(quote: QuoteData, newsCount: number): SignalData {
  const { ticker } = quote;

  if (quote.isPlaceholder) {
    return {
      ticker,
      status: "WAIT",
      score: 0,
      confidence: 0,
      reasons: ["No live data — configure FINNHUB_API_KEY on the server to enable signal scoring"],
      riskWarning: "Educational placeholder. Not real analysis.",
      isPlaceholder: true,
    };
  }

  let score = 0;
  const reasons: string[] = [];

  // ── Momentum: daily change % (primary driver) ─────────────────────────────
  const chg = quote.changePercent ?? 0;
  if (chg > 2.5) {
    score += 2.5;
    reasons.push(`Strong upward momentum: +${chg.toFixed(2)}% today`);
  } else if (chg > 1.0) {
    score += 1.5;
    reasons.push(`Positive price action: +${chg.toFixed(2)}% today`);
  } else if (chg > 0) {
    score += 0.5;
    reasons.push(`Slight upward drift: +${chg.toFixed(2)}%`);
  } else if (chg < -2.5) {
    score -= 2.5;
    reasons.push(`Strong downward pressure: ${chg.toFixed(2)}% today`);
  } else if (chg < -1.0) {
    score -= 1.5;
    reasons.push(`Negative price action: ${chg.toFixed(2)}% today`);
  } else {
    score -= 0.5;
    reasons.push(`Slight downward drift: ${chg.toFixed(2)}%`);
  }

  // ── Day range position: where in today's high-low range ───────────────────
  if (quote.high && quote.low && quote.price) {
    const range = quote.high - quote.low;
    if (range > 0) {
      const posInRange = (quote.price - quote.low) / range;
      if (posInRange >= 0.75) {
        score += 0.75;
        reasons.push(`Trading in upper 25% of today's range — bullish intraday structure`);
      } else if (posInRange >= 0.5) {
        score += 0.25;
        reasons.push(`Trading in upper half of today's range`);
      } else if (posInRange <= 0.25) {
        score -= 0.75;
        reasons.push(`Trading in lower 25% of today's range — bearish intraday structure`);
      } else {
        score -= 0.25;
        reasons.push(`Trading in lower half of today's range`);
      }
    }
  }

  // ── Gap from previous close ───────────────────────────────────────────────
  if (quote.price && quote.prevClose && quote.prevClose > 0) {
    const gapPct = ((quote.price - quote.prevClose) / quote.prevClose) * 100;
    if (gapPct > 1.5) {
      score += 0.5;
      reasons.push(`Gapped up ${gapPct.toFixed(2)}% from prior close`);
    } else if (gapPct < -1.5) {
      score -= 0.5;
      reasons.push(`Gapped down ${Math.abs(gapPct).toFixed(2)}% from prior close`);
    }
  }

  // ── News catalyst presence ────────────────────────────────────────────────
  if (newsCount >= 3) {
    score += 0.5;
    reasons.push(`${newsCount} news items detected — catalyst activity present`);
  } else if (newsCount === 0) {
    reasons.push("No recent news detected — move may be technically driven");
  }

  // ── Determine status ──────────────────────────────────────────────────────
  let status: SignalData["status"];
  if (score >= 2.0) status = "BUY WATCH";
  else if (score <= -1.5) status = "AVOID";
  else status = "WAIT";

  // ── Confidence: bounded 35–80% (never claim certainty) ───────────────────
  const rawConf = 50 + Math.abs(score) * 10;
  const confidence = Math.min(80, Math.max(35, Math.round(rawConf)));

  // ── Risk warning by status ────────────────────────────────────────────────
  const riskWarnings: Record<SignalData["status"], string> = {
    "BUY WATCH":
      "BUY WATCH means conditions look constructive — not a buy signal. Always confirm with your own analysis, check the broader market trend, and set a stop loss before entering. Paper trade first.",
    WAIT:
      "WAIT means conditions are neutral or mixed. No clear edge detected in current price action. Avoid forcing a trade.",
    AVOID:
      "AVOID means downside momentum is present — not a short signal. Could reverse at any time. Never fight a trend without a solid setup and strict risk management.",
  };

  return {
    ticker,
    status,
    score: Math.round(score * 100) / 100,
    confidence,
    reasons,
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
    recentNews: news.slice(0, 3),
    disclaimer:
      "Educational signal only. Rule-based algorithm — not AI-generated, not financial advice. " +
      "No guarantee of accuracy or future returns. Always paper trade first.",
    generatedAt: new Date().toISOString(),
  });
}

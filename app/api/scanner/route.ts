import { NextResponse } from "next/server";
import { serverGetCandles, serverGetQuote } from "@/lib/server-data";
import { calcATR, calcRelativeVolume } from "@/lib/ict-analysis";

const SCANNER_UNIVERSE = [
  // Mega-cap tech
  "AAPL", "MSFT", "NVDA", "AMD", "TSLA", "META", "AMZN", "GOOGL", "NFLX", "AVGO",
  // Broad market
  "SPY", "QQQ", "IWM",
  // Momentum / high-beta
  "PLTR", "SMCI", "COIN", "MSTR", "HOOD", "IONQ", "SOFI",
  // Financials
  "JPM", "BAC", "GS",
  // Energy
  "XOM", "CVX", "OXY",
  // Semis
  "MU", "INTC", "QCOM", "TSM",
  // Other liquid
  "DIS", "UBER", "ABNB", "SHOP",
];

export interface ScannerResult {
  ticker: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  high: number | null;
  low: number | null;
  relativeVolume: number | null;
  atr: number | null;
  atrPercent: number | null;
  setupScore: "A+" | "A" | "B" | "C" | "—";
  setupReason: string;
  isPlaceholder: boolean;
}

function scoreSetup(changePercent: number | null, relVol: number | null, atrPct: number | null): ScannerResult["setupScore"] {
  if (changePercent == null) return "—";
  const absPct = Math.abs(changePercent);
  const rv = relVol ?? 1;
  const atr = atrPct ?? 0;
  if (absPct >= 5 && rv >= 2 && atr >= 4) return "A+";
  if (absPct >= 3 && rv >= 1.5) return "A";
  if (absPct >= 2 && rv >= 1.2) return "B";
  if (absPct >= 1) return "C";
  return "—";
}

function setupReason(ticker: string, cp: number | null, rv: number | null, atrPct: number | null): string {
  if (cp == null) return "No data";
  const parts: string[] = [];
  if (Math.abs(cp) >= 5) parts.push("Large intraday move");
  else if (Math.abs(cp) >= 3) parts.push("Significant move");
  else if (Math.abs(cp) >= 1.5) parts.push("Moderate move");
  if (rv != null && rv >= 2) parts.push(`High relative volume (${rv.toFixed(1)}x avg)`);
  else if (rv != null && rv >= 1.5) parts.push(`Above-avg volume (${rv.toFixed(1)}x)`);
  if (atrPct != null && atrPct >= 3) parts.push("ATR expansion — volatility spike");
  if (cp > 0) parts.push("Bullish momentum");
  else parts.push("Bearish momentum");
  return parts.join(" · ");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") ?? "gainers";
  const limit = Math.min(30, Math.max(5, parseInt(searchParams.get("limit") ?? "20", 10)));

  const toTs = Math.floor(Date.now() / 1000);
  const fromTs = toTs - 30 * 86400; // 30 days of daily candles for relative volume

  const results = await Promise.allSettled(
    SCANNER_UNIVERSE.map(async ticker => {
      const [quote, candles] = await Promise.all([
        serverGetQuote(ticker),
        serverGetCandles(ticker, "D", fromTs, toTs),
      ]);

      const rv = candles.length >= 5 ? calcRelativeVolume(candles, 20) : null;
      const atr = candles.length >= 14 ? calcATR(candles, 14) : null;
      const atrPct = atr && quote.price ? (atr / quote.price) * 100 : null;
      const score = scoreSetup(quote.changePercent, rv, atrPct);

      const result: ScannerResult = {
        ticker,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        high: quote.high,
        low: quote.low,
        relativeVolume: rv ? Math.round(rv * 10) / 10 : null,
        atr: atr ? Math.round(atr * 100) / 100 : null,
        atrPercent: atrPct ? Math.round(atrPct * 10) / 10 : null,
        setupScore: score,
        setupReason: setupReason(ticker, quote.changePercent, rv, atrPct),
        isPlaceholder: quote.isPlaceholder,
      };
      return result;
    })
  );

  let items: ScannerResult[] = results
    .filter(r => r.status === "fulfilled")
    .map(r => (r as PromiseFulfilledResult<ScannerResult>).value)
    .filter(r => !r.isPlaceholder && r.changePercent != null);

  switch (filter) {
    case "losers":
      items = items.sort((a, b) => (a.changePercent ?? 0) - (b.changePercent ?? 0));
      break;
    case "volume":
      items = items.sort((a, b) => (b.relativeVolume ?? 0) - (a.relativeVolume ?? 0));
      break;
    case "atr":
      items = items.sort((a, b) => (b.atrPercent ?? 0) - (a.atrPercent ?? 0));
      break;
    default:
      items = items.sort((a, b) => (b.changePercent ?? 0) - (a.changePercent ?? 0));
  }

  const isPlaceholder = results.every(r => r.status === "fulfilled" && (r as PromiseFulfilledResult<ScannerResult>).value.isPlaceholder);

  return NextResponse.json({
    items: items.slice(0, limit),
    filter,
    total: items.length,
    isPlaceholder,
    generatedAt: new Date().toISOString(),
  });
}

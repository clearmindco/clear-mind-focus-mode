import { NextResponse } from "next/server";
import { serverGetQuote } from "@/lib/server-data";
import type { WatchlistQuoteData } from "@/lib/data-providers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("tickers") ?? "";
  const tickers = raw
    .split(",")
    .map(t => t.trim().toUpperCase())
    .filter(t => t.length > 0 && t.length <= 8)
    .slice(0, 20);

  if (!tickers.length) {
    return NextResponse.json({ quotes: [] });
  }

  const results = await Promise.allSettled(tickers.map(t => serverGetQuote(t)));

  const quotes: WatchlistQuoteData[] = tickers.map((ticker, i) => {
    const r = results[i];
    const q = r.status === "fulfilled" ? r.value : null;
    return {
      ticker,
      price: q?.price ?? null,
      change: q?.change ?? null,
      changePercent: q?.changePercent ?? null,
      high: q?.high ?? null,
      low: q?.low ?? null,
      isPlaceholder: q?.isPlaceholder ?? true,
    };
  });

  return NextResponse.json({ quotes });
}

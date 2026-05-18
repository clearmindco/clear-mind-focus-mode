import { NextResponse } from "next/server";
import { serverGetQuote } from "@/lib/server-data";
import type { QuoteData } from "@/lib/data-providers";

const TICKERS = ["SPY", "QQQ", "IWM", "TLT", "XLE", "NVDA", "TSLA"];

export async function GET() {
  const results = await Promise.all(TICKERS.map(t => serverGetQuote(t)));
  const radar: Record<string, QuoteData> = {};
  for (const q of results) {
    radar[q.ticker] = q;
  }
  return NextResponse.json(radar);
}

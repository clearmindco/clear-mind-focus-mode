import { NextResponse } from "next/server";
import { serverGetCandles, serverGetQuote, type CandleResolution } from "@/lib/server-data";
import { runICTAnalysis } from "@/lib/ict-analysis";

const VALID_RESOLUTIONS = new Set(["D", "60", "15", "5"]);
const RESOLUTION_DAYS: Record<string, number> = { D: 90, "60": 30, "15": 10, "5": 5 };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get("symbol") ?? "SPY").trim().toUpperCase().slice(0, 8);
  const resolution = (searchParams.get("resolution") ?? "D") as CandleResolution;

  if (!VALID_RESOLUTIONS.has(resolution)) {
    return NextResponse.json({ error: "Invalid resolution" }, { status: 400 });
  }

  const days = RESOLUTION_DAYS[resolution] ?? 60;
  const toTs = Math.floor(Date.now() / 1000);
  const fromTs = toTs - days * 86400;

  const [candles, quote] = await Promise.all([
    serverGetCandles(symbol, resolution, fromTs, toTs),
    serverGetQuote(symbol),
  ]);

  if (!candles.length) {
    return NextResponse.json({
      symbol,
      resolution,
      isPlaceholder: true,
      message: "No candle data — configure FINNHUB_API_KEY or check symbol",
      analysis: null,
    });
  }

  // Use current quote price if available (more current than last candle close)
  const lastPrice = quote.price ?? candles[candles.length - 1].close;
  const candlesWithCurrentPrice = [...candles];
  if (candlesWithCurrentPrice.length) {
    candlesWithCurrentPrice[candlesWithCurrentPrice.length - 1] = {
      ...candlesWithCurrentPrice[candlesWithCurrentPrice.length - 1],
      close: lastPrice,
    };
  }

  const analysis = runICTAnalysis(symbol, candlesWithCurrentPrice, resolution);

  return NextResponse.json({ symbol, resolution, isPlaceholder: false, analysis, quote });
}

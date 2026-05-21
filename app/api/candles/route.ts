import { NextResponse } from "next/server";
import { serverGetCandles, type CandleResolution } from "@/lib/server-data";

const VALID_RESOLUTIONS = new Set(["1", "5", "15", "30", "60", "D", "W"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get("symbol") ?? "").trim().toUpperCase().slice(0, 8);
  const resolution = (searchParams.get("resolution") ?? "D") as CandleResolution;
  const days = Math.min(365, Math.max(1, parseInt(searchParams.get("days") ?? "60", 10)));

  if (!symbol || !VALID_RESOLUTIONS.has(resolution)) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const toTs = Math.floor(Date.now() / 1000);
  const fromTs = toTs - days * 86400;
  const candles = await serverGetCandles(symbol, resolution, fromTs, toTs);

  return NextResponse.json({ symbol, resolution, candles, count: candles.length });
}

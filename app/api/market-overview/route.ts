import { NextResponse } from "next/server";
import { serverGetQuote } from "@/lib/server-data";
import type { MarketInstrument } from "@/lib/data-providers";

const INSTRUMENTS: Array<{
  symbol: string;
  fetchSymbol: string;
  displaySymbol: string;
  name: string;
  isProxy: boolean;
  invertDirection?: boolean;
}> = [
  { symbol: "SPY", fetchSymbol: "SPY", displaySymbol: "SPY", name: "S&P 500", isProxy: false },
  { symbol: "QQQ", fetchSymbol: "QQQ", displaySymbol: "QQQ", name: "Nasdaq 100", isProxy: false },
  { symbol: "IWM", fetchSymbol: "IWM", displaySymbol: "IWM", name: "Russell 2000", isProxy: false },
  { symbol: "DIA", fetchSymbol: "DIA", displaySymbol: "DIA", name: "Dow Jones", isProxy: false },
  { symbol: "VIX", fetchSymbol: "VIX", displaySymbol: "^VIX", name: "Volatility (VIX)", isProxy: false },
  { symbol: "UUP", fetchSymbol: "UUP", displaySymbol: "UUP", name: "US Dollar Index (proxy)", isProxy: true },
  { symbol: "TLT", fetchSymbol: "TLT", displaySymbol: "TLT", name: "20Y Treasury (proxy, inv. yield)", isProxy: true },
  { symbol: "SHY", fetchSymbol: "SHY", displaySymbol: "SHY", name: "2Y Treasury (proxy, inv. yield)", isProxy: true },
];

function direction(changePercent: number | null): "Bullish" | "Bearish" | "Neutral" {
  if (changePercent == null) return "Neutral";
  if (changePercent > 0.2) return "Bullish";
  if (changePercent < -0.2) return "Bearish";
  return "Neutral";
}

export async function GET() {
  const quotes = await Promise.allSettled(
    INSTRUMENTS.map(inst => serverGetQuote(inst.fetchSymbol))
  );

  const instruments: MarketInstrument[] = INSTRUMENTS.map((inst, i) => {
    const result = quotes[i];
    const q = result.status === "fulfilled" ? result.value : null;
    return {
      symbol: inst.symbol,
      displaySymbol: inst.displaySymbol,
      name: inst.name,
      price: q?.price ?? null,
      change: q?.change ?? null,
      changePercent: q?.changePercent ?? null,
      direction: direction(q?.changePercent ?? null),
      isProxy: inst.isProxy,
      isPlaceholder: q?.isPlaceholder ?? true,
    };
  });

  return NextResponse.json({ instruments });
}

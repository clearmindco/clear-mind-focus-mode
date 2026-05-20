import { NextResponse } from "next/server";
import { serverGetQuote } from "@/lib/server-data";
import type { SectorPerformance } from "@/lib/data-providers";

const SECTORS = [
  { symbol: "XLK", name: "Technology" },
  { symbol: "XLF", name: "Financials" },
  { symbol: "XLE", name: "Energy" },
  { symbol: "XLY", name: "Consumer Disc." },
  { symbol: "XLI", name: "Industrials" },
  { symbol: "XLB", name: "Materials" },
  { symbol: "XLU", name: "Utilities" },
  { symbol: "XLV", name: "Health Care" },
  { symbol: "XLP", name: "Consumer Staples" },
  { symbol: "SMH", name: "Semis" },
];

export async function GET() {
  const quotes = await Promise.allSettled(SECTORS.map(s => serverGetQuote(s.symbol)));

  const sectors: SectorPerformance[] = SECTORS.map((s, i) => {
    const result = quotes[i];
    const q = result.status === "fulfilled" ? result.value : null;
    return {
      symbol: s.symbol,
      name: s.name,
      price: q?.price ?? null,
      changePercent: q?.changePercent ?? null,
      isPlaceholder: q?.isPlaceholder ?? true,
    };
  });

  // derive breadth from sector data
  const real = sectors.filter(s => !s.isPlaceholder && s.changePercent != null);
  const advancing = real.filter(s => (s.changePercent ?? 0) > 0).length;
  const declining = real.filter(s => (s.changePercent ?? 0) < 0).length;
  const total = real.length;
  const upPct = total > 0 ? advancing / total : 0;
  const breadthStatus = upPct >= 0.7 ? "STRONG" : upPct >= 0.4 ? "MIXED" : "WEAK";

  return NextResponse.json({ sectors, breadth: { advancing, declining, total, upPct, status: breadthStatus } });
}

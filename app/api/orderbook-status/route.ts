import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    available: false,
    reason: "Level 2 order book data requires a premium real-time data provider.",
    alternatives: [
      "Polygon.io — Level 2 snapshot API (paid tier)",
      "Interactive Brokers TWS API — if you have an IB account",
      "Alpaca Data API — Level 2 streaming (paid tier)",
      "TradingView — visual order book via their chart widget",
    ],
    note: "Once a provider is configured, this endpoint will return: bid depth, ask depth, spread, imbalance %, and liquidity score. Architecture is ready — only the data source connection is missing.",
    mockArchitecture: {
      fields: ["bidDepth", "askDepth", "spread", "imbalancePct", "liquidityScore", "topBids", "topAsks"],
      description: "bid/ask arrays of { price, size } at each level",
    },
  });
}

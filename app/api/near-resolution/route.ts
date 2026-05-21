import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    available: false,
    reason: "Prediction market near-resolution scanning requires a prediction market API.",
    providers: [
      {
        name: "Kalshi",
        url: "kalshi.com/api",
        notes: "US-regulated event contracts. REST API available. Markets include: Fed rate decisions, economic data, elections.",
      },
      {
        name: "Polymarket",
        url: "docs.polymarket.com",
        notes: "Decentralized prediction market on Polygon. GET /markets returns all active markets with prices.",
      },
      {
        name: "Manifold Markets",
        url: "docs.manifold.markets/api",
        notes: "Free API, play-money markets. Good for testing the architecture.",
      },
    ],
    note: "Architecture is ready. Once a provider is configured, this scanner will detect markets where: probability < 30 days to resolution, price diverges from historical base rate, volume is thin relative to resolution risk.",
    mockFields: {
      market: "string — market name/question",
      currentProb: "number — 0–1 current market probability",
      estimatedFairValue: "number — model-estimated probability",
      edgePct: "number — (fairValue - currentProb) * 100",
      daysToResolution: "number",
      volume24h: "number",
      confidence: "Low | Medium | High",
      riskWarning: "string",
    },
  });
}

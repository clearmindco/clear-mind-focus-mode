import { NextResponse } from "next/server";
import { serverGetQuote, serverGetNewsApiArticles } from "@/lib/server-data";
import type { NewsItem } from "@/lib/data-providers";

// ─── Static IPO theme data ─────────────────────────────────────────────────────

type ConnectionType = "Confirmed" | "Probable" | "Thematic Only" | "Needs Research";

interface TickerDef {
  ticker: string;
  name: string;
  relationship: string;
  sympathyScore: number;
  connectionType: ConnectionType;
  notes: string;
}

interface IpoThemeDef {
  id: string;
  name: string;
  status: string;
  description: string;
  estimatedValuation: string;
  timeline: string;
  color: string;
  icon: string;
  relatedTickers: TickerDef[];
}

const IPO_THEMES: IpoThemeDef[] = [
  {
    id: "spacex",
    name: "SpaceX / Space Economy",
    status: "Pre-IPO",
    description: "Space infrastructure, satellite internet, launch vehicles",
    estimatedValuation: "$350B+",
    timeline: "2025–2027 est.",
    color: "#00d4ff",
    icon: "🚀",
    relatedTickers: [
      { ticker: "RKLB", name: "Rocket Lab", relationship: "Direct Competitor", sympathyScore: 9, connectionType: "Confirmed", notes: "Small launch market leader — direct SpaceX competitor" },
      { ticker: "ASTS", name: "AST SpaceMobile", relationship: "Satellite Beneficiary", sympathyScore: 8, connectionType: "Confirmed", notes: "Space-based cellular network — satellite broadband expansion" },
      { ticker: "LUNR", name: "Intuitive Machines", relationship: "Moon Economy", sympathyScore: 6, connectionType: "Probable", notes: "Lunar logistics — expanding space economy" },
      { ticker: "KTOS", name: "Kratos Defense", relationship: "Aerospace Defense", sympathyScore: 7, connectionType: "Probable", notes: "Defense drones and space systems" },
      { ticker: "BA", name: "Boeing", relationship: "Legacy Competitor", sympathyScore: 5, connectionType: "Thematic Only", notes: "Legacy aerospace facing disruption" },
    ],
  },
  {
    id: "openai",
    name: "OpenAI / AI Infrastructure",
    status: "Pre-IPO",
    description: "AI models, developer platform, AGI research",
    estimatedValuation: "$300B+",
    timeline: "2026 est.",
    color: "#8b5cf6",
    icon: "🤖",
    relatedTickers: [
      { ticker: "MSFT", name: "Microsoft", relationship: "Primary Investor (49%)", sympathyScore: 10, connectionType: "Confirmed", notes: "Largest OpenAI investor — Azure AI integration" },
      { ticker: "NVDA", name: "Nvidia", relationship: "GPU Infrastructure", sympathyScore: 10, connectionType: "Confirmed", notes: "Supplies training compute — essential infrastructure" },
      { ticker: "AMD", name: "AMD", relationship: "Competing GPU", sympathyScore: 7, connectionType: "Confirmed", notes: "MI300X competing for AI training workloads" },
      { ticker: "GOOGL", name: "Alphabet", relationship: "Competitor / Investor", sympathyScore: 8, connectionType: "Confirmed", notes: "Gemini competes, also invests in Anthropic" },
      { ticker: "PLTR", name: "Palantir", relationship: "AI Platform", sympathyScore: 8, connectionType: "Thematic Only", notes: "AI deployment platform for enterprises" },
      { ticker: "META", name: "Meta", relationship: "Open Source AI", sympathyScore: 7, connectionType: "Thematic Only", notes: "Llama models compete and complement AI ecosystem" },
    ],
  },
  {
    id: "stripe",
    name: "Stripe / Fintech Payments",
    status: "Pre-IPO",
    description: "Online payment infrastructure, fintech developer platform",
    estimatedValuation: "$65B+",
    timeline: "2025–2026 est.",
    color: "#10b981",
    icon: "💳",
    relatedTickers: [
      { ticker: "BILL", name: "Bill.com", relationship: "SMB Payments", sympathyScore: 8, connectionType: "Confirmed", notes: "Similar B2B payments TAM — direct beneficiary of fintech growth" },
      { ticker: "ADYEY", name: "Adyen", relationship: "Global Competitor", sympathyScore: 9, connectionType: "Confirmed", notes: "Most comparable public company to Stripe" },
      { ticker: "SQ", name: "Block (SQ)", relationship: "Competitor / Beneficiary", sympathyScore: 8, connectionType: "Confirmed", notes: "Payment ecosystem competitor" },
      { ticker: "PYPL", name: "PayPal", relationship: "Legacy Competitor", sympathyScore: 7, connectionType: "Confirmed", notes: "Incumbent facing disruption narrative" },
      { ticker: "AFRM", name: "Affirm", relationship: "BNPL Integration", sympathyScore: 7, connectionType: "Probable", notes: "Stripe partner for buy-now-pay-later" },
      { ticker: "V", name: "Visa", relationship: "Network Partner", sympathyScore: 6, connectionType: "Thematic Only", notes: "Payment rails beneficiary" },
    ],
  },
  {
    id: "databricks",
    name: "Databricks / Data AI",
    status: "Pre-IPO",
    description: "Data lakehouse, AI/ML platform, enterprise analytics",
    estimatedValuation: "$62B+",
    timeline: "2025–2026 est.",
    color: "#f59e0b",
    icon: "📊",
    relatedTickers: [
      { ticker: "SNOW", name: "Snowflake", relationship: "Direct Competitor", sympathyScore: 9, connectionType: "Confirmed", notes: "Data cloud competitor — most comparable public company" },
      { ticker: "MDB", name: "MongoDB", relationship: "Database Ecosystem", sympathyScore: 7, connectionType: "Probable", notes: "NoSQL database used in AI data pipelines" },
      { ticker: "CRM", name: "Salesforce", relationship: "Data + AI Partner", sympathyScore: 6, connectionType: "Thematic Only", notes: "Enterprise AI deployment ecosystem" },
      { ticker: "DDOG", name: "Datadog", relationship: "Observability Ecosystem", sympathyScore: 7, connectionType: "Probable", notes: "Cloud observability for data platforms" },
      { ticker: "NET", name: "Cloudflare", relationship: "Infrastructure", sympathyScore: 6, connectionType: "Thematic Only", notes: "Edge computing for AI inference" },
    ],
  },
  {
    id: "klarna",
    name: "Klarna / BNPL",
    status: "IPO Filed",
    description: "Buy now pay later, consumer credit, checkout technology",
    estimatedValuation: "$15B+",
    timeline: "2025",
    color: "#ef4444",
    icon: "🛒",
    relatedTickers: [
      { ticker: "AFRM", name: "Affirm", relationship: "Direct Competitor", sympathyScore: 10, connectionType: "Confirmed", notes: "Most direct public BNPL competitor — will be most impacted by Klarna IPO" },
      { ticker: "UPST", name: "Upstart", relationship: "AI Lending", sympathyScore: 7, connectionType: "Probable", notes: "AI-driven consumer credit — similar risk profile" },
      { ticker: "SQ", name: "Block (SQ)", relationship: "Payments Ecosystem", sympathyScore: 7, connectionType: "Confirmed", notes: "Afterpay BNPL within Cash App ecosystem" },
      { ticker: "PYPL", name: "PayPal", relationship: "BNPL Competitor", sympathyScore: 8, connectionType: "Confirmed", notes: "Pay Later product competes directly" },
    ],
  },
];

// ─── Response types ────────────────────────────────────────────────────────────

export interface IpoTickerResult {
  ticker: string;
  name: string;
  relationship: string;
  sympathyScore: number;
  connectionType: ConnectionType;
  notes: string;
  price: number | null;
  changePercent: number | null;
  isPlaceholder: boolean;
}

export interface IpoThemeResult {
  id: string;
  name: string;
  status: string;
  description: string;
  estimatedValuation: string;
  timeline: string;
  color: string;
  icon: string;
  relatedTickers: IpoTickerResult[];
}

export interface IpoRadarResponse {
  themes: IpoThemeResult[];
  news: NewsItem[];
  lastUpdated: number;
  isPlaceholder: boolean;
}

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const themeFilter = searchParams.get("theme");

  const themes = themeFilter
    ? IPO_THEMES.filter(t => t.id === themeFilter)
    : IPO_THEMES;

  // Collect all unique tickers across the selected themes
  const allTickers = Array.from(
    new Set(themes.flatMap(theme => theme.relatedTickers.map(r => r.ticker)))
  );

  // Batch all quote fetches and news in parallel
  const [quoteResults, news] = await Promise.all([
    Promise.allSettled(allTickers.map(ticker => serverGetQuote(ticker))),
    serverGetNewsApiArticles("IPO pre-IPO technology startup"),
  ]);

  // Build a lookup map from ticker -> quote
  const quoteMap = new Map<string, { price: number | null; changePercent: number | null; isPlaceholder: boolean }>();
  allTickers.forEach((ticker, i) => {
    const result = quoteResults[i];
    if (result.status === "fulfilled") {
      quoteMap.set(ticker, {
        price: result.value.price,
        changePercent: result.value.changePercent,
        isPlaceholder: result.value.isPlaceholder,
      });
    } else {
      quoteMap.set(ticker, { price: null, changePercent: null, isPlaceholder: true });
    }
  });

  // Build enriched theme results
  const enrichedThemes: IpoThemeResult[] = themes.map(theme => ({
    id: theme.id,
    name: theme.name,
    status: theme.status,
    description: theme.description,
    estimatedValuation: theme.estimatedValuation,
    timeline: theme.timeline,
    color: theme.color,
    icon: theme.icon,
    relatedTickers: theme.relatedTickers.map(t => {
      const q = quoteMap.get(t.ticker);
      return {
        ticker: t.ticker,
        name: t.name,
        relationship: t.relationship,
        sympathyScore: t.sympathyScore,
        connectionType: t.connectionType,
        notes: t.notes,
        price: q?.price ?? null,
        changePercent: q?.changePercent ?? null,
        isPlaceholder: q?.isPlaceholder ?? true,
      };
    }),
  }));

  const anyPlaceholder = enrichedThemes.some(t =>
    t.relatedTickers.some(r => r.isPlaceholder)
  );

  const response: IpoRadarResponse = {
    themes: enrichedThemes,
    news,
    lastUpdated: Date.now(),
    isPlaceholder: anyPlaceholder,
  };

  return NextResponse.json(response);
}

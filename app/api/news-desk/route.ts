import { NextResponse } from "next/server";
import { serverGetNewsApiArticles, serverGetMarketNews } from "@/lib/server-data";
import type { NewsItem } from "@/lib/data-providers";

// ─── Category definitions ─────────────────────────────────────────────────────

type RiskLevel = "HIGH" | "MEDIUM" | "LOW";

interface DeskCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
  query: string;
  whyItMatters: string;
  bullCase: string;
  bearCase: string;
  tickers: string[];
  riskLevel: RiskLevel;
}

const DESK_CATEGORIES: DeskCategory[] = [
  {
    id: "fed",
    label: "Fed & Rates",
    icon: "🏦",
    color: "#00d4ff",
    query: "Federal Reserve interest rates monetary policy FOMC",
    whyItMatters:
      "Fed language directly controls risk-on/risk-off. Rate decisions move every asset class simultaneously. Watch for 'data dependent', 'pause', or 'restrictive' language shifts.",
    bullCase: "Pivot language = multiple expansion across growth stocks and crypto",
    bearCase: "Hawkish surprise = equity multiple compression, bond yield spike",
    tickers: ["SPY", "TLT", "QQQ", "IWM"],
    riskLevel: "HIGH",
  },
  {
    id: "macro",
    label: "Macro",
    icon: "📈",
    color: "#10b981",
    query: "GDP inflation CPI jobs report economic data unemployment",
    whyItMatters:
      "Macro data drives sector rotation. Hot CPI = defensive rotation; weak jobs = recession fear. Always check the regime before placing directional trades.",
    bullCase: "Soft landing data = sector rotation into growth and cyclicals",
    bearCase: "Stagflation data = cash and defensive sectors outperform",
    tickers: ["SPY", "GLD", "TLT", "DJT"],
    riskLevel: "HIGH",
  },
  {
    id: "earnings",
    label: "Earnings",
    icon: "💰",
    color: "#f59e0b",
    query: "earnings results revenue guidance profit quarterly beat miss",
    whyItMatters:
      "Forward guidance moves stocks more than historical results. Gap-ups and gap-downs create ORB setups the next morning. Watch the reaction, not just the number.",
    bullCase: "Guidance raise + beat = gap up, continuation setup possible",
    bearCase: "Beat but sell guidance = 'sell the news' trap — don't chase gap",
    tickers: ["NVDA", "AAPL", "MSFT", "AMZN", "META"],
    riskLevel: "MEDIUM",
  },
  {
    id: "geopolitical",
    label: "Geopolitical",
    icon: "🌍",
    color: "#ef4444",
    query: "geopolitical trade war tariffs sanctions conflict energy supply",
    whyItMatters:
      "Tariffs and sanctions create overnight supply-chain repricing. Energy, semis, and defense are most exposed. These moves are often gap events — not tradeable at open.",
    bullCase: "Ceasefire / trade deal = energy normalization, risk-on rotation",
    bearCase: "Escalation = energy spike, supply chain disruption, defense premium",
    tickers: ["XLE", "LMT", "RTX", "BOIL"],
    riskLevel: "HIGH",
  },
  {
    id: "ai",
    label: "AI & Tech",
    icon: "🤖",
    color: "#8b5cf6",
    query: "artificial intelligence OpenAI Nvidia semiconductor chips technology",
    whyItMatters:
      "AI sentiment drives the most liquid high-beta names. NVDA is now a macro indicator. Watch for regulatory headlines and compute capacity news.",
    bullCase: "New model launches, chip capacity expansion = NVDA/AMD/SMCI run",
    bearCase:
      "Regulatory crackdown, compute glut, model commoditization = multiple compression",
    tickers: ["NVDA", "AMD", "MSFT", "GOOGL", "META", "SMCI"],
    riskLevel: "MEDIUM",
  },
  {
    id: "energy",
    label: "Energy",
    icon: "⚡",
    color: "#f59e0b",
    query: "oil crude OPEC energy commodities natural gas production",
    whyItMatters:
      "Energy prices feed through to CPI and PPI. Rising oil = inflation risk = Fed hawkishness. OPEC surprises can move the whole market overnight.",
    bullCase: "Supply cut + demand growth = energy sector outperformance",
    bearCase: "Demand destruction + production increase = energy sector deflation",
    tickers: ["XLE", "XOM", "CVX", "UNG", "USO"],
    riskLevel: "MEDIUM",
  },
  {
    id: "crypto",
    label: "Crypto",
    icon: "₿",
    color: "#f59e0b",
    query: "Bitcoin Ethereum crypto digital assets blockchain regulation SEC",
    whyItMatters:
      "Crypto acts as a leading indicator for speculative risk appetite. Bitcoin dominance shifts signal altcoin rotation. Watch regulatory headlines for sector-wide repricing.",
    bullCase: "ETF approval, institutional adoption = risk-on wave across high-beta growth",
    bearCase:
      "Regulatory crackdown, exchange failure = liquidity crunch across risk assets",
    tickers: ["MSTR", "COIN", "MARA", "RIOT"],
    riskLevel: "HIGH",
  },
  {
    id: "sentiment",
    label: "Sentiment",
    icon: "🎯",
    color: "#9aa0b4",
    query: "market sentiment retail investor options flow VIX fear greed",
    whyItMatters:
      "Extreme sentiment readings (fear/greed) are contrarian indicators. VIX spikes above 30 historically mark buying opportunities. Options flow shows where smart money is positioned.",
    bullCase: "Extreme fear + VIX spike = institutional buying opportunity",
    bearCase: "Extreme greed + low VIX = complacency, vulnerable to shock",
    tickers: ["VIX", "SPY", "QQQ"],
    riskLevel: "LOW",
  },
];

// ─── Response types ───────────────────────────────────────────────────────────

interface ArticleItem {
  headline: string;
  source: string;
  datetime: string;
  summary: string;
  url: string;
  isPlaceholder: boolean;
}

interface CategoryResult {
  id: string;
  label: string;
  icon: string;
  color: string;
  whyItMatters: string;
  bullCase: string;
  bearCase: string;
  tickers: string[];
  riskLevel: RiskLevel;
  articles: ArticleItem[];
}

interface NewsDeskResponse {
  categories: CategoryResult[];
  totalArticles: number;
  lastUpdated: number;
  isPlaceholder: boolean;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(): Promise<NextResponse<NewsDeskResponse>> {
  // Fan out all category fetches + general market news in parallel
  const [marketNewsResult, ...categoryResults] = await Promise.allSettled([
    serverGetMarketNews(),
    ...DESK_CATEGORIES.map((cat) => serverGetNewsApiArticles(cat.query)),
  ]);

  const marketNews: NewsItem[] =
    marketNewsResult.status === "fulfilled" ? marketNewsResult.value : [];

  const categories: CategoryResult[] = DESK_CATEGORIES.map((cat, i) => {
    const result = categoryResults[i];
    const rawArticles: NewsItem[] =
      result.status === "fulfilled" ? result.value : [];

    // Merge market news for fed/macro categories (first 2) to enrich context
    const merged =
      cat.id === "fed" || cat.id === "macro"
        ? [...rawArticles, ...marketNews]
        : rawArticles;

    // Deduplicate by headline, cap at 3 articles
    const seen = new Set<string>();
    const articles: ArticleItem[] = [];
    for (const item of merged) {
      if (articles.length >= 3) break;
      if (seen.has(item.headline)) continue;
      seen.add(item.headline);
      articles.push({
        headline: item.headline,
        source: item.source,
        datetime: item.datetime,
        summary: item.summary,
        url: item.url,
        isPlaceholder: item.isPlaceholder,
      });
    }

    return {
      id: cat.id,
      label: cat.label,
      icon: cat.icon,
      color: cat.color,
      whyItMatters: cat.whyItMatters,
      bullCase: cat.bullCase,
      bearCase: cat.bearCase,
      tickers: cat.tickers,
      riskLevel: cat.riskLevel,
      articles,
    };
  });

  const totalArticles = categories.reduce((sum, c) => sum + c.articles.length, 0);
  const isPlaceholder = categories.every((c) =>
    c.articles.every((a) => a.isPlaceholder)
  );

  return NextResponse.json({
    categories,
    totalArticles,
    lastUpdated: Date.now(),
    isPlaceholder,
  });
}

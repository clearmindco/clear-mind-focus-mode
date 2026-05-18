/**
 * EDGE OS Data Provider Layer
 *
 * Safe fetch wrappers for all external APIs.
 * Rules:
 *  - Only NEXT_PUBLIC_* keys are used here (browser-safe, embedded at build time).
 *  - Server-only keys (OPENAI, SUPABASE_SERVICE_ROLE) are NOT used here.
 *  - If a key is missing or invalid, return clearly labeled placeholder data.
 *  - Never pretend placeholder data is live.
 *  - Never log or expose key values.
 */

// ─── Key presence checks (values inlined at build time) ──────────────────────

const _finnhubKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
const _alphaVantageKey = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;
const _newsApiKey = process.env.NEXT_PUBLIC_NEWS_API_KEY;
const _supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const _supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function isRealKey(val: string | undefined): boolean {
  return !!val && !val.startsWith("your_") && val.length > 10;
}

export function isFinnhubConnected(): boolean { return isRealKey(_finnhubKey); }
export function isAlphaVantageConnected(): boolean { return isRealKey(_alphaVantageKey); }
export function isNewsApiConnected(): boolean { return isRealKey(_newsApiKey); }
export function isSupabaseConnected(): boolean {
  return isRealKey(_supabaseUrl) && isRealKey(_supabaseAnonKey);
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QuoteData {
  ticker: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  high: number | null;
  low: number | null;
  prevClose: number | null;
  isPlaceholder: boolean;
}

export interface NewsItem {
  headline: string;
  source: string;
  datetime: string;
  summary: string;
  url: string;
  isPlaceholder: boolean;
}

export interface TechnicalData {
  ticker: string;
  rsi: number | null;
  macd: number | null;
  sma20: number | null;
  sma50: number | null;
  isPlaceholder: boolean;
}

export interface InsiderTrade {
  name: string;
  title: string;
  transactionType: "Purchase" | "Sale" | "Other";
  shares: number;
  price: number;
  value: number;
  filingDate: string;
  isPlaceholder: boolean;
}

export interface CongressionalTrade {
  representative: string;
  party: string;
  ticker: string;
  transactionType: string;
  amount: string;
  tradeDate: string;
  filingDate: string;
  isPlaceholder: boolean;
}

// ─── Placeholder values ───────────────────────────────────────────────────────

function placeholderQuote(ticker: string): QuoteData {
  return {
    ticker,
    price: null,
    change: null,
    changePercent: null,
    high: null,
    low: null,
    prevClose: null,
    isPlaceholder: true,
  };
}

const PLACEHOLDER_NEWS: NewsItem[] = [
  {
    headline: "API not connected — placeholder headline",
    source: "PLACEHOLDER",
    datetime: new Date().toISOString(),
    summary: "Set NEXT_PUBLIC_FINNHUB_API_KEY or NEXT_PUBLIC_NEWS_API_KEY in your environment to see real headlines.",
    url: "#",
    isPlaceholder: true,
  },
];

const PLACEHOLDER_TECHNICALS = (ticker: string): TechnicalData => ({
  ticker,
  rsi: null,
  macd: null,
  sma20: null,
  sma50: null,
  isPlaceholder: true,
});

const PLACEHOLDER_INSIDERS: InsiderTrade[] = [
  {
    name: "EXAMPLE EXEC — PLACEHOLDER",
    title: "CEO",
    transactionType: "Purchase",
    shares: 0,
    price: 0,
    value: 0,
    filingDate: "—",
    isPlaceholder: true,
  },
];

const PLACEHOLDER_CONGRESS: CongressionalTrade[] = [
  {
    representative: "EXAMPLE REP — PLACEHOLDER",
    party: "—",
    ticker: "—",
    transactionType: "Purchase",
    amount: "$1,001 – $15,000",
    tradeDate: "—",
    filingDate: "—",
    isPlaceholder: true,
  },
];

// ─── Data functions ───────────────────────────────────────────────────────────

export async function getQuote(ticker: string): Promise<QuoteData> {
  if (!isFinnhubConnected()) return placeholderQuote(ticker);
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${_finnhubKey}`
    );
    if (!res.ok) return placeholderQuote(ticker);
    const d = await res.json();
    return {
      ticker,
      price: d.c ?? null,
      change: d.d ?? null,
      changePercent: d.dp ?? null,
      high: d.h ?? null,
      low: d.l ?? null,
      prevClose: d.pc ?? null,
      isPlaceholder: false,
    };
  } catch {
    return placeholderQuote(ticker);
  }
}

export async function getCompanyNews(ticker: string): Promise<NewsItem[]> {
  if (!isFinnhubConnected()) return PLACEHOLDER_NEWS;
  const to = new Date().toISOString().split("T")[0];
  const from = new Date(Date.now() - 7 * 86_400_000).toISOString().split("T")[0];
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${from}&to=${to}&token=${_finnhubKey}`
    );
    if (!res.ok) return PLACEHOLDER_NEWS;
    const data = await res.json() as Array<{ headline: string; source: string; datetime: number; summary: string; url: string }>;
    if (!Array.isArray(data) || !data.length) return PLACEHOLDER_NEWS;
    return data.slice(0, 5).map(item => ({
      headline: item.headline,
      source: item.source,
      datetime: new Date(item.datetime * 1000).toISOString(),
      summary: item.summary ?? "",
      url: item.url,
      isPlaceholder: false,
    }));
  } catch {
    return PLACEHOLDER_NEWS;
  }
}

export async function getMarketNews(): Promise<NewsItem[]> {
  if (!isFinnhubConnected()) return PLACEHOLDER_NEWS;
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/news?category=general&token=${_finnhubKey}`
    );
    if (!res.ok) return PLACEHOLDER_NEWS;
    const data = await res.json() as Array<{ headline: string; source: string; datetime: number; summary: string; url: string }>;
    if (!Array.isArray(data) || !data.length) return PLACEHOLDER_NEWS;
    return data.slice(0, 10).map(item => ({
      headline: item.headline,
      source: item.source,
      datetime: new Date(item.datetime * 1000).toISOString(),
      summary: item.summary ?? "",
      url: item.url,
      isPlaceholder: false,
    }));
  } catch {
    return PLACEHOLDER_NEWS;
  }
}

export async function getTechnicalIndicators(ticker: string): Promise<TechnicalData> {
  if (!isAlphaVantageConnected()) return PLACEHOLDER_TECHNICALS(ticker);
  try {
    const res = await fetch(
      `https://www.alphavantage.co/query?function=RSI&symbol=${ticker}&interval=daily&time_period=14&series_type=close&apikey=${_alphaVantageKey}`
    );
    if (!res.ok) return PLACEHOLDER_TECHNICALS(ticker);
    const raw = await res.json() as { "Technical Analysis: RSI"?: Record<string, { RSI: string }> };
    const rsiSeries = raw["Technical Analysis: RSI"];
    const latestDate = rsiSeries ? Object.keys(rsiSeries)[0] : null;
    const rsi = latestDate ? parseFloat(rsiSeries![latestDate]["RSI"]) : null;
    return { ticker, rsi, macd: null, sma20: null, sma50: null, isPlaceholder: false };
  } catch {
    return PLACEHOLDER_TECHNICALS(ticker);
  }
}

export async function getInsiderTrades(ticker: string): Promise<InsiderTrade[]> {
  if (!isFinnhubConnected()) return PLACEHOLDER_INSIDERS;
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/stock/insider-transactions?symbol=${ticker}&token=${_finnhubKey}`
    );
    if (!res.ok) return PLACEHOLDER_INSIDERS;
    const raw = await res.json() as { data?: Array<{ name: string; share: number; transactionPrice: number; transactionDate: string; transactionCode: string }> };
    const rows = raw.data ?? [];
    if (!rows.length) return PLACEHOLDER_INSIDERS;
    return rows.slice(0, 8).map(t => ({
      name: t.name,
      title: "—",
      transactionType: t.transactionCode === "P" ? "Purchase" : t.transactionCode === "S" ? "Sale" : "Other",
      shares: t.share,
      price: t.transactionPrice,
      value: t.share * t.transactionPrice,
      filingDate: t.transactionDate,
      isPlaceholder: false,
    }));
  } catch {
    return PLACEHOLDER_INSIDERS;
  }
}

// Congressional trades: no free public API available.
// Real data: quiverquant.com (paid), capitoltrades.com (scraping), housestockwatcher.com
export async function getCongressionalTrades(_ticker?: string): Promise<CongressionalTrade[]> {
  return PLACEHOLDER_CONGRESS;
}

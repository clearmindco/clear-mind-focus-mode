/**
 * Server-only data fetching utilities.
 * Import only from API Route Handlers (app/api/*) — never from client components.
 * Uses process.env without NEXT_PUBLIC_ prefix so keys are never sent to the browser.
 */

import type { QuoteData, NewsItem, TechnicalData, InsiderTrade } from "./data-providers";

function isRealKey(val: string | undefined): boolean {
  return !!val && !val.startsWith("your_") && val.length > 10;
}

export function hasFinnhubKey(): boolean {
  return isRealKey(process.env.FINNHUB_API_KEY);
}

export function hasNewsApiKey(): boolean {
  return isRealKey(process.env.NEWSAPI_KEY);
}

export function hasAlphaVantageKey(): boolean {
  return isRealKey(process.env.ALPHA_VANTAGE_API_KEY);
}

// ─── Quote ────────────────────────────────────────────────────────────────────

function placeholderQuote(ticker: string): QuoteData {
  return { ticker, price: null, change: null, changePercent: null, high: null, low: null, prevClose: null, isPlaceholder: true };
}

export async function serverGetQuote(ticker: string): Promise<QuoteData> {
  const key = process.env.FINNHUB_API_KEY;
  if (!isRealKey(key)) return placeholderQuote(ticker);
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(ticker)}&token=${key}`,
      { next: { revalidate: 30 } }
    );
    if (!res.ok) return placeholderQuote(ticker);
    const d = await res.json() as { c?: number; d?: number; dp?: number; h?: number; l?: number; pc?: number };
    if (!d.c) return placeholderQuote(ticker);
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

// ─── Company news ─────────────────────────────────────────────────────────────

const PLACEHOLDER_NEWS: NewsItem[] = [
  {
    headline: "API not connected — configure FINNHUB_API_KEY in Netlify environment variables",
    source: "PLACEHOLDER",
    datetime: new Date().toISOString(),
    summary: "Add your Finnhub key as a server-side environment variable (no NEXT_PUBLIC_ prefix) to see real company news.",
    url: "#",
    isPlaceholder: true,
  },
];

export async function serverGetCompanyNews(ticker: string): Promise<NewsItem[]> {
  const key = process.env.FINNHUB_API_KEY;
  if (!isRealKey(key)) return PLACEHOLDER_NEWS;
  const to = new Date().toISOString().split("T")[0];
  const from = new Date(Date.now() - 7 * 86_400_000).toISOString().split("T")[0];
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(ticker)}&from=${from}&to=${to}&token=${key}`,
      { next: { revalidate: 300 } }
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

export async function serverGetMarketNews(): Promise<NewsItem[]> {
  const key = process.env.FINNHUB_API_KEY;
  if (!isRealKey(key)) return PLACEHOLDER_NEWS;
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/news?category=general&token=${key}`,
      { next: { revalidate: 600 } }
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

// ─── Technical indicators ─────────────────────────────────────────────────────

export async function serverGetTechnicalIndicators(ticker: string): Promise<TechnicalData> {
  const key = process.env.ALPHA_VANTAGE_API_KEY;
  const placeholder: TechnicalData = { ticker, rsi: null, macd: null, sma20: null, sma50: null, isPlaceholder: true };
  if (!isRealKey(key)) return placeholder;
  try {
    const res = await fetch(
      `https://www.alphavantage.co/query?function=RSI&symbol=${encodeURIComponent(ticker)}&interval=daily&time_period=14&series_type=close&apikey=${key}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return placeholder;
    const raw = await res.json() as { "Technical Analysis: RSI"?: Record<string, { RSI: string }> };
    const rsiSeries = raw["Technical Analysis: RSI"];
    const latestDate = rsiSeries ? Object.keys(rsiSeries)[0] : null;
    const rsi = latestDate ? parseFloat(rsiSeries![latestDate]["RSI"]) : null;
    return { ticker, rsi, macd: null, sma20: null, sma50: null, isPlaceholder: false };
  } catch {
    return placeholder;
  }
}

// ─── Insider trades ───────────────────────────────────────────────────────────

export async function serverGetInsiderTrades(ticker: string): Promise<InsiderTrade[]> {
  const key = process.env.FINNHUB_API_KEY;
  const placeholder: InsiderTrade[] = [
    { name: "PLACEHOLDER — API not connected", title: "—", transactionType: "Purchase", shares: 0, price: 0, value: 0, filingDate: "—", isPlaceholder: true },
  ];
  if (!isRealKey(key)) return placeholder;
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/stock/insider-transactions?symbol=${encodeURIComponent(ticker)}&token=${key}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return placeholder;
    const raw = await res.json() as { data?: Array<{ name: string; share: number; transactionPrice: number; transactionDate: string; transactionCode: string }> };
    const rows = raw.data ?? [];
    if (!rows.length) return placeholder;
    return rows.slice(0, 8).map(t => ({
      name: t.name,
      title: "—",
      transactionType: (t.transactionCode === "P" ? "Purchase" : t.transactionCode === "S" ? "Sale" : "Other") as InsiderTrade["transactionType"],
      shares: t.share,
      price: t.transactionPrice,
      value: t.share * t.transactionPrice,
      filingDate: t.transactionDate,
      isPlaceholder: false,
    }));
  } catch {
    return placeholder;
  }
}

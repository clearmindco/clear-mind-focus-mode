/**
 * EDGE OS Data Provider Layer — client-safe exports only.
 *
 * Actual API fetching has moved to lib/server-data.ts (server-only).
 * This file exports:
 *  - Shared TypeScript types
 *  - Boolean connection status helpers (safe NEXT_PUBLIC_ booleans, not key values)
 *
 * Connection status pattern:
 *  Set NEXT_PUBLIC_FINNHUB_CONNECTED=true when FINNHUB_API_KEY is configured on the server.
 *  The boolean flag is safe to expose to the browser; the actual key is never sent to the client.
 */

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

export interface SignalData {
  ticker: string;
  status: "Bullish Watch" | "Bearish Warning" | "Wait";
  score: number;
  confidence: number;
  reasons: string[];
  confirms: string[];
  invalidates: string[];
  riskLevel: "Low" | "Medium" | "High" | "Very High";
  beginnerExplanation: string;
  entryZone: string | null;
  stopLevel: string | null;
  target1: string | null;
  target2: string | null;
  riskWarning: string;
  isPlaceholder: boolean;
}

// ─── Client-safe connection flags ─────────────────────────────────────────────
// These check NEXT_PUBLIC_ booleans — never the actual key values.
// Set NEXT_PUBLIC_FINNHUB_CONNECTED=true when FINNHUB_API_KEY is configured on the server.

export function isFinnhubConnected(): boolean {
  return process.env.NEXT_PUBLIC_FINNHUB_CONNECTED === "true";
}

export function isNewsApiConnected(): boolean {
  return process.env.NEXT_PUBLIC_NEWSAPI_CONNECTED === "true";
}

export function isAlphaVantageConnected(): boolean {
  return process.env.NEXT_PUBLIC_ALPHAVANTAGE_CONNECTED === "true";
}

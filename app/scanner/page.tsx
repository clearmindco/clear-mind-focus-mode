"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";

interface ScannerResult {
  ticker: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  high: number | null;
  low: number | null;
  relativeVolume: number | null;
  atr: number | null;
  atrPercent: number | null;
  setupScore: "A+" | "A" | "B" | "C" | "—";
  setupReason: string;
  isPlaceholder: boolean;
}

interface ScannerResponse {
  items: ScannerResult[];
  filter: string;
  total: number;
  isPlaceholder: boolean;
  generatedAt: string;
}

type Filter = "gainers" | "losers" | "volume" | "atr";

const FILTERS: { id: Filter; label: string; desc: string }[] = [
  { id: "gainers", label: "Top Gainers", desc: "Largest % gain today" },
  { id: "losers", label: "Top Losers", desc: "Largest % loss today" },
  { id: "volume", label: "High Volume", desc: "Relative volume spike" },
  { id: "atr", label: "ATR Expansion", desc: "Volatility expansion" },
];

const SCORE_META: Record<string, { color: string; bg: string }> = {
  "A+": { color: "#059669", bg: "rgba(5,150,105,0.15)" },
  "A":  { color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  "B":  { color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  "C":  { color: "#9aa0b4", bg: "rgba(154,160,180,0.1)" },
  "—":  { color: "#5a6075", bg: "rgba(90,96,117,0.08)" },
};

function fmt(v: number | null, dec = 2): string {
  if (v == null) return "—";
  return v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function fmtPct(v: number | null): string {
  if (v == null) return "—";
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

function pctColor(v: number | null): string {
  if (v == null) return "#9aa0b4";
  return v > 0 ? "#10b981" : v < 0 ? "#ef4444" : "#9aa0b4";
}

export default function ScannerPage() {
  const [filter, setFilter] = useState<Filter>("gainers");
  const [data, setData] = useState<ScannerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchScanner = useCallback(async (f: Filter) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/scanner?filter=${f}&limit=25`);
      if (res.ok) setData(await res.json());
    } catch {}
    setLoading(false);
    setLastRefresh(new Date());
  }, []);

  useEffect(() => { fetchScanner(filter); }, [filter, fetchScanner]);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0b0d" }}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 pt-8 pb-24">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-3">
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-3"
              style={{ background: "rgba(16,185,129,0.08)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              Live Momentum Scanner
            </div>
            <h1 className="text-3xl font-bold" style={{ color: "#e8eaf0" }}>
              Momentum <span style={{ color: "#10b981" }}>Movers</span>
            </h1>
            <p className="text-sm mt-1" style={{ color: "#9aa0b4" }}>
              {data?.total ?? 0} liquid instruments · Setup quality scored · Real API data only
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={() => fetchScanner(filter)}
              className="text-xs px-4 py-2 rounded-lg font-medium"
              style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}
            >
              ↻ Refresh
            </button>
            {lastRefresh && (
              <p className="text-xs" style={{ color: "#5a6075" }}>
                {lastRefresh.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="text-xs px-4 py-2 rounded-xl font-medium transition-all"
              style={{
                background: filter === f.id ? "rgba(16,185,129,0.15)" : "#0f1117",
                color: filter === f.id ? "#10b981" : "#9aa0b4",
                border: `1px solid ${filter === f.id ? "rgba(16,185,129,0.3)" : "#1e2433"}`,
              }}
            >
              {f.label}
              <span className="ml-1.5" style={{ color: "#5a6075" }}>— {f.desc}</span>
            </button>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: "#1e2433", borderTopColor: "#10b981" }} />
          </div>
        ) : data?.isPlaceholder ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: "#0f1117", border: "1px solid #1e2433" }}
          >
            <p className="text-2xl mb-3">📡</p>
            <p className="text-sm font-medium mb-1" style={{ color: "#e8eaf0" }}>API Not Connected</p>
            <p className="text-xs" style={{ color: "#5a6075" }}>
              Configure <code style={{ color: "#00d4ff" }}>FINNHUB_API_KEY</code> in Netlify environment variables to enable live scanning.
            </p>
          </div>
        ) : (
          <>
            {/* Column headers */}
            <div
              className="hidden md:grid gap-3 px-4 py-2 mb-2 text-xs font-semibold uppercase tracking-wider"
              style={{
                color: "#5a6075",
                gridTemplateColumns: "100px 90px 90px 80px 70px 60px minmax(0,1fr) 60px",
              }}
            >
              <span>Ticker</span>
              <span>Price</span>
              <span>% Change</span>
              <span>Rel Vol</span>
              <span>ATR%</span>
              <span>Score</span>
              <span>Reason</span>
              <span>H / L</span>
            </div>

            <div className="space-y-2">
              {(data?.items ?? []).map(item => {
                const scoreMeta = SCORE_META[item.setupScore] ?? SCORE_META["—"];
                return (
                  <div
                    key={item.ticker}
                    className="rounded-2xl px-4 py-3"
                    style={{ background: "#0f1117", border: "1px solid #1e2433" }}
                  >
                    {/* Mobile layout */}
                    <div className="md:hidden">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-base" style={{ color: "#e8eaf0" }}>{item.ticker}</span>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-bold"
                            style={{ background: scoreMeta.bg, color: scoreMeta.color }}
                          >
                            {item.setupScore}
                          </span>
                        </div>
                        <span className="font-bold" style={{ color: pctColor(item.changePercent) }}>
                          {fmtPct(item.changePercent)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs mb-2" style={{ color: "#9aa0b4" }}>
                        <span>${fmt(item.price)}</span>
                        {item.relativeVolume != null && <span>{item.relativeVolume}x vol</span>}
                        {item.atrPercent != null && <span>ATR {item.atrPercent}%</span>}
                      </div>
                      <p className="text-xs" style={{ color: "#5a6075" }}>{item.setupReason}</p>
                    </div>

                    {/* Desktop layout */}
                    <div
                      className="hidden md:grid items-center gap-3"
                      style={{ gridTemplateColumns: "100px 90px 90px 80px 70px 60px minmax(0,1fr) 60px" }}
                    >
                      <span className="font-bold" style={{ color: "#e8eaf0" }}>{item.ticker}</span>
                      <span className="text-sm" style={{ color: "#e8eaf0" }}>${fmt(item.price)}</span>
                      <span className="text-sm font-bold" style={{ color: pctColor(item.changePercent) }}>
                        {fmtPct(item.changePercent)}
                      </span>
                      <span className="text-sm" style={{ color: item.relativeVolume && item.relativeVolume >= 1.5 ? "#f59e0b" : "#9aa0b4" }}>
                        {item.relativeVolume != null ? `${item.relativeVolume}x` : "—"}
                      </span>
                      <span className="text-sm" style={{ color: "#9aa0b4" }}>
                        {item.atrPercent != null ? `${item.atrPercent}%` : "—"}
                      </span>
                      <span
                        className="text-xs px-2 py-1 rounded-full font-bold text-center"
                        style={{ background: scoreMeta.bg, color: scoreMeta.color }}
                      >
                        {item.setupScore}
                      </span>
                      <span className="text-xs" style={{ color: "#5a6075" }}>{item.setupReason}</span>
                      <span className="text-xs text-right" style={{ color: "#5a6075" }}>
                        {item.high != null ? `$${fmt(item.high)} / $${fmt(item.low)}` : "—"}
                      </span>
                    </div>
                  </div>
                );
              })}

              {!data?.items?.length && (
                <div className="rounded-2xl p-8 text-center" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
                  <p className="text-xs" style={{ color: "#5a6075" }}>No results for current filter</p>
                </div>
              )}
            </div>

            {/* Score legend */}
            <div
              className="mt-6 rounded-xl p-4"
              style={{ background: "#0f1117", border: "1px solid #1e2433" }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#5a6075" }}>Setup Quality Score</p>
              <div className="flex flex-wrap gap-4">
                {(["A+", "A", "B", "C"] as const).map(score => (
                  <div key={score} className="flex items-center gap-2">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-bold"
                      style={{ background: SCORE_META[score].bg, color: SCORE_META[score].color }}
                    >
                      {score}
                    </span>
                    <span className="text-xs" style={{ color: "#5a6075" }}>
                      {score === "A+" ? "≥5% move + 2x vol + ATR expansion"
                       : score === "A" ? "≥3% move + 1.5x relative volume"
                       : score === "B" ? "≥2% move + above-avg volume"
                       : "≥1% move — developing setup"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Disclaimer */}
        <div
          className="mt-6 rounded-xl p-4 flex gap-3 items-start"
          style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)" }}
        >
          <span className="text-lg flex-shrink-0">⚠️</span>
          <p className="text-xs leading-relaxed" style={{ color: "#9aa0b4" }}>
            <strong style={{ color: "#f59e0b" }}>Educational research only.</strong>{" "}
            Scanner results highlight momentum — not trade recommendations. Setup scores are algorithmic heuristics based on % change, relative volume, and ATR expansion. Always confirm setups with full analysis. No guaranteed outcomes.
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import {
  getQuote,
  isFinnhubConnected,
  type QuoteData,
} from "@/lib/data-providers";

type StatusType = "BUY WATCH" | "WAIT" | "AVOID";

interface TickerConfig {
  ticker: string;
  fullName: string;
  type: string;
  icon: string;
  color: string;
  // Placeholder analysis — all manually curated context, clearly labeled
  status: StatusType;
  trend: string;
  catalyst: string;
  entryZone: string;
  stop: string;
  target1: string;
  target2: string;
  confidence: string;
}

const TICKERS: TickerConfig[] = [
  {
    ticker: "SPY",
    fullName: "S&P 500 ETF",
    type: "Index ETF",
    icon: "📈",
    color: "#00d4ff",
    status: "WAIT",
    trend: "— Placeholder",
    catalyst: "— Placeholder",
    entryZone: "— Placeholder",
    stop: "— Placeholder",
    target1: "— Placeholder",
    target2: "— Placeholder",
    confidence: "—",
  },
  {
    ticker: "QQQ",
    fullName: "Nasdaq-100 ETF",
    type: "Index ETF",
    icon: "💻",
    color: "#8b5cf6",
    status: "WAIT",
    trend: "— Placeholder",
    catalyst: "— Placeholder",
    entryZone: "— Placeholder",
    stop: "— Placeholder",
    target1: "— Placeholder",
    target2: "— Placeholder",
    confidence: "—",
  },
  {
    ticker: "IWM",
    fullName: "Russell 2000 ETF",
    type: "Index ETF",
    icon: "🔬",
    color: "#f97316",
    status: "WAIT",
    trend: "— Placeholder",
    catalyst: "— Placeholder",
    entryZone: "— Placeholder",
    stop: "— Placeholder",
    target1: "— Placeholder",
    target2: "— Placeholder",
    confidence: "—",
  },
  {
    ticker: "TLT",
    fullName: "20-Year Treasury Bond ETF",
    type: "Bond ETF",
    icon: "🏛️",
    color: "#06b6d4",
    status: "WAIT",
    trend: "— Placeholder",
    catalyst: "— Placeholder",
    entryZone: "— Placeholder",
    stop: "— Placeholder",
    target1: "— Placeholder",
    target2: "— Placeholder",
    confidence: "—",
  },
  {
    ticker: "XLE",
    fullName: "Energy Select Sector ETF",
    type: "Sector ETF",
    icon: "⚡",
    color: "#f59e0b",
    status: "WAIT",
    trend: "— Placeholder",
    catalyst: "— Placeholder",
    entryZone: "— Placeholder",
    stop: "— Placeholder",
    target1: "— Placeholder",
    target2: "— Placeholder",
    confidence: "—",
  },
  {
    ticker: "NVDA",
    fullName: "NVIDIA Corporation",
    type: "Individual Stock",
    icon: "🤖",
    color: "#10b981",
    status: "WAIT",
    trend: "— Placeholder",
    catalyst: "— Placeholder",
    entryZone: "— Placeholder",
    stop: "— Placeholder",
    target1: "— Placeholder",
    target2: "— Placeholder",
    confidence: "—",
  },
  {
    ticker: "TSLA",
    fullName: "Tesla, Inc.",
    type: "Individual Stock",
    icon: "🚗",
    color: "#ef4444",
    status: "WAIT",
    trend: "— Placeholder",
    catalyst: "— Placeholder",
    entryZone: "— Placeholder",
    stop: "— Placeholder",
    target1: "— Placeholder",
    target2: "— Placeholder",
    confidence: "—",
  },
];

const STATUS_META = {
  "BUY WATCH": { color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  WAIT: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  AVOID: { color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
};

function fmt(n: number | null, prefix = "$"): string {
  if (n === null) return "—";
  return `${prefix}${n.toFixed(2)}`;
}

function fmtChg(n: number | null): string {
  if (n === null) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

export default function Terminal() {
  const [quotes, setQuotes] = useState<Record<string, QuoteData>>({});
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const apiConnected = isFinnhubConnected();

  const fetchAll = useCallback(async () => {
    if (!apiConnected) return;
    setLoading(true);
    const results = await Promise.all(TICKERS.map(t => getQuote(t.ticker)));
    const map: Record<string, QuoteData> = {};
    results.forEach(q => { map[q.ticker] = q; });
    setQuotes(map);
    setLoading(false);
    setLastUpdated(new Date().toLocaleTimeString());
  }, [apiConnected]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0b0d" }}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 pt-10 pb-20">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <div
              className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium mb-3"
              style={
                apiConnected
                  ? { background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" }
                  : { background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.25)" }
              }
            >
              <span className={`w-1.5 h-1.5 rounded-full bg-current ${apiConnected ? "animate-pulse" : ""}`} />
              {apiConnected
                ? loading ? "Fetching live prices…" : `Live Quotes${lastUpdated ? ` · ${lastUpdated}` : ""}`
                : "API not connected — placeholder data"}
            </div>
            <h1 className="text-3xl font-bold" style={{ color: "#e8eaf0" }}>
              EDGE <span style={{ color: "#10b981" }}>Terminal</span>
            </h1>
            <p className="text-sm mt-1" style={{ color: "#9aa0b4" }}>
              Market radar · 7 tickers · Analysis setups · Confidence scores
            </p>
          </div>
          {apiConnected && (
            <button
              onClick={fetchAll}
              disabled={loading}
              className="text-xs px-4 py-2 rounded-xl transition-all"
              style={{
                background: "#0f1117",
                border: "1px solid #1e2433",
                color: loading ? "#5a6075" : "#00d4ff",
                cursor: loading ? "wait" : "pointer",
              }}
            >
              {loading ? "Refreshing…" : "↻ Refresh"}
            </button>
          )}
        </div>

        {/* Placeholder data warning */}
        <div
          className="rounded-xl p-4 flex gap-3 items-start mb-6"
          style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)" }}
        >
          <span className="text-base flex-shrink-0">⚠️</span>
          <p className="text-xs leading-relaxed" style={{ color: "#9aa0b4" }}>
            <strong style={{ color: "#ef4444" }}>Educational research only. Not financial advice.</strong>{" "}
            {apiConnected
              ? "Prices are live from Finnhub. All status, trend, catalyst, entry, stop, target, and confidence fields are "
              : "All data below is "}
            <strong style={{ color: "#f59e0b" }}>
              {apiConnected ? "placeholders" : "placeholder data — API not connected"}
            </strong>
            {apiConnected ? " and do not constitute a recommendation to buy or sell." : ". Add NEXT_PUBLIC_FINNHUB_API_KEY to see live prices."}
            {" "}Signals are decision-support tools, not instructions. Always paper trade first.
          </p>
        </div>

        {/* Status legend */}
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <span className="text-xs" style={{ color: "#5a6075" }}>Status key:</span>
          {(Object.entries(STATUS_META) as [StatusType, typeof STATUS_META["WAIT"]][]).map(([label, s]) => (
            <span
              key={label}
              className="text-xs px-2.5 py-1 rounded-full font-semibold"
              style={{ background: s.bg, color: s.color }}
            >
              {label}
            </span>
          ))}
          <span className="text-xs ml-2" style={{ color: "#5a6075" }}>
            (All statuses are placeholders — manual analysis not yet connected)
          </span>
        </div>

        {/* Ticker grid */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {TICKERS.map(t => {
            const q = quotes[t.ticker];
            const isOpen = expanded === t.ticker;
            const statusMeta = STATUS_META[t.status];
            const hasLivePrice = q && !q.isPlaceholder;
            const chgColor = hasLivePrice && q.changePercent !== null
              ? q.changePercent >= 0 ? "#10b981" : "#ef4444"
              : "#9aa0b4";

            return (
              <div
                key={t.ticker}
                className="rounded-2xl overflow-hidden transition-all duration-200"
                style={{
                  background: "#0f1117",
                  border: `1px solid ${isOpen ? t.color + "40" : "#1e2433"}`,
                }}
              >
                <div className="p-5">
                  {/* Ticker header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{ background: `${t.color}10`, border: `1px solid ${t.color}25` }}
                      >
                        {t.icon}
                      </div>
                      <div>
                        <div className="font-bold text-lg leading-none" style={{ color: "#e8eaf0" }}>{t.ticker}</div>
                        <div className="text-xs mt-0.5" style={{ color: "#5a6075" }}>{t.fullName}</div>
                      </div>
                    </div>
                    <span
                      className="text-xs px-2.5 py-1 rounded-full font-bold flex-shrink-0"
                      style={{ background: statusMeta.bg, color: statusMeta.color }}
                    >
                      {t.status}
                    </span>
                  </div>

                  {/* Price row */}
                  <div
                    className="rounded-xl p-3 mb-3 flex items-center justify-between"
                    style={{
                      background: "#141720",
                      border: `1px solid ${hasLivePrice ? t.color + "30" : "#1e2433"}`,
                    }}
                  >
                    <div>
                      <div className="text-xs mb-0.5" style={{ color: "#5a6075" }}>
                        {hasLivePrice ? "Last Price" : "Price"}
                        {hasLivePrice && (
                          <span className="ml-1.5 text-xs" style={{ color: "#10b981" }}>● live</span>
                        )}
                        {!hasLivePrice && !apiConnected && (
                          <span className="ml-1.5 text-xs" style={{ color: "#5a6075" }}>● no API</span>
                        )}
                        {!hasLivePrice && apiConnected && loading && (
                          <span className="ml-1.5 text-xs" style={{ color: "#f59e0b" }}>● loading…</span>
                        )}
                      </div>
                      <div className="font-bold text-base" style={{ color: "#e8eaf0" }}>
                        {hasLivePrice ? fmt(q.price) : "— Placeholder"}
                      </div>
                    </div>
                    {hasLivePrice && (
                      <div className="text-right">
                        <div className="text-xs font-semibold" style={{ color: chgColor }}>
                          {fmtChg(q.changePercent)}
                        </div>
                        <div className="text-xs" style={{ color: chgColor }}>
                          {fmt(q.change, q.change && q.change >= 0 ? "+$" : "-$")}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Analysis grid */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {[
                      { label: "Trend", value: t.trend },
                      { label: "Catalyst", value: t.catalyst },
                      { label: "Confidence", value: t.confidence !== "—" ? `${t.confidence}%` : "—" },
                      { label: "Type", value: t.type },
                    ].map(row => (
                      <div
                        key={row.label}
                        className="rounded-lg p-2"
                        style={{ background: "#0a0b0d", border: "1px solid #1e2433" }}
                      >
                        <div className="text-xs mb-0.5" style={{ color: "#5a6075" }}>{row.label}</div>
                        <div className="text-xs font-medium" style={{ color: "#9aa0b4" }}>{row.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* View Details */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : t.ticker)}
                    className="w-full py-2 rounded-xl text-xs font-semibold transition-all duration-150"
                    style={{
                      background: isOpen ? `${t.color}15` : "#141720",
                      color: isOpen ? t.color : "#9aa0b4",
                      border: `1px solid ${isOpen ? t.color + "30" : "#1e2433"}`,
                    }}
                  >
                    {isOpen ? "Hide Details ↑" : "View Details ↓"}
                  </button>
                </div>

                {/* Expanded detail panel */}
                {isOpen && (
                  <div className="px-5 pb-5 border-t" style={{ borderColor: "#1e2433" }}>
                    <div className="pt-4 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: t.color }}>
                        Trade Levels — All Placeholder
                      </p>
                      {[
                        { label: "Entry Zone", value: t.entryZone, color: "#00d4ff" },
                        { label: "Stop Loss", value: t.stop, color: "#ef4444" },
                        { label: "Target 1", value: t.target1, color: "#10b981" },
                        { label: "Target 2", value: t.target2, color: "#10b981" },
                      ].map(row => (
                        <div
                          key={row.label}
                          className="flex items-center justify-between rounded-lg px-3 py-2"
                          style={{ background: "#141720", border: "1px solid #1e2433" }}
                        >
                          <span className="text-xs" style={{ color: "#9aa0b4" }}>{row.label}</span>
                          <span className="text-xs font-semibold" style={{ color: row.color }}>{row.value}</span>
                        </div>
                      ))}

                      {hasLivePrice && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {[
                            { label: "Daily High", value: fmt(q.high) },
                            { label: "Daily Low", value: fmt(q.low) },
                            { label: "Prev Close", value: fmt(q.prevClose) },
                            { label: "Change $", value: fmt(q.change, q.change && q.change >= 0 ? "+$" : "$") },
                          ].map(row => (
                            <div key={row.label} className="rounded-lg p-2" style={{ background: "#0a0b0d", border: "1px solid #1e2433" }}>
                              <div className="text-xs mb-0.5" style={{ color: "#5a6075" }}>{row.label}</div>
                              <div className="text-xs font-semibold" style={{ color: "#e8eaf0" }}>{row.value}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div
                        className="rounded-lg p-3 mt-1"
                        style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)" }}
                      >
                        <p className="text-xs" style={{ color: "#f59e0b" }}>
                          📊 Analysis fields (status, trend, catalyst, entry, stop, targets, confidence) are placeholder values. Manual analysis integration coming in a future update.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom info */}
        <div className="mt-10 rounded-2xl p-6" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
          <div className="flex items-start gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <p className="font-semibold mb-2 text-sm" style={{ color: "#e8eaf0" }}>
                🔌 What connects when API keys are added
              </p>
              <div className="grid sm:grid-cols-2 gap-2 text-xs" style={{ color: "#9aa0b4" }}>
                <div>✓ Live price + change % via Finnhub</div>
                <div>✓ Daily high / low / prev close</div>
                <div>⏳ RSI / technical overlay via Alpha Vantage</div>
                <div>⏳ Catalyst news feed via Finnhub</div>
                <div>⏳ Insider activity feed via Finnhub</div>
                <div>⏳ AI confidence scores (requires OpenAI)</div>
              </div>
            </div>
            {!apiConnected && (
              <div className="flex-shrink-0">
                <a
                  href="/api-setup"
                  className="inline-block px-4 py-2 rounded-xl text-xs font-semibold"
                  style={{
                    background: "rgba(0,212,255,0.1)",
                    color: "#00d4ff",
                    border: "1px solid rgba(0,212,255,0.3)",
                  }}
                >
                  ⚙️ Go to API Setup →
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Compliance */}
        <p className="text-center text-xs mt-6" style={{ color: "#5a6075" }}>
          Educational research only · Not financial advice · No guaranteed returns · Users are responsible for their own trades · Always paper trade first
        </p>
      </div>
    </div>
  );
}

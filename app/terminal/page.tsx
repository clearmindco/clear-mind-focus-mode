"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";

type StatusType = "BUY WATCH" | "WAIT" | "AVOID";

interface TickerCard {
  ticker: string;
  fullName: string;
  type: string;
  status: StatusType;
  statusColor: string;
  statusBg: string;
  trend: string;
  catalyst: string;
  entryZone: string;
  stop: string;
  target: string;
  confidence: string;
  icon: string;
  color: string;
}

const TICKERS: TickerCard[] = [
  {
    ticker: "SPY",
    fullName: "S&P 500 ETF",
    type: "Index ETF",
    status: "WAIT",
    statusColor: "#f59e0b",
    statusBg: "rgba(245,158,11,0.1)",
    trend: "— Placeholder",
    catalyst: "— Placeholder",
    entryZone: "— Placeholder",
    stop: "— Placeholder",
    target: "— Placeholder",
    confidence: "— %",
    icon: "📈",
    color: "#00d4ff",
  },
  {
    ticker: "QQQ",
    fullName: "Nasdaq-100 ETF",
    type: "Index ETF",
    status: "WAIT",
    statusColor: "#f59e0b",
    statusBg: "rgba(245,158,11,0.1)",
    trend: "— Placeholder",
    catalyst: "— Placeholder",
    entryZone: "— Placeholder",
    stop: "— Placeholder",
    target: "— Placeholder",
    confidence: "— %",
    icon: "💻",
    color: "#8b5cf6",
  },
  {
    ticker: "TLT",
    fullName: "20-Year Treasury Bond ETF",
    type: "Bond ETF",
    status: "WAIT",
    statusColor: "#f59e0b",
    statusBg: "rgba(245,158,11,0.1)",
    trend: "— Placeholder",
    catalyst: "— Placeholder",
    entryZone: "— Placeholder",
    stop: "— Placeholder",
    target: "— Placeholder",
    confidence: "— %",
    icon: "🏛️",
    color: "#06b6d4",
  },
  {
    ticker: "XLE",
    fullName: "Energy Select Sector ETF",
    type: "Sector ETF",
    status: "WAIT",
    statusColor: "#f59e0b",
    statusBg: "rgba(245,158,11,0.1)",
    trend: "— Placeholder",
    catalyst: "— Placeholder",
    entryZone: "— Placeholder",
    stop: "— Placeholder",
    target: "— Placeholder",
    confidence: "— %",
    icon: "⚡",
    color: "#f59e0b",
  },
  {
    ticker: "NVDA",
    fullName: "NVIDIA Corporation",
    type: "Individual Stock",
    status: "WAIT",
    statusColor: "#f59e0b",
    statusBg: "rgba(245,158,11,0.1)",
    trend: "— Placeholder",
    catalyst: "— Placeholder",
    entryZone: "— Placeholder",
    stop: "— Placeholder",
    target: "— Placeholder",
    confidence: "— %",
    icon: "🤖",
    color: "#10b981",
  },
  {
    ticker: "TSLA",
    fullName: "Tesla, Inc.",
    type: "Individual Stock",
    status: "WAIT",
    statusColor: "#f59e0b",
    statusBg: "rgba(245,158,11,0.1)",
    trend: "— Placeholder",
    catalyst: "— Placeholder",
    entryZone: "— Placeholder",
    stop: "— Placeholder",
    target: "— Placeholder",
    confidence: "— %",
    icon: "🚗",
    color: "#ef4444",
  },
];

export default function Terminal() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0b0d" }}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 pt-10 pb-20">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
            <div>
              <div
                className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium mb-3"
                style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.25)" }}
              >
                PREVIEW — Data not connected
              </div>
              <h1 className="text-3xl font-bold" style={{ color: "#e8eaf0" }}>
                EDGE <span style={{ color: "#10b981" }}>Terminal</span>
              </h1>
              <p className="text-sm mt-1" style={{ color: "#9aa0b4" }}>
                Market intelligence dashboard · Watchlist · Setups · Bias
              </p>
            </div>
            <div
              className="rounded-xl px-4 py-2 text-xs"
              style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b" }}
            >
              🔌 Live data API not connected
            </div>
          </div>

          {/* Placeholder banner */}
          <div
            className="rounded-xl p-4 flex gap-3 items-start"
            style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}
          >
            <span className="text-base flex-shrink-0">⚠️</span>
            <p className="text-xs leading-relaxed" style={{ color: "#9aa0b4" }}>
              <strong style={{ color: "#ef4444" }}>PLACEHOLDER DATA — Educational Only.</strong> All statuses, levels, and confidence scores below are placeholders to demonstrate the interface structure. No real market data is being fetched. No values below constitute trading advice or a recommendation to buy or sell any security.
            </p>
          </div>
        </div>

        {/* Status legend */}
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <span className="text-xs" style={{ color: "#5a6075" }}>Status key:</span>
          {[
            { label: "BUY WATCH", color: "#10b981", bg: "rgba(16,185,129,0.1)" },
            { label: "WAIT", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
            { label: "AVOID", color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
          ].map(s => (
            <span
              key={s.label}
              className="text-xs px-2.5 py-1 rounded-full font-semibold"
              style={{ background: s.bg, color: s.color }}
            >
              {s.label}
            </span>
          ))}
        </div>

        {/* Ticker grid */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {TICKERS.map(t => {
            const isOpen = expanded === t.ticker;
            return (
              <div
                key={t.ticker}
                className="rounded-2xl overflow-hidden transition-all duration-200"
                style={{ background: "#0f1117", border: `1px solid ${isOpen ? t.color + "40" : "#1e2433"}` }}
              >
                {/* Card header */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{ background: `${t.color}10`, border: `1px solid ${t.color}25` }}
                      >
                        {t.icon}
                      </div>
                      <div>
                        <div className="font-bold text-lg" style={{ color: "#e8eaf0" }}>{t.ticker}</div>
                        <div className="text-xs" style={{ color: "#5a6075" }}>{t.fullName}</div>
                      </div>
                    </div>
                    <div>
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-bold"
                        style={{ background: t.statusBg, color: t.statusColor }}
                      >
                        {t.status}
                      </span>
                    </div>
                  </div>

                  {/* Type badge */}
                  <div className="mb-4">
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ background: "#141720", color: "#5a6075", border: "1px solid #1e2433" }}
                    >
                      {t.type}
                    </span>
                  </div>

                  {/* Quick stats */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {[
                      { label: "Trend", value: t.trend },
                      { label: "Catalyst", value: t.catalyst },
                      { label: "Confidence", value: t.confidence },
                      { label: "Entry Zone", value: t.entryZone },
                    ].map(row => (
                      <div
                        key={row.label}
                        className="rounded-lg p-2"
                        style={{ background: "#141720", border: "1px solid #1e2433" }}
                      >
                        <div className="text-xs mb-0.5" style={{ color: "#5a6075" }}>{row.label}</div>
                        <div className="text-xs font-medium" style={{ color: "#9aa0b4" }}>{row.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* View Details button */}
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
                  <div
                    className="px-5 pb-5 border-t"
                    style={{ borderColor: "#1e2433" }}
                  >
                    <div className="pt-4 space-y-3">
                      <p
                        className="text-xs font-semibold uppercase tracking-widest"
                        style={{ color: t.color }}
                      >
                        Trade Levels (Placeholder)
                      </p>
                      {[
                        { label: "Entry Zone", value: t.entryZone, color: "#00d4ff" },
                        { label: "Stop Loss", value: t.stop, color: "#ef4444" },
                        { label: "Target 1", value: t.target, color: "#10b981" },
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

                      <div
                        className="rounded-lg p-3 mt-2"
                        style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)" }}
                      >
                        <p className="text-xs" style={{ color: "#f59e0b" }}>
                          📡 Live data integration coming soon. Levels will populate when the market data API is connected.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Coming soon note */}
        <div
          className="mt-10 rounded-2xl p-6 text-center"
          style={{ background: "#0f1117", border: "1px solid #1e2433" }}
        >
          <div className="text-3xl mb-3">🔌</div>
          <h3 className="font-semibold mb-2" style={{ color: "#e8eaf0" }}>Live Data Integration — Coming Soon</h3>
          <p className="text-sm max-w-xl mx-auto" style={{ color: "#9aa0b4" }}>
            The EDGE Terminal will connect to real-time market data to populate trend analysis, catalyst calendars, and confidence scores. All values will be clearly labeled as educational analysis, not trading advice.
          </p>
          <div className="flex justify-center gap-3 mt-5 flex-wrap">
            {["Real-Time Quotes", "Options Flow", "Catalyst Calendar", "Sector Rotation", "Earnings Radar"].map(f => (
              <span
                key={f}
                className="text-xs px-3 py-1.5 rounded-full"
                style={{ background: "#141720", color: "#5a6075", border: "1px solid #1e2433" }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

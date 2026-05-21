"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import type { ICTAnalysis } from "@/lib/ict-analysis";

interface MarketStructureResponse {
  symbol: string;
  resolution: string;
  isPlaceholder: boolean;
  message?: string;
  analysis: ICTAnalysis | null;
  quote: { price: number | null; changePercent: number | null; isPlaceholder: boolean } | null;
}

const TICKERS = ["SPY", "QQQ", "NVDA", "TSLA", "AAPL", "AMD", "META", "AMZN", "MSFT", "COIN"];
const TIMEFRAMES = [
  { id: "D", label: "Daily", desc: "90 days" },
  { id: "60", label: "1H", desc: "30 days" },
  { id: "15", label: "15m", desc: "10 days" },
  { id: "5", label: "5m", desc: "5 days" },
];

function fmt(v: number, dec = 2): string {
  return v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function zoneColor(zone: string): string {
  if (zone === "premium") return "#ef4444";
  if (zone === "discount") return "#10b981";
  return "#f59e0b";
}

function biasColor(bias: string): string {
  if (bias === "Bullish") return "#10b981";
  if (bias === "Bearish") return "#ef4444";
  return "#f59e0b";
}

function trendColor(trend: string): string {
  if (trend === "Uptrend") return "#10b981";
  if (trend === "Downtrend") return "#ef4444";
  return "#f59e0b";
}

function labelColor(type: string): string {
  if (type === "HH" || type === "HL" || type === "MSS") return "#10b981";
  if (type === "LH" || type === "LL" || type === "BOS") return "#ef4444";
  return "#f59e0b";
}

function fvgStatusColor(status: string): string {
  if (status === "untouched") return "#10b981";
  if (status === "partially_filled") return "#f59e0b";
  return "#5a6075";
}

export default function MarketStructurePage() {
  const [ticker, setTicker] = useState("SPY");
  const [timeframe, setTimeframe] = useState("D");
  const [data, setData] = useState<MarketStructureResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalysis = useCallback(async (sym: string, res: string) => {
    setLoading(true);
    setData(null);
    try {
      const r = await fetch(`/api/market-structure?symbol=${sym}&resolution=${res}`);
      if (r.ok) setData(await r.json());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchAnalysis(ticker, timeframe); }, [ticker, timeframe, fetchAnalysis]);

  const a = data?.analysis;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0b0d" }}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 pt-8 pb-24">
        {/* Header */}
        <div className="mb-8">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-3"
            style={{ background: "rgba(139,92,246,0.08)", color: "#8b5cf6", border: "1px solid rgba(139,92,246,0.2)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            ICT Market Structure Analysis
          </div>
          <h1 className="text-3xl font-bold" style={{ color: "#e8eaf0" }}>
            Market <span style={{ color: "#8b5cf6" }}>Structure</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: "#9aa0b4" }}>
            FVG detection · Order blocks · Equilibrium · Liquidity sweeps · Structure labels
          </p>
        </div>

        {/* Controls */}
        <div
          className="rounded-2xl p-4 mb-6"
          style={{ background: "#0f1117", border: "1px solid #1e2433" }}
        >
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: "#5a6075" }}>Ticker</p>
              <div className="flex gap-1.5 flex-wrap">
                {TICKERS.map(t => (
                  <button
                    key={t}
                    onClick={() => setTicker(t)}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                    style={{
                      background: ticker === t ? "rgba(139,92,246,0.15)" : "#141720",
                      color: ticker === t ? "#8b5cf6" : "#9aa0b4",
                      border: `1px solid ${ticker === t ? "rgba(139,92,246,0.3)" : "#1e2433"}`,
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: "#5a6075" }}>Timeframe</p>
              <div className="flex gap-1.5">
                {TIMEFRAMES.map(tf => (
                  <button
                    key={tf.id}
                    onClick={() => setTimeframe(tf.id)}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                    style={{
                      background: timeframe === tf.id ? "rgba(139,92,246,0.15)" : "#141720",
                      color: timeframe === tf.id ? "#8b5cf6" : "#9aa0b4",
                      border: `1px solid ${timeframe === tf.id ? "rgba(139,92,246,0.3)" : "#1e2433"}`,
                    }}
                  >
                    {tf.label}
                    <span className="ml-1" style={{ color: "#5a6075" }}>({tf.desc})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: "#1e2433", borderTopColor: "#8b5cf6" }} />
          </div>
        ) : data?.isPlaceholder ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
            <p className="text-2xl mb-3">📊</p>
            <p className="text-sm font-medium mb-1" style={{ color: "#e8eaf0" }}>{data.message ?? "No candle data available"}</p>
            <p className="text-xs" style={{ color: "#5a6075" }}>
              Configure <code style={{ color: "#00d4ff" }}>FINNHUB_API_KEY</code> in Netlify environment variables to enable ICT analysis.
            </p>
          </div>
        ) : a ? (
          <div className="space-y-4">

            {/* Top summary bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Confluence Score */}
              <div className="rounded-2xl p-4" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
                <p className="text-xs mb-1" style={{ color: "#5a6075" }}>Confluence Score</p>
                <p className="text-3xl font-bold" style={{ color: biasColor(a.confluenceBias) }}>{a.confluenceScore}</p>
                <p className="text-xs font-medium mt-0.5" style={{ color: biasColor(a.confluenceBias) }}>{a.confluenceBias} Bias</p>
              </div>

              {/* Trend */}
              <div className="rounded-2xl p-4" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
                <p className="text-xs mb-1" style={{ color: "#5a6075" }}>Market Structure</p>
                <p className="text-xl font-bold" style={{ color: trendColor(a.marketStructure.trend) }}>{a.marketStructure.trend}</p>
                {a.marketStructure.bosDetected && <p className="text-xs mt-0.5" style={{ color: "#f59e0b" }}>⚡ BOS Detected</p>}
                {a.marketStructure.mssDetected && <p className="text-xs mt-0.5" style={{ color: "#10b981" }}>⚡ MSS Detected</p>}
              </div>

              {/* Equilibrium */}
              <div className="rounded-2xl p-4" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
                <p className="text-xs mb-1" style={{ color: "#5a6075" }}>EQ Zone</p>
                <p className="text-xl font-bold capitalize" style={{ color: zoneColor(a.equilibrium.zone) }}>{a.equilibrium.zone}</p>
                <p className="text-xs mt-0.5" style={{ color: "#5a6075" }}>
                  EQ: ${fmt(a.equilibrium.equilibrium)} · {a.equilibrium.percentFromEQ > 0 ? "+" : ""}{a.equilibrium.percentFromEQ.toFixed(1)}% from mid
                </p>
              </div>

              {/* Relative Volume */}
              <div className="rounded-2xl p-4" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
                <p className="text-xs mb-1" style={{ color: "#5a6075" }}>Relative Volume</p>
                <p className="text-xl font-bold" style={{ color: a.relativeVolume >= 1.5 ? "#f59e0b" : "#9aa0b4" }}>
                  {a.relativeVolume.toFixed(2)}x
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#5a6075" }}>
                  ATR: ${fmt(a.atr)} ({((a.atr / a.lastPrice) * 100).toFixed(2)}%)
                </p>
              </div>
            </div>

            {/* Confluence Factors */}
            {a.confluenceFactors.length > 0 && (
              <div className="rounded-2xl p-4" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#5a6075" }}>Confluence Factors</p>
                <div className="flex flex-wrap gap-2">
                  {a.confluenceFactors.map((f, i) => (
                    <span
                      key={i}
                      className="text-xs px-3 py-1 rounded-full"
                      style={{
                        background: f.toLowerCase().includes("bull") || f.toLowerCase().includes("up") || f.toLowerCase().includes("discount") || f.toLowerCase().includes("high rel")
                          ? "rgba(16,185,129,0.1)" : f.toLowerCase().includes("bear") || f.toLowerCase().includes("down") || f.toLowerCase().includes("premium")
                          ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
                        color: f.toLowerCase().includes("bull") || f.toLowerCase().includes("up") || f.toLowerCase().includes("discount")
                          ? "#10b981" : f.toLowerCase().includes("bear") || f.toLowerCase().includes("down") || f.toLowerCase().includes("premium")
                          ? "#ef4444" : "#f59e0b",
                      }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              {/* FVGs */}
              <div className="rounded-2xl p-4" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#5a6075" }}>
                  Fair Value Gaps ({a.fvgs.length})
                </p>
                {a.fvgs.length === 0 ? (
                  <p className="text-xs" style={{ color: "#5a6075" }}>No open FVGs detected in recent data</p>
                ) : (
                  <div className="space-y-2">
                    {a.fvgs.map((fvg, i) => (
                      <div
                        key={i}
                        className="rounded-xl p-3"
                        style={{
                          background: fvg.type === "bullish" ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)",
                          border: `1px solid ${fvg.type === "bullish" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold capitalize" style={{ color: fvg.type === "bullish" ? "#10b981" : "#ef4444" }}>
                            {fvg.type === "bullish" ? "▲" : "▼"} {fvg.type} FVG
                          </span>
                          <span
                            className="text-xs px-1.5 py-0.5 rounded font-medium"
                            style={{ background: "rgba(0,0,0,0.3)", color: fvgStatusColor(fvg.status) }}
                          >
                            {fvg.status.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-xs" style={{ color: "#9aa0b4" }}>
                          ${fmt(fvg.bottom)} — ${fmt(fvg.top)}
                          {" "}(gap: ${fmt(fvg.top - fvg.bottom)})
                        </p>
                        {fvg.status === "partially_filled" && (
                          <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: "#1e2433" }}>
                            <div className="h-full rounded-full" style={{ width: `${fvg.fillPercent}%`, background: "#f59e0b" }} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Order Blocks */}
              <div className="rounded-2xl p-4" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#5a6075" }}>
                  Order Blocks ({a.orderBlocks.length})
                </p>
                {a.orderBlocks.length === 0 ? (
                  <p className="text-xs" style={{ color: "#5a6075" }}>No unmitigated order blocks detected</p>
                ) : (
                  <div className="space-y-2">
                    {a.orderBlocks.map((ob, i) => (
                      <div
                        key={i}
                        className="rounded-xl p-3"
                        style={{
                          background: ob.type === "bullish" ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)",
                          border: `1px solid ${ob.type === "bullish" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold capitalize" style={{ color: ob.type === "bullish" ? "#10b981" : "#ef4444" }}>
                            {ob.type === "bullish" ? "▲" : "▼"} {ob.type} OB
                          </span>
                          <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: "rgba(0,0,0,0.3)", color: "#f59e0b" }}>
                            Strength {ob.strengthScore}/100
                          </span>
                        </div>
                        <p className="text-xs" style={{ color: "#9aa0b4" }}>Zone: ${fmt(ob.bottom)} — ${fmt(ob.top)}</p>
                        <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: "#1e2433" }}>
                          <div className="h-full rounded-full" style={{
                            width: `${ob.strengthScore}%`,
                            background: ob.type === "bullish" ? "#10b981" : "#ef4444",
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Structure Labels */}
              <div className="rounded-2xl p-4" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#5a6075" }}>
                  Structure Labels
                </p>
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <span className="text-xs font-bold" style={{ color: trendColor(a.marketStructure.trend) }}>
                    {a.marketStructure.trend}
                  </span>
                  {a.marketStructure.lastHigh && (
                    <span className="text-xs" style={{ color: "#5a6075" }}>Last high: ${fmt(a.marketStructure.lastHigh)}</span>
                  )}
                  {a.marketStructure.lastLow && (
                    <span className="text-xs" style={{ color: "#5a6075" }}>Last low: ${fmt(a.marketStructure.lastLow)}</span>
                  )}
                </div>
                {a.marketStructure.labels.length === 0 ? (
                  <p className="text-xs" style={{ color: "#5a6075" }}>Insufficient data for structure labels</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {a.marketStructure.labels.slice(-8).map((lbl, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <span
                          className="text-xs px-2.5 py-1 rounded-full font-bold"
                          style={{ background: `${labelColor(lbl.type)}18`, color: labelColor(lbl.type) }}
                        >
                          {lbl.type}
                        </span>
                        <span className="text-xs mt-0.5" style={{ color: "#5a6075" }}>${fmt(lbl.price, 0)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Liquidity Sweeps + Breaker Blocks */}
              <div className="rounded-2xl p-4" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#5a6075" }}>
                  Liquidity Sweeps
                </p>
                {a.liquiditySweeps.length === 0 ? (
                  <p className="text-xs mb-4" style={{ color: "#5a6075" }}>No recent liquidity sweeps detected</p>
                ) : (
                  <div className="space-y-2 mb-4">
                    {a.liquiditySweeps.map((sw, i) => (
                      <div
                        key={i}
                        className="rounded-xl p-3"
                        style={{
                          background: sw.type === "bullish" ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)",
                          border: `1px solid ${sw.type === "bullish" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                        }}
                      >
                        <p className="text-xs font-bold capitalize mb-1" style={{ color: sw.type === "bullish" ? "#10b981" : "#ef4444" }}>
                          {sw.type} Liq Sweep
                        </p>
                        <p className="text-xs" style={{ color: "#9aa0b4" }}>{sw.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#5a6075" }}>
                  Breaker Blocks ({a.breakerBlocks.length})
                </p>
                {a.breakerBlocks.length === 0 ? (
                  <p className="text-xs" style={{ color: "#5a6075" }}>No breaker blocks detected</p>
                ) : (
                  <div className="space-y-2">
                    {a.breakerBlocks.map((bb, i) => (
                      <div key={i} className="rounded-xl p-3" style={{ background: "#141720", border: "1px solid #1e2433" }}>
                        <p className="text-xs font-bold capitalize mb-1" style={{ color: bb.type === "bullish" ? "#10b981" : "#ef4444" }}>
                          {bb.type} Breaker
                        </p>
                        <p className="text-xs" style={{ color: "#9aa0b4" }}>
                          Zone: ${fmt(bb.bottom)} — ${fmt(bb.top)}
                        </p>
                        <p className="text-xs mt-1" style={{ color: "#5a6075" }}>{bb.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Equilibrium detail */}
            <div className="rounded-2xl p-4" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#5a6075" }}>Equilibrium (EQ) Range</p>
              <div className="flex items-center gap-6 flex-wrap">
                <div>
                  <p className="text-xs" style={{ color: "#5a6075" }}>Swing High (Premium)</p>
                  <p className="text-base font-bold" style={{ color: "#ef4444" }}>${fmt(a.equilibrium.swingHigh)}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "#5a6075" }}>EQ Midpoint</p>
                  <p className="text-base font-bold" style={{ color: "#f59e0b" }}>${fmt(a.equilibrium.equilibrium)}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "#5a6075" }}>Swing Low (Discount)</p>
                  <p className="text-base font-bold" style={{ color: "#10b981" }}>${fmt(a.equilibrium.swingLow)}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "#5a6075" }}>Current Zone</p>
                  <p
                    className="text-base font-bold capitalize px-3 py-1 rounded-full"
                    style={{ background: `${zoneColor(a.equilibrium.zone)}15`, color: zoneColor(a.equilibrium.zone) }}
                  >
                    {a.equilibrium.zone}
                  </p>
                </div>
              </div>
              {/* Visual EQ bar */}
              <div className="mt-4 relative">
                <div className="w-full h-6 rounded-lg overflow-hidden" style={{ background: "linear-gradient(to right, rgba(16,185,129,0.3), rgba(245,158,11,0.15), rgba(239,68,68,0.3))" }}>
                  {/* Price position marker */}
                  {a.equilibrium.swingHigh > a.equilibrium.swingLow && (() => {
                    const pos = ((a.lastPrice - a.equilibrium.swingLow) / (a.equilibrium.swingHigh - a.equilibrium.swingLow)) * 100;
                    return (
                      <div
                        className="absolute top-0 h-full w-0.5 rounded"
                        style={{ left: `${Math.max(0, Math.min(100, pos))}%`, background: "#e8eaf0" }}
                      />
                    );
                  })()}
                </div>
                <div className="flex justify-between mt-1 text-xs" style={{ color: "#5a6075" }}>
                  <span>Discount ↓</span>
                  <span>EQ</span>
                  <span>↑ Premium</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl p-8 text-center" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
            <p className="text-xs" style={{ color: "#5a6075" }}>Failed to load analysis</p>
          </div>
        )}

        {/* Educational note */}
        <div
          className="mt-6 rounded-xl p-4 flex gap-3 items-start"
          style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)" }}
        >
          <span className="text-lg flex-shrink-0">⚠️</span>
          <p className="text-xs leading-relaxed" style={{ color: "#9aa0b4" }}>
            <strong style={{ color: "#f59e0b" }}>Educational ICT analysis.</strong>{" "}
            FVGs, order blocks, and structure labels are detected algorithmically from daily candle data. Shorter timeframes use historical data with lower precision. ICT concepts are educational frameworks — not guaranteed trade signals. Always combine with your own analysis.
          </p>
        </div>
      </div>
    </div>
  );
}

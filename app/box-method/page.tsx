"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import ModeToggle from "@/components/ModeToggle";
import { useMode } from "@/lib/mode-context";
import type { BoxMethodData, BoxCandle } from "@/app/api/box-method/route";

// ─── Constants ────────────────────────────────────────────────────────────────

const TICKERS = ["SPY", "QQQ", "IWM", "NVDA", "TSLA", "AAPL", "AMD", "META", "AMZN", "MSFT", "COIN", "PLTR", "GOOGL", "NFLX", "RIVN", "SOFI", "MSTR", "SQQQ"];
const RESOLUTIONS = [
  { value: "5", label: "5m", desc: "Intraday" },
  { value: "15", label: "15m", desc: "Intraday" },
  { value: "60", label: "1H", desc: "Swing" },
  { value: "D", label: "Daily", desc: "Position" },
];

function fmt(v: number | null, dec = 2) {
  if (v == null) return "—";
  return v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

// ─── Mini Candle Chart with Box Overlay ───────────────────────────────────────

function BoxChart({ data }: { data: BoxMethodData }) {
  const { candles, boxHigh, boxLow, boxMidpoint, currentPrice } = data;
  if (!candles.length) return null;

  const W = 560;
  const H = 280;
  const PAD = { t: 24, r: 72, b: 20, l: 8 };
  const cw = W - PAD.l - PAD.r;
  const ch = H - PAD.t - PAD.b;

  const allHighs = candles.map(c => c.high);
  const allLows = candles.map(c => c.low);
  const priceMin = Math.min(...allLows, boxLow) * 0.998;
  const priceMax = Math.max(...allHighs, boxHigh, currentPrice ?? boxHigh) * 1.002;
  const priceRange = priceMax - priceMin;

  const toY = (p: number) => PAD.t + ch - ((p - priceMin) / priceRange) * ch;
  const barW = Math.max(2, (cw / candles.length) * 0.65);
  const gap = cw / candles.length;

  const boxHighY = toY(boxHigh);
  const boxLowY = toY(boxLow);
  const boxMidY = toY(boxMidpoint);
  const currY = currentPrice ? toY(currentPrice) : null;

  // Zone heights
  const topZoneY = toY(boxLow + (boxHigh - boxLow) * 0.67);
  const botZoneY = toY(boxLow + (boxHigh - boxLow) * 0.33);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        {/* Box zones */}
        <rect x={PAD.l} y={boxHighY} width={cw} height={topZoneY - boxHighY}
          fill="rgba(16,185,129,0.08)" />
        <rect x={PAD.l} y={topZoneY} width={cw} height={botZoneY - topZoneY}
          fill="rgba(245,158,11,0.06)" />
        <rect x={PAD.l} y={botZoneY} width={cw} height={boxLowY - botZoneY}
          fill="rgba(239,68,68,0.08)" />

        {/* Box border */}
        <rect x={PAD.l} y={boxHighY} width={cw} height={boxLowY - boxHighY}
          fill="none" stroke="#2a3048" strokeWidth="1" />

        {/* Box High */}
        <line x1={PAD.l} y1={boxHighY} x2={PAD.l + cw} y2={boxHighY}
          stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 3" />
        <text x={PAD.l + cw + 4} y={boxHighY + 4} fontSize="9" fill="#10b981">
          H ${fmt(boxHigh)}
        </text>

        {/* Midpoint */}
        <line x1={PAD.l} y1={boxMidY} x2={PAD.l + cw} y2={boxMidY}
          stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 4" />
        <text x={PAD.l + cw + 4} y={boxMidY + 4} fontSize="9" fill="#f59e0b">
          Mid
        </text>

        {/* Box Low */}
        <line x1={PAD.l} y1={boxLowY} x2={PAD.l + cw} y2={boxLowY}
          stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 3" />
        <text x={PAD.l + cw + 4} y={boxLowY + 4} fontSize="9" fill="#ef4444">
          L ${fmt(boxLow)}
        </text>

        {/* Candles */}
        {candles.map((c, i) => {
          const x = PAD.l + i * gap + gap * 0.5 - barW * 0.5;
          const isBull = c.close >= c.open;
          const color = isBull ? "#10b981" : "#ef4444";
          const bodyTop = toY(Math.max(c.open, c.close));
          const bodyBot = toY(Math.min(c.open, c.close));
          const bodyH = Math.max(1, bodyBot - bodyTop);
          const midX = x + barW / 2;
          return (
            <g key={i}>
              <line x1={midX} y1={toY(c.high)} x2={midX} y2={toY(c.low)}
                stroke={color} strokeWidth="1" opacity="0.7" />
              <rect x={x} y={bodyTop} width={barW} height={bodyH}
                fill={color} opacity="0.85" />
            </g>
          );
        })}

        {/* Current price */}
        {currY !== null && (
          <>
            <line x1={PAD.l} y1={currY} x2={PAD.l + cw} y2={currY}
              stroke="#00d4ff" strokeWidth="1.5" strokeDasharray="2 2" />
            <text x={PAD.l + cw + 4} y={currY + 4} fontSize="9" fill="#00d4ff" fontWeight="bold">
              ${fmt(currentPrice)}
            </text>
          </>
        )}

        {/* Zone labels */}
        <text x={PAD.l + 4} y={boxHighY + 12} fontSize="8" fill="#10b981" opacity="0.7">
          TOP ZONE
        </text>
        <text x={PAD.l + 4} y={boxMidY + 4} fontSize="8" fill="#f59e0b" opacity="0.7">
          MID · NO TRADE
        </text>
        <text x={PAD.l + 4} y={boxLowY - 4} fontSize="8" fill="#ef4444" opacity="0.7">
          BOTTOM ZONE
        </text>
      </svg>
    </div>
  );
}

// ─── Schematic Box Diagram (Beginner) ─────────────────────────────────────────

function BoxSchematic({ data }: { data: BoxMethodData }) {
  const { boxHigh, boxLow, boxMidpoint, boxRange, currentPrice, setupType, setupColor, pricePositionPct } = data;
  const W = 260;
  const H = 340;
  const boxX = 60;
  const boxY = 30;
  const boxW = 130;
  const boxH = 240;

  // Price marker position within schematic
  const markerY = boxY + boxH - (Math.max(0, Math.min(100, pricePositionPct)) / 100) * boxH;
  const isAbove = pricePositionPct > 100;
  const isBelow = pricePositionPct < 0;
  const clampedMarkerY = isAbove ? boxY - 14 : isBelow ? boxY + boxH + 14 : markerY;

  // Entry/stop/target markers
  const entryY = data.suggestedEntry
    ? boxY + boxH - ((data.suggestedEntry - boxLow) / (boxRange || 1)) * boxH
    : null;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 280, height: "auto" }}>
        {/* Target zone (above box) */}
        {data.bullishWatch && (
          <rect x={boxX} y={boxY - 28} width={boxW} height={28} rx="4"
            fill="rgba(16,185,129,0.12)" stroke="rgba(16,185,129,0.3)" strokeWidth="1" strokeDasharray="3 2" />
        )}
        {data.bullishWatch && (
          <text x={boxX + boxW / 2} y={boxY - 12} textAnchor="middle" fontSize="9" fill="#10b981">TARGET ZONE</text>
        )}

        {/* Stop zone (below box) */}
        {data.bearishWarning && (
          <rect x={boxX} y={boxY + boxH} width={boxW} height={28} rx="4"
            fill="rgba(239,68,68,0.1)" stroke="rgba(239,68,68,0.25)" strokeWidth="1" strokeDasharray="3 2" />
        )}
        {data.bearishWarning && !data.bullishWatch && (
          <text x={boxX + boxW / 2} y={boxY + boxH + 19} textAnchor="middle" fontSize="9" fill="#ef4444">TARGET ZONE</text>
        )}

        {/* Bottom zone (red - risk) */}
        <rect x={boxX} y={boxY + boxH * 0.67} width={boxW} height={boxH * 0.33}
          fill="rgba(239,68,68,0.1)" />

        {/* Middle zone (yellow - no trade) */}
        <rect x={boxX} y={boxY + boxH * 0.33} width={boxW} height={boxH * 0.34}
          fill="rgba(245,158,11,0.08)" />

        {/* Top zone (green - upside) */}
        <rect x={boxX} y={boxY} width={boxW} height={boxH * 0.33}
          fill="rgba(16,185,129,0.1)" />

        {/* Box border */}
        <rect x={boxX} y={boxY} width={boxW} height={boxH}
          fill="none" stroke="#2a3048" strokeWidth="1.5" />

        {/* Box High line */}
        <line x1={boxX} y1={boxY} x2={boxX + boxW} y2={boxY}
          stroke="#10b981" strokeWidth="2" />
        <text x={boxX - 4} y={boxY + 4} textAnchor="end" fontSize="9" fill="#10b981">
          ${fmt(boxHigh)}
        </text>
        <text x={boxX + boxW + 4} y={boxY + 4} textAnchor="start" fontSize="8" fill="#10b981">
          BOX HIGH
        </text>

        {/* Midpoint line */}
        <line x1={boxX} y1={boxY + boxH / 2} x2={boxX + boxW} y2={boxY + boxH / 2}
          stroke="#f59e0b" strokeWidth="1" strokeDasharray="4 3" />
        <text x={boxX - 4} y={boxY + boxH / 2 + 4} textAnchor="end" fontSize="9" fill="#f59e0b">
          ${fmt(boxMidpoint)}
        </text>
        <text x={boxX + boxW + 4} y={boxY + boxH / 2 + 4} textAnchor="start" fontSize="8" fill="#f59e0b">
          MID
        </text>

        {/* Box Low line */}
        <line x1={boxX} y1={boxY + boxH} x2={boxX + boxW} y2={boxY + boxH}
          stroke="#ef4444" strokeWidth="2" />
        <text x={boxX - 4} y={boxY + boxH + 4} textAnchor="end" fontSize="9" fill="#ef4444">
          ${fmt(boxLow)}
        </text>
        <text x={boxX + boxW + 4} y={boxY + boxH + 4} textAnchor="start" fontSize="8" fill="#ef4444">
          BOX LOW
        </text>

        {/* Zone labels inside box */}
        <text x={boxX + boxW / 2} y={boxY + 20} textAnchor="middle" fontSize="8" fill="#10b981" opacity="0.8">
          SELLER ZONE
        </text>
        <text x={boxX + boxW / 2} y={boxY + boxH / 2 + 4} textAnchor="middle" fontSize="8" fill="#f59e0b" opacity="0.8">
          ⚠ NO TRADE ZONE
        </text>
        <text x={boxX + boxW / 2} y={boxY + boxH - 8} textAnchor="middle" fontSize="8" fill="#ef4444" opacity="0.8">
          BUYER ZONE
        </text>

        {/* Current price marker */}
        <polygon
          points={`${boxX - 6},${clampedMarkerY} ${boxX + 14},${clampedMarkerY - 7} ${boxX + 14},${clampedMarkerY + 7}`}
          fill={setupColor}
        />
        <line x1={boxX + 14} y1={clampedMarkerY} x2={boxX + boxW - 4} y2={clampedMarkerY}
          stroke={setupColor} strokeWidth="1.5" strokeDasharray="3 2" />
        <text x={boxX - 8} y={clampedMarkerY - 8} textAnchor="end" fontSize="8" fill={setupColor} fontWeight="bold">
          ${fmt(currentPrice)}
        </text>
      </svg>
    </div>
  );
}

// ─── Confidence Gauge ─────────────────────────────────────────────────────────

function ConfidenceGauge({ score, color }: { score: number; color: string }) {
  const r = 42;
  const cx = 56;
  const cy = 56;
  const stroke = 8;
  const circumference = 2 * Math.PI * r;
  const progress = (score / 100) * circumference;

  const label = score >= 70 ? "HIGH" : score >= 45 ? "MODERATE" : "LOW";

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="112" height="112">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e2433" strokeWidth={stroke} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${progress} ${circumference - progress}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="20" fontWeight="bold" fill={color}>{score}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9" fill="#9aa0b4">/100</text>
        <text x={cx} y={cy + 24} textAnchor="middle" fontSize="8" fill={color}>{label}</text>
      </svg>
      <p className="text-xs" style={{ color: "#5a6075" }}>Confidence</p>
    </div>
  );
}

// ─── Paper Log Modal ──────────────────────────────────────────────────────────

interface LogEntry {
  id: string;
  ticker: string;
  timeframe: string;
  boxHigh: number;
  boxLow: number;
  setupType: string;
  entryIdea: string;
  stop: string;
  target: string;
  reason: string;
  timestamp: number;
}

function PaperLogModal({ data, resolution, onClose }: {
  data: BoxMethodData;
  resolution: string;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    entryIdea: data.suggestedEntry ? `$${fmt(data.suggestedEntry)}` : "",
    stop: data.suggestedStop ? `$${fmt(data.suggestedStop)}` : "",
    target: data.suggestedTarget ? `$${fmt(data.suggestedTarget)}` : "",
    reason: `Box method ${data.setupLabel} setup. ${data.setupDescription}`,
  });

  function save() {
    const entry: LogEntry = {
      id: `bm-${Date.now()}`,
      ticker: data.symbol,
      timeframe: resolution,
      boxHigh: data.boxHigh,
      boxLow: data.boxLow,
      setupType: data.setupLabel,
      entryIdea: form.entryIdea,
      stop: form.stop,
      target: form.target,
      reason: form.reason,
      timestamp: Date.now(),
    };
    const existing: LogEntry[] = JSON.parse(localStorage.getItem("edge-box-journal") ?? "[]");
    localStorage.setItem("edge-box-journal", JSON.stringify([entry, ...existing].slice(0, 100)));
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold" style={{ color: "#e8eaf0" }}>Log Box Setup</h3>
            <p className="text-xs" style={{ color: "#5a6075" }}>{data.symbol} · {resolution} · {data.setupLabel}</p>
          </div>
          <button onClick={onClose} style={{ color: "#5a6075" }}>✕</button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2 text-xs rounded-lg p-3" style={{ background: "#141720", border: "1px solid #1e2433" }}>
            <div><p style={{ color: "#5a6075" }}>Box High</p><p className="font-bold" style={{ color: "#10b981" }}>${fmt(data.boxHigh)}</p></div>
            <div><p style={{ color: "#5a6075" }}>Box Mid</p><p className="font-bold" style={{ color: "#f59e0b" }}>${fmt(data.boxMidpoint)}</p></div>
            <div><p style={{ color: "#5a6075" }}>Box Low</p><p className="font-bold" style={{ color: "#ef4444" }}>${fmt(data.boxLow)}</p></div>
          </div>

          {(["entryIdea", "stop", "target", "reason"] as const).map(key => (
            <div key={key}>
              <label className="text-xs font-medium block mb-1" style={{ color: "#9aa0b4" }}>
                {key === "entryIdea" ? "Entry Idea" : key === "stop" ? "Stop / Invalidation" : key === "target" ? "Target" : "Reason / Thesis"}
              </label>
              {key === "reason" ? (
                <textarea
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  rows={3}
                  className="w-full text-xs rounded-lg px-3 py-2 outline-none resize-none"
                  style={{ background: "#141720", border: "1px solid #1e2433", color: "#e8eaf0" }}
                />
              ) : (
                <input
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full text-xs rounded-lg px-3 py-2 outline-none"
                  style={{ background: "#141720", border: "1px solid #1e2433", color: "#e8eaf0" }}
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-5">
          <button
            onClick={save}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            style={{ background: "rgba(0,212,255,0.1)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.25)" }}
          >
            Save to Journal
          </button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm" style={{ color: "#5a6075" }}>
            Cancel
          </button>
        </div>
        <p className="text-xs text-center mt-3" style={{ color: "#5a6075" }}>Saved to localStorage · Educational only</p>
      </div>
    </div>
  );
}

// ─── Box Journal ──────────────────────────────────────────────────────────────

function BoxJournal() {
  const [entries, setEntries] = useState<LogEntry[]>([]);

  useEffect(() => {
    setEntries(JSON.parse(localStorage.getItem("edge-box-journal") ?? "[]"));
  }, []);

  function remove(id: string) {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    localStorage.setItem("edge-box-journal", JSON.stringify(updated));
  }

  if (!entries.length) return (
    <p className="text-xs text-center py-6" style={{ color: "#5a6075" }}>No box setups logged yet. Analyze a setup above and click "Log Box Setup".</p>
  );

  return (
    <div className="space-y-2">
      {entries.map(e => (
        <div key={e.id} className="rounded-xl p-3 flex gap-3 items-start" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
          <div className="flex-1 min-w-0">
            <div className="flex gap-2 items-center mb-1 flex-wrap">
              <span className="text-sm font-bold" style={{ color: "#e8eaf0" }}>{e.ticker}</span>
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#141720", color: "#9aa0b4" }}>{e.timeframe}</span>
              <span className="text-xs font-medium" style={{ color: "#00d4ff" }}>{e.setupType}</span>
            </div>
            <div className="flex gap-3 text-xs mb-1 flex-wrap">
              <span style={{ color: "#10b981" }}>H: ${e.boxHigh.toFixed(2)}</span>
              <span style={{ color: "#ef4444" }}>L: ${e.boxLow.toFixed(2)}</span>
              <span style={{ color: "#9aa0b4" }}>Entry: {e.entryIdea}</span>
              <span style={{ color: "#9aa0b4" }}>Stop: {e.stop}</span>
            </div>
            <p className="text-xs" style={{ color: "#5a6075" }}>{e.reason.slice(0, 100)}{e.reason.length > 100 ? "…" : ""}</p>
          </div>
          <button onClick={() => remove(e.id)} className="text-xs" style={{ color: "#5a6075" }}>✕</button>
        </div>
      ))}
    </div>
  );
}

// ─── Coaching Panel ───────────────────────────────────────────────────────────

function CoachingPanel({ data, isBeginner }: { data: BoxMethodData; isBeginner: boolean }) {
  const { setupType, setupLabel, boxHigh, boxLow, boxMidpoint, currentPrice, bullishWatch, bearishWarning, noTrade, setupColor } = data;

  const coachingPoints = isBeginner ? [
    {
      icon: "📦",
      title: "What is the box?",
      text: `The box is defined by the recent high (${fmt(boxHigh)}) and low (${fmt(boxLow)}) over the last 20 candles. It shows where the market has been consolidating — buyers defending the bottom, sellers defending the top.`,
    },
    {
      icon: "🟢",
      title: "Where do buyers defend?",
      text: `The BOX LOW at $${fmt(boxLow)} is where buyers have pushed back before. If price returns here with a rejection candle, that's a potential support area.`,
    },
    {
      icon: "🔴",
      title: "Where do sellers defend?",
      text: `The BOX HIGH at $${fmt(boxHigh)} is where sellers have pushed back before. If price reaches here and shows rejection, that's a potential resistance area.`,
    },
    {
      icon: "⚠️",
      title: "Why is the middle dangerous?",
      text: `The midpoint at $${fmt(boxMidpoint)} is the worst entry zone. You're too far from support to have a tight stop-loss (going long), and too far from resistance to have a tight stop-loss (going short). Risk/reward is poor here.`,
    },
    {
      icon: "❌",
      title: "Where is the trade invalid?",
      text: bullishWatch
        ? `A long trade idea is invalid if price closes back inside the box after a breakout, or if it breaks below the box low ($${fmt(boxLow)}) — that signals sellers are winning.`
        : bearishWarning
        ? `A short trade idea is invalid if price closes back inside the box after a breakdown, or if it breaks above the box high ($${fmt(boxHigh)}) — that signals buyers are winning.`
        : `With no directional setup, wait for price to reach the box extremes. Invalid to trade in the middle.`,
    },
    {
      icon: "✅",
      title: "What confirmation is needed?",
      text: "Before acting: (1) Wait for price to reach the box high or low. (2) Watch for a confirmation candle — a clear close showing direction. (3) Volume should be above average on the confirmation candle. (4) Never enter on a wick alone — wait for the candle to close.",
    },
  ] : [
    {
      icon: "🏛️",
      title: "Box formation logic",
      text: `Range defined from last 20 candles: H=${fmt(boxHigh)}, L=${fmt(boxLow)}, Range=${fmt(data.boxRange)}. ${data.hasDisplacement ? `Displacement candle detected at ${data.displacementSize?.toFixed(1)}x ATR (${data.displacementDirection} direction) — confirms institutional participation in range creation.` : "No significant displacement candle — range may be consolidation-based rather than displacement-based."}`,
    },
    {
      icon: "🔍",
      title: "Current setup classification",
      text: `${setupLabel}: ${data.setupDescription} RSI ${data.rsi ?? "N/A"} · Rel Vol ${data.relativeVolume ?? "N/A"}x · ATR $${fmt(data.atr)} · SMA20 $${fmt(data.sma20)}.`,
    },
    {
      icon: "📊",
      title: "Zone analysis",
      text: `Price at $${fmt(currentPrice)} = ${data.pricePositionPct.toFixed(1)}% of box range from low. Zone: ${data.priceZone.replace(/_/g, " ").toUpperCase()}. Top zone (>67%): institutional resistance / breakout preparation. Middle zone (33–67%): low-probability entries, avoid. Bottom zone (<33%): institutional support / breakdown preparation.`,
    },
    {
      icon: "🎯",
      title: "Entry thesis",
      text: data.suggestedEntry
        ? `Suggested entry: $${fmt(data.suggestedEntry)} | Stop: $${fmt(data.suggestedStop)} | Target: $${fmt(data.suggestedTarget)} | R:R = ${data.rrRatio}:1. Entry logic: ${bullishWatch ? "wait for confirmation candle at box level, enter on close with stop below level" : bearishWarning ? "wait for rejection candle at box level, enter on close with stop above level" : "no clean entry — middle zone trade"}.`
        : "No entry levels calculated — no directional setup detected. Price in no-trade zone or insufficient data.",
    },
    {
      icon: "⚖️",
      title: "Invalidation",
      text: bullishWatch
        ? `Long invalidated: close below $${fmt(boxLow)} (box low), or re-entry into box after breakout without reclaim. ATR-based stop buffer: $${fmt(data.atr)}.`
        : bearishWarning
        ? `Short invalidated: close above $${fmt(boxHigh)} (box high), or re-entry into box after breakdown without reclaim. ATR-based stop buffer: $${fmt(data.atr)}.`
        : `No directional setup — standard invalidation: any close beyond either box extreme confirms a directional break.`,
    },
    {
      icon: "📈",
      title: "Market context",
      text: `SMA20: $${fmt(data.sma20)} → price is ${currentPrice && data.sma20 ? (currentPrice > data.sma20 ? "ABOVE" : "BELOW") : "N/A"} fair value. ${data.rsi !== null ? `RSI ${data.rsi} — ${data.rsi > 65 ? "overbought: caution on longs" : data.rsi < 35 ? "oversold: caution on shorts" : "neutral momentum"}` : "RSI unavailable"}. Confidence ${data.confidence}/100.`,
    },
  ];

  return (
    <div className="space-y-3">
      {coachingPoints.map((point, i) => (
        <div key={i} className="rounded-xl p-3" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
          <div className="flex items-center gap-2 mb-1">
            <span>{point.icon}</span>
            <span className="text-xs font-semibold" style={{ color: "#e8eaf0" }}>{point.title}</span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "#9aa0b4" }}>{point.text}</p>
        </div>
      ))}
    </div>
  );
}

// ─── TradingView Chart ────────────────────────────────────────────────────────

function TradingViewChart({ symbol, resolution }: { symbol: string; resolution: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const tvRes = resolution === "D" ? "D" : resolution;

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol, interval: tvRes, timezone: "America/New_York", theme: "dark", style: "1",
      locale: "en", allow_symbol_change: false, calendar: false,
      studies: ["STD;VWAP", "STD;Volume"],
      backgroundColor: "rgba(10,11,13,1)", gridColor: "rgba(30,36,51,0.8)",
      width: "100%", height: "100%",
    });
    ref.current.appendChild(script);
  }, [symbol, tvRes]);

  return (
    <div className="tradingview-widget-container" ref={ref} style={{ height: "100%", width: "100%" }}>
      <div className="tradingview-widget-container__widget" style={{ height: "calc(100% - 32px)", width: "100%" }} />
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function BoxMethodPage() {
  const { isBeginner } = useMode();
  const [symbol, setSymbol] = useState("SPY");
  const [customSymbol, setCustomSymbol] = useState("");
  const [resolution, setResolution] = useState("D");
  const [data, setData] = useState<BoxMethodData | null>(null);
  const [loading, setLoading] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"analysis" | "chart" | "journal">("analysis");
  const [error, setError] = useState<string | null>(null);

  const activeTicker = customSymbol.trim().toUpperCase() || symbol;

  const analyze = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/box-method?symbol=${activeTicker}&resolution=${resolution}`);
      if (!res.ok) throw new Error("API error");
      const json: BoxMethodData = await res.json();
      if (!json.valid) {
        setError(json.message ?? "Unable to analyze — Finnhub API key required.");
        setData(null);
      } else {
        setData(json);
      }
    } catch {
      setError("Failed to fetch data. Check your Finnhub API key in API Setup.");
    }
    setLoading(false);
  }, [activeTicker, resolution]);

  useEffect(() => { analyze(); }, [analyze]);

  const setupColor = data?.setupColor ?? "#9aa0b4";

  return (
    <div style={{ minHeight: "100vh", background: "#0a0b0d" }}>
      <Navbar />
      {logOpen && data && <PaperLogModal data={data} resolution={resolution} onClose={() => setLogOpen(false)} />}

      <div className="max-w-7xl mx-auto px-4 pt-8 pb-24">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-3"
              style={{ background: "rgba(0,212,255,0.08)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.2)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              Box Method Analyzer
            </div>
            <h1 className="text-3xl font-bold" style={{ color: "#e8eaf0" }}>
              Box <span style={{ color: "#00d4ff" }}>Method</span>
            </h1>
            <p className="text-sm mt-1" style={{ color: "#9aa0b4" }}>
              {isBeginner
                ? "Identify trading ranges, understand where buyers and sellers are, and know when NOT to trade."
                : "Range-box detection engine · Displacement analysis · Zone classification · Confidence scoring"}
            </p>
          </div>
          <ModeToggle />
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-2 mb-6">
          <div className="flex gap-1.5 flex-wrap">
            {TICKERS.map(t => (
              <button key={t} onClick={() => { setSymbol(t); setCustomSymbol(""); }}
                className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                style={{
                  background: activeTicker === t ? "rgba(0,212,255,0.12)" : "#0f1117",
                  color: activeTicker === t ? "#00d4ff" : "#9aa0b4",
                  border: `1px solid ${activeTicker === t ? "rgba(0,212,255,0.3)" : "#1e2433"}`,
                }}>
                {t}
              </button>
            ))}
          </div>
          <input
            value={customSymbol}
            onChange={e => setCustomSymbol(e.target.value.toUpperCase())}
            placeholder="Custom ticker…"
            className="text-xs px-3 py-1.5 rounded-lg outline-none w-28"
            style={{ background: "#0f1117", border: "1px solid #1e2433", color: "#e8eaf0" }}
            onKeyDown={e => e.key === "Enter" && analyze()}
          />
          <div className="flex gap-1">
            {RESOLUTIONS.map(r => (
              <button key={r.value} onClick={() => setResolution(r.value)}
                className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                style={{
                  background: resolution === r.value ? "rgba(139,92,246,0.12)" : "#0f1117",
                  color: resolution === r.value ? "#8b5cf6" : "#9aa0b4",
                  border: `1px solid ${resolution === r.value ? "rgba(139,92,246,0.3)" : "#1e2433"}`,
                }}>
                {r.label}
              </button>
            ))}
          </div>
          <button onClick={analyze}
            className="text-xs px-4 py-1.5 rounded-lg font-semibold"
            style={{ background: "rgba(0,212,255,0.1)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.25)" }}>
            Analyze
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5">
          {(["analysis", "chart", "journal"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="text-xs px-4 py-2 rounded-lg font-medium capitalize transition-all"
              style={{
                background: activeTab === tab ? "rgba(0,212,255,0.1)" : "#0f1117",
                color: activeTab === tab ? "#00d4ff" : "#9aa0b4",
                border: `1px solid ${activeTab === tab ? "rgba(0,212,255,0.25)" : "#1e2433"}`,
              }}>
              {tab === "analysis" ? "📦 Analysis" : tab === "chart" ? "📈 Chart" : "📓 Journal"}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl p-4 mb-5 flex gap-3 items-start"
            style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <span>⚠️</span>
            <div>
              <p className="text-sm font-medium" style={{ color: "#ef4444" }}>Data unavailable</p>
              <p className="text-xs mt-0.5" style={{ color: "#9aa0b4" }}>{error} Configure your Finnhub API key in /api-setup to enable live data.</p>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !data && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl p-5 animate-pulse" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
                <div className="h-4 rounded w-1/3 mb-3" style={{ background: "#1e2433" }} />
                <div className="h-24 rounded" style={{ background: "#1e2433" }} />
              </div>
            ))}
          </div>
        )}

        {/* ── ANALYSIS TAB ── */}
        {activeTab === "analysis" && data && (
          <div className="space-y-5">
            {/* Setup Decision Banner */}
            <div className="rounded-2xl p-5"
              style={{ background: `${setupColor}0a`, border: `1px solid ${setupColor}30` }}>
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#5a6075" }}>
                    {activeTicker} · {RESOLUTIONS.find(r => r.value === resolution)?.label} · Box Method
                  </p>
                  <h2 className="text-2xl font-bold mb-1" style={{ color: setupColor }}>{data.setupLabel}</h2>
                  <p className="text-sm leading-relaxed max-w-md" style={{ color: "#9aa0b4" }}>
                    {isBeginner ? data.beginnerExplanation : data.setupDescription}
                  </p>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {data.bullishWatch && <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}>▲ BULLISH WATCH</span>}
                    {data.bearishWarning && <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>▼ BEARISH WARNING</span>}
                    {data.noTrade && <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}>⛔ NO TRADE ZONE</span>}
                    {data.hasDisplacement && (
                      <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: "rgba(139,92,246,0.12)", color: "#8b5cf6" }}>
                        ⚡ Displacement {data.displacementSize?.toFixed(1)}x ATR
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <ConfidenceGauge score={data.confidence} color={setupColor} />
                  {data.currentPrice && (
                    <div className="text-right">
                      <p className="text-2xl font-bold" style={{ color: "#e8eaf0" }}>${fmt(data.currentPrice)}</p>
                      {data.changePercent !== null && (
                        <p className="text-sm font-medium" style={{ color: data.changePercent >= 0 ? "#10b981" : "#ef4444" }}>
                          {data.changePercent >= 0 ? "+" : ""}{data.changePercent}%
                        </p>
                      )}
                      <button onClick={() => setLogOpen(true)}
                        className="mt-2 text-xs px-3 py-1.5 rounded-lg font-semibold"
                        style={{ background: "rgba(0,212,255,0.1)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.25)" }}>
                        Log Box Setup
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Box Visualization + Entry Levels */}
            <div className="grid md:grid-cols-3 gap-5">
              {/* Schematic / Chart */}
              <div className="rounded-2xl p-4" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#5a6075" }}>
                  {isBeginner ? "Box Schematic" : "Box Structure Map"}
                </p>
                {isBeginner ? <BoxSchematic data={data} /> : <BoxChart data={data} />}
              </div>

              {/* Entry/Stop/Target */}
              <div className="space-y-3">
                <div className="rounded-2xl p-4" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#5a6075" }}>Box Levels</p>
                  {[
                    { label: "Box High", value: data.boxHigh, color: "#10b981", sublabel: "Resistance / Breakout level" },
                    { label: "Midpoint", value: data.boxMidpoint, color: "#f59e0b", sublabel: "No-trade zone — poor R:R" },
                    { label: "Box Low", value: data.boxLow, color: "#ef4444", sublabel: "Support / Breakdown level" },
                    { label: "Box Range", value: data.boxRange, color: "#9aa0b4", sublabel: "Total range width" },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b" style={{ borderColor: "#1e2433" }}>
                      <div>
                        <p className="text-xs font-medium" style={{ color: item.color }}>{item.label}</p>
                        <p className="text-xs" style={{ color: "#5a6075" }}>{item.sublabel}</p>
                      </div>
                      <p className="text-sm font-bold" style={{ color: item.color }}>${fmt(item.value)}</p>
                    </div>
                  ))}
                </div>

                {!data.noTrade && (
                  <div className="rounded-2xl p-4" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#5a6075" }}>Suggested Levels</p>
                    {[
                      { label: "Entry", value: data.suggestedEntry, color: "#00d4ff" },
                      { label: "Stop", value: data.suggestedStop, color: "#ef4444" },
                      { label: "Target", value: data.suggestedTarget, color: "#10b981" },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: "#1e2433" }}>
                        <p className="text-xs font-medium" style={{ color: "#9aa0b4" }}>{item.label}</p>
                        <p className="text-sm font-bold" style={{ color: item.color }}>
                          {item.value ? `$${fmt(item.value)}` : "—"}
                        </p>
                      </div>
                    ))}
                    {data.rrRatio && (
                      <div className="mt-2 rounded-lg p-2 text-center" style={{ background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.15)" }}>
                        <p className="text-xs" style={{ color: "#5a6075" }}>Risk:Reward</p>
                        <p className="text-lg font-bold" style={{ color: "#00d4ff" }}>{data.rrRatio}:1</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Technical context */}
              <div className="space-y-3">
                <div className="rounded-2xl p-4" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#5a6075" }}>Technical Context</p>
                  {[
                    { label: "RSI (14)", value: data.rsi !== null ? `${data.rsi}` : "—", color: data.rsi ? (data.rsi > 65 ? "#ef4444" : data.rsi < 35 ? "#10b981" : "#9aa0b4") : "#9aa0b4" },
                    { label: "Rel Volume", value: data.relativeVolume !== null ? `${data.relativeVolume}x` : "—", color: data.relativeVolume && data.relativeVolume > 1.5 ? "#10b981" : "#9aa0b4" },
                    { label: "ATR (14)", value: data.atr ? `$${fmt(data.atr)}` : "—", color: "#9aa0b4" },
                    { label: "SMA20", value: data.sma20 ? `$${fmt(data.sma20)}` : "—", color: "#9aa0b4" },
                    { label: "Price Zone", value: data.priceZone.replace(/_/g, " "), color: setupColor },
                    { label: "Candles Analyzed", value: `${data.candlesAnalyzed}`, color: "#5a6075" },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-1.5 border-b last:border-0" style={{ borderColor: "#1e2433" }}>
                      <p className="text-xs" style={{ color: "#5a6075" }}>{item.label}</p>
                      <p className="text-xs font-bold capitalize" style={{ color: item.color }}>{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Confidence Factors */}
                <div className="rounded-2xl p-4" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#5a6075" }}>Confidence Breakdown</p>
                  <div className="space-y-2">
                    {data.confidenceFactors.map(f => (
                      <div key={f.name}>
                        <div className="flex justify-between mb-0.5">
                          <span className="text-xs" style={{ color: "#9aa0b4" }}>{f.name}</span>
                          <span className="text-xs font-medium" style={{ color: setupColor }}>{f.score}/{f.max}</span>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ background: "#1e2433" }}>
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${(f.score / f.max) * 100}%`, background: setupColor }} />
                        </div>
                        {!isBeginner && (
                          <p className="text-xs mt-0.5" style={{ color: "#5a6075" }}>{f.reason}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Coaching Panel */}
            <div className="rounded-2xl p-5" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
              <div className="flex items-center gap-2 mb-4">
                <span>{isBeginner ? "🎓" : "🏛️"}</span>
                <p className="text-sm font-semibold" style={{ color: "#e8eaf0" }}>
                  {isBeginner ? "Coaching Panel" : "Institutional Context"}
                </p>
                <ModeToggle />
              </div>
              <CoachingPanel data={data} isBeginner={isBeginner} />
            </div>

            {/* Advanced chart view (beginner = always show schematic above) */}
            {!isBeginner && (
              <div className="rounded-2xl p-4" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#5a6075" }}>
                  Mini Candle Chart with Box Overlay
                </p>
                <BoxChart data={data} />
              </div>
            )}
          </div>
        )}

        {/* ── CHART TAB ── */}
        {activeTab === "chart" && (
          <div className="rounded-2xl overflow-hidden" style={{ height: 520, border: "1px solid #1e2433" }}>
            <TradingViewChart symbol={activeTicker} resolution={resolution} />
          </div>
        )}

        {/* ── JOURNAL TAB ── */}
        {activeTab === "journal" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold" style={{ color: "#e8eaf0" }}>Box Setup Journal</p>
              {data && (
                <button onClick={() => setLogOpen(true)}
                  className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                  style={{ background: "rgba(0,212,255,0.1)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.25)" }}>
                  + Log Current Setup
                </button>
              )}
            </div>
            <BoxJournal />
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-8 rounded-xl p-4 flex gap-3 items-start"
          style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)" }}>
          <span className="text-lg flex-shrink-0">⚠️</span>
          <p className="text-xs leading-relaxed" style={{ color: "#9aa0b4" }}>
            <strong style={{ color: "#f59e0b" }}>Educational only · Not financial advice.</strong>{" "}
            Box Method analysis is an educational framework. Box levels, confidence scores, and entry suggestions are algorithmic — not trade recommendations. No outcome is guaranteed. Boxes can expand, break, or fail. Always paper trade first and understand your risk before using real capital.
          </p>
        </div>
      </div>
    </div>
  );
}

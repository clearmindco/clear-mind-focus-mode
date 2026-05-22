"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import ModeToggle from "@/components/ModeToggle";
import { useMode } from "@/lib/mode-context";
import type { BoxMethodData, BoxType, ConfirmationStatus } from "@/app/api/box-method/route";

// ─── Constants ────────────────────────────────────────────────────────────────

const TICKERS = ["SPY", "QQQ", "IWM", "NVDA", "TSLA", "AAPL", "AMD", "META", "AMZN", "MSFT", "COIN", "PLTR", "GOOGL", "NFLX", "MSTR", "SQQQ"];

const BOX_TYPES: { value: BoxType; label: string; desc: string }[] = [
  { value: "previous_day", label: "Previous Day Box", desc: "PDH / PDL / EQ" },
  { value: "opening_range", label: "Opening Range Box", desc: "ORB High / Low" },
  { value: "intraday_range", label: "Intraday Range", desc: "Recent 20-candle range" },
];

const ORB_WINDOWS = [
  { value: "5", label: "5m ORB" },
  { value: "15", label: "15m ORB" },
  { value: "30", label: "30m ORB" },
];

const INTRADAY_RES = [
  { value: "5", label: "5m" },
  { value: "15", label: "15m" },
  { value: "60", label: "1H" },
  { value: "D", label: "Daily" },
];

function fmt(v: number | null, dec = 2): string {
  if (v == null) return "—";
  return v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function boxHighLabel(boxType: BoxType) {
  return boxType === "previous_day" ? "PDH" : boxType === "opening_range" ? "ORB High" : "Range High";
}
function boxLowLabel(boxType: BoxType) {
  return boxType === "previous_day" ? "PDL" : boxType === "opening_range" ? "ORB Low" : "Range Low";
}

// ─── Confirmation Status Panel ────────────────────────────────────────────────

const CONFIRM_META: Record<ConfirmationStatus, { color: string; bg: string; icon: string }> = {
  long_confirmed:       { color: "#059669", bg: "rgba(5,150,105,0.1)",   icon: "✓" },
  short_confirmed:      { color: "#b91c1c", bg: "rgba(185,28,28,0.1)",   icon: "✓" },
  watching_for_long:    { color: "#10b981", bg: "rgba(16,185,129,0.08)", icon: "👁" },
  watching_for_short:   { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", icon: "👁" },
  not_triggered:        { color: "#5a6075", bg: "rgba(90,96,117,0.06)",  icon: "○" },
};

function ConfirmationPanel({ data }: { data: BoxMethodData }) {
  const m = CONFIRM_META[data.confirmationStatus];
  return (
    <div className="rounded-xl p-4" style={{ background: m.bg, border: `1px solid ${m.color}25` }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base" style={{ color: m.color }}>{m.icon}</span>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: m.color }}>
          Confirmation Status
        </p>
      </div>
      <p className="text-sm font-bold mb-2" style={{ color: m.color }}>{data.confirmationLabel}</p>
      <p className="text-xs leading-relaxed" style={{ color: "#9aa0b4" }}>
        <strong style={{ color: "#e8eaf0" }}>Rule: </strong>
        One candle signals. The next candle proves. Do not act on the signal candle alone — wait for the confirmation candle to close above (for longs) or below (for shorts) the signal candle's range.
      </p>
    </div>
  );
}

// ─── Confidence Gauge ─────────────────────────────────────────────────────────

function ConfidenceGauge({ score, color, label }: { score: number; color: string; label: string }) {
  const r = 42;
  const circumference = 2 * Math.PI * r;
  const progress = (score / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="112" height="112">
        <circle cx="56" cy="56" r={r} fill="none" stroke="#1e2433" strokeWidth="8" />
        <circle cx="56" cy="56" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${progress} ${circumference - progress}`}
          strokeLinecap="round" transform="rotate(-90 56 56)" />
        <text x="56" y="50" textAnchor="middle" fontSize="20" fontWeight="bold" fill={color}>{score}</text>
        <text x="56" y="64" textAnchor="middle" fontSize="8" fill="#9aa0b4">/100</text>
      </svg>
      <p className="text-xs font-semibold text-center" style={{ color }}>{label}</p>
    </div>
  );
}

// ─── Box SVG Chart (mini candle chart with box overlay) ───────────────────────

function BoxChart({ data }: { data: BoxMethodData }) {
  const { candles, boxHigh, boxLow, midpoint, currentPrice, boxType } = data;
  if (!candles.length) return <div className="h-48 flex items-center justify-center text-xs" style={{ color: "#5a6075" }}>No candle data</div>;

  const W = 560; const H = 280;
  const PAD = { t: 24, r: 80, b: 20, l: 8 };
  const cw = W - PAD.l - PAD.r;
  const ch = H - PAD.t - PAD.b;

  const priceMin = Math.min(...candles.map(c => c.low), boxLow) * 0.997;
  const priceMax = Math.max(...candles.map(c => c.high), boxHigh, currentPrice ?? boxHigh) * 1.003;
  const priceRange = priceMax - priceMin;
  const toY = (p: number) => PAD.t + ch - ((p - priceMin) / priceRange) * ch;

  const barW = Math.max(2, (cw / candles.length) * 0.65);
  const gap = cw / candles.length;

  const boxHighY = toY(boxHigh);
  const boxLowY = toY(boxLow);
  const midY = toY(midpoint);
  const topZoneY = toY(boxLow + (boxHigh - boxLow) * 0.67);
  const botZoneY = toY(boxLow + (boxHigh - boxLow) * 0.33);
  const currY = currentPrice ? toY(currentPrice) : null;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        {/* Zone shading */}
        <rect x={PAD.l} y={boxHighY} width={cw} height={topZoneY - boxHighY} fill="rgba(16,185,129,0.07)" />
        <rect x={PAD.l} y={topZoneY} width={cw} height={botZoneY - topZoneY} fill="rgba(245,158,11,0.06)" />
        <rect x={PAD.l} y={botZoneY} width={cw} height={boxLowY - botZoneY} fill="rgba(239,68,68,0.07)" />

        {/* Box border */}
        <rect x={PAD.l} y={boxHighY} width={cw} height={boxLowY - boxHighY}
          fill="none" stroke="#2a3048" strokeWidth="1" />

        {/* PDH / ORB High / Range High */}
        <line x1={PAD.l} y1={boxHighY} x2={PAD.l + cw} y2={boxHighY}
          stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 3" />
        <text x={PAD.l + cw + 4} y={boxHighY + 4} fontSize="9" fill="#10b981">
          {boxHighLabel(boxType)} ${fmt(boxHigh)}
        </text>

        {/* EQ / Midpoint */}
        <line x1={PAD.l} y1={midY} x2={PAD.l + cw} y2={midY}
          stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 4" />
        <text x={PAD.l + cw + 4} y={midY + 4} fontSize="9" fill="#f59e0b">EQ</text>

        {/* PDL / ORB Low / Range Low */}
        <line x1={PAD.l} y1={boxLowY} x2={PAD.l + cw} y2={boxLowY}
          stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 3" />
        <text x={PAD.l + cw + 4} y={boxLowY + 4} fontSize="9" fill="#ef4444">
          {boxLowLabel(boxType)} ${fmt(boxLow)}
        </text>

        {/* Zone labels */}
        <text x={PAD.l + 4} y={boxHighY + 12} fontSize="8" fill="#10b981" opacity="0.6">SELLER ZONE / RESISTANCE</text>
        <text x={PAD.l + 4} y={midY + 4} fontSize="8" fill="#f59e0b" opacity="0.6">⚠ NO TRADE ZONE · MIDDLE</text>
        <text x={PAD.l + 4} y={boxLowY - 4} fontSize="8" fill="#ef4444" opacity="0.6">BUYER ZONE / SUPPORT</text>

        {/* Candles */}
        {candles.map((c, i) => {
          const x = PAD.l + i * gap + gap * 0.5 - barW * 0.5;
          const isBull = c.close >= c.open;
          const col = isBull ? "#10b981" : "#ef4444";
          const bodyTop = toY(Math.max(c.open, c.close));
          const bodyBot = toY(Math.min(c.open, c.close));
          const bH = Math.max(1, bodyBot - bodyTop);
          const midX = x + barW / 2;
          return (
            <g key={i}>
              <line x1={midX} y1={toY(c.high)} x2={midX} y2={toY(c.low)} stroke={col} strokeWidth="1" opacity="0.7" />
              <rect x={x} y={bodyTop} width={barW} height={bH} fill={col} opacity="0.85" />
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
      </svg>
    </div>
  );
}

// ─── Box Schematic (beginner mode) ───────────────────────────────────────────

function BoxSchematic({ data }: { data: BoxMethodData }) {
  const { boxHigh, boxLow, midpoint, currentPrice, setupColor, pricePositionPct, boxType } = data;
  const W = 260; const H = 380;
  const bX = 60; const bY = 40; const bW = 130; const bH = 260;

  const clamp = (pct: number) => Math.max(-15, Math.min(115, pct));
  const markerY = bY + bH - (clamp(pricePositionPct) / 100) * bH;
  const isAbove = pricePositionPct > 100;
  const isBelow = pricePositionPct < 0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 280, height: "auto", display: "block", margin: "0 auto" }}>
      {/* Target area above (bullish) */}
      {data.setupType !== "NO_TRADE" && data.setupType !== "WATCHING" && (SETUP_IS_BULLISH[data.setupType]) && (
        <>
          <rect x={bX} y={bY - 32} width={bW} height={32} rx="4"
            fill="rgba(16,185,129,0.1)" stroke="rgba(16,185,129,0.3)" strokeWidth="1" strokeDasharray="3 2" />
          <text x={bX + bW / 2} y={bY - 14} textAnchor="middle" fontSize="9" fill="#10b981">TARGET ZONE</text>
        </>
      )}

      {/* Zone fills */}
      <rect x={bX} y={bY} width={bW} height={bH * 0.33} fill="rgba(239,68,68,0.08)" />
      <rect x={bX} y={bY + bH * 0.33} width={bW} height={bH * 0.34} fill="rgba(245,158,11,0.07)" />
      <rect x={bX} y={bY + bH * 0.67} width={bW} height={bH * 0.33} fill="rgba(16,185,129,0.08)" />

      {/* Box border */}
      <rect x={bX} y={bY} width={bW} height={bH} fill="none" stroke="#2a3048" strokeWidth="1.5" />

      {/* Box High — PDH/ORB H/Range H */}
      <line x1={bX} y1={bY} x2={bX + bW} y2={bY} stroke="#ef4444" strokeWidth="2" />
      <text x={bX - 4} y={bY + 5} textAnchor="end" fontSize="9" fill="#ef4444">${fmt(boxHigh)}</text>
      <text x={bX + bW + 4} y={bY + 5} textAnchor="start" fontSize="8" fill="#ef4444">{boxHighLabel(boxType)}</text>

      {/* Midpoint — EQ */}
      <line x1={bX} y1={bY + bH / 2} x2={bX + bW} y2={bY + bH / 2}
        stroke="#f59e0b" strokeWidth="1" strokeDasharray="4 3" />
      <text x={bX - 4} y={bY + bH / 2 + 5} textAnchor="end" fontSize="9" fill="#f59e0b">${fmt(midpoint)}</text>
      <text x={bX + bW + 4} y={bY + bH / 2 + 5} textAnchor="start" fontSize="8" fill="#f59e0b">EQ</text>

      {/* Box Low — PDL/ORB L/Range L */}
      <line x1={bX} y1={bY + bH} x2={bX + bW} y2={bY + bH} stroke="#10b981" strokeWidth="2" />
      <text x={bX - 4} y={bY + bH + 5} textAnchor="end" fontSize="9" fill="#10b981">${fmt(boxLow)}</text>
      <text x={bX + bW + 4} y={bY + bH + 5} textAnchor="start" fontSize="8" fill="#10b981">{boxLowLabel(boxType)}</text>

      {/* Zone labels */}
      <text x={bX + bW / 2} y={bY + 18} textAnchor="middle" fontSize="8" fill="#ef4444" opacity="0.8">SELLERS DEFEND HERE</text>
      <text x={bX + bW / 2} y={bY + bH / 2 + 5} textAnchor="middle" fontSize="8" fill="#f59e0b" opacity="0.8">⚠ DO NOT TRADE HERE</text>
      <text x={bX + bW / 2} y={bY + bH - 6} textAnchor="middle" fontSize="8" fill="#10b981" opacity="0.8">BUYERS DEFEND HERE</text>

      {/* Current price marker */}
      <polygon points={`${bX - 8},${markerY} ${bX + 12},${markerY - 7} ${bX + 12},${markerY + 7}`}
        fill={setupColor} />
      <line x1={bX + 12} y1={markerY} x2={bX + bW - 4} y2={markerY}
        stroke={setupColor} strokeWidth="1.5" strokeDasharray="3 2" />
      <text x={bX - 10} y={markerY - 8} textAnchor="end" fontSize="8" fill={setupColor} fontWeight="bold">
        ${fmt(currentPrice)}
      </text>
      <text x={bX + bW / 2} y={markerY + (isAbove ? -14 : 14)} textAnchor="middle" fontSize="8" fill={setupColor}>
        {isAbove ? "▲ ABOVE BOX" : isBelow ? "▼ BELOW BOX" : `${pricePositionPct.toFixed(0)}% of box`}
      </text>
    </svg>
  );
}

// Lookup for bullish setups (used in schematic)
const SETUP_IS_BULLISH: Partial<Record<BoxMethodData["setupType"], boolean>> = {
  LONG_SETUP_WATCH: true,
  BREAKOUT_RETEST_LONG: true,
  FAILED_BREAKOUT_LONG: true,
  BREAKOUT_ABOVE: true,
};

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

// ─── Paper Log Modal ──────────────────────────────────────────────────────────

interface LogEntry {
  id: string;
  ticker: string;
  boxType: string;
  resolution: string;
  boxHigh: number;
  boxLow: number;
  midpoint: number;
  setupType: string;
  entryTrigger: string;
  stop: string;
  target1: string;
  target2: string;
  confidence: number;
  reasoning: string;
  risks: string;
  timestamp: number;
}

function PaperLogModal({ data, resolution, onClose }: {
  data: BoxMethodData;
  resolution: string;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    entryTrigger: data.entryTrigger ?? "",
    stop: data.stopLoss ? `$${fmt(data.stopLoss)}` : "",
    target1: data.target1 ? `$${fmt(data.target1)}` : "",
    target2: data.target2 ? `$${fmt(data.target2)}` : "",
    reasoning: data.reasons.join(" · "),
    risks: data.risks.slice(0, 2).join(" · "),
  });

  function save() {
    const entry: LogEntry = {
      id: `bm-${Date.now()}`,
      ticker: data.symbol,
      boxType: data.boxType,
      resolution,
      boxHigh: data.boxHigh,
      boxLow: data.boxLow,
      midpoint: data.midpoint,
      setupType: data.setupLabel,
      entryTrigger: form.entryTrigger,
      stop: form.stop,
      target1: form.target1,
      target2: form.target2,
      confidence: data.confidenceScore,
      reasoning: form.reasoning,
      risks: form.risks,
      timestamp: Date.now(),
    };
    const existing: LogEntry[] = JSON.parse(localStorage.getItem("edge-box-journal") ?? "[]");
    localStorage.setItem("edge-box-journal", JSON.stringify([entry, ...existing].slice(0, 100)));
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)" }}>
      <div className="w-full max-w-lg rounded-2xl p-6 overflow-y-auto" style={{ background: "#0f1117", border: "1px solid #1e2433", maxHeight: "90vh" }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold" style={{ color: "#e8eaf0" }}>Log Box Setup</h3>
            <p className="text-xs" style={{ color: "#5a6075" }}>{data.symbol} · {data.boxType.replace(/_/g, " ")} · {data.setupLabel}</p>
          </div>
          <button onClick={onClose} style={{ color: "#5a6075" }}>✕</button>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs rounded-lg p-3 mb-4" style={{ background: "#141720" }}>
          <div><p style={{ color: "#5a6075" }}>{data.boxType === "previous_day" ? "PDH" : "Box High"}</p><p className="font-bold" style={{ color: "#ef4444" }}>${fmt(data.boxHigh)}</p></div>
          <div><p style={{ color: "#5a6075" }}>EQ / Mid</p><p className="font-bold" style={{ color: "#f59e0b" }}>${fmt(data.midpoint)}</p></div>
          <div><p style={{ color: "#5a6075" }}>{data.boxType === "previous_day" ? "PDL" : "Box Low"}</p><p className="font-bold" style={{ color: "#10b981" }}>${fmt(data.boxLow)}</p></div>
        </div>

        <div className="space-y-3">
          {([
            { key: "entryTrigger", label: "Entry Trigger" },
            { key: "stop", label: "Stop / Invalidation" },
            { key: "target1", label: "Target 1 (EQ / Midpoint)" },
            { key: "target2", label: "Target 2 (Opposite box edge)" },
          ] as const).map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs font-medium block mb-1" style={{ color: "#9aa0b4" }}>{label}</label>
              <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full text-xs rounded-lg px-3 py-2 outline-none"
                style={{ background: "#141720", border: "1px solid #1e2433", color: "#e8eaf0" }} />
            </div>
          ))}
          {(["reasoning", "risks"] as const).map(key => (
            <div key={key}>
              <label className="text-xs font-medium block mb-1" style={{ color: "#9aa0b4" }}>
                {key === "reasoning" ? "Reasoning / Thesis" : "Risks / Why This Could Fail"}
              </label>
              <textarea value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                rows={2}
                className="w-full text-xs rounded-lg px-3 py-2 outline-none resize-none"
                style={{ background: "#141720", border: "1px solid #1e2433", color: "#e8eaf0" }} />
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={save}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: "rgba(0,212,255,0.1)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.25)" }}>
            Save to Journal
          </button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm" style={{ color: "#5a6075" }}>Cancel</button>
        </div>
        <p className="text-xs text-center mt-3" style={{ color: "#5a6075" }}>Saved locally · Educational only · Not financial advice</p>
      </div>
    </div>
  );
}

// ─── Box Journal ──────────────────────────────────────────────────────────────

function BoxJournal({ refreshKey }: { refreshKey: number }) {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  useEffect(() => {
    setEntries(JSON.parse(localStorage.getItem("edge-box-journal") ?? "[]"));
  }, [refreshKey]);

  function remove(id: string) {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    localStorage.setItem("edge-box-journal", JSON.stringify(updated));
  }

  if (!entries.length) return (
    <p className="text-xs text-center py-8" style={{ color: "#5a6075" }}>No box setups logged yet. Analyze a setup above and click "Log Box Setup".</p>
  );

  return (
    <div className="space-y-2">
      {entries.map(e => (
        <div key={e.id} className="rounded-xl p-3 flex gap-3 items-start" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
          <div className="flex-1 min-w-0">
            <div className="flex gap-2 items-center mb-1 flex-wrap">
              <span className="text-sm font-bold" style={{ color: "#e8eaf0" }}>{e.ticker}</span>
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#141720", color: "#9aa0b4" }}>{e.boxType.replace(/_/g, " ")}</span>
              <span className="text-xs font-medium" style={{ color: "#00d4ff" }}>{e.setupType}</span>
              <span className="text-xs" style={{ color: "#5a6075" }}>Conf: {e.confidence}</span>
            </div>
            <div className="flex gap-3 text-xs mb-1 flex-wrap">
              <span style={{ color: "#ef4444" }}>High: ${e.boxHigh.toFixed(2)}</span>
              <span style={{ color: "#f59e0b" }}>EQ: ${e.midpoint.toFixed(2)}</span>
              <span style={{ color: "#10b981" }}>Low: ${e.boxLow.toFixed(2)}</span>
              {e.target1 && <span style={{ color: "#9aa0b4" }}>T1: {e.target1}</span>}
              {e.target2 && <span style={{ color: "#9aa0b4" }}>T2: {e.target2}</span>}
            </div>
            {e.reasoning && <p className="text-xs" style={{ color: "#5a6075" }}>{e.reasoning.slice(0, 120)}{e.reasoning.length > 120 ? "…" : ""}</p>}
          </div>
          <button onClick={() => remove(e.id)} className="text-xs flex-shrink-0" style={{ color: "#5a6075" }}>✕</button>
        </div>
      ))}
    </div>
  );
}

// ─── Coaching Panel ───────────────────────────────────────────────────────────

function CoachingPanel({ data, isBeginner }: { data: BoxMethodData; isBeginner: boolean }) {
  const boxLabel = data.boxType === "previous_day" ? "Previous Day" : data.boxType === "opening_range" ? "Opening Range" : "Intraday Range";
  const highLabel = boxHighLabel(data.boxType);
  const lowLabel = boxLowLabel(data.boxType);

  const begPoints = [
    {
      icon: "📦",
      title: `What is the ${boxLabel} Box?`,
      text: data.boxType === "previous_day"
        ? `The Previous Day Box uses yesterday's highest price (PDH = $${fmt(data.boxHigh)}) and lowest price (PDL = $${fmt(data.boxLow)}) as the boundaries. Institutions, algorithms, and traders worldwide watch these same levels — which is exactly why they become significant support and resistance.`
        : data.boxType === "opening_range"
        ? `The Opening Range Box uses the high and low from the first ${data.resolution} minutes of today's session. The ORB High ($${fmt(data.boxHigh)}) and ORB Low ($${fmt(data.boxLow)}) capture the initial price discovery zone. Breakouts from this zone often define the day's direction.`
        : `The Intraday Range Box uses the high ($${fmt(data.boxHigh)}) and low ($${fmt(data.boxLow)}) of the last 20 candles. This shows the current consolidation zone that price has been trading in.`,
    },
    {
      icon: "🟢",
      title: `Where do buyers defend? (${lowLabel})`,
      text: `The box low at $${fmt(data.boxLow)} is where buyers have stepped in before. When price returns to this level, watch carefully. If a green candle forms here and the NEXT candle breaks above the green candle's top — that's your potential long trigger. Never buy the moment price touches the low. Wait for confirmation.`,
    },
    {
      icon: "🔴",
      title: `Where do sellers defend? (${highLabel})`,
      text: `The box high at $${fmt(data.boxHigh)} is where sellers have pushed back before. When price reaches this level, watch for a red candle to form. If the NEXT candle breaks below the red candle's bottom — that's your potential short trigger. Never short the moment price touches the high. Wait.`,
    },
    {
      icon: "⚠️",
      title: "Why is the middle zone dangerous?",
      text: `The equilibrium (EQ) at $${fmt(data.midpoint)} is the center of the box. Trading here is dangerous because: (1) your stop-loss is far from the entry in both directions, (2) risk/reward is unclear, (3) price often chops back and forth here before making a real move. The middle is chop. Edges are where the opportunity is.`,
    },
    {
      icon: "✅",
      title: "What candle confirmation means",
      text: "Confirmation requires TWO candles, not one. Candle 1 (signal): price arrives at the box edge and shows direction (green for longs, red for shorts). Candle 2 (confirmation): the NEXT candle closes above signal candle's high (for longs) or below signal candle's low (for shorts). Only after BOTH candles close is there a confirmed signal.",
    },
    {
      icon: "🚫",
      title: "When no trade is the correct answer",
      text: `Currently: ${data.confirmationStatus === "not_triggered" ? "No confirmation has triggered yet." : data.confirmationLabel} No trade is correct when: price is in the middle zone, volume is thin, or there is no clear confirmation candle sequence. Patience is a trading skill. Sitting out protects capital. Missing a trade is far less expensive than taking a bad one.`,
    },
  ];

  const advPoints = [
    {
      icon: "🏛️",
      title: `Box Structure (${boxLabel})`,
      text: `${highLabel}: $${fmt(data.boxHigh)} · EQ: $${fmt(data.midpoint)} · ${lowLabel}: $${fmt(data.boxLow)} · Range: $${fmt(data.boxRange)}. ${data.hasDisplacement ? `Displacement candle: ${data.displacementSize?.toFixed(1)}x ATR (${data.displacementDirection} direction) — confirms institutional order flow in range creation.` : "No significant displacement — range may be passive consolidation."} Data source: ${data.dataSource}.`,
    },
    {
      icon: "🔍",
      title: "Setup Classification",
      text: `${data.setupLabel}: ${data.advancedExplanation}`,
    },
    {
      icon: "🕯️",
      title: "Two-Candle Confirmation Rule",
      text: `Current status: "${data.confirmationLabel}". Long: price visits ${lowLabel} → first bullish candle (signal) → next candle closes above signal.high. Short: price visits ${highLabel} → first bearish candle → next candle closes below signal.low. This filters ~60% of false signals vs entering on signal candle close.`,
    },
    {
      icon: "🎯",
      title: "Targets and Invalidation",
      text: data.entryTrigger
        ? `Entry: ${data.entryTrigger}. Stop: $${fmt(data.stopLoss)}. Target 1 (EQ): $${fmt(data.target1)}. Target 2 (opposite edge): $${fmt(data.target2)}. R:R: ${data.riskReward}:1. Invalidated by: close through stop level OR strong momentum candle against position.`
        : "No entry levels — middle zone or no setup. Wait for price to reach box extreme.",
    },
    {
      icon: "📈",
      title: "Breakout and Failed Breakout Logic",
      text: `Breakout above ${highLabel}: continuation if price pulls back and ${highLabel} holds as support (Breakout Retest Long Watch). Fade if price rejects hard back inside (Failed Breakout Short Watch). Breakout below ${lowLabel}: continuation if ${lowLabel} holds as resistance. Fade if price reclaims back inside.`,
    },
    {
      icon: "⚖️",
      title: "Market Context",
      text: `RSI: ${data.rsi ?? "N/A"} · Rel Vol: ${data.relativeVolume ?? "N/A"}x · ATR: $${fmt(data.atr)} · SMA20: $${fmt(data.sma20)} · Confidence: ${data.confidenceScore}/100 (${data.confidenceLabel}). ${data.changePercent !== null && Math.abs(data.changePercent) > 3 ? `⚠ Price already moved ${Math.abs(data.changePercent).toFixed(1)}% today — may be extended.` : ""}`,
    },
  ];

  const points = isBeginner ? begPoints : advPoints;

  return (
    <div className="space-y-3">
      {points.map((p, i) => (
        <div key={i} className="rounded-xl p-3" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
          <div className="flex items-center gap-2 mb-1">
            <span>{p.icon}</span>
            <span className="text-xs font-semibold" style={{ color: "#e8eaf0" }}>{p.title}</span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "#9aa0b4" }}>{p.text}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function BoxMethodPage() {
  const { isBeginner } = useMode();
  const [symbol, setSymbol] = useState("SPY");
  const [customSymbol, setCustomSymbol] = useState("");
  const [boxType, setBoxType] = useState<BoxType>("previous_day");
  const [resolution, setResolution] = useState("15");
  const [data, setData] = useState<BoxMethodData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"analysis" | "chart" | "journal">("analysis");
  const [journalKey, setJournalKey] = useState(0);

  const ticker = customSymbol.trim().toUpperCase() || symbol;

  const analyze = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/box-method?symbol=${ticker}&boxType=${boxType}&resolution=${resolution}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: BoxMethodData = await res.json();
      if (!json.valid) {
        setError(json.message ?? "Unable to analyze. Check Finnhub API key in /api-setup.");
        setData(null);
      } else {
        setData(json);
      }
    } catch (e) {
      setError(`Failed to fetch data. Check your Finnhub API key in /api-setup. (${e instanceof Error ? e.message : "unknown error"})`);
    }
    setLoading(false);
  }, [ticker, boxType, resolution]);

  useEffect(() => { analyze(); }, [analyze]);

  const setupColor = data?.setupColor ?? "#9aa0b4";
  const lastUpdated = data ? new Date(data.lastUpdated * 1000).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : null;

  // Resolution selector depends on box type
  const resOptions = boxType === "opening_range" ? ORB_WINDOWS : boxType === "intraday_range" ? INTRADAY_RES : null;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0b0d" }}>
      <Navbar />
      {logOpen && data && (
        <PaperLogModal data={data} resolution={resolution} onClose={() => { setLogOpen(false); setJournalKey(k => k + 1); }} />
      )}

      <div className="max-w-7xl mx-auto px-4 pt-8 pb-24">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-3"
              style={{ background: "rgba(0,212,255,0.08)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.2)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              Box Method Analyzer
            </div>
            <h1 className="text-3xl font-bold" style={{ color: "#e8eaf0" }}>
              Box <span style={{ color: "#00d4ff" }}>Method</span>
            </h1>
            <p className="text-sm mt-1 max-w-lg" style={{ color: "#9aa0b4" }}>
              {isBeginner
                ? "Learn to identify trading ranges, understand where buyers and sellers defend, and know when NOT to trade."
                : "PDH/PDL · ORB · Intraday Range · Two-candle confirmation · Zone classification · Confidence scoring"}
            </p>
          </div>
          <ModeToggle />
        </div>

        {/* Box Type Selector */}
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#5a6075" }}>Box Type</p>
          <div className="flex gap-2 flex-wrap">
            {BOX_TYPES.map(bt => (
              <button key={bt.value} onClick={() => setBoxType(bt.value)}
                className="text-xs rounded-xl px-4 py-2.5 font-medium transition-all text-left"
                style={{
                  background: boxType === bt.value ? "rgba(0,212,255,0.1)" : "#0f1117",
                  color: boxType === bt.value ? "#00d4ff" : "#9aa0b4",
                  border: `1px solid ${boxType === bt.value ? "rgba(0,212,255,0.3)" : "#1e2433"}`,
                }}>
                <span className="block">{bt.label}</span>
                <span className="block text-xs opacity-70">{bt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Symbol + Resolution + Analyze */}
        <div className="flex flex-wrap gap-2 mb-6">
          <div className="flex gap-1.5 flex-wrap">
            {TICKERS.map(t => (
              <button key={t} onClick={() => { setSymbol(t); setCustomSymbol(""); }}
                className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                style={{
                  background: ticker === t ? "rgba(0,212,255,0.1)" : "#0f1117",
                  color: ticker === t ? "#00d4ff" : "#9aa0b4",
                  border: `1px solid ${ticker === t ? "rgba(0,212,255,0.3)" : "#1e2433"}`,
                }}>
                {t}
              </button>
            ))}
          </div>
          <input value={customSymbol} onChange={e => setCustomSymbol(e.target.value.toUpperCase())}
            placeholder="Custom…"
            className="text-xs px-3 py-1.5 rounded-lg outline-none w-24"
            style={{ background: "#0f1117", border: "1px solid #1e2433", color: "#e8eaf0" }}
            onKeyDown={e => e.key === "Enter" && analyze()} />
          {resOptions && (
            <div className="flex gap-1">
              {resOptions.map(r => (
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
          )}
          <button onClick={analyze}
            className="text-xs px-4 py-1.5 rounded-lg font-semibold"
            style={{ background: "rgba(0,212,255,0.1)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.25)" }}>
            {loading ? "Loading…" : "Analyze"}
          </button>
          {lastUpdated && (
            <span className="text-xs self-center" style={{ color: "#5a6075" }}>
              Updated {lastUpdated}
            </span>
          )}
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
              <p className="text-xs mt-0.5" style={{ color: "#9aa0b4" }}>{error}</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && !data && (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="rounded-2xl p-5 animate-pulse" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
                <div className="h-4 rounded w-1/3 mb-3" style={{ background: "#1e2433" }} />
                <div className="h-20 rounded" style={{ background: "#1e2433" }} />
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
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#5a6075" }}>
                    {ticker} · {BOX_TYPES.find(b => b.value === data.boxType)?.label ?? data.boxType}
                  </p>
                  <h2 className="text-2xl font-bold mb-2" style={{ color: setupColor }}>{data.setupLabel}</h2>
                  <p className="text-sm leading-relaxed mb-3 max-w-lg" style={{ color: "#9aa0b4" }}>
                    {isBeginner ? data.beginnerExplanation : data.advancedExplanation}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: "#141720", color: "#9aa0b4", border: "1px solid #1e2433" }}>
                      {boxHighLabel(data.boxType)}: ${fmt(data.boxHigh)}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: "#141720", color: "#f59e0b", border: "1px solid #1e2433" }}>
                      EQ: ${fmt(data.midpoint)}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: "#141720", color: "#9aa0b4", border: "1px solid #1e2433" }}>
                      {boxLowLabel(data.boxType)}: ${fmt(data.boxLow)}
                    </span>
                    {data.hasDisplacement && (
                      <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: "rgba(139,92,246,0.12)", color: "#8b5cf6", border: "1px solid rgba(139,92,246,0.25)" }}>
                        ⚡ Displacement {data.displacementSize?.toFixed(1)}x ATR
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <ConfidenceGauge score={data.confidenceScore} color={setupColor} label={data.confidenceLabel} />
                  <div className="text-right">
                    {data.currentPrice && (
                      <p className="text-2xl font-bold" style={{ color: "#e8eaf0" }}>${fmt(data.currentPrice)}</p>
                    )}
                    {data.changePercent !== null && (
                      <p className="text-sm font-medium" style={{ color: data.changePercent >= 0 ? "#10b981" : "#ef4444" }}>
                        {data.changePercent >= 0 ? "+" : ""}{data.changePercent}%
                      </p>
                    )}
                    <button onClick={() => setLogOpen(true)}
                      className="mt-2 text-xs px-3 py-1.5 rounded-lg font-semibold block w-full"
                      style={{ background: "rgba(0,212,255,0.1)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.25)" }}>
                      Log Box Setup
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Confirmation Panel */}
            <ConfirmationPanel data={data} />

            {/* Box Visual + Levels + Confidence */}
            <div className="grid md:grid-cols-3 gap-5">
              {/* Box visualization */}
              <div className="rounded-2xl p-4" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#5a6075" }}>
                  {isBeginner ? "Box Diagram" : "Price Map"}
                </p>
                {isBeginner ? <BoxSchematic data={data} /> : <BoxChart data={data} />}
              </div>

              {/* Trade Levels */}
              <div className="space-y-3">
                {/* Box Levels */}
                <div className="rounded-2xl p-4" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#5a6075" }}>Box Levels</p>
                  {[
                    { label: boxHighLabel(data.boxType), value: data.boxHigh, color: "#ef4444", sub: "Resistance / Seller zone" },
                    { label: "EQ / Midpoint", value: data.midpoint, color: "#f59e0b", sub: "⚠ No-trade zone center" },
                    { label: boxLowLabel(data.boxType), value: data.boxLow, color: "#10b981", sub: "Support / Buyer zone" },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: "#1e2433" }}>
                      <div>
                        <p className="text-xs font-medium" style={{ color: item.color }}>{item.label}</p>
                        <p className="text-xs" style={{ color: "#5a6075" }}>{item.sub}</p>
                      </div>
                      <p className="text-sm font-bold" style={{ color: item.color }}>${fmt(item.value)}</p>
                    </div>
                  ))}
                </div>

                {/* Entry / Stop / Targets */}
                {!data.setupType.includes("NO_TRADE") && !data.setupType.includes("WATCHING") && (
                  <div className="rounded-2xl p-4" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#5a6075" }}>Trade Levels</p>
                    {data.entryTrigger && (
                      <div className="mb-2 text-xs rounded-lg p-2" style={{ background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.15)" }}>
                        <p style={{ color: "#5a6075" }}>Entry Trigger</p>
                        <p className="mt-0.5" style={{ color: "#00d4ff" }}>{data.entryTrigger}</p>
                      </div>
                    )}
                    {[
                      { label: "Stop / Invalidation", value: data.stopLoss, color: "#ef4444" },
                      { label: "Target 1 (EQ)", value: data.target1, color: "#10b981" },
                      { label: "Target 2 (Opposite edge)", value: data.target2, color: "#059669" },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between py-1.5 border-b last:border-0" style={{ borderColor: "#1e2433" }}>
                        <p className="text-xs" style={{ color: "#9aa0b4" }}>{item.label}</p>
                        <p className="text-xs font-bold" style={{ color: item.color }}>
                          {item.value ? `$${fmt(item.value)}` : "—"}
                        </p>
                      </div>
                    ))}
                    {data.riskReward && (
                      <div className="mt-2 rounded-lg p-2 text-center" style={{ background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.15)" }}>
                        <p className="text-xs" style={{ color: "#5a6075" }}>Risk / Reward</p>
                        <p className="text-xl font-bold" style={{ color: "#00d4ff" }}>{data.riskReward}:1</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Technical + Confidence */}
              <div className="space-y-3">
                <div className="rounded-2xl p-4" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#5a6075" }}>Technical</p>
                  {[
                    { label: "RSI (14)", value: data.rsi !== null ? `${data.rsi}` : "—", color: data.rsi ? (data.rsi > 65 ? "#ef4444" : data.rsi < 35 ? "#10b981" : "#9aa0b4") : "#5a6075" },
                    { label: "Rel Volume", value: data.relativeVolume !== null ? `${data.relativeVolume}x` : "—", color: data.relativeVolume && data.relativeVolume > 1.5 ? "#10b981" : "#9aa0b4" },
                    { label: "ATR", value: data.atr ? `$${fmt(data.atr)}` : "—", color: "#9aa0b4" },
                    { label: "SMA20", value: data.sma20 ? `$${fmt(data.sma20)}` : "—", color: "#9aa0b4" },
                    { label: "Zone", value: data.zone.replace(/_/g, " "), color: setupColor },
                    { label: "Box Range", value: `$${fmt(data.boxRange)}`, color: "#9aa0b4" },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-1.5 border-b last:border-0" style={{ borderColor: "#1e2433" }}>
                      <p className="text-xs" style={{ color: "#5a6075" }}>{item.label}</p>
                      <p className="text-xs font-bold capitalize" style={{ color: item.color }}>{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl p-4" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#5a6075" }}>Confidence</p>
                  <div className="space-y-2">
                    {data.confidenceFactors.map(f => (
                      <div key={f.name}>
                        <div className="flex justify-between mb-0.5">
                          <span className="text-xs" style={{ color: "#9aa0b4" }}>{f.name}</span>
                          <span className="text-xs font-medium" style={{ color: setupColor }}>{f.score}/{f.max}</span>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ background: "#1e2433" }}>
                          <div className="h-full rounded-full" style={{ width: `${(f.score / f.max) * 100}%`, background: setupColor }} />
                        </div>
                        {!isBeginner && <p className="text-xs" style={{ color: "#5a6075" }}>{f.reason}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Reasons + Risks panels */}
            <div className="grid md:grid-cols-2 gap-5">
              <div className="rounded-2xl p-4" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#10b981" }}>Why This Setup Exists</p>
                <ul className="space-y-1.5">
                  {data.reasons.map((r, i) => (
                    <li key={i} className="flex gap-2 text-xs" style={{ color: "#9aa0b4" }}>
                      <span style={{ color: "#10b981", flexShrink: 0 }}>✓</span>{r}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl p-4" style={{ background: "#0f1117", border: "1px solid rgba(239,68,68,0.15)" }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#ef4444" }}>Why This Could Fail</p>
                <ul className="space-y-1.5">
                  {data.risks.map((r, i) => (
                    <li key={i} className="flex gap-2 text-xs" style={{ color: "#9aa0b4" }}>
                      <span style={{ color: "#ef4444", flexShrink: 0 }}>✕</span>{r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Coaching panel */}
            <div className="rounded-2xl p-5" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
              <div className="flex items-center gap-2 mb-4">
                <span>{isBeginner ? "🎓" : "🏛️"}</span>
                <p className="text-sm font-semibold" style={{ color: "#e8eaf0" }}>
                  {isBeginner ? "Beginner Coaching" : "Institutional Context"}
                </p>
                <ModeToggle />
              </div>
              <CoachingPanel data={data} isBeginner={isBeginner} />
            </div>

            {/* Advanced: mini candle chart with box overlay */}
            {!isBeginner && data.candles.length > 0 && (
              <div className="rounded-2xl p-4" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#5a6075" }}>
                  Candle Chart with Box Overlay · Last {data.candles.length} candles
                </p>
                <BoxChart data={data} />
              </div>
            )}

            {/* Data source */}
            <p className="text-xs text-center" style={{ color: "#5a6075" }}>
              Source: {data.dataSource} · {data.candlesAnalyzed} candles · Cached 60s · {data.message}
            </p>
          </div>
        )}

        {/* ── CHART TAB ── */}
        {activeTab === "chart" && (
          <div className="rounded-2xl overflow-hidden" style={{ height: 520, border: "1px solid #1e2433" }}>
            <TradingViewChart symbol={ticker} resolution={boxType === "previous_day" ? "D" : resolution === "D" ? "60" : resolution} />
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
            <BoxJournal refreshKey={journalKey} />
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-8 rounded-xl p-4 flex gap-3 items-start"
          style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)" }}>
          <span className="text-lg flex-shrink-0">⚠️</span>
          <p className="text-xs leading-relaxed" style={{ color: "#9aa0b4" }}>
            <strong style={{ color: "#f59e0b" }}>Educational only · Not financial advice · No guaranteed outcomes · No auto-trading.</strong>{" "}
            Box Method levels, confirmation signals, and confidence scores are algorithmic approximations for educational purposes. PDH/PDL and ORB levels are derived from Finnhub public data. No broker integration. No execution. All analysis is for learning and paper trading only. Always use a paper trading account before risking real capital.
          </p>
        </div>
      </div>
    </div>
  );
}

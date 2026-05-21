"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import type { TradeThesis } from "@/app/api/trade-thesis/route";

// ─── Constants ──────────────────────────────────────────────────────────────

const TICKERS = ["SPY", "QQQ", "NVDA", "TSLA", "AAPL", "AMD", "META", "AMZN", "MSFT", "COIN", "PLTR", "GOOGL"];
type ORBWindow = 5 | 15 | 30;

const DECISION_META: Record<string, { color: string; bg: string; border: string; icon: string }> = {
  "ELITE LONG":       { color: "#059669", bg: "rgba(5,150,105,0.12)",   border: "rgba(5,150,105,0.4)",   icon: "🎯" },
  "ELITE SHORT":      { color: "#b91c1c", bg: "rgba(185,28,28,0.12)",   border: "rgba(185,28,28,0.4)",   icon: "🎯" },
  "STRONG LONG":      { color: "#10b981", bg: "rgba(16,185,129,0.1)",   border: "rgba(16,185,129,0.35)", icon: "▲" },
  "STRONG SHORT":     { color: "#ef4444", bg: "rgba(239,68,68,0.1)",    border: "rgba(239,68,68,0.35)",  icon: "▼" },
  "WATCHLIST LONG":   { color: "#f59e0b", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.3)",  icon: "👁" },
  "WATCHLIST SHORT":  { color: "#f59e0b", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.3)",  icon: "👁" },
  "NO TRADE":         { color: "#5a6075", bg: "rgba(90,96,117,0.08)",   border: "rgba(90,96,117,0.2)",   icon: "⛔" },
};

const SESSION_QUALITY_COLOR: Record<string, string> = {
  prime: "#059669", good: "#10b981", caution: "#f59e0b", avoid: "#ef4444",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── TradingView Chart ───────────────────────────────────────────────────────

function TradingViewChart({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol,
      interval: "5",
      timezone: "America/New_York",
      theme: "dark",
      style: "1",
      locale: "en",
      allow_symbol_change: false,
      calendar: false,
      support_host: "https://www.tradingview.com",
      studies: ["STD;VWAP", "STD;Volume"],
      hide_top_toolbar: false,
      hide_legend: false,
      backgroundColor: "rgba(10,11,13,1)",
      gridColor: "rgba(30,36,51,0.8)",
      width: "100%",
      height: "100%",
    });
    containerRef.current.appendChild(script);
    widgetRef.current = script;
  }, [symbol]);

  return (
    <div className="tradingview-widget-container" ref={containerRef} style={{ height: "100%", width: "100%" }}>
      <div className="tradingview-widget-container__widget" style={{ height: "calc(100% - 32px)", width: "100%" }} />
    </div>
  );
}

// ─── Score Gauge ─────────────────────────────────────────────────────────────

function ConfidenceGauge({ score, label }: { score: number; label: string }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const color = score >= 85 ? "#059669" : score >= 70 ? "#10b981" : score >= 55 ? "#f59e0b" : "#ef4444";
  const dash = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="6" stroke="#1e2433" />
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="6" stroke={color}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
        <text x="50" y="46" textAnchor="middle" dominantBaseline="central" fontSize="20" fontWeight="800" fill={color}>{score}</text>
        <text x="50" y="62" textAnchor="middle" fontSize="8" fill="#5a6075">/100</text>
      </svg>
      <span className="text-xs font-bold mt-1" style={{ color }}>{label}</span>
    </div>
  );
}

// ─── ORB Visualizer ──────────────────────────────────────────────────────────

function ORBVisualizer({ orb, currentPrice }: { orb: NonNullable<TradeThesis["orb"]>; currentPrice: number }) {
  const rangeBuffer = orb.orbRange * 2;
  const vizHigh = orb.orbHigh + rangeBuffer;
  const vizLow = orb.orbLow - rangeBuffer;
  const vizRange = vizHigh - vizLow;

  function toY(price: number): number {
    return Math.max(2, Math.min(98, ((vizHigh - price) / vizRange) * 100));
  }

  const highY = toY(orb.orbHigh);
  const lowY = toY(orb.orbLow);
  const midY = toY(orb.orbMidpoint);
  const curY = toY(currentPrice);

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#5a6075" }}>ORB Price Map</p>
      <div className="relative" style={{ height: 180 }}>
        <svg width="100%" height="180" className="absolute inset-0">
          {/* ORB zone fill */}
          <rect x="40" y={`${highY}%`} width="60%" height={`${lowY - highY}%`} fill="rgba(245,158,11,0.06)" stroke="rgba(245,158,11,0.2)" strokeWidth="0.5" />
          {/* OR High */}
          <line x1="0" y1={`${highY}%`} x2="100%" y2={`${highY}%`} stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 2" />
          {/* OR Low */}
          <line x1="0" y1={`${lowY}%`} x2="100%" y2={`${lowY}%`} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 2" />
          {/* Midpoint */}
          <line x1="0" y1={`${midY}%`} x2="100%" y2={`${midY}%`} stroke="rgba(245,158,11,0.5)" strokeWidth="1" strokeDasharray="2 3" />
          {/* Current price */}
          <line x1="0" y1={`${curY}%`} x2="100%" y2={`${curY}%`} stroke="#e8eaf0" strokeWidth="2" />
          <circle cx="8" cy={`${curY}%`} r="4" fill="#e8eaf0" />
        </svg>

        {/* Labels */}
        <div className="absolute right-0 top-0 bottom-0 w-24 flex flex-col justify-between pointer-events-none">
          <div style={{ position: "absolute", top: `${highY}%`, transform: "translateY(-50%)", right: 0 }}>
            <p className="text-xs font-bold" style={{ color: "#10b981" }}>OR High</p>
            <p className="text-xs" style={{ color: "#10b981" }}>${fmt(orb.orbHigh)}</p>
          </div>
          <div style={{ position: "absolute", top: `${midY}%`, transform: "translateY(-50%)", right: 0 }}>
            <p className="text-xs" style={{ color: "#f59e0b" }}>Mid ${fmt(orb.orbMidpoint)}</p>
          </div>
          <div style={{ position: "absolute", top: `${lowY}%`, transform: "translateY(-50%)", right: 0 }}>
            <p className="text-xs font-bold" style={{ color: "#ef4444" }}>OR Low</p>
            <p className="text-xs" style={{ color: "#ef4444" }}>${fmt(orb.orbLow)}</p>
          </div>
          <div style={{ position: "absolute", top: `${curY}%`, transform: "translateY(-50%)", right: 0 }}>
            <p className="text-xs font-bold" style={{ color: "#e8eaf0" }}>Now ${fmt(currentPrice)}</p>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg p-2" style={{ background: "#141720", border: "1px solid #1e2433" }}>
          <p style={{ color: "#5a6075" }}>ORB Range</p>
          <p className="font-bold" style={{ color: "#e8eaf0" }}>${fmt(orb.orbRange)} ({((orb.orbRange / orb.orbMidpoint) * 100).toFixed(2)}%)</p>
        </div>
        <div className="rounded-lg p-2" style={{ background: "#141720", border: "1px solid #1e2433" }}>
          <p style={{ color: "#5a6075" }}>Price vs ORB</p>
          <p className="font-bold" style={{
            color: orb.priceVsORB === "above" ? "#10b981" : orb.priceVsORB === "below" ? "#ef4444" : "#f59e0b",
          }}>{orb.priceVsORB.toUpperCase()}</p>
        </div>
        <div className="rounded-lg p-2" style={{ background: "#141720", border: "1px solid #1e2433" }}>
          <p style={{ color: "#5a6075" }}>Breakout</p>
          <p className="font-bold capitalize" style={{
            color: orb.breakoutDirection !== "none" ? (orb.breakoutDirection === "long" ? "#10b981" : "#ef4444") : "#5a6075",
          }}>{orb.breakoutDirection === "none" ? "None yet" : `${orb.breakoutDirection} (${orb.breakoutStrength})`}</p>
        </div>
        <div className="rounded-lg p-2" style={{ background: "#141720", border: "1px solid #1e2433" }}>
          <p style={{ color: "#5a6075" }}>Retest</p>
          <p className="font-bold" style={{ color: orb.retestConfirmed ? "#10b981" : "#5a6075" }}>
            {orb.retestConfirmed ? `✓ Confirmed ($${orb.retestLevel})` : "Not yet"}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Risk Box ────────────────────────────────────────────────────────────────

function RiskBox({ t }: { t: TradeThesis }) {
  if (!t.entry || !t.stop || !t.target1) {
    return (
      <div className="rounded-2xl p-4" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
        <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#5a6075" }}>Risk Box</p>
        <p className="text-xs" style={{ color: "#5a6075" }}>
          {t.decision === "NO TRADE" ? "No trade setup detected — risk box unavailable" : "ORB breakout not yet confirmed — risk levels pending"}
        </p>
      </div>
    );
  }

  const isLong = t.direction === "long";
  const riskColor = isLong ? "#ef4444" : "#10b981";
  const rewardColor = isLong ? "#10b981" : "#ef4444";

  return (
    <div className="rounded-2xl p-4" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
      <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#5a6075" }}>Risk Box</p>
      <div className="space-y-2 mb-3">
        {[
          { label: "Entry", value: `$${fmt(t.entry)}`, sub: t.entryZone ? `Zone: $${fmt(t.entryZone[0])} – $${fmt(t.entryZone[1])}` : null, color: "#00d4ff" },
          { label: "Stop", value: `$${fmt(t.stop)}`, sub: `Risk: $${fmt(t.riskAmount)} / share`, color: riskColor },
          { label: "Target 1", value: `$${fmt(t.target1)}`, sub: t.target2 ? `Target 2: $${fmt(t.target2)}` : null, color: rewardColor },
        ].map(row => (
          <div key={row.label} className="flex items-start justify-between rounded-xl px-3 py-2"
            style={{ background: "#141720", border: `1px solid ${row.color}25` }}>
            <div>
              <p className="text-xs font-bold" style={{ color: row.color }}>{row.label}</p>
              {row.sub && <p className="text-xs mt-0.5" style={{ color: "#5a6075" }}>{row.sub}</p>}
            </div>
            <p className="text-base font-bold" style={{ color: row.color }}>{row.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg py-2" style={{ background: "#141720" }}>
          <p className="text-xs" style={{ color: "#5a6075" }}>R:R</p>
          <p className="text-sm font-bold" style={{ color: t.rrRatio && t.rrRatio >= 2 ? "#10b981" : "#f59e0b" }}>
            {t.rrRatio ? `${t.rrRatio}:1` : "—"}
          </p>
        </div>
        <div className="rounded-lg py-2" style={{ background: "#141720" }}>
          <p className="text-xs" style={{ color: "#5a6075" }}>Risk</p>
          <p className="text-sm font-bold" style={{ color: "#ef4444" }}>${fmt(t.riskAmount)}</p>
        </div>
        <div className="rounded-lg py-2" style={{ background: "#141720" }}>
          <p className="text-xs" style={{ color: "#5a6075" }}>Reward</p>
          <p className="text-sm font-bold" style={{ color: "#10b981" }}>${fmt(t.rewardAmount)}</p>
        </div>
      </div>
      <p className="text-xs mt-3 p-2 rounded-lg" style={{ background: "rgba(0,212,255,0.05)", color: "#5a6075", border: "1px solid rgba(0,212,255,0.1)" }}>
        📐 Paper size: {t.paperTradeSize}
      </p>
    </div>
  );
}

// ─── Score Breakdown ─────────────────────────────────────────────────────────

function ScoreBreakdown({ scoring }: { scoring: TradeThesis["scoring"] }) {
  const factors = [
    { label: "ORB Structure", score: scoring.orbStructure, max: 20 },
    { label: "Market Structure", score: scoring.marketStructure, max: 15 },
    { label: "Volume", score: scoring.volumeConfirmation, max: 15 },
    { label: "SPY/QQQ Context", score: scoring.spyQqqContext, max: 10 },
    { label: "Sector Leadership", score: scoring.sectorLeadership, max: 10 },
    { label: "Liquidity Confluence", score: scoring.liquidityConfluence, max: 10 },
    { label: "ICT / FVG / OB", score: scoring.ictConfluence, max: 10 },
    { label: "Session / Macro", score: scoring.macroRisk, max: 10 },
  ];
  return (
    <div className="space-y-2">
      {factors.map(f => {
        const pct = (f.score / f.max) * 100;
        const barColor = pct >= 80 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";
        return (
          <div key={f.label}>
            <div className="flex justify-between mb-0.5">
              <span className="text-xs" style={{ color: "#9aa0b4" }}>{f.label}</span>
              <span className="text-xs font-bold" style={{ color: barColor }}>{f.score}/{f.max}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#1e2433" }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: barColor }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Thesis Section ──────────────────────────────────────────────────────────

function ThesisSection({ title, color, items, icon }: { title: string; color: string; items: string[]; icon: string }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #1e2433" }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3"
        style={{ background: "#141720" }}
      >
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>
          {icon} {title}
        </span>
        <span className="text-xs" style={{ color: "#5a6075" }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <ul className="px-4 py-3 space-y-1.5" style={{ background: "#0f1117" }}>
          {items.length ? items.map((item, i) => (
            <li key={i} className="flex gap-2 text-xs" style={{ color: "#9aa0b4" }}>
              <span style={{ color, flexShrink: 0 }}>→</span>{item}
            </li>
          )) : (
            <li className="text-xs" style={{ color: "#5a6075" }}>No data available</li>
          )}
        </ul>
      )}
    </div>
  );
}

// ─── Decision Card ───────────────────────────────────────────────────────────

function DecisionCard({ t, onPaperLog }: { t: TradeThesis; onPaperLog: (t: TradeThesis) => void }) {
  const meta = DECISION_META[t.decision];
  const sessionColor = SESSION_QUALITY_COLOR[t.thesis.session.quality] ?? "#9aa0b4";

  return (
    <div className="space-y-4">
      {/* Decision header */}
      <div className="rounded-2xl p-5" style={{ background: meta.bg, border: `2px solid ${meta.border}` }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{meta.icon}</span>
              <div>
                <p className="text-xl font-black tracking-wide" style={{ color: meta.color }}>{t.decision}</p>
                <p className="text-xs mt-0.5" style={{ color: "#9aa0b4" }}>
                  {t.ticker} · {t.orb ? `${t.orb.window}m ORB` : "Daily Analysis"} · {t.thesis.session.name}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                { label: `SPY ${fmtPct(t.spyChangePercent)}`, color: pctColor(t.spyChangePercent) },
                { label: `QQQ ${fmtPct(t.qqqChangePercent)}`, color: pctColor(t.qqqChangePercent) },
                { label: `${t.sectorSymbol} ${fmtPct(t.sectorChangePercent)}`, color: pctColor(t.sectorChangePercent) },
                t.rsi ? { label: `RSI ${t.rsi}`, color: t.rsi < 30 ? "#10b981" : t.rsi > 70 ? "#ef4444" : "#9aa0b4" } : null,
                t.relativeVolume ? { label: `${t.relativeVolume}x Vol`, color: t.relativeVolume >= 1.5 ? "#f59e0b" : "#9aa0b4" } : null,
              ].filter(Boolean).map((b, i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(0,0,0,0.3)", color: b!.color }}>
                  {b!.label}
                </span>
              ))}
            </div>
          </div>
          <ConfidenceGauge score={t.confidence} label={t.confidenceLabel} />
        </div>

        {/* Session alert */}
        <div className="mt-3 flex items-start gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(0,0,0,0.2)" }}>
          <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: sessionColor }} />
          <p className="text-xs" style={{ color: "#9aa0b4" }}>
            <strong style={{ color: sessionColor }}>{t.thesis.session.name}</strong> — {t.thesis.session.note}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* ORB panel */}
        {t.orb?.valid ? (
          <div className="rounded-2xl p-4" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
            <ORBVisualizer orb={t.orb} currentPrice={t.currentPrice} />
          </div>
        ) : (
          <div className="rounded-2xl p-4" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#5a6075" }}>ORB Status</p>
            <p className="text-xs" style={{ color: "#5a6075" }}>
              {t.orb == null ? "No intraday candles — market may be closed or API not connected" : "Insufficient candles for ORB analysis"}
            </p>
          </div>
        )}

        {/* Score breakdown */}
        <div className="rounded-2xl p-4" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#5a6075" }}>Confidence Breakdown</p>
          <ScoreBreakdown scoring={t.scoring} />
        </div>
      </div>

      {/* Risk box */}
      <RiskBox t={t} />

      {/* Thesis breakdown */}
      <div className="space-y-2">
        <ThesisSection title="Market Context" color="#00d4ff" icon="🌐" items={t.thesis.marketContext} />
        <ThesisSection title="Market Structure" color="#8b5cf6" icon="📐" items={t.thesis.structure} />
        <ThesisSection title="Volume Analysis" color="#f59e0b" icon="📊" items={t.thesis.volume} />
        <ThesisSection title="Liquidity / Sweeps" color="#a78bfa" icon="🌊" items={t.thesis.liquidity} />
        <ThesisSection title="ICT / FVG / OB Confluence" color="#06b6d4" icon="⚡" items={t.thesis.ictConfluence} />
      </div>

      {/* Why could fail */}
      <div className="rounded-2xl p-4" style={{ background: "#0f1117", border: "1px solid rgba(245,158,11,0.2)" }}>
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#f59e0b" }}>⚠ Why This Could Fail</p>
        <ul className="space-y-1.5">
          {t.whyCouldFail.map((w, i) => (
            <li key={i} className="flex gap-2 text-xs" style={{ color: "#9aa0b4" }}>
              <span style={{ color: "#f59e0b", flexShrink: 0 }}>⚠</span>{w}
            </li>
          ))}
        </ul>
        <div className="mt-3 pt-3" style={{ borderTop: "1px solid #1e2433" }}>
          <p className="text-xs font-bold mb-1" style={{ color: "#ef4444" }}>INVALIDATION:</p>
          <p className="text-xs" style={{ color: "#9aa0b4" }}>{t.invalidation}</p>
        </div>
      </div>

      {/* Paper trade button */}
      {t.decision !== "NO TRADE" && (
        <button
          onClick={() => onPaperLog(t)}
          className="w-full text-sm py-3 rounded-2xl font-bold transition-all"
          style={{ background: "rgba(0,212,255,0.1)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.3)" }}
        >
          📝 Log to Paper Lab
        </button>
      )}

      {/* Data transparency */}
      <p className="text-center text-xs" style={{ color: "#5a6075" }}>
        Generated {new Date(t.generatedAt).toLocaleTimeString()} · All analysis is rule-based from real market data · No AI hallucination
      </p>
    </div>
  );
}

// ─── Paper Log Modal ──────────────────────────────────────────────────────────

function PaperLogModal({ t, onClose }: { t: TradeThesis; onClose: () => void }) {
  const PAPER_KEY = "paper-trades-edge";

  function save() {
    const entry = {
      id: `${Date.now()}-${t.ticker}`,
      date: new Date().toISOString().split("T")[0],
      ticker: t.ticker,
      direction: t.direction,
      setupType: `ORB ${t.orb?.window ?? 15}m ${t.decision}`,
      entry: t.entry,
      stop: t.stop,
      target1: t.target1,
      confidence: t.confidence,
      decision: t.decision,
      thesis: t.thesis.marketContext.join("; ") + " | " + t.thesis.structure.slice(0, 2).join("; "),
      sessionContext: t.thesis.session.name,
      rr: t.rrRatio,
      result: "pending",
      notes: `Auto-logged from Trade Decision Engine. Invalidation: ${t.invalidation}`,
    };
    try {
      const existing = JSON.parse(localStorage.getItem(PAPER_KEY) ?? "[]");
      localStorage.setItem(PAPER_KEY, JSON.stringify([...existing, entry]));
    } catch {}
    alert(`✓ Logged ${t.ticker} ${t.decision} setup to Paper Lab! Open /paper-lab to track the outcome.`);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl p-5" style={{ background: "#0f1117", border: "1px solid #1e2433" }} onClick={e => e.stopPropagation()}>
        <p className="text-sm font-bold mb-4" style={{ color: "#e8eaf0" }}>Log to Paper Lab — {t.ticker} {t.decision}</p>
        <div className="space-y-2 text-xs mb-4" style={{ color: "#9aa0b4" }}>
          <div className="flex justify-between"><span>Setup:</span><span style={{ color: "#e8eaf0" }}>{t.decision}</span></div>
          <div className="flex justify-between"><span>Entry:</span><span style={{ color: "#00d4ff" }}>{t.entry ? `$${fmt(t.entry)}` : "—"}</span></div>
          <div className="flex justify-between"><span>Stop:</span><span style={{ color: "#ef4444" }}>{t.stop ? `$${fmt(t.stop)}` : "—"}</span></div>
          <div className="flex justify-between"><span>Target 1:</span><span style={{ color: "#10b981" }}>{t.target1 ? `$${fmt(t.target1)}` : "—"}</span></div>
          <div className="flex justify-between"><span>R:R:</span><span style={{ color: "#e8eaf0" }}>{t.rrRatio ? `${t.rrRatio}:1` : "—"}</span></div>
          <div className="flex justify-between"><span>Confidence:</span><span style={{ color: "#e8eaf0" }}>{t.confidence}/100 ({t.confidenceLabel})</span></div>
        </div>
        <p className="text-xs p-3 rounded-xl mb-4" style={{ background: "rgba(245,158,11,0.06)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.15)" }}>
          This logs a paper trade only. No real capital is involved. Visit /paper-lab to track outcomes.
        </p>
        <div className="flex gap-2">
          <button onClick={save} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background: "rgba(0,212,255,0.15)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.3)" }}>
            Save to Paper Lab
          </button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm" style={{ background: "#141720", color: "#9aa0b4", border: "1px solid #1e2433" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TradeEnginePage() {
  const [ticker, setTicker] = useState("SPY");
  const [customTicker, setCustomTicker] = useState("");
  const [orbWindow, setOrbWindow] = useState<ORBWindow>(15);
  const [thesis, setThesis] = useState<TradeThesis | null>(null);
  const [loading, setLoading] = useState(false);
  const [chartTicker, setChartTicker] = useState("SPY");
  const [logTarget, setLogTarget] = useState<TradeThesis | null>(null);

  const activeTicker = customTicker.trim().toUpperCase() || ticker;

  const analyze = useCallback(async () => {
    const sym = activeTicker.slice(0, 8);
    if (!sym) return;
    setLoading(true);
    setThesis(null);
    setChartTicker(sym);
    try {
      const res = await fetch(`/api/trade-thesis?symbol=${sym}&orbWindow=${orbWindow}`);
      if (res.ok) setThesis(await res.json());
    } catch {}
    setLoading(false);
  }, [activeTicker, orbWindow]);

  // Auto-analyze on mount
  useEffect(() => { analyze(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ minHeight: "100vh", background: "#0a0b0d" }}>
      <Navbar />

      {logTarget && <PaperLogModal t={logTarget} onClose={() => setLogTarget(null)} />}

      <div className="max-w-7xl mx-auto px-4 pt-8 pb-24">
        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-3"
            style={{ background: "rgba(0,212,255,0.08)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.2)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            Precision Trade Decision Engine · Educational Only
          </div>
          <h1 className="text-3xl font-bold" style={{ color: "#e8eaf0" }}>
            Trade <span style={{ color: "#00d4ff" }}>Decision</span> Engine
          </h1>
          <p className="text-sm mt-1" style={{ color: "#9aa0b4" }}>
            ORB detection · ICT confluence · Confidence scoring · Risk box · Rule-based thesis — no fake AI
          </p>
        </div>

        {/* Controls */}
        <div className="rounded-2xl p-4 mb-5" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
          <div className="flex flex-wrap gap-4 items-end">
            {/* Preset tickers */}
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: "#5a6075" }}>Ticker</p>
              <div className="flex gap-1.5 flex-wrap">
                {TICKERS.map(t => (
                  <button key={t} onClick={() => { setTicker(t); setCustomTicker(""); }}
                    className="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all"
                    style={{
                      background: ticker === t && !customTicker ? "rgba(0,212,255,0.15)" : "#141720",
                      color: ticker === t && !customTicker ? "#00d4ff" : "#9aa0b4",
                      border: `1px solid ${ticker === t && !customTicker ? "rgba(0,212,255,0.3)" : "#1e2433"}`,
                    }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom ticker */}
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: "#5a6075" }}>Custom ticker</p>
              <input value={customTicker}
                onChange={e => setCustomTicker(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === "Enter" && analyze()}
                placeholder="e.g. NVDA"
                maxLength={8}
                className="text-xs px-3 py-1.5 rounded-lg outline-none w-28"
                style={{ background: "#141720", border: "1px solid #1e2433", color: "#e8eaf0" }}
              />
            </div>

            {/* ORB window */}
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: "#5a6075" }}>ORB Window</p>
              <div className="flex gap-1.5">
                {([5, 15, 30] as ORBWindow[]).map(w => (
                  <button key={w} onClick={() => setOrbWindow(w)}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                    style={{
                      background: orbWindow === w ? "rgba(0,212,255,0.15)" : "#141720",
                      color: orbWindow === w ? "#00d4ff" : "#9aa0b4",
                      border: `1px solid ${orbWindow === w ? "rgba(0,212,255,0.3)" : "#1e2433"}`,
                    }}>
                    {w}m
                  </button>
                ))}
              </div>
            </div>

            {/* Analyze */}
            <button onClick={analyze} disabled={loading}
              className="text-sm px-6 py-2 rounded-xl font-bold transition-all"
              style={{ background: "rgba(0,212,255,0.15)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.35)", opacity: loading ? 0.6 : 1 }}>
              {loading ? "Analyzing…" : "⚡ Analyze"}
            </button>
          </div>
        </div>

        {/* Chart + quick stats row */}
        <div className="grid md:grid-cols-3 gap-5 mb-5">
          {/* Chart — 2 cols */}
          <div className="md:col-span-2 rounded-2xl overflow-hidden" style={{ height: 400, border: "1px solid #1e2433", background: "#0a0b0d" }}>
            <TradingViewChart symbol={chartTicker} />
          </div>

          {/* Quick stats sidebar */}
          <div className="space-y-3">
            {thesis && !thesis.isPlaceholder && (
              <>
                <div className="rounded-2xl p-4" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
                  <p className="text-xs font-bold mb-2" style={{ color: "#5a6075" }}>Current Price</p>
                  <p className="text-2xl font-bold" style={{ color: "#e8eaf0" }}>${fmt(thesis.currentPrice)}</p>
                  <div className="mt-2 space-y-1 text-xs" style={{ color: "#9aa0b4" }}>
                    <p>SMA20: {thesis.sma20 ? `$${fmt(thesis.sma20)}` : "—"}</p>
                    <p>ATR: {thesis.atr ? `$${fmt(thesis.atr)}` : "—"}</p>
                    <p>RSI: {thesis.rsi ?? "—"}</p>
                    <p>Rel Vol: {thesis.relativeVolume ? `${thesis.relativeVolume}x` : "—"}</p>
                  </div>
                </div>
                <div className="rounded-2xl p-4" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
                  <p className="text-xs font-bold mb-2" style={{ color: "#5a6075" }}>Market Context</p>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between"><span style={{ color: "#5a6075" }}>SPY</span><span style={{ color: pctColor(thesis.spyChangePercent) }}>{fmtPct(thesis.spyChangePercent)}</span></div>
                    <div className="flex justify-between"><span style={{ color: "#5a6075" }}>QQQ</span><span style={{ color: pctColor(thesis.qqqChangePercent) }}>{fmtPct(thesis.qqqChangePercent)}</span></div>
                    <div className="flex justify-between"><span style={{ color: "#5a6075" }}>{thesis.sectorSymbol}</span><span style={{ color: pctColor(thesis.sectorChangePercent) }}>{fmtPct(thesis.sectorChangePercent)}</span></div>
                  </div>
                </div>
                <div className="rounded-2xl p-4" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
                  <p className="text-xs font-bold mb-2" style={{ color: "#5a6075" }}>Session</p>
                  <p className="text-xs font-medium" style={{ color: SESSION_QUALITY_COLOR[thesis.thesis.session.quality] }}>{thesis.thesis.session.name}</p>
                </div>
              </>
            )}
            {!thesis && !loading && (
              <div className="rounded-2xl p-6 flex items-center justify-center" style={{ background: "#0f1117", border: "1px solid #1e2433", height: "100%" }}>
                <p className="text-xs text-center" style={{ color: "#5a6075" }}>Click ⚡ Analyze to run the decision engine</p>
              </div>
            )}
          </div>
        </div>

        {/* Decision output */}
        {loading ? (
          <div className="rounded-2xl p-12 text-center" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
            <div className="w-8 h-8 rounded-full border-2 animate-spin mx-auto mb-4" style={{ borderColor: "#1e2433", borderTopColor: "#00d4ff" }} />
            <p className="text-sm font-medium" style={{ color: "#e8eaf0" }}>Running analysis…</p>
            <p className="text-xs mt-1" style={{ color: "#5a6075" }}>Fetching quotes, candles, ICT analysis, ORB detection</p>
          </div>
        ) : thesis?.isPlaceholder ? (
          <div className="rounded-2xl p-10 text-center" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
            <p className="text-2xl mb-3">📡</p>
            <p className="text-sm font-medium mb-1" style={{ color: "#e8eaf0" }}>API Not Connected</p>
            <p className="text-xs" style={{ color: "#5a6075" }}>Configure <code style={{ color: "#00d4ff" }}>FINNHUB_API_KEY</code> in Netlify environment variables.</p>
          </div>
        ) : thesis ? (
          <DecisionCard t={thesis} onPaperLog={setLogTarget} />
        ) : null}

        {/* Compliance */}
        <div className="mt-10 pt-6" style={{ borderTop: "1px solid #1e2433" }}>
          <p className="text-center text-xs leading-relaxed" style={{ color: "#5a6075" }}>
            EDGE OS provides educational research and paper-trading tools only. This is not financial advice, not investment advice, and not a guarantee of profit.
            All analysis is rule-based from real Finnhub market data. ORB levels, confidence scores, and risk boxes are educational heuristics — not predictive signals.
            Trading involves substantial risk of loss. Complete extensive paper trading before risking real capital.
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import ModeToggle from "@/components/ModeToggle";
import { useMode } from "@/lib/mode-context";
import type { MarketRegimeData } from "@/app/api/market-regime/route";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuickQuote {
  symbol: string;
  price: number | null;
  changePercent: number | null;
  label: string;
}

interface Alert {
  id: string;
  type: "regime" | "price" | "volume" | "session";
  severity: "high" | "medium" | "low";
  message: string;
  detail: string;
  time: number;
  symbol?: string;
}

interface SessionInfo {
  name: string;
  description: string;
  active: boolean;
  color: string;
  startUTC: number;
  endUTC: number;
}

interface SectorItem {
  symbol: string;
  name: string;
  changePercent: number | null;
  isPlaceholder: boolean;
}

interface MoverItem {
  ticker: string;
  price: number | null;
  changePercent: number | null;
  relativeVolume: number | null;
  setupScore: string;
  isPlaceholder: boolean;
}

interface NewsFlashItem {
  headline: string;
  source: string;
  datetime: string;
  category: string;
  url: string;
  isPlaceholder: boolean;
}

interface EconEvent {
  event: string;
  time: string;
  impact: "high" | "medium" | "low";
  country: string;
  estimate: string | null;
  actual: string | null;
  isPlaceholder: boolean;
}

// ─── Session Logic ────────────────────────────────────────────────────────────

function getCurrentSession(): SessionInfo {
  const now = new Date();
  const utcH = now.getUTCHours() + now.getUTCMinutes() / 60;
  const m = now.getUTCMonth();
  const isEDT = m >= 2 && m <= 9;
  const offset = isEDT ? 4 : 5;

  const etH = ((utcH - offset) + 24) % 24;

  if (etH >= 4 && etH < 9.5) return { name: "Pre-Market", description: "Low liquidity — institutional positioning. Watch for gaps.", active: true, color: "#f59e0b", startUTC: 8, endUTC: 13.5 };
  if (etH >= 9.5 && etH < 10) return { name: "NY Open / ORB", description: "Highest volatility of the day. ORB setups forming. Wait for 15m confirmation.", active: true, color: "#ef4444", startUTC: 13.5, endUTC: 14 };
  if (etH >= 10 && etH < 11.5) return { name: "Morning Momentum", description: "Trend of the day often established here. Follow breakouts with volume.", active: true, color: "#10b981", startUTC: 14, endUTC: 15.5 };
  if (etH >= 11.5 && etH < 13) return { name: "Midday Chop", description: "Volume drops. Spreads widen. Avoid FOMO trades — this period fakes many breakouts.", active: true, color: "#f59e0b", startUTC: 15.5, endUTC: 17 };
  if (etH >= 13 && etH < 14.5) return { name: "Afternoon Drift", description: "Institutions rebalance. Can trend quietly. Low-conviction environment.", active: true, color: "#9aa0b4", startUTC: 17, endUTC: 18.5 };
  if (etH >= 14.5 && etH < 15.5) return { name: "Power Hour", description: "Volume surges. Trend days accelerate. Final session for day traders.", active: true, color: "#8b5cf6", startUTC: 18.5, endUTC: 19.5 };
  if (etH >= 15.5 && etH < 16) return { name: "Market Close", description: "MOC orders execute. Volatility spike at 4pm. Exit positions before close.", active: true, color: "#ef4444", startUTC: 19.5, endUTC: 20 };
  if (etH >= 8 && etH < 17) return { name: "London Session", description: "European institutional activity. Watch for trend direction before NY open.", active: true, color: "#00d4ff", startUTC: 8, endUTC: 16.5 };
  return { name: "After Hours / Asian", description: "Thin markets. Major gaps possible overnight. Risk management critical.", active: false, color: "#5a6075", startUTC: 20, endUTC: 8 };
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

// ─── Components ───────────────────────────────────────────────────────────────

function RegimeCard({ regime, loading, isBeginner }: { regime: MarketRegimeData | null; loading: boolean; isBeginner: boolean }) {
  if (loading) return (
    <div className="rounded-2xl p-5 animate-pulse" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
      <div className="h-4 rounded w-1/3 mb-3" style={{ background: "#1e2433" }} />
      <div className="h-8 rounded w-2/3 mb-2" style={{ background: "#1e2433" }} />
      <div className="h-4 rounded w-full" style={{ background: "#1e2433" }} />
    </div>
  );

  if (!regime) return null;

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "#0f1117", border: `1px solid ${regime.color}30` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#5a6075" }}>Market Regime · {regime.symbol}</p>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold" style={{ color: regime.color }}>{regime.label}</h2>
            <span
              className="text-xs px-2 py-0.5 rounded font-medium"
              style={{ background: `${regime.color}18`, color: regime.color }}
            >
              {regime.confidence}% confidence
            </span>
          </div>
        </div>
        <div className="text-right">
          {regime.currentPrice && (
            <p className="text-xl font-bold" style={{ color: "#e8eaf0" }}>
              ${regime.currentPrice.toFixed(2)}
            </p>
          )}
          {regime.changePercent !== null && (
            <p className="text-sm font-medium" style={{ color: regime.changePercent >= 0 ? "#10b981" : "#ef4444" }}>
              {regime.changePercent >= 0 ? "+" : ""}{regime.changePercent}%
            </p>
          )}
        </div>
      </div>

      <p className="text-sm leading-relaxed mb-3" style={{ color: "#9aa0b4" }}>
        {isBeginner ? regime.beginnerExplanation : regime.description}
      </p>

      <div className="flex gap-2 flex-wrap mb-3">
        {regime.signals.map((s, i) => (
          <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#141720", color: "#9aa0b4", border: "1px solid #1e2433" }}>{s}</span>
        ))}
      </div>

      <div className="rounded-xl p-3" style={{ background: `${regime.color}08`, border: `1px solid ${regime.color}20` }}>
        <p className="text-xs" style={{ color: regime.color }}>
          <strong>Trade implication: </strong>
          <span style={{ color: "#9aa0b4" }}>{regime.tradeImplication}</span>
        </p>
      </div>

      <div className="flex gap-4 mt-3">
        {regime.rsi !== null && (
          <div>
            <p className="text-xs" style={{ color: "#5a6075" }}>RSI</p>
            <p className="text-sm font-bold" style={{ color: regime.rsi > 65 ? "#ef4444" : regime.rsi < 35 ? "#10b981" : "#e8eaf0" }}>{regime.rsi}</p>
          </div>
        )}
        {regime.relativeVolume !== null && (
          <div>
            <p className="text-xs" style={{ color: "#5a6075" }}>Rel Vol</p>
            <p className="text-sm font-bold" style={{ color: regime.relativeVolume > 1.5 ? "#10b981" : "#9aa0b4" }}>{regime.relativeVolume}x</p>
          </div>
        )}
        {regime.sma20 !== null && (
          <div>
            <p className="text-xs" style={{ color: "#5a6075" }}>SMA20</p>
            <p className="text-sm font-bold" style={{ color: "#9aa0b4" }}>${regime.sma20.toFixed(2)}</p>
          </div>
        )}
        {regime.gapPercent !== null && Math.abs(regime.gapPercent) > 0.2 && (
          <div>
            <p className="text-xs" style={{ color: "#5a6075" }}>Gap</p>
            <p className="text-sm font-bold" style={{ color: regime.gapPercent > 0 ? "#10b981" : "#ef4444" }}>
              {regime.gapPercent > 0 ? "+" : ""}{regime.gapPercent}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SessionCard({ isBeginner }: { isBeginner: boolean }) {
  const [session, setSession] = useState<SessionInfo>(getCurrentSession());
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => {
      setSession(getCurrentSession());
      setTime(new Date());
    }, 30000);
    return () => clearInterval(t);
  }, []);

  // etTime used to suppress unused variable warning via void
  void time;
  const etDisplay = new Date().toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });

  return (
    <div className="rounded-2xl p-5" style={{ background: "#0f1117", border: `1px solid ${session.color}30` }}>
      <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#5a6075" }}>Active Session</p>
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: session.color }} />
        <h3 className="text-xl font-bold" style={{ color: session.color }}>{session.name}</h3>
      </div>
      <p className="text-xs mb-3" style={{ color: "#5a6075" }}>ET: {etDisplay}</p>
      <p className="text-sm leading-relaxed" style={{ color: "#9aa0b4" }}>{session.description}</p>
    </div>
  );
}

function QuoteBar({ quotes, loading }: { quotes: QuickQuote[]; loading: boolean }) {
  return (
    <div
      className="rounded-2xl p-4 overflow-x-auto"
      style={{ background: "#0f1117", border: "1px solid #1e2433" }}
    >
      <div className="flex gap-5 min-w-max">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1 min-w-[80px]">
                <div className="h-3 rounded w-12 animate-pulse" style={{ background: "#1e2433" }} />
                <div className="h-5 rounded w-16 animate-pulse" style={{ background: "#1e2433" }} />
              </div>
            ))
          : quotes.map(q => (
              <div key={q.symbol} className="flex flex-col min-w-[80px]">
                <span className="text-xs font-medium" style={{ color: "#5a6075" }}>{q.label}</span>
                <span className="text-base font-bold" style={{ color: "#e8eaf0" }}>
                  {q.price !== null ? `$${q.price.toFixed(2)}` : "—"}
                </span>
                {q.changePercent !== null && (
                  <span className="text-xs font-medium" style={{ color: q.changePercent >= 0 ? "#10b981" : "#ef4444" }}>
                    {q.changePercent >= 0 ? "+" : ""}{q.changePercent.toFixed(2)}%
                  </span>
                )}
              </div>
            ))}
      </div>
    </div>
  );
}

function AlertFeed({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) return (
    <div className="rounded-2xl p-5 text-center" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
      <p className="text-sm" style={{ color: "#5a6075" }}>No active alerts — conditions nominal</p>
    </div>
  );

  const severityColor = { high: "#ef4444", medium: "#f59e0b", low: "#00d4ff" };
  const severityBg = { high: "rgba(239,68,68,0.08)", medium: "rgba(245,158,11,0.08)", low: "rgba(0,212,255,0.08)" };

  return (
    <div className="space-y-2">
      {alerts.map(alert => (
        <div
          key={alert.id}
          className="rounded-xl p-3 flex gap-3 items-start"
          style={{ background: severityBg[alert.severity], border: `1px solid ${severityColor[alert.severity]}25` }}
        >
          <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: severityColor[alert.severity] }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium" style={{ color: "#e8eaf0" }}>{alert.message}</p>
            <p className="text-xs mt-0.5" style={{ color: "#9aa0b4" }}>{alert.detail}</p>
          </div>
          <span className="text-xs flex-shrink-0" style={{ color: "#5a6075" }}>{formatTime(alert.time)}</span>
        </div>
      ))}
    </div>
  );
}

function SectorHeatmap({ sectors, loading }: { sectors: SectorItem[]; loading: boolean }) {
  const SECTOR_SHORT: Record<string, string> = {
    "XLK": "Tech", "XLF": "Fin", "XLE": "Energy", "XLY": "Cons Disc",
    "XLI": "Indust", "XLB": "Materials", "XLU": "Utilities", "XLV": "Health",
    "XLP": "Cons Staple", "SMH": "Semis",
  };

  function sectorColor(pct: number | null): string {
    if (pct === null) return "#5a6075";
    if (pct >= 1.5) return "#059669";
    if (pct >= 0.5) return "#10b981";
    if (pct >= 0) return "#34d399";
    if (pct >= -0.5) return "#f87171";
    if (pct >= -1.5) return "#ef4444";
    return "#b91c1c";
  }

  function sectorBg(pct: number | null): string {
    if (pct === null) return "rgba(90,96,117,0.08)";
    if (pct >= 0.5) return `rgba(16,185,129,${Math.min(0.25, Math.abs(pct) * 0.1)})`;
    return `rgba(239,68,68,${Math.min(0.25, Math.abs(pct) * 0.1)})`;
  }

  if (loading) return (
    <div className="rounded-2xl p-5 animate-pulse" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
      <div className="h-3 w-32 rounded mb-3" style={{ background: "#1e2433" }} />
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg" style={{ background: "#141720" }} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="rounded-2xl p-5" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#5a6075" }}>Sector Heatmap</p>
        <span className="text-xs" style={{ color: "#5a6075" }}>Live performance</span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {sectors.length > 0 ? sectors.map(s => (
          <div
            key={s.symbol}
            className="rounded-lg p-2 flex flex-col items-center justify-center text-center"
            style={{ background: sectorBg(s.changePercent), border: `1px solid ${sectorColor(s.changePercent)}25` }}
          >
            <p className="text-xs font-bold" style={{ color: "#e8eaf0" }}>{SECTOR_SHORT[s.symbol] ?? s.symbol}</p>
            <p className="text-xs font-medium mt-0.5" style={{ color: sectorColor(s.changePercent) }}>
              {s.changePercent !== null ? `${s.changePercent >= 0 ? "+" : ""}${s.changePercent.toFixed(1)}%` : "—"}
            </p>
          </div>
        )) : (
          <div className="col-span-5 text-center py-4">
            <p className="text-xs" style={{ color: "#5a6075" }}>Configure Finnhub API key for live sector data — <a href="/api-setup" style={{ color: "#00d4ff" }}>API Setup →</a></p>
          </div>
        )}
      </div>
    </div>
  );
}

function TopMoversPanel({ movers, loading }: { movers: MoverItem[]; loading: boolean }) {
  if (loading) return (
    <div className="rounded-2xl p-5 animate-pulse" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
      <div className="h-3 w-32 rounded mb-3" style={{ background: "#1e2433" }} />
      {[1, 2, 3].map(i => <div key={i} className="h-8 rounded-lg mb-2" style={{ background: "#141720" }} />)}
    </div>
  );

  return (
    <div className="rounded-2xl p-5" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#5a6075" }}>Top Movers</p>
        <a href="/scanner" className="text-xs" style={{ color: "#00d4ff" }}>Scanner →</a>
      </div>
      {movers.length === 0 ? (
        <p className="text-xs text-center py-2" style={{ color: "#5a6075" }}>No movers data — configure Finnhub API</p>
      ) : (
        <div className="space-y-2">
          {movers.slice(0, 5).map(m => (
            <div key={m.ticker} className="flex items-center justify-between py-1.5 px-2 rounded-lg" style={{ background: "#141720" }}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold w-12" style={{ color: "#e8eaf0" }}>{m.ticker}</span>
                {m.setupScore && m.setupScore !== "—" && (
                  <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{
                    background: m.setupScore === "A+" ? "rgba(5,150,105,0.15)" : m.setupScore === "A" ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.1)",
                    color: m.setupScore === "A+" ? "#059669" : m.setupScore === "A" ? "#10b981" : "#f59e0b",
                  }}>{m.setupScore}</span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span style={{ color: "#9aa0b4" }}>${m.price?.toFixed(2) ?? "—"}</span>
                <span style={{ color: m.changePercent !== null && m.changePercent >= 0 ? "#10b981" : "#ef4444", fontWeight: 600 }}>
                  {m.changePercent !== null ? `${m.changePercent >= 0 ? "+" : ""}${m.changePercent.toFixed(1)}%` : "—"}
                </span>
                {m.relativeVolume !== null && (
                  <span style={{ color: m.relativeVolume >= 1.5 ? "#f59e0b" : "#5a6075" }}>{m.relativeVolume.toFixed(1)}x</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NewsFlash({ items }: { items: NewsFlashItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-2xl p-5" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#5a6075" }}>News Flash</p>
        <a href="/news-desk" className="text-xs" style={{ color: "#00d4ff" }}>News Desk →</a>
      </div>
      <div className="space-y-3">
        {items.map((n, i) => (
          <div key={i} className="pb-3" style={{ borderBottom: i < items.length - 1 ? "1px solid #1e2433" : "none" }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#141720", color: "#5a6075", border: "1px solid #1e2433" }}>{n.category}</span>
            </div>
            {n.url && n.url !== "#" ? (
              <a href={n.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium leading-snug hover:underline" style={{ color: n.isPlaceholder ? "#5a6075" : "#e8eaf0" }}>
                {n.headline}
              </a>
            ) : (
              <p className="text-sm font-medium leading-snug" style={{ color: n.isPlaceholder ? "#5a6075" : "#e8eaf0" }}>{n.headline}</p>
            )}
            <p className="text-xs mt-0.5" style={{ color: "#5a6075" }}>{n.source}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EconCalendar({ events }: { events: EconEvent[] }) {
  if (events.length === 0) return null;
  const impactColor: Record<EconEvent["impact"], string> = { high: "#ef4444", medium: "#f59e0b", low: "#9aa0b4" };
  return (
    <div className="rounded-2xl p-5" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#5a6075" }}>Economic Calendar</p>
      <div className="space-y-2">
        {events.map((e, i) => (
          <div key={i} className="flex items-start gap-3 py-2" style={{ borderBottom: i < events.length - 1 ? "1px solid #1e2433" : "none" }}>
            <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: impactColor[e.impact] }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "#e8eaf0" }}>{e.event}</p>
              {e.time && <p className="text-xs" style={{ color: "#5a6075" }}>{e.time}</p>}
            </div>
            <div className="text-right flex-shrink-0">
              {e.actual !== null && e.actual !== undefined && (
                <p className="text-xs font-bold" style={{ color: "#10b981" }}>A: {e.actual}</p>
              )}
              {e.estimate !== null && e.estimate !== undefined && (
                <p className="text-xs" style={{ color: "#5a6075" }}>E: {e.estimate}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SessionWorkflow({ session, regime }: { session: SessionInfo; regime: MarketRegimeData | null }) {
  // regime used for future personalization; suppress unused warning
  void regime;
  const workflowMap: Record<string, { steps: Array<{ label: string; href: string; icon: string }>; tip: string }> = {
    "Pre-Market": {
      steps: [
        { label: "Check Regime", href: "/dashboard", icon: "📊" },
        { label: "News Desk", href: "/news-desk", icon: "📰" },
        { label: "Build Thesis", href: "/trade-engine", icon: "⚡" },
      ],
      tip: "Pre-market: identify gap levels and potential ORB direction before the bell.",
    },
    "NY Open / ORB": {
      steps: [
        { label: "Scanner", href: "/scanner", icon: "📡" },
        { label: "Box Method", href: "/box-method", icon: "📦" },
        { label: "War Room", href: "/market-war-room", icon: "⚔️" },
      ],
      tip: "Opening range forming. Wait for first 15 minutes before trading breakouts.",
    },
    "Morning Momentum": {
      steps: [
        { label: "Edge Scanner", href: "/live-edge-scanner", icon: "🎯" },
        { label: "Structure", href: "/market-structure", icon: "🔬" },
        { label: "Trade Engine", href: "/trade-engine", icon: "⚡" },
      ],
      tip: "Trend of the day is establishing. Follow high-volume breakouts in regime direction.",
    },
    "Midday Chop": {
      steps: [
        { label: "Playbooks", href: "/playbooks", icon: "📖" },
        { label: "Academy", href: "/academy", icon: "🎓" },
        { label: "News Desk", href: "/news-desk", icon: "📰" },
      ],
      tip: "Low volume, false breakouts common. Use this time to study, not trade.",
    },
    "Power Hour": {
      steps: [
        { label: "Scanner", href: "/scanner", icon: "📡" },
        { label: "War Room", href: "/market-war-room", icon: "⚔️" },
        { label: "Paper Lab", href: "/paper-lab", icon: "📋" },
      ],
      tip: "Power Hour: institutions finish positioning. High conviction directional moves.",
    },
    "After Hours / Asian": {
      steps: [
        { label: "Review Trades", href: "/paper-lab", icon: "📋" },
        { label: "Playbooks", href: "/playbooks", icon: "📖" },
        { label: "Academy", href: "/academy", icon: "🎓" },
      ],
      tip: "Market closed. Perfect time to review performance and study setups.",
    },
  };

  const workflow = workflowMap[session.name] ?? workflowMap["Midday Chop"];

  return (
    <div className="rounded-2xl p-5" style={{ background: "#0f1117", border: `1px solid ${session.color}25` }}>
      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#5a6075" }}>Session Workflow</p>
      <p className="text-xs mb-3 italic" style={{ color: "#9aa0b4" }}>{workflow.tip}</p>
      <div className="flex gap-2 flex-wrap">
        {workflow.steps.map((step, i) => (
          <a
            key={i}
            href={step.href}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium transition-all"
            style={{ background: "#141720", color: "#e8eaf0", border: "1px solid #1e2433" }}
          >
            <span>{step.icon}</span>
            {step.label}
            <span style={{ color: "#5a6075" }}>→</span>
          </a>
        ))}
      </div>
    </div>
  );
}

const QUICK_LINKS = [
  { href: "/trade-engine", label: "Trade Engine", icon: "⚡", color: "#00d4ff", desc: "Build a trade thesis" },
  { href: "/market-structure", label: "Structure", icon: "🔬", color: "#8b5cf6", desc: "ICT analysis" },
  { href: "/live-edge-scanner", label: "Edge Scanner", icon: "🎯", color: "#10b981", desc: "Find edge setups" },
  { href: "/scanner", label: "Momentum", icon: "📡", color: "#10b981", desc: "Top movers" },
  { href: "/playbooks", label: "Playbooks", icon: "📖", color: "#f59e0b", desc: "Setup frameworks" },
  { href: "/market-war-room", label: "War Room", icon: "⚔️", color: "#ef4444", desc: "Session intel" },
  { href: "/paper-lab", label: "Paper Lab", icon: "📊", color: "#f59e0b", desc: "Log trades" },
  { href: "/academy", label: "Academy", icon: "🎓", color: "#00d4ff", desc: "Learn" },
  { href: "/news-desk", label: "News Desk", icon: "📰", color: "#10b981", desc: "Market intelligence" },
  { href: "/risk-engine", label: "Risk Engine", icon: "🛡️", color: "#f59e0b", desc: "Position sizing" },
];

const WATCHLIST_SYMBOLS = [
  { symbol: "SPY", label: "SPY" },
  { symbol: "QQQ", label: "QQQ" },
  { symbol: "IWM", label: "IWM" },
  { symbol: "VIX", label: "VIX" },
  { symbol: "TLT", label: "TLT" },
  { symbol: "UUP", label: "DXY↑" },
];

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { isBeginner } = useMode();
  const [regime, setRegime] = useState<MarketRegimeData | null>(null);
  const [quotes, setQuotes] = useState<QuickQuote[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loadingRegime, setLoadingRegime] = useState(true);
  const [loadingQuotes, setLoadingQuotes] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const [sectors, setSectors] = useState<SectorItem[]>([]);
  const [topMovers, setTopMovers] = useState<MoverItem[]>([]);
  const [newsItems, setNewsItems] = useState<NewsFlashItem[]>([]);
  const [econEvents, setEconEvents] = useState<EconEvent[]>([]);
  const [loadingSectors, setLoadingSectors] = useState(true);
  const [loadingMovers, setLoadingMovers] = useState(true);

  const [session, setSession] = useState<SessionInfo>(getCurrentSession());

  useEffect(() => {
    const t = setInterval(() => setSession(getCurrentSession()), 30000);
    return () => clearInterval(t);
  }, []);

  const fetchRegime = useCallback(async () => {
    setLoadingRegime(true);
    try {
      const res = await fetch("/api/market-regime?symbol=SPY");
      if (res.ok) {
        const data: MarketRegimeData = await res.json();
        setRegime(data);
        const newAlerts: Alert[] = [];
        if (data.regime === "GAP_AND_GO") {
          newAlerts.push({
            id: "gap-alert",
            type: "regime",
            severity: "high",
            message: `SPY: Gap & Go detected (${data.gapPercent && data.gapPercent > 0 ? "+" : ""}${data.gapPercent}%)`,
            detail: "High-volume gap continuation. Watch ORB direction for bias.",
            time: Date.now(),
            symbol: "SPY",
          });
        }
        if (data.regime === "REVERSAL_WATCH") {
          newAlerts.push({
            id: "reversal-alert",
            type: "regime",
            severity: "medium",
            message: `SPY RSI ${data.rsi} — Reversal Watch`,
            detail: "Extreme RSI with momentum divergence. Reduce position size.",
            time: Date.now(),
            symbol: "SPY",
          });
        }
        if (data.relativeVolume !== null && data.relativeVolume > 2.5) {
          newAlerts.push({
            id: "volume-alert",
            type: "volume",
            severity: "high",
            message: `SPY unusual volume: ${data.relativeVolume}x average`,
            detail: "Institutional-level volume surge detected. Major move possible.",
            time: Date.now(),
            symbol: "SPY",
          });
        }
        if (data.regime === "COMPRESSION") {
          newAlerts.push({
            id: "compression-alert",
            type: "regime",
            severity: "low",
            message: "Market compression — breakout pending",
            detail: "ATR contracting with below-average volume. Prepare breakout watchlists.",
            time: Date.now(),
          });
        }
        setAlerts(newAlerts);
      }
    } catch { /* graceful fallback */ }
    setLoadingRegime(false);
  }, []);

  const fetchQuotes = useCallback(async () => {
    setLoadingQuotes(true);
    try {
      const results = await Promise.allSettled(
        WATCHLIST_SYMBOLS.map(({ symbol, label }) =>
          fetch(`/api/quote?symbol=${symbol}`)
            .then(r => r.ok ? r.json() : null)
            .then(d => ({
              symbol,
              label,
              price: d?.price ?? null,
              changePercent: d?.changePercent ?? null,
            } as QuickQuote))
        )
      );
      setQuotes(results.flatMap(r => r.status === "fulfilled" ? [r.value] : []));
    } catch { /* graceful fallback */ }
    setLoadingQuotes(false);
    setLastRefresh(new Date());
  }, []);

  const fetchSectors = useCallback(async () => {
    setLoadingSectors(true);
    try {
      const res = await fetch("/api/sector-performance");
      if (res.ok) {
        const data = await res.json();
        setSectors(data.sectors ?? []);
      }
    } catch {}
    setLoadingSectors(false);
  }, []);

  const fetchMovers = useCallback(async () => {
    setLoadingMovers(true);
    try {
      const res = await fetch("/api/scanner?filter=gainers&limit=5");
      if (res.ok) {
        const data = await res.json();
        setTopMovers(data.items ?? []);
      }
    } catch {}
    setLoadingMovers(false);
  }, []);

  const fetchNews = useCallback(async () => {
    try {
      const res = await fetch("/api/news-intelligence");
      if (res.ok) {
        const data = await res.json();
        setNewsItems((data.items ?? []).slice(0, 4));
      }
    } catch {}
  }, []);

  const fetchEcon = useCallback(async () => {
    try {
      const res = await fetch("/api/economic-calendar");
      if (res.ok) {
        const data = await res.json();
        setEconEvents((data.events ?? []).slice(0, 4));
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchRegime();
    fetchQuotes();
    fetchSectors();
    fetchMovers();
    fetchNews();
    fetchEcon();
    const t = setInterval(() => {
      fetchRegime();
      fetchQuotes();
      fetchSectors();
      fetchMovers();
    }, 60000);
    return () => clearInterval(t);
  }, [fetchRegime, fetchQuotes, fetchSectors, fetchMovers, fetchNews, fetchEcon]);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0b0d" }}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 pt-8 pb-24">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-3"
              style={{ background: "rgba(0,212,255,0.08)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.2)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              Mission Control
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ color: "#e8eaf0" }}>
              EDGE<span style={{ color: "#00d4ff" }}>OS</span> Dashboard
            </h1>
            <p className="text-sm mt-1" style={{ color: "#5a6075" }}>
              What matters right now — regime, session, alerts, and quick access.
              {lastRefresh && <span> · Updated {formatTime(lastRefresh.getTime())}</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
            <button
              onClick={() => { fetchRegime(); fetchQuotes(); fetchSectors(); fetchMovers(); }}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
              style={{ background: "#0f1117", color: "#9aa0b4", border: "1px solid #1e2433" }}
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* Quote Bar */}
        <div className="mb-5">
          <QuoteBar quotes={quotes} loading={loadingQuotes} />
        </div>

        {/* Regime + Session (3-col) */}
        <div className="grid md:grid-cols-3 gap-5 mb-5">
          <div className="md:col-span-2">
            <RegimeCard regime={regime} loading={loadingRegime} isBeginner={isBeginner} />
          </div>
          <div className="flex flex-col gap-5">
            <SessionCard isBeginner={isBeginner} />
            <SessionWorkflow session={session} regime={regime} />
          </div>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#5a6075" }}>
              Active Alerts ({alerts.length})
            </p>
            <AlertFeed alerts={alerts} />
          </div>
        )}

        {/* Sector Heatmap + Top Movers */}
        <div className="grid md:grid-cols-3 gap-5 mb-5">
          <div className="md:col-span-2">
            <SectorHeatmap sectors={sectors} loading={loadingSectors} />
          </div>
          <div>
            <TopMoversPanel movers={topMovers} loading={loadingMovers} />
          </div>
        </div>

        {/* News Flash + Econ Calendar */}
        <div className="grid md:grid-cols-2 gap-5 mb-5">
          <NewsFlash items={newsItems} />
          <EconCalendar events={econEvents} />
        </div>

        {/* Quick Links */}
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#5a6075" }}>
            Platform Navigation
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {QUICK_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="group rounded-xl p-4 flex flex-col gap-1 transition-all duration-150"
                style={{ background: "#0f1117", border: "1px solid #1e2433" }}
              >
                <span className="text-2xl">{link.icon}</span>
                <span className="text-sm font-semibold" style={{ color: "#e8eaf0" }}>{link.label}</span>
                <span className="text-xs" style={{ color: "#5a6075" }}>{link.desc}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Regime Legend */}
        <div className="rounded-2xl p-5 mb-5" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#5a6075" }}>Regime Classification Reference</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Trending Up", color: "#10b981", desc: isBeginner ? "Market moving up clearly" : "Momentum + RSI > 55 + above SMA20" },
              { label: "Trending Down", color: "#ef4444", desc: isBeginner ? "Market moving down clearly" : "Momentum + RSI < 45 + below SMA20" },
              { label: "Range Bound", color: "#f59e0b", desc: isBeginner ? "No clear direction — choppy" : "Low |Δ%| + neutral RSI 38–62" },
              { label: "Compression", color: "#00d4ff", desc: isBeginner ? "Very tight, big move coming" : "Low ATR + low relVol + neutral RSI" },
              { label: "Expansion", color: "#a78bfa", desc: isBeginner ? "Big volatile moves with volume" : "ATR > 1.5% + relVol > 1.8x" },
              { label: "Gap & Go", color: "#8b5cf6", desc: isBeginner ? "Opened with big gap, continuing" : "Gap ≥ 0.8% + relVol > 1.5x" },
              { label: "Reversal Watch", color: "#f97316", desc: isBeginner ? "May be reversing direction" : "RSI > 72 or < 28 + divergence" },
              { label: "Mixed Signals", color: "#5a6075", desc: isBeginner ? "Unclear — best to watch" : "No dominant regime pattern" },
            ].map(r => (
              <div key={r.label} className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: r.color }} />
                <div>
                  <p className="text-xs font-medium" style={{ color: r.color }}>{r.label}</p>
                  <p className="text-xs" style={{ color: "#5a6075" }}>{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div
          className="rounded-xl p-4 flex gap-3 items-start"
          style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)" }}
        >
          <span className="text-lg flex-shrink-0">⚠️</span>
          <p className="text-xs leading-relaxed" style={{ color: "#9aa0b4" }}>
            <strong style={{ color: "#f59e0b" }}>Educational only.</strong> Market regime classification is algorithmically derived from public price/volume data. It is not financial advice and does not guarantee trade outcomes. All analysis is for educational research purposes. Always paper trade first.
          </p>
        </div>

      </div>
    </div>
  );
}

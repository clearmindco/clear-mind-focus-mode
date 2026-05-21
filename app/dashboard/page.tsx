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
  startUTC: number; // hour (decimal)
  endUTC: number;
}

// ─── Session Logic ────────────────────────────────────────────────────────────

function getCurrentSession(): SessionInfo {
  const now = new Date();
  const utcH = now.getUTCHours() + now.getUTCMinutes() / 60;
  const m = now.getUTCMonth();
  const isEDT = m >= 2 && m <= 9;
  const offset = isEDT ? 4 : 5; // hours behind UTC

  // Convert to ET decimal
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
        {isBeginner ? regime.begginerExplanation : regime.description}
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

  const etTime = new Date(time.getTime() - (new Date().getTimezoneOffset() + (new Date().getUTCMonth() >= 2 && new Date().getUTCMonth() <= 9 ? 240 : 300)) * 60000);
  const etDisplay = time.toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });

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

const QUICK_LINKS = [
  { href: "/trade-engine", label: "Trade Engine", icon: "⚡", color: "#00d4ff", desc: "Build a trade thesis" },
  { href: "/market-structure", label: "Structure", icon: "🔬", color: "#8b5cf6", desc: "ICT analysis" },
  { href: "/live-edge-scanner", label: "Edge Scanner", icon: "🎯", color: "#10b981", desc: "Find edge setups" },
  { href: "/scanner", label: "Momentum", icon: "📡", color: "#10b981", desc: "Top movers" },
  { href: "/playbooks", label: "Playbooks", icon: "📖", color: "#f59e0b", desc: "Setup frameworks" },
  { href: "/market-war-room", label: "War Room", icon: "⚔️", color: "#ef4444", desc: "Session intel" },
  { href: "/paper-lab", label: "Paper Lab", icon: "📊", color: "#f59e0b", desc: "Log trades" },
  { href: "/academy", label: "Academy", icon: "🎓", color: "#00d4ff", desc: "Learn" },
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

  const fetchRegime = useCallback(async () => {
    setLoadingRegime(true);
    try {
      const res = await fetch("/api/market-regime?symbol=SPY");
      if (res.ok) {
        const data: MarketRegimeData = await res.json();
        setRegime(data);
        // Generate client-side alerts from regime
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

  useEffect(() => {
    fetchRegime();
    fetchQuotes();
    const t = setInterval(() => {
      fetchRegime();
      fetchQuotes();
    }, 60000);
    return () => clearInterval(t);
  }, [fetchRegime, fetchQuotes]);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0b0d" }}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 pt-8 pb-24">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
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
              onClick={() => { fetchRegime(); fetchQuotes(); }}
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

        {/* Two-column: Regime + Session */}
        <div className="grid md:grid-cols-3 gap-5 mb-5">
          <div className="md:col-span-2">
            <RegimeCard regime={regime} loading={loadingRegime} isBeginner={isBeginner} />
          </div>
          <div>
            <SessionCard isBeginner={isBeginner} />
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

        {/* Quick Links */}
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#5a6075" }}>
            Platform Navigation
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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

        {/* Market Internals Placeholder */}
        <div className="grid md:grid-cols-2 gap-5 mb-5">
          <div className="rounded-2xl p-5" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#5a6075" }}>Market Internals</p>
              <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>FUTURE</span>
            </div>
            <div className="space-y-2">
              {[
                { label: "NYSE TICK", desc: "Advancing vs declining stocks per tick", api: "Polygon.io paid" },
                { label: "NYSE TRIN", desc: "Volume-weighted A/D ratio", api: "Polygon.io paid" },
                { label: "AD Line", desc: "Cumulative market breadth", api: "Calculated from universe" },
                { label: "Put/Call Ratio", desc: "Options sentiment indicator", api: "CBOE data / Polygon" },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b" style={{ borderColor: "#1e2433" }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#e8eaf0" }}>{item.label}</p>
                    <p className="text-xs" style={{ color: "#5a6075" }}>{item.desc}</p>
                  </div>
                  <span className="text-xs" style={{ color: "#5a6075" }}>{item.api}</span>
                </div>
              ))}
            </div>
            <p className="text-xs mt-3" style={{ color: "#5a6075" }}>
              Market internals require tick-level data. Architecture is built — awaiting data provider integration.
            </p>
          </div>

          <div className="rounded-2xl p-5" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#5a6075" }}>Options Flow</p>
              <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>FUTURE</span>
            </div>
            <div className="space-y-2">
              {[
                { label: "Unusual Options Activity", desc: "Premium > $1M, above-avg volume", api: "Unusual Whales / Barchart" },
                { label: "GEX (Gamma Exposure)", desc: "Dealer gamma positioning", api: "SpotGamma / SqueezeMetrics" },
                { label: "Dark Pool Prints", desc: "Large off-exchange block trades", api: "Unusual Whales / FINRA" },
                { label: "0DTE Flow", desc: "Same-day expiry order flow", api: "Unusual Whales paid" },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b" style={{ borderColor: "#1e2433" }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#e8eaf0" }}>{item.label}</p>
                    <p className="text-xs" style={{ color: "#5a6075" }}>{item.desc}</p>
                  </div>
                  <span className="text-xs" style={{ color: "#5a6075" }}>{item.api}</span>
                </div>
              ))}
            </div>
            <p className="text-xs mt-3" style={{ color: "#5a6075" }}>
              Options flow visualization is architecturally ready. Awaiting Unusual Whales or Barchart premium integration.
            </p>
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

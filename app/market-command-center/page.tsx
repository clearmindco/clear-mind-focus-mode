"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Navbar from "@/components/Navbar";
import type { MarketInstrument, SectorPerformance, EconomicEvent, NewsIntelligenceItem, WatchlistQuoteData } from "@/lib/data-providers";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OverviewData {
  instruments: MarketInstrument[];
}

interface SectorData {
  sectors: SectorPerformance[];
  breadth: { advancing: number; declining: number; total: number; upPct: number; status: string };
}

interface CalendarData {
  events: EconomicEvent[];
}

interface NewsData {
  items: NewsIntelligenceItem[];
}

interface WatchlistData {
  quotes: WatchlistQuoteData[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_WATCHLIST = ["SPY", "QQQ", "NVDA", "TSLA", "AAPL"];
const WATCHLIST_KEY = "edge-watchlist";
const MAX_WATCHLIST = 20;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v: number | null, dec = 2): string {
  if (v == null) return "—";
  return v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function fmtPct(v: number | null): string {
  if (v == null) return "—";
  const sign = v >= 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}

function pctColor(v: number | null): string {
  if (v == null) return "#9aa0b4";
  if (v > 0) return "#10b981";
  if (v < 0) return "#ef4444";
  return "#9aa0b4";
}

function heatColor(pct: number | null): string {
  if (pct == null) return "#1e2433";
  if (pct >= 2) return "rgba(16,185,129,0.35)";
  if (pct >= 1) return "rgba(16,185,129,0.22)";
  if (pct >= 0.3) return "rgba(16,185,129,0.12)";
  if (pct > -0.3) return "rgba(90,96,117,0.12)";
  if (pct > -1) return "rgba(239,68,68,0.12)";
  if (pct > -2) return "rgba(239,68,68,0.22)";
  return "rgba(239,68,68,0.35)";
}

function heatTextColor(pct: number | null): string {
  if (pct == null) return "#5a6075";
  if (pct >= 0.3) return "#10b981";
  if (pct <= -0.3) return "#ef4444";
  return "#9aa0b4";
}

function quickSignal(cp: number | null): { label: string; color: string } {
  if (cp == null) return { label: "—", color: "#5a6075" };
  if (cp >= 2) return { label: "Strong Bull", color: "#059669" };
  if (cp >= 0.5) return { label: "Bullish", color: "#10b981" };
  if (cp > -0.5) return { label: "Neutral", color: "#f59e0b" };
  if (cp > -2) return { label: "Bearish", color: "#ef4444" };
  return { label: "Strong Bear", color: "#b91c1c" };
}

function directionBadge(d: string): { label: string; color: string; bg: string } {
  if (d === "Bullish") return { label: "↑ Bullish", color: "#10b981", bg: "rgba(16,185,129,0.1)" };
  if (d === "Bearish") return { label: "↓ Bearish", color: "#ef4444", bg: "rgba(239,68,68,0.1)" };
  return { label: "→ Neutral", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" };
}

function impactDot(impact: string): string {
  if (impact === "high") return "#ef4444";
  if (impact === "medium") return "#f59e0b";
  return "#5a6075";
}

function formatEventTime(timeStr: string): string {
  if (!timeStr) return "TBD";
  try {
    const d = new Date(timeStr);
    if (isNaN(d.getTime())) return timeStr;
    return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" });
  } catch {
    return timeStr;
  }
}

function formatNewsTime(dt: string): string {
  try {
    const d = new Date(dt);
    const diff = Date.now() - d.getTime();
    const hrs = Math.floor(diff / 3_600_000);
    if (hrs < 1) return "< 1h ago";
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch {
    return "";
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle, color = "#00d4ff" }: { title: string; subtitle?: string; color?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color }}>{title}</h2>
      {subtitle && <p className="text-xs mt-0.5" style={{ color: "#5a6075" }}>{subtitle}</p>}
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl p-4 ${className}`}
      style={{ background: "#0f1117", border: "1px solid #1e2433" }}
    >
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <div
        className="w-5 h-5 rounded-full border-2 animate-spin"
        style={{ borderColor: "#1e2433", borderTopColor: "#00d4ff" }}
      />
    </div>
  );
}

// ─── Market Overview ──────────────────────────────────────────────────────────

function MarketOverview({ data, loading }: { data: OverviewData | null; loading: boolean }) {
  return (
    <Card>
      <SectionHeader title="Market Command Overview" subtitle="Major indices, volatility & macro instruments" />
      {loading ? <Spinner /> : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(data?.instruments ?? []).map(inst => {
            const db = directionBadge(inst.direction);
            return (
              <div
                key={inst.symbol}
                className="rounded-xl p-3"
                style={{ background: "#141720", border: "1px solid #1e2433" }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold" style={{ color: "#e8eaf0" }}>{inst.displaySymbol}</span>
                  {inst.isProxy && (
                    <span className="text-xs" style={{ color: "#5a6075" }}>proxy</span>
                  )}
                </div>
                <p className="text-xs mb-2" style={{ color: "#5a6075", lineHeight: "1.3" }}>{inst.name}</p>
                <p className="text-lg font-bold mb-1" style={{ color: "#e8eaf0" }}>
                  {inst.price != null ? `$${fmt(inst.price)}` : "—"}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: pctColor(inst.changePercent) }}>
                    {fmtPct(inst.changePercent)}
                  </span>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                    style={{ background: db.bg, color: db.color }}
                  >
                    {db.label}
                  </span>
                </div>
                {inst.isPlaceholder && (
                  <p className="text-xs mt-1" style={{ color: "#5a6075" }}>No API key</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ─── Market Breadth ───────────────────────────────────────────────────────────

function MarketBreadth({ data, loading }: { data: SectorData | null; loading: boolean }) {
  const breadth = data?.breadth;
  const statusColor = breadth?.status === "STRONG" ? "#10b981" : breadth?.status === "MIXED" ? "#f59e0b" : "#ef4444";
  const upPct = breadth?.upPct ?? 0;

  return (
    <Card>
      <SectionHeader title="Market Breadth" subtitle="Derived from 10 sector ETFs" color="#10b981" />
      {loading ? <Spinner /> : !breadth ? <p className="text-xs" style={{ color: "#5a6075" }}>No data</p> : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <span
                className="text-2xl font-bold"
                style={{ color: statusColor }}
              >
                {breadth.status}
              </span>
              <p className="text-xs mt-0.5" style={{ color: "#5a6075" }}>
                {breadth.advancing} advancing · {breadth.declining} declining of {breadth.total} sectors
              </p>
            </div>
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold"
              style={{ background: `${statusColor}15`, border: `2px solid ${statusColor}40`, color: statusColor }}
            >
              {Math.round(upPct * 100)}%
            </div>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "#1e2433" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${upPct * 100}%`, background: statusColor }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs" style={{ color: "#10b981" }}>Advancing</span>
            <span className="text-xs" style={{ color: "#ef4444" }}>Declining</span>
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── Sector Heatmap ───────────────────────────────────────────────────────────

function SectorHeatmap({ data, loading }: { data: SectorData | null; loading: boolean }) {
  return (
    <Card>
      <SectionHeader title="Sector Heatmap" subtitle="ETF-based sector performance" color="#8b5cf6" />
      {loading ? <Spinner /> : (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {(data?.sectors ?? []).map(s => (
            <div
              key={s.symbol}
              className="rounded-xl p-3 flex flex-col gap-1"
              style={{ background: heatColor(s.changePercent), border: "1px solid rgba(255,255,255,0.04)" }}
            >
              <span className="text-xs font-bold" style={{ color: "#e8eaf0" }}>{s.symbol}</span>
              <span className="text-xs" style={{ color: "#9aa0b4" }}>{s.name}</span>
              <span className="text-sm font-bold" style={{ color: heatTextColor(s.changePercent) }}>
                {fmtPct(s.changePercent)}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── Watchlist ────────────────────────────────────────────────────────────────

function WatchlistEngine() {
  const [tickers, setTickers] = useState<string[]>(DEFAULT_WATCHLIST);
  const [input, setInput] = useState("");
  const [data, setData] = useState<WatchlistData | null>(null);
  const [loading, setLoading] = useState(false);
  const fetchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(WATCHLIST_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        if (Array.isArray(parsed) && parsed.length > 0) setTickers(parsed);
      }
    } catch {}
  }, []);

  // persist to localStorage
  useEffect(() => {
    try { localStorage.setItem(WATCHLIST_KEY, JSON.stringify(tickers)); } catch {}
  }, [tickers]);

  const fetchQuotes = useCallback(async (list: string[]) => {
    if (!list.length) { setData({ quotes: [] }); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/watchlist-quotes?tickers=${list.join(",")}`);
      if (res.ok) setData(await res.json());
    } catch {}
    setLoading(false);
  }, []);

  // debounced fetch on ticker change
  useEffect(() => {
    if (fetchRef.current) clearTimeout(fetchRef.current);
    fetchRef.current = setTimeout(() => fetchQuotes(tickers), 300);
    return () => { if (fetchRef.current) clearTimeout(fetchRef.current); };
  }, [tickers, fetchQuotes]);

  function addTicker() {
    const t = input.trim().toUpperCase();
    if (!t || tickers.includes(t) || tickers.length >= MAX_WATCHLIST) return;
    setTickers(prev => [...prev, t]);
    setInput("");
  }

  function removeTicker(t: string) {
    setTickers(prev => prev.filter(x => x !== t));
  }

  return (
    <Card>
      <SectionHeader title="Watchlist Engine" subtitle={`${tickers.length}/${MAX_WATCHLIST} tickers · localStorage persisted`} color="#f59e0b" />

      {/* Add ticker */}
      <div className="flex gap-2 mb-4">
        <input
          value={input}
          onChange={e => setInput(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === "Enter" && addTicker()}
          placeholder="Add ticker (e.g. MSFT)"
          maxLength={8}
          className="flex-1 text-xs px-3 py-2 rounded-lg outline-none"
          style={{ background: "#141720", border: "1px solid #1e2433", color: "#e8eaf0" }}
        />
        <button
          onClick={addTicker}
          className="text-xs px-3 py-2 rounded-lg font-medium"
          style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}
        >
          + Add
        </button>
        <button
          onClick={() => fetchQuotes(tickers)}
          className="text-xs px-3 py-2 rounded-lg font-medium"
          style={{ background: "rgba(0,212,255,0.1)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.2)" }}
        >
          ↻ Refresh
        </button>
      </div>

      {loading ? <Spinner /> : (
        <div className="space-y-2">
          {(data?.quotes ?? []).map(q => {
            const sig = quickSignal(q.changePercent);
            return (
              <div
                key={q.ticker}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                style={{ background: "#141720", border: "1px solid #1e2433" }}
              >
                <span className="text-sm font-bold w-16 flex-shrink-0" style={{ color: "#e8eaf0" }}>{q.ticker}</span>
                <span className="text-sm font-medium flex-1" style={{ color: "#e8eaf0" }}>
                  {q.price != null ? `$${fmt(q.price)}` : "—"}
                </span>
                <span className="text-xs font-medium w-20 text-right" style={{ color: pctColor(q.changePercent) }}>
                  {fmtPct(q.changePercent)}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium w-24 text-center flex-shrink-0"
                  style={{ background: `${sig.color}15`, color: sig.color }}
                >
                  {sig.label}
                </span>
                <button
                  onClick={() => removeTicker(q.ticker)}
                  className="text-xs w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                  style={{ color: "#5a6075" }}
                >
                  ✕
                </button>
              </div>
            );
          })}
          {tickers.length === 0 && (
            <p className="text-xs text-center py-4" style={{ color: "#5a6075" }}>Add tickers above to track them</p>
          )}
        </div>
      )}
    </Card>
  );
}

// ─── Economic Calendar ────────────────────────────────────────────────────────

function EconomicCalendar({ data, loading }: { data: CalendarData | null; loading: boolean }) {
  return (
    <Card>
      <SectionHeader title="Economic Calendar" subtitle="US high/medium impact events · next 14 days" color="#ef4444" />
      {loading ? <Spinner /> : (
        <div className="space-y-2">
          {(data?.events ?? []).map((ev, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-xl px-3 py-2.5"
              style={{ background: "#141720", border: "1px solid #1e2433" }}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                style={{ background: impactDot(ev.impact) }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium" style={{ color: "#e8eaf0" }}>{ev.event}</p>
                <p className="text-xs mt-0.5" style={{ color: "#5a6075" }}>{formatEventTime(ev.time)}</p>
              </div>
              <div className="text-right flex-shrink-0">
                {ev.actual != null ? (
                  <p className="text-xs font-bold" style={{ color: "#10b981" }}>
                    Actual: {ev.actual}{ev.unit}
                  </p>
                ) : ev.estimate != null ? (
                  <p className="text-xs" style={{ color: "#9aa0b4" }}>
                    Est: {ev.estimate}{ev.unit}
                  </p>
                ) : (
                  <p className="text-xs" style={{ color: "#5a6075" }}>TBD</p>
                )}
                <span
                  className="text-xs px-1.5 py-0.5 rounded font-medium"
                  style={{
                    background: ev.impact === "high" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
                    color: ev.impact === "high" ? "#ef4444" : "#f59e0b",
                  }}
                >
                  {ev.impact.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
          {(!data?.events?.length) && (
            <p className="text-xs text-center py-4" style={{ color: "#5a6075" }}>No upcoming US events found</p>
          )}
        </div>
      )}
    </Card>
  );
}

// ─── News Intelligence ────────────────────────────────────────────────────────

function NewsIntelligence({ data, loading }: { data: NewsData | null; loading: boolean }) {
  const [expanded, setExpanded] = useState<number | null>(null);

  // group by category
  const categories = Array.from(new Set((data?.items ?? []).map(i => i.category)));

  return (
    <Card>
      <SectionHeader title="News Intelligence" subtitle="6 macro categories · real-time headlines" color="#a78bfa" />
      {loading ? <Spinner /> : (
        <div className="space-y-4">
          {categories.map(cat => {
            const items = (data?.items ?? []).filter(i => i.category === cat);
            const first = items[0];
            return (
              <div key={cat}>
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#a78bfa" }}>{cat}</p>
                <div className="space-y-1.5">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl px-3 py-2.5 cursor-pointer transition-all"
                      style={{ background: "#141720", border: "1px solid #1e2433" }}
                      onClick={() => setExpanded(expanded === idx + cat.length ? null : idx + cat.length)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-medium leading-snug" style={{ color: "#e8eaf0" }}>
                          {item.headline}
                        </p>
                        <span className="text-xs flex-shrink-0" style={{ color: "#5a6075" }}>
                          {formatNewsTime(item.datetime)}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "#5a6075" }}>{item.source}</p>
                      {expanded === idx + cat.length && (
                        <div className="mt-2 pt-2" style={{ borderTop: "1px solid #1e2433" }}>
                          <p className="text-xs font-semibold mb-1" style={{ color: "#a78bfa" }}>Why this matters</p>
                          <p className="text-xs leading-relaxed" style={{ color: "#9aa0b4" }}>{item.summary}</p>
                          {item.url && item.url !== "#" && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs mt-2 inline-block"
                              style={{ color: "#00d4ff" }}
                              onClick={e => e.stopPropagation()}
                            >
                              Read full article →
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {!categories.length && (
            <p className="text-xs text-center py-4" style={{ color: "#5a6075" }}>No news data — configure NEWS_API_KEY</p>
          )}
        </div>
      )}
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MarketCommandCenter() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [sector, setSector] = useState<SectorData | null>(null);
  const [calendar, setCalendar] = useState<CalendarData | null>(null);
  const [news, setNews] = useState<NewsData | null>(null);

  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingSector, setLoadingSector] = useState(true);
  const [loadingCalendar, setLoadingCalendar] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);

  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchAll = useCallback(async () => {
    setLoadingOverview(true);
    setLoadingSector(true);
    setLoadingCalendar(true);
    setLoadingNews(true);

    await Promise.allSettled([
      fetch("/api/market-overview").then(r => r.ok ? r.json() : null).then(d => { setOverview(d); setLoadingOverview(false); }),
      fetch("/api/sector-performance").then(r => r.ok ? r.json() : null).then(d => { setSector(d); setLoadingSector(false); }),
      fetch("/api/economic-calendar").then(r => r.ok ? r.json() : null).then(d => { setCalendar(d); setLoadingCalendar(false); }),
      fetch("/api/news-intelligence").then(r => r.ok ? r.json() : null).then(d => { setNews(d); setLoadingNews(false); }),
    ]);

    setLastRefresh(new Date());
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0b0d" }}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 pt-8 pb-24">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-3">
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-3"
              style={{ background: "rgba(0,212,255,0.08)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.2)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              Institutional-Style Command Center
            </div>
            <h1 className="text-3xl font-bold" style={{ color: "#e8eaf0" }}>
              Market Command <span style={{ color: "#00d4ff" }}>Center</span>
            </h1>
            <p className="text-sm mt-1" style={{ color: "#9aa0b4" }}>
              Market overview · Breadth · Sector heatmap · Watchlist · Economic calendar · News intelligence
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={fetchAll}
              className="text-xs px-4 py-2 rounded-lg font-medium"
              style={{ background: "rgba(0,212,255,0.1)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.2)" }}
            >
              ↻ Refresh All
            </button>
            {lastRefresh && (
              <p className="text-xs" style={{ color: "#5a6075" }}>
                Last updated: {lastRefresh.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        {/* Row 1: Market Overview (full width) */}
        <div className="mb-5">
          <MarketOverview data={overview} loading={loadingOverview} />
        </div>

        {/* Row 2: Breadth + Sector Heatmap */}
        <div className="grid md:grid-cols-3 gap-5 mb-5">
          <div>
            <MarketBreadth data={sector} loading={loadingSector} />
          </div>
          <div className="md:col-span-2">
            <SectorHeatmap data={sector} loading={loadingSector} />
          </div>
        </div>

        {/* Row 3: Watchlist (full width) */}
        <div className="mb-5">
          <WatchlistEngine />
        </div>

        {/* Row 4: Calendar + News side by side */}
        <div className="grid md:grid-cols-2 gap-5 mb-8">
          <EconomicCalendar data={calendar} loading={loadingCalendar} />
          <NewsIntelligence data={news} loading={loadingNews} />
        </div>

        {/* Disclaimer */}
        <div
          className="rounded-xl p-4 flex gap-3 items-start"
          style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)" }}
        >
          <span className="text-lg flex-shrink-0">⚠️</span>
          <p className="text-xs leading-relaxed" style={{ color: "#9aa0b4" }}>
            <strong style={{ color: "#f59e0b" }}>Educational research only.</strong>{" "}
            All data displayed is for educational and research purposes. Proxy ETFs (UUP, TLT, SHY) are used as DXY/bond yield substitutes and are clearly labeled. Market breadth is derived from sector ETF performance, not official exchange breadth data. Nothing here constitutes investment advice. Always perform your own due diligence.
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Navbar from "@/components/Navbar";

// ─── Signal Engine types ───────────────────────────────────────────────────────

interface EdgeSignalResponse {
  ticker: string;
  status: "Bullish Watch" | "Bearish Warning" | "Wait";
  score: number;
  confidence: number;
  reasons: string[];
  confirms: string[];
  invalidates: string[];
  riskLevel: "Low" | "Medium" | "High" | "Very High";
  beginnerExplanation: string;
  entryZone: string | null;
  stopLevel: string | null;
  target1: string | null;
  target2: string | null;
  riskWarning: string;
  isPlaceholder: boolean;
  quote: {
    price: number | null;
    change: number | null;
    changePercent: number | null;
    high: number | null;
    low: number | null;
    prevClose: number | null;
    isPlaceholder: boolean;
  };
  recentNews: Array<{ headline: string; source: string; datetime: string; url: string; isPlaceholder: boolean }>;
  disclaimer: string;
  generatedAt: string;
}

const SIGNAL_STATUS_META: Record<string, { dot: string; label: string; color: string; bg: string; border: string }> = {
  "Bullish Watch":   { dot: "#10b981", label: "Bullish Watch",   color: "#10b981", bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.3)"  },
  "Bearish Warning": { dot: "#ef4444", label: "Bearish Warning", color: "#ef4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.3)"   },
  "Wait":            { dot: "#f59e0b", label: "Wait / No Clean Setup", color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.3)" },
};

const RISK_COLORS: Record<string, string> = {
  "Low": "#10b981", "Medium": "#f59e0b", "High": "#ef4444", "Very High": "#ef4444",
};

const SIGNAL_CHECKLIST = [
  { id: "trend",   label: "Trend confirmed on a higher timeframe (15m, 1h, or Daily)?" },
  { id: "vwap",    label: "Price above VWAP (for longs) or below VWAP (for shorts)?" },
  { id: "sr",      label: "Clear support or resistance level identified nearby?" },
  { id: "volume",  label: "Volume confirmation present on the directional move?" },
  { id: "news",    label: "News catalyst checked — no negative surprise coming?" },
  { id: "rr",      label: "Risk/reward is at least 2:1 using the signal levels?" },
  { id: "chasing", label: "NOT chasing — entering near the setup, not after the move?" },
];

// ─── Interfaces ────────────────────────────────────────────────────────────────

interface SetupData {
  name: string;
  description: string;
}

interface SessionData {
  key: string;
  label: string;
  icon: string;
  hours: string;
  color: string;
  keyMarkets: string;
  volatility: "Low" | "Low–Medium" | "Medium" | "High" | "Very High";
  overview: string;
  behaviors: string[];
  liquidity: string;
  checklist: string[];
  setups: SetupData[];
}

interface WarRoomResult {
  grade: "A+" | "A" | "B" | "C" | "NO TRADE";
  gradeReasoning: string;
  confluenceAnalysis: string;
  riskAssessment: string;
  whatCouldGoWrong: string;
  finalDecision: string;
  disclaimer: string;
}

interface AnalyzeForm {
  session: string;
  market: string;
  direction: "Long" | "Short" | "";
  setupType: string;
  liquidityLocation: string;
  htfTrend: string;
  catalyst: string;
  entryPrice: string;
  stopPrice: string;
  targetPrice: string;
  riskPercent: string;
}

// ─── Chart config ──────────────────────────────────────────────────────────────

const TICKERS = [
  { label: "SPY",  symbol: "AMEX:SPY" },
  { label: "QQQ",  symbol: "NASDAQ:QQQ" },
  { label: "IWM",  symbol: "AMEX:IWM" },
  { label: "TLT",  symbol: "AMEX:TLT" },
  { label: "XLE",  symbol: "AMEX:XLE" },
  { label: "NVDA", symbol: "NASDAQ:NVDA" },
  { label: "TSLA", symbol: "NASDAQ:TSLA" },
];

const TIMEFRAMES = [
  { label: "1m",  value: "1" },
  { label: "5m",  value: "5" },
  { label: "15m", value: "15" },
  { label: "1h",  value: "60" },
  { label: "4h",  value: "240" },
  { label: "1D",  value: "D" },
];

const CHART_READING_ITEMS = [
  {
    id: "trend",
    label: "Trend Direction",
    desc: "Higher highs + higher lows = uptrend. Lower highs + lower lows = downtrend. Sideways = range.",
  },
  {
    id: "support",
    label: "Support / Resistance",
    desc: "Levels where price bounced or reversed multiple times. These are magnets — price returns to test them.",
  },
  {
    id: "volume",
    label: "Volume",
    desc: "High volume on a move = conviction. Low volume = weak, likely to reverse. Volume spikes at breakouts confirm the move.",
  },
  {
    id: "candle_size",
    label: "Candle Size",
    desc: "Large candles = strong momentum. Small doji or spinning tops = indecision. Size matters more than colour alone.",
  },
  {
    id: "wicks",
    label: "Wick Rejection",
    desc: "Long upper wick = sellers rejected higher prices. Long lower wick = buyers rejected lower prices. Short wicks = clean directional move.",
  },
  {
    id: "breakout",
    label: "Breakout or Fakeout",
    desc: "Did price break a key level and hold? Or did it break, trap traders, then reverse? Fakeouts often precede the real move.",
  },
  {
    id: "vwap",
    label: "VWAP Location",
    desc: "Price above VWAP = institutional buyers in control. Below = sellers. VWAP is dynamic support/resistance intraday.",
  },
  {
    id: "session_hl",
    label: "Session High / Low",
    desc: "Mark each session's high and low. Price returning to these = liquidity targets. A sweep of the level = stop hunt.",
  },
];

// ─── Session data ──────────────────────────────────────────────────────────────

const SESSIONS: SessionData[] = [
  {
    key: "asian",
    label: "Asian",
    icon: "🌏",
    hours: "00:00–08:00 UTC",
    color: "#f59e0b",
    keyMarkets: "JPY pairs, AUD/USD, NZD/USD, Gold, US futures (thin)",
    volatility: "Low–Medium",
    overview:
      "The Asian session is the accumulation window. Tokyo, Sydney, and Singapore drive thin, range-bound price action that sets the structural levels London and New York will later target for liquidity runs.",
    behaviors: [
      "Consolidation and range formation — the 'accumulation' session",
      "Price often coils between equal highs and equal lows (SSL/BSL targets)",
      "BOJ policy news and Japanese data can spike volatility",
      "Asian Range becomes the target for London sweep plays",
      "Institutions build positions quietly — watch for absorption at extremes",
    ],
    liquidity:
      "Thin order books create higher slippage. Smart money uses this session to build positions at range extremes, often creating liquidity pools (equal highs/lows) that London will later sweep for stop runs.",
    checklist: [
      "Mark the Asian session high and low",
      "Note any overnight gap from prior NY close",
      "Check BOJ, RBA, or RBNZ news releases",
      "Identify equal highs/lows forming — these are liquidity targets",
      "Note daily open price and prior day's high/low",
      "If in a range, favor fades at extremes over breakouts",
    ],
    setups: [
      {
        name: "Asian Range Breakout",
        description:
          "Price builds a clean tight range during Asian hours. A break with momentum above/below the range signals continuation. Entry: break + retest of range high/low. Stop: behind range midpoint. Target: 1.5–2× the range height. Confirmation: strong close outside range on 15m.",
      },
      {
        name: "Asia Fakeout Reversal",
        description:
          "Price sweeps just above the Asian high or below the Asian low — liquidity grab — then immediately reverses back inside the range. Entry: when candle closes back inside range. Stop: beyond the sweep wick (tight). Target: opposite extreme of Asian range. Higher-probability than the breakout because it traps late breakout traders.",
      },
    ],
  },
  {
    key: "london",
    label: "London",
    icon: "🏦",
    hours: "07:00–16:00 UTC",
    color: "#8b5cf6",
    keyMarkets: "EUR/USD, GBP/USD, DXY, Gold, oil, European equities",
    volatility: "High",
    overview:
      "London is the world's largest forex trading centre. The session opens with aggressive institutional order flow that targets liquidity built up overnight. The first hour (07:00–08:00 UTC) is the 'killzone' — highest probability for institutional setups.",
    behaviors: [
      "London opens with a sweep of Asian session highs or lows — intentional stop hunting",
      "07:00–08:00 UTC is the killzone — highest probability setups form here",
      "European economic data releases drive directional moves",
      "DXY direction often dictates EUR/GBP direction for the day",
      "London close (15:00–16:00 UTC) often reverses the London trend as positions are squared",
    ],
    liquidity:
      "London is the deepest forex liquidity pool in the world. Price targets liquidity pools from the Asian session — equal highs/lows, previous day high/low, and key session opening prices. The London sweep — price runs stops one side then reverses violently — is one of the most reliable institutional concepts.",
    checklist: [
      "Mark Asian session H/L before London opens",
      "Identify the prior week high and low",
      "Check major EU data at open (08:30 CET = 07:30 UTC)",
      "Note the daily bias from HTF (4H, Daily) before trading",
      "Wait for a clear sweep of Asian H or L before considering a reversal entry",
      "Avoid trading the first 15 minutes — wait for structure to form",
    ],
    setups: [
      {
        name: "London Sweep Reversal",
        description:
          "London opens and sweeps below the Asian session low (or above the high) to grab stops. Then price immediately reverses. Entry: market structure shift (MSS) — a break of the most recent swing high after the sweep. Stop: below the sweep low. Target: prior day high or key HTF level.",
      },
      {
        name: "London Continuation",
        description:
          "When the HTF trend is strongly aligned (bullish on daily), London breaks above the Asian range and continues. Entry: pullback to the broken Asian range high, now acting as support. Stop: below the Asian range high. Target: next major HTF resistance.",
      },
      {
        name: "London Killzone Breakout",
        description:
          "Between 07:00–08:00 UTC, price builds compression then breaks with force. Entry: break of the compression range with volume confirmation. Stop: back inside the range. Target: 2× the pre-breakout range height. Avoid if a major release is due within 30 minutes.",
      },
    ],
  },
  {
    key: "ny",
    label: "New York",
    icon: "🗽",
    hours: "13:30–20:00 UTC",
    color: "#10b981",
    keyMarkets: "SPY, QQQ, IWM, individual stocks, VIX, ES/NQ futures, USD pairs",
    volatility: "High",
    overview:
      "The New York session drives the world's largest equity markets. The open (13:30 UTC / 09:30 ET) is the single highest-volatility event of the day for US equities. VWAP is the institutional benchmark — everything above is bullish, below is bearish.",
    behaviors: [
      "NY Open (13:30 UTC) is the highest volatility event of the day for US equities",
      "Price action at 09:30–10:30 ET often sets the directional bias for the full session",
      "VWAP is the institutional benchmark — price above = bullish bias, below = bearish",
      "Lunch hour (12:00–14:00 ET) — low volume, choppy, avoid trading",
      "Power Hour (15:00–16:00 ET) — institutional rebalancing, strong directional moves",
    ],
    liquidity:
      "US equity markets see massive institutional participation at open. Market makers set the opening range (first 5–30 minutes) as the key reference. VWAP anchors institutional cost basis for the day. High-frequency trading dominates the first and last 30 minutes.",
    checklist: [
      "Check pre-market futures direction (ES, NQ) before open",
      "Note key pre-market levels: pre-market high/low, overnight high/low",
      "Identify the opening range (first 15 minutes of regular trading)",
      "Note if SPY/QQQ is above or below VWAP",
      "Check Fed speakers, economic data (CPI, NFP, FOMC) for the day",
      "Mark prior day's high and low as key liquidity targets",
    ],
    setups: [
      {
        name: "NY Open Reversal",
        description:
          "Pre-market sets a directional move that reverses at or just after the open. Price spikes at 09:30, makes new pre-market high (or low), then violently reverses. Entry: after clear reversal candle on 1m or 5m. Stop: above the spike high. Target: prior day close or VWAP.",
      },
      {
        name: "Opening Range Breakout (ORB)",
        description:
          "Mark the high and low of the first 15 minutes. When price breaks above the high with increasing volume, go long. When price breaks below the low, go short. Entry: confirmed close above/below the range. Stop: back inside the range. Target: 1–2× the range height above/below the breakout.",
      },
      {
        name: "VWAP Reclaim",
        description:
          "Price is trading below VWAP (bearish), then makes a sustained reclaim — closes above VWAP on multiple candles, retests from above, holds as support. Entry: retest of VWAP from above. Stop: close back below VWAP. Target: prior session high or next key resistance.",
      },
      {
        name: "Power Hour Momentum",
        description:
          "The last 60 minutes (15:00–16:00 ET) sees institutional rebalancing and index fund adjustments. Entry: align with the dominant daily trend, enter on a pullback early in Power Hour. Stop: below the Power Hour pivot low. Target: test of daily high/low.",
      },
    ],
  },
  {
    key: "overlap",
    label: "Overlap",
    icon: "⚡",
    hours: "13:30–16:00 UTC",
    color: "#ef4444",
    keyMarkets: "ALL — equities, forex, futures, options",
    volatility: "Very High",
    overview:
      "The London/NY Overlap is the single highest-liquidity window of the entire global trading day. Both of the world's largest financial centres are simultaneously active, creating maximum institutional participation and the most explosive price action.",
    behaviors: [
      "The Overlap is the single highest-liquidity window of the entire trading day",
      "Two of the world's largest financial centres are simultaneously active",
      "Divergences between London and NY desks create powerful two-sided price action",
      "Key economic events (FOMC, NFP, CPI) often scheduled during or just before the Overlap",
      "Best A+ setups occur here — also highest risk of violent reversals",
    ],
    liquidity:
      "Maximum institutional participation. London desks close positions from the morning session while NY desks open new positions. This creates a natural tug-of-war that often results in sharp decisive moves. Stop hunts and liquidity grabs are most aggressive in this window.",
    checklist: [
      "Be aware of any major economic events scheduled for 14:00 ET (18:00 UTC)",
      "Look for confluence between London trend and NY pre-market trend",
      "Mark London session high/low before the Overlap begins",
      "Note where VWAP is relative to current price",
      "Only take setups with at least 3 confluences — volatility is unforgiving",
      "Have hard stops — do not widen stops during Overlap volatility",
    ],
    setups: [
      {
        name: "Overlap Continuation",
        description:
          "If London had a clear trend (e.g. GBP/USD grinding higher all morning), the NY open often tests a key level, sweeps stops, then continues in London's direction. Entry: after the NY open sweep reversal, align with London trend. Maximum confluence.",
      },
      {
        name: "Overlap Reversal",
        description:
          "London trend exhausts at a key HTF level (daily resistance). NY open creates a false break above that level (stop hunt), then reverses sharply. Entry: after the false break and return inside the level. Stop: above the false break high. Target: back to the London session open price.",
      },
    ],
  },
];

// ─── Session timing helpers ────────────────────────────────────────────────────

interface SessionWindow {
  key: string;
  label: string;
  color: string;
  startH: number;
  startM: number;
  endH: number;
  endM: number;
}

const SESSION_WINDOWS: SessionWindow[] = [
  { key: "asian",   label: "Asian",    color: "#f59e0b", startH: 0,  startM: 0,  endH: 8,  endM: 0 },
  { key: "london",  label: "London",   color: "#8b5cf6", startH: 7,  startM: 0,  endH: 16, endM: 0 },
  { key: "ny",      label: "New York", color: "#10b981", startH: 13, startM: 30, endH: 20, endM: 0 },
  { key: "overlap", label: "Overlap",  color: "#ef4444", startH: 13, startM: 30, endH: 16, endM: 0 },
];

function minutesOfDay(h: number, m: number): number { return h * 60 + m; }

function isSessionActive(win: SessionWindow, nowMinutes: number): boolean {
  const start = minutesOfDay(win.startH, win.startM);
  const end   = minutesOfDay(win.endH, win.endM);
  return nowMinutes >= start && nowMinutes < end;
}

function getActiveSessions(date: Date): SessionWindow[] {
  const mins = minutesOfDay(date.getUTCHours(), date.getUTCMinutes());
  return SESSION_WINDOWS.filter(w => isSessionActive(w, mins));
}

function getNextSession(date: Date): { win: SessionWindow; minutesUntil: number } | null {
  const nowMins = minutesOfDay(date.getUTCHours(), date.getUTCMinutes());
  let best: { win: SessionWindow; minutesUntil: number } | null = null;
  for (const win of SESSION_WINDOWS) {
    const start = minutesOfDay(win.startH, win.startM);
    let diff = start - nowMins;
    if (diff <= 0) diff += 24 * 60;
    if (!best || diff < best.minutesUntil) best = { win, minutesUntil: diff };
  }
  return best;
}

function pad2(n: number): string { return String(n).padStart(2, "0"); }

function formatCountdown(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const VOLATILITY_COLORS: Record<string, string> = {
  "Low": "#10b981", "Low–Medium": "#f59e0b", "Medium": "#f59e0b",
  "High": "#ef4444", "Very High": "#ef4444",
};

const GRADE_COLORS: Record<string, { color: string; bg: string }> = {
  "A+": { color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  "A":  { color: "#10b981", bg: "rgba(16,185,129,0.08)" },
  "B":  { color: "#f59e0b", bg: "rgba(245,158,11,0.1)"  },
  "C":  { color: "#f97316", bg: "rgba(249,115,22,0.1)"  },
  "NO TRADE": { color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
};

// ─── TradingView chart sub-component ──────────────────────────────────────────
// Rendered with a key prop so React fully remounts when ticker/interval changes.

interface TVChartProps { symbol: string; interval: string; }

function TradingViewChart({ symbol, interval }: TVChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const containerId  = `tv_${symbol.replace(":", "_")}_${interval}`;

  useEffect(() => {
    if (!containerRef.current) return;

    function buildWidget() {
      if (!containerRef.current) return;
      containerRef.current.innerHTML = `<div id="${containerId}"></div>`;
      const win = window as unknown as Record<string, { widget: new (c: Record<string, unknown>) => void }>;
      if (win.TradingView) {
        new win.TradingView.widget({
          container_id: containerId,
          symbol,
          interval,
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          toolbar_bg: "#0f1117",
          enable_publishing: false,
          allow_symbol_change: true,
          hide_side_toolbar: false,
          save_image: false,
          height: 560,
          width: "100%",
          withdateranges: true,
          studies: ["VWAP@tv-basicstudies"],
          show_popup_button: true,
        });
      }
    }

    const w = window as unknown as Record<string, unknown>;
    if (w.TradingView) {
      buildWidget();
    } else {
      const existing = document.getElementById("tv-main-script");
      if (existing) {
        existing.addEventListener("load", buildWidget);
        return () => existing.removeEventListener("load", buildWidget);
      }
      const script = document.createElement("script");
      script.id    = "tv-main-script";
      script.src   = "https://s3.tradingview.com/tv.js";
      script.async = true;
      script.onload = buildWidget;
      document.head.appendChild(script);
    }

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} style={{ minHeight: "560px", background: "#0f1117" }} />;
}

// ─── Checkbox icon ────────────────────────────────────────────────────────────

function CheckIcon({ color = "#0a0b0d" }: { color?: string }) {
  return (
    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
      <path d="M1 3.5L3.5 6L8 1" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MarketWarRoom() {
  const [currentUtcTime, setCurrentUtcTime] = useState<Date>(new Date());
  const [selectedTicker, setSelectedTicker]   = useState("SPY");
  const [selectedInterval, setSelectedInterval] = useState("15");
  const [activeSession, setActiveSession]     = useState("asian");
  const [sessionChecked, setSessionChecked]   = useState<Record<string, Set<string>>>({});
  const [chartChecked, setChartChecked]       = useState<Set<string>>(new Set());
  const [expandedSetup, setExpandedSetup]     = useState<string | null>(null);
  const [signalData, setSignalData]           = useState<EdgeSignalResponse | null>(null);
  const [signalLoading, setSignalLoading]     = useState(false);
  const [signalError, setSignalError]         = useState<string | null>(null);
  const [signalChecked, setSignalChecked]     = useState<Set<string>>(new Set());
  const [form, setForm] = useState<AnalyzeForm>({
    session: "", market: "", direction: "", setupType: "",
    liquidityLocation: "", htfTrend: "", catalyst: "",
    entryPrice: "", stopPrice: "", targetPrice: "", riskPercent: "1",
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult]   = useState<WarRoomResult | null>(null);
  const [aiError, setAiError]     = useState<string | null>(null);

  // ── Clock tick ──
  useEffect(() => {
    const id = setInterval(() => setCurrentUtcTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // ── Signal fetch — re-runs on ticker change ──
  useEffect(() => {
    setSignalData(null);
    setSignalError(null);
    setSignalChecked(new Set());
    setSignalLoading(true);
    fetch(`/api/signal?ticker=${selectedTicker}`)
      .then(r => r.json())
      .then((d: EdgeSignalResponse) => { setSignalData(d); setSignalLoading(false); })
      .catch(() => { setSignalError("Could not load signal data"); setSignalLoading(false); });
  }, [selectedTicker]);

  // ── Checklist toggle ──
  const toggleSessionCheck = useCallback((sessionKey: string, item: string) => {
    setSessionChecked(prev => {
      const existing = prev[sessionKey] ? new Set(prev[sessionKey]) : new Set<string>();
      existing.has(item) ? existing.delete(item) : existing.add(item);
      return { ...prev, [sessionKey]: existing };
    });
  }, []);

  const toggleChartCheck = useCallback((id: string) => {
    setChartChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // ── AI form helpers ──
  const currentSessionData   = SESSIONS.find(s => s.key === form.session);
  const selectedSessionSetups = currentSessionData?.setups ?? [];

  const rrCalc = (() => {
    const e = parseFloat(form.entryPrice);
    const s = parseFloat(form.stopPrice);
    const t = parseFloat(form.targetPrice);
    if (!isNaN(e) && !isNaN(s) && !isNaN(t) && s !== e) {
      return (Math.abs(t - e) / Math.abs(e - s)).toFixed(2);
    }
    return null;
  })();

  const formValid =
    form.session && form.market.trim() && form.direction &&
    form.setupType && form.liquidityLocation && form.htfTrend &&
    form.entryPrice && form.stopPrice && form.targetPrice;

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValid) return;
    setAiLoading(true);
    setAiResult(null);
    setAiError(null);
    try {
      const res = await fetch("/api/ai-war-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        setAiError(err.error ?? "Analysis failed — please try again.");
      } else {
        setAiResult((await res.json()) as WarRoomResult);
      }
    } catch {
      setAiError("Network error — please check your connection and try again.");
    } finally {
      setAiLoading(false);
    }
  }, [form, formValid]);

  // ── Computed values ──
  const activeSessions    = getActiveSessions(currentUtcTime);
  const nextSession       = getNextSession(currentUtcTime);
  const utcH  = currentUtcTime.getUTCHours();
  const utcM  = currentUtcTime.getUTCMinutes();
  const utcS  = currentUtcTime.getUTCSeconds();
  const utcTimeStr        = `${pad2(utcH)}:${pad2(utcM)}:${pad2(utcS)} UTC`;
  const nowMins           = minutesOfDay(utcH, utcM);
  const dayMins           = 24 * 60;
  const timelinePercent   = (nowMins / dayMins) * 100;
  const activeTab         = SESSIONS.find(s => s.key === activeSession) ?? SESSIONS[0];
  const currentSymbol     = TICKERS.find(t => t.label === selectedTicker)?.symbol ?? "AMEX:SPY";
  const chartReadProgress = chartChecked.size;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0b0d" }}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 pt-6 pb-24">

        {/* ── Compact header ── */}
        <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-2"
              style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              EDGE OS — Market Intelligence
            </div>
            <h1 className="text-3xl font-bold" style={{ color: "#e8eaf0" }}>
              Market <span style={{ color: "#ef4444" }}>War Room</span>
            </h1>
            <p className="text-xs mt-1" style={{ color: "#5a6075" }}>
              Live candlestick chart · Chart reading checklist · Session playbook · AI setup grader
            </p>
          </div>

          {/* UTC clock — secondary */}
          <div className="text-right">
            <div
              className="text-xl font-mono font-bold tracking-widest"
              style={{ color: "#00d4ff", textShadow: "0 0 16px rgba(0,212,255,0.25)" }}
            >
              {utcTimeStr}
            </div>
            <div className="flex gap-1.5 flex-wrap justify-end mt-1.5">
              {activeSessions.length === 0 ? (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#141720", color: "#5a6075", border: "1px solid #1e2433" }}>
                  Off Hours
                </span>
              ) : (
                activeSessions.map(s => (
                  <span
                    key={s.key}
                    className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: `${s.color}15`, color: s.color, border: `1px solid ${s.color}35` }}
                  >
                    {s.label} ●
                  </span>
                ))
              )}
            </div>
            {nextSession && activeSessions.length === 0 && (
              <div className="text-xs mt-1" style={{ color: "#9aa0b4" }}>
                Next: <span style={{ color: nextSession.win.color }}>{nextSession.win.label}</span>{" "}
                in <span className="font-semibold" style={{ color: "#e8eaf0" }}>{formatCountdown(nextSession.minutesUntil)}</span>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 1 — LIVE CHART (HERO)
        ════════════════════════════════════════════════════════════════════ */}
        <div
          className="rounded-2xl overflow-hidden mb-4"
          style={{ border: "1px solid #1e2433", background: "#0f1117" }}
        >
          {/* Toolbar */}
          <div
            className="px-4 py-3 flex items-center justify-between flex-wrap gap-3"
            style={{ borderBottom: "1px solid #1e2433" }}
          >
            {/* Ticker pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold mr-1" style={{ color: "#5a6075" }}>TICKER</span>
              {TICKERS.map(t => (
                <button
                  key={t.label}
                  onClick={() => setSelectedTicker(t.label)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                  style={{
                    background: selectedTicker === t.label ? "rgba(0,212,255,0.12)" : "transparent",
                    color:      selectedTicker === t.label ? "#00d4ff"               : "#9aa0b4",
                    border:     selectedTicker === t.label ? "1px solid rgba(0,212,255,0.3)" : "1px solid #1e2433",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Timeframe pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold mr-1" style={{ color: "#5a6075" }}>TF</span>
              {TIMEFRAMES.map(tf => (
                <button
                  key={tf.value}
                  onClick={() => setSelectedInterval(tf.value)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                  style={{
                    background: selectedInterval === tf.value ? "rgba(0,212,255,0.12)" : "transparent",
                    color:      selectedInterval === tf.value ? "#00d4ff"                : "#9aa0b4",
                    border:     selectedInterval === tf.value ? "1px solid rgba(0,212,255,0.3)" : "1px solid #1e2433",
                  }}
                >
                  {tf.label}
                </button>
              ))}
              <span className="text-xs ml-1" style={{ color: "#3a4060" }}>VWAP on</span>
            </div>
          </div>

          {/* Chart — key forces full remount on ticker/interval change */}
          <TradingViewChart
            key={`${selectedTicker}-${selectedInterval}`}
            symbol={currentSymbol}
            interval={selectedInterval}
          />
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 2 — EDGE SIGNAL ENGINE
        ════════════════════════════════════════════════════════════════════ */}
        <div className="mb-4">
          {/* Loading skeleton */}
          {signalLoading && (
            <div
              className="rounded-2xl p-5 animate-pulse"
              style={{ background: "#0f1117", border: "1px solid #1e2433" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="h-4 w-48 rounded" style={{ background: "#1e2433" }} />
                <div className="h-6 w-32 rounded-full" style={{ background: "#1e2433" }} />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <div key={i} className="h-3 rounded" style={{ background: "#1e2433", width: `${70 + i * 8}%` }} />)}
                </div>
                <div className="space-y-2">
                  {[1, 2, 3, 4].map(i => <div key={i} className="h-3 rounded" style={{ background: "#1e2433" }} />)}
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {signalError && !signalLoading && (
            <div className="rounded-2xl p-4" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
              <p className="text-xs" style={{ color: "#5a6075" }}>Signal data unavailable — {signalError}</p>
            </div>
          )}

          {/* Signal card */}
          {signalData && !signalLoading && (() => {
            const meta = SIGNAL_STATUS_META[signalData.status] ?? SIGNAL_STATUS_META["Wait"];
            const allChecked = signalChecked.size === SIGNAL_CHECKLIST.length;
            return (
              <div
                className="rounded-2xl overflow-hidden"
                style={{ border: `1px solid ${meta.border}`, background: "#0f1117" }}
              >
                {/* ── Card header ── */}
                <div
                  className="px-5 py-3 flex items-center justify-between flex-wrap gap-3"
                  style={{ background: meta.bg, borderBottom: `1px solid ${meta.border}` }}
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: "#5a6075" }}>
                        EDGE Signal Engine
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base" style={{ color: "#e8eaf0" }}>{signalData.ticker}</span>
                        {!signalData.isPlaceholder && signalData.quote.price && (
                          <span className="text-sm font-mono" style={{ color: "#9aa0b4" }}>
                            ${signalData.quote.price.toFixed(2)}
                            <span className="ml-1.5" style={{ color: (signalData.quote.changePercent ?? 0) >= 0 ? "#10b981" : "#ef4444" }}>
                              {(signalData.quote.changePercent ?? 0) >= 0 ? "+" : ""}{(signalData.quote.changePercent ?? 0).toFixed(2)}%
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Status badge */}
                    <div
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full font-bold text-sm"
                      style={{ background: `${meta.dot}15`, color: meta.color, border: `1px solid ${meta.border}` }}
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: meta.dot, boxShadow: `0 0 6px ${meta.dot}` }}
                      />
                      {meta.label}
                    </div>

                    {/* Confidence */}
                    <div className="text-right">
                      <div className="text-xs" style={{ color: "#5a6075" }}>Confidence</div>
                      <div className="font-bold text-sm" style={{ color: meta.color }}>{signalData.confidence}%</div>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <div className="text-xs" style={{ color: "#5a6075" }}>Score</div>
                      <div className="font-bold text-sm font-mono" style={{ color: signalData.score >= 0 ? "#10b981" : "#ef4444" }}>
                        {signalData.score >= 0 ? "+" : ""}{signalData.score}
                      </div>
                    </div>

                    {/* Refresh */}
                    <button
                      onClick={() => {
                        setSignalLoading(true);
                        setSignalData(null);
                        fetch(`/api/signal?ticker=${selectedTicker}`)
                          .then(r => r.json())
                          .then((d: EdgeSignalResponse) => { setSignalData(d); setSignalLoading(false); })
                          .catch(() => { setSignalError("Refresh failed"); setSignalLoading(false); });
                      }}
                      className="text-xs px-2.5 py-1.5 rounded-lg transition-all"
                      style={{ background: "#141720", color: "#5a6075", border: "1px solid #1e2433" }}
                      title="Refresh signal"
                    >
                      ↻
                    </button>
                  </div>
                </div>

                {/* ── Main body ── */}
                <div className="p-5">
                  {/* Placeholder message */}
                  {signalData.isPlaceholder && (
                    <div className="rounded-xl p-4 mb-4" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
                      <p className="text-xs" style={{ color: "#f59e0b" }}>
                        Live signal requires <code>FINNHUB_API_KEY</code> in Netlify environment variables. Add it to see real-time scoring.
                      </p>
                    </div>
                  )}

                  {/* Top grid: reasons + levels */}
                  <div className="grid lg:grid-cols-2 gap-4 mb-4">

                    {/* Why this signal */}
                    <div className="rounded-xl p-4" style={{ background: "#141720", border: "1px solid #1e2433" }}>
                      <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: meta.color }}>
                        Why This Signal Appears
                      </div>
                      <ul className="space-y-1.5">
                        {signalData.reasons.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "#9aa0b4" }}>
                            <span className="flex-shrink-0 mt-0.5" style={{ color: meta.dot }}>▸</span>
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Signal levels */}
                    <div className="rounded-xl p-4" style={{ background: "#141720", border: "1px solid #1e2433" }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#9aa0b4" }}>
                          Signal Levels
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>
                          Educational only
                        </span>
                      </div>

                      {signalData.status === "Wait" || !signalData.entryZone ? (
                        <p className="text-xs" style={{ color: "#5a6075" }}>
                          No level calculations for a Wait signal. Wait for a Bullish Watch or Bearish Warning before mapping levels.
                        </p>
                      ) : (
                        <div className="space-y-2.5">
                          {[
                            { label: "Possible Entry Zone",  value: signalData.entryZone,  color: meta.color },
                            { label: "Stop / Invalidation",  value: signalData.stopLevel,  color: "#ef4444" },
                            { label: "Take-profit Area 1",   value: signalData.target1,    color: "#10b981" },
                            { label: "Take-profit Area 2",   value: signalData.target2,    color: "#10b981" },
                          ].map(({ label, value, color }) => value && (
                            <div key={label} className="flex items-center justify-between">
                              <span className="text-xs" style={{ color: "#5a6075" }}>{label}</span>
                              <span className="text-sm font-bold font-mono" style={{ color }}>{value}</span>
                            </div>
                          ))}
                          <p className="text-xs pt-1" style={{ color: "#3a4060" }}>
                            Levels derived from today&apos;s price structure. Not a recommendation to buy or sell.
                          </p>
                        </div>
                      )}

                      {/* Risk level */}
                      <div className="mt-4 flex items-center gap-2">
                        <span className="text-xs" style={{ color: "#5a6075" }}>Risk Level:</span>
                        <span
                          className="text-xs px-2.5 py-1 rounded-full font-bold"
                          style={{
                            background: `${RISK_COLORS[signalData.riskLevel]}15`,
                            color: RISK_COLORS[signalData.riskLevel],
                            border: `1px solid ${RISK_COLORS[signalData.riskLevel]}35`,
                          }}
                        >
                          {signalData.riskLevel}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Confirms / invalidates */}
                  <div className="grid sm:grid-cols-2 gap-3 mb-4">
                    <div className="rounded-xl p-4" style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.15)" }}>
                      <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#10b981" }}>
                        What Confirms It
                      </div>
                      <ul className="space-y-1.5">
                        {signalData.confirms.map((c, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "#9aa0b4" }}>
                            <span className="flex-shrink-0" style={{ color: "#10b981" }}>✓</span>
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl p-4" style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)" }}>
                      <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#ef4444" }}>
                        What Invalidates It
                      </div>
                      <ul className="space-y-1.5">
                        {signalData.invalidates.map((inv, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "#9aa0b4" }}>
                            <span className="flex-shrink-0" style={{ color: "#ef4444" }}>✗</span>
                            {inv}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Beginner explanation */}
                  <div className="rounded-xl p-4 mb-4" style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)" }}>
                    <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#00d4ff" }}>
                      Beginner Explanation
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "#9aa0b4" }}>
                      {signalData.beginnerExplanation}
                    </p>
                  </div>

                  {/* Pre-trade checklist */}
                  <div className="rounded-xl p-4 mb-4" style={{ background: "#141720", border: "1px solid #1e2433" }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#9aa0b4" }}>
                        Pre-Trade Checklist
                      </div>
                      <span className="text-xs" style={{ color: allChecked ? "#10b981" : "#5a6075" }}>
                        {signalChecked.size}/{SIGNAL_CHECKLIST.length}{allChecked && " — Ready to analyse"}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {SIGNAL_CHECKLIST.map(item => {
                        const checked = signalChecked.has(item.id);
                        return (
                          <button
                            key={item.id}
                            onClick={() => setSignalChecked(prev => {
                              const next = new Set(prev);
                              next.has(item.id) ? next.delete(item.id) : next.add(item.id);
                              return next;
                            })}
                            className="w-full text-left flex items-start gap-3 rounded-lg px-3 py-2 transition-all"
                            style={{
                              background: checked ? "rgba(0,212,255,0.05)" : "transparent",
                              border: `1px solid ${checked ? "rgba(0,212,255,0.15)" : "transparent"}`,
                            }}
                          >
                            <div
                              className="flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center mt-0.5"
                              style={{ borderColor: checked ? "#00d4ff" : "#5a6075", background: checked ? "#00d4ff" : "transparent" }}
                            >
                              {checked && <CheckIcon />}
                            </div>
                            <span className="text-xs" style={{ color: checked ? "#e8eaf0" : "#9aa0b4" }}>
                              {item.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: "#1e2433" }}>
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${(signalChecked.size / SIGNAL_CHECKLIST.length) * 100}%`,
                          background: allChecked ? "#10b981" : "#00d4ff",
                        }}
                      />
                    </div>
                  </div>

                  {/* Recent news */}
                  {signalData.recentNews.length > 0 && (
                    <div className="rounded-xl p-4 mb-4" style={{ background: "#141720", border: "1px solid #1e2433" }}>
                      <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#9aa0b4" }}>
                        Catalyst Check — Recent News
                      </div>
                      <div className="space-y-2.5">
                        {signalData.recentNews.map((item, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-xs flex-shrink-0 px-1.5 py-0.5 rounded mt-0.5" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>
                              news
                            </span>
                            <div>
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-medium leading-snug hover:underline"
                                style={{ color: "#e8eaf0" }}
                              >
                                {item.headline}
                              </a>
                              <div className="text-xs mt-0.5" style={{ color: "#5a6075" }}>
                                {item.source} · {new Date(item.datetime).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Risk warning + disclaimer */}
                  <div className="rounded-xl p-3" style={{ background: "rgba(90,96,117,0.06)", border: "1px solid rgba(90,96,117,0.2)" }}>
                    <p className="text-xs leading-relaxed" style={{ color: "#5a6075" }}>
                      <strong style={{ color: "#9aa0b4" }}>⚠️ {signalData.riskWarning}</strong>
                    </p>
                    <p className="text-xs mt-1.5" style={{ color: "#3a4060" }}>
                      {signalData.disclaimer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 3 — CHART READING GUIDE
        ════════════════════════════════════════════════════════════════════ */}
        <div className="grid lg:grid-cols-2 gap-4 mb-8">

          {/* Left: What to Read checklist */}
          <div
            className="rounded-2xl p-5"
            style={{ background: "#0f1117", border: "1px solid #1e2433" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#00d4ff" }}>
                What to Read on This Chart
              </div>
              <span className="text-xs" style={{ color: "#5a6075" }}>
                {chartReadProgress}/{CHART_READING_ITEMS.length} checked
              </span>
            </div>

            <div className="space-y-1.5">
              {CHART_READING_ITEMS.map(item => {
                const checked = chartChecked.has(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleChartCheck(item.id)}
                    className="w-full text-left rounded-xl px-3 py-2.5 transition-all"
                    style={{
                      background: checked ? "rgba(0,212,255,0.05)" : "#141720",
                      border:     checked ? "1px solid rgba(0,212,255,0.2)" : "1px solid #1e2433",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                        style={{
                          borderColor: checked ? "#00d4ff" : "#5a6075",
                          background:  checked ? "#00d4ff" : "transparent",
                        }}
                      >
                        {checked && <CheckIcon />}
                      </div>
                      <div>
                        <div className="text-xs font-semibold mb-0.5" style={{ color: checked ? "#00d4ff" : "#e8eaf0" }}>
                          {item.label}
                        </div>
                        <div className="text-xs leading-snug" style={{ color: "#5a6075" }}>
                          {item.desc}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Progress bar */}
            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "#1e2433" }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width:      `${(chartReadProgress / CHART_READING_ITEMS.length) * 100}%`,
                    background: chartReadProgress === CHART_READING_ITEMS.length ? "#10b981" : "#00d4ff",
                  }}
                />
              </div>
              <span className="text-xs font-medium" style={{ color: chartReadProgress === CHART_READING_ITEMS.length ? "#10b981" : "#5a6075" }}>
                {chartReadProgress === CHART_READING_ITEMS.length ? "Chart fully read ✓" : "Tick off as you read"}
              </span>
            </div>
          </div>

          {/* Right: candle explanation + AI planned */}
          <div className="flex flex-col gap-4">

            {/* Candle explanation */}
            <div
              className="rounded-2xl p-5 flex-1"
              style={{ background: "#0f1117", border: "1px solid #1e2433" }}
            >
              <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#f59e0b" }}>
                How to Read a Candle
              </div>
              <p className="text-sm leading-relaxed mb-4" style={{ color: "#9aa0b4" }}>
                Candles show where price opened, closed, pushed up, pushed down, and where buyers/sellers rejected price.
                The body is the open-to-close range. The wicks show the full high-to-low range.
              </p>

              {/* Visual candle legend */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {/* Bullish */}
                <div className="rounded-xl p-3 text-center" style={{ background: "#141720", border: "1px solid rgba(16,185,129,0.2)" }}>
                  <div className="flex flex-col items-center gap-0 mb-2">
                    <div className="w-px h-4" style={{ background: "#10b981" }} />
                    <div className="w-4 h-7 rounded-sm" style={{ background: "rgba(16,185,129,0.3)", border: "1px solid #10b981" }} />
                    <div className="w-px h-3" style={{ background: "#10b981" }} />
                  </div>
                  <div className="text-xs font-semibold" style={{ color: "#10b981" }}>Bullish</div>
                  <div className="text-xs mt-0.5" style={{ color: "#5a6075" }}>Close &gt; Open</div>
                </div>
                {/* Bearish */}
                <div className="rounded-xl p-3 text-center" style={{ background: "#141720", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <div className="flex flex-col items-center gap-0 mb-2">
                    <div className="w-px h-3" style={{ background: "#ef4444" }} />
                    <div className="w-4 h-7 rounded-sm" style={{ background: "rgba(239,68,68,0.25)", border: "1px solid #ef4444" }} />
                    <div className="w-px h-4" style={{ background: "#ef4444" }} />
                  </div>
                  <div className="text-xs font-semibold" style={{ color: "#ef4444" }}>Bearish</div>
                  <div className="text-xs mt-0.5" style={{ color: "#5a6075" }}>Close &lt; Open</div>
                </div>
                {/* Rejection / doji */}
                <div className="rounded-xl p-3 text-center" style={{ background: "#141720", border: "1px solid rgba(245,158,11,0.2)" }}>
                  <div className="flex flex-col items-center gap-0 mb-2">
                    <div className="w-px h-6" style={{ background: "#f59e0b" }} />
                    <div className="w-4 h-2 rounded-sm" style={{ background: "rgba(245,158,11,0.3)", border: "1px solid #f59e0b" }} />
                    <div className="w-px h-6" style={{ background: "#f59e0b" }} />
                  </div>
                  <div className="text-xs font-semibold" style={{ color: "#f59e0b" }}>Rejection</div>
                  <div className="text-xs mt-0.5" style={{ color: "#5a6075" }}>Long wick = fight</div>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  { icon: "↑", color: "#10b981", text: "Big green body, tiny wicks — buyers in full control" },
                  { icon: "↓", color: "#ef4444", text: "Big red body, tiny wicks — sellers in full control" },
                  { icon: "↕", color: "#f59e0b", text: "Long wick, small body — price tried, got rejected" },
                  { icon: "—", color: "#9aa0b4", text: "Doji (open ≈ close) — neither side won yet" },
                ].map((rule, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <span className="font-bold w-4 text-center flex-shrink-0" style={{ color: rule.color }}>{rule.icon}</span>
                    <span style={{ color: "#9aa0b4" }}>{rule.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Chart Reading — Planned */}
            <div
              className="rounded-2xl p-5"
              style={{ background: "rgba(139,92,246,0.04)", border: "1px solid rgba(139,92,246,0.2)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="text-xs px-2 py-0.5 rounded font-bold"
                  style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}
                >
                  PLANNED
                </span>
                <span className="text-sm font-semibold" style={{ color: "#a855f7" }}>AI Chart Reading</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "#5a6075" }}>
                AI is not currently reading the chart. A future version will identify support/resistance, candle patterns, VWAP position, and trend strength — all clearly labeled as educational analysis, not buy/sell signals. Use the checklist above for now.
              </p>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 3 — SESSION TIMELINE (secondary)
        ════════════════════════════════════════════════════════════════════ */}
        <div
          className="rounded-2xl p-4 mb-8"
          style={{ background: "#0f1117", border: "1px solid #1e2433" }}
        >
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#5a6075" }}>
              24H Session Timeline
            </div>
            {nextSession && (
              <div className="text-xs" style={{ color: "#9aa0b4" }}>
                Next:{" "}
                <span style={{ color: nextSession.win.color }}>{nextSession.win.label}</span>{" "}
                in <span className="font-semibold" style={{ color: "#e8eaf0" }}>{formatCountdown(nextSession.minutesUntil)}</span>
              </div>
            )}
          </div>

          {/* Timeline bar */}
          <div
            className="relative rounded-full overflow-hidden mb-2"
            style={{ height: "22px", background: "#141720", border: "1px solid #1e2433" }}
          >
            {SESSION_WINDOWS.filter(w => w.key !== "overlap").map(win => {
              const startPct = (minutesOfDay(win.startH, win.startM) / dayMins) * 100;
              const widthPct = ((minutesOfDay(win.endH, win.endM) - minutesOfDay(win.startH, win.startM)) / dayMins) * 100;
              return (
                <div
                  key={win.key}
                  className="absolute top-0 bottom-0 flex items-center justify-center"
                  style={{
                    left: `${startPct}%`, width: `${widthPct}%`,
                    background: `${win.color}20`,
                    borderLeft: `2px solid ${win.color}50`,
                    borderRight: `2px solid ${win.color}50`,
                  }}
                >
                  <span className="text-xs font-semibold hidden sm:block" style={{ color: win.color, fontSize: "9px" }}>{win.label}</span>
                </div>
              );
            })}
            {(() => {
              const ov = SESSION_WINDOWS.find(w => w.key === "overlap")!;
              const startPct = (minutesOfDay(ov.startH, ov.startM) / dayMins) * 100;
              const widthPct = ((minutesOfDay(ov.endH, ov.endM) - minutesOfDay(ov.startH, ov.startM)) / dayMins) * 100;
              return (
                <div
                  className="absolute top-0 bottom-0 pointer-events-none"
                  style={{
                    left: `${startPct}%`, width: `${widthPct}%`,
                    background: "rgba(239,68,68,0.2)",
                    borderLeft: "2px solid rgba(239,68,68,0.6)",
                    borderRight: "2px solid rgba(239,68,68,0.6)",
                  }}
                />
              );
            })()}
            <div
              className="absolute top-0 bottom-0 w-0.5"
              style={{ left: `${timelinePercent}%`, background: "#fff", boxShadow: "0 0 6px rgba(255,255,255,0.8)", zIndex: 10 }}
            />
          </div>
          <div className="flex justify-between">
            {[0, 4, 8, 12, 16, 20, 24].map(h => (
              <span key={h} style={{ color: "#5a6075", fontSize: "9px" }}>{pad2(h % 24)}:00</span>
            ))}
          </div>

          {/* Session status pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
            {SESSION_WINDOWS.filter(w => w.key !== "overlap").map(win => {
              const isActive = activeSessions.some(a => a.key === win.key);
              return (
                <div
                  key={win.key}
                  className="rounded-lg px-3 py-2"
                  style={{
                    background: isActive ? `${win.color}10` : "#141720",
                    border: `1px solid ${isActive ? win.color + "30" : "#1e2433"}`,
                  }}
                >
                  <div className="text-xs font-semibold flex items-center gap-1.5" style={{ color: isActive ? win.color : "#9aa0b4" }}>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: win.color }} />}
                    {win.label}
                  </div>
                  <div style={{ fontSize: "10px", color: "#3a4060", marginTop: "2px" }}>
                    {pad2(win.startH)}:{pad2(win.startM)}–{pad2(win.endH)}:{pad2(win.endM)} UTC
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 4 — SESSION PLAYBOOK
        ════════════════════════════════════════════════════════════════════ */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4" style={{ color: "#e8eaf0" }}>
            Session <span style={{ color: "#00d4ff" }}>Playbook</span>
          </h2>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-5">
            {SESSIONS.map(s => (
              <button
                key={s.key}
                onClick={() => setActiveSession(s.key)}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150"
                style={{
                  background: activeSession === s.key ? `${s.color}18` : "#0f1117",
                  color:      activeSession === s.key ? s.color : "#9aa0b4",
                  border:     `1px solid ${activeSession === s.key ? s.color + "50" : "#1e2433"}`,
                  boxShadow:  activeSession === s.key ? `0 0 16px ${s.color}15` : "none",
                }}
              >
                {s.icon} {s.label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {/* Overview */}
            <div className="rounded-2xl p-5" style={{ background: "#0f1117", border: `1px solid ${activeTab.color}30` }}>
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: activeTab.color }}>
                    {activeTab.icon} {activeTab.label} Session Overview
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "#9aa0b4" }}>{activeTab.overview}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Hours (UTC)", value: activeTab.hours },
                    { label: "Key Markets", value: activeTab.keyMarkets },
                    { label: "Volatility", value: activeTab.volatility, valueColor: VOLATILITY_COLORS[activeTab.volatility] },
                    { label: "Instruments", value: activeTab.keyMarkets },
                  ].map((stat, i) => (
                    <div key={i} className="rounded-xl p-3" style={{ background: "#141720", border: "1px solid #1e2433" }}>
                      <div className="text-xs mb-1" style={{ color: "#5a6075" }}>{stat.label}</div>
                      <div className="text-xs font-semibold leading-snug" style={{ color: stat.valueColor ?? "#e8eaf0" }}>{stat.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Key Behaviors */}
            <div className="rounded-2xl p-5" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
              <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#00d4ff" }}>Key Behaviors</div>
              <ul className="space-y-2">
                {activeTab.behaviors.map((b, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5" style={{ background: activeTab.color }} />
                    <span className="text-sm" style={{ color: "#9aa0b4" }}>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Liquidity */}
            <div className="rounded-2xl p-5" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
              <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#f59e0b" }}>Liquidity Characteristics</div>
              <p className="text-sm leading-relaxed" style={{ color: "#9aa0b4" }}>{activeTab.liquidity}</p>
            </div>

            {/* Pre-session checklist */}
            <div className="rounded-2xl p-5" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
              <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#10b981" }}>Trader Pre-Session Checklist</div>
              <div className="space-y-2">
                {activeTab.checklist.map((item, i) => {
                  const checked = (sessionChecked[activeTab.key] ?? new Set<string>()).has(item);
                  return (
                    <button
                      key={i}
                      onClick={() => toggleSessionCheck(activeTab.key, item)}
                      className="w-full flex items-start gap-3 text-left rounded-xl px-3 py-2.5 transition-all"
                      style={{
                        background: checked ? "rgba(16,185,129,0.06)" : "#141720",
                        border: `1px solid ${checked ? "rgba(16,185,129,0.25)" : "#1e2433"}`,
                      }}
                    >
                      <div
                        className="flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center mt-0.5"
                        style={{ borderColor: checked ? "#10b981" : "#5a6075", background: checked ? "#10b981" : "transparent" }}
                      >
                        {checked && <CheckIcon />}
                      </div>
                      <span className="text-sm" style={{ color: checked ? "#e8eaf0" : "#9aa0b4", textDecoration: checked ? "line-through" : "none" }}>
                        {item}
                      </span>
                    </button>
                  );
                })}
              </div>
              {(() => {
                const done  = (sessionChecked[activeTab.key] ?? new Set()).size;
                const total = activeTab.checklist.length;
                return (
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#1e2433" }}>
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${(done / total) * 100}%`, background: done === total ? "#10b981" : activeTab.color }}
                      />
                    </div>
                    <span className="text-xs font-medium" style={{ color: done === total ? "#10b981" : "#9aa0b4" }}>
                      {done}/{total}{done === total && " — Ready"}
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Setups */}
            <div className="rounded-2xl p-5" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
              <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#8b5cf6" }}>Common Setups</div>
              <div className="space-y-2">
                {activeTab.setups.map((setup, i) => {
                  const setupId = `${activeTab.key}-${i}`;
                  const isOpen  = expandedSetup === setupId;
                  return (
                    <div key={i} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${isOpen ? activeTab.color + "40" : "#1e2433"}` }}>
                      <button
                        onClick={() => setExpandedSetup(isOpen ? null : setupId)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left transition-all"
                        style={{ background: isOpen ? `${activeTab.color}0a` : "#141720" }}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: `${activeTab.color}20`, color: activeTab.color }}
                          >{i + 1}</span>
                          <span className="text-sm font-semibold" style={{ color: "#e8eaf0" }}>{setup.name}</span>
                        </div>
                        <span style={{ color: "#5a6075" }}>{isOpen ? "▲" : "▼"}</span>
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 pt-2 border-t" style={{ borderColor: "#1e2433", background: "#0f1117" }}>
                          <p className="text-sm leading-relaxed" style={{ color: "#9aa0b4" }}>{setup.description}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 5 — AI WAR ROOM SETUP GRADER
        ════════════════════════════════════════════════════════════════════ */}
        <div>
          <h2 className="text-xl font-bold mb-1" style={{ color: "#e8eaf0" }}>
            ⚡ Analyze Setup — <span style={{ color: "#ef4444" }}>AI War Room</span>
          </h2>
          <p className="text-xs mb-5" style={{ color: "#5a6075" }}>
            Educational setup grading only — not financial advice. AI grades your setup A+/A/B/C/NO TRADE.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="rounded-2xl p-5 mb-4" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* Session */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#9aa0b4" }}>Session *</label>
                  <select
                    value={form.session}
                    onChange={e => setForm(f => ({ ...f, session: e.target.value, setupType: "" }))}
                    className="w-full rounded-xl px-3 py-2.5 text-sm"
                    style={{ background: "#141720", border: "1px solid #1e2433", color: form.session ? "#e8eaf0" : "#5a6075" }}
                  >
                    <option value="">Select session…</option>
                    {SESSIONS.map(s => (
                      <option key={s.key} value={s.key}>{s.icon} {s.label} ({s.hours})</option>
                    ))}
                  </select>
                </div>

                {/* Market */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#9aa0b4" }}>Market / Ticker *</label>
                  <input
                    type="text" placeholder="e.g. SPY, EUR/USD"
                    value={form.market}
                    onChange={e => setForm(f => ({ ...f, market: e.target.value }))}
                    className="w-full rounded-xl px-3 py-2.5 text-sm"
                    style={{ background: "#141720", border: "1px solid #1e2433", color: "#e8eaf0" }}
                  />
                </div>

                {/* Direction */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#9aa0b4" }}>Direction *</label>
                  <div className="flex gap-2">
                    {(["Long", "Short"] as const).map(dir => (
                      <button
                        key={dir} type="button"
                        onClick={() => setForm(f => ({ ...f, direction: dir }))}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                        style={{
                          background: form.direction === dir ? (dir === "Long" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)") : "#141720",
                          color:      form.direction === dir ? (dir === "Long" ? "#10b981" : "#ef4444") : "#9aa0b4",
                          border:     `1px solid ${form.direction === dir ? (dir === "Long" ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)") : "#1e2433"}`,
                        }}
                      >
                        {dir === "Long" ? "▲ Long" : "▼ Short"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Setup Type */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#9aa0b4" }}>Setup Type *</label>
                  <select
                    value={form.setupType}
                    onChange={e => setForm(f => ({ ...f, setupType: e.target.value }))}
                    disabled={selectedSessionSetups.length === 0}
                    className="w-full rounded-xl px-3 py-2.5 text-sm"
                    style={{ background: "#141720", border: "1px solid #1e2433", color: form.setupType ? "#e8eaf0" : "#5a6075" }}
                  >
                    <option value="">{selectedSessionSetups.length === 0 ? "Select a session first" : "Select setup…"}</option>
                    {selectedSessionSetups.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                  </select>
                </div>

                {/* Liquidity Location */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#9aa0b4" }}>Liquidity Location *</label>
                  <select
                    value={form.liquidityLocation}
                    onChange={e => setForm(f => ({ ...f, liquidityLocation: e.target.value }))}
                    className="w-full rounded-xl px-3 py-2.5 text-sm"
                    style={{ background: "#141720", border: "1px solid #1e2433", color: form.liquidityLocation ? "#e8eaf0" : "#5a6075" }}
                  >
                    <option value="">Select location…</option>
                    {["Above equal highs (BSL)", "Below equal lows (SSL)", "At HTF resistance", "At HTF support", "At VWAP", "At opening range", "Clean air / no key level"].map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* HTF Trend */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#9aa0b4" }}>HTF Trend *</label>
                  <select
                    value={form.htfTrend}
                    onChange={e => setForm(f => ({ ...f, htfTrend: e.target.value }))}
                    className="w-full rounded-xl px-3 py-2.5 text-sm"
                    style={{ background: "#141720", border: "1px solid #1e2433", color: form.htfTrend ? "#e8eaf0" : "#5a6075" }}
                  >
                    <option value="">Select trend…</option>
                    {["Strongly Bullish — daily uptrend", "Mildly Bullish — above 20EMA", "Ranging / No trend", "Mildly Bearish — below 20EMA", "Strongly Bearish — daily downtrend"].map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* Catalyst */}
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#9aa0b4" }}>Catalyst (optional)</label>
                  <input
                    type="text" placeholder="e.g. CPI beat, FOMC decision, breakout from weekly range"
                    value={form.catalyst}
                    onChange={e => setForm(f => ({ ...f, catalyst: e.target.value }))}
                    className="w-full rounded-xl px-3 py-2.5 text-sm"
                    style={{ background: "#141720", border: "1px solid #1e2433", color: "#e8eaf0" }}
                  />
                </div>

                {/* Prices */}
                {[
                  { key: "entryPrice",  label: "Entry Price *",  placeholder: "e.g. 525.50" },
                  { key: "stopPrice",   label: "Stop Price *",   placeholder: "e.g. 521.00" },
                  { key: "targetPrice", label: "Target Price *", placeholder: "e.g. 535.00" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "#9aa0b4" }}>{label}</label>
                    <input
                      type="number" step="0.01" placeholder={placeholder}
                      value={form[key as keyof AnalyzeForm]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full rounded-xl px-3 py-2.5 text-sm"
                      style={{ background: "#141720", border: "1px solid #1e2433", color: "#e8eaf0" }}
                    />
                  </div>
                ))}

                {/* Risk % */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#9aa0b4" }}>Risk % of Account *</label>
                  <input
                    type="number" step="0.1" min="0.1" max="10"
                    value={form.riskPercent}
                    onChange={e => setForm(f => ({ ...f, riskPercent: e.target.value }))}
                    className="w-full rounded-xl px-3 py-2.5 text-sm"
                    style={{ background: "#141720", border: "1px solid #1e2433", color: "#e8eaf0" }}
                  />
                </div>

                {/* Live R:R */}
                <div className="flex items-end">
                  <div className="w-full rounded-xl px-3 py-2.5" style={{ background: "#141720", border: "1px solid #1e2433" }}>
                    <div className="text-xs mb-0.5" style={{ color: "#5a6075" }}>Live R:R Ratio</div>
                    <div
                      className="text-lg font-bold font-mono"
                      style={{ color: rrCalc === null ? "#5a6075" : parseFloat(rrCalc) >= 2 ? "#10b981" : parseFloat(rrCalc) >= 1.5 ? "#f59e0b" : "#ef4444" }}
                    >
                      {rrCalc === null ? "—" : `1 : ${rrCalc}`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="mt-5 flex justify-end">
                <button
                  type="submit"
                  disabled={!formValid || aiLoading}
                  className="px-6 py-3 rounded-xl font-semibold text-sm transition-all"
                  style={{
                    background: !formValid || aiLoading ? "#1e2433" : "linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.1))",
                    color:      !formValid || aiLoading ? "#5a6075" : "#ef4444",
                    border:     `1px solid ${!formValid || aiLoading ? "#1e2433" : "rgba(239,68,68,0.4)"}`,
                    cursor:     !formValid || aiLoading ? "not-allowed" : "pointer",
                    boxShadow:  !formValid || aiLoading ? "none" : "0 0 20px rgba(239,68,68,0.1)",
                  }}
                >
                  {aiLoading ? "Analyzing…" : "⚡ Analyze Setup"}
                </button>
              </div>
            </div>
          </form>

          {/* Loading */}
          {aiLoading && (
            <div className="rounded-2xl p-6 text-center" style={{ background: "#0f1117", border: "1px solid rgba(239,68,68,0.2)" }}>
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#ef4444" }} />
                <span className="text-sm font-semibold" style={{ color: "#ef4444" }}>AI War Room analyzing…</span>
              </div>
              <p className="text-xs" style={{ color: "#5a6075" }}>Reviewing confluences, risk/reward, and session context.</p>
            </div>
          )}

          {/* Error */}
          {aiError && !aiLoading && (
            <div className="rounded-2xl p-5" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <p className="text-sm font-semibold mb-1" style={{ color: "#ef4444" }}>Analysis Failed</p>
              <p className="text-sm" style={{ color: "#9aa0b4" }}>{aiError}</p>
            </div>
          )}

          {/* Result */}
          {aiResult && !aiLoading && (
            <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${GRADE_COLORS[aiResult.grade]?.color ?? "#1e2433"}40` }}>
              <div
                className="px-5 py-4 flex items-center gap-4"
                style={{ background: GRADE_COLORS[aiResult.grade]?.bg ?? "#0f1117", borderBottom: "1px solid #1e2433" }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl flex-shrink-0"
                  style={{
                    background: `${GRADE_COLORS[aiResult.grade]?.color ?? "#5a6075"}20`,
                    color:       GRADE_COLORS[aiResult.grade]?.color ?? "#5a6075",
                    border:      `2px solid ${GRADE_COLORS[aiResult.grade]?.color ?? "#5a6075"}50`,
                  }}
                >
                  {aiResult.grade}
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: GRADE_COLORS[aiResult.grade]?.color ?? "#5a6075" }}>
                    Setup Grade
                  </div>
                  <p className="text-sm" style={{ color: "#e8eaf0" }}>{aiResult.gradeReasoning}</p>
                </div>
              </div>

              <div className="p-5 space-y-4" style={{ background: "#0f1117" }}>
                {[
                  { title: "Confluence Analysis",       color: "#00d4ff", text: aiResult.confluenceAnalysis },
                  { title: "Risk Assessment",           color: "#f59e0b", text: aiResult.riskAssessment },
                  { title: "What Could Go Wrong",       color: "#ef4444", text: aiResult.whatCouldGoWrong },
                ].map(({ title, color, text }) => (
                  <div key={title} className="rounded-xl p-4" style={{ background: "#141720", border: "1px solid #1e2433" }}>
                    <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color }}>{title}</div>
                    <p className="text-sm leading-relaxed" style={{ color: "#9aa0b4" }}>{text}</p>
                  </div>
                ))}
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: `${GRADE_COLORS[aiResult.grade]?.color ?? "#5a6075"}08`,
                    border:     `1px solid ${GRADE_COLORS[aiResult.grade]?.color ?? "#5a6075"}25`,
                  }}
                >
                  <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: GRADE_COLORS[aiResult.grade]?.color ?? "#5a6075" }}>
                    Final Educational Decision
                  </div>
                  <p className="text-sm font-medium" style={{ color: "#e8eaf0" }}>{aiResult.finalDecision}</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: "rgba(90,96,117,0.08)", border: "1px solid rgba(90,96,117,0.2)" }}>
                  <p className="text-xs" style={{ color: "#5a6075" }}>⚠️ {aiResult.disclaimer}</p>
                </div>
              </div>
            </div>
          )}

          <p className="text-center text-xs mt-6" style={{ color: "#5a6075" }}>
            Educational research only · Not financial advice · No guaranteed returns · Always paper trade first
          </p>
        </div>
      </div>
    </div>
  );
}

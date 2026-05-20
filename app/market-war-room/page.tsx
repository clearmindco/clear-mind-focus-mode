"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Navbar from "@/components/Navbar";

// ─── TypeScript interfaces ─────────────────────────────────────────────────────

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
      "The Asian session is the 'accumulation' window of the global trading day. Tokyo, Sydney, and Singapore drive thin, range-bound price action that sets the structural levels London and New York will later target for liquidity runs.",
    behaviors: [
      "Consolidation and range formation — the 'accumulation' session",
      "Price often coils between equal highs and equal lows (SSL/BSL targets)",
      "BOJ policy news and Japanese economic data can spike volatility",
      "Asian Range becomes the target for London sweep plays",
      "Institutions build positions quietly — watch for absorption at extremes",
    ],
    liquidity:
      "Thin order books create higher slippage. Smart money uses this session to build positions at range extremes, often creating 'liquidity pools' (equal highs/lows) that London will later sweep for stop runs. Look for consolidation near key levels from the prior New York session close.",
    checklist: [
      "Mark the Asian session high and low (these are your key levels)",
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
          "Price builds a clean, tight range during Asian hours. A break with momentum and volume above/below the range signals continuation. Entry: break + retest of range high/low. Stop: behind range midpoint. Target: 1.5–2× the range height. Confirmation: strong close outside range on 15m TF.",
      },
      {
        name: "Asia Fakeout Reversal",
        description:
          "Price sweeps just above the Asian high or below the Asian low — liquidity grab — then immediately reverses back inside the range. This is a stop-hunt. Entry: when candle closes back inside range. Stop: beyond the sweep wick (very tight). Target: opposite extreme of Asian range. This is a higher-probability play than the breakout because it traps late breakout buyers/sellers.",
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
      "London is the world's largest forex trading center. The session opens with aggressive institutional order flow that targets liquidity built up overnight during the Asian session. The first hour (07:00–08:00 UTC) is the 'killzone' — highest probability for institutional setups.",
    behaviors: [
      "London opens with a sweep of Asian session highs or lows — this is intentional stop hunting",
      "The first 1 hour (07:00–08:00 UTC) is the 'killzone' — highest probability setups form here",
      "European economic data releases (CPI, PMI, ECB) drive directional moves",
      "DXY (Dollar Index) direction often dictates EUR/GBP direction for the day",
      "The London close (15:00–16:00 UTC) often reverses the London trend as positions are squared",
    ],
    liquidity:
      "London is the deepest forex liquidity pool in the world. Institutional order flow is at its highest. Price targets liquidity pools established overnight in the Asian session — equal highs/lows, previous day high/low, and key session opening prices. The 'London sweep' is one of the most reliable institutional concepts: price runs stops on one side, then reverses violently in the opposite direction.",
    checklist: [
      "Mark Asian session H/L before London opens",
      "Identify the prior week high and low",
      "Check major EU data at open (08:30 CET = 07:30 UTC)",
      "Note the daily bias from HTF (4H, Daily) before trading",
      "Wait for a clear sweep of Asian H or L before considering a reversal entry",
      "Avoid trading the London open the first 15 minutes — wait for structure to form",
    ],
    setups: [
      {
        name: "London Sweep Reversal",
        description:
          "London opens and sweeps below the Asian session low (or above the high) to grab stops. Then price immediately reverses. This is the highest-probability London setup. Entry: market structure shift (MSS) — a break of the most recent swing high (for longs) after the sweep. Stop: below the sweep low. Target: prior day high or key higher TF level. Confluences: Fibonacci OTE (0.618–0.786) retracement entry zone.",
      },
      {
        name: "London Continuation",
        description:
          "When the HTF trend is strongly aligned (bullish on daily), London breaks above the Asian range and continues directly. Entry: pullback to the broken Asian range high, now acting as support. Stop: below the Asian range high (converted from resistance). Target: next major HTF resistance level. Works best when DXY is trending opposite (falling for EUR/GBP longs).",
      },
      {
        name: "London Killzone Breakout",
        description:
          "Between 07:00–08:00 UTC, price builds compression then breaks with force. Entry: break of the compression range with volume confirmation. Stop: back inside the range. Target: 2× the pre-breakout range height. Note: avoid this setup if a major economic release is due within 30 minutes — news can reverse the move.",
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
      "Lunch hour (12:00–14:00 ET / 16:00–18:00 UTC) — low volume, choppy, avoid trading",
      "Power Hour (15:00–16:00 ET / 19:00–20:00 UTC) — institutional rebalancing, strong directional moves",
    ],
    liquidity:
      "US equity markets see massive institutional participation at open. Market makers set opening range (first 5–30 minutes) as the key reference. VWAP anchors institutional cost basis for the day. Divergences from VWAP are mean-reversion opportunities. High-frequency trading (HFT) dominates the first and last 30 minutes — spreads are wide, moves are fast.",
    checklist: [
      "Check pre-market futures direction (ES, NQ) before open",
      "Note key pre-market levels: pre-market high/low, overnight high/low",
      "Mark prior day's closing VWAP if possible",
      "Identify the opening range (first 15 minutes of regular trading)",
      "Check Fed speakers, economic data (CPI, NFP, FOMC) for the day",
      "Note if SPY/QQQ is above or below 20EMA on daily chart",
    ],
    setups: [
      {
        name: "NY Open Reversal",
        description:
          "The most powerful US equity setup. Pre-market sets a directional move that reverses at or just after the open. Price spikes up (or down) at 09:30, makes new pre-market high (or low), then violently reverses. Entry: after clear reversal candle pattern (engulf, pin bar) on 1m or 5m. Stop: above the spike high. Target: prior day close or VWAP. Context: works best when the pre-market move is exhausted and volume starts dropping.",
      },
      {
        name: "Opening Range Breakout (ORB)",
        description:
          "Mark the high and low of the first 15 minutes (or first 30 minutes for more conservative traders). When price breaks above the high with increasing volume, go long. When price breaks below the low, go short. Entry: confirmed close above/below the range. Stop: back inside the opening range. Target: 1–2× the range height above/below the breakout. Filter: only trade ORB in the direction of the pre-market trend and daily HTF trend.",
      },
      {
        name: "VWAP Reclaim",
        description:
          "Price is trading below VWAP (bearish), then makes a sustained reclaim — closes above VWAP on multiple candles, retests VWAP from above, holds as support. This signals a momentum shift from institutional sellers to buyers. Entry: retest of VWAP from above. Stop: close back below VWAP. Target: prior session high or next key resistance. Best used in the first 2 hours of the session.",
      },
      {
        name: "Lunch Fade",
        description:
          "Between 12:00–14:00 ET (16:00–18:00 UTC), volume collapses. The morning trend often stalls, and price fades back toward VWAP. If the morning was a strong up move, fade toward VWAP in the lunch period. Entry: when the rally stalls (lower highs forming) and volume drops. Stop: above the morning high. Target: VWAP. Warning: Do not fight a powerful trend — only fade in choppy, range-bound days.",
      },
      {
        name: "Power Hour Momentum",
        description:
          "The last 60 minutes (15:00–16:00 ET / 19:00–20:00 UTC) sees institutional rebalancing, index fund adjustments, and options dealers hedging. Price often makes the day's final directional push. Entry: align with the dominant daily trend, enter on a pullback during the first few minutes of Power Hour. Stop: below the Power Hour pivot low. Target: test of daily high/low. Note: momentum can be extreme — position sizing matters more than ever here.",
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
      "The London/NY Overlap is the single highest-liquidity window of the entire global trading day. Both of the world's largest financial centers are simultaneously active, creating maximum institutional participation and the most explosive price action of the session.",
    behaviors: [
      "The Overlap is the single highest-liquidity window of the entire trading day",
      "Two of the world's largest financial centers are simultaneously active",
      "Divergences between London and NY desks create powerful two-sided price action",
      "Key economic events (FOMC, NFP, CPI) often scheduled during or just before the Overlap",
      "Best A+ setups occur here — also highest risk of violent reversals",
    ],
    liquidity:
      "Maximum institutional participation. London desks are closing positions from the morning session while NY desks are opening new positions for the afternoon. This creates a natural tug-of-war that often results in sharp, decisive moves. Stop hunts and liquidity grabs are most aggressive in this window. This is where the day's true direction is often decided.",
    checklist: [
      "Be aware of any major economic events scheduled for 14:00 ET (18:00 UTC)",
      "Look for confluence between London trend and NY pre-market trend",
      "Mark London session high/low before the Overlap begins",
      "Note where VWAP is relative to current price",
      "Only take setups with at least 3 confluences during the Overlap — volatility is unforgiving",
      "Have hard stops — do not widen stops during Overlap volatility",
    ],
    setups: [
      {
        name: "Overlap Continuation",
        description:
          "If London had a clear trend (e.g., GBP/USD grinding higher all morning), the NY open often tests a key level, sweeps stops, then continues in London's direction. Entry: after the NY open sweep reversal, align with London trend. This is combining the NY Open Reversal setup with London Continuation — maximum confluence.",
      },
      {
        name: "Overlap Reversal",
        description:
          "London trend exhausts at a key HTF level (daily resistance). NY open creates a false break above that level (stop hunt), then reverses sharply in the opposite direction. This is a full session reversal. Entry: after the false break and return inside the level. Stop: above the false break high. Target: back to the London session open price, then further.",
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
  { key: "asian", label: "Asian", color: "#f59e0b", startH: 0, startM: 0, endH: 8, endM: 0 },
  { key: "london", label: "London", color: "#8b5cf6", startH: 7, startM: 0, endH: 16, endM: 0 },
  { key: "ny", label: "New York", color: "#10b981", startH: 13, startM: 30, endH: 20, endM: 0 },
  { key: "overlap", label: "Overlap", color: "#ef4444", startH: 13, startM: 30, endH: 16, endM: 0 },
];

function minutesOfDay(h: number, m: number): number {
  return h * 60 + m;
}

function isSessionActive(win: SessionWindow, nowMinutes: number): boolean {
  const start = minutesOfDay(win.startH, win.startM);
  const end = minutesOfDay(win.endH, win.endM);
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
    if (!best || diff < best.minutesUntil) {
      best = { win, minutesUntil: diff };
    }
  }
  return best;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function formatCountdown(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ─── Volatility color ──────────────────────────────────────────────────────────

const VOLATILITY_COLORS: Record<string, string> = {
  Low: "#10b981",
  "Low–Medium": "#f59e0b",
  Medium: "#f59e0b",
  High: "#ef4444",
  "Very High": "#ef4444",
};

// ─── Grade colors ──────────────────────────────────────────────────────────────

const GRADE_COLORS: Record<string, { color: string; bg: string }> = {
  "A+": { color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  A: { color: "#10b981", bg: "rgba(16,185,129,0.08)" },
  B: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  C: { color: "#f97316", bg: "rgba(249,115,22,0.1)" },
  "NO TRADE": { color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
};

// ─── Overlay presets reference ────────────────────────────────────────────────

const OVERLAY_PRESETS = [
  {
    label: "VWAP",
    color: "#00d4ff",
    instruction: "Already loaded as default study. Appears as a blue line anchored to the session open.",
  },
  {
    label: "Session Background",
    color: "#8b5cf6",
    instruction: "Settings → Background Sessions (if available) or add via the Sessions drawing tool in the chart toolbar.",
  },
  {
    label: "Opening Range",
    color: "#f59e0b",
    instruction: "Use the Rectangle drawing tool. Mark the high and low of the first 15-minute candle after market open.",
  },
  {
    label: "Session H/L Lines",
    color: "#10b981",
    instruction: "Use Horizontal Line tool. Draw lines at prior session highs and lows — these are your key liquidity targets.",
  },
];

// ─── Main component ────────────────────────────────────────────────────────────

export default function MarketWarRoom() {
  const [currentUtcTime, setCurrentUtcTime] = useState<Date>(new Date());
  const [activeSession, setActiveSession] = useState<string>("asian");
  const [checkedItems, setCheckedItems] = useState<Record<string, Set<string>>>({});
  const [expandedSetup, setExpandedSetup] = useState<string | null>(null);
  const [form, setForm] = useState<AnalyzeForm>({
    session: "",
    market: "",
    direction: "",
    setupType: "",
    liquidityLocation: "",
    htfTrend: "",
    catalyst: "",
    entryPrice: "",
    stopPrice: "",
    targetPrice: "",
    riskPercent: "1",
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<WarRoomResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const tvContainerRef = useRef<HTMLDivElement>(null);
  const tvScriptAdded = useRef(false);

  // ── Clock tick ──
  useEffect(() => {
    const id = setInterval(() => setCurrentUtcTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // ── TradingView chart ──
  useEffect(() => {
    if (!tvContainerRef.current || tvScriptAdded.current) return;
    tvScriptAdded.current = true;

    const containerId = "tv_warroom_main";
    const inner = document.createElement("div");
    inner.id = containerId;
    tvContainerRef.current.appendChild(inner);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (typeof window !== "undefined") {
        const win = window as unknown as Record<string, { widget: new (config: Record<string, unknown>) => void }>;
        if (win.TradingView) {
          new win.TradingView.widget({
            container_id: containerId,
            symbol: "AMEX:SPY",
            interval: "15",
            timezone: "Etc/UTC",
            theme: "dark",
            style: "1",
            locale: "en",
            toolbar_bg: "#0f1117",
            enable_publishing: false,
            allow_symbol_change: true,
            hide_side_toolbar: false,
            save_image: true,
            height: 520,
            width: "100%",
            withdateranges: true,
            studies: ["VWAP@tv-basicstudies"],
            show_popup_button: true,
          });
        }
      }
    };
    document.head.appendChild(script);

    return () => {
      if (tvContainerRef.current) {
        tvContainerRef.current.innerHTML = "";
      }
      tvScriptAdded.current = false;
    };
  }, []);

  // ── Checklist toggle ──
  const toggleChecklist = useCallback((sessionKey: string, item: string) => {
    setCheckedItems(prev => {
      const existing = prev[sessionKey] ? new Set(prev[sessionKey]) : new Set<string>();
      if (existing.has(item)) {
        existing.delete(item);
      } else {
        existing.add(item);
      }
      return { ...prev, [sessionKey]: existing };
    });
  }, []);

  // ── Form helpers ──
  const currentSessionData = SESSIONS.find(s => s.key === form.session);
  const selectedSessionSetups = currentSessionData?.setups ?? [];

  const rrCalc = (() => {
    const entry = parseFloat(form.entryPrice);
    const stop = parseFloat(form.stopPrice);
    const target = parseFloat(form.targetPrice);
    if (!isNaN(entry) && !isNaN(stop) && !isNaN(target) && stop !== entry) {
      const risk = Math.abs(entry - stop);
      const reward = Math.abs(target - entry);
      const rr = reward / risk;
      return rr.toFixed(2);
    }
    return null;
  })();

  const formValid =
    form.session &&
    form.market.trim().length > 0 &&
    form.direction !== "" &&
    form.setupType &&
    form.liquidityLocation &&
    form.htfTrend &&
    form.entryPrice &&
    form.stopPrice &&
    form.targetPrice;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
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
          const data = (await res.json()) as WarRoomResult;
          setAiResult(data);
        }
      } catch {
        setAiError("Network error — please check your connection and try again.");
      } finally {
        setAiLoading(false);
      }
    },
    [form, formValid]
  );

  // ── Computed timing values ──
  const activeSessions = getActiveSessions(currentUtcTime);
  const nextSession = getNextSession(currentUtcTime);
  const utcH = currentUtcTime.getUTCHours();
  const utcM = currentUtcTime.getUTCMinutes();
  const utcS = currentUtcTime.getUTCSeconds();
  const utcTimeStr = `${pad2(utcH)}:${pad2(utcM)}:${pad2(utcS)} UTC`;
  const nowMins = minutesOfDay(utcH, utcM);
  const dayMins = 24 * 60;
  const timelinePercent = (nowMins / dayMins) * 100;

  const activeTab = SESSIONS.find(s => s.key === activeSession) ?? SESSIONS[0];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0b0d" }}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 pt-10 pb-24">

        {/* ── Page header ── */}
        <div className="mb-8">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3"
            style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            EDGE OS — Market Intelligence
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: "#e8eaf0" }}>
            Market <span style={{ color: "#ef4444" }}>War Room</span>
          </h1>
          <p className="text-sm" style={{ color: "#9aa0b4" }}>
            Session clock · Playbook · TradingView chart · AI trade analysis — Educational only
          </p>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 1 — Live Session Clock
        ════════════════════════════════════════════════════════════════════ */}
        <div
          className="rounded-2xl p-5 mb-8"
          style={{ background: "#0f1117", border: "1px solid #1e2433" }}
        >
          {/* Top row: time + active badges + next session */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
            {/* UTC clock */}
            <div>
              <div className="text-xs font-medium mb-1" style={{ color: "#5a6075" }}>
                LIVE UTC CLOCK
              </div>
              <div
                className="text-2xl sm:text-3xl font-mono font-bold tracking-widest"
                style={{ color: "#00d4ff", textShadow: "0 0 20px rgba(0,212,255,0.3)" }}
              >
                {utcTimeStr}
              </div>
            </div>

            {/* Active sessions */}
            <div className="flex flex-col items-end gap-2">
              <div className="text-xs font-medium" style={{ color: "#5a6075" }}>
                ACTIVE SESSIONS
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                {activeSessions.length === 0 ? (
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ background: "rgba(90,96,117,0.15)", color: "#5a6075", border: "1px solid rgba(90,96,117,0.3)" }}
                  >
                    Off Hours
                  </span>
                ) : (
                  activeSessions.map(s => (
                    <span
                      key={s.key}
                      className="px-3 py-1 rounded-full text-xs font-bold"
                      style={{
                        background: `${s.color}18`,
                        color: s.color,
                        border: `1px solid ${s.color}40`,
                        boxShadow: `0 0 12px ${s.color}20`,
                      }}
                    >
                      {s.label} Active
                    </span>
                  ))
                )}
              </div>
              {nextSession && (
                <div className="text-xs" style={{ color: "#9aa0b4" }}>
                  Next:{" "}
                  <span style={{ color: nextSession.win.color }}>
                    {nextSession.win.label}
                  </span>{" "}
                  in{" "}
                  <span className="font-semibold" style={{ color: "#e8eaf0" }}>
                    {formatCountdown(nextSession.minutesUntil)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Session timeline bar */}
          <div>
            <div className="text-xs mb-2 font-medium" style={{ color: "#5a6075" }}>
              24H SESSION TIMELINE
            </div>
            <div
              className="relative rounded-full overflow-hidden"
              style={{ height: "28px", background: "#141720", border: "1px solid #1e2433" }}
            >
              {/* Session blocks */}
              {SESSION_WINDOWS.filter(w => w.key !== "overlap").map(win => {
                const startPct = (minutesOfDay(win.startH, win.startM) / dayMins) * 100;
                const widthPct = ((minutesOfDay(win.endH, win.endM) - minutesOfDay(win.startH, win.startM)) / dayMins) * 100;
                return (
                  <div
                    key={win.key}
                    className="absolute top-0 bottom-0 flex items-center justify-center"
                    style={{
                      left: `${startPct}%`,
                      width: `${widthPct}%`,
                      background: `${win.color}22`,
                      borderLeft: `2px solid ${win.color}60`,
                      borderRight: `2px solid ${win.color}60`,
                    }}
                  >
                    <span className="text-xs font-semibold hidden sm:block" style={{ color: win.color, fontSize: "10px" }}>
                      {win.label}
                    </span>
                  </div>
                );
              })}
              {/* Overlap highlight */}
              {(() => {
                const ov = SESSION_WINDOWS.find(w => w.key === "overlap")!;
                const startPct = (minutesOfDay(ov.startH, ov.startM) / dayMins) * 100;
                const widthPct = ((minutesOfDay(ov.endH, ov.endM) - minutesOfDay(ov.startH, ov.startM)) / dayMins) * 100;
                return (
                  <div
                    className="absolute top-0 bottom-0"
                    style={{
                      left: `${startPct}%`,
                      width: `${widthPct}%`,
                      background: "rgba(239,68,68,0.25)",
                      borderLeft: "2px solid rgba(239,68,68,0.7)",
                      borderRight: "2px solid rgba(239,68,68,0.7)",
                      pointerEvents: "none",
                    }}
                  />
                );
              })()}
              {/* Now marker */}
              <div
                className="absolute top-0 bottom-0 w-0.5"
                style={{
                  left: `${timelinePercent}%`,
                  background: "#fff",
                  boxShadow: "0 0 6px rgba(255,255,255,0.8)",
                  zIndex: 10,
                }}
              />
            </div>
            {/* Hour labels */}
            <div className="flex justify-between mt-1">
              {[0, 4, 8, 12, 16, 20, 24].map(h => (
                <span key={h} className="text-xs" style={{ color: "#5a6075", fontSize: "10px" }}>
                  {pad2(h % 24)}:00
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 2 — Session Playbook
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
                  color: activeSession === s.key ? s.color : "#9aa0b4",
                  border: `1px solid ${activeSession === s.key ? s.color + "50" : "#1e2433"}`,
                  boxShadow: activeSession === s.key ? `0 0 16px ${s.color}15` : "none",
                }}
              >
                {s.icon} {s.label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {/* 1. Overview card */}
            <div
              className="rounded-2xl p-5"
              style={{ background: "#0f1117", border: `1px solid ${activeTab.color}30` }}
            >
              <div className="grid md:grid-cols-2 gap-5">
                {/* Overview text */}
                <div>
                  <div
                    className="text-xs font-semibold uppercase tracking-widest mb-2"
                    style={{ color: activeTab.color }}
                  >
                    {activeTab.icon} {activeTab.label} Session Overview
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "#9aa0b4" }}>
                    {activeTab.overview}
                  </p>
                </div>
                {/* Key stats grid */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Hours (UTC)", value: activeTab.hours },
                    { label: "Key Markets", value: activeTab.keyMarkets },
                    {
                      label: "Volatility",
                      value: activeTab.volatility,
                      valueColor: VOLATILITY_COLORS[activeTab.volatility],
                    },
                    { label: "Primary Instruments", value: activeTab.keyMarkets },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className="rounded-xl p-3"
                      style={{ background: "#141720", border: "1px solid #1e2433" }}
                    >
                      <div className="text-xs mb-1" style={{ color: "#5a6075" }}>
                        {stat.label}
                      </div>
                      <div
                        className="text-xs font-semibold leading-snug"
                        style={{ color: stat.valueColor ?? "#e8eaf0" }}
                      >
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Key Behaviors */}
            <div
              className="rounded-2xl p-5"
              style={{ background: "#0f1117", border: "1px solid #1e2433" }}
            >
              <div
                className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ color: "#00d4ff" }}
              >
                Key Behaviors
              </div>
              <ul className="space-y-2">
                {activeTab.behaviors.map((b, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: activeTab.color, marginTop: "6px" }} />
                    <span className="text-sm" style={{ color: "#9aa0b4" }}>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 3. Liquidity Characteristics */}
            <div
              className="rounded-2xl p-5"
              style={{ background: "#0f1117", border: "1px solid #1e2433" }}
            >
              <div
                className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ color: "#f59e0b" }}
              >
                Liquidity Characteristics
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "#9aa0b4" }}>
                {activeTab.liquidity}
              </p>
            </div>

            {/* 4. Volatility Expectations */}
            <div
              className="rounded-2xl p-5"
              style={{ background: "#0f1117", border: "1px solid #1e2433" }}
            >
              <div
                className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ color: "#5a6075" }}
              >
                Volatility Expectations
              </div>
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="px-3 py-1 rounded-full text-sm font-bold"
                  style={{
                    background: `${VOLATILITY_COLORS[activeTab.volatility]}18`,
                    color: VOLATILITY_COLORS[activeTab.volatility],
                    border: `1px solid ${VOLATILITY_COLORS[activeTab.volatility]}40`,
                  }}
                >
                  {activeTab.volatility}
                </span>
              </div>
              <p className="text-sm" style={{ color: "#9aa0b4" }}>
                {activeTab.volatility === "Low" &&
                  "Minimal price movement expected. Range trading setups dominate. Position sizing can be more generous."}
                {activeTab.volatility === "Low–Medium" &&
                  "Controlled price action with occasional spikes on news. Good for range-based strategies with tighter stops."}
                {activeTab.volatility === "Medium" &&
                  "Moderate directional moves possible. Use normal position sizing and respect key levels."}
                {activeTab.volatility === "High" &&
                  "Aggressive moves common. Use tighter position sizing. Stops can be hit quickly — ensure they are logically placed beyond key structure, not randomly."}
                {activeTab.volatility === "Very High" &&
                  "Maximum volatility. Both sessions active simultaneously — moves can be explosive and fast. Reduce position size significantly. Only trade A+ setups with multiple confluences. Hard stops mandatory."}
              </p>
            </div>

            {/* 5. Pre-Session Checklist */}
            <div
              className="rounded-2xl p-5"
              style={{ background: "#0f1117", border: "1px solid #1e2433" }}
            >
              <div
                className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ color: "#10b981" }}
              >
                Trader Pre-Session Checklist
              </div>
              <div className="space-y-2">
                {activeTab.checklist.map((item, i) => {
                  const sessionChecked = checkedItems[activeTab.key] ?? new Set<string>();
                  const isChecked = sessionChecked.has(item);
                  return (
                    <button
                      key={i}
                      onClick={() => toggleChecklist(activeTab.key, item)}
                      className="w-full flex items-start gap-3 text-left rounded-xl px-3 py-2.5 transition-all duration-150"
                      style={{
                        background: isChecked ? "rgba(16,185,129,0.06)" : "#141720",
                        border: `1px solid ${isChecked ? "rgba(16,185,129,0.25)" : "#1e2433"}`,
                      }}
                    >
                      <div
                        className="flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center mt-0.5"
                        style={{
                          borderColor: isChecked ? "#10b981" : "#5a6075",
                          background: isChecked ? "#10b981" : "transparent",
                        }}
                      >
                        {isChecked && (
                          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                            <path d="M1 3L3.5 5.5L8 1" stroke="#0a0b0d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span
                        className="text-sm"
                        style={{
                          color: isChecked ? "#e8eaf0" : "#9aa0b4",
                          textDecoration: isChecked ? "line-through" : "none",
                        }}
                      >
                        {item}
                      </span>
                    </button>
                  );
                })}
              </div>
              {/* Progress */}
              {(() => {
                const done = (checkedItems[activeTab.key] ?? new Set()).size;
                const total = activeTab.checklist.length;
                return (
                  <div className="mt-3 flex items-center gap-3">
                    <div
                      className="flex-1 h-1.5 rounded-full overflow-hidden"
                      style={{ background: "#1e2433" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${(done / total) * 100}%`,
                          background: done === total ? "#10b981" : activeTab.color,
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium" style={{ color: done === total ? "#10b981" : "#9aa0b4" }}>
                      {done}/{total}
                      {done === total && " — Ready"}
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* 6. Common Setups — expandable cards */}
            <div
              className="rounded-2xl p-5"
              style={{ background: "#0f1117", border: "1px solid #1e2433" }}
            >
              <div
                className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ color: "#8b5cf6" }}
              >
                Common Setups
              </div>
              <div className="space-y-2">
                {activeTab.setups.map((setup, i) => {
                  const setupId = `${activeTab.key}-${i}`;
                  const isOpen = expandedSetup === setupId;
                  return (
                    <div
                      key={i}
                      className="rounded-xl overflow-hidden"
                      style={{ border: `1px solid ${isOpen ? activeTab.color + "40" : "#1e2433"}` }}
                    >
                      <button
                        onClick={() => setExpandedSetup(isOpen ? null : setupId)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left transition-all"
                        style={{ background: isOpen ? `${activeTab.color}0a` : "#141720" }}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: `${activeTab.color}20`, color: activeTab.color }}
                          >
                            {i + 1}
                          </span>
                          <span className="text-sm font-semibold" style={{ color: "#e8eaf0" }}>
                            {setup.name}
                          </span>
                        </div>
                        <span style={{ color: "#5a6075" }}>{isOpen ? "▲" : "▼"}</span>
                      </button>
                      {isOpen && (
                        <div
                          className="px-4 pb-4 pt-2 border-t"
                          style={{ borderColor: "#1e2433", background: "#0f1117" }}
                        >
                          <p className="text-sm leading-relaxed" style={{ color: "#9aa0b4" }}>
                            {setup.description}
                          </p>
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
            SECTION 3 — TradingView Chart
        ════════════════════════════════════════════════════════════════════ */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4" style={{ color: "#e8eaf0" }}>
            Live <span style={{ color: "#00d4ff" }}>Chart</span>
          </h2>

          {/* Overlay Presets Guide */}
          <div
            className="rounded-2xl p-5 mb-4"
            style={{ background: "#0f1117", border: "1px solid #1e2433" }}
          >
            <div
              className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: "#9aa0b4" }}
            >
              Overlay Presets Guide
            </div>
            <p className="text-xs mb-3" style={{ color: "#5a6075" }}>
              Manual instructions for adding key overlays to your chart. These are reference drawings — not automated.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {OVERLAY_PRESETS.map((preset, i) => (
                <div
                  key={i}
                  className="rounded-xl p-3"
                  style={{ background: "#141720", border: `1px solid ${preset.color}25` }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: preset.color }}
                    />
                    <span className="text-xs font-semibold" style={{ color: preset.color }}>
                      {preset.label}
                    </span>
                  </div>
                  <p className="text-xs leading-snug" style={{ color: "#5a6075" }}>
                    {preset.instruction}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* TradingView embed */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid #1e2433", background: "#0f1117" }}
          >
            <div
              className="px-4 py-2.5 flex items-center gap-3 flex-wrap"
              style={{ borderBottom: "1px solid #1e2433" }}
            >
              <span className="text-xs font-semibold" style={{ color: "#9aa0b4" }}>
                TradingView — AMEX:SPY · 15m · VWAP loaded
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded"
                style={{ background: "#141720", color: "#5a6075", border: "1px solid #1e2433" }}
              >
                Free embed
              </span>
              <span className="text-xs" style={{ color: "#5a6075" }}>
                Change symbol in chart toolbar
              </span>
            </div>
            <div ref={tvContainerRef} style={{ background: "#0f1117", minHeight: "520px" }} />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 4 — AI War Room Analyze Setup
        ════════════════════════════════════════════════════════════════════ */}
        <div>
          <h2 className="text-xl font-bold mb-1" style={{ color: "#e8eaf0" }}>
            ⚡ Analyze Setup — <span style={{ color: "#ef4444" }}>AI War Room</span>
          </h2>
          <p className="text-xs mb-5" style={{ color: "#5a6075" }}>
            Educational feedback only — not financial advice.
          </p>

          <form onSubmit={handleSubmit}>
            <div
              className="rounded-2xl p-5 mb-4"
              style={{ background: "#0f1117", border: "1px solid #1e2433" }}
            >
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* 1. Session */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#9aa0b4" }}>
                    Session *
                  </label>
                  <select
                    value={form.session}
                    onChange={e => setForm(f => ({ ...f, session: e.target.value, setupType: "" }))}
                    className="w-full rounded-xl px-3 py-2.5 text-sm"
                    style={{
                      background: "#141720",
                      border: "1px solid #1e2433",
                      color: form.session ? "#e8eaf0" : "#5a6075",
                    }}
                  >
                    <option value="">Select session…</option>
                    {SESSIONS.map(s => (
                      <option key={s.key} value={s.key}>
                        {s.icon} {s.label} ({s.hours})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Market/Ticker */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#9aa0b4" }}>
                    Market / Ticker *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SPY, EUR/USD"
                    value={form.market}
                    onChange={e => setForm(f => ({ ...f, market: e.target.value }))}
                    className="w-full rounded-xl px-3 py-2.5 text-sm"
                    style={{
                      background: "#141720",
                      border: "1px solid #1e2433",
                      color: "#e8eaf0",
                    }}
                  />
                </div>

                {/* 3. Direction */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#9aa0b4" }}>
                    Direction *
                  </label>
                  <div className="flex gap-2">
                    {(["Long", "Short"] as const).map(dir => (
                      <button
                        key={dir}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, direction: dir }))}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                        style={{
                          background:
                            form.direction === dir
                              ? dir === "Long"
                                ? "rgba(16,185,129,0.15)"
                                : "rgba(239,68,68,0.15)"
                              : "#141720",
                          color:
                            form.direction === dir
                              ? dir === "Long"
                                ? "#10b981"
                                : "#ef4444"
                              : "#9aa0b4",
                          border: `1px solid ${
                            form.direction === dir
                              ? dir === "Long"
                                ? "rgba(16,185,129,0.4)"
                                : "rgba(239,68,68,0.4)"
                              : "#1e2433"
                          }`,
                        }}
                      >
                        {dir === "Long" ? "▲ Long" : "▼ Short"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Setup Type */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#9aa0b4" }}>
                    Setup Type *
                  </label>
                  <select
                    value={form.setupType}
                    onChange={e => setForm(f => ({ ...f, setupType: e.target.value }))}
                    className="w-full rounded-xl px-3 py-2.5 text-sm"
                    style={{
                      background: "#141720",
                      border: "1px solid #1e2433",
                      color: form.setupType ? "#e8eaf0" : "#5a6075",
                    }}
                    disabled={selectedSessionSetups.length === 0}
                  >
                    <option value="">
                      {selectedSessionSetups.length === 0 ? "Select a session first" : "Select setup…"}
                    </option>
                    {selectedSessionSetups.map(s => (
                      <option key={s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5. Liquidity Location */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#9aa0b4" }}>
                    Liquidity Location *
                  </label>
                  <select
                    value={form.liquidityLocation}
                    onChange={e => setForm(f => ({ ...f, liquidityLocation: e.target.value }))}
                    className="w-full rounded-xl px-3 py-2.5 text-sm"
                    style={{
                      background: "#141720",
                      border: "1px solid #1e2433",
                      color: form.liquidityLocation ? "#e8eaf0" : "#5a6075",
                    }}
                  >
                    <option value="">Select location…</option>
                    {[
                      "Above equal highs (BSL)",
                      "Below equal lows (SSL)",
                      "At HTF resistance",
                      "At HTF support",
                      "At VWAP",
                      "At opening range",
                      "Clean air / no key level",
                    ].map(opt => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 6. HTF Trend */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#9aa0b4" }}>
                    HTF Trend *
                  </label>
                  <select
                    value={form.htfTrend}
                    onChange={e => setForm(f => ({ ...f, htfTrend: e.target.value }))}
                    className="w-full rounded-xl px-3 py-2.5 text-sm"
                    style={{
                      background: "#141720",
                      border: "1px solid #1e2433",
                      color: form.htfTrend ? "#e8eaf0" : "#5a6075",
                    }}
                  >
                    <option value="">Select trend…</option>
                    {[
                      "Strongly Bullish — daily uptrend",
                      "Mildly Bullish — above 20EMA",
                      "Ranging / No trend",
                      "Mildly Bearish — below 20EMA",
                      "Strongly Bearish — daily downtrend",
                    ].map(opt => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 7. Catalyst — spans 2 cols on lg */}
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#9aa0b4" }}>
                    Catalyst (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CPI beat, FOMC decision, breakout from weekly range"
                    value={form.catalyst}
                    onChange={e => setForm(f => ({ ...f, catalyst: e.target.value }))}
                    className="w-full rounded-xl px-3 py-2.5 text-sm"
                    style={{
                      background: "#141720",
                      border: "1px solid #1e2433",
                      color: "#e8eaf0",
                    }}
                  />
                </div>

                {/* 8–10. Prices */}
                {[
                  { key: "entryPrice", label: "Entry Price *", placeholder: "e.g. 525.50" },
                  { key: "stopPrice", label: "Stop Price *", placeholder: "e.g. 521.00" },
                  { key: "targetPrice", label: "Target Price *", placeholder: "e.g. 535.00" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "#9aa0b4" }}>
                      {label}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder={placeholder}
                      value={form[key as keyof AnalyzeForm]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full rounded-xl px-3 py-2.5 text-sm"
                      style={{
                        background: "#141720",
                        border: "1px solid #1e2433",
                        color: "#e8eaf0",
                      }}
                    />
                  </div>
                ))}

                {/* 11. Risk % */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#9aa0b4" }}>
                    Risk % of Account *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="10"
                    value={form.riskPercent}
                    onChange={e => setForm(f => ({ ...f, riskPercent: e.target.value }))}
                    className="w-full rounded-xl px-3 py-2.5 text-sm"
                    style={{
                      background: "#141720",
                      border: "1px solid #1e2433",
                      color: "#e8eaf0",
                    }}
                  />
                </div>

                {/* Live R:R display */}
                <div className="flex items-end">
                  <div
                    className="w-full rounded-xl px-3 py-2.5"
                    style={{ background: "#141720", border: "1px solid #1e2433" }}
                  >
                    <div className="text-xs mb-0.5" style={{ color: "#5a6075" }}>
                      Live R:R Ratio
                    </div>
                    <div
                      className="text-lg font-bold font-mono"
                      style={{
                        color:
                          rrCalc === null
                            ? "#5a6075"
                            : parseFloat(rrCalc) >= 2
                            ? "#10b981"
                            : parseFloat(rrCalc) >= 1.5
                            ? "#f59e0b"
                            : "#ef4444",
                      }}
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
                    background:
                      !formValid || aiLoading
                        ? "#1e2433"
                        : "linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.1))",
                    color: !formValid || aiLoading ? "#5a6075" : "#ef4444",
                    border: `1px solid ${!formValid || aiLoading ? "#1e2433" : "rgba(239,68,68,0.4)"}`,
                    cursor: !formValid || aiLoading ? "not-allowed" : "pointer",
                    boxShadow: !formValid || aiLoading ? "none" : "0 0 20px rgba(239,68,68,0.1)",
                  }}
                >
                  {aiLoading ? "Analyzing…" : "⚡ Analyze Setup"}
                </button>
              </div>
            </div>
          </form>

          {/* AI loading state */}
          {aiLoading && (
            <div
              className="rounded-2xl p-6 text-center"
              style={{ background: "#0f1117", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              <div className="flex items-center justify-center gap-3 mb-2">
                <div
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ background: "#ef4444" }}
                />
                <span className="text-sm font-semibold" style={{ color: "#ef4444" }}>
                  AI War Room analyzing…
                </span>
              </div>
              <p className="text-xs" style={{ color: "#5a6075" }}>
                Reviewing confluences, risk/reward, and session context.
              </p>
            </div>
          )}

          {/* Error */}
          {aiError && !aiLoading && (
            <div
              className="rounded-2xl p-5"
              style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              <p className="text-sm font-semibold mb-1" style={{ color: "#ef4444" }}>
                Analysis Failed
              </p>
              <p className="text-sm" style={{ color: "#9aa0b4" }}>
                {aiError}
              </p>
            </div>
          )}

          {/* AI Result */}
          {aiResult && !aiLoading && (
            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: `1px solid ${GRADE_COLORS[aiResult.grade]?.color ?? "#1e2433"}40` }}
            >
              {/* Grade header */}
              <div
                className="px-5 py-4 flex items-center gap-4"
                style={{
                  background: GRADE_COLORS[aiResult.grade]?.bg ?? "#0f1117",
                  borderBottom: "1px solid #1e2433",
                }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl flex-shrink-0"
                  style={{
                    background: `${GRADE_COLORS[aiResult.grade]?.color ?? "#5a6075"}20`,
                    color: GRADE_COLORS[aiResult.grade]?.color ?? "#5a6075",
                    border: `2px solid ${GRADE_COLORS[aiResult.grade]?.color ?? "#5a6075"}50`,
                  }}
                >
                  {aiResult.grade}
                </div>
                <div>
                  <div
                    className="text-xs font-semibold uppercase tracking-wider mb-0.5"
                    style={{ color: GRADE_COLORS[aiResult.grade]?.color ?? "#5a6075" }}
                  >
                    Setup Grade
                  </div>
                  <p className="text-sm" style={{ color: "#e8eaf0" }}>
                    {aiResult.gradeReasoning}
                  </p>
                </div>
              </div>

              <div className="p-5 space-y-4" style={{ background: "#0f1117" }}>
                {/* Confluence Analysis */}
                <div
                  className="rounded-xl p-4"
                  style={{ background: "#141720", border: "1px solid #1e2433" }}
                >
                  <div
                    className="text-xs font-semibold uppercase tracking-wider mb-2"
                    style={{ color: "#00d4ff" }}
                  >
                    Confluence Analysis
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "#9aa0b4" }}>
                    {aiResult.confluenceAnalysis}
                  </p>
                </div>

                {/* Risk Assessment */}
                <div
                  className="rounded-xl p-4"
                  style={{ background: "#141720", border: "1px solid #1e2433" }}
                >
                  <div
                    className="text-xs font-semibold uppercase tracking-wider mb-2"
                    style={{ color: "#f59e0b" }}
                  >
                    Risk Assessment
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "#9aa0b4" }}>
                    {aiResult.riskAssessment}
                  </p>
                </div>

                {/* What Could Go Wrong */}
                <div
                  className="rounded-xl p-4"
                  style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)" }}
                >
                  <div
                    className="text-xs font-semibold uppercase tracking-wider mb-2"
                    style={{ color: "#ef4444" }}
                  >
                    What Could Go Wrong
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "#9aa0b4" }}>
                    {aiResult.whatCouldGoWrong}
                  </p>
                </div>

                {/* Final Decision */}
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: `${GRADE_COLORS[aiResult.grade]?.color ?? "#5a6075"}08`,
                    border: `1px solid ${GRADE_COLORS[aiResult.grade]?.color ?? "#5a6075"}25`,
                  }}
                >
                  <div
                    className="text-xs font-semibold uppercase tracking-wider mb-2"
                    style={{ color: GRADE_COLORS[aiResult.grade]?.color ?? "#5a6075" }}
                  >
                    Final Educational Decision
                  </div>
                  <p className="text-sm leading-relaxed font-medium" style={{ color: "#e8eaf0" }}>
                    {aiResult.finalDecision}
                  </p>
                </div>

                {/* Disclaimer */}
                <div
                  className="rounded-xl p-3"
                  style={{ background: "rgba(90,96,117,0.08)", border: "1px solid rgba(90,96,117,0.2)" }}
                >
                  <p className="text-xs" style={{ color: "#5a6075" }}>
                    ⚠️ {aiResult.disclaimer}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Footer disclaimer */}
          <p className="text-center text-xs mt-6" style={{ color: "#5a6075" }}>
            Educational research only · Not financial advice · No guaranteed returns · Always paper trade first
          </p>
        </div>
      </div>
    </div>
  );
}

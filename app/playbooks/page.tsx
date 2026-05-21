"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";

interface Playbook {
  id: string;
  name: string;
  icon: string;
  type: string;
  color: string;
  bestSessions: string[];
  setupRules: string[];
  entryFramework: string[];
  invalidation: string[];
  confirmationChecklist: string[];
  commonMistakes: string[];
  educationalNote: string;
}

const PLAYBOOKS: Playbook[] = [
  {
    id: "orb",
    name: "Opening Range Breakout",
    icon: "🔔",
    type: "ORB",
    color: "#00d4ff",
    bestSessions: ["New York open (9:30–10:30 ET)", "Post-catalyst moves"],
    setupRules: [
      "Define the opening range: first 15–30 minutes of the session (9:30–9:45 or 9:30–10:00)",
      "Mark the high and low of that opening range with horizontal lines",
      "Wait for a clean breakout above the high OR below the low",
      "Breakout candle should close outside the range with above-average volume",
      "Avoid ORB entries on low-volume, choppy mornings",
    ],
    entryFramework: [
      "Entry: first pullback to the breakout level after breakout closes",
      "Or enter on the break candle close with a tight stop",
      "Stop: inside the opening range (below the broken level)",
      "Target 1: 1:1 R:R from breakout point",
      "Target 2: measured move (range height projected from breakout)",
    ],
    invalidation: [
      "Price reverses back inside the opening range — setup is invalidated",
      "Multiple false breakouts — skip the session",
      "Breakout on very low volume — not confirmed",
      "Broader market (SPY) moving against the direction",
    ],
    confirmationChecklist: [
      "Opening range is clearly defined with at least 3–5 candles",
      "Volume on breakout candle is above 20-day average",
      "SPY confirms or is neutral",
      "No major earnings or news in next 30 minutes",
      "Stop is defined before entry",
      "R:R is at least 2:1",
    ],
    commonMistakes: [
      "Entering on the first touch of the range boundary — wait for the close outside",
      "Chasing a breakout that has already moved 3–5% — the entry has passed",
      "Ignoring SPY direction — a strong counter-market move kills ORB setups",
      "Setting stop too wide — the stop should be just inside the range",
    ],
    educationalNote: "ORB works because institutions often run their initial orders at the open, creating a real range. The breakout reveals directional commitment. The first 30 minutes is the 'price discovery' phase — the ORB captures the committed move that follows.",
  },
  {
    id: "vwap-reclaim",
    name: "VWAP Reclaim",
    icon: "📈",
    type: "VWAP Reclaim",
    color: "#10b981",
    bestSessions: ["New York morning", "London/NY overlap"],
    setupRules: [
      "Price is trading below VWAP after a pullback or sell-off",
      "A catalyst (news, level break, sector rotation) triggers buying",
      "Watch for the first green candle to close above VWAP",
      "Volume should increase on the reclaim candle",
      "Best when SPY is also above its VWAP (market confirmation)",
    ],
    entryFramework: [
      "Entry: on the close of the first candle that closes above VWAP",
      "Or on first successful retest of VWAP from above (VWAP becomes support)",
      "Stop: below VWAP — a close back below invalidates the setup",
      "Target 1: prior HOD or nearest resistance",
      "Target 2: 2x the distance from VWAP to entry",
    ],
    invalidation: [
      "Price reclaims VWAP but immediately reverses — no follow-through",
      "Volume decreasing on the reclaim — not committed",
      "SPY fails its own VWAP simultaneously",
      "Price was chopping around VWAP — not a clean reclaim",
    ],
    confirmationChecklist: [
      "Candle closes cleanly above VWAP (not just a wick)",
      "Volume above average on the reclaim candle",
      "SPY is at or above VWAP",
      "Sector ETF (XLK for tech, etc.) confirms",
      "No distribution patterns in the 5m chart",
    ],
    commonMistakes: [
      "Entering before the candle closes above VWAP — premature entry",
      "Ignoring that price has already reclaimed multiple times and failed — weakens the signal",
      "Entering into VWAP resistance (not reclaim) — opposite setup",
      "Holding through another VWAP failure — should have a stop defined",
    ],
    educationalNote: "VWAP is the reference price for institutional execution. When price reclaims VWAP with volume, it signals that buyers are absorbing sell pressure at the institutional benchmark — often the beginning of a meaningful move.",
  },
  {
    id: "liquidity-sweep",
    name: "Liquidity Sweep Reversal",
    icon: "🌊",
    type: "Liq Sweep Reversal",
    color: "#8b5cf6",
    bestSessions: ["London open", "NY open", "London/NY overlap"],
    setupRules: [
      "Identify a prior significant high or low with 'equal' touches (2+ times tagged)",
      "Watch for a sharp wick that sweeps through those equal highs/lows",
      "The candle body must close back inside the range (the wick is the sweep)",
      "Look for displacement (strong move) away from the swept level",
      "Higher timeframe context should support the reversal direction",
    ],
    entryFramework: [
      "Entry: on the close of the rejection candle after the sweep",
      "Or on first pullback into the rejection candle's body",
      "Stop: beyond the swept extreme (the wick high/low)",
      "Target 1: midpoint of the prior range",
      "Target 2: opposite side of the range (equal lows if sweeping highs)",
    ],
    invalidation: [
      "Price breaks and holds beyond the sweep level — not a reversal, it's a breakout",
      "No strong displacement after the sweep — just a wick with no commitment",
      "Multiple sweeps at the same level without reversal — price will eventually break",
      "Counter to dominant trend on high timeframe without structure shift",
    ],
    confirmationChecklist: [
      "Equal highs or equal lows exist on the chart (at least 2 equal touches)",
      "Sweep wick extends clearly beyond the level",
      "Candle body closes back inside the range",
      "Volume spike on the sweep candle",
      "Follow-through candle in reversal direction confirms",
    ],
    commonMistakes: [
      "Entering before the rejection candle closes — sweep could continue",
      "Confusing a single high with equal highs — needs at least 2 touches",
      "Ignoring that the sweep may be the beginning of a breakout, not reversal",
      "Setting stop too tight inside the range instead of beyond the swept level",
    ],
    educationalNote: "Liquidity sweeps are institutional order flow in action. Algorithms and smart money target equal highs/lows to trigger retail stop orders, collect liquidity, then reverse. The wick-and-close pattern is the fingerprint of this engineered move.",
  },
  {
    id: "break-retest",
    name: "Break and Retest",
    icon: "🔄",
    type: "B&R",
    color: "#f59e0b",
    bestSessions: ["Any session", "Best in New York continuation"],
    setupRules: [
      "A significant level (daily resistance, trendline, key swing) must be broken",
      "The break should have displacement — a strong candle through the level",
      "Wait for price to pull back and retest the broken level",
      "The retest should hold — the broken level should now act as support/resistance",
      "Watch for rejection candle at the retest level",
    ],
    entryFramework: [
      "Entry: rejection candle at the retest level closes away from it",
      "Or limit order at the broken level with a defined stop",
      "Stop: beyond the retest level (if support, stop below; if resistance, stop above)",
      "Target 1: prior structure level or 1.5x the prior range",
      "Target 2: projected move equal to the height of the prior consolidation",
    ],
    invalidation: [
      "Price retest fails — level does not hold on the first test",
      "Break candle was on very low volume — not a real break",
      "Price immediately returns through the level — false break",
      "More than 3 retests of the same level — level is weakening",
    ],
    confirmationChecklist: [
      "Break candle has at least 1.5x average volume",
      "Retest approaches the level cleanly (not whipsaw)",
      "Rejection at retest is visible — wick or body close",
      "Higher timeframe agrees with the break direction",
      "Stop is at most 1% risk from entry",
    ],
    commonMistakes: [
      "Entering on the break candle itself — waiting for retest lowers risk and improves R:R",
      "Treating every touch of a level as a potential break — needs displacement",
      "Skipping the retest wait — entries on breaks often get immediate pullbacks",
      "Ignoring context — break against a trend on HTF is lower probability",
    ],
    educationalNote: "Break and retest setups work because market participants who missed the initial break try to 'buy the dip' at the former resistance now acting as support, creating a natural demand zone. The retest is the market offering a second chance entry.",
  },
  {
    id: "fvg-reclaim",
    name: "FVG Reclaim",
    icon: "⚡",
    type: "FVG Reclaim",
    color: "#a78bfa",
    bestSessions: ["Any session, especially during displacement moves"],
    setupRules: [
      "A Fair Value Gap (3-candle structure with price imbalance) is identified",
      "Price has moved away from the FVG creating the imbalance",
      "Price returns into the FVG (the gap fills or partially fills)",
      "Watch for rejection inside the FVG — especially at the 50% (EQ) of the gap",
      "Higher timeframe FVGs hold more weight than lower timeframe ones",
    ],
    entryFramework: [
      "Entry: rejection from inside the FVG (lower 25–50% of the gap for bullish FVG)",
      "Bullish FVG: entry near the bottom of the gap (A.high level)",
      "Bearish FVG: entry near the top of the gap (A.low level)",
      "Stop: fully outside the FVG (beyond the opposite end of the gap)",
      "Target: previous displacement high/low that created the FVG",
    ],
    invalidation: [
      "Price fills the entire FVG and closes through the other side — full fill, no setup",
      "FVG was on a lower timeframe — higher TF is overriding it",
      "No rejection inside the gap — just a clean fill through",
      "Market structure has changed since FVG formation",
    ],
    confirmationChecklist: [
      "FVG is clearly identified with 3-candle structure",
      "Gap is untouched or only partially filled",
      "Rejection candle appears inside the gap",
      "Higher timeframe trend aligns with the FVG bias",
      "Volume increases on rejection signal",
    ],
    commonMistakes: [
      "Entering before price reaches the FVG — waiting for it to come to you",
      "Assuming every FVG gets filled — some FVGs act as continuation signals",
      "Using low timeframe FVGs against HTF structure — low probability",
      "Not accounting for fully filled FVGs — they lose their significance",
    ],
    educationalNote: "FVGs represent institutional imbalance — price moved so fast that fair two-sided trading didn't occur. Markets 'fill the gaps' as they seek balance. An FVG reclaim is the market returning to fill that imbalance, often reversing from it once balance is restored.",
  },
  {
    id: "order-block-bounce",
    name: "Order Block Bounce",
    icon: "🏛️",
    type: "OB Bounce",
    color: "#ef4444",
    bestSessions: ["Any session", "Best during institutional hours"],
    setupRules: [
      "Identify the order block: last opposing candle before a strong impulsive move",
      "Bullish OB: last bearish candle before a major bullish displacement",
      "Bearish OB: last bullish candle before a major bearish displacement",
      "The displacement must break structure — not just a random move",
      "Wait for price to return into the order block zone",
    ],
    entryFramework: [
      "Entry: price enters the OB and shows rejection (wick or body rejection)",
      "Bullish OB: entry at the top 50% of the OB zone",
      "Bearish OB: entry at the lower 50% of the OB zone",
      "Stop: fully beyond the OB (below OB low for bullish, above OB high for bearish)",
      "Target: original displacement target (prior structure level)",
    ],
    invalidation: [
      "Price closes through the entire order block — OB is mitigated (no longer valid)",
      "New lower high / higher low forms before reaching the OB — structure change",
      "OB is on a very old timeframe — too many price visits weaken it",
      "Counter to dominant HTF trend without clear structure shift",
    ],
    confirmationChecklist: [
      "Order block clearly identified with displacement following it",
      "OB is unmitigated (price hasn't fully returned to it before)",
      "Rejection signal appears inside the OB zone",
      "Trend on higher timeframe supports the bounce direction",
      "Not entering into an OB that's already been fully mitigated",
    ],
    commonMistakes: [
      "Treating every prior candle as an order block — needs displacement confirmation",
      "Entering early before price reaches the OB — wait for it to come to you",
      "Ignoring that the OB has been fully mitigated by prior price action",
      "Using low timeframe OBs against daily/weekly trend — low probability",
    ],
    educationalNote: "Order blocks represent large institutional orders at specific price levels. When price returns to these levels, the same institutional interest often absorbs the move, creating a bounce. The 'order' was never fully filled — remaining buy/sell pressure sits at that level.",
  },
  {
    id: "trend-pullback",
    name: "Trend Pullback",
    icon: "📉",
    type: "Pullback",
    color: "#06b6d4",
    bestSessions: ["All sessions", "Avoid during news"],
    setupRules: [
      "Confirm the trend: at least 2 consecutive HH/HL (uptrend) or LH/LL (downtrend)",
      "Wait for a pullback: price retraces 38.2–61.8% of the prior impulse leg",
      "The pullback should be on lower volume than the impulse",
      "Look for a consolidation or rejection at a structure level during the pullback",
      "Entry on resumption of trend direction",
    ],
    entryFramework: [
      "Entry: first strong candle in the trend direction after the pullback",
      "Or break of the consolidation range during the pullback",
      "Stop: below the pullback low (uptrend) or above the pullback high (downtrend)",
      "Target 1: 1.5–2x risk from entry",
      "Target 2: prior swing high/low projection",
    ],
    invalidation: [
      "Pullback breaks the prior HH/HL structure — trend is invalidated",
      "Volume increases significantly during the pullback — looks like reversal, not retracement",
      "Pullback retraces more than 78.6% of the impulse without recovery",
      "New LH forms in an uptrend — structure shift",
    ],
    confirmationChecklist: [
      "Clear trend established with at least 2 structural swings",
      "Pullback volume is less than impulse volume",
      "Pullback reaches a structure level (prior resistance-turned-support, etc.)",
      "Rejection or consolidation appears at the pullback level",
      "Trend instrument (SPY for large-cap stocks) confirms",
    ],
    commonMistakes: [
      "Entering on first red candle in an uptrend — that's not a confirmed pullback level",
      "Chasing when the pullback didn't materialize and buying into new highs",
      "Holding through a structure break — the trend has changed",
      "Conflating consolidation (normal) with reversal (end of trend)",
    ],
    educationalNote: "Markets don't move in straight lines — they advance in impulse-correction cycles. Trend pullbacks let you enter in the direction of institutional momentum at a lower-risk entry point rather than chasing an extended move.",
  },
  {
    id: "gap-fill",
    name: "Gap Fill",
    icon: "🎯",
    type: "Gap Fill",
    color: "#f97316",
    bestSessions: ["Pre-market / New York open", "Earnings gaps"],
    setupRules: [
      "A gap exists between yesterday's close and today's open",
      "Gaps below 3% have high fill probability on the same day",
      "Gap fill direction: price moves back toward yesterday's close",
      "Gaps above 5% on earnings often hold — avoid fading these",
      "Best gaps to fill: index ETFs (SPY, QQQ) and liquid large-caps",
    ],
    entryFramework: [
      "Entry: on the open or first pullback in gap-fill direction",
      "Watch for initial momentum direction — gaps often test the opening high/low first",
      "Stop: if price moves further from the gap (gap extends) — exit",
      "Target: 50% of the gap, then full fill (prior day's close)",
      "Partial exit at 50% fill, hold remainder for full fill",
    ],
    invalidation: [
      "Gap is due to major earnings or news — holds or extends more often",
      "SPY/QQQ gapping strongly in the same direction — continuation more likely",
      "After 2 hours the gap hasn't started filling — bias shifts",
      "Volume pattern confirms continuation, not reversal",
    ],
    confirmationChecklist: [
      "Gap is less than 5% for high-probability fill",
      "No major catalyst (earnings, FDA, macro) behind the gap",
      "SPY/QQQ not strongly supporting the gap direction",
      "First 15m candle shows rejection toward the gap fill direction",
      "Volume not confirming gap extension",
    ],
    commonMistakes: [
      "Fading earnings gaps — high-gap earnings moves often trend all day",
      "Entering too early without seeing initial price reaction",
      "Not accounting for gap fill being a slow multi-hour process",
      "Expecting a full fill — taking partial profits at 50% improves win rate",
    ],
    educationalNote: "Statistical gap fill rates favor fills on smaller, non-catalyst gaps. The thesis: if no new information justified the overnight gap, the same participants who moved overnight will close their position early in the session, filling the gap.",
  },
];

export default function PlaybooksPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = PLAYBOOKS.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.type.toLowerCase().includes(search.toLowerCase())
  );

  const activePlaybook = PLAYBOOKS.find(p => p.id === selected);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0b0d" }}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 pt-8 pb-24">
        {/* Header */}
        <div className="mb-8">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-3"
            style={{ background: "rgba(0,212,255,0.08)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.2)" }}
          >
            📖 Strategy Playbooks
          </div>
          <h1 className="text-3xl font-bold" style={{ color: "#e8eaf0" }}>
            Strategy <span style={{ color: "#00d4ff" }}>Playbooks</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: "#9aa0b4" }}>
            8 proven setups · Full entry/exit framework · Common mistakes · Educational only
          </p>
        </div>

        <div className="flex gap-6 flex-col md:flex-row">
          {/* Sidebar */}
          <div className="md:w-72 flex-shrink-0">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search playbooks..."
              className="w-full text-xs px-3 py-2 rounded-lg outline-none mb-3"
              style={{ background: "#0f1117", border: "1px solid #1e2433", color: "#e8eaf0" }}
            />
            <div className="space-y-1.5">
              {filtered.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelected(p.id === selected ? null : p.id)}
                  className="w-full text-left rounded-xl px-4 py-3 transition-all"
                  style={{
                    background: selected === p.id ? `${p.color}15` : "#0f1117",
                    border: `1px solid ${selected === p.id ? `${p.color}35` : "#1e2433"}`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span>{p.icon}</span>
                    <span className="text-sm font-medium" style={{ color: selected === p.id ? p.color : "#e8eaf0" }}>{p.name}</span>
                  </div>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{ background: `${p.color}15`, color: p.color }}
                  >
                    {p.type}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Detail panel */}
          <div className="flex-1 min-w-0">
            {!activePlaybook ? (
              <div
                className="rounded-2xl p-12 text-center"
                style={{ background: "#0f1117", border: "1px solid #1e2433" }}
              >
                <p className="text-3xl mb-4">📖</p>
                <p className="text-sm font-medium mb-1" style={{ color: "#e8eaf0" }}>Select a Playbook</p>
                <p className="text-xs" style={{ color: "#5a6075" }}>
                  Click any strategy on the left to see the full setup rules, entry framework, and common mistakes.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Header */}
                <div
                  className="rounded-2xl p-5"
                  style={{ background: "#0f1117", border: `1px solid ${activePlaybook.color}30` }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{activePlaybook.icon}</span>
                    <div>
                      <h2 className="text-xl font-bold" style={{ color: "#e8eaf0" }}>{activePlaybook.name}</h2>
                      <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: `${activePlaybook.color}15`, color: activePlaybook.color }}>
                        {activePlaybook.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {activePlaybook.bestSessions.map(s => (
                      <span key={s} className="text-xs px-2.5 py-1 rounded-full" style={{ background: "#141720", color: "#9aa0b4", border: "1px solid #1e2433" }}>
                        ⏰ {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Setup Rules */}
                  <div className="rounded-2xl p-4" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: activePlaybook.color }}>Setup Rules</p>
                    <ul className="space-y-2">
                      {activePlaybook.setupRules.map((r, i) => (
                        <li key={i} className="flex gap-2 text-xs" style={{ color: "#9aa0b4" }}>
                          <span className="flex-shrink-0 font-bold" style={{ color: activePlaybook.color }}>{i + 1}.</span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Entry Framework */}
                  <div className="rounded-2xl p-4" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#10b981" }}>Entry Framework</p>
                    <ul className="space-y-2">
                      {activePlaybook.entryFramework.map((r, i) => (
                        <li key={i} className="flex gap-2 text-xs" style={{ color: "#9aa0b4" }}>
                          <span className="flex-shrink-0">→</span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Invalidation */}
                  <div className="rounded-2xl p-4" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#ef4444" }}>Invalidation Conditions</p>
                    <ul className="space-y-2">
                      {activePlaybook.invalidation.map((r, i) => (
                        <li key={i} className="flex gap-2 text-xs" style={{ color: "#9aa0b4" }}>
                          <span className="flex-shrink-0 text-red-500">✕</span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Confirmation Checklist */}
                  <div className="rounded-2xl p-4" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#00d4ff" }}>Confirmation Checklist</p>
                    <ul className="space-y-2">
                      {activePlaybook.confirmationChecklist.map((r, i) => (
                        <li key={i} className="flex gap-2 text-xs" style={{ color: "#9aa0b4" }}>
                          <span className="flex-shrink-0" style={{ color: "#00d4ff" }}>☐</span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Common Mistakes */}
                <div className="rounded-2xl p-4" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#f59e0b" }}>Common Mistakes</p>
                  <div className="grid md:grid-cols-2 gap-2">
                    {activePlaybook.commonMistakes.map((m, i) => (
                      <div key={i} className="flex gap-2 text-xs rounded-lg px-3 py-2" style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)" }}>
                        <span className="flex-shrink-0">⚠️</span>
                        <span style={{ color: "#9aa0b4" }}>{m}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Educational Note */}
                <div className="rounded-2xl p-4" style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)" }}>
                  <p className="text-xs font-bold mb-2" style={{ color: "#00d4ff" }}>Why This Works — Educational Context</p>
                  <p className="text-xs leading-relaxed" style={{ color: "#9aa0b4" }}>{activePlaybook.educationalNote}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <div
          className="mt-8 rounded-xl p-4 flex gap-3 items-start"
          style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)" }}
        >
          <span className="text-lg flex-shrink-0">⚠️</span>
          <p className="text-xs leading-relaxed" style={{ color: "#9aa0b4" }}>
            <strong style={{ color: "#f59e0b" }}>Educational content only.</strong>{" "}
            These playbooks describe trading concepts for educational purposes. They are not trade recommendations, and no outcome is guaranteed. Real trading carries risk of loss. Complete the Academy and extensive paper trading before applying any strategy with real capital.
          </p>
        </div>
      </div>
    </div>
  );
}

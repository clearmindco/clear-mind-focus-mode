"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";

const SECTIONS = [
  {
    id: "academy",
    href: "/academy",
    icon: "🎓",
    label: "EDGE Academy",
    sub: "Trading Education",
    desc: "10 structured modules from trading basics to advanced investor movement analysis. Gated quizzes, checklists, and a Final Readiness Test before you risk real capital.",
    color: "#00d4ff",
    stats: ["10 Modules", "Quizzes + Checklists", "Final Readiness Test"],
    badge: "LIVE",
    badgeColor: "#10b981",
    badgeBg: "rgba(16,185,129,0.1)",
  },
  {
    id: "terminal",
    href: "/terminal",
    icon: "📡",
    label: "EDGE Terminal",
    sub: "Market Intelligence",
    desc: "Curated watchlist with live price quotes, trend analysis, catalyst tracking, entry zones, and TradingView charts. SPY, QQQ, TLT, XLE, NVDA, TSLA and more.",
    color: "#10b981",
    stats: ["7 Tickers", "Live Quotes", "TradingView Charts"],
    badge: "LIVE",
    badgeColor: "#10b981",
    badgeBg: "rgba(16,185,129,0.1)",
  },
  {
    id: "research",
    href: "/research",
    icon: "🔬",
    label: "EDGE Research Lab",
    sub: "Macro & Flow Analysis",
    desc: "Structured research across Fed policy, bonds, energy, China, AI/semis, congressional trades, insider activity, and small-cap catalysts — with bullish/bearish examples for each.",
    color: "#8b5cf6",
    stats: ["11 Research Areas", "Macro + Flow", "Catalyst Tracking"],
    badge: "PREVIEW",
    badgeColor: "#f59e0b",
    badgeBg: "rgba(245,158,11,0.1)",
  },
  {
    id: "whale-tracker",
    href: "/whale-tracker",
    icon: "🐋",
    label: "EDGE Whale Tracker",
    sub: "Smart Money Intelligence",
    desc: "Track unusual options flow, insider Form 4 purchases, congressional STOCK Act disclosures, institutional 13F accumulation, and large block trade alerts — all clearly labeled.",
    color: "#a78bfa",
    stats: ["Options Flow", "Insider + Congress", "13F Institutions"],
    badge: "PREVIEW",
    badgeColor: "#f59e0b",
    badgeBg: "rgba(245,158,11,0.1)",
  },
  {
    id: "paper-lab",
    href: "/paper-lab",
    icon: "📊",
    label: "EDGE Paper Lab",
    sub: "Paper Trade Tracker",
    desc: "Document every simulated trade with full thesis, auto position sizing, emotional state tracking, and a performance dashboard. Build discipline before risking real capital.",
    color: "#f59e0b",
    stats: ["Position Sizing", "Emotional Tracking", "Performance Dashboard"],
    badge: "LIVE",
    badgeColor: "#10b981",
    badgeBg: "rgba(16,185,129,0.1)",
  },
  {
    id: "market-war-room",
    href: "/market-war-room",
    icon: "⚔️",
    label: "EDGE Market War Room",
    sub: "Session Intelligence & Live Analysis",
    desc: "Session playbooks for Asian, London, New York, and Overlap. TradingView advanced chart with VWAP. AI-powered A+/A/B/C/NO TRADE setup grading. The operating room for active traders.",
    color: "#ef4444",
    stats: ["4 Session Playbooks", "Live Chart + VWAP", "AI Setup Grader"],
    badge: "NEW",
    badgeColor: "#ef4444",
    badgeBg: "rgba(239,68,68,0.1)",
  },
  {
    id: "market-command-center",
    href: "/market-command-center",
    icon: "📊",
    label: "EDGE Market Command Center",
    sub: "Institutional-Style Market Intelligence",
    desc: "Market overview (SPY, QQQ, VIX, DXY proxy), sector heatmap, breadth analysis, personal watchlist with localStorage persistence, economic calendar, and categorized news intelligence with 'why this matters' context.",
    color: "#00d4ff",
    stats: ["8 Market Instruments", "Sector Heatmap", "News Intelligence"],
    badge: "NEW",
    badgeColor: "#00d4ff",
    badgeBg: "rgba(0,212,255,0.1)",
  },
  {
    id: "trade-engine",
    href: "/trade-engine",
    icon: "⚡",
    label: "EDGE Trade Decision Engine",
    sub: "Precision ORB · Risk Box · Thesis",
    desc: "Institutional-grade trade decision engine: ORB breakout detection (5m/15m/30m), retest confirmation, 8-factor confidence scoring (0–100), visual risk box with entry/stop/target/R:R, full structured thesis (market context, structure, volume, ICT, session, liquidity), and one-click Paper Lab logging.",
    color: "#00d4ff",
    stats: ["ORB Engine", "8-Factor Scoring", "Structured Thesis"],
    badge: "NEW",
    badgeColor: "#00d4ff",
    badgeBg: "rgba(0,212,255,0.1)",
  },
  {
    id: "live-edge-scanner",
    href: "/live-edge-scanner",
    icon: "🎯",
    label: "EDGE Market Edge Scanner",
    sub: "Edge Detection · Mispricing Engine",
    desc: "Institutional-grade edge scanner: detects possible mispricing vs SMA20 fair value across 27 liquid instruments. Edge Score 0–100, signal labels (STRONG EDGE / WATCH / NO EDGE / AVOID), risk engine, honesty layer (why this could be wrong), and Paper Edge Journal with win/loss tracking.",
    color: "#10b981",
    stats: ["Edge Score 0–100", "SMA20 Fair Value", "Paper Edge Journal"],
    badge: "NEW",
    badgeColor: "#10b981",
    badgeBg: "rgba(16,185,129,0.1)",
  },
  {
    id: "scanner",
    href: "/scanner",
    icon: "📡",
    label: "EDGE Momentum Scanner",
    sub: "Live Movers · Setup Quality Scoring",
    desc: "Live scanner for stocks making significant intraday moves. Filters: top gainers, top losers, high relative volume, ATR expansion. Setup quality scored A+ through C based on move magnitude, relative volume, and volatility expansion.",
    color: "#10b981",
    stats: ["Top Gainers/Losers", "Relative Volume", "A+ to C Scoring"],
    badge: "NEW",
    badgeColor: "#10b981",
    badgeBg: "rgba(16,185,129,0.1)",
  },
  {
    id: "market-structure",
    href: "/market-structure",
    icon: "🔬",
    label: "EDGE Market Structure",
    sub: "ICT Analysis Engine",
    desc: "ICT-informed market structure analysis: Fair Value Gap detection, Order Block identification, Equilibrium zones, Liquidity sweep detection, Breaker blocks, and HH/HL/LH/LL structure labeling. Daily, 1H, 15m, 5m timeframes.",
    color: "#8b5cf6",
    stats: ["FVG Detection", "Order Blocks", "Liq Sweeps"],
    badge: "NEW",
    badgeColor: "#8b5cf6",
    badgeBg: "rgba(139,92,246,0.1)",
  },
  {
    id: "playbooks",
    href: "/playbooks",
    icon: "📖",
    label: "EDGE Strategy Playbooks",
    sub: "8 Proven Setup Frameworks",
    desc: "Detailed interactive playbooks for ORB, VWAP Reclaim, Liquidity Sweep Reversal, Break & Retest, FVG Reclaim, Order Block Bounce, Trend Pullback, and Gap Fill. Each includes setup rules, entry framework, invalidation, checklist, and common mistakes.",
    color: "#f59e0b",
    stats: ["8 Playbooks", "Entry + Exit Rules", "Common Mistakes"],
    badge: "NEW",
    badgeColor: "#f59e0b",
    badgeBg: "rgba(245,158,11,0.1)",
  },
];

export default function PlatformHub() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0b0d" }}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 pt-16 pb-24">
        {/* Hero */}
        <div className="text-center mb-16">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
            style={{ background: "rgba(0,212,255,0.08)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.2)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            Full Trading Development Platform
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-5 tracking-tight" style={{ color: "#e8eaf0" }}>
            EDGE<span style={{ color: "#00d4ff" }}>OS</span>
          </h1>
          <p className="text-xl md:text-2xl max-w-2xl mx-auto mb-4" style={{ color: "#9aa0b4" }}>
            Trading education · Market intelligence · War Room · Smart money tracking · Paper trade discipline
          </p>
          <p className="text-sm" style={{ color: "#5a6075" }}>
            The complete platform for developing your trading edge — before risking real capital.
          </p>
        </div>

        {/* Section cards */}
        <div className="grid md:grid-cols-2 gap-5 mb-12">
          {SECTIONS.map(s => (
            <Link
              key={s.id}
              href={s.href}
              className="group block rounded-2xl p-6 transition-all duration-200"
              style={{
                background: "#0f1117",
                border: "1px solid #1e2433",
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: `${s.color}10`, border: `1px solid ${s.color}25` }}
                  >
                    {s.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-base" style={{ color: "#e8eaf0" }}>{s.label}</span>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded font-medium"
                        style={{ background: s.badgeBg, color: s.badgeColor }}
                      >
                        {s.badge}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: s.color }}>{s.sub}</p>
                  </div>
                </div>
                <span className="text-lg transition-transform duration-200 group-hover:translate-x-1" style={{ color: "#5a6075" }}>→</span>
              </div>

              <p className="text-sm leading-relaxed mb-4" style={{ color: "#9aa0b4" }}>{s.desc}</p>

              <div className="flex gap-2 flex-wrap">
                {s.stats.map(stat => (
                  <span
                    key={stat}
                    className="text-xs px-2.5 py-1 rounded-full"
                    style={{ background: "#141720", color: "#5a6075", border: "1px solid #1e2433" }}
                  >
                    {stat}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>

        {/* Workflow bar */}
        <div
          className="rounded-2xl p-6 mb-8"
          style={{ background: "#0f1117", border: "1px solid #1e2433" }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-4 text-center" style={{ color: "#5a6075" }}>
            Your Development Path
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {[
              { step: "1", label: "Academy", color: "#00d4ff" },
              { step: "→", label: "", color: "#2a3048" },
              { step: "2", label: "Research Lab", color: "#8b5cf6" },
              { step: "→", label: "", color: "#2a3048" },
              { step: "3", label: "Terminal", color: "#10b981" },
              { step: "→", label: "", color: "#2a3048" },
              { step: "4", label: "Whale Tracker", color: "#a78bfa" },
              { step: "→", label: "", color: "#2a3048" },
              { step: "5", label: "Paper Lab", color: "#f59e0b" },
              { step: "→", label: "", color: "#2a3048" },
              { step: "6", label: "Live Trading", color: "#ef4444" },
            ].map((item, i) =>
              item.label ? (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: `${item.color}15`, color: item.color, border: `1px solid ${item.color}30` }}
                  >
                    {item.step}
                  </div>
                  <span className="text-xs" style={{ color: "#5a6075" }}>{item.label}</span>
                </div>
              ) : (
                <span key={i} className="text-lg font-light mb-4" style={{ color: "#2a3048" }}>→</span>
              )
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <div
          className="rounded-xl p-4 flex gap-3 items-start"
          style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)" }}
        >
          <span className="text-lg flex-shrink-0">⚠️</span>
          <p className="text-xs leading-relaxed" style={{ color: "#9aa0b4" }}>
            <strong style={{ color: "#f59e0b" }}>Educational platform only.</strong> EDGE OS provides educational content and does not provide investment advice, financial recommendations, or guarantees of any kind. All terminal data and research content are clearly labeled as placeholder or educational material. Trading involves substantial risk of loss. Complete the Academy and paper trade extensively before using real capital.
          </p>
        </div>
      </div>
    </div>
  );
}

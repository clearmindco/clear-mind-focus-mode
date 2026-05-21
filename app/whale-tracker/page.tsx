"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";

// ─── Placeholder data — clearly labeled, never live ──────────────────────────

interface OptionsFlow {
  id: string;
  ticker: string;
  type: "Call" | "Put";
  strike: string;
  expiry: string;
  premium: string;
  size: string;
  sentiment: "Bullish" | "Bearish";
  confidence: "High" | "Medium" | "Low";
  timeAgo: string;
  note: string;
}

interface InsiderRow {
  id: string;
  ticker: string;
  name: string;
  title: string;
  type: "Purchase" | "Sale";
  shares: string;
  price: string;
  value: string;
  date: string;
  sentiment: "Bullish" | "Bearish";
}

interface CongressRow {
  id: string;
  ticker: string;
  representative: string;
  party: string;
  type: string;
  amount: string;
  tradeDate: string;
  filedDate: string;
  sentiment: "Bullish" | "Bearish";
}

interface InstitutionalRow {
  id: string;
  ticker: string;
  fund: string;
  action: "Accumulating" | "Distributing" | "New Position" | "Exiting";
  shares: string;
  value: string;
  quarter: string;
  sentiment: "Bullish" | "Bearish";
}

interface WhaleAlert {
  id: string;
  ticker: string;
  type: string;
  size: string;
  price: string;
  sentiment: "Bullish" | "Bearish";
  confidence: "High" | "Medium" | "Low";
  timeAgo: string;
  note: string;
}

const PLACEHOLDER_OPTIONS: OptionsFlow[] = [
  { id: "1", ticker: "NVDA", type: "Call", strike: "$950", expiry: "30 DTE", premium: "$2.4M", size: "4,000 contracts", sentiment: "Bullish", confidence: "High", timeAgo: "2h ago", note: "Aggressive sweep above ask — possible directional bet" },
  { id: "2", ticker: "SPY", type: "Put", strike: "$540", expiry: "7 DTE", premium: "$1.1M", size: "8,500 contracts", sentiment: "Bearish", confidence: "Medium", timeAgo: "3h ago", note: "Could be hedging a long portfolio — context needed" },
  { id: "3", ticker: "TSLA", type: "Call", strike: "$300", expiry: "45 DTE", premium: "$880K", size: "2,200 contracts", sentiment: "Bullish", confidence: "Medium", timeAgo: "5h ago", note: "Unusual size at a round-number strike above current price" },
  { id: "4", ticker: "QQQ", type: "Put", strike: "$470", expiry: "14 DTE", premium: "$3.2M", size: "12,000 contracts", sentiment: "Bearish", confidence: "High", timeAgo: "6h ago", note: "Very large — likely institutional portfolio hedge, not directional" },
  { id: "5", ticker: "AMD", type: "Call", strike: "$180", expiry: "21 DTE", premium: "$560K", size: "3,100 contracts", sentiment: "Bullish", confidence: "Low", timeAgo: "7h ago", note: "Smaller sweep — mixed signals with recent supply concerns" },
];

const PLACEHOLDER_INSIDERS: InsiderRow[] = [
  { id: "1", ticker: "NVDA", name: "Jensen Huang", title: "CEO", type: "Sale", shares: "120,000", price: "$875", value: "$105M", date: "2025-05-10", sentiment: "Bearish" },
  { id: "2", ticker: "META", name: "Sheryl Sandberg", title: "Board Director", type: "Sale", shares: "45,000", price: "$512", value: "$23M", date: "2025-05-08", sentiment: "Bearish" },
  { id: "3", ticker: "SMCI", name: "Charles Liang", title: "CEO", type: "Purchase", shares: "200,000", price: "$38", value: "$7.6M", date: "2025-05-07", sentiment: "Bullish" },
  { id: "4", ticker: "XOM", name: "Darren Woods", title: "CEO", type: "Purchase", shares: "50,000", price: "$112", value: "$5.6M", date: "2025-05-05", sentiment: "Bullish" },
  { id: "5", ticker: "AAPL", name: "Tim Cook", title: "CEO", type: "Sale", shares: "511,000", price: "$198", value: "$101M", date: "2025-05-03", sentiment: "Bearish" },
];

const PLACEHOLDER_CONGRESS: CongressRow[] = [
  { id: "1", ticker: "NVDA", representative: "Nancy Pelosi", party: "D", type: "Call Purchase", amount: "$500K – $1M", tradeDate: "2025-04-22", filedDate: "2025-05-06", sentiment: "Bullish" },
  { id: "2", ticker: "LMT", representative: "Michael McCaul", party: "R", type: "Purchase", amount: "$50K – $100K", tradeDate: "2025-04-15", filedDate: "2025-04-30", sentiment: "Bullish" },
  { id: "3", ticker: "RTX", representative: "Rob Wittman", party: "R", type: "Purchase", amount: "$15K – $50K", tradeDate: "2025-04-14", filedDate: "2025-04-29", sentiment: "Bullish" },
  { id: "4", ticker: "UNH", representative: "Brian Higgins", party: "D", type: "Sale", amount: "$50K – $100K", tradeDate: "2025-04-10", filedDate: "2025-04-25", sentiment: "Bearish" },
  { id: "5", ticker: "MSFT", representative: "Josh Gottheimer", party: "D", type: "Purchase", amount: "$100K – $250K", tradeDate: "2025-04-08", filedDate: "2025-04-23", sentiment: "Bullish" },
];

const PLACEHOLDER_INSTITUTIONAL: InstitutionalRow[] = [
  { id: "1", ticker: "NVDA", fund: "Vanguard Group", action: "Accumulating", shares: "+12.4M", value: "+$10.8B", quarter: "Q1 2025", sentiment: "Bullish" },
  { id: "2", ticker: "TSLA", fund: "Ark Invest", action: "Accumulating", shares: "+3.2M", value: "+$640M", quarter: "Q1 2025", sentiment: "Bullish" },
  { id: "3", ticker: "BABA", fund: "Bridgewater", action: "Exiting", shares: "-8.5M", value: "-$720M", quarter: "Q1 2025", sentiment: "Bearish" },
  { id: "4", ticker: "GLD", fund: "BlackRock", action: "New Position", shares: "+5.1M", value: "+$980M", quarter: "Q1 2025", sentiment: "Bullish" },
  { id: "5", ticker: "INTC", fund: "Renaissance Tech", action: "Distributing", shares: "-2.8M", value: "-$78M", quarter: "Q1 2025", sentiment: "Bearish" },
];

const PLACEHOLDER_WHALE_ALERTS: WhaleAlert[] = [
  { id: "1", ticker: "SPY", type: "Dark Pool Print", size: "$340M", price: "$545.20", sentiment: "Bullish", confidence: "Medium", timeAgo: "1h ago", note: "Above-ask dark pool execution — not confirmed directional" },
  { id: "2", ticker: "NVDA", type: "Block Trade", size: "$125M", price: "$876.50", sentiment: "Bullish", confidence: "High", timeAgo: "2h ago", note: "Institutional block — likely accumulation at key support" },
  { id: "3", ticker: "QQQ", type: "Dark Pool Print", size: "$520M", price: "$472.80", sentiment: "Bearish", confidence: "Low", timeAgo: "4h ago", note: "Large but ambiguous — could be portfolio rebalancing" },
  { id: "4", ticker: "XLE", type: "Block Trade", size: "$88M", price: "$91.40", sentiment: "Bullish", confidence: "Medium", timeAgo: "5h ago", note: "Energy sector accumulation ahead of OPEC meeting" },
];

// ─── Component ────────────────────────────────────────────────────────────────

type SentimentFilter = "all" | "Bullish" | "Bearish";
type ConfidenceFilter = "all" | "High" | "Medium" | "Low";

export default function WhaleTracker() {
  const [activeTab, setActiveTab] = useState<"options" | "insiders" | "congress" | "institutional" | "alerts">("options");
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>("all");
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceFilter>("all");
  const [tickerFilter, setTickerFilter] = useState("");

  function filterByTicker<T extends { ticker: string }>(rows: T[]): T[] {
    if (!tickerFilter.trim()) return rows;
    return rows.filter(r => r.ticker.toLowerCase().includes(tickerFilter.toLowerCase()));
  }

  function filterBySentiment<T extends { sentiment: "Bullish" | "Bearish" }>(rows: T[]): T[] {
    if (sentimentFilter === "all") return rows;
    return rows.filter(r => r.sentiment === sentimentFilter);
  }

  const TABS = [
    { key: "options", label: "Options Flow", icon: "🌊", color: "#a78bfa" },
    { key: "insiders", label: "Insider Trades", icon: "🔍", color: "#f97316" },
    { key: "congress", label: "Congressional", icon: "🏛️", color: "#8b5cf6" },
    { key: "institutional", label: "Institutions", icon: "🏦", color: "#06b6d4" },
    { key: "alerts", label: "Whale Alerts", icon: "🐋", color: "#10b981" },
  ] as const;

  const activeTabMeta = TABS.find(t => t.key === activeTab)!;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0b0d" }}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 pt-10 pb-20">
        {/* Header */}
        <div className="mb-8">
          <div
            className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium mb-3"
            style={{ background: "rgba(167,139,250,0.1)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.25)" }}
          >
            🐋 Smart Money Tracking
          </div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: "#e8eaf0" }}>
            EDGE <span style={{ color: "#a78bfa" }}>Whale Tracker</span>
          </h1>
          <p className="text-sm" style={{ color: "#9aa0b4" }}>
            Unusual options flow · Insider trades · Congressional activity · Institutional 13F · Whale alerts
          </p>
        </div>

        {/* Beginner explainer */}
        <div
          className="rounded-2xl p-5 mb-6"
          style={{ background: "#0f1117", border: "1px solid rgba(167,139,250,0.2)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#a78bfa" }}>
            🎓 What is a &quot;whale&quot; and why should beginners know about them?
          </p>
          <div className="grid md:grid-cols-3 gap-4 text-xs" style={{ color: "#9aa0b4" }}>
            <div>
              <p className="font-semibold mb-1" style={{ color: "#e8eaf0" }}>Who are the whales?</p>
              <p>Hedge funds, large institutions, insiders (executives), and politicians who trade millions of dollars at once. Their moves can push stock prices before the news becomes public.</p>
            </div>
            <div>
              <p className="font-semibold mb-1" style={{ color: "#e8eaf0" }}>Why does this matter?</p>
              <p>When multiple &quot;smart money&quot; signals point the same direction — a CEO buying stock, institutions accumulating, and unusual call options appearing — that convergence often precedes a major move.</p>
            </div>
            <div>
              <p className="font-semibold mb-1" style={{ color: "#e8eaf0" }}>Important caveat</p>
              <p>No single signal is a buy/sell trigger. Many large trades are hedges, routine rebalancing, or compensation sales. This tracker is context, not advice. Always paper trade first.</p>
            </div>
          </div>
        </div>

        {/* Placeholder warning */}
        <div
          className="rounded-xl p-4 flex gap-3 items-start mb-6"
          style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)" }}
        >
          <span className="text-base flex-shrink-0">⚠️</span>
          <div className="text-xs leading-relaxed" style={{ color: "#9aa0b4" }}>
            <strong style={{ color: "#f59e0b" }}>All data below is placeholder / sample data for educational demonstration only.</strong>{" "}
            No real trades are shown. Live unusual options flow requires a paid API (unusualwhales.com). Live insider and congressional data require Finnhub or quiverquant.com. Institutional 13F data has a 45-day lag by law and is available free from SEC EDGAR.
            {" "}<a href="/api-setup" style={{ color: "#00d4ff", textDecoration: "underline" }}>API Setup →</a>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1.5 flex-wrap mb-6">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="text-xs px-3 py-2 rounded-xl font-medium transition-all duration-150"
              style={{
                background: activeTab === tab.key ? `${tab.color}15` : "#0f1117",
                color: activeTab === tab.key ? tab.color : "#9aa0b4",
                border: activeTab === tab.key ? `1px solid ${tab.color}40` : "1px solid #1e2433",
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap items-center mb-5">
          <input
            type="text"
            placeholder="Filter by ticker…"
            value={tickerFilter}
            onChange={e => setTickerFilter(e.target.value.toUpperCase())}
            className="text-xs px-3 py-2 rounded-xl"
            style={{
              background: "#0f1117",
              border: "1px solid #1e2433",
              color: "#e8eaf0",
              outline: "none",
              width: "140px",
            }}
          />
          <div className="flex gap-1">
            {(["all", "Bullish", "Bearish"] as SentimentFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setSentimentFilter(f)}
                className="text-xs px-2.5 py-1.5 rounded-lg transition-all capitalize"
                style={{
                  background: sentimentFilter === f
                    ? f === "Bullish" ? "rgba(16,185,129,0.12)" : f === "Bearish" ? "rgba(239,68,68,0.12)" : "rgba(0,212,255,0.08)"
                    : "#0f1117",
                  color: sentimentFilter === f
                    ? f === "Bullish" ? "#10b981" : f === "Bearish" ? "#ef4444" : "#00d4ff"
                    : "#9aa0b4",
                  border: `1px solid ${sentimentFilter === f ? "currentColor" : "#1e2433"}`,
                }}
              >
                {f === "all" ? "All" : f === "Bullish" ? "▲ Bullish" : "▼ Bearish"}
              </button>
            ))}
          </div>
          {(activeTab === "options" || activeTab === "alerts") && (
            <div className="flex gap-1">
              {(["all", "High", "Medium", "Low"] as ConfidenceFilter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setConfidenceFilter(f)}
                  className="text-xs px-2.5 py-1.5 rounded-lg transition-all"
                  style={{
                    background: confidenceFilter === f ? "rgba(167,139,250,0.1)" : "#0f1117",
                    color: confidenceFilter === f ? "#a78bfa" : "#9aa0b4",
                    border: `1px solid ${confidenceFilter === f ? "rgba(167,139,250,0.3)" : "#1e2433"}`,
                  }}
                >
                  {f === "all" ? "Any Confidence" : f}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tab content */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: `1px solid ${activeTabMeta.color}25` }}
        >
          {/* Tab header */}
          <div
            className="px-5 py-4 flex items-center gap-3"
            style={{ background: "#0f1117", borderBottom: "1px solid #1e2433" }}
          >
            <span className="text-xl">{activeTabMeta.icon}</span>
            <div>
              <p className="font-semibold text-sm" style={{ color: "#e8eaf0" }}>{activeTabMeta.label}</p>
              <p className="text-xs" style={{ color: "#5a6075" }}>All entries are sample/placeholder data — not real trades</p>
            </div>
            <span
              className="ml-auto text-xs px-2 py-0.5 rounded font-semibold"
              style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}
            >
              PLACEHOLDER
            </span>
          </div>

          {/* Options Flow */}
          {activeTab === "options" && (
            <OptionsFlowTable
              rows={PLACEHOLDER_OPTIONS
                .filter(r => sentimentFilter === "all" || r.sentiment === sentimentFilter)
                .filter(r => confidenceFilter === "all" || r.confidence === confidenceFilter)
                .filter(r => !tickerFilter || r.ticker.includes(tickerFilter))}
            />
          )}

          {/* Insider Trades */}
          {activeTab === "insiders" && (
            <InsiderTable
              rows={filterBySentiment(filterByTicker(PLACEHOLDER_INSIDERS))}
            />
          )}

          {/* Congressional */}
          {activeTab === "congress" && (
            <CongressTable
              rows={filterBySentiment(filterByTicker(PLACEHOLDER_CONGRESS))}
            />
          )}

          {/* Institutional */}
          {activeTab === "institutional" && (
            <InstitutionalTable
              rows={filterBySentiment(filterByTicker(PLACEHOLDER_INSTITUTIONAL))}
            />
          )}

          {/* Whale Alerts */}
          {activeTab === "alerts" && (
            <WhaleAlertsTable
              rows={PLACEHOLDER_WHALE_ALERTS
                .filter(r => sentimentFilter === "all" || r.sentiment === sentimentFilter)
                .filter(r => confidenceFilter === "all" || r.confidence === confidenceFilter)
                .filter(r => !tickerFilter || r.ticker.includes(tickerFilter))}
            />
          )}
        </div>

        {/* Education callout */}
        <div
          className="mt-8 rounded-2xl p-6"
          style={{ background: "#0f1117", border: "1px solid #1e2433" }}
        >
          <p className="font-semibold text-sm mb-4" style={{ color: "#e8eaf0" }}>
            📚 How to use smart money signals — beginner guide
          </p>
          <div className="grid md:grid-cols-2 gap-4 text-xs" style={{ color: "#9aa0b4" }}>
            <div className="space-y-3">
              <div>
                <p className="font-semibold mb-1" style={{ color: "#a78bfa" }}>✓ Confluence = higher confidence</p>
                <p>One signal alone is weak. When unusual call sweeps + insider buying + institutional accumulation all appear in the same stock within weeks of each other, that convergence is meaningful context.</p>
              </div>
              <div>
                <p className="font-semibold mb-1" style={{ color: "#a78bfa" }}>✓ Most large options trades are hedges</p>
                <p>A $5M put sweep on SPY is often a fund protecting a long portfolio, not a bet the market crashes. A put sweep is not automatically bearish — always check if the trader bought or sold.</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="font-semibold mb-1" style={{ color: "#a78bfa" }}>✓ Congress + defense committee = defense sector</p>
                <p>When members of the Armed Services Committee buy defense stocks (LMT, RTX, NOC), check if there are pending defense budget votes. Pattern analysis is legal and public — trading on non-public info is not.</p>
              </div>
              <div>
                <p className="font-semibold mb-1" style={{ color: "#a78bfa" }}>✓ 13F data is 45 days old</p>
                <p>By law, institutional funds file 13F reports 45 days after quarter end. A fund that was &quot;accumulating&quot; in Q1 may have already exited by the time you see the filing. It&apos;s a lagging indicator — directional context, not a real-time signal.</p>
              </div>
            </div>
          </div>
        </div>

        {/* API roadmap */}
        <div
          className="mt-6 rounded-xl p-4 flex gap-3 items-start"
          style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.12)" }}
        >
          <span className="text-base flex-shrink-0">🔌</span>
          <div className="text-xs leading-relaxed space-y-1" style={{ color: "#9aa0b4" }}>
            <p className="font-semibold" style={{ color: "#00d4ff" }}>APIs needed for live data</p>
            <ul className="space-y-0.5">
              <li>• <strong style={{ color: "#e8eaf0" }}>Unusual options flow:</strong> unusualwhales.com (paid) · Barchart premium · Market Chameleon</li>
              <li>• <strong style={{ color: "#e8eaf0" }}>Live insider trades:</strong> Finnhub (<code>FINNHUB_API_KEY</code>) — free tier available</li>
              <li>• <strong style={{ color: "#e8eaf0" }}>Congressional trades:</strong> quiverquant.com (paid) · capitoltrades.com</li>
              <li>• <strong style={{ color: "#e8eaf0" }}>13F institutional:</strong> SEC EDGAR free API · Whalewisdom.com</li>
              <li>• <strong style={{ color: "#e8eaf0" }}>Dark pool / whale alerts:</strong> unusualwhales.com · Darkpool.com (paid)</li>
            </ul>
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "#5a6075" }}>
          Educational research only · Not financial advice · All data shown is sample/placeholder · Past whale activity does not predict future price movement · Always paper trade first
        </p>
      </div>
    </div>
  );
}

// ─── Sub-tables ───────────────────────────────────────────────────────────────

function SentimentBadge({ s }: { s: "Bullish" | "Bearish" }) {
  return (
    <span
      className="text-xs px-1.5 py-0.5 rounded font-semibold"
      style={{
        background: s === "Bullish" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
        color: s === "Bullish" ? "#10b981" : "#ef4444",
      }}
    >
      {s === "Bullish" ? "▲" : "▼"} {s}
    </span>
  );
}

function ConfBadge({ c }: { c: "High" | "Medium" | "Low" }) {
  const colors = { High: "#10b981", Medium: "#f59e0b", Low: "#5a6075" };
  return (
    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#141720", color: colors[c] }}>
      {c}
    </span>
  );
}

const thStyle: React.CSSProperties = { padding: "10px 12px", textAlign: "left", color: "#5a6075", fontWeight: 500, fontSize: "11px", whiteSpace: "nowrap" };
const tdStyle: React.CSSProperties = { padding: "10px 12px", fontSize: "12px", color: "#9aa0b4", whiteSpace: "nowrap" };
const trStyle: React.CSSProperties = { borderBottom: "1px solid #1e2433" };

function OptionsFlowTable({ rows }: { rows: OptionsFlow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full" style={{ background: "#0f1117" }}>
        <thead style={{ background: "#0a0b0d" }}>
          <tr>
            {["Time", "Ticker", "Type", "Strike", "Expiry", "Premium", "Size", "Sentiment", "Confidence", "Note"].map(h => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={10} style={{ ...tdStyle, textAlign: "center", padding: "24px" }}>No matching rows</td></tr>
          ) : rows.map(r => (
            <tr key={r.id} style={trStyle}>
              <td style={{ ...tdStyle, color: "#5a6075" }}>{r.timeAgo}</td>
              <td style={{ ...tdStyle, color: "#e8eaf0", fontWeight: 700 }}>{r.ticker}</td>
              <td style={{ ...tdStyle, color: r.type === "Call" ? "#10b981" : "#ef4444", fontWeight: 600 }}>{r.type}</td>
              <td style={tdStyle}>{r.strike}</td>
              <td style={tdStyle}>{r.expiry}</td>
              <td style={{ ...tdStyle, color: "#e8eaf0", fontWeight: 600 }}>{r.premium}</td>
              <td style={tdStyle}>{r.size}</td>
              <td style={tdStyle}><SentimentBadge s={r.sentiment} /></td>
              <td style={tdStyle}><ConfBadge c={r.confidence} /></td>
              <td style={{ ...tdStyle, color: "#5a6075", maxWidth: "200px", whiteSpace: "normal" }}>{r.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InsiderTable({ rows }: { rows: InsiderRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full" style={{ background: "#0f1117" }}>
        <thead style={{ background: "#0a0b0d" }}>
          <tr>
            {["Date", "Ticker", "Name", "Title", "Transaction", "Shares", "Price", "Value", "Signal"].map(h => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={9} style={{ ...tdStyle, textAlign: "center", padding: "24px" }}>No matching rows</td></tr>
          ) : rows.map(r => (
            <tr key={r.id} style={trStyle}>
              <td style={{ ...tdStyle, color: "#5a6075" }}>{r.date}</td>
              <td style={{ ...tdStyle, color: "#e8eaf0", fontWeight: 700 }}>{r.ticker}</td>
              <td style={tdStyle}>{r.name}</td>
              <td style={{ ...tdStyle, color: "#5a6075" }}>{r.title}</td>
              <td style={{ ...tdStyle, color: r.type === "Purchase" ? "#10b981" : "#ef4444", fontWeight: 600 }}>{r.type}</td>
              <td style={tdStyle}>{r.shares}</td>
              <td style={tdStyle}>${r.price}</td>
              <td style={{ ...tdStyle, color: "#e8eaf0", fontWeight: 600 }}>${r.value}</td>
              <td style={tdStyle}><SentimentBadge s={r.sentiment} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CongressTable({ rows }: { rows: CongressRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full" style={{ background: "#0f1117" }}>
        <thead style={{ background: "#0a0b0d" }}>
          <tr>
            {["Filed", "Ticker", "Representative", "Party", "Transaction", "Amount", "Trade Date", "Signal"].map(h => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={8} style={{ ...tdStyle, textAlign: "center", padding: "24px" }}>No matching rows</td></tr>
          ) : rows.map(r => (
            <tr key={r.id} style={trStyle}>
              <td style={{ ...tdStyle, color: "#5a6075" }}>{r.filedDate}</td>
              <td style={{ ...tdStyle, color: "#e8eaf0", fontWeight: 700 }}>{r.ticker}</td>
              <td style={tdStyle}>{r.representative}</td>
              <td style={tdStyle}>
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{
                    background: r.party === "D" ? "rgba(59,130,246,0.1)" : "rgba(239,68,68,0.1)",
                    color: r.party === "D" ? "#3b82f6" : "#ef4444",
                  }}
                >
                  {r.party}
                </span>
              </td>
              <td style={{ ...tdStyle, color: r.type.includes("Purchase") || r.type.includes("Call") ? "#10b981" : "#ef4444", fontWeight: 600 }}>{r.type}</td>
              <td style={tdStyle}>{r.amount}</td>
              <td style={{ ...tdStyle, color: "#5a6075" }}>{r.tradeDate}</td>
              <td style={tdStyle}><SentimentBadge s={r.sentiment} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InstitutionalTable({ rows }: { rows: InstitutionalRow[] }) {
  const actionColors: Record<string, string> = {
    "Accumulating": "#10b981",
    "New Position": "#00d4ff",
    "Distributing": "#ef4444",
    "Exiting": "#ef4444",
  };
  return (
    <div className="overflow-x-auto">
      <table className="w-full" style={{ background: "#0f1117" }}>
        <thead style={{ background: "#0a0b0d" }}>
          <tr>
            {["Quarter", "Ticker", "Fund / Institution", "Action", "Share Change", "$ Value", "Signal"].map(h => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={7} style={{ ...tdStyle, textAlign: "center", padding: "24px" }}>No matching rows</td></tr>
          ) : rows.map(r => (
            <tr key={r.id} style={trStyle}>
              <td style={{ ...tdStyle, color: "#5a6075" }}>{r.quarter}</td>
              <td style={{ ...tdStyle, color: "#e8eaf0", fontWeight: 700 }}>{r.ticker}</td>
              <td style={tdStyle}>{r.fund}</td>
              <td style={{ ...tdStyle, color: actionColors[r.action] ?? "#9aa0b4", fontWeight: 600 }}>{r.action}</td>
              <td style={{ ...tdStyle, color: r.shares.startsWith("+") ? "#10b981" : "#ef4444", fontWeight: 600 }}>{r.shares}</td>
              <td style={{ ...tdStyle, color: r.value.startsWith("+") ? "#10b981" : "#ef4444", fontWeight: 600 }}>{r.value}</td>
              <td style={tdStyle}><SentimentBadge s={r.sentiment} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WhaleAlertsTable({ rows }: { rows: WhaleAlert[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full" style={{ background: "#0f1117" }}>
        <thead style={{ background: "#0a0b0d" }}>
          <tr>
            {["Time", "Ticker", "Alert Type", "Size", "Price", "Sentiment", "Confidence", "Context"].map(h => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={8} style={{ ...tdStyle, textAlign: "center", padding: "24px" }}>No matching rows</td></tr>
          ) : rows.map(r => (
            <tr key={r.id} style={trStyle}>
              <td style={{ ...tdStyle, color: "#5a6075" }}>{r.timeAgo}</td>
              <td style={{ ...tdStyle, color: "#e8eaf0", fontWeight: 700 }}>{r.ticker}</td>
              <td style={{ ...tdStyle, color: "#a78bfa", fontWeight: 600 }}>{r.type}</td>
              <td style={{ ...tdStyle, color: "#e8eaf0", fontWeight: 600 }}>{r.size}</td>
              <td style={tdStyle}>${r.price}</td>
              <td style={tdStyle}><SentimentBadge s={r.sentiment} /></td>
              <td style={tdStyle}><ConfBadge c={r.confidence} /></td>
              <td style={{ ...tdStyle, color: "#5a6075", maxWidth: "200px", whiteSpace: "normal" }}>{r.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

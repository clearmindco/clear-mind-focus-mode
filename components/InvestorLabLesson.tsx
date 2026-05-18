"use client";

import { useState } from "react";

const BADGE_MOCK = "EXAMPLE DATA — Educational Only";

// ─── Scoring signals ──────────────────────────────────────────────────────────
const SIGNALS = [
  { id: "sentiment_rising",      label: "Sentiment Rising",           detail: "Mentions and search volume increasing",      score: +10, color: "#00d4ff",  icon: "📈" },
  { id: "insider_buying",        label: "Insider Buying",             detail: "Form 4 showing executive purchase",          score: +20, color: "#10b981",  icon: "✅" },
  { id: "institutional_accum",   label: "Institutional Accumulation", detail: "13F showing fund added shares",              score: +15, color: "#10b981",  icon: "🏛️" },
  { id: "congressional_buying",  label: "Congressional Buying",       detail: "STOCK Act disclosure shows politician buy",  score: +15, color: "#a855f7",  icon: "🏛️" },
  { id: "major_catalyst",        label: "Major News Catalyst",        detail: "Earnings beat, contract, FDA approval",      score: +20, color: "#f59e0b",  icon: "⚡" },
  { id: "technical_confirm",     label: "Technical Confirmation",     detail: "Breakout above resistance on volume",        score: +20, color: "#00d4ff",  icon: "📊" },
  { id: "insider_selling",       label: "Insider Selling",            detail: "Form 4 showing executive sale",              score: -10, color: "#f59e0b",  icon: "⚠️" },
  { id: "hype_warning",          label: "Overcrowded Hype Warning",   detail: "Everyone already talking — late-stage move", score: -20, color: "#ef4444", icon: "🚨" },
];

function calcOutput(checked: Set<string>): { label: string; color: string; bg: string; border: string; desc: string } {
  const total = SIGNALS.filter(s => checked.has(s.id)).reduce((sum, s) => sum + s.score, 0);
  const hype = checked.has("hype_warning");

  if (hype && total > 0) return { label: "⚠ High-Risk Hype", color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.3)", desc: "Signals look positive but overcrowded hype is active. Late buyers risk holding the bag when sentiment reverses." };
  if (total >= 50)        return { label: "● Bullish Watch",   color: "#10b981", bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.3)",  desc: "Multiple confluent signals. Strong context for a long setup — still requires chart confirmation and risk management." };
  if (total >= 20)        return { label: "◉ Neutral Watch",   color: "#00d4ff", bg: "rgba(0,212,255,0.08)",   border: "rgba(0,212,255,0.3)",   desc: "Some positive signals but not enough confluence. Wait for more data or a stronger chart setup before acting." };
  if (total < 0)          return { label: "● Bearish Watch",   color: "#ef4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.3)",   desc: "Negative signals dominate. Proceed with caution — not a setup for long trades without clear reversal evidence." };
  return                         { label: "◌ No Signal",       color: "#5a6075", bg: "rgba(90,96,117,0.08)",   border: "rgba(90,96,117,0.3)",   desc: "Not enough signals selected. Add more data points to generate a meaningful score." };
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const INSIDER_ROWS = [
  { insider: "James Carter", role: "CEO",      type: "BUY",  shares: "15,000", value: "$1.2M",  date: "Jan 15, 2025", meaning: "CEO bought $1.2M of his own company — high conviction signal. He has the most context of anyone." },
  { insider: "Sarah Chen",   role: "CFO",      type: "SELL", shares: "5,000",  value: "$400K",  date: "Jan 20, 2025", meaning: "CFO sold 5K shares — likely planned diversification or tax reasons. One sale alone is not alarming." },
  { insider: "Mike Torres",  role: "Director", type: "BUY",  shares: "8,000",  value: "$640K",  date: "Jan 22, 2025", meaning: "Director buying alongside CEO — pattern of accumulation. Multiple insiders buying is more meaningful than one." },
];

const INSTITUTION_ROWS = [
  { fund: "Vanguard Growth Fund",  ticker: "NVDA", action: "Added 2.1M shares",     value: "$820M", period: "Q3 2024", meaning: "Major passive fund adding — note data is 45+ days old. Price may have already moved significantly." },
  { fund: "BlackRock Core Equity", ticker: "AAPL", action: "Reduced 500K shares",   value: "$95M",  period: "Q3 2024", meaning: "Trimming a large position — normal portfolio rebalancing. Not necessarily bearish on AAPL." },
  { fund: "ARK Innovation ETF",    ticker: "TSLA", action: "Added 300K shares",      value: "$75M",  period: "Q3 2024", meaning: "Active fund conviction buy. ARK's trades are tracked widely — often moves sentiment in small-caps." },
];

const CONGRESS_ROWS = [
  { politician: "Rep. A. Johnson",  ticker: "NVDA", type: "BUY",  amount: "$500K–$1M",  delay: "43 days", link: "Sits on Commerce committee overseeing AI/chip policy. Bill expanding chip subsidies was under discussion." },
  { politician: "Sen. M. Williams", ticker: "RTX",  type: "BUY",  amount: "$100K–$250K", delay: "38 days", link: "Member of Armed Services Committee. Major defense appropriations bill passed 12 days after the trade." },
  { politician: "Rep. L. Brooks",   ticker: "LMT",  type: "SELL", amount: "$50K–$100K",  delay: "45 days", link: "Sold ahead of a defense contract restructuring — may have had no special knowledge. Sell data is less actionable." },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ label, color, icon }: { label: string; color: string; icon: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-xl">{icon}</span>
      <h2 className="text-base font-bold" style={{ color }}>{label}</h2>
    </div>
  );
}

function MockBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-mono font-medium mb-3"
      style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.25)" }}
    >
      ⚠ {BADGE_MOCK}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const buy = type === "BUY";
  return (
    <span
      className="inline-block text-xs font-bold px-2 py-0.5 rounded"
      style={{
        background: buy ? "rgba(16,185,129,0.12)" : type === "SELL" ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)",
        color: buy ? "#10b981" : type === "SELL" ? "#ef4444" : "#f59e0b",
      }}
    >
      {type}
    </span>
  );
}

function InfoCard({ color, icon, title, children }: { color: string; icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-5" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
      <p className="text-xs font-semibold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color }}>
        <span>{icon}</span>{title}
      </p>
      <div className="text-sm leading-relaxed" style={{ color: "#9aa0b4" }}>{children}</div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function InvestorLabLesson() {
  const [checkedSignals, setCheckedSignals] = useState<Set<string>>(new Set());
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const total = SIGNALS.filter(s => checkedSignals.has(s.id)).reduce((sum, s) => sum + s.score, 0);
  const output = calcOutput(checkedSignals);

  function toggleSignal(id: string) {
    setCheckedSignals(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-10 animate-fade-in">

      {/* ── Top Warning ── */}
      <div
        className="rounded-xl p-4 flex gap-3 items-start"
        style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)" }}
      >
        <span className="text-lg flex-shrink-0">⚠️</span>
        <div>
          <p className="text-xs font-bold mb-1" style={{ color: "#ef4444" }}>Important Disclosures</p>
          <ul className="text-xs space-y-0.5" style={{ color: "#9aa0b4" }}>
            <li>• Insider, institutional, and political data can be delayed by 30–90 days.</li>
            <li>• This is educational context — not a buy or sell signal.</li>
            <li>• Price action and risk management still come first. Always.</li>
            <li>• All tables on this page use mock example data for educational purposes.</li>
          </ul>
        </div>
      </div>

      {/* ── Section 1: Sentiment ── */}
      <div>
        <SectionHeader label="1. Mentions & Sentiment" color="#00d4ff" icon="📡" />
        <div className="space-y-4">
          <p className="text-sm leading-relaxed" style={{ color: "#9aa0b4" }}>
            When a stock starts appearing more often on Reddit, Twitter/X, Stocktwits, and financial news, attention is increasing. More attention can bring more buyers — which moves price. The question you need to answer: <strong style={{ color: "#e8eaf0" }}>am I early or am I late?</strong>
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            <InfoCard color="#10b981" icon="✅" title="Early Attention (Good)">
              Volume picking up quietly. Only a few traders talking. Price has not moved dramatically yet. This is where the opportunity lives.
            </InfoCard>
            <InfoCard color="#ef4444" icon="🚨" title="Crowded Hype (Danger)">
              Everyone is talking about it. Reddit threads, Twitter trending, news headlines. The early buyers are now the sellers. You are likely being sold to.
            </InfoCard>
          </div>
          <InfoCard color="#f59e0b" icon="⚠️" title="Tools You Can Use Later">
            Google Trends (search interest over time), Stocktwits (trader sentiment), Reddit mention trackers, and Finnhub news sentiment API. For MVP, research manually — check if the stock is appearing in financial media today.
          </InfoCard>
        </div>
      </div>

      {/* ── Section 2: Insider Activity ── */}
      <div>
        <SectionHeader label="2. Insider Activity — Form 4 Filings" color="#10b981" icon="📋" />
        <div className="space-y-4">
          <p className="text-sm leading-relaxed" style={{ color: "#9aa0b4" }}>
            US insiders (CEOs, CFOs, directors, 10%+ shareholders) must report personal stock trades to the SEC within 2 business days via a <strong style={{ color: "#e8eaf0" }}>Form 4 filing</strong>. These are public record on <strong style={{ color: "#00d4ff" }}>SEC EDGAR</strong>.
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            <InfoCard color="#10b981" icon="💚" title="Insider Buying — Pay Attention">
              The executive is using their own personal money. They have the most information about the business. Buying is voluntary and meaningful — especially large purchases by the CEO or multiple insiders in the same period.
            </InfoCard>
            <InfoCard color="#f59e0b" icon="⚠️" title="Insider Selling — Context Matters">
              Executives sell for many reasons: pre-planned 10b5-1 programs, tax obligations, diversification, estate planning. One sale is rarely significant. A pattern of heavy selling across multiple insiders in a short window is more concerning.
            </InfoCard>
          </div>
          <MockBadge />
          <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid #1e2433" }}>
            <table className="w-full text-xs min-w-[640px]">
              <thead>
                <tr style={{ background: "#0a0b0d" }}>
                  {["Insider", "Role", "Type", "Shares", "Value", "Date", "Expand"].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: "#5a6075" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {INSIDER_ROWS.map((row, i) => (
                  <>
                    <tr
                      key={row.insider}
                      className="cursor-pointer transition-colors"
                      style={{
                        borderBottom: expandedRow === `i${i}` ? "none" : "1px solid #1e2433",
                        background: expandedRow === `i${i}` ? "#141720" : "#0f1117",
                      }}
                      onClick={() => setExpandedRow(expandedRow === `i${i}` ? null : `i${i}`)}
                    >
                      <td className="px-4 py-3 font-semibold" style={{ color: "#e8eaf0" }}>{row.insider}</td>
                      <td className="px-4 py-3" style={{ color: "#9aa0b4" }}>{row.role}</td>
                      <td className="px-4 py-3"><TypeBadge type={row.type} /></td>
                      <td className="px-4 py-3 font-mono" style={{ color: "#9aa0b4" }}>{row.shares}</td>
                      <td className="px-4 py-3 font-bold" style={{ color: row.type === "BUY" ? "#10b981" : "#f59e0b" }}>{row.value}</td>
                      <td className="px-4 py-3" style={{ color: "#5a6075" }}>{row.date}</td>
                      <td className="px-4 py-3 text-center" style={{ color: "#5a6075" }}>{expandedRow === `i${i}` ? "▲" : "▼"}</td>
                    </tr>
                    {expandedRow === `i${i}` && (
                      <tr key={`exp-${i}`} style={{ borderBottom: "1px solid #1e2433" }}>
                        <td colSpan={7} className="px-4 pb-3 pt-1">
                          <div
                            className="rounded-lg px-4 py-3 text-xs leading-relaxed"
                            style={{
                              background: row.type === "BUY" ? "rgba(16,185,129,0.06)" : "rgba(245,158,11,0.06)",
                              borderLeft: `3px solid ${row.type === "BUY" ? "#10b981" : "#f59e0b"}`,
                              color: "#9aa0b4",
                            }}
                          >
                            <strong style={{ color: "#e8eaf0" }}>Beginner Meaning: </strong>{row.meaning}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs" style={{ color: "#5a6075" }}>→ Find real Form 4 filings at <strong style={{ color: "#00d4ff" }}>edgar.gov</strong> — search the ticker and filter by Form 4.</p>
        </div>
      </div>

      {/* ── Section 3: Institutional ── */}
      <div>
        <SectionHeader label="3. Institutional Activity — 13F Filings" color="#a855f7" icon="🏛️" />
        <div className="space-y-4">
          <p className="text-sm leading-relaxed" style={{ color: "#9aa0b4" }}>
            Funds managing over $100M must file a <strong style={{ color: "#e8eaf0" }}>13F report</strong> with the SEC every quarter, disclosing all equity holdings. This shows you what Vanguard, BlackRock, ARK, and other major funds own.
          </p>
          <InfoCard color="#ef4444" icon="⏱" title="The Delay Problem">
            13F filings cover the end of a quarter but are not required until 45 days later. A fund that bought heavily in September does not have to report until mid-November. By then, the stock may have already moved 20–30%. Treat this as historical context, not live data.
          </InfoCard>
          <MockBadge />
          <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid #1e2433" }}>
            <table className="w-full text-xs min-w-[620px]">
              <thead>
                <tr style={{ background: "#0a0b0d" }}>
                  {["Fund", "Ticker", "Action", "Est. Value", "Period", "Expand"].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: "#5a6075" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {INSTITUTION_ROWS.map((row, i) => (
                  <>
                    <tr
                      key={row.fund}
                      className="cursor-pointer"
                      style={{
                        borderBottom: expandedRow === `f${i}` ? "none" : "1px solid #1e2433",
                        background: expandedRow === `f${i}` ? "#141720" : "#0f1117",
                      }}
                      onClick={() => setExpandedRow(expandedRow === `f${i}` ? null : `f${i}`)}
                    >
                      <td className="px-4 py-3 font-semibold" style={{ color: "#e8eaf0" }}>{row.fund}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-xs" style={{ color: "#00d4ff" }}>{row.ticker}</span>
                      </td>
                      <td className="px-4 py-3" style={{ color: row.action.startsWith("Added") ? "#10b981" : "#f59e0b" }}>{row.action}</td>
                      <td className="px-4 py-3 font-bold" style={{ color: "#9aa0b4" }}>{row.value}</td>
                      <td className="px-4 py-3" style={{ color: "#5a6075" }}>{row.period}</td>
                      <td className="px-4 py-3 text-center" style={{ color: "#5a6075" }}>{expandedRow === `f${i}` ? "▲" : "▼"}</td>
                    </tr>
                    {expandedRow === `f${i}` && (
                      <tr key={`fexp-${i}`} style={{ borderBottom: "1px solid #1e2433" }}>
                        <td colSpan={6} className="px-4 pb-3 pt-1">
                          <div
                            className="rounded-lg px-4 py-3 text-xs leading-relaxed"
                            style={{ background: "rgba(168,85,247,0.06)", borderLeft: "3px solid #a855f7", color: "#9aa0b4" }}
                          >
                            <strong style={{ color: "#e8eaf0" }}>Beginner Meaning: </strong>{row.meaning}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs" style={{ color: "#5a6075" }}>→ Find real 13F filings at <strong style={{ color: "#00d4ff" }}>edgar.gov</strong> — filter by form type 13F-HR.</p>
        </div>
      </div>

      {/* ── Section 4: Congressional ── */}
      <div>
        <SectionHeader label="4. Congressional Activity — STOCK Act" color="#f59e0b" icon="🏛️" />
        <div className="space-y-4">
          <p className="text-sm leading-relaxed" style={{ color: "#9aa0b4" }}>
            The <strong style={{ color: "#e8eaf0" }}>STOCK Act (2012)</strong> requires US senators and representatives to disclose personal stock trades within 45 days. These are public record — and they matter because politicians sit on committees that oversee the industries they may be trading.
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            <InfoCard color="#f59e0b" icon="⏱" title="The 45-Day Window">
              By the time you see a congressional disclosure, the trade is 3–6 weeks old. The major move has often already happened. This is research context, not a fast-follow signal.
            </InfoCard>
            <InfoCard color="#a855f7" icon="🔗" title="Policy Link Matters Most">
              The most useful question: does this politician sit on a committee that oversees this industry? A defense committee member buying a defense stock before a large defense bill is more meaningful than a random unrelated trade.
            </InfoCard>
          </div>
          <MockBadge />
          <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid #1e2433" }}>
            <table className="w-full text-xs min-w-[700px]">
              <thead>
                <tr style={{ background: "#0a0b0d" }}>
                  {["Politician", "Ticker", "Type", "Amount Range", "Disclosure Delay", "Expand"].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: "#5a6075" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CONGRESS_ROWS.map((row, i) => (
                  <>
                    <tr
                      key={row.politician}
                      className="cursor-pointer"
                      style={{
                        borderBottom: expandedRow === `c${i}` ? "none" : "1px solid #1e2433",
                        background: expandedRow === `c${i}` ? "#141720" : "#0f1117",
                      }}
                      onClick={() => setExpandedRow(expandedRow === `c${i}` ? null : `c${i}`)}
                    >
                      <td className="px-4 py-3 font-semibold" style={{ color: "#e8eaf0" }}>{row.politician}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold" style={{ color: "#00d4ff" }}>{row.ticker}</span>
                      </td>
                      <td className="px-4 py-3"><TypeBadge type={row.type} /></td>
                      <td className="px-4 py-3" style={{ color: "#9aa0b4" }}>{row.amount}</td>
                      <td className="px-4 py-3" style={{ color: "#f59e0b" }}>{row.delay}</td>
                      <td className="px-4 py-3 text-center" style={{ color: "#5a6075" }}>{expandedRow === `c${i}` ? "▲" : "▼"}</td>
                    </tr>
                    {expandedRow === `c${i}` && (
                      <tr key={`cexp-${i}`} style={{ borderBottom: "1px solid #1e2433" }}>
                        <td colSpan={6} className="px-4 pb-3 pt-1">
                          <div
                            className="rounded-lg px-4 py-3 text-xs leading-relaxed"
                            style={{ background: "rgba(245,158,11,0.06)", borderLeft: "3px solid #f59e0b", color: "#9aa0b4" }}
                          >
                            <strong style={{ color: "#e8eaf0" }}>Possible Policy Link: </strong>{row.link}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs" style={{ color: "#5a6075" }}>→ Find real disclosures at <strong style={{ color: "#00d4ff" }}>quiverquant.com</strong> (congressional trades aggregated) or house.gov/disclosures.</p>
        </div>
      </div>

      {/* ── Section 5: Scoring Calculator ── */}
      <div>
        <SectionHeader label="5. Catalyst + Movement Score" color="#00d4ff" icon="⚡" />
        <p className="text-sm mb-4 leading-relaxed" style={{ color: "#9aa0b4" }}>
          Select all signals that apply to a stock you are researching. The tool calculates a Movement Score and outputs a watch level. This is educational context — not a buy or sell recommendation.
        </p>

        <div className="grid md:grid-cols-2 gap-3 mb-5">
          {SIGNALS.map(signal => {
            const active = checkedSignals.has(signal.id);
            return (
              <button
                key={signal.id}
                onClick={() => toggleSignal(signal.id)}
                className="flex items-start gap-3 p-4 rounded-xl text-left transition-all duration-150"
                style={{
                  background: active ? `${signal.color}0f` : "#0f1117",
                  border: `1px solid ${active ? `${signal.color}40` : "#1e2433"}`,
                  transform: active ? "scale(1.01)" : "scale(1)",
                }}
              >
                <div
                  className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center mt-0.5 transition-all"
                  style={{
                    background: active ? signal.color : "transparent",
                    border: `2px solid ${active ? signal.color : "#2a3048"}`,
                  }}
                >
                  {active && (
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <path d="M1 3.5L3 5.5L8 1" stroke="#0a0b0d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold" style={{ color: active ? signal.color : "#9aa0b4" }}>
                      {signal.icon} {signal.label}
                    </span>
                    <span
                      className="text-xs font-mono font-bold px-1.5 py-0.5 rounded"
                      style={{
                        background: signal.score > 0 ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                        color: signal.score > 0 ? "#10b981" : "#ef4444",
                      }}
                    >
                      {signal.score > 0 ? "+" : ""}{signal.score}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "#5a6075" }}>{signal.detail}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Score Output */}
        <div
          className="rounded-2xl p-6"
          style={{ background: output.bg, border: `1px solid ${output.border}` }}
        >
          <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: "#5a6075" }}>MOVEMENT SCORE</p>
              <div className="text-4xl font-bold font-mono" style={{ color: output.color }}>
                {total > 0 ? "+" : ""}{total}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium mb-1" style={{ color: "#5a6075" }}>WATCH LEVEL</p>
              <div className="text-xl font-bold" style={{ color: output.color }}>
                {output.label}
              </div>
            </div>
          </div>
          <div
            className="rounded-lg p-3 text-sm leading-relaxed"
            style={{ background: "rgba(0,0,0,0.2)", color: "#9aa0b4" }}
          >
            {output.desc}
          </div>
          <p className="text-xs mt-3" style={{ color: "#5a6075" }}>
            ⚠ This score is educational context. It does not replace chart analysis, proper entries, stop losses, or risk management.
          </p>
        </div>
      </div>

      {/* ── Section 6: Beginner Signal Breakdown ── */}
      <div>
        <SectionHeader label="6. Understanding Each Signal" color="#a855f7" icon="📚" />
        <div className="space-y-3">
          {[
            { signal: "Sentiment Rising", why: "More eyes on a stock can drive near-term buying pressure.", notEnough: "Social attention is fickle. A stock can trend and crash in 48 hours.", chart: "Look for volume confirmation alongside the mention spike." },
            { signal: "Insider Buying", why: "Executives risk personal capital when they believe the stock is undervalued.", notEnough: "One insider buy is a data point, not a thesis. Watch for a pattern.", chart: "Look for the stock building a base or breaking above resistance." },
            { signal: "Insider Selling", why: "Could reflect concern, but more often reflects personal financial planning.", notEnough: "Single sales by one executive are rarely meaningful without other bearish signals.", chart: "Only concerning if multiple insiders are selling AND the chart is breaking support." },
            { signal: "Institutional Accumulation", why: "Large funds have professional research teams. Sustained buying across quarters shows conviction.", notEnough: "Data is 45–90 days delayed. The fund may have already exited.", chart: "Check if the stock is making higher lows consistent with institutional accumulation theory." },
            { signal: "Congressional Buying", why: "Politicians on relevant committees may trade near policy events.", notEnough: "45-day delay. Amounts are in ranges, not exact. Correlation is not causation.", chart: "If the policy catalyst is still pending AND the chart is set up, the combination is interesting." },
            { signal: "Major News Catalyst", why: "Real-world events create supply/demand imbalance immediately.", notEnough: "Not all catalysts sustain. 'Buy the rumor, sell the news' is common.", chart: "Wait for the post-catalyst base to form before entering." },
            { signal: "Technical Confirmation", why: "The chart represents all known information priced in real time. It confirms the thesis.", notEnough: "Charts can be faked short-term by thin volume. Always check volume.", chart: "This IS the chart signal. Breakout above resistance on volume is the entry trigger." },
            { signal: "Overcrowded Hype Warning", why: "Early awareness of hype prevents getting caught at the top.", notEnough: "Not all viral stocks crash immediately. Timing is everything.", chart: "Look for signs of distribution: high volume with small price gains, long upper wicks." },
          ].map(item => (
            <div key={item.signal} className="rounded-xl p-4" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
              <p className="text-sm font-semibold mb-2" style={{ color: "#e8eaf0" }}>{item.signal}</p>
              <div className="grid md:grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="font-medium mb-1" style={{ color: "#10b981" }}>Why It May Matter</p>
                  <p style={{ color: "#9aa0b4" }}>{item.why}</p>
                </div>
                <div>
                  <p className="font-medium mb-1" style={{ color: "#f59e0b" }}>Why It's Not Enough Alone</p>
                  <p style={{ color: "#9aa0b4" }}>{item.notEnough}</p>
                </div>
                <div>
                  <p className="font-medium mb-1" style={{ color: "#00d4ff" }}>Chart Confirmation Needed</p>
                  <p style={{ color: "#9aa0b4" }}>{item.chart}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Data Sources Roadmap ── */}
      <div
        className="rounded-2xl p-6"
        style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#00d4ff" }}>
          🗺 Data Sources We Can Integrate Later
        </p>
        <div className="grid md:grid-cols-2 gap-3">
          {[
            { name: "SEC EDGAR", url: "edgar.gov", desc: "Official source for all Form 4 (insiders) and 13F (institutions) filings. Free, delayed.", color: "#10b981", icon: "📄" },
            { name: "Quiver Quant", url: "quiverquant.com", desc: "Aggregates congressional trades, government contracts, and lobbying data. Free tier available.", color: "#a855f7", icon: "🏛️" },
            { name: "Finnhub", url: "finnhub.io", desc: "API for insider transactions, company news, and earnings surprises. Free tier available.", color: "#f59e0b", icon: "⚡" },
            { name: "Stocktwits / Reddit", url: "stocktwits.com", desc: "Real-time trader sentiment and mention tracking. Manual research for now.", color: "#00d4ff", icon: "📡" },
            { name: "Google Trends", url: "trends.google.com", desc: "Track search interest over time for a ticker or company name. Free, no API needed.", color: "#10b981", icon: "📈" },
            { name: "TradingView", url: "tradingview.com", desc: "Chart confirmation layer — use alongside all signals above. Free tier available.", color: "#00d4ff", icon: "📊" },
          ].map(src => (
            <div
              key={src.name}
              className="rounded-xl p-4 flex items-start gap-3"
              style={{ background: "#0a0b0d", border: "1px solid #1e2433" }}
            >
              <span className="text-lg flex-shrink-0">{src.icon}</span>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm" style={{ color: "#e8eaf0" }}>{src.name}</span>
                  <span className="text-xs font-mono" style={{ color: src.color }}>{src.url}</span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "#9aa0b4" }}>{src.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs mt-4" style={{ color: "#5a6075" }}>
          MVP uses mock educational data only. Live API integration is a future phase. Clearly labeled throughout.
        </p>
      </div>

    </div>
  );
}

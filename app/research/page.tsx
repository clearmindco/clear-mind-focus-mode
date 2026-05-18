"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";

interface ResearchCategory {
  id: string;
  icon: string;
  label: string;
  sub: string;
  color: string;
  tracks: string[];
  whyItMatters: string;
  signalTypes: string[];
  dataSources: string[];
}

const CATEGORIES: ResearchCategory[] = [
  {
    id: "fed-rates",
    icon: "🏦",
    label: "Fed / Rates",
    sub: "Federal Reserve Policy & Interest Rates",
    color: "#00d4ff",
    tracks: [
      "FOMC meeting dates and rate decisions",
      "Fed Chair speeches and press conferences",
      "CPI, PPI, PCE inflation prints",
      "Jobs report and unemployment data",
    ],
    whyItMatters:
      "Interest rates are the single most powerful macro force in markets. Rate hikes crush high-multiple tech stocks, hurt bonds, and slow consumer spending. Rate cuts do the opposite. Every FOMC meeting is a potential volatility event.",
    signalTypes: ["Rate Decision", "Fed Speak", "Inflation Print", "Employment Data"],
    dataSources: ["federalreserve.gov", "bls.gov", "CME FedWatch Tool"],
  },
  {
    id: "tlt-bonds",
    icon: "🏛️",
    label: "TLT / Bonds",
    sub: "20-Year Treasury Bond ETF & Yield Curve",
    color: "#06b6d4",
    tracks: [
      "TLT price action and 20-year yield movements",
      "2-year vs 10-year yield spread (inversion signals)",
      "Duration risk in rate-sensitive sectors",
      "Institutional bond fund flows",
    ],
    whyItMatters:
      "TLT is the backbone of macro analysis. When bond prices fall (yields rise), it pressures growth and tech stocks. When bonds rally, defensive sectors and dividend stocks benefit. Understanding TLT's relationship to equities is fundamental to reading the macro environment.",
    signalTypes: ["Yield Move", "TLT Breakout", "Curve Inversion", "Duration Risk"],
    dataSources: ["US Treasury (treasurydirect.gov)", "FRED (stlouisfed.org)", "TLT options flow"],
  },
  {
    id: "energy-war",
    icon: "⚡",
    label: "Energy / War",
    sub: "Crude Oil, Natural Gas & Geopolitical Risk",
    color: "#f59e0b",
    tracks: [
      "WTI and Brent crude oil price levels",
      "Natural gas supply and storage data",
      "OPEC+ production decisions",
      "Middle East, Russia-Ukraine, and maritime risk",
    ],
    whyItMatters:
      "Energy shocks cascade into inflation, consumer spending, and sector rotation. Oil spikes benefit XLE and OXY while crushing airlines and consumer discretionary. Geopolitical flare-ups create short-term volatility across all asset classes and can disrupt supply chain assumptions built into earnings models.",
    signalTypes: ["Oil Spike", "Supply Shock", "Geopolitical Event", "OPEC Decision"],
    dataSources: ["EIA.gov", "OPEC.org", "CME Oil Futures"],
  },
  {
    id: "china",
    icon: "🇨🇳",
    label: "China",
    sub: "PBOC Policy, Tariffs & Supply Chain Risk",
    color: "#ef4444",
    tracks: [
      "PBOC interest rate and reserve ratio decisions",
      "US-China trade tariffs and export restrictions",
      "China tech regulation (Alibaba, Tencent, Baidu)",
      "Taiwan Strait tensions and semiconductor risk",
    ],
    whyItMatters:
      "China is the world's second-largest economy and the dominant manufacturer of semiconductors and rare earth materials. Policy shifts — from stimulus packages to export bans — create massive volatility in supply chains and affect earnings for companies like Apple, NVDA, and Tesla that have significant China exposure.",
    signalTypes: ["PBOC Action", "Tariff Change", "Tech Regulation", "Taiwan Risk"],
    dataSources: ["People's Bank of China", "US Trade Rep (ustr.gov)", "Reuters/Bloomberg"],
  },
  {
    id: "ai-semis",
    icon: "🤖",
    label: "AI / Semiconductors",
    sub: "AI Capex, Chip Demand & Compute Infrastructure",
    color: "#10b981",
    tracks: [
      "NVDA, AMD, SMCI, AVGO earnings and guidance",
      "Hyperscaler AI capex (MSFT, AMZN, GOOGL, META)",
      "Chip export controls and ASML restrictions",
      "AI model releases and compute demand signals",
    ],
    whyItMatters:
      "AI capex is the largest secular investment trend in markets. Earnings surprises from NVDA alone can move the entire Nasdaq. Tracking the cadence of AI infrastructure spending — data centers, GPUs, networking — gives early visibility into which sectors will benefit and which are at saturation risk.",
    signalTypes: ["Earnings Beat", "Capex Guidance", "Export Control", "Model Release"],
    dataSources: ["SEC EDGAR filings", "Company IR pages", "SemiAnalysis"],
  },
  {
    id: "congressional",
    icon: "🏛️",
    label: "Congressional Trades",
    sub: "STOCK Act Disclosures & Political Activity",
    color: "#8b5cf6",
    tracks: [
      "House and Senate STOCK Act trade disclosures",
      "Unusual position sizes or timing vs legislation",
      "Committee assignments and sector overlap",
      "Cluster buying patterns before policy announcements",
    ],
    whyItMatters:
      "Members of Congress must disclose trades within 45 days. While not illegal, politicians with access to non-public policy information may trade ahead of regulatory decisions, defense contracts, or healthcare legislation. Unusual activity — especially cluster buying from multiple members — can signal regulatory or spending trends before they become public.",
    signalTypes: ["Cluster Buy", "Pre-Legislation Trade", "Defense/Healthcare", "Unusual Size"],
    dataSources: ["quiverquant.com", "capitoltrades.com", "disclosures.house.gov"],
  },
  {
    id: "insider",
    icon: "🔍",
    label: "Insider Activity",
    sub: "Form 4 Filings & Executive Transactions",
    color: "#f97316",
    tracks: [
      "CEO, CFO, and director Form 4 SEC filings",
      "Open market purchases vs option exercises",
      "Cluster buying from multiple insiders",
      "Selling patterns near earnings or lock-up expirations",
    ],
    whyItMatters:
      "Executives know their company better than any analyst. When multiple insiders buy on the open market — especially at a significant price — that is one of the strongest fundamental signals available. Selling is less meaningful (could be diversification), but cluster selling before bad news is a warning sign.",
    signalTypes: ["Cluster Buy", "Open Market Purchase", "CFO Buy", "Pre-Earnings Activity"],
    dataSources: ["SEC EDGAR (Form 4)", "openinsider.com", "finviz.com/insidertrading"],
  },
  {
    id: "small-cap",
    icon: "🚀",
    label: "Small-Cap Catalysts",
    sub: "FDA Approvals, Earnings Surprises & Contract Wins",
    color: "#ec4899",
    tracks: [
      "FDA PDUFA dates and binary event calendars",
      "Earnings surprise magnitude for sub-$2B companies",
      "Government contract awards (defense, infrastructure)",
      "Reverse merger and SPAC activity",
    ],
    whyItMatters:
      "Small caps move violently on news because the float is small and institutional coverage is thin. A single FDA approval can triple a biotech. A surprise earnings beat can move a small retailer 30% in a day. Knowing the catalyst calendar in advance and understanding the setup before the event is the edge in this space.",
    signalTypes: ["FDA Decision", "Earnings Beat", "Contract Win", "Short Squeeze Setup"],
    dataSources: ["FDA.gov", "Briefing.com", "BioPharmCatalyst.com"],
  },
];

export default function ResearchLab() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0b0d" }}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 pt-10 pb-20">
        {/* Header */}
        <div className="mb-8">
          <div
            className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium mb-3"
            style={{ background: "rgba(139,92,246,0.1)", color: "#8b5cf6", border: "1px solid rgba(139,92,246,0.25)" }}
          >
            PREVIEW — Research framework
          </div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: "#e8eaf0" }}>
            EDGE <span style={{ color: "#8b5cf6" }}>Research Lab</span>
          </h1>
          <p className="text-sm" style={{ color: "#9aa0b4" }}>
            8 macro and flow research categories · Understand what moves markets before trading them
          </p>
        </div>

        {/* Info banner */}
        <div
          className="rounded-xl p-4 flex gap-3 items-start mb-8"
          style={{ background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.2)" }}
        >
          <span className="text-base flex-shrink-0">🔬</span>
          <p className="text-xs leading-relaxed" style={{ color: "#9aa0b4" }}>
            <strong style={{ color: "#8b5cf6" }}>Research framework — not live data.</strong> Each category below explains what it tracks, why it matters, and where to find the data yourself. Live research reports and signal feeds are coming in a future update.
          </p>
        </div>

        {/* Category grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {CATEGORIES.map(cat => {
            const isOpen = expanded === cat.id;
            return (
              <div
                key={cat.id}
                className="rounded-2xl overflow-hidden transition-all duration-200"
                style={{
                  background: "#0f1117",
                  border: `1px solid ${isOpen ? cat.color + "40" : "#1e2433"}`,
                }}
              >
                {/* Card header — always visible */}
                <button
                  className="w-full text-left p-5"
                  onClick={() => setExpanded(isOpen ? null : cat.id)}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: `${cat.color}10`, border: `1px solid ${cat.color}25` }}
                    >
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-bold text-sm" style={{ color: "#e8eaf0" }}>{cat.label}</span>
                      </div>
                      <p className="text-xs" style={{ color: cat.color }}>{cat.sub}</p>
                    </div>
                    <span
                      className="text-lg flex-shrink-0 transition-transform duration-200"
                      style={{ color: "#5a6075", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                    >
                      ↓
                    </span>
                  </div>

                  {/* Signal type chips — always show */}
                  <div className="flex gap-1.5 flex-wrap mt-3">
                    {cat.signalTypes.map(s => (
                      <span
                        key={s}
                        className="text-xs px-2 py-0.5 rounded"
                        style={{ background: `${cat.color}10`, color: cat.color, border: `1px solid ${cat.color}20` }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div
                    className="px-5 pb-5 space-y-4 border-t animate-fade-in"
                    style={{ borderColor: "#1e2433" }}
                  >
                    <div className="pt-4">
                      <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#5a6075" }}>
                        What it tracks
                      </p>
                      <ul className="space-y-1.5">
                        {cat.tracks.map((t, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "#9aa0b4" }}>
                            <span className="flex-shrink-0 mt-0.5" style={{ color: cat.color }}>▸</span>
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div
                      className="rounded-xl p-4"
                      style={{ background: `${cat.color}08`, border: `1px solid ${cat.color}20` }}
                    >
                      <p className="text-xs font-semibold mb-1.5" style={{ color: cat.color }}>
                        Why it matters
                      </p>
                      <p className="text-xs leading-relaxed" style={{ color: "#9aa0b4" }}>
                        {cat.whyItMatters}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#5a6075" }}>
                        Free data sources
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {cat.dataSources.map(ds => (
                          <span
                            key={ds}
                            className="text-xs px-2.5 py-1 rounded-full"
                            style={{ background: "#141720", color: "#9aa0b4", border: "1px solid #1e2433" }}
                          >
                            {ds}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Coming soon section */}
        <div
          className="mt-10 rounded-2xl p-6 text-center"
          style={{ background: "#0f1117", border: "1px solid #1e2433" }}
        >
          <div className="text-3xl mb-3">📡</div>
          <h3 className="font-semibold mb-2" style={{ color: "#e8eaf0" }}>Live Research Reports — Coming Soon</h3>
          <p className="text-sm max-w-xl mx-auto mb-5" style={{ color: "#9aa0b4" }}>
            Each category will receive weekly research updates with current setups, data points, and what to watch. All content will be clearly labeled as educational analysis, not trading recommendations.
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            {["Weekly Macro Recap", "Fed Watch Calendar", "Catalyst Radar", "Flow Alerts", "Sector Rotation Map"].map(f => (
              <span
                key={f}
                className="text-xs px-3 py-1.5 rounded-full"
                style={{ background: "#141720", color: "#5a6075", border: "1px solid #1e2433" }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

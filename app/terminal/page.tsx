"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Navbar from "@/components/Navbar";
import {
  getQuote,
  isFinnhubConnected,
  type QuoteData,
} from "@/lib/data-providers";

type StatusType = "BUY WATCH" | "WAIT" | "AVOID";

interface TickerConfig {
  ticker: string;
  fullName: string;
  type: string;
  icon: string;
  color: string;
  status: StatusType;
  trend: string;
  catalyst: string;
  entryZone: string;
  stop: string;
  target1: string;
  target2: string;
  confidence: string;
  bullCase: string;
  bearCase: string;
  beginnerNote: string;
  tvSymbol: string;
}

const TICKERS: TickerConfig[] = [
  {
    ticker: "SPY",
    fullName: "S&P 500 ETF",
    type: "Index ETF",
    icon: "📈",
    color: "#00d4ff",
    status: "WAIT",
    trend: "— Placeholder",
    catalyst: "— Placeholder",
    entryZone: "— Placeholder",
    stop: "— Placeholder",
    target1: "— Placeholder",
    target2: "— Placeholder",
    confidence: "—",
    bullCase: "Fed signals rate cuts, earnings season beats expectations, and VIX falls below 15 — rotation into equities and broad market rally.",
    bearCase: "CPI prints hot, Fed stays hawkish, yield curve re-inverts, and credit spreads widen — broad market selloff led by tech and growth.",
    beginnerNote: "SPY tracks the 500 largest US companies. It's the 'health of the stock market.' When SPY goes up, most stocks go up with it. When it goes down, almost everything goes down. Beginners should understand SPY's trend before trading individual stocks.",
    tvSymbol: "AMEX:SPY",
  },
  {
    ticker: "QQQ",
    fullName: "Nasdaq-100 ETF",
    type: "Index ETF",
    icon: "💻",
    color: "#8b5cf6",
    status: "WAIT",
    trend: "— Placeholder",
    catalyst: "— Placeholder",
    entryZone: "— Placeholder",
    stop: "— Placeholder",
    target1: "— Placeholder",
    target2: "— Placeholder",
    confidence: "—",
    bullCase: "AI capex cycle continues, NVDA/MSFT/META deliver strong earnings, rates fall — QQQ outperforms as high-multiple tech expands.",
    bearCase: "Rate expectations rise, AI spending faces scrutiny, or a major tech earnings miss — QQQ often falls 2-3x faster than SPY in risk-off moves.",
    beginnerNote: "QQQ holds the 100 biggest Nasdaq companies — mostly tech giants like Apple, Microsoft, Nvidia, and Amazon. It moves more aggressively than SPY: when tech is hot, QQQ rockets; when tech sells off, QQQ falls harder. It's often used as a proxy for 'tech sentiment.'",
    tvSymbol: "NASDAQ:QQQ",
  },
  {
    ticker: "IWM",
    fullName: "Russell 2000 ETF",
    type: "Index ETF",
    icon: "🔬",
    color: "#f97316",
    status: "WAIT",
    trend: "— Placeholder",
    catalyst: "— Placeholder",
    entryZone: "— Placeholder",
    stop: "— Placeholder",
    target1: "— Placeholder",
    target2: "— Placeholder",
    confidence: "—",
    bullCase: "Fed cuts rates, regional bank stability returns, and domestic economy strengthens — small caps lead the next bull leg as cheap money flows to growth.",
    bearCase: "Higher-for-longer rates crush small-cap borrowing costs, credit conditions tighten, and economic slowdown fears rise — IWM underperforms large caps.",
    beginnerNote: "IWM holds 2,000 small US companies — smaller businesses that rely more heavily on cheap borrowing. When interest rates are high, IWM suffers most. When rates fall, IWM often rips higher first. Traders watch IWM as a leading indicator of risk appetite.",
    tvSymbol: "AMEX:IWM",
  },
  {
    ticker: "TLT",
    fullName: "20-Year Treasury Bond ETF",
    type: "Bond ETF",
    icon: "🏛️",
    color: "#06b6d4",
    status: "WAIT",
    trend: "— Placeholder",
    catalyst: "— Placeholder",
    entryZone: "— Placeholder",
    stop: "— Placeholder",
    target1: "— Placeholder",
    target2: "— Placeholder",
    confidence: "—",
    bullCase: "Recession fears grow, Fed pivots to cuts, inflation falls toward 2% — TLT rallies as bond prices rise and yields fall.",
    bearCase: "Inflation re-accelerates, government debt issuance surges, and Fed keeps rates elevated — TLT falls as yields rise and bond prices drop.",
    beginnerNote: "TLT moves opposite to interest rates. When rates go up, TLT goes down (and vice versa). Bonds and stocks often move in opposite directions — when fear rises, money flows into bonds (safe haven). Watching TLT helps you understand whether big money is scared or confident.",
    tvSymbol: "NASDAQ:TLT",
  },
  {
    ticker: "XLE",
    fullName: "Energy Select Sector ETF",
    type: "Sector ETF",
    icon: "⚡",
    color: "#f59e0b",
    status: "WAIT",
    trend: "— Placeholder",
    catalyst: "— Placeholder",
    entryZone: "— Placeholder",
    stop: "— Placeholder",
    target1: "— Placeholder",
    target2: "— Placeholder",
    confidence: "—",
    bullCase: "OPEC+ announces supply cuts, geopolitical conflict disrupts oil supply, or cold winter drives gas demand — XLE and energy stocks outperform.",
    bearCase: "Global demand falls, OPEC+ increases supply, or EV adoption accelerates — oil falls, XLE underperforms the broader market.",
    beginnerNote: "XLE holds the largest US energy companies like Exxon, Chevron, and ConocoPhillips. It moves with oil prices. If you see oil spike on the news (war, OPEC cut), XLE usually follows. It's a simple way to trade energy exposure without picking individual oil companies.",
    tvSymbol: "AMEX:XLE",
  },
  {
    ticker: "NVDA",
    fullName: "NVIDIA Corporation",
    type: "Individual Stock",
    icon: "🤖",
    color: "#10b981",
    status: "WAIT",
    trend: "— Placeholder",
    catalyst: "— Placeholder",
    entryZone: "— Placeholder",
    stop: "— Placeholder",
    target1: "— Placeholder",
    target2: "— Placeholder",
    confidence: "—",
    bullCase: "Data center AI GPU demand continues to accelerate, earnings beat and raise guidance, new Blackwell architecture drives next upgrade cycle.",
    bearCase: "US expands chip export restrictions to more countries, hyperscaler capex slows, or AMD closes the competitive gap — NVDA multiple contracts sharply.",
    beginnerNote: "NVIDIA makes the graphics chips (GPUs) that power AI systems. Every time a company builds an AI model or data center, they buy NVIDIA chips. NVDA is one of the most important and most volatile stocks in the market. A single earnings beat can move the entire Nasdaq. Beginners: never hold NVDA through earnings without understanding the risk.",
    tvSymbol: "NASDAQ:NVDA",
  },
  {
    ticker: "TSLA",
    fullName: "Tesla, Inc.",
    type: "Individual Stock",
    icon: "🚗",
    color: "#ef4444",
    status: "WAIT",
    trend: "— Placeholder",
    catalyst: "— Placeholder",
    entryZone: "— Placeholder",
    stop: "— Placeholder",
    target1: "— Placeholder",
    target2: "— Placeholder",
    confidence: "—",
    bullCase: "FSD robotaxi launch gains regulatory approval, energy storage business accelerates, and CEO focus returns to Tesla operations — stock rerate higher.",
    bearCase: "EV price wars squeeze margins, competition from BYD and legacy OEMs intensifies, or CEO distraction causes execution misses — multiple compression continues.",
    beginnerNote: "Tesla is far more than just a car company — it's an energy, AI, and robotics story. TSLA is one of the most traded and debated stocks. It moves on Elon Musk tweets, EV delivery data, FSD updates, and macro sentiment. It's highly volatile and often moves 3-5% on news days. Position size carefully.",
    tvSymbol: "NASDAQ:TSLA",
  },
];

const STATUS_META = {
  "BUY WATCH": { color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  WAIT: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  AVOID: { color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
};

function fmt(n: number | null, prefix = "$"): string {
  if (n === null) return "—";
  return `${prefix}${n.toFixed(2)}`;
}

function fmtChg(n: number | null): string {
  if (n === null) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

// ─── TradingView chart embed ──────────────────────────────────────────────────

function TradingViewChart({ tvSymbol, color }: { tvSymbol: string; color: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptAdded = useRef(false);

  useEffect(() => {
    if (!containerRef.current || scriptAdded.current) return;
    scriptAdded.current = true;

    const containerId = `tv_${tvSymbol.replace(":", "_").replace("/", "_")}`;
    const inner = document.createElement("div");
    inner.id = containerId;
    containerRef.current.appendChild(inner);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (typeof window !== "undefined" && (window as unknown as Record<string, unknown>).TradingView) {
        const TV = (window as unknown as Record<string, { widget: new (config: Record<string, unknown>) => void }>).TradingView;
        new TV.widget({
          container_id: containerId,
          symbol: tvSymbol,
          interval: "D",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          toolbar_bg: "#0f1117",
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: false,
          save_image: false,
          height: 360,
          width: "100%",
          hide_top_toolbar: false,
          withdateranges: true,
          studies: [],
          show_popup_button: false,
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
      scriptAdded.current = false;
    };
  }, [tvSymbol]);

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${color}20` }}>
      <div className="px-3 py-2 flex items-center gap-2" style={{ background: "#0a0b0d", borderBottom: "1px solid #1e2433" }}>
        <span className="text-xs font-medium" style={{ color: "#5a6075" }}>TradingView Chart — {tvSymbol}</span>
        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#141720", color: "#5a6075" }}>Free embed</span>
      </div>
      <div ref={containerRef} style={{ background: "#0f1117", minHeight: "360px" }} />
    </div>
  );
}

// ─── Main terminal component ──────────────────────────────────────────────────

export default function Terminal() {
  const [quotes, setQuotes] = useState<Record<string, QuoteData>>({});
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<"levels" | "chart" | "analysis">("levels");
  const apiConnected = isFinnhubConnected();

  const fetchAll = useCallback(async () => {
    if (!apiConnected) return;
    setLoading(true);
    const results = await Promise.all(TICKERS.map(t => getQuote(t.ticker)));
    const map: Record<string, QuoteData> = {};
    results.forEach(q => { map[q.ticker] = q; });
    setQuotes(map);
    setLoading(false);
    setLastUpdated(new Date().toLocaleTimeString());
  }, [apiConnected]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0b0d" }}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 pt-10 pb-20">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <div
              className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium mb-3"
              style={
                apiConnected
                  ? { background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" }
                  : { background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.25)" }
              }
            >
              <span className={`w-1.5 h-1.5 rounded-full bg-current ${apiConnected ? "animate-pulse" : ""}`} />
              {apiConnected
                ? loading ? "Fetching live prices…" : `Live Quotes${lastUpdated ? ` · ${lastUpdated}` : ""}`
                : "API not connected — placeholder data"}
            </div>
            <h1 className="text-3xl font-bold" style={{ color: "#e8eaf0" }}>
              EDGE <span style={{ color: "#10b981" }}>Terminal</span>
            </h1>
            <p className="text-sm mt-1" style={{ color: "#9aa0b4" }}>
              Market radar · 7 tickers · TradingView charts · Analysis setups
            </p>
          </div>
          {apiConnected && (
            <button
              onClick={fetchAll}
              disabled={loading}
              className="text-xs px-4 py-2 rounded-xl transition-all"
              style={{
                background: "#0f1117",
                border: "1px solid #1e2433",
                color: loading ? "#5a6075" : "#00d4ff",
                cursor: loading ? "wait" : "pointer",
              }}
            >
              {loading ? "Refreshing…" : "↻ Refresh"}
            </button>
          )}
        </div>

        {/* Compliance/placeholder warning */}
        <div
          className="rounded-xl p-4 flex gap-3 items-start mb-6"
          style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)" }}
        >
          <span className="text-base flex-shrink-0">⚠️</span>
          <p className="text-xs leading-relaxed" style={{ color: "#9aa0b4" }}>
            <strong style={{ color: "#ef4444" }}>Educational research only. Not financial advice.</strong>{" "}
            {apiConnected
              ? "Prices are live from Finnhub. All status, trend, catalyst, entry, stop, target, and confidence fields are "
              : "All price data is "}
            <strong style={{ color: "#f59e0b" }}>
              {apiConnected ? "placeholder values" : "placeholder — API not connected"}
            </strong>
            {apiConnected ? " and do not constitute a recommendation to buy or sell." : ". Add NEXT_PUBLIC_FINNHUB_API_KEY to see live prices."}
            {" "}Bull/bear cases and beginner notes are general educational context, not trade signals. Always paper trade first.
          </p>
        </div>

        {/* Status legend */}
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <span className="text-xs" style={{ color: "#5a6075" }}>Status key:</span>
          {(Object.entries(STATUS_META) as [StatusType, typeof STATUS_META["WAIT"]][]).map(([label, s]) => (
            <span key={label} className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: s.bg, color: s.color }}>
              {label}
            </span>
          ))}
          <span className="text-xs ml-2" style={{ color: "#5a6075" }}>(All statuses are placeholders — manual analysis not yet connected)</span>
        </div>

        {/* Ticker grid */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {TICKERS.map(t => {
            const q = quotes[t.ticker];
            const isOpen = expanded === t.ticker;
            const statusMeta = STATUS_META[t.status];
            const hasLivePrice = q && !q.isPlaceholder;
            const chgColor = hasLivePrice && q.changePercent !== null
              ? q.changePercent >= 0 ? "#10b981" : "#ef4444"
              : "#9aa0b4";

            return (
              <div
                key={t.ticker}
                className="rounded-2xl overflow-hidden transition-all duration-200"
                style={{
                  background: "#0f1117",
                  border: `1px solid ${isOpen ? t.color + "40" : "#1e2433"}`,
                }}
              >
                <div className="p-5">
                  {/* Ticker header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{ background: `${t.color}10`, border: `1px solid ${t.color}25` }}
                      >
                        {t.icon}
                      </div>
                      <div>
                        <div className="font-bold text-lg leading-none" style={{ color: "#e8eaf0" }}>{t.ticker}</div>
                        <div className="text-xs mt-0.5" style={{ color: "#5a6075" }}>{t.fullName}</div>
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold flex-shrink-0" style={{ background: statusMeta.bg, color: statusMeta.color }}>
                      {t.status}
                    </span>
                  </div>

                  {/* Price row */}
                  <div
                    className="rounded-xl p-3 mb-3 flex items-center justify-between"
                    style={{ background: "#141720", border: `1px solid ${hasLivePrice ? t.color + "30" : "#1e2433"}` }}
                  >
                    <div>
                      <div className="text-xs mb-0.5" style={{ color: "#5a6075" }}>
                        {hasLivePrice ? "Last Price" : "Price"}
                        {hasLivePrice && <span className="ml-1.5 text-xs" style={{ color: "#10b981" }}>● live</span>}
                        {!hasLivePrice && !apiConnected && <span className="ml-1.5 text-xs" style={{ color: "#5a6075" }}>● no API</span>}
                        {!hasLivePrice && apiConnected && loading && <span className="ml-1.5 text-xs" style={{ color: "#f59e0b" }}>● loading…</span>}
                      </div>
                      <div className="font-bold text-base" style={{ color: "#e8eaf0" }}>
                        {hasLivePrice ? fmt(q.price) : "— Placeholder"}
                      </div>
                    </div>
                    {hasLivePrice && (
                      <div className="text-right">
                        <div className="text-xs font-semibold" style={{ color: chgColor }}>{fmtChg(q.changePercent)}</div>
                        <div className="text-xs" style={{ color: chgColor }}>{fmt(q.change, q.change && q.change >= 0 ? "+$" : "-$")}</div>
                      </div>
                    )}
                  </div>

                  {/* Analysis grid */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {[
                      { label: "Trend", value: t.trend },
                      { label: "Catalyst", value: t.catalyst },
                      { label: "Confidence", value: t.confidence !== "—" ? `${t.confidence}%` : "—" },
                      { label: "Type", value: t.type },
                    ].map(row => (
                      <div key={row.label} className="rounded-lg p-2" style={{ background: "#0a0b0d", border: "1px solid #1e2433" }}>
                        <div className="text-xs mb-0.5" style={{ color: "#5a6075" }}>{row.label}</div>
                        <div className="text-xs font-medium" style={{ color: "#9aa0b4" }}>{row.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* View Details */}
                  <button
                    onClick={() => { setExpanded(isOpen ? null : t.ticker); setDetailTab("levels"); }}
                    className="w-full py-2 rounded-xl text-xs font-semibold transition-all duration-150"
                    style={{
                      background: isOpen ? `${t.color}15` : "#141720",
                      color: isOpen ? t.color : "#9aa0b4",
                      border: `1px solid ${isOpen ? t.color + "30" : "#1e2433"}`,
                    }}
                  >
                    {isOpen ? "Hide Details ↑" : "View Details ↓"}
                  </button>
                </div>

                {/* Expanded detail panel */}
                {isOpen && (
                  <div className="border-t" style={{ borderColor: "#1e2433" }}>
                    {/* Detail tabs */}
                    <div className="flex gap-1 px-4 pt-4 pb-2">
                      {([
                        { key: "levels", label: "Trade Levels" },
                        { key: "chart", label: "Chart" },
                        { key: "analysis", label: "Bull / Bear" },
                      ] as const).map(tab => (
                        <button
                          key={tab.key}
                          onClick={() => setDetailTab(tab.key)}
                          className="text-xs px-3 py-1.5 rounded-lg transition-all"
                          style={{
                            background: detailTab === tab.key ? `${t.color}15` : "#141720",
                            color: detailTab === tab.key ? t.color : "#9aa0b4",
                            border: `1px solid ${detailTab === tab.key ? t.color + "30" : "#1e2433"}`,
                          }}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="px-4 pb-5">
                      {/* Levels tab */}
                      {detailTab === "levels" && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: t.color }}>
                            Trade Levels — All Placeholder
                          </p>
                          {[
                            { label: "Entry Zone", value: t.entryZone, color: "#00d4ff" },
                            { label: "Stop Loss", value: t.stop, color: "#ef4444" },
                            { label: "Target 1", value: t.target1, color: "#10b981" },
                            { label: "Target 2", value: t.target2, color: "#10b981" },
                          ].map(row => (
                            <div key={row.label} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "#141720", border: "1px solid #1e2433" }}>
                              <span className="text-xs" style={{ color: "#9aa0b4" }}>{row.label}</span>
                              <span className="text-xs font-semibold" style={{ color: row.color }}>{row.value}</span>
                            </div>
                          ))}

                          {hasLivePrice && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              {[
                                { label: "Daily High", value: fmt(q.high) },
                                { label: "Daily Low", value: fmt(q.low) },
                                { label: "Prev Close", value: fmt(q.prevClose) },
                                { label: "Change $", value: fmt(q.change, q.change && q.change >= 0 ? "+$" : "$") },
                              ].map(row => (
                                <div key={row.label} className="rounded-lg p-2" style={{ background: "#0a0b0d", border: "1px solid #1e2433" }}>
                                  <div className="text-xs mb-0.5" style={{ color: "#5a6075" }}>{row.label}</div>
                                  <div className="text-xs font-semibold" style={{ color: "#e8eaf0" }}>{row.value}</div>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="rounded-lg p-3 mt-1" style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)" }}>
                            <p className="text-xs" style={{ color: "#f59e0b" }}>
                              📊 Analysis fields are placeholder values. Manual analysis integration coming in a future update.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Chart tab */}
                      {detailTab === "chart" && (
                        <div>
                          <TradingViewChart tvSymbol={t.tvSymbol} color={t.color} />
                          <p className="text-xs mt-2" style={{ color: "#5a6075" }}>
                            Chart provided by TradingView · Free embed · No API key required · For reference only
                          </p>
                        </div>
                      )}

                      {/* Bull/Bear analysis tab */}
                      {detailTab === "analysis" && (
                        <div className="space-y-3">
                          <div className="rounded-xl p-4" style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.2)" }}>
                            <p className="text-xs font-semibold mb-2" style={{ color: "#10b981" }}>🐂 Bull Case</p>
                            <p className="text-xs leading-relaxed" style={{ color: "#9aa0b4" }}>{t.bullCase}</p>
                          </div>
                          <div className="rounded-xl p-4" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)" }}>
                            <p className="text-xs font-semibold mb-2" style={{ color: "#ef4444" }}>🐻 Bear Case</p>
                            <p className="text-xs leading-relaxed" style={{ color: "#9aa0b4" }}>{t.bearCase}</p>
                          </div>
                          <div className="rounded-xl p-4" style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)" }}>
                            <p className="text-xs font-semibold mb-2" style={{ color: "#00d4ff" }}>🎓 Beginner Note</p>
                            <p className="text-xs leading-relaxed" style={{ color: "#9aa0b4" }}>{t.beginnerNote}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* What connects when API added */}
        <div className="mt-10 rounded-2xl p-6" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
          <div className="flex items-start gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <p className="font-semibold mb-2 text-sm" style={{ color: "#e8eaf0" }}>🔌 What connects when API keys are added</p>
              <div className="grid sm:grid-cols-2 gap-2 text-xs" style={{ color: "#9aa0b4" }}>
                <div>✓ Live price + change % via Finnhub</div>
                <div>✓ Daily high / low / prev close</div>
                <div>⏳ RSI / technical overlay via Alpha Vantage</div>
                <div>⏳ Catalyst news feed via Finnhub</div>
                <div>⏳ Insider activity feed via Finnhub</div>
                <div>⏳ AI confidence scores (requires OpenAI)</div>
              </div>
            </div>
            {!apiConnected && (
              <div className="flex-shrink-0">
                <a
                  href="/api-setup"
                  className="inline-block px-4 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: "rgba(0,212,255,0.1)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.3)" }}
                >
                  ⚙️ Go to API Setup →
                </a>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "#5a6075" }}>
          Educational research only · Not financial advice · No guaranteed returns · Users are responsible for their own trades · Always paper trade first
        </p>
      </div>
    </div>
  );
}

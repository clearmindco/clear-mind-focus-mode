"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import type { NewsItem } from "@/lib/data-providers";

interface ResearchCategory {
  id: string;
  icon: string;
  label: string;
  sub: string;
  color: string;
  tracks: string[];
  whyItMatters: string;
  howAffectsStocks: string;
  beginnerExplanation: string;
  bullishExample: string;
  bearishExample: string;
  commonMistakes: string[];
  signalTypes: string[];
  dataSources: string[];
  plannedApi: string;
  apiKey: "finnhub" | "newsapi" | "none" | "paid-only";
  badgeLabel?: string;
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
    whyItMatters: "Interest rates are the single most powerful macro force in markets. Rate hikes crush high-multiple tech stocks, hurt bonds, and slow consumer spending. Rate cuts do the opposite.",
    howAffectsStocks: "Higher rates → tech and growth stocks fall (future earnings worth less). Lower rates → growth stocks rally, bonds rally, financials mixed. Surprise beats/misses on CPI can move the entire market in minutes.",
    beginnerExplanation: "Think of interest rates like the cost of borrowing money. When it's expensive to borrow, businesses grow slower, and stocks (especially tech companies) become less valuable because their future profits are discounted more heavily.",
    bullishExample: "Fed signals rate cuts after inflation cools to 2.1% — QQQ and growth stocks surge 3–5% in a day as investors price in cheaper money and higher future valuations.",
    bearishExample: "CPI prints at 3.8% vs 3.2% expected — bonds sell off instantly, tech drops 2%, the dollar spikes, and rate-cut expectations for the year get priced out.",
    commonMistakes: [
      "Buying the rumor (rate cut announcement) and holding through the news — markets often 'sell the event' even on good Fed decisions",
      "Ignoring the dot plot (the Fed's own projection of future rates) which often signals more hikes than the market expects",
      "Confusing a 'rate pause' (stop hiking) with a 'rate cut' (actively lowering) — they are very different for stock valuations",
    ],
    signalTypes: ["Rate Decision", "Fed Speak", "Inflation Print", "Employment Data"],
    dataSources: ["federalreserve.gov", "bls.gov", "CME FedWatch Tool"],
    plannedApi: "FRED API (free) — no key required",
    apiKey: "none",
  },
  {
    id: "tlt-bonds",
    icon: "🏛️",
    label: "TLT / Bonds",
    sub: "20-Year Treasury Yield & Bond Price Action",
    color: "#06b6d4",
    tracks: [
      "TLT ETF price action and 20-year yield movements",
      "2-year vs 10-year yield spread (inversion = recession signal)",
      "Duration risk in rate-sensitive sectors",
      "Institutional bond fund flow data",
    ],
    whyItMatters: "TLT is the backbone of macro analysis. When bond prices fall (yields rise), it pressures growth and tech stocks. When bonds rally, defensive sectors and dividends benefit.",
    howAffectsStocks: "TLT up (yields falling) → growth stocks like QQQ tend to rally. TLT down (yields rising) → tech stocks fall, financials can benefit. An inverted yield curve (2yr > 10yr) historically precedes recessions.",
    beginnerExplanation: "Bonds and stocks often move opposite each other. When bonds are in demand (safe haven), money flows out of stocks. When bonds sell off, money often rotates into equities. Watching TLT tells you where 'big money' feels comfortable.",
    bullishExample: "TLT breaks above $100 resistance as recession fears grow — bond prices rise, yields fall, and rate-sensitive utility and REIT stocks rally 3–4% in sympathy.",
    bearishExample: "TLT breaks below key support at $90 as inflation expectations rise — tech stocks (NVDA, AAPL) sell off simultaneously as the cost of future money rises.",
    commonMistakes: [
      "Trading individual bonds instead of more liquid ETFs like TLT (20yr), IEF (10yr), or SHY (2yr)",
      "Not checking the yield curve direction before buying rate-sensitive stocks — a rising yield environment crushes REITs and utilities",
      "Assuming bonds always move opposite stocks — in stagflation environments, both can fall at the same time",
    ],
    signalTypes: ["Yield Move", "TLT Breakout", "Curve Inversion", "Duration Risk"],
    dataSources: ["US Treasury (treasurydirect.gov)", "FRED (stlouisfed.org)"],
    plannedApi: "Finnhub — TLT real-time quote",
    apiKey: "finnhub",
  },
  {
    id: "energy-war",
    icon: "⚡",
    label: "Energy / War",
    sub: "Crude Oil, Natural Gas & Geopolitical Risk",
    color: "#f59e0b",
    tracks: [
      "WTI and Brent crude oil price levels",
      "Natural gas storage and supply reports (EIA weekly)",
      "OPEC+ production cut or increase decisions",
      "Middle East, Russia-Ukraine, and maritime disruptions",
    ],
    whyItMatters: "Energy shocks cascade into inflation, consumer spending, and sector rotation. Oil spikes benefit XLE and OXY while crushing airlines and consumer discretionary.",
    howAffectsStocks: "Oil spike → XLE, OXY, CVX rally. Airlines (AAL, DAL), trucking, and consumer staples get squeezed. High oil adds to inflation, which pressures the Fed to keep rates high, which hurts growth stocks.",
    beginnerExplanation: "When oil prices go up, gas at the pump costs more, shipping costs more, and everything made from oil gets more expensive. This creates inflation and squeezes corporate profit margins across many sectors.",
    bullishExample: "OPEC+ announces a surprise 1M barrel/day production cut — WTI crude spikes 4%, XLE and OXY rally 3%+ in a day, and energy sector ETFs outperform.",
    bearishExample: "Ceasefire announced in a key oil-producing region — oil drops 5% on reduced supply risk, energy stocks sell off despite the geopolitically 'good' news.",
    commonMistakes: [
      "Chasing oil stocks after a war headline — the initial price reaction often reverses completely within days as the situation clarifies",
      "Ignoring the EIA weekly inventory report (released every Wednesday) — a surprise inventory build can crush an oil trade",
      "Not accounting for the lag between oil prices and energy stock prices — sometimes XLE and OXY don't follow oil immediately",
    ],
    signalTypes: ["Oil Spike", "Supply Shock", "Geopolitical Event", "OPEC Decision"],
    dataSources: ["EIA.gov (free weekly data)", "CME Oil Futures"],
    plannedApi: "Finnhub — XLE, USO quotes",
    apiKey: "finnhub",
  },
  {
    id: "china",
    icon: "🌏",
    label: "China / Tariffs / Taiwan",
    sub: "PBOC Policy, Trade War & Supply Chain Risk",
    color: "#ef4444",
    tracks: [
      "PBOC rate decisions and reserve ratio changes",
      "US-China tariff announcements and export restrictions",
      "China tech sector regulation (BABA, Tencent, Baidu)",
      "Taiwan Strait tensions and semiconductor supply chain risk",
    ],
    whyItMatters: "China is the world's second-largest economy and dominant manufacturer of semiconductors and rare earth materials. Policy shifts create massive volatility for companies with China exposure.",
    howAffectsStocks: "New tariffs → supply chain costs rise, Apple and Tesla with China factories get hit. PBOC stimulus → Chinese ADRs (BABA, JD, BIDU) can spike. Taiwan conflict risk → semiconductor stocks (NVDA, AMD, ASML) face supply uncertainty.",
    beginnerExplanation: "Many US companies make their products in China or sell to Chinese consumers. When US-China relations worsen, tariffs make those products more expensive, hurting earnings. Taiwan is where most advanced chips are made, so any conflict there would be catastrophic for tech.",
    bullishExample: "US-China trade talks resume and tariffs are reduced — Apple, Tesla, and retailers with China supply chains spike 2–4% as cost pressures ease and market access improves.",
    bearishExample: "New 25% tariffs announced on $300B in Chinese goods — Apple drops 5% (major China manufacturer), supply chain stocks plunge, and inflation fears return.",
    commonMistakes: [
      "Buying Chinese ADRs (BABA, JD) on PBOC stimulus news without understanding VIE structure risk — ADR holders don't own shares in the actual company",
      "Ignoring Taiwan risk for NVDA and ASML — a conflict wouldn't just affect those companies directly; it would devastate the entire global semiconductor supply chain",
      "Assuming tariff negotiations are permanent — trade deals can reverse within weeks, making concentrated positions dangerous",
    ],
    signalTypes: ["Tariff Change", "PBOC Action", "Tech Regulation", "Taiwan Risk"],
    dataSources: ["People's Bank of China", "USTR.gov", "Reuters/Bloomberg"],
    plannedApi: "News sentiment via Finnhub or NewsAPI",
    apiKey: "newsapi",
  },
  {
    id: "ai-semis",
    icon: "🤖",
    label: "AI / Semiconductors",
    sub: "AI Capex, Chip Demand & Compute Infrastructure",
    color: "#10b981",
    tracks: [
      "NVDA, AMD, SMCI, AVGO earnings and guidance",
      "Hyperscaler AI capex announcements (MSFT, AMZN, GOOGL, META)",
      "Chip export controls and ASML equipment restrictions",
      "New AI model releases and compute demand signals",
    ],
    whyItMatters: "AI capex is the largest secular investment trend in markets today. Earnings surprises from NVDA alone can move the entire Nasdaq. Tracking AI infrastructure spending gives early visibility into sector rotation.",
    howAffectsStocks: "NVDA earnings beat → entire semiconductor sector rallies. New AI model release → data center and power companies benefit. Export control expansion → ASML, LRCX sell off. Capex cuts by hyperscalers → SMCI, networking stocks fall.",
    beginnerExplanation: "AI needs enormous amounts of computing power. Every time a company announces a big AI project, they need to buy chips (NVDA), servers (SMCI), networking gear (ANET), and power infrastructure. Following AI capex tells you which companies are growing fast.",
    bullishExample: "NVDA earnings: EPS $0.89 vs $0.73 expected, data center revenue up 400% year-over-year — SMH semiconductor ETF rallies 8%, AMD and AVGO follow with 5%+ gains.",
    bearishExample: "US expands chip export restrictions to 30 more countries including key customers — ASML drops 6%, LRCX and KLAC sell off 4%, and the entire semiconductor equipment sector re-rates lower.",
    commonMistakes: [
      "Buying NVDA after an earnings gap up (chasing) — the stock often gives back 50–80% of the initial move within days as sentiment normalizes",
      "Confusing 'AI hype' with 'AI fundamentals' — valuation matters even for secular growth; a 40x revenue stock needs flawless execution",
      "Assuming a good NVDA quarter means Intel or AMD will follow — different competitive positions lead to very different stock reactions",
    ],
    signalTypes: ["Earnings Beat", "Capex Guidance", "Export Control", "Model Release"],
    dataSources: ["SEC EDGAR filings", "Company IR pages", "SemiAnalysis"],
    plannedApi: "Finnhub — NVDA, AMD real-time + news",
    apiKey: "finnhub",
  },
  {
    id: "congressional",
    icon: "🏛️",
    label: "Congressional Trades",
    sub: "STOCK Act Disclosures & Political Activity",
    color: "#8b5cf6",
    tracks: [
      "House and Senate STOCK Act trade disclosures (45-day lag)",
      "Unusual position sizes relative to politician salary",
      "Committee assignments and sector overlap (Armed Services → defense)",
      "Cluster buying from multiple politicians before policy announcements",
    ],
    whyItMatters: "Members of Congress must disclose trades within 45 days. While trading on non-public info is illegal, pattern analysis can reveal regulatory or spending trends before they are widely known.",
    howAffectsStocks: "Cluster buying in defense stocks before defense budget increases → LMT, RTX, NOC may benefit. Healthcare committee members buying biotech before FDA rule changes. Energy committee buys before energy legislation.",
    beginnerExplanation: "Politicians must report their stock trades, but there's a delay of up to 45 days. When many politicians from the same committee are buying the same stocks, it can signal upcoming legislation or contracts. This is one research layer, not a buy signal.",
    bullishExample: "Multiple Senate Armed Services Committee members cluster-buy LMT and RTX in the same month — weeks later, a $50B emergency defense supplemental bill passes, and defense stocks rally 5–8%.",
    bearishExample: "Several healthcare committee members sell their UNH and CVS positions — two months later, new drug price negotiation regulations are announced, and the healthcare sector drops 4%.",
    commonMistakes: [
      "Treating congressional trades as insider tips — the 45-day reporting lag means the stock has already moved significantly before you see the filing",
      "Over-weighting small trades — politicians must disclose even $1,001 transactions, which are statistically insignificant",
      "Ignoring that many disclosed trades are from spouses, blind trusts, or automatic investment programs — not discretionary bets",
    ],
    signalTypes: ["Cluster Buy", "Pre-Legislation", "Defense/Healthcare", "Unusual Size"],
    dataSources: ["housestockwatcher.com (free)", "capitoltrades.com", "quiverquant.com"],
    plannedApi: "No free API — requires quiverquant.com (paid) or data scraping",
    apiKey: "paid-only",
    badgeLabel: "No Free API",
  },
  {
    id: "insider",
    icon: "🔍",
    label: "Insider Activity",
    sub: "Form 4 SEC Filings & Executive Transactions",
    color: "#f97316",
    tracks: [
      "CEO, CFO, COO, and board director Form 4 filings",
      "Open market purchases vs option exercises and grants",
      "Cluster buying from multiple insiders at the same company",
      "Heavy selling near earnings or lock-up expiration dates",
    ],
    whyItMatters: "Executives know their company better than any analyst. When multiple insiders buy on the open market at significant dollar amounts, that is one of the most reliable fundamental signals available.",
    howAffectsStocks: "Cluster insider buying → stock often outperforms over the next 6–12 months. CFO buying is the most bullish signal (they control the books). Heavy selling before bad news is a warning. Option exercises alone are not bullish.",
    beginnerExplanation: "Insiders must report trades to the SEC. When a CEO buys $1M of their own stock with their own money on the open market, they're betting personal wealth on the company. That's a powerful signal. Selling is less meaningful — they could just be diversifying.",
    bullishExample: "A small-cap CEO buys $2M of company stock on the open market at $18/share — over the next 8 months, the stock doubles to $36 as the company executes on a turnaround plan the insider clearly believed in.",
    bearishExample: "Multiple vice presidents sell large blocks of shares 2 months before a guidance cut — the cluster selling was a warning sign that insiders knew the next quarter would disappoint.",
    commonMistakes: [
      "Treating option exercises as bullish signals — insiders receive options as compensation and often immediately sell the shares they exercise",
      "Acting on a single small purchase — cluster buying from 3+ insiders at significant dollar values is far more meaningful than one small trade",
      "Ignoring the dollar amount relative to the insider's net worth — a $10K purchase from a billionaire CEO is noise; a $500K purchase is conviction",
    ],
    signalTypes: ["Cluster Buy", "CFO Open Market Buy", "Pre-Earnings Activity", "Large $Value"],
    dataSources: ["SEC EDGAR (Form 4)", "openinsider.com (free)", "finviz.com/insidertrading"],
    plannedApi: "Finnhub insider-transactions endpoint (free)",
    apiKey: "finnhub",
  },
  {
    id: "small-cap",
    icon: "🚀",
    label: "Small-Cap Catalysts",
    sub: "FDA Approvals, Earnings Surprises & Contract Wins",
    color: "#ec4899",
    tracks: [
      "FDA PDUFA dates and binary event calendar",
      "Earnings surprise magnitude for sub-$2B market cap companies",
      "Government contract awards (DoD, DHS, HHS infrastructure)",
      "Reverse merger, SPAC, and short squeeze candidates",
    ],
    whyItMatters: "Small caps move violently on news because the float is small and institutional coverage is thin. A single FDA approval can triple a biotech. Knowing the catalyst calendar in advance is the edge.",
    howAffectsStocks: "FDA approval → biotech can 3–10x. Rejection → can lose 50–80% in a day. Contract win → defense micro-cap can double. Short squeeze setup → stock with 30%+ short interest and a catalyst can go parabolic.",
    beginnerExplanation: "Small companies often have one big upcoming event — like a drug approval or a major contract decision — that will make or break the stock. These 'binary events' are extremely risky (essentially a coin flip), but knowing the calendar helps you understand why a stock is moving.",
    bullishExample: "A small biotech's drug receives unexpected FDA approval — the stock jumps 280% in pre-market trading, followed by significant profit-taking, and ultimately settles 150% above the previous close.",
    bearishExample: "FDA issues a complete response letter (CRL, essentially a rejection) on PDUFA date — the biotech drops 78% in hours as the binary event resolves negatively and short sellers cover profitably.",
    commonMistakes: [
      "Holding through binary FDA events without sizing for total loss — a rejection can take your position from $5,000 to $1,100 overnight",
      "Confusing 'catalyst upcoming' with 'catalyst positive' — the outcome is genuinely unknown; both outcomes are equally possible",
      "Over-concentrating portfolio in a single catalyst trade — professional traders often cap binary event exposure at 1–2% of portfolio",
    ],
    signalTypes: ["FDA Decision", "Earnings Beat", "Contract Win", "Short Squeeze Setup"],
    dataSources: ["FDA.gov (PDUFA calendar)", "Briefing.com", "BioPharmCatalyst.com"],
    plannedApi: "Finnhub — earnings calendar + news",
    apiKey: "finnhub",
  },
  {
    id: "news-sentiment",
    icon: "📰",
    label: "News Sentiment",
    sub: "Market Headlines & Sentiment Radar",
    color: "#14b8a6",
    tracks: [
      "Breaking market news from major financial outlets",
      "Earnings beats and misses across all sectors",
      "Macro data releases and Fed commentary",
      "Sector rotation headlines and unusual volume triggers",
    ],
    whyItMatters: "Markets often react to news faster than fundamentals justify. Being able to identify what's driving a move — and whether the market reaction is overblown — is a core skill for any trader.",
    howAffectsStocks: "Positive earnings surprise → stock gaps up at open (often gives back). Unexpected Fed hawkishness → instant broad selloff. Sector-specific news → affects entire industry ETF and related stocks. Sentiment extremes often precede reversals.",
    beginnerExplanation: "Price follows news, and news follows sentiment. If everyone is talking about how great a stock is, it's probably already priced in. Learning to read news critically — 'is this actually new information or just hype?' — separates disciplined traders from followers.",
    bullishExample: "Fed Chair says inflation is 'well-controlled and trending toward target' at Jackson Hole symposium — SPY rallies 2% in 20 minutes as rate-cut expectations are pulled forward.",
    bearishExample: "Surprise CPI print comes in 0.3% above expectations — SPY drops 1.5% in the first minute, VIX spikes from 16 to 22, and bond yields jump across the curve.",
    commonMistakes: [
      "Reacting to headlines without asking 'is this new information?' — often the news is already priced in and trading on it means buying the top",
      "Entering trades in the first 30 seconds of a news spike — these moves often reverse 80% within minutes as initial algo reactions fade",
      "Following financial Twitter/Reddit as a news source — social media sentiment consistently lags the actual price move",
    ],
    signalTypes: ["Breaking News", "Earnings Surprise", "Sentiment Extreme", "Rotation Signal"],
    dataSources: ["NewsAPI.org", "Finnhub company news", "Reuters / Bloomberg headlines"],
    plannedApi: "NewsAPI.org (NEWS_API_KEY) + Finnhub news",
    apiKey: "newsapi",
  },
  {
    id: "options-flow",
    icon: "🌊",
    label: "Options Flow Roadmap",
    sub: "Unusual Options Activity & Dark Pool Prints",
    color: "#a78bfa",
    tracks: [
      "Large unusual options orders (sweeps) before earnings",
      "Dark pool prints and block trades above average size",
      "Put/call ratio extremes as contrarian indicators",
      "Gamma exposure (GEX) and dealer hedging impact on price",
    ],
    whyItMatters: "Options flow can reveal where large institutions are positioning before a major move. Unusual sweeps in out-of-the-money calls before earnings often precede big moves.",
    howAffectsStocks: "Large call sweep → often a bullish bet from a big player (could be a hedge). High put/call ratio → extreme fear, often a contrarian buy signal. High GEX at a strike price → stock tends to pin near that strike near expiration.",
    beginnerExplanation: "Options let traders bet on where a stock is going without buying the stock. When a very large options order comes through — especially if it's unusual size and in a short-dated expiration — it can signal that someone with information (or just a lot of conviction) is making a big bet.",
    bullishExample: "Unusual call sweep: 8,000 contracts of $150 NVDA calls expiring in 3 weeks bought in one sweep at the ask for $2.1M premium — the stock rallies 12% over the next week.",
    bearishExample: "Heavy put buying in SPY with put/call ratio spiking to 1.4 — extreme fear reading that historically precedes either a sharp selloff or a contrarian reversal as the hedges are unwound.",
    commonMistakes: [
      "Assuming all unusual options flow is from informed traders — institutional hedging looks identical to a directional bet from the outside",
      "Ignoring open interest vs volume — a new position and an existing position being rolled have very different implications",
      "Copying a large options trade without knowing the full context — the buyer may have an opposing hedge that makes their actual directional bet completely different from what it appears",
    ],
    signalTypes: ["Unusual Sweep", "Dark Pool Print", "High Put/Call", "GEX Pinning"],
    dataSources: ["unusualwhales.com (free tier)", "MarketChameleon.com", "Barchart unusual activity"],
    plannedApi: "No free API — unusualwhales.com paid tier or premium data",
    apiKey: "paid-only",
    badgeLabel: "No Free API",
  },
  {
    id: "investor-movement-lab",
    icon: "🧪",
    label: "Investor Movement Lab",
    sub: "Insider · Institutional · Congressional · Sentiment",
    color: "#a855f7",
    tracks: [
      "Insider buying and selling (Form 4 filings)",
      "Institutional 13F filings — what hedge funds and funds are buying",
      "Congressional STOCK Act disclosures",
      "Social sentiment (Twitter/Reddit mention volume) and CEO commentary",
      "Unusual volume spikes as potential informed-buying signals",
    ],
    whyItMatters: "Tracking how insiders, institutions, politicians, and the crowd are positioned gives a layered view of conviction behind a stock move. No single signal is definitive, but convergence of signals increases confidence.",
    howAffectsStocks: "Multiple insiders buying + institutional accumulation + rising sentiment = high-conviction setup. Congress cluster-buying defense + energy = possible legislative catalyst ahead. 13F data showing hedge funds exiting = potential institutional distribution.",
    beginnerExplanation: "Before you buy a stock, it's worth asking: are the insiders buying or selling? Are big funds accumulating or distributing? Are politicians making unusual trades? These signals don't guarantee anything, but they provide context that a stock chart alone cannot.",
    bullishExample: "CEO buys $5M open market + a major hedge fund adds 2M shares in their 13F + Congressional cluster buy in the same sector all within 6 weeks — high-conviction convergence setup.",
    bearishExample: "CFO sells 80% of holdings + three 13F filings show reduction in position + social sentiment turns sharply negative all in the same month — distribution signal across multiple smart money categories.",
    commonMistakes: [
      "Treating any single signal as a buy/sell trigger — the power of this framework is in the convergence of multiple signals pointing the same direction",
      "Ignoring that 13F data is filed 45 days after quarter end — the fund's position may have changed completely by the time you see it",
      "Not separating 'smart money interest in a sector' from 'smart money directional bet on a specific stock' — they require different trading strategies",
    ],
    signalTypes: ["13F Accumulation", "Insider Cluster Buy", "Congress Disclosure", "Sentiment Spike"],
    dataSources: ["SEC EDGAR Form 4 + 13F", "openinsider.com", "capitoltrades.com"],
    plannedApi: "Finnhub insider endpoint + SEC EDGAR free API",
    apiKey: "finnhub",
    badgeLabel: "Academy Module Available",
  },
];

export default function ResearchLab() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<{ finnhub: boolean; newsApi: boolean } | null>(null);
  const [headlines, setHeadlines] = useState<NewsItem[]>([]);
  const [headlinesLoading, setHeadlinesLoading] = useState(false);
  const [headlinesFetched, setHeadlinesFetched] = useState(false);

  useEffect(() => {
    fetch("/api/status").then(r => r.json()).then(setApiStatus).catch(() => {});
  }, []);

  const finnhubOk = apiStatus?.finnhub ?? false;
  const newsApiOk = apiStatus?.newsApi ?? false;

  async function loadHeadlines() {
    setHeadlinesLoading(true);
    try {
      const res = await fetch("/api/news?query=stock%20market%20today");
      if (res.ok) {
        const data = await res.json() as NewsItem[];
        setHeadlines(data.filter(n => !n.isPlaceholder).slice(0, 5));
      }
    } catch {
      // keep empty
    } finally {
      setHeadlinesLoading(false);
      setHeadlinesFetched(true);
    }
  }

  function getConnectionStatus(apiKey: ResearchCategory["apiKey"]) {
    if (apiKey === "none") return { label: "No API Needed", color: "#5a6075", bg: "#141720" };
    if (apiKey === "paid-only") return { label: "Paid API Only", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" };
    if (apiKey === "finnhub") return finnhubOk
      ? { label: "Finnhub Connected", color: "#10b981", bg: "rgba(16,185,129,0.1)" }
      : { label: "Finnhub Missing", color: "#5a6075", bg: "#141720" };
    if (apiKey === "newsapi") return newsApiOk
      ? { label: "NewsAPI Connected", color: "#10b981", bg: "rgba(16,185,129,0.1)" }
      : { label: "NewsAPI Missing", color: "#5a6075", bg: "#141720" };
    return { label: "—", color: "#5a6075", bg: "#141720" };
  }

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
            🔬 Research Framework
          </div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: "#e8eaf0" }}>
            EDGE <span style={{ color: "#8b5cf6" }}>Research Lab</span>
          </h1>
          <p className="text-sm" style={{ color: "#9aa0b4" }}>
            {CATEGORIES.length} research areas · Bullish &amp; bearish examples · Common mistakes · Understand what moves markets
          </p>
        </div>

        {/* Compliance banner */}
        <div
          className="rounded-xl p-4 flex gap-3 items-start mb-8"
          style={{ background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.15)" }}
        >
          <span className="text-base flex-shrink-0">🔬</span>
          <p className="text-xs leading-relaxed" style={{ color: "#9aa0b4" }}>
            <strong style={{ color: "#8b5cf6" }}>Educational research framework only.</strong> Each section explains what it tracks, why it matters, how it affects stock prices, real bullish and bearish examples, and the most common beginner mistakes. No content here constitutes investment advice, a buy/sell recommendation, or a guarantee of returns. Signals are decision-support tools, not instructions. Always paper trade first.
          </p>
        </div>

        {/* Connection status */}
        <div
          className="rounded-xl p-4 flex gap-4 items-center flex-wrap mb-8"
          style={{ background: "#0f1117", border: "1px solid #1e2433" }}
        >
          <span className="text-xs font-semibold" style={{ color: "#5a6075" }}>Data status:</span>
          {[
            { label: "Finnhub", ok: finnhubOk },
            { label: "NewsAPI", ok: newsApiOk },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.ok ? "#10b981" : "#5a6075" }} />
              <span className="text-xs" style={{ color: s.ok ? "#10b981" : "#5a6075" }}>
                {s.label}: {s.ok ? "Connected" : "Missing"}
              </span>
            </div>
          ))}
          {!finnhubOk && !newsApiOk && (
            <a href="/api-setup" className="text-xs ml-auto" style={{ color: "#00d4ff" }}>
              ⚙️ API Setup →
            </a>
          )}
        </div>

        {/* Category grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {CATEGORIES.map(cat => {
            const isOpen = expanded === cat.id;
            const connStatus = getConnectionStatus(cat.apiKey);

            return (
              <div
                key={cat.id}
                className="rounded-2xl overflow-hidden transition-all duration-200"
                style={{ background: "#0f1117", border: `1px solid ${isOpen ? cat.color + "40" : "#1e2433"}` }}
              >
                {/* Card header */}
                <button className="w-full text-left p-5" onClick={() => setExpanded(isOpen ? null : cat.id)}>
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: `${cat.color}10`, border: `1px solid ${cat.color}25` }}
                    >
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-bold text-sm" style={{ color: "#e8eaf0" }}>{cat.label}</span>
                        {cat.badgeLabel && (
                          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${cat.color}15`, color: cat.color }}>
                            {cat.badgeLabel}
                          </span>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: cat.color }}>{cat.sub}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: connStatus.bg, color: connStatus.color }}>
                        {connStatus.label}
                      </span>
                      <span
                        className="text-base transition-transform duration-200"
                        style={{ color: "#5a6075", transform: isOpen ? "rotate(180deg)" : "none", display: "inline-block" }}
                      >
                        ↓
                      </span>
                    </div>
                  </div>

                  {/* Signal chips */}
                  <div className="flex gap-1.5 flex-wrap">
                    {cat.signalTypes.map(s => (
                      <span key={s} className="text-xs px-2 py-0.5 rounded" style={{ background: `${cat.color}10`, color: cat.color, border: `1px solid ${cat.color}20` }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="px-5 pb-5 space-y-4 border-t" style={{ borderColor: "#1e2433" }}>
                    {/* Beginner explanation */}
                    <div className="pt-4">
                      <div className="rounded-xl p-4" style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)" }}>
                        <p className="text-xs font-semibold mb-1" style={{ color: "#00d4ff" }}>🎓 Beginner Explanation</p>
                        <p className="text-xs leading-relaxed" style={{ color: "#9aa0b4" }}>{cat.beginnerExplanation}</p>
                      </div>
                    </div>

                    {/* Bull / Bear examples */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-xl p-4" style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.2)" }}>
                        <p className="text-xs font-semibold mb-1.5" style={{ color: "#10b981" }}>🐂 Bullish Example</p>
                        <p className="text-xs leading-relaxed" style={{ color: "#9aa0b4" }}>{cat.bullishExample}</p>
                      </div>
                      <div className="rounded-xl p-4" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)" }}>
                        <p className="text-xs font-semibold mb-1.5" style={{ color: "#ef4444" }}>🐻 Bearish Example</p>
                        <p className="text-xs leading-relaxed" style={{ color: "#9aa0b4" }}>{cat.bearishExample}</p>
                      </div>
                    </div>

                    {/* How it affects stocks */}
                    <div className="rounded-xl p-4" style={{ background: `${cat.color}08`, border: `1px solid ${cat.color}20` }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: cat.color }}>📊 How it affects stocks</p>
                      <p className="text-xs leading-relaxed" style={{ color: "#9aa0b4" }}>{cat.howAffectsStocks}</p>
                    </div>

                    {/* Common mistakes */}
                    <div className="rounded-xl p-4" style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)" }}>
                      <p className="text-xs font-semibold mb-2" style={{ color: "#f59e0b" }}>⚠️ Common Beginner Mistakes</p>
                      <ul className="space-y-2">
                        {cat.commonMistakes.map((m, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "#9aa0b4" }}>
                            <span className="flex-shrink-0 mt-0.5" style={{ color: "#f59e0b" }}>✗</span>
                            {m}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* What it tracks */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#5a6075" }}>What it tracks</p>
                      <ul className="space-y-1.5">
                        {cat.tracks.map((t, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "#9aa0b4" }}>
                            <span className="flex-shrink-0 mt-0.5" style={{ color: cat.color }}>▸</span>
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Why it matters */}
                    <div className="rounded-xl p-3" style={{ background: "#141720", border: "1px solid #1e2433" }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: "#9aa0b4" }}>Why it matters</p>
                      <p className="text-xs leading-relaxed" style={{ color: "#9aa0b4" }}>{cat.whyItMatters}</p>
                    </div>

                    {/* Data sources + API */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#5a6075" }}>Free data sources</p>
                        <div className="flex gap-2 flex-wrap">
                          {cat.dataSources.map(ds => (
                            <span key={ds} className="text-xs px-2.5 py-1 rounded-full" style={{ background: "#0a0b0d", color: "#9aa0b4", border: "1px solid #1e2433" }}>
                              {ds}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#5a6075" }}>Planned API source</p>
                        <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: connStatus.bg, color: connStatus.color, border: "1px solid #1e2433" }}>
                          {cat.plannedApi}
                        </span>
                      </div>
                    </div>

                    {/* Special: Investor Movement Lab link */}
                    {cat.id === "investor-movement-lab" && (
                      <div
                        className="rounded-xl p-4 flex items-center justify-between gap-3"
                        style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.2)" }}
                      >
                        <div>
                          <p className="text-xs font-semibold mb-0.5" style={{ color: "#a855f7" }}>Full lesson available in Academy</p>
                          <p className="text-xs" style={{ color: "#9aa0b4" }}>
                            Module 10: Investor Movement Lab covers insider activity, 13F filings, congressional signals, and the full Catalyst + Movement Score calculator.
                          </p>
                        </div>
                        <Link
                          href="/module/investor-movement-lab"
                          className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold"
                          style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.3)" }}
                        >
                          Go to Module →
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Live Headlines Widget */}
        <div className="mt-8 rounded-2xl p-6" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div>
              <p className="font-semibold text-sm" style={{ color: "#e8eaf0" }}>📰 Latest Market Headlines</p>
              <p className="text-xs mt-0.5" style={{ color: "#5a6075" }}>
                {newsApiOk ? "Live via NewsAPI — educational reference only, not trade signals" : "NewsAPI not connected — add NEWS_API_KEY to see live headlines"}
              </p>
            </div>
            <button
              onClick={loadHeadlines}
              disabled={headlinesLoading || !newsApiOk}
              className="text-xs px-4 py-2 rounded-xl transition-all"
              style={{
                background: newsApiOk ? "rgba(139,92,246,0.1)" : "#141720",
                color: newsApiOk ? "#8b5cf6" : "#5a6075",
                border: `1px solid ${newsApiOk ? "rgba(139,92,246,0.3)" : "#1e2433"}`,
                cursor: newsApiOk && !headlinesLoading ? "pointer" : "not-allowed",
              }}
            >
              {headlinesLoading ? "Loading…" : "Load Latest Headlines"}
            </button>
          </div>

          {headlinesFetched && headlines.length === 0 && (
            <p className="text-xs" style={{ color: "#5a6075" }}>No headlines returned — NewsAPI may require a production plan for this query.</p>
          )}

          {headlines.length > 0 && (
            <div className="space-y-3">
              {headlines.map((item, i) => (
                <div key={i} className="rounded-xl p-3 flex items-start gap-3" style={{ background: "#141720", border: "1px solid #1e2433" }}>
                  <span className="text-xs flex-shrink-0 mt-0.5 px-1.5 py-0.5 rounded" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>live</span>
                  <div className="flex-1 min-w-0">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium leading-snug hover:underline"
                      style={{ color: "#e8eaf0" }}
                    >
                      {item.headline}
                    </a>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs" style={{ color: "#5a6075" }}>{item.source}</span>
                      <span className="text-xs" style={{ color: "#3a4060" }}>
                        {new Date(item.datetime).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <p className="text-xs" style={{ color: "#5a6075" }}>
                Educational reference only · Not financial advice · Always verify news before acting
              </p>
            </div>
          )}

          {!headlinesFetched && !newsApiOk && (
            <div className="rounded-xl p-4" style={{ background: "#141720", border: "1px solid #1e2433" }}>
              <p className="text-xs" style={{ color: "#5a6075" }}>Add <code style={{ color: "#9aa0b4" }}>NEWS_API_KEY</code> to your Netlify environment variables and redeploy to enable live headlines.</p>
            </div>
          )}
        </div>

        {/* Roadmap */}
        <div className="mt-10 rounded-2xl p-6 text-center" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
          <div className="text-3xl mb-3">📡</div>
          <h3 className="font-semibold mb-2" style={{ color: "#e8eaf0" }}>Live Research Reports — Coming Soon</h3>
          <p className="text-sm max-w-xl mx-auto mb-5" style={{ color: "#9aa0b4" }}>
            Each category will receive live data feeds and weekly editorial updates when APIs are connected. All content will remain educational research, not trading recommendations.
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            {["Weekly Macro Recap", "Fed Watch Calendar", "Catalyst Radar", "Flow Alerts", "Sector Rotation Map", "13F Tracker"].map(f => (
              <span key={f} className="text-xs px-3 py-1.5 rounded-full" style={{ background: "#141720", color: "#5a6075", border: "1px solid #1e2433" }}>
                {f}
              </span>
            ))}
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "#5a6075" }}>
          Educational research only · Not financial advice · No guaranteed returns · Signals are decision-support tools, not instructions · Always paper trade first
        </p>
      </div>
    </div>
  );
}

// Server component — reads env vars at build time.
// Shows Connected / Missing only — never renders actual key values.
import Navbar from "@/components/Navbar";

interface ApiEntry {
  name: string;
  envKey: string;
  connected: boolean;
  wired: "live" | "future";
  description: string;
  usedIn: string;
  getFrom: string;
  tier: string;
}

function isRealKey(val: string | undefined): boolean {
  return !!val && !val.startsWith("your_") && val.length > 10;
}

const APIS: ApiEntry[] = [
  {
    name: "Finnhub",
    envKey: "NEXT_PUBLIC_FINNHUB_API_KEY",
    connected: isRealKey(process.env.NEXT_PUBLIC_FINNHUB_API_KEY),
    wired: "live",
    description: "Real-time stock quotes (price, change, OHLC). Also provides company news and insider transaction filings for future features.",
    usedIn: "Terminal — live price cards (SPY, QQQ, IWM, TLT, XLE, NVDA, TSLA)",
    getFrom: "finnhub.io → Sign up free → Dashboard → API Key",
    tier: "Free: 60 calls/min",
  },
  {
    name: "Alpha Vantage",
    envKey: "NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY",
    connected: isRealKey(process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY),
    wired: "future",
    description: "Technical indicators: RSI, MACD, SMA, EMA. Fetch function defined in lib/data-providers.ts but not yet connected to any UI element.",
    usedIn: "Terminal technical overlays — coming soon",
    getFrom: "alphavantage.co → Get your free API key",
    tier: "Free: 25 calls/day",
  },
  {
    name: "NewsAPI",
    envKey: "NEXT_PUBLIC_NEWS_API_KEY",
    connected: isRealKey(process.env.NEXT_PUBLIC_NEWS_API_KEY),
    wired: "future",
    description: "Market news headlines. Connection status checked in Research Lab. Fetch function defined but news feed UI not yet built.",
    usedIn: "Research Lab news sentiment feed — coming soon",
    getFrom: "newsapi.org → Get API Key (developer plan)",
    tier: "Free dev: 100 calls/day (localhost only on free tier)",
  },
];

const connectedCount = APIS.filter(a => a.connected).length;
const liveWired = APIS.filter(a => a.wired === "live");
const futureWired = APIS.filter(a => a.wired === "future");

export default function ApiSetupPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0b0d" }}>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 pt-10 pb-20">

        {/* Header */}
        <div className="mb-8">
          <div
            className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium mb-3"
            style={{ background: "rgba(0,212,255,0.08)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.2)" }}
          >
            ⚙️ Configuration
          </div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: "#e8eaf0" }}>
            API <span style={{ color: "#00d4ff" }}>Setup</span>
          </h1>
          <p className="text-sm" style={{ color: "#9aa0b4" }}>
            3 API integrations · 1 currently wired to live features · 2 ready for future features
          </p>
        </div>

        {/* Status summary */}
        <div
          className="rounded-2xl p-5 mb-8"
          style={{ background: "#0f1117", border: "1px solid #1e2433" }}
        >
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div>
              <p className="font-semibold" style={{ color: "#e8eaf0" }}>
                {connectedCount} of {APIS.length} keys configured
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#5a6075" }}>
                Status reflects environment at last build. Redeploy on Netlify after adding keys.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: "#10b981" }} />
                <span className="text-xs" style={{ color: "#9aa0b4" }}>Connected ({connectedCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: "#5a6075" }} />
                <span className="text-xs" style={{ color: "#9aa0b4" }}>Missing ({APIS.length - connectedCount})</span>
              </div>
            </div>
          </div>

          {/* Wired status summary */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div
              className="rounded-xl p-3"
              style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}
            >
              <p className="font-semibold mb-1" style={{ color: "#10b981" }}>Live features</p>
              <p style={{ color: "#9aa0b4" }}>Finnhub → Terminal price cards fetch live quotes on page load.</p>
            </div>
            <div
              className="rounded-xl p-3"
              style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}
            >
              <p className="font-semibold mb-1" style={{ color: "#f59e0b" }}>Future features</p>
              <p style={{ color: "#9aa0b4" }}>Alpha Vantage + NewsAPI are defined but not yet connected to UI.</p>
            </div>
          </div>
        </div>

        {/* How to add keys */}
        <div
          className="rounded-xl p-4 mb-8 flex gap-3 items-start"
          style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)" }}
        >
          <span className="text-base flex-shrink-0">📋</span>
          <div className="text-xs leading-relaxed space-y-1" style={{ color: "#9aa0b4" }}>
            <p><strong style={{ color: "#00d4ff" }}>Netlify:</strong> Site Settings → Environment Variables → Add variable → enter key name + value → Save → Trigger new deploy.</p>
            <p><strong style={{ color: "#00d4ff" }}>Local dev:</strong> Copy <code style={{ color: "#e8eaf0" }}>.env.example</code> → rename to <code style={{ color: "#e8eaf0" }}>.env.local</code> → fill in real values → restart dev server.</p>
            <p className="pt-1" style={{ color: "#5a6075" }}>All three keys use the <code>NEXT_PUBLIC_</code> prefix — they are browser-safe and embedded in the JS bundle at build time. Do not use them for secrets that must stay server-side.</p>
          </div>
        </div>

        {/* Live wired APIs */}
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "#e8eaf0" }}>
          <span
            className="text-xs px-2 py-0.5 rounded"
            style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}
          >
            LIVE
          </span>
          Currently wired to features
        </h2>
        <div className="space-y-3 mb-8">
          {liveWired.map(api => <ApiCard key={api.name} api={api} />)}
        </div>

        {/* Future APIs */}
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "#e8eaf0" }}>
          <span
            className="text-xs px-2 py-0.5 rounded"
            style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}
          >
            FUTURE
          </span>
          Defined in data layer — feature UI not yet built
        </h2>
        <div className="space-y-3 mb-8">
          {futureWired.map(api => <ApiCard key={api.name} api={api} />)}
        </div>

        {/* Security note */}
        <div
          className="rounded-xl p-4 flex gap-3 items-start"
          style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)" }}
        >
          <span className="text-base flex-shrink-0">🔒</span>
          <div className="text-xs leading-relaxed space-y-1" style={{ color: "#9aa0b4" }}>
            <p><strong style={{ color: "#ef4444" }}>Security notes:</strong></p>
            <ul className="space-y-0.5">
              <li>• This page shows Connected / Missing only — key values are never rendered.</li>
              <li>• <code>.env.local</code> is in <code>.gitignore</code> — it will not be committed.</li>
              <li>• <code>NEXT_PUBLIC_</code> keys are browser-visible by design (rate-limited free APIs). Do not use this prefix for secrets.</li>
              <li>• If you suspect a key was leaked, rotate it immediately at the provider&apos;s dashboard.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function ApiCard({ api }: { api: ApiEntry }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: "#0f1117",
        border: `1px solid ${api.connected ? "rgba(16,185,129,0.2)" : "#1e2433"}`,
      }}
    >
      <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="font-semibold text-sm" style={{ color: "#e8eaf0" }}>{api.name}</span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{
                background: api.connected ? "rgba(16,185,129,0.1)" : "rgba(90,96,117,0.2)",
                color: api.connected ? "#10b981" : "#5a6075",
              }}
            >
              {api.connected ? "✓ Connected" : "Missing"}
            </span>
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                background: api.wired === "live" ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.08)",
                color: api.wired === "live" ? "#10b981" : "#f59e0b",
              }}
            >
              {api.wired === "live" ? "live feature" : "future feature"}
            </span>
          </div>
          <code className="text-xs" style={{ color: "#5a6075" }}>{api.envKey}</code>
        </div>
        <span className="text-xs px-2 py-0.5 rounded flex-shrink-0" style={{ background: "#141720", color: "#9aa0b4", border: "1px solid #1e2433" }}>
          {api.tier}
        </span>
      </div>

      <p className="text-xs mb-2" style={{ color: "#9aa0b4" }}>{api.description}</p>

      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs" style={{ color: "#5a6075" }}>
        <span><strong style={{ color: "#9aa0b4" }}>Used in:</strong> {api.usedIn}</span>
        <span><strong style={{ color: "#9aa0b4" }}>Get key:</strong> {api.getFrom}</span>
      </div>
    </div>
  );
}

// Server component — reads env vars at build time.
// Shows Connected / Missing only — never renders actual key values.
import Navbar from "@/components/Navbar";
import { isRealKey } from "@/lib/server-data";

interface ApiEntry {
  name: string;
  envKey: string;
  connected: boolean;
  wired: "live" | "future" | "planned";
  description: string;
  usedIn: string;
  getFrom: string;
  tier: string;
  category: "data" | "news" | "backend" | "ai";
}

const APIS: ApiEntry[] = [
  // ── Currently wired ──
  {
    name: "Finnhub",
    envKey: "FINNHUB_API_KEY",
    connected: isRealKey(process.env.FINNHUB_API_KEY),
    wired: "live",
    description: "Real-time stock quotes (price, change, OHLC), company news, and insider transaction Form 4 filings. Server-only key — fetched via /api/quote, /api/news, /api/market-radar, and /api/signal routes.",
    usedIn: "Terminal — live price cards (SPY, QQQ, IWM, TLT, XLE, NVDA, TSLA) + Signal scoring",
    getFrom: "finnhub.io → Sign up free → Dashboard → API Key",
    tier: "Free: 60 calls/min",
    category: "data",
  },
  // ── Future — defined in data layer ──
  {
    name: "Alpha Vantage",
    envKey: "ALPHA_VANTAGE_API_KEY",
    connected: isRealKey(process.env.ALPHA_VANTAGE_API_KEY),
    wired: "future",
    description: "Technical indicators: RSI, MACD, SMA, EMA. Key detected — fetch function exists in lib/server-data.ts but indicator overlays are not yet wired to any UI. Key detected ≠ feature live.",
    usedIn: "Terminal technical overlays — key exists, UI not yet built",
    getFrom: "alphavantage.co → Get your free API key",
    tier: "Free: 25 calls/day",
    category: "data",
  },
  {
    name: "NewsAPI",
    envKey: "NEWS_API_KEY",
    connected: isRealKey(process.env.NEWS_API_KEY),
    wired: "future",
    description: "Market news headlines from major financial outlets. Server-only key — wired to /api/news?query= and the Research Lab 'Latest Headlines' widget.",
    usedIn: "Research Lab — Latest Headlines news widget",
    getFrom: "newsapi.org → Get API Key (developer plan)",
    tier: "Free dev: 100 calls/day (localhost only on free tier)",
    category: "news",
  },
  {
    name: "OpenAI",
    envKey: "OPENAI_API_KEY",
    connected: isRealKey(process.env.OPENAI_API_KEY),
    wired: "future",
    description: "AI Trade Coach: reviews paper trade thesis via /api/ai-trade-coach, returns structured educational feedback. Server-only key — never exposed to browser. All output is labeled educational only, not financial advice.",
    usedIn: "Paper Lab — AI Trade Coach panel (review trade thesis)",
    getFrom: "platform.openai.com → API Keys → Create new secret key",
    tier: "Pay-per-use: ~$0.002–$0.06 per 1K tokens (gpt-4o-mini)",
    category: "ai",
  },
  {
    name: "Supabase",
    envKey: "NEXT_PUBLIC_SUPABASE_URL",
    connected: isRealKey(process.env.NEXT_PUBLIC_SUPABASE_URL) && isRealKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    wired: "future",
    description: "Keys detected (URL + anon key) — database sync is not implemented yet. Paper Lab still uses localStorage. Cloud sync and cross-device progress are planned for a future update.",
    usedIn: "Progress sync, user accounts — keys exist, database code not yet written",
    getFrom: "supabase.com → New project (free tier available)",
    tier: "Free: 500MB DB, 2 projects; Pro $25/mo",
    category: "backend",
  },
];

const connectedCount = APIS.filter(a => a.connected).length;
const liveWired = APIS.filter(a => a.wired === "live");
const futureWired = APIS.filter(a => a.wired === "future");
const plannedApis = APIS.filter(a => a.wired === "planned");

const CATEGORY_LABELS: Record<ApiEntry["category"], string> = {
  data: "Market Data",
  news: "News",
  backend: "Backend / Database",
  ai: "AI / Intelligence",
};

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
            {APIS.length} API integrations · {liveWired.length} live · {futureWired.length} defined (UI pending) · {plannedApis.length} planned for future features
          </p>
        </div>

        {/* Status summary */}
        <div className="rounded-2xl p-5 mb-8" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div>
              <p className="font-semibold" style={{ color: "#e8eaf0" }}>
                {connectedCount} of {liveWired.length + futureWired.length} keys configured
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
                <span className="text-xs" style={{ color: "#9aa0b4" }}>Missing ({liveWired.length + futureWired.length - connectedCount})</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl p-3" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
              <p className="font-semibold mb-1" style={{ color: "#10b981" }}>Live now</p>
              <p style={{ color: "#9aa0b4" }}>Finnhub → Terminal quotes + Signal scoring. NewsAPI → Research Lab headlines. OpenAI → Paper Lab AI Trade Coach.</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
              <p className="font-semibold mb-1" style={{ color: "#f59e0b" }}>Keys exist, feature pending</p>
              <p style={{ color: "#9aa0b4" }}>Alpha Vantage (indicators not wired) · Supabase (DB code not written yet).</p>
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
            <p className="pt-1" style={{ color: "#5a6075" }}>Server-only keys (<code>FINNHUB_API_KEY</code>, <code>NEWS_API_KEY</code>, <code>OPENAI_API_KEY</code>, etc.) have <strong>no</strong> <code>NEXT_PUBLIC_</code> prefix — available only in server Route Handlers, never sent to the browser. Connection status is checked server-side via <code>/api/status</code>.</p>
          </div>
        </div>

        {/* Live wired APIs */}
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "#e8eaf0" }}>
          <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}>
            LIVE
          </span>
          Currently wired to features
        </h2>
        <div className="space-y-3 mb-8">
          {liveWired.map(api => <ApiCard key={api.name} api={api} />)}
        </div>

        {/* Future defined APIs */}
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "#e8eaf0" }}>
          <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>
            FUTURE
          </span>
          Key configured — feature UI partially or fully built
        </h2>
        <div className="space-y-3 mb-8">
          {futureWired.map(api => <ApiCard key={api.name} api={api} />)}
        </div>

        {plannedApis.length > 0 && (
          <>
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "#e8eaf0" }}>
              <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(139,92,246,0.1)", color: "#8b5cf6", border: "1px solid rgba(139,92,246,0.2)" }}>
                PLANNED
              </span>
              Not yet in codebase
            </h2>
            <div className="space-y-3 mb-8">
              {plannedApis.map(api => (
                <ApiCard key={api.name} api={api} categoryLabel={CATEGORY_LABELS[api.category]} />
              ))}
            </div>
          </>
        )}

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
              <li>• <code>.env.local</code> is in <code>.gitignore</code> — it will never be committed.</li>
              <li>• Server-only keys (<code>FINNHUB_API_KEY</code>, <code>ALPHA_VANTAGE_API_KEY</code>, etc.) have no <code>NEXT_PUBLIC_</code> prefix and are never sent to the browser.</li>
              <li>• Boolean flags (<code>NEXT_PUBLIC_FINNHUB_CONNECTED=true</code>) are browser-safe — they contain no secret values, only on/off state.</li>
              <li>• <code>OPENAI_API_KEY</code> must NOT have the <code>NEXT_PUBLIC_</code> prefix — server-side only.</li>
              <li>• If you suspect a key was leaked, rotate it immediately at the provider&apos;s dashboard.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function ApiCard({ api, categoryLabel }: { api: ApiEntry; categoryLabel?: string }) {
  const wiredColors = {
    live: { bg: "rgba(16,185,129,0.08)", text: "#10b981", label: "live feature" },
    future: { bg: "rgba(245,158,11,0.08)", text: "#f59e0b", label: "future feature" },
    planned: { bg: "rgba(139,92,246,0.08)", text: "#8b5cf6", label: "planned" },
  };
  const wc = wiredColors[api.wired];

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
            {api.wired !== "planned" && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{
                  background: api.connected ? "rgba(16,185,129,0.1)" : "rgba(90,96,117,0.2)",
                  color: api.connected ? "#10b981" : "#5a6075",
                }}
              >
                {api.connected ? "✓ Connected" : "Missing"}
              </span>
            )}
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ background: wc.bg, color: wc.text }}
            >
              {wc.label}
            </span>
            {categoryLabel && (
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#141720", color: "#5a6075" }}>
                {categoryLabel}
              </span>
            )}
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

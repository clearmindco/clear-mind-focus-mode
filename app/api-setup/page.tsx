// Server component — reads env vars at build time.
// Never renders actual key values — only Connected / Missing.
import Navbar from "@/components/Navbar";

interface ApiEntry {
  name: string;
  envKey: string;
  isPublic: boolean;
  connected: boolean;
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
    isPublic: true,
    connected: isRealKey(process.env.NEXT_PUBLIC_FINNHUB_API_KEY),
    description: "Real-time stock quotes, company news, and insider transaction filings.",
    usedIn: "Terminal price cards · Research Lab insider activity",
    getFrom: "finnhub.io → Sign up free → Dashboard → API Key",
    tier: "Free: 60 calls/min",
  },
  {
    name: "Alpha Vantage",
    envKey: "NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY",
    isPublic: true,
    connected: isRealKey(process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY),
    description: "Technical indicators: RSI, MACD, SMA, EMA.",
    usedIn: "Terminal technical overlays · Research analysis",
    getFrom: "alphavantage.co → Get your free API key",
    tier: "Free: 25 calls/day",
  },
  {
    name: "NewsAPI",
    envKey: "NEXT_PUBLIC_NEWS_API_KEY",
    isPublic: true,
    connected: isRealKey(process.env.NEXT_PUBLIC_NEWS_API_KEY),
    description: "Market news headlines and sentiment tracking.",
    usedIn: "Research Lab news sentiment section",
    getFrom: "newsapi.org → Get API Key (developer plan)",
    tier: "Free: 100 calls/day (dev), HTTPS only on paid",
  },
  {
    name: "Supabase",
    envKey: "NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY",
    isPublic: true,
    connected:
      isRealKey(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      isRealKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    description: "Cloud database for syncing trade logs, progress, and user data across devices.",
    usedIn: "Paper Lab cloud sync · Cross-device progress (future)",
    getFrom: "supabase.com → New Project → Settings → API",
    tier: "Free: 500 MB database, 2 GB bandwidth",
  },
  {
    name: "OpenAI",
    envKey: "OPENAI_API_KEY",
    isPublic: false,
    connected: isRealKey(process.env.OPENAI_API_KEY),
    description: "AI-powered trade thesis analysis and setup review.",
    usedIn: "Paper Lab AI feedback (future) · Research Lab summaries (future)",
    getFrom: "platform.openai.com → API Keys → Create new secret key",
    tier: "Pay-per-use — GPT-4o recommended",
  },
  {
    name: "Supabase Service Role",
    envKey: "SUPABASE_SERVICE_ROLE_KEY",
    isPublic: false,
    connected: isRealKey(process.env.SUPABASE_SERVICE_ROLE_KEY),
    description: "Admin-level database access for server-side operations.",
    usedIn: "Server-side data writes (future API routes)",
    getFrom: "supabase.com → Project → Settings → API → service_role key",
    tier: "Same project as anon key — keep secret",
  },
  {
    name: "Vercel",
    envKey: "VERCEL_TOKEN",
    isPublic: false,
    connected: isRealKey(process.env.VERCEL_TOKEN),
    description: "Deployment automation token for CI/CD pipelines.",
    usedIn: "Automated deploy triggers (future CI)",
    getFrom: "vercel.com → Settings → Tokens → Create",
    tier: "Free on Vercel Hobby plan",
  },
];

const connectedCount = APIS.filter(a => a.connected).length;

export default function ApiSetupPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0b0d" }}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 pt-10 pb-20">

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
            Configure API keys to unlock live data features. Keys are stored as environment variables — never in source code.
          </p>
        </div>

        {/* Status summary */}
        <div
          className="rounded-2xl p-5 mb-8 flex items-center justify-between flex-wrap gap-4"
          style={{ background: "#0f1117", border: "1px solid #1e2433" }}
        >
          <div>
            <p className="font-semibold" style={{ color: "#e8eaf0" }}>
              {connectedCount} of {APIS.length} APIs connected
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#5a6075" }}>
              Status reflects environment at last build. Redeploy after adding keys.
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

        {/* How to add keys */}
        <div
          className="rounded-xl p-4 mb-8 flex gap-3 items-start"
          style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)" }}
        >
          <span className="text-base flex-shrink-0">📋</span>
          <div className="text-xs leading-relaxed space-y-1" style={{ color: "#9aa0b4" }}>
            <p><strong style={{ color: "#00d4ff" }}>How to add keys on Netlify:</strong></p>
            <p>Site Settings → Environment Variables → Add a variable → enter the key name and value → Save → Trigger new deploy.</p>
            <p><strong style={{ color: "#00d4ff" }}>For local development:</strong> Copy <code style={{ color: "#e8eaf0" }}>.env.example</code> → rename to <code style={{ color: "#e8eaf0" }}>.env.local</code> → fill in real values → restart dev server.</p>
            <p className="pt-1" style={{ color: "#ef4444" }}>
              ⚠ Never paste real API keys into source code or commit them to git. Server-only keys (no NEXT_PUBLIC_ prefix) must only be set in environment settings, never in the browser.
            </p>
          </div>
        </div>

        {/* Public APIs */}
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "#e8eaf0" }}>
          <span
            className="text-xs px-2 py-0.5 rounded"
            style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}
          >
            NEXT_PUBLIC_*
          </span>
          Browser-safe keys (embedded at build time)
        </h2>
        <div className="space-y-3 mb-8">
          {APIS.filter(a => a.isPublic).map(api => (
            <ApiCard key={api.name} api={api} />
          ))}
        </div>

        {/* Server-only APIs */}
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "#e8eaf0" }}>
          <span
            className="text-xs px-2 py-0.5 rounded"
            style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            SERVER ONLY
          </span>
          Never exposed to the browser
        </h2>
        <div className="space-y-3 mb-8">
          {APIS.filter(a => !a.isPublic).map(api => (
            <ApiCard key={api.name} api={api} />
          ))}
        </div>

        {/* Security reminder */}
        <div
          className="rounded-xl p-4 flex gap-3 items-start"
          style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}
        >
          <span className="text-base flex-shrink-0">🔒</span>
          <div className="text-xs leading-relaxed space-y-1" style={{ color: "#9aa0b4" }}>
            <p><strong style={{ color: "#ef4444" }}>Security reminders:</strong></p>
            <ul className="space-y-0.5 list-none">
              <li>• This page shows only Connected / Missing — actual key values are never displayed.</li>
              <li>• <code>.env.local</code> is in <code>.gitignore</code> and will never be committed.</li>
              <li>• If you suspect a key was exposed, rotate it immediately at the provider&apos;s dashboard.</li>
              <li>• Server-only keys (OPENAI, SUPABASE_SERVICE_ROLE, VERCEL) require a static site with API routes or a full SSR deployment to use at runtime.</li>
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
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
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
              {!api.isPublic && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.15)" }}
                >
                  Server-only
                </span>
              )}
            </div>
            <code className="text-xs mt-0.5 block" style={{ color: "#5a6075" }}>{api.envKey}</code>
          </div>
        </div>
        <span className="text-xs px-2 py-0.5 rounded" style={{ background: "#141720", color: "#9aa0b4", border: "1px solid #1e2433" }}>
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

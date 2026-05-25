"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import type { IpoRadarResponse, IpoThemeResult, IpoTickerResult } from "@/app/api/ipo-radar/route";
import type { NewsItem } from "@/lib/data-providers";

// ─── Color palette ────────────────────────────────────────────────────────────

const C = {
  pageBg: "#0a0b0d",
  cardBg: "#0f1117",
  innerCard: "#141720",
  border: "#1e2433",
  accent: "#00d4ff",
  green: "#10b981",
  red: "#ef4444",
  amber: "#f59e0b",
  purple: "#8b5cf6",
  textPrimary: "#e8eaf0",
  textSecondary: "#9aa0b4",
  textMuted: "#5a6075",
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v: number | null, dec = 2): string {
  if (v == null) return "—";
  return v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function fmtPct(v: number | null): string {
  if (v == null) return "—";
  const sign = v >= 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}

function pctColor(v: number | null): string {
  if (v == null) return C.textMuted;
  if (v > 0) return C.green;
  if (v < 0) return C.red;
  return C.textSecondary;
}

function connectionTypeColor(ct: string): string {
  if (ct === "Confirmed") return C.green;
  if (ct === "Probable") return C.accent;
  if (ct === "Thematic Only") return C.amber;
  return C.textMuted;
}

function connectionTypeBg(ct: string): string {
  if (ct === "Confirmed") return "rgba(16,185,129,0.10)";
  if (ct === "Probable") return "rgba(0,212,255,0.08)";
  if (ct === "Thematic Only") return "rgba(245,158,11,0.10)";
  return "rgba(90,96,117,0.10)";
}

function statusColor(status: string): { color: string; bg: string; border: string } {
  if (status === "IPO Filed") return { color: C.red, bg: "rgba(239,68,68,0.10)", border: "rgba(239,68,68,0.25)" };
  return { color: C.amber, bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.25)" };
}

function formatDate(dt: string): string {
  try {
    const d = new Date(dt);
    if (isNaN(d.getTime())) return dt;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dt;
  }
}

// ─── Sympathy Score Bar ───────────────────────────────────────────────────────

function SympathyBar({ score }: { score: number }) {
  const pct = (score / 10) * 100;
  const color =
    score >= 9 ? C.green :
    score >= 7 ? C.accent :
    score >= 5 ? C.amber :
    C.textMuted;

  return (
    <div className="flex items-center gap-2" style={{ minWidth: 80 }}>
      <div
        style={{
          flex: 1,
          height: 6,
          background: C.border,
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            borderRadius: 3,
            transition: "width 0.4s ease",
          }}
        />
      </div>
      <span style={{ color, fontSize: 11, fontWeight: 700, width: 14, textAlign: "right" }}>
        {score}
      </span>
    </div>
  );
}

// ─── Connection Type Badge ────────────────────────────────────────────────────

function ConnectionBadge({ ct }: { ct: string }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        padding: "2px 6px",
        borderRadius: 4,
        background: connectionTypeBg(ct),
        color: connectionTypeColor(ct),
        whiteSpace: "nowrap",
      }}
    >
      {ct}
    </span>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr>
      {[60, 100, 110, 80, 120, 120, 60, 70].map((w, i) => (
        <td key={i} style={{ padding: "10px 12px" }}>
          <div
            style={{
              height: 10,
              width: w,
              borderRadius: 4,
              background: C.border,
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
        </td>
      ))}
    </tr>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ minHeight: "100vh", background: C.pageBg }}>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 pt-10 pb-20">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            padding: "80px 20px",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              border: `3px solid ${C.border}`,
              borderTopColor: C.accent,
              animation: "spin 0.8s linear infinite",
            }}
          />
          <p style={{ color: C.textSecondary, fontSize: 14 }}>Loading ecosystem data...</p>
          <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
            @keyframes pulse {
              0%, 100% { opacity: 0.4; }
              50% { opacity: 1; }
            }
          `}</style>
        </div>
        <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", background: C.pageBg, borderBottom: `1px solid ${C.border}` }}>
            <div style={{ height: 12, width: 180, borderRadius: 4, background: C.border, animation: "pulse 1.5s ease-in-out infinite" }} />
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Ecosystem Table ──────────────────────────────────────────────────────────

const TH_STYLE: React.CSSProperties = {
  padding: "10px 12px",
  textAlign: "left",
  color: C.textMuted,
  fontWeight: 500,
  fontSize: 11,
  whiteSpace: "nowrap",
  background: C.pageBg,
};

const TD_STYLE: React.CSSProperties = {
  padding: "10px 12px",
  fontSize: 12,
  color: C.textSecondary,
  borderBottom: `1px solid ${C.border}`,
  verticalAlign: "middle",
};

function EcosystemTable({ tickers }: { tickers: IpoTickerResult[] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={TH_STYLE}>Ticker</th>
            <th style={TH_STYLE}>Company</th>
            <th style={TH_STYLE}>Relationship</th>
            <th style={TH_STYLE}>Sympathy Score</th>
            <th style={TH_STYLE}>Connection</th>
            <th style={TH_STYLE}>Price</th>
            <th style={TH_STYLE}>Change</th>
            <th style={{ ...TH_STYLE, maxWidth: 220 }}>Notes</th>
          </tr>
        </thead>
        <tbody>
          {tickers.map(t => (
            <tr
              key={t.ticker}
              style={{ borderBottom: `1px solid ${C.border}` }}
            >
              <td style={{ ...TD_STYLE, fontWeight: 700, color: C.textPrimary }}>{t.ticker}</td>
              <td style={{ ...TD_STYLE, color: C.textSecondary }}>{t.name}</td>
              <td style={{ ...TD_STYLE, color: C.textMuted, maxWidth: 160, whiteSpace: "normal" }}>{t.relationship}</td>
              <td style={TD_STYLE}>
                <SympathyBar score={t.sympathyScore} />
              </td>
              <td style={TD_STYLE}>
                <ConnectionBadge ct={t.connectionType} />
              </td>
              <td style={{ ...TD_STYLE, color: t.isPlaceholder ? C.textMuted : C.textPrimary, fontWeight: 600 }}>
                {t.isPlaceholder ? "—" : `$${fmt(t.price)}`}
              </td>
              <td style={{ ...TD_STYLE, color: pctColor(t.changePercent), fontWeight: 600 }}>
                {t.isPlaceholder ? "—" : fmtPct(t.changePercent)}
              </td>
              <td style={{ ...TD_STYLE, color: C.textMuted, maxWidth: 220, whiteSpace: "normal", fontSize: 11 }}>
                {t.notes}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Red Team Warning Box ─────────────────────────────────────────────────────

const RED_TEAM_WARNINGS: string[] = [
  "IPO dates slip constantly — a planned 2025 IPO can slide to 2027 or never happen. The sympathy play can reverse hard if the pre-IPO company delays.",
  "Sympathy plays often price in the IPO excitement early. Traders who chase late often buy the peak — the move may already be done before the IPO week.",
  "Pre-IPO valuations are private-market marks, often inflated. When the company goes public at a lower valuation, all sympathy plays reprice lower instantly.",
  "High-rate macro environments compress growth multiples. Even a successful IPO launch can drag down related names if market conditions deteriorate.",
  "High sympathy score ≠ safe trade. A score of 10 means high correlation, not guaranteed direction. The relationship could work in reverse — a failed IPO crushes the whole sector.",
];

function RedTeamWarning({ themeColor }: { themeColor: string }) {
  return (
    <div
      style={{
        background: "rgba(245,158,11,0.04)",
        border: "1px solid rgba(245,158,11,0.20)",
        borderRadius: 12,
        padding: "16px 18px",
        marginTop: 16,
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: C.amber,
          marginBottom: 10,
        }}
      >
        ⚠️ Red Team — Why This Could Be a Trap
      </p>
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
        {RED_TEAM_WARNINGS.map((w, i) => (
          <li key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <span style={{ color: C.amber, flexShrink: 0, fontSize: 11, marginTop: 1 }}>•</span>
            <span style={{ color: C.textMuted, fontSize: 11, lineHeight: 1.5 }}>{w}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Theme Card ───────────────────────────────────────────────────────────────

function ThemeCard({ theme }: { theme: IpoThemeResult }) {
  const st = statusColor(theme.status);

  return (
    <div
      style={{
        background: C.cardBg,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 24,
      }}
    >
      {/* Theme header */}
      <div
        style={{
          padding: "18px 20px",
          background: C.pageBg,
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 26, lineHeight: 1 }}>{theme.icon}</span>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.textPrimary }}>
              {theme.name}
            </h2>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 100,
                background: st.bg,
                color: st.color,
                border: `1px solid ${st.border}`,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {theme.status}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: C.textSecondary }}>{theme.description}</p>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 2,
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 700, color: theme.color }}>
            {theme.estimatedValuation}
          </span>
          <span style={{ fontSize: 11, color: C.textMuted }}>{theme.timeline}</span>
        </div>
      </div>

      {/* Ecosystem table */}
      <div style={{ background: C.cardBg }}>
        <EcosystemTable tickers={theme.relatedTickers} />
      </div>

      {/* Connection type legend */}
      <div
        style={{
          padding: "10px 16px",
          borderTop: `1px solid ${C.border}`,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 10, color: C.textMuted, fontWeight: 600 }}>Connection type:</span>
        {(["Confirmed", "Probable", "Thematic Only", "Needs Research"] as const).map(ct => (
          <span key={ct} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: connectionTypeColor(ct),
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: 10, color: C.textMuted }}>{ct}</span>
          </span>
        ))}
      </div>

      {/* Red team warning */}
      <div style={{ padding: "0 16px 16px" }}>
        <RedTeamWarning themeColor={theme.color} />
      </div>
    </div>
  );
}

// ─── News Feed ────────────────────────────────────────────────────────────────

function NewsCard({ item }: { item: NewsItem }) {
  const isPlaceholder = item.isPlaceholder;
  return (
    <a
      href={isPlaceholder ? undefined : item.url}
      target={isPlaceholder ? undefined : "_blank"}
      rel="noopener noreferrer"
      style={{
        display: "block",
        textDecoration: "none",
        background: C.innerCard,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding: "14px 16px",
        cursor: isPlaceholder ? "default" : "pointer",
        transition: "border-color 0.15s",
      }}
      onMouseEnter={e => {
        if (!isPlaceholder) (e.currentTarget as HTMLAnchorElement).style.borderColor = C.accent;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLAnchorElement).style.borderColor = C.border;
      }}
    >
      <p
        style={{
          margin: "0 0 6px",
          fontSize: 13,
          fontWeight: 600,
          color: isPlaceholder ? C.textMuted : C.textPrimary,
          lineHeight: 1.4,
        }}
      >
        {item.headline}
      </p>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <span style={{ fontSize: 11, color: C.accent, fontWeight: 600 }}>{item.source}</span>
        <span style={{ fontSize: 11, color: C.textMuted }}>{formatDate(item.datetime)}</span>
      </div>
      {item.summary && (
        <p style={{ margin: "6px 0 0", fontSize: 11, color: C.textMuted, lineHeight: 1.5 }}>
          {item.summary.slice(0, 160)}{item.summary.length > 160 ? "…" : ""}
        </p>
      )}
    </a>
  );
}

// ─── Risk Warnings Section ────────────────────────────────────────────────────

const IPO_SYMPATHY_RISKS = [
  {
    title: "The Pre-IPO Hype Cycle",
    body: "Markets often price in IPO excitement 3–6 months before the filing. By the time retail traders discover the sympathy play, the institutional money has already positioned. You may be buying the top of the pre-IPO narrative.",
  },
  {
    title: "Valuation Compression at IPO",
    body: "If the IPO prices below its last private valuation (called a 'down round'), related public companies often sell off hard because the entire sector's premium gets repriced lower. A Stripe IPO at $40B instead of $65B would be a negative catalyst for BILL and SQ.",
  },
  {
    title: "Calendar Risk Is Severe",
    body: "IPO timelines are highly uncertain. Interest rate changes, market volatility windows, regulatory review, or internal decisions can push an IPO out by 12–24 months or cancel it entirely. A prolonged delay kills the sympathy thesis.",
  },
  {
    title: "Sympathy Correlations Break Down",
    body: "Sympathy scores measure historical and logical relationships — they don't guarantee future correlated moves. In risk-off environments, all growth stocks sell together regardless of their specific IPO exposure.",
  },
  {
    title: "Post-IPO Lock-up Expiration",
    body: "When the pre-IPO company goes public, insiders and early investors face 6-month lock-up periods. When those expire, insider selling can crash the IPO stock AND its sympathy plays simultaneously. The real trade often ends at IPO, not begins.",
  },
];

function RiskWarningsSection() {
  return (
    <div
      style={{
        background: C.cardBg,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        padding: "20px 24px",
        marginTop: 32,
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: C.amber,
          marginBottom: 16,
        }}
      >
        📚 IPO Sympathy Play Risks — Educational Reference
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
        }}
      >
        {IPO_SYMPATHY_RISKS.map((r, i) => (
          <div
            key={i}
            style={{
              background: C.innerCard,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              padding: "14px 16px",
            }}
          >
            <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: C.textPrimary }}>
              {r.title}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: C.textMuted, lineHeight: 1.6 }}>{r.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const THEME_FILTERS = [
  { id: "all", label: "ALL", icon: "" },
  { id: "spacex", label: "SpaceX", icon: "🚀" },
  { id: "openai", label: "OpenAI", icon: "🤖" },
  { id: "stripe", label: "Stripe", icon: "💳" },
  { id: "databricks", label: "Databricks", icon: "📊" },
  { id: "klarna", label: "Klarna", icon: "🛒" },
] as const;

type ThemeFilterId = (typeof THEME_FILTERS)[number]["id"];

export default function IpoRadarPage() {
  const [data, setData] = useState<IpoRadarResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTheme, setActiveTheme] = useState<ThemeFilterId>("all");

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch("/api/ipo-radar")
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<IpoRadarResponse>;
      })
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        setError(String(err));
        setLoading(false);
      });
  }, []);

  if (loading) return <LoadingSkeleton />;

  if (error || !data) {
    return (
      <div style={{ minHeight: "100vh", background: C.pageBg }}>
        <Navbar />
        <div
          className="max-w-7xl mx-auto px-4 pt-20"
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}
        >
          <p style={{ color: C.red, fontSize: 14 }}>Failed to load IPO Radar data.</p>
          <p style={{ color: C.textMuted, fontSize: 12 }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              background: "rgba(0,212,255,0.1)",
              color: C.accent,
              border: `1px solid rgba(0,212,255,0.25)`,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const visibleThemes =
    activeTheme === "all"
      ? data.themes
      : data.themes.filter(t => t.id === activeTheme);

  const themeColorMap: Record<string, string> = Object.fromEntries(
    data.themes.map(t => [t.id, t.color])
  );

  const activeColor =
    activeTheme === "all" ? C.accent : (themeColorMap[activeTheme] ?? C.accent);

  return (
    <div style={{ minHeight: "100vh", background: C.pageBg }}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 pt-10 pb-20">

        {/* ─── Header ─── */}
        <div style={{ marginBottom: 28 }}>
          {/* Educational disclaimer badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "3px 10px",
              borderRadius: 100,
              background: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.22)",
              color: C.amber,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            ⚠️ Educational Research Only — Not Investment Advice
          </div>

          <h1 style={{ margin: "0 0 6px", fontSize: 28, fontWeight: 800, color: C.textPrimary }}>
            📡 IPO Ecosystem{" "}
            <span style={{ color: C.accent }}>Radar</span>
          </h1>
          <p style={{ margin: "0 0 8px", fontSize: 14, color: C.textSecondary }}>
            Track public companies positioned around major upcoming IPOs — sympathy plays, ecosystem beneficiaries, and competitors
          </p>
          <p style={{ margin: 0, fontSize: 11, color: C.textMuted, lineHeight: 1.6 }}>
            This tool is for educational research only. Nothing on this page constitutes financial or investment advice.
            Sympathy plays are speculative by nature and can result in substantial losses.
            Always paper trade first and consult a licensed advisor before risking real capital.
            {data.isPlaceholder && (
              <span style={{ color: C.amber }}>
                {" "}Live price data requires a{" "}
                <a href="/api-setup" style={{ color: C.accent, textDecoration: "underline" }}>
                  FINNHUB_API_KEY
                </a>
                .
              </span>
            )}
          </p>
        </div>

        {/* ─── Theme Selector Pills ─── */}
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 28,
          }}
        >
          {THEME_FILTERS.map(tf => {
            const isActive = activeTheme === tf.id;
            const pillColor =
              tf.id === "all" ? C.accent : (themeColorMap[tf.id] ?? C.accent);
            return (
              <button
                key={tf.id}
                onClick={() => setActiveTheme(tf.id)}
                style={{
                  padding: "7px 16px",
                  borderRadius: 100,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  background: isActive ? `${pillColor}18` : C.cardBg,
                  color: isActive ? pillColor : C.textSecondary,
                  border: isActive
                    ? `1px solid ${pillColor}50`
                    : `1px solid ${C.border}`,
                }}
              >
                {tf.icon ? `${tf.icon} ` : ""}
                {tf.label}
              </button>
            );
          })}
        </div>

        {/* ─── Summary stats bar ─── */}
        <div
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 28,
            padding: "14px 18px",
            background: C.cardBg,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Themes Shown</p>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: activeColor }}>{visibleThemes.length}</p>
          </div>
          <div style={{ width: 1, background: C.border, alignSelf: "stretch" }} />
          <div>
            <p style={{ margin: 0, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Tickers Tracked</p>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.textPrimary }}>
              {visibleThemes.reduce((s, t) => s + t.relatedTickers.length, 0)}
            </p>
          </div>
          <div style={{ width: 1, background: C.border, alignSelf: "stretch" }} />
          <div>
            <p style={{ margin: 0, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Confirmed Connections</p>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.green }}>
              {visibleThemes.reduce((s, t) => s + t.relatedTickers.filter(r => r.connectionType === "Confirmed").length, 0)}
            </p>
          </div>
          <div style={{ width: 1, background: C.border, alignSelf: "stretch" }} />
          <div>
            <p style={{ margin: 0, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Live Prices</p>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: data.isPlaceholder ? C.amber : C.green }}>
              {data.isPlaceholder ? "—" : "Live"}
            </p>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ alignSelf: "center" }}>
            <p style={{ margin: 0, fontSize: 10, color: C.textMuted }}>
              Updated {new Date(data.lastUpdated).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </p>
          </div>
        </div>

        {/* ─── Theme Cards ─── */}
        {visibleThemes.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 60,
              color: C.textMuted,
              background: C.cardBg,
              border: `1px solid ${C.border}`,
              borderRadius: 16,
              marginBottom: 24,
            }}
          >
            No themes found for this filter.
          </div>
        ) : (
          visibleThemes.map(theme => <ThemeCard key={theme.id} theme={theme} />)
        )}

        {/* ─── IPO News Section ─── */}
        <div
          style={{
            background: C.cardBg,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: "20px 20px 24px",
            marginTop: 8,
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <p
              style={{
                margin: "0 0 4px",
                fontSize: 14,
                fontWeight: 700,
                color: C.textPrimary,
              }}
            >
              📰 IPO &amp; Pre-IPO News
            </p>
            <p style={{ margin: 0, fontSize: 11, color: C.textMuted }}>
              Latest headlines around IPOs, pre-IPO companies, and startup ecosystems
            </p>
          </div>

          {data.news.length === 0 || data.news[0]?.isPlaceholder ? (
            <div
              style={{
                background: C.innerCard,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: "20px 18px",
                textAlign: "center",
              }}
            >
              <p style={{ margin: "0 0 6px", fontSize: 13, color: C.textMuted }}>
                No live news available.
              </p>
              <p style={{ margin: 0, fontSize: 12, color: C.textMuted }}>
                Configure{" "}
                <code
                  style={{
                    background: C.innerCard,
                    border: `1px solid ${C.border}`,
                    borderRadius: 4,
                    padding: "1px 5px",
                    color: C.amber,
                    fontSize: 11,
                  }}
                >
                  NEWS_API_KEY
                </code>{" "}
                in{" "}
                <a href="/api-setup" style={{ color: C.accent, textDecoration: "underline" }}>
                  /api-setup
                </a>{" "}
                to see live IPO news.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 12,
              }}
            >
              {data.news.map((item, i) => (
                <NewsCard key={i} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* ─── Risk Warnings ─── */}
        <RiskWarningsSection />

        {/* ─── Footer disclaimer ─── */}
        <p
          style={{
            textAlign: "center",
            fontSize: 11,
            color: C.textMuted,
            marginTop: 32,
            lineHeight: 1.7,
          }}
        >
          Educational research only · Not financial advice · Sympathy scores reflect thematic/logical relationships, not guaranteed price correlation ·
          IPO timelines are estimates and subject to change · Past pre-IPO patterns do not predict future performance · Always paper trade before risking real capital
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

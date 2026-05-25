"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

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

// ─── Types ────────────────────────────────────────────────────────────────────

interface ArticleItem {
  headline: string;
  source: string;
  datetime: string;
  summary: string;
  url: string;
  isPlaceholder: boolean;
}

type RiskLevel = "HIGH" | "MEDIUM" | "LOW";

interface CategoryResult {
  id: string;
  label: string;
  icon: string;
  color: string;
  whyItMatters: string;
  bullCase: string;
  bearCase: string;
  tickers: string[];
  riskLevel: RiskLevel;
  articles: ArticleItem[];
}

interface NewsDeskResponse {
  categories: CategoryResult[];
  totalArticles: number;
  lastUpdated: number;
  isPlaceholder: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function riskColor(level: RiskLevel): string {
  if (level === "HIGH") return C.red;
  if (level === "MEDIUM") return C.amber;
  return C.green;
}

function riskBg(level: RiskLevel): string {
  if (level === "HIGH") return "rgba(239,68,68,0.10)";
  if (level === "MEDIUM") return "rgba(245,158,11,0.10)";
  return "rgba(16,185,129,0.10)";
}

function riskBorder(level: RiskLevel): string {
  if (level === "HIGH") return "rgba(239,68,68,0.25)";
  if (level === "MEDIUM") return "rgba(245,158,11,0.25)";
  return "rgba(16,185,129,0.25)";
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-3 animate-pulse"
      style={{ background: C.cardBg, border: `1px solid ${C.border}` }}
    >
      <div className="flex items-center gap-2">
        <div className="w-16 h-5 rounded-full" style={{ background: C.border }} />
        <div className="ml-auto w-12 h-5 rounded-full" style={{ background: C.border }} />
      </div>
      <div className="h-4 rounded w-full" style={{ background: C.border }} />
      <div className="h-4 rounded w-5/6" style={{ background: C.border }} />
      <div className="h-4 rounded w-2/3" style={{ background: C.border }} />
      <div className="h-16 rounded" style={{ background: C.innerCard }} />
      <div className="flex gap-2">
        <div className="h-4 rounded w-1/3" style={{ background: C.border }} />
        <div className="h-4 rounded w-1/3" style={{ background: C.border }} />
      </div>
      <div className="flex gap-2">
        <div className="w-14 h-5 rounded-full" style={{ background: C.border }} />
        <div className="w-14 h-5 rounded-full" style={{ background: C.border }} />
        <div className="w-14 h-5 rounded-full" style={{ background: C.border }} />
      </div>
    </div>
  );
}

// ─── News card ────────────────────────────────────────────────────────────────

interface NewsCardProps {
  category: CategoryResult;
  article: ArticleItem;
}

function NewsCard({ category, article }: NewsCardProps) {
  const catColorHex = category.color;

  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-3"
      style={{
        background: C.cardBg,
        border: `1px solid ${C.border}`,
      }}
    >
      {/* Category badge + Risk level */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{
            background: `${catColorHex}18`,
            color: catColorHex,
            border: `1px solid ${catColorHex}30`,
          }}
        >
          <span>{category.icon}</span>
          {category.label}
        </span>
        <span
          className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
          style={{
            background: riskBg(category.riskLevel),
            color: riskColor(category.riskLevel),
            border: `1px solid ${riskBorder(category.riskLevel)}`,
          }}
        >
          {category.riskLevel === "HIGH" && "⚠ "}
          {category.riskLevel}
        </span>
      </div>

      {/* Headline */}
      <p className="font-semibold text-sm leading-snug" style={{ color: C.textPrimary }}>
        {article.headline}
      </p>

      {/* Source + time */}
      <p className="text-xs" style={{ color: C.textMuted }}>
        {article.source}
        {article.datetime && !article.isPlaceholder && (
          <span> · {timeAgo(article.datetime)}</span>
        )}
      </p>

      {/* Why This Matters box */}
      <div
        className="rounded-lg px-3 py-2.5 text-xs leading-relaxed"
        style={{
          background: `${catColorHex}0d`,
          border: `1px solid ${catColorHex}26`,
          color: C.textSecondary,
        }}
      >
        <p className="font-semibold mb-1" style={{ color: catColorHex }}>
          Why This Matters
        </p>
        <p>{category.whyItMatters}</p>
      </div>

      {/* Bull / Bear cases */}
      <div className="flex flex-col gap-1.5">
        <p className="text-xs" style={{ color: C.green }}>
          <span className="font-bold mr-1">↑ Bull:</span>
          {category.bullCase}
        </p>
        <p className="text-xs" style={{ color: C.red }}>
          <span className="font-bold mr-1">↓ Bear:</span>
          {category.bearCase}
        </p>
      </div>

      {/* Tickers */}
      <div className="flex flex-wrap gap-1.5">
        {category.tickers.map((ticker) => (
          <span
            key={ticker}
            className="text-xs font-mono font-semibold px-2 py-0.5 rounded"
            style={{
              background: C.innerCard,
              color: C.accent,
              border: `1px solid ${C.border}`,
            }}
          >
            {ticker}
          </span>
        ))}
      </div>

      {/* Read More */}
      {!article.isPlaceholder && article.url && article.url !== "#" ? (
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold mt-auto self-start transition-opacity hover:opacity-70"
          style={{ color: C.accent }}
        >
          Read More →
        </a>
      ) : (
        <span className="text-xs mt-auto self-start" style={{ color: C.textMuted }}>
          Configure API key to see live articles →
        </span>
      )}
    </div>
  );
}

// ─── Category filter pill ─────────────────────────────────────────────────────

interface FilterPillProps {
  label: string;
  icon?: string;
  color?: string;
  active: boolean;
  onClick: () => void;
}

function FilterPill({ label, icon, color, active, onClick }: FilterPillProps) {
  const activeColor = color ?? C.accent;
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all duration-150"
      style={{
        background: active ? `${activeColor}18` : "transparent",
        color: active ? activeColor : C.textSecondary,
        border: active ? `1px solid ${activeColor}40` : `1px solid ${C.border}`,
      }}
    >
      {icon && <span>{icon}</span>}
      {label}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewsDeskPage() {
  const [data, setData] = useState<NewsDeskResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [highRiskOnly, setHighRiskOnly] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch("/api/news-desk")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<NewsDeskResponse>;
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load news");
        setLoading(false);
      });
  }, []);

  // Derive flat list of (category, article) pairs for rendering
  const allPairs: Array<{ category: CategoryResult; article: ArticleItem }> = [];
  if (data) {
    for (const cat of data.categories) {
      for (const article of cat.articles) {
        allPairs.push({ category: cat, article });
      }
    }
  }

  const filteredCategories =
    data?.categories.filter((cat) => {
      if (activeCategory !== "ALL" && cat.id !== activeCategory) return false;
      if (highRiskOnly && cat.riskLevel !== "HIGH") return false;
      return true;
    }) ?? [];

  const filteredPairs = allPairs.filter(({ category }) => {
    if (activeCategory !== "ALL" && category.id !== activeCategory) return false;
    if (highRiskOnly && category.riskLevel !== "HIGH") return false;
    return true;
  });

  const isNoKey = data?.isPlaceholder === true;

  return (
    <div style={{ background: C.pageBg, minHeight: "100vh" }}>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* ── Header ── */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: C.textPrimary }}>
              Bloomberg-Style News Desk
            </h1>
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{
                background: "rgba(0,212,255,0.08)",
                color: C.accent,
                border: `1px solid rgba(0,212,255,0.20)`,
              }}
            >
              FOR EDUCATIONAL RESEARCH
            </span>
          </div>
          <p className="text-sm mb-1" style={{ color: C.textSecondary }}>
            Market intelligence categorized, contextualized, and explained
          </p>
          <p className="text-xs" style={{ color: C.textMuted }}>
            News sourced from NewsAPI.org — not financial advice
          </p>
        </div>

        {/* ── No-key state ── */}
        {!loading && isNoKey && (
          <div
            className="rounded-xl px-6 py-8 mb-8 flex flex-col items-center text-center gap-3"
            style={{ background: C.cardBg, border: `1px solid ${C.border}` }}
          >
            <span className="text-3xl">🔑</span>
            <h2 className="font-bold text-base" style={{ color: C.textPrimary }}>
              News API Key Not Configured
            </h2>
            <p className="text-sm max-w-md" style={{ color: C.textSecondary }}>
              To see live news articles, add your{" "}
              <span style={{ color: C.accent }}>NEWS_API_KEY</span> to your Netlify environment
              variables. You can still browse the category framework and educational context
              below.
            </p>
            <Link
              href="/api-setup"
              className="text-sm font-semibold px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
              style={{
                background: "rgba(0,212,255,0.10)",
                color: C.accent,
                border: `1px solid rgba(0,212,255,0.25)`,
              }}
            >
              Go to API Setup →
            </Link>
          </div>
        )}

        {/* ── Error state ── */}
        {!loading && error && (
          <div
            className="rounded-xl px-5 py-4 mb-8"
            style={{ background: "rgba(239,68,68,0.08)", border: `1px solid rgba(239,68,68,0.25)` }}
          >
            <p className="text-sm font-semibold" style={{ color: C.red }}>
              Error loading news: {error}
            </p>
          </div>
        )}

        {/* ── Controls row: filter pills + risk toggle ── */}
        {!loading && data && (
          <div className="mb-6 flex flex-col gap-4">
            {/* Category filter bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <FilterPill
                label="ALL"
                active={activeCategory === "ALL"}
                onClick={() => setActiveCategory("ALL")}
                color={C.accent}
              />
              {data.categories.map((cat) => (
                <FilterPill
                  key={cat.id}
                  label={cat.label}
                  icon={cat.icon}
                  color={cat.color}
                  active={activeCategory === cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                />
              ))}
            </div>

            {/* Controls row */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label
                className="flex items-center gap-2 cursor-pointer select-none"
                style={{ color: C.textSecondary }}
              >
                <input
                  type="checkbox"
                  checked={highRiskOnly}
                  onChange={(e) => setHighRiskOnly(e.target.checked)}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: C.red }}
                />
                <span className="text-xs font-semibold">
                  <span style={{ color: C.red }}>⚠</span> HIGH risk stories only
                </span>
              </label>

              <p className="text-xs" style={{ color: C.textMuted }}>
                {filteredPairs.length} article{filteredPairs.length !== 1 ? "s" : ""}
                {activeCategory !== "ALL" && (
                  <span>
                    {" "}
                    in{" "}
                    <span style={{ color: C.textSecondary }}>
                      {data.categories.find((c) => c.id === activeCategory)?.label}
                    </span>
                  </span>
                )}
                {highRiskOnly && (
                  <span style={{ color: C.red }}> · HIGH risk only</span>
                )}
                {" · "}
                Updated {timeAgo(new Date(data.lastUpdated).toISOString())}
              </p>
            </div>
          </div>
        )}

        {/* ── Loading: skeleton grid ── */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* ── Main news grid ── */}
        {!loading && filteredPairs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {filteredPairs.map(({ category, article }, i) => (
              <NewsCard key={`${category.id}-${i}`} category={category} article={article} />
            ))}
          </div>
        )}

        {/* ── Empty state when filter yields nothing ── */}
        {!loading && data && filteredPairs.length === 0 && !error && (
          <div
            className="rounded-xl px-6 py-10 mb-8 flex flex-col items-center text-center gap-2"
            style={{ background: C.cardBg, border: `1px solid ${C.border}` }}
          >
            <span className="text-2xl">🔍</span>
            <p className="text-sm font-semibold" style={{ color: C.textSecondary }}>
              No articles match the current filters
            </p>
            <button
              onClick={() => {
                setActiveCategory("ALL");
                setHighRiskOnly(false);
              }}
              className="text-xs mt-1"
              style={{ color: C.accent }}
            >
              Clear filters
            </button>
          </div>
        )}

        {/* ── Category summary cards (when ALL is selected, show each category overview) ── */}
        {!loading && data && activeCategory === "ALL" && !highRiskOnly && (
          <div className="mb-8">
            <h2 className="text-sm font-bold mb-4 uppercase tracking-widest" style={{ color: C.textMuted }}>
              Category Overview
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {filteredCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className="rounded-xl p-4 text-left transition-all hover:opacity-90"
                  style={{
                    background: C.cardBg,
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">{cat.icon}</span>
                    <span
                      className="text-xs font-bold px-1.5 py-0.5 rounded"
                      style={{
                        color: riskColor(cat.riskLevel),
                        background: riskBg(cat.riskLevel),
                      }}
                    >
                      {cat.riskLevel}
                    </span>
                  </div>
                  <p className="text-xs font-semibold mb-1" style={{ color: cat.color }}>
                    {cat.label}
                  </p>
                  <p className="text-xs" style={{ color: C.textMuted }}>
                    {cat.articles.length} article{cat.articles.length !== 1 ? "s" : ""}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Bottom disclaimer ── */}
        <div
          className="rounded-xl px-5 py-4 mt-4"
          style={{ background: C.innerCard, border: `1px solid ${C.border}` }}
        >
          <p className="text-xs text-center leading-relaxed" style={{ color: C.textMuted }}>
            EDGE OS News Desk aggregates public news for educational research only. Headlines do
            not constitute trading advice or financial recommendations. Always verify with primary
            sources before acting on any news.
          </p>
        </div>
      </main>
    </div>
  );
}

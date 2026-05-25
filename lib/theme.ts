/**
 * EDGE OS shared design tokens.
 * Import in components to stay consistent across the platform.
 * All values are inline-style compatible (not Tailwind class names).
 */

export const COLORS = {
  // Backgrounds
  bg: {
    page:    "#0a0b0d",
    card:    "#0f1117",
    inner:   "#141720",
    overlay: "rgba(10,11,13,0.97)",
  },
  // Borders
  border: {
    default: "#1e2433",
    subtle:  "#141720",
  },
  // Brand accents
  accent: {
    cyan:    "#00d4ff",
    green:   "#10b981",
    red:     "#ef4444",
    amber:   "#f59e0b",
    purple:  "#8b5cf6",
    orange:  "#f97316",
    teal:    "#06b6d4",
  },
  // Semantic
  semantic: {
    bullish:   "#10b981",
    bearish:   "#ef4444",
    warning:   "#f59e0b",
    neutral:   "#9aa0b4",
    confirmed: "#10b981",
    probable:  "#00d4ff",
    thematic:  "#f59e0b",
  },
  // Text
  text: {
    primary:   "#e8eaf0",
    secondary: "#9aa0b4",
    muted:     "#5a6075",
  },
  // Setup scores
  score: {
    aPlus: { color: "#059669", bg: "rgba(5,150,105,0.15)" },
    a:     { color: "#10b981", bg: "rgba(16,185,129,0.12)" },
    b:     { color: "#00d4ff", bg: "rgba(0,212,255,0.12)" },
    c:     { color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
    f:     { color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  },
} as const;

// Card style object — spread into style prop
export const CARD_STYLE = {
  background: COLORS.bg.card,
  border: `1px solid ${COLORS.border.default}`,
} as const;

// Inner card (secondary card inside a card)
export const INNER_CARD_STYLE = {
  background: COLORS.bg.inner,
  border: `1px solid ${COLORS.border.default}`,
} as const;

// Disclaimer box (always amber-tinted)
export const DISCLAIMER_STYLE = {
  background: "rgba(245,158,11,0.05)",
  border: "1px solid rgba(245,158,11,0.15)",
} as const;

// Standard page max-width wrapper class string
export const PAGE_WRAPPER = "max-w-7xl mx-auto px-4 pt-8 pb-24";

// Standard section title style
export const SECTION_TITLE_STYLE = {
  color: COLORS.text.muted,
} as const;

// Signal status colors
export const SIGNAL_COLORS: Record<string, { color: string; bg: string }> = {
  "Strong Bullish Watch": { color: "#059669", bg: "rgba(5,150,105,0.15)" },
  "Bullish Watch":        { color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  "Wait":                 { color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  "Bearish Warning":      { color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  "Strong Bearish Warning": { color: "#b91c1c", bg: "rgba(185,28,28,0.15)" },
  "No Trade":             { color: "#5a6075", bg: "rgba(90,96,117,0.1)"  },
  "Watching":             { color: "#9aa0b4", bg: "rgba(154,160,180,0.1)" },
};

// Market session colors
export const SESSION_COLORS: Record<string, string> = {
  "Pre-Market":        "#f59e0b",
  "NY Open / ORB":     "#ef4444",
  "Morning Momentum":  "#10b981",
  "Midday Chop":       "#f59e0b",
  "Afternoon Drift":   "#9aa0b4",
  "Power Hour":        "#8b5cf6",
  "Market Close":      "#ef4444",
  "London Session":    "#00d4ff",
  "After Hours / Asian": "#5a6075",
};

// Regime colors
export const REGIME_COLORS: Record<string, string> = {
  TREND_UP:       "#10b981",
  TREND_DOWN:     "#ef4444",
  RANGE_BOUND:    "#f59e0b",
  COMPRESSION:    "#00d4ff",
  EXPANSION:      "#a78bfa",
  GAP_AND_GO:     "#8b5cf6",
  REVERSAL_WATCH: "#f97316",
  UNKNOWN:        "#5a6075",
};

// Format helpers (client-safe, pure functions)
export const fmt = (v: number | null, dec = 2): string =>
  v == null ? "—" : v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });

export const fmtPct = (v: number | null): string =>
  v == null ? "—" : `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;

export const fmtPctColor = (v: number | null): string =>
  v == null ? COLORS.text.muted : v > 0 ? COLORS.accent.green : v < 0 ? COLORS.accent.red : COLORS.text.muted;

export const timeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

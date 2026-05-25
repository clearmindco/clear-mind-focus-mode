/**
 * Supabase client factory for EDGE OS.
 *
 * Two clients:
 *   - supabaseClient()       → browser/client component use (anon key, RLS-enforced)
 *   - supabaseServiceClient() → server-only (service role key, bypasses RLS)
 *
 * Only import supabaseServiceClient() from app/api/* routes — never from client components.
 * The service role key must never be sent to the browser.
 *
 * Required environment variables:
 *   NEXT_PUBLIC_SUPABASE_URL       (safe to expose — it's just the project URL)
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY  (safe to expose — restricted by RLS policies)
 *   SUPABASE_SERVICE_ROLE_KEY      (server-only — never NEXT_PUBLIC_)
 *
 * Tables schema (create via Supabase dashboard or migration):
 *
 *   CREATE TABLE edge_journal (
 *     id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *     user_id     text,                    -- anonymous session ID or auth user ID
 *     ticker      text NOT NULL,
 *     direction   text,                    -- 'long' | 'short'
 *     setup_type  text,
 *     entry       numeric,
 *     stop        numeric,
 *     target1     numeric,
 *     target2     numeric,
 *     risk_pct    numeric,
 *     rr_ratio    numeric,
 *     confidence  int,
 *     notes       text,
 *     emotional_state text,
 *     result      text,                    -- 'win' | 'loss' | 'be' | 'open'
 *     pnl         numeric,
 *     created_at  timestamptz DEFAULT now()
 *   );
 *
 *   CREATE TABLE edge_watchlist (
 *     id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *     user_id    text,
 *     ticker     text NOT NULL,
 *     notes      text,
 *     added_at   timestamptz DEFAULT now(),
 *     UNIQUE(user_id, ticker)
 *   );
 *
 *   CREATE TABLE edge_settings (
 *     user_id       text PRIMARY KEY,
 *     account_size  numeric DEFAULT 10000,
 *     risk_pct      numeric DEFAULT 1,
 *     mode          text DEFAULT 'advanced',  -- 'beginner' | 'advanced'
 *     updated_at    timestamptz DEFAULT now()
 *   );
 *
 * Enable RLS on all tables and add policies:
 *   ALTER TABLE edge_journal  ENABLE ROW LEVEL SECURITY;
 *   ALTER TABLE edge_watchlist ENABLE ROW LEVEL SECURITY;
 *   ALTER TABLE edge_settings  ENABLE ROW LEVEL SECURITY;
 *
 *   -- Allow users to manage only their own rows (using user_id = current session)
 *   CREATE POLICY "own rows" ON edge_journal  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
 *   CREATE POLICY "own rows" ON edge_watchlist USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
 *   CREATE POLICY "own rows" ON edge_settings  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
 */

// ─── Type definitions ─────────────────────────────────────────────────────────

export interface EdgeJournalEntry {
  id?: string;
  user_id: string;
  ticker: string;
  direction: "long" | "short" | null;
  setup_type: string | null;
  entry: number | null;
  stop: number | null;
  target1: number | null;
  target2: number | null;
  risk_pct: number | null;
  rr_ratio: number | null;
  confidence: number | null;
  notes: string | null;
  emotional_state: string | null;
  result: "win" | "loss" | "be" | "open" | null;
  pnl: number | null;
  created_at?: string;
}

export interface EdgeWatchlistItem {
  id?: string;
  user_id: string;
  ticker: string;
  notes: string | null;
  added_at?: string;
}

export interface EdgeSettings {
  user_id: string;
  account_size: number;
  risk_pct: number;
  mode: "beginner" | "advanced";
  updated_at?: string;
}

// ─── Key validation ───────────────────────────────────────────────────────────

function hasSupabaseConfig(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!url && url.includes("supabase") && !!anon && anon.length > 20;
}

function hasServiceRole(): boolean {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return !!key && key.length > 20 && !key.startsWith("your_");
}

// ─── Minimal REST client (no SDK dependency) ─────────────────────────────────
// Using native fetch against the Supabase REST API to avoid adding @supabase/supabase-js
// to package.json until the user is ready to enable Supabase.

function makeHeaders(apiKey: string, extra?: Record<string, string>): Record<string, string> {
  return {
    "apikey": apiKey,
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation",
    ...extra,
  };
}

function baseUrl(): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1`;
}

// ─── Client (anon key, browser-safe) ─────────────────────────────────────────

export const supabase = {
  isConfigured: () => hasSupabaseConfig(),

  async select<T>(table: string, query = ""): Promise<{ data: T[] | null; error: string | null }> {
    if (!hasSupabaseConfig()) return { data: null, error: "Supabase not configured" };
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    try {
      const res = await fetch(`${baseUrl()}/${table}${query ? "?" + query : ""}`, {
        headers: makeHeaders(key),
      });
      if (!res.ok) return { data: null, error: await res.text() };
      return { data: await res.json() as T[], error: null };
    } catch (e) {
      return { data: null, error: String(e) };
    }
  },

  async insert<T>(table: string, row: Partial<T>): Promise<{ data: T | null; error: string | null }> {
    if (!hasSupabaseConfig()) return { data: null, error: "Supabase not configured" };
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    try {
      const res = await fetch(`${baseUrl()}/${table}`, {
        method: "POST",
        headers: makeHeaders(key),
        body: JSON.stringify(row),
      });
      if (!res.ok) return { data: null, error: await res.text() };
      const rows = await res.json() as T[];
      return { data: rows[0] ?? null, error: null };
    } catch (e) {
      return { data: null, error: String(e) };
    }
  },

  async upsert<T>(table: string, row: Partial<T>): Promise<{ data: T | null; error: string | null }> {
    if (!hasSupabaseConfig()) return { data: null, error: "Supabase not configured" };
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    try {
      const res = await fetch(`${baseUrl()}/${table}`, {
        method: "POST",
        headers: makeHeaders(key, { "Prefer": "resolution=merge-duplicates,return=representation" }),
        body: JSON.stringify(row),
      });
      if (!res.ok) return { data: null, error: await res.text() };
      const rows = await res.json() as T[];
      return { data: rows[0] ?? null, error: null };
    } catch (e) {
      return { data: null, error: String(e) };
    }
  },

  async delete(table: string, query: string): Promise<{ error: string | null }> {
    if (!hasSupabaseConfig()) return { error: "Supabase not configured" };
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    try {
      const res = await fetch(`${baseUrl()}/${table}?${query}`, {
        method: "DELETE",
        headers: makeHeaders(key),
      });
      if (!res.ok) return { error: await res.text() };
      return { error: null };
    } catch (e) {
      return { error: String(e) };
    }
  },
};

// ─── Service client (server-only, service role key) ───────────────────────────

export const supabaseService = {
  isConfigured: () => hasSupabaseConfig() && hasServiceRole(),

  async select<T>(table: string, query = ""): Promise<{ data: T[] | null; error: string | null }> {
    if (!hasServiceRole()) return { data: null, error: "Service role key not configured" };
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    try {
      const res = await fetch(`${baseUrl()}/${table}${query ? "?" + query : ""}`, {
        headers: makeHeaders(key),
      });
      if (!res.ok) return { data: null, error: await res.text() };
      return { data: await res.json() as T[], error: null };
    } catch (e) {
      return { data: null, error: String(e) };
    }
  },

  async insert<T>(table: string, row: Partial<T>): Promise<{ data: T | null; error: string | null }> {
    if (!hasServiceRole()) return { data: null, error: "Service role key not configured" };
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    try {
      const res = await fetch(`${baseUrl()}/${table}`, {
        method: "POST",
        headers: makeHeaders(key),
        body: JSON.stringify(row),
      });
      if (!res.ok) return { data: null, error: await res.text() };
      const rows = await res.json() as T[];
      return { data: rows[0] ?? null, error: null };
    } catch (e) {
      return { data: null, error: String(e) };
    }
  },
};

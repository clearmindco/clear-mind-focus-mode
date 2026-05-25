/**
 * Shared fetch hook for EDGE OS client components.
 * Eliminates the repeated useState/useCallback/useEffect pattern across 13+ pages.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useFetch<MyType>("/api/my-route");
 *   const { data } = useFetch<T>("/api/my-route", { interval: 60000 });
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseFetchOptions {
  /** Auto-refresh interval in ms. null = no polling. */
  interval?: number | null;
  /** If false, fetch is skipped until set to true. Default true. */
  enabled?: boolean;
}

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  lastUpdated: Date | null;
}

export function useFetch<T>(url: string, options: UseFetchOptions = {}): UseFetchResult<T> {
  const { interval = null, enabled = true } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        setError(`HTTP ${res.status}`);
      } else {
        setData(await res.json() as T);
        setLastUpdated(new Date());
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError((e as Error).message ?? "Network error");
      }
    } finally {
      setLoading(false);
    }
  }, [url, enabled]);

  // Initial fetch
  useEffect(() => {
    fetchData();
    return () => { abortRef.current?.abort(); };
  }, [fetchData]);

  // Polling
  useEffect(() => {
    if (!interval || !enabled) return;
    const t = setInterval(fetchData, interval);
    return () => clearInterval(t);
  }, [fetchData, interval, enabled]);

  return { data, loading, error, refetch: fetchData, lastUpdated };
}

/**
 * useFetchMultiple — fetch an array of URLs in parallel.
 * Returns results in the same order as the input URLs.
 *
 * Usage:
 *   const { results, loading } = useFetchMultiple<Quote>(symbols.map(s => `/api/quote?symbol=${s}`));
 */

interface UseFetchMultipleResult<T> {
  results: (T | null)[];
  loading: boolean;
  refetch: () => void;
}

export function useFetchMultiple<T>(urls: string[], options: UseFetchOptions = {}): UseFetchMultipleResult<T> {
  const { interval = null, enabled = true } = options;
  const [results, setResults] = useState<(T | null)[]>([]);
  const [loading, setLoading] = useState(enabled);

  const fetchAll = useCallback(async () => {
    if (!enabled || urls.length === 0) return;
    setLoading(true);
    const settled = await Promise.allSettled(
      urls.map(url =>
        fetch(url)
          .then(r => r.ok ? r.json() as Promise<T> : null)
          .catch(() => null)
      )
    );
    setResults(settled.map(r => r.status === "fulfilled" ? r.value : null));
    setLoading(false);
  }, [urls.join(","), enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (!interval || !enabled) return;
    const t = setInterval(fetchAll, interval);
    return () => clearInterval(t);
  }, [fetchAll, interval, enabled]);

  return { results, loading, refetch: fetchAll };
}

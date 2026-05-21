"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import type { EdgeResult } from "@/app/api/edge-scanner/route";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ScannerResponse {
  results: EdgeResult[];
  summary: { strongEdges: number; watches: number; noEdge: number; avoids: number; total: number };
  isPlaceholder: boolean;
  generatedAt: string;
}

interface JournalEntry {
  id: string;
  timestamp: string;
  ticker: string;
  entryPrice: number;
  fairValue: number | null;
  edgePercent: number | null;
  edgeScore: number;
  signal: string;
  edgeThesis: string;
  riskNotes: string;
  result: "pending" | "win" | "loss" | "scratch";
  actualExit?: number;
  notes: string;
  mistakeTags: string[];
}

type TabId = "all" | "movers" | "mispricing" | "unavailable" | "journal";

// ─── Constants ─────────────────────────────────────────────────────────────────

const JOURNAL_KEY = "edge-journal-v1";

const SIGNAL_META: Record<string, { color: string; bg: string; border: string; label: string }> = {
  "STRONG EDGE": { color: "#059669", bg: "rgba(5,150,105,0.15)", border: "rgba(5,150,105,0.35)", label: "STRONG EDGE" },
  WATCH:         { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)", label: "WATCH" },
  "NO EDGE":     { color: "#5a6075", bg: "rgba(90,96,117,0.1)", border: "rgba(90,96,117,0.2)", label: "NO EDGE" },
  AVOID:         { color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.25)", label: "AVOID" },
};

const CONFIDENCE_COLOR: Record<string, string> = { High: "#10b981", Medium: "#f59e0b", Low: "#ef4444" };

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmt(v: number | null, dec = 2): string {
  if (v == null) return "—";
  return v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function fmtPct(v: number | null, sign = true): string {
  if (v == null) return "—";
  return `${sign && v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

function pctColor(v: number | null): string {
  if (v == null) return "#9aa0b4";
  return v > 0 ? "#10b981" : v < 0 ? "#ef4444" : "#9aa0b4";
}

function rsiColor(v: number | null): string {
  if (v == null) return "#9aa0b4";
  if (v < 30) return "#10b981";
  if (v > 70) return "#ef4444";
  if (v < 40 || v > 60) return "#f59e0b";
  return "#9aa0b4";
}

function loadJournal(): JournalEntry[] {
  try {
    const raw = localStorage.getItem(JOURNAL_KEY);
    return raw ? (JSON.parse(raw) as JournalEntry[]) : [];
  } catch { return []; }
}

function saveJournal(entries: JournalEntry[]): void {
  try { localStorage.setItem(JOURNAL_KEY, JSON.stringify(entries)); } catch {}
}

// ─── Score Gauge ───────────────────────────────────────────────────────────────

function ScoreGauge({ score, size = 52 }: { score: number; size?: number }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const color = score >= 65 ? "#059669" : score >= 48 ? "#f59e0b" : score >= 32 ? "#5a6075" : "#ef4444";
  const dash = (score / 100) * circ;
  return (
    <svg width={size} height={size} viewBox="0 0 44 44">
      <circle cx="22" cy="22" r={r} fill="none" strokeWidth="4" stroke="#1e2433" />
      <circle
        cx="22" cy="22" r={r} fill="none" strokeWidth="4"
        stroke={color}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 22 22)"
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
      <text x="22" y="22" textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight="700" fill={color}>
        {score}
      </text>
    </svg>
  );
}

// ─── Edge Card ─────────────────────────────────────────────────────────────────

function EdgeCard({ result, onLog }: { result: EdgeResult; onLog: (r: EdgeResult) => void }) {
  const [expanded, setExpanded] = useState(false);
  const meta = SIGNAL_META[result.signal] ?? SIGNAL_META["NO EDGE"];

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{ background: "#0f1117", border: `1px solid ${expanded ? meta.border : "#1e2433"}` }}
    >
      {/* Main row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
        onClick={() => setExpanded(v => !v)}
      >
        {/* Score gauge */}
        <div className="flex-shrink-0">
          <ScoreGauge score={result.edgeScore} />
        </div>

        {/* Ticker + signal */}
        <div className="flex-shrink-0 w-20">
          <p className="text-sm font-bold" style={{ color: "#e8eaf0" }}>{result.ticker}</p>
          <span
            className="text-xs px-1.5 py-0.5 rounded font-bold"
            style={{ background: meta.bg, color: meta.color }}
          >
            {meta.label}
          </span>
        </div>

        {/* Price + move */}
        <div className="flex-shrink-0 w-24">
          <p className="text-sm font-medium" style={{ color: "#e8eaf0" }}>${fmt(result.price)}</p>
          <p className="text-xs font-bold" style={{ color: pctColor(result.changePercent) }}>
            {fmtPct(result.changePercent)}
          </p>
        </div>

        {/* Fair value + edge */}
        <div className="flex-1 min-w-0 hidden sm:block">
          <div className="flex flex-wrap gap-3">
            <div>
              <p className="text-xs" style={{ color: "#5a6075" }}>Fair Value (SMA20)</p>
              <p className="text-sm font-medium" style={{ color: "#e8eaf0" }}>
                {result.fairValue ? `$${fmt(result.fairValue)}` : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "#5a6075" }}>Edge</p>
              <p className="text-sm font-bold" style={{ color: pctColor(result.edgePercent) }}>
                {fmtPct(result.edgePercent)}
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "#5a6075" }}>RSI</p>
              <p className="text-sm font-medium" style={{ color: rsiColor(result.rsi) }}>
                {result.rsi != null ? result.rsi.toFixed(0) : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "#5a6075" }}>Rel Vol</p>
              <p className="text-sm" style={{ color: result.relativeVolume && result.relativeVolume >= 1.5 ? "#f59e0b" : "#9aa0b4" }}>
                {result.relativeVolume != null ? `${result.relativeVolume}x` : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "#5a6075" }}>Confidence</p>
              <p className="text-xs font-medium" style={{ color: CONFIDENCE_COLOR[result.confidence] }}>
                {result.confidence}
              </p>
            </div>
          </div>
        </div>

        {/* Expand arrow */}
        <span className="text-sm flex-shrink-0 transition-transform" style={{
          color: "#5a6075",
          transform: expanded ? "rotate(90deg)" : "none",
        }}>→</span>
      </div>

      {/* Mobile metrics */}
      <div className="sm:hidden px-4 pb-2 flex gap-4 text-xs" style={{ color: "#9aa0b4" }}>
        <span>FV: {result.fairValue ? `$${fmt(result.fairValue)}` : "—"}</span>
        <span style={{ color: pctColor(result.edgePercent) }}>Edge: {fmtPct(result.edgePercent)}</span>
        <span style={{ color: rsiColor(result.rsi) }}>RSI: {result.rsi?.toFixed(0) ?? "—"}</span>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="px-4 pb-4 pt-0" style={{ borderTop: "1px solid #1e2433" }}>
          <div className="grid md:grid-cols-2 gap-4 pt-4">
            {/* Reasons */}
            <div>
              <p className="text-xs font-bold mb-2" style={{ color: "#00d4ff" }}>Why this signal</p>
              <ul className="space-y-1">
                {result.reasons.map((r, i) => (
                  <li key={i} className="flex gap-2 text-xs" style={{ color: "#9aa0b4" }}>
                    <span style={{ color: "#00d4ff", flexShrink: 0 }}>→</span>{r}
                  </li>
                ))}
              </ul>
            </div>

            {/* Why could be wrong */}
            <div>
              <p className="text-xs font-bold mb-2" style={{ color: "#f59e0b" }}>Why this could be wrong</p>
              <ul className="space-y-1">
                {result.whyWrong.map((w, i) => (
                  <li key={i} className="flex gap-2 text-xs" style={{ color: "#9aa0b4" }}>
                    <span style={{ color: "#f59e0b", flexShrink: 0 }}>⚠</span>{w}
                  </li>
                ))}
              </ul>
            </div>

            {/* Risk metrics */}
            <div>
              <p className="text-xs font-bold mb-2" style={{ color: "#ef4444" }}>Risk Engine</p>
              <div className="space-y-1 text-xs" style={{ color: "#9aa0b4" }}>
                <p><span style={{ color: "#5a6075" }}>Max loss:</span> {result.maxLoss}</p>
                <p><span style={{ color: "#5a6075" }}>Paper size:</span> {result.paperTradeSize}</p>
                {result.liquidityWarning && (
                  <p style={{ color: "#ef4444" }}>⚠ {result.liquidityWarning}</p>
                )}
                <p><span style={{ color: "#5a6075" }}>ATR:</span> ${result.atr ?? "—"} ({result.atrPercent ?? "—"}%)</p>
              </div>
            </div>

            {/* Data source */}
            <div>
              <p className="text-xs font-bold mb-2" style={{ color: "#5a6075" }}>Data Transparency</p>
              <div className="space-y-1 text-xs" style={{ color: "#5a6075" }}>
                <p>Source: {result.dataSource}</p>
                <p>Fair value method: 20-day SMA (historical average)</p>
                <p>Edge % = (SMA20 − price) / price</p>
                <p>Score = data quality + mispricing + volume + momentum alignment</p>
              </div>
            </div>
          </div>

          {/* Paper trade button */}
          {result.signal !== "AVOID" && (
            <div className="mt-4 pt-3" style={{ borderTop: "1px solid #1e2433" }}>
              <button
                onClick={e => { e.stopPropagation(); onLog(result); }}
                className="text-xs px-4 py-2 rounded-lg font-medium transition-all"
                style={{ background: "rgba(0,212,255,0.1)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.25)" }}
              >
                📝 Log as Paper Edge
              </button>
              <span className="ml-3 text-xs" style={{ color: "#5a6075" }}>
                Saves to Edge Journal below — paper trade only
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Unavailable Panel ──────────────────────────────────────────────────────────

function UnavailablePanel({ title, icon, reason, items, architecture }: {
  title: string;
  icon: string;
  reason: string;
  items: string[];
  architecture?: Record<string, string>;
}) {
  const [showArch, setShowArch] = useState(false);
  return (
    <div className="rounded-2xl p-5" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-sm font-bold" style={{ color: "#e8eaf0" }}>{title}</p>
          <p className="text-xs mt-0.5" style={{ color: "#5a6075" }}>{reason}</p>
        </div>
        <span
          className="ml-auto text-xs px-2 py-1 rounded font-medium flex-shrink-0"
          style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          API Required
        </span>
      </div>
      {items.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-bold mb-2" style={{ color: "#5a6075" }}>Compatible Providers</p>
          <ul className="space-y-1">
            {items.map((item, i) => (
              <li key={i} className="text-xs" style={{ color: "#9aa0b4" }}>→ {item}</li>
            ))}
          </ul>
        </div>
      )}
      {architecture && (
        <>
          <button
            onClick={() => setShowArch(v => !v)}
            className="text-xs px-3 py-1.5 rounded-lg"
            style={{ background: "#141720", color: "#5a6075", border: "1px solid #1e2433" }}
          >
            {showArch ? "Hide" : "Show"} field architecture
          </button>
          {showArch && (
            <div className="mt-3 p-3 rounded-xl text-xs space-y-1" style={{ background: "#141720", border: "1px solid #1e2433" }}>
              {Object.entries(architecture).map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <span className="font-mono" style={{ color: "#00d4ff" }}>{k}:</span>
                  <span style={{ color: "#9aa0b4" }}>{v}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Edge Journal ───────────────────────────────────────────────────────────────

function EdgeJournal({ entries, onUpdate }: { entries: JournalEntry[]; onUpdate: () => void }) {
  const [editId, setEditId] = useState<string | null>(null);
  const [editResult, setEditResult] = useState<JournalEntry["result"]>("pending");
  const [editExit, setEditExit] = useState("");
  const [editNotes, setEditNotes] = useState("");

  function saveEdit(id: string) {
    const all = loadJournal();
    const updated = all.map(e => e.id === id ? {
      ...e,
      result: editResult,
      actualExit: editExit ? parseFloat(editExit) : undefined,
      notes: editNotes,
    } : e);
    saveJournal(updated);
    setEditId(null);
    onUpdate();
  }

  function deleteEntry(id: string) {
    saveJournal(loadJournal().filter(e => e.id !== id));
    onUpdate();
  }

  if (!entries.length) {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
        <p className="text-2xl mb-3">📓</p>
        <p className="text-sm font-medium mb-1" style={{ color: "#e8eaf0" }}>Edge Journal is empty</p>
        <p className="text-xs" style={{ color: "#5a6075" }}>
          Click "Log as Paper Edge" on any STRONG EDGE or WATCH card to track your analysis.
        </p>
      </div>
    );
  }

  const wins = entries.filter(e => e.result === "win").length;
  const losses = entries.filter(e => e.result === "loss").length;
  const closed = wins + losses;

  return (
    <div>
      {closed > 0 && (
        <div className="flex gap-4 mb-4 flex-wrap">
          <div className="rounded-xl px-4 py-2" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
            <p className="text-xs" style={{ color: "#5a6075" }}>Win Rate</p>
            <p className="text-lg font-bold" style={{ color: "#10b981" }}>
              {closed > 0 ? Math.round((wins / closed) * 100) : 0}%
            </p>
          </div>
          <div className="rounded-xl px-4 py-2" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
            <p className="text-xs" style={{ color: "#5a6075" }}>Trades Closed</p>
            <p className="text-lg font-bold" style={{ color: "#e8eaf0" }}>{closed}</p>
          </div>
          <div className="rounded-xl px-4 py-2" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
            <p className="text-xs" style={{ color: "#5a6075" }}>Pending</p>
            <p className="text-lg font-bold" style={{ color: "#f59e0b" }}>{entries.filter(e => e.result === "pending").length}</p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.slice().reverse().map(entry => {
          const resultColor = entry.result === "win" ? "#10b981" : entry.result === "loss" ? "#ef4444" : entry.result === "scratch" ? "#9aa0b4" : "#f59e0b";
          const sigMeta = SIGNAL_META[entry.signal] ?? SIGNAL_META["NO EDGE"];
          return (
            <div key={entry.id} className="rounded-2xl p-4" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
              <div className="flex items-start gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-sm" style={{ color: "#e8eaf0" }}>{entry.ticker}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ background: sigMeta.bg, color: sigMeta.color }}>{entry.signal}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ color: resultColor, background: `${resultColor}18` }}>
                      {entry.result.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs mb-1" style={{ color: "#9aa0b4" }}>
                    Entry: ${fmt(entry.entryPrice)} · FV: {entry.fairValue ? `$${fmt(entry.fairValue)}` : "—"} · Edge: {fmtPct(entry.edgePercent)} · Score: {entry.edgeScore}/100
                  </p>
                  <p className="text-xs italic" style={{ color: "#5a6075" }}>{entry.edgeThesis}</p>
                  {entry.notes && <p className="text-xs mt-1" style={{ color: "#9aa0b4" }}>{entry.notes}</p>}
                  {entry.actualExit && (
                    <p className="text-xs mt-1 font-medium" style={{ color: resultColor }}>
                      Exit: ${fmt(entry.actualExit)} · P&L: {fmtPct(((entry.actualExit - entry.entryPrice) / entry.entryPrice) * 100)}
                    </p>
                  )}
                  <p className="text-xs mt-1" style={{ color: "#5a6075" }}>{new Date(entry.timestamp).toLocaleString()}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => { setEditId(entry.id); setEditResult(entry.result); setEditExit(entry.actualExit?.toString() ?? ""); setEditNotes(entry.notes); }}
                    className="text-xs px-2 py-1 rounded-lg"
                    style={{ background: "#141720", color: "#9aa0b4", border: "1px solid #1e2433" }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="text-xs px-2 py-1 rounded-lg"
                    style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {editId === entry.id && (
                <div className="mt-3 pt-3 space-y-2" style={{ borderTop: "1px solid #1e2433" }}>
                  <div className="flex gap-2 flex-wrap">
                    {(["pending", "win", "loss", "scratch"] as const).map(r => (
                      <button
                        key={r}
                        onClick={() => setEditResult(r)}
                        className="text-xs px-3 py-1 rounded-lg capitalize font-medium"
                        style={{
                          background: editResult === r ? "rgba(0,212,255,0.15)" : "#141720",
                          color: editResult === r ? "#00d4ff" : "#9aa0b4",
                          border: `1px solid ${editResult === r ? "rgba(0,212,255,0.3)" : "#1e2433"}`,
                        }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                  <input
                    value={editExit}
                    onChange={e => setEditExit(e.target.value)}
                    placeholder="Exit price (optional)"
                    className="w-full text-xs px-3 py-2 rounded-lg outline-none"
                    style={{ background: "#141720", border: "1px solid #1e2433", color: "#e8eaf0" }}
                  />
                  <textarea
                    value={editNotes}
                    onChange={e => setEditNotes(e.target.value)}
                    placeholder="Notes / lessons learned..."
                    rows={2}
                    className="w-full text-xs px-3 py-2 rounded-lg outline-none resize-none"
                    style={{ background: "#141720", border: "1px solid #1e2433", color: "#e8eaf0" }}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(entry.id)} className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}>
                      Save
                    </button>
                    <button onClick={() => setEditId(null)} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: "#141720", color: "#9aa0b4", border: "1px solid #1e2433" }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Log Modal ──────────────────────────────────────────────────────────────────

function LogModal({ result, onClose, onSaved }: {
  result: EdgeResult;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [thesis, setThesis] = useState(result.reasons.join(". "));
  const [riskNotes, setRiskNotes] = useState(result.maxLoss);

  function save() {
    const entry: JournalEntry = {
      id: `${Date.now()}-${result.ticker}`,
      timestamp: new Date().toISOString(),
      ticker: result.ticker,
      entryPrice: result.price,
      fairValue: result.fairValue,
      edgePercent: result.edgePercent,
      edgeScore: result.edgeScore,
      signal: result.signal,
      edgeThesis: thesis,
      riskNotes,
      result: "pending",
      notes: "",
      mistakeTags: [],
    };
    const all = loadJournal();
    saveJournal([...all, entry]);
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }} onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl p-5"
        style={{ background: "#0f1117", border: "1px solid #1e2433" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold" style={{ color: "#e8eaf0" }}>Log Paper Edge — {result.ticker}</p>
          <button onClick={onClose} style={{ color: "#5a6075" }}>✕</button>
        </div>
        <div className="space-y-3 mb-4">
          <div className="flex gap-3 text-xs" style={{ color: "#9aa0b4" }}>
            <span>Entry: <strong style={{ color: "#e8eaf0" }}>${fmt(result.price)}</strong></span>
            <span>FV: <strong style={{ color: "#e8eaf0" }}>{result.fairValue ? `$${fmt(result.fairValue)}` : "—"}</strong></span>
            <span>Edge: <strong style={{ color: pctColor(result.edgePercent) }}>{fmtPct(result.edgePercent)}</strong></span>
            <span>Score: <strong style={{ color: "#e8eaf0" }}>{result.edgeScore}/100</strong></span>
          </div>
          <div>
            <p className="text-xs font-medium mb-1" style={{ color: "#5a6075" }}>Edge Thesis</p>
            <textarea
              value={thesis}
              onChange={e => setThesis(e.target.value)}
              rows={3}
              className="w-full text-xs px-3 py-2 rounded-lg outline-none resize-none"
              style={{ background: "#141720", border: "1px solid #1e2433", color: "#e8eaf0" }}
            />
          </div>
          <div>
            <p className="text-xs font-medium mb-1" style={{ color: "#5a6075" }}>Risk Notes</p>
            <input
              value={riskNotes}
              onChange={e => setRiskNotes(e.target.value)}
              placeholder="Stop loss, max size, notes..."
              className="w-full text-xs px-3 py-2 rounded-lg outline-none"
              style={{ background: "#141720", border: "1px solid #1e2433", color: "#e8eaf0" }}
            />
          </div>
          <p className="text-xs p-2 rounded-lg" style={{ background: "rgba(245,158,11,0.06)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.15)" }}>
            Paper trade only — no real capital involved. Track this in your Edge Journal.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={save} className="flex-1 text-xs py-2 rounded-lg font-medium" style={{ background: "rgba(0,212,255,0.15)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.3)" }}>
            Save to Journal
          </button>
          <button onClick={onClose} className="text-xs px-4 py-2 rounded-lg" style={{ background: "#141720", color: "#9aa0b4", border: "1px solid #1e2433" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string }[] = [
  { id: "all", label: "All Edges" },
  { id: "movers", label: "3%+ Movers" },
  { id: "mispricing", label: "Mispricing" },
  { id: "unavailable", label: "Unavailable APIs" },
  { id: "journal", label: "Edge Journal" },
];

export default function LiveEdgeScanner() {
  const [data, setData] = useState<ScannerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [logTarget, setLogTarget] = useState<EdgeResult | null>(null);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const refreshJournal = useCallback(() => {
    setJournal(loadJournal());
  }, []);

  useEffect(() => { refreshJournal(); }, [refreshJournal]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/edge-scanner");
      if (res.ok) setData(await res.json());
    } catch {}
    setLoading(false);
    setLastRefresh(new Date());
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const id = setInterval(() => fetchData(), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchData]);

  const results = data?.results ?? [];

  const filteredResults = (() => {
    switch (activeTab) {
      case "movers": return results.filter(r => Math.abs(r.changePercent) >= 3);
      case "mispricing": return results.filter(r => r.edgePercent != null && Math.abs(r.edgePercent) >= 3);
      default: return results;
    }
  })();

  return (
    <div style={{ minHeight: "100vh", background: "#0a0b0d" }}>
      <Navbar />

      {logTarget && (
        <LogModal
          result={logTarget}
          onClose={() => setLogTarget(null)}
          onSaved={() => { refreshJournal(); setActiveTab("journal"); }}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 pt-8 pb-24">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-3"
              style={{ background: "rgba(16,185,129,0.08)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              Live Edge Scanner · Educational Only
            </div>
            <h1 className="text-3xl font-bold" style={{ color: "#e8eaf0" }}>
              Market <span style={{ color: "#10b981" }}>Edge</span> Scanner
            </h1>
            <p className="text-sm mt-1" style={{ color: "#9aa0b4" }}>
              Identifies potential mispricing vs SMA20 fair value · Scored 0–100 · Paper trade logging
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button onClick={fetchData}
              className="text-xs px-4 py-2 rounded-lg font-medium"
              style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}>
              ↻ Refresh
            </button>
            {lastRefresh && <p className="text-xs" style={{ color: "#5a6075" }}>{lastRefresh.toLocaleTimeString()}</p>}
          </div>
        </div>

        {/* Summary bar */}
        {!loading && data && !data.isPlaceholder && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Strong Edges", value: data.summary.strongEdges, color: "#059669", bg: "rgba(5,150,105,0.1)" },
              { label: "Watch", value: data.summary.watches, color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
              { label: "No Edge", value: data.summary.noEdge, color: "#5a6075", bg: "rgba(90,96,117,0.1)" },
              { label: "Scanned", value: data.summary.total, color: "#00d4ff", bg: "rgba(0,212,255,0.1)" },
            ].map(s => (
              <div key={s.label} className="rounded-xl px-4 py-3" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
                <p className="text-xs mb-0.5" style={{ color: "#5a6075" }}>{s.label}</p>
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1.5 flex-wrap mb-5">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="text-xs px-3 py-1.5 rounded-xl font-medium transition-all"
              style={{
                background: activeTab === tab.id ? "rgba(16,185,129,0.15)" : "#0f1117",
                color: activeTab === tab.id ? "#10b981" : "#9aa0b4",
                border: `1px solid ${activeTab === tab.id ? "rgba(16,185,129,0.3)" : "#1e2433"}`,
              }}
            >
              {tab.label}
              {tab.id === "journal" && journal.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs" style={{ background: "rgba(0,212,255,0.2)", color: "#00d4ff" }}>
                  {journal.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === "journal" ? (
          <EdgeJournal entries={journal} onUpdate={refreshJournal} />
        ) : activeTab === "unavailable" ? (
          <div className="space-y-4">
            <UnavailablePanel
              title="Near-Resolution Prediction Scanner"
              icon="🎯"
              reason="Prediction market integration requires Kalshi, Polymarket, or similar API. Architecture is ready."
              items={["Kalshi — US-regulated event contracts (REST API)", "Polymarket — decentralized on Polygon (GET /markets)", "Manifold Markets — free play-money API for testing"]}
              architecture={{ market: "string — event question", currentProb: "number (0–1)", estimatedFairValue: "number (0–1)", edgePct: "number — fair value minus current", daysToResolution: "number", volume24h: "number", confidence: "Low | Medium | High" }}
            />
            <UnavailablePanel
              title="Order Book Imbalance Scanner"
              icon="📊"
              reason="Level 2 order book data requires a premium real-time data provider."
              items={["Polygon.io — Level 2 snapshot API", "Interactive Brokers TWS API — Level 2 streaming", "Alpaca Data API — real-time order book (paid)", "TradingView — visual order book via chart widget"]}
              architecture={{ bidDepth: "number — total bid size", askDepth: "number — total ask size", spread: "number — ask − bid", imbalancePct: "number — (bid−ask)/(bid+ask)*100", liquidityScore: "0–100", topBids: "Array<{price, size}>", topAsks: "Array<{price, size}>" }}
            />
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-8 h-8 rounded-full border-2 animate-spin mx-auto mb-3" style={{ borderColor: "#1e2433", borderTopColor: "#10b981" }} />
              <p className="text-xs" style={{ color: "#5a6075" }}>Scanning {27} instruments…</p>
            </div>
          </div>
        ) : data?.isPlaceholder ? (
          <div className="rounded-2xl p-10 text-center" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
            <p className="text-3xl mb-3">📡</p>
            <p className="text-sm font-medium mb-2" style={{ color: "#e8eaf0" }}>API Not Connected</p>
            <p className="text-xs mb-4" style={{ color: "#5a6075" }}>
              Configure <code style={{ color: "#00d4ff" }}>FINNHUB_API_KEY</code> in Netlify environment variables to enable live edge scanning.
            </p>
            <p className="text-xs" style={{ color: "#5a6075" }}>
              The Edge Journal (tab above) works without an API key — you can log manual analyses.
            </p>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
            <p className="text-xs" style={{ color: "#5a6075" }}>No results match this filter in the current scan.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredResults.map(r => (
              <EdgeCard key={r.ticker} result={r} onLog={setLogTarget} />
            ))}
          </div>
        )}

        {/* Compliance footer */}
        <div className="mt-10 pt-6" style={{ borderTop: "1px solid #1e2433" }}>
          <p className="text-center text-xs leading-relaxed" style={{ color: "#5a6075" }}>
            EDGE OS provides educational research and paper-trading tools only. This is not financial advice, not investment advice, and not a guarantee of profit.
            Edge scores are algorithmic heuristics using 20-day SMA as a fair value proxy — not predictive models. Mispricing signals reflect historical
            deviation, not future direction. All analysis is for educational purposes. Trading involves substantial risk of loss.
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, Fragment } from "react";
import Navbar from "@/components/Navbar";
import { loadProgress, addTradeLog, updateTradeLog, type TradeLog, type AppProgress } from "@/lib/progress";

const SETUP_TYPES = [
  "Breakout", "Pullback", "Bull Flag", "Bear Flag",
  "Trend Continuation", "Failed Breakout", "News Catalyst",
  "TLT/Rates Trade", "Energy/Oil Trade", "Earnings Play", "Other",
];

const ASSET_TYPES = ["Stock", "ETF", "Option (Call)", "Option (Put)", "Crypto", "Other"];

const DIRECTIONS = ["Long", "Short", "Call", "Put"];

const EMOTIONAL_STATES = [
  { value: "calm", label: "Calm — I feel clear-headed and objective" },
  { value: "excited", label: "Excited — I have strong conviction in this trade" },
  { value: "fearful", label: "Fearful — I'm nervous but taking the trade anyway" },
  { value: "revenge", label: "Revenge — recovering from a loss and feeling pressure" },
  { value: "fomo", label: "FOMO — afraid of missing a move already in progress" },
  { value: "unsure", label: "Unsure — I'm not fully confident in the setup" },
];

const EXIT_REASONS = [
  "Hit Target 1", "Hit Target 2", "Stopped Out", "Trailing Stop",
  "Manual Exit — Plan Changed", "Manual Exit — News", "End of Day", "Other",
];

const PRETRADE_ITEMS = [
  { id: "understand", label: "I understand why this trade exists — the setup is clear to me" },
  { id: "stop", label: "I know my exact stop loss price before entering" },
  { id: "target", label: "I know my target(s) and have calculated risk/reward" },
  { id: "rr", label: "Risk/reward is at least 2:1 (or I have a documented reason it isn't)" },
  { id: "notchasing", label: "I am NOT chasing — entry is near the setup, not after a big move" },
  { id: "paper", label: "This is a paper trade only — no real capital at risk" },
];

const EMOTIONAL_WARNING: Record<string, string> = {
  revenge: "⚠️ Revenge trading is one of the most common ways beginners blow up accounts. Take a break before this trade.",
  fomo: "⚠️ FOMO trades typically mean you're entering too late. Ask: is the best entry still available, or has it already moved?",
  fearful: "⚠️ Fear can cause premature exits. Make sure your stop is placed correctly and commit to your plan.",
  unsure: "⚠️ Unsure setups are low-quality. If you can't clearly articulate why you're taking this trade, consider skipping it.",
};

const emptyForm = {
  date: new Date().toISOString().split("T")[0],
  ticker: "",
  assetType: "",
  direction: "",
  emotionalState: "",
  setupType: "",
  catalyst: "",
  entry: "",
  stop: "",
  target1: "",
  target2: "",
  accountSize: "",
  maxRiskPct: "2",
  tradeStatus: "open" as "open" | "closed",
  exitPrice: "",
  result: "",
  exitReason: "",
  thesis: "",
  followedPlan: true,
  lessonLearned: "",
  notes: "",
};

// ─── Calculations ─────────────────────────────────────────────────────────────

function calcRR(entry: string, stop: string, target: string) {
  const e = parseFloat(entry), s = parseFloat(stop), t = parseFloat(target);
  if (!e || !s || !t || e === s) return null;
  return (Math.abs(t - e) / Math.abs(e - s)).toFixed(2);
}

function calcPositionSize(entry: string, stop: string, accountSize: string, maxRiskPct: string) {
  const e = parseFloat(entry), s = parseFloat(stop);
  const acct = parseFloat(accountSize), pct = parseFloat(maxRiskPct);
  if (!e || !s || !acct || !pct || e === s) return null;
  const riskPerShare = Math.abs(e - s);
  const dollarRisk = acct * (pct / 100);
  const shares = Math.floor(dollarRisk / riskPerShare);
  return { riskPerShare: riskPerShare.toFixed(2), dollarRisk: dollarRisk.toFixed(2), shares };
}

// ─── Performance dashboard ────────────────────────────────────────────────────

function buildDashboard(logs: TradeLog[]) {
  const closed = logs.filter(l => {
    const r = parseFloat(l.result);
    return !isNaN(r) && r !== 0;
  });
  if (closed.length < 3) return null;

  // Win/loss by setup type
  const bySetup: Record<string, { wins: number; losses: number }> = {};
  for (const l of closed) {
    if (!l.setupType) continue;
    if (!bySetup[l.setupType]) bySetup[l.setupType] = { wins: 0, losses: 0 };
    if (parseFloat(l.result) > 0) bySetup[l.setupType].wins++;
    else bySetup[l.setupType].losses++;
  }

  const setupEntries = Object.entries(bySetup).filter(([, v]) => v.wins + v.losses >= 2);
  const bestSetup = setupEntries.sort(([, a], [, b]) => {
    const wr = (x: typeof a) => x.wins / (x.wins + x.losses);
    return wr(b) - wr(a);
  })[0]?.[0] ?? null;
  const worstSetup = setupEntries.sort(([, a], [, b]) => {
    const wr = (x: typeof a) => x.wins / (x.wins + x.losses);
    return wr(a) - wr(b);
  })[0]?.[0] ?? null;

  // Emotional state on losses
  const lossTrades = closed.filter(l => parseFloat(l.result) < 0);
  const emotionOnLoss: Record<string, number> = {};
  for (const l of lossTrades) {
    if (l.emotionalState) {
      emotionOnLoss[l.emotionalState] = (emotionOnLoss[l.emotionalState] ?? 0) + 1;
    }
  }
  const topLossEmotion = Object.entries(emotionOnLoss).sort(([, a], [, b]) => b - a)[0]?.[0] ?? null;

  // Plan followed rate
  const followedCount = closed.filter(l => l.followedPlan).length;
  const planRate = Math.round((followedCount / closed.length) * 100);

  return { bestSetup, worstSetup, topLossEmotion, planRate, totalClosed: closed.length };
}

// ─── Main component ───────────────────────────────────────────────────────────

interface AiCoachResult {
  thesisScore: number;
  clarityFeedback: string;
  riskFeedback: string;
  bullishCase: string;
  bearishCase: string;
  questionsToAnswerBeforeTrade: string[];
  finalEducationalDecision: string;
  disclaimer: string;
}

export default function PaperLab() {
  const [progress, setProgress] = useState<AppProgress | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pretradeChecked, setPretradeChecked] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "open" | "closed">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<TradeLog>>({});
  const [showDashboard, setShowDashboard] = useState(false);
  const [openAiOk, setOpenAiOk] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AiCoachResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => { setProgress(loadProgress()); }, []);
  useEffect(() => {
    fetch("/api/status").then(r => r.json()).then((s: { openAi: boolean }) => setOpenAiOk(s.openAi)).catch(() => {});
  }, []);

  async function runAiCoach() {
    if (!openAiOk || form.thesis.trim().length < 30) return;
    setAiLoading(true);
    setAiResult(null);
    setAiError(null);
    try {
      const res = await fetch("/api/ai-trade-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker: form.ticker,
          thesis: form.thesis,
          direction: form.direction,
          setupType: form.setupType,
          entry: form.entry,
          stop: form.stop,
          target1: form.target1,
          target2: form.target2,
          riskNotes: form.notes,
        }),
      });
      const data = await res.json() as AiCoachResult & { error?: string };
      if (!res.ok || data.error) {
        setAiError(data.error ?? "Review failed — try again.");
      } else {
        setAiResult(data);
      }
    } catch {
      setAiError("Network error — could not reach AI Coach.");
    } finally {
      setAiLoading(false);
    }
  }

  const allPretradeChecked = PRETRADE_ITEMS.every(i => pretradeChecked.has(i.id));

  function togglePretrade(id: string) {
    setPretradeChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.ticker.trim()) e.ticker = "Required";
    if (!form.direction) e.direction = "Required";
    if (!form.setupType) e.setupType = "Required";
    if (!form.entry) e.entry = "Required";
    if (!form.stop) e.stop = "Required";
    if (!form.target1) e.target1 = "Required";
    if (!form.thesis.trim() || form.thesis.length < 30) e.thesis = "Write at least 30 characters";
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allPretradeChecked) return;
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    const { accountSize, maxRiskPct, ...logData } = form;
    void accountSize; void maxRiskPct;
    addTradeLog(logData);
    setSubmitted(true);
    setProgress(loadProgress());
    setForm({ ...emptyForm, date: new Date().toISOString().split("T")[0] });
    setErrors({});
    setPretradeChecked(new Set());
    setShowForm(false);
    setTimeout(() => setSubmitted(false), 4000);
  }

  function startEdit(log: TradeLog) {
    setEditingId(log.id);
    setEditForm({
      tradeStatus: log.tradeStatus,
      exitPrice: log.exitPrice ?? "",
      result: log.result,
      exitReason: log.exitReason ?? "",
      followedPlan: log.followedPlan,
      lessonLearned: log.lessonLearned ?? "",
      notes: log.notes,
    });
  }

  function saveEdit(id: string) {
    updateTradeLog(id, editForm);
    setEditingId(null);
    setProgress(loadProgress());
  }

  const rr1 = calcRR(form.entry, form.stop, form.target1);
  const rr2 = calcRR(form.entry, form.stop, form.target2);
  const posSize = calcPositionSize(form.entry, form.stop, form.accountSize, form.maxRiskPct);

  const logs = progress?.tradeLogs ?? [];
  const closedLogs = logs.filter(l => l.tradeStatus === "closed" || (!l.tradeStatus && l.result));
  const openLogs = logs.filter(l => l.tradeStatus === "open" || (!l.tradeStatus && !l.result));
  const positiveCount = logs.filter(l => parseFloat(l.result) > 0).length;
  const negativeCount = logs.filter(l => parseFloat(l.result) < 0).length;
  const winRate = (positiveCount + negativeCount) > 0
    ? Math.round((positiveCount / (positiveCount + negativeCount)) * 100) : null;

  const avgR = (() => {
    const tradesWithRR = logs.filter(l => {
      const e = parseFloat(l.entry), s = parseFloat(l.stop), r = parseFloat(l.result);
      return e && s && r && e !== s;
    });
    if (!tradesWithRR.length) return null;
    const rVals = tradesWithRR.map(l => {
      const risk = Math.abs(parseFloat(l.entry) - parseFloat(l.stop));
      return parseFloat(l.result) / risk;
    });
    return (rVals.reduce((a, b) => a + b, 0) / rVals.length).toFixed(2);
  })();

  const displayedLogs = filterStatus === "all" ? logs
    : filterStatus === "open" ? openLogs : closedLogs;

  const dashboard = buildDashboard(logs);
  const emotionWarning = EMOTIONAL_WARNING[form.emotionalState] ?? null;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0b0d" }}>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold mb-1" style={{ color: "#e8eaf0" }}>
              EDGE <span style={{ color: "#f59e0b" }}>Paper Lab</span>
            </h1>
            <p className="text-sm" style={{ color: "#9aa0b4" }}>
              Document every simulated trade. Write your thesis first. Build discipline before risking real capital.
            </p>
          </div>
          {logs.length >= 3 && (
            <button
              onClick={() => setShowDashboard(v => !v)}
              className="text-xs px-3 py-2 rounded-xl font-medium transition-all"
              style={{
                background: showDashboard ? "rgba(245,158,11,0.12)" : "#0f1117",
                color: showDashboard ? "#f59e0b" : "#9aa0b4",
                border: `1px solid ${showDashboard ? "rgba(245,158,11,0.3)" : "#1e2433"}`,
              }}
            >
              📊 Performance Dashboard
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          {[
            { label: "Total", value: logs.length, color: "#00d4ff" },
            { label: "Open", value: openLogs.length, color: "#f59e0b" },
            { label: "Closed", value: closedLogs.length, color: "#9aa0b4" },
            { label: "Win Rate", value: winRate !== null ? `${winRate}%` : "—", color: "#10b981" },
            { label: "Avg R", value: avgR !== null ? `${avgR}R` : "—", color: parseFloat(avgR ?? "0") >= 0 ? "#10b981" : "#ef4444" },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
              <div className="text-xl font-bold mb-0.5" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs" style={{ color: "#5a6075" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Performance Dashboard */}
        {showDashboard && dashboard && (
          <div className="rounded-2xl p-5 mb-5" style={{ background: "#0f1117", border: "1px solid rgba(245,158,11,0.25)" }}>
            <p className="text-sm font-semibold mb-4" style={{ color: "#f59e0b" }}>📊 Performance Dashboard</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl p-3" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
                <p className="text-xs mb-1" style={{ color: "#5a6075" }}>Best Setup</p>
                <p className="text-sm font-semibold" style={{ color: "#10b981" }}>{dashboard.bestSetup ?? "Not enough data"}</p>
              </div>
              <div className="rounded-xl p-3" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
                <p className="text-xs mb-1" style={{ color: "#5a6075" }}>Worst Setup</p>
                <p className="text-sm font-semibold" style={{ color: "#ef4444" }}>{dashboard.worstSetup ?? "Not enough data"}</p>
              </div>
              <div className="rounded-xl p-3" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
                <p className="text-xs mb-1" style={{ color: "#5a6075" }}>Most Common Loss Emotion</p>
                <p className="text-sm font-semibold" style={{ color: "#f59e0b" }}>
                  {dashboard.topLossEmotion
                    ? dashboard.topLossEmotion.charAt(0).toUpperCase() + dashboard.topLossEmotion.slice(1)
                    : "No emotion data"}
                </p>
              </div>
              <div className="rounded-xl p-3" style={{ background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.15)" }}>
                <p className="text-xs mb-1" style={{ color: "#5a6075" }}>Plan Follow Rate</p>
                <p className="text-sm font-semibold" style={{ color: "#00d4ff" }}>{dashboard.planRate}%</p>
              </div>
            </div>
            <p className="text-xs mt-3" style={{ color: "#5a6075" }}>
              Based on {dashboard.totalClosed} closed trades with P&L recorded. Log more trades for a more reliable picture.
            </p>
          </div>
        )}

        {/* Disclaimer */}
        <div
          className="rounded-xl p-4 mb-6 flex gap-3 items-start"
          style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)" }}
        >
          <span className="text-base flex-shrink-0">⚠️</span>
          <p className="text-xs leading-relaxed" style={{ color: "#9aa0b4" }}>
            <strong style={{ color: "#f59e0b" }}>Paper trading only.</strong> Log simulated trades here. Aim for 30+ consistent, profitable paper trades before moving to real capital. The discipline you build here is your real edge. Users are responsible for all trading decisions. This tool does not constitute financial advice.
          </p>
        </div>

        {submitted && (
          <div className="rounded-xl p-3 mb-4 text-sm text-center font-medium" style={{ background: "rgba(16,185,129,0.08)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}>
            ✓ Trade logged successfully
          </div>
        )}

        {/* Log new trade button / form */}
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-3 rounded-xl font-semibold text-sm mb-8 transition-all"
            style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              color: "#0a0b0d",
              boxShadow: "0 0 20px rgba(245,158,11,0.2)",
            }}
          >
            + Log a Paper Trade
          </button>
        ) : (
          <div className="rounded-2xl p-6 mb-8" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold" style={{ color: "#e8eaf0" }}>Log a Paper Trade</h2>
              <button
                onClick={() => { setShowForm(false); setPretradeChecked(new Set()); setErrors({}); }}
                className="text-xs"
                style={{ color: "#5a6075" }}
              >
                ✕ Cancel
              </button>
            </div>

            {/* Pre-trade checklist */}
            <div
              className="rounded-xl p-4 mb-5"
              style={{
                background: allPretradeChecked ? "rgba(16,185,129,0.04)" : "rgba(0,212,255,0.03)",
                border: `1px solid ${allPretradeChecked ? "rgba(16,185,129,0.2)" : "rgba(0,212,255,0.15)"}`,
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: allPretradeChecked ? "#10b981" : "#00d4ff" }}>
                {allPretradeChecked ? "✓ Pre-trade checklist complete" : "Before you log — confirm all items"}
              </p>
              <div className="space-y-2">
                {PRETRADE_ITEMS.map(item => {
                  const checked = pretradeChecked.has(item.id);
                  return (
                    <label key={item.id} className="flex items-start gap-3 cursor-pointer">
                      <div
                        className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                        onClick={() => togglePretrade(item.id)}
                        style={{
                          background: checked ? "#10b981" : "transparent",
                          border: `2px solid ${checked ? "#10b981" : "#2a3048"}`,
                          cursor: "pointer",
                        }}
                      >
                        {checked && (
                          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                            <path d="M1 3L3 5L7 1" stroke="#0a0b0d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span className="text-xs leading-snug" style={{ color: checked ? "#9aa0b4" : "#5a6075" }}>{item.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Trade form */}
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Row 1: Identity */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#5a6075" }}>Trade Identification</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <Field label="Date" error={errors.date}>
                    <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} style={inputStyle} />
                  </Field>
                  <Field label="Ticker" error={errors.ticker}>
                    <input type="text" placeholder="NVDA" value={form.ticker} onChange={e => setForm(p => ({ ...p, ticker: e.target.value.toUpperCase() }))} style={inputStyle} />
                  </Field>
                  <Field label="Asset Type" error={errors.assetType}>
                    <select value={form.assetType} onChange={e => setForm(p => ({ ...p, assetType: e.target.value }))} style={inputStyle}>
                      <option value="">Select…</option>
                      {ASSET_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </Field>
                  <Field label="Direction" error={errors.direction}>
                    <select value={form.direction} onChange={e => setForm(p => ({ ...p, direction: e.target.value }))} style={inputStyle}>
                      <option value="">Select…</option>
                      {DIRECTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </Field>
                  <Field label="Setup Type" error={errors.setupType}>
                    <select value={form.setupType} onChange={e => setForm(p => ({ ...p, setupType: e.target.value }))} style={inputStyle}>
                      <option value="">Select…</option>
                      {SETUP_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="Emotional State" error={errors.emotionalState}>
                    <select value={form.emotionalState} onChange={e => setForm(p => ({ ...p, emotionalState: e.target.value }))} style={inputStyle}>
                      <option value="">Select…</option>
                      {EMOTIONAL_STATES.map(es => <option key={es.value} value={es.value}>{es.label}</option>)}
                    </select>
                  </Field>
                </div>
                {emotionWarning && (
                  <div className="mt-2 rounded-lg px-3 py-2 text-xs" style={{ background: "rgba(245,158,11,0.06)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>
                    {emotionWarning}
                  </div>
                )}
              </div>

              {/* Row 2: Price levels */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#5a6075" }}>Price Levels</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Field label="Entry ($)" error={errors.entry}>
                    <input type="number" step="0.01" placeholder="0.00" value={form.entry} onChange={e => setForm(p => ({ ...p, entry: e.target.value }))} style={inputStyle} />
                  </Field>
                  <Field label="Stop Loss ($)" error={errors.stop}>
                    <input type="number" step="0.01" placeholder="0.00" value={form.stop} onChange={e => setForm(p => ({ ...p, stop: e.target.value }))} style={inputStyle} />
                  </Field>
                  <Field label="Target 1 ($)" error={errors.target1}>
                    <input type="number" step="0.01" placeholder="0.00" value={form.target1} onChange={e => setForm(p => ({ ...p, target1: e.target.value }))} style={inputStyle} />
                  </Field>
                  <Field label="Target 2 ($)" error={errors.target2}>
                    <input type="number" step="0.01" placeholder="0.00" value={form.target2} onChange={e => setForm(p => ({ ...p, target2: e.target.value }))} style={inputStyle} />
                  </Field>
                </div>
              </div>

              {/* R:R live calc */}
              {(rr1 || rr2) && (
                <div className="grid grid-cols-2 gap-3">
                  {rr1 && (
                    <div
                      className="rounded-lg p-3 flex items-center gap-3"
                      style={{
                        background: parseFloat(rr1) >= 2 ? "rgba(16,185,129,0.06)" : "rgba(245,158,11,0.06)",
                        border: `1px solid ${parseFloat(rr1) >= 2 ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)"}`,
                      }}
                    >
                      <span className="text-xs" style={{ color: "#9aa0b4" }}>R:R to T1</span>
                      <span className="font-bold text-sm" style={{ color: parseFloat(rr1) >= 2 ? "#10b981" : "#f59e0b" }}>1:{rr1}</span>
                      {parseFloat(rr1) < 2 && <span className="text-xs" style={{ color: "#f59e0b" }}>⚠ Below 1:2</span>}
                    </div>
                  )}
                  {rr2 && form.target2 && (
                    <div className="rounded-lg p-3 flex items-center gap-3" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}>
                      <span className="text-xs" style={{ color: "#9aa0b4" }}>R:R to T2</span>
                      <span className="font-bold text-sm" style={{ color: "#10b981" }}>1:{rr2}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Position sizing calculator */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#5a6075" }}>
                  Position Sizing Calculator <span style={{ color: "#3a4060", fontWeight: 400 }}>— optional but recommended</span>
                </p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <Field label="Account Size ($)">
                    <input
                      type="number" step="100" placeholder="e.g. 10000"
                      value={form.accountSize}
                      onChange={e => setForm(p => ({ ...p, accountSize: e.target.value }))}
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Max Risk per Trade (%)">
                    <input
                      type="number" step="0.5" min="0.5" max="10" placeholder="2"
                      value={form.maxRiskPct}
                      onChange={e => setForm(p => ({ ...p, maxRiskPct: e.target.value }))}
                      style={inputStyle}
                    />
                  </Field>
                </div>
                {posSize && (
                  <div
                    className="rounded-xl p-4 grid grid-cols-3 gap-4"
                    style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)" }}
                  >
                    <div className="text-center">
                      <p className="text-xs mb-1" style={{ color: "#5a6075" }}>Risk / Share</p>
                      <p className="font-bold" style={{ color: "#ef4444" }}>${posSize.riskPerShare}</p>
                      <p className="text-xs" style={{ color: "#5a6075" }}>|entry − stop|</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs mb-1" style={{ color: "#5a6075" }}>Max $ Risk</p>
                      <p className="font-bold" style={{ color: "#f59e0b" }}>${posSize.dollarRisk}</p>
                      <p className="text-xs" style={{ color: "#5a6075" }}>acct × {form.maxRiskPct}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs mb-1" style={{ color: "#5a6075" }}>Suggested Shares</p>
                      <p className="font-bold" style={{ color: "#00d4ff" }}>{posSize.shares}</p>
                      <p className="text-xs" style={{ color: "#5a6075" }}>max risk ÷ risk/share</p>
                    </div>
                  </div>
                )}
                {!posSize && form.accountSize && (
                  <p className="text-xs" style={{ color: "#5a6075" }}>Enter entry and stop prices above to see position sizing.</p>
                )}
              </div>

              {/* Catalyst + Thesis */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#5a6075" }}>Thesis & Catalyst</p>
                <Field label="Catalyst — what is driving this setup?" error={errors.catalyst} className="mb-3">
                  <input
                    type="text" placeholder="e.g. Earnings beat, breakout above resistance, Fed rate cut news…"
                    value={form.catalyst}
                    onChange={e => setForm(p => ({ ...p, catalyst: e.target.value }))}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Trade Thesis — why are you taking this trade? (min 30 chars)" error={errors.thesis}>
                  <textarea
                    rows={4}
                    placeholder="Describe the setup, your entry reason, what you expect to happen, and your plan if it goes against you…"
                    value={form.thesis}
                    onChange={e => setForm(p => ({ ...p, thesis: e.target.value }))}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </Field>
              </div>

              {/* AI Trade Coach */}
              <div className="rounded-2xl p-5" style={{ background: "rgba(139,92,246,0.04)", border: "1px solid rgba(139,92,246,0.2)" }}>
                <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#a855f7" }}>🤖 AI Trade Coach</p>
                    <p className="text-xs mt-0.5" style={{ color: "#5a6075" }}>
                      {openAiOk
                        ? "Educational feedback on your thesis — not financial advice"
                        : "OpenAI not connected — add OPENAI_API_KEY to enable"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: openAiOk ? "#10b981" : "#5a6075" }} />
                    <span className="text-xs" style={{ color: openAiOk ? "#10b981" : "#5a6075" }}>
                      {openAiOk ? "Connected" : "Not connected"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={runAiCoach}
                  disabled={!openAiOk || aiLoading || form.thesis.trim().length < 30}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold transition-all mb-4"
                  style={{
                    background: openAiOk && form.thesis.trim().length >= 30 ? "rgba(139,92,246,0.15)" : "#141720",
                    color: openAiOk && form.thesis.trim().length >= 30 ? "#a855f7" : "#5a6075",
                    border: `1px solid ${openAiOk && form.thesis.trim().length >= 30 ? "rgba(139,92,246,0.4)" : "#1e2433"}`,
                    cursor: openAiOk && !aiLoading && form.thesis.trim().length >= 30 ? "pointer" : "not-allowed",
                  }}
                >
                  {aiLoading ? "Reviewing thesis…" : form.thesis.trim().length < 30 ? "Write 30+ chars in thesis above to unlock" : "Review My Trade Thesis"}
                </button>

                {aiError && (
                  <div className="rounded-xl p-3 text-xs" style={{ background: "rgba(239,68,68,0.06)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                    {aiError}
                  </div>
                )}

                {aiResult && (
                  <div className="space-y-3">
                    {/* Score */}
                    <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: "#141720", border: "1px solid #1e2433" }}>
                      <div className="text-center">
                        <p className="text-xs" style={{ color: "#5a6075" }}>Thesis Score</p>
                        <p className="text-2xl font-bold" style={{ color: aiResult.thesisScore >= 7 ? "#10b981" : aiResult.thesisScore >= 5 ? "#f59e0b" : "#ef4444" }}>
                          {aiResult.thesisScore}<span className="text-sm" style={{ color: "#5a6075" }}>/10</span>
                        </p>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold mb-0.5" style={{ color: "#a855f7" }}>Final Assessment</p>
                        <p className="text-xs font-bold" style={{ color: "#e8eaf0" }}>{aiResult.finalEducationalDecision}</p>
                      </div>
                    </div>

                    {/* Feedback cards */}
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="rounded-xl p-3" style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)" }}>
                        <p className="text-xs font-semibold mb-1" style={{ color: "#00d4ff" }}>Clarity</p>
                        <p className="text-xs leading-relaxed" style={{ color: "#9aa0b4" }}>{aiResult.clarityFeedback}</p>
                      </div>
                      <div className="rounded-xl p-3" style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.15)" }}>
                        <p className="text-xs font-semibold mb-1" style={{ color: "#f59e0b" }}>Risk</p>
                        <p className="text-xs leading-relaxed" style={{ color: "#9aa0b4" }}>{aiResult.riskFeedback}</p>
                      </div>
                      <div className="rounded-xl p-3" style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.15)" }}>
                        <p className="text-xs font-semibold mb-1" style={{ color: "#10b981" }}>Bull Case</p>
                        <p className="text-xs leading-relaxed" style={{ color: "#9aa0b4" }}>{aiResult.bullishCase}</p>
                      </div>
                      <div className="rounded-xl p-3" style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)" }}>
                        <p className="text-xs font-semibold mb-1" style={{ color: "#ef4444" }}>Bear Case</p>
                        <p className="text-xs leading-relaxed" style={{ color: "#9aa0b4" }}>{aiResult.bearishCase}</p>
                      </div>
                    </div>

                    {/* Questions to answer */}
                    <div className="rounded-xl p-3" style={{ background: "#141720", border: "1px solid #1e2433" }}>
                      <p className="text-xs font-semibold mb-2" style={{ color: "#f59e0b" }}>Questions to answer before trading</p>
                      <ul className="space-y-1.5">
                        {aiResult.questionsToAnswerBeforeTrade.map((q, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "#9aa0b4" }}>
                            <span style={{ color: "#f59e0b", flexShrink: 0 }}>{i + 1}.</span>
                            {q}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <p className="text-xs text-center" style={{ color: "#3a4060" }}>{aiResult.disclaimer}</p>
                  </div>
                )}
              </div>

              {/* Exit section */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#5a6075" }}>
                  Exit Details <span style={{ color: "#3a4060", fontWeight: 400 }}>— fill in when trade closes</span>
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Field label="Status">
                    <select value={form.tradeStatus} onChange={e => setForm(p => ({ ...p, tradeStatus: e.target.value as "open" | "closed" }))} style={inputStyle}>
                      <option value="open">Open</option>
                      <option value="closed">Closed</option>
                    </select>
                  </Field>
                  <Field label="Exit Price ($)">
                    <input type="number" step="0.01" placeholder="0.00" value={form.exitPrice} onChange={e => setForm(p => ({ ...p, exitPrice: e.target.value }))} style={inputStyle} />
                  </Field>
                  <Field label="Result ($ P&L)">
                    <input type="number" step="0.01" placeholder="+50 or -25" value={form.result} onChange={e => setForm(p => ({ ...p, result: e.target.value }))} style={inputStyle} />
                  </Field>
                  <Field label="Exit Reason">
                    <select value={form.exitReason} onChange={e => setForm(p => ({ ...p, exitReason: e.target.value }))} style={inputStyle}>
                      <option value="">Select…</option>
                      {EXIT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </Field>
                </div>
              </div>

              {/* Review */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#5a6075" }}>Review & Lessons</p>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center cursor-pointer transition-all flex-shrink-0"
                    onClick={() => setForm(p => ({ ...p, followedPlan: !p.followedPlan }))}
                    style={{ background: form.followedPlan ? "#10b981" : "transparent", border: `2px solid ${form.followedPlan ? "#10b981" : "#2a3048"}` }}
                  >
                    {form.followedPlan && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="#0a0b0d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm" style={{ color: "#9aa0b4" }}>I followed my plan on this trade</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Lesson Learned">
                    <input type="text" placeholder="What would you do differently?" value={form.lessonLearned} onChange={e => setForm(p => ({ ...p, lessonLearned: e.target.value }))} style={inputStyle} />
                  </Field>
                  <Field label="Notes">
                    <input type="text" placeholder="Any other context or observations" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={inputStyle} />
                  </Field>
                </div>
              </div>

              <button
                type="submit"
                disabled={!allPretradeChecked}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
                style={{
                  background: allPretradeChecked ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" : "#141720",
                  color: allPretradeChecked ? "#0a0b0d" : "#5a6075",
                  boxShadow: allPretradeChecked ? "0 0 20px rgba(245,158,11,0.2)" : "none",
                  cursor: allPretradeChecked ? "pointer" : "not-allowed",
                }}
              >
                {allPretradeChecked ? "Log Trade" : "Complete the pre-trade checklist above first"}
              </button>
            </form>
          </div>
        )}

        {/* Trade History */}
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="text-sm font-semibold" style={{ color: "#e8eaf0" }}>Trade History ({logs.length} trades)</h2>
          <div className="flex gap-1">
            {(["all", "open", "closed"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterStatus(f)}
                className="text-xs px-3 py-1.5 rounded-lg transition-all capitalize"
                style={{
                  background: filterStatus === f ? "rgba(0,212,255,0.08)" : "#141720",
                  color: filterStatus === f ? "#00d4ff" : "#9aa0b4",
                  border: filterStatus === f ? "1px solid rgba(0,212,255,0.2)" : "1px solid #1e2433",
                }}
              >
                {f} {f === "open" ? `(${openLogs.length})` : f === "closed" ? `(${closedLogs.length})` : `(${logs.length})`}
              </button>
            ))}
          </div>
        </div>

        {displayedLogs.length > 0 ? (
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #1e2433" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: "#0a0b0d" }}>
                    {["Date", "Ticker", "Type", "Dir", "Setup", "Emotion", "Entry", "Stop", "T1", "R:R T1", "Status", "Exit $", "Result", "Plan", "Actions"].map(h => (
                      <th key={h} className="px-3 py-3 text-left font-medium whitespace-nowrap" style={{ color: "#5a6075" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayedLogs.map((log: TradeLog) => {
                    const rr = calcRR(log.entry, log.stop, log.target1) ? `1:${calcRR(log.entry, log.stop, log.target1)}` : "—";
                    const resultNum = parseFloat(log.result);
                    const statusLabel = log.tradeStatus ?? (log.result ? "closed" : "open");
                    const isEditing = editingId === log.id;

                    return (
                      <Fragment key={log.id}>
                        <tr style={{ borderBottom: isEditing ? "none" : "1px solid #1e2433" }}>
                          <td className="px-3 py-3 whitespace-nowrap" style={{ color: "#9aa0b4" }}>{log.date}</td>
                          <td className="px-3 py-3 font-bold" style={{ color: "#e8eaf0" }}>{log.ticker}</td>
                          <td className="px-3 py-3 whitespace-nowrap" style={{ color: "#5a6075" }}>{log.assetType || "—"}</td>
                          <td className="px-3 py-3">
                            {log.direction ? (
                              <span className="px-1.5 py-0.5 rounded font-semibold" style={{
                                background: ["Long", "Call"].includes(log.direction) ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                                color: ["Long", "Call"].includes(log.direction) ? "#10b981" : "#ef4444",
                              }}>{log.direction}</span>
                            ) : "—"}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap" style={{ color: "#9aa0b4" }}>{log.setupType}</td>
                          <td className="px-3 py-3 whitespace-nowrap" style={{ color: "#9aa0b4" }}>
                            {log.emotionalState
                              ? log.emotionalState.charAt(0).toUpperCase() + log.emotionalState.slice(1)
                              : "—"}
                          </td>
                          <td className="px-3 py-3" style={{ color: "#9aa0b4" }}>${log.entry}</td>
                          <td className="px-3 py-3" style={{ color: "#ef4444" }}>${log.stop}</td>
                          <td className="px-3 py-3" style={{ color: "#10b981" }}>${log.target1}</td>
                          <td className="px-3 py-3" style={{ color: "#00d4ff" }}>{rr}</td>
                          <td className="px-3 py-3">
                            <span className="px-1.5 py-0.5 rounded" style={{
                              background: statusLabel === "open" ? "rgba(245,158,11,0.1)" : "rgba(90,96,117,0.15)",
                              color: statusLabel === "open" ? "#f59e0b" : "#9aa0b4",
                            }}>{statusLabel}</span>
                          </td>
                          <td className="px-3 py-3" style={{ color: "#9aa0b4" }}>{log.exitPrice ? `$${log.exitPrice}` : "—"}</td>
                          <td className="px-3 py-3 font-semibold" style={{ color: resultNum > 0 ? "#10b981" : resultNum < 0 ? "#ef4444" : "#9aa0b4" }}>
                            {log.result ? `$${log.result}` : "—"}
                          </td>
                          <td className="px-3 py-3" style={{ color: log.followedPlan ? "#10b981" : "#ef4444" }}>
                            {log.followedPlan ? "✓" : "✗"}
                          </td>
                          <td className="px-3 py-3">
                            <button
                              onClick={() => isEditing ? setEditingId(null) : startEdit(log)}
                              className="text-xs px-2 py-1 rounded transition-all"
                              style={{
                                background: isEditing ? "rgba(239,68,68,0.1)" : "rgba(0,212,255,0.08)",
                                color: isEditing ? "#ef4444" : "#00d4ff",
                                border: `1px solid ${isEditing ? "rgba(239,68,68,0.2)" : "rgba(0,212,255,0.2)"}`,
                              }}
                            >
                              {isEditing ? "Cancel" : "Edit"}
                            </button>
                          </td>
                        </tr>
                        {isEditing && (
                          <tr key={`${log.id}-edit`} style={{ borderBottom: "1px solid #1e2433" }}>
                            <td colSpan={15} className="px-4 py-4" style={{ background: "rgba(0,212,255,0.03)" }}>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                                <Field label="Status">
                                  <select
                                    value={editForm.tradeStatus ?? "open"}
                                    onChange={e => setEditForm(p => ({ ...p, tradeStatus: e.target.value as "open" | "closed" }))}
                                    style={inputStyle}
                                  >
                                    <option value="open">Open</option>
                                    <option value="closed">Closed</option>
                                  </select>
                                </Field>
                                <Field label="Exit Price ($)">
                                  <input
                                    type="number" step="0.01"
                                    value={editForm.exitPrice ?? ""}
                                    onChange={e => setEditForm(p => ({ ...p, exitPrice: e.target.value }))}
                                    style={inputStyle}
                                  />
                                </Field>
                                <Field label="Result ($ P&L)">
                                  <input
                                    type="number" step="0.01"
                                    value={editForm.result ?? ""}
                                    onChange={e => setEditForm(p => ({ ...p, result: e.target.value }))}
                                    style={inputStyle}
                                  />
                                </Field>
                                <Field label="Exit Reason">
                                  <select
                                    value={editForm.exitReason ?? ""}
                                    onChange={e => setEditForm(p => ({ ...p, exitReason: e.target.value }))}
                                    style={inputStyle}
                                  >
                                    <option value="">Select…</option>
                                    {EXIT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                                  </select>
                                </Field>
                              </div>
                              <div className="flex items-center gap-3 mb-3">
                                <div
                                  className="w-4 h-4 rounded flex items-center justify-center cursor-pointer transition-all flex-shrink-0"
                                  onClick={() => setEditForm(p => ({ ...p, followedPlan: !p.followedPlan }))}
                                  style={{ background: editForm.followedPlan ? "#10b981" : "transparent", border: `2px solid ${editForm.followedPlan ? "#10b981" : "#2a3048"}` }}
                                >
                                  {editForm.followedPlan && (
                                    <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                                      <path d="M1 3L3 5L7 1" stroke="#0a0b0d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  )}
                                </div>
                                <span className="text-xs" style={{ color: "#9aa0b4" }}>Followed plan</span>
                              </div>
                              <div className="grid grid-cols-2 gap-3 mb-3">
                                <Field label="Lesson Learned">
                                  <input type="text" value={editForm.lessonLearned ?? ""} onChange={e => setEditForm(p => ({ ...p, lessonLearned: e.target.value }))} style={inputStyle} />
                                </Field>
                                <Field label="Notes">
                                  <input type="text" value={editForm.notes ?? ""} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} style={inputStyle} />
                                </Field>
                              </div>
                              <button
                                onClick={() => saveEdit(log.id)}
                                className="text-xs px-4 py-2 rounded-lg font-semibold"
                                style={{ background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}
                              >
                                ✓ Save Changes
                              </button>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl p-10 text-center" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
            <div className="text-4xl mb-3">📊</div>
            <p className="font-semibold mb-1" style={{ color: "#e8eaf0" }}>No trades logged yet</p>
            <p className="text-sm" style={{ color: "#9aa0b4" }}>Log your first paper trade above to start building your edge log.</p>
          </div>
        )}

        <p className="text-center text-xs mt-6" style={{ color: "#5a6075" }}>
          Trade data is stored locally in your browser · Cloud sync planned via Supabase · Paper trades only · Not financial advice · Users are responsible for all trading decisions
        </p>
      </div>
    </div>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#0a0b0d",
  border: "1px solid #1e2433",
  borderRadius: "8px",
  padding: "8px 12px",
  color: "#e8eaf0",
  fontSize: "13px",
  outline: "none",
};

function Field({ label, error, children, className }: { label: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium mb-1.5" style={{ color: "#9aa0b4" }}>{label}</label>
      {children}
      {error && <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{error}</p>}
    </div>
  );
}

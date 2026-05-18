"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { loadProgress, addTradeLog, type TradeLog, type AppProgress } from "@/lib/progress";

const SETUP_TYPES = [
  "Breakout", "Pullback", "Bull Flag", "Bear Flag",
  "Trend Continuation", "Failed Breakout", "News Catalyst",
  "TLT/Rates Trade", "Energy/Oil Trade", "Earnings Play", "Other",
];

const DIRECTIONS = ["Long", "Short"];

const EXIT_REASONS = [
  "Hit Target 1", "Hit Target 2", "Stopped Out", "Trailing Stop",
  "Manual Exit — Plan Changed", "Manual Exit — News", "End of Day", "Other",
];

const TRADE_STATUSES = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
];

// Pre-trade checklist — must be completed before submitting
const PRETRADE_ITEMS = [
  { id: "understand", label: "I understand why this trade exists — the setup is clear to me" },
  { id: "stop", label: "I know my exact stop loss price before entering" },
  { id: "target", label: "I know my target(s) and have calculated risk/reward" },
  { id: "rr", label: "Risk/reward is at least 2:1 (or I have a documented reason it isn't)" },
  { id: "notchasing", label: "I am NOT chasing — entry is near the setup, not after a big move" },
  { id: "paper", label: "This is a paper trade only — no real capital at risk" },
];

const emptyForm = {
  date: new Date().toISOString().split("T")[0],
  ticker: "",
  direction: "",
  setupType: "",
  catalyst: "",
  entry: "",
  stop: "",
  target1: "",
  target2: "",
  tradeStatus: "open" as "open" | "closed",
  exitPrice: "",
  result: "",
  exitReason: "",
  thesis: "",
  followedPlan: true,
  lessonLearned: "",
  notes: "",
};

export default function PaperLab() {
  const [progress, setProgress] = useState<AppProgress | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pretradeChecked, setPretradeChecked] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "open" | "closed">("all");

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

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
    addTradeLog(form);
    setSubmitted(true);
    setProgress(loadProgress());
    setForm({ ...emptyForm, date: new Date().toISOString().split("T")[0] });
    setErrors({});
    setPretradeChecked(new Set());
    setShowForm(false);
    setTimeout(() => setSubmitted(false), 4000);
  }

  const riskReward = (() => {
    const entry = parseFloat(form.entry);
    const stop = parseFloat(form.stop);
    const t1 = parseFloat(form.target1);
    if (!entry || !stop || !t1 || entry === stop) return null;
    const risk = Math.abs(entry - stop);
    const reward = Math.abs(t1 - entry);
    return (reward / risk).toFixed(2);
  })();

  const logs = progress?.tradeLogs ?? [];
  const closedLogs = logs.filter(l => l.tradeStatus === "closed" || (!l.tradeStatus && l.result));
  const openLogs = logs.filter(l => l.tradeStatus === "open" || (!l.tradeStatus && !l.result));
  const positiveCount = logs.filter(l => parseFloat(l.result) > 0).length;
  const negativeCount = logs.filter(l => parseFloat(l.result) < 0).length;
  const winRate = (positiveCount + negativeCount) > 0
    ? Math.round((positiveCount / (positiveCount + negativeCount)) * 100)
    : null;

  // Average R calculation
  const avgR = (() => {
    const tradesWithRR = logs.filter(l => {
      const e = parseFloat(l.entry);
      const s = parseFloat(l.stop);
      const r = parseFloat(l.result);
      return e && s && r && e !== s;
    });
    if (!tradesWithRR.length) return null;
    const rValues = tradesWithRR.map(l => {
      const risk = Math.abs(parseFloat(l.entry) - parseFloat(l.stop));
      return parseFloat(l.result) / risk;
    });
    return (rValues.reduce((a, b) => a + b, 0) / rValues.length).toFixed(2);
  })();

  const displayedLogs = filterStatus === "all"
    ? logs
    : filterStatus === "open"
    ? openLogs
    : closedLogs;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0b0d" }}>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1" style={{ color: "#e8eaf0" }}>
            EDGE <span style={{ color: "#f59e0b" }}>Paper Lab</span>
          </h1>
          <p className="text-sm" style={{ color: "#9aa0b4" }}>
            Document every simulated trade. Write your thesis first. Build discipline before risking real capital.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: "Total", value: logs.length, color: "#00d4ff" },
            { label: "Open", value: openLogs.length, color: "#f59e0b" },
            { label: "Closed", value: closedLogs.length, color: "#9aa0b4" },
            { label: "Win Rate", value: winRate !== null ? `${winRate}%` : "—", color: "#10b981" },
            { label: "Avg R", value: avgR !== null ? `${avgR}R` : "—", color: parseFloat(avgR ?? "0") >= 0 ? "#10b981" : "#ef4444" },
          ].map(s => (
            <div
              key={s.label}
              className="rounded-xl p-3 text-center"
              style={{ background: "#0f1117", border: "1px solid #1e2433" }}
            >
              <div className="text-xl font-bold mb-0.5" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs" style={{ color: "#5a6075" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div
          className="rounded-xl p-4 mb-6 flex gap-3 items-start"
          style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)" }}
        >
          <span className="text-base flex-shrink-0">⚠️</span>
          <p className="text-xs leading-relaxed" style={{ color: "#9aa0b4" }}>
            <strong style={{ color: "#f59e0b" }}>Paper trading only.</strong> Log simulated trades here. Aim for 30+ consistent, profitable paper trades before moving to real capital. The discipline you build here is your real edge. Users are responsible for all trading decisions.
          </p>
        </div>

        {/* Log new trade CTA */}
        {submitted && (
          <div
            className="rounded-xl p-3 mb-4 text-sm text-center font-medium"
            style={{ background: "rgba(16,185,129,0.08)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}
          >
            ✓ Trade logged successfully
          </div>
        )}

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

            {/* ── Pre-trade checklist ── */}
            <div
              className="rounded-xl p-4 mb-5"
              style={{
                background: allPretradeChecked ? "rgba(16,185,129,0.04)" : "rgba(0,212,255,0.03)",
                border: `1px solid ${allPretradeChecked ? "rgba(16,185,129,0.2)" : "rgba(0,212,255,0.15)"}`,
              }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ color: allPretradeChecked ? "#10b981" : "#00d4ff" }}
              >
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
                      <span className="text-xs leading-snug" style={{ color: checked ? "#9aa0b4" : "#5a6075" }}>
                        {item.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* ── Trade Form ── */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Row 1: Identity */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#5a6075" }}>
                  Trade Identification
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Field label="Date" error={errors.date}>
                    <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} style={inputStyle} />
                  </Field>
                  <Field label="Ticker" error={errors.ticker}>
                    <input
                      type="text" placeholder="NVDA"
                      value={form.ticker}
                      onChange={e => setForm(p => ({ ...p, ticker: e.target.value.toUpperCase() }))}
                      style={inputStyle}
                    />
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
                </div>
              </div>

              {/* Row 2: Price levels */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#5a6075" }}>
                  Price Levels
                </p>
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
              {riskReward && (
                <div
                  className="rounded-lg p-3 flex items-center gap-3"
                  style={{
                    background: parseFloat(riskReward) >= 2 ? "rgba(16,185,129,0.06)" : "rgba(245,158,11,0.06)",
                    border: `1px solid ${parseFloat(riskReward) >= 2 ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)"}`,
                  }}
                >
                  <span className="text-xs" style={{ color: "#9aa0b4" }}>Live R:R</span>
                  <span className="font-bold text-sm" style={{ color: parseFloat(riskReward) >= 2 ? "#10b981" : "#f59e0b" }}>
                    1:{riskReward}
                  </span>
                  {parseFloat(riskReward) < 2 && (
                    <span className="text-xs" style={{ color: "#f59e0b" }}>⚠ Below 1:2 minimum — document your reason below</span>
                  )}
                </div>
              )}

              {/* Catalyst + Thesis */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#5a6075" }}>
                  Thesis & Catalyst
                </p>
                <Field label="Catalyst (what triggered this setup?)" error={errors.catalyst} className="mb-3">
                  <input
                    type="text"
                    placeholder="e.g. Earnings beat, breakout above resistance, Fed rate cut news…"
                    value={form.catalyst}
                    onChange={e => setForm(p => ({ ...p, catalyst: e.target.value }))}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Trade Thesis — why did you take this trade? (min 30 chars)" error={errors.thesis}>
                  <textarea
                    rows={4}
                    placeholder="Describe the setup, your entry reason, what you expect to happen, and your plan if it goes against you…"
                    value={form.thesis}
                    onChange={e => setForm(p => ({ ...p, thesis: e.target.value }))}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </Field>
              </div>

              {/* Exit section */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#5a6075" }}>
                  Exit Details (fill in when trade is closed)
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Field label="Status" error={errors.tradeStatus}>
                    <select value={form.tradeStatus} onChange={e => setForm(p => ({ ...p, tradeStatus: e.target.value as "open" | "closed" }))} style={inputStyle}>
                      {TRADE_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Exit Price ($)" error={errors.exitPrice}>
                    <input type="number" step="0.01" placeholder="0.00" value={form.exitPrice} onChange={e => setForm(p => ({ ...p, exitPrice: e.target.value }))} style={inputStyle} />
                  </Field>
                  <Field label="Result ($ P&L)" error={errors.result}>
                    <input type="number" step="0.01" placeholder="+50 or -25" value={form.result} onChange={e => setForm(p => ({ ...p, result: e.target.value }))} style={inputStyle} />
                  </Field>
                  <Field label="Exit Reason" error={errors.exitReason}>
                    <select value={form.exitReason} onChange={e => setForm(p => ({ ...p, exitReason: e.target.value }))} style={inputStyle}>
                      <option value="">Select…</option>
                      {EXIT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </Field>
                </div>
              </div>

              {/* Review */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#5a6075" }}>
                  Review & Lessons
                </p>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center cursor-pointer transition-all flex-shrink-0"
                    onClick={() => setForm(p => ({ ...p, followedPlan: !p.followedPlan }))}
                    style={{
                      background: form.followedPlan ? "#10b981" : "transparent",
                      border: `2px solid ${form.followedPlan ? "#10b981" : "#2a3048"}`,
                    }}
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
                  <Field label="Lesson Learned" error={errors.lessonLearned}>
                    <input
                      type="text"
                      placeholder="What would you do differently?"
                      value={form.lessonLearned}
                      onChange={e => setForm(p => ({ ...p, lessonLearned: e.target.value }))}
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Notes" error={errors.notes}>
                    <input
                      type="text"
                      placeholder="Any other context or observations"
                      value={form.notes}
                      onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                      style={inputStyle}
                    />
                  </Field>
                </div>
              </div>

              <button
                type="submit"
                disabled={!allPretradeChecked}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
                style={{
                  background: allPretradeChecked
                    ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                    : "#141720",
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
          <h2 className="text-sm font-semibold" style={{ color: "#e8eaf0" }}>
            Trade History ({logs.length} trades)
          </h2>
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
                    {["Date", "Ticker", "Dir", "Setup", "Catalyst", "Entry", "Stop", "T1", "R:R", "Status", "Exit $", "Result", "Exit Reason", "Plan"].map(h => (
                      <th key={h} className="px-3 py-3 text-left font-medium whitespace-nowrap" style={{ color: "#5a6075" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayedLogs.map((log: TradeLog) => {
                    const rr = (() => {
                      const e = parseFloat(log.entry);
                      const s = parseFloat(log.stop);
                      const t = parseFloat(log.target1);
                      if (!e || !s || !t || e === s) return "—";
                      return `1:${(Math.abs(t - e) / Math.abs(e - s)).toFixed(1)}`;
                    })();
                    const resultNum = parseFloat(log.result);
                    const statusLabel = log.tradeStatus ?? (log.result ? "closed" : "open");
                    return (
                      <tr key={log.id} style={{ borderBottom: "1px solid #1e2433" }}>
                        <td className="px-3 py-3 whitespace-nowrap" style={{ color: "#9aa0b4" }}>{log.date}</td>
                        <td className="px-3 py-3 font-bold" style={{ color: "#e8eaf0" }}>{log.ticker}</td>
                        <td className="px-3 py-3">
                          {log.direction ? (
                            <span
                              className="px-1.5 py-0.5 rounded font-semibold"
                              style={{
                                background: log.direction === "Long" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                                color: log.direction === "Long" ? "#10b981" : "#ef4444",
                              }}
                            >
                              {log.direction}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap" style={{ color: "#9aa0b4" }}>{log.setupType}</td>
                        <td className="px-3 py-3 max-w-[120px] truncate" style={{ color: "#9aa0b4" }} title={log.catalyst}>{log.catalyst || "—"}</td>
                        <td className="px-3 py-3" style={{ color: "#9aa0b4" }}>${log.entry}</td>
                        <td className="px-3 py-3" style={{ color: "#ef4444" }}>${log.stop}</td>
                        <td className="px-3 py-3" style={{ color: "#10b981" }}>${log.target1}</td>
                        <td className="px-3 py-3" style={{ color: "#00d4ff" }}>{rr}</td>
                        <td className="px-3 py-3">
                          <span
                            className="px-1.5 py-0.5 rounded"
                            style={{
                              background: statusLabel === "open" ? "rgba(245,158,11,0.1)" : "rgba(90,96,117,0.15)",
                              color: statusLabel === "open" ? "#f59e0b" : "#9aa0b4",
                            }}
                          >
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-3 py-3" style={{ color: "#9aa0b4" }}>{log.exitPrice ? `$${log.exitPrice}` : "—"}</td>
                        <td
                          className="px-3 py-3 font-semibold"
                          style={{ color: resultNum > 0 ? "#10b981" : resultNum < 0 ? "#ef4444" : "#9aa0b4" }}
                        >
                          {log.result ? `$${log.result}` : "—"}
                        </td>
                        <td className="px-3 py-3 max-w-[100px] truncate" style={{ color: "#9aa0b4" }} title={log.exitReason}>{log.exitReason || "—"}</td>
                        <td className="px-3 py-3" style={{ color: log.followedPlan ? "#10b981" : "#ef4444" }}>
                          {log.followedPlan ? "✓" : "✗"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div
            className="rounded-2xl p-10 text-center"
            style={{ background: "#0f1117", border: "1px solid #1e2433" }}
          >
            <div className="text-4xl mb-3">📊</div>
            <p className="font-semibold mb-1" style={{ color: "#e8eaf0" }}>No trades logged yet</p>
            <p className="text-sm" style={{ color: "#9aa0b4" }}>
              Log your first paper trade above to start building your edge log.
            </p>
          </div>
        )}

        <p className="text-center text-xs mt-6" style={{ color: "#5a6075" }}>
          Trade data is stored locally in your browser · Paper trades only · Not financial advice
        </p>
      </div>
    </div>
  );
}

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

function Field({
  label, error, children, className,
}: {
  label: string; error?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium mb-1.5" style={{ color: "#9aa0b4" }}>{label}</label>
      {children}
      {error && <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{error}</p>}
    </div>
  );
}

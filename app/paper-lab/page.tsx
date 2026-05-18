"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { loadProgress, addTradeLog, type TradeLog, type AppProgress } from "@/lib/progress";

const SETUP_TYPES = [
  "Breakout", "Pullback", "Bull Flag", "Trend Continuation",
  "Failed Breakout", "News Catalyst", "TLT/Rates Trade", "Energy/Oil Trade", "Other",
];

const DIRECTIONS = ["Long", "Short"];

const EXIT_REASONS = [
  "Hit Target 1", "Hit Target 2", "Stopped Out", "Manual Exit — Plan Changed",
  "Manual Exit — News", "Trailing Stop", "End of Day", "Other",
];

const emptyForm = {
  date: new Date().toISOString().split("T")[0],
  ticker: "",
  direction: "",
  setupType: "",
  entry: "",
  stop: "",
  target1: "",
  target2: "",
  result: "",
  exitReason: "",
  thesis: "",
  followedPlan: true,
  notes: "",
};

export default function PaperLab() {
  const [progress, setProgress] = useState<AppProgress | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

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
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    addTradeLog(form);
    setSubmitted(true);
    setProgress(loadProgress());
    setForm({ ...emptyForm, date: new Date().toISOString().split("T")[0] });
    setErrors({});
    setTimeout(() => setSubmitted(false), 3000);
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
  const positiveCount = logs.filter(l => parseFloat(l.result) > 0).length;
  const winRate = logs.filter(l => l.result).length > 0
    ? Math.round((positiveCount / logs.filter(l => l.result).length) * 100)
    : 0;

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
            Log every simulated trade. Write your thesis first. Review what you learn.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total Trades", value: logs.length, color: "#00d4ff" },
            { label: "Profitable", value: positiveCount, color: "#10b981" },
            { label: "Win Rate", value: logs.filter(l => l.result).length > 0 ? `${winRate}%` : "—", color: "#f59e0b" },
            {
              label: "Plan Followed",
              value: logs.length > 0 ? `${Math.round((logs.filter(l => l.followedPlan).length / logs.length) * 100)}%` : "—",
              color: "#8b5cf6",
            },
          ].map(s => (
            <div
              key={s.label}
              className="rounded-xl p-4 text-center"
              style={{ background: "#0f1117", border: "1px solid #1e2433" }}
            >
              <div className="text-2xl font-bold mb-1" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs" style={{ color: "#5a6075" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div
          className="rounded-xl p-4 mb-8 flex gap-3 items-start"
          style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)" }}
        >
          <span className="text-base flex-shrink-0">⚠️</span>
          <p className="text-xs leading-relaxed" style={{ color: "#9aa0b4" }}>
            <strong style={{ color: "#f59e0b" }}>Paper trading only.</strong> Log simulated trades here before risking real capital. Aim for at least 30 consistent paper trades before going live. Consistency in paper trading is the foundation of real edge.
          </p>
        </div>

        {/* Log Form */}
        <div className="rounded-2xl p-6 mb-8" style={{ background: "#0f1117", border: "1px solid #1e2433" }}>
          <h2 className="text-base font-semibold mb-5" style={{ color: "#e8eaf0" }}>Log a Paper Trade</h2>

          {submitted && (
            <div
              className="mb-4 p-3 rounded-lg text-sm text-center font-medium"
              style={{ background: "rgba(16,185,129,0.08)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}
            >
              ✓ Trade logged successfully
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Row 1: Date, Ticker, Direction, Setup */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Field label="Date" error={errors.date}>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                  style={inputStyle}
                />
              </Field>
              <Field label="Ticker" error={errors.ticker}>
                <input
                  type="text"
                  placeholder="NVDA"
                  value={form.ticker}
                  onChange={e => setForm(p => ({ ...p, ticker: e.target.value.toUpperCase() }))}
                  style={inputStyle}
                />
              </Field>
              <Field label="Direction" error={errors.direction}>
                <select
                  value={form.direction}
                  onChange={e => setForm(p => ({ ...p, direction: e.target.value }))}
                  style={inputStyle}
                >
                  <option value="">Select...</option>
                  {DIRECTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </Field>
              <Field label="Setup Type" error={errors.setupType}>
                <select
                  value={form.setupType}
                  onChange={e => setForm(p => ({ ...p, setupType: e.target.value }))}
                  style={inputStyle}
                >
                  <option value="">Select...</option>
                  {SETUP_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </div>

            {/* Row 2: Entry, Stop, T1, T2 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Field label="Entry ($)" error={errors.entry}>
                <input
                  type="number" step="0.01" placeholder="0.00"
                  value={form.entry}
                  onChange={e => setForm(p => ({ ...p, entry: e.target.value }))}
                  style={inputStyle}
                />
              </Field>
              <Field label="Stop Loss ($)" error={errors.stop}>
                <input
                  type="number" step="0.01" placeholder="0.00"
                  value={form.stop}
                  onChange={e => setForm(p => ({ ...p, stop: e.target.value }))}
                  style={inputStyle}
                />
              </Field>
              <Field label="Target 1 ($)" error={errors.target1}>
                <input
                  type="number" step="0.01" placeholder="0.00"
                  value={form.target1}
                  onChange={e => setForm(p => ({ ...p, target1: e.target.value }))}
                  style={inputStyle}
                />
              </Field>
              <Field label="Target 2 ($)" error={errors.target2}>
                <input
                  type="number" step="0.01" placeholder="0.00"
                  value={form.target2}
                  onChange={e => setForm(p => ({ ...p, target2: e.target.value }))}
                  style={inputStyle}
                />
              </Field>
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
                <span className="text-xs" style={{ color: "#9aa0b4" }}>Calculated R:R</span>
                <span className="font-bold" style={{ color: parseFloat(riskReward) >= 2 ? "#10b981" : "#f59e0b" }}>
                  1:{riskReward}
                </span>
                {parseFloat(riskReward) < 2 && (
                  <span className="text-xs" style={{ color: "#f59e0b" }}>⚠ Below recommended 1:2 minimum</span>
                )}
              </div>
            )}

            {/* Row 3: Result, Exit Reason */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Result ($ P&L)" error={errors.result}>
                <input
                  type="number" step="0.01" placeholder="+50.00 or -25.00"
                  value={form.result}
                  onChange={e => setForm(p => ({ ...p, result: e.target.value }))}
                  style={inputStyle}
                />
              </Field>
              <Field label="Exit Reason" error={errors.exitReason}>
                <select
                  value={form.exitReason}
                  onChange={e => setForm(p => ({ ...p, exitReason: e.target.value }))}
                  style={inputStyle}
                >
                  <option value="">Select reason (optional)...</option>
                  {EXIT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
            </div>

            {/* Thesis */}
            <Field label="Trade Thesis (why did you take this trade?)" error={errors.thesis}>
              <textarea
                rows={4}
                placeholder="Describe the setup, your entry reason, what you expected, and what happened..."
                value={form.thesis}
                onChange={e => setForm(p => ({ ...p, thesis: e.target.value }))}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </Field>

            {/* Followed plan checkbox */}
            <div className="flex items-center gap-3">
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

            {/* Notes */}
            <Field label="Notes / Lessons Learned" error={errors.notes}>
              <input
                type="text"
                placeholder="What would you do differently?"
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                style={inputStyle}
              />
            </Field>

            <button
              type="submit"
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
              style={{
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                color: "#0a0b0d",
                boxShadow: "0 0 20px rgba(245,158,11,0.25)",
              }}
            >
              Log Trade
            </button>
          </form>
        </div>

        {/* Trade History Table */}
        {logs.length > 0 && (
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #1e2433" }}>
            <div className="px-5 py-4" style={{ background: "#0f1117", borderBottom: "1px solid #1e2433" }}>
              <h2 className="font-semibold text-sm" style={{ color: "#e8eaf0" }}>
                Trade History ({logs.length} trades)
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: "#0a0b0d" }}>
                    {["Date", "Ticker", "Dir", "Setup", "Entry", "Stop", "T1", "R:R", "Exit", "Result", "Plan"].map(h => (
                      <th key={h} className="px-3 py-3 text-left font-medium" style={{ color: "#5a6075" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log: TradeLog) => {
                    const rr = (() => {
                      const e = parseFloat(log.entry);
                      const s = parseFloat(log.stop);
                      const t = parseFloat(log.target1);
                      if (!e || !s || !t || e === s) return "—";
                      return `1:${(Math.abs(t - e) / Math.abs(e - s)).toFixed(1)}`;
                    })();
                    const resultNum = parseFloat(log.result);
                    return (
                      <tr key={log.id} style={{ borderBottom: "1px solid #1e2433" }}>
                        <td className="px-3 py-3" style={{ color: "#9aa0b4" }}>{log.date}</td>
                        <td className="px-3 py-3 font-bold" style={{ color: "#e8eaf0" }}>{log.ticker}</td>
                        <td className="px-3 py-3">
                          {log.direction ? (
                            <span
                              className="px-1.5 py-0.5 rounded text-xs font-semibold"
                              style={{
                                background: log.direction === "Long" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                                color: log.direction === "Long" ? "#10b981" : "#ef4444",
                              }}
                            >
                              {log.direction}
                            </span>
                          ) : (
                            <span style={{ color: "#5a6075" }}>—</span>
                          )}
                        </td>
                        <td className="px-3 py-3" style={{ color: "#9aa0b4" }}>{log.setupType}</td>
                        <td className="px-3 py-3" style={{ color: "#9aa0b4" }}>${log.entry}</td>
                        <td className="px-3 py-3" style={{ color: "#ef4444" }}>${log.stop}</td>
                        <td className="px-3 py-3" style={{ color: "#10b981" }}>${log.target1}</td>
                        <td className="px-3 py-3" style={{ color: "#00d4ff" }}>{rr}</td>
                        <td className="px-3 py-3" style={{ color: "#9aa0b4" }}>
                          {log.exitReason ?? "—"}
                        </td>
                        <td
                          className="px-3 py-3 font-semibold"
                          style={{ color: resultNum > 0 ? "#10b981" : resultNum < 0 ? "#ef4444" : "#9aa0b4" }}
                        >
                          {log.result ? `$${log.result}` : "—"}
                        </td>
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
        )}

        {logs.length === 0 && (
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
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium mb-1.5" style={{ color: "#9aa0b4" }}>{label}</label>
      {children}
      {error && <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{error}</p>}
    </div>
  );
}

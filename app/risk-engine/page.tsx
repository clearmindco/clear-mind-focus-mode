"use client";

import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";

// ─── Formatting Helpers ───────────────────────────────────────────────────────

const fmt = (v: number | null, dec = 2): string =>
  v == null ? "—" : v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });

const fmtPct = (v: number | null): string =>
  v == null ? "—" : `${v.toFixed(2)}%`;

// ─── Types ────────────────────────────────────────────────────────────────────

type Direction = "LONG" | "SHORT";
type RiskPreset = "0.5" | "1" | "2" | "custom";

interface ComparisonSetup {
  id: number;
  ticker: string;
  direction: Direction;
  entry: number;
  stop: number;
  target1: number;
  shares: number;
  dollarRisk: number;
  exposure: number;
  exposurePct: number;
  rr: number;
  grade: string;
}

// ─── Grade Logic ─────────────────────────────────────────────────────────────

function calcGrade(rr: number, exposurePct: number, stopPct: number): string {
  if (rr >= 3 && exposurePct < 20 && stopPct < 3) return "A+";
  if (rr >= 2.5 && exposurePct < 25) return "A";
  if (rr >= 2) return "B";
  if (rr >= 1.5) return "C";
  return "F";
}

function gradeColor(grade: string): string {
  if (grade === "A+" || grade === "A") return "#10b981";
  if (grade === "B") return "#00d4ff";
  if (grade === "C") return "#f59e0b";
  return "#ef4444";
}

// ─── R:R Color ───────────────────────────────────────────────────────────────

function rrColor(rr: number | null): string {
  if (rr == null) return "#9aa0b4";
  if (rr >= 3) return "#10b981";
  if (rr >= 2) return "#00d4ff";
  if (rr >= 1.5) return "#f59e0b";
  return "#ef4444";
}

// ─── Metric Card ─────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  valueColor,
}: {
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "#141720", border: "1px solid #1e2433" }}
    >
      <p className="text-xs mb-1" style={{ color: "#5a6075" }}>
        {label}
      </p>
      <p
        className="text-xl font-bold"
        style={{ color: valueColor ?? "#e8eaf0" }}
      >
        {value}
      </p>
      {sub && (
        <p className="text-xs mt-0.5" style={{ color: "#9aa0b4" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

// ─── Warning Row ─────────────────────────────────────────────────────────────

function WarningRow({
  level,
  text,
}: {
  level: "red" | "amber";
  text: string;
}) {
  const color = level === "red" ? "#ef4444" : "#f59e0b";
  const bg =
    level === "red"
      ? "rgba(239,68,68,0.08)"
      : "rgba(245,158,11,0.08)";
  const border =
    level === "red"
      ? "rgba(239,68,68,0.2)"
      : "rgba(245,158,11,0.2)";
  const icon = level === "red" ? "🔴" : "🟡";
  return (
    <div
      className="flex gap-3 items-start rounded-xl px-4 py-3 text-xs"
      style={{ background: bg, border: `1px solid ${border}`, color }}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RiskEnginePage() {
  // ── Account Setup ──
  const [accountSize, setAccountSize] = useState<number>(10000);
  const [riskPreset, setRiskPreset] = useState<RiskPreset>("1");
  const [customRiskPct, setCustomRiskPct] = useState<number>(1.5);

  // ── Trade Setup ──
  const [ticker, setTicker] = useState<string>("");
  const [entry, setEntry] = useState<string>("");
  const [stopLoss, setStopLoss] = useState<string>("");
  const [target1, setTarget1] = useState<string>("");
  const [target2, setTarget2] = useState<string>("");
  const [direction, setDirection] = useState<Direction>("LONG");

  // ── Comparison ──
  const [comparisons, setComparisons] = useState<ComparisonSetup[]>([]);
  const [compCounter, setCompCounter] = useState<number>(1);

  // ── Behavioral Checklist ──
  const [checks, setChecks] = useState<boolean[]>(Array(8).fill(false));

  // ── Formula Reference ──
  const [formulaOpen, setFormulaOpen] = useState<boolean>(false);

  // ─── Derived Values ───────────────────────────────────────────────────────

  const riskPct = useMemo<number>(() => {
    if (riskPreset === "0.5") return 0.5;
    if (riskPreset === "1") return 1;
    if (riskPreset === "2") return 2;
    return Math.max(0.1, Math.min(10, customRiskPct));
  }, [riskPreset, customRiskPct]);

  const maxRisk = useMemo<number>(() => {
    const acct = isNaN(accountSize) || accountSize <= 0 ? 0 : accountSize;
    return (acct * riskPct) / 100;
  }, [accountSize, riskPct]);

  const calc = useMemo(() => {
    const e = parseFloat(entry);
    const s = parseFloat(stopLoss);
    const t1 = parseFloat(target1);
    const t2 = parseFloat(target2);

    if (!isFinite(e) || !isFinite(s) || e <= 0 || s <= 0) return null;
    const stopDist = Math.abs(e - s);
    if (stopDist === 0) return null;

    const shares = Math.floor(maxRisk / stopDist);
    if (shares <= 0) return null;

    const dollarRisk = shares * stopDist;
    const maxExposure = shares * e;
    const exposurePct = accountSize > 0 ? (maxExposure / accountSize) * 100 : null;

    const rr1 = isFinite(t1) && t1 > 0 ? Math.abs(t1 - e) / stopDist : null;
    const rr2 =
      isFinite(t2) && t2 > 0 && parseFloat(target2) !== 0
        ? Math.abs(t2 - e) / stopDist
        : null;

    const stopDistPct = (stopDist / e) * 100;

    // T1 reward
    const t1Reward = rr1 != null ? rr1 * dollarRisk : null;

    return {
      shares,
      dollarRisk,
      maxExposure,
      exposurePct,
      rr1,
      rr2,
      stopDist,
      stopDistPct,
      t1Reward,
    };
  }, [entry, stopLoss, target1, target2, maxRisk, accountSize]);

  // ─── Dynamic Warnings ────────────────────────────────────────────────────

  const warnings = useMemo<{ level: "red" | "amber"; text: string }[]>(() => {
    if (!calc) return [];
    const w: { level: "red" | "amber"; text: string }[] = [];

    if (calc.exposurePct != null && calc.exposurePct > 25) {
      w.push({
        level: "red",
        text: "Position exceeds 25% of account — extreme concentration risk",
      });
    }
    if (calc.stopDistPct > 5) {
      w.push({
        level: "red",
        text: "Stop is more than 5% from entry — oversized risk for intraday",
      });
    }
    if (calc.rr1 != null && calc.rr1 < 1) {
      w.push({
        level: "red",
        text: "R:R below 1:1 — this setup loses money even at 50% win rate",
      });
    } else if (calc.rr1 != null && calc.rr1 < 2) {
      w.push({
        level: "amber",
        text: "R:R below 2:1 — professional standard requires minimum 2:1 before entry",
      });
    }
    if (calc.stopDistPct < 0.1) {
      w.push({
        level: "amber",
        text: "Stop very close to entry — may be triggered by normal noise",
      });
    }
    if (direction === "SHORT") {
      w.push({
        level: "amber",
        text: "Short selling has theoretically unlimited loss — use strict stops",
      });
    }
    return w;
  }, [calc, direction]);

  // ─── Add to Comparison ───────────────────────────────────────────────────

  function handleAddComparison() {
    if (!calc) return;
    if (comparisons.length >= 3) return;

    const e = parseFloat(entry);
    const s = parseFloat(stopLoss);
    const t1 = parseFloat(target1);
    const stopDist = Math.abs(e - s);
    const stopDistPct = (stopDist / e) * 100;

    const newSetup: ComparisonSetup = {
      id: compCounter,
      ticker: ticker.trim().toUpperCase() || "—",
      direction,
      entry: e,
      stop: s,
      target1: t1,
      shares: calc.shares,
      dollarRisk: calc.dollarRisk,
      exposure: calc.maxExposure,
      exposurePct: calc.exposurePct ?? 0,
      rr: calc.rr1 ?? 0,
      grade: calcGrade(calc.rr1 ?? 0, calc.exposurePct ?? 100, stopDistPct),
    };
    setComparisons((prev) => [...prev, newSetup]);
    setCompCounter((n) => n + 1);
  }

  function handleRemoveComparison(id: number) {
    setComparisons((prev) => prev.filter((c) => c.id !== id));
  }

  // ─── Checklist ───────────────────────────────────────────────────────────

  const CHECKLIST_ITEMS = [
    "I am not revenge trading (trying to recover losses)",
    "I am not FOMO chasing (price already moved without me)",
    "I am not oversizing because I \"feel sure\" about this",
    "I have identified my stop BEFORE entering, not after",
    "This trade fits a defined setup from my playbook",
    "I am not adding to a losing position",
    "I can afford to lose this entire amount and it won't affect my emotion",
    "My total open risk across all positions is under 5% of account",
  ];

  const checksPassedCount = checks.filter(Boolean).length;

  function toggleCheck(i: number) {
    setChecks((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: "#0a0b0d" }}>
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 pt-8 pb-24 space-y-6">

        {/* ── Section 1: Header ── */}
        <div>
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-3"
            style={{
              background: "rgba(239,68,68,0.1)",
              color: "#ef4444",
              border: "1px solid rgba(239,68,68,0.25)",
            }}
          >
            ⚠ EDUCATIONAL ONLY — NOT FINANCIAL ADVICE
          </div>
          <h1 className="text-3xl font-bold" style={{ color: "#e8eaf0" }}>
            ⚡ EDGE <span style={{ color: "#00d4ff" }}>Risk Engine</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: "#9aa0b4" }}>
            Institutional-grade position sizing for educational paper trading
          </p>
        </div>

        {/* ── Section 2: Account Setup ── */}
        <div
          className="rounded-2xl p-5"
          style={{ background: "#0f1117", border: "1px solid #1e2433" }}
        >
          <p
            className="text-xs font-bold uppercase tracking-wider mb-4"
            style={{ color: "#5a6075" }}
          >
            Your Account
          </p>

          <div className="grid sm:grid-cols-2 gap-5">
            {/* Portfolio size */}
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "#9aa0b4" }}
              >
                Paper Account Size ($)
              </label>
              <input
                type="number"
                value={accountSize}
                min={0}
                onChange={(e) =>
                  setAccountSize(parseFloat(e.target.value) || 0)
                }
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{
                  background: "#141720",
                  border: "1px solid #1e2433",
                  color: "#e8eaf0",
                }}
              />
            </div>

            {/* Risk % */}
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "#9aa0b4" }}
              >
                Risk Per Trade
              </label>
              <div className="flex gap-2 flex-wrap">
                {(["0.5", "1", "2", "custom"] as RiskPreset[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setRiskPreset(p)}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                    style={{
                      background:
                        riskPreset === p
                          ? "rgba(0,212,255,0.15)"
                          : "#141720",
                      color: riskPreset === p ? "#00d4ff" : "#9aa0b4",
                      border: `1px solid ${riskPreset === p ? "rgba(0,212,255,0.3)" : "#1e2433"}`,
                    }}
                  >
                    {p === "custom" ? "Custom" : `${p}%`}
                  </button>
                ))}
              </div>
              {riskPreset === "custom" && (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    value={customRiskPct}
                    min={0.1}
                    max={10}
                    step={0.1}
                    onChange={(e) =>
                      setCustomRiskPct(parseFloat(e.target.value) || 0.1)
                    }
                    className="w-24 px-3 py-1.5 rounded-lg text-xs outline-none"
                    style={{
                      background: "#141720",
                      border: "1px solid #1e2433",
                      color: "#e8eaf0",
                    }}
                  />
                  <span className="text-xs" style={{ color: "#9aa0b4" }}>
                    % (0.1–10)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Max risk display */}
          <div
            className="mt-4 rounded-xl px-4 py-3 flex items-center justify-between"
            style={{ background: "#141720", border: "1px solid #1e2433" }}
          >
            <span className="text-xs" style={{ color: "#9aa0b4" }}>
              Max risk per trade ({fmtPct(riskPct)})
            </span>
            <span className="text-base font-bold" style={{ color: "#00d4ff" }}>
              ${fmt(maxRisk)}
            </span>
          </div>

          {/* High-risk warning */}
          {riskPct > 2 && (
            <div
              className="mt-3 rounded-xl px-4 py-3 text-xs"
              style={{
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.2)",
                color: "#f59e0b",
              }}
            >
              ⚠ Risk above 2% per trade increases account blow-up probability
              significantly
            </div>
          )}
        </div>

        {/* ── Section 3: Trade Setup ── */}
        <div
          className="rounded-2xl p-5"
          style={{ background: "#0f1117", border: "1px solid #1e2433" }}
        >
          <p
            className="text-xs font-bold uppercase tracking-wider mb-4"
            style={{ color: "#5a6075" }}
          >
            Trade Setup
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Ticker */}
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "#9aa0b4" }}
              >
                Ticker
              </label>
              <input
                type="text"
                value={ticker}
                placeholder="e.g. SPY"
                maxLength={8}
                onChange={(e) =>
                  setTicker(e.target.value.toUpperCase())
                }
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{
                  background: "#141720",
                  border: "1px solid #1e2433",
                  color: "#e8eaf0",
                }}
              />
            </div>

            {/* Direction */}
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "#9aa0b4" }}
              >
                Direction
              </label>
              <div className="flex gap-2">
                {(["LONG", "SHORT"] as Direction[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDirection(d)}
                    className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
                    style={{
                      background:
                        direction === d
                          ? d === "LONG"
                            ? "rgba(16,185,129,0.15)"
                            : "rgba(239,68,68,0.15)"
                          : "#141720",
                      color:
                        direction === d
                          ? d === "LONG"
                            ? "#10b981"
                            : "#ef4444"
                          : "#9aa0b4",
                      border: `1px solid ${
                        direction === d
                          ? d === "LONG"
                            ? "rgba(16,185,129,0.35)"
                            : "rgba(239,68,68,0.35)"
                          : "#1e2433"
                      }`,
                    }}
                  >
                    {d === "LONG" ? "▲ LONG" : "▼ SHORT"}
                  </button>
                ))}
              </div>
            </div>

            {/* Entry */}
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "#9aa0b4" }}
              >
                Entry Price ($)
              </label>
              <input
                type="number"
                value={entry}
                placeholder="e.g. 450.00"
                min={0}
                step={0.01}
                onChange={(e) => setEntry(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{
                  background: "#141720",
                  border: "1px solid #1e2433",
                  color: "#e8eaf0",
                }}
              />
            </div>

            {/* Stop Loss */}
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "#9aa0b4" }}
              >
                Stop Loss ($)
              </label>
              <input
                type="number"
                value={stopLoss}
                placeholder="e.g. 447.50"
                min={0}
                step={0.01}
                onChange={(e) => setStopLoss(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{
                  background: "#141720",
                  border: "1px solid #1e2433",
                  color: "#e8eaf0",
                }}
              />
            </div>

            {/* Target 1 */}
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "#9aa0b4" }}
              >
                Target 1 ($)
              </label>
              <input
                type="number"
                value={target1}
                placeholder="e.g. 453.00"
                min={0}
                step={0.01}
                onChange={(e) => setTarget1(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{
                  background: "#141720",
                  border: "1px solid #1e2433",
                  color: "#e8eaf0",
                }}
              />
            </div>

            {/* Target 2 */}
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "#9aa0b4" }}
              >
                Target 2 ($){" "}
                <span style={{ color: "#5a6075", fontWeight: 400 }}>
                  — optional
                </span>
              </label>
              <input
                type="number"
                value={target2}
                placeholder="e.g. 455.00"
                min={0}
                step={0.01}
                onChange={(e) => setTarget2(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{
                  background: "#141720",
                  border: "1px solid #1e2433",
                  color: "#e8eaf0",
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Section 4: Outputs ── */}
        {calc ? (
          <div
            className="rounded-2xl p-5"
            style={{ background: "#0f1117", border: "1px solid #1e2433" }}
          >
            <p
              className="text-xs font-bold uppercase tracking-wider mb-4"
              style={{ color: "#5a6075" }}
            >
              Calculated Output
            </p>

            {/* 2-col metric grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Row 1 */}
              <MetricCard
                label="Position Size"
                value={`${calc.shares.toLocaleString()} shares`}
                sub={`Rounded down to whole shares`}
                valueColor="#00d4ff"
              />
              <MetricCard
                label="Dollar Risk"
                value={`$${fmt(calc.dollarRisk)}`}
                sub={`${calc.shares} × $${fmt(calc.stopDist)} stop dist`}
                valueColor="#ef4444"
              />

              {/* Row 2 */}
              <MetricCard
                label="Max Exposure"
                value={`$${fmt(calc.maxExposure)}`}
                sub={
                  calc.exposurePct != null
                    ? `${fmtPct(calc.exposurePct)} of account`
                    : undefined
                }
                valueColor={
                  calc.exposurePct != null && calc.exposurePct > 25
                    ? "#ef4444"
                    : "#e8eaf0"
                }
              />
              <MetricCard
                label="Risk/Reward (T1)"
                value={
                  calc.rr1 != null ? `${calc.rr1.toFixed(2)}:1` : "—"
                }
                sub={
                  calc.t1Reward != null
                    ? `Potential gain: $${fmt(calc.t1Reward)}`
                    : undefined
                }
                valueColor={rrColor(calc.rr1)}
              />

              {/* Row 3 */}
              {calc.rr2 != null && (
                <MetricCard
                  label="R:R to T2"
                  value={`${calc.rr2.toFixed(2)}:1`}
                  valueColor={rrColor(calc.rr2)}
                />
              )}
              <MetricCard
                label="Stop Distance"
                value={`$${fmt(calc.stopDist)}`}
                sub={`${fmtPct(calc.stopDistPct)} from entry`}
                valueColor={calc.stopDistPct > 5 ? "#ef4444" : "#e8eaf0"}
              />
            </div>

            {/* Trade Summary Box */}
            <div
              className="rounded-xl px-4 py-3 text-xs"
              style={{
                background: "rgba(0,212,255,0.05)",
                border: "1px solid rgba(0,212,255,0.15)",
                color: "#9aa0b4",
                lineHeight: 1.7,
              }}
            >
              <span style={{ color: "#5a6075" }}>Trade Summary: </span>
              <span style={{ color: direction === "LONG" ? "#10b981" : "#ef4444", fontWeight: 700 }}>
                {direction}
              </span>{" "}
              <span style={{ color: "#e8eaf0", fontWeight: 600 }}>
                {ticker.trim().toUpperCase() || "—"}
              </span>{" "}
              at{" "}
              <span style={{ color: "#00d4ff" }}>
                ${fmt(parseFloat(entry) || null)}
              </span>
              , stop at{" "}
              <span style={{ color: "#ef4444" }}>
                ${fmt(parseFloat(stopLoss) || null)}
              </span>{" "}
              → risk{" "}
              <span style={{ color: "#ef4444" }}>${fmt(calc.dollarRisk)}</span>{" "}
              for{" "}
              <span style={{ color: "#10b981" }}>
                {calc.t1Reward != null ? `$${fmt(calc.t1Reward)} gain` : "— gain"}
              </span>{" "}
              (R:R{" "}
              <span style={{ color: rrColor(calc.rr1), fontWeight: 700 }}>
                {calc.rr1 != null ? `${calc.rr1.toFixed(2)}:1` : "—"}
              </span>
              )
            </div>

            {/* Add to Comparison button */}
            <button
              onClick={handleAddComparison}
              disabled={comparisons.length >= 3}
              className="mt-4 w-full py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{
                background:
                  comparisons.length >= 3
                    ? "rgba(90,96,117,0.1)"
                    : "rgba(139,92,246,0.12)",
                color:
                  comparisons.length >= 3 ? "#5a6075" : "#8b5cf6",
                border: `1px solid ${comparisons.length >= 3 ? "#1e2433" : "rgba(139,92,246,0.3)"}`,
                cursor: comparisons.length >= 3 ? "not-allowed" : "pointer",
              }}
            >
              {comparisons.length >= 3
                ? "Comparison table full (max 3)"
                : "＋ Add to Comparison"}
            </button>
          </div>
        ) : (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: "#0f1117", border: "1px solid #1e2433" }}
          >
            <p className="text-sm" style={{ color: "#5a6075" }}>
              Enter entry and stop loss prices above to see live calculations
            </p>
          </div>
        )}

        {/* ── Section 5: Risk Warnings ── */}
        {warnings.length > 0 && (
          <div
            className="rounded-2xl p-5"
            style={{ background: "#0f1117", border: "1px solid #1e2433" }}
          >
            <p
              className="text-xs font-bold uppercase tracking-wider mb-3"
              style={{ color: "#5a6075" }}
            >
              Risk Warnings
            </p>
            <div className="space-y-2">
              {warnings.map((w, i) => (
                <WarningRow key={i} level={w.level} text={w.text} />
              ))}
            </div>
          </div>
        )}

        {/* ── Section 6: Comparison Table ── */}
        <div
          className="rounded-2xl p-5"
          style={{ background: "#0f1117", border: "1px solid #1e2433" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: "#5a6075" }}
              >
                Multi-Setup Comparison
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#5a6075" }}>
                Compare up to 3 setups side by side
              </p>
            </div>
            {comparisons.length > 0 && (
              <button
                onClick={() => setComparisons([])}
                className="text-xs px-3 py-1.5 rounded-lg"
                style={{
                  background: "#141720",
                  color: "#5a6075",
                  border: "1px solid #1e2433",
                }}
              >
                Clear all
              </button>
            )}
          </div>

          {comparisons.length === 0 ? (
            <p className="text-xs text-center py-6" style={{ color: "#5a6075" }}>
              No setups added yet — configure a trade above and click "Add to Comparison"
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
                <thead>
                  <tr style={{ color: "#5a6075" }}>
                    {["Setup", "Ticker", "Dir", "Entry", "Stop", "T1", "Shares", "Risk $", "Exposure", "R:R", "Grade", ""].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left pb-2 pr-3 font-medium"
                          style={{ borderBottom: "1px solid #1e2433" }}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {comparisons.map((c) => (
                    <tr key={c.id} style={{ color: "#e8eaf0" }}>
                      <td className="py-2 pr-3" style={{ color: "#9aa0b4" }}>
                        #{c.id}
                      </td>
                      <td className="py-2 pr-3 font-bold" style={{ color: "#00d4ff" }}>
                        {c.ticker}
                      </td>
                      <td
                        className="py-2 pr-3 font-bold"
                        style={{
                          color:
                            c.direction === "LONG" ? "#10b981" : "#ef4444",
                        }}
                      >
                        {c.direction}
                      </td>
                      <td className="py-2 pr-3">${fmt(c.entry)}</td>
                      <td className="py-2 pr-3" style={{ color: "#ef4444" }}>
                        ${fmt(c.stop)}
                      </td>
                      <td className="py-2 pr-3" style={{ color: "#10b981" }}>
                        ${fmt(c.target1)}
                      </td>
                      <td className="py-2 pr-3">{c.shares.toLocaleString()}</td>
                      <td className="py-2 pr-3" style={{ color: "#ef4444" }}>
                        ${fmt(c.dollarRisk)}
                      </td>
                      <td className="py-2 pr-3">
                        ${fmt(c.exposure, 0)}{" "}
                        <span style={{ color: "#9aa0b4" }}>
                          ({fmtPct(c.exposurePct)})
                        </span>
                      </td>
                      <td
                        className="py-2 pr-3 font-bold"
                        style={{ color: rrColor(c.rr) }}
                      >
                        {c.rr.toFixed(2)}:1
                      </td>
                      <td className="py-2 pr-3">
                        <span
                          className="px-2 py-0.5 rounded-md font-bold"
                          style={{
                            background: `${gradeColor(c.grade)}18`,
                            color: gradeColor(c.grade),
                            border: `1px solid ${gradeColor(c.grade)}40`,
                          }}
                        >
                          {c.grade}
                        </span>
                      </td>
                      <td className="py-2">
                        <button
                          onClick={() => handleRemoveComparison(c.id)}
                          className="text-xs px-2 py-0.5 rounded"
                          style={{ color: "#5a6075", background: "#141720" }}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Grade key */}
          <div
            className="mt-4 rounded-xl px-4 py-3 text-xs"
            style={{ background: "#141720", border: "1px solid #1e2433" }}
          >
            <p
              className="font-bold mb-1.5"
              style={{ color: "#5a6075" }}
            >
              Grade Key
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                { grade: "A+", desc: "R:R ≥ 3 + exp <20% + stop <3%" },
                { grade: "A", desc: "R:R ≥ 2.5 + exp <25%" },
                { grade: "B", desc: "R:R ≥ 2" },
                { grade: "C", desc: "R:R ≥ 1.5" },
                { grade: "F", desc: "R:R < 1.5" },
              ].map(({ grade, desc }) => (
                <div key={grade} className="flex items-center gap-1.5">
                  <span
                    className="px-1.5 py-0.5 rounded font-bold text-xs"
                    style={{
                      background: `${gradeColor(grade)}18`,
                      color: gradeColor(grade),
                    }}
                  >
                    {grade}
                  </span>
                  <span style={{ color: "#9aa0b4" }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Section 7: Behavioral Risk Checklist ── */}
        <div
          className="rounded-2xl p-5"
          style={{ background: "#0f1117", border: "1px solid #1e2433" }}
        >
          <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
            <div>
              <p
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: "#5a6075" }}
              >
                Behavioral Risk Checklist
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#5a6075" }}>
                Self-accountability before every trade
              </p>
            </div>
            <div
              className="text-xs px-3 py-1.5 rounded-full font-bold"
              style={{
                background:
                  checksPassedCount >= 6
                    ? "rgba(16,185,129,0.12)"
                    : checksPassedCount >= 4
                    ? "rgba(245,158,11,0.1)"
                    : "rgba(239,68,68,0.1)",
                color:
                  checksPassedCount >= 6
                    ? "#10b981"
                    : checksPassedCount >= 4
                    ? "#f59e0b"
                    : "#ef4444",
                border: `1px solid ${
                  checksPassedCount >= 6
                    ? "rgba(16,185,129,0.25)"
                    : checksPassedCount >= 4
                    ? "rgba(245,158,11,0.25)"
                    : "rgba(239,68,68,0.25)"
                }`,
              }}
            >
              {checksPassedCount} of 8 checks passed
            </div>
          </div>

          <div className="space-y-2">
            {CHECKLIST_ITEMS.map((item, i) => (
              <button
                key={i}
                onClick={() => toggleCheck(i)}
                className="w-full flex items-start gap-3 px-4 py-3 rounded-xl text-left transition-all"
                style={{
                  background: checks[i] ? "rgba(16,185,129,0.07)" : "#141720",
                  border: `1px solid ${checks[i] ? "rgba(16,185,129,0.2)" : "#1e2433"}`,
                }}
              >
                <div
                  className="w-4 h-4 rounded flex-shrink-0 mt-0.5 flex items-center justify-center"
                  style={{
                    background: checks[i]
                      ? "#10b981"
                      : "transparent",
                    border: `2px solid ${checks[i] ? "#10b981" : "#2a3048"}`,
                    transition: "all 0.15s",
                  }}
                >
                  {checks[i] && (
                    <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                      <path
                        d="M1 3L3 5L7 1"
                        stroke="#0a0b0d"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <span
                  className="text-xs"
                  style={{ color: checks[i] ? "#10b981" : "#9aa0b4" }}
                >
                  {item}
                </span>
              </button>
            ))}
          </div>

          {/* Checklist result banners */}
          {checksPassedCount < 4 && (
            <div
              className="mt-4 rounded-xl px-4 py-3 text-xs font-bold"
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.25)",
                color: "#ef4444",
              }}
            >
              🔴 HIGH RISK BEHAVIOR DETECTED — Consider stepping away
            </div>
          )}
          {checksPassedCount >= 4 && checksPassedCount < 6 && (
            <div
              className="mt-4 rounded-xl px-4 py-3 text-xs"
              style={{
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.2)",
                color: "#f59e0b",
              }}
            >
              🟡 Consider waiting for better conditions
            </div>
          )}
          {checksPassedCount >= 6 && (
            <div
              className="mt-4 rounded-xl px-4 py-3 text-xs"
              style={{
                background: "rgba(16,185,129,0.07)",
                border: "1px solid rgba(16,185,129,0.2)",
                color: "#10b981",
              }}
            >
              Behavioral conditions look good — trade mindfully
            </div>
          )}
        </div>

        {/* ── Section 8: Formula Reference ── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid #1e2433" }}
        >
          <button
            onClick={() => setFormulaOpen((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4"
            style={{ background: "#0f1117" }}
          >
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: "#5a6075" }}
            >
              📐 Position Sizing Formula Reference
            </span>
            <span className="text-xs" style={{ color: "#5a6075" }}>
              {formulaOpen ? "▲ Collapse" : "▼ Expand"}
            </span>
          </button>

          {formulaOpen && (
            <div
              className="px-5 pb-5 space-y-5"
              style={{ background: "#0f1117" }}
            >
              {/* Core formula */}
              <div
                className="rounded-xl p-4"
                style={{ background: "#141720", border: "1px solid #1e2433" }}
              >
                <p
                  className="text-xs font-bold mb-3"
                  style={{ color: "#00d4ff" }}
                >
                  Core Formula
                </p>
                <div
                  className="rounded-lg px-4 py-3 font-mono text-sm text-center"
                  style={{
                    background: "#0a0b0d",
                    color: "#e8eaf0",
                    border: "1px solid #1e2433",
                  }}
                >
                  Position Size = (Account × Risk%) ÷ Stop Distance
                </div>
                <p className="text-xs mt-2" style={{ color: "#9aa0b4" }}>
                  Where <em>Stop Distance</em> = |Entry Price − Stop Loss Price|
                </p>
              </div>

              {/* Example */}
              <div
                className="rounded-xl p-4"
                style={{ background: "#141720", border: "1px solid #1e2433" }}
              >
                <p
                  className="text-xs font-bold mb-3"
                  style={{ color: "#8b5cf6" }}
                >
                  Example Walkthrough
                </p>
                <div className="space-y-1.5 text-xs" style={{ color: "#9aa0b4" }}>
                  <p>Account: $25,000 · Risk: 1% · Max risk = $250</p>
                  <p>Entry: $450.00 · Stop: $447.50</p>
                  <p>Stop distance = $450.00 − $447.50 = $2.50</p>
                  <p style={{ color: "#00d4ff", fontWeight: 600 }}>
                    Position size = $250 ÷ $2.50 = 100 shares
                  </p>
                  <p>
                    Exposure = 100 × $450 = $45,000 (180% of account — this
                    shows why leverage matters!)
                  </p>
                  <p>
                    If T1 = $455, reward = 100 × $5 = $500. R:R = $500 ÷ $250 ={" "}
                    <span style={{ color: "#10b981", fontWeight: 600 }}>2:1</span>
                  </p>
                </div>
              </div>

              {/* Kelly Criterion */}
              <div
                className="rounded-xl p-4"
                style={{
                  background: "#141720",
                  border: "1px solid rgba(245,158,11,0.15)",
                }}
              >
                <p
                  className="text-xs font-bold mb-2"
                  style={{ color: "#f59e0b" }}
                >
                  Kelly Criterion (Educational Note)
                </p>
                <p className="text-xs" style={{ color: "#9aa0b4" }}>
                  The Kelly Criterion formula is:{" "}
                  <span className="font-mono" style={{ color: "#e8eaf0" }}>
                    f = (bp − q) ÷ b
                  </span>{" "}
                  where <em>b</em> = odds (R:R), <em>p</em> = win rate, <em>q</em>{" "}
                  = 1 − p. Kelly suggests the theoretically optimal fraction of
                  capital to risk. In practice, professional traders use{" "}
                  <em>fractional Kelly</em> (often 25–50%) to reduce volatility.
                  Full Kelly is considered extremely aggressive and is rarely used
                  in professional trading.
                </p>
              </div>

              {/* Why 1-2% */}
              <div
                className="rounded-xl p-4"
                style={{ background: "#141720", border: "1px solid #1e2433" }}
              >
                <p
                  className="text-xs font-bold mb-2"
                  style={{ color: "#10b981" }}
                >
                  Why Professionals Risk 1–2% Per Trade
                </p>
                <ul
                  className="space-y-1.5 text-xs"
                  style={{ color: "#9aa0b4" }}
                >
                  <li>
                    <span style={{ color: "#10b981" }}>→</span> At 1% risk, you
                    need 100 consecutive losses to blow up — nearly impossible
                    with a structured system
                  </li>
                  <li>
                    <span style={{ color: "#10b981" }}>→</span> At 5% risk, just
                    20 consecutive losses ends your account
                  </li>
                  <li>
                    <span style={{ color: "#10b981" }}>→</span> Even at 50% win
                    rate with 2:1 R:R, 1% risk compounds without catastrophic
                    drawdowns
                  </li>
                  <li>
                    <span style={{ color: "#10b981" }}>→</span> Emotional
                    decision-making increases sharply when a single trade
                    represents more than 2% of total capital
                  </li>
                  <li>
                    <span style={{ color: "#10b981" }}>→</span> Paul Tudor Jones,
                    Stanley Druckenmiller, and Marty Schwartz all emphasize
                    capital preservation as the first rule of trading
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer Compliance ── */}
        <div className="pt-4" style={{ borderTop: "1px solid #1e2433" }}>
          <p
            className="text-center text-xs leading-relaxed"
            style={{ color: "#5a6075" }}
          >
            EDGE OS Risk Engine is a purely educational tool for paper trading
            only. All calculations are mathematical models for learning
            purposes. This is not financial advice, investment advice, or a
            recommendation to buy or sell any security. Position sizing models
            do not guarantee outcomes. Trading and investing involve substantial
            risk of loss. Never risk capital you cannot afford to lose.
            Consult a licensed financial professional before making any
            investment decisions.
          </p>
        </div>
      </div>
    </div>
  );
}

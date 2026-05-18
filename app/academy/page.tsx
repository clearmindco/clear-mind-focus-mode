"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import ProgressBar from "@/components/ProgressBar";
import { MODULES } from "@/lib/lessons";
import { loadProgress, isModuleUnlocked, type AppProgress } from "@/lib/progress";

export default function AcademyDashboard() {
  const [progress, setProgress] = useState<AppProgress | null>(null);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  const completedCount = progress
    ? Object.values(progress.lessons).filter(l => l.passed).length
    : 0;
  const overallPct = Math.round((completedCount / MODULES.length) * 100);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0b0d" }}>
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 pt-12 pb-16">
        {/* Header */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-5"
            style={{ background: "rgba(0,212,255,0.08)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.2)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            Beginner-First Trading Education
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight" style={{ color: "#e8eaf0" }}>
            EDGE<span style={{ color: "#00d4ff" }}>OS</span>{" "}
            <span style={{ color: "#9aa0b4" }}>Academy</span>
          </h1>
          <p className="text-lg max-w-xl mx-auto mb-2" style={{ color: "#9aa0b4" }}>
            Learn everything you need before placing your first real trade in Webull.
          </p>
          <p className="text-sm" style={{ color: "#5a6075" }}>
            10 modules · Quizzes · Checklists · Final Readiness Test
          </p>
        </div>

        {/* Overall Progress Card */}
        <div
          className="rounded-2xl p-6 mb-6"
          style={{ background: "#0f1117", border: "1px solid #1e2433" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold" style={{ color: "#e8eaf0" }}>Your Progress</p>
              <p className="text-sm mt-0.5" style={{ color: "#5a6075" }}>
                {completedCount} of {MODULES.length} modules completed
              </p>
            </div>
            <div className="text-3xl font-bold" style={{ color: "#00d4ff" }}>
              {overallPct}%
            </div>
          </div>
          <ProgressBar value={overallPct} />
          {progress?.finalTestPassed && (
            <div
              className="mt-4 p-3 rounded-xl text-sm text-center font-semibold"
              style={{ background: "rgba(16,185,129,0.08)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}
            >
              🎓 Congratulations — Final Test Passed. You are Trade-Ready!
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: "Modules Done", value: completedCount, suffix: `/ ${MODULES.length}`, color: "#10b981" },
            {
              label: "Avg Quiz Score",
              value:
                progress && Object.values(progress.lessons).filter(l => l.quizScore !== null).length > 0
                  ? Math.round(
                      Object.values(progress.lessons)
                        .filter(l => l.quizScore !== null)
                        .reduce((s, l) => s + (l.quizScore ?? 0), 0) /
                        Object.values(progress.lessons).filter(l => l.quizScore !== null).length
                    )
                  : null,
              suffix:
                progress && Object.values(progress.lessons).filter(l => l.quizScore !== null).length > 0
                  ? "%"
                  : "",
              color: "#00d4ff",
            },
            { label: "Paper Trades", value: progress?.tradeLogs.length ?? 0, suffix: "", color: "#f59e0b" },
          ].map(stat => (
            <div
              key={stat.label}
              className="rounded-xl p-4 text-center"
              style={{ background: "#0f1117", border: "1px solid #1e2433" }}
            >
              <div className="text-2xl font-bold mb-1" style={{ color: stat.color }}>
                {stat.value !== null ? stat.value : "—"}
                <span className="text-sm font-normal ml-0.5" style={{ color: "#5a6075" }}>{stat.suffix}</span>
              </div>
              <div className="text-xs" style={{ color: "#5a6075" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div
          className="rounded-xl p-4 mb-8 flex gap-3 items-start"
          style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)" }}
        >
          <span className="text-lg flex-shrink-0">⚠️</span>
          <p className="text-xs leading-relaxed" style={{ color: "#9aa0b4" }}>
            <strong style={{ color: "#f59e0b" }}>Educational content only.</strong> This course teaches trading concepts and does not provide investment advice or guarantees of any kind. Trading involves substantial risk of loss. Complete all modules and paper trade before using real capital.
          </p>
        </div>

        {/* Module List */}
        <h2 className="text-base font-semibold mb-3" style={{ color: "#e8eaf0" }}>Course Modules</h2>
        <div className="space-y-2">
          {MODULES.map(mod => {
            const lessonProg = progress?.lessons[mod.lessonId];
            const passed = lessonProg?.passed ?? false;
            const unlocked = progress ? isModuleUnlocked(mod.number) : mod.number === 1;
            const score = lessonProg?.quizScore ?? null;

            const card = (
              <div
                className="rounded-xl p-4 flex items-center gap-4 transition-all duration-150"
                style={{
                  background: passed ? "rgba(16,185,129,0.04)" : unlocked ? "#0f1117" : "#0a0b0d",
                  border: `1px solid ${passed ? "rgba(16,185,129,0.2)" : unlocked ? "#1e2433" : "#141720"}`,
                  opacity: unlocked ? 1 : 0.45,
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{
                    background: passed ? "rgba(16,185,129,0.08)" : `${mod.color}0d`,
                    border: `1px solid ${passed ? "rgba(16,185,129,0.2)" : `${mod.color}20`}`,
                  }}
                >
                  {mod.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-xs" style={{ color: "#5a6075" }}>Module {mod.number}</span>
                    {passed && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded font-medium"
                        style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}
                      >
                        ✓ Done
                      </span>
                    )}
                    {!unlocked && <span className="text-xs" style={{ color: "#5a6075" }}>🔒</span>}
                  </div>
                  <p className="font-semibold text-sm truncate" style={{ color: unlocked ? "#e8eaf0" : "#5a6075" }}>
                    {mod.title}
                  </p>
                  <p className="text-xs truncate" style={{ color: "#5a6075" }}>{mod.subtitle}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  {score !== null ? (
                    <span className="text-sm font-bold" style={{ color: score >= 80 ? "#10b981" : "#f59e0b" }}>
                      {score}%
                    </span>
                  ) : unlocked ? (
                    <span className="text-xs" style={{ color: "#00d4ff" }}>Start →</span>
                  ) : null}
                </div>
              </div>
            );

            if (!unlocked) return <div key={mod.id}>{card}</div>;
            return (
              <Link
                key={mod.id}
                href={`/module/${mod.lessonId}`}
                className="block group hover:scale-[1.005] transition-transform"
              >
                {card}
              </Link>
            );
          })}

          {/* Final Test */}
          {(() => {
            const allDone = completedCount >= MODULES.length;
            const ftPassed = progress?.finalTestPassed ?? false;
            const ftScore = progress?.finalTestScore ?? null;
            const card = (
              <div
                className="rounded-xl p-4 flex items-center gap-4 transition-all duration-150"
                style={{
                  background: ftPassed ? "rgba(16,185,129,0.04)" : allDone ? "rgba(0,212,255,0.04)" : "#0a0b0d",
                  border: `1px solid ${ftPassed ? "rgba(16,185,129,0.2)" : allDone ? "rgba(0,212,255,0.2)" : "#141720"}`,
                  opacity: allDone ? 1 : 0.45,
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)" }}
                >
                  🎓
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs" style={{ color: "#5a6075" }}>Final</span>
                    {ftPassed && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded font-medium"
                        style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}
                      >
                        ✓ Trade-Ready
                      </span>
                    )}
                    {!allDone && (
                      <span className="text-xs" style={{ color: "#5a6075" }}>🔒 Complete all modules first</span>
                    )}
                  </div>
                  <p className="font-semibold text-sm" style={{ color: allDone ? "#e8eaf0" : "#5a6075" }}>
                    Final Readiness Test
                  </p>
                  <p className="text-xs" style={{ color: "#5a6075" }}>
                    25 questions · Must score 80%+ · Unlocks your trade-ready status
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {ftScore !== null ? (
                    <span
                      className="text-sm font-bold"
                      style={{ color: ftScore >= 80 ? "#10b981" : "#ef4444" }}
                    >
                      {ftScore}%
                    </span>
                  ) : allDone ? (
                    <span className="text-xs" style={{ color: "#00d4ff" }}>Take Test →</span>
                  ) : null}
                </div>
              </div>
            );
            if (!allDone) return <div key="final">{card}</div>;
            return (
              <Link key="final" href="/final-test" className="block hover:scale-[1.005] transition-transform">
                {card}
              </Link>
            );
          })()}
        </div>

        <p className="text-center text-xs mt-10" style={{ color: "#5a6075" }}>
          Your progress is automatically saved in this browser.
        </p>
      </div>
    </div>
  );
}

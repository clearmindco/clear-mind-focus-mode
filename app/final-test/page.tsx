"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Quiz from "@/components/Quiz";
import { FINAL_TEST_QUESTIONS } from "@/lib/finalTest";
import { loadProgress, recordFinalTest, type AppProgress } from "@/lib/progress";
import { MODULES } from "@/lib/lessons";

export default function FinalTest() {
  const [progress, setProgress] = useState<AppProgress | null>(null);
  const [started, setStarted] = useState(false);
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);

  useEffect(() => {
    const p = loadProgress();
    setProgress(p);
    if (p.finalTestPassed) {
      setResult({ score: p.finalTestScore ?? 0, passed: true });
    }
  }, []);

  const allModulesDone =
    progress !== null &&
    MODULES.every(m => progress.lessons[m.lessonId]?.passed ?? false);

  function handleComplete(score: number, passed: boolean) {
    recordFinalTest(score, passed);
    setResult({ score, passed });
    setProgress(loadProgress());
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0b0d" }}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎓</div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#e8eaf0" }}>
            Final Readiness Test
          </h1>
          <p className="text-sm" style={{ color: "#9aa0b4" }}>
            25 questions covering all 9 modules · Must score 80% to earn Trade-Ready status
          </p>
        </div>

        {/* Not unlocked */}
        {!allModulesDone && (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: "#0f1117", border: "1px solid #1e2433" }}
          >
            <div className="text-4xl mb-3">🔒</div>
            <p className="font-semibold mb-2" style={{ color: "#e8eaf0" }}>
              Complete all 9 modules first
            </p>
            <p className="text-sm mb-6" style={{ color: "#9aa0b4" }}>
              You must pass the quiz in every module before taking the Final Readiness Test.
            </p>
            <Link
              href="/"
              className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "#1e2433", color: "#9aa0b4", border: "1px solid #2a3048" }}
            >
              ← Back to Dashboard
            </Link>
          </div>
        )}

        {/* Already passed */}
        {allModulesDone && result?.passed && !started && (
          <div
            className="rounded-2xl p-8 text-center mb-6"
            style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}
          >
            <div className="text-5xl mb-3">🏆</div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "#10b981" }}>
              Trade-Ready Certification
            </h2>
            <p className="text-sm mb-1" style={{ color: "#9aa0b4" }}>Final Test Score</p>
            <div className="text-4xl font-bold mb-4" style={{ color: "#10b981" }}>
              {result.score}%
            </div>
            <p className="text-sm mb-6" style={{ color: "#9aa0b4" }}>
              You have completed EDGE OS Trading School. You understand trading fundamentals, risk management, chart reading, and options basics. You are ready to paper trade consistently before moving to live capital.
            </p>
            <div
              className="rounded-xl p-4 mb-6 text-left"
              style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}
            >
              <p className="text-xs font-semibold mb-2" style={{ color: "#f59e0b" }}>⚠ Remember before going live:</p>
              <ul className="text-xs space-y-1" style={{ color: "#9aa0b4" }}>
                <li>• Paper trade 30+ trades consistently before using real capital</li>
                <li>• Never risk more than 1% of your account on any trade</li>
                <li>• Always set stop losses before entering a position</li>
                <li>• Only take trades with at least 1:2 risk/reward</li>
                <li>• Keep a trading journal for every single trade</li>
              </ul>
            </div>
            <button
              onClick={() => { setResult(null); setStarted(true); }}
              className="px-5 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: "#1e2433", color: "#9aa0b4", border: "1px solid #2a3048" }}
            >
              Retake Test
            </button>
          </div>
        )}

        {/* Start screen */}
        {allModulesDone && !started && !result?.passed && (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: "#0f1117", border: "1px solid #1e2433" }}
          >
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: "Questions", value: "25", color: "#00d4ff" },
                { label: "Pass Score", value: "80%", color: "#f59e0b" },
                { label: "Topics", value: "All 9", color: "#a855f7" },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: "#0a0b0d", border: "1px solid #1e2433" }}>
                  <div className="text-xl font-bold mb-1" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs" style={{ color: "#5a6075" }}>{s.label}</div>
                </div>
              ))}
            </div>
            <p className="text-sm mb-6" style={{ color: "#9aa0b4" }}>
              This test covers all modules: trading fundamentals, chart reading, risk management, options, market drivers, trade setups, and psychology. Take your time — there is no time limit.
            </p>
            <button
              onClick={() => setStarted(true)}
              className="px-8 py-3 rounded-xl font-semibold text-sm transition-all"
              style={{
                background: "linear-gradient(135deg, #00d4ff 0%, #0077ff 100%)",
                color: "#0a0b0d",
                boxShadow: "0 0 20px rgba(0,212,255,0.3)",
              }}
            >
              Begin Final Test
            </button>
          </div>
        )}

        {/* Quiz */}
        {allModulesDone && started && (
          <div>
            <Quiz
              questions={FINAL_TEST_QUESTIONS}
              passingScore={80}
              onComplete={handleComplete}
            />

            {result && (
              <div className="mt-8">
                {result.passed ? (
                  <div
                    className="rounded-2xl p-6 text-center"
                    style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}
                  >
                    <p className="text-2xl mb-2">🏆</p>
                    <p className="font-bold text-lg mb-2" style={{ color: "#10b981" }}>
                      You are Trade-Ready!
                    </p>
                    <p className="text-sm mb-4" style={{ color: "#9aa0b4" }}>
                      Final score: {result.score}%. Proceed to paper trading with discipline.
                    </p>
                    <Link href="/" className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}>
                      ← Back to Dashboard
                    </Link>
                  </div>
                ) : (
                  <div
                    className="rounded-2xl p-6 text-center"
                    style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}
                  >
                    <p className="font-bold mb-2" style={{ color: "#ef4444" }}>
                      Score: {result.score}% — Need 80% to pass
                    </p>
                    <p className="text-sm mb-4" style={{ color: "#9aa0b4" }}>
                      Review the explanations for any wrong answers, revisit those modules, then retake.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Link href="/" className="px-4 py-2 rounded-lg text-sm" style={{ background: "#1e2433", color: "#9aa0b4" }}>
                        Review Modules
                      </Link>
                      <button
                        onClick={() => { setResult(null); setStarted(false); setTimeout(() => setStarted(true), 50); }}
                        className="px-4 py-2 rounded-lg text-sm font-medium"
                        style={{ background: "rgba(0,212,255,0.1)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.3)" }}
                      >
                        Retake Test
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import type { QuizQuestion } from "@/lib/lessons";

interface Props {
  questions: QuizQuestion[];
  passingScore: number;
  onComplete: (score: number, passed: boolean) => void;
}

type AnswerState = {
  selected: number | null;
  revealed: boolean;
};

export default function Quiz({ questions, passingScore, onComplete }: Props) {
  const [answers, setAnswers] = useState<Record<string, AnswerState>>(
    Object.fromEntries(questions.map(q => [q.id, { selected: null, revealed: false }]))
  );
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const allAnswered = questions.every(q => answers[q.id].selected !== null);

  function handleSelect(qId: string, idx: number) {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qId]: { ...prev[qId], selected: idx } }));
  }

  function handleSubmit() {
    if (!allAnswered) return;
    let correct = 0;
    const newAnswers = { ...answers };
    questions.forEach(q => {
      newAnswers[q.id] = { ...newAnswers[q.id], revealed: true };
      if (newAnswers[q.id].selected === q.correct) correct++;
    });
    setAnswers(newAnswers);
    const pct = Math.round((correct / questions.length) * 100);
    setScore(pct);
    setSubmitted(true);
    onComplete(pct, pct >= passingScore);
  }

  function handleRetry() {
    setAnswers(Object.fromEntries(questions.map(q => [q.id, { selected: null, revealed: false }])));
    setSubmitted(false);
    setScore(null);
  }

  const passed = score !== null && score >= passingScore;

  return (
    <div className="space-y-6">
      {submitted && score !== null && (
        <div
          className="rounded-xl p-4 border text-center"
          style={{
            background: passed ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
            borderColor: passed ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)",
          }}
        >
          <div className="text-3xl font-bold mb-1" style={{ color: passed ? "#10b981" : "#ef4444" }}>
            {score}%
          </div>
          <div className="text-sm mb-2" style={{ color: passed ? "#10b981" : "#ef4444" }}>
            {passed ? "✓ Quiz Passed — Lesson Complete!" : `✗ Needs ${passingScore}% to pass. Review the answers and try again.`}
          </div>
          {!passed && (
            <button
              onClick={handleRetry}
              className="mt-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ background: "#1e2433", color: "#e8eaf0", border: "1px solid #2a3048" }}
            >
              Try Again
            </button>
          )}
        </div>
      )}

      {questions.map((q, qi) => {
        const ans = answers[q.id];
        const isCorrect = ans.revealed && ans.selected === q.correct;
        const isWrong = ans.revealed && ans.selected !== q.correct;

        return (
          <div
            key={q.id}
            className="rounded-xl p-5"
            style={{ background: "#0f1117", border: "1px solid #1e2433" }}
          >
            <div className="flex items-start gap-3 mb-4">
              <span
                className="flex-shrink-0 w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center"
                style={{ background: "#1e2433", color: "#9aa0b4" }}
              >
                {qi + 1}
              </span>
              <div>
                <span
                  className="inline-block text-xs px-2 py-0.5 rounded-full mb-2 font-medium uppercase tracking-wide"
                  style={{
                    background: q.type === "scenario" ? "rgba(245,158,11,0.1)" : "rgba(0,212,255,0.1)",
                    color: q.type === "scenario" ? "#f59e0b" : "#00d4ff",
                  }}
                >
                  {q.type === "true-false" ? "True / False" : q.type === "scenario" ? "Scenario" : "Multiple Choice"}
                </span>
                <p className="font-medium" style={{ color: "#e8eaf0" }}>{q.question}</p>
              </div>
            </div>

            <div className="space-y-2 ml-10">
              {q.options.map((opt, oi) => {
                let borderColor = "#1e2433";
                let bgColor = "#141720";
                let textColor = "#9aa0b4";
                let icon = null;

                if (ans.revealed) {
                  if (oi === q.correct) {
                    borderColor = "rgba(16,185,129,0.5)";
                    bgColor = "rgba(16,185,129,0.08)";
                    textColor = "#10b981";
                    icon = "✓";
                  } else if (oi === ans.selected && isWrong) {
                    borderColor = "rgba(239,68,68,0.5)";
                    bgColor = "rgba(239,68,68,0.08)";
                    textColor = "#ef4444";
                    icon = "✗";
                  }
                } else if (ans.selected === oi) {
                  borderColor = "rgba(0,212,255,0.5)";
                  bgColor = "rgba(0,212,255,0.08)";
                  textColor = "#00d4ff";
                }

                return (
                  <button
                    key={oi}
                    onClick={() => handleSelect(q.id, oi)}
                    disabled={submitted}
                    className="w-full text-left rounded-lg px-4 py-3 text-sm transition-all duration-150"
                    style={{
                      background: bgColor,
                      border: `1px solid ${borderColor}`,
                      color: textColor,
                      cursor: submitted ? "default" : "pointer",
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center text-xs font-bold"
                        style={{ borderColor, color: textColor }}
                      >
                        {icon ?? String.fromCharCode(65 + oi)}
                      </span>
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>

            {ans.revealed && (
              <div
                className="mt-3 ml-10 p-3 rounded-lg text-sm"
                style={{
                  background: isCorrect ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)",
                  borderLeft: `3px solid ${isCorrect ? "#10b981" : "#ef4444"}`,
                  color: "#9aa0b4",
                }}
              >
                <span className="font-medium" style={{ color: isCorrect ? "#10b981" : "#ef4444" }}>
                  {isCorrect ? "Correct! " : "Incorrect. "}
                </span>
                {q.explanation}
              </div>
            )}
          </div>
        );
      })}

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={!allAnswered}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200"
          style={{
            background: allAnswered ? "linear-gradient(135deg, #00d4ff 0%, #0077ff 100%)" : "#1e2433",
            color: allAnswered ? "#0a0b0d" : "#5a6075",
            cursor: allAnswered ? "pointer" : "not-allowed",
            boxShadow: allAnswered ? "0 0 20px rgba(0,212,255,0.3)" : "none",
          }}
        >
          {allAnswered ? "Submit Quiz" : `Answer all ${questions.length} questions to submit`}
        </button>
      )}
    </div>
  );
}

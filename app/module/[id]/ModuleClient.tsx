"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import ProgressBar from "@/components/ProgressBar";
import Checklist from "@/components/Checklist";
import Quiz from "@/components/Quiz";
import { LESSONS, MODULES } from "@/lib/lessons";
import InvestorLabLesson from "@/components/InvestorLabLesson";
import {
  getLessonProgress,
  updateChecklistItem,
  recordQuizResult,
  isModuleUnlocked,
  type LessonProgress,
} from "@/lib/progress";

type Tab = "lesson" | "checklist" | "quiz";

export default function ModuleClient({ id }: { id: string }) {
  const router = useRouter();

  const lesson = LESSONS.find(l => l.id === id);
  const [progress, setProgress] = useState<LessonProgress | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("lesson");
  const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [unlocked, setUnlocked] = useState(false);

  const reload = useCallback(() => {
    if (!lesson) return;
    setProgress(getLessonProgress(lesson.id));
    setUnlocked(isModuleUnlocked(lesson.moduleNumber));
  }, [lesson]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (!lesson) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0b0d", color: "#e8eaf0" }}>
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <p className="text-2xl mb-4">Module not found</p>
          <Link href="/" style={{ color: "#00d4ff" }}>← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0b0d", color: "#e8eaf0" }}>
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="text-5xl mb-4">🔒</div>
          <p className="text-xl font-semibold mb-2" style={{ color: "#e8eaf0" }}>Module Locked</p>
          <p className="text-sm mb-6" style={{ color: "#9aa0b4" }}>
            Complete the previous module to unlock {lesson.title}.
          </p>
          <Link href="/" className="text-sm" style={{ color: "#00d4ff" }}>← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const checklistCompleted = progress?.checklistCompleted ?? [];
  const allChecked = lesson.checklist.every(item => checklistCompleted.includes(item.id));
  const lessonPassed = progress?.passed ?? false;

  const nextModule = MODULES.find(m => m.number === lesson.moduleNumber + 1);

  function handleChecklistChange(itemId: string, checked: boolean) {
    if (!lesson) return;
    updateChecklistItem(lesson.id, itemId, checked);
    reload();
  }

  function handleQuizComplete(score: number, passed: boolean) {
    if (!lesson) return;
    recordQuizResult(lesson.id, score, passed);
    setQuizResult({ score, passed });
    reload();
  }

  const tabs: { id: Tab; label: string; locked?: boolean }[] = [
    { id: "lesson", label: "Lesson" },
    { id: "checklist", label: "Checklist" },
    { id: "quiz", label: "Quiz", locked: !allChecked && !lessonPassed },
  ];

  const checklistPct = Math.round((checklistCompleted.length / lesson.checklist.length) * 100);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0b0d" }}>
      <Navbar />

      {/* Module Header */}
      <div style={{ background: "#0f1117", borderBottom: "1px solid #1e2433" }}>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/" className="text-xs mb-3 inline-flex items-center gap-1" style={{ color: "#5a6075" }}>
            ← Dashboard
          </Link>
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: `${lesson.color}0d`, border: `1px solid ${lesson.color}25` }}
            >
              {lesson.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#1e2433", color: "#9aa0b4" }}>
                  Module {lesson.moduleNumber}
                </span>
                <span className="text-xs" style={{ color: "#5a6075" }}>~{lesson.estimatedMinutes} min</span>
                {lessonPassed && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>
                    ✓ Completed
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold mb-1" style={{ color: "#e8eaf0" }}>{lesson.title}</h1>
              <p className="text-sm" style={{ color: "#9aa0b4" }}>{lesson.subtitle}</p>
            </div>
          </div>

          {/* Progress row */}
          <div className="mt-4 flex items-center gap-4">
            <div className="flex-1">
              <ProgressBar
                value={lessonPassed ? 100 : checklistPct}
                color={lessonPassed ? "#10b981" : lesson.color}
                height={4}
              />
            </div>
            <span className="text-xs flex-shrink-0" style={{ color: "#5a6075" }}>
              {lessonPassed ? "Complete" : `${checklistCompleted.length}/${lesson.checklist.length} checked`}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: "#0f1117", borderBottom: "1px solid #1e2433", position: "sticky", top: "56px", zIndex: 40 }}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => !tab.locked && setActiveTab(tab.id)}
                className="px-5 py-3 text-sm font-medium transition-colors relative"
                style={{
                  color: activeTab === tab.id ? "#00d4ff" : tab.locked ? "#3a4060" : "#9aa0b4",
                  cursor: tab.locked ? "not-allowed" : "pointer",
                  borderBottom: activeTab === tab.id ? "2px solid #00d4ff" : "2px solid transparent",
                }}
              >
                {tab.label}
                {tab.locked && <span className="ml-1 text-xs">🔒</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {activeTab === "lesson" && (
          lesson.id === "investor-movement-lab" ? (
            <div className="animate-fade-in space-y-8">
              <InvestorLabLesson />
              <button
                onClick={() => setActiveTab("checklist")}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200"
                style={{
                  background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
                  color: "#fff",
                  boxShadow: "0 0 20px rgba(168,85,247,0.3)",
                }}
              >
                Continue to Checklist →
              </button>
            </div>
          ) : (
            <LessonContent lesson={lesson} onContinue={() => setActiveTab("checklist")} />
          )
        )}
        {activeTab === "checklist" && (
          <ChecklistTab
            lesson={lesson}
            completed={checklistCompleted}
            onChange={handleChecklistChange}
            allChecked={allChecked}
            onStartQuiz={() => setActiveTab("quiz")}
          />
        )}
        {activeTab === "quiz" && (
          <QuizTab
            lesson={lesson}
            progress={progress}
            quizResult={quizResult ?? (progress?.passed ? { score: progress.quizScore ?? 0, passed: true } : null)}
            onComplete={handleQuizComplete}
            nextModule={nextModule}
            onGoNext={() => nextModule && router.push(`/module/${nextModule.lessonId}`)}
          />
        )}
      </div>
    </div>
  );
}

function LessonContent({ lesson, onContinue }: { lesson: (typeof LESSONS)[0]; onContinue: () => void }) {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Sections */}
      {lesson.sections.map((section, i) => (
        <div key={i}>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "#e8eaf0" }}>{section.title}</h2>
          <div className="space-y-3">
            {section.content.split("\n\n").map((para, pi) => (
              <p key={pi} className="text-sm leading-relaxed" style={{ color: "#9aa0b4" }}>
                {para}
              </p>
            ))}
          </div>
        </div>
      ))}

      {/* Analogy */}
      <div
        className="rounded-xl p-5"
        style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#00d4ff" }}>Simple Analogy</p>
        <p className="text-sm leading-relaxed" style={{ color: "#9aa0b4" }}>{lesson.analogy}</p>
      </div>

      {/* Webull Example */}
      <div
        className="rounded-xl p-5"
        style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.15)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#f59e0b" }}>In Webull</p>
        <p className="text-sm leading-relaxed" style={{ color: "#9aa0b4" }}>{lesson.webullExample}</p>
      </div>

      {/* Common Mistakes */}
      <div
        className="rounded-xl p-5"
        style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#ef4444" }}>Common Beginner Mistakes</p>
        <ul className="space-y-2">
          {lesson.commonMistakes.map((m, i) => (
            <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "#9aa0b4" }}>
              <span className="flex-shrink-0 mt-0.5" style={{ color: "#ef4444" }}>✗</span>
              {m}
            </li>
          ))}
        </ul>
      </div>

      {/* Real Trading Meaning */}
      <div
        className="rounded-xl p-5"
        style={{ background: "#0f1117", border: "1px solid #1e2433" }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#a855f7" }}>What This Means In Real Trading</p>
        <p className="text-sm leading-relaxed" style={{ color: "#9aa0b4" }}>{lesson.realTradingMeaning}</p>
      </div>

      <button
        onClick={onContinue}
        className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200"
        style={{
          background: "linear-gradient(135deg, #00d4ff 0%, #0077ff 100%)",
          color: "#0a0b0d",
          boxShadow: "0 0 20px rgba(0,212,255,0.3)",
        }}
      >
        Continue to Checklist →
      </button>
    </div>
  );
}

function ChecklistTab({
  lesson,
  completed,
  onChange,
  allChecked,
  onStartQuiz,
}: {
  lesson: (typeof LESSONS)[0];
  completed: string[];
  onChange: (id: string, checked: boolean) => void;
  allChecked: boolean;
  onStartQuiz: () => void;
}) {
  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-1" style={{ color: "#e8eaf0" }}>Lesson Checklist</h2>
        <p className="text-sm" style={{ color: "#9aa0b4" }}>
          Check each item when you truly understand it. Complete all items to unlock the quiz.
        </p>
      </div>
      <Checklist items={lesson.checklist} completed={completed} onChange={onChange} />
      {allChecked && (
        <button
          onClick={onStartQuiz}
          className="mt-6 w-full py-3 rounded-xl font-semibold text-sm transition-all"
          style={{
            background: "linear-gradient(135deg, #00d4ff 0%, #0077ff 100%)",
            color: "#0a0b0d",
            boxShadow: "0 0 20px rgba(0,212,255,0.3)",
          }}
        >
          Take the Quiz →
        </button>
      )}
    </div>
  );
}

function QuizTab({
  lesson,
  progress,
  quizResult,
  onComplete,
  nextModule,
  onGoNext,
}: {
  lesson: (typeof LESSONS)[0];
  progress: LessonProgress | null;
  quizResult: { score: number; passed: boolean } | null;
  onComplete: (score: number, passed: boolean) => void;
  nextModule: (typeof MODULES)[0] | undefined;
  onGoNext: () => void;
}) {
  const alreadyPassed = progress?.passed ?? false;

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-1" style={{ color: "#e8eaf0" }}>Quiz</h2>
        <p className="text-sm" style={{ color: "#9aa0b4" }}>
          {lesson.quiz.length} questions · Pass rate: {lesson.passingScore}%
          {progress?.quizAttempts ? ` · Attempts: ${progress.quizAttempts}` : ""}
        </p>
      </div>

      {alreadyPassed && !quizResult && (
        <div
          className="rounded-xl p-4 mb-6 text-center"
          style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}
        >
          <p className="font-semibold text-sm mb-1" style={{ color: "#10b981" }}>
            ✓ You already passed this quiz ({progress?.quizScore}%)
          </p>
          {nextModule && (
            <button
              onClick={onGoNext}
              className="mt-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors"
              style={{ background: "rgba(0,212,255,0.1)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.3)" }}
            >
              Continue to Module {lesson.moduleNumber + 1} →
            </button>
          )}
        </div>
      )}

      <Quiz questions={lesson.quiz} passingScore={lesson.passingScore} onComplete={onComplete} />

      {quizResult?.passed && nextModule && (
        <div
          className="mt-6 rounded-xl p-5 text-center"
          style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}
        >
          <p className="font-semibold mb-1" style={{ color: "#10b981" }}>
            🎉 Module {lesson.moduleNumber} Complete!
          </p>
          <p className="text-sm mb-4" style={{ color: "#9aa0b4" }}>
            {nextModule.title} is now unlocked.
          </p>
          <button
            onClick={onGoNext}
            className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-all"
            style={{
              background: "linear-gradient(135deg, #00d4ff 0%, #0077ff 100%)",
              color: "#0a0b0d",
              boxShadow: "0 0 15px rgba(0,212,255,0.3)",
            }}
          >
            Start Module {lesson.moduleNumber + 1}: {nextModule.title} →
          </button>
        </div>
      )}

      {quizResult?.passed && !nextModule && (
        <div
          className="mt-6 rounded-xl p-5 text-center"
          style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}
        >
          <p className="font-semibold mb-1" style={{ color: "#10b981" }}>
            🎓 All Modules Complete!
          </p>
          <p className="text-sm mb-4" style={{ color: "#9aa0b4" }}>You can now take the Final Readiness Test.</p>
          <Link
            href="/final-test"
            className="inline-block px-6 py-2.5 rounded-xl font-semibold text-sm"
            style={{
              background: "linear-gradient(135deg, #00d4ff 0%, #0077ff 100%)",
              color: "#0a0b0d",
            }}
          >
            Take the Final Test →
          </Link>
        </div>
      )}
    </div>
  );
}

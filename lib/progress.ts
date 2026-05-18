"use client";

import { LESSONS } from "./lessons";

export interface LessonProgress {
  lessonId: string;
  checklistCompleted: string[];
  quizAttempts: number;
  quizScore: number | null;
  passed: boolean;
  completedAt: string | null;
}

export interface TradeLog {
  id: string;
  date: string;
  ticker: string;
  assetType?: string;
  direction?: string;
  emotionalState?: string;
  setupType: string;
  catalyst?: string;
  entry: string;
  stop: string;
  target1: string;
  target2: string;
  tradeStatus?: "open" | "closed";
  exitPrice?: string;
  result: string;
  exitReason?: string;
  thesis: string;
  followedPlan: boolean;
  lessonLearned?: string;
  notes: string;
}

export interface AppProgress {
  lessons: Record<string, LessonProgress>;
  tradeLogs: TradeLog[];
  finalTestScore: number | null;
  finalTestPassed: boolean;
  finalTestCompletedAt: string | null;
}

const STORAGE_KEY = "edgeos_progress_v1";

function defaultLessonProgress(lessonId: string): LessonProgress {
  return {
    lessonId,
    checklistCompleted: [],
    quizAttempts: 0,
    quizScore: null,
    passed: false,
    completedAt: null,
  };
}

const emptyProgress = (): AppProgress => ({
  lessons: {},
  tradeLogs: [],
  finalTestScore: null,
  finalTestPassed: false,
  finalTestCompletedAt: null,
});

export function loadProgress(): AppProgress {
  if (typeof window === "undefined") return emptyProgress();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    return JSON.parse(raw);
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(progress: AppProgress): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function getLessonProgress(lessonId: string): LessonProgress {
  const p = loadProgress();
  return p.lessons[lessonId] ?? defaultLessonProgress(lessonId);
}

export function updateChecklistItem(lessonId: string, itemId: string, checked: boolean): void {
  const p = loadProgress();
  if (!p.lessons[lessonId]) p.lessons[lessonId] = defaultLessonProgress(lessonId);
  const items = p.lessons[lessonId].checklistCompleted;
  if (checked && !items.includes(itemId)) {
    p.lessons[lessonId].checklistCompleted = [...items, itemId];
  } else if (!checked) {
    p.lessons[lessonId].checklistCompleted = items.filter(i => i !== itemId);
  }
  saveProgress(p);
}

export function recordQuizResult(lessonId: string, score: number, passed: boolean): void {
  const p = loadProgress();
  if (!p.lessons[lessonId]) p.lessons[lessonId] = defaultLessonProgress(lessonId);
  p.lessons[lessonId].quizAttempts += 1;
  p.lessons[lessonId].quizScore = Math.max(p.lessons[lessonId].quizScore ?? 0, score);
  if (passed) {
    p.lessons[lessonId].passed = true;
    p.lessons[lessonId].completedAt = new Date().toISOString();
  }
  saveProgress(p);
}

export function recordFinalTest(score: number, passed: boolean): void {
  const p = loadProgress();
  p.finalTestScore = score;
  p.finalTestPassed = passed;
  if (passed) p.finalTestCompletedAt = new Date().toISOString();
  saveProgress(p);
}

export function isModuleUnlocked(moduleNumber: number): boolean {
  if (moduleNumber === 1) return true;
  const p = loadProgress();
  const prevLesson = LESSONS.find(l => l.moduleNumber === moduleNumber - 1);
  if (!prevLesson) return false;
  return p.lessons[prevLesson.id]?.passed ?? false;
}

export function addTradeLog(log: Omit<TradeLog, "id">): void {
  const p = loadProgress();
  p.tradeLogs = [{ ...log, id: Date.now().toString() }, ...p.tradeLogs];
  saveProgress(p);
}

export function updateTradeLog(id: string, updates: Partial<Omit<TradeLog, "id">>): void {
  const p = loadProgress();
  p.tradeLogs = p.tradeLogs.map(t => t.id === id ? { ...t, ...updates } : t);
  saveProgress(p);
}

export function resetAllProgress(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

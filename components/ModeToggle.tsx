"use client";

import { useMode } from "@/lib/mode-context";

export default function ModeToggle() {
  const { mode, toggle } = useMode();
  const isBeginner = mode === "beginner";

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-200"
      style={{
        background: isBeginner ? "rgba(16,185,129,0.1)" : "rgba(139,92,246,0.1)",
        border: isBeginner ? "1px solid rgba(16,185,129,0.25)" : "1px solid rgba(139,92,246,0.25)",
        color: isBeginner ? "#10b981" : "#8b5cf6",
      }}
      title={isBeginner ? "Switch to Advanced mode — show technical terms" : "Switch to Beginner mode — plain English explanations"}
    >
      <span>{isBeginner ? "🟢" : "🔬"}</span>
      <span>{isBeginner ? "Beginner" : "Advanced"}</span>
    </button>
  );
}

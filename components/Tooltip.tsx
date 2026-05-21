"use client";

import { useState, useRef, useEffect } from "react";
import { useMode } from "@/lib/mode-context";
import { EDUCATION_TERMS } from "@/lib/education-terms";

interface TooltipProps {
  termKey: string;
  children: React.ReactNode;
}

export default function Tooltip({ termKey, children }: TooltipProps) {
  const { mode } = useMode();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const term = EDUCATION_TERMS[termKey];

  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  if (!term) return <>{children}</>;

  const definition = mode === "beginner" ? term.short : term.advanced;

  return (
    <span ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(v => !v)}
        className="underline decoration-dotted cursor-help"
        style={{ color: "inherit", textDecorationColor: "#00d4ff40" }}
        type="button"
      >
        {children}
      </button>
      {open && (
        <span
          className="absolute z-50 bottom-full left-0 mb-2 w-64 rounded-xl p-3 shadow-xl text-left"
          style={{
            background: "#0f1117",
            border: "1px solid #1e2433",
            minWidth: "220px",
          }}
        >
          <span className="block text-xs font-bold mb-1" style={{ color: "#00d4ff" }}>{term.term}</span>
          <span className="block text-xs leading-relaxed" style={{ color: "#9aa0b4" }}>{definition}</span>
          {term.example && mode === "beginner" && (
            <span className="block text-xs mt-2 leading-relaxed" style={{ color: "#5a6075" }}>
              Example: {term.example}
            </span>
          )}
          <span
            className="absolute w-2 h-2 rotate-45 -bottom-1 left-4"
            style={{ background: "#1e2433" }}
          />
        </span>
      )}
    </span>
  );
}

"use client";

import type { ChecklistItem } from "@/lib/lessons";

interface Props {
  items: ChecklistItem[];
  completed: string[];
  onChange: (id: string, checked: boolean) => void;
  disabled?: boolean;
}

export default function Checklist({ items, completed, onChange, disabled }: Props) {
  const allChecked = items.every(item => completed.includes(item.id));

  return (
    <div className="space-y-2">
      {items.map(item => {
        const checked = completed.includes(item.id);
        return (
          <label
            key={item.id}
            className="flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all duration-150 group"
            style={{
              background: checked ? "rgba(16,185,129,0.06)" : "#0f1117",
              border: `1px solid ${checked ? "rgba(16,185,129,0.25)" : "#1e2433"}`,
              cursor: disabled ? "default" : "pointer",
            }}
          >
            <div className="relative flex-shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={e => !disabled && onChange(item.id, e.target.checked)}
                className="sr-only"
              />
              <div
                className="w-5 h-5 rounded flex items-center justify-center transition-all duration-200"
                style={{
                  background: checked ? "#10b981" : "transparent",
                  border: `2px solid ${checked ? "#10b981" : "#2a3048"}`,
                }}
              >
                {checked && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="#0a0b0d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </div>
            <span
              className="text-sm leading-relaxed"
              style={{ color: checked ? "#10b981" : "#9aa0b4" }}
            >
              {item.text}
            </span>
          </label>
        );
      })}

      {allChecked && (
        <div
          className="mt-2 p-3 rounded-lg text-sm text-center font-medium"
          style={{ background: "rgba(16,185,129,0.08)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}
        >
          ✓ All items checked — you can now take the quiz
        </div>
      )}
    </div>
  );
}

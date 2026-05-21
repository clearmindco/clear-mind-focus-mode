"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Mode = "beginner" | "advanced";

interface ModeContextValue {
  mode: Mode;
  toggle: () => void;
  isBeginner: boolean;
  isAdvanced: boolean;
}

const ModeContext = createContext<ModeContextValue>({
  mode: "advanced",
  toggle: () => {},
  isBeginner: false,
  isAdvanced: true,
});

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>("advanced");

  useEffect(() => {
    const stored = localStorage.getItem("edge-mode") as Mode | null;
    if (stored === "beginner" || stored === "advanced") setMode(stored);
  }, []);

  function toggle() {
    setMode(prev => {
      const next = prev === "beginner" ? "advanced" : "beginner";
      localStorage.setItem("edge-mode", next);
      return next;
    });
  }

  return (
    <ModeContext.Provider value={{ mode, toggle, isBeginner: mode === "beginner", isAdvanced: mode === "advanced" }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  return useContext(ModeContext);
}

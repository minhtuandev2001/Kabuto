"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { clampWordGap, DEFAULT_WORD_GAP_MS } from "@/lib/theme";

const STORAGE_KEY = "learn-japan.settings.v1";

type SettingsContextValue = {
  wordGapMs: number;
  setWordGapMs: (ms: number) => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [wordGapMs, setWordGapState] = useState(DEFAULT_WORD_GAP_MS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as { wordGapMs?: number };
      if (typeof parsed.wordGapMs === "number") {
        setWordGapState(clampWordGap(parsed.wordGapMs));
      }
    } catch {
      // keep default
    }
  }, []);

  const setWordGapMs = useCallback((ms: number) => {
    const next = clampWordGap(ms);
    setWordGapState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ wordGapMs: next }));
  }, []);

  const value = useMemo(() => ({ wordGapMs, setWordGapMs }), [wordGapMs, setWordGapMs]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return ctx;
}

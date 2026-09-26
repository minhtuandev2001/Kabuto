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
import {
  clampPlayWordLimit,
  clampWordGap,
  DEFAULT_PLAY_WORD_LIMIT,
  DEFAULT_WORD_GAP_MS,
} from "@/lib/theme";

const STORAGE_KEY = "learn-japan.settings.v2";

type SettingsContextValue = {
  wordGapMs: number;
  setWordGapMs: (ms: number) => void;
  playWordLimit: number;
  setPlayWordLimit: (n: number) => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [wordGapMs, setWordGapState] = useState(DEFAULT_WORD_GAP_MS);
  const [playWordLimit, setPlayWordLimitState] = useState(DEFAULT_PLAY_WORD_LIMIT);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem("learn-japan.settings.v1");
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as { wordGapMs?: number; playWordLimit?: number };
      if (typeof parsed.wordGapMs === "number") {
        setWordGapState(clampWordGap(parsed.wordGapMs));
      }
      if (typeof parsed.playWordLimit === "number") {
        setPlayWordLimitState(clampPlayWordLimit(parsed.playWordLimit));
      }
    } catch {
      // keep default
    }
  }, []);

  const persist = useCallback((gap: number, limit: number) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ wordGapMs: gap, playWordLimit: limit }));
  }, []);

  const setWordGapMs = useCallback(
    (ms: number) => {
      const next = clampWordGap(ms);
      setWordGapState(next);
      setPlayWordLimitState((limit) => {
        persist(next, limit);
        return limit;
      });
    },
    [persist],
  );

  const setPlayWordLimit = useCallback(
    (n: number) => {
      const next = clampPlayWordLimit(n);
      setPlayWordLimitState(next);
      setWordGapState((gap) => {
        persist(gap, next);
        return gap;
      });
    },
    [persist],
  );

  const value = useMemo(
    () => ({ wordGapMs, setWordGapMs, playWordLimit, setPlayWordLimit }),
    [playWordLimit, setPlayWordLimit, setWordGapMs, wordGapMs],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return ctx;
}

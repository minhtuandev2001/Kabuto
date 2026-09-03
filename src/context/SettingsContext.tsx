import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'learn-japan.settings.v1';

export const DEFAULT_WORD_GAP_MS = 2000;
export const MIN_WORD_GAP_MS = 0;
export const MAX_WORD_GAP_MS = 5000;
export const WORD_GAP_STEP_MS = 500;

export const WORD_GAP_PRESETS = [0, 1000, 1500, 2000, 3000, 5000] as const;

type Settings = {
  wordGapMs: number;
};

type SettingsContextValue = Settings & {
  setWordGapMs: (ms: number) => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function clampWordGap(ms: number) {
  const snapped = Math.round(ms / WORD_GAP_STEP_MS) * WORD_GAP_STEP_MS;
  return Math.min(MAX_WORD_GAP_MS, Math.max(MIN_WORD_GAP_MS, snapped));
}

export function formatWordGap(ms: number) {
  if (ms <= 0) {
    return 'Không nghỉ';
  }
  const seconds = ms / 1000;
  const label = Number.isInteger(seconds) ? String(seconds) : String(seconds).replace('.', ',');
  return `${label} giây`;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [wordGapMs, setWordGapState] = useState(DEFAULT_WORD_GAP_MS);

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) {
        return;
      }
      try {
        const parsed = JSON.parse(raw) as Partial<Settings>;
        if (typeof parsed.wordGapMs === 'number') {
          setWordGapState(clampWordGap(parsed.wordGapMs));
        }
      } catch {
        // keep default
      }
    });
  }, []);

  const setWordGapMs = useCallback((ms: number) => {
    const next = clampWordGap(ms);
    setWordGapState(next);
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ wordGapMs: next }));
  }, []);

  const value = useMemo(
    () => ({
      wordGapMs,
      setWordGapMs,
    }),
    [setWordGapMs, wordGapMs],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return ctx;
}

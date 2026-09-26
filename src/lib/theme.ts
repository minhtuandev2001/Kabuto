export const colors = {
  text: "#1E1B4B",
  textSoft: "#4A4470",
  muted: "#7C7A9C",
  faint: "#B9B6D4",
  primary: "#7C5CFC",
  primaryLight: "#A78BFA",
  primaryDark: "#5B3FD6",
  primarySoft: "#EFEAFF",
  amber: "#FBBF24",
  white: "#FFFFFF",
};

export const lessonAccents = [
  ["#7C5CFC", "#A78BFA"],
  ["#F472B6", "#FB923C"],
  ["#34D399", "#38BDF8"],
  ["#38BDF8", "#7C5CFC"],
  ["#FBBF24", "#F472B6"],
] as const;

export const DEFAULT_WORD_GAP_MS = 2000;
export const MIN_WORD_GAP_MS = 0;
export const MAX_WORD_GAP_MS = 5000;
export const WORD_GAP_STEP_MS = 500;
export const WORD_GAP_PRESETS = [0, 1000, 1500, 2000, 3000, 5000] as const;

/** 0 = nghe liên tục (không giới hạn). */
export const DEFAULT_PLAY_WORD_LIMIT = 0;
export const PLAY_WORD_LIMIT_PRESETS = [0, 5, 10, 20, 30, 50] as const;

export function clampWordGap(ms: number) {
  const snapped = Math.round(ms / WORD_GAP_STEP_MS) * WORD_GAP_STEP_MS;
  return Math.min(MAX_WORD_GAP_MS, Math.max(MIN_WORD_GAP_MS, snapped));
}

export function formatWordGap(ms: number) {
  if (ms <= 0) {
    return "Không nghỉ";
  }
  const seconds = ms / 1000;
  const label = Number.isInteger(seconds) ? String(seconds) : String(seconds).replace(".", ",");
  return `${label} giây`;
}

export function clampPlayWordLimit(n: number) {
  if (!Number.isFinite(n) || n <= 0) {
    return 0;
  }
  return Math.min(200, Math.max(1, Math.round(n)));
}

export function formatPlayWordLimit(n: number) {
  return n <= 0 ? "Cả bài" : `${n} từ`;
}

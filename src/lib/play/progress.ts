import type { VocabWord } from "@/lib/types";

export type GameId = "sushi" | "tanuki" | "ninja" | "boss";
export type AnswerMode = "choice" | "type";
export type DeckSource = "lesson" | "level" | "review";

export type WordStat = {
  /** Leitner box 1..5; higher = known longer. */
  box: number;
  /** Day number (see `dayNumber`) when the word should be asked again. */
  due: number;
  seen: number;
  wrong: number;
};

export type PlaySetup = {
  source: DeckSource;
  lessons: number[];
  levels: string[];
  /** 0 = every matching word. */
  count: number;
  mode: AnswerMode;
};

export type PlayProgress = {
  koban: number;
  streak: { day: number; count: number };
  best: Partial<Record<GameId, number>>;
  words: Record<string, WordStat>;
  owned: string[];
  equipped: string | null;
  muted: boolean;
  setup: PlaySetup;
};

export const MAX_BOX = 5;
/** Days until the next review after landing in box N (index = box). */
export const BOX_INTERVAL_DAYS = [0, 1, 3, 7, 14, 30];
export const KNOWN_BOX = 4;

export const DEFAULT_SETUP: PlaySetup = { source: "lesson", lessons: [], levels: [], count: 20, mode: "choice" };

export const EMPTY_PROGRESS: PlayProgress = {
  koban: 0,
  streak: { day: 0, count: 0 },
  best: {},
  words: {},
  owned: [],
  equipped: null,
  muted: false,
  setup: DEFAULT_SETUP,
};

/** Local calendar day as an integer, so "tomorrow" follows the user's midnight, not UTC. */
export function dayNumber(date = new Date()) {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
}

/** Stable across reorder (unlike `order`). */
export function wordKey(word: VocabWord) {
  return `${word.lesson}|${word.kana}|${word.kanji}`;
}

export function recordAnswer(stat: WordStat | undefined, correct: boolean, today: number): WordStat {
  const base = stat ?? { box: 0, due: today, seen: 0, wrong: 0 };
  if (!correct) {
    return { box: 1, due: today, seen: base.seen + 1, wrong: base.wrong + 1 };
  }
  const box = Math.min(MAX_BOX, Math.max(1, base.box + 1));
  return { box, due: today + BOX_INTERVAL_DAYS[box]!, seen: base.seen + 1, wrong: base.wrong };
}

export function isDue(stat: WordStat | undefined, today: number) {
  return Boolean(stat && stat.seen > 0 && stat.due <= today);
}

export function bumpStreak(streak: PlayProgress["streak"], today: number): PlayProgress["streak"] {
  if (streak.day === today) {
    return streak;
  }
  return { day: today, count: streak.day === today - 1 ? streak.count + 1 : 1 };
}

/** Streak still alive = played today or yesterday. */
export function liveStreak(streak: PlayProgress["streak"], today: number) {
  return streak.day >= today - 1 ? streak.count : 0;
}

export type Rarity = "common" | "rare" | "epic" | "legendary";

export type Outfit = { id: string; emoji: string; name: string; rarity: Rarity };

export const OUTFITS: Outfit[] = [
  { id: "ribbon", emoji: "🎀", name: "Nơ hồng", rarity: "common" },
  { id: "sakura", emoji: "🌸", name: "Hoa anh đào", rarity: "common" },
  { id: "onigiri", emoji: "🍙", name: "Cơm nắm", rarity: "common" },
  { id: "fish", emoji: "🐟", name: "Cá khô", rarity: "common" },
  { id: "dango", emoji: "🍡", name: "Bánh dango", rarity: "common" },
  { id: "lantern", emoji: "🏮", name: "Đèn lồng", rarity: "rare" },
  { id: "tengu", emoji: "👺", name: "Mặt nạ Tengu", rarity: "rare" },
  { id: "ninja", emoji: "🥷", name: "Ninja", rarity: "rare" },
  { id: "kimono", emoji: "👘", name: "Kimono", rarity: "rare" },
  { id: "crown", emoji: "👑", name: "Vương miện", rarity: "epic" },
  { id: "fuji", emoji: "🗻", name: "Núi Phú Sĩ", rarity: "epic" },
  { id: "torii", emoji: "⛩️", name: "Cổng Torii", rarity: "epic" },
  { id: "dragon", emoji: "🐉", name: "Rồng thần", rarity: "legendary" },
];

export const RARITY_WEIGHT: Record<Rarity, number> = { common: 60, rare: 28, epic: 10, legendary: 2 };
export const RARITY_LABEL: Record<Rarity, string> = {
  common: "Thường",
  rare: "Hiếm",
  epic: "Sử thi",
  legendary: "Huyền thoại",
};
export const GACHA_COST = 30;
export const DUPLICATE_REFUND = 10;

export function rollOutfit(random = Math.random): Outfit {
  const total = OUTFITS.reduce((sum, item) => sum + RARITY_WEIGHT[item.rarity], 0);
  let ticket = random() * total;
  for (const item of OUTFITS) {
    ticket -= RARITY_WEIGHT[item.rarity];
    if (ticket < 0) {
      return item;
    }
  }
  return OUTFITS[0]!;
}

export function outfitEmoji(id: string | null) {
  return OUTFITS.find((item) => item.id === id)?.emoji ?? "";
}

const STORAGE_KEY = "learn-japan.play.v1";

export function loadProgress(): PlayProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return EMPTY_PROGRESS;
    }
    const parsed = JSON.parse(raw) as Partial<PlayProgress>;
    return {
      ...EMPTY_PROGRESS,
      ...parsed,
      setup: { ...DEFAULT_SETUP, ...parsed.setup },
      streak: { ...EMPTY_PROGRESS.streak, ...parsed.streak },
    };
  } catch {
    return EMPTY_PROGRESS;
  }
}

export function saveProgress(progress: PlayProgress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // quota / private mode: progress just lives for this session
  }
}

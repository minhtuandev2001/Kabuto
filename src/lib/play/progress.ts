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

/** Today's totals for the daily quests; reset when `day` is not today. */
export type DailyLog = {
  day: number;
  correct: number;
  rounds: number;
  maxCombo: number;
  bossWins: number;
  threeStars: number;
  bestScore: number;
  claimed: string[];
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
  xp: number;
  daily: DailyLog;
  /** Best stars per journey stage, keyed by lesson number. */
  stages: Record<number, number>;
};

export const MAX_BOX = 5;
/** Days until the next review after landing in box N (index = box). */
export const BOX_INTERVAL_DAYS = [0, 1, 3, 7, 14, 30];
export const KNOWN_BOX = 4;

export const DEFAULT_SETUP: PlaySetup = { source: "lesson", lessons: [], levels: [], count: 20, mode: "choice" };

export const EMPTY_DAILY: DailyLog = {
  day: 0,
  correct: 0,
  rounds: 0,
  maxCombo: 0,
  bossWins: 0,
  threeStars: 0,
  bestScore: 0,
  claimed: [],
};

export const EMPTY_PROGRESS: PlayProgress = {
  koban: 0,
  streak: { day: 0, count: 0 },
  best: {},
  words: {},
  owned: [],
  equipped: null,
  muted: false,
  setup: DEFAULT_SETUP,
  xp: 0,
  daily: EMPTY_DAILY,
  stages: {},
};

/** XP needed to go from `level` to the next one. */
export function xpToNext(level: number) {
  return 100 + (level - 1) * 50;
}

export function levelFor(xp: number) {
  let level = 1;
  let into = Math.max(0, xp);
  while (into >= xpToNext(level)) {
    into -= xpToNext(level);
    level += 1;
  }
  return { level, into, need: xpToNext(level) };
}

type DailyStat = Exclude<keyof DailyLog, "day" | "claimed">;

export type Quest = { id: string; emoji: string; label: string; stat: DailyStat; target: number; reward: number };

export const QUESTS: Quest[] = [
  { id: "correct30", emoji: "✅", label: "Trả lời đúng 30 từ", stat: "correct", target: 30, reward: 20 },
  { id: "rounds3", emoji: "🎮", label: "Chơi 3 ván", stat: "rounds", target: 3, reward: 15 },
  { id: "combo10", emoji: "🔥", label: "Đạt combo 10", stat: "maxCombo", target: 10, reward: 25 },
  { id: "boss1", emoji: "👹", label: "Hạ gục 1 Boss Yokai", stat: "bossWins", target: 1, reward: 30 },
  { id: "stars3", emoji: "⭐", label: "Đạt 3 sao trong một ván", stat: "threeStars", target: 1, reward: 25 },
  { id: "score400", emoji: "🎯", label: "Ghi 400 điểm trong một ván", stat: "bestScore", target: 400, reward: 20 },
];

/** Three different quests per day, rotating day by day. */
export function todaysQuests(today: number) {
  const start = today % QUESTS.length;
  return [0, 2, 4].map((step) => QUESTS[(start + step) % QUESTS.length]!);
}

export function dailyFor(daily: DailyLog, today: number): DailyLog {
  return daily.day === today ? daily : { ...EMPTY_DAILY, day: today };
}

export function logRound(
  daily: DailyLog,
  today: number,
  round: { correct: number; maxCombo: number; score: number; bossWin: boolean; stars: number },
): DailyLog {
  const log = dailyFor(daily, today);
  return {
    ...log,
    correct: log.correct + round.correct,
    rounds: log.rounds + 1,
    maxCombo: Math.max(log.maxCombo, round.maxCombo),
    bossWins: log.bossWins + (round.bossWin ? 1 : 0),
    threeStars: log.threeStars + (round.stars === 3 ? 1 : 0),
    bestScore: Math.max(log.bestScore, round.score),
  };
}

export function questDone(daily: DailyLog, quest: Quest) {
  return daily[quest.stat] >= quest.target;
}

/** What a finished round earned, shown on the result screen. */
export type RoundMeta = {
  stars: number;
  xp: number;
  levelBefore: number;
  level: ReturnType<typeof levelFor>;
  quests: Quest[];
  /** Journey stage (lesson number) this round was played for. */
  stage?: { lesson: number; nextLesson?: number; unlocked: boolean };
};

const STAGE_GAMES: GameId[] = ["sushi", "tanuki", "ninja", "boss"];

/** Journey stages cycle through the games; every 4th stage is a boss. */
export function stageGame(index: number) {
  return STAGE_GAMES[index % STAGE_GAMES.length]!;
}

/** First stage is always open; the rest open once the stage before has a star. */
export function stageOpen(stages: Record<number, number>, order: number[], index: number) {
  return index === 0 || (stages[order[index - 1]!] ?? 0) > 0;
}

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
      daily: { ...EMPTY_DAILY, ...parsed.daily },
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

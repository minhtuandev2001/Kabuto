import { getHeadline } from "@/lib/catalog";
import type { VocabWord } from "@/lib/types";
import { canTypeWord } from "./kana";
import { isDue, wordKey, type AnswerMode, type GameId, type WordStat } from "./progress";

/** listen: hear it, pick meaning · word: see it, pick meaning · meaning: see meaning, pick word · type: type the reading */
export type PromptKind = "listen" | "word" | "meaning" | "type";

export type Question = {
  id: number;
  word: VocabWord;
  prompt: PromptKind;
  options: VocabWord[];
  /** Other words the prompt can't tell apart (type mode): their readings are accepted too. */
  alternates: VocabWord[];
};

export type GameRules = {
  id: GameId;
  name: string;
  emoji: string;
  tagline: string;
  howTo: string;
  /** Per-question time limit by answer mode; undefined = no limit. */
  questionMs?: Record<AnswerMode, number>;
  /** Whole-round time limit (Ninja). */
  roundSec?: number;
  hearts?: number;
  /** Missed words come back once at the end of the round. */
  retryWrong?: boolean;
  /** Missed words come back until answered (Boss: you must beat every word). */
  retryUntilCorrect?: boolean;
  /** Keep cycling the deck until time runs out. */
  endless?: boolean;
};

export const GAMES: GameRules[] = [
  {
    id: "sushi",
    name: "Neko Sushi Bar",
    emoji: "🍣",
    tagline: "Nghe từ, chộp đĩa sushi đúng nghĩa",
    howTo: "Neko gọi món bằng tiếng Nhật. Chọn đĩa có nghĩa đúng trước khi băng chuyền chạy mất.",
    questionMs: { choice: 10_000, type: 25_000 },
    retryWrong: true,
  },
  {
    id: "tanuki",
    name: "Đập Tanuki",
    emoji: "🦝",
    tagline: "Đọc nghĩa, đập đúng con tanuki",
    howTo: "Tanuki thò đầu lên cầm chữ. Đập con cầm từ đúng với nghĩa đang hiện.",
    questionMs: { choice: 8_000, type: 25_000 },
    retryWrong: true,
  },
  {
    id: "ninja",
    name: "Ninja 60 giây",
    emoji: "🥷",
    tagline: "Chém càng nhiều càng tốt trong 60 giây",
    howTo: "Không giới hạn câu, chỉ giới hạn thời gian. Trả lời đúng liên tục để nhân điểm.",
    roundSec: 60,
    endless: true,
  },
  {
    id: "boss",
    name: "Boss Yokai",
    emoji: "👹",
    tagline: "Mỗi từ đúng là một đòn đánh boss",
    howTo: "Boss có máu bằng số từ. Sai thì mất tim và từ đó quay lại đánh bạn. Hết 3 tim là thua.",
    hearts: 3,
    retryUntilCorrect: true,
  },
];

export function gameRules(id: GameId) {
  return GAMES.find((item) => item.id === id) ?? GAMES[0]!;
}

export function shuffle<T>(items: T[], random = Math.random): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** Due reviews first (weakest box first), then never-seen words, then the rest by soonest due. */
export function buildDeck(
  words: VocabWord[],
  stats: Record<string, WordStat>,
  count: number,
  today: number,
  random = Math.random,
): VocabWord[] {
  const due: VocabWord[] = [];
  const fresh: VocabWord[] = [];
  const later: VocabWord[] = [];
  for (const word of shuffle(words, random)) {
    const stat = stats[wordKey(word)];
    if (isDue(stat, today)) {
      due.push(word);
    } else if (!stat || stat.seen === 0) {
      fresh.push(word);
    } else {
      later.push(word);
    }
  }
  const box = (word: VocabWord) => stats[wordKey(word)]?.box ?? 0;
  const dueAt = (word: VocabWord) => stats[wordKey(word)]?.due ?? 0;
  due.sort((a, b) => box(a) - box(b));
  later.sort((a, b) => dueAt(a) - dueAt(b));
  const picked = [...due, ...fresh, ...later];
  return shuffle(count > 0 ? picked.slice(0, count) : picked, random);
}

export function playableWords(words: VocabWord[], mode: AnswerMode) {
  return mode === "type" ? words.filter(canTypeWord) : words;
}

export function pickPrompt(game: GameId, mode: AnswerMode, word: VocabWord, random = Math.random): PromptKind {
  if (mode === "type") {
    return "type";
  }
  const hasAudio = Boolean(word.audioUrl);
  if (game === "sushi") {
    return hasAudio ? "listen" : "word";
  }
  if (game === "tanuki") {
    return "meaning";
  }
  if (game === "ninja") {
    return "word";
  }
  const kinds: PromptKind[] = hasAudio ? ["listen", "word", "meaning"] : ["word", "meaning"];
  return kinds[Math.floor(random() * kinds.length)]!;
}

/** The text a choice button shows: meanings when asking for a meaning, the word itself otherwise. */
export function optionLabel(word: VocabWord, prompt: PromptKind) {
  return prompt === "meaning" ? getHeadline(word) : word.meaning;
}

const fold = (text: string) => text.trim().toLowerCase();

/** A distractor sharing the meaning, written form, or reading would also be a right answer. */
function isAmbiguous(item: VocabWord, word: VocabWord) {
  return (
    item === word ||
    fold(item.meaning) === fold(word.meaning) ||
    getHeadline(item) === getHeadline(word) ||
    fold(item.kana) === fold(word.kana)
  );
}

/** Kana-only words with the same meaning look identical in a type prompt (meaning only), so accept any of them. */
export function sameMeaningWords(word: VocabWord, pool: VocabWord[]) {
  if (word.kanji.trim()) {
    return [];
  }
  const meaning = fold(word.meaning);
  return pool.filter((item) => item !== word && fold(item.meaning) === meaning);
}

/** Correct word + distractors with distinct labels, same lesson first so options are actually confusable. */
export function buildOptions(
  word: VocabWord,
  prompt: PromptKind,
  deck: VocabWord[],
  pool: VocabWord[],
  size = 4,
  random = Math.random,
): VocabWord[] {
  const label = (item: VocabWord) => fold(optionLabel(item, prompt));
  const used = new Set([label(word)]);
  const picked: VocabWord[] = [word];
  const sameLesson = pool.filter((item) => item.lesson === word.lesson);
  for (const source of [sameLesson, deck, pool]) {
    for (const item of shuffle(source, random)) {
      if (picked.length >= size) {
        break;
      }
      const key = label(item);
      if (!key || used.has(key) || isAmbiguous(item, word)) {
        continue;
      }
      used.add(key);
      picked.push(item);
    }
  }
  return shuffle(picked, random);
}

export function questionScore(combo: number, hinted: boolean, secondsLeft: number) {
  const multiplier = 1 + Math.floor(combo / 5);
  return (hinted ? 5 : 10) * multiplier + Math.max(0, Math.ceil(secondsLeft));
}

export function kobanFor(result: { correct: number; maxCombo: number; outcome: RoundOutcome }) {
  const bonus = result.outcome === "win" ? 10 : result.outcome === "lose" ? 0 : 3;
  return result.correct + Math.floor(result.maxCombo / 5) * 2 + (result.correct > 0 ? bonus : 0);
}

export type RoundOutcome = "finish" | "win" | "lose" | "time" | "quit";

export type RoundResult = {
  game: GameId;
  mode: AnswerMode;
  outcome: RoundOutcome;
  score: number;
  correct: number;
  wrong: number;
  maxCombo: number;
  missed: VocabWord[];
  koban: number;
};

export const PRAISES = [
  { jp: "いいね!", vi: "Hay lắm!" },
  { jp: "すごい!", vi: "Giỏi quá!" },
  { jp: "やった!", vi: "Làm được rồi!" },
  { jp: "最高!", vi: "Tuyệt nhất!" },
  { jp: "完璧!", vi: "Hoàn hảo!" },
  { jp: "天才!", vi: "Thiên tài!" },
  { jp: "神!", vi: "Thánh luôn!" },
];

/** Praise at combo 3, 5, then every 5. */
export function praiseFor(combo: number) {
  if (combo !== 3 && (combo < 5 || combo % 5 !== 0)) {
    return null;
  }
  const tier = combo === 3 ? 0 : Math.min(PRAISES.length - 1, combo / 5);
  return PRAISES[tier]!;
}

export const BOSSES = [
  { emoji: "👹", name: "Oni" },
  { emoji: "👺", name: "Tengu" },
  { emoji: "👻", name: "Yūrei" },
  { emoji: "🦊", name: "Kitsune" },
  { emoji: "🐉", name: "Ryū" },
];

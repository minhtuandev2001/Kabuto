import { n3Lessons } from "./n3";
import { n4Lessons } from "./n4";
import { n5Lessons } from "./n5";
import type { GrammarLesson, JlptLevel } from "./types";

export type { GrammarExample, GrammarLesson, GrammarPoint, JlptLevel } from "./types";

const BY_LEVEL: Record<JlptLevel, GrammarLesson[]> = {
  N5: n5Lessons,
  N4: n4Lessons,
  N3: n3Lessons,
};

export const GRAMMAR_LEVELS: JlptLevel[] = ["N5", "N4", "N3"];

export function parseJlptParam(raw: string | undefined): JlptLevel | null {
  const value = raw?.trim().toUpperCase();
  if (value === "N5" || value === "N4" || value === "N3") {
    return value;
  }
  return null;
}

export function getGrammarLessons(level: JlptLevel): GrammarLesson[] {
  return BY_LEVEL[level];
}

export function getGrammarLesson(level: JlptLevel, lesson: number): GrammarLesson | undefined {
  return BY_LEVEL[level].find((item) => item.lesson === lesson);
}

export function getAdjacentGrammarLesson(level: JlptLevel, lesson: number, delta: 1 | -1) {
  const list = BY_LEVEL[level];
  const at = list.findIndex((item) => item.lesson === lesson);
  if (at < 0) {
    return undefined;
  }
  return list[at + delta];
}

export function grammarLessonCount(level: JlptLevel) {
  return BY_LEVEL[level].length;
}

export function allGrammarLessons() {
  return [...n5Lessons, ...n4Lessons, ...n3Lessons];
}

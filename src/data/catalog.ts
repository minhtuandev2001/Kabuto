import lessonsJson from '../../data/lessons.json';
import vocabJson from '../../data/minna-vocabulary.json';
import type { LessonInfo, VocabWord } from '../types';

export const lessons = lessonsJson as LessonInfo[];
export const allWords = vocabJson as VocabWord[];

const wordsByLesson = new Map<number, VocabWord[]>();

for (const word of allWords) {
  const list = wordsByLesson.get(word.lesson) ?? [];
  list.push(word);
  wordsByLesson.set(word.lesson, list);
}

for (const list of wordsByLesson.values()) {
  list.sort((a, b) => a.order - b.order);
}

export function getLesson(lesson: number): LessonInfo | undefined {
  return lessons.find((item) => item.lesson === lesson);
}

export function getWordsForLesson(lesson: number): VocabWord[] {
  return wordsByLesson.get(lesson) ?? [];
}

export function getAdjacentLesson(current: number, delta: 1 | -1): number | undefined {
  const ids = lessons.filter((item) => getWordsForLesson(item.lesson).length > 0).map((item) => item.lesson);
  const at = ids.indexOf(current);
  if (at < 0) {
    return undefined;
  }
  return ids[at + delta];
}

export function getHeadline(word: VocabWord): string {
  return word.kanji?.trim() ? word.kanji : word.kana;
}

export function formatLessonTitle(lesson: LessonInfo): string {
  const [jp] = lesson.title.split(' - ');
  return jp?.trim() || lesson.title;
}

export function formatLessonSubtitle(lesson: LessonInfo): string {
  const parts = lesson.title.split(' - ');
  return parts[1]?.trim() || lesson.book;
}

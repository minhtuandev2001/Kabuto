import type { LessonInfo, VocabWord } from "./types";

export type CatalogIndex = {
  lessons: LessonInfo[];
  allWords: VocabWord[];
  getLesson: (lesson: number) => LessonInfo | undefined;
  getWordsForLesson: (lesson: number) => VocabWord[];
  getAdjacentLesson: (current: number, delta: 1 | -1) => number | undefined;
  getUpcomingWord: (lessonId: number, index: number, loopLesson: boolean) => VocabWord | undefined;
  getAdjacentVideoLesson: (current: number, delta: 1 | -1) => number | undefined;
};

export function createCatalogIndex(lessonList: LessonInfo[], wordList: VocabWord[]): CatalogIndex {
  const lessons = [...lessonList].sort((a, b) => a.lesson - b.lesson);
  const wordsByLesson = new Map<number, VocabWord[]>();

  for (const word of wordList) {
    const list = wordsByLesson.get(word.lesson) ?? [];
    list.push(word);
    wordsByLesson.set(word.lesson, list);
  }
  for (const list of wordsByLesson.values()) {
    list.sort((a, b) => a.order - b.order);
  }

  const getLesson = (lesson: number) => lessons.find((item) => item.lesson === lesson);
  const getWordsForLesson = (lesson: number) => wordsByLesson.get(lesson) ?? [];
  const getAdjacentLesson = (current: number, delta: 1 | -1) => {
    const ids = lessons.filter((item) => getWordsForLesson(item.lesson).length > 0).map((item) => item.lesson);
    const at = ids.indexOf(current);
    if (at < 0) {
      return undefined;
    }
    return ids[at + delta];
  };
  const getUpcomingWord = (lessonId: number, index: number, loopLesson: boolean) => {
    const list = getWordsForLesson(lessonId);
    if (index + 1 < list.length) {
      return list[index + 1];
    }
    if (loopLesson) {
      return list[0];
    }
    const nextLesson = getAdjacentLesson(lessonId, 1);
    return nextLesson != null ? getWordsForLesson(nextLesson)[0] : undefined;
  };
  const getAdjacentVideoLesson = (current: number, delta: 1 | -1) => {
    const ids = lessons.map((item) => item.lesson);
    const at = ids.indexOf(current);
    if (at < 0) {
      return undefined;
    }
    return ids[at + delta];
  };

  return {
    lessons,
    allWords: wordList,
    getLesson,
    getWordsForLesson,
    getAdjacentLesson,
    getUpcomingWord,
    getAdjacentVideoLesson,
  };
}

export function getHeadline(word: VocabWord): string {
  return word.kanji?.trim() ? word.kanji : word.kana;
}

export function formatLessonTitle(lesson: LessonInfo): string {
  const [jp] = lesson.title.split(" - ");
  return jp?.trim() || lesson.title;
}

export function formatLessonSubtitle(lesson: LessonInfo): string {
  const parts = lesson.title.split(" - ");
  return parts[1]?.trim() || lesson.book;
}

export function wordImageSrc(word: VocabWord): string {
  return word.imageUrl?.trim() || "";
}

/** Temporary: one YouTube playlist until each lesson has its own lecture video. */
export const LECTURE_PLAYLIST_ID = "PLbBhikLbVlB2oefhXhaUPxq8ECCjbgrx2";
export const LECTURE_FALLBACK_VIDEO_ID = "YBI4nM5HC4c";

export function lectureThumbUrl(kind: "mq" | "hq" | "hq720" = "mq"): string {
  const file = kind === "hq720" ? "hq720.jpg" : kind === "hq" ? "hqdefault.jpg" : "mqdefault.jpg";
  return `https://i.ytimg.com/vi/${LECTURE_FALLBACK_VIDEO_ID}/${file}`;
}

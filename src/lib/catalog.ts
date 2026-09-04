import type { LessonInfo, VocabWord } from "./types";
import { cloudinaryDisplayUrl, WORD_IMAGE_PLAYER } from "./media";

export type CatalogIndex = {
  lessons: LessonInfo[];
  allWords: VocabWord[];
  getLesson: (lesson: number) => LessonInfo | undefined;
  getWordsForLesson: (lesson: number) => VocabWord[];
  getAdjacentLesson: (current: number, delta: 1 | -1) => number | undefined;
  getUpcomingWord: (lessonId: number, index: number, loopLesson: boolean) => VocabWord | undefined;
  getUpcomingWords: (lessonId: number, index: number, loopLesson: boolean, count: number) => VocabWord[];
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
  const getUpcomingWords = (lessonId: number, index: number, loopLesson: boolean, count: number) => {
    const result: VocabWord[] = [];
    if (count <= 0) {
      return result;
    }
    let lid = lessonId;
    let i = index;
    let hops = 0;
    while (result.length < count && hops < 4000) {
      hops += 1;
      const list = getWordsForLesson(lid);
      if (!list.length) {
        break;
      }
      i += 1;
      if (i < list.length) {
        result.push(list[i]);
        continue;
      }
      if (loopLesson) {
        lid = lessonId;
        i = -1;
        continue;
      }
      const nextId = getAdjacentLesson(lid, 1);
      if (nextId == null) {
        break;
      }
      lid = nextId;
      i = -1;
    }
    return result;
  };

  return {
    lessons,
    allWords: wordList,
    getLesson,
    getWordsForLesson,
    getAdjacentLesson,
    getUpcomingWord,
    getUpcomingWords,
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

export function wordImageSrc(word: VocabWord, width = WORD_IMAGE_PLAYER): string {
  return cloudinaryDisplayUrl(word.imageUrl?.trim() || "", width);
}

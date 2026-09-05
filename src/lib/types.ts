export type VocabWord = {
  lesson: number;
  order: number;
  kana: string;
  kanji: string;
  romaji: string;
  sinoVietnamese: string;
  meaning: string;
  audioUrl: string;
  imageUrl?: string;
  custom?: boolean;
};

export type LessonInfo = {
  lesson: number;
  title: string;
  book: string;
  jlpt: string;
  custom?: boolean;
};

/** Full-page vocab sheet images for a lesson (N3+ Mimikara-style study). */
export type LessonImage = {
  lesson: number;
  order: number;
  imageUrl: string;
};

/** Full-page grammar sheet images keyed by grammar (jlpt, lesson). */
export type GrammarImage = {
  jlpt: string;
  lesson: number;
  order: number;
  imageUrl: string;
};

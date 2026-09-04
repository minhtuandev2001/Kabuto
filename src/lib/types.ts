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

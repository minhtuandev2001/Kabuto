export const JLPT_LEVELS = ["N5", "N4", "N3", "N2", "N1"] as const;
export type JlptLevel = (typeof JLPT_LEVELS)[number];

export type GrammarExample = {
  jp: string;
  vi: string;
};

export type GrammarInput = {
  lesson?: number;
  jlpt?: string;
  grammarLesson?: number;
  pattern: string;
  meaning: string;
  form?: string;
  note?: string;
  examples?: GrammarExample[];
};

export type GrammarPoint = {
  id?: string;
  dbId?: number;
  pattern: string;
  meaning: string;
  form?: string;
  note?: string;
  examples: GrammarExample[];
  custom?: boolean;
};

export type GrammarLesson = {
  jlpt: string;
  lesson: number;
  title: string;
  subtitle: string;
  points: GrammarPoint[];
  catalogLesson?: number | null;
  custom?: boolean;
};

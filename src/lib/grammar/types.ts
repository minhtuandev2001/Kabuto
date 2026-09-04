export type JlptLevel = "N5" | "N4" | "N3";

export type GrammarExample = {
  jp: string;
  vi: string;
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

export type JlptLevel = "N5" | "N4" | "N3";

export type GrammarExample = {
  jp: string;
  vi: string;
};

export type GrammarPoint = {
  pattern: string;
  meaning: string;
  form?: string;
  note?: string;
  examples: GrammarExample[];
};

export type GrammarLesson = {
  jlpt: JlptLevel;
  lesson: number;
  title: string;
  subtitle: string;
  points: GrammarPoint[];
};

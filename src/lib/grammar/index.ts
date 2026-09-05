import { JLPT_LEVELS, type GrammarExample, type GrammarLesson, type GrammarPoint, type JlptLevel } from "./types";

export { JLPT_LEVELS } from "./types";
export type { GrammarExample, GrammarInput, GrammarLesson, GrammarPoint, JlptLevel } from "./types";

export const LAST_GRAMMAR_KEY = "lj-last-grammar";

export type GrammarLessonRow = {
  jlpt: string;
  lesson: number;
  title: string;
  subtitle: string;
  catalog_lesson: number | null;
  source: string;
};

export type GrammarPointRow = {
  id: number;
  jlpt: string;
  lesson: number;
  sort: number;
  pattern: string;
  meaning: string;
  form: string;
  note: string;
  examples: GrammarExample[] | string;
  source: string;
};

const JLPT_CATALOG = [
  { jlpt: "N5", offset: 0, count: 25 },
  { jlpt: "N4", offset: 25, count: 25 },
  { jlpt: "N3", offset: 50, count: 12 },
  // ponytail: N2 stays at 66 — gap 63–65 from old N3 13–15. Shift N2/N1 if catalog must be dense.
  { jlpt: "N2", offset: 65, count: 20 },
  { jlpt: "N1", offset: 85, count: 15 },
] as const;

export function catalogLessonForBuiltin(jlpt: string, lesson: number): number | null {
  const band = JLPT_CATALOG.find((item) => item.jlpt === jlpt);
  if (!band || !Number.isInteger(lesson) || lesson < 1 || lesson > band.count) {
    return null;
  }
  return lesson + band.offset;
}

export function builtinSlotFromCatalog(catalogLesson: number) {
  if (!Number.isInteger(catalogLesson) || catalogLesson < 1) {
    return null;
  }
  for (const band of JLPT_CATALOG) {
    const lesson = catalogLesson - band.offset;
    if (lesson >= 1 && lesson <= band.count) {
      return { jlpt: band.jlpt, lesson, catalogLesson };
    }
  }
  return null;
}

export function isJlptLevel(value: string): value is JlptLevel {
  return JLPT_LEVELS.some((level) => level === value);
}

export function parseJlptParam(raw: string | undefined): JlptLevel | null {
  const value = raw?.trim().toUpperCase() ?? "";
  return isJlptLevel(value) ? value : null;
}

export function grammarHref(item: GrammarLesson) {
  if (item.custom) {
    return `/grammar/custom/${item.catalogLesson ?? item.lesson}`;
  }
  return `/grammar/${item.jlpt.toLowerCase()}/${item.lesson}`;
}

export function grammarImagesHref(item: GrammarLesson) {
  return `${grammarHref(item)}/images`;
}

/** N3+ study from sheet images; N5/N4 stay text/audio. */
export function isImageLedJlpt(jlpt: string) {
  const key = jlpt.trim().toUpperCase();
  return key === "N3" || key === "N2" || key === "N1";
}

export function findGrammarLesson(list: GrammarLesson[], jlpt: string, lesson: number) {
  const jlptKey = jlpt.trim().toUpperCase();
  return list.find((item) => item.jlpt.toUpperCase() === jlptKey && item.lesson === lesson);
}

export function findGrammarByCatalogLesson(list: GrammarLesson[], catalogLesson: number) {
  return list.find(
    (item) => item.catalogLesson === catalogLesson || (item.custom && item.lesson === catalogLesson),
  );
}

export function adjacentGrammarLesson(list: GrammarLesson[], current: GrammarLesson, delta: 1 | -1) {
  const same = list.filter((item) => item.jlpt === current.jlpt && Boolean(item.custom) === Boolean(current.custom));
  const at = same.findIndex((item) => item.lesson === current.lesson);
  return at < 0 ? undefined : same[at + delta];
}

function parseExamples(value: GrammarExample[] | string): GrammarExample[] {
  try {
    const parsed = typeof value === "string" ? (JSON.parse(value) as unknown) : value;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null;
        }
        const row = item as { jp?: unknown; vi?: unknown };
        const jp = typeof row.jp === "string" ? row.jp.trim() : "";
        const vi = typeof row.vi === "string" ? row.vi.trim() : "";
        return jp ? { jp, vi } : null;
      })
      .filter((item): item is GrammarExample => Boolean(item));
  } catch {
    return [];
  }
}

export function toGrammarPoint(row: GrammarPointRow): GrammarPoint {
  return {
    id: String(row.id),
    dbId: Number(row.id),
    pattern: row.pattern,
    meaning: row.meaning,
    form: row.form || undefined,
    note: row.note || undefined,
    examples: parseExamples(row.examples),
    custom: row.source !== "seed",
  };
}

function jlptRank(jlpt: string) {
  const index = JLPT_LEVELS.indexOf(jlpt as JlptLevel);
  return index < 0 ? JLPT_LEVELS.length + 1 : index + 1;
}

export function assembleGrammarLessons(lessonRows: GrammarLessonRow[], pointRows: GrammarPointRow[]): GrammarLesson[] {
  const pointsByKey = new Map<string, GrammarPointRow[]>();
  for (const row of pointRows) {
    const key = `${row.jlpt}:${row.lesson}`;
    const list = pointsByKey.get(key) ?? [];
    list.push(row);
    pointsByKey.set(key, list);
  }
  return [...lessonRows]
    .sort((a, b) => jlptRank(a.jlpt) - jlptRank(b.jlpt) || a.lesson - b.lesson)
    .map((row) => {
      const points = (pointsByKey.get(`${row.jlpt}:${row.lesson}`) ?? []).sort(
        (a, b) => a.sort - b.sort || a.id - b.id,
      );
      return {
        jlpt: row.jlpt,
        lesson: Number(row.lesson),
        title: row.title,
        subtitle: row.subtitle || "",
        catalogLesson: row.catalog_lesson == null ? null : Number(row.catalog_lesson),
        custom: row.source !== "seed",
        points: points.map(toGrammarPoint),
      };
    });
}

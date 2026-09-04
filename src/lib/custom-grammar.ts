import { formatLessonSubtitle, formatLessonTitle } from "@/lib/catalog";
import { ensureSchema, getSql } from "@/lib/db";
import {
  assembleGrammarLessons,
  builtinSlotFromCatalog,
  toGrammarPoint,
  type GrammarExample,
  type GrammarInput,
  type GrammarLessonRow,
  type GrammarPointRow,
} from "@/lib/grammar";
import type { LessonInfo } from "@/lib/types";

export type { GrammarInput } from "@/lib/grammar";

export async function listGrammarLessons() {
  await ensureSchema();
  const sql = getSql();
  const lessons = (await sql`
    SELECT jlpt, lesson, title, subtitle, catalog_lesson, source
    FROM grammar_lessons
  `) as GrammarLessonRow[];
  const points = (await sql`
    SELECT id, jlpt, lesson, sort, pattern, meaning, form, note, examples, source
    FROM grammar_points
  `) as GrammarPointRow[];
  return assembleGrammarLessons(lessons, points);
}

function cleanPoint(input: {
  pattern: string;
  meaning: string;
  form?: string;
  note?: string;
  examples?: GrammarExample[];
}) {
  const pattern = input.pattern.trim();
  const meaning = input.meaning.trim();
  if (!pattern || !meaning) {
    throw new Error("Nhập mẫu ngữ pháp và nghĩa");
  }
  const examples = (input.examples ?? [])
    .map((item) => ({ jp: item.jp.trim(), vi: item.vi.trim() }))
    .filter((item) => item.jp);
  if (!examples.length) {
    throw new Error("Nhập ít nhất một ví dụ tiếng Nhật");
  }
  return {
    pattern,
    meaning,
    form: input.form?.trim() || "",
    note: input.note?.trim() || "",
    examples,
  };
}

function slotFromCatalog(info: LessonInfo) {
  const builtin = builtinSlotFromCatalog(info.lesson);
  if (builtin) {
    return { ...builtin, source: "seed" as const };
  }
  return {
    jlpt: info.jlpt?.trim() || "Tự soạn",
    lesson: info.lesson,
    catalogLesson: info.lesson,
    source: "user" as const,
  };
}

async function resolveTarget(input: GrammarInput) {
  const sql = getSql();
  const jlpt = input.jlpt?.trim();
  const grammarLesson = Number(input.grammarLesson);
  if (jlpt && Number.isFinite(grammarLesson) && grammarLesson >= 1) {
    const existing = (await sql`
      SELECT jlpt, lesson, title, subtitle, catalog_lesson, source
      FROM grammar_lessons
      WHERE jlpt = ${jlpt} AND lesson = ${grammarLesson}
      LIMIT 1
    `) as GrammarLessonRow[];
    if (!existing[0]) {
      throw new Error("Không tìm thấy bài ngữ pháp");
    }
    return existing[0];
  }

  const catalogLesson = Number(input.lesson);
  if (!Number.isFinite(catalogLesson) || catalogLesson < 1) {
    throw new Error("Chưa có bài học. Hãy tạo bài học trước.");
  }
  const titleRow = (await sql`
    SELECT lesson, title, book, jlpt FROM minna_lessons WHERE lesson = ${catalogLesson}
    UNION ALL
    SELECT lesson, title, book, jlpt FROM custom_lessons WHERE lesson = ${catalogLesson}
    LIMIT 1
  `) as { lesson: number; title: string; book: string; jlpt: string }[];
  if (!titleRow[0]) {
    throw new Error("Chưa có bài học. Hãy tạo bài học trước.");
  }
  const byCatalog = (await sql`
    SELECT jlpt, lesson, title, subtitle, catalog_lesson, source
    FROM grammar_lessons
    WHERE catalog_lesson = ${catalogLesson}
    LIMIT 1
  `) as GrammarLessonRow[];
  if (byCatalog[0]) {
    return byCatalog[0];
  }

  const info: LessonInfo = {
    lesson: catalogLesson,
    title: titleRow[0].title,
    book: titleRow[0].book,
    jlpt: titleRow[0].jlpt,
  };
  const slot = slotFromCatalog(info);
  await sql`
    INSERT INTO grammar_lessons (jlpt, lesson, title, subtitle, catalog_lesson, source)
    VALUES (
      ${slot.jlpt}, ${slot.lesson}, ${formatLessonTitle(info)}, ${formatLessonSubtitle(info)},
      ${slot.catalogLesson}, ${slot.source}
    )
    ON CONFLICT (jlpt, lesson) DO NOTHING
  `;
  const created = (await sql`
    SELECT jlpt, lesson, title, subtitle, catalog_lesson, source
    FROM grammar_lessons
    WHERE jlpt = ${slot.jlpt} AND lesson = ${slot.lesson}
    LIMIT 1
  `) as GrammarLessonRow[];
  return created[0];
}

export async function insertGrammarPoint(input: GrammarInput) {
  const data = cleanPoint(input);
  await ensureSchema();
  const target = await resolveTarget(input);
  const sql = getSql();
  const maxSort = (await sql`
    SELECT COALESCE(MAX(sort), -1)::int AS n
    FROM grammar_points
    WHERE jlpt = ${target.jlpt} AND lesson = ${target.lesson}
  `) as { n: number }[];
  const sort = (maxSort[0]?.n ?? -1) + 1;
  const examplesJson = JSON.stringify(data.examples);
  const rows = (await sql`
    INSERT INTO grammar_points (
      jlpt, lesson, sort, pattern, meaning, form, note, examples, source
    )
    VALUES (
      ${target.jlpt}, ${target.lesson}, ${sort}, ${data.pattern}, ${data.meaning},
      ${data.form}, ${data.note}, ${examplesJson}::jsonb, 'user'
    )
    RETURNING id, jlpt, lesson, sort, pattern, meaning, form, note, examples, source
  `) as GrammarPointRow[];
  return { point: toGrammarPoint(rows[0]), jlpt: target.jlpt, lesson: Number(target.lesson) };
}

export async function updateGrammarPoint(id: number, input: GrammarInput) {
  const data = cleanPoint(input);
  await ensureSchema();
  const sql = getSql();
  const examplesJson = JSON.stringify(data.examples);
  const rows = (await sql`
    UPDATE grammar_points
    SET pattern = ${data.pattern},
        meaning = ${data.meaning},
        form = ${data.form},
        note = ${data.note},
        examples = ${examplesJson}::jsonb
    WHERE id = ${id}
    RETURNING id, jlpt, lesson, sort, pattern, meaning, form, note, examples, source
  `) as GrammarPointRow[];
  if (!rows[0]) {
    throw new Error("Không tìm thấy mẫu ngữ pháp");
  }
  return toGrammarPoint(rows[0]);
}

export async function deleteGrammarPoint(id: number) {
  await ensureSchema();
  const sql = getSql();
  const deleted = (await sql`
    DELETE FROM grammar_points
    WHERE id = ${id}
    RETURNING id
  `) as { id: number }[];
  if (!deleted.length) {
    throw new Error("Không tìm thấy mẫu ngữ pháp");
  }
}

export async function deleteGrammarForCatalogLesson(catalogLesson: number) {
  await ensureSchema();
  const sql = getSql();
  await sql`
    DELETE FROM grammar_points
    WHERE source = 'user'
      AND (jlpt, lesson) IN (
        SELECT jlpt, lesson FROM grammar_lessons WHERE catalog_lesson = ${catalogLesson}
      )
  `;
  await sql`
    DELETE FROM grammar_lessons
    WHERE catalog_lesson = ${catalogLesson} AND source = 'user'
  `;
}

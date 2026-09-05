import { deleteGrammarForCatalogLesson } from "@/lib/custom-grammar";
import { ensureSchema, getSql } from "@/lib/db";
import { deleteLessonImagesForLesson, listLessonImages } from "@/lib/lesson-images";
import type { LessonInfo, VocabWord } from "@/lib/types";

type LessonRow = {
  lesson: number;
  title: string;
  book: string;
  jlpt: string;
};

type WordRow = {
  lesson: number;
  order: number;
  kana: string;
  kanji: string;
  romaji: string;
  sino_vietnamese: string;
  meaning: string;
  audio_url: string;
  image_url: string;
};

function toLesson(row: LessonRow, custom: boolean): LessonInfo {
  return {
    lesson: Number(row.lesson),
    title: row.title,
    book: row.book,
    jlpt: row.jlpt,
    custom,
  };
}

function toWord(row: WordRow, custom: boolean): VocabWord {
  return {
    lesson: Number(row.lesson),
    order: Number(row.order),
    kana: row.kana,
    kanji: row.kanji || "",
    romaji: row.romaji || "",
    sinoVietnamese: row.sino_vietnamese || "",
    meaning: row.meaning,
    audioUrl: row.audio_url || "",
    imageUrl: row.image_url || "",
    custom,
  };
}

export async function listCustomCatalog() {
  await ensureSchema();
  const sql = getSql();
  const lessons = (await sql`
    SELECT lesson, title, book, jlpt
    FROM custom_lessons
    ORDER BY lesson
  `) as LessonRow[];
  const words = (await sql`
    SELECT lesson, "order", kana, kanji, romaji, sino_vietnamese, meaning, audio_url, image_url
    FROM custom_words
    ORDER BY lesson, "order"
  `) as WordRow[];
  return {
    lessons: lessons.map((row) => toLesson(row, true)),
    words: words.map((row) => toWord(row, true)),
  };
}

export async function listMinnaCatalog() {
  const sql = getSql();
  const lessons = (await sql`
    SELECT lesson, title, book, jlpt
    FROM minna_lessons
    ORDER BY lesson
  `) as LessonRow[];
  const words = (await sql`
    SELECT lesson, "order", kana, kanji, romaji, sino_vietnamese, meaning, audio_url, image_url
    FROM minna_words
    ORDER BY lesson, "order"
  `) as WordRow[];
  return {
    lessons: lessons.map((row) => toLesson(row, false)),
    words: words.map((row) => toWord(row, false)),
  };
}

export async function listFullCatalog() {
  const [minna, custom, lessonImages] = await Promise.all([
    listMinnaCatalog(),
    listCustomCatalog(),
    listLessonImages(),
  ]);
  return {
    lessons: [...minna.lessons, ...custom.lessons],
    words: [...minna.words, ...custom.words],
    lessonImages,
  };
}

export async function insertCustomLesson(input: { title: string; book?: string; jlpt?: string }) {
  const title = input.title.trim();
  if (!title) {
    throw new Error("Nhập tên bài học");
  }
  const catalog = await listFullCatalog();
  const max = catalog.lessons.reduce((high, item) => Math.max(high, item.lesson), 0);
  const lesson: LessonInfo = {
    lesson: max + 1,
    title,
    book: input.book?.trim() || "Tự soạn",
    jlpt: input.jlpt?.trim() || "Tự soạn",
    custom: true,
  };
  const sql = getSql();
  await sql`
    INSERT INTO custom_lessons (lesson, title, book, jlpt)
    VALUES (${lesson.lesson}, ${lesson.title}, ${lesson.book}, ${lesson.jlpt})
  `;
  return lesson;
}

export async function importCustomLessons(
  inputs: { row?: number; title: string; book?: string; jlpt?: string; lesson?: number }[],
) {
  await ensureSchema();
  if (!inputs.length) {
    return { created: [] as LessonInfo[], errors: [] as { row: number; message: string }[] };
  }
  const sql = getSql();
  const existing = (await sql`SELECT lesson FROM custom_lessons`) as { lesson: number }[];
  for (const item of existing) {
    await deleteCustomLesson(item.lesson);
  }

  const catalog = await listFullCatalog();
  const taken = new Set(catalog.lessons.map((item) => item.lesson));
  let next = (catalog.lessons.reduce((high, item) => Math.max(high, item.lesson), 0) || 0) + 1;
  const created: LessonInfo[] = [];
  const errors: { row: number; message: string }[] = [];
  for (let i = 0; i < inputs.length; i += 1) {
    const input = inputs[i];
    const row = input.row ?? i + 2;
    try {
      const title = input.title.trim();
      let num = input.lesson;
      if (num != null) {
        if (taken.has(num)) {
          throw new Error(`Bài ${num} đã có`);
        }
      } else {
        while (taken.has(next)) {
          next += 1;
        }
        num = next;
      }
      const lesson: LessonInfo = {
        lesson: num,
        title,
        book: input.book?.trim() || "Tự soạn",
        jlpt: input.jlpt?.trim() || "Tự soạn",
        custom: true,
      };
      await sql`
        INSERT INTO custom_lessons (lesson, title, book, jlpt)
        VALUES (${lesson.lesson}, ${lesson.title}, ${lesson.book}, ${lesson.jlpt})
      `;
      taken.add(num);
      next = Math.max(next, num) + 1;
      created.push(lesson);
    } catch (error) {
      errors.push({ row, message: error instanceof Error ? error.message : "Không thêm được bài" });
    }
  }
  return { created, errors };
}

export async function insertCustomWord(input: {
  lesson: number;
  kana: string;
  meaning: string;
  kanji?: string;
  romaji?: string;
  sinoVietnamese?: string;
  audioUrl?: string;
  imageUrl?: string;
}) {
  const catalog = await listFullCatalog();
  if (!catalog.lessons.some((item) => item.lesson === input.lesson)) {
    throw new Error("Chưa có bài học. Hãy tạo bài học trước.");
  }
  const kana = input.kana.trim();
  const meaning = input.meaning.trim();
  if (!kana || !meaning) {
    throw new Error("Nhập hiragana/katakana và nghĩa");
  }
  const existing = catalog.words.filter((word) => word.lesson === input.lesson);
  const order = existing.reduce((high, word) => Math.max(high, word.order), 0) + 1;
  const word: VocabWord = {
    lesson: input.lesson,
    order,
    kana,
    kanji: input.kanji?.trim() || "",
    romaji: input.romaji?.trim() || "",
    sinoVietnamese: input.sinoVietnamese?.trim() || "",
    meaning,
    audioUrl: input.audioUrl?.trim() || "",
    imageUrl: input.imageUrl?.trim() || "",
    custom: true,
  };
  const sql = getSql();
  await sql`
    INSERT INTO custom_words (
      lesson, "order", kana, kanji, romaji, sino_vietnamese, meaning, audio_url, image_url
    )
    VALUES (
      ${word.lesson}, ${word.order}, ${word.kana}, ${word.kanji}, ${word.romaji},
      ${word.sinoVietnamese}, ${word.meaning}, ${word.audioUrl}, ${word.imageUrl}
    )
  `;
  return word;
}

export async function importCustomWords(
  inputs: {
    row?: number;
    lesson: number;
    kana: string;
    meaning: string;
    kanji?: string;
    romaji?: string;
    sinoVietnamese?: string;
    audioUrl?: string;
    imageUrl?: string;
  }[],
) {
  await ensureSchema();
  if (!inputs.length) {
    return { created: [] as VocabWord[], errors: [] as { row: number; message: string }[] };
  }
  const sql = getSql();
  const catalog = await listFullCatalog();
  const lessonOk = new Set(catalog.lessons.map((item) => item.lesson));
  const errors: { row: number; message: string }[] = [];
  const byLesson = new Map<number, VocabWord[]>();

  for (let i = 0; i < inputs.length; i += 1) {
    const input = inputs[i];
    const row = input.row ?? i + 2;
    if (!lessonOk.has(input.lesson)) {
      errors.push({ row, message: `Chưa có bài học ${input.lesson}` });
      continue;
    }
    const kana = input.kana.trim();
    const meaning = input.meaning.trim();
    if (!kana || !meaning) {
      errors.push({
        row,
        message: `Thiếu ${[!kana ? "hiragana/katakana" : "", !meaning ? "meaning" : ""].filter(Boolean).join(" và ")}`,
      });
      continue;
    }
    const list = byLesson.get(input.lesson) ?? [];
    list.push({
      lesson: input.lesson,
      order: list.length + 1,
      kana,
      kanji: input.kanji?.trim() || "",
      romaji: input.romaji?.trim() || "",
      sinoVietnamese: input.sinoVietnamese?.trim() || "",
      meaning,
      audioUrl: input.audioUrl?.trim() || "",
      imageUrl: input.imageUrl?.trim() || "",
      custom: true,
    });
    byLesson.set(input.lesson, list);
  }

  const created: VocabWord[] = [];
  for (const [lesson, words] of byLesson) {
    // One HTTP transaction: avoid interleaved delete/insert from a second import request.
    await sql.transaction((tx) => [
      tx`DELETE FROM custom_words WHERE lesson = ${lesson}`,
      tx`DELETE FROM minna_words WHERE lesson = ${lesson}`,
      ...words.map(
        (word) => tx`
          INSERT INTO custom_words (
            lesson, "order", kana, kanji, romaji, sino_vietnamese, meaning, audio_url, image_url
          )
          VALUES (
            ${word.lesson}, ${word.order}, ${word.kana}, ${word.kanji}, ${word.romaji},
            ${word.sinoVietnamese}, ${word.meaning}, ${word.audioUrl}, ${word.imageUrl}
          )
        `,
      ),
    ]);
    created.push(...words);
  }
  return { created, errors };
}

export async function deleteCustomLesson(lesson: number) {
  await ensureSchema();
  const sql = getSql();
  const deleted = (await sql`
    DELETE FROM custom_lessons
    WHERE lesson = ${lesson}
    RETURNING lesson
  `) as { lesson: number }[];
  if (!deleted.length) {
    throw new Error("Không tìm thấy bài tự soạn");
  }
  await sql`DELETE FROM custom_words WHERE lesson = ${lesson}`;
  await deleteLessonImagesForLesson(lesson);
  await deleteGrammarForCatalogLesson(lesson);
}

export async function deleteCustomWord(lesson: number, order: number) {
  await ensureSchema();
  const sql = getSql();
  const deleted = (await sql`
    DELETE FROM custom_words
    WHERE lesson = ${lesson} AND "order" = ${order}
    RETURNING lesson
  `) as { lesson: number }[];
  if (!deleted.length) {
    throw new Error("Không tìm thấy từ tự soạn");
  }
}

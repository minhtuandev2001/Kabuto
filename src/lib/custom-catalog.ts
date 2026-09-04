import { ensureSchema, getSql } from "@/lib/db";
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
  const [minna, custom] = await Promise.all([listMinnaCatalog(), listCustomCatalog()]);
  return {
    lessons: [...minna.lessons, ...custom.lessons],
    words: [...minna.words, ...custom.words],
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
    throw new Error("Nhập kana và nghĩa");
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

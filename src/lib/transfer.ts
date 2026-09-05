import { csvObjects, parseCsv, toCsv } from "./csv";

export const TRANSFER_KINDS = ["lessons", "words", "grammar"] as const;
export type TransferKind = (typeof TRANSFER_KINDS)[number];

export const TRANSFER_LIMIT = 500;

const HEADER_KEY: Record<string, string> = {
  title: "title",
  book: "book",
  jlpt: "jlpt",
  lesson: "lesson",
  bai: "lesson",
  sobai: "lesson",
  kana: "kana",
  hiragana: "kana",
  katakana: "kana",
  hiraganakatakana: "kana",
  cachdoc: "kana",
  reading: "kana",
  kanji: "kanji",
  hantu: "kanji",
  romaji: "romaji",
  sinovietnamese: "sinoVietnamese",
  hanviet: "sinoVietnamese",
  meaning: "meaning",
  nghia: "meaning",
  ynghia: "meaning",
  gloss: "meaning",
  audiourl: "audioUrl",
  audio: "audioUrl",
  imageurl: "imageUrl",
  image: "imageUrl",
  anh: "imageUrl",
  pattern: "pattern",
  mau: "pattern",
  form: "form",
  note: "note",
  ghichu: "note",
  examplejp: "exampleJp",
  examplevi: "exampleVi",
  vidujp: "exampleJp",
  viduvi: "exampleVi",
  grammarlesson: "grammarLesson",
};

function foldHeader(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[／|]+/g, "/")
    .replace(/[\s_/\-]+/g, "");
}

function normHeader(raw: string) {
  return HEADER_KEY[foldHeader(raw)] ?? "";
}

export const SAMPLE_ROWS: Record<TransferKind, string[][]> = {
  lessons: [
    ["lesson", "title", "book", "jlpt"],
    ["", "Chào hỏi buổi sáng", "Tự soạn", "N5"],
    ["", "Gia đình", "Tự soạn", "N5"],
  ],
  words: [
    ["lesson", "hiragana/katakana", "kanji", "romaji", "sinoVietnamese", "meaning", "audioUrl", "imageUrl"],
    ["101", "おはよう", "お早う", "ohayou", "", "chào buổi sáng", "", ""],
    ["101", "コーヒー", "", "koohii", "", "cà phê", "", ""],
  ],
  grammar: [
    ["lesson", "pattern", "meaning", "form", "note", "exampleJp", "exampleVi"],
    ["101", "〜たい", "muốn làm", "V-ます + たい", "", "寿司が食べたいです。", "Tôi muốn ăn sushi."],
  ],
};

export const SAMPLE_FILES: Record<TransferKind, string> = {
  lessons: "mau-bai-hoc.xlsx",
  words: "mau-tu-vung.xlsx",
  grammar: "mau-ngu-phap.xlsx",
};

export function isTransferKind(value: string): value is TransferKind {
  return TRANSFER_KINDS.some((kind) => kind === value);
}

function mappedRows(text: string): Record<string, string>[] {
  const table = parseCsv(text);
  if (!table.length) {
    return [];
  }
  const header = table[0].map(normHeader);
  if (!header.some(Boolean)) {
    throw new Error("Không nhận ra tiêu đề cột. Hãy tải file mẫu.");
  }
  return csvObjects([header, ...table.slice(1)]);
}

export type RowError = { row: number; message: string };

function lineNo(index: number) {
  return index + 2;
}

export function parseLessonImport(text: string) {
  const errors: RowError[] = [];
  const rows = mappedRows(text)
    .map((item, index) => {
      const row = lineNo(index);
      const title = item.title?.trim() ?? "";
      if (!title) {
        errors.push({ row, message: "Thiếu title" });
        return null;
      }
      const rawLesson = item.lesson?.trim() ?? "";
      let lesson: number | undefined;
      if (rawLesson) {
        lesson = Number(rawLesson);
        if (!Number.isInteger(lesson) || lesson < 1) {
          errors.push({ row, message: "lesson phải là số bài, hoặc để trống để gán tự động" });
          return null;
        }
      }
      return { row, title, book: item.book, jlpt: item.jlpt, lesson };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  return { rows, errors };
}

export function parseWordImport(text: string) {
  const table = parseCsv(text);
  if (!table.length) {
    return { rows: [], errors: [] as RowError[] };
  }
  const header = table[0].map(normHeader);
  if (!header.includes("lesson") || !header.includes("kana") || !header.includes("meaning")) {
    throw new Error(
      "File từ vựng cần cột lesson, hiragana/katakana (hoặc kana) và meaning. Hãy tải lại File mẫu, giữ nguyên tên cột.",
    );
  }
  const errors: RowError[] = [];
  const rows = csvObjects([header, ...table.slice(1)])
    .map((item, index) => {
      const lesson = Number(item.lesson);
      const kana = item.kana?.trim() ?? "";
      const meaning = item.meaning?.trim() ?? "";
      const row = lineNo(index);
      if (!Number.isInteger(lesson) || lesson < 1) {
        errors.push({ row, message: "lesson phải là số bài đã có" });
        return null;
      }
      if (!kana || !meaning) {
        const miss = [!kana ? "hiragana/katakana" : "", !meaning ? "meaning" : ""].filter(Boolean).join(" và ");
        errors.push({ row, message: `Thiếu ${miss}` });
        return null;
      }
      return {
        row,
        lesson,
        kana,
        meaning,
        kanji: item.kanji,
        romaji: item.romaji,
        sinoVietnamese: item.sinoVietnamese,
        audioUrl: item.audioUrl,
        imageUrl: item.imageUrl,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  return { rows, errors };
}

export function parseGrammarImport(text: string) {
  const errors: RowError[] = [];
  const rows = mappedRows(text)
    .map((item, index) => {
      const lesson = Number(item.lesson);
      const pattern = item.pattern?.trim() ?? "";
      const meaning = item.meaning?.trim() ?? "";
      const exampleJp = item.exampleJp?.trim() ?? "";
      const row = lineNo(index);
      if (!Number.isInteger(lesson) || lesson < 1) {
        errors.push({ row, message: "lesson phải là số bài đã có" });
        return null;
      }
      if (!pattern || !meaning) {
        errors.push({ row, message: "Thiếu pattern hoặc meaning" });
        return null;
      }
      if (!exampleJp) {
        errors.push({ row, message: "Thiếu exampleJp" });
        return null;
      }
      // ponytail: " | " splitter; quoted CSV commas are fine, a literal " | " inside one example would split. Use one cell per example if that happens.
      const jps = exampleJp.split(" | ").map((part) => part.trim()).filter(Boolean);
      const vis = (item.exampleVi ?? "").split(" | ");
      return {
        row,
        lesson,
        jlpt: item.jlpt,
        grammarLesson: item.grammarLesson ? Number(item.grammarLesson) : undefined,
        pattern,
        meaning,
        form: item.form,
        note: item.note,
        examples: jps.map((jp, i) => ({ jp, vi: (vis[i] ?? "").trim() })),
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  return { rows, errors };
}

export function sampleCsv(kind: TransferKind) {
  return toCsv(SAMPLE_ROWS[kind]);
}

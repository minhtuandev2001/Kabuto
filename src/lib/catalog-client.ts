import type { GrammarExample, GrammarLesson, GrammarPoint } from "@/lib/grammar";
import type { LessonInfo, VocabWord } from "@/lib/types";

async function readJson<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || "Không kết nối được máy chủ");
  }
  return data;
}

export type GrammarPayload = {
  lesson?: number;
  jlpt?: string;
  grammarLesson?: number;
  pattern: string;
  meaning: string;
  form?: string;
  note?: string;
  examples: GrammarExample[];
};

export async function fetchCustomCatalog() {
  const [catalogRes, grammarRes] = await Promise.all([fetch("/api/catalog"), fetch("/api/grammar")]);
  const catalog = await readJson<{ lessons: LessonInfo[]; words: VocabWord[] }>(catalogRes);
  let grammarLessons: GrammarLesson[] = [];
  try {
    const grammarData = await readJson<{ lessons: GrammarLesson[] }>(grammarRes);
    grammarLessons = grammarData.lessons ?? [];
  } catch {
    grammarLessons = [];
  }
  return { ...catalog, grammarLessons };
}

export async function fetchGrammarLessons() {
  const res = await fetch("/api/grammar");
  const data = await readJson<{ lessons: GrammarLesson[] }>(res);
  return data.lessons ?? [];
}

export async function createLessonApi(input: { title: string; book?: string; jlpt?: string }) {
  const res = await fetch("/api/lessons", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return readJson<LessonInfo>(res);
}

export async function createWordApi(input: {
  lesson: number;
  kana: string;
  meaning: string;
  kanji?: string;
  romaji?: string;
  sinoVietnamese?: string;
  audioUrl?: string;
  imageUrl?: string;
}) {
  const res = await fetch("/api/words", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return readJson<VocabWord>(res);
}

export async function saveGrammarApi(input: GrammarPayload, dbId?: number) {
  const res = await fetch(dbId ? `/api/grammar/${dbId}` : "/api/grammar", {
    method: dbId ? "PATCH" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (dbId) {
    return readJson<GrammarPoint>(res);
  }
  const data = await readJson<{ point: GrammarPoint }>(res);
  return data.point;
}

export async function deleteGrammarApi(dbId: number) {
  const res = await fetch(`/api/grammar/${dbId}`, { method: "DELETE" });
  await readJson<{ ok: boolean }>(res);
}

export async function deleteLessonApi(lesson: number) {
  const res = await fetch(`/api/lessons/${lesson}`, { method: "DELETE" });
  await readJson<{ ok: boolean }>(res);
}

export async function deleteWordApi(lesson: number, order: number) {
  const res = await fetch(`/api/words/${lesson}/${order}`, { method: "DELETE" });
  await readJson<{ ok: boolean }>(res);
}

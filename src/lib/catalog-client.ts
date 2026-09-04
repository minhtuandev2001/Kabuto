import type { LessonInfo, VocabWord } from "@/lib/types";

async function readJson<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || "Không kết nối được máy chủ");
  }
  return data;
}

export async function fetchCustomCatalog() {
  const res = await fetch("/api/catalog", { cache: "no-store" });
  return readJson<{ lessons: LessonInfo[]; words: VocabWord[] }>(res);
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

export async function deleteLessonApi(lesson: number) {
  const res = await fetch(`/api/lessons/${lesson}`, { method: "DELETE" });
  await readJson<{ ok: boolean }>(res);
}

export async function deleteWordApi(lesson: number, order: number) {
  const res = await fetch(`/api/words/${lesson}/${order}`, { method: "DELETE" });
  await readJson<{ ok: boolean }>(res);
}

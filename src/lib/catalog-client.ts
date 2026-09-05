import type { GrammarInput, GrammarLesson, GrammarPoint } from "@/lib/grammar";
import type { GrammarImage, LessonImage, LessonInfo, VocabWord } from "@/lib/types";

async function readJson<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || "Không kết nối được máy chủ");
  }
  return data;
}

export type GrammarPayload = GrammarInput;

export async function fetchCustomCatalog() {
  const [catalogRes, grammarRes] = await Promise.all([fetch("/api/catalog"), fetch("/api/grammar")]);
  const catalog = await readJson<{
    lessons: LessonInfo[];
    words: VocabWord[];
    lessonImages?: LessonImage[];
  }>(catalogRes);
  let grammarLessons: GrammarLesson[] = [];
  let grammarImages: GrammarImage[] = [];
  try {
    const grammarData = await readJson<{ lessons: GrammarLesson[]; images?: GrammarImage[] }>(grammarRes);
    grammarLessons = grammarData.lessons ?? [];
    grammarImages = grammarData.images ?? [];
  } catch {
    grammarLessons = [];
    grammarImages = [];
  }
  return {
    ...catalog,
    lessonImages: catalog.lessonImages ?? [],
    grammarLessons,
    grammarImages,
  };
}

export async function fetchGrammarLessons() {
  const res = await fetch("/api/grammar");
  const data = await readJson<{ lessons: GrammarLesson[]; images?: GrammarImage[] }>(res);
  return { lessons: data.lessons ?? [], images: data.images ?? [] };
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

export async function addLessonImageApi(lesson: number, imageUrl: string) {
  const res = await fetch("/api/lesson-images", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lesson, imageUrl }),
  });
  return readJson<LessonImage>(res);
}

export async function deleteLessonImageApi(lesson: number, order: number) {
  const res = await fetch(`/api/lesson-images/${lesson}/${order}`, { method: "DELETE" });
  await readJson<{ ok: boolean }>(res);
}

export async function moveLessonImageApi(lesson: number, order: number, delta: -1 | 1) {
  const res = await fetch("/api/lesson-images", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lesson, order, delta }),
  });
  return readJson<{ images: LessonImage[] }>(res);
}

export async function addGrammarImageApi(jlpt: string, lesson: number, imageUrl: string) {
  const res = await fetch("/api/grammar-images", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jlpt, lesson, imageUrl }),
  });
  return readJson<GrammarImage>(res);
}

export async function deleteGrammarImageApi(jlpt: string, lesson: number, order: number) {
  const res = await fetch(
    `/api/grammar-images/${encodeURIComponent(jlpt)}/${lesson}/${order}`,
    { method: "DELETE" },
  );
  await readJson<{ ok: boolean }>(res);
}

export async function moveGrammarImageApi(jlpt: string, lesson: number, order: number, delta: -1 | 1) {
  const res = await fetch("/api/grammar-images", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jlpt, lesson, order, delta }),
  });
  return readJson<{ images: GrammarImage[] }>(res);
}

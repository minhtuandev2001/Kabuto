import { ensureSchema, getSql } from "@/lib/db";
import { swapImageUrls } from "@/lib/swap-image-urls";
import type { GrammarImage } from "@/lib/types";

type ImageRow = {
  jlpt: string;
  lesson: number;
  order: number;
  image_url: string;
};

function toImage(row: ImageRow): GrammarImage {
  return {
    jlpt: row.jlpt,
    lesson: Number(row.lesson),
    order: Number(row.order),
    imageUrl: row.image_url,
  };
}

function normalizeJlpt(jlpt: string) {
  return jlpt.trim();
}

export async function listGrammarImages(jlpt?: string, lesson?: number) {
  await ensureSchema();
  const sql = getSql();
  const j = jlpt ? normalizeJlpt(jlpt) : "";
  const rows = (
    j && lesson != null && Number.isFinite(lesson)
      ? await sql`
          SELECT jlpt, lesson, "order", image_url
          FROM grammar_images
          WHERE jlpt = ${j} AND lesson = ${lesson}
          ORDER BY "order"
        `
      : await sql`
          SELECT jlpt, lesson, "order", image_url
          FROM grammar_images
          ORDER BY jlpt, lesson, "order"
        `
  ) as ImageRow[];
  return rows.map(toImage);
}

export async function addGrammarImage(jlpt: string, lesson: number, imageUrl: string) {
  const j = normalizeJlpt(jlpt);
  const url = imageUrl.trim();
  if (!j) {
    throw new Error("Thiếu JLPT");
  }
  if (!Number.isFinite(lesson) || lesson < 1) {
    throw new Error("Bài ngữ pháp không hợp lệ");
  }
  if (!url) {
    throw new Error("Thiếu URL ảnh");
  }
  await ensureSchema();
  const sql = getSql();
  const maxRows = (await sql`
    SELECT COALESCE(MAX("order"), 0) AS max
    FROM grammar_images
    WHERE jlpt = ${j} AND lesson = ${lesson}
  `) as { max: number }[];
  const order = Number(maxRows[0]?.max ?? 0) + 1;
  await sql`
    INSERT INTO grammar_images (jlpt, lesson, "order", image_url)
    VALUES (${j}, ${lesson}, ${order}, ${url})
  `;
  return { jlpt: j, lesson, order, imageUrl: url } satisfies GrammarImage;
}

export async function deleteGrammarImage(jlpt: string, lesson: number, order: number) {
  const j = normalizeJlpt(jlpt);
  const existing = await listGrammarImages(j, lesson);
  if (!existing.some((item) => item.order === order)) {
    throw new Error("Không tìm thấy ảnh");
  }
  const kept = existing.filter((item) => item.order !== order).map((item) => item.imageUrl);
  await rewriteGrammarImages(j, lesson, kept);
}

export async function moveGrammarImage(jlpt: string, lesson: number, order: number, delta: -1 | 1) {
  const j = normalizeJlpt(jlpt);
  const existing = await listGrammarImages(j, lesson);
  const from = existing.findIndex((item) => item.order === order);
  if (from < 0) {
    throw new Error("Không tìm thấy ảnh");
  }
  const urls = swapImageUrls(
    existing.map((item) => item.imageUrl),
    from,
    from + delta,
  );
  if (urls.every((url, i) => url === existing[i]?.imageUrl)) {
    return existing;
  }
  await rewriteGrammarImages(j, lesson, urls);
  return listGrammarImages(j, lesson);
}

export async function deleteGrammarImagesForSlot(jlpt: string, lesson: number) {
  await ensureSchema();
  const sql = getSql();
  await sql`DELETE FROM grammar_images WHERE jlpt = ${normalizeJlpt(jlpt)} AND lesson = ${lesson}`;
}

async function rewriteGrammarImages(jlpt: string, lesson: number, urls: string[]) {
  await ensureSchema();
  const sql = getSql();
  await sql.transaction((tx) => [
    tx`DELETE FROM grammar_images WHERE jlpt = ${jlpt} AND lesson = ${lesson}`,
    ...urls.map(
      (imageUrl, index) => tx`
        INSERT INTO grammar_images (jlpt, lesson, "order", image_url)
        VALUES (${jlpt}, ${lesson}, ${index + 1}, ${imageUrl})
      `,
    ),
  ]);
}

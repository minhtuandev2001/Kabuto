import { ensureSchema, getSql } from "@/lib/db";
import { swapImageUrls } from "@/lib/swap-image-urls";
import type { LessonImage } from "@/lib/types";

type ImageRow = {
  lesson: number;
  order: number;
  image_url: string;
};

function toImage(row: ImageRow): LessonImage {
  return {
    lesson: Number(row.lesson),
    order: Number(row.order),
    imageUrl: row.image_url,
  };
}

export async function listLessonImages(lesson?: number) {
  await ensureSchema();
  const sql = getSql();
  const rows = (
    lesson == null
      ? await sql`
          SELECT lesson, "order", image_url
          FROM lesson_images
          ORDER BY lesson, "order"
        `
      : await sql`
          SELECT lesson, "order", image_url
          FROM lesson_images
          WHERE lesson = ${lesson}
          ORDER BY "order"
        `
  ) as ImageRow[];
  return rows.map(toImage);
}

export async function addLessonImage(lesson: number, imageUrl: string) {
  const url = imageUrl.trim();
  if (!Number.isFinite(lesson) || lesson < 1) {
    throw new Error("Bài học không hợp lệ");
  }
  if (!url) {
    throw new Error("Thiếu URL ảnh");
  }
  await ensureSchema();
  const sql = getSql();
  const maxRows = (await sql`
    SELECT COALESCE(MAX("order"), 0) AS max
    FROM lesson_images
    WHERE lesson = ${lesson}
  `) as { max: number }[];
  const order = Number(maxRows[0]?.max ?? 0) + 1;
  await sql`
    INSERT INTO lesson_images (lesson, "order", image_url)
    VALUES (${lesson}, ${order}, ${url})
  `;
  return { lesson, order, imageUrl: url } satisfies LessonImage;
}

export async function deleteLessonImage(lesson: number, order: number) {
  await ensureSchema();
  const sql = getSql();
  const existing = await listLessonImages(lesson);
  if (!existing.some((item) => item.order === order)) {
    throw new Error("Không tìm thấy ảnh");
  }
  const kept = existing.filter((item) => item.order !== order).map((item) => item.imageUrl);
  await rewriteLessonImages(lesson, kept);
}

export async function moveLessonImage(lesson: number, order: number, delta: -1 | 1) {
  const existing = await listLessonImages(lesson);
  const from = existing.findIndex((item) => item.order === order);
  if (from < 0) {
    throw new Error("Không tìm thấy ảnh");
  }
  const to = from + delta;
  const urls = swapImageUrls(
    existing.map((item) => item.imageUrl),
    from,
    to,
  );
  if (urls.every((url, i) => url === existing[i]?.imageUrl)) {
    return existing;
  }
  await rewriteLessonImages(lesson, urls);
  return listLessonImages(lesson);
}

export async function deleteLessonImagesForLesson(lesson: number) {
  await ensureSchema();
  const sql = getSql();
  await sql`DELETE FROM lesson_images WHERE lesson = ${lesson}`;
}

async function rewriteLessonImages(lesson: number, urls: string[]) {
  await ensureSchema();
  const sql = getSql();
  await sql.transaction((tx) => [
    tx`DELETE FROM lesson_images WHERE lesson = ${lesson}`,
    ...urls.map(
      (imageUrl, index) => tx`
        INSERT INTO lesson_images (lesson, "order", image_url)
        VALUES (${lesson}, ${index + 1}, ${imageUrl})
      `,
    ),
  ]);
}

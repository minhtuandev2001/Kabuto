import { insertCustomWord, reorderWords } from "@/lib/custom-catalog";

export const runtime = "nodejs";

/** Reorder a lesson: { lesson, orders: [current order values in the new sequence] } */
export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { lesson?: number; orders?: unknown };
    if (!Array.isArray(body.orders)) {
      return Response.json({ error: "Thiếu danh sách thứ tự" }, { status: 400 });
    }
    await reorderWords(Number(body.lesson), body.orders.map(Number));
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không sắp xếp được từ";
    const status = message.includes("không hợp lệ") || message.includes("đã thay đổi") ? 400 : 500;
    return Response.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      lesson?: number;
      kana?: string;
      meaning?: string;
      kanji?: string;
      romaji?: string;
      sinoVietnamese?: string;
      audioUrl?: string;
      imageUrl?: string;
    };
    const word = await insertCustomWord({
      lesson: Number(body.lesson),
      kana: body.kana ?? "",
      meaning: body.meaning ?? "",
      kanji: body.kanji,
      romaji: body.romaji,
      sinoVietnamese: body.sinoVietnamese,
      audioUrl: body.audioUrl,
      imageUrl: body.imageUrl,
    });
    return Response.json(word);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không tạo được từ";
    const status = message.startsWith("Nhập") || message.startsWith("Chưa") ? 400 : 500;
    return Response.json({ error: message }, { status });
  }
}

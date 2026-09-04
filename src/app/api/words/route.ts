import { insertCustomWord } from "@/lib/custom-catalog";

export const runtime = "nodejs";

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

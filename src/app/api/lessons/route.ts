import { insertCustomLesson } from "@/lib/custom-catalog";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { title?: string; book?: string; jlpt?: string };
    const lesson = await insertCustomLesson({
      title: body.title ?? "",
      book: body.book,
      jlpt: body.jlpt,
    });
    return Response.json(lesson);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không tạo được bài học";
    const status = message.startsWith("Nhập") ? 400 : 500;
    return Response.json({ error: message }, { status });
  }
}

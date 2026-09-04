import { deleteCustomLesson } from "@/lib/custom-catalog";

export const runtime = "nodejs";

export async function DELETE(_request: Request, context: { params: Promise<{ lesson: string }> }) {
  try {
    const { lesson } = await context.params;
    const id = Number(lesson);
    if (!Number.isFinite(id)) {
      return Response.json({ error: "Bài học không hợp lệ" }, { status: 400 });
    }
    await deleteCustomLesson(id);
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không xóa được bài";
    const status = message.includes("Không tìm thấy") ? 404 : 500;
    return Response.json({ error: message }, { status });
  }
}

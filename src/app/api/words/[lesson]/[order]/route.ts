import { deleteCustomWord } from "@/lib/custom-catalog";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ lesson: string; order: string }> },
) {
  try {
    const { lesson, order } = await context.params;
    const lessonId = Number(lesson);
    const orderId = Number(order);
    if (!Number.isFinite(lessonId) || !Number.isFinite(orderId)) {
      return Response.json({ error: "Từ không hợp lệ" }, { status: 400 });
    }
    await deleteCustomWord(lessonId, orderId);
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không xóa được từ";
    const status = message.includes("Không tìm thấy") ? 404 : 500;
    return Response.json({ error: message }, { status });
  }
}

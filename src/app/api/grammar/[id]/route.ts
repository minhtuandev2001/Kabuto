import { deleteGrammarPoint, updateGrammarPoint, type GrammarInput } from "@/lib/custom-grammar";

export const runtime = "nodejs";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const dbId = Number(id);
    if (!Number.isFinite(dbId)) {
      return Response.json({ error: "Mẫu không hợp lệ" }, { status: 400 });
    }
    const body = (await request.json()) as GrammarInput;
    const point = await updateGrammarPoint(dbId, body);
    return Response.json(point);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không sửa được ngữ pháp";
    const status = message.startsWith("Nhập") || message.includes("Không tìm thấy") ? 400 : 500;
    return Response.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const dbId = Number(id);
    if (!Number.isFinite(dbId)) {
      return Response.json({ error: "Mẫu không hợp lệ" }, { status: 400 });
    }
    await deleteGrammarPoint(dbId);
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không xóa được ngữ pháp";
    const status = message.includes("Không tìm thấy") ? 404 : 500;
    return Response.json({ error: message }, { status });
  }
}

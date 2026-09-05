import { deleteLessonImage } from "@/lib/lesson-images";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ lesson: string; order: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { lesson, order } = await params;
    await deleteLessonImage(Number(lesson), Number(order));
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Không xóa được ảnh" },
      { status: 400 },
    );
  }
}

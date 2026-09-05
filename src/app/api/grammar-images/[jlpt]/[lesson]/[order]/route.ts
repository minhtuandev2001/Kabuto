import { deleteGrammarImage } from "@/lib/grammar-images";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ jlpt: string; lesson: string; order: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { jlpt, lesson, order } = await params;
    await deleteGrammarImage(decodeURIComponent(jlpt), Number(lesson), Number(order));
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Không xóa được ảnh" },
      { status: 400 },
    );
  }
}

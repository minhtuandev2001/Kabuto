import { addGrammarImage, listGrammarImages, moveGrammarImage } from "@/lib/grammar-images";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const jlpt = url.searchParams.get("jlpt") ?? undefined;
    const lesson = Number(url.searchParams.get("lesson"));
    const images = await listGrammarImages(
      jlpt,
      Number.isFinite(lesson) && lesson > 0 ? lesson : undefined,
    );
    return Response.json({ images });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Không đọc được ảnh ngữ pháp" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { jlpt?: string; lesson?: number; imageUrl?: string };
    const image = await addGrammarImage(String(body.jlpt ?? ""), Number(body.lesson), String(body.imageUrl ?? ""));
    return Response.json(image);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Không thêm được ảnh" },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      jlpt?: string;
      lesson?: number;
      order?: number;
      delta?: number;
    };
    const delta = body.delta === -1 || body.delta === 1 ? body.delta : null;
    if (delta == null) {
      throw new Error("delta phải là -1 hoặc 1");
    }
    const images = await moveGrammarImage(
      String(body.jlpt ?? ""),
      Number(body.lesson),
      Number(body.order),
      delta,
    );
    return Response.json({ images });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Không sắp xếp được ảnh" },
      { status: 400 },
    );
  }
}

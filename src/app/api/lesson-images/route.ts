import { addLessonImage, listLessonImages, moveLessonImage } from "@/lib/lesson-images";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const lesson = Number(new URL(request.url).searchParams.get("lesson"));
    const images = await listLessonImages(Number.isFinite(lesson) && lesson > 0 ? lesson : undefined);
    return Response.json({ images });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Không đọc được ảnh bài học" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { lesson?: number; imageUrl?: string };
    const image = await addLessonImage(Number(body.lesson), String(body.imageUrl ?? ""));
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
    const body = (await request.json()) as { lesson?: number; order?: number; delta?: number };
    const delta = body.delta === -1 || body.delta === 1 ? body.delta : null;
    if (delta == null) {
      throw new Error("delta phải là -1 hoặc 1");
    }
    const images = await moveLessonImage(Number(body.lesson), Number(body.order), delta);
    return Response.json({ images });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Không sắp xếp được ảnh" },
      { status: 400 },
    );
  }
}

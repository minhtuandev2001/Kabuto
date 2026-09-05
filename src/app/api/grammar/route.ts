import { listGrammarImages } from "@/lib/grammar-images";
import { insertGrammarPoint, listGrammarLessons, type GrammarInput } from "@/lib/custom-grammar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [lessons, images] = await Promise.all([listGrammarLessons(), listGrammarImages()]);
    return Response.json({ lessons, images });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Không đọc được ngữ pháp" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GrammarInput;
    const result = await insertGrammarPoint(body);
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không lưu được ngữ pháp";
    const status = message.startsWith("Nhập") || message.startsWith("Chưa") || message.startsWith("Không tìm") ? 400 : 500;
    return Response.json({ error: message }, { status });
  }
}

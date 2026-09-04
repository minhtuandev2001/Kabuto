import { listFullCatalog } from "@/lib/custom-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const catalog = await listFullCatalog();
    return Response.json(catalog);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Không đọc được catalog" },
      { status: 500 },
    );
  }
}

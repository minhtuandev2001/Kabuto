import { importCustomLessons, importCustomWords, listCustomCatalog } from "@/lib/custom-catalog";
import { importGrammarPoints, listGrammarLessons } from "@/lib/custom-grammar";
import {
  isTransferKind,
  parseGrammarImport,
  parseLessonImport,
  parseWordImport,
  SAMPLE_FILES,
  SAMPLE_ROWS,
  TRANSFER_LIMIT,
  type TransferKind,
} from "@/lib/transfer";
import { fileToImportText, tableToXlsx } from "@/lib/xlsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function xlsxFile(filename: string, body: Buffer) {
  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function kindOf(request: Request): TransferKind {
  const kind = new URL(request.url).searchParams.get("kind") ?? "";
  if (!isTransferKind(kind)) {
    throw new Error("kind phải là lessons, words hoặc grammar");
  }
  return kind;
}

async function exportRows(kind: TransferKind) {
  if (kind === "lessons") {
    const { lessons } = await listCustomCatalog();
    return [
      ["lesson", "title", "book", "jlpt"],
      ...lessons.map((item) => [String(item.lesson), item.title, item.book, item.jlpt]),
    ];
  }
  if (kind === "words") {
    const { words } = await listCustomCatalog();
    return [
      ["lesson", "hiragana/katakana", "kanji", "romaji", "sinoVietnamese", "meaning", "audioUrl", "imageUrl"],
      ...words.map((item) => [
        String(item.lesson),
        item.kana,
        item.kanji,
        item.romaji,
        item.sinoVietnamese,
        item.meaning,
        item.audioUrl,
        item.imageUrl ?? "",
      ]),
    ];
  }
  const grammar = await listGrammarLessons();
  const rows: string[][] = [["lesson", "pattern", "meaning", "form", "note", "exampleJp", "exampleVi"]];
  for (const lesson of grammar) {
    const catalog = lesson.catalogLesson ?? lesson.lesson;
    for (const point of lesson.points) {
      if (!point.custom) {
        continue;
      }
      const jps = point.examples.map((item) => item.jp).join(" | ");
      const vis = point.examples.map((item) => item.vi).join(" | ");
      rows.push([String(catalog), point.pattern, point.meaning, point.form ?? "", point.note ?? "", jps, vis]);
    }
  }
  return rows;
}

export async function GET(request: Request) {
  try {
    const kind = kindOf(request);
    const mode = new URL(request.url).searchParams.get("mode") || "sample";
    if (mode === "export") {
      return xlsxFile(`learn-japan-${kind}.xlsx`, tableToXlsx(await exportRows(kind)));
    }
    return xlsxFile(SAMPLE_FILES[kind], tableToXlsx(SAMPLE_ROWS[kind]));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Không tải được file" }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const kind = kindOf(request);
    const body = (await request.json()) as { csv?: string; xlsx?: string };
    const csv = fileToImportText(body);
    if (kind === "lessons") {
      const parsed = parseLessonImport(csv);
      if (parsed.rows.length > TRANSFER_LIMIT) {
        throw new Error(`Tối đa ${TRANSFER_LIMIT} dòng/lần`);
      }
      const result = await importCustomLessons(parsed.rows);
      return Response.json({ imported: result.created.length, errors: [...parsed.errors, ...result.errors] });
    }
    if (kind === "words") {
      const parsed = parseWordImport(csv);
      if (parsed.rows.length > TRANSFER_LIMIT) {
        throw new Error(`Tối đa ${TRANSFER_LIMIT} dòng/lần`);
      }
      const result = await importCustomWords(parsed.rows);
      return Response.json({ imported: result.created.length, errors: [...parsed.errors, ...result.errors] });
    }
    const parsed = parseGrammarImport(csv);
    if (parsed.rows.length > TRANSFER_LIMIT) {
      throw new Error(`Tối đa ${TRANSFER_LIMIT} dòng/lần`);
    }
    const result = await importGrammarPoints(parsed.rows);
    return Response.json({ imported: result.created, errors: [...parsed.errors, ...result.errors] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không nhập được";
    const status = message.startsWith("File") || message.startsWith("kind") || message.startsWith("Tối đa") || message.startsWith("Không nhận") ? 400 : 500;
    return Response.json({ error: message }, { status });
  }
}

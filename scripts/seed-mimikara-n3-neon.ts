/**
 * Replace N3 vocab with Mimikara Oboeru data; drop N2/N1 catalog lessons.
 *
 *   npm run seed:mimikara-n3 -- "C:/Users/Admin/Downloads/final data.zip"
 *   npm run seed:mimikara-n3 -- "/path/to/final data"
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from "fs";
import path from "path";
import { neon } from "@neondatabase/serverless";

const BOOK = "Mimikara Oboeru N3";
const N3_OFFSET = 50; // unit 1 → lesson 51
const AUDIO_PUBLIC = path.join(process.cwd(), "public", "audio", "mimikara-n3");
const BATCH = 100;

type VocabRow = {
  word: string;
  pronunciation?: string;
  meaning: string;
  categoryName: string;
  audio?: string;
};

type MimikaraFile = {
  vocabularies: VocabRow[];
};

function databaseUrl() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("Missing DATABASE_URL");
  }
  return url;
}

function unitNumber(categoryName: string) {
  const m = categoryName.match(/UNIT\s+(\d+)/i);
  if (!m) {
    throw new Error(`Không parse được unit từ: ${categoryName}`);
  }
  const n = Number(m[1]);
  if (!Number.isFinite(n) || n < 1 || n > 12) {
    throw new Error(`Unit ngoài 1–12: ${categoryName}`);
  }
  return n;
}

function parseWord(raw: string): { kanji: string; kana: string } {
  const text = raw.trim();
  if (!text) {
    return { kanji: "", kana: "" };
  }
  if (text.includes("/")) {
    const [left, right] = text.split("/", 2);
    return { kanji: (left ?? "").trim(), kana: (right ?? "").trim() };
  }
  if (/^[\u3040-\u309F\u30A0-\u30FFー]+$/.test(text)) {
    return { kanji: "", kana: text };
  }
  return { kanji: text, kana: "" };
}

async function extractZipIfNeeded(inputPath: string): Promise<string> {
  const resolved = path.resolve(inputPath);
  if (!existsSync(resolved)) {
    throw new Error(`Không tìm thấy: ${resolved}`);
  }
  if (!resolved.toLowerCase().endsWith(".zip")) {
    return resolved;
  }
  const outDir = path.join(process.cwd(), "scripts", ".mimikara-n3-extract");
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const { spawnSync } = await import("child_process");
  const result = spawnSync("unzip", ["-o", resolved, "-d", outDir], { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`unzip failed: ${result.stderr || result.stdout || "unknown"}`);
  }
  return outDir;
}

function findDataRoot(root: string): string {
  if (existsSync(path.join(root, "mimikara_n3.json"))) {
    return root;
  }
  const nested = path.join(root, "final data");
  if (existsSync(path.join(nested, "mimikara_n3.json"))) {
    return nested;
  }
  for (const name of readdirSync(root)) {
    const candidate = path.join(root, name, "mimikara_n3.json");
    if (existsSync(candidate)) {
      return path.join(root, name);
    }
  }
  throw new Error(`Không thấy mimikara_n3.json dưới ${root}`);
}

function syncAudio(dataRoot: string) {
  const srcDir = path.join(dataRoot, "audio");
  if (!existsSync(srcDir)) {
    throw new Error(`Thiếu thư mục audio: ${srcDir}`);
  }
  mkdirSync(AUDIO_PUBLIC, { recursive: true });
  const files = readdirSync(srcDir).filter((name) => name.toLowerCase().endsWith(".mp3"));
  for (const name of files) {
    copyFileSync(path.join(srcDir, name), path.join(AUDIO_PUBLIC, name));
  }
  return files.length;
}

function audioPublicUrl(rel: string | undefined) {
  if (!rel) {
    return "";
  }
  const base = path.basename(rel.replace(/\\/g, "/"));
  return base ? `/audio/mimikara-n3/${base}` : "";
}

async function main() {
  const input = process.argv[2] || path.join(process.env.USERPROFILE || "", "Downloads", "final data.zip");
  const extracted = await extractZipIfNeeded(input);
  const dataRoot = findDataRoot(extracted);
  const raw = JSON.parse(readFileSync(path.join(dataRoot, "mimikara_n3.json"), "utf8")) as MimikaraFile;
  const rows = raw.vocabularies ?? [];
  if (rows.length < 100) {
    throw new Error(`vocabularies quá ít: ${rows.length}`);
  }

  const audioCopied = syncAudio(dataRoot);
  console.log(`audio copied → public/audio/mimikara-n3 (${audioCopied} files)`);

  const byUnit = new Map<number, VocabRow[]>();
  for (const row of rows) {
    const unit = unitNumber(row.categoryName || "");
    const list = byUnit.get(unit) ?? [];
    list.push(row);
    byUnit.set(unit, list);
  }
  if (byUnit.size !== 12) {
    throw new Error(`Cần 12 unit, nhận ${byUnit.size}`);
  }

  const sql = neon(databaseUrl());

  const delCustom = await sql`
    DELETE FROM custom_words WHERE lesson BETWEEN 51 AND 100 RETURNING lesson
  `;
  const delMinnaWords = await sql`
    DELETE FROM minna_words WHERE lesson BETWEEN 51 AND 100 RETURNING lesson
  `;
  const delImagesN3 = await sql`
    DELETE FROM lesson_images WHERE lesson BETWEEN 51 AND 62 RETURNING lesson
  `;
  const delImages = await sql`
    DELETE FROM lesson_images WHERE lesson BETWEEN 66 AND 100 RETURNING lesson
  `;
  const delN2N1Lessons = await sql`
    DELETE FROM minna_lessons WHERE jlpt IN ('N2', 'N1') RETURNING lesson
  `;
  await sql`DELETE FROM minna_lessons WHERE jlpt = 'N3' OR lesson BETWEEN 51 AND 62`;

  console.log(
    JSON.stringify({
      deletedCustomWords: delCustom.length,
      deletedMinnaWords: delMinnaWords.length,
      deletedLessonImagesN3: delImagesN3.length,
      deletedLessonImagesN2N1: delImages.length,
      deletedN2N1Lessons: delN2N1Lessons.length,
    }),
  );

  let inserted = 0;
  for (let unit = 1; unit <= 12; unit += 1) {
    const lesson = N3_OFFSET + unit;
    const words = byUnit.get(unit) ?? [];
    if (!words.length) {
      throw new Error(`Unit ${unit} trống`);
    }
    await sql`
      INSERT INTO minna_lessons (lesson, title, book, jlpt)
      VALUES (${lesson}, ${`Unit ${unit}`}, ${BOOK}, ${"N3"})
      ON CONFLICT (lesson) DO UPDATE SET
        title = EXCLUDED.title,
        book = EXCLUDED.book,
        jlpt = EXCLUDED.jlpt
    `;

    const values = words.map((row, i) => {
      const { kanji, kana } = parseWord(row.word);
      const reading = kana || kanji;
      if (!reading || !row.meaning?.trim()) {
        throw new Error(`Dòng lỗi unit ${unit} #${i + 1}: ${row.word}`);
      }
      return {
        lesson,
        order: i + 1,
        kana: reading,
        kanji,
        romaji: (row.pronunciation || "").trim(),
        meaning: row.meaning.trim(),
        audioUrl: audioPublicUrl(row.audio),
      };
    });

    for (let i = 0; i < values.length; i += BATCH) {
      const chunk = values.slice(i, i + BATCH);
      await sql.transaction((tx) =>
        chunk.map(
          (w) => tx`
            INSERT INTO minna_words (
              lesson, "order", kana, kanji, romaji, sino_vietnamese, meaning, audio_url, image_url
            ) VALUES (
              ${w.lesson}, ${w.order}, ${w.kana}, ${w.kanji}, ${w.romaji}, ${""},
              ${w.meaning}, ${w.audioUrl}, ${""}
            )
          `,
        ),
      );
    }
    inserted += values.length;
    console.log(`lesson ${lesson} unit ${unit}: ${values.length} words`);
  }

  const check = await sql`
    SELECT l.lesson, l.title, COUNT(w.*)::int AS words
    FROM minna_lessons l
    LEFT JOIN minna_words w ON w.lesson = l.lesson
    WHERE l.jlpt = 'N3'
    GROUP BY l.lesson, l.title
    ORDER BY l.lesson
  `;
  const leftover = await sql`
    SELECT jlpt, COUNT(*)::int AS n FROM minna_lessons WHERE jlpt IN ('N2','N1','N3') GROUP BY jlpt ORDER BY jlpt
  `;
  const withAudio = await sql`
    SELECT COUNT(*)::int AS n FROM minna_words
    WHERE lesson BETWEEN 51 AND 62 AND audio_url <> ''
  `;
  console.log(JSON.stringify({ inserted, withAudio: withAudio[0]?.n, check, leftover }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

/**
 * Seed N3–N1 vocab from OpenJLPT (free, CC BY-SA 4.0) into minna_lessons /
 * minna_words (catalog 51–100) and link grammar_lessons.catalog_lesson.
 *
 * Source: https://github.com/evanclan/OpenJLPT
 *   level lists — Jonathan Waller / tanos.co.uk (CC BY)
 *   glosses — JMdict/EDICT, EDRDG (CC BY-SA 4.0)
 *
 * Not Irodori/Marugoto: JF terms forbid copying those lists into a separate app.
 *
 *   npm run seed:jlpt-vocab
 */
import { neon } from "@neondatabase/serverless";
import { catalogLessonForBuiltin } from "../src/lib/grammar";

const OPENJLPT_CSV = {
  N3: "https://raw.githubusercontent.com/evanclan/OpenJLPT/main/data/csv/vocab-n3.csv",
  N2: "https://raw.githubusercontent.com/evanclan/OpenJLPT/main/data/csv/vocab-n2.csv",
  N1: "https://raw.githubusercontent.com/evanclan/OpenJLPT/main/data/csv/vocab-n1.csv",
} as const;

const LESSONS = { N3: 12, N2: 20, N1: 15 } as const;
const BOOK = "OpenJLPT (CC BY-SA 4.0)";
const BATCH = 200;

const DIGRAPHS: Record<string, string> = {
  きゃ: "kya", きゅ: "kyu", きょ: "kyo",
  しゃ: "sha", しゅ: "shu", しょ: "sho",
  ちゃ: "cha", ちゅ: "chu", ちょ: "cho",
  にゃ: "nya", にゅ: "nyu", にょ: "nyo",
  ひゃ: "hya", ひゅ: "hyu", ひょ: "hyo",
  みゃ: "mya", みゅ: "myu", みょ: "myo",
  りゃ: "rya", りゅ: "ryu", りょ: "ryo",
  ぎゃ: "gya", ぎゅ: "gyu", ぎょ: "gyo",
  じゃ: "ja", じゅ: "ju", じょ: "jo",
  びゃ: "bya", びゅ: "byu", びょ: "byo",
  ぴゃ: "pya", ぴゅ: "pyu", ぴょ: "pyo",
};

const KANA: Record<string, string> = {
  あ: "a", い: "i", う: "u", え: "e", お: "o",
  か: "ka", き: "ki", く: "ku", け: "ke", こ: "ko",
  さ: "sa", し: "shi", す: "su", せ: "se", そ: "so",
  た: "ta", ち: "chi", つ: "tsu", て: "te", と: "to",
  な: "na", に: "ni", ぬ: "nu", ね: "ne", の: "no",
  は: "ha", ひ: "hi", ふ: "fu", へ: "he", ほ: "ho",
  ま: "ma", み: "mi", む: "mu", め: "me", も: "mo",
  や: "ya", ゆ: "yu", よ: "yo",
  ら: "ra", り: "ri", る: "ru", れ: "re", ろ: "ro",
  わ: "wa", を: "o", ん: "n",
  が: "ga", ぎ: "gi", ぐ: "gu", げ: "ge", ご: "go",
  ざ: "za", じ: "ji", ず: "zu", ぜ: "ze", ぞ: "zo",
  だ: "da", ぢ: "ji", づ: "zu", で: "de", ど: "do",
  ば: "ba", び: "bi", ぶ: "bu", べ: "be", ぼ: "bo",
  ぱ: "pa", ぴ: "pi", ぷ: "pu", ぺ: "pe", ぽ: "po",
  ぁ: "a", ぃ: "i", ぅ: "u", ぇ: "e", ぉ: "o", っ: "",
  ゃ: "ya", ゅ: "yu", ょ: "yo", ー: "", ゔ: "vu",
};

function toHiragana(text: string) {
  return text.replace(/[\u30A1-\u30F6]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
}

function kanaToRomaji(input: string) {
  const hira = toHiragana(input);
  let out = "";
  for (let i = 0; i < hira.length; i += 1) {
    const two = hira.slice(i, i + 2);
    if (hira[i] === "っ") {
      const next = DIGRAPHS[hira.slice(i + 1, i + 3)] || KANA[hira[i + 1]] || "";
      out += next.charAt(0) || "";
      continue;
    }
    if (hira[i] === "ー") {
      const prev = out.match(/[aeiou]$/i);
      out += prev ? prev[0] : "";
      continue;
    }
    if (DIGRAPHS[two]) {
      out += DIGRAPHS[two];
      i += 1;
      continue;
    }
    out += KANA[hira[i]] ?? hira[i];
  }
  return out;
}

function hasKanji(text: string) {
  return /\p{Script=Han}/u.test(text);
}

type OpenWord = { word: string; reading: string; meanings: string };

function parseVocabCsv(text: string, level: string): OpenWord[] {
  const tag = `,${level},`;
  const rows: OpenWord[] = [];
  for (const line of text.split(/\r?\n/).slice(1)) {
    if (!line.trim()) {
      continue;
    }
    const at = line.indexOf(tag);
    if (at < 0) {
      continue;
    }
    const head = line.slice(0, at);
    const comma1 = head.indexOf(",");
    const comma2 = head.indexOf(",", comma1 + 1);
    if (comma1 < 0 || comma2 < 0) {
      continue;
    }
    const word = head.slice(0, comma1).trim();
    const reading = head.slice(comma1 + 1, comma2).trim();
    const meanings = head.slice(comma2 + 1).trim();
    if (!word && !reading) {
      continue;
    }
    rows.push({ word, reading, meanings });
  }
  return rows;
}

function chunk<T>(items: T[], parts: number): T[][] {
  const size = Math.ceil(items.length / parts);
  return Array.from({ length: parts }, (_, i) => items.slice(i * size, (i + 1) * size));
}

function env(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

async function fetchCsv(url: string) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Fetch ${url} → ${res.status}`);
  }
  return res.text();
}

async function insertWordBatch(
  sql: { query: (query: string, params: unknown[]) => Promise<unknown> },
  words: {
    lesson: number;
    order: number;
    kana: string;
    kanji: string;
    romaji: string;
    meaning: string;
  }[],
) {
  if (!words.length) {
    return;
  }
  // ponytail: Neon HTTP; UNNEST ~200 rows/call. Raise BATCH if this starts timing out.
  await sql.query(
    `INSERT INTO minna_words (
       lesson, "order", kana, kanji, romaji, sino_vietnamese, meaning, audio_url, image_url
     )
     SELECT * FROM unnest(
       $1::int[], $2::int[], $3::text[], $4::text[], $5::text[], $6::text[], $7::text[], $8::text[], $9::text[]
     )`,
    [
      words.map((w) => w.lesson),
      words.map((w) => w.order),
      words.map((w) => w.kana),
      words.map((w) => w.kanji),
      words.map((w) => w.romaji),
      words.map(() => ""),
      words.map((w) => w.meaning),
      words.map(() => ""),
      words.map(() => ""),
    ],
  );
}

async function main() {
  const sql = neon(env("DATABASE_URL"));
  const grammar = (await sql`
    SELECT jlpt, lesson, title, subtitle
    FROM grammar_lessons
    WHERE jlpt IN ('N3', 'N2', 'N1') AND source = 'seed'
  `) as { jlpt: string; lesson: number; title: string; subtitle: string }[];
  const grammarByKey = new Map(grammar.map((row) => [`${row.jlpt}:${row.lesson}`, row]));

  const allWords: {
    lesson: number;
    order: number;
    kana: string;
    kanji: string;
    romaji: string;
    meaning: string;
  }[] = [];
  const lessons: { lesson: number; title: string; book: string; jlpt: string }[] = [];

  for (const jlpt of ["N3", "N2", "N1"] as const) {
    const raw = await fetchCsv(OPENJLPT_CSV[jlpt]);
    const parsed = parseVocabCsv(raw, jlpt);
    if (parsed.length < 1000) {
      throw new Error(`${jlpt} OpenJLPT rows ${parsed.length}, expected >1000`);
    }
    const groups = chunk(parsed, LESSONS[jlpt]);
    groups.forEach((group, index) => {
      const gLesson = index + 1;
      const catalog = catalogLessonForBuiltin(jlpt, gLesson);
      if (catalog == null) {
        throw new Error(`No catalog slot for ${jlpt} bài ${gLesson}`);
      }
      const g = grammarByKey.get(`${jlpt}:${gLesson}`);
      if (!g) {
        throw new Error(`Missing grammar_lessons ${jlpt} bài ${gLesson}`);
      }
      if (!group.length) {
        throw new Error(`${jlpt} bài ${gLesson} got 0 OpenJLPT words`);
      }
      const subtitle = g.subtitle?.trim() || g.title;
      lessons.push({
        lesson: catalog,
        title: `${g.title} - ${subtitle}`,
        book: BOOK,
        jlpt,
      });
      group.forEach((item, order) => {
        const kana = item.reading || item.word;
        const kanji = hasKanji(item.word) ? item.word : "";
        allWords.push({
          lesson: catalog,
          order: order + 1,
          kana,
          kanji,
          romaji: kanaToRomaji(kana),
          meaning: item.meanings || "",
        });
      });
    });
    console.log(`${jlpt}: ${parsed.length} words → ${LESSONS[jlpt]} lessons`);
  }

  await sql`DELETE FROM minna_words WHERE lesson BETWEEN 51 AND 100`;
  await sql`DELETE FROM minna_lessons WHERE lesson BETWEEN 51 AND 100`;

  // Drop old seed grammar past the new N3 lesson count (was 15 → now 12).
  await sql`
    DELETE FROM grammar_points
    WHERE source = 'seed' AND jlpt = 'N3' AND lesson > ${LESSONS.N3}
  `;
  await sql`
    DELETE FROM grammar_lessons
    WHERE source = 'seed' AND jlpt = 'N3' AND lesson > ${LESSONS.N3}
  `;

  for (const lesson of lessons) {
    await sql`
      INSERT INTO minna_lessons (lesson, title, book, jlpt)
      VALUES (${lesson.lesson}, ${lesson.title}, ${lesson.book}, ${lesson.jlpt})
    `;
  }
  for (let i = 0; i < allWords.length; i += BATCH) {
    await insertWordBatch(sql, allWords.slice(i, i + BATCH));
    console.log(`words ${Math.min(i + BATCH, allWords.length)}/${allWords.length}`);
  }

  for (const jlpt of ["N3", "N2", "N1"] as const) {
    for (let gLesson = 1; gLesson <= LESSONS[jlpt]; gLesson += 1) {
      const catalog = catalogLessonForBuiltin(jlpt, gLesson);
      await sql`
        UPDATE grammar_lessons
        SET catalog_lesson = ${catalog}
        WHERE jlpt = ${jlpt} AND lesson = ${gLesson} AND source = 'seed'
      `;
    }
  }

  const n3Lessons = await sql`SELECT COUNT(*)::int AS n FROM minna_lessons WHERE jlpt = 'N3'`;
  const n3Words = await sql`SELECT COUNT(*)::int AS n FROM minna_words WHERE lesson BETWEEN 51 AND 62`;
  const lessonCount = await sql`SELECT COUNT(*)::int AS n FROM minna_lessons WHERE lesson BETWEEN 51 AND 100`;
  const wordCount = await sql`SELECT COUNT(*)::int AS n FROM minna_words WHERE lesson BETWEEN 51 AND 100`;
  console.log(
    JSON.stringify(
      {
        source: BOOK,
        n3Lessons: n3Lessons[0].n,
        n3Words: n3Words[0].n,
        lessons: lessonCount[0].n,
        words: wordCount[0].n,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

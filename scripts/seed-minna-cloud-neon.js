/**
 * One-off: upload Minna word images to Cloudinary and seed lessons/words into Neon.
 * Does not change app runtime. Resume-safe via scripts/.seed-minna-state.json
 *
 *   node --env-file=.env scripts/seed-minna-cloud-neon.js
 */
const { createHash } = require("crypto");
const fs = require("fs");
const path = require("path");
const { neon } = require("@neondatabase/serverless");

const ROOT = path.join(__dirname, "..");
const WORDS_DIR = path.join(ROOT, "public", "words");
const STATE_PATH = path.join(__dirname, ".seed-minna-state.json");
const CONCURRENCY = 4;

function env(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

function sign(params, secret) {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(`${toSign}${secret}`).digest("hex");
}

function wordFileName(word) {
  return `l${String(word.lesson).padStart(2, "0")}-${String(word.order).padStart(3, "0")}`;
}

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
  } catch {
    return { images: {} };
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`);
}

async function mapPool(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

async function uploadPng(filePath, publicId, cloud) {
  const timestamp = Math.round(Date.now() / 1000);
  const params = {
    folder: cloud.folder,
    overwrite: "true",
    public_id: publicId,
    timestamp,
    unique_filename: "false",
  };
  const body = new FormData();
  body.append("file", new Blob([fs.readFileSync(filePath)], { type: "image/png" }), `${publicId}.png`);
  body.append("api_key", cloud.apiKey);
  body.append("timestamp", String(timestamp));
  body.append("signature", sign(params, cloud.apiSecret));
  body.append("folder", cloud.folder);
  body.append("public_id", publicId);
  body.append("overwrite", "true");
  body.append("unique_filename", "false");

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud.cloudName}/image/upload`, {
    method: "POST",
    body,
  });
  const data = await res.json();
  if (!res.ok || !data.secure_url) {
    throw new Error(data.error?.message || `Cloudinary ${res.status} for ${publicId}`);
  }
  return data.secure_url;
}

async function uploadWithRetry(filePath, publicId, cloud) {
  let last;
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    try {
      return await uploadPng(filePath, publicId, cloud);
    } catch (error) {
      last = error;
      const wait = Math.min(30000, 800 * 2 ** (attempt - 1));
      console.warn(`retry ${attempt}/6 ${publicId}: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }
  throw last;
}

async function seedNeon(lessons, words, imageUrls) {
  const sql = neon(env("DATABASE_URL"));
  await sql.query(`
    CREATE TABLE IF NOT EXISTS minna_lessons (
      lesson INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      book TEXT NOT NULL,
      jlpt TEXT NOT NULL
    )
  `);
  await sql.query(`
    CREATE TABLE IF NOT EXISTS minna_words (
      lesson INTEGER NOT NULL,
      "order" INTEGER NOT NULL,
      kana TEXT NOT NULL,
      kanji TEXT NOT NULL DEFAULT '',
      romaji TEXT NOT NULL DEFAULT '',
      sino_vietnamese TEXT NOT NULL DEFAULT '',
      meaning TEXT NOT NULL,
      audio_url TEXT NOT NULL DEFAULT '',
      image_url TEXT NOT NULL DEFAULT '',
      PRIMARY KEY (lesson, "order")
    )
  `);

  for (const lesson of lessons) {
    await sql`
      INSERT INTO minna_lessons (lesson, title, book, jlpt)
      VALUES (${lesson.lesson}, ${lesson.title}, ${lesson.book}, ${lesson.jlpt})
      ON CONFLICT (lesson) DO UPDATE SET
        title = EXCLUDED.title,
        book = EXCLUDED.book,
        jlpt = EXCLUDED.jlpt
    `;
  }

  let inserted = 0;
  for (const word of words) {
    const imageUrl = imageUrls[wordFileName(word)] || "";
    await sql`
      INSERT INTO minna_words (
        lesson, "order", kana, kanji, romaji, sino_vietnamese, meaning, audio_url, image_url
      )
      VALUES (
        ${word.lesson}, ${word.order}, ${word.kana}, ${word.kanji || ""}, ${word.romaji || ""},
        ${word.sinoVietnamese || ""}, ${word.meaning}, ${word.audioUrl || ""}, ${imageUrl}
      )
      ON CONFLICT (lesson, "order") DO UPDATE SET
        kana = EXCLUDED.kana,
        kanji = EXCLUDED.kanji,
        romaji = EXCLUDED.romaji,
        sino_vietnamese = EXCLUDED.sino_vietnamese,
        meaning = EXCLUDED.meaning,
        audio_url = EXCLUDED.audio_url,
        image_url = EXCLUDED.image_url
    `;
    inserted += 1;
    if (inserted % 200 === 0) {
      console.log(`neon words ${inserted}/${words.length}`);
    }
  }
  const lessonCount = await sql.query("SELECT COUNT(*)::int AS n FROM minna_lessons");
  const wordCount = await sql.query("SELECT COUNT(*)::int AS n FROM minna_words");
  const withImage = await sql.query("SELECT COUNT(*)::int AS n FROM minna_words WHERE image_url <> ''");
  console.log(`neon done: ${lessonCount[0].n} lessons, ${wordCount[0].n} words, ${withImage[0].n} with image`);
}

async function main() {
  const cloud = {
    cloudName: env("CLOUDINARY_IMAGE_CLOUD_NAME"),
    apiKey: env("CLOUDINARY_IMAGE_API_KEY"),
    apiSecret: env("CLOUDINARY_IMAGE_API_SECRET"),
    folder: env("CLOUDINARY_IMAGE_FOLDER").replace(/^\/+|\/+$/g, ""),
  };
  const lessons = require(path.join(ROOT, "src/data/lessons.json"));
  const words = require(path.join(ROOT, "src/data/minna-vocabulary.json"));
  const state = loadState();
  state.images = state.images || {};

  const toUpload = [];
  let missing = 0;
  for (const word of words) {
    const id = wordFileName(word);
    if (state.images[id]) {
      continue;
    }
    const filePath = path.join(WORDS_DIR, `${id}.png`);
    if (!fs.existsSync(filePath)) {
      missing += 1;
      continue;
    }
    toUpload.push({ id, filePath });
  }

  console.log(`lessons ${lessons.length}, words ${words.length}`);
  console.log(`cloudinary already ${Object.keys(state.images).length}, upload ${toUpload.length}, no local png ${missing}`);

  let done = 0;
  await mapPool(toUpload, CONCURRENCY, async (item) => {
    const url = await uploadWithRetry(item.filePath, item.id, cloud);
    state.images[item.id] = url;
    done += 1;
    if (done % 25 === 0 || done === toUpload.length) {
      saveState(state);
      console.log(`cloudinary ${Object.keys(state.images).length} saved (${done}/${toUpload.length} this run)`);
    }
  });
  saveState(state);

  await seedNeon(lessons, words, state.images);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

type Sql = NeonQueryFunction<false, false>;

let sql: Sql | null = null;
let schemaReady: Promise<void> | null = null;

function databaseUrl() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("Chưa cấu hình DATABASE_URL. Thêm connection string Neon vào .env");
  }
  return url;
}

export function getSql(): Sql {
  if (!sql) {
    sql = neon(databaseUrl());
  }
  return sql;
}

export async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const client = getSql();
      await client`
        CREATE TABLE IF NOT EXISTS custom_lessons (
          lesson INTEGER PRIMARY KEY,
          title TEXT NOT NULL,
          book TEXT NOT NULL DEFAULT 'Tự soạn',
          jlpt TEXT NOT NULL DEFAULT 'Tự soạn',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await client`
        CREATE TABLE IF NOT EXISTS custom_words (
          lesson INTEGER NOT NULL,
          "order" INTEGER NOT NULL,
          kana TEXT NOT NULL,
          kanji TEXT NOT NULL DEFAULT '',
          romaji TEXT NOT NULL DEFAULT '',
          sino_vietnamese TEXT NOT NULL DEFAULT '',
          meaning TEXT NOT NULL,
          audio_url TEXT NOT NULL DEFAULT '',
          image_url TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (lesson, "order")
        )
      `;
      await client`
        CREATE TABLE IF NOT EXISTS grammar_lessons (
          jlpt TEXT NOT NULL,
          lesson INTEGER NOT NULL,
          title TEXT NOT NULL,
          subtitle TEXT NOT NULL DEFAULT '',
          catalog_lesson INTEGER,
          source TEXT NOT NULL DEFAULT 'user',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (jlpt, lesson)
        )
      `;
      await client`
        CREATE TABLE IF NOT EXISTS grammar_points (
          id SERIAL PRIMARY KEY,
          jlpt TEXT NOT NULL,
          lesson INTEGER NOT NULL,
          sort INTEGER NOT NULL DEFAULT 0,
          pattern TEXT NOT NULL,
          meaning TEXT NOT NULL,
          form TEXT NOT NULL DEFAULT '',
          note TEXT NOT NULL DEFAULT '',
          examples JSONB NOT NULL DEFAULT '[]'::jsonb,
          source TEXT NOT NULL DEFAULT 'user',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await client`
        CREATE INDEX IF NOT EXISTS grammar_points_lesson_idx
        ON grammar_points (jlpt, lesson, sort, id)
      `;
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  await schemaReady;
}

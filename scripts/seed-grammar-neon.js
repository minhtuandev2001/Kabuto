/**
 * One-off seed already ran. This just reports Neon grammar counts.
 *   npm run seed:grammar
 */
const fs = require("fs");
const path = require("path");
const { neon } = require("@neondatabase/serverless");

function loadEnv() {
  const file = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(file)) {
    return;
  }
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const at = trimmed.indexOf("=");
    if (at < 1) {
      continue;
    }
    const key = trimmed.slice(0, at).trim();
    let value = trimmed.slice(at + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function main() {
  loadEnv();
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("Missing DATABASE_URL");
  }
  const sql = neon(url);
  const totals = await sql`
    SELECT
      (SELECT COUNT(*)::int FROM grammar_lessons) AS lessons,
      (SELECT COUNT(*)::int FROM grammar_points) AS points
  `;
  console.log(`Neon grammar: ${totals[0].lessons} lessons, ${totals[0].points} points`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

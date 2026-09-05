import assert from "node:assert/strict";
import { parseCsv, toCsv } from "../src/lib/csv";
import {
  parseGrammarImport,
  parseLessonImport,
  parseWordImport,
  SAMPLE_ROWS,
  sampleCsv,
} from "../src/lib/transfer";
import { fileToImportText, tableToXlsx, xlsxToGrid } from "../src/lib/xlsx";

const quoted = parseCsv(toCsv([["a", "b"], ["x,y", 'he said "hi"'], ["line\nbreak", "ok"]]));
assert.equal(quoted[1][0], "x,y");
assert.equal(quoted[1][1], 'he said "hi"');
assert.equal(quoted[2][0], "line\nbreak");

const wordsCsv = sampleCsv("words");
assert.equal(parseCsv(wordsCsv)[0][0], "lesson");
assert.equal(parseCsv(wordsCsv)[0][1], "hiragana/katakana");
assert.deepEqual(parseCsv(toCsv(parseCsv(wordsCsv))), parseCsv(wordsCsv));

const words = parseWordImport(wordsCsv);
assert.equal(words.rows.length, 2);
assert.equal(words.rows[0]?.kana, "おはよう");
assert.equal(words.rows[1]?.kana, "コーヒー");
assert.equal(words.rows[0]?.row, 2);
assert.equal(words.rows[0]?.sinoVietnamese, "");

const slashHeader = parseWordImport("lesson,Hiragana / Katakana,meaning\n1,コーヒー,cà phê");
assert.equal(slashHeader.rows[0]?.kana, "コーヒー");

const vietHeader = parseWordImport("lesson,Hiragana／Katakana,Ý nghĩa\n1,おはよう,chào buổi sáng");
assert.equal(vietHeader.rows[0]?.kana, "おはよう");
assert.equal(vietHeader.rows[0]?.meaning, "chào buổi sáng");

assert.throws(
  () => parseWordImport("lesson,kanji,romaji\n1,朝,asa"),
  /hiragana\/katakana/,
);

const mixed = parseWordImport("lesson,kana,meaning\nbad,あ,hi\n1,あ,xin chào\n2,,thiếu kana");
assert.deepEqual(
  mixed.errors.map((item) => item.row),
  [2, 4],
);
assert.equal(mixed.rows.length, 1);
assert.equal(mixed.rows[0]?.row, 3);
assert.equal(mixed.rows[0]?.lesson, 1);

const lessons = parseLessonImport(sampleCsv("lessons"));
assert.equal(lessons.rows.length, 2);
assert.equal(lessons.rows[0]?.lesson, undefined);
assert.equal(lessons.rows[0]?.title, "Chào hỏi buổi sáng");

const numbered = parseLessonImport("lesson,title,book,jlpt\n101,Chào,,N5\nabc,Lỗi,,N5");
assert.equal(numbered.rows[0]?.lesson, 101);
assert.equal(numbered.errors[0]?.row, 3);

const grammar = parseGrammarImport(sampleCsv("grammar"));
assert.equal(grammar.rows[0]?.pattern, "〜たい");
assert.equal(grammar.rows[0]?.examples[0]?.jp, "寿司が食べたいです。");

const multi = parseGrammarImport(
  "lesson,pattern,meaning,exampleJp,exampleVi\n1,〜た,xong,A。 | B。,x | y",
);
assert.equal(multi.rows[0]?.examples.length, 2);
assert.equal(multi.rows[0]?.examples[1]?.vi, "y");

const xlsx = tableToXlsx(SAMPLE_ROWS.words);
assert.equal(xlsxToGrid(xlsx)[0]?.[1], "hiragana/katakana");
assert.deepEqual(xlsxToGrid(xlsx)[1], SAMPLE_ROWS.words[1]);
const fromXlsx = parseWordImport(fileToImportText({ xlsx: xlsx.toString("base64") }));
assert.equal(fromXlsx.rows[0]?.kana, "おはよう");
assert.equal(fromXlsx.rows[0]?.meaning, "chào buổi sáng");
assert.equal(fromXlsx.rows[0]?.romaji, "ohayou");

// Excel-style empty self-closing cells between kanji and meaning (user file pattern).
const sparse = tableToXlsx([
  ["lesson", "hiragana/katakana", "kanji", "romaji", "sinoVietnamese", "meaning"],
  ["51", "だんせい", "男性", "", "", "đàn ông"],
]);
const sparseGrid = xlsxToGrid(sparse);
assert.equal(sparseGrid[1][3], "");
assert.equal(sparseGrid[1][5], "đàn ông");
assert.equal(parseWordImport(fileToImportText({ xlsx: sparse.toString("base64") })).rows[0]?.meaning, "đàn ông");

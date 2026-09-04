import assert from "node:assert/strict";
import { assembleGrammarLessons } from "../src/lib/grammar";

const lessons = assembleGrammarLessons(
  [
    { jlpt: "N4", lesson: 1, title: "b", subtitle: "", catalog_lesson: 26, source: "seed" },
    { jlpt: "N5", lesson: 1, title: "a", subtitle: "", catalog_lesson: 1, source: "seed" },
  ],
  [
    {
      id: 2,
      jlpt: "N5",
      lesson: 1,
      sort: 1,
      pattern: "P2",
      meaning: "m",
      form: "",
      note: "",
      examples: [{ jp: "x", vi: "y" }],
      source: "seed",
    },
    {
      id: 1,
      jlpt: "N5",
      lesson: 1,
      sort: 0,
      pattern: "P1",
      meaning: "m",
      form: "",
      note: "",
      examples: "not-json",
      source: "user",
    },
  ],
);

assert.equal(lessons.map((item) => item.jlpt).join(), "N5,N4");
assert.equal(lessons[0].points.map((item) => item.pattern).join(), "P1,P2");
assert.equal(lessons[0].points[0].custom, true);
assert.equal(lessons[0].points[0].examples.length, 0);
assert.equal(lessons[0].points[1].examples[0]?.jp, "x");
console.log("grammar assemble ok");

import assert from "node:assert/strict";
import { hScrollStep } from "../src/components/HScroll";
import {
  assembleGrammarLessons,
  builtinSlotFromCatalog,
  catalogLessonForBuiltin,
  JLPT_LEVELS,
} from "../src/lib/grammar";

assert.equal(JLPT_LEVELS.join(), "N5,N4,N3,N2,N1");

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
assert.equal(
  assembleGrammarLessons(
    [
      { jlpt: "N1", lesson: 1, title: "c", subtitle: "", catalog_lesson: null, source: "seed" },
      { jlpt: "N2", lesson: 1, title: "d", subtitle: "", catalog_lesson: null, source: "seed" },
    ],
    [],
  )
    .map((item) => item.jlpt)
    .join(),
  "N2,N1",
);
assert.equal(lessons[0].points.map((item) => item.pattern).join(), "P1,P2");
assert.equal(lessons[0].points[0].custom, true);
assert.equal(lessons[0].points[0].examples.length, 0);
assert.equal(lessons[0].points[1].examples[0]?.jp, "x");

const chips = [
  { offsetLeft: 0, offsetWidth: 80 },
  { offsetLeft: 88, offsetWidth: 100 },
];
assert.equal(hScrollStep(0, 100, chips, 1), 120);
assert.equal(hScrollStep(88, 100, chips, -1), -100);
assert.equal(hScrollStep(0, 400, chips, 1), 100);
assert.equal(hScrollStep(0, 100, [], 1), 0);

assert.equal(catalogLessonForBuiltin("N5", 1), 1);
assert.equal(catalogLessonForBuiltin("N5", 25), 25);
assert.equal(catalogLessonForBuiltin("N4", 1), 26);
assert.equal(catalogLessonForBuiltin("N4", 25), 50);
assert.equal(catalogLessonForBuiltin("N3", 1), 51);
assert.equal(catalogLessonForBuiltin("N3", 15), 65);
assert.equal(catalogLessonForBuiltin("N2", 1), 66);
assert.equal(catalogLessonForBuiltin("N2", 20), 85);
assert.equal(catalogLessonForBuiltin("N1", 1), 86);
assert.equal(catalogLessonForBuiltin("N1", 15), 100);
assert.equal(catalogLessonForBuiltin("N3", 16), null);
assert.equal(catalogLessonForBuiltin("N5", 26), null);
assert.equal(catalogLessonForBuiltin("N2", 0), null);
assert.equal(builtinSlotFromCatalog(101), null);
assert.equal(builtinSlotFromCatalog(50)?.jlpt, "N4");
assert.equal(builtinSlotFromCatalog(51)?.jlpt, "N3");
assert.equal(builtinSlotFromCatalog(65)?.jlpt, "N3");
assert.equal(builtinSlotFromCatalog(66)?.jlpt, "N2");
assert.equal(builtinSlotFromCatalog(85)?.jlpt, "N2");
assert.equal(builtinSlotFromCatalog(86)?.jlpt, "N1");
for (const jlpt of JLPT_LEVELS) {
  for (let lesson = 1; lesson <= 25; lesson += 1) {
    const catalogLesson = catalogLessonForBuiltin(jlpt, lesson);
    if (catalogLesson == null) {
      continue;
    }
    assert.deepEqual(builtinSlotFromCatalog(catalogLesson), { jlpt, lesson, catalogLesson });
  }
}

console.log("grammar assemble ok");

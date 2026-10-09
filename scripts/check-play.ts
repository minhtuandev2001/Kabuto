import assert from "node:assert/strict";
import { buildDeck, buildOptions, optionLabel, praiseFor, sameMeaningWords } from "../src/lib/play/deck";
import { canTypeWord, isReadingCorrect, normalizeKana, readingCandidates, romajiToHiragana } from "../src/lib/play/kana";
import { bumpStreak, isDue, liveStreak, recordAnswer, wordKey } from "../src/lib/play/progress";
import type { VocabWord } from "../src/lib/types";

function word(kana: string, extra: Partial<VocabWord> = {}): VocabWord {
  return { lesson: 1, order: 1, kana, kanji: "", romaji: "", sinoVietnamese: "", meaning: kana, audioUrl: "", ...extra };
}

assert.equal(romajiToHiragana("sensei"), "せんせい");
assert.equal(romajiToHiragana("konnichiwa"), "こんにちわ");
assert.equal(romajiToHiragana("konnnichiha"), "こんにちは");
assert.equal(romajiToHiragana("kitte"), "きって");
assert.equal(romajiToHiragana("matcha"), "まっちゃ");
assert.equal(romajiToHiragana("shinbun"), "しんぶん");
assert.equal(romajiToHiragana("kan'i"), "かんい");
assert.equal(romajiToHiragana("kyou"), "きょう");
assert.equal(romajiToHiragana("tsukue"), "つくえ");
assert.equal(romajiToHiragana("ko-hi-"), "こーひー");

assert.equal(normalizeKana("コーヒー"), "こおひい");
assert.equal(normalizeKana("～ほど"), "ほど");
assert.equal(normalizeKana("めが　さめます"), "めがさめます");

assert.ok(isReadingCorrect("koohii", word("コーヒー")));
assert.ok(isReadingCorrect("ko-hi-", word("コーヒー")));
assert.ok(isReadingCorrect("コーヒー", word("コーヒー")));
assert.ok(isReadingCorrect("mi-tingu", word("ミーティング")) === false);
assert.ok(isReadingCorrect("mi-thingu", word("ミーティング")));
assert.ok(isReadingCorrect("hodo", word("～ほど")));
assert.ok(isReadingCorrect("soudan", word("そうだん（する）")));
assert.ok(isReadingCorrect("soudansuru", word("そうだん（する）")));
assert.ok(isReadingCorrect("先生", word("せんせい", { kanji: "先生" })));
assert.ok(!isReadingCorrect("sense", word("せんせい")));
assert.ok(!isReadingCorrect("", word("せんせい")));
assert.ok(isReadingCorrect("benkyou", word("勉強", { kanji: "勉強", romaji: "benkyou" })));
assert.equal(canTypeWord(word("勉強", { kanji: "勉強" })), false);
assert.deepEqual(readingCandidates(word("あした/あす")), ["あした", "あす"]);

const today = 20_000;
const first = recordAnswer(undefined, true, today);
assert.deepEqual(first, { box: 1, due: today + 1, seen: 1, wrong: 0 });
const second = recordAnswer(first, true, today + 1);
assert.equal(second.box, 2);
assert.equal(second.due, today + 4);
const missed = recordAnswer(second, false, today + 4);
assert.deepEqual(missed, { box: 1, due: today + 4, seen: 3, wrong: 1 });
assert.ok(isDue(missed, today + 4));
assert.ok(!isDue(undefined, today));

assert.deepEqual(bumpStreak({ day: today - 1, count: 4 }, today), { day: today, count: 5 });
assert.deepEqual(bumpStreak({ day: today - 3, count: 4 }, today), { day: today, count: 1 });
assert.deepEqual(bumpStreak({ day: today, count: 4 }, today), { day: today, count: 4 });
assert.equal(liveStreak({ day: today - 2, count: 9 }, today), 0);

const words = Array.from({ length: 30 }, (_, i) => word(`かな${i}`, { order: i + 1, meaning: `nghĩa ${i}` }));
const stats = {
  [wordKey(words[0]!)]: recordAnswer(undefined, false, today),
  [wordKey(words[1]!)]: recordAnswer(undefined, true, today),
};
const deck = buildDeck(words, stats, 5, today + 1);
assert.equal(deck.length, 5);
assert.ok(deck.includes(words[0]!), "due word must be in the deck");
assert.ok(deck.includes(words[1]!), "word due tomorrow is due now");
assert.equal(buildDeck(words, {}, 0, today).length, 30);

const options = buildOptions(words[3]!, "word", words, words);
assert.equal(options.length, 4);
assert.ok(options.includes(words[3]!));
assert.equal(new Set(options.map((item) => optionLabel(item, "word"))).size, 4);

const interview = word("インタビュー", { meaning: "phỏng vấn", lesson: 2 });
const interviewKanji = word("めんせつ", { kanji: "面接", meaning: "phỏng vấn", lesson: 2 });
const homophone = word("かける", { meaning: "treo", lesson: 2 });
const homophone2 = word("かける", { meaning: "gọi (điện thoại)", lesson: 2 });
const lesson2 = [interview, interviewKanji, homophone, homophone2, ...words.slice(0, 6).map((item) => ({ ...item, lesson: 2 }))];
for (let i = 0; i < 40; i += 1) {
  const meaningOptions = buildOptions(interview, "meaning", lesson2, lesson2);
  assert.ok(!meaningOptions.includes(interviewKanji), "same-meaning word must not be a distractor");
  const listenOptions = buildOptions(homophone, "listen", lesson2, lesson2);
  assert.ok(!listenOptions.includes(homophone2), "same-reading word must not be a distractor");
}
assert.deepEqual(sameMeaningWords(interview, lesson2), [interviewKanji]);
assert.deepEqual(sameMeaningWords(interviewKanji, lesson2), []);

assert.equal(praiseFor(2), null);
assert.ok(praiseFor(3));
assert.ok(praiseFor(5));
assert.equal(praiseFor(7), null);
assert.ok(praiseFor(10));

console.log("check:play ok");

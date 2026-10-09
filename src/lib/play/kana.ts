import type { VocabWord } from "@/lib/types";

const VOWELS = "aiueo";

const ROMAJI: Record<string, string> = {
  a: "あ", i: "い", u: "う", e: "え", o: "お",
  ka: "か", ki: "き", ku: "く", ke: "け", ko: "こ",
  ga: "が", gi: "ぎ", gu: "ぐ", ge: "げ", go: "ご",
  sa: "さ", si: "し", shi: "し", su: "す", se: "せ", so: "そ",
  za: "ざ", zi: "じ", ji: "じ", zu: "ず", ze: "ぜ", zo: "ぞ",
  ta: "た", ti: "ち", chi: "ち", tu: "つ", tsu: "つ", te: "て", to: "と",
  da: "だ", di: "ぢ", du: "づ", de: "で", do: "ど",
  na: "な", ni: "に", nu: "ぬ", ne: "ね", no: "の",
  ha: "は", hi: "ひ", hu: "ふ", fu: "ふ", he: "へ", ho: "ほ",
  ba: "ば", bi: "び", bu: "ぶ", be: "べ", bo: "ぼ",
  pa: "ぱ", pi: "ぴ", pu: "ぷ", pe: "ぺ", po: "ぽ",
  ma: "ま", mi: "み", mu: "む", me: "め", mo: "も",
  ya: "や", yu: "ゆ", yo: "よ",
  ra: "ら", ri: "り", ru: "る", re: "れ", ro: "ろ",
  la: "ら", li: "り", lu: "る", le: "れ", lo: "ろ",
  wa: "わ", wo: "を", wi: "うぃ", we: "うぇ",
  kya: "きゃ", kyu: "きゅ", kyo: "きょ",
  gya: "ぎゃ", gyu: "ぎゅ", gyo: "ぎょ",
  sha: "しゃ", shu: "しゅ", sho: "しょ", she: "しぇ",
  sya: "しゃ", syu: "しゅ", syo: "しょ",
  ja: "じゃ", ju: "じゅ", jo: "じょ", je: "じぇ",
  jya: "じゃ", jyu: "じゅ", jyo: "じょ",
  zya: "じゃ", zyu: "じゅ", zyo: "じょ",
  cha: "ちゃ", chu: "ちゅ", cho: "ちょ", che: "ちぇ",
  tya: "ちゃ", tyu: "ちゅ", tyo: "ちょ",
  cya: "ちゃ", cyu: "ちゅ", cyo: "ちょ",
  dya: "ぢゃ", dyu: "ぢゅ", dyo: "ぢょ",
  nya: "にゃ", nyu: "にゅ", nyo: "にょ",
  hya: "ひゃ", hyu: "ひゅ", hyo: "ひょ",
  bya: "びゃ", byu: "びゅ", byo: "びょ",
  pya: "ぴゃ", pyu: "ぴゅ", pyo: "ぴょ",
  mya: "みゃ", myu: "みゅ", myo: "みょ",
  rya: "りゃ", ryu: "りゅ", ryo: "りょ",
  fa: "ふぁ", fi: "ふぃ", fe: "ふぇ", fo: "ふぉ", fyu: "ふゅ",
  thi: "てぃ", dhi: "でぃ", thu: "てゅ", dhu: "でゅ", twu: "とぅ", dwu: "どぅ",
  tsa: "つぁ", tsi: "つぃ", tse: "つぇ", tso: "つぉ",
  va: "ゔぁ", vi: "ゔぃ", vu: "ゔ", ve: "ゔぇ", vo: "ゔぉ",
  xa: "ぁ", xi: "ぃ", xu: "ぅ", xe: "ぇ", xo: "ぉ",
  xya: "ゃ", xyu: "ゅ", xyo: "ょ", lya: "ゃ", lyu: "ゅ", lyo: "ょ",
  xtu: "っ", ltu: "っ", xtsu: "っ", ltsu: "っ", xwa: "ゎ",
  "-": "ー",
};

const MACRONS: Record<string, string> = { ā: "aa", ī: "ii", ū: "uu", ē: "ee", ō: "ou", â: "aa", î: "ii", û: "uu", ê: "ee", ô: "ou" };

/** Wapuro/Hepburn romaji → hiragana, the way a Japanese IME reads keystrokes. Unknown characters pass through. */
export function romajiToHiragana(input: string): string {
  const s = input
    .toLowerCase()
    .replace(/[āīūēōâîûêô]/g, (ch) => MACRONS[ch] ?? ch);
  let out = "";
  let i = 0;
  while (i < s.length) {
    const c = s[i]!;
    const next = s[i + 1];
    if (c === "n") {
      if (next === "'") {
        out += "ん";
        i += 2;
        continue;
      }
      if (next === "n") {
        // "konnichiwa": the first n is ん and the second starts に; "konnnichiwa"/"nn" end: nn is ん.
        const after = s[i + 2];
        out += "ん";
        i += after && (VOWELS.includes(after) || after === "y") ? 1 : 2;
        continue;
      }
      if (!next || !(VOWELS.includes(next) || next === "y")) {
        out += "ん";
        i += 1;
        continue;
      }
    }
    if (next && c === next && /[bcdfghjklmpqrstvwxyz]/.test(c)) {
      out += "っ";
      i += 1;
      continue;
    }
    if (c === "t" && next === "c" && s[i + 2] === "h") {
      out += "っ";
      i += 1;
      continue;
    }
    let matched = false;
    for (let len = 4; len >= 1; len -= 1) {
      const kana = ROMAJI[s.slice(i, i + len)];
      if (kana) {
        out += kana;
        i += len;
        matched = true;
        break;
      }
    }
    if (!matched) {
      out += c;
      i += 1;
    }
  }
  return out;
}

export function toHiragana(text: string): string {
  return text.replace(/[\u30A1-\u30F6]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
}

const VOWEL_ROWS: [string, string][] = [
  ["あかがさざただなはばぱまやらわぁゃゎ", "あ"],
  ["いきぎしじちぢにひびぴみりぃ", "い"],
  ["うくぐすずつづぬふぶぷむゆるぅゅゔ", "う"],
  ["えけげせぜてでねへべぺめれぇ", "え"],
  ["おこごそぞとどのほぼぽもよろをぉょ", "お"],
];

function vowelOf(kana: string | undefined) {
  if (!kana) {
    return "";
  }
  return VOWEL_ROWS.find(([row]) => row.includes(kana))?.[1] ?? "";
}

/** Hiragana only, long-vowel mark spelled out (コーヒー → こおひい) so IME and romaji input compare equal. */
export function normalizeKana(text: string): string {
  const kana = [...toHiragana(text)].filter((ch) => /[\u3041-\u3096ー]/.test(ch));
  let out = "";
  for (const ch of kana) {
    out += ch === "ー" ? vowelOf(out[out.length - 1]) : ch;
  }
  return out;
}

const HAS_KANJI = /[\u3400-\u9FFF]/;

/** Accepted readings for a word: kana variants ("a/b", "x（する）") plus its romaji field. */
export function readingCandidates(word: VocabWord): string[] {
  const found = new Set<string>();
  for (const part of word.kana.split(/[/／・、,]/)) {
    const variants = [part.replace(/[（(][^）)]*[）)]/g, ""), part.replace(/[（()）]/g, "")];
    for (const variant of variants) {
      if (HAS_KANJI.test(variant)) {
        continue;
      }
      const reading = normalizeKana(variant);
      if (reading) {
        found.add(reading);
      }
    }
  }
  const romaji = word.romaji.trim();
  if (romaji && /^[\sa-zāīūēōâîûêô'\-]+$/i.test(romaji)) {
    const reading = normalizeKana(romajiToHiragana(romaji.replace(/\s+/g, "")));
    if (reading) {
      found.add(reading);
    }
  }
  return [...found];
}

export function canTypeWord(word: VocabWord) {
  return readingCandidates(word).length > 0;
}

/** Typed input (romaji, kana, or the exact kanji) vs the word's reading. */
export function isReadingCorrect(input: string, word: VocabWord): boolean {
  const raw = input.trim();
  if (!raw) {
    return false;
  }
  if (word.kanji.trim() && raw === word.kanji.trim()) {
    return true;
  }
  const typed = normalizeKana(/[a-z]/i.test(raw) ? romajiToHiragana(raw.replace(/\s+/g, "")) : raw);
  return Boolean(typed) && readingCandidates(word).includes(typed);
}

/** What the input box shows under the field while typing romaji. */
export function previewKana(input: string): string {
  return /[a-z]/i.test(input) ? romajiToHiragana(input.replace(/\s+/g, "")) : "";
}

/** Primary reading shown as the answer / used for hints, kept in the word's own script. */
export function displayReading(word: VocabWord): string {
  const first = word.kana.split(/[/／・、,]/)[0]?.trim() ?? "";
  return HAS_KANJI.test(first) ? word.romaji || first : first;
}

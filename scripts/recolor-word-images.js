/**
 * Recolor purple-heavy vocab illustrations using the word meaning.
 * Originals: words-src/  →  output: public/words/
 *
 * One coherent object color (plus trim/accent), not spatial color patches.
 *
 *   node scripts/recolor-word-images.js
 *   node scripts/recolor-word-images.js --force
 *   node scripts/recolor-word-images.js --watch
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'words');
const SRC_DIR = path.join(ROOT, 'words-src');
const VOCAB_PATH = path.join(ROOT, 'src', 'data', 'minna-vocabulary.json');
const STATE_PATH = path.join(__dirname, '.recolor-state.json');
const FILE_RE = /^l\d{2}-\d{3}\.png$/;
const ALGO = 'semantic-v3';

const PERSON_HUES = [200, 18, 165, 32, 345, 210, 145, 25];

function readPng(file) {
  const raw = fs.readFileSync(file);
  const end = raw.indexOf('IEND');
  const buf = end === -1 ? raw : raw.subarray(0, end + 8);
  return PNG.sync.read(buf);
}

function writePng(file, png) {
  fs.writeFileSync(file, PNG.sync.write(png));
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s, l];
}

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  return [
    Math.round(Math.min(255, Math.max(0, (r + m) * 255))),
    Math.round(Math.min(255, Math.max(0, (g + m) * 255))),
    Math.round(Math.min(255, Math.max(0, (b + m) * 255))),
  ];
}

function hashName(name) {
  let h = 2166136261;
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function isBackground(r, g, b, a) {
  return a < 8 || r + g + b < 28;
}

function isSkinTone(h, s, l) {
  return h >= 4 && h <= 48 && s >= 0.14 && s <= 0.72 && l >= 0.22 && l <= 0.88;
}

function isPurpleish(h, s, l, r, g, b) {
  if (l < 0.035 || l > 0.97) return false;
  if (s >= 0.045 && h >= 205 && h <= 330) return true;
  if (s > 0.14 && h > 330 && h < 352) return true;
  const blueLead = b - Math.max(r, g);
  if (blueLead > 7 && s >= 0.03 && !(g > r + 12 && Math.abs(g - b) < 18)) return true;
  return false;
}

function S(partial) {
  return {
    kind: 'object',
    whiteBody: false,
    bodyH: 200,
    bodyS: 0.52,
    accentH: 8,
    accentS: 0.78,
    windowH: 205,
    windowS: 0.32,
    hasWindows: false,
    ...partial,
  };
}

function loadVocab() {
  const map = new Map();
  if (!fs.existsSync(VOCAB_PATH)) return map;
  const words = JSON.parse(fs.readFileSync(VOCAB_PATH, 'utf8'));
  for (const w of words) {
    const name = `l${String(w.lesson).padStart(2, '0')}-${String(w.order).padStart(3, '0')}.png`;
    map.set(name, w);
  }
  return map;
}

const VOCAB = loadVocab();

function textOf(word) {
  if (!word) return '';
  return `${word.meaning || ''} ${word.kana || ''} ${word.kanji || ''} ${word.romaji || ''}`.toLowerCase();
}

function pickScheme(word, fileName) {
  const t = textOf(word);
  const hue = PERSON_HUES[hashName(fileName) % PERSON_HUES.length];

  if (/cấp cứu/.test(t)) {
    return S({ kind: 'vehicle', whiteBody: true, bodyH: 0, bodyS: 0.04, accentH: 2, accentS: 0.86, hasWindows: true });
  }
  if (/cảnh sát/.test(t)) {
    return S({ kind: 'vehicle', whiteBody: true, bodyH: 210, bodyS: 0.06, accentH: 215, accentS: 0.7, hasWindows: true });
  }
  if (/bệnh viện|びょういん|byouin/.test(t)) {
    return S({
      kind: 'scene',
      whiteBody: true,
      bodyH: 210,
      bodyS: 0.05,
      accentH: 2,
      accentS: 0.86,
      hasWindows: true,
    });
  }
  if (/bác sĩ|y tá|bác sỹ/.test(t)) {
    return S({ kind: 'person', whiteBody: true, bodyH: 210, bodyS: 0.05, accentH: 2, accentS: 0.8 });
  }

  if (/tắc-xi|taxi/.test(t)) {
    return S({ kind: 'vehicle', bodyH: 46, bodyS: 0.88, accentH: 0, accentS: 0.08, hasWindows: true });
  }
  if (/xe buýt/.test(t)) {
    return S({ kind: 'vehicle', whiteBody: true, bodyH: 40, bodyS: 0.06, accentH: 145, accentS: 0.62, hasWindows: true });
  }
  if (/shinkansen|siêu tốc/.test(t)) {
    return S({ kind: 'vehicle', whiteBody: true, bodyH: 210, bodyS: 0.05, accentH: 210, accentS: 0.7, hasWindows: true });
  }
  if (/tàu điện ngầm/.test(t)) {
    return S({ kind: 'vehicle', bodyH: 215, bodyS: 0.55, accentH: 45, accentS: 0.75, hasWindows: true });
  }
  if (/tàu điện|tàu hỏa|tàu thường|tàu tốc|đoàn tàu/.test(t)) {
    return S({ kind: 'vehicle', whiteBody: true, bodyH: 200, bodyS: 0.06, accentH: 150, accentS: 0.55, hasWindows: true });
  }
  if (/máy bay/.test(t)) {
    return S({ kind: 'vehicle', whiteBody: true, bodyH: 210, bodyS: 0.05, accentH: 210, accentS: 0.65, hasWindows: true });
  }
  if (/thuyền|tàu thủy/.test(t)) {
    return S({ kind: 'vehicle', whiteBody: true, bodyH: 210, bodyS: 0.05, accentH: 2, accentS: 0.8 });
  }
  if (/xe đạp/.test(t)) {
    return S({ kind: 'vehicle', bodyH: 200, bodyS: 0.72, accentH: 2, accentS: 0.8 });
  }
  if (/xe máy/.test(t)) {
    return S({ kind: 'vehicle', bodyH: 8, bodyS: 0.72, accentH: 0, accentS: 0.05 });
  }
  if (/xe tải/.test(t)) {
    return S({ kind: 'vehicle', bodyH: 32, bodyS: 0.78, accentH: 0, accentS: 0.08, hasWindows: true });
  }
  if (/ô tô|xe hơi|xe ô|ô-tô/.test(t)) {
    return S({ kind: 'vehicle', whiteBody: true, bodyH: 0, bodyS: 0.04, accentH: 2, accentS: 0.84, hasWindows: true });
  }

  if (/bưu điện/.test(t)) {
    return S({ whiteBody: true, bodyH: 0, bodyS: 0.04, accentH: 2, accentS: 0.82, hasGround: true });
  }
  if (/ngân hàng/.test(t)) {
    return S({ bodyH: 40, bodyS: 0.12, accentH: 42, accentS: 0.7, whiteBody: true, hasGround: true, groundH: 145 });
  }
  if (/thư viện/.test(t)) {
    return S({ bodyH: 28, bodyS: 0.45, accentH: 145, accentS: 0.5, hasGround: true });
  }
  if (/bảo tàng/.test(t)) {
    return S({ bodyH: 38, bodyS: 0.28, accentH: 210, accentS: 0.45, hasGround: true });
  }
  if (/siêu thị/.test(t)) {
    return S({ whiteBody: true, bodyH: 32, bodyS: 0.08, accentH: 28, accentS: 0.82, hasGround: true });
  }
  if (/bách hóa/.test(t)) {
    return S({ whiteBody: true, bodyH: 20, bodyS: 0.06, accentH: 355, accentS: 0.7, hasGround: true });
  }
  if (/nhà ga|^ga,|ga số/.test(t)) {
    return S({ whiteBody: true, bodyH: 150, bodyS: 0.06, accentH: 145, accentS: 0.55, hasGround: true });
  }
  if (/trường|đại học/.test(t)) {
    return S({
      whiteBody: true,
      bodyH: 38,
      bodyS: 0.08,
      accentH: 210,
      accentS: 0.55,
      hasGround: true,
      groundH: 145,
    });
  }
  if (/nhà ăn|nhà hàng/.test(t)) {
    return S({ bodyH: 28, bodyS: 0.45, accentH: 12, accentS: 0.7, hasGround: true });
  }
  if (/công ty/.test(t)) {
    return S({ bodyH: 210, bodyS: 0.35, accentH: 210, accentS: 0.15, whiteBody: true, hasWindows: true });
  }
  if (/nhà vệ sinh|toa-lét|toilet/.test(t)) {
    return S({ whiteBody: true, bodyH: 200, bodyS: 0.08, accentH: 200, accentS: 0.4 });
  }
  if (/lớp học|phòng học|văn phòng|phòng họp|hành lang|căn phòng/.test(t)) {
    return S({ bodyH: 38, bodyS: 0.22, accentH: 210, accentS: 0.35, whiteBody: true });
  }
  if (/cầu thang|thang máy|thang cuốn/.test(t)) {
    return S({ bodyH: 210, bodyS: 0.12, accentH: 38, accentS: 0.45, whiteBody: true });
  }
  if (/(^|[\s,])nhà([\s,]|$)|nhà chung cư|nhà máy/.test(t) && !/nhà ga|nhà hàng|nhà ăn|nhà nghiên|nhà văn|nhà thờ/.test(t)) {
    return S({
      whiteBody: true,
      bodyH: 32,
      bodyS: 0.1,
      accentH: 18,
      accentS: 0.55,
      hasGround: true,
      groundH: 145,
    });
  }

  if (/tivi/.test(t)) {
    return S({ bodyH: 38, bodyS: 0.18, accentH: 220, accentS: 0.25, whiteBody: true, hasWindows: true });
  }
  if (/radio/.test(t)) {
    return S({ bodyH: 32, bodyS: 0.35, accentH: 0, accentS: 0.08 });
  }
  if (/máy vi tính|máy ảnh|máy ghi|máy điện thoại|điện thoại/.test(t)) {
    return S({ bodyH: 210, bodyS: 0.08, accentH: 210, accentS: 0.2, whiteBody: true, hasWindows: true });
  }
  if (/đồng hồ/.test(t)) {
    return S({ whiteBody: true, bodyH: 40, bodyS: 0.06, accentH: 0, accentS: 0.08 });
  }
  if (/bút chì kim|bút chì bấm/.test(t)) {
    return S({ bodyH: 0, bodyS: 0.06, accentH: 2, accentS: 0.7, whiteBody: true });
  }
  if (/bút chì/.test(t)) {
    return S({ bodyH: 48, bodyS: 0.85, accentH: 350, accentS: 0.55 });
  }
  if (/bút bi/.test(t)) {
    return S({ bodyH: 215, bodyS: 0.7, accentH: 0, accentS: 0.05 });
  }
  if (/chìa khóa/.test(t)) {
    return S({ bodyH: 42, bodyS: 0.7, accentH: 38, accentS: 0.4 });
  }
  if (/ô, dù|^ô /.test(t)) {
    return S({ bodyH: 2, bodyS: 0.78, accentH: 0, accentS: 0.08 });
  }
  if (/cặp sách|túi sách/.test(t)) {
    return S({ bodyH: 25, bodyS: 0.5, accentH: 30, accentS: 0.35 });
  }
  if (/sách|từ điển|tạp chí|báo|vở|sổ tay|danh thiếp|thẻ/.test(t)) {
    return S({ bodyH: 38, bodyS: 0.18, accentH: hue, accentS: 0.62, whiteBody: true });
  }
  if (/cà vạt/.test(t)) {
    return S({ bodyH: 355, bodyS: 0.7, accentH: 42, accentS: 0.55 });
  }
  if (/giầy|giày/.test(t)) {
    return S({ bodyH: 25, bodyS: 0.42, accentH: 0, accentS: 0.08 });
  }
  if (/cà phê/.test(t)) {
    return S({ bodyH: 22, bodyS: 0.45, accentH: 25, accentS: 0.55 });
  }
  if (/socola|chocolate/.test(t)) {
    return S({ bodyH: 22, bodyS: 0.55, accentH: 28, accentS: 0.4 });
  }
  if (/rượu/.test(t)) {
    return S({ bodyH: 345, bodyS: 0.55, accentH: 145, accentS: 0.4 });
  }
  if (/thuốc lá/.test(t)) {
    return S({ whiteBody: true, bodyH: 40, bodyS: 0.06, accentH: 28, accentS: 0.8 });
  }
  if (/bàn/.test(t)) {
    return S({ bodyH: 28, bodyS: 0.4, accentH: 30, accentS: 0.25 });
  }
  if (/ghế/.test(t)) {
    return S({ bodyH: 18, bodyS: 0.55, accentH: 25, accentS: 0.3 });
  }

  if (/buổi sáng|sáng nay|hàng sáng|trước 12/.test(t)) {
    return S({ bodyH: 42, bodyS: 0.7, accentH: 28, accentS: 0.75 });
  }
  if (/buổi trưa|nghỉ trưa/.test(t)) {
    return S({ bodyH: 48, bodyS: 0.8, accentH: 28, accentS: 0.6 });
  }
  if (/buổi tối|tối nay|hàng tối/.test(t)) {
    return S({ bodyH: 230, bodyS: 0.45, accentH: 28, accentS: 0.7 });
  }
  if (/sinh nhật/.test(t)) {
    return S({ bodyH: 340, bodyS: 0.55, accentH: 48, accentS: 0.8 });
  }
  if (/chủ nhật/.test(t)) {
    return S({ bodyH: 2, bodyS: 0.72, accentH: 0, accentS: 0.08, whiteBody: false });
  }

  if (/nhật bản/.test(t)) return S({ whiteBody: true, bodyH: 0, bodyS: 0.04, accentH: 2, accentS: 0.86 });
  if (/mỹ/.test(t)) return S({ bodyH: 215, bodyS: 0.55, accentH: 2, accentS: 0.8 });
  if (/trung quốc/.test(t)) return S({ bodyH: 2, bodyS: 0.78, accentH: 45, accentS: 0.8 });
  if (/hàn quốc/.test(t)) return S({ whiteBody: true, bodyH: 0, bodyS: 0.04, accentH: 2, accentS: 0.8 });
  if (/pháp/.test(t)) return S({ bodyH: 215, bodyS: 0.55, accentH: 2, accentS: 0.78 });
  if (/đức/.test(t)) return S({ bodyH: 42, bodyS: 0.75, accentH: 2, accentS: 0.75 });
  if (/anh\b/.test(t) && /nước|quốc|britain|england/.test(t)) {
    return S({ bodyH: 215, bodyS: 0.5, accentH: 2, accentS: 0.8 });
  }
  if (/thái lan/.test(t)) return S({ bodyH: 2, bodyS: 0.7, accentH: 215, accentS: 0.55 });
  if (/ấn độ/.test(t)) return S({ bodyH: 32, bodyS: 0.75, accentH: 145, accentS: 0.5 });
  if (/braxin|brazil/.test(t)) return S({ bodyH: 145, bodyS: 0.6, accentH: 48, accentS: 0.8 });

  if (
    /tôi|chúng ta|chúng tôi|anh\/ chị|người kia|vị kia|các anh|học sinh|sinh viên|giáo viên|thầy|nhân viên|kỹ sư|nghiên cứu|bạn bè|gia đình|một mình|đi bộ/.test(
      t,
    ) ||
    /sensei|gakusei|kaishain/.test(t)
  ) {
    return S({ kind: 'person', bodyH: hue, bodyS: 0.62, accentH: hue, accentS: 0.35 });
  }

  return S({ bodyH: hue, bodyS: 0.55, accentH: (hue + 40) % 360, accentS: 0.45 });
}

function paintHsl(h, s, l) {
  const lit = Math.min(0.92, Math.max(0.06, l));
  const sat = Math.min(0.9, Math.max(0, s));
  return hslToRgb(h, sat, lit);
}

function fgBBox(luma, w, h) {
  let x0 = w;
  let y0 = h;
  let x1 = 0;
  let y1 = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (luma[y * w + x] < 0) continue;
      if (x < x0) x0 = x;
      if (y < y0) y0 = y;
      if (x > x1) x1 = x;
      if (y > y1) y1 = y;
    }
  }
  return { x0, y0, x1, y1 };
}

function percentile(values, p) {
  if (!values.length) return 0.5;
  const i = Math.min(values.length - 1, Math.max(0, Math.floor(p * values.length)));
  return values[i];
}

function recolorBuffer(png, fileName) {
  const word = VOCAB.get(fileName);
  const scheme = pickScheme(word, fileName);
  const { width, height, data } = png;
  const luma = new Float32Array(width * height);
  const ls = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (isBackground(r, g, b, a)) {
        luma[y * width + x] = -1;
        continue;
      }
      const L = rgbToHsl(r, g, b)[2];
      luma[y * width + x] = L;
      ls.push(L);
    }
  }

  ls.sort((a, b) => a - b);
  const p18 = percentile(ls, 0.18);
  const p40 = percentile(ls, 0.4);
  const p60 = percentile(ls, 0.6);
  const box = fgBBox(luma, width, height);
  const bw = Math.max(1, box.x1 - box.x0);
  const bh = Math.max(1, box.y1 - box.y0);
  const out = Buffer.from(data);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (isBackground(r, g, b, a)) continue;

      const [h, s, l] = rgbToHsl(r, g, b);
      const xRel = (x - box.x0) / bw;
      const yRel = (y - box.y0) / bh;

      if (isSkinTone(h, s, l)) {
        const [nr, ng, nb] = paintHsl(h, Math.min(0.6, s * 1.06), Math.min(0.9, l * 1.02));
        out[i] = nr;
        out[i + 1] = ng;
        out[i + 2] = nb;
        continue;
      }

      if (!isPurpleish(h, s, l, r, g, b)) {
        const [nr, ng, nb] = paintHsl(h, Math.min(0.78, s * 1.1 + 0.03), l);
        out[i] = nr;
        out[i + 1] = ng;
        out[i + 2] = nb;
        continue;
      }

      let nh = scheme.bodyH;
      let ns = scheme.bodyS;
      let nl = l;

      if (l < 0.17) {
        nh = 220;
        ns = 0.08;
        nl = Math.min(0.13, l * 0.85);
      } else if (scheme.hasWindows && l < Math.min(0.38, p18 * 1.3)) {
        nh = scheme.windowH;
        ns = scheme.windowS;
        nl = Math.min(0.34, l * 0.8);
      } else if (scheme.kind === 'vehicle' && yRel > 0.9 && l > 0.2 && l < 0.75) {
        nh = scheme.accentH;
        ns = scheme.accentS;
        nl = Math.min(0.48, 0.18 + l * 0.42);
      } else if (scheme.whiteBody) {
        nh = scheme.bodyH;
        ns = 0.045 + Math.max(0, 0.5 - l) * 0.1;
        nl = Math.min(0.94, l * 1.12 + 0.06);
      } else {
        nh = scheme.bodyH;
        ns = scheme.bodyS * (0.88 + (0.5 - Math.abs(l - 0.5)) * 0.25);
        nl = Math.min(0.9, 0.05 + l * 0.98);
      }

      const [nr, ng, nb] = paintHsl(nh, ns, nl);
      out[i] = nr;
      out[i + 1] = ng;
      out[i + 2] = nb;
    }
  }

  png.data = out;
  return png;
}

function purpleRatio(file) {
  const png = readPng(file);
  const { data } = png;
  let fg = 0;
  let purple = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (isBackground(r, g, b, a)) continue;
    fg += 1;
    const [h, s, l] = rgbToHsl(r, g, b);
    if (isPurpleish(h, s, l, r, g, b) && !isSkinTone(h, s, l)) purple += 1;
  }
  return fg ? purple / fg : 0;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  } catch {
    return { processed: {} };
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

function listWordPngs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => FILE_RE.test(f)).sort();
}

function logLine(line) {
  fs.writeSync(process.stdout.fd, `${line}\n`);
}

function waitStable(file, tries = 6) {
  if (!fs.existsSync(file)) return false;
  const first = fs.statSync(file);
  if (first.size === 0) return false;
  if (Date.now() - first.mtimeMs > 1500) return true;
  let last = first.size;
  for (let i = 0; i < tries; i++) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200);
    if (!fs.existsSync(file)) return false;
    const size = fs.statSync(file).size;
    if (size > 0 && size === last) return true;
    last = size;
  }
  return last > 0;
}

function ingestOriginal(name, prev) {
  ensureDir(SRC_DIR);
  const outFile = path.join(OUT_DIR, name);
  const srcFile = path.join(SRC_DIR, name);
  if (!fs.existsSync(outFile)) return false;
  if (!waitStable(outFile)) return false;

  if (!fs.existsSync(srcFile)) {
    fs.copyFileSync(outFile, srcFile);
    return true;
  }

  const outStat = fs.statSync(outFile);
  if (prev && prev.outSize && outStat.size === prev.outSize) return true;

  try {
    if (purpleRatio(outFile) > 0.45) {
      fs.copyFileSync(outFile, srcFile);
    }
  } catch {
    return false;
  }
  return true;
}

function processFile(name, force, state) {
  const srcFile = path.join(SRC_DIR, name);
  const outFile = path.join(OUT_DIR, name);
  const prev = state.processed[name];

  if (!force && prev && fs.existsSync(outFile)) {
    const outStat = fs.statSync(outFile);
    if (prev.outSize && outStat.size === prev.outSize) {
      if (!prev.algo) {
        prev.algo = ALGO;
        return 'skip-backfill';
      }
      return 'skip-done';
    }
  }

  if (!ingestOriginal(name, prev)) return 'skip-missing';
  const srcStat = fs.statSync(srcFile);
  if (
    !force &&
    prev &&
    (prev.algo === ALGO || prev.outSize) &&
    prev.srcMtime === srcStat.mtimeMs &&
    prev.srcSize === srcStat.size &&
    fs.existsSync(outFile)
  ) {
    return 'skip-done';
  }

  const png = readPng(srcFile);
  recolorBuffer(png, name);
  writePng(outFile, png);
  const outStat = fs.statSync(outFile);
  state.processed[name] = {
    algo: ALGO,
    srcMtime: srcStat.mtimeMs,
    srcSize: srcStat.size,
    outMtime: outStat.mtimeMs,
    outSize: outStat.size,
    at: new Date().toISOString(),
    meaning: (VOCAB.get(name) || {}).meaning || '',
    w: png.width,
    h: png.height,
  };
  return 'ok';
}

function processPending(force) {
  ensureDir(SRC_DIR);
  const names = listWordPngs(OUT_DIR);
  const state = loadState();
  let ok = 0;
  let skipped = 0;
  let failed = 0;
  let dirty = false;
  for (const name of names) {
    try {
      const result = processFile(name, force, state);
      if (result === 'ok') {
        ok += 1;
        dirty = true;
      } else {
        skipped += 1;
        if (result === 'skip-backfill') dirty = true;
      }
    } catch (err) {
      failed += 1;
      logLine(`fail ${name} ${err.message}`);
    }
  }
  if (dirty) saveState(state);
  return { total: names.length, ok, skipped, failed, algo: ALGO };
}

function watchLoop() {
  logLine(`watching ${OUT_DIR} algo=${ALGO}`);
  let lastCount = listWordPngs(OUT_DIR).length;
  setInterval(() => {
    const names = listWordPngs(OUT_DIR);
    if (names.length !== lastCount) {
      logLine(`detected ${names.length} files (was ${lastCount})`);
      lastCount = names.length;
    }
    const stats = processPending(false);
    if (stats.ok || stats.failed) {
      logLine(
        `AGENT_LOOP_WAKE_recolor ${JSON.stringify({
          prompt: 'Semantic recolor: process new word images from meaning, report coverage, keep watching',
          ...stats,
        })}`,
      );
    }
  }, 8000);
}

function processOnly(names, force) {
  ensureDir(SRC_DIR);
  const state = loadState();
  let ok = 0;
  let skipped = 0;
  let failed = 0;
  for (const name of names) {
    try {
      const result = processFile(name, force, state);
      if (result === 'ok') ok += 1;
      else skipped += 1;
    } catch (err) {
      failed += 1;
      logLine(`fail ${name} ${err.message}`);
    }
  }
  saveState(state);
  return { total: names.length, ok, skipped, failed, algo: ALGO };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const watch = args.includes('--watch');
  const only = args.filter((a) => FILE_RE.test(a));
  const stats = only.length ? processOnly(only, true) : processPending(force);
  logLine(JSON.stringify(stats));
  if (watch) watchLoop();
}

module.exports = { processPending, processFile, listWordPngs, OUT_DIR, SRC_DIR, pickScheme, VOCAB };

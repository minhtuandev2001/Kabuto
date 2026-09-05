import { deflateRawSync, inflateRawSync } from "node:zlib";
import { toCsv } from "./csv";

function crc32(buf: Buffer) {
  let crc = ~0;
  for (const byte of buf) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return ~crc >>> 0;
}

function zipStore(files: [string, string][]) {
  const chunks: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  const now = new Date();
  const dosTime = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xffff;
  const dosDate = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xffff;
  for (const [name, text] of files) {
    const raw = Buffer.from(text, "utf8");
    const compressed = deflateRawSync(raw);
    const crc = crc32(raw);
    const nameBuf = Buffer.from(name, "utf8");
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x800, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(dosTime, 10);
    local.writeUInt16LE(dosDate, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    const localFull = Buffer.concat([local, nameBuf, compressed]);
    chunks.push(localFull);
    const cen = Buffer.alloc(46);
    cen.writeUInt32LE(0x02014b50, 0);
    cen.writeUInt16LE(20, 4);
    cen.writeUInt16LE(20, 6);
    cen.writeUInt16LE(0x800, 8);
    cen.writeUInt16LE(8, 10);
    cen.writeUInt16LE(dosTime, 12);
    cen.writeUInt16LE(dosDate, 14);
    cen.writeUInt32LE(crc, 16);
    cen.writeUInt32LE(compressed.length, 20);
    cen.writeUInt32LE(raw.length, 24);
    cen.writeUInt16LE(nameBuf.length, 28);
    cen.writeUInt32LE(offset, 42);
    central.push(Buffer.concat([cen, nameBuf]));
    offset += localFull.length;
  }
  const centralBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...chunks, centralBuf, end]);
}

function xmlEscape(value: string) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function xmlUnescape(value: string) {
  return String(value)
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function colLetter(index: number) {
  let n = index + 1;
  let out = "";
  while (n > 0) {
    n -= 1;
    out = String.fromCharCode(65 + (n % 26)) + out;
    n = Math.floor(n / 26);
  }
  return out;
}

export function tableToXlsx(rows: string[][]) {
  const cells = rows
    .map((row, r) =>
      row
        .map((value, c) => {
          const ref = `${colLetter(c)}${r + 1}`;
          // Match Excel: empty cells are self-closing. Reader must not swallow the "/".
          if (!(value ?? "").length) {
            return `<c r="${ref}" t="inlineStr" />`;
          }
          return `<c r="${ref}" t="inlineStr"><is><t>${xmlEscape(value)}</t></is></c>`;
        })
        .join(""),
    )
    .map((row, r) => `<row r="${r + 1}">${row}</row>`)
    .join("");
  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${cells}</sheetData></worksheet>`;
  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="LearnJapan" sheetId="1" r:id="rId1"/></sheets></workbook>`;
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
  const wbRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`;
  const types = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`;
  return zipStore([
    ["[Content_Types].xml", types],
    ["_rels/.rels", rels],
    ["xl/workbook.xml", workbook],
    ["xl/_rels/workbook.xml.rels", wbRels],
    ["xl/worksheets/sheet1.xml", sheet],
  ]);
}

function unzip(buf: Buffer) {
  const files = new Map<string, string>();
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i -= 1) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) {
    throw new Error("Không đọc được file Excel");
  }
  const count = buf.readUInt16LE(eocd + 10);
  let cen = buf.readUInt32LE(eocd + 16);
  for (let n = 0; n < count; n += 1) {
    if (buf.readUInt32LE(cen) !== 0x02014b50) {
      throw new Error("File Excel hỏng");
    }
    const method = buf.readUInt16LE(cen + 10);
    const comp = buf.readUInt32LE(cen + 20);
    const nameLen = buf.readUInt16LE(cen + 28);
    const extra = buf.readUInt16LE(cen + 30);
    const comment = buf.readUInt16LE(cen + 32);
    const local = buf.readUInt32LE(cen + 42);
    const name = buf.subarray(cen + 46, cen + 46 + nameLen).toString("utf8");
    const locName = buf.readUInt16LE(local + 26);
    const locExtra = buf.readUInt16LE(local + 28);
    const blob = buf.subarray(local + 30 + locName + locExtra, local + 30 + locName + locExtra + comp);
    const data = method === 8 ? inflateRawSync(blob) : blob;
    files.set(name.replace(/\\/g, "/"), data.toString("utf8"));
    cen += 46 + nameLen + extra + comment;
  }
  return files;
}

function parseRef(ref: string) {
  const match = String(ref).match(/^([A-Z]+)(\d+)$/i);
  if (!match) {
    return null;
  }
  let col = 0;
  for (const ch of match[1].toUpperCase()) {
    col = col * 26 + (ch.charCodeAt(0) - 64);
  }
  return { c: col - 1, r: Number(match[2]) - 1 };
}

function sharedStrings(xml: string) {
  const out: string[] = [];
  const blocks = xml.match(/<(?:\w+:)?si\b[\s\S]*?<\/(?:\w+:)?si>/gi) ?? [];
  for (const block of blocks) {
    const parts = [...block.matchAll(/<(?:\w+:)?t\b[^>]*>([\s\S]*?)<\/(?:\w+:)?t>/gi)].map((item) =>
      xmlUnescape(item[1]),
    );
    out.push(parts.join(""));
  }
  return out;
}

function firstSheetXml(files: Map<string, string>) {
  const wb = files.get("xl/workbook.xml") ?? "";
  const rels = files.get("xl/_rels/workbook.xml.rels") ?? "";
  const id = wb.match(/<sheet\b[^>]*r:id="([^"]+)"/i)?.[1];
  const target = id
    ? rels.match(new RegExp(`Id="${id}"[^>]*Target="([^"]+)"`, "i"))?.[1]
      ?? rels.match(new RegExp(`Target="([^"]+)"[^>]*Id="${id}"`, "i"))?.[1]
    : "";
  if (target) {
    const normPath = target.replace(/^\//, "").replace(/^\.\//, "");
    const key = normPath.startsWith("xl/") ? normPath : `xl/${normPath}`;
    if (files.has(key)) {
      return files.get(key) ?? "";
    }
  }
  return files.get("xl/worksheets/sheet1.xml") ?? "";
}

function cellText(inner: string, attrs: string, shared: string[]) {
  const type = attrs.match(/\bt="([^"]+)"/)?.[1] ?? "";
  if (type === "inlineStr") {
    return [...inner.matchAll(/<(?:\w+:)?t\b[^>]*>([\s\S]*?)<\/(?:\w+:)?t>/gi)]
      .map((item) => xmlUnescape(item[1]))
      .join("");
  }
  const raw = inner.match(/<(?:\w+:)?v\b[^>]*>([\s\S]*?)<\/(?:\w+:)?v>/i)?.[1] ?? "";
  if (type === "s") {
    return shared[Number(raw)] ?? "";
  }
  return xmlUnescape(raw);
}

export function xlsxToGrid(buf: Buffer) {
  const files = unzip(buf);
  const shared = sharedStrings(files.get("xl/sharedStrings.xml") ?? "");
  const sheet = firstSheetXml(files);
  if (!sheet) {
    throw new Error("File Excel không có sheet");
  }
  const grid: string[][] = [];
  const rowRe = /<(?:\w+:)?row\b[^>]*>([\s\S]*?)<\/(?:\w+:)?row>/gi;
  let rowMatch: RegExpExecArray | null;
  while ((rowMatch = rowRe.exec(sheet))) {
    const cellRe = /<(?:\w+:)?c\b([^>]*?)\s*(?:\/>|>([\s\S]*?)<\/(?:\w+:)?c>)/gi;
    let cellMatch: RegExpExecArray | null;
    while ((cellMatch = cellRe.exec(rowMatch[1]))) {
      const ref = cellMatch[1].match(/\br="([^"]+)"/)?.[1];
      const pos = ref ? parseRef(ref) : null;
      if (!pos) {
        continue;
      }
      while (grid.length <= pos.r) {
        grid.push([]);
      }
      const row = grid[pos.r];
      while (row.length <= pos.c) {
        row.push("");
      }
      row[pos.c] = cellText(cellMatch[2] ?? "", cellMatch[1], shared);
    }
  }
  const width = grid.reduce((max, row) => Math.max(max, row.length), 0);
  return grid
    .map((row) => {
      const next = row.slice();
      while (next.length < width) {
        next.push("");
      }
      return next;
    })
    .filter((row) => row.some((cell) => cell.trim()));
}

export function isXlsxBuffer(buf: Buffer) {
  return buf.length > 4 && buf[0] === 0x50 && buf[1] === 0x4b;
}

export function fileToImportText(input: { csv?: string; xlsx?: string }) {
  const raw = input.xlsx?.trim();
  if (raw) {
    const buf = Buffer.from(raw, "base64");
    if (!isXlsxBuffer(buf)) {
      throw new Error("File Excel không hợp lệ");
    }
    return toCsv(xlsxToGrid(buf));
  }
  const csv = input.csv?.trim() ?? "";
  if (!csv) {
    throw new Error("File trống");
  }
  return csv;
}

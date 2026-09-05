/** RFC 4180-ish CSV. BOM so Excel opens Vietnamese. */

export function parseCsv(text: string): string[][] {
  const src = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      quoted = true;
      continue;
    }
    if (ch === ",") {
      row.push(cell);
      cell = "";
      continue;
    }
    if (ch === "\n") {
      row.push(cell);
      cell = "";
      if (row.some((item) => item.trim())) {
        rows.push(row);
      }
      row = [];
      continue;
    }
    cell += ch;
  }
  row.push(cell);
  if (row.some((item) => item.trim())) {
    rows.push(row);
  }
  return rows;
}

export function toCsv(rows: string[][]): string {
  const esc = (value: string) => {
    const text = value ?? "";
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return `\uFEFF${rows.map((row) => row.map(esc).join(",")).join("\n")}\n`;
}

export function csvObjects(rows: string[][]): Record<string, string>[] {
  const header = rows[0];
  if (!header?.length) {
    return [];
  }
  return rows.slice(1).map((line) => {
    const obj: Record<string, string> = {};
    header.forEach((key, i) => {
      obj[key] = (line[i] ?? "").trim();
    });
    return obj;
  });
}

"use client";

import { Download, FileDown, FileUp } from "lucide-react";
import { useRef, useState } from "react";
import { SAMPLE_FILES, type TransferKind } from "@/lib/transfer";

const LABELS: Record<TransferKind, string> = {
  lessons: "Bài học",
  words: "Từ vựng",
  grammar: "Ngữ pháp",
};

type Result = { imported: number; errors: { row: number; message: string }[] };

export function TransferPanel({
  kind,
  disabled,
  onImported,
}: {
  kind: TransferKind;
  disabled?: boolean;
  onImported: () => Promise<void>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const locked = useRef(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  async function onFile(file: File | undefined) {
    if (!file || locked.current) {
      return;
    }
    locked.current = true;
    setBusy(true);
    setError("");
    setNote("");
    try {
      const excel = /\.xlsx$/i.test(file.name);
      let body: { xlsx?: string; csv?: string };
      if (excel) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        let raw = "";
        bytes.forEach((byte) => {
          raw += String.fromCharCode(byte);
        });
        body = { xlsx: btoa(raw) };
      } else {
        body = { csv: await file.text() };
      }
      const res = await fetch(`/api/transfer?kind=${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as Result & { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Không nhập được");
      }
      await onImported();
      const fail = data.errors.length;
      setNote(`Đã nhập ${data.imported} ${LABELS[kind].toLowerCase()}${fail ? ` · ${fail} dòng lỗi` : ""}`);
      if (fail) {
        setError(data.errors.slice(0, 5).map((item) => `Dòng ${item.row}: ${item.message}`).join(" · "));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không nhập được");
    } finally {
      locked.current = false;
      setBusy(false);
      if (fileRef.current) {
        fileRef.current.value = "";
      }
    }
  }

  const btn = "rounded-full bg-white/80 px-3 py-1.5 text-[11.5px] font-bold text-[#7C5CFC] disabled:opacity-40";

  return (
    <div className="glass rounded-[22px] p-3.5">
      <p className="text-[14px] font-extrabold text-[#1E1B4B]">{LABELS[kind]}</p>
      <p className="mt-0.5 text-[12px] font-semibold text-[#7C7A9C]">
        {kind === "lessons"
          ? "Excel · tối đa 500 dòng · nhập thay toàn bộ bài tự soạn · để trống cột lesson để gán số tự động"
          : kind === "words"
            ? "Excel · tối đa 500 dòng · nhập thay toàn bộ từ của các bài có trong file"
            : "Excel · tối đa 500 dòng · nhập thay toàn bộ ngữ pháp tự soạn · cột lesson = số bài đã có"}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a className={btn} href={`/api/transfer?kind=${kind}&mode=sample`} download={SAMPLE_FILES[kind]}>
          <span className="inline-flex items-center gap-1">
            <Download size={14} />
            File mẫu
          </span>
        </a>
        <a className={btn} href={`/api/transfer?kind=${kind}&mode=export`}>
          <span className="inline-flex items-center gap-1">
            <FileDown size={14} />
            Xuất
          </span>
        </a>
        <button
          type="button"
          disabled={disabled || busy}
          className={btn}
          onClick={() => fileRef.current?.click()}
        >
          <span className="inline-flex items-center gap-1">
            <FileUp size={14} />
            {busy ? "Đang nhập..." : "Nhập Excel"}
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.csv,text/csv"
          className="hidden"
          onChange={(event) => {
            void onFile(event.target.files?.[0]);
          }}
        />
      </div>
      {note ? <p className="mt-2 text-[12px] font-semibold text-[#7C5CFC]">{note}</p> : null}
      {error ? <p className="mt-1 text-[12px] font-semibold text-[#F472B6]">{error}</p> : null}
    </div>
  );
}

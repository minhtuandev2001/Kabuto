"use client";

import type { GrammarPoint } from "@/lib/grammar";

export function GrammarPointCard({
  point,
  onEdit,
  onDelete,
}: {
  point: GrammarPoint;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <article className="glass-strong rounded-[24px] p-4">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[18px] font-extrabold leading-7 text-[#1E1B4B]">{point.pattern}</p>
          <p className="mt-1 text-[14px] font-bold text-[#7C5CFC]">{point.meaning}</p>
        </div>
        {onEdit || onDelete ? (
          <div className="flex shrink-0 gap-1">
            {onEdit ? (
              <button
                type="button"
                onClick={onEdit}
                className="rounded-full bg-[#EFEAFF] px-2.5 py-1 text-[11px] font-bold text-[#7C5CFC]"
              >
                Sửa
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-bold text-[#F472B6]"
              >
                Xóa
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      {point.form ? <p className="mt-2 text-[12.5px] font-semibold text-[#4A4470]">{point.form}</p> : null}
      {point.note ? <p className="mt-1.5 text-[12.5px] font-semibold leading-5 text-[#7C7A9C]">{point.note}</p> : null}
      <div className="mt-3 flex flex-col gap-2">
        {point.examples.map((example) => (
          <div key={`${example.jp}-${example.vi}`} className="rounded-[18px] bg-white/70 px-3 py-2.5">
            <p className="text-[14.5px] font-extrabold text-[#1E1B4B]">{example.jp}</p>
            {example.vi ? <p className="mt-0.5 text-[12.5px] font-semibold text-[#7C7A9C]">{example.vi}</p> : null}
          </div>
        ))}
      </div>
    </article>
  );
}

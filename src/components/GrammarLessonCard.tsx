"use client";

import type { GrammarLesson } from "@/lib/grammar";

export function GrammarLessonCard({
  item,
  active,
  onOpen,
}: {
  item: GrammarLesson;
  active?: boolean;
  onOpen: () => void;
}) {
  const preview = item.points[0]?.pattern ?? "";
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`grammar-card flex w-full items-center gap-3 rounded-[24px] p-3 text-left ${
        active ? "border border-[#7C5CFC]/35 bg-[#EFEAFF]" : "glass"
      }`}
    >
      <span className="flex h-[54px] w-[54px] shrink-0 flex-col items-center justify-center rounded-[18px] bg-gradient-to-br from-[#A78BFA] to-[#7C5CFC] text-white">
        <span className="text-lg font-extrabold leading-5">{String(item.lesson).padStart(2, "0")}</span>
        <span className="text-[8px] font-bold tracking-[1.2px] text-white/80">{item.jlpt}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-extrabold text-[#1E1B4B]">{item.title}</span>
        <span className="mt-0.5 block truncate text-[12.5px] font-semibold text-[#7C7A9C]">{item.subtitle}</span>
        <span className="mt-2 flex items-center gap-1.5">
          <span className="rounded-full bg-[#EFEAFF] px-2 py-0.5 text-[10.5px] font-bold text-[#7C5CFC]">
            {item.points.length} mẫu
          </span>
          {preview ? (
            <span className="min-w-0 truncate text-[11px] font-semibold text-[#7C7A9C]">{preview}</span>
          ) : null}
        </span>
      </span>
    </button>
  );
}

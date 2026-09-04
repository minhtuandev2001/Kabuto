"use client";

import { Play } from "lucide-react";
import { formatLessonSubtitle, formatLessonTitle, lectureThumbUrl } from "@/lib/catalog";
import type { LessonInfo } from "@/lib/types";

export function VideoCard({
  lesson,
  onOpen,
  active,
}: {
  lesson: LessonInfo;
  onOpen: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`video-card flex w-full items-center gap-3 rounded-[24px] p-2 text-left ${
        active ? "border border-[#7C5CFC]/35 bg-[#EFEAFF]" : "glass"
      }`}
    >
      <span className="relative h-[72px] w-[118px] shrink-0 overflow-hidden rounded-[16px] bg-[#1E1B4B]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={lectureThumbUrl()} alt="" className="h-full w-full object-cover" />
        <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        <span className="absolute left-1.5 top-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide text-white">
          {String(lesson.lesson).padStart(2, "0")}
        </span>
        <span className="absolute bottom-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#7C5CFC] shadow-[0_4px_10px_rgba(0,0,0,0.2)]">
          <Play size={12} className="ml-px" fill="currentColor" />
        </span>
      </span>
      <span className="min-w-0 flex-1 py-0.5">
        <span className="block truncate text-[15px] font-extrabold text-[#1E1B4B]">{formatLessonTitle(lesson)}</span>
        <span className="mt-0.5 block truncate text-[12.5px] font-semibold text-[#7C7A9C]">
          {formatLessonSubtitle(lesson)}
        </span>
        <span className="mt-2 flex items-center gap-1.5">
          <span className="rounded-full bg-[#EFEAFF] px-2 py-0.5 text-[10.5px] font-bold text-[#7C5CFC]">{lesson.jlpt}</span>
          <span className="text-[11px] font-semibold text-[#7C7A9C]">Bài giảng</span>
        </span>
      </span>
    </button>
  );
}

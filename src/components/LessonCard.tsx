"use client";

import { Play } from "lucide-react";
import { useCatalog } from "@/context/CatalogProvider";
import { formatLessonSubtitle, formatLessonTitle } from "@/lib/catalog";
import { lessonAccents } from "@/lib/theme";
import type { LessonInfo } from "@/lib/types";

type Props = {
  lesson: LessonInfo;
  onOpen: () => void;
  onPlay: () => void;
};

export function LessonCard({ lesson, onOpen, onPlay }: Props) {
  const { getWordsForLesson } = useCatalog();
  const accent = lessonAccents[(lesson.lesson - 1) % lessonAccents.length];
  const count = getWordsForLesson(lesson.lesson).length;

  return (
    <article className="lesson-card glass flex items-center gap-3 rounded-[28px] p-3">
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span
          className="flex h-[54px] w-[54px] shrink-0 flex-col items-center justify-center rounded-[18px] text-white"
          style={{ background: `linear-gradient(135deg, ${accent[0]}, ${accent[1]})` }}
        >
          <span className="text-lg font-extrabold leading-5">{String(lesson.lesson).padStart(2, "0")}</span>
          <span className="text-[8px] font-bold tracking-[1.2px] text-white/80">BÀI</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15.5px] font-extrabold text-[#1E1B4B]">{formatLessonTitle(lesson)}</span>
          <span className="mt-0.5 block truncate text-[12.5px] font-semibold text-[#7C7A9C]">
            {formatLessonSubtitle(lesson)}
          </span>
          <span className="mt-2 flex items-center gap-1.5">
            <span className="rounded-full bg-[#EFEAFF] px-2 py-0.5 text-[10.5px] font-bold text-[#7C5CFC]">{lesson.jlpt}</span>
            {lesson.custom ? (
              <span className="rounded-full bg-[#FDE68A] px-2 py-0.5 text-[10.5px] font-bold text-[#92400E]">Tự soạn</span>
            ) : null}
            <span className="text-[11.5px] font-semibold text-[#7C7A9C]">{count} từ</span>
          </span>
        </span>
      </button>
      <button
        type="button"
        disabled={count === 0}
        onClick={onPlay}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#7C5CFC] text-white shadow-[0_6px_16px_rgba(91,63,214,0.2)] disabled:opacity-35"
        aria-label={`Phát bài ${lesson.lesson}`}
      >
        <Play size={16} className="ml-0.5" fill="currentColor" />
      </button>
    </article>
  );
}

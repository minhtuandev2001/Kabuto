"use client";

import { Pause, Play, SkipForward } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePlayer } from "@/context/PlayerProvider";
import { formatLessonTitle, getHeadline, wordImageSrc } from "@/lib/catalog";

export function MiniPlayer({ hidden }: { hidden: boolean }) {
  const router = useRouter();
  const { currentWord, lesson, isPlaying, isLoading, isWaiting, position, duration, togglePlay, next } = usePlayer();

  if (hidden || !currentWord) {
    return null;
  }

  const progress = Math.min(1, position / Math.max(duration, 1));
  const busy = isWaiting || isPlaying;

  return (
    <button
      type="button"
      onClick={() => router.push("/listen")}
      className="glass-strong relative mx-3 mb-2 flex h-16 w-[calc(100%-1.5rem)] items-center gap-2.5 overflow-hidden rounded-[18px] px-2.5 text-left shadow-[0_6px_16px_rgba(91,63,214,0.12)]"
    >
      <span className="absolute left-0 top-0 h-0.5 bg-[#7C5CFC]" style={{ width: `${progress * 100}%` }} />
      {wordImageSrc(currentWord) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={wordImageSrc(currentWord)}
          alt=""
          className="h-11 w-11 rounded-xl bg-[#EFEAFF] object-contain"
          onError={(event) => {
            event.currentTarget.style.opacity = "0";
          }}
        />
      ) : (
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EFEAFF] text-[15px] font-extrabold text-[#7C5CFC]">
          {getHeadline(currentWord).slice(0, 1)}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-extrabold text-[#1E1B4B]">{getHeadline(currentWord)}</span>
        <span className="mt-0.5 block truncate text-[11.5px] font-semibold text-[#7C7A9C]">
          {currentWord.meaning}
          {lesson ? ` · ${formatLessonTitle(lesson)}` : ""}
        </span>
      </span>
      <span
        role="presentation"
        onClick={(event) => {
          event.stopPropagation();
          togglePlay();
        }}
        className="flex h-9 w-9 items-center justify-center"
      >
        {isLoading ? (
          <span className="text-[#1E1B4B]">···</span>
        ) : busy ? (
          <Pause size={20} className="text-[#1E1B4B]" />
        ) : (
          <Play size={20} className="ml-0.5 text-[#1E1B4B]" />
        )}
      </span>
      <span
        role="presentation"
        onClick={(event) => {
          event.stopPropagation();
          next();
        }}
        className="flex h-9 w-9 items-center justify-center"
      >
        <SkipForward size={18} className="text-[#1E1B4B]" />
      </span>
    </button>
  );
}

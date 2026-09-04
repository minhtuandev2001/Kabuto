"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { List, Pause, Play, Repeat, SkipBack, SkipForward } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { usePlayer } from "@/context/PlayerProvider";
import { useCatalog } from "@/context/CatalogProvider";
import { formatLessonTitle, getHeadline, wordImageSrc } from "@/lib/catalog";

gsap.registerPlugin(useGSAP);

function formatTime(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export default function ListenPage() {
  const root = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [imgOk, setImgOk] = useState(true);
  const {
    lesson,
    lessonId,
    words,
    currentWord,
    index,
    isPlaying,
    isLoading,
    isWaiting,
    position,
    duration,
    loopLesson,
    togglePlay,
    next,
    prev,
    toggleLoop,
  } = usePlayer();
  const { getAdjacentLesson, getWordsForLesson } = useCatalog();

  const headline = currentWord ? getHeadline(currentWord) : "—";
  const artSrc = currentWord ? wordImageSrc(currentWord) : "";
  const showKana = Boolean(currentWord?.kanji?.trim());
  const progress = Math.min(1, position / Math.max(duration, 1));
  const nextWord = (() => {
    if (!words.length) {
      return undefined;
    }
    if (index + 1 < words.length) {
      return words[index + 1];
    }
    if (loopLesson) {
      return words[0];
    }
    const nextLesson = getAdjacentLesson(lessonId, 1);
    return nextLesson != null ? getWordsForLesson(nextLesson)[0] : undefined;
  })();

  useEffect(() => {
    setImgOk(true);
  }, [currentWord?.lesson, currentWord?.order, currentWord?.imageUrl]);

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        return;
      }
      gsap.fromTo(
        ".player-word",
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, ease: "power3.out" },
      );
      gsap.fromTo(
        ".player-art",
        { scale: 0.9, rotate: -4, opacity: 0.6 },
        { scale: 1, rotate: 0, opacity: 1, duration: 0.55, ease: "back.out(1.6)" },
      );
    },
    { scope: root, dependencies: [currentWord?.kana, currentWord?.order, currentWord?.lesson] },
  );

  return (
    <div ref={root} className="flex min-h-0 flex-1 flex-col">
      <div className="glass-strong flex items-center gap-3 rounded-[20px] p-2.5">
        <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[13px] bg-[#7C5CFC] text-[13.5px] font-extrabold text-white">
          {String(lesson?.lesson ?? 1).padStart(2, "0")}
        </div>
        <div className="min-w-0 flex-1 text-center">
          <div className="text-[9.5px] font-bold tracking-[1.6px] text-[#7C5CFC]">ĐANG PHÁT</div>
          <div className="truncate text-[13.5px] font-extrabold text-[#1E1B4B]">
            {lesson ? formatLessonTitle(lesson) : ""}
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.push(`/lessons/${lessonId}`)}
          className="flex h-[38px] w-[38px] items-center justify-center rounded-[13px] border border-white/70 bg-white/70"
        >
          <List size={18} className="text-[#7C5CFC]" />
        </button>
      </div>

      <div className="flex min-h-[140px] flex-1 flex-col items-center justify-center py-3">
        <h1
          className={`player-word text-center font-extrabold text-[#1E1B4B] ${headline.length > 8 ? "text-2xl" : "text-[34px] leading-[42px]"}`}
        >
          {headline}
        </h1>
        {showKana ? <p className="mt-1 text-[15px] font-bold text-[#7C7A9C]">{currentWord?.kana}</p> : null}
        <div className="player-art mt-3 flex h-[min(42vw,220px)] w-[min(42vw,220px)] items-center justify-center rounded-[36px] bg-gradient-to-br from-[#A78BFA] via-[#7C5CFC] to-[#5B3FD6] shadow-[0_14px_24px_rgba(124,92,252,0.32)]">
          {currentWord && imgOk && artSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${currentWord.lesson}-${currentWord.order}-${artSrc}`}
              src={artSrc}
              alt=""
              className="h-[86%] w-[86%] object-contain"
              onError={() => setImgOk(false)}
              onLoad={() => setImgOk(true)}
            />
          ) : (
            <span className="text-6xl font-extrabold text-white">あ</span>
          )}
        </div>
      </div>

      <div className="glass-strong mb-3 rounded-[28px] px-4 pb-3 pt-4">
        <p className="text-center text-xl font-extrabold leading-7 text-[#1E1B4B]">
          {currentWord?.meaning || "Chọn một từ để nghe"}
        </p>
        <p className="mt-1.5 text-center text-[13.5px] font-semibold text-[#7C7A9C]">
          {currentWord?.romaji}
          {currentWord?.sinoVietnamese ? ` · ${currentWord.sinoVietnamese}` : ""}
        </p>
        <div className="mt-4 h-1.5 overflow-visible rounded-full bg-[rgba(30,27,75,0.1)]">
          <div className="relative h-full rounded-full bg-[#7C5CFC]" style={{ width: `${progress * 100}%` }}>
            <span className="absolute -right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-[3px] border-[#7C5CFC] bg-white" />
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-[#7C7A9C]">
          <span>{formatTime(position)}</span>
          <span className="font-bold text-[#7C5CFC]">
            {index + 1} / {words.length}
          </span>
          <span>{formatTime(duration)}</span>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <button type="button" onClick={toggleLoop} className="flex h-11 w-11 items-center justify-center">
            <Repeat size={22} className={loopLesson ? "text-[#7C5CFC]" : "text-[#B9B6D4]"} />
          </button>
          <button type="button" onClick={prev} className="flex h-11 w-11 items-center justify-center">
            <SkipBack size={24} className="text-[#1E1B4B]" />
          </button>
          <button
            type="button"
            onClick={togglePlay}
            className="flex h-[62px] w-[62px] items-center justify-center rounded-full bg-gradient-to-br from-[#A78BFA] to-[#7C5CFC] text-white shadow-[0_10px_20px_rgba(124,92,252,0.35)]"
          >
            {isLoading ? (
              <span>···</span>
            ) : isWaiting || isPlaying ? (
              <Pause size={28} fill="currentColor" />
            ) : (
              <Play size={28} className="ml-0.5" fill="currentColor" />
            )}
          </button>
          <button type="button" onClick={next} className="flex h-11 w-11 items-center justify-center">
            <SkipForward size={24} className="text-[#1E1B4B]" />
          </button>
          <button
            type="button"
            onClick={() => router.push(`/lessons/${lessonId}`)}
            className="flex h-11 w-11 items-center justify-center"
          >
            <List size={20} className="text-[#B9B6D4]" />
          </button>
        </div>
      </div>

      {nextWord ? (
        <button
          type="button"
          onClick={() => router.push(`/lessons/${lessonId}`)}
          className="mb-2 flex items-center gap-2 rounded-[20px] border border-white/50 bg-white/40 px-3.5 py-2.5 text-left"
        >
          <span className="text-[11.5px] font-bold text-[#7C5CFC]">Tiếp theo</span>
          <span className="min-w-0 flex-1 truncate text-xs font-semibold text-[#4A4470]">
            {getHeadline(nextWord)} · {nextWord.meaning}
          </span>
        </button>
      ) : null}
    </div>
  );
}

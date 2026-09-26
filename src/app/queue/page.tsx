"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Pause, Play, Repeat, SkipBack, SkipForward } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePlayer } from "@/context/PlayerProvider";
import { useCatalog } from "@/context/CatalogProvider";
import { useSettings } from "@/context/SettingsProvider";
import { formatLessonTitle, getHeadline, wordImageSrc } from "@/lib/catalog";
import { PLAY_WORD_LIMIT_PRESETS, formatPlayWordLimit } from "@/lib/theme";

gsap.registerPlugin(useGSAP);

function formatTime(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export default function QueuePage() {
  const root = useRef<HTMLDivElement>(null);
  const [imgOk, setImgOk] = useState(true);
  const [displaySrc, setDisplaySrc] = useState("");
  const {
    mode,
    lesson,
    words,
    currentWord,
    index,
    isPlaying,
    isLoading,
    isWaiting,
    position,
    duration,
    loopLesson,
    sessionLeft,
    playQueue,
    togglePlay,
    next,
    prev,
    toggleLoop,
  } = usePlayer();
  const { allWords, catalogReady } = useCatalog();
  const { playWordLimit, setPlayWordLimit } = useSettings();

  // Enter queue playlist (no autoplay) when opening this screen.
  useEffect(() => {
    if (!catalogReady || !allWords.length) {
      return;
    }
    if (mode !== "queue") {
      playQueue(0, false);
    }
  }, [allWords.length, catalogReady, mode, playQueue]);

  const headline = currentWord ? getHeadline(currentWord) : "—";
  const artSrc = currentWord ? wordImageSrc(currentWord) : "";
  const showKana = Boolean(currentWord?.kanji?.trim());
  const progress = Math.min(1, position / Math.max(duration, 1));
  const globalNumber = index + 1;
  const nextWord = words[index + 1] ?? (loopLesson ? words[0] : undefined);

  useEffect(() => {
    if (!artSrc) {
      setDisplaySrc("");
      setImgOk(false);
      return;
    }
    let cancelled = false;
    const probe = new Image();
    const show = () => {
      if (!cancelled) {
        setDisplaySrc(artSrc);
        setImgOk(true);
      }
    };
    probe.onload = show;
    probe.onerror = () => {
      if (!cancelled) {
        setImgOk(false);
      }
    };
    probe.src = artSrc;
    if (probe.complete && probe.naturalWidth > 0) {
      show();
    }
    return () => {
      cancelled = true;
    };
  }, [artSrc]);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }
      gsap.fromTo(".player-word", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power3.out" });
    },
    { scope: root, dependencies: [currentWord?.kana, currentWord?.order, currentWord?.lesson] },
  );

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }
      gsap.fromTo(
        ".player-art",
        { scale: 0.9, rotate: -4, opacity: 0.6 },
        { scale: 1, rotate: 0, opacity: 1, duration: 0.55, ease: "back.out(1.6)" },
      );
    },
    { scope: root, dependencies: [displaySrc] },
  );

  return (
    <div ref={root} className="flex min-h-0 flex-1 flex-col md:flex-row md:gap-4 lg:gap-5">
      <div className="glass-strong flex min-h-0 min-w-0 flex-1 flex-col rounded-[28px] p-3 md:w-1/2 md:flex-none xl:w-[480px] md:p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[13px] bg-[#7C5CFC] text-[12px] font-extrabold text-white">
            {globalNumber}
          </div>
          <div className="min-w-0 flex-1 text-center">
            <div className="text-[9.5px] font-bold tracking-[1.6px] text-[#7C5CFC]">PHÁT THEO SỐ TỪ</div>
            <div className="truncate text-[13.5px] font-extrabold text-[#1E1B4B]">
              {lesson ? formatLessonTitle(lesson) : "Toàn bộ từ vựng"}
            </div>
          </div>
          <div className="w-[38px]" />
        </div>

        <div className="flex min-h-[120px] flex-1 flex-col items-center justify-center py-3">
          <h1
            className={`player-word text-center font-extrabold text-[#1E1B4B] ${headline.length > 8 ? "text-2xl" : "text-[34px] leading-[42px]"}`}
          >
            {headline}
          </h1>
          {showKana ? <p className="mt-1 text-[15px] font-bold text-[#7C7A9C]">{currentWord?.kana}</p> : null}
          <div className="player-art mt-3 flex h-[min(42vw,220px)] w-[min(42vw,220px)] items-center justify-center rounded-[36px] bg-gradient-to-br from-[#A78BFA] via-[#7C5CFC] to-[#5B3FD6] shadow-[0_14px_24px_rgba(124,92,252,0.32)] md:h-[180px] md:w-[180px]">
            {imgOk && displaySrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={displaySrc} alt="" className="h-[86%] w-[86%] object-contain" decoding="async" />
            ) : (
              <span className="text-6xl font-extrabold text-white">あ</span>
            )}
          </div>
        </div>

        <div className="px-1 pb-1 pt-2">
          <p className="text-center text-xl font-extrabold leading-7 text-[#1E1B4B]">
            {currentWord?.meaning || "Chọn số từ rồi bấm phát"}
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
              {globalNumber} / {words.length}
              {sessionLeft != null ? ` · còn ${sessionLeft}` : ""}
            </span>
            <span>{formatTime(duration)}</span>
          </div>

          <div className="mt-2 flex flex-wrap justify-center gap-1.5">
            {PLAY_WORD_LIMIT_PRESETS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPlayWordLimit(n)}
                className={`rounded-full px-2.5 py-1 text-[10.5px] font-bold ${
                  playWordLimit === n ? "bg-[#7C5CFC] text-white" : "bg-white/70 text-[#4A4470]"
                }`}
              >
                {formatPlayWordLimit(n)}
              </button>
            ))}
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
            <div className="h-11 w-11" />
          </div>
        </div>

        {nextWord ? (
          <div className="mt-2 flex items-center gap-2 rounded-[20px] bg-white/50 px-3.5 py-2.5 text-left md:hidden">
            <span className="text-[11.5px] font-bold text-[#7C5CFC]">Tiếp theo</span>
            <span className="min-w-0 flex-1 truncate text-xs font-semibold text-[#4A4470]">
              #{index + 2} {getHeadline(nextWord)} · {nextWord.meaning}
            </span>
          </div>
        ) : null}
      </div>

      <aside className="glass-strong hidden min-h-0 min-w-0 flex-1 flex-col rounded-[28px] p-3 md:flex md:max-h-[calc(100lvh-2rem)]">
        <p className="px-1 text-[12.5px] font-bold text-[#7C7A9C]">
          {words.length} từ · theo thứ tự bài học
        </p>
        <div className="mt-2 grid min-h-0 flex-1 grid-cols-1 gap-1.5 overflow-y-auto xl:grid-cols-2">
          {words.map((word, wordIndex) => {
            const active = mode === "queue" && wordIndex === index;
            return (
              <button
                key={`${word.lesson}-${word.order}-${wordIndex}`}
                type="button"
                onClick={() => playQueue(wordIndex, true)}
                className={`flex items-center gap-3 rounded-[18px] px-3 py-2.5 text-left ${
                  active ? "bg-[#EFEAFF]" : "bg-white/50"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[11px] font-extrabold ${
                    active ? "bg-[#7C5CFC] text-white" : "bg-white/80 text-[#7C7A9C]"
                  }`}
                >
                  {wordIndex + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-[14px] font-extrabold ${active ? "text-[#7C5CFC]" : "text-[#1E1B4B]"}`}>
                    {getHeadline(word)}
                  </span>
                  <span className="block truncate text-[12px] font-semibold text-[#7C7A9C]">
                    Bài {word.lesson} · {word.meaning}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

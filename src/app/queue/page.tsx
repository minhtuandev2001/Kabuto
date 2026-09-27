"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  ChevronLeft,
  ChevronRight,
  List,
  Minus,
  Pause,
  Play,
  Plus,
  Repeat,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePlayer } from "@/context/PlayerProvider";
import { useCatalog } from "@/context/CatalogProvider";
import { useSettings } from "@/context/SettingsProvider";
import { formatLessonTitle, getHeadline, wordImageSrc } from "@/lib/catalog";
import {
  MAX_PLAY_WORD_LIMIT,
  MIN_PLAY_WORD_LIMIT,
  PLAY_WORD_LIMIT_STEP,
} from "@/lib/theme";

gsap.registerPlugin(useGSAP);

function formatTime(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export default function QueuePage() {
  const root = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const [imgOk, setImgOk] = useState(true);
  const [displaySrc, setDisplaySrc] = useState("");
  const [mobilePane, setMobilePane] = useState<"player" | "list">("player");
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
    queuePage,
    queuePageCount,
    queueGlobalNumber,
    playQueue,
    setQueuePage,
    togglePlay,
    next,
    prev,
    toggleLoop,
  } = usePlayer();
  const { allWords, catalogReady } = useCatalog();
  const { playWordLimit, setPlayWordLimit } = useSettings();
  const pageStart = queuePage * playWordLimit;

  function scrollToPane(pane: "player" | "list") {
    const el = scroller.current;
    if (!el || window.matchMedia("(min-width: 768px)").matches) {
      return;
    }
    el.scrollTo({ left: pane === "list" ? el.scrollWidth : 0, behavior: "smooth" });
    setMobilePane(pane);
  }

  // Enter queue playlist (no autoplay) when opening this screen.
  useEffect(() => {
    if (!catalogReady || !allWords.length) {
      return;
    }
    if (mode !== "queue") {
      playQueue(0, false, 0);
    }
  }, [allWords.length, catalogReady, mode, playQueue]);

  useEffect(() => {
    const el = scroller.current;
    if (!el) {
      return;
    }
    const onScroll = () => {
      if (window.matchMedia("(min-width: 768px)").matches) {
        return;
      }
      setMobilePane(el.scrollLeft > (el.scrollWidth - el.clientWidth) / 2 ? "list" : "player");
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const headline = currentWord ? getHeadline(currentWord) : "—";
  const artSrc = currentWord ? wordImageSrc(currentWord) : "";
  const showKana = Boolean(currentWord?.kanji?.trim());
  const progress = Math.min(1, position / Math.max(duration, 1));
  const nextWord = words[index + 1] ?? (loopLesson ? words[0] : undefined);
  const listHeader = `Trang ${queuePage + 1}/${queuePageCount} · ${words.length} từ · #${pageStart + 1}–#${pageStart + words.length}`;

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
    <div ref={root} className="flex min-h-0 flex-1 flex-col">
      <div
        ref={scroller}
        className="flex min-h-0 flex-1 max-md:-mx-5 max-md:h-[calc(100dvh-8.25rem-env(safe-area-inset-bottom))] max-md:flex-none max-md:snap-x max-md:snap-mandatory max-md:gap-5 max-md:overflow-x-auto max-md:overflow-y-hidden max-md:overscroll-x-contain max-md:px-5 max-md:pb-5 max-md:[scrollbar-width:none] max-md:[&::-webkit-scrollbar]:hidden md:flex-row md:gap-4 md:overflow-visible lg:gap-5"
      >
        <section className="glass-strong flex min-h-0 flex-1 flex-col rounded-[28px] p-4 max-md:h-full max-md:w-full max-md:min-w-full max-md:shrink-0 max-md:snap-center max-md:snap-always max-md:overflow-y-auto max-md:overscroll-y-contain md:w-1/2 md:min-w-0 md:flex-none md:p-5 xl:w-[480px]">
          <div className="flex items-center gap-3">
            <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[13px] bg-[#7C5CFC] text-[12px] font-extrabold text-white">
              {queueGlobalNumber}
            </div>
            <div className="min-w-0 flex-1 text-center">
              <div className="text-[9.5px] font-bold tracking-[1.6px] text-[#7C5CFC]">PHÁT THEO TRANG</div>
              <div className="truncate text-[13.5px] font-extrabold text-[#1E1B4B]">
                {lesson ? formatLessonTitle(lesson) : "Toàn bộ từ vựng"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => scrollToPane("list")}
              className="flex h-[38px] w-[38px] items-center justify-center rounded-[13px] border border-white/70 bg-white/70 md:invisible"
              aria-label="Xem danh sách đang phát"
            >
              <List size={18} className="text-[#7C5CFC]" />
            </button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col items-center justify-center py-4">
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
            <p className="mt-5 text-center text-xl font-extrabold leading-7 text-[#1E1B4B]">
              {currentWord?.meaning || "Chọn trang rồi bấm phát"}
            </p>
            <p className="mt-1 min-h-5 text-center text-[13.5px] font-semibold text-[#7C7A9C]">
              {currentWord?.romaji}
              {currentWord?.sinoVietnamese ? ` · ${currentWord.sinoVietnamese}` : ""}
            </p>
          </div>

          <div className="px-1 pb-1">
            <div className="h-1.5 overflow-visible rounded-full bg-[rgba(30,27,75,0.1)]">
              <div className="relative h-full rounded-full bg-[#7C5CFC]" style={{ width: `${progress * 100}%` }}>
                <span className="absolute -right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-[3px] border-[#7C5CFC] bg-white" />
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-[#7C7A9C]">
              <span>{formatTime(position)}</span>
              <span className="font-bold text-[#7C5CFC]">
                #{queueGlobalNumber} · {index + 1}/{words.length}
              </span>
              <span>{formatTime(duration)}</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between rounded-2xl bg-[#F4F1FF] p-1">
                <button
                  type="button"
                  disabled={playWordLimit <= MIN_PLAY_WORD_LIMIT}
                  onClick={() => setPlayWordLimit(playWordLimit - PLAY_WORD_LIMIT_STEP)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-[#7C5CFC] transition hover:bg-white disabled:text-[#D3CFEA] disabled:hover:bg-transparent"
                  aria-label="Giảm 10 từ mỗi trang"
                >
                  <Minus size={16} strokeWidth={2.6} />
                </button>
                <span className="min-w-0 text-center leading-tight">
                  <span className="block text-[14px] font-extrabold text-[#1E1B4B]">{playWordLimit}</span>
                  <span className="block text-[10px] font-bold text-[#7C7A9C]">từ / trang</span>
                </span>
                <button
                  type="button"
                  disabled={playWordLimit >= MAX_PLAY_WORD_LIMIT}
                  onClick={() => setPlayWordLimit(playWordLimit + PLAY_WORD_LIMIT_STEP)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-[#7C5CFC] transition hover:bg-white disabled:text-[#D3CFEA] disabled:hover:bg-transparent"
                  aria-label="Tăng 10 từ mỗi trang"
                >
                  <Plus size={16} strokeWidth={2.6} />
                </button>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-[#F4F1FF] p-1">
                <button
                  type="button"
                  disabled={queuePage <= 0}
                  onClick={() => setQueuePage(queuePage - 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-[#7C5CFC] transition hover:bg-white disabled:text-[#D3CFEA] disabled:hover:bg-transparent"
                  aria-label="Trang trước"
                >
                  <ChevronLeft size={18} strokeWidth={2.6} />
                </button>
                <span className="min-w-0 text-center leading-tight">
                  <span className="block text-[14px] font-extrabold text-[#1E1B4B]">
                    {queuePage + 1}
                    <span className="text-[#B9B6D4]">/{queuePageCount}</span>
                  </span>
                  <span className="block text-[10px] font-bold text-[#7C7A9C]">trang</span>
                </span>
                <button
                  type="button"
                  disabled={queuePage >= queuePageCount - 1}
                  onClick={() => setQueuePage(queuePage + 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-[#7C5CFC] transition hover:bg-white disabled:text-[#D3CFEA] disabled:hover:bg-transparent"
                  aria-label="Trang sau"
                >
                  <ChevronRight size={18} strokeWidth={2.6} />
                </button>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
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

          <button
            type="button"
            onClick={() => scrollToPane("list")}
            className="mt-2 flex items-center gap-2 rounded-[20px] bg-white/50 px-3.5 py-2.5 text-left md:hidden"
          >
            <span className="text-[11.5px] font-bold text-[#7C5CFC]">
              {nextWord ? "Tiếp theo" : "Danh sách"}
            </span>
            <span className="min-w-0 flex-1 truncate text-xs font-semibold text-[#4A4470]">
              {nextWord
                ? `#${pageStart + index + 2} ${getHeadline(nextWord)} · ${nextWord.meaning}`
                : "Vuốt trái để xem từ đang phát"}
            </span>
            <ChevronRight size={16} className="shrink-0 text-[#7C5CFC]" />
          </button>

          <div className="mt-2 flex items-center justify-center gap-1.5 md:hidden" aria-hidden>
            <span
              className={`h-1.5 rounded-full transition-all ${mobilePane === "player" ? "w-4 bg-[#7C5CFC]" : "w-1.5 bg-[#B9B6D4]"}`}
            />
            <span
              className={`h-1.5 rounded-full transition-all ${mobilePane === "list" ? "w-4 bg-[#7C5CFC]" : "w-1.5 bg-[#B9B6D4]"}`}
            />
          </div>
        </section>

        <aside className="glass-strong flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] p-3 max-md:h-full max-md:w-full max-md:min-w-full max-md:shrink-0 max-md:snap-center max-md:snap-always md:min-w-0 md:max-h-[calc(100lvh-2rem)]">
          <div className="flex shrink-0 items-center gap-2.5 px-1 pb-1 pt-0.5">
            <button
              type="button"
              onClick={() => scrollToPane("player")}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 text-[#7C5CFC] md:hidden"
              aria-label="Quay lại phát"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-extrabold text-[#1E1B4B]">Danh sách đang phát</p>
              <p className="truncate text-[11.5px] font-semibold text-[#7C7A9C]">{listHeader}</p>
            </div>
          </div>
          <div className="mt-2 grid min-h-0 flex-1 grid-cols-1 content-start gap-1.5 overflow-y-auto overscroll-y-contain touch-pan-y xl:grid-cols-2">
            {words.map((word, wordIndex) => {
              const active = mode === "queue" && wordIndex === index;
              const globalNum = pageStart + wordIndex + 1;
              return (
                <button
                  key={`${word.lesson}-${word.order}-${globalNum}`}
                  type="button"
                  onClick={() => {
                    playQueue(wordIndex, true, queuePage);
                    scrollToPane("player");
                  }}
                  className={`flex items-center gap-3 rounded-[18px] px-3 py-2.5 text-left ${
                    active ? "bg-[#EFEAFF]" : "bg-white/50"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[11px] font-extrabold ${
                      active ? "bg-[#7C5CFC] text-white" : "bg-white/80 text-[#7C7A9C]"
                    }`}
                  >
                    {globalNum}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block truncate text-[14px] font-extrabold ${active ? "text-[#7C5CFC]" : "text-[#1E1B4B]"}`}
                    >
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
    </div>
  );
}

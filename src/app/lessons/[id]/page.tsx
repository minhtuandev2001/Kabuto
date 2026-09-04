"use client";

import { ChevronLeft, Play, Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { usePlayer } from "@/context/PlayerProvider";
import { useCatalog } from "@/context/CatalogProvider";
import { formatLessonSubtitle, formatLessonTitle, getHeadline, wordImageSrc } from "@/lib/catalog";
import { PRELOAD_IMAGE_COUNT, WORD_IMAGE_THUMB, preloadImages } from "@/lib/media";

export default function WordListPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { playLesson, lessonId, index, isPlaying } = usePlayer();
  const { getLesson, getWordsForLesson } = useCatalog();
  const lesson = Number(params.id);
  const info = getLesson(lesson);
  const words = getWordsForLesson(lesson);

  useEffect(() => {
    preloadImages(words.slice(0, PRELOAD_IMAGE_COUNT).map((word) => wordImageSrc(word)));
  }, [words]);

  return (
    <div className="pb-4">
      <div className="glass-strong flex items-center gap-2 rounded-[20px] p-2">
        <button
          type="button"
          onClick={() => router.push("/lessons")}
          className="flex h-10 w-10 items-center justify-center rounded-2xl"
        >
          <ChevronLeft size={20} className="text-[#1E1B4B]" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold tracking-wider text-[#7C5CFC]">BÀI {String(lesson).padStart(2, "0")}</p>
          <h1 className="truncate text-[15px] font-extrabold text-[#1E1B4B]">
            {info ? formatLessonTitle(info) : `Bài ${lesson}`}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => router.push(`/create/word?lesson=${lesson}`)}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EFEAFF] text-[#7C5CFC]"
          aria-label="Thêm từ"
        >
          <Plus size={18} />
        </button>
        <button
          type="button"
          disabled={words.length === 0}
          onClick={() => {
            playLesson(lesson, 0);
            router.push("/listen");
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7C5CFC] text-white disabled:opacity-35"
        >
          <Play size={15} className="ml-0.5" fill="currentColor" />
        </button>
      </div>
      <p className="mt-3 text-sm font-semibold text-[#7C7A9C]">
        {info ? formatLessonSubtitle(info) : ""} · {words.length} từ
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {words.length === 0 ? (
          <button
            type="button"
            onClick={() => router.push(`/create/word?lesson=${lesson}`)}
            className="glass rounded-[22px] px-4 py-5 text-left"
          >
            <span className="block text-[15px] font-extrabold text-[#1E1B4B]">Chưa có từ vựng</span>
            <span className="mt-1 block text-[13px] font-semibold text-[#7C7A9C]">Bấm để thêm từ cho bài này</span>
          </button>
        ) : null}
        {words.map((word, wordIndex) => {
          const active = lessonId === lesson && index === wordIndex;
          return (
            <button
              key={`${word.order}-${wordIndex}`}
              type="button"
              onClick={() => {
                playLesson(lesson, wordIndex);
                router.push("/listen");
              }}
              className={`flex items-center gap-3 rounded-[20px] border px-3 py-2.5 text-left ${
                active ? "border-[#7C5CFC]/40 bg-[#EFEAFF]" : "border-white/60 bg-white/50"
              }`}
            >
              {word.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={wordImageSrc(word, WORD_IMAGE_THUMB)}
                  alt=""
                  className={`h-8 w-8 rounded-xl bg-[#EFEAFF] object-cover ${active ? "ring-2 ring-[#7C5CFC]" : ""}`}
                  loading={wordIndex < 12 ? "eager" : "lazy"}
                  decoding="async"
                />
              ) : (
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-xl text-[11.5px] font-extrabold ${
                    active ? "bg-[#7C5CFC] text-white" : "bg-white/80 text-[#7C7A9C]"
                  }`}
                >
                  {word.order}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className={`block truncate text-[15.5px] font-extrabold ${active ? "text-[#7C5CFC]" : "text-[#1E1B4B]"}`}>
                  {getHeadline(word)}
                </span>
                <span className="mt-0.5 block truncate text-[12.5px] font-semibold text-[#4A4470]">{word.meaning}</span>
              </span>
              {active && isPlaying ? <span className="text-[11px] font-bold text-[#7C5CFC]">Đang nghe</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

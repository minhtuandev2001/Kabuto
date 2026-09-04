"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { LessonCard } from "@/components/LessonCard";
import { useCatalog } from "@/context/CatalogProvider";
import { usePlayer } from "@/context/PlayerProvider";

gsap.registerPlugin(useGSAP);

type Filter = "all" | "N5" | "N4" | "custom";

export default function LessonsPage() {
  const root = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { playLesson } = usePlayer();
  const { lessons, allWords, catalogReady } = useCatalog();
  const [filter, setFilter] = useState<Filter>("all");
  const visible = useMemo(() => {
    if (filter === "all") {
      return lessons;
    }
    if (filter === "custom") {
      return lessons.filter((item) => item.custom);
    }
    return lessons.filter((item) => item.jlpt === filter);
  }, [filter, lessons]);

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        return;
      }
      gsap.from(".lessons-head", { y: -12, opacity: 0, duration: 0.4, ease: "power2.out" });
      gsap.from(".lessons-hero", { y: 16, opacity: 0, duration: 0.5, ease: "power3.out" });
      gsap.from(".lesson-card", { y: 18, opacity: 0, stagger: 0.04, duration: 0.4, ease: "power2.out" });
    },
    { scope: root, dependencies: [filter] },
  );

  return (
    <div ref={root} className="pb-4">
      <div className="lessons-head flex items-center justify-between">
        <div>
          <p className="text-[13.5px] font-semibold text-[#7C7A9C]">Xin chào 👋</p>
          <h1 className="text-[26px] font-extrabold text-[#1E1B4B]">Chọn bài học</h1>
        </div>
        <div className="glass-strong flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-extrabold text-[#7C5CFC]">
          あ
        </div>
      </div>

      <div className="lessons-hero relative mt-4 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#A78BFA] via-[#7C5CFC] to-[#5B3FD6] p-5 text-white">
        <p className="text-[11px] font-bold tracking-wider text-white/80">THƯ VIỆN TỪ VỰNG</p>
        <p className="mt-1 text-2xl font-extrabold">{lessons.length} bài học</p>
        <p className="mt-1 text-sm font-semibold text-white/85">{allWords.length.toLocaleString("vi-VN")} từ có phát âm</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/mascot-cat.png" alt="" className="absolute -bottom-3 -right-2 h-28 w-28 object-contain" />
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {(
          [
            ["all", "Tất cả"],
            ["N5", "N5 · Sơ cấp 1"],
            ["N4", "N4 · Sơ cấp 2"],
            ["custom", "Tự soạn"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-bold ${
              filter === id ? "bg-[#7C5CFC] text-white" : "bg-white/55 text-[#4A4470]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-2.5">
        {!catalogReady ? <p className="text-sm font-semibold text-[#7C7A9C]">Đang tải bài học...</p> : null}
        {visible.map((item) => (
          <LessonCard
            key={item.lesson}
            lesson={item}
            onOpen={() => router.push(`/lessons/${item.lesson}`)}
            onPlay={() => {
              playLesson(item.lesson, 0);
              router.push("/listen");
            }}
          />
        ))}
      </div>
    </div>
  );
}

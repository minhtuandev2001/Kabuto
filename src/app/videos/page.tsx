"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Clapperboard, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { VideoCard } from "@/components/VideoCard";
import { useCatalog } from "@/context/CatalogProvider";
import { formatLessonSubtitle, lectureThumbUrl } from "@/lib/catalog";

gsap.registerPlugin(useGSAP);

const LAST_VIDEO_KEY = "lj-last-video";
type Filter = "all" | "N5" | "N4";

export default function VideosPage() {
  const root = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { lessons, getLesson } = useCatalog();
  const [filter, setFilter] = useState<Filter>("all");
  const [lastLesson, setLastLesson] = useState<number | null>(null);
  const visible = useMemo(
    () => (filter === "all" ? lessons : lessons.filter((item) => item.jlpt === filter)),
    [filter, lessons],
  );
  const continueLesson = lastLesson != null ? getLesson(lastLesson) : undefined;

  useEffect(() => {
    const raw = Number(window.localStorage.getItem(LAST_VIDEO_KEY));
    if (Number.isFinite(raw) && raw >= 1) {
      setLastLesson(raw);
    }
  }, []);

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        return;
      }
      gsap.from(".videos-head", { y: -12, opacity: 0, duration: 0.4, ease: "power2.out" });
      gsap.from(".videos-hero", { y: 16, opacity: 0, duration: 0.5, ease: "power3.out" });
      gsap.from(".video-card", { y: 18, opacity: 0, stagger: 0.035, duration: 0.4, ease: "power2.out" });
    },
    { scope: root, dependencies: [filter] },
  );

  return (
    <div ref={root} className="pb-4">
      <div className="videos-head flex items-center justify-between">
        <div>
          <p className="text-[13.5px] font-semibold text-[#7C7A9C]">Bài giảng</p>
          <h1 className="text-[26px] font-extrabold text-[#1E1B4B]">Xem video</h1>
        </div>
        <div className="glass-strong flex h-11 w-11 items-center justify-center rounded-2xl text-[#7C5CFC]">
          <Clapperboard size={20} />
        </div>
      </div>

      <button
        type="button"
        onClick={() => router.push(`/videos/${continueLesson?.lesson ?? 1}`)}
        className="videos-hero relative mt-4 w-full overflow-hidden rounded-[28px] bg-gradient-to-br from-[#A78BFA] via-[#7C5CFC] to-[#5B3FD6] p-0 text-left text-white"
      >
        <span className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lectureThumbUrl("hq720")} alt="" className="h-full w-full object-cover opacity-35" />
          <span className="absolute inset-0 bg-gradient-to-br from-[#5B3FD6]/80 via-[#7C5CFC]/70 to-[#A78BFA]/50" />
        </span>
        <span className="relative z-10 flex items-end justify-between gap-3 p-5">
          <span className="min-w-0">
            <span className="text-[11px] font-bold tracking-wider text-white/80">
              {continueLesson ? "TIẾP TỤC XEM" : "BẮT ĐẦU XEM"}
            </span>
            <span className="mt-1 block text-2xl font-extrabold leading-8">
              {continueLesson ? `Bài ${String(continueLesson.lesson).padStart(2, "0")}` : "Bài 01"}
            </span>
            <span className="mt-1 block truncate text-sm font-semibold text-white/90">
              {continueLesson
                ? formatLessonSubtitle(continueLesson)
                : "Ngữ pháp từng bài, xem rồi nghe từ vựng."}
            </span>
          </span>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[#7C5CFC] shadow-[0_8px_18px_rgba(30,27,75,0.22)]">
            <Play size={20} className="ml-0.5" fill="currentColor" />
          </span>
        </span>
      </button>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {(
          [
            ["all", "Tất cả"],
            ["N5", "N5 · Sơ cấp 1"],
            ["N4", "N4 · Sơ cấp 2"],
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

      <p className="mt-4 text-[12.5px] font-bold text-[#7C7A9C]">{visible.length} bài giảng</p>

      <div className="mt-2 flex flex-col gap-2">
        {visible.map((item) => (
          <VideoCard
            key={item.lesson}
            lesson={item}
            active={item.lesson === lastLesson}
            onOpen={() => router.push(`/videos/${item.lesson}`)}
          />
        ))}
      </div>
    </div>
  );
}

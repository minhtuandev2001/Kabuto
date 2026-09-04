"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { BookType } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { GrammarLessonCard } from "@/components/GrammarLessonCard";
import {
  GRAMMAR_LEVELS,
  allGrammarLessons,
  getGrammarLesson,
  getGrammarLessons,
  grammarLessonCount,
  type JlptLevel,
} from "@/lib/grammar";

gsap.registerPlugin(useGSAP);

const LAST_GRAMMAR_KEY = "lj-last-grammar";
type Filter = "all" | JlptLevel;

function readLast(): { jlpt: JlptLevel; lesson: number } | null {
  const raw = window.localStorage.getItem(LAST_GRAMMAR_KEY);
  if (!raw) {
    return null;
  }
  const [jlptRaw, lessonRaw] = raw.split(":");
  const jlpt = jlptRaw as JlptLevel;
  const lesson = Number(lessonRaw);
  if (!GRAMMAR_LEVELS.includes(jlpt) || !Number.isFinite(lesson)) {
    return null;
  }
  return getGrammarLesson(jlpt, lesson) ? { jlpt, lesson } : null;
}

export default function GrammarPage() {
  const root = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("N5");
  const [last, setLast] = useState<{ jlpt: JlptLevel; lesson: number } | null>(null);
  const visible = useMemo(
    () => (filter === "all" ? allGrammarLessons() : getGrammarLessons(filter)),
    [filter],
  );
  const continueItem = last ? getGrammarLesson(last.jlpt, last.lesson) : getGrammarLesson("N5", 1);

  useEffect(() => {
    setLast(readLast());
  }, []);

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        return;
      }
      gsap.from(".grammar-head", { y: -12, opacity: 0, duration: 0.4, ease: "power2.out" });
      gsap.from(".grammar-hero", { y: 16, opacity: 0, duration: 0.5, ease: "power3.out" });
      gsap.from(".grammar-card", { y: 18, opacity: 0, stagger: 0.035, duration: 0.4, ease: "power2.out" });
    },
    { scope: root, dependencies: [filter] },
  );

  return (
    <div ref={root} className="pb-4">
      <div className="grammar-head flex items-center justify-between">
        <div>
          <p className="text-[13.5px] font-semibold text-[#7C7A9C]">Mẫu câu</p>
          <h1 className="text-[26px] font-extrabold text-[#1E1B4B]">Ngữ pháp</h1>
        </div>
        <div className="glass-strong flex h-11 w-11 items-center justify-center rounded-2xl text-[#7C5CFC]">
          <BookType size={20} />
        </div>
      </div>

      <button
        type="button"
        onClick={() => router.push(`/grammar/${(continueItem?.jlpt ?? "N5").toLowerCase()}/${continueItem?.lesson ?? 1}`)}
        className="grammar-hero relative mt-4 w-full overflow-hidden rounded-[28px] bg-gradient-to-br from-[#A78BFA] via-[#7C5CFC] to-[#5B3FD6] p-5 text-left text-white"
      >
        <span className="text-[11px] font-bold tracking-wider text-white/80">
          {last ? "TIẾP TỤC HỌC" : "BẮT ĐẦU HỌC"}
        </span>
        <span className="mt-1 block text-2xl font-extrabold leading-8">
          {continueItem ? `${continueItem.jlpt} · Bài ${String(continueItem.lesson).padStart(2, "0")}` : "N5 · Bài 01"}
        </span>
        <span className="mt-1 block truncate text-sm font-semibold text-white/90">
          {continueItem?.title ?? "です・は・の"}
        </span>
      </button>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {(
          [
            ["N5", "N5"],
            ["N4", "N4"],
            ["N3", "N3"],
            ["all", "Tất cả"],
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
            {id === "all" ? label : `${label} · ${grammarLessonCount(id)} bài`}
          </button>
        ))}
      </div>

      <p className="mt-4 text-[12.5px] font-bold text-[#7C7A9C]">{visible.length} bài ngữ pháp</p>

      <div className="mt-2 flex flex-col gap-2">
        {visible.map((item) => (
          <GrammarLessonCard
            key={`${item.jlpt}-${item.lesson}`}
            item={item}
            active={last?.jlpt === item.jlpt && last.lesson === item.lesson}
            onOpen={() => router.push(`/grammar/${item.jlpt.toLowerCase()}/${item.lesson}`)}
          />
        ))}
      </div>
    </div>
  );
}

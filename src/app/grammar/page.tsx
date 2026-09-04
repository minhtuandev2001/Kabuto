"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { BookType, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { GrammarLessonCard } from "@/components/GrammarLessonCard";
import { HScroll } from "@/components/HScroll";
import { useCatalog } from "@/context/CatalogProvider";
import { grammarHref, isJlptLevel, JLPT_LEVELS, LAST_GRAMMAR_KEY, type JlptLevel } from "@/lib/grammar";

gsap.registerPlugin(useGSAP);

type Filter = "all" | "custom" | JlptLevel;

function readLastKey() {
  const raw = window.localStorage.getItem(LAST_GRAMMAR_KEY);
  if (!raw) {
    return null;
  }
  const [jlpt, lessonRaw, kind] = raw.split(":");
  const lesson = Number(lessonRaw);
  if (!jlpt || !Number.isFinite(lesson)) {
    return null;
  }
  return { jlpt, lesson, custom: kind === "c" };
}

export default function GrammarPage() {
  const root = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { grammarLessons } = useCatalog();
  const [filter, setFilter] = useState<Filter>("N5");
  const [last, setLast] = useState<{ jlpt: string; lesson: number; custom: boolean } | null>(null);
  const visible = useMemo(() => {
    if (filter === "all") {
      return grammarLessons;
    }
    if (filter === "custom") {
      return grammarLessons.filter((item) => item.custom || !isJlptLevel(item.jlpt));
    }
    return grammarLessons.filter((item) => item.jlpt === filter);
  }, [filter, grammarLessons]);
  const continueItem =
    (last
      ? grammarLessons.find(
          (item) => item.jlpt === last.jlpt && item.lesson === last.lesson && Boolean(item.custom) === last.custom,
        )
      : undefined) ?? grammarLessons.find((item) => item.jlpt === "N5" && item.lesson === 1);

  useEffect(() => {
    setLast(readLastKey());
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
    { scope: root, dependencies: [filter, visible.length] },
  );

  return (
    <div ref={root} className="pb-4">
      <div className="grammar-head flex items-center justify-between">
        <div>
          <p className="text-[13.5px] font-semibold text-[#7C7A9C]">Mẫu câu</p>
          <h1 className="text-[26px] font-extrabold text-[#1E1B4B] md:text-[32px]">Ngữ pháp</h1>
        </div>
        <div className="flex gap-2">
          <div className="glass-strong flex h-11 w-11 items-center justify-center rounded-2xl text-[#7C5CFC]">
            <BookType size={20} />
          </div>
          <button
            type="button"
            onClick={() => router.push("/create/grammar")}
            className="glass-strong flex h-11 w-11 items-center justify-center rounded-2xl text-[#7C5CFC]"
            aria-label="Thêm ngữ pháp"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => continueItem && router.push(grammarHref(continueItem))}
        className="grammar-hero relative mt-4 w-full overflow-hidden rounded-[28px] bg-gradient-to-br from-[#A78BFA] via-[#7C5CFC] to-[#5B3FD6] p-5 text-left text-white md:flex md:min-h-[132px] md:items-center md:justify-between md:p-7"
      >
        <span className="relative z-[1] block min-w-0 md:max-w-[70%]">
          <span className="text-[11px] font-bold tracking-wider text-white/80">
            {last ? "TIẾP TỤC HỌC" : "BẮT ĐẦU HỌC"}
          </span>
          <span className="mt-1 block text-2xl font-extrabold leading-8">
            {continueItem ? `${continueItem.jlpt} · Bài ${String(continueItem.lesson).padStart(2, "0")}` : "N5 · Bài 01"}
          </span>
          <span className="mt-1 block truncate text-sm font-semibold text-white/90">
            {continueItem?.title ?? "です・は・の"}
          </span>
        </span>
        <span className="mt-4 hidden h-16 w-16 shrink-0 items-center justify-center rounded-[20px] bg-white/15 text-2xl font-extrabold md:mt-0 md:flex">
          あ
        </span>
      </button>

      <HScroll className="mt-4">
        {([...JLPT_LEVELS, "custom", "all"] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-bold ${
              filter === id ? "bg-[#7C5CFC] text-white" : "bg-white/55 text-[#4A4470]"
            }`}
          >
            {id === "all"
              ? "Tất cả"
              : id === "custom"
                ? "Tự soạn"
                : `${id} · ${grammarLessons.filter((item) => item.jlpt === id).length} bài`}
          </button>
        ))}
      </HScroll>

      <p className="mt-4 text-[12.5px] font-bold text-[#7C7A9C]">{visible.length} bài ngữ pháp</p>

      <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map((item) => (
          <GrammarLessonCard
            key={`${item.custom ? "c" : "b"}-${item.jlpt}-${item.lesson}`}
            item={item}
            active={last?.jlpt === item.jlpt && last.lesson === item.lesson && last.custom === Boolean(item.custom)}
            onOpen={() => router.push(grammarHref(item))}
          />
        ))}
      </div>
    </div>
  );
}

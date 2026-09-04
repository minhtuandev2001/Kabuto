"use client";

import { ChevronLeft, ChevronRight, Headphones } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { usePlayer } from "@/context/PlayerProvider";
import {
  getAdjacentGrammarLesson,
  getGrammarLesson,
  parseJlptParam,
} from "@/lib/grammar";

const LAST_GRAMMAR_KEY = "lj-last-grammar";

function minnaLessonFor(jlpt: string, lesson: number) {
  if (jlpt === "N5") {
    return lesson;
  }
  if (jlpt === "N4") {
    return lesson + 25;
  }
  return null;
}

export default function GrammarLessonPage() {
  const params = useParams<{ jlpt: string; lesson: string }>();
  const router = useRouter();
  const { playLesson } = usePlayer();
  const jlpt = parseJlptParam(params.jlpt);
  const lessonNo = Number(params.lesson);
  const item = jlpt && Number.isFinite(lessonNo) ? getGrammarLesson(jlpt, lessonNo) : undefined;
  const prev = item ? getAdjacentGrammarLesson(item.jlpt, item.lesson, -1) : undefined;
  const next = item ? getAdjacentGrammarLesson(item.jlpt, item.lesson, 1) : undefined;
  const vocabLesson = item ? minnaLessonFor(item.jlpt, item.lesson) : null;

  useEffect(() => {
    if (item) {
      window.localStorage.setItem(LAST_GRAMMAR_KEY, `${item.jlpt}:${item.lesson}`);
    }
  }, [item]);

  if (!item) {
    return (
      <div className="pb-4">
        <p className="text-sm font-semibold text-[#7C7A9C]">Không tìm thấy bài ngữ pháp.</p>
        <button type="button" onClick={() => router.push("/grammar")} className="mt-3 text-sm font-bold text-[#7C5CFC]">
          Về danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 pb-2">
      <div className="glass-strong flex items-center gap-2 rounded-[20px] p-2">
        <button
          type="button"
          onClick={() => router.push("/grammar")}
          className="flex h-10 w-10 items-center justify-center rounded-2xl"
          aria-label="Danh sách ngữ pháp"
        >
          <ChevronLeft size={20} className="text-[#1E1B4B]" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold tracking-wider text-[#7C5CFC]">
            {item.jlpt} · BÀI {String(item.lesson).padStart(2, "0")}
          </p>
          <h1 className="truncate text-[15px] font-extrabold text-[#1E1B4B]">{item.title}</h1>
        </div>
      </div>
      <p className="-mt-1 px-1 text-[13px] font-semibold text-[#7C7A9C]">{item.subtitle}</p>

      {item.points.map((point) => (
        <article key={point.pattern} className="glass-strong rounded-[24px] p-4">
          <p className="text-[18px] font-extrabold leading-7 text-[#1E1B4B]">{point.pattern}</p>
          <p className="mt-1 text-[14px] font-bold text-[#7C5CFC]">{point.meaning}</p>
          {point.form ? <p className="mt-2 text-[12.5px] font-semibold text-[#4A4470]">{point.form}</p> : null}
          {point.note ? <p className="mt-1.5 text-[12.5px] font-semibold leading-5 text-[#7C7A9C]">{point.note}</p> : null}
          <div className="mt-3 flex flex-col gap-2">
            {point.examples.map((example) => (
              <div key={example.jp} className="rounded-[18px] bg-white/70 px-3 py-2.5">
                <p className="text-[14.5px] font-extrabold text-[#1E1B4B]">{example.jp}</p>
                <p className="mt-0.5 text-[12.5px] font-semibold text-[#7C7A9C]">{example.vi}</p>
              </div>
            ))}
          </div>
        </article>
      ))}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={!prev}
          onClick={() => prev && router.push(`/grammar/${prev.jlpt.toLowerCase()}/${prev.lesson}`)}
          className="glass flex items-center gap-1 rounded-[20px] px-3 py-3 text-left disabled:opacity-35"
        >
          <ChevronLeft size={16} className="shrink-0 text-[#7C5CFC]" />
          <span className="min-w-0">
            <span className="block text-[10px] font-bold tracking-wider text-[#7C7A9C]">BÀI TRƯỚC</span>
            <span className="block truncate text-[13px] font-extrabold text-[#1E1B4B]">
              {prev ? `${prev.jlpt} · ${String(prev.lesson).padStart(2, "0")}` : "—"}
            </span>
          </span>
        </button>
        <button
          type="button"
          disabled={!next}
          onClick={() => next && router.push(`/grammar/${next.jlpt.toLowerCase()}/${next.lesson}`)}
          className="glass flex items-center justify-end gap-1 rounded-[20px] px-3 py-3 text-right disabled:opacity-35"
        >
          <span className="min-w-0">
            <span className="block text-[10px] font-bold tracking-wider text-[#7C7A9C]">BÀI SAU</span>
            <span className="block truncate text-[13px] font-extrabold text-[#1E1B4B]">
              {next ? `${next.jlpt} · ${String(next.lesson).padStart(2, "0")}` : "—"}
            </span>
          </span>
          <ChevronRight size={16} className="shrink-0 text-[#7C5CFC]" />
        </button>
      </div>

      {vocabLesson != null ? (
        <button
          type="button"
          onClick={() => {
            playLesson(vocabLesson, 0);
            router.push("/listen");
          }}
          className="glass-strong flex items-center gap-3 rounded-[20px] px-3.5 py-3 text-left"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EFEAFF] text-[#7C5CFC]">
            <Headphones size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-extrabold text-[#1E1B4B]">Nghe từ vựng Minna bài {String(vocabLesson).padStart(2, "0")}</span>
            <span className="block text-[12px] font-semibold text-[#7C7A9C]">Ngữ pháp xong thì luyện tai</span>
          </span>
        </button>
      ) : null}
    </div>
  );
}

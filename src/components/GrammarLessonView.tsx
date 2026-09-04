"use client";

import { ChevronLeft, ChevronRight, Headphones, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { GrammarPointCard } from "@/components/GrammarPointCard";
import { useCatalog } from "@/context/CatalogProvider";
import { usePlayer } from "@/context/PlayerProvider";
import {
  adjacentGrammarLesson,
  catalogLessonForBuiltin,
  grammarHref,
  LAST_GRAMMAR_KEY,
  type GrammarLesson,
  type GrammarPoint,
} from "@/lib/grammar";

export function GrammarLessonView({ item }: { item: GrammarLesson }) {
  const router = useRouter();
  const { playLesson } = usePlayer();
  const { grammarLessons, removeGrammar } = useCatalog();
  const prev = adjacentGrammarLesson(grammarLessons, item, -1);
  const next = adjacentGrammarLesson(grammarLessons, item, 1);
  const vocabLesson = item.catalogLesson ?? catalogLessonForBuiltin(item.jlpt, item.lesson);

  useEffect(() => {
    window.localStorage.setItem(LAST_GRAMMAR_KEY, `${item.jlpt}:${item.lesson}:${item.custom ? "c" : "b"}`);
  }, [item]);

  async function removePoint(point: GrammarPoint) {
    if (!point.dbId) {
      return;
    }
    if (!window.confirm(`Xóa mẫu「${point.pattern}」?`)) {
      return;
    }
    await removeGrammar(point.dbId);
  }

  function editHref(point: GrammarPoint) {
    const params = new URLSearchParams();
    if (vocabLesson) {
      params.set("lesson", String(vocabLesson));
    }
    params.set("jlpt", item.jlpt);
    params.set("gLesson", String(item.lesson));
    if (point.dbId) {
      params.set("id", String(point.dbId));
    }
    return `/create/grammar?${params.toString()}`;
  }

  function goAdd() {
    if (vocabLesson) {
      router.push(`/create/grammar?lesson=${vocabLesson}&jlpt=${item.jlpt}&gLesson=${item.lesson}`);
      return;
    }
    router.push(`/create/grammar?jlpt=${encodeURIComponent(item.jlpt)}&gLesson=${item.lesson}`);
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
        <button
          type="button"
          onClick={goAdd}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EFEAFF] text-[#7C5CFC]"
          aria-label="Thêm mẫu ngữ pháp"
        >
          <Plus size={18} />
        </button>
      </div>
      <p className="-mt-1 px-1 text-[13px] font-semibold text-[#7C7A9C]">{item.subtitle}</p>

      {item.points.map((point, index) => (
        <GrammarPointCard
          key={point.id || `${point.pattern}-${index}`}
          point={point}
          onEdit={() => router.push(editHref(point))}
          onDelete={() => {
            void removePoint(point);
          }}
        />
      ))}

      <button
        type="button"
        onClick={goAdd}
        className="glass flex items-center justify-center gap-2 rounded-[20px] py-3 text-[13px] font-extrabold text-[#7C5CFC]"
      >
        <Plus size={16} />
        Thêm mẫu cho bài này
      </button>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={!prev}
          onClick={() => prev && router.push(grammarHref(prev))}
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
          onClick={() => next && router.push(grammarHref(next))}
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
            <span className="block text-[14px] font-extrabold text-[#1E1B4B]">
              Nghe từ vựng bài {String(vocabLesson).padStart(2, "0")}
            </span>
            <span className="block text-[12px] font-semibold text-[#7C7A9C]">Ngữ pháp xong thì luyện tai</span>
          </span>
        </button>
      ) : null}
    </div>
  );
}

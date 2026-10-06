"use client";

import { Check, ChevronLeft, GripVertical, Images, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { usePlayer } from "@/context/PlayerProvider";
import { useCatalog } from "@/context/CatalogProvider";
import { formatLessonSubtitle, formatLessonTitle, getHeadline, wordImageSrc } from "@/lib/catalog";
import {
  cloudinaryDisplayUrl,
  LESSON_IMAGE_THUMB,
  PRELOAD_IMAGE_COUNT,
  WORD_IMAGE_THUMB,
  preloadImages,
} from "@/lib/media";
import { findGrammarByCatalogLesson, grammarHref } from "@/lib/grammar";
import { moveItem } from "@/lib/reorder";
import type { VocabWord } from "@/lib/types";

export default function WordListPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { playLesson, lessonId, index, isPlaying } = usePlayer();
  const {
    getLesson,
    getWordsForLesson,
    getImagesForLesson,
    grammarLessons,
    removeCustomLesson,
    removeWord,
    reorderWords,
    catalogBusy,
  } = useCatalog();
  const lesson = Number(params.id);
  const info = getLesson(lesson);
  const words = getWordsForLesson(lesson);
  const images = getImagesForLesson(lesson);
  const imageLed = images.length > 0 && words.length === 0;
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<VocabWord[] | null>(null);
  const [dragOrder, setDragOrder] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ order: number; pointerId: number; x: number; y: number } | null>(null);
  const shown = draft ?? words;
  const grammar = useMemo(
    () => findGrammarByCatalogLesson(grammarLessons, lesson),
    [grammarLessons, lesson],
  );

  useEffect(() => {
    preloadImages(words.slice(0, PRELOAD_IMAGE_COUNT).map((word) => wordImageSrc(word)));
    preloadImages(images.slice(0, 4).map((item) => cloudinaryDisplayUrl(item.imageUrl, LESSON_IMAGE_THUMB)));
  }, [images, words]);

  // Keep scrolling while the finger rests near the top/bottom edge during a drag.
  useEffect(() => {
    if (dragOrder == null) {
      return;
    }
    let frame = 0;
    const tick = () => {
      const drag = dragRef.current;
      if (drag) {
        const bottomEdge = window.innerHeight - (window.matchMedia("(min-width: 768px)").matches ? 80 : 190);
        const dy = drag.y < 90 ? -12 : drag.y > bottomEdge ? 12 : 0;
        if (dy) {
          window.scrollBy(0, dy);
          retarget(drag.x, drag.y);
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [dragOrder]);

  function startStudy() {
    if (imageLed) {
      router.push(`/lessons/${lesson}/images`);
      return;
    }
    playLesson(lesson, 0);
    router.push("/listen");
  }

  async function onDeleteLesson() {
    if (!info) {
      return;
    }
    if (!window.confirm(`Xóa bài ${lesson}?\nTừ vựng và ngữ pháp gắn với bài này cũng sẽ bị xóa.`)) {
      return;
    }
    setDeleting(true);
    try {
      await removeCustomLesson(lesson);
      router.push("/lessons");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Không xóa được bài");
    } finally {
      setDeleting(false);
    }
  }

  async function onDeleteWord(word: VocabWord) {
    if (!window.confirm(`Xóa từ "${getHeadline(word)}" (${word.meaning})?`)) {
      return;
    }
    setSaving(true);
    try {
      await removeWord(word.lesson, word.order);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Không xóa được từ");
    } finally {
      setSaving(false);
    }
  }

  async function commitOrder(next: VocabWord[]) {
    if (next.every((word, i) => word.order === words[i]?.order)) {
      return;
    }
    setSaving(true);
    try {
      await reorderWords(
        lesson,
        next.map((word) => word.order),
      );
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Không lưu được thứ tự");
    } finally {
      setSaving(false);
    }
  }

  function retarget(x: number, y: number) {
    const drag = dragRef.current;
    if (!drag) {
      return;
    }
    let target: number | null = null;
    for (const el of listRef.current?.querySelectorAll<HTMLElement>("[data-word-order]") ?? []) {
      const rect = el.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        target = Number(el.dataset.wordOrder);
        break;
      }
    }
    if (target == null || target === drag.order) {
      return;
    }
    setDraft((current) => {
      if (!current) {
        return current;
      }
      const from = current.findIndex((word) => word.order === drag.order);
      const to = current.findIndex((word) => word.order === target);
      return moveItem(current, from, to);
    });
  }

  function onGripDown(event: PointerEvent<HTMLButtonElement>, order: number) {
    if (event.button !== 0 || saving || dragRef.current) {
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { order, pointerId: event.pointerId, x: event.clientX, y: event.clientY };
    setDraft(words);
    setDragOrder(order);
  }

  function onGripMove(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }
    drag.x = event.clientX;
    drag.y = event.clientY;
    retarget(event.clientX, event.clientY);
  }

  function onGripUp(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }
    dragRef.current = null;
    const next = draft;
    setDragOrder(null);
    setDraft(null);
    if (next && event.type === "pointerup") {
      void commitOrder(next);
    }
  }

  function onGripKey(event: KeyboardEvent<HTMLButtonElement>, wordIndex: number) {
    const delta = event.key === "ArrowUp" || event.key === "ArrowLeft" ? -1 : event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : 0;
    if (!delta || saving) {
      return;
    }
    event.preventDefault();
    void commitOrder(moveItem(words, wordIndex, wordIndex + delta));
  }

  function renderWordBody(word: VocabWord, wordIndex: number, active: boolean) {
    return (
      <>
        {word.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={wordImageSrc(word, WORD_IMAGE_THUMB)}
            alt=""
            draggable={false}
            className={`h-8 w-8 shrink-0 rounded-xl bg-[#EFEAFF] object-cover ${active ? "ring-2 ring-[#7C5CFC]" : ""}`}
            loading={wordIndex < 12 ? "eager" : "lazy"}
            decoding="async"
          />
        ) : (
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[11.5px] font-extrabold ${
              active ? "bg-[#7C5CFC] text-white" : "bg-white/80 text-[#7C7A9C]"
            }`}
          >
            {wordIndex + 1}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className={`block truncate text-[15.5px] font-extrabold ${active ? "text-[#7C5CFC]" : "text-[#1E1B4B]"}`}>
            {getHeadline(word)}
          </span>
          <span className="mt-0.5 block truncate text-[12.5px] font-semibold text-[#4A4470]">{word.meaning}</span>
        </span>
      </>
    );
  }

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
          disabled={!words.length && !editing}
          onClick={() => setEditing((value) => !value)}
          className={`flex h-10 items-center justify-center gap-1.5 rounded-2xl px-3 text-[12.5px] font-extrabold disabled:opacity-40 ${
            editing ? "bg-[#7C5CFC] text-white" : "bg-[#EFEAFF] text-[#7C5CFC]"
          }`}
          aria-pressed={editing}
        >
          {editing ? <Check size={16} /> : <Pencil size={15} />}
          {editing ? "Xong" : "Sửa"}
        </button>
        <button
          type="button"
          disabled={deleting || catalogBusy || !info}
          onClick={() => void onDeleteLesson()}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFE4F1] text-[#DB2777] disabled:opacity-40"
          aria-label="Xóa bài học"
        >
          <Trash2 size={16} />
        </button>
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
          disabled={!imageLed && words.length === 0}
          onClick={startStudy}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7C5CFC] text-white disabled:opacity-35"
          aria-label={imageLed ? "Xem ảnh" : "Phát audio"}
        >
          {imageLed ? <Images size={15} /> : <Play size={15} className="ml-0.5" fill="currentColor" />}
        </button>
      </div>
      <p className="mt-3 text-sm font-semibold text-[#7C7A9C]">
        {info ? formatLessonSubtitle(info) : ""} · {words.length} từ
        {images.length ? ` · ${images.length} ảnh` : ""}
        {info?.book ? ` · ${info.book}` : ""}
        {grammar ? ` · ${grammar.points.length} mẫu` : ""}
      </p>

      {editing ? (
        <p className="mt-3 rounded-[18px] bg-[#EFEAFF] px-4 py-2.5 text-[12.5px] font-semibold leading-5 text-[#5B3FD6]">
          Giữ <GripVertical size={14} className="inline -mt-0.5" /> rồi kéo để đổi vị trí · bấm{" "}
          <Trash2 size={13} className="inline -mt-0.5" /> để xóa từ.
          {saving ? " Đang lưu…" : ""}
        </p>
      ) : null}

      {!editing && images.length ? (
        <button
          type="button"
          onClick={() => router.push(`/lessons/${lesson}/images`)}
          className="glass mt-3 w-full rounded-[22px] px-4 py-3 text-left"
        >
          <span className="block text-[14px] font-extrabold text-[#1E1B4B]">Ảnh phụ · {images.length} trang</span>
          <span className="mt-0.5 block text-[12.5px] font-semibold text-[#7C7A9C]">
            Tùy chọn — học chính vẫn là nghe từ
          </span>
        </button>
      ) : null}

      {editing ? null : grammar?.points.length ? (
        <button
          type="button"
          onClick={() => router.push(grammarHref(grammar))}
          className="glass mt-3 w-full rounded-[22px] px-4 py-3 text-left"
        >
          <span className="block text-[14px] font-extrabold text-[#1E1B4B]">Ngữ pháp bài này</span>
          <span className="mt-0.5 block truncate text-[12.5px] font-semibold text-[#7C7A9C]">
            {grammar.points[0]?.pattern}
            {grammar.points.length > 1 ? ` · +${grammar.points.length - 1} mẫu` : ""}
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => router.push(`/create/grammar?lesson=${lesson}`)}
          className="glass mt-3 w-full rounded-[22px] px-4 py-3 text-left"
        >
          <span className="block text-[14px] font-extrabold text-[#1E1B4B]">Chưa có ngữ pháp tự thêm</span>
          <span className="mt-0.5 block text-[12.5px] font-semibold text-[#7C7A9C]">Bấm để thêm mẫu cho bài này</span>
        </button>
      )}
      <div ref={listRef} className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
        {shown.map((word, wordIndex) => {
          if (editing) {
            const dragging = dragOrder === word.order;
            return (
              <div
                key={word.order}
                data-word-order={word.order}
                className={`flex items-center gap-2 rounded-[20px] border py-2 pl-1 pr-2 transition-[box-shadow,transform] ${
                  dragging
                    ? "relative z-10 scale-[1.02] border-[#7C5CFC]/50 bg-white shadow-[0_12px_28px_rgba(91,63,214,0.22)]"
                    : "border-white/60 bg-white/50"
                }`}
              >
                <button
                  type="button"
                  disabled={saving}
                  onPointerDown={(event) => onGripDown(event, word.order)}
                  onPointerMove={onGripMove}
                  onPointerUp={onGripUp}
                  onPointerCancel={onGripUp}
                  onKeyDown={(event) => onGripKey(event, wordIndex)}
                  className={`flex h-10 w-8 shrink-0 touch-none select-none items-center justify-center rounded-xl disabled:opacity-40 ${
                    dragging ? "cursor-grabbing text-[#7C5CFC]" : "cursor-grab text-[#B9B6D4] hover:text-[#7C5CFC]"
                  }`}
                  aria-label={`Đổi vị trí "${getHeadline(word)}" (kéo, hoặc dùng phím mũi tên)`}
                >
                  <GripVertical size={18} />
                </button>
                {renderWordBody(word, wordIndex, false)}
                <button
                  type="button"
                  disabled={saving || dragOrder != null}
                  onClick={() => void onDeleteWord(word)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#DB2777] hover:bg-[#FFE4F1] disabled:opacity-40"
                  aria-label={`Xóa từ "${getHeadline(word)}"`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          }
          const active = lessonId === lesson && index === wordIndex;
          return (
            <button
              key={word.order}
              type="button"
              onClick={() => {
                playLesson(lesson, wordIndex);
                router.push("/listen");
              }}
              className={`flex items-center gap-3 rounded-[20px] border px-3 py-2.5 text-left ${
                active ? "border-[#7C5CFC]/40 bg-[#EFEAFF]" : "border-white/60 bg-white/50"
              }`}
            >
              {renderWordBody(word, wordIndex, active)}
              {active && isPlaying ? <span className="text-[11px] font-bold text-[#7C5CFC]">Đang nghe</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { ChevronLeft, Plus, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { GrammarPointCard } from "@/components/GrammarPointCard";
import { useCatalog } from "@/context/CatalogProvider";
import { formatLessonTitle } from "@/lib/catalog";
import { catalogLessonForBuiltin } from "@/lib/grammar";

const fieldClass =
  "w-full rounded-2xl border border-white/70 bg-white/70 px-3.5 py-3 text-[15px] font-semibold text-[#1E1B4B] outline-none";

type ExampleDraft = { jp: string; vi: string };

function queryNumber(params: URLSearchParams, key: string) {
  const raw = params.get(key);
  if (!raw) {
    return NaN;
  }
  const value = Number(raw);
  return Number.isFinite(value) ? value : NaN;
}

function CreateGrammarForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lessons, grammarLessons, getLesson, saveGrammar } = useCatalog();
  const presetLesson = queryNumber(searchParams, "lesson");
  const editId = queryNumber(searchParams, "id");
  const jlptParam = searchParams.get("jlpt")?.trim() || "";
  const gLessonParam = queryNumber(searchParams, "gLesson");

  const editingPoint = useMemo(() => {
    if (!Number.isFinite(editId)) {
      return undefined;
    }
    for (const lesson of grammarLessons) {
      const point = lesson.points.find((item) => item.dbId === editId);
      if (point) {
        return { lesson, point };
      }
    }
    return undefined;
  }, [editId, grammarLessons]);

  const targetGrammar = useMemo(() => {
    if (editingPoint) {
      return editingPoint.lesson;
    }
    if (jlptParam && Number.isFinite(gLessonParam)) {
      return grammarLessons.find((item) => item.jlpt === jlptParam && item.lesson === gLessonParam);
    }
    return undefined;
  }, [editingPoint, gLessonParam, grammarLessons, jlptParam]);

  const vocabLesson = targetGrammar
    ? (targetGrammar.catalogLesson ?? catalogLessonForBuiltin(targetGrammar.jlpt, targetGrammar.lesson))
    : null;
  const grammarOnly = Boolean(targetGrammar && vocabLesson == null);

  const defaultLesson = useMemo(() => {
    if (Number.isFinite(presetLesson) && getLesson(presetLesson)) {
      return presetLesson;
    }
    if (vocabLesson) {
      return vocabLesson;
    }
    if (targetGrammar) {
      return 0;
    }
    return lessons[0]?.lesson ?? 0;
  }, [getLesson, lessons, presetLesson, targetGrammar, vocabLesson]);

  const [lessonId, setLessonId] = useState(defaultLesson);
  const [pattern, setPattern] = useState(editingPoint?.point.pattern ?? "");
  const [meaning, setMeaning] = useState(editingPoint?.point.meaning ?? "");
  const [form, setForm] = useState(editingPoint?.point.form ?? "");
  const [note, setNote] = useState(editingPoint?.point.note ?? "");
  const [examples, setExamples] = useState<ExampleDraft[]>(
    editingPoint?.point.examples.length
      ? editingPoint.point.examples
      : [
          { jp: "", vi: "" },
          { jp: "", vi: "" },
        ],
  );
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [saving, setSaving] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    if (defaultLesson) {
      setLessonId(defaultLesson);
    }
  }, [defaultLesson]);

  useEffect(() => {
    if (hydrated.current || !editingPoint) {
      return;
    }
    hydrated.current = true;
    setPattern(editingPoint.point.pattern);
    setMeaning(editingPoint.point.meaning);
    setForm(editingPoint.point.form ?? "");
    setNote(editingPoint.point.note ?? "");
    setExamples(editingPoint.point.examples.length ? editingPoint.point.examples : [{ jp: "", vi: "" }]);
  }, [editingPoint]);

  const editing = Boolean(editingPoint);
  const dbId = editingPoint?.point.dbId;
  const linked = getLesson(lessonId);

  const preview = {
    id: "preview",
    pattern: pattern.trim() || "N は N です",
    meaning: meaning.trim() || "A là B",
    form: form.trim() || undefined,
    note: note.trim() || undefined,
    examples: examples.filter((item) => item.jp.trim()).map((item) => ({ jp: item.jp.trim(), vi: item.vi.trim() })),
  };

  if (!lessons.length && !targetGrammar) {
    return (
      <div className="pb-4">
        <div className="glass-strong rounded-[24px] p-5">
          <h1 className="text-[20px] font-extrabold text-[#1E1B4B]">Chưa có bài học</h1>
          <p className="mt-2 text-sm font-semibold leading-5 text-[#7C7A9C]">
            Phải tạo bài học trước khi thêm ngữ pháp. Mẫu sẽ gắn vào bài đó.
          </p>
          <button
            type="button"
            onClick={() => router.push("/create/lesson?next=grammar")}
            className="mt-4 flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#A78BFA] to-[#7C5CFC] py-3.5 text-[15px] font-extrabold text-white"
          >
            Tạo bài học
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <div className="glass-strong flex items-center gap-2 rounded-[20px] p-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-2xl"
          aria-label="Quay lại"
        >
          <ChevronLeft size={20} className="text-[#1E1B4B]" />
        </button>
        <div>
          <p className="text-[10px] font-bold tracking-wider text-[#7C5CFC]">NGỮ PHÁP</p>
          <h1 className="text-[15px] font-extrabold text-[#1E1B4B]">{editing ? "Sửa mẫu" : "Thêm mẫu"}</h1>
        </div>
      </div>

      <form
        className="mt-4 flex flex-col gap-3"
        onSubmit={async (event) => {
          event.preventDefault();
          setSaved("");
          setSaving(true);
          try {
            const row = await saveGrammar(
              {
                lesson: lessonId || undefined,
                jlpt: targetGrammar?.jlpt || jlptParam || undefined,
                grammarLesson: targetGrammar?.lesson || (Number.isFinite(gLessonParam) ? gLessonParam : undefined),
                pattern,
                meaning,
                form,
                note,
                examples,
              },
              dbId,
            );
            setError("");
            setSaved(row.pattern ? "Đã lưu mẫu ngữ pháp" : "Đã lưu");
            if (!editing) {
              setPattern("");
              setMeaning("");
              setForm("");
              setNote("");
              setExamples([
                { jp: "", vi: "" },
                { jp: "", vi: "" },
              ]);
            }
          } catch (err) {
            setError(err instanceof Error ? err.message : "Không lưu được ngữ pháp");
          } finally {
            setSaving(false);
          }
        }}
      >
        {grammarOnly || lessonId < 1 ? (
          <p className="rounded-[18px] bg-white/70 px-3.5 py-3 text-[12.5px] font-semibold text-[#7C7A9C]">
            {targetGrammar
              ? `${targetGrammar.jlpt} · Bài ${String(targetGrammar.lesson).padStart(2, "0")} · ${targetGrammar.title}`
              : "Chọn hoặc tạo bài học trước khi lưu mẫu."}
          </p>
        ) : (
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-bold text-[#7C7A9C]">Bài học</span>
            <select
              required
              value={lessonId}
              onChange={(event) => setLessonId(Number(event.target.value))}
              disabled={editing}
              className={fieldClass}
            >
              {lessons.map((item) => (
                <option key={item.lesson} value={item.lesson}>
                  Bài {String(item.lesson).padStart(2, "0")} · {formatLessonTitle(item)}
                  {item.jlpt ? ` · ${item.jlpt}` : ""}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-[11px] font-semibold text-[#7C7A9C]">
              {linked
                ? `Mẫu này gắn bài ${String(linked.lesson).padStart(2, "0")} (${linked.jlpt})`
                : "Chọn bài học có sẵn"}
            </span>
          </label>
        )}

        <label className="block">
          <span className="mb-1.5 block text-[12px] font-bold text-[#7C7A9C]">Mẫu ngữ pháp</span>
          <input
            required
            value={pattern}
            onChange={(event) => setPattern(event.target.value)}
            placeholder="N は N です"
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-bold text-[#7C7A9C]">Nghĩa ngắn</span>
          <input
            required
            value={meaning}
            onChange={(event) => setMeaning(event.target.value)}
            placeholder="A là B"
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-bold text-[#7C7A9C]">Cấu trúc (tuỳ chọn)</span>
          <input
            value={form}
            onChange={(event) => setForm(event.target.value)}
            placeholder="Danh từ + は + danh từ + です"
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-bold text-[#7C7A9C]">Ghi chú (tuỳ chọn)</span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="は đọc là 「wa」。Thể phủ định: じゃありません / ではありません."
            rows={3}
            className={`${fieldClass} resize-none`}
          />
        </label>

        <div>
          <span className="mb-1.5 block text-[12px] font-bold text-[#7C7A9C]">Ví dụ</span>
          <div className="flex flex-col gap-2">
            {examples.map((example, index) => (
              <div key={index} className="glass rounded-[20px] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#7C7A9C]">Ví dụ {index + 1}</span>
                  {examples.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => setExamples((current) => current.filter((_, i) => i !== index))}
                      className="text-[#F472B6]"
                      aria-label={`Xóa ví dụ ${index + 1}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  ) : null}
                </div>
                <input
                  value={example.jp}
                  onChange={(event) =>
                    setExamples((current) =>
                      current.map((item, i) => (i === index ? { ...item, jp: event.target.value } : item)),
                    )
                  }
                  placeholder="わたしは学生です。"
                  className={`${fieldClass} mb-2`}
                />
                <input
                  value={example.vi}
                  onChange={(event) =>
                    setExamples((current) =>
                      current.map((item, i) => (i === index ? { ...item, vi: event.target.value } : item)),
                    )
                  }
                  placeholder="Tôi là học sinh."
                  className={fieldClass}
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setExamples((current) => [...current, { jp: "", vi: "" }])}
            className="mt-2 flex items-center gap-1 text-[12.5px] font-bold text-[#7C5CFC]"
          >
            <Plus size={14} />
            Thêm ví dụ
          </button>
        </div>

        <div>
          <span className="mb-1.5 block text-[12px] font-bold text-[#7C7A9C]">Xem trước</span>
          <GrammarPointCard point={preview} />
        </div>

        {error ? <p className="text-sm font-semibold text-[#F472B6]">{error}</p> : null}
        {saved ? <p className="text-sm font-semibold text-[#059669]">{saved}</p> : null}
        <button
          type="submit"
          disabled={saving}
          className="mt-1 flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#A78BFA] to-[#7C5CFC] py-4 text-base font-extrabold text-white disabled:opacity-60"
        >
          {saving ? "Đang lưu..." : editing ? "Lưu chỉnh sửa" : "Lưu mẫu ngữ pháp"}
        </button>
      </form>
    </div>
  );
}

export default function CreateGrammarPage() {
  return (
    <Suspense fallback={<p className="text-sm font-semibold text-[#7C7A9C]">Đang mở form...</p>}>
      <CreateGrammarForm />
    </Suspense>
  );
}

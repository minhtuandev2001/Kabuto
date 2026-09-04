"use client";

import { ChevronLeft, ImagePlus, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useCatalog } from "@/context/CatalogProvider";
import { formatLessonTitle } from "@/lib/catalog";
import { uploadVocabImage } from "@/lib/upload-vocab-image";

function CreateWordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lessons, addWord, getLesson } = useCatalog();
  const preset = Number(searchParams.get("lesson"));
  const defaultLesson = useMemo(() => {
    if (Number.isFinite(preset) && getLesson(preset)) {
      return preset;
    }
    return lessons[0]?.lesson ?? 0;
  }, [getLesson, lessons, preset]);
  const fileRef = useRef<HTMLInputElement>(null);

  const [lessonId, setLessonId] = useState(defaultLesson);
  const [kana, setKana] = useState("");
  const [kanji, setKanji] = useState("");
  const [romaji, setRomaji] = useState("");
  const [meaning, setMeaning] = useState("");
  const [sino, setSino] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (defaultLesson) {
      setLessonId(defaultLesson);
    }
  }, [defaultLesson]);

  function chooseImage(file: File | null) {
    setImagePreview((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return file ? URL.createObjectURL(file) : "";
    });
    setImageFile(file);
  }

  if (!lessons.length) {
    return (
      <div className="pb-4">
        <div className="glass-strong rounded-[24px] p-5">
          <h1 className="text-[20px] font-extrabold text-[#1E1B4B]">Chưa có bài học</h1>
          <p className="mt-2 text-sm font-semibold leading-5 text-[#7C7A9C]">
            Phải tạo bài học trước khi thêm từ vựng.
          </p>
          <button
            type="button"
            onClick={() => router.push("/create/lesson")}
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
          onClick={() => router.push("/create")}
          className="flex h-10 w-10 items-center justify-center rounded-2xl"
          aria-label="Quay lại"
        >
          <ChevronLeft size={20} className="text-[#1E1B4B]" />
        </button>
        <div>
          <p className="text-[10px] font-bold tracking-wider text-[#7C5CFC]">TỪ VỰNG</p>
          <h1 className="text-[15px] font-extrabold text-[#1E1B4B]">Tạo từ mới</h1>
        </div>
      </div>

      <form
        className="mt-4 flex flex-col gap-3"
        onSubmit={async (event) => {
          event.preventDefault();
          setSaved("");
          setSaving(true);
          try {
            const imageUrl = imageFile ? await uploadVocabImage(imageFile) : "";
            const word = await addWord({
              lesson: lessonId,
              kana,
              kanji,
              romaji,
              meaning,
              sinoVietnamese: sino,
              audioUrl,
              imageUrl,
            });
            setKana("");
            setKanji("");
            setRomaji("");
            setMeaning("");
            setSino("");
            setAudioUrl("");
            chooseImage(null);
            if (fileRef.current) {
              fileRef.current.value = "";
            }
            setError("");
            setSaved(`Đã thêm vào bài ${word.lesson}: ${word.kana}`);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Không tạo được từ");
          } finally {
            setSaving(false);
          }
        }}
      >
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-bold text-[#7C7A9C]">Bài học</span>
          <select
            required
            value={lessonId}
            onChange={(event) => setLessonId(Number(event.target.value))}
            className="w-full rounded-2xl border border-white/70 bg-white/70 px-3.5 py-3 text-[15px] font-semibold text-[#1E1B4B] outline-none"
          >
            {lessons.map((item) => (
              <option key={item.lesson} value={item.lesson}>
                Bài {String(item.lesson).padStart(2, "0")} · {formatLessonTitle(item)}
              </option>
            ))}
          </select>
        </label>
        <div>
          <span className="mb-1.5 block text-[12px] font-bold text-[#7C7A9C]">Ảnh minh họa</span>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => chooseImage(event.target.files?.[0] ?? null)}
          />
          {imagePreview ? (
            <div className="relative overflow-hidden rounded-[22px] border border-white/70 bg-white/70">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="" className="mx-auto h-44 w-full object-contain" />
              <button
                type="button"
                onClick={() => {
                  chooseImage(null);
                  if (fileRef.current) {
                    fileRef.current.value = "";
                  }
                }}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#7C7A9C]"
                aria-label="Gỡ ảnh"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-[22px] border border-dashed border-[#C4B5FD] bg-white/50 px-4 py-7 text-[#7C5CFC]"
            >
              <ImagePlus size={22} />
              <span className="text-[13px] font-bold">Chọn ảnh từ máy</span>
              <span className="text-[11px] font-semibold text-[#7C7A9C]">Upload lên Cloudinary khi lưu</span>
            </button>
          )}
        </div>
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-bold text-[#7C7A9C]">Kana</span>
          <input
            required
            value={kana}
            onChange={(event) => setKana(event.target.value)}
            placeholder="わたし"
            className="w-full rounded-2xl border border-white/70 bg-white/70 px-3.5 py-3 text-[15px] font-semibold text-[#1E1B4B] outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-bold text-[#7C7A9C]">Nghĩa</span>
          <input
            required
            value={meaning}
            onChange={(event) => setMeaning(event.target.value)}
            placeholder="tôi"
            className="w-full rounded-2xl border border-white/70 bg-white/70 px-3.5 py-3 text-[15px] font-semibold text-[#1E1B4B] outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-bold text-[#7C7A9C]">Kanji (tuỳ chọn)</span>
          <input
            value={kanji}
            onChange={(event) => setKanji(event.target.value)}
            className="w-full rounded-2xl border border-white/70 bg-white/70 px-3.5 py-3 text-[15px] font-semibold text-[#1E1B4B] outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-bold text-[#7C7A9C]">Romaji (tuỳ chọn)</span>
          <input
            value={romaji}
            onChange={(event) => setRomaji(event.target.value)}
            className="w-full rounded-2xl border border-white/70 bg-white/70 px-3.5 py-3 text-[15px] font-semibold text-[#1E1B4B] outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-bold text-[#7C7A9C]">Hán Việt (tuỳ chọn)</span>
          <input
            value={sino}
            onChange={(event) => setSino(event.target.value)}
            className="w-full rounded-2xl border border-white/70 bg-white/70 px-3.5 py-3 text-[15px] font-semibold text-[#1E1B4B] outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-bold text-[#7C7A9C]">Link audio (tuỳ chọn)</span>
          <input
            value={audioUrl}
            onChange={(event) => setAudioUrl(event.target.value)}
            placeholder="https://..."
            className="w-full rounded-2xl border border-white/70 bg-white/70 px-3.5 py-3 text-[15px] font-semibold text-[#1E1B4B] outline-none"
          />
        </label>
        {error ? <p className="text-sm font-semibold text-[#F472B6]">{error}</p> : null}
        {saved ? <p className="text-sm font-semibold text-[#059669]">{saved}</p> : null}
        <button
          type="submit"
          disabled={saving}
          className="mt-2 flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#A78BFA] to-[#7C5CFC] py-4 text-base font-extrabold text-white disabled:opacity-60"
        >
          {saving ? "Đang lưu..." : "Lưu từ vựng"}
        </button>
      </form>
    </div>
  );
}

export default function CreateWordPage() {
  return (
    <Suspense fallback={<p className="text-sm font-semibold text-[#7C7A9C]">Đang mở form...</p>}>
      <CreateWordForm />
    </Suspense>
  );
}

"use client";

import { ChevronLeft, ChevronDown, ChevronUp, ImagePlus, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useCatalog } from "@/context/CatalogProvider";
import { formatLessonTitle } from "@/lib/catalog";
import { cloudinaryDisplayUrl, LESSON_IMAGE_THUMB } from "@/lib/media";
import { uploadVocabImage } from "@/lib/upload-vocab-image";

function ManageLessonImagesForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    lessons,
    getLesson,
    getImagesForLesson,
    addLessonImage,
    removeLessonImage,
    moveLessonImage,
    catalogBusy,
  } = useCatalog();
  const preset = Number(searchParams.get("lesson"));
  const defaultLesson = useMemo(() => {
    if (Number.isFinite(preset) && getLesson(preset)) {
      return preset;
    }
    return lessons.find((item) => item.jlpt === "N3")?.lesson ?? lessons[0]?.lesson ?? 0;
  }, [getLesson, lessons, preset]);
  const fileRef = useRef<HTMLInputElement>(null);

  const [lessonId, setLessonId] = useState(defaultLesson);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (defaultLesson) {
      setLessonId(defaultLesson);
    }
  }, [defaultLesson]);

  const images = getImagesForLesson(lessonId);

  async function onFiles(files: FileList | null) {
    if (!files?.length || !lessonId) {
      return;
    }
    setError("");
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const url = await uploadVocabImage(file);
        await addLessonImage(lessonId, url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không upload được ảnh");
    } finally {
      setUploading(false);
      if (fileRef.current) {
        fileRef.current.value = "";
      }
    }
  }

  if (!lessons.length) {
    return (
      <div className="pb-4 md:mx-auto md:w-full md:max-w-[560px]">
        <div className="glass-strong rounded-[24px] p-5">
          <h1 className="text-[20px] font-extrabold text-[#1E1B4B]">Chưa có bài học</h1>
          <p className="mt-2 text-sm font-semibold text-[#7C7A9C]">Cần có bài (ví dụ N3 bài 51–62) trước khi gắn ảnh.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-4 md:mx-auto md:w-full md:max-w-[560px]">
      <div className="glass-strong flex items-center gap-2 rounded-[20px] p-2">
        <button
          type="button"
          onClick={() => router.push("/create")}
          className="flex h-10 w-10 items-center justify-center rounded-2xl"
          aria-label="Quay lại"
        >
          <ChevronLeft size={20} className="text-[#1E1B4B]" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold tracking-wider text-[#7C5CFC]">N3+</p>
          <h1 className="truncate text-[15px] font-extrabold text-[#1E1B4B]">Ảnh từ vựng theo bài</h1>
        </div>
      </div>

      <p className="mt-3 text-sm font-semibold text-[#4A4470]">
        Upload ảnh trang bảng từ (Mimikara…). Học bằng xem ảnh, không cần audio.
      </p>

      <label className="mt-4 block">
        <span className="text-[12px] font-bold text-[#7C7A9C]">Bài học</span>
        <select
          value={lessonId}
          onChange={(e) => setLessonId(Number(e.target.value))}
          className="mt-1 w-full rounded-2xl border border-white/70 bg-white/70 px-3 py-3 text-[14px] font-semibold text-[#1E1B4B]"
        >
          {lessons.map((item) => (
            <option key={item.lesson} value={item.lesson}>
              Bài {String(item.lesson).padStart(2, "0")} · {formatLessonTitle(item)} · {item.jlpt}
            </option>
          ))}
        </select>
      </label>

      <input
        ref={fileRef}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        className="hidden"
        onChange={(e) => void onFiles(e.target.files)}
      />

      <button
        type="button"
        disabled={uploading || catalogBusy || !lessonId}
        onClick={() => fileRef.current?.click()}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#A78BFA] to-[#7C5CFC] py-3.5 text-[15px] font-extrabold text-white disabled:opacity-50"
      >
        <ImagePlus size={18} />
        {uploading ? "Đang tải…" : "Thêm ảnh"}
      </button>

      {error ? <p className="mt-3 text-sm font-semibold text-[#DB2777]">{error}</p> : null}

      <div className="mt-5 space-y-2">
        {!images.length ? (
          <div className="glass rounded-[22px] px-4 py-5">
            <p className="text-[15px] font-extrabold text-[#1E1B4B]">Chưa có ảnh</p>
            <p className="mt-1 text-[13px] font-semibold text-[#7C7A9C]">Thêm trang 1, trang 2… theo thứ tự học.</p>
          </div>
        ) : (
          images.map((image, index) => (
            <div key={`${image.lesson}-${image.order}`} className="glass flex items-center gap-2 rounded-[20px] p-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cloudinaryDisplayUrl(image.imageUrl, LESSON_IMAGE_THUMB)}
                alt=""
                className="h-16 w-12 shrink-0 rounded-xl bg-[#EFEAFF] object-cover"
                decoding="async"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-extrabold text-[#1E1B4B]">Trang {index + 1}</p>
                <p className="truncate text-[11px] font-semibold text-[#7C7A9C]">#{image.order}</p>
              </div>
              <button
                type="button"
                disabled={index === 0 || catalogBusy}
                onClick={() => void moveLessonImage(image.lesson, image.order, -1)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#7C5CFC] disabled:opacity-30"
                aria-label="Lên"
              >
                <ChevronUp size={18} />
              </button>
              <button
                type="button"
                disabled={index === images.length - 1 || catalogBusy}
                onClick={() => void moveLessonImage(image.lesson, image.order, 1)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#7C5CFC] disabled:opacity-30"
                aria-label="Xuống"
              >
                <ChevronDown size={18} />
              </button>
              <button
                type="button"
                disabled={catalogBusy}
                onClick={() => void removeLessonImage(image.lesson, image.order)}
                className="flex h-9 w-9 items-center justify-center text-[#F472B6]"
                aria-label="Xóa ảnh"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      {images.length ? (
        <button
          type="button"
          onClick={() => router.push(`/lessons/${lessonId}/images`)}
          className="mt-4 w-full rounded-full bg-[#EFEAFF] py-3 text-[14px] font-extrabold text-[#7C5CFC]"
        >
          Xem như học · {images.length} trang
        </button>
      ) : null}
    </div>
  );
}

export default function ManageLessonImagesPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm font-semibold text-[#7C7A9C]">Đang tải…</div>}>
      <ManageLessonImagesForm />
    </Suspense>
  );
}

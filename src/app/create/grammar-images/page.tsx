"use client";

import { ChevronLeft, ChevronDown, ChevronUp, ImagePlus, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useCatalog } from "@/context/CatalogProvider";
import { grammarImagesHref, isImageLedJlpt } from "@/lib/grammar";
import { cloudinaryDisplayUrl, LESSON_IMAGE_THUMB } from "@/lib/media";
import { uploadVocabImage } from "@/lib/upload-vocab-image";

function ManageGrammarImagesForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    grammarLessons,
    getGrammarImages,
    addGrammarImage,
    removeGrammarImage,
    moveGrammarImage,
    catalogBusy,
  } = useCatalog();
  const presetJlpt = searchParams.get("jlpt")?.trim() ?? "";
  const presetLesson = Number(searchParams.get("lesson"));
  const slots = useMemo(
    () =>
      [...grammarLessons].sort((a, b) => {
        const aLed = isImageLedJlpt(a.jlpt) ? 0 : 1;
        const bLed = isImageLedJlpt(b.jlpt) ? 0 : 1;
        if (aLed !== bLed) {
          return aLed - bLed;
        }
        if (a.jlpt !== b.jlpt) {
          return a.jlpt.localeCompare(b.jlpt);
        }
        return a.lesson - b.lesson;
      }),
    [grammarLessons],
  );
  const defaultKey = useMemo(() => {
    const match = slots.find(
      (item) =>
        item.jlpt === presetJlpt && Number.isFinite(presetLesson) && item.lesson === presetLesson,
    );
    if (match) {
      return `${match.jlpt}:${match.lesson}`;
    }
    const n3 = slots.find((item) => item.jlpt === "N3");
    return n3 ? `${n3.jlpt}:${n3.lesson}` : slots[0] ? `${slots[0].jlpt}:${slots[0].lesson}` : "";
  }, [presetJlpt, presetLesson, slots]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [slotKey, setSlotKey] = useState(defaultKey);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (defaultKey) {
      setSlotKey(defaultKey);
    }
  }, [defaultKey]);

  const selected = slots.find((item) => `${item.jlpt}:${item.lesson}` === slotKey);
  const images = selected ? getGrammarImages(selected.jlpt, selected.lesson) : [];

  async function onFiles(files: FileList | null) {
    if (!files?.length || !selected) {
      return;
    }
    setError("");
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const url = await uploadVocabImage(file);
        await addGrammarImage(selected.jlpt, selected.lesson, url);
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

  if (!slots.length) {
    return (
      <div className="pb-4 md:mx-auto md:w-full md:max-w-[560px]">
        <div className="glass-strong rounded-[24px] p-5">
          <h1 className="text-[20px] font-extrabold text-[#1E1B4B]">Chưa có bài ngữ pháp</h1>
          <p className="mt-2 text-sm font-semibold text-[#7C7A9C]">Cần có bài N3–N1 trước khi gắn ảnh.</p>
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
          <h1 className="truncate text-[15px] font-extrabold text-[#1E1B4B]">Ảnh ngữ pháp theo bài</h1>
        </div>
      </div>

      <p className="mt-3 text-sm font-semibold text-[#4A4470]">
        Upload ảnh trang ngữ pháp (giống Mimikara). Học bằng xem ảnh.
      </p>

      <label className="mt-4 block">
        <span className="text-[12px] font-bold text-[#7C7A9C]">Bài ngữ pháp</span>
        <select
          value={slotKey}
          onChange={(e) => setSlotKey(e.target.value)}
          className="mt-1 w-full rounded-2xl border border-white/70 bg-white/70 px-3 py-3 text-[14px] font-semibold text-[#1E1B4B]"
        >
          {slots.map((item) => (
            <option key={`${item.jlpt}:${item.lesson}`} value={`${item.jlpt}:${item.lesson}`}>
              {item.jlpt} · Bài {String(item.lesson).padStart(2, "0")} · {item.title}
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
        disabled={uploading || catalogBusy || !selected}
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
            <div key={`${image.jlpt}-${image.lesson}-${image.order}`} className="glass flex items-center gap-2 rounded-[20px] p-2.5">
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
                onClick={() => void moveGrammarImage(image.jlpt, image.lesson, image.order, -1)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#7C5CFC] disabled:opacity-30"
                aria-label="Lên"
              >
                <ChevronUp size={18} />
              </button>
              <button
                type="button"
                disabled={index === images.length - 1 || catalogBusy}
                onClick={() => void moveGrammarImage(image.jlpt, image.lesson, image.order, 1)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#7C5CFC] disabled:opacity-30"
                aria-label="Xuống"
              >
                <ChevronDown size={18} />
              </button>
              <button
                type="button"
                disabled={catalogBusy}
                onClick={() => void removeGrammarImage(image.jlpt, image.lesson, image.order)}
                className="flex h-9 w-9 items-center justify-center text-[#F472B6]"
                aria-label="Xóa ảnh"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      {selected && images.length ? (
        <button
          type="button"
          onClick={() => router.push(grammarImagesHref(selected))}
          className="mt-4 w-full rounded-full bg-[#EFEAFF] py-3 text-[14px] font-extrabold text-[#7C5CFC]"
        >
          Xem như học · {images.length} trang
        </button>
      ) : null}
    </div>
  );
}

export default function ManageGrammarImagesPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm font-semibold text-[#7C7A9C]">Đang tải…</div>}>
      <ManageGrammarImagesForm />
    </Suspense>
  );
}

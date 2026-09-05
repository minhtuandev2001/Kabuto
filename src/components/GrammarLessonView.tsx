"use client";

import { ChevronLeft, ChevronRight, Headphones, Images, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { GrammarPointCard } from "@/components/GrammarPointCard";
import { useCatalog } from "@/context/CatalogProvider";
import { usePlayer } from "@/context/PlayerProvider";
import {
  adjacentGrammarLesson,
  catalogLessonForBuiltin,
  grammarHref,
  grammarImagesHref,
  isImageLedJlpt,
  LAST_GRAMMAR_KEY,
  type GrammarLesson,
  type GrammarPoint,
} from "@/lib/grammar";
import { cloudinaryDisplayUrl, LESSON_IMAGE_THUMB } from "@/lib/media";

export function GrammarLessonView({ item }: { item: GrammarLesson }) {
  const router = useRouter();
  const { playLesson } = usePlayer();
  const { grammarLessons, removeGrammar, getGrammarImages, getImagesForLesson } = useCatalog();
  const prev = adjacentGrammarLesson(grammarLessons, item, -1);
  const next = adjacentGrammarLesson(grammarLessons, item, 1);
  const vocabLesson = item.catalogLesson ?? catalogLessonForBuiltin(item.jlpt, item.lesson);
  const images = getGrammarImages(item.jlpt, item.lesson);
  const vocabImages = vocabLesson != null ? getImagesForLesson(vocabLesson) : [];
  const imageLed = isImageLedJlpt(item.jlpt) || images.length > 0;

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

  function formHref(point?: GrammarPoint) {
    const params = new URLSearchParams();
    if (vocabLesson) {
      params.set("lesson", String(vocabLesson));
    }
    params.set("jlpt", item.jlpt);
    params.set("gLesson", String(item.lesson));
    if (point?.dbId) {
      params.set("id", String(point.dbId));
    }
    return `/create/grammar?${params.toString()}`;
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
          onClick={() =>
            router.push(`/create/grammar-images?jlpt=${encodeURIComponent(item.jlpt)}&lesson=${item.lesson}`)
          }
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EFEAFF] text-[#7C5CFC]"
          aria-label="Quản lý ảnh ngữ pháp"
        >
          <Images size={17} />
        </button>
        <button
          type="button"
          onClick={() => router.push(formHref())}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EFEAFF] text-[#7C5CFC]"
          aria-label="Thêm mẫu ngữ pháp"
        >
          <Plus size={18} />
        </button>
      </div>
      <p className="-mt-1 px-1 text-[13px] font-semibold text-[#7C7A9C]">{item.subtitle}</p>

      <button
        type="button"
        onClick={() =>
          router.push(
            images.length
              ? grammarImagesHref(item)
              : `/create/grammar-images?jlpt=${encodeURIComponent(item.jlpt)}&lesson=${item.lesson}`,
          )
        }
        className="glass w-full rounded-[22px] px-4 py-3 text-left"
      >
        <span className="block text-[14px] font-extrabold text-[#1E1B4B]">
          {images.length ? `Ảnh ngữ pháp · ${images.length} trang` : "Ảnh ngữ pháp (N3+)"}
        </span>
        <span className="mt-0.5 block text-[12.5px] font-semibold text-[#7C7A9C]">
          {images.length ? "Bấm để xem / học theo ảnh" : "Thêm ảnh trang ngữ pháp — không cần text mẫu"}
        </span>
        {images.length ? (
          <span className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {images.slice(0, 6).map((image) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${image.jlpt}-${image.lesson}-${image.order}`}
                src={cloudinaryDisplayUrl(image.imageUrl, LESSON_IMAGE_THUMB)}
                alt=""
                className="h-16 w-12 shrink-0 rounded-xl bg-[#EFEAFF] object-cover"
                decoding="async"
              />
            ))}
          </span>
        ) : null}
      </button>

      {!imageLed || item.points.length ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {item.points.map((point, index) => (
            <GrammarPointCard
              key={point.id || `${point.pattern}-${index}`}
              point={point}
              onEdit={() => router.push(formHref(point))}
              onDelete={() => {
                void removePoint(point);
              }}
            />
          ))}
        </div>
      ) : null}

      {!imageLed ? (
        <button
          type="button"
          onClick={() => router.push(formHref())}
          className="glass flex items-center justify-center gap-2 rounded-[20px] py-3 text-[13px] font-extrabold text-[#7C5CFC]"
        >
          <Plus size={16} />
          Thêm mẫu cho bài này
        </button>
      ) : null}

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
            if (vocabImages.length) {
              router.push(`/lessons/${vocabLesson}/images`);
              return;
            }
            playLesson(vocabLesson, 0);
            router.push("/listen");
          }}
          className="glass-strong flex items-center gap-3 rounded-[20px] px-3.5 py-3 text-left"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EFEAFF] text-[#7C5CFC]">
            {vocabImages.length ? <Images size={18} /> : <Headphones size={18} />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-extrabold text-[#1E1B4B]">
              {vocabImages.length
                ? `Ảnh từ vựng bài ${String(vocabLesson).padStart(2, "0")}`
                : `Nghe từ vựng bài ${String(vocabLesson).padStart(2, "0")}`}
            </span>
            <span className="block text-[12px] font-semibold text-[#7C7A9C]">
              {vocabImages.length ? "Sang học từ theo ảnh" : "Ngữ pháp xong thì luyện tai"}
            </span>
          </span>
        </button>
      ) : null}
    </div>
  );
}

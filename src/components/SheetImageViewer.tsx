"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ChevronLeft, ChevronRight, Images, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ZoomableImage } from "@/components/ZoomableImage";
import { cloudinaryDisplayUrl, LESSON_IMAGE_VIEW, preloadImages } from "@/lib/media";

gsap.registerPlugin(useGSAP);

type ImageItem = { order: number; imageUrl: string };

type Props = {
  eyebrow: string;
  title: string;
  images: ImageItem[];
  backHref: string;
  editHref: string;
  emptyHint?: string;
};

export function SheetImageViewer({
  eyebrow,
  title,
  images,
  backHref,
  editHref,
  emptyHint = "Thêm ảnh trang bảng cho bài này.",
}: Props) {
  const root = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const direction = useRef<1 | -1>(1);
  const currentKey = images[index]?.imageUrl ?? "";

  useEffect(() => {
    setIndex(0);
  }, [eyebrow, title]);

  useEffect(() => {
    if (index >= images.length && images.length) {
      setIndex(images.length - 1);
    }
  }, [images.length, index]);

  useEffect(() => {
    const urls = images
      .slice(Math.max(0, index), index + 3)
      .map((item) => cloudinaryDisplayUrl(item.imageUrl, LESSON_IMAGE_VIEW));
    preloadImages(urls);
  }, [images, index]);

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce || !images.length) {
        return;
      }
      const fromX = direction.current * 28;
      gsap.fromTo(
        ".sheet-image-stage",
        { x: fromX, opacity: 0.35 },
        { x: 0, opacity: 1, duration: 0.35, ease: "power2.out" },
      );
      gsap.fromTo(
        ".sheet-image-meta",
        { y: 8, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.3, ease: "power2.out" },
      );
    },
    { scope: root, dependencies: [index, currentKey] },
  );

  const current = images[index];

  function go(delta: -1 | 1) {
    direction.current = delta;
    setIndex((n) => Math.min(images.length - 1, Math.max(0, n + delta)));
  }

  return (
    <div ref={root} className="pb-4">
      <div className="glass-strong flex items-center gap-2 rounded-[20px] p-2">
        <button
          type="button"
          onClick={() => router.push(backHref)}
          className="flex h-10 w-10 items-center justify-center rounded-2xl"
          aria-label="Quay lại"
        >
          <ChevronLeft size={20} className="text-[#1E1B4B]" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold tracking-wider text-[#7C5CFC]">{eyebrow}</p>
          <h1 className="truncate text-[15px] font-extrabold text-[#1E1B4B]">{title}</h1>
        </div>
        <button
          type="button"
          onClick={() => router.push(editHref)}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EFEAFF] text-[#7C5CFC]"
          aria-label="Sửa ảnh"
        >
          <Pencil size={16} />
        </button>
      </div>

      {!images.length ? (
        <div className="glass mt-4 rounded-[24px] px-4 py-8 text-center">
          <Images size={28} className="mx-auto text-[#7C5CFC]" />
          <p className="mt-3 text-[16px] font-extrabold text-[#1E1B4B]">Chưa có ảnh</p>
          <p className="mt-1 text-sm font-semibold text-[#7C7A9C]">{emptyHint}</p>
          <button
            type="button"
            onClick={() => router.push(editHref)}
            className="mt-4 rounded-full bg-[#7C5CFC] px-5 py-2.5 text-[14px] font-extrabold text-white"
          >
            Thêm ảnh
          </button>
        </div>
      ) : (
        <>
          <p className="sheet-image-meta mt-3 text-center text-sm font-semibold text-[#7C7A9C]">
            Trang {index + 1} / {images.length} · chụm 2 ngón phóng to · chạm đúp
          </p>
          <div className="sheet-image-stage mt-2 overflow-hidden rounded-[20px] bg-white/70 shadow-[0_8px_28px_rgba(30,27,75,0.08)]">
            <ZoomableImage
              key={current?.imageUrl}
              src={cloudinaryDisplayUrl(current?.imageUrl ?? "", LESSON_IMAGE_VIEW)}
              alt={`Trang ${index + 1}`}
            />
          </div>
          <div className="mt-3 flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={index <= 0}
              onClick={() => go(-1)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#7C5CFC] shadow transition active:scale-95 disabled:opacity-30"
              aria-label="Trang trước"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              disabled={index >= images.length - 1}
              onClick={() => go(1)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#7C5CFC] text-white shadow transition active:scale-95 disabled:opacity-30"
              aria-label="Trang sau"
            >
              <ChevronRight size={22} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

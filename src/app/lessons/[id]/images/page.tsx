"use client";

import { useParams, useRouter } from "next/navigation";
import { SheetImageViewer } from "@/components/SheetImageViewer";
import { useCatalog } from "@/context/CatalogProvider";
import { formatLessonTitle } from "@/lib/catalog";

export default function LessonImagesViewerPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const lesson = Number(params.id);
  const { getLesson, getImagesForLesson } = useCatalog();
  const info = getLesson(lesson);
  const images = getImagesForLesson(lesson);

  if (!Number.isFinite(lesson) || lesson < 1) {
    return (
      <div className="pb-4">
        <p className="text-sm font-semibold text-[#7C7A9C]">Bài không hợp lệ.</p>
        <button type="button" onClick={() => router.push("/lessons")} className="mt-3 text-sm font-bold text-[#7C5CFC]">
          Về danh sách
        </button>
      </div>
    );
  }

  return (
    <SheetImageViewer
      eyebrow={`BÀI ${String(lesson).padStart(2, "0")} · ẢNH TỪ VỰNG`}
      title={info ? formatLessonTitle(info) : `Bài ${lesson}`}
      images={images}
      backHref={`/lessons/${lesson}`}
      editHref={`/create/images?lesson=${lesson}`}
      emptyHint="Thêm ảnh trang bảng từ cho bài này."
    />
  );
}

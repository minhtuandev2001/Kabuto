"use client";

import { useParams, useRouter } from "next/navigation";
import { SheetImageViewer } from "@/components/SheetImageViewer";
import { useCatalog } from "@/context/CatalogProvider";
import { findGrammarLesson, grammarHref, parseJlptParam } from "@/lib/grammar";

export default function GrammarImagesViewerPage() {
  const params = useParams<{ jlpt: string; lesson: string }>();
  const router = useRouter();
  const { grammarLessons, getGrammarImages } = useCatalog();
  const jlpt = parseJlptParam(params.jlpt);
  const lessonNo = Number(params.lesson);
  const item = jlpt && Number.isFinite(lessonNo) ? findGrammarLesson(grammarLessons, jlpt, lessonNo) : undefined;
  const images = item ? getGrammarImages(item.jlpt, item.lesson) : [];

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
    <SheetImageViewer
      eyebrow={`${item.jlpt} · BÀI ${String(item.lesson).padStart(2, "0")} · ẢNH NGỮ PHÁP`}
      title={item.title}
      images={images}
      backHref={grammarHref(item)}
      editHref={`/create/grammar-images?jlpt=${encodeURIComponent(item.jlpt)}&lesson=${item.lesson}`}
      emptyHint="Thêm ảnh trang ngữ pháp cho bài này."
    />
  );
}

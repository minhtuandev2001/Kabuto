"use client";

import { useParams, useRouter } from "next/navigation";
import { GrammarLessonView } from "@/components/GrammarLessonView";
import { useCatalog } from "@/context/CatalogProvider";
import { findGrammarByCatalogLesson } from "@/lib/grammar";

export default function CustomGrammarLessonPage() {
  const params = useParams<{ lesson: string }>();
  const router = useRouter();
  const { grammarLessons } = useCatalog();
  const lessonNo = Number(params.lesson);
  const item = Number.isFinite(lessonNo) ? findGrammarByCatalogLesson(grammarLessons, lessonNo) : undefined;

  if (!item) {
    return (
      <div className="pb-4">
        <p className="text-sm font-semibold text-[#7C7A9C]">Chưa có ngữ pháp cho bài này.</p>
        <button
          type="button"
          onClick={() => router.push(`/create/grammar?lesson=${lessonNo}`)}
          className="mt-3 text-sm font-bold text-[#7C5CFC]"
        >
          Thêm mẫu
        </button>
      </div>
    );
  }

  return <GrammarLessonView item={item} />;
}

"use client";

import { useParams, useRouter } from "next/navigation";
import { GrammarLessonView } from "@/components/GrammarLessonView";
import { useCatalog } from "@/context/CatalogProvider";
import { findGrammarLesson, parseJlptParam } from "@/lib/grammar";

export default function GrammarLessonPage() {
  const params = useParams<{ jlpt: string; lesson: string }>();
  const router = useRouter();
  const { grammarLessons } = useCatalog();
  const jlpt = parseJlptParam(params.jlpt);
  const lessonNo = Number(params.lesson);
  const item = jlpt && Number.isFinite(lessonNo) ? findGrammarLesson(grammarLessons, jlpt, lessonNo) : undefined;

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

  return <GrammarLessonView item={item} />;
}

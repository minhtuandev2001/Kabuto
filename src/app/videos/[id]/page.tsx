"use client";

import { ChevronLeft, ChevronRight, Headphones } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { LecturePlayer } from "@/components/LecturePlayer";
import { useCatalog } from "@/context/CatalogProvider";
import { usePlayer } from "@/context/PlayerProvider";
import { formatLessonSubtitle, formatLessonTitle } from "@/lib/catalog";

const LAST_VIDEO_KEY = "lj-last-video";

export default function VideoLessonPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { playLesson } = usePlayer();
  const { getLesson, getAdjacentVideoLesson } = useCatalog();
  const lesson = Number(params.id);
  const info = getLesson(lesson);
  const title = info ? formatLessonTitle(info) : `Bài ${lesson}`;
  const subtitle = info ? formatLessonSubtitle(info) : "";
  const prevLesson = Number.isFinite(lesson) ? getAdjacentVideoLesson(lesson, -1) : undefined;
  const nextLesson = Number.isFinite(lesson) ? getAdjacentVideoLesson(lesson, 1) : undefined;

  useEffect(() => {
    if (Number.isFinite(lesson) && lesson >= 1) {
      window.localStorage.setItem(LAST_VIDEO_KEY, String(lesson));
    }
  }, [lesson]);

  if (!Number.isFinite(lesson) || lesson < 1) {
    return (
      <div className="pb-4">
        <p className="text-sm font-semibold text-[#7C7A9C]">Không tìm thấy bài học.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 pb-2">
      <div className="glass-strong flex items-center gap-2 rounded-[20px] p-2">
        <button
          type="button"
          onClick={() => router.push("/videos")}
          className="flex h-10 w-10 items-center justify-center rounded-2xl"
          aria-label="Danh sách video"
        >
          <ChevronLeft size={20} className="text-[#1E1B4B]" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold tracking-wider text-[#7C5CFC]">
            BÀI GIẢNG · {String(lesson).padStart(2, "0")}
            {info ? ` · ${info.jlpt}` : ""}
          </p>
          <h1 className="truncate text-[15px] font-extrabold text-[#1E1B4B]">{title}</h1>
        </div>
      </div>

      {subtitle ? <p className="-mt-1 px-1 text-[13px] font-semibold text-[#7C7A9C]">{subtitle}</p> : null}

      <LecturePlayer lesson={lesson} title={title} />

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={prevLesson == null}
          onClick={() => prevLesson != null && router.push(`/videos/${prevLesson}`)}
          className="glass flex items-center gap-1 rounded-[20px] px-3 py-3 text-left disabled:opacity-35"
        >
          <ChevronLeft size={16} className="shrink-0 text-[#7C5CFC]" />
          <span className="min-w-0">
            <span className="block text-[10px] font-bold tracking-wider text-[#7C7A9C]">BÀI TRƯỚC</span>
            <span className="block truncate text-[13px] font-extrabold text-[#1E1B4B]">
              {prevLesson != null ? `Bài ${String(prevLesson).padStart(2, "0")}` : "—"}
            </span>
          </span>
        </button>
        <button
          type="button"
          disabled={nextLesson == null}
          onClick={() => nextLesson != null && router.push(`/videos/${nextLesson}`)}
          className="glass flex items-center justify-end gap-1 rounded-[20px] px-3 py-3 text-right disabled:opacity-35"
        >
          <span className="min-w-0">
            <span className="block text-[10px] font-bold tracking-wider text-[#7C7A9C]">BÀI SAU</span>
            <span className="block truncate text-[13px] font-extrabold text-[#1E1B4B]">
              {nextLesson != null ? `Bài ${String(nextLesson).padStart(2, "0")}` : "—"}
            </span>
          </span>
          <ChevronRight size={16} className="shrink-0 text-[#7C5CFC]" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          playLesson(lesson, 0);
          router.push("/listen");
        }}
        className="glass-strong flex items-center gap-3 rounded-[20px] px-3.5 py-3 text-left"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EFEAFF] text-[#7C5CFC]">
          <Headphones size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-extrabold text-[#1E1B4B]">Nghe từ vựng bài này</span>
          <span className="block text-[12px] font-semibold text-[#7C7A9C]">Xem xong thì luyện tai ngay</span>
        </span>
      </button>
    </div>
  );
}

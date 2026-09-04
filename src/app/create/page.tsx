"use client";

import { BookPlus, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCatalog } from "@/context/CatalogProvider";
import { formatLessonTitle, getHeadline, wordImageSrc } from "@/lib/catalog";
import { WORD_IMAGE_THUMB } from "@/lib/media";

export default function CreatePage() {
  const router = useRouter();
  const { lessons, customLessons, customWords, getWordsForLesson, removeCustomLesson, removeCustomWord } = useCatalog();
  const hasLessons = lessons.length > 0;

  return (
    <div className="pb-4">
      <p className="text-[11px] font-bold tracking-wider text-[#7C5CFC]">NỘI DUNG</p>
      <h1 className="mt-1 text-[26px] font-extrabold text-[#1E1B4B]">Tạo mới</h1>
      <p className="mt-1 text-sm font-semibold text-[#4A4470]">
        Tạo bài học trước, rồi gắn từ vựng vào bài đó.
      </p>

      <div className="mt-5 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={() => router.push("/create/lesson")}
          className="glass-strong flex items-center gap-3 rounded-[24px] p-3.5 text-left"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EFEAFF] text-[#7C5CFC]">
            <BookPlus size={22} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[16px] font-extrabold text-[#1E1B4B]">Tạo bài học</span>
            <span className="mt-0.5 block text-[12.5px] font-semibold text-[#7C7A9C]">Đặt tên, trình độ, rồi thêm từ</span>
          </span>
          <ChevronRight size={18} className="text-[#B9B6D4]" />
        </button>

        <button
          type="button"
          onClick={() => {
            if (hasLessons) {
              router.push("/create/word");
              return;
            }
            router.push("/create/lesson");
          }}
          className="glass flex items-center gap-3 rounded-[24px] p-3.5 text-left"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#7C5CFC]">
            <Plus size={22} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[16px] font-extrabold text-[#1E1B4B]">Tạo từ vựng</span>
            <span className="mt-0.5 block text-[12.5px] font-semibold text-[#7C7A9C]">
              {hasLessons ? "Bắt buộc chọn bài học đã có" : "Chưa có bài học — tạo bài trước"}
            </span>
          </span>
          <ChevronRight size={18} className="text-[#B9B6D4]" />
        </button>
      </div>

      {customLessons.length ? (
        <div className="mt-6">
          <p className="text-[12.5px] font-bold text-[#7C7A9C]">Bài tự soạn</p>
          <div className="mt-2 flex flex-col gap-2">
            {customLessons.map((item) => (
              <div key={item.lesson} className="glass flex items-center gap-2 rounded-[22px] p-3">
                <button
                  type="button"
                  onClick={() => router.push(`/lessons/${item.lesson}`)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="block truncate text-[14px] font-extrabold text-[#1E1B4B]">
                    Bài {String(item.lesson).padStart(2, "0")} · {formatLessonTitle(item)}
                  </span>
                  <span className="text-[12px] font-semibold text-[#7C7A9C]">
                    {getWordsForLesson(item.lesson).length} từ
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => router.push(`/create/word?lesson=${item.lesson}`)}
                  className="rounded-full bg-[#EFEAFF] px-2.5 py-1 text-[11px] font-bold text-[#7C5CFC]"
                >
                  Thêm từ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void removeCustomLesson(item.lesson);
                  }}
                  className="flex h-9 w-9 items-center justify-center text-[#F472B6]"
                  aria-label={`Xóa bài ${item.lesson}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {customWords.length ? (
        <div className="mt-5">
          <p className="text-[12.5px] font-bold text-[#7C7A9C]">Từ vừa thêm</p>
          <div className="mt-2 flex flex-col gap-2">
            {customWords
              .slice()
              .reverse()
              .slice(0, 20)
              .map((word) => (
                <div key={`${word.lesson}-${word.order}`} className="glass flex items-center gap-2 rounded-[20px] px-3 py-2.5">
                  {wordImageSrc(word) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={wordImageSrc(word, WORD_IMAGE_THUMB)} alt="" className="h-10 w-10 rounded-xl bg-[#EFEAFF] object-cover" decoding="async" />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFEAFF] text-[12px] font-extrabold text-[#7C5CFC]">
                      {getHeadline(word).slice(0, 1)}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-extrabold text-[#1E1B4B]">{getHeadline(word)}</span>
                    <span className="text-[12px] font-semibold text-[#7C7A9C]">
                      Bài {word.lesson} · {word.meaning}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      void removeCustomWord(word.lesson, word.order);
                    }}
                    className="flex h-9 w-9 items-center justify-center text-[#F472B6]"
                    aria-label="Xóa từ"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

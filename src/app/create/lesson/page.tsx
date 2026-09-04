"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCatalog } from "@/context/CatalogProvider";

export default function CreateLessonPage() {
  const router = useRouter();
  const { addLesson, nextLessonNumber } = useCatalog();
  const [title, setTitle] = useState("");
  const [book, setBook] = useState("Tự soạn");
  const [jlpt, setJlpt] = useState("Tự soạn");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <div className="pb-4">
      <div className="glass-strong flex items-center gap-2 rounded-[20px] p-2">
        <button
          type="button"
          onClick={() => router.push("/create")}
          className="flex h-10 w-10 items-center justify-center rounded-2xl"
          aria-label="Quay lại"
        >
          <ChevronLeft size={20} className="text-[#1E1B4B]" />
        </button>
        <div>
          <p className="text-[10px] font-bold tracking-wider text-[#7C5CFC]">BÀI {String(nextLessonNumber).padStart(2, "0")}</p>
          <h1 className="text-[15px] font-extrabold text-[#1E1B4B]">Tạo bài học</h1>
        </div>
      </div>

      <form
        className="mt-4 flex flex-col gap-3"
        onSubmit={async (event) => {
          event.preventDefault();
          setSaving(true);
          try {
            const lesson = await addLesson({ title, book, jlpt });
            router.push(`/create/word?lesson=${lesson.lesson}`);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Không tạo được bài");
            setSaving(false);
          }
        }}
      >
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-bold text-[#7C7A9C]">Tên bài học</span>
          <input
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="家族 - Gia đình"
            className="w-full rounded-2xl border border-white/70 bg-white/70 px-3.5 py-3 text-[15px] font-semibold text-[#1E1B4B] outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-bold text-[#7C7A9C]">Sách / nhóm</span>
          <input
            value={book}
            onChange={(event) => setBook(event.target.value)}
            className="w-full rounded-2xl border border-white/70 bg-white/70 px-3.5 py-3 text-[15px] font-semibold text-[#1E1B4B] outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-bold text-[#7C7A9C]">Trình độ</span>
          <select
            value={jlpt}
            onChange={(event) => setJlpt(event.target.value)}
            className="w-full rounded-2xl border border-white/70 bg-white/70 px-3.5 py-3 text-[15px] font-semibold text-[#1E1B4B] outline-none"
          >
            <option value="Tự soạn">Tự soạn</option>
            <option value="N5">N5</option>
            <option value="N4">N4</option>
            <option value="N3">N3</option>
          </select>
        </label>
        {error ? <p className="text-sm font-semibold text-[#F472B6]">{error}</p> : null}
        <button
          type="submit"
          disabled={saving}
          className="mt-2 flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#A78BFA] to-[#7C5CFC] py-4 text-base font-extrabold text-white disabled:opacity-60"
        >
          {saving ? "Đang lưu..." : "Tạo bài rồi thêm từ"}
        </button>
      </form>
    </div>
  );
}

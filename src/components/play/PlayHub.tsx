"use client";

import { Gift, Hand, Keyboard, Volume2, VolumeX } from "lucide-react";
import { useMemo, useState } from "react";
import { HScroll } from "@/components/HScroll";
import { GAMES } from "@/lib/play/deck";
import {
  BOX_INTERVAL_DAYS,
  liveStreak,
  outfitEmoji,
  type DeckSource,
  type GameId,
  type PlayProgress,
  type PlaySetup,
} from "@/lib/play/progress";
import type { LessonInfo } from "@/lib/types";
import { Neko } from "./Neko";

const COUNT_OPTIONS = [10, 20, 30, 50, 100, 0];

const SOURCES: { id: DeckSource; label: string }[] = [
  { id: "lesson", label: "Theo bài" },
  { id: "level", label: "Theo cấp N" },
  { id: "review", label: "Cần ôn" },
];

export type LevelInfo = { level: string; words: number; lessons: number };

type Props = {
  progress: PlayProgress;
  today: number;
  lessons: LessonInfo[];
  levels: LevelInfo[];
  wordCount: (lesson: number) => number;
  available: number;
  known: number;
  dueCount: number;
  deckSize: number;
  untypeable: number;
  onSetup: (patch: Partial<PlaySetup>) => void;
  onStart: (game: GameId) => void;
  onOpenGacha: () => void;
  onToggleMute: () => void;
};

export function PlayHub({
  progress,
  today,
  lessons,
  levels,
  wordCount,
  available,
  known,
  dueCount,
  deckSize,
  untypeable,
  onSetup,
  onStart,
  onOpenGacha,
  onToggleMute,
}: Props) {
  const { setup } = progress;
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const streak = liveStreak(progress.streak, today);
  const sleeping = progress.streak.count > 0 && streak === 0;
  const selected = useMemo(() => new Set(setup.lessons), [setup.lessons]);
  const shownLessons = levelFilter === "all" ? lessons : lessons.filter((item) => item.jlpt === levelFilter);

  function toggleLesson(lesson: number) {
    const next = new Set(selected);
    if (next.has(lesson)) {
      next.delete(lesson);
    } else {
      next.add(lesson);
    }
    onSetup({ lessons: [...next].sort((a, b) => a - b) });
  }

  function toggleLevel(level: string) {
    const next = setup.levels.includes(level) ? setup.levels.filter((item) => item !== level) : [...setup.levels, level];
    onSetup({ levels: next });
  }

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold tracking-wider text-[#7C5CFC]">CHƠI MÀ HỌC</p>
          <h1 className="text-[26px] font-extrabold text-[#1E1B4B] md:text-[32px]">Neko Dojo</h1>
        </div>
        <button
          type="button"
          onClick={onToggleMute}
          className="glass-strong flex h-11 w-11 items-center justify-center rounded-2xl text-[#7C5CFC]"
          aria-label={progress.muted ? "Bật âm thanh game" : "Tắt âm thanh game"}
        >
          {progress.muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      </div>

      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#A78BFA] via-[#7C5CFC] to-[#5B3FD6] p-4 text-white">
        <div className="flex items-center gap-3">
          <Neko mood={sleeping ? "sleep" : "idle"} accessory={outfitEmoji(progress.equipped)} size={96} />
          <div className="min-w-0 flex-1">
            <div className="grid grid-cols-3 gap-1.5 text-center">
              {[
                [`${progress.koban}`, "🪙 koban"],
                [`${streak}`, "🔥 ngày"],
                [`${dueCount}`, "📚 cần ôn"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl bg-white/15 px-1 py-2">
                  <p className="text-[18px] font-extrabold leading-6">{value}</p>
                  <p className="text-[10.5px] font-bold text-white/80">{label}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={onOpenGacha}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-full bg-white py-2 text-[13px] font-extrabold text-[#7C5CFC]"
            >
              <Gift size={15} /> Gacha đồ cho Neko
            </button>
          </div>
        </div>
        {sleeping ? (
          <p className="mt-2 rounded-2xl bg-white/15 px-3 py-2 text-[12px] font-bold">
            Neko ngủ quên vì bạn nghỉ học rồi. Chơi một ván để đánh thức và bắt đầu chuỗi ngày mới!
          </p>
        ) : null}
      </section>

      <section className="glass-strong rounded-[28px] p-4">
        <p className="text-[15px] font-extrabold text-[#1E1B4B]">1. Chọn từ để học</p>
        <div className="mt-2.5 grid grid-cols-3 gap-1 rounded-2xl bg-[#EFEAFF] p-1">
          {SOURCES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSetup({ source: item.id })}
              className={`rounded-xl py-2 text-[12.5px] font-extrabold ${
                setup.source === item.id ? "bg-white text-[#7C5CFC] shadow-sm" : "text-[#7C7A9C]"
              }`}
            >
              {item.label}
              {item.id === "review" && dueCount ? ` (${dueCount})` : ""}
            </button>
          ))}
        </div>

        {setup.source === "lesson" ? (
          <div className="mt-3">
            <HScroll>
              {["all", ...levels.map((item) => item.level)].map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setLevelFilter(id)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-bold ${
                    levelFilter === id ? "bg-[#7C5CFC] text-white" : "bg-white/70 text-[#4A4470]"
                  }`}
                >
                  {id === "all" ? "Tất cả bài" : id}
                </button>
              ))}
            </HScroll>
            <div className="mt-2 grid max-h-64 grid-cols-4 gap-1.5 overflow-y-auto pr-0.5 sm:grid-cols-6">
              {shownLessons.map((item) => {
                const on = selected.has(item.lesson);
                return (
                  <button
                    key={item.lesson}
                    type="button"
                    onClick={() => toggleLesson(item.lesson)}
                    className={`rounded-2xl px-1 py-2 text-center ${on ? "bg-[#7C5CFC] text-white" : "bg-white/75 text-[#1E1B4B]"}`}
                  >
                    <span className="block text-[15px] font-extrabold leading-5">Bài {item.lesson}</span>
                    <span className={`block text-[10.5px] font-bold ${on ? "text-white/80" : "text-[#7C7A9C]"}`}>
                      {item.jlpt} · {wordCount(item.lesson)} từ
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => onSetup({ lessons: [...new Set([...setup.lessons, ...shownLessons.map((item) => item.lesson)])].sort((a, b) => a - b) })}
                className="rounded-full bg-[#EFEAFF] px-3 py-1.5 text-[12px] font-bold text-[#7C5CFC]"
              >
                Chọn tất cả {levelFilter === "all" ? "" : levelFilter}
              </button>
              <button
                type="button"
                disabled={!setup.lessons.length}
                onClick={() => onSetup({ lessons: [] })}
                className="rounded-full bg-white/70 px-3 py-1.5 text-[12px] font-bold text-[#4A4470] disabled:opacity-40"
              >
                Bỏ chọn ({setup.lessons.length})
              </button>
            </div>
          </div>
        ) : null}

        {setup.source === "level" ? (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {levels.map((item) => {
              const on = setup.levels.includes(item.level);
              return (
                <button
                  key={item.level}
                  type="button"
                  onClick={() => toggleLevel(item.level)}
                  className={`rounded-[20px] px-3 py-3 text-left ${on ? "bg-[#7C5CFC] text-white" : "bg-white/75 text-[#1E1B4B]"}`}
                >
                  <span className="block text-[18px] font-extrabold">{item.level}</span>
                  <span className={`block text-[11.5px] font-bold ${on ? "text-white/80" : "text-[#7C7A9C]"}`}>
                    {item.lessons} bài · {item.words.toLocaleString("vi-VN")} từ
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}

        {setup.source === "review" ? (
          <p className="mt-3 rounded-2xl bg-white/70 px-3 py-2.5 text-[13px] font-semibold leading-5 text-[#4A4470]">
            {dueCount
              ? `Có ${dueCount} từ đến hạn ôn hôm nay, gồm các từ bạn từng trả lời sai. Ôn ngay để không quên!`
              : "Chưa có từ nào đến hạn ôn. Chơi theo bài hoặc theo cấp trước, những từ trả lời sai sẽ xuất hiện ở đây."}
          </p>
        ) : null}
      </section>

      <section className="glass-strong rounded-[28px] p-4">
        <p className="text-[15px] font-extrabold text-[#1E1B4B]">2. Số từ mỗi ván</p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {COUNT_OPTIONS.map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => onSetup({ count })}
              className={`rounded-full px-3.5 py-1.5 text-[13px] font-extrabold ${
                setup.count === count ? "bg-[#7C5CFC] text-white" : "bg-white/75 text-[#4A4470]"
              }`}
            >
              {count ? `${count} từ` : "Tất cả"}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[12px] font-semibold text-[#7C7A9C]">
          {available
            ? `Có ${available.toLocaleString("vi-VN")} từ phù hợp · đã thuộc ${known.toLocaleString("vi-VN")} · ván này ${deckSize} từ (ưu tiên từ cần ôn và từ mới)`
            : "Chưa có từ nào. Hãy chọn bài hoặc cấp độ ở trên."}
        </p>
        {setup.mode === "type" && untypeable ? (
          <p className="mt-1 text-[11.5px] font-semibold text-[#B45309]">
            Bỏ qua {untypeable} từ không có cách đọc kana để gõ.
          </p>
        ) : null}
      </section>

      <section className="glass-strong rounded-[28px] p-4">
        <p className="text-[15px] font-extrabold text-[#1E1B4B]">3. Cách chơi</p>
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          {(
            [
              ["choice", Hand, "Chọn đáp án", "Bận tay: chạm là xong, chơi một tay được"],
              ["type", Keyboard, "Gõ cách đọc", "Rảnh tay: gõ romaji/kana, luyện gõ phím"],
            ] as const
          ).map(([id, Icon, title, note]) => (
            <button
              key={id}
              type="button"
              onClick={() => onSetup({ mode: id })}
              className={`rounded-[22px] p-3 text-left ${setup.mode === id ? "bg-[#7C5CFC] text-white" : "bg-white/75 text-[#1E1B4B]"}`}
            >
              <Icon size={22} />
              <span className="mt-1.5 block text-[14.5px] font-extrabold">{title}</span>
              <span className={`block text-[11.5px] font-semibold leading-4 ${setup.mode === id ? "text-white/80" : "text-[#7C7A9C]"}`}>
                {note}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="px-1 text-[15px] font-extrabold text-[#1E1B4B]">4. Chọn game</p>
        <div className="mt-2.5 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {GAMES.map((game) => (
            <button
              key={game.id}
              type="button"
              disabled={!deckSize}
              onClick={() => onStart(game.id)}
              className="glass-strong flex flex-col rounded-[24px] p-3.5 text-left transition active:scale-[0.97] disabled:opacity-45"
            >
              <span className="text-[36px] leading-[44px]">{game.emoji}</span>
              <span className="mt-1 text-[15px] font-extrabold leading-5 text-[#1E1B4B]">{game.name}</span>
              <span className="mt-0.5 text-[11.5px] font-semibold leading-4 text-[#7C7A9C]">{game.tagline}</span>
              <span className="mt-2 text-[11px] font-bold text-[#7C5CFC]">
                {progress.best[game.id] ? `🏆 Kỷ lục ${progress.best[game.id]}` : "Chưa chơi"}
              </span>
            </button>
          ))}
        </div>
      </section>

      <p className="glass rounded-[22px] px-4 py-3 text-[12px] font-semibold leading-5 text-[#4A4470]">
        📒 Sổ từ: trả lời đúng thì từ lên hộp và được hỏi lại sau {BOX_INTERVAL_DAYS.slice(1).join(" → ")} ngày. Sai thì về
        hộp đầu và được hỏi lại sớm. Dùng gợi ý thì tính như chưa thuộc. Tiến độ lưu trên máy này.
      </p>
    </div>
  );
}

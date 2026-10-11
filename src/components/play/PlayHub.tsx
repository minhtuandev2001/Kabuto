"use client";

import { Gift, Hand, Keyboard, Lock, Volume2, VolumeX } from "lucide-react";
import { useMemo, useState } from "react";
import { HScroll } from "@/components/HScroll";
import { GAMES, gameRules } from "@/lib/play/deck";
import {
  BOX_INTERVAL_DAYS,
  dailyFor,
  levelFor,
  liveStreak,
  outfitEmoji,
  questDone,
  stageGame,
  stageOpen,
  todaysQuests,
  type DeckSource,
  type GameId,
  type PlayProgress,
  type PlaySetup,
  type Quest,
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
  onStartStage: (lesson: number) => void;
  onClaimQuest: (quest: Quest) => void;
  onOpenGacha: () => void;
  onToggleMute: () => void;
};

/** Stages shown around the current one; the full journey can be hundreds of lessons. */
const STAGES_BEHIND = 3;
const STAGES_AHEAD = 7;

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
  onStartStage,
  onClaimQuest,
  onOpenGacha,
  onToggleMute,
}: Props) {
  const { setup } = progress;
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const streak = liveStreak(progress.streak, today);
  const sleeping = progress.streak.count > 0 && streak === 0;
  const selected = useMemo(() => new Set(setup.lessons), [setup.lessons]);
  const shownLessons = levelFilter === "all" ? lessons : lessons.filter((item) => item.jlpt === levelFilter);
  const level = levelFor(progress.xp);
  const daily = dailyFor(progress.daily, today);
  const quests = todaysQuests(today);
  const stageOrder = useMemo(() => lessons.map((item) => item.lesson), [lessons]);
  const firstUncleared = stageOrder.findIndex((lesson) => !progress.stages[lesson]);
  const frontier = firstUncleared < 0 ? Math.max(0, stageOrder.length - 1) : firstUncleared;
  const stageFrom = Math.max(0, frontier - STAGES_BEHIND);
  const shownStages = stageOrder.slice(stageFrom, frontier + STAGES_AHEAD + 1);
  const cleared = stageOrder.filter((lesson) => progress.stages[lesson]).length;

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
        <div className="mt-3">
          <div className="flex items-center justify-between text-[12px] font-extrabold">
            <span>⭐ Neko Lv {level.level}</span>
            <span className="text-white/80">
              {level.into}/{level.need} XP
            </span>
          </div>
          <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-[#FDE68A]" style={{ width: `${(level.into / level.need) * 100}%` }} />
          </div>
        </div>
        {sleeping ? (
          <p className="mt-2 rounded-2xl bg-white/15 px-3 py-2 text-[12px] font-bold">
            Neko ngủ quên vì bạn nghỉ học rồi. Chơi một ván để đánh thức và bắt đầu chuỗi ngày mới!
          </p>
        ) : null}
      </section>

      <section className="glass-strong rounded-[28px] p-4">
        <p className="text-[15px] font-extrabold text-[#1E1B4B]">🎯 Nhiệm vụ hôm nay</p>
        <ul className="mt-2.5 flex flex-col gap-2">
          {quests.map((quest) => {
            const value = Math.min(quest.target, daily[quest.stat]);
            const done = questDone(daily, quest);
            const claimed = daily.claimed.includes(quest.id);
            return (
              <li key={quest.id} className="flex items-center gap-3 rounded-[18px] bg-white/70 px-3 py-2.5">
                <span className="text-[22px] leading-none">{quest.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-extrabold text-[#1E1B4B]">{quest.label}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#EFEAFF]">
                      <div className="h-full rounded-full bg-[#7C5CFC]" style={{ width: `${(value / quest.target) * 100}%` }} />
                    </div>
                    <span className="shrink-0 text-[11px] font-bold text-[#7C7A9C]">
                      {value}/{quest.target}
                    </span>
                  </div>
                </div>
                {claimed ? (
                  <span className="shrink-0 text-[12px] font-extrabold text-emerald-600">✓ Đã nhận</span>
                ) : (
                  <button
                    type="button"
                    disabled={!done}
                    onClick={() => onClaimQuest(quest)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-extrabold ${
                      done ? "play-bob bg-gradient-to-r from-[#F97316] to-[#EC4899] text-white" : "bg-[#EFEAFF] text-[#7C7A9C]"
                    }`}
                  >
                    {done ? "Nhận " : ""}+{quest.reward} 🪙
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {stageOrder.length ? (
        <section className="glass-strong rounded-[28px] p-4">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-[15px] font-extrabold text-[#1E1B4B]">🗺️ Hành trình</p>
            <p className="text-[11.5px] font-bold text-[#7C7A9C]">
              Đã qua {cleared}/{stageOrder.length} ải
            </p>
          </div>
          <p className="mt-0.5 text-[11.5px] font-semibold leading-4 text-[#7C7A9C]">
            Mỗi ải là một bài. Đạt 1 sao để mở ải sau, ải thứ 4 luôn là Boss.
          </p>
          <div className="mt-3">
            <HScroll>
              {shownStages.map((lesson, i) => {
                const index = stageFrom + i;
                const open = stageOpen(progress.stages, stageOrder, index);
                const stars = progress.stages[lesson] ?? 0;
                const current = index === frontier;
                const game = gameRules(stageGame(index));
                return (
                  <button
                    key={lesson}
                    type="button"
                    disabled={!open}
                    onClick={() => onStartStage(lesson)}
                    className={`flex w-[76px] shrink-0 flex-col items-center rounded-[22px] px-1 py-2 ${
                      current
                        ? "bg-gradient-to-b from-[#A78BFA] to-[#7C5CFC] text-white shadow-[0_8px_18px_rgba(124,92,252,0.35)]"
                        : open
                          ? "bg-white/80 text-[#1E1B4B]"
                          : "bg-white/40 text-[#B9B6D4]"
                    }`}
                  >
                    <span className={`text-[28px] leading-9 ${current ? "play-bob" : ""} ${open ? "" : "grayscale"}`}>
                      {open ? game.emoji : <Lock size={22} className="mx-auto my-1.5" />}
                    </span>
                    <span className="text-[12.5px] font-extrabold leading-4">Bài {lesson}</span>
                    <span className="text-[11px] leading-4 tracking-tight">
                      {[0, 1, 2].map((s) => (s < stars ? "★" : "☆")).join("")}
                    </span>
                  </button>
                );
              })}
            </HScroll>
          </div>
          <button
            type="button"
            onClick={() => onStartStage(stageOrder[frontier]!)}
            className="mt-3 w-full rounded-full bg-gradient-to-r from-[#A78BFA] to-[#7C5CFC] py-3 text-[14.5px] font-extrabold text-white shadow-[0_10px_20px_rgba(124,92,252,0.3)]"
          >
            ▶ Chơi ải Bài {stageOrder[frontier]} · {gameRules(stageGame(frontier)).name}
          </button>
        </section>
      ) : null}

      <p className="-mb-2 px-1 text-[13px] font-extrabold tracking-wide text-[#7C7A9C]">CHƠI TỰ DO</p>

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

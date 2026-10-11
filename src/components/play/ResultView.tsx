"use client";

import { ChevronRight, RotateCcw, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getHeadline } from "@/lib/catalog";
import { gameRules, type RoundResult } from "@/lib/play/deck";
import type { RoundMeta } from "@/lib/play/progress";
import { playWordAudio, sfx } from "@/lib/play/sfx";
import { Neko } from "./Neko";

const CONFETTI_COLORS = ["#F472B6", "#FBBF24", "#34D399", "#60A5FA", "#A78BFA", "#FB923C"];

function Confetti() {
  const [pieces] = useState(() =>
    Array.from({ length: 44 }, (_, i) => ({
      left: `${Math.random() * 100}%`,
      background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      ["--cx" as string]: `${(Math.random() - 0.5) * 160}px`,
      ["--cr" as string]: `${(Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 540)}deg`,
      ["--cd" as string]: `${2.2 + Math.random() * 1.6}s`,
      ["--cdel" as string]: `${Math.random() * 0.6}s`,
    })),
  );
  return (
    <div aria-hidden>
      {pieces.map((style, i) => (
        <span key={i} className="play-confetti" style={style} />
      ))}
    </div>
  );
}

const TITLES = {
  win: "Hạ gục boss! 🎉",
  lose: "Boss thắng rồi… 😿",
  time: "Hết giờ! ⏱️",
  finish: "Hoàn thành! 🎊",
  quit: "Đã thoát",
} as const;

export function ResultView({
  result,
  newRecord,
  meta,
  accessory,
  onReplay,
  onPracticeMissed,
  onNextStage,
  onHome,
}: {
  result: RoundResult;
  newRecord: boolean;
  meta: RoundMeta;
  accessory: string;
  onReplay: () => void;
  onPracticeMissed: () => void;
  onNextStage?: () => void;
  onHome: () => void;
}) {
  const rules = gameRules(result.game);
  const answered = result.correct + result.wrong;
  const accuracy = answered ? Math.round((result.correct / answered) * 100) : 0;
  const good = meta.stars >= 2 || result.outcome === "win";
  const levelUp = meta.level.level > meta.levelBefore;
  const party = good || newRecord || levelUp;

  useEffect(() => {
    if (result.koban > 0) {
      const timer = window.setTimeout(() => sfx.coin(), 500);
      return () => window.clearTimeout(timer);
    }
  }, [result.koban]);

  useEffect(() => {
    if (levelUp) {
      const timer = window.setTimeout(() => sfx.combo(), 1200);
      return () => window.clearTimeout(timer);
    }
  }, [levelUp]);

  return (
    <div className="play-zoom mx-auto flex w-full max-w-xl flex-col gap-3 pb-4">
      {party ? <Confetti /> : null}
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#A78BFA] via-[#7C5CFC] to-[#5B3FD6] p-5 text-center text-white">
        <div className="flex justify-center">
          <Neko mood={good ? "happy" : "sad"} accessory={accessory} size={110} />
        </div>
        <p className="mt-1 text-[12px] font-bold tracking-wider text-white/75">
          {rules.emoji} {rules.name.toUpperCase()}
          {meta.stage ? ` · ẢI BÀI ${meta.stage.lesson}` : ""}
        </p>
        <h1 className="text-[26px] font-extrabold">{TITLES[result.outcome]}</h1>
        {result.outcome !== "quit" ? (
          <p className="mt-1 flex justify-center gap-1.5" aria-label={`${meta.stars} trên 3 sao`}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`play-reveal text-[34px] leading-10 ${i < meta.stars ? "" : "opacity-30 grayscale"}`}
                style={{ animationDelay: `${0.25 + i * 0.25}s` }}
              >
                ⭐
              </span>
            ))}
          </p>
        ) : null}
        <p className="mt-1 text-[40px] font-extrabold leading-[48px]">{result.score.toLocaleString("vi-VN")}</p>
        <p className="text-[12px] font-bold text-white/75">điểm</p>
        {newRecord ? (
          <span className="play-reveal mt-2 inline-block rounded-full bg-[#FDE68A] px-3 py-1 text-[12.5px] font-extrabold text-[#92400E]">
            🏆 Kỷ lục mới!
          </span>
        ) : null}
        {result.koban > 0 ? (
          <p className="play-reveal mt-2 text-[15px] font-extrabold" style={{ animationDelay: "0.4s" }}>
            +{result.koban} 🪙 koban
          </p>
        ) : null}
        {meta.xp > 0 ? (
          <div className="mx-auto mt-3 max-w-[280px] text-left">
            <div className="flex items-center justify-between text-[12px] font-extrabold">
              <span>{levelUp ? `🎉 LÊN CẤP ${meta.level.level}!` : `Neko Lv ${meta.level.level}`}</span>
              <span className="text-white/80">+{meta.xp} XP</span>
            </div>
            <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-[#FDE68A] transition-[width] duration-700"
                style={{ width: `${(meta.level.into / meta.level.need) * 100}%` }}
              />
            </div>
          </div>
        ) : null}
      </section>

      {meta.stage?.unlocked && meta.stage.nextLesson != null ? (
        <p className="play-reveal rounded-[22px] bg-[#ECFDF5] px-4 py-3 text-center text-[14px] font-extrabold text-emerald-800">
          🔓 Đã mở khóa ải Bài {meta.stage.nextLesson}!
        </p>
      ) : null}
      {meta.quests.map((quest) => (
        <p key={quest.id} className="play-reveal rounded-[22px] bg-[#FFF7E6] px-4 py-3 text-[13.5px] font-extrabold text-[#92400E]">
          {quest.emoji} Xong nhiệm vụ: {quest.label}. Về sảnh nhận +{quest.reward} 🪙
        </p>
      ))}
      {meta.stage && result.outcome !== "quit" && meta.stars === 0 ? (
        <p className="glass rounded-[22px] px-4 py-3 text-center text-[13px] font-bold text-[#4A4470]">
          Cần ít nhất 1 sao (đúng 40% trở lên) để mở ải tiếp theo. Thử lại nhé!
        </p>
      ) : null}

      <section className="grid grid-cols-4 gap-2">
        {[
          [String(result.correct), "Đúng", "text-emerald-600"],
          [String(result.wrong), "Sai", "text-rose-500"],
          [`${accuracy}%`, "Chính xác", "text-[#7C5CFC]"],
          [`x${result.maxCombo}`, "Combo", "text-[#EA580C]"],
        ].map(([value, label, color]) => (
          <div key={label} className="glass rounded-[20px] px-1 py-2.5 text-center">
            <p className={`text-[18px] font-extrabold ${color}`}>{value}</p>
            <p className="text-[11px] font-bold text-[#7C7A9C]">{label}</p>
          </div>
        ))}
      </section>

      {onNextStage ? (
        <button
          type="button"
          onClick={onNextStage}
          className="flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#F97316] to-[#EC4899] py-3.5 text-[15px] font-extrabold text-white shadow-[0_10px_20px_rgba(236,72,153,0.3)]"
        >
          Ải tiếp theo · Bài {meta.stage?.nextLesson} <ChevronRight size={18} />
        </button>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onReplay}
          className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#A78BFA] to-[#7C5CFC] py-3.5 text-[15px] font-extrabold text-white shadow-[0_10px_20px_rgba(124,92,252,0.3)]"
        >
          <RotateCcw size={17} /> Chơi lại
        </button>
        <button type="button" onClick={onHome} className="glass-strong rounded-full py-3.5 text-[15px] font-extrabold text-[#4A4470]">
          Về sảnh
        </button>
      </div>

      {result.missed.length ? (
        <section className="glass-strong rounded-[28px] p-3.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[15px] font-extrabold text-[#1E1B4B]">Từ cần ôn ({result.missed.length})</p>
            <button
              type="button"
              onClick={onPracticeMissed}
              className="rounded-full bg-[#7C5CFC] px-3 py-1.5 text-[12.5px] font-extrabold text-white"
            >
              Luyện lại từ sai
            </button>
          </div>
          <p className="mt-0.5 text-[11.5px] font-semibold text-[#7C7A9C]">Đã vào Sổ từ sai: chúng sẽ được ưu tiên hỏi lại ở các ván sau.</p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {result.missed.map((word) => (
              <li key={`${word.lesson}-${word.order}-${word.kana}`} className="flex items-center gap-2 rounded-[16px] bg-white/70 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-extrabold text-[#1E1B4B]">
                    {getHeadline(word)}
                    {word.kanji.trim() ? <span className="ml-1.5 text-[12.5px] font-bold text-[#7C7A9C]">{word.kana}</span> : null}
                  </p>
                  <p className="truncate text-[12.5px] font-semibold text-[#4A4470]">{word.meaning}</p>
                </div>
                {word.audioUrl ? (
                  <button
                    type="button"
                    onClick={() => playWordAudio(word)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EFEAFF] text-[#7C5CFC]"
                    aria-label={`Nghe ${getHeadline(word)}`}
                  >
                    <Volume2 size={16} />
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : answered > 0 ? (
        <p className="glass rounded-[22px] px-4 py-3 text-center text-[13.5px] font-bold text-[#4A4470]">Không sai từ nào. 完璧! 🎯</p>
      ) : null}
    </div>
  );
}

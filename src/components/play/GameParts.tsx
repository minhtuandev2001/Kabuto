"use client";

import { Lightbulb, SkipForward, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getHeadline } from "@/lib/catalog";
import { optionLabel, type Question } from "@/lib/play/deck";
import { displayReading, isReadingCorrect, previewKana, readingCandidates } from "@/lib/play/kana";
import type { GameId } from "@/lib/play/progress";
import type { VocabWord } from "@/lib/types";

export type Feedback = {
  correct: boolean;
  picked?: VocabWord;
  typed?: string;
  timeout?: boolean;
};

export function PromptCard({
  question,
  onReplay,
  dark = false,
}: {
  question: Question;
  onReplay: () => void;
  dark?: boolean;
}) {
  const { word, prompt } = question;
  const strong = dark ? "text-white" : "text-[#1E1B4B]";
  const soft = dark ? "text-white/70" : "text-[#7C7A9C]";
  const audioButton = word.audioUrl ? (
    <button
      type="button"
      onClick={onReplay}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-bold ${
        dark ? "bg-white/15 text-white" : "bg-[#EFEAFF] text-[#7C5CFC]"
      }`}
    >
      <Volume2 size={14} /> Nghe
    </button>
  ) : null;

  if (prompt === "listen") {
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <button
          type="button"
          onClick={onReplay}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#A78BFA] to-[#7C5CFC] text-white shadow-[0_10px_20px_rgba(124,92,252,0.35)]"
          aria-label="Nghe lại"
        >
          <Volume2 size={28} />
        </button>
        <p className={`text-[13px] font-bold ${soft}`}>Nghe rồi chọn nghĩa đúng</p>
      </div>
    );
  }
  if (prompt === "meaning") {
    return (
      <div className="text-center">
        <p className={`text-[11px] font-bold tracking-wider ${soft}`}>TỪ NÀO CÓ NGHĨA</p>
        <p className={`mt-1 text-[22px] font-extrabold leading-7 ${strong}`}>{word.meaning}</p>
      </div>
    );
  }
  if (prompt === "type") {
    return (
      <div className="text-center">
        {word.kanji.trim() ? <p className={`text-[34px] font-extrabold leading-10 ${strong}`}>{word.kanji}</p> : null}
        <p className={`mt-1 text-[17px] font-extrabold leading-6 ${strong}`}>{word.meaning}</p>
        <p className={`mt-1 text-[11.5px] font-bold ${soft}`}>Gõ cách đọc bằng romaji hoặc kana</p>
      </div>
    );
  }
  const headline = getHeadline(word);
  return (
    <div className="flex flex-col items-center text-center">
      <p className={`font-extrabold ${strong} ${headline.length > 7 ? "text-[26px] leading-8" : "text-[38px] leading-[46px]"}`}>
        {headline}
      </p>
      {word.kanji.trim() ? <p className={`text-[14px] font-bold ${soft}`}>{word.kana}</p> : null}
      <div className="mt-1.5">{audioButton}</div>
    </div>
  );
}

const PLATES = ["🍣", "🍤", "🍙", "🍥"];

function optionState(option: VocabWord, question: Question, feedback: Feedback | null) {
  if (!feedback) {
    return "idle" as const;
  }
  if (option === question.word) {
    return "answer" as const;
  }
  return feedback.picked === option ? ("wrong" as const) : ("dim" as const);
}

const STATE_CLASS = {
  idle: "",
  answer: "ring-4 ring-emerald-400 bg-emerald-50",
  wrong: "ring-4 ring-rose-400 bg-rose-50",
  dim: "opacity-45",
};

function OptionText({ option, question }: { option: VocabWord; question: Question }) {
  const label = optionLabel(option, question.prompt);
  const showKana = question.prompt === "meaning" && option.kanji.trim();
  return (
    <span className="block min-w-0">
      <span className={`line-clamp-3 block font-extrabold leading-5 ${question.prompt === "meaning" ? "text-[18px] leading-6" : "text-[14px]"}`}>
        {label}
      </span>
      {showKana ? <span className="block truncate text-[11.5px] font-bold opacity-70">{option.kana}</span> : null}
    </span>
  );
}

export function ChoiceAnswers({
  game,
  question,
  feedback,
  onPick,
}: {
  game: GameId;
  question: Question;
  feedback: Feedback | null;
  onPick: (option: VocabWord) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {question.options.map((option, i) => {
        const state = optionState(option, question, feedback);
        const picked = feedback?.picked === option;
        const common = `relative min-h-[84px] w-full text-[#1E1B4B] transition ${STATE_CLASS[state]}`;
        const key = `${question.id}-${i}`;
        if (game === "tanuki") {
          return (
            <button key={key} type="button" disabled={Boolean(feedback)} onClick={() => onPick(option)} className="relative h-[132px] overflow-hidden rounded-[22px] bg-gradient-to-b from-[#BFE8C8] to-[#8FD19E] text-left">
              <span className="absolute inset-x-3 bottom-2 h-6 rounded-[50%] bg-[#3F2D1E]/70" />
              <span className="play-pop-up absolute inset-x-2 bottom-4 flex flex-col items-center" style={{ animationDelay: `${i * 70}ms` }}>
                <span className={`${picked ? "play-whack" : ""} ${common} flex min-h-[64px] items-center justify-center rounded-2xl bg-white/95 px-2 py-1.5 text-center shadow-[0_6px_14px_rgba(0,0,0,0.12)]`}>
                  <OptionText option={option} question={question} />
                </span>
                <span className="-mt-1 text-[34px] leading-none">{picked && !feedback?.correct ? "😝" : picked ? "😵" : "🦝"}</span>
              </span>
              {picked ? <span className="play-hammer absolute right-2 top-1 text-[30px]">🔨</span> : null}
              <span className="absolute left-2 top-1.5 rounded-full bg-white/70 px-1.5 text-[10px] font-extrabold text-[#2F6B3C]">{i + 1}</span>
            </button>
          );
        }
        if (game === "ninja") {
          return (
            <button
              key={key}
              type="button"
              disabled={Boolean(feedback)}
              onClick={() => onPick(option)}
              className={`play-float ${common} overflow-hidden rounded-[20px] border-2 border-[#FBBF24]/70 bg-[#FFF8E7] px-3 py-3 text-left shadow-[0_8px_18px_rgba(0,0,0,0.25)]`}
              style={{ animationDelay: `${i * 0.35}s` }}
            >
              <span className="absolute right-2 top-1.5 text-[10px] font-extrabold text-[#B45309]">{i + 1}</span>
              <OptionText option={option} question={question} />
              {picked && feedback?.correct ? (
                <span className="play-slash pointer-events-none absolute left-[-10%] top-1/2 h-[5px] w-[120%] origin-left rounded-full bg-white shadow-[0_0_14px_#fff]" />
              ) : null}
            </button>
          );
        }
        if (game === "boss") {
          return (
            <button
              key={key}
              type="button"
              disabled={Boolean(feedback)}
              onClick={() => onPick(option)}
              className={`${common} rounded-[20px] border border-white/70 bg-white/85 px-3 py-3 text-left shadow-[0_6px_14px_rgba(91,63,214,0.15)]`}
            >
              <span className="absolute right-2 top-1.5 text-[11px]">⚔️</span>
              <OptionText option={option} question={question} />
            </button>
          );
        }
        return (
          <button
            key={key}
            type="button"
            disabled={Boolean(feedback)}
            onClick={() => onPick(option)}
            className={`${common} flex items-center gap-2 rounded-[999px] border-4 border-white bg-white px-3 py-2.5 text-left shadow-[0_6px_0_#d9cffc,0_10px_18px_rgba(91,63,214,0.15)]`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF1E6] text-[22px]">{PLATES[i % PLATES.length]}</span>
            <OptionText option={option} question={question} />
          </button>
        );
      })}
    </div>
  );
}

export function TypeAnswer({
  question,
  feedback,
  dark = false,
  onSubmit,
  onHintAudio,
}: {
  question: Question;
  feedback: Feedback | null;
  dark?: boolean;
  onSubmit: (typed: string, correct: boolean, hinted: boolean) => void;
  onHintAudio: () => void;
}) {
  const [input, setInput] = useState("");
  const [hint, setHint] = useState(0);
  const [usedAudio, setUsedAudio] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const word = question.word;
  const reading = readingCandidates(word)[0] ?? "";
  const hinted = hint > 0 || usedAudio;
  const preview = previewKana(input);
  const matches = (value: string) =>
    isReadingCorrect(value, word) || question.alternates.some((other) => isReadingCorrect(value, other));

  useEffect(() => {
    setInput("");
    setHint(0);
    setUsedAudio(false);
    inputRef.current?.focus({ preventScroll: true });
  }, [question.id]);

  function change(value: string) {
    if (feedback) {
      return;
    }
    setInput(value);
    if (matches(value)) {
      onSubmit(value, true, hinted);
    }
  }

  function submit() {
    if (feedback || !input.trim()) {
      return;
    }
    onSubmit(input, matches(input), hinted);
  }

  const panel = dark ? "bg-white/10 border-white/20 text-white" : "bg-white/85 border-white text-[#1E1B4B]";
  const soft = dark ? "text-white/70" : "text-[#7C7A9C]";
  const chip = dark ? "bg-white/15 text-white" : "bg-[#EFEAFF] text-[#7C5CFC]";

  return (
    <div className={`rounded-[22px] border p-3 ${panel} ${feedback && !feedback.correct ? "play-shake" : ""}`}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className="flex items-center gap-2"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(event) => change(event.target.value)}
          readOnly={Boolean(feedback)}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="done"
          lang="ja"
          placeholder="vd: sensei / せんせい"
          className={`min-w-0 flex-1 rounded-2xl px-3.5 py-3 text-[18px] font-bold outline-none ring-2 ${
            dark ? "bg-black/20 ring-white/20 placeholder:text-white/40" : "bg-white ring-[#E4DCFF] placeholder:text-[#B9B6D4]"
          } ${feedback ? (feedback.correct ? "ring-emerald-400" : "ring-rose-400") : "focus:ring-[#7C5CFC]"}`}
        />
        <button type="submit" disabled={Boolean(feedback) || !input.trim()} className="rounded-2xl bg-[#7C5CFC] px-4 py-3 text-[14px] font-extrabold text-white disabled:opacity-40">
          OK
        </button>
      </form>
      <div className="mt-2 flex min-h-[26px] items-center justify-between gap-2">
        <p className={`truncate text-[15px] font-bold ${soft}`}>
          {preview ? `→ ${preview}` : hint ? `Gợi ý: ${reading.slice(0, hint)}…` : " "}
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          {word.audioUrl ? (
            <button
              type="button"
              disabled={Boolean(feedback)}
              onClick={() => {
                setUsedAudio(true);
                onHintAudio();
                inputRef.current?.focus({ preventScroll: true });
              }}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-bold ${chip}`}
            >
              <Volume2 size={13} /> Nghe
            </button>
          ) : null}
          <button
            type="button"
            disabled={Boolean(feedback) || hint >= reading.length}
            onClick={() => {
              setHint((n) => Math.min(reading.length, n + 1));
              inputRef.current?.focus({ preventScroll: true });
            }}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-bold disabled:opacity-40 ${chip}`}
          >
            <Lightbulb size={13} /> Gợi ý
          </button>
          <button
            type="button"
            disabled={Boolean(feedback)}
            onClick={() => onSubmit(input, false, hinted)}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-bold ${chip}`}
          >
            <SkipForward size={13} /> Bỏ qua
          </button>
        </div>
      </div>
      {hinted && !feedback ? <p className={`mt-1 text-[11px] font-semibold ${soft}`}>Dùng gợi ý: được nửa điểm, không tăng combo.</p> : null}
    </div>
  );
}

export function AnswerReveal({ word, feedback, dark = false }: { word: VocabWord; feedback: Feedback; dark?: boolean }) {
  const reading = displayReading(word);
  return (
    <div
      className={`flex items-start gap-3 rounded-[20px] px-3.5 py-3 ${
        feedback.correct ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900"
      } ${dark ? "shadow-[0_8px_18px_rgba(0,0,0,0.3)]" : ""}`}
    >
      <span className="text-[22px] leading-7">{feedback.correct ? "⭕" : feedback.timeout ? "⏰" : "❌"}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[17px] font-extrabold leading-6">
          {getHeadline(word)}
          {word.kanji.trim() ? <span className="ml-2 text-[14px] font-bold opacity-75">{reading}</span> : null}
          {word.romaji ? <span className="ml-2 text-[12.5px] font-semibold opacity-60">{word.romaji}</span> : null}
        </p>
        <p className="text-[13.5px] font-semibold leading-5">
          {word.meaning}
          {word.sinoVietnamese ? <span className="opacity-70"> · {word.sinoVietnamese}</span> : null}
        </p>
        {!feedback.correct && feedback.typed?.trim() ? (
          <p className="mt-0.5 text-[12px] font-semibold opacity-70">Bạn gõ: {feedback.typed}</p>
        ) : null}
      </div>
    </div>
  );
}

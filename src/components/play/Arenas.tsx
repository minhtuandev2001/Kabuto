"use client";

import { useEffect, useRef, useState } from "react";
import { shuffle, type Question } from "@/lib/play/deck";
import type { VocabWord } from "@/lib/types";
import { OptionText, STATE_CLASS, optionState, type Feedback } from "./GameParts";

/** Mounted with `key={question.id}`: per-question speed is fixed from the combo at that moment. */
type ArenaProps = {
  question: Question;
  feedback: Feedback | null;
  combo: number;
  onPick: (option: VocabWord) => void;
};

type Hole = { option: number; up: boolean };

const HOLES = 6;
const POP_EVERY_MS = 450;
/** The right tanuki is forced up if it has not shown for this long. */
const ANSWER_DUE_MS = 2_600;

function pickOne<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)]!;
}

/** Whack-a-mole: tanuki pop out of random holes holding a word, then duck; hit the right one while it is up. */
export function WhackField({ question, feedback, combo, onPick }: ArenaProps) {
  const [stayMs] = useState(() => Math.max(900, 1600 - combo * 60));
  const [holes, setHoles] = useState<Hole[]>(() => Array.from({ length: HOLES }, () => ({ option: -1, up: false })));
  const holesRef = useRef(holes);
  const frozenRef = useRef(false);
  frozenRef.current = Boolean(feedback);

  useEffect(() => {
    const answer = question.options.indexOf(question.word);
    const timers: number[] = [];
    let answerAt = Date.now() - ANSWER_DUE_MS / 2;
    const show = (next: Hole[]) => {
      holesRef.current = next;
      setHoles(next);
    };
    const tick = () => {
      const current = holesRef.current;
      const free = current.flatMap((hole, i) => (hole.up ? [] : [i]));
      const shown = new Set(current.filter((hole) => hole.up).map((hole) => hole.option));
      const hidden = question.options.map((_, i) => i).filter((i) => !shown.has(i));
      if (frozenRef.current || !free.length || !hidden.length) {
        return;
      }
      const option = hidden.includes(answer) && Date.now() - answerAt > ANSWER_DUE_MS ? answer : pickOne(hidden);
      if (option === answer) {
        answerAt = Date.now();
      }
      const at = pickOne(free);
      show(current.map((hole, i) => (i === at ? { option, up: true } : hole)));
      timers.push(
        window.setTimeout(() => {
          const now = holesRef.current;
          if (!frozenRef.current && now[at]?.up && now[at]?.option === option) {
            show(now.map((hole, i) => (i === at ? { ...hole, up: false } : hole)));
          }
        }, stayMs),
      );
    };
    tick();
    const loop = window.setInterval(tick, POP_EVERY_MS);
    return () => {
      window.clearInterval(loop);
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [question, stayMs]);

  // After answering, the right tanuki pops up so the player sees where it was.
  useEffect(() => {
    if (!feedback) {
      return;
    }
    const answer = question.options.indexOf(question.word);
    const current = holesRef.current;
    if (current.some((hole) => hole.up && hole.option === answer)) {
      return;
    }
    // More holes than options, so one is always free.
    const at = current.findIndex((hole) => !hole.up);
    const next = current.map((hole, i) => (i === at ? { option: answer, up: true } : hole));
    holesRef.current = next;
    setHoles(next);
  }, [feedback, question]);

  return (
    <div className="grid grid-cols-3 gap-2">
      {holes.map((hole, at) => {
        const word = question.options[hole.option];
        const state = word ? optionState(word, question, feedback) : "idle";
        const picked = Boolean(word) && feedback?.picked === word;
        return (
          <div key={at} className="relative h-[128px] overflow-hidden rounded-[20px] bg-gradient-to-b from-[#BFE8C8] to-[#8FD19E]">
            <span className="absolute inset-x-2 bottom-1.5 h-5 rounded-[50%] bg-[#3F2D1E]/75" />
            <button
              type="button"
              disabled={!hole.up || Boolean(feedback)}
              tabIndex={hole.up ? 0 : -1}
              onClick={() => word && onPick(word)}
              className={`absolute inset-x-1.5 bottom-3 flex flex-col items-center transition-transform duration-150 ease-out ${
                hole.up ? "translate-y-0" : "translate-y-[120%]"
              }`}
            >
              <span
                className={`${picked ? "play-whack" : ""} ${STATE_CLASS[state]} flex min-h-[60px] w-full items-center justify-center rounded-xl bg-white/95 px-1 py-1 text-center text-[#1E1B4B] shadow-[0_6px_14px_rgba(0,0,0,0.12)]`}
              >
                {word ? <OptionText option={word} question={question} compact /> : null}
              </span>
              <span className="-mt-1 text-[30px] leading-none">{picked ? (feedback?.correct ? "😵" : "😝") : "🦝"}</span>
            </button>
            {picked ? <span className="play-hammer pointer-events-none absolute right-1 top-0 text-[26px]">🔨</span> : null}
          </div>
        );
      })}
    </div>
  );
}

const PLATES = ["🍣", "🍤", "🍙", "🍥"];

/** Conveyor sushi: plates carrying the choices roll past in a loop; grab the right one. */
export function SushiBelt({ question, feedback, combo, onPick }: ArenaProps) {
  const [seconds] = useState(() => Math.max(5.5, 9 - combo * 0.35));
  const count = question.options.length;
  // Two copies side by side; the strip slides by exactly one copy, so the loop is seamless.
  const plates = [...question.options, ...question.options];
  return (
    <div className="play-belt overflow-hidden rounded-[24px] py-3 shadow-inner">
      <div className="play-strip flex w-max" style={{ ["--play-dur" as string]: `${seconds}s` }}>
        {plates.map((option, i) => {
          const state = optionState(option, question, feedback);
          return (
            <div key={i} className="pl-3">
              <button
                type="button"
                disabled={Boolean(feedback)}
                tabIndex={i < count ? 0 : -1}
                aria-hidden={i >= count}
                onClick={() => onPick(option)}
                className={`${STATE_CLASS[state]} flex h-[122px] w-[148px] flex-col items-center gap-1 rounded-[24px] border-4 border-white bg-white px-2 pt-1.5 text-center text-[#1E1B4B] shadow-[0_6px_0_#d9cffc]`}
              >
                <span className="text-[26px] leading-8">{PLATES[i % PLATES.length]}</span>
                <OptionText option={option} question={question} compact />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const LANES = [
  { left: "2%", dx: 26 },
  { left: "50%", dx: -26 },
  { left: "12%", dx: 30 },
  { left: "40%", dx: -30 },
];

/** Fruit-ninja style: choices are tossed up and fall back; slash the right one mid-air. */
export function NinjaToss({ question, feedback, combo, onPick }: ArenaProps) {
  const [flight] = useState(() => Math.max(2, 2.9 - combo * 0.06));
  const [lanes] = useState(() => shuffle(LANES));
  return (
    <div className="relative h-[300px] overflow-hidden rounded-[24px] bg-gradient-to-b from-[#2A2363] to-[#16123A]">
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/30 to-transparent" />
      {question.options.map((option, i) => {
        const lane = lanes[i % lanes.length]!;
        const state = optionState(option, question, feedback);
        const picked = feedback?.picked === option;
        const timing = { ["--play-dur" as string]: `${flight}s`, animationDelay: `${(i * flight) / question.options.length}s` };
        return (
          <span
            key={i}
            className="play-toss-x absolute bottom-[-100px] w-[44%] max-w-[180px]"
            style={{ left: lane.left, ["--toss-dx" as string]: `${lane.dx}px`, ...timing }}
          >
            <span className="play-toss-y block" style={timing}>
              <button
                type="button"
                disabled={Boolean(feedback)}
                onClick={() => onPick(option)}
                className={`${STATE_CLASS[state]} relative w-full overflow-hidden rounded-[20px] border-2 border-[#FBBF24]/70 bg-[#FFF8E7] px-3 py-3 text-left text-[#1E1B4B] shadow-[0_8px_18px_rgba(0,0,0,0.35)]`}
              >
                <OptionText option={option} question={question} compact />
                {picked && feedback?.correct ? (
                  <span className="play-slash pointer-events-none absolute left-[-10%] top-1/2 h-[5px] w-[120%] origin-left rounded-full bg-white shadow-[0_0_14px_#fff]" />
                ) : null}
              </button>
            </span>
          </span>
        );
      })}
    </div>
  );
}

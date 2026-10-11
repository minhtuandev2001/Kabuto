"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState, type FocusEvent } from "react";
import {
  BOSSES,
  CRIT_BONUS,
  CRIT_MS,
  NINJA_MISS_PENALTY_S,
  bossRage,
  buildOptions,
  gameRules,
  kobanFor,
  pickPrompt,
  praiseFor,
  questionScore,
  sameMeaningWords,
  shuffle,
  type Question,
  type RoundOutcome,
  type RoundResult,
} from "@/lib/play/deck";
import { wordKey, type AnswerMode, type GameId } from "@/lib/play/progress";
import { buzz, playWordAudio, sfx, stopWordAudio } from "@/lib/play/sfx";
import type { VocabWord } from "@/lib/types";
import { NinjaToss, SushiBelt, WhackField } from "./Arenas";
import { AnswerReveal, ChoiceAnswers, PromptCard, TypeAnswer, type Feedback } from "./GameParts";
import { Neko, type NekoMood } from "./Neko";

type Stats = { score: number; combo: number; maxCombo: number; correct: number; wrong: number; answered: number };

const EMPTY_STATS: Stats = { score: 0, combo: 0, maxCombo: 0, correct: 0, wrong: 0, answered: 0 };

type Props = {
  game: GameId;
  mode: AnswerMode;
  deck: VocabWord[];
  pool: VocabWord[];
  accessory: string;
  onRecord: (word: VocabWord, correct: boolean) => void;
  onFinish: (result: RoundResult) => void;
  onExit: () => void;
};

export function GameScreen({ game, mode, deck, pool, accessory, onRecord, onFinish, onExit }: Props) {
  const rules = gameRules(game);
  const [question, setQuestion] = useState<Question | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [hearts, setHearts] = useState(rules.hearts ?? 0);
  const [bossHp, setBossHp] = useState(deck.length);
  const [timeLeft, setTimeLeft] = useState(rules.roundSec ?? 0);
  const [mood, setMood] = useState<NekoMood>("idle");
  const [moodKey, setMoodKey] = useState(0);
  const [praise, setPraise] = useState<{ id: number; jp: string; vi: string } | null>(null);
  const [hitKey, setHitKey] = useState(0);
  const [boss] = useState(() => BOSSES[Math.floor(Math.random() * BOSSES.length)]!);
  const [typing, setTyping] = useState(false);
  const [questionMs, setQuestionMs] = useState(rules.questionMs?.[mode]);
  const [pop, setPop] = useState<{ id: number; text: string; bad: boolean } | null>(null);
  const [flash, setFlash] = useState(0);
  // Moving targets are the mechanic; players who ask for reduced motion get the static grid instead.
  const [calm] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const questionRef = useRef<Question | null>(null);
  const feedbackRef = useRef<Feedback | null>(null);
  const statsRef = useRef<Stats>(EMPTY_STATS);
  const heartsRef = useRef(rules.hearts ?? 0);
  const queueRef = useRef<VocabWord[]>(deck.slice());
  const cycleRef = useRef<VocabWord[]>([]);
  const retriedRef = useRef(new Set<string>());
  const recordedRef = useRef(new Set<string>());
  const missedRef = useRef(new Map<string, VocabWord>());
  const questionIdRef = useRef(0);
  const questionTimerRef = useRef<number | null>(null);
  const questionEndsRef = useRef(0);
  const questionStartRef = useRef(0);
  const bossHpRef = useRef(deck.length);
  const advanceTimerRef = useRef<number | null>(null);
  const roundEndsRef = useRef(0);
  const endedRef = useRef(false);

  const propsRef = useRef({ onRecord, onFinish });
  propsRef.current = { onRecord, onFinish };

  function clearTimers() {
    if (questionTimerRef.current != null) {
      window.clearTimeout(questionTimerRef.current);
      questionTimerRef.current = null;
    }
    if (advanceTimerRef.current != null) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  }

  function setStatsBoth(next: Stats) {
    statsRef.current = next;
    setStats(next);
  }

  function react(next: NekoMood) {
    setMood(next);
    setMoodKey((n) => n + 1);
  }

  function finish(outcome: RoundOutcome) {
    if (endedRef.current) {
      return;
    }
    endedRef.current = true;
    clearTimers();
    const s = statsRef.current;
    if (outcome === "lose") {
      sfx.lose();
    } else if (outcome !== "quit") {
      sfx.fanfare();
    }
    propsRef.current.onFinish({
      game,
      mode,
      outcome,
      score: s.score,
      correct: s.correct,
      wrong: s.wrong,
      maxCombo: s.maxCombo,
      missed: [...missedRef.current.values()],
      koban: outcome === "quit" ? 0 : kobanFor({ correct: s.correct, maxCombo: s.maxCombo, outcome }),
    });
  }

  function nextWord(): VocabWord | undefined {
    if (rules.endless) {
      if (!cycleRef.current.length) {
        const last = questionRef.current?.word;
        const fresh = shuffle(deck);
        if (fresh.length > 1 && fresh[0] === last) {
          fresh.push(fresh.shift()!);
        }
        cycleRef.current = fresh;
      }
      return cycleRef.current.shift();
    }
    return queueRef.current.shift();
  }

  function ask() {
    if (endedRef.current) {
      return;
    }
    const word = nextWord();
    if (!word) {
      finish(game === "boss" ? "win" : "finish");
      return;
    }
    const prompt = pickPrompt(game, mode, word);
    questionIdRef.current += 1;
    const next: Question = {
      id: questionIdRef.current,
      word,
      prompt,
      options: mode === "choice" ? buildOptions(word, prompt, deck, pool) : [],
      alternates: mode === "type" ? sameMeaningWords(word, pool) : [],
    };
    questionRef.current = next;
    feedbackRef.current = null;
    setQuestion(next);
    setFeedback(null);
    setMood("idle");
    if (prompt === "listen") {
      playWordAudio(word);
    }
    questionStartRef.current = Date.now();
    const base = rules.questionMs?.[mode];
    const limit = base && game === "boss" && bossRage(bossHpRef.current, deck.length) ? Math.round(base * 0.7) : base;
    setQuestionMs(limit);
    if (limit) {
      questionEndsRef.current = Date.now() + limit;
      questionTimerRef.current = window.setTimeout(() => {
        questionTimerRef.current = null;
        engine.current.resolve(false, { timeout: true });
      }, limit);
    }
  }

  function resolve(correct: boolean, detail: { picked?: VocabWord; typed?: string; hinted?: boolean; timeout?: boolean } = {}) {
    const current = questionRef.current;
    if (!current || feedbackRef.current || endedRef.current) {
      return;
    }
    if (questionTimerRef.current != null) {
      window.clearTimeout(questionTimerRef.current);
      questionTimerRef.current = null;
    }
    const word = current.word;
    const key = wordKey(word);
    if (!recordedRef.current.has(key)) {
      recordedRef.current.add(key);
      propsRef.current.onRecord(word, correct && !detail.hinted);
    }
    const s = statsRef.current;
    if (correct) {
      const combo = detail.hinted ? 0 : s.combo + 1;
      const secondsLeft = rules.questionMs ? (questionEndsRef.current - Date.now()) / 1000 : 0;
      const crit = game === "boss" && !detail.hinted && Date.now() - questionStartRef.current < CRIT_MS;
      const gained = questionScore(combo, Boolean(detail.hinted), secondsLeft) + (crit ? CRIT_BONUS : 0);
      setPop({ id: Date.now(), text: crit ? `💥 Chí mạng +${gained}` : `+${gained}`, bad: false });
      setStatsBoth({
        ...s,
        score: s.score + gained,
        combo,
        maxCombo: Math.max(s.maxCombo, combo),
        correct: s.correct + 1,
        answered: s.answered + 1,
      });
      sfx.correct();
      buzz(18);
      react("happy");
      const cheer = praiseFor(combo);
      if (cheer) {
        setPraise({ id: Date.now(), ...cheer });
        sfx.combo();
      }
      if (game === "boss") {
        bossHpRef.current = Math.max(0, bossHpRef.current - 1);
        setBossHp(bossHpRef.current);
        setHitKey((n) => n + 1);
        sfx.hit();
      }
    } else {
      setStatsBoth({ ...s, combo: 0, wrong: s.wrong + 1, answered: s.answered + 1 });
      missedRef.current.set(key, word);
      sfx.wrong();
      buzz([40, 60, 40]);
      react("sad");
      setFlash((n) => n + 1);
      if (game === "ninja") {
        roundEndsRef.current -= NINJA_MISS_PENALTY_S * 1000;
        setPop({ id: Date.now(), text: `-${NINJA_MISS_PENALTY_S} giây`, bad: true });
      } else if (game === "boss" && detail.timeout) {
        setPop({ id: Date.now(), text: "⚡ Boss đánh trúng!", bad: true });
      }
      if (rules.retryUntilCorrect || (rules.retryWrong && !retriedRef.current.has(key))) {
        retriedRef.current.add(key);
        queueRef.current.push(word);
      }
      if (rules.hearts) {
        heartsRef.current -= 1;
        setHearts(heartsRef.current);
      }
    }
    const shown: Feedback = { correct, picked: detail.picked, typed: detail.typed, timeout: detail.timeout };
    feedbackRef.current = shown;
    setFeedback(shown);
    if (current.prompt !== "listen" || !correct) {
      playWordAudio(word);
    }
    const pause = rules.endless ? (correct ? 450 : 1400) : correct ? 900 : mode === "type" ? 2400 : 1900;
    advanceTimerRef.current = window.setTimeout(() => {
      advanceTimerRef.current = null;
      if (rules.hearts && heartsRef.current <= 0) {
        engine.current.finish("lose");
        return;
      }
      engine.current.ask();
    }, pause);
  }

  // Hides the bottom tab bar while a round runs: a stray tap there would drop the round.
  useEffect(() => {
    document.documentElement.dataset.gameFocus = "";
    return () => {
      delete document.documentElement.dataset.gameFocus;
    };
  }, []);

  // With the on-screen keyboard up only about half the phone screen is left: drop the artwork and pin the
  // question to the top so it stays visible next to the input.
  function onAnswerFocus(event: FocusEvent) {
    if (!(event.target instanceof HTMLInputElement) || !window.matchMedia("(pointer: coarse)").matches) {
      return;
    }
    setTyping(true);
    window.setTimeout(() => window.scrollTo({ top: 0 }), 300);
  }

  function onAnswerBlur(event: FocusEvent) {
    if (event.target instanceof HTMLInputElement) {
      setTyping(false);
    }
  }

  const engine = useRef({ ask, resolve, finish });
  engine.current = { ask, resolve, finish };

  // Start fresh on every mount and stop everything on unmount, so leaving mid-round (tab switch) can't keep a
  // ghost round answering words the user never saw; Strict Mode's remount just restarts the same deck.
  useEffect(() => {
    queueRef.current = deck.slice();
    cycleRef.current = [];
    retriedRef.current.clear();
    recordedRef.current.clear();
    missedRef.current.clear();
    bossHpRef.current = deck.length;
    endedRef.current = false;
    if (rules.roundSec) {
      roundEndsRef.current = Date.now() + rules.roundSec * 1000;
    }
    engine.current.ask();
    const tick = rules.roundSec
      ? window.setInterval(() => {
          const left = Math.max(0, Math.ceil((roundEndsRef.current - Date.now()) / 1000));
          setTimeLeft(left);
          if (left <= 0) {
            engine.current.finish("time");
          }
        }, 250)
      : null;
    return () => {
      if (tick != null) {
        window.clearInterval(tick);
      }
      endedRef.current = true;
      if (questionTimerRef.current != null) {
        window.clearTimeout(questionTimerRef.current);
        questionTimerRef.current = null;
      }
      if (advanceTimerRef.current != null) {
        window.clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = null;
      }
      stopWordAudio();
    };
  }, [deck, rules.roundSec]);

  useEffect(() => {
    if (mode !== "choice") {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      const n = Number(event.key);
      const current = questionRef.current;
      if (!current || !Number.isInteger(n) || n < 1 || n > current.options.length) {
        return;
      }
      const option = current.options[n - 1]!;
      engine.current.resolve(option === current.word, { picked: option });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode]);

  function exit() {
    if (statsRef.current.answered > 0 && !endedRef.current) {
      if (!window.confirm("Thoát ván này? Điểm ván sẽ không được tính, nhưng các từ đã trả lời vẫn được lưu vào Sổ từ.")) {
        return;
      }
    }
    endedRef.current = true;
    clearTimers();
    onExit();
  }

  const dark = game === "ninja";
  const limit = questionMs;
  const total = deck.length + retriedRef.current.size;
  const replay = () => playWordAudio(question?.word);
  const fever = stats.combo >= 5;
  const rage = game === "boss" && bossRage(bossHp, deck.length);
  const pick = (option: VocabWord) => question && resolve(option === question.word, { picked: option });
  const arena = { question: question!, feedback, combo: stats.combo, onPick: pick };

  const answers = question ? (
    mode === "choice" && !calm && game === "tanuki" ? (
      <WhackField key={question.id} {...arena} />
    ) : mode === "choice" && !calm && game === "sushi" ? (
      <SushiBelt key={question.id} {...arena} />
    ) : mode === "choice" && !calm && game === "ninja" ? (
      <NinjaToss key={question.id} {...arena} />
    ) : mode === "choice" ? (
      <ChoiceAnswers
        game={game}
        question={question}
        feedback={feedback}
        onPick={pick}
      />
    ) : (
      <TypeAnswer
        question={question}
        feedback={feedback}
        dark={dark}
        onSubmit={(typed, correct, hinted) => resolve(correct, { typed, hinted })}
        onHintAudio={replay}
      />
    )
  ) : null;

  return (
    <div
      className={`play-zoom relative mx-auto flex w-full max-w-xl flex-col gap-3 pb-4 ${feedback ? "play-paused" : ""} ${
        typing ? "play-compact" : ""
      } ${fever ? "play-fever" : ""}`}
    >
      {flash ? <div key={flash} className="play-flash pointer-events-none fixed inset-0 z-30 bg-rose-500/25" /> : null}
      <header className="flex items-center gap-2">
        <button type="button" onClick={exit} className="glass-strong flex h-10 w-10 items-center justify-center rounded-2xl text-[#4A4470]" aria-label="Thoát">
          <X size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-extrabold text-[#1E1B4B]">
            {rules.emoji} {rules.name}
          </p>
          <p className="text-[11.5px] font-bold text-[#7C7A9C]">
            {mode === "type" ? "⌨️ Gõ cách đọc" : "👆 Chọn đáp án"}
            {rules.endless ? "" : ` · Câu ${Math.min(stats.answered + 1, total)}/${total}`}
          </p>
        </div>
        {fever ? (
          <span className="rounded-full bg-gradient-to-r from-[#F97316] to-[#EC4899] px-2.5 py-1 text-[12px] font-extrabold text-white shadow-[0_4px_12px_rgba(236,72,153,0.4)]">
            🔥 FEVER x{1 + Math.floor(stats.combo / 5)}
          </span>
        ) : stats.combo >= 2 ? (
          <span className="rounded-full bg-[#FFF1E6] px-2.5 py-1 text-[12px] font-extrabold text-[#EA580C]">🔥 x{stats.combo}</span>
        ) : null}
        <span className="relative rounded-2xl bg-[#7C5CFC] px-3 py-1.5 text-[14px] font-extrabold text-white">
          {stats.score}
          {pop ? (
            <span
              key={pop.id}
              className={`play-rise pointer-events-none absolute right-full top-1 z-20 mr-2 whitespace-nowrap rounded-full px-2 py-0.5 text-[13px] font-extrabold shadow ${
                pop.bad ? "bg-rose-500 text-white" : "bg-[#FDE68A] text-[#92400E]"
              }`}
            >
              {pop.text}
            </span>
          ) : null}
        </span>
      </header>

      {game === "sushi" ? (
        <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-[#FFF4E6] via-[#FFE9EF] to-[#F3EDFF] p-3.5 shadow-[0_10px_22px_rgba(46,42,92,0.08)]">
          <div className="flex items-center gap-3">
            <div className="play-art">
              <Neko mood={mood} moodKey={moodKey} accessory={accessory || "🍣"} size={84} />
            </div>
            <div className="relative min-w-0 flex-1 rounded-[22px] bg-white/90 px-3 py-3 shadow-sm">
              <span className="play-art absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rotate-45 bg-white/90" />
              {question ? <PromptCard question={question} onReplay={replay} /> : null}
            </div>
          </div>
          {limit && question ? <TimerBar id={question.id} ms={limit} color="bg-[#F97316]" /> : null}
        </section>
      ) : null}

      {game === "tanuki" ? (
        <section className="rounded-[28px] bg-gradient-to-b from-[#E9F9EE] to-[#D2F0DB] p-3.5 shadow-[0_10px_22px_rgba(46,42,92,0.08)]">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1 rounded-[20px] border-4 border-[#C08B5C] bg-[#FFF7EC] px-3 py-3">
              {question ? <PromptCard question={question} onReplay={replay} /> : null}
            </div>
            <div className="play-art">
              <Neko mood={mood} moodKey={moodKey} accessory={accessory || "🔨"} size={70} />
            </div>
          </div>
          {limit && question ? <TimerBar id={question.id} ms={limit} color="bg-[#2F9E55]" /> : null}
        </section>
      ) : null}

      {game === "ninja" ? (
        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-b from-[#1E1B4B] to-[#3B2F7A] p-3.5 text-white shadow-[0_14px_26px_rgba(30,27,75,0.35)]">
          <span className="play-art pointer-events-none absolute right-4 top-3 text-[34px] opacity-90">🌕</span>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-white/10">
              <span className={`text-[22px] font-extrabold leading-6 ${timeLeft <= 10 ? "text-[#FCA5A5]" : ""}`}>{timeLeft}</span>
              <span className="text-[9px] font-bold tracking-wider text-white/60">GIÂY</span>
            </div>
            <div className="min-w-0 flex-1 py-2 pr-10">{question ? <PromptCard question={question} onReplay={replay} dark /> : null}</div>
          </div>
          {/* Driven by state, not a CSS run: a wrong slash takes seconds off. */}
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-[#FBBF24] transition-[width] duration-300 ease-linear"
              style={{ width: `${(timeLeft / (rules.roundSec ?? 60)) * 100}%` }}
            />
          </div>
        </section>
      ) : null}

      {game === "boss" ? (
        <section
          key={feedback && !feedback.correct ? `hurt-${stats.wrong}` : "boss"}
          className={`relative overflow-hidden rounded-[28px] bg-gradient-to-br p-3.5 text-white shadow-[0_14px_26px_rgba(59,7,100,0.35)] ${
            rage ? "from-[#450A0A] via-[#991B1B] to-[#EA580C]" : "from-[#3B0764] via-[#7C2D92] to-[#BE185D]"
          } ${feedback && !feedback.correct ? "play-shake" : ""}`}
        >
          <div className="flex items-center justify-between text-[12px] font-extrabold">
            <span>
              {boss.emoji} {boss.name}
              {rage ? <span className="ml-1.5 rounded-full bg-black/30 px-2 py-0.5 text-[10.5px]">😡 NỔI GIẬN</span> : null}
            </span>
            <span>{"❤️".repeat(Math.max(0, hearts))}{"🖤".repeat(Math.max(0, (rules.hearts ?? 0) - hearts))}</span>
          </div>
          <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-black/30">
            <div className="h-full rounded-full bg-gradient-to-r from-[#F87171] to-[#FBBF24] transition-all duration-500" style={{ width: `${(bossHp / Math.max(1, deck.length)) * 100}%` }} />
          </div>
          <p className="mt-0.5 text-right text-[10.5px] font-bold text-white/70">
            HP {bossHp}/{deck.length}
          </p>
          <div className="play-art relative flex items-end justify-between">
            <Neko mood={mood} moodKey={moodKey} accessory={accessory || "⚔️"} size={64} />
            <div className="play-bob relative">
              <span key={hitKey} className={`inline-block text-[76px] leading-[84px] ${hitKey ? "play-boss-hit" : ""}`}>
                {boss.emoji}
              </span>
              {hitKey && feedback?.correct ? (
                <span key={`dmg-${hitKey}`} className="play-rise pointer-events-none absolute inset-x-0 top-0 text-center text-[22px] font-extrabold text-[#FDE68A]">
                  -1
                </span>
              ) : null}
            </div>
          </div>
          {limit && question ? (
            <div className="mt-1 flex items-center gap-2">
              <span className="shrink-0 text-[10.5px] font-extrabold text-white/80">⚡ Boss tụ lực</span>
              <div className="min-w-0 flex-1">
                <TimerBar id={question.id} ms={limit} color={rage ? "bg-[#FCA5A5]" : "bg-[#FBBF24]"} dark gap="" />
              </div>
            </div>
          ) : null}
          <div className="mt-2 rounded-[20px] bg-white/92 px-3 py-3 text-[#1E1B4B]">
            {question ? <PromptCard question={question} onReplay={replay} /> : null}
          </div>
        </section>
      ) : null}

      <div className={dark && (mode === "type" || calm) ? "rounded-[28px] bg-[#2A2363] p-3" : ""} onFocus={onAnswerFocus} onBlur={onAnswerBlur}>
        {answers}
      </div>

      {question && feedback ? <AnswerReveal word={question.word} feedback={feedback} dark={dark} /> : null}

      {praise ? (
        <div key={praise.id} className="pointer-events-none absolute inset-x-0 top-28 z-20 flex justify-center">
          <div className="play-praise rounded-[24px] bg-white/95 px-5 py-3 text-center shadow-[0_14px_30px_rgba(124,92,252,0.35)]">
            <p className="text-[30px] font-extrabold leading-9 text-[#7C5CFC]">{praise.jp}</p>
            <p className="text-[12.5px] font-bold text-[#7C7A9C]">
              {praise.vi} · Combo {stats.combo}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TimerBar({ id, ms, color, dark = false, gap = "mt-3" }: { id: number; ms: number; color: string; dark?: boolean; gap?: string }) {
  return (
    <div className={`${gap} h-2 overflow-hidden rounded-full ${dark ? "bg-white/15" : "bg-black/10"}`}>
      <div key={id} className={`play-timer h-full rounded-full ${color}`} style={{ ["--play-dur" as string]: `${ms}ms` }} />
    </div>
  );
}

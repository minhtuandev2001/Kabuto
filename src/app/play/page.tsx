"use client";

import "./play.css";
import { useCallback, useMemo, useState } from "react";
import { GachaSheet } from "@/components/play/GachaSheet";
import { GameScreen } from "@/components/play/GameScreen";
import { PlayHub, type LevelInfo } from "@/components/play/PlayHub";
import { ResultView } from "@/components/play/ResultView";
import { usePlayProgress } from "@/components/play/usePlayProgress";
import { useCatalog } from "@/context/CatalogProvider";
import { usePlayer } from "@/context/PlayerProvider";
import { JLPT_LEVELS } from "@/lib/grammar";
import { buildDeck, playableWords, shuffle, type RoundResult } from "@/lib/play/deck";
import {
  GACHA_COST,
  DUPLICATE_REFUND,
  KNOWN_BOX,
  bumpStreak,
  dayNumber,
  isDue,
  outfitEmoji,
  recordAnswer,
  rollOutfit,
  wordKey,
  type AnswerMode,
  type GameId,
  type PlaySetup,
} from "@/lib/play/progress";
import type { VocabWord } from "@/lib/types";

type View =
  | { kind: "hub" }
  | { kind: "game"; game: GameId; mode: AnswerMode; deck: VocabWord[]; run: number }
  | { kind: "result"; result: RoundResult; newRecord: boolean };

function levelRank(level: string) {
  const at = JLPT_LEVELS.indexOf(level as (typeof JLPT_LEVELS)[number]);
  return at < 0 ? JLPT_LEVELS.length : at;
}

export default function PlayPage() {
  const { lessons, allWords, getWordsForLesson, catalogReady } = useCatalog();
  const { isPlaying, isWaiting, togglePlay } = usePlayer();
  const { progress, ready, update } = usePlayProgress();
  const [view, setView] = useState<View>({ kind: "hub" });
  const [gachaOpen, setGachaOpen] = useState(false);
  const today = dayNumber();
  const { setup } = progress;

  const playableLessons = useMemo(
    () => lessons.filter((item) => getWordsForLesson(item.lesson).length > 0),
    [getWordsForLesson, lessons],
  );

  const levelOf = useMemo(() => new Map(lessons.map((item) => [item.lesson, item.jlpt])), [lessons]);

  const levels = useMemo<LevelInfo[]>(() => {
    const map = new Map<string, LevelInfo>();
    for (const item of playableLessons) {
      const info = map.get(item.jlpt) ?? { level: item.jlpt, words: 0, lessons: 0 };
      info.words += getWordsForLesson(item.lesson).length;
      info.lessons += 1;
      map.set(item.jlpt, info);
    }
    return [...map.values()].sort((a, b) => levelRank(a.level) - levelRank(b.level) || a.level.localeCompare(b.level));
  }, [getWordsForLesson, playableLessons]);

  const sourceWords = useMemo(() => {
    if (setup.source === "lesson") {
      const chosen = new Set(setup.lessons);
      return allWords.filter((word) => chosen.has(word.lesson));
    }
    if (setup.source === "level") {
      const chosen = new Set(setup.levels);
      return allWords.filter((word) => chosen.has(levelOf.get(word.lesson) ?? ""));
    }
    return allWords.filter((word) => isDue(progress.words[wordKey(word)], today));
  }, [allWords, levelOf, progress.words, setup.lessons, setup.levels, setup.source, today]);

  const candidates = useMemo(() => playableWords(sourceWords, setup.mode), [setup.mode, sourceWords]);
  const known = candidates.filter((word) => (progress.words[wordKey(word)]?.box ?? 0) >= KNOWN_BOX).length;
  const dueCount = useMemo(
    () => allWords.filter((word) => isDue(progress.words[wordKey(word)], today)).length,
    [allWords, progress.words, today],
  );
  const deckSize = setup.count ? Math.min(setup.count, candidates.length) : candidates.length;
  const accessory = outfitEmoji(progress.equipped);

  const changeSetup = useCallback(
    (patch: Partial<PlaySetup>) => update((current) => ({ ...current, setup: { ...current.setup, ...patch } })),
    [update],
  );

  function start(game: GameId, deck?: VocabWord[]) {
    const words = deck ?? buildDeck(candidates, progress.words, setup.count, dayNumber());
    if (!words.length) {
      return;
    }
    if (isPlaying || isWaiting) {
      togglePlay();
    }
    setView({ kind: "game", game, mode: setup.mode, deck: words, run: Date.now() });
    window.scrollTo({ top: 0 });
  }

  const record = useCallback(
    (word: VocabWord, correct: boolean) =>
      update((current) => {
        const key = wordKey(word);
        return { ...current, words: { ...current.words, [key]: recordAnswer(current.words[key], correct, dayNumber()) } };
      }),
    [update],
  );

  const finishRound = useCallback(
    (result: RoundResult) => {
      const newRecord = result.score > 0 && result.score > (progress.best[result.game] ?? 0);
      update((current) => ({
        ...current,
        koban: current.koban + result.koban,
        best: newRecord ? { ...current.best, [result.game]: result.score } : current.best,
        streak: result.correct > 0 ? bumpStreak(current.streak, dayNumber()) : current.streak,
      }));
      setView({ kind: "result", result, newRecord });
      window.scrollTo({ top: 0 });
    },
    [progress.best, update],
  );

  function rollGacha() {
    if (progress.koban < GACHA_COST) {
      return null;
    }
    const outfit = rollOutfit();
    const duplicate = progress.owned.includes(outfit.id);
    update((current) => ({
      ...current,
      koban: current.koban - GACHA_COST + (duplicate ? DUPLICATE_REFUND : 0),
      owned: duplicate ? current.owned : [...current.owned, outfit.id],
      equipped: duplicate ? current.equipped : outfit.id,
    }));
    return { outfit, duplicate };
  }

  if (!ready || (!catalogReady && !allWords.length)) {
    return <p className="py-10 text-center text-[13px] font-bold text-[#7C7A9C]">Neko đang chuẩn bị…</p>;
  }

  if (view.kind === "game") {
    return (
      <GameScreen
        key={view.run}
        game={view.game}
        mode={view.mode}
        deck={view.deck}
        pool={allWords}
        accessory={accessory}
        onRecord={record}
        onFinish={finishRound}
        onExit={() => setView({ kind: "hub" })}
      />
    );
  }

  if (view.kind === "result") {
    const { result } = view;
    return (
      <ResultView
        result={result}
        newRecord={view.newRecord}
        accessory={accessory}
        onReplay={() => start(result.game)}
        onPracticeMissed={() => start(result.game, shuffle(result.missed))}
        onHome={() => setView({ kind: "hub" })}
      />
    );
  }

  return (
    <>
      <PlayHub
        progress={progress}
        today={today}
        lessons={playableLessons}
        levels={levels}
        wordCount={(lesson) => getWordsForLesson(lesson).length}
        available={candidates.length}
        known={known}
        dueCount={dueCount}
        deckSize={deckSize}
        untypeable={sourceWords.length - candidates.length}
        onSetup={changeSetup}
        onStart={(game) => start(game)}
        onOpenGacha={() => setGachaOpen(true)}
        onToggleMute={() => update((current) => ({ ...current, muted: !current.muted }))}
      />
      {gachaOpen ? (
        <GachaSheet
          progress={progress}
          onRoll={rollGacha}
          onEquip={(id) => update((current) => ({ ...current, equipped: id }))}
          onClose={() => setGachaOpen(false)}
        />
      ) : null}
    </>
  );
}

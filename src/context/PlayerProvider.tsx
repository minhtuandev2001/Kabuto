"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getHeadline, wordImageSrc } from "@/lib/catalog";
import type { LessonInfo, VocabWord } from "@/lib/types";
import { useCatalog } from "./CatalogProvider";
import { useSettings } from "./SettingsProvider";

type PlayerContextValue = {
  lessonId: number;
  index: number;
  lesson: LessonInfo | undefined;
  words: VocabWord[];
  currentWord: VocabWord | undefined;
  isPlaying: boolean;
  isLoading: boolean;
  isWaiting: boolean;
  position: number;
  duration: number;
  loopLesson: boolean;
  playLesson: (lesson: number, wordIndex?: number) => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  toggleLoop: () => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

function shouldPauseBetweenWords(
  gapMs: number,
  listLength: number,
  index: number,
  loopLesson: boolean,
  hidden: boolean,
) {
  if (gapMs <= 0 || hidden) {
    return false;
  }
  return !(index >= listLength - 1 && !loopLesson);
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { wordGapMs } = useSettings();
  const catalog = useCatalog();
  const catalogRef = useRef(catalog);
  catalogRef.current = catalog;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadRef = useRef<HTMLAudioElement | null>(null);
  const shouldPlayRef = useRef(false);
  const lessonIdRef = useRef(1);
  const indexRef = useRef(0);
  const loopRef = useRef(false);
  const gapRef = useRef(wordGapMs);
  const delayTimerRef = useRef<number | null>(null);
  const finishLockRef = useRef(false);
  const hiddenRef = useRef(false);

  const [lessonId, setLessonId] = useState(1);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(1);
  const [loopLesson, setLoopLesson] = useState(false);

  lessonIdRef.current = lessonId;
  indexRef.current = index;
  loopRef.current = loopLesson;
  gapRef.current = wordGapMs;

  const words = useMemo(() => catalog.getWordsForLesson(lessonId), [catalog, lessonId]);
  const currentWord = words[index];
  const lesson = catalog.getLesson(lessonId);

  const clearDelay = useCallback(() => {
    if (delayTimerRef.current != null) {
      window.clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }
    setIsWaiting(false);
  }, []);

  const syncMediaSession = useCallback((word: VocabWord) => {
    if (!("mediaSession" in navigator)) {
      return;
    }
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: getHeadline(word),
        artist: word.meaning,
        album: `Bài ${word.lesson} · Learn Japan`,
        artwork: wordImageSrc(word)
          ? [{ src: wordImageSrc(word), sizes: "512x512", type: "image/png" }]
          : [],
      });
    } catch {
      // Safari may reject artwork.
    }
  }, []);

  const advanceRef = useRef<() => void>(() => undefined);

  const loadWord = useCallback(
    (word: VocabWord | undefined, play: boolean) => {
      finishLockRef.current = true;
      clearDelay();
      setPosition(0);
      setDuration(1);
      const audio = audioRef.current;
      if (!audio) {
        return;
      }
      if (!word?.audioUrl) {
        audio.pause();
        audio.removeAttribute("src");
        setIsPlaying(false);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      audio.pause();
      audio.src = word.audioUrl;
      audio.load();
      syncMediaSession(word);
      const upcoming = catalogRef.current.getUpcomingWord(lessonIdRef.current, indexRef.current, loopRef.current);
      if (upcoming?.audioUrl && upcoming.audioUrl !== word.audioUrl) {
        if (!preloadRef.current) {
          preloadRef.current = new Audio();
        }
        preloadRef.current.src = upcoming.audioUrl;
        preloadRef.current.preload = "auto";
      }
      if (play) {
        shouldPlayRef.current = true;
        const start = audio.play();
        if (start) {
          start
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false));
        }
      } else {
        setIsPlaying(false);
      }
    },
    [clearDelay, syncMediaSession],
  );

  const goToLessonWord = useCallback(
    (nextLesson: number, wordIndex: number) => {
      if (nextLesson === lessonIdRef.current && wordIndex === indexRef.current) {
        loadWord(catalogRef.current.getWordsForLesson(nextLesson)[wordIndex], shouldPlayRef.current);
        return;
      }
      setLessonId(nextLesson);
      setIndex(wordIndex);
    },
    [loadWord],
  );

  advanceRef.current = () => {
    const list = catalogRef.current.getWordsForLesson(lessonIdRef.current);
    const current = indexRef.current;
    if (current < list.length - 1) {
      setIndex(current + 1);
      return;
    }
    if (loopRef.current) {
      setIndex(0);
      return;
    }
    const nextLesson = catalogRef.current.getAdjacentLesson(lessonIdRef.current, 1);
    if (nextLesson != null) {
      goToLessonWord(nextLesson, 0);
      return;
    }
    shouldPlayRef.current = false;
    setIsPlaying(false);
  };

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;

    const onLoaded = () => {
      finishLockRef.current = false;
      setDuration(Math.max(1, audio.duration * 1000 || 1));
      setIsLoading(false);
      if (shouldPlayRef.current) {
        audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    };
    const onTime = () => setPosition(audio.currentTime * 1000);
    const onPlay = () => {
      finishLockRef.current = false;
      setIsPlaying(true);
      setIsLoading(false);
    };
    const onPause = () => {
      if (!delayTimerRef.current) {
        setIsPlaying(false);
      }
    };
    const onEnded = () => {
      if (finishLockRef.current) {
        return;
      }
      finishLockRef.current = true;
      shouldPlayRef.current = true;
      setIsPlaying(false);
      if (
        !shouldPauseBetweenWords(
          gapRef.current,
          catalogRef.current.getWordsForLesson(lessonIdRef.current).length,
          indexRef.current,
          loopRef.current,
          hiddenRef.current,
        )
      ) {
        advanceRef.current();
        return;
      }
      setIsWaiting(true);
      delayTimerRef.current = window.setTimeout(() => {
        delayTimerRef.current = null;
        setIsWaiting(false);
        advanceRef.current();
      }, gapRef.current);
    };

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    loadWord(currentWord, shouldPlayRef.current);
  }, [currentWord, loadWord]);

  useEffect(() => {
    const onVis = () => {
      hiddenRef.current = document.hidden;
      if (document.hidden && delayTimerRef.current != null) {
        clearDelay();
        if (shouldPlayRef.current) {
          advanceRef.current();
        }
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [clearDelay]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) {
      return;
    }
    navigator.mediaSession.setActionHandler("play", () => {
      shouldPlayRef.current = true;
      audioRef.current?.play().catch(() => undefined);
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      shouldPlayRef.current = false;
      clearDelay();
      audioRef.current?.pause();
    });
    navigator.mediaSession.setActionHandler("nexttrack", () => {
      shouldPlayRef.current = true;
      clearDelay();
      advanceRef.current();
    });
    navigator.mediaSession.setActionHandler("previoustrack", () => {
      shouldPlayRef.current = true;
      clearDelay();
      if (indexRef.current > 0) {
        setIndex((value) => value - 1);
      }
    });
    return () => {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("nexttrack", null);
      navigator.mediaSession.setActionHandler("previoustrack", null);
    };
  }, [clearDelay]);

  const playLesson = useCallback(
    (nextLesson: number, wordIndex = 0) => {
      clearDelay();
      shouldPlayRef.current = true;
      if (nextLesson === lessonIdRef.current && wordIndex === indexRef.current) {
        loadWord(catalogRef.current.getWordsForLesson(nextLesson)[wordIndex], true);
        return;
      }
      setLessonId(nextLesson);
      setIndex(wordIndex);
      setIsPlaying(true);
    },
    [clearDelay, loadWord],
  );

  const togglePlay = useCallback(() => {
    if (delayTimerRef.current != null) {
      clearDelay();
      shouldPlayRef.current = false;
      setIsPlaying(false);
      return;
    }
    const audio = audioRef.current;
    if (!audio || !currentWord?.audioUrl) {
      shouldPlayRef.current = true;
      loadWord(currentWord, true);
      return;
    }
    if (!audio.paused) {
      shouldPlayRef.current = false;
      audio.pause();
      setIsPlaying(false);
      return;
    }
    shouldPlayRef.current = true;
    audio.play().then(() => setIsPlaying(true)).catch(() => loadWord(currentWord, true));
  }, [clearDelay, currentWord, loadWord]);

  const next = useCallback(() => {
    clearDelay();
    shouldPlayRef.current = true;
    const list = catalogRef.current.getWordsForLesson(lessonIdRef.current);
    if (indexRef.current < list.length - 1) {
      setIndex((value) => value + 1);
      return;
    }
    if (loopRef.current) {
      setIndex(0);
      return;
    }
    const nextLesson = catalogRef.current.getAdjacentLesson(lessonIdRef.current, 1);
    if (nextLesson != null) {
      goToLessonWord(nextLesson, 0);
    }
  }, [clearDelay, goToLessonWord]);

  const prev = useCallback(() => {
    clearDelay();
    shouldPlayRef.current = true;
    if (indexRef.current > 0) {
      setIndex((value) => value - 1);
      return;
    }
    if (loopRef.current) {
      const list = catalogRef.current.getWordsForLesson(lessonIdRef.current);
      setIndex(Math.max(0, list.length - 1));
      return;
    }
    const prevLesson = catalogRef.current.getAdjacentLesson(lessonIdRef.current, -1);
    if (prevLesson != null) {
      const prevWords = catalogRef.current.getWordsForLesson(prevLesson);
      goToLessonWord(prevLesson, Math.max(0, prevWords.length - 1));
    }
  }, [clearDelay, goToLessonWord]);

  const toggleLoop = useCallback(() => setLoopLesson((value) => !value), []);

  const value = useMemo(
    () => ({
      lessonId,
      index,
      lesson,
      words,
      currentWord,
      isPlaying,
      isLoading,
      isWaiting,
      position,
      duration,
      loopLesson,
      playLesson,
      togglePlay,
      next,
      prev,
      toggleLoop,
    }),
    [
      currentWord,
      duration,
      index,
      isLoading,
      isPlaying,
      isWaiting,
      lesson,
      lessonId,
      loopLesson,
      next,
      playLesson,
      position,
      prev,
      toggleLoop,
      togglePlay,
      words,
    ],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) {
    throw new Error("usePlayer must be used within PlayerProvider");
  }
  return ctx;
}

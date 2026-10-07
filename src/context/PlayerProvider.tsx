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
import { PRELOAD_AUDIO_COUNT, PRELOAD_IMAGE_COUNT, preloadAudio, preloadImages, resolveMediaUrl } from "@/lib/media";
import { clampPlayWordLimit, queuePageCount } from "@/lib/theme";
import type { LessonInfo, VocabWord } from "@/lib/types";
import { useCatalog } from "./CatalogProvider";
import { useSettings } from "./SettingsProvider";

export type PlayMode = "lesson" | "queue";

type PlayerContextValue = {
  mode: PlayMode;
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
  /** Queue mode: 0-based page within the flat vocab list. */
  queuePage: number;
  queuePageCount: number;
  /** Global 1-based number of the current word across all lessons. */
  queueGlobalNumber: number;
  playLesson: (lesson: number, wordIndex?: number, autoplay?: boolean) => void;
  playQueue: (wordIndex?: number, autoplay?: boolean, page?: number) => void;
  setQueuePage: (page: number, autoplay?: boolean) => void;
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

/** Identity of a word that survives renumbering (its `order` changes on reorder). */
function wordKey(word: VocabWord | undefined) {
  return word ? `${word.lesson}|${word.kana}|${word.kanji}|${word.meaning}|${word.audioUrl}` : "";
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { wordGapMs, playWordLimit } = useSettings();
  const catalog = useCatalog();
  const catalogRef = useRef(catalog);
  catalogRef.current = catalog;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const shouldPlayRef = useRef(false);
  const modeRef = useRef<PlayMode>("lesson");
  const lessonIdRef = useRef(1);
  const indexRef = useRef(0);
  const loopRef = useRef(false);
  const gapRef = useRef(wordGapMs);
  const pageSizeRef = useRef(clampPlayWordLimit(playWordLimit));
  const queuePageRef = useRef(0);
  const delayTimerRef = useRef<number | null>(null);
  const finishLockRef = useRef(false);
  const hiddenRef = useRef(false);
  const loadedRef = useRef({ listId: "", index: -1, key: "" });

  const [mode, setMode] = useState<PlayMode>("lesson");
  const [lessonId, setLessonId] = useState(1);
  const [index, setIndex] = useState(0);
  const [queuePage, setQueuePageState] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(1);
  const [loopLesson, setLoopLesson] = useState(false);

  const pageSize = clampPlayWordLimit(playWordLimit);
  const pages = queuePageCount(catalog.allWords.length, pageSize);

  modeRef.current = mode;
  lessonIdRef.current = lessonId;
  indexRef.current = index;
  loopRef.current = loopLesson;
  gapRef.current = wordGapMs;
  queuePageRef.current = queuePage;

  const playlist = useMemo(() => {
    if (mode !== "queue") {
      return catalog.getWordsForLesson(lessonId);
    }
    const start = queuePage * pageSize;
    return catalog.allWords.slice(start, start + pageSize);
  }, [catalog, lessonId, mode, pageSize, queuePage]);
  const currentWord = playlist[index];
  const lesson = catalog.getLesson(currentWord?.lesson ?? lessonId);
  const queueGlobalNumber = mode === "queue" ? queuePage * pageSize + index + 1 : index + 1;
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
      const art = wordImageSrc(word, 256);
      navigator.mediaSession.metadata = new MediaMetadata({
        title: getHeadline(word),
        artist: word.meaning,
        album: `Bài ${word.lesson} · Learn Japan`,
        artwork: art ? [{ src: art, sizes: "256x256", type: "image/webp" }] : [],
      });
    } catch {
      // Safari may reject artwork.
    }
  }, []);

  const currentPlaylist = useCallback(() => {
    const cat = catalogRef.current;
    if (modeRef.current !== "queue") {
      return cat.getWordsForLesson(lessonIdRef.current);
    }
    const size = pageSizeRef.current;
    const start = queuePageRef.current * size;
    return cat.allWords.slice(start, start + size);
  }, []);

  const warmAround = useCallback((list: VocabWord[], wordIndex: number) => {
    const current = list[wordIndex];
    const images: string[] = [];
    if (current) {
      images.push(wordImageSrc(current));
    }
    const previous = list[wordIndex - 1];
    if (previous) {
      images.push(wordImageSrc(previous));
    }
    for (let i = 1; i <= PRELOAD_IMAGE_COUNT; i += 1) {
      const ahead = list[wordIndex + i];
      if (ahead) {
        images.push(wordImageSrc(ahead));
      }
    }
    preloadImages(images);

    const audios: string[] = [];
    if (current?.audioUrl) {
      audios.push(current.audioUrl);
    }
    for (let i = 1; i < PRELOAD_AUDIO_COUNT; i += 1) {
      const ahead = list[wordIndex + i];
      if (ahead?.audioUrl) {
        audios.push(ahead.audioUrl);
      }
    }
    preloadAudio(audios);
  }, []);

  const advanceRef = useRef<() => void>(() => undefined);

  const loadWord = useCallback(
    (word: VocabWord | undefined, play: boolean) => {
      finishLockRef.current = true;
      clearDelay();
      setPosition(0);
      setDuration(1);
      warmAround(currentPlaylist(), indexRef.current);
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
      audio.src = resolveMediaUrl(word.audioUrl);
      audio.load();
      syncMediaSession(word);
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
    [clearDelay, currentPlaylist, syncMediaSession, warmAround],
  );

  const goToIndex = useCallback(
    (wordIndex: number, list: VocabWord[]) => {
      const word = list[wordIndex];
      if (wordIndex === indexRef.current && (modeRef.current === "queue" || word?.lesson === lessonIdRef.current)) {
        loadWord(word, shouldPlayRef.current);
        return;
      }
      warmAround(list, wordIndex);
      if (word) {
        setLessonId(word.lesson);
      }
      setIndex(wordIndex);
    },
    [loadWord, warmAround],
  );

  // Load synchronously instead of waiting for the index effect: with the screen off the page can be
  // suspended before React re-renders, and iOS keeps background audio only if play() runs inside `ended`.
  const startWord = (list: VocabWord[], wordIndex: number) => {
    const word = list[wordIndex];
    indexRef.current = wordIndex;
    if (word) {
      lessonIdRef.current = word.lesson;
      setLessonId(word.lesson);
    }
    loadedRef.current.key = wordKey(word);
    loadWord(word, true);
    setIndex(wordIndex);
  };

  advanceRef.current = () => {
    const list = currentPlaylist();
    const current = indexRef.current;
    if (current < list.length - 1) {
      startWord(list, current + 1);
      return;
    }
    if (loopRef.current) {
      startWord(list, 0);
      return;
    }
    if (modeRef.current === "lesson") {
      const nextLesson = catalogRef.current.getAdjacentLesson(lessonIdRef.current, 1);
      if (nextLesson != null) {
        startWord(catalogRef.current.getWordsForLesson(nextLesson), 0);
        return;
      }
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
      setIsPlaying(false);
      shouldPlayRef.current = true;
      const list = currentPlaylist();
      if (
        !shouldPauseBetweenWords(
          gapRef.current,
          list.length,
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

  const listId = mode === "queue" ? `queue:${queuePage}:${pageSize}` : `lesson:${lessonId}`;
  useEffect(() => {
    const prev = loadedRef.current;
    const key = wordKey(currentWord);
    // Same list edited (reorder/delete) under a fixed index: follow the word that is playing instead of jumping.
    if (listId === prev.listId && index === prev.index && prev.key && key !== prev.key) {
      const at = playlist.findIndex((word) => wordKey(word) === prev.key);
      if (at >= 0) {
        loadedRef.current = { listId, index: at, key: prev.key };
        indexRef.current = at;
        setIndex(at);
        return;
      }
    }
    loadedRef.current = { listId, index, key };
    if (key !== prev.key) {
      loadWord(currentWord, shouldPlayRef.current);
    }
  }, [currentWord, index, listId, loadWord, playlist]);

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
        const list = currentPlaylist();
        const nextIndex = indexRef.current - 1;
        setIndex(nextIndex);
        const word = list[nextIndex];
        if (word) {
          setLessonId(word.lesson);
        }
      }
    });
    return () => {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("nexttrack", null);
      navigator.mediaSession.setActionHandler("previoustrack", null);
    };
  }, [clearDelay, currentPlaylist]);

  const playLesson = useCallback(
    (nextLesson: number, wordIndex = 0, autoplay = true) => {
      clearDelay();
      const sameSpot =
        modeRef.current === "lesson" && nextLesson === lessonIdRef.current && wordIndex === indexRef.current;
      modeRef.current = "lesson";
      setMode("lesson");
      shouldPlayRef.current = autoplay;
      const list = catalogRef.current.getWordsForLesson(nextLesson);
      warmAround(list, wordIndex);
      if (sameSpot) {
        loadWord(list[wordIndex], autoplay);
        return;
      }
      setLessonId(nextLesson);
      setIndex(wordIndex);
      setIsPlaying(autoplay);
    },
    [clearDelay, loadWord, warmAround],
  );

  const playQueue = useCallback(
    (wordIndex = 0, autoplay = true, page = queuePageRef.current) => {
      clearDelay();
      const size = pageSizeRef.current;
      const total = catalogRef.current.allWords.length;
      const maxPage = Math.max(0, queuePageCount(total, size) - 1);
      const safePage = Math.max(0, Math.min(page, maxPage));
      const start = safePage * size;
      const list = catalogRef.current.allWords.slice(start, start + size);
      const safeIndex = Math.max(0, Math.min(wordIndex, Math.max(0, list.length - 1)));
      const sameSpot =
        modeRef.current === "queue" &&
        safePage === queuePageRef.current &&
        safeIndex === indexRef.current;
      modeRef.current = "queue";
      setMode("queue");
      queuePageRef.current = safePage;
      setQueuePageState(safePage);
      shouldPlayRef.current = autoplay;
      warmAround(list, safeIndex);
      const word = list[safeIndex];
      if (sameSpot) {
        loadWord(word, autoplay);
        return;
      }
      if (word) {
        setLessonId(word.lesson);
      }
      setIndex(safeIndex);
      setIsPlaying(autoplay);
    },
    [clearDelay, loadWord, warmAround],
  );

  const setQueuePage = useCallback(
    (page: number, autoplay = false) => {
      playQueue(0, autoplay, page);
    },
    [playQueue],
  );

  // When page size changes, keep the same global word and rebuild the page.
  useEffect(() => {
    const nextSize = clampPlayWordLimit(playWordLimit);
    const prevSize = pageSizeRef.current;
    if (nextSize === prevSize) {
      return;
    }
    if (modeRef.current === "queue") {
      const global = queuePageRef.current * prevSize + indexRef.current;
      const nextPage = Math.floor(global / nextSize);
      const nextIndex = global % nextSize;
      pageSizeRef.current = nextSize;
      playQueue(nextIndex, shouldPlayRef.current, nextPage);
      return;
    }
    pageSizeRef.current = nextSize;
  }, [playQueue, playWordLimit]);

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
    const list = currentPlaylist();
    if (indexRef.current < list.length - 1) {
      const nextIndex = indexRef.current + 1;
      setIndex(nextIndex);
      const word = list[nextIndex];
      if (word) {
        setLessonId(word.lesson);
      }
      return;
    }
    if (loopRef.current) {
      setIndex(0);
      const first = list[0];
      if (first) {
        setLessonId(first.lesson);
      }
      return;
    }
    if (modeRef.current === "lesson") {
      const nextLesson = catalogRef.current.getAdjacentLesson(lessonIdRef.current, 1);
      if (nextLesson != null) {
        goToIndex(0, catalogRef.current.getWordsForLesson(nextLesson));
        setLessonId(nextLesson);
        setIndex(0);
      }
    }
  }, [clearDelay, currentPlaylist, goToIndex]);

  const prev = useCallback(() => {
    clearDelay();
    shouldPlayRef.current = true;
    const list = currentPlaylist();
    if (indexRef.current > 0) {
      const prevIndex = indexRef.current - 1;
      setIndex(prevIndex);
      const word = list[prevIndex];
      if (word) {
        setLessonId(word.lesson);
      }
      return;
    }
    if (loopRef.current) {
      const last = Math.max(0, list.length - 1);
      setIndex(last);
      const word = list[last];
      if (word) {
        setLessonId(word.lesson);
      }
      return;
    }
    if (modeRef.current === "lesson") {
      const prevLesson = catalogRef.current.getAdjacentLesson(lessonIdRef.current, -1);
      if (prevLesson != null) {
        const prevWords = catalogRef.current.getWordsForLesson(prevLesson);
        const last = Math.max(0, prevWords.length - 1);
        goToIndex(last, prevWords);
        setLessonId(prevLesson);
        setIndex(last);
      }
    }
  }, [clearDelay, currentPlaylist, goToIndex]);

  const toggleLoop = useCallback(() => setLoopLesson((value) => !value), []);

  const value = useMemo(
    () => ({
      mode,
      lessonId,
      index,
      lesson,
      words: playlist,
      currentWord,
      isPlaying,
      isLoading,
      isWaiting,
      position,
      duration,
      loopLesson,
      queuePage,
      queuePageCount: pages,
      queueGlobalNumber,
      playLesson,
      playQueue,
      setQueuePage,
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
      mode,
      next,
      pages,
      playLesson,
      playQueue,
      playlist,
      position,
      prev,
      queueGlobalNumber,
      queuePage,
      setQueuePage,
      toggleLoop,
      togglePlay,
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

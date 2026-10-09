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
import { buildTrack, isAudioDecoded, silenceUrl, type TrackSegment } from "@/lib/audio-track";
import { getHeadline, wordImageSrc } from "@/lib/catalog";
import { PRELOAD_IMAGE_COUNT, preloadImages } from "@/lib/media";
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

/** How long a word without playable audio stays on screen before auto-advancing. */
const NO_AUDIO_HOLD_MS = 1500;
/** Words per audio file; every switch to another file is a chance for a locked iPhone to stop playback. */
const MAX_TRACK_WORDS = 160;
/** Rendered first when audio is not cached yet, so playback starts quickly; the full track takes over in a gap. */
const STARTER_WORDS = 5;
/** Prepare the following file once playback gets this close to the end of the current one. */
const PREPARE_NEXT_WORDS = 10;

/** One playlist: a lesson, or a page of the global queue. */
type ListSpec = {
  mode: PlayMode;
  lesson: number;
  page: number;
  listId: string;
  list: VocabWord[];
};

/** A stretch [from, to) of a playlist rendered into one audio file. */
type Track = ListSpec & {
  url: string;
  sig: string;
  gapMs: number;
  from: number;
  to: number;
  segments: TrackSegment[];
  playable: boolean;
};

type NextTrack = {
  promise: Promise<Track | null>;
  track: Track | null;
  /** Playlist index to start from in the next track. */
  startIndex: number;
  /** The full version of a starter track: may replace it mid-playback, during a gap. */
  upgrade: boolean;
};

/** Identity of a word that survives renumbering (its `order` changes on reorder). */
function wordKey(word: VocabWord | undefined) {
  return word ? `${word.lesson}|${word.kana}|${word.kanji}|${word.meaning}|${word.audioUrl}` : "";
}

function listSignature(list: VocabWord[]) {
  return list.map(wordKey).join("\n");
}

/** Browsers report a seek to a word's start a hair earlier, which would otherwise read as the previous word. */
const SEEK_TOLERANCE_S = 0.03;

function segmentIndexAt(track: Track, at: number) {
  const { segments } = track;
  const time = at + SEEK_TOLERANCE_S;
  let low = 0;
  let high = segments.length - 1;
  while (low < high) {
    const mid = (low + high + 1) >> 1;
    if (segments[mid].start <= time) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }
  return low;
}

function covers(track: Track, index: number) {
  return index >= track.from && index < track.to;
}

function offsetOf(track: Track, wordIndex: number) {
  return track.segments[wordIndex - track.from]?.start ?? 0;
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
  const trackRef = useRef<Track | null>(null);
  const nextRef = useRef<NextTrack | null>(null);
  /** Bumped whenever playback is redirected; builds started under an older value are dropped. */
  const genRef = useRef(0);
  /** True while looping silence: a track is being prepared. */
  const holdingRef = useRef(false);
  const pendingSeekRef = useRef<number | null>(null);
  const prepareNextRef = useRef<(track: Track) => void>(() => undefined);

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

  loopRef.current = loopLesson;
  gapRef.current = wordGapMs;

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

  const warmImages = useCallback((list: VocabWord[], wordIndex: number) => {
    const images: string[] = [];
    for (let i = -1; i <= PRELOAD_IMAGE_COUNT; i += 1) {
      const word = list[wordIndex + i];
      if (word) {
        images.push(wordImageSrc(word));
      }
    }
    preloadImages(images);
  }, []);

  const lessonSpec = useCallback((lessonNumber: number): ListSpec => {
    return {
      mode: "lesson",
      lesson: lessonNumber,
      page: 0,
      listId: `lesson:${lessonNumber}`,
      list: catalogRef.current.getWordsForLesson(lessonNumber),
    };
  }, []);

  const queueSpec = useCallback((page: number): ListSpec => {
    const size = pageSizeRef.current;
    return {
      mode: "queue",
      lesson: lessonIdRef.current,
      page,
      listId: `queue:${page}:${size}`,
      list: catalogRef.current.allWords.slice(page * size, page * size + size),
    };
  }, []);

  const currentSpec = useCallback(
    () => (modeRef.current === "queue" ? queueSpec(queuePageRef.current) : lessonSpec(lessonIdRef.current)),
    [lessonSpec, queueSpec],
  );

  const nextLessonWith = useCallback((from: number, step: 1 | -1) => {
    const cat = catalogRef.current;
    let lessonNumber = cat.getAdjacentLesson(from, step);
    while (lessonNumber != null && cat.getWordsForLesson(lessonNumber).length === 0) {
      lessonNumber = cat.getAdjacentLesson(lessonNumber, step);
    }
    return lessonNumber;
  }, []);

  /** Points the UI (and lock screen) at a word. */
  const showWord = useCallback(
    (spec: ListSpec, wordIndex: number, force = false) => {
      const word = spec.list[wordIndex];
      const sameSpot =
        modeRef.current === spec.mode &&
        indexRef.current === wordIndex &&
        (spec.mode === "queue" ? queuePageRef.current === spec.page : lessonIdRef.current === spec.lesson);
      modeRef.current = spec.mode;
      setMode(spec.mode);
      if (spec.mode === "queue") {
        queuePageRef.current = spec.page;
        setQueuePageState(spec.page);
      }
      const lessonNumber = spec.mode === "queue" ? (word?.lesson ?? lessonIdRef.current) : spec.lesson;
      lessonIdRef.current = lessonNumber;
      setLessonId(lessonNumber);
      indexRef.current = wordIndex;
      setIndex(wordIndex);
      if ((force || !sameSpot) && word) {
        syncMediaSession(word);
        warmImages(spec.list, wordIndex);
      }
    },
    [syncMediaSession, warmImages],
  );

  const releaseNext = useCallback(() => {
    const pending = nextRef.current;
    nextRef.current = null;
    if (pending?.track) {
      URL.revokeObjectURL(pending.track.url);
    }
  }, []);

  const dropTrack = useCallback(() => {
    genRef.current += 1;
    releaseNext();
    const track = trackRef.current;
    trackRef.current = null;
    holdingRef.current = false;
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.loop = false;
      audio.removeAttribute("src");
      audio.load();
    }
    if (track) {
      URL.revokeObjectURL(track.url);
    }
    setIsLoading(false);
    setIsWaiting(false);
  }, [releaseNext]);

  const stopPlayback = useCallback(() => {
    shouldPlayRef.current = false;
    setIsPlaying(false);
    setIsWaiting(false);
    setIsLoading(false);
  }, []);

  const startAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.play().catch((error: unknown) => {
      // AbortError only means another source replaced this one.
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        stopPlayback();
      }
    });
  }, [stopPlayback]);

  /** Loops silence until the next track is ready; play() must run now, inside the tap or `ended`, for iOS. */
  const hold = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    holdingRef.current = true;
    setIsLoading(true);
    setIsWaiting(false);
    audio.loop = true;
    audio.src = silenceUrl();
    startAudio();
  }, [startAudio]);

  /** Before metadata loads a seek is ignored, so it waits for `loadedmetadata`. */
  const seekTo = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
      pendingSeekRef.current = null;
      audio.currentTime = time;
    } else {
      pendingSeekRef.current = time;
    }
  }, []);

  const makeTrack = useCallback(
    async (spec: ListSpec, from: number, to: number): Promise<Track | null> => {
      const gen = genRef.current;
      const gapMs = gapRef.current;
      const trailingGap =
        to < spec.list.length || loopRef.current || (spec.mode === "lesson" && nextLessonWith(spec.lesson, 1) != null);
      const built = await buildTrack(spec.list.slice(from, to), {
        gapMs,
        holdMs: NO_AUDIO_HOLD_MS,
        trailingGap,
        cancelled: () => gen !== genRef.current,
      });
      if (!built) {
        return null;
      }
      if (gen !== genRef.current) {
        URL.revokeObjectURL(built.url);
        return null;
      }
      return {
        ...spec,
        url: built.url,
        sig: listSignature(spec.list),
        gapMs,
        from,
        to,
        segments: built.segments,
        playable: built.withAudio === 0 || built.failed < built.withAudio,
      };
    },
    [nextLessonWith],
  );

  const wholeLoop = useCallback(
    (track: Track) => loopRef.current && track.from === 0 && track.to === track.list.length,
    [],
  );

  const matches = useCallback(
    (track: Track, spec: ListSpec) =>
      track.listId === spec.listId &&
      track.gapMs === gapRef.current &&
      track.sig === listSignature(spec.list),
    [],
  );

  const install = useCallback(
    (track: Track, offset: number, next: NextTrack | null) => {
      const audio = audioRef.current;
      if (!audio) {
        return;
      }
      const previous = trackRef.current;
      trackRef.current = track;
      nextRef.current = next;
      holdingRef.current = false;
      pendingSeekRef.current = offset > 0 ? offset : null;
      audio.loop = wholeLoop(track);
      audio.src = track.url;
      if (shouldPlayRef.current) {
        startAudio();
      }
      if (previous && previous !== track) {
        URL.revokeObjectURL(previous.url);
      }
      setIsLoading(false);
      showWord(track, track.from + segmentIndexAt(track, offset));
      if (document.hidden && !next) {
        prepareNextRef.current(track);
      }
    },
    [showWord, startAudio, wholeLoop],
  );

  /** Starts building whatever plays after `track` ends (rest of the page, the loop, or the next lesson). */
  const prepareNext = useCallback(
    (track: Track) => {
      if (nextRef.current || trackRef.current !== track || wholeLoop(track)) {
        return;
      }
      let spec: ListSpec = track;
      let start = track.to;
      if (track.to >= track.list.length) {
        start = 0;
        if (!loopRef.current) {
          const nextLesson = track.mode === "lesson" ? nextLessonWith(track.lesson, 1) : null;
          if (nextLesson == null) {
            return;
          }
          spec = lessonSpec(nextLesson);
        }
      }
      const entry: NextTrack = {
        promise: makeTrack(spec, start, Math.min(spec.list.length, start + MAX_TRACK_WORDS)),
        track: null,
        startIndex: start,
        upgrade: false,
      };
      nextRef.current = entry;
      void entry.promise.then((built) => {
        if (nextRef.current === entry) {
          entry.track = built;
        } else if (built) {
          URL.revokeObjectURL(built.url);
        }
      });
    },
    [lessonSpec, makeTrack, nextLessonWith, wholeLoop],
  );
  prepareNextRef.current = prepareNext;

  /** Moves to a word: a seek when it is already in the loaded file, otherwise a new file is built. */
  const go = useCallback(
    (spec: ListSpec, wordIndex: number, autoplay: boolean) => {
      const audio = audioRef.current;
      const safeIndex = Math.max(0, Math.min(wordIndex, Math.max(0, spec.list.length - 1)));
      showWord(spec, safeIndex, true);
      setPosition(0);
      setDuration(1);
      setIsWaiting(false);
      shouldPlayRef.current = autoplay && spec.list.length > 0;
      setIsPlaying(shouldPlayRef.current);
      if (!audio) {
        return;
      }
      const track = trackRef.current;
      if (track && !holdingRef.current && matches(track, spec) && covers(track, safeIndex)) {
        seekTo(offsetOf(track, safeIndex));
        if (shouldPlayRef.current) {
          startAudio();
        } else {
          audio.pause();
        }
        return;
      }
      dropTrack();
      if (!shouldPlayRef.current) {
        return;
      }
      hold();
      const length = spec.list.length;
      const from = length <= MAX_TRACK_WORDS ? 0 : safeIndex;
      const to = Math.min(length, from + MAX_TRACK_WORDS);
      const quick = to - safeIndex <= STARTER_WORDS || spec.list.slice(from, to).every(isAudioDecoded);
      const starterTo = quick ? to : Math.min(length, safeIndex + STARTER_WORDS);
      void makeTrack(spec, quick ? from : safeIndex, starterTo).then((starter) => {
        if (!starter) {
          return;
        }
        if (!starter.playable) {
          URL.revokeObjectURL(starter.url);
          dropTrack();
          stopPlayback();
          return;
        }
        let upgrade: NextTrack | null = null;
        if (!quick) {
          const entry: NextTrack = { promise: makeTrack(spec, from, to), track: null, startIndex: starterTo, upgrade: true };
          void entry.promise.then((built) => {
            if (nextRef.current === entry) {
              entry.track = built;
            } else if (built) {
              URL.revokeObjectURL(built.url);
            }
          });
          upgrade = entry;
        }
        install(starter, offsetOf(starter, safeIndex), upgrade);
      });
    },
    [dropTrack, hold, install, makeTrack, matches, seekTo, showWord, startAudio, stopPlayback],
  );

  /** Continues into the prepared track when the current file ends. */
  const playNext = useCallback(() => {
    const current = trackRef.current;
    if (current && !nextRef.current) {
      prepareNext(current);
    }
    const pending = nextRef.current;
    if (!pending) {
      stopPlayback();
      return;
    }
    const start = (track: Track | null) => {
      if (nextRef.current !== pending) {
        return;
      }
      nextRef.current = null;
      if (!track?.playable) {
        if (track) {
          URL.revokeObjectURL(track.url);
        }
        dropTrack();
        stopPlayback();
        return;
      }
      install(track, offsetOf(track, pending.startIndex), null);
    };
    if (pending.track) {
      start(pending.track);
      return;
    }
    // Not built yet (slow network): keep the audio session alive with silence meanwhile.
    hold();
    void pending.promise.then(start);
  }, [dropTrack, hold, install, prepareNext, stopPlayback]);

  const pause = useCallback(() => {
    shouldPlayRef.current = false;
    setIsPlaying(false);
    setIsWaiting(false);
    if (holdingRef.current) {
      dropTrack();
      return;
    }
    audioRef.current?.pause();
  }, [dropTrack]);

  const resume = useCallback(() => {
    const audio = audioRef.current;
    const track = trackRef.current;
    const spec = currentSpec();
    if (audio && track && !holdingRef.current && matches(track, spec) && covers(track, indexRef.current)) {
      if (audio.ended) {
        seekTo(offsetOf(track, indexRef.current));
      }
      shouldPlayRef.current = true;
      setIsPlaying(true);
      startAudio();
      return;
    }
    go(spec, indexRef.current, true);
  }, [currentSpec, go, matches, seekTo, startAudio]);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
    if (session) {
      session.type = "playback";
    }

    const onLoaded = () => {
      const seek = pendingSeekRef.current;
      pendingSeekRef.current = null;
      if (seek != null && !holdingRef.current) {
        audio.currentTime = seek;
      }
    };
    const onTime = () => {
      const track = trackRef.current;
      if (!track || holdingRef.current || pendingSeekRef.current != null) {
        return;
      }
      const time = audio.currentTime;
      const at = segmentIndexAt(track, time);
      const segment = track.segments[at];
      const wordIndex = track.from + at;
      if (wordIndex !== indexRef.current) {
        showWord(track, wordIndex);
      }
      const inGap = time >= segment.end;
      setIsWaiting(inGap && !audio.paused);
      setPosition(Math.max(0, Math.min(time, segment.end) - segment.start) * 1000);
      setDuration(Math.max(1, (segment.end - segment.start) * 1000));

      const pending = nextRef.current;
      if (pending?.upgrade && pending.track && inGap && segment.next - time > 0.15 && !audio.paused) {
        const full = pending.track;
        nextRef.current = null;
        install(full, full.segments[wordIndex - full.from].end + (time - segment.end), null);
        return;
      }
      if (!pending && track.to - wordIndex <= PREPARE_NEXT_WORDS) {
        prepareNext(track);
      }
    };
    const onPlay = () => {
      if (shouldPlayRef.current) {
        setIsPlaying(true);
      }
      if ("mediaSession" in navigator) {
        navigator.mediaSession.playbackState = "playing";
      }
    };
    const onPause = () => {
      if ("mediaSession" in navigator && !shouldPlayRef.current) {
        navigator.mediaSession.playbackState = "paused";
      }
      // Events arrive async: when we swap sources, play() has already run again by now.
      if (audio.ended || !audio.paused || holdingRef.current) {
        return;
      }
      // Paused from outside (phone call, Siri, headphones unplugged).
      shouldPlayRef.current = false;
      setIsPlaying(false);
      setIsWaiting(false);
    };
    const onEnded = () => {
      if (holdingRef.current || !trackRef.current) {
        return;
      }
      if (!shouldPlayRef.current) {
        return;
      }
      playNext();
    };
    const onError = () => {
      if (!audio.getAttribute("src") || holdingRef.current) {
        return;
      }
      dropTrack();
      stopPlayback();
    };

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audioRef.current = null;
    };
  }, [dropTrack, install, playNext, prepareNext, showWord, stopPlayback]);

  // Going to the background is the last reliable moment to fetch what plays after this file.
  useEffect(() => {
    const onVis = () => {
      const track = trackRef.current;
      if (document.hidden && track && shouldPlayRef.current) {
        prepareNext(track);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [prepareNext]);

  // The rendered file bakes in the gap and the word list: rebuild it when either changes.
  const listId = mode === "queue" ? `queue:${queuePage}:${pageSize}` : `lesson:${lessonId}`;
  useEffect(() => {
    const track = trackRef.current;
    if (!track || holdingRef.current || track.listId !== listId) {
      return;
    }
    const spec = currentSpec();
    if (matches(track, spec)) {
      return;
    }
    if (!shouldPlayRef.current) {
      dropTrack();
      return;
    }
    const playingKey = wordKey(track.list[indexRef.current]);
    const at = spec.list.findIndex((word) => wordKey(word) === playingKey);
    go(spec, at >= 0 ? at : indexRef.current, true);
  }, [currentSpec, dropTrack, go, listId, matches, playlist, wordGapMs]);

  useEffect(() => {
    const track = trackRef.current;
    const audio = audioRef.current;
    if (!track || !audio || holdingRef.current) {
      return;
    }
    audio.loop = wholeLoop(track);
    if (!nextRef.current?.upgrade) {
      releaseNext();
    }
  }, [loopLesson, releaseNext, wholeLoop]);

  const playLesson = useCallback(
    (nextLesson: number, wordIndex = 0, autoplay = true) => {
      go(lessonSpec(nextLesson), wordIndex, autoplay);
    },
    [go, lessonSpec],
  );

  const playQueue = useCallback(
    (wordIndex = 0, autoplay = true, page = queuePageRef.current) => {
      const total = catalogRef.current.allWords.length;
      const maxPage = Math.max(0, queuePageCount(total, pageSizeRef.current) - 1);
      go(queueSpec(Math.max(0, Math.min(page, maxPage))), wordIndex, autoplay);
    },
    [go, queueSpec],
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
      pageSizeRef.current = nextSize;
      playQueue(global % nextSize, shouldPlayRef.current, Math.floor(global / nextSize));
      return;
    }
    pageSizeRef.current = nextSize;
  }, [playQueue, playWordLimit]);

  const togglePlay = useCallback(() => {
    if (shouldPlayRef.current) {
      pause();
      return;
    }
    resume();
  }, [pause, resume]);

  const next = useCallback(() => {
    const spec = currentSpec();
    const current = indexRef.current;
    if (current < spec.list.length - 1) {
      go(spec, current + 1, true);
      return;
    }
    if (loopRef.current) {
      go(spec, 0, true);
      return;
    }
    if (spec.mode === "lesson") {
      const nextLesson = nextLessonWith(spec.lesson, 1);
      if (nextLesson != null) {
        go(lessonSpec(nextLesson), 0, true);
      }
    }
  }, [currentSpec, go, lessonSpec, nextLessonWith]);

  const prev = useCallback(() => {
    const spec = currentSpec();
    const current = indexRef.current;
    if (current > 0) {
      go(spec, current - 1, true);
      return;
    }
    if (loopRef.current) {
      go(spec, Math.max(0, spec.list.length - 1), true);
      return;
    }
    if (spec.mode === "lesson") {
      const prevLesson = nextLessonWith(spec.lesson, -1);
      if (prevLesson != null) {
        const prevSpec = lessonSpec(prevLesson);
        go(prevSpec, Math.max(0, prevSpec.list.length - 1), true);
      }
    }
  }, [currentSpec, go, lessonSpec, nextLessonWith]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) {
      return;
    }
    navigator.mediaSession.setActionHandler("play", resume);
    navigator.mediaSession.setActionHandler("pause", pause);
    navigator.mediaSession.setActionHandler("nexttrack", next);
    navigator.mediaSession.setActionHandler("previoustrack", prev);
    return () => {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("nexttrack", null);
      navigator.mediaSession.setActionHandler("previoustrack", null);
    };
  }, [next, pause, prev, resume]);

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

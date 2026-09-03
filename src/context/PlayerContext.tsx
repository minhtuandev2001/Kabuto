import {
  createAudioPlayer,
  requestNotificationPermissionsAsync,
  setAudioModeAsync,
  type AudioPlayer,
  type AudioStatus,
} from 'expo-audio';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';
import { getAdjacentLesson, getHeadline, getLesson, getWordsForLesson } from '../data/catalog';
import type { LessonInfo, VocabWord } from '../types';
import { useSettings } from './SettingsContext';

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
  togglePlay: () => Promise<void>;
  next: () => void;
  prev: () => void;
  toggleLoop: () => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

function shouldPauseBetweenWords(gapMs: number, lessonId: number, index: number, loopLesson: boolean) {
  if (gapMs <= 0) {
    return false;
  }
  const list = getWordsForLesson(lessonId);
  const lastInLesson = index >= list.length - 1;
  if (lastInLesson && !loopLesson) {
    return false;
  }
  return true;
}

function syncLockScreen(player: AudioPlayer, word: VocabWord) {
  try {
    player.setActiveForLockScreen(
      true,
      {
        title: getHeadline(word),
        artist: word.meaning,
        albumTitle: `Bài ${word.lesson}`,
      },
      { showSeekForward: false, showSeekBackward: false },
    );
  } catch {
    // Web and some Expo Go builds do not expose lock-screen controls.
  }
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { wordGapMs } = useSettings();
  const playerRef = useRef<AudioPlayer | null>(null);
  const onStatusRef = useRef<(status: AudioStatus) => void>(() => undefined);
  const loadGen = useRef(0);
  const shouldPlayRef = useRef(false);
  const lessonIdRef = useRef(1);
  const indexRef = useRef(0);
  const loopRef = useRef(false);
  const gapRef = useRef(wordGapMs);
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishLockRef = useRef(false);

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

  const words = useMemo(() => getWordsForLesson(lessonId), [lessonId]);
  const currentWord = words[index];
  const lesson = getLesson(lessonId);

  const clearDelay = useCallback(() => {
    if (delayTimerRef.current) {
      clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }
    setIsWaiting(false);
  }, []);

  const advanceRef = useRef<() => void>(() => undefined);

  const loadWord = useCallback(async (word: VocabWord | undefined, play: boolean) => {
    const gen = ++loadGen.current;
    finishLockRef.current = true;
    setPosition(0);
    setDuration(1);
    const player = playerRef.current;
    if (!player) {
      return;
    }
    if (!word?.audioUrl) {
      try {
        player.pause();
      } catch {
        // Player may not have a source yet.
      }
      setIsPlaying(false);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      player.replace({ uri: word.audioUrl });
      player.loop = false;
      syncLockScreen(player, word);
      if (play) {
        player.play();
      } else {
        player.pause();
      }
      if (gen !== loadGen.current) {
        return;
      }
      setIsPlaying(play);
    } catch {
      if (gen === loadGen.current) {
        setIsPlaying(false);
      }
    } finally {
      if (gen === loadGen.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const goToLessonWord = useCallback(
    (nextLesson: number, wordIndex: number) => {
      if (nextLesson === lessonIdRef.current && wordIndex === indexRef.current) {
        void loadWord(getWordsForLesson(nextLesson)[wordIndex], shouldPlayRef.current);
        return;
      }
      setLessonId(nextLesson);
      setIndex(wordIndex);
    },
    [loadWord],
  );

  advanceRef.current = () => {
    const list = getWordsForLesson(lessonIdRef.current);
    const current = indexRef.current;
    if (current < list.length - 1) {
      setIndex(current + 1);
      return;
    }
    if (loopRef.current) {
      if (current === 0) {
        void loadWord(list[0], true);
        return;
      }
      setIndex(0);
      return;
    }
    const nextLesson = getAdjacentLesson(lessonIdRef.current, 1);
    if (nextLesson != null) {
      goToLessonWord(nextLesson, 0);
      return;
    }
    shouldPlayRef.current = false;
    setIsPlaying(false);
  };

  onStatusRef.current = (status: AudioStatus) => {
    if (status.didJustFinish) {
      if (finishLockRef.current) {
        return;
      }
      finishLockRef.current = true;
      shouldPlayRef.current = true;
      if (
        !shouldPauseBetweenWords(
          gapRef.current,
          lessonIdRef.current,
          indexRef.current,
          loopRef.current,
        )
      ) {
        setIsWaiting(false);
        advanceRef.current();
        return;
      }
      setIsWaiting(true);
      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current);
      }
      delayTimerRef.current = setTimeout(() => {
        delayTimerRef.current = null;
        setIsWaiting(false);
        advanceRef.current();
      }, gapRef.current);
      return;
    }
    if (!status.isLoaded) {
      return;
    }
    finishLockRef.current = false;
    setPosition(status.currentTime * 1000);
    setDuration(Math.max(1, (status.duration || 0) * 1000));
    if (!delayTimerRef.current) {
      setIsPlaying(status.playing);
    }
  };

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
      allowsRecording: false,
    }).catch(() => undefined);

    if (Platform.OS === 'android') {
      void requestNotificationPermissionsAsync().catch(() => undefined);
    }

    const player = createAudioPlayer(null, {
      updateInterval: 250,
      keepAudioSessionActive: true,
    });
    player.loop = false;
    playerRef.current = player;
    const sub = player.addListener('playbackStatusUpdate', (status) => {
      onStatusRef.current(status);
    });

    return () => {
      loadGen.current += 1;
      sub.remove();
      try {
        player.clearLockScreenControls();
      } catch {
        // Lock screen APIs are native-only.
      }
      player.remove();
      playerRef.current = null;
    };
  }, []);

  useEffect(() => {
    clearDelay();
    void loadWord(currentWord, shouldPlayRef.current);
  }, [clearDelay, currentWord, loadWord]);

  useEffect(() => {
    return () => {
      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current);
        delayTimerRef.current = null;
      }
    };
  }, []);

  const playLesson = useCallback(
    (nextLesson: number, wordIndex = 0) => {
      clearDelay();
      shouldPlayRef.current = true;
      if (nextLesson === lessonIdRef.current && wordIndex === indexRef.current) {
        void loadWord(getWordsForLesson(nextLesson)[wordIndex], true);
        return;
      }
      setLessonId(nextLesson);
      setIndex(wordIndex);
      setIsPlaying(true);
    },
    [clearDelay, loadWord],
  );

  const togglePlay = useCallback(async () => {
    if (delayTimerRef.current) {
      clearDelay();
      shouldPlayRef.current = false;
      setIsPlaying(false);
      return;
    }
    const player = playerRef.current;
    if (!player || !currentWord?.audioUrl) {
      shouldPlayRef.current = true;
      await loadWord(currentWord, true);
      return;
    }
    if (!player.isLoaded) {
      shouldPlayRef.current = true;
      await loadWord(currentWord, true);
      return;
    }
    if (player.playing) {
      shouldPlayRef.current = false;
      player.pause();
      setIsPlaying(false);
      return;
    }
    shouldPlayRef.current = true;
    player.play();
    setIsPlaying(true);
  }, [clearDelay, currentWord, loadWord]);

  const next = useCallback(() => {
    clearDelay();
    shouldPlayRef.current = true;
    const list = getWordsForLesson(lessonIdRef.current);
    if (indexRef.current < list.length - 1) {
      setIndex((value) => value + 1);
      return;
    }
    if (loopRef.current) {
      setIndex(0);
      return;
    }
    const nextLesson = getAdjacentLesson(lessonIdRef.current, 1);
    if (nextLesson != null) {
      goToLessonWord(nextLesson, 0);
      return;
    }
    setIndex(0);
  }, [clearDelay, goToLessonWord]);

  const prev = useCallback(() => {
    clearDelay();
    shouldPlayRef.current = true;
    if (indexRef.current > 0) {
      setIndex((value) => value - 1);
      return;
    }
    if (loopRef.current) {
      const list = getWordsForLesson(lessonIdRef.current);
      setIndex(Math.max(0, list.length - 1));
      return;
    }
    const prevLesson = getAdjacentLesson(lessonIdRef.current, -1);
    if (prevLesson != null) {
      const prevWords = getWordsForLesson(prevLesson);
      goToLessonWord(prevLesson, Math.max(0, prevWords.length - 1));
      return;
    }
    const list = getWordsForLesson(lessonIdRef.current);
    setIndex(Math.max(0, list.length - 1));
  }, [clearDelay, goToLessonWord]);

  const toggleLoop = useCallback(() => {
    setLoopLesson((value) => !value);
  }, []);

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
    throw new Error('usePlayer must be used within PlayerProvider');
  }
  return ctx;
}

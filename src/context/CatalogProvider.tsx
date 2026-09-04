"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createCatalogIndex, type CatalogIndex } from "@/lib/catalog";
import {
  createLessonApi,
  createWordApi,
  deleteGrammarApi,
  deleteLessonApi,
  deleteWordApi,
  fetchCustomCatalog,
  fetchGrammarLessons,
  saveGrammarApi,
  type GrammarPayload,
} from "@/lib/catalog-client";
import type { GrammarLesson, GrammarPoint } from "@/lib/grammar";
import type { LessonInfo, VocabWord } from "@/lib/types";

type NewLessonInput = {
  title: string;
  book?: string;
  jlpt?: string;
};

type NewWordInput = {
  lesson: number;
  kana: string;
  meaning: string;
  kanji?: string;
  romaji?: string;
  sinoVietnamese?: string;
  audioUrl?: string;
  imageUrl?: string;
};

type CatalogContextValue = CatalogIndex & {
  catalogReady: boolean;
  catalogBusy: boolean;
  customLessons: LessonInfo[];
  customWords: VocabWord[];
  grammarLessons: GrammarLesson[];
  nextLessonNumber: number;
  addLesson: (input: NewLessonInput) => Promise<LessonInfo>;
  addWord: (input: NewWordInput) => Promise<VocabWord>;
  saveGrammar: (input: GrammarPayload, dbId?: number) => Promise<GrammarPoint>;
  removeGrammar: (dbId: number) => Promise<void>;
  removeCustomLesson: (lesson: number) => Promise<void>;
  removeCustomWord: (lesson: number, order: number) => Promise<void>;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);
const CATALOG_CACHE_KEY = "learn-japan.catalog.cache.v5";

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [lessons, setLessons] = useState<LessonInfo[]>([]);
  const [words, setWords] = useState<VocabWord[]>([]);
  const [grammarLessons, setGrammarLessons] = useState<GrammarLesson[]>([]);
  const [catalogReady, setCatalogReady] = useState(false);
  const [busy, setBusy] = useState(0);

  const runBusy = useCallback(async <T,>(job: () => Promise<T>) => {
    setBusy((n) => n + 1);
    try {
      return await job();
    } finally {
      setBusy((n) => Math.max(0, n - 1));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    try {
      const raw = sessionStorage.getItem(CATALOG_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          lessons?: LessonInfo[];
          words?: VocabWord[];
          grammarLessons?: GrammarLesson[];
        };
        if (Array.isArray(parsed.lessons) && Array.isArray(parsed.words) && parsed.words.length) {
          setLessons(parsed.lessons);
          setWords(parsed.words);
          setGrammarLessons(Array.isArray(parsed.grammarLessons) ? parsed.grammarLessons : []);
          setCatalogReady(true);
        }
      }
    } catch {
      // ignore stale cache
    }
    setBusy((n) => n + 1);
    fetchCustomCatalog()
      .then((catalog) => {
        if (!cancelled) {
          setLessons(catalog.lessons);
          setWords(catalog.words);
          setGrammarLessons(catalog.grammarLessons ?? []);
        }
      })
      .catch(() => {
        // keep cache if fetch fails
      })
      .finally(() => {
        if (!cancelled) {
          setBusy((n) => Math.max(0, n - 1));
          setCatalogReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!catalogReady || !words.length) {
      return;
    }
    try {
      sessionStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify({ lessons, words, grammarLessons }));
    } catch {
      // quota
    }
  }, [catalogReady, grammarLessons, lessons, words]);

  const customLessons = useMemo(() => lessons.filter((item) => item.custom), [lessons]);
  const customWords = useMemo(() => words.filter((item) => item.custom), [words]);
  const index = useMemo(() => createCatalogIndex(lessons, words), [lessons, words]);

  const nextLessonNumber = useMemo(() => {
    const max = lessons.reduce((high, item) => Math.max(high, item.lesson), 0);
    return max + 1;
  }, [lessons]);

  const refreshGrammar = useCallback(async () => {
    setGrammarLessons(await fetchGrammarLessons());
  }, []);

  const addLesson = useCallback(
    (input: NewLessonInput) =>
      runBusy(async () => {
        const lesson = await createLessonApi(input);
        setLessons((current) => [...current.filter((item) => item.lesson !== lesson.lesson), lesson]);
        return lesson;
      }),
    [runBusy],
  );

  const addWord = useCallback(
    (input: NewWordInput) =>
      runBusy(async () => {
        const word = await createWordApi(input);
        setWords((current) => [
          ...current.filter((item) => !(item.lesson === word.lesson && item.order === word.order)),
          word,
        ]);
        return word;
      }),
    [runBusy],
  );

  const saveGrammar = useCallback(
    (input: GrammarPayload, dbId?: number) =>
      runBusy(async () => {
        const point = await saveGrammarApi(input, dbId);
        await refreshGrammar();
        return point;
      }),
    [refreshGrammar, runBusy],
  );

  const removeGrammar = useCallback(
    (dbId: number) =>
      runBusy(async () => {
        await deleteGrammarApi(dbId);
        await refreshGrammar();
      }),
    [refreshGrammar, runBusy],
  );

  const removeCustomLesson = useCallback(
    (lesson: number) =>
      runBusy(async () => {
        await deleteLessonApi(lesson);
        setLessons((current) => current.filter((item) => item.lesson !== lesson));
        setWords((current) => current.filter((item) => item.lesson !== lesson));
        setGrammarLessons((current) =>
          current.filter((item) => !(item.custom && (item.catalogLesson === lesson || item.lesson === lesson))),
        );
      }),
    [runBusy],
  );

  const removeCustomWord = useCallback(
    (lesson: number, order: number) =>
      runBusy(async () => {
        await deleteWordApi(lesson, order);
        setWords((current) => current.filter((item) => !(item.custom && item.lesson === lesson && item.order === order)));
      }),
    [runBusy],
  );

  const value = useMemo(
    () => ({
      ...index,
      catalogReady,
      catalogBusy: busy > 0,
      customLessons,
      customWords,
      grammarLessons,
      nextLessonNumber,
      addLesson,
      addWord,
      saveGrammar,
      removeGrammar,
      removeCustomLesson,
      removeCustomWord,
    }),
    [
      addLesson,
      addWord,
      busy,
      catalogReady,
      customLessons,
      customWords,
      grammarLessons,
      index,
      nextLessonNumber,
      removeCustomLesson,
      removeCustomWord,
      removeGrammar,
      saveGrammar,
    ],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) {
    throw new Error("useCatalog must be used within CatalogProvider");
  }
  return ctx;
}

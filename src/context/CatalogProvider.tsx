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
  addGrammarImageApi,
  addLessonImageApi,
  createLessonApi,
  createWordApi,
  deleteGrammarApi,
  deleteGrammarImageApi,
  deleteLessonApi,
  deleteLessonImageApi,
  deleteWordApi,
  fetchCustomCatalog,
  fetchGrammarLessons,
  moveGrammarImageApi,
  moveLessonImageApi,
  saveGrammarApi,
  type GrammarPayload,
} from "@/lib/catalog-client";
import type { GrammarLesson, GrammarPoint } from "@/lib/grammar";
import type { GrammarImage, LessonImage, LessonInfo, VocabWord } from "@/lib/types";

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
  lessonImages: LessonImage[];
  grammarImages: GrammarImage[];
  grammarLessons: GrammarLesson[];
  nextLessonNumber: number;
  getImagesForLesson: (lesson: number) => LessonImage[];
  getGrammarImages: (jlpt: string, lesson: number) => GrammarImage[];
  addLesson: (input: NewLessonInput) => Promise<LessonInfo>;
  addWord: (input: NewWordInput) => Promise<VocabWord>;
  addLessonImage: (lesson: number, imageUrl: string) => Promise<LessonImage>;
  removeLessonImage: (lesson: number, order: number) => Promise<void>;
  moveLessonImage: (lesson: number, order: number, delta: -1 | 1) => Promise<void>;
  addGrammarImage: (jlpt: string, lesson: number, imageUrl: string) => Promise<GrammarImage>;
  removeGrammarImage: (jlpt: string, lesson: number, order: number) => Promise<void>;
  moveGrammarImage: (jlpt: string, lesson: number, order: number, delta: -1 | 1) => Promise<void>;
  saveGrammar: (input: GrammarPayload, dbId?: number) => Promise<GrammarPoint>;
  removeGrammar: (dbId: number) => Promise<void>;
  removeCustomLesson: (lesson: number) => Promise<void>;
  removeCustomWord: (lesson: number, order: number) => Promise<void>;
  reloadCatalog: () => Promise<void>;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);
const CATALOG_CACHE_KEY = "learn-japan.catalog.cache.v8";

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [lessons, setLessons] = useState<LessonInfo[]>([]);
  const [words, setWords] = useState<VocabWord[]>([]);
  const [lessonImages, setLessonImages] = useState<LessonImage[]>([]);
  const [grammarImages, setGrammarImages] = useState<GrammarImage[]>([]);
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
          lessonImages?: LessonImage[];
          grammarImages?: GrammarImage[];
          grammarLessons?: GrammarLesson[];
        };
        if (Array.isArray(parsed.lessons) && Array.isArray(parsed.words) && parsed.words.length) {
          setLessons(parsed.lessons);
          setWords(parsed.words);
          setLessonImages(Array.isArray(parsed.lessonImages) ? parsed.lessonImages : []);
          setGrammarImages(Array.isArray(parsed.grammarImages) ? parsed.grammarImages : []);
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
          setLessonImages(catalog.lessonImages ?? []);
          setGrammarImages(catalog.grammarImages ?? []);
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
      sessionStorage.setItem(
        CATALOG_CACHE_KEY,
        JSON.stringify({ lessons, words, lessonImages, grammarImages, grammarLessons }),
      );
    } catch {
      // quota
    }
  }, [catalogReady, grammarImages, grammarLessons, lessonImages, lessons, words]);

  const customLessons = useMemo(() => lessons.filter((item) => item.custom), [lessons]);
  const customWords = useMemo(() => words.filter((item) => item.custom), [words]);
  const index = useMemo(() => createCatalogIndex(lessons, words), [lessons, words]);
  const imagesByLesson = useMemo(() => {
    const map = new Map<number, LessonImage[]>();
    for (const image of lessonImages) {
      const list = map.get(image.lesson) ?? [];
      list.push(image);
      map.set(image.lesson, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.order - b.order);
    }
    return map;
  }, [lessonImages]);
  const grammarImagesBySlot = useMemo(() => {
    const map = new Map<string, GrammarImage[]>();
    for (const image of grammarImages) {
      const key = `${image.jlpt}:${image.lesson}`;
      const list = map.get(key) ?? [];
      list.push(image);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.order - b.order);
    }
    return map;
  }, [grammarImages]);

  const getImagesForLesson = useCallback(
    (lesson: number) => imagesByLesson.get(lesson) ?? [],
    [imagesByLesson],
  );

  const getGrammarImages = useCallback(
    (jlpt: string, lesson: number) => grammarImagesBySlot.get(`${jlpt}:${lesson}`) ?? [],
    [grammarImagesBySlot],
  );

  const nextLessonNumber = useMemo(() => {
    const max = lessons.reduce((high, item) => Math.max(high, item.lesson), 0);
    return max + 1;
  }, [lessons]);

  const refreshGrammar = useCallback(async () => {
    const data = await fetchGrammarLessons();
    setGrammarLessons(data.lessons);
    setGrammarImages(data.images);
  }, []);

  const reloadCatalog = useCallback(
    () =>
      runBusy(async () => {
        const catalog = await fetchCustomCatalog();
        setLessons(catalog.lessons);
        setWords(catalog.words);
        setLessonImages(catalog.lessonImages ?? []);
        setGrammarImages(catalog.grammarImages ?? []);
        setGrammarLessons(catalog.grammarLessons ?? []);
      }),
    [runBusy],
  );

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

  const addLessonImage = useCallback(
    (lesson: number, imageUrl: string) =>
      runBusy(async () => {
        const image = await addLessonImageApi(lesson, imageUrl);
        setLessonImages((current) => [...current, image]);
        return image;
      }),
    [runBusy],
  );

  const removeLessonImage = useCallback(
    (lesson: number, order: number) =>
      runBusy(async () => {
        await deleteLessonImageApi(lesson, order);
        setLessonImages((current) => {
          const kept = current.filter((item) => item.lesson !== lesson);
          const renumbered = current
            .filter((item) => item.lesson === lesson && item.order !== order)
            .sort((a, b) => a.order - b.order)
            .map((item, i) => ({ ...item, order: i + 1 }));
          return [...kept, ...renumbered];
        });
      }),
    [runBusy],
  );

  const moveLessonImageFn = useCallback(
    (lesson: number, order: number, delta: -1 | 1) =>
      runBusy(async () => {
        const { images } = await moveLessonImageApi(lesson, order, delta);
        setLessonImages((current) => [
          ...current.filter((item) => item.lesson !== lesson),
          ...images,
        ]);
      }),
    [runBusy],
  );

  const addGrammarImageFn = useCallback(
    (jlpt: string, lesson: number, imageUrl: string) =>
      runBusy(async () => {
        const image = await addGrammarImageApi(jlpt, lesson, imageUrl);
        setGrammarImages((current) => [...current, image]);
        return image;
      }),
    [runBusy],
  );

  const removeGrammarImageFn = useCallback(
    (jlpt: string, lesson: number, order: number) =>
      runBusy(async () => {
        await deleteGrammarImageApi(jlpt, lesson, order);
        setGrammarImages((current) => {
          const kept = current.filter((item) => !(item.jlpt === jlpt && item.lesson === lesson));
          const renumbered = current
            .filter((item) => item.jlpt === jlpt && item.lesson === lesson && item.order !== order)
            .sort((a, b) => a.order - b.order)
            .map((item, i) => ({ ...item, order: i + 1 }));
          return [...kept, ...renumbered];
        });
      }),
    [runBusy],
  );

  const moveGrammarImageFn = useCallback(
    (jlpt: string, lesson: number, order: number, delta: -1 | 1) =>
      runBusy(async () => {
        const { images } = await moveGrammarImageApi(jlpt, lesson, order, delta);
        setGrammarImages((current) => [
          ...current.filter((item) => !(item.jlpt === jlpt && item.lesson === lesson)),
          ...images,
        ]);
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
        setLessonImages((current) => current.filter((item) => item.lesson !== lesson));
        setGrammarImages((current) => {
          const removed = grammarLessons.filter(
            (item) => item.custom && (item.catalogLesson === lesson || item.lesson === lesson),
          );
          if (!removed.length) {
            return current;
          }
          return current.filter(
            (image) =>
              !removed.some((item) => item.jlpt === image.jlpt && item.lesson === image.lesson),
          );
        });
        setGrammarLessons((current) =>
          current.filter((item) => !(item.custom && (item.catalogLesson === lesson || item.lesson === lesson))),
        );
      }),
    [grammarLessons, runBusy],
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
      lessonImages,
      grammarImages,
      grammarLessons,
      nextLessonNumber,
      getImagesForLesson,
      getGrammarImages,
      addLesson,
      addWord,
      addLessonImage,
      removeLessonImage,
      moveLessonImage: moveLessonImageFn,
      addGrammarImage: addGrammarImageFn,
      removeGrammarImage: removeGrammarImageFn,
      moveGrammarImage: moveGrammarImageFn,
      saveGrammar,
      removeGrammar,
      removeCustomLesson,
      removeCustomWord,
      reloadCatalog,
    }),
    [
      addGrammarImageFn,
      addLesson,
      addLessonImage,
      addWord,
      busy,
      catalogReady,
      customLessons,
      customWords,
      getGrammarImages,
      getImagesForLesson,
      grammarImages,
      grammarLessons,
      index,
      lessonImages,
      moveGrammarImageFn,
      moveLessonImageFn,
      nextLessonNumber,
      reloadCatalog,
      removeCustomLesson,
      removeCustomWord,
      removeGrammar,
      removeGrammarImageFn,
      removeLessonImage,
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

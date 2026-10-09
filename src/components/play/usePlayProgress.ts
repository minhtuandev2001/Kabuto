"use client";

import { useCallback, useEffect, useState } from "react";
import { EMPTY_PROGRESS, loadProgress, saveProgress, type PlayProgress } from "@/lib/play/progress";
import { setSfxMuted } from "@/lib/play/sfx";

export function usePlayProgress() {
  const [progress, setProgress] = useState<PlayProgress>(EMPTY_PROGRESS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setProgress(loadProgress());
    setReady(true);
  }, []);

  useEffect(() => {
    setSfxMuted(progress.muted);
  }, [progress.muted]);

  const update = useCallback((change: (current: PlayProgress) => PlayProgress) => {
    setProgress((current) => {
      const next = change(current);
      saveProgress(next);
      return next;
    });
  }, []);

  return { progress, ready, update };
}

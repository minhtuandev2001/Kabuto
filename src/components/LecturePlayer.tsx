"use client";

import { FastForward, Maximize2, Pause, Play, Rewind } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { usePlayer } from "@/context/PlayerProvider";
import { lectureThumbUrl, LECTURE_FALLBACK_VIDEO_ID } from "@/lib/catalog";
import { loadYouTubeApi, YT_STATE, type YTPlayer } from "@/lib/youtube";

const SEEK_SECONDS = 10;

function formatTime(totalSeconds: number) {
  const total = Math.max(0, Math.floor(totalSeconds || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function LecturePlayer({ lesson, title }: { lesson: number; title: string }) {
  const reactId = useId();
  const mountId = `yt-${reactId.replace(/:/g, "")}`;
  const wrapRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const draggingRef = useRef(false);
  const { isPlaying: audioPlaying, togglePlay: toggleAudio } = usePlayer();

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  const syncTime = useCallback(() => {
    const player = playerRef.current;
    if (!player || draggingRef.current) {
      return;
    }
    try {
      setCurrent(player.getCurrentTime() || 0);
      setDuration(player.getDuration() || 0);
    } catch {
      /* player not ready */
    }
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) {
      return;
    }

    let cancelled = false;
    const host = document.createElement("div");
    host.id = mountId;
    host.className = "h-full w-full";
    frame.appendChild(host);

    loadYouTubeApi()
      .then(() => {
        if (cancelled || !window.YT?.Player || !document.getElementById(mountId)) {
          return;
        }
        playerRef.current = new window.YT.Player(mountId, {
          width: "100%",
          height: "100%",
          videoId: LECTURE_FALLBACK_VIDEO_ID,
          host: "https://www.youtube-nocookie.com",
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            iv_load_policy: 3,
            cc_load_policy: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: (event) => {
              if (cancelled) {
                return;
              }
              playerRef.current = event.target;
              try {
                const iframe = event.target.getIframe();
                iframe.tabIndex = -1;
                iframe.setAttribute("tabindex", "-1");
                iframe.style.pointerEvents = "none";
                iframe.setAttribute(
                  "allow",
                  "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen",
                );
              } catch {
                /* iframe not attached yet */
              }
              setReady(true);
              setDuration(event.target.getDuration() || 0);
              setCurrent(event.target.getCurrentTime() || 0);
            },
            onStateChange: (event) => {
              if (cancelled) {
                return;
              }
              if (event.data === YT_STATE.PLAYING) {
                setPlaying(true);
                setBuffering(false);
              } else if (event.data === YT_STATE.BUFFERING) {
                setBuffering(true);
              } else if (
                event.data === YT_STATE.PAUSED ||
                event.data === YT_STATE.ENDED ||
                event.data === YT_STATE.CUED
              ) {
                setPlaying(false);
                setBuffering(false);
              }
              syncTime();
            },
          },
        });
      })
      .catch(() => {
        setReady(false);
      });

    return () => {
      cancelled = true;
      setReady(false);
      setPlaying(false);
      try {
        playerRef.current?.destroy();
      } catch {
        /* already gone */
      }
      playerRef.current = null;
      frame.replaceChildren();
    };
  }, [lesson, mountId, syncTime]);

  useEffect(() => {
    if (!playing) {
      return;
    }
    const timer = window.setInterval(syncTime, 250);
    return () => window.clearInterval(timer);
  }, [playing, syncTime]);

  const pauseVocabIfNeeded = useCallback(() => {
    if (audioPlaying) {
      toggleAudio();
    }
  }, [audioPlaying, toggleAudio]);

  const togglePlay = useCallback(() => {
    const player = playerRef.current;
    if (!player) {
      return;
    }
    if (playing) {
      player.pauseVideo();
      return;
    }
    pauseVocabIfNeeded();
    player.playVideo();
  }, [pauseVocabIfNeeded, playing]);

  const seekBy = useCallback((delta: number) => {
    const player = playerRef.current;
    if (!player) {
      return;
    }
    const next = Math.min(Math.max(0, (player.getCurrentTime() || 0) + delta), player.getDuration() || 0);
    player.seekTo(next, true);
    setCurrent(next);
  }, []);

  const seekTo = useCallback((seconds: number) => {
    const player = playerRef.current;
    if (!player) {
      return;
    }
    const next = Math.min(Math.max(0, seconds), player.getDuration() || 0);
    player.seekTo(next, true);
    setCurrent(next);
  }, []);

  const enterFullscreen = useCallback(() => {
    const node = wrapRef.current;
    if (!node) {
      return;
    }
    const request =
      node.requestFullscreen?.bind(node) ??
      (node as HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen?.bind(node);
    void request?.();
  }, []);

  const progress = duration > 0 ? Math.min(1, current / duration) : 0;

  return (
    <div className="glass-strong overflow-hidden rounded-[28px]">
      <div ref={wrapRef} className="lecture-wrap relative aspect-video w-full overflow-hidden bg-[#1E1B4B]">
        <div ref={frameRef} className="lecture-frame absolute inset-0" />
        <button
          type="button"
          onClick={togglePlay}
          disabled={!ready}
          aria-label={playing ? "Tạm dừng" : "Phát"}
          className="lecture-shield disabled:opacity-100"
        >
          {!playing ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={lectureThumbUrl("hq720")}
              alt=""
              className="h-full w-full object-cover"
              onError={(event) => {
                event.currentTarget.src = lectureThumbUrl("hq");
              }}
            />
          ) : null}
        </button>

        {!playing ? (
          <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-black/15">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#7C5CFC] shadow-[0_10px_24px_rgba(30,27,75,0.28)]">
              {buffering ? (
                <span className="text-lg font-extrabold">···</span>
              ) : (
                <Play size={28} className="ml-0.5" fill="currentColor" />
              )}
            </span>
          </div>
        ) : null}

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            enterFullscreen();
          }}
          disabled={!ready}
          className="absolute right-2.5 top-2.5 z-40 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm disabled:opacity-40"
          aria-label={`Toàn màn hình ${title}`}
        >
          <Maximize2 size={15} />
        </button>
      </div>

      <div className="px-4 pb-3.5 pt-3.5">
        <div className="relative h-1.5 overflow-visible rounded-full bg-[rgba(30,27,75,0.1)]">
          <div className="relative h-full rounded-full bg-[#7C5CFC]" style={{ width: `${progress * 100}%` }}>
            <span className="absolute -right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-[3px] border-[#7C5CFC] bg-white" />
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(duration, 0.1)}
            step={0.1}
            value={current}
            disabled={!ready}
            aria-label="Tua video"
            className="absolute -inset-y-3 inset-x-0 h-8 w-full cursor-pointer opacity-0"
            onPointerDown={() => {
              draggingRef.current = true;
            }}
            onPointerUp={() => {
              draggingRef.current = false;
            }}
            onPointerCancel={() => {
              draggingRef.current = false;
            }}
            onChange={(event) => {
              const next = Number(event.target.value);
              setCurrent(next);
              seekTo(next);
            }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-[#7C7A9C]">
          <span>{formatTime(current)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        <div className="mt-1 flex items-center justify-center gap-8">
          <button
            type="button"
            onClick={() => seekBy(-SEEK_SECONDS)}
            disabled={!ready}
            className="flex h-12 w-12 flex-col items-center justify-center disabled:opacity-40"
            aria-label={`Tua lại ${SEEK_SECONDS} giây`}
          >
            <Rewind size={22} className="text-[#1E1B4B]" />
            <span className="text-[9px] font-extrabold text-[#7C5CFC]">{SEEK_SECONDS}s</span>
          </button>

          <button
            type="button"
            onClick={togglePlay}
            disabled={!ready}
            className="flex h-[62px] w-[62px] items-center justify-center rounded-full bg-gradient-to-br from-[#A78BFA] to-[#7C5CFC] text-white shadow-[0_10px_20px_rgba(124,92,252,0.35)] disabled:opacity-40"
            aria-label={playing ? "Tạm dừng" : "Phát"}
          >
            {buffering && !playing ? (
              <span className="text-lg font-extrabold">···</span>
            ) : playing ? (
              <Pause size={28} fill="currentColor" />
            ) : (
              <Play size={28} className="ml-0.5" fill="currentColor" />
            )}
          </button>

          <button
            type="button"
            onClick={() => seekBy(SEEK_SECONDS)}
            disabled={!ready}
            className="flex h-12 w-12 flex-col items-center justify-center disabled:opacity-40"
            aria-label={`Tua tới ${SEEK_SECONDS} giây`}
          >
            <FastForward size={22} className="text-[#1E1B4B]" />
            <span className="text-[9px] font-extrabold text-[#7C5CFC]">{SEEK_SECONDS}s</span>
          </button>
        </div>
      </div>
    </div>
  );
}

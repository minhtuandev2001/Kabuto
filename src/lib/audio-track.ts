import { resolveMediaUrl } from "./media";
import type { VocabWord } from "./types";

export const TRACK_SAMPLE_RATE = 22050;
const FETCH_CONCURRENCY = 6;
const DECODED_CACHE_LIMIT = 400;

/** Seconds within a track: the word sounds in [start, end), then the gap runs until `next`. */
export type TrackSegment = { start: number; end: number; next: number };

export type BuiltTrack = {
  url: string;
  segments: TrackSegment[];
  /** Words that have an audio URL but could not be fetched or decoded. */
  failed: number;
  withAudio: number;
};

type BuildOptions = {
  gapMs: number;
  /** How long a word without playable audio stays on screen. */
  holdMs: number;
  /** Keep the gap after the last word (more words follow in another track). */
  trailingGap: boolean;
  cancelled: () => boolean;
};

const decoded = new Map<string, Promise<Int16Array | null>>();
const ready = new Set<string>();

/** Cross-origin audio goes through our proxy: decoding needs the bytes, and not every host sends CORS headers. */
export function audioFetchUrl(url: string) {
  const resolved = resolveMediaUrl(url);
  if (!/^https?:\/\//i.test(resolved)) {
    return resolved;
  }
  try {
    if (new URL(resolved).origin === window.location.origin) {
      return resolved;
    }
  } catch {
    return resolved;
  }
  return `/api/audio?url=${encodeURIComponent(resolved)}`;
}

export function isAudioDecoded(word: VocabWord) {
  return !word.audioUrl || ready.has(audioFetchUrl(word.audioUrl));
}

let decoder: BaseAudioContext | null = null;

function getDecoder() {
  if (!decoder) {
    const Ctor =
      window.OfflineAudioContext ??
      (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext }).webkitOfflineAudioContext;
    if (!Ctor) {
      throw new Error("Web Audio is not supported");
    }
    decoder = new Ctor(1, 1, TRACK_SAMPLE_RATE);
  }
  return decoder;
}

function decode(data: ArrayBuffer) {
  const ctx = getDecoder();
  return new Promise<AudioBuffer>((resolve, reject) => {
    // Older Safari only supports the callback form and returns undefined.
    const result = ctx.decodeAudioData(data, resolve, reject) as Promise<AudioBuffer> | undefined;
    result?.then(resolve, reject);
  });
}

/** Mono 16-bit PCM at TRACK_SAMPLE_RATE (resampled here in case the decoder kept the source rate). */
function toPcm(buffer: AudioBuffer) {
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, i) => buffer.getChannelData(i));
  const ratio = buffer.sampleRate / TRACK_SAMPLE_RATE;
  const sourceLength = buffer.length;
  const length = Math.max(1, Math.round(sourceLength / ratio));
  const out = new Int16Array(length);
  for (let i = 0; i < length; i += 1) {
    const pos = i * ratio;
    const a = Math.min(sourceLength - 1, Math.floor(pos));
    const b = Math.min(sourceLength - 1, a + 1);
    const frac = pos - a;
    let sum = 0;
    for (const data of channels) {
      sum += data[a] + (data[b] - data[a]) * frac;
    }
    const value = Math.max(-1, Math.min(1, sum / channels.length));
    out[i] = value < 0 ? value * 0x8000 : value * 0x7fff;
  }
  return out;
}

function loadPcm(url: string) {
  const key = audioFetchUrl(url);
  const cached = decoded.get(key);
  if (cached) {
    decoded.delete(key);
    decoded.set(key, cached);
    return cached;
  }
  const attempt = async () => {
    const response = await fetch(key);
    if (!response.ok) {
      throw new Error(`Audio ${response.status}`);
    }
    return toPcm(await decode(await response.arrayBuffer()));
  };
  const pending = attempt()
    .catch(() => attempt())
    .then((pcm) => {
      ready.add(key);
      return pcm;
    })
    .catch(() => {
      decoded.delete(key);
      return null;
    });
  decoded.set(key, pending);
  while (decoded.size > DECODED_CACHE_LIMIT) {
    const oldest = decoded.keys().next().value as string;
    decoded.delete(oldest);
    ready.delete(oldest);
  }
  return pending;
}

function encodeWav(samples: number, fill: (pcm: Int16Array) => void) {
  const buffer = new ArrayBuffer(44 + samples * 2);
  const view = new DataView(buffer);
  const text = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };
  text(0, "RIFF");
  view.setUint32(4, 36 + samples * 2, true);
  text(8, "WAVE");
  text(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, TRACK_SAMPLE_RATE, true);
  view.setUint32(28, TRACK_SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, "data");
  view.setUint32(40, samples * 2, true);
  fill(new Int16Array(buffer, 44, samples));
  return URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
}

let silence = "";

/** One second of silence, looped while a track is being prepared so the audio session stays active. */
export function silenceUrl() {
  if (!silence) {
    silence = encodeWav(TRACK_SAMPLE_RATE, () => undefined);
  }
  return silence;
}

/**
 * Renders the words and the gaps between them into a single WAV. iOS keeps a locked phone playing one
 * file, but often refuses to start the next file on its own, so per-word files stop after the first word.
 */
export async function buildTrack(words: VocabWord[], options: BuildOptions): Promise<BuiltTrack | null> {
  const pcms: (Int16Array | null)[] = new Array(words.length).fill(null);
  let cursor = 0;
  const worker = async () => {
    while (cursor < words.length && !options.cancelled()) {
      const i = cursor;
      cursor += 1;
      const url = words[i].audioUrl;
      if (url) {
        pcms[i] = await loadPcm(url);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(FETCH_CONCURRENCY, words.length) }, worker));
  if (options.cancelled()) {
    return null;
  }

  const rate = TRACK_SAMPLE_RATE;
  const gap = Math.round((Math.max(0, options.gapMs) / 1000) * rate);
  const hold = Math.round((Math.max(options.gapMs, options.holdMs) / 1000) * rate);
  const segments: TrackSegment[] = [];
  let total = 0;
  words.forEach((_, i) => {
    const pcm = pcms[i];
    const start = total;
    const end = start + (pcm?.length ?? 0);
    const last = i === words.length - 1;
    const pause = pcm ? (last && !options.trailingGap ? 0 : gap) : hold;
    total = end + pause;
    segments.push({ start: start / rate, end: end / rate, next: total / rate });
  });

  const url = encodeWav(Math.max(1, total), (out) => {
    words.forEach((_, i) => {
      const pcm = pcms[i];
      if (pcm) {
        out.set(pcm, Math.round(segments[i].start * rate));
      }
    });
  });
  const withAudio = words.filter((word) => word.audioUrl).length;
  const failed = words.filter((word, i) => word.audioUrl && !pcms[i]).length;
  return { url, segments, failed, withAudio };
}

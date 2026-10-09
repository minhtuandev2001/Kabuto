import { resolveMediaUrl } from "@/lib/media";
import type { VocabWord } from "@/lib/types";

let ctx: AudioContext | null = null;
let muted = false;

export function setSfxMuted(value: boolean) {
  muted = value;
}

function audioContext() {
  if (typeof window === "undefined" || muted) {
    return null;
  }
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) {
      return null;
    }
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
  return ctx;
}

function tone(freq: number, at: number, duration: number, type: OscillatorType = "sine", volume = 0.16) {
  const ac = audioContext();
  if (!ac) {
    return;
  }
  const start = ac.currentTime + at;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** Game-show style cues: ピンポン for right, ブブー for wrong. */
export const sfx = {
  correct() {
    tone(1318.5, 0, 0.14);
    tone(1046.5, 0.13, 0.26);
  },
  wrong() {
    tone(165, 0, 0.2, "square", 0.08);
    tone(165, 0.24, 0.32, "square", 0.08);
  },
  combo() {
    [784, 988, 1175, 1568].forEach((freq, i) => tone(freq, i * 0.07, 0.16, "triangle", 0.12));
  },
  coin() {
    tone(1568, 0, 0.08, "square", 0.06);
    tone(2093, 0.07, 0.22, "square", 0.06);
  },
  hit() {
    tone(110, 0, 0.12, "sawtooth", 0.1);
  },
  fanfare() {
    [523, 659, 784, 1047, 784, 1047].forEach((freq, i) => tone(freq, i * 0.11, 0.22, "triangle", 0.13));
  },
  lose() {
    [392, 330, 262, 196].forEach((freq, i) => tone(freq, i * 0.16, 0.3, "triangle", 0.12));
  },
  gacha() {
    [523, 587, 659, 698, 784, 880, 988, 1047].forEach((freq, i) => tone(freq, i * 0.06, 0.1, "square", 0.05));
  },
};

/** Android only; iOS Safari ignores navigator.vibrate. */
export function buzz(pattern: number | number[]) {
  if (muted || typeof navigator === "undefined" || !("vibrate" in navigator)) {
    return;
  }
  try {
    navigator.vibrate(pattern);
  } catch {
    // ignore
  }
}

let voice: HTMLAudioElement | null = null;

export function playWordAudio(word: VocabWord | undefined) {
  if (typeof window === "undefined" || !word?.audioUrl) {
    return false;
  }
  voice ??= new Audio();
  voice.src = resolveMediaUrl(word.audioUrl);
  voice.play().catch(() => undefined);
  return true;
}

export function stopWordAudio() {
  voice?.pause();
}

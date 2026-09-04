export const WORD_IMAGE_PLAYER = 480;
export const WORD_IMAGE_THUMB = 96;
export const PRELOAD_IMAGE_COUNT = 10;
export const PRELOAD_AUDIO_COUNT = 3;

export function cloudinaryDisplayUrl(url: string, width: number): string {
  if (!url) {
    return "";
  }
  const marker = "/image/upload/";
  const at = url.indexOf(marker);
  if (at < 0) {
    return url;
  }
  const rest = url.slice(at + marker.length);
  if (rest.startsWith("f_auto,") || /(?:^|\/)w_\d+/.test(rest.split("/")[0] ?? "")) {
    return url;
  }
  return `${url.slice(0, at + marker.length)}f_auto,q_auto,c_limit,w_${width}/${rest}`;
}

const warmed = new Set<string>();

export function preloadImages(urls: Iterable<string>) {
  if (typeof window === "undefined") {
    return;
  }
  for (const url of urls) {
    if (!url || warmed.has(url)) {
      continue;
    }
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      warmed.add(url);
    };
    image.src = url;
  }
}

const audioPool: HTMLAudioElement[] = [];

export function preloadAudio(urls: Iterable<string>) {
  if (typeof window === "undefined") {
    return;
  }
  const unique = [...new Set([...urls].filter(Boolean))].slice(0, PRELOAD_AUDIO_COUNT);
  unique.forEach((url, slot) => {
    let audio = audioPool[slot];
    if (!audio) {
      audio = new Audio();
      audio.preload = "auto";
      audioPool[slot] = audio;
    }
    if (audio.src === url || audio.src.endsWith(url)) {
      return;
    }
    audio.src = url;
  });
}

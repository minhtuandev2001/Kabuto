export const WORD_IMAGE_PLAYER = 480;
export const WORD_IMAGE_THUMB = 96;
export const LESSON_IMAGE_VIEW = 1400;
export const LESSON_IMAGE_THUMB = 320;
export const PRELOAD_IMAGE_COUNT = 10;

/** Encode path segments so kanji filenames / spaces work in <audio src>. */
export function resolveMediaUrl(url: string) {
  const raw = url.trim();
  if (!raw) {
    return "";
  }
  if (/^https?:\/\//i.test(raw) || raw.startsWith("blob:") || raw.startsWith("data:")) {
    try {
      const parsed = new URL(raw);
      parsed.pathname = parsed.pathname
        .split("/")
        .map((part) => (part ? encodeURIComponent(decodeURIComponent(part)) : ""))
        .join("/");
      return parsed.toString();
    } catch {
      return raw;
    }
  }
  return raw
    .split("/")
    .map((part) => (part ? encodeURIComponent(decodeURIComponent(part)) : ""))
    .join("/");
}

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
    image.src = resolveMediaUrl(url);
  }
}

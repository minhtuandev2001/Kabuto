export const runtime = "nodejs";

const ALLOWED_HOSTS = ["vnjpclub.com", "cloudinary.com"];
const MAX_REDIRECTS = 3;
const MAX_BYTES = 5 * 1024 * 1024;

function isAllowed(url: URL) {
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return false;
  }
  const host = url.hostname.toLowerCase();
  return ALLOWED_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}

async function fetchUpstream(url: URL) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(15_000) });
    } catch {
      // Retry once: the audio host drops connections now and then.
    }
  }
  return null;
}

/**
 * Same-origin copy of a word's audio. The player decodes audio bytes to stitch a lesson into one
 * file (iOS only keeps playing a single file with the screen locked), and some hosts send no CORS headers.
 */
export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("url") ?? "";
  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new Response("Bad url", { status: 400 });
  }

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    if (!isAllowed(target)) {
      return new Response("Host not allowed", { status: 403 });
    }
    const upstream = await fetchUpstream(target);
    if (!upstream) {
      return new Response("Upstream unreachable", { status: 502 });
    }
    const location = upstream.headers.get("location");
    if (upstream.status >= 300 && upstream.status < 400 && location) {
      target = new URL(location, target);
      continue;
    }
    if (!upstream.ok || !upstream.body) {
      return new Response("Upstream error", { status: upstream.status === 404 ? 404 : 502 });
    }
    const type = upstream.headers.get("content-type") ?? "audio/mpeg";
    const length = Number(upstream.headers.get("content-length") ?? 0);
    if (!/^(audio\/|application\/octet-stream)/i.test(type) || length > MAX_BYTES) {
      return new Response("Not an audio file", { status: 415 });
    }
    const headers = new Headers({
      "Content-Type": type,
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
    });
    if (length > 0) {
      headers.set("Content-Length", String(length));
    }
    return new Response(upstream.body, { headers });
  }
  return new Response("Too many redirects", { status: 508 });
}

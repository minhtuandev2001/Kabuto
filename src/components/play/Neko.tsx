"use client";

export type NekoMood = "idle" | "happy" | "sad" | "sleep";

const MOOD_CLASS: Record<NekoMood, string> = {
  idle: "play-neko-idle",
  happy: "play-neko-happy",
  sad: "play-neko-sad",
  sleep: "",
};

/** The headphone cat mascot; `moodKey` restarts the reaction animation for repeated moods. */
export function Neko({
  mood = "idle",
  moodKey,
  accessory,
  size = 96,
  className = "",
}: {
  mood?: NekoMood;
  moodKey?: number;
  accessory?: string;
  size?: number;
  className?: string;
}) {
  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      <div key={`${mood}-${moodKey ?? 0}`} className={`h-full w-full ${MOOD_CLASS[mood]}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mascot-cat.png"
          alt="Neko"
          draggable={false}
          className={`h-full w-full select-none object-contain ${mood === "sleep" ? "rotate-[-10deg] opacity-80 grayscale-[35%]" : ""}`}
        />
      </div>
      {accessory ? (
        <span className="pointer-events-none absolute right-[6%] top-[-4%] select-none" style={{ fontSize: size * 0.3 }}>
          {accessory}
        </span>
      ) : null}
      {mood === "happy" ? (
        <span className="pointer-events-none absolute left-[2%] top-[4%] select-none" style={{ fontSize: size * 0.22 }}>
          ✨
        </span>
      ) : null}
      {mood === "sad" ? (
        <span className="pointer-events-none absolute left-[10%] top-[30%] select-none" style={{ fontSize: size * 0.2 }}>
          💧
        </span>
      ) : null}
      {mood === "sleep" ? (
        <span className="pointer-events-none absolute right-[0%] top-[0%] select-none" style={{ fontSize: size * 0.26 }}>
          💤
        </span>
      ) : null}
    </div>
  );
}

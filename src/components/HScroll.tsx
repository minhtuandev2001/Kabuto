"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

const STEP_EXTRA = 20;

export function hScrollStep(
  scrollLeft: number,
  clientWidth: number,
  items: { offsetLeft: number; offsetWidth: number }[],
  dir: 1 | -1,
  extra = STEP_EXTRA,
) {
  if (!items.length) {
    return 0;
  }
  const edge =
    dir === 1
      ? items.find((item) => item.offsetLeft + item.offsetWidth > scrollLeft + clientWidth - 2)
      : [...items].reverse().find((item) => item.offsetLeft < scrollLeft - 1);
  return dir * ((edge ?? items[0]).offsetWidth + extra);
}

export function HScroll({ children, className = "" }: { children: ReactNode; className?: string }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const sync = useCallback(() => {
    const el = scroller.current;
    if (!el) {
      return;
    }
    const max = el.scrollWidth - el.clientWidth;
    setCanLeft(el.scrollLeft > 1);
    setCanRight(max > 1 && el.scrollLeft < max - 1);
  }, []);

  useLayoutEffect(() => {
    sync();
  }, [children, sync]);

  useEffect(() => {
    const el = scroller.current;
    if (!el) {
      return;
    }
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    for (const child of el.children) {
      ro.observe(child);
    }
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [sync]);

  function step(dir: 1 | -1) {
    const el = scroller.current;
    if (!el) {
      return;
    }
    const items = [...el.children] as HTMLElement[];
    el.scrollBy({ left: hScrollStep(el.scrollLeft, el.clientWidth, items, dir), behavior: "smooth" });
  }

  return (
    <div className={`relative min-w-0 ${className}`}>
      <div
        ref={scroller}
        className={`no-h-scroll flex min-w-0 gap-2 overflow-x-auto overscroll-x-contain ${
          canLeft || canRight ? "scroll-px-8" : ""
        }`}
      >
        {children}
      </div>
      {canLeft ? (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#f6f3ff] from-30% to-transparent" />
          <button
            type="button"
            onClick={() => step(-1)}
            className="glass-strong absolute left-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-[#7C5CFC] shadow-[0_4px_12px_rgba(91,63,214,0.16)]"
            aria-label="Xem chip bên trái"
          >
            <ChevronLeft size={16} />
          </button>
        </>
      ) : null}
      {canRight ? (
        <>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#f6f3ff] from-30% to-transparent" />
          <button
            type="button"
            onClick={() => step(1)}
            className="glass-strong absolute right-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-[#7C5CFC] shadow-[0_4px_12px_rgba(91,63,214,0.16)]"
            aria-label="Xem chip bên phải"
          >
            <ChevronRight size={16} />
          </button>
        </>
      ) : null}
    </div>
  );
}

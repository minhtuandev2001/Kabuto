"use client";

import { useEffect, useRef } from "react";

const MIN_SCALE = 1;
const MAX_SCALE = 5;

type Point = { x: number; y: number };

function dist(a: Point, b: Point) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function mid(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

type Props = {
  src: string;
  alt: string;
  className?: string;
};

/** Pinch / wheel zoom + drag pan. Resets when `src` changes. */
export function ZoomableImage({ src, alt, className }: Props) {
  const shellRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const view = useRef({ scale: 1, x: 0, y: 0 });
  const gesture = useRef({
    mode: "none" as "none" | "pan" | "pinch",
    startScale: 1,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    startDist: 1,
    moved: false,
    lastTapAt: 0,
  });

  function paint() {
    const img = imgRef.current;
    if (!img) {
      return;
    }
    const { scale, x, y } = view.current;
    img.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
  }

  function clampPan() {
    const shell = shellRef.current;
    if (!shell) {
      return;
    }
    const { scale } = view.current;
    if (scale <= 1) {
      view.current.x = 0;
      view.current.y = 0;
      return;
    }
    const maxX = (shell.clientWidth * (scale - 1)) / 2;
    const maxY = (shell.clientHeight * (scale - 1)) / 2;
    view.current.x = Math.min(maxX, Math.max(-maxX, view.current.x));
    view.current.y = Math.min(maxY, Math.max(-maxY, view.current.y));
  }

  function reset() {
    view.current = { scale: 1, x: 0, y: 0 };
    paint();
  }

  function zoomAt(clientX: number, clientY: number, nextScale: number) {
    const shell = shellRef.current;
    if (!shell) {
      return;
    }
    const rect = shell.getBoundingClientRect();
    const mx = clientX - rect.left - rect.width / 2;
    const my = clientY - rect.top - rect.height / 2;
    const prev = view.current.scale;
    const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));
    if (scale === prev) {
      return;
    }
    const ratio = scale / prev;
    view.current.scale = scale;
    view.current.x = mx - (mx - view.current.x) * ratio;
    view.current.y = my - (my - view.current.y) * ratio;
    clampPan();
    paint();
  }

  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when image changes
  }, [src]);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) {
      return;
    }

    function onTouchStart(e: TouchEvent) {
      gesture.current.moved = false;
      if (e.touches.length >= 2) {
        e.preventDefault();
        const a = { x: e.touches[0]!.clientX, y: e.touches[0]!.clientY };
        const b = { x: e.touches[1]!.clientX, y: e.touches[1]!.clientY };
        const m = mid(a, b);
        gesture.current.mode = "pinch";
        gesture.current.startScale = view.current.scale;
        gesture.current.startX = view.current.x;
        gesture.current.startY = view.current.y;
        gesture.current.originX = m.x;
        gesture.current.originY = m.y;
        gesture.current.startDist = Math.max(1, dist(a, b));
        return;
      }
      if (e.touches.length === 1) {
        gesture.current.mode = view.current.scale > 1 ? "pan" : "none";
        gesture.current.startX = view.current.x;
        gesture.current.startY = view.current.y;
        gesture.current.originX = e.touches[0]!.clientX;
        gesture.current.originY = e.touches[0]!.clientY;
      }
    }

    function onTouchMove(e: TouchEvent) {
      const g = gesture.current;
      if (g.mode === "pinch" && e.touches.length >= 2) {
        e.preventDefault();
        g.moved = true;
        const a = { x: e.touches[0]!.clientX, y: e.touches[0]!.clientY };
        const b = { x: e.touches[1]!.clientX, y: e.touches[1]!.clientY };
        const m = mid(a, b);
        const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, g.startScale * (dist(a, b) / g.startDist)));
        const ratio = next / g.startScale;
        view.current.scale = next;
        view.current.x = m.x - g.originX + g.startX * ratio;
        view.current.y = m.y - g.originY + g.startY * ratio;
        clampPan();
        paint();
        return;
      }
      if (e.touches.length === 1) {
        const dx = e.touches[0]!.clientX - g.originX;
        const dy = e.touches[0]!.clientY - g.originY;
        if (Math.hypot(dx, dy) > 8) {
          g.moved = true;
        }
        if (g.mode === "pan" && view.current.scale > 1) {
          e.preventDefault();
          view.current.x = g.startX + dx;
          view.current.y = g.startY + dy;
          clampPan();
          paint();
        }
      }
    }

    function onTouchEnd(e: TouchEvent) {
      const g = gesture.current;
      if (e.touches.length >= 2) {
        return;
      }
      if (e.touches.length === 1) {
        // Lifted one finger from pinch → continue as pan if zoomed.
        g.mode = view.current.scale > 1 ? "pan" : "none";
        g.startX = view.current.x;
        g.startY = view.current.y;
        g.originX = e.touches[0]!.clientX;
        g.originY = e.touches[0]!.clientY;
        return;
      }

      // All fingers up
      if (!g.moved && e.changedTouches[0] && g.mode !== "pinch") {
        const now = Date.now();
        if (now - g.lastTapAt < 280) {
          const t = e.changedTouches[0];
          if (view.current.scale > 1.05) {
            reset();
          } else {
            zoomAt(t.clientX, t.clientY, 2.5);
          }
          g.lastTapAt = 0;
        } else {
          g.lastTapAt = now;
        }
      }
      g.mode = "none";
      if (view.current.scale <= 1.02) {
        reset();
      }
    }

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      zoomAt(e.clientX, e.clientY, view.current.scale * factor);
    }

    let dragging = false;
    let startX = 0;
    let startY = 0;
    let originX = 0;
    let originY = 0;

    function onPointerDown(e: PointerEvent) {
      if (e.pointerType === "touch" || view.current.scale <= 1) {
        return;
      }
      dragging = true;
      startX = view.current.x;
      startY = view.current.y;
      originX = e.clientX;
      originY = e.clientY;
      shell?.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e: PointerEvent) {
      if (!dragging) {
        return;
      }
      view.current.x = startX + (e.clientX - originX);
      view.current.y = startY + (e.clientY - originY);
      clampPan();
      paint();
    }

    function onPointerUp() {
      dragging = false;
    }

    shell.addEventListener("touchstart", onTouchStart, { passive: false });
    shell.addEventListener("touchmove", onTouchMove, { passive: false });
    shell.addEventListener("touchend", onTouchEnd);
    shell.addEventListener("touchcancel", onTouchEnd);
    shell.addEventListener("wheel", onWheel, { passive: false });
    shell.addEventListener("pointerdown", onPointerDown);
    shell.addEventListener("pointermove", onPointerMove);
    shell.addEventListener("pointerup", onPointerUp);
    shell.addEventListener("pointercancel", onPointerUp);

    return () => {
      shell.removeEventListener("touchstart", onTouchStart);
      shell.removeEventListener("touchmove", onTouchMove);
      shell.removeEventListener("touchend", onTouchEnd);
      shell.removeEventListener("touchcancel", onTouchEnd);
      shell.removeEventListener("wheel", onWheel);
      shell.removeEventListener("pointerdown", onPointerDown);
      shell.removeEventListener("pointermove", onPointerMove);
      shell.removeEventListener("pointerup", onPointerUp);
      shell.removeEventListener("pointercancel", onPointerUp);
    };
  }, []);

  return (
    <div
      ref={shellRef}
      className={`relative touch-none overflow-hidden overscroll-none ${className ?? ""}`}
      style={{ touchAction: "none" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        draggable={false}
        className="mx-auto max-h-[min(78vh,1100px)] w-full origin-center object-contain will-change-transform select-none"
        decoding="async"
      />
    </div>
  );
}

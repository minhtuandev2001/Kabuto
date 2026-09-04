"use client";

import { Loader2 } from "lucide-react";

export function Spinner({ size = 28 }: { size?: number }) {
  return <Loader2 size={size} className="animate-spin text-[#7C5CFC]" aria-hidden />;
}

export function BusyBar({ show }: { show: boolean }) {
  if (!show) {
    return null;
  }
  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-50 h-[3px] overflow-hidden bg-[#EFEAFF]"
      style={{ top: "max(0px, env(safe-area-inset-top))" }}
      role="progressbar"
      aria-valuetext="Đang tải"
    >
      <span className="busy-indeterminate block h-full w-[38%] rounded-full bg-[#7C5CFC]" />
    </div>
  );
}

export function BusyOverlay({ show }: { show: boolean }) {
  if (!show) {
    return null;
  }
  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[#f6f3ff]/60 backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Spinner />
      <p className="text-[13px] font-bold text-[#7C5CFC]">Đang tải</p>
    </div>
  );
}

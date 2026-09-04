"use client";

import { usePathname, useRouter } from "next/navigation";
import { BookOpen, Clapperboard, Headphones, Plus, Settings } from "lucide-react";
import { MiniPlayer } from "./MiniPlayer";
import type { ReactNode } from "react";

const TABS = [
  { href: "/listen", label: "Nghe", icon: Headphones },
  { href: "/lessons", label: "Bài học", icon: BookOpen },
  { href: "/videos", label: "Video", icon: Clapperboard },
  { href: "/create", label: "Tạo", icon: Plus },
  { href: "/settings", label: "Cài đặt", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const showChrome = pathname !== "/";
  const watchingVideo = pathname.startsWith("/videos/");
  const hideMini = pathname === "/listen" || watchingVideo;

  return (
    <div className="relative mx-auto flex min-h-lvh w-full max-w-[460px] flex-col bg-[#f6f3ff]">
      <div className="aurora" />
      <main
        className={`relative z-10 flex min-h-lvh flex-1 flex-col px-5 ${
          !showChrome
            ? "pb-[max(1.25rem,env(safe-area-inset-bottom))]"
            : watchingVideo
              ? "pb-[calc(5.25rem+env(safe-area-inset-bottom))]"
              : "pb-[calc(7.5rem+env(safe-area-inset-bottom))]"
        }`}
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        {children}
      </main>
      {showChrome ? (
        <div
          className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[460px]"
          style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
        >
          <MiniPlayer hidden={hideMini} />
          <nav className="glass-strong mx-3 flex items-center justify-around rounded-[22px] px-2 py-2">
            {TABS.map((tab) => {
              const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
              const Icon = tab.icon;
              return (
                <button
                  key={tab.href}
                  type="button"
                  onClick={() => router.push(tab.href)}
                  className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-2xl px-0.5 py-1.5 text-[10px] font-bold transition ${
                    active ? "text-[#7C5CFC]" : "text-[#7C7A9C]"
                  }`}
                >
                  <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      ) : null}
    </div>
  );
}

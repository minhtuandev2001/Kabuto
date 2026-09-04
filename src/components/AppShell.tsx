"use client";

import { usePathname, useRouter } from "next/navigation";
import { BookOpen, BookType, Headphones, Plus, Settings } from "lucide-react";
import { MiniPlayer } from "./MiniPlayer";
import type { ReactNode } from "react";

const TABS = [
  { href: "/listen", label: "Nghe", icon: Headphones },
  { href: "/lessons", label: "Bài học", icon: BookOpen },
  { href: "/grammar", label: "Ngữ pháp", icon: BookType },
  { href: "/create", label: "Tạo", icon: Plus },
  { href: "/settings", label: "Cài đặt", icon: Settings },
] as const;

const SHELL_MAX = "mx-auto w-full max-w-[460px] md:max-w-[840px]";

function tabActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavButtons({
  pathname,
  onGo,
  rail,
}: {
  pathname: string;
  onGo: (href: string) => void;
  rail?: boolean;
}) {
  return TABS.map((tab) => {
    const active = tabActive(pathname, tab.href);
    const Icon = tab.icon;
    return (
      <button
        key={tab.href}
        type="button"
        onClick={() => onGo(tab.href)}
        className={
          rail
            ? `flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-[13px] font-bold ${
                active ? "bg-[#EFEAFF] text-[#7C5CFC]" : "text-[#7C7A9C]"
              }`
            : `flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-2xl px-0.5 py-1.5 text-[10px] font-bold transition ${
                active ? "text-[#7C5CFC]" : "text-[#7C7A9C]"
              }`
        }
      >
        <Icon size={rail ? 20 : 22} strokeWidth={active ? 2.4 : 1.8} />
        {tab.label}
      </button>
    );
  });
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const showChrome = pathname !== "/";
  const hideMini = pathname === "/listen";
  const go = (href: string) => router.push(href);

  return (
    <div className={`relative flex min-h-lvh flex-col bg-[#f6f3ff] ${SHELL_MAX} lg:max-w-[1120px] lg:flex-row`}>
      <div className="aurora" />
      {showChrome ? (
        <aside className="relative z-20 hidden w-[220px] shrink-0 flex-col py-6 pl-4 pr-2 lg:flex">
          <div className="mb-5 flex items-center gap-2.5 px-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#7C5CFC] text-sm font-extrabold text-white">
              あ
            </span>
            <span className="text-[15px] font-extrabold text-[#1E1B4B]">Learn Japan</span>
          </div>
          <nav className="glass-strong flex flex-1 flex-col gap-1 rounded-[24px] p-2">
            <NavButtons pathname={pathname} onGo={go} rail />
          </nav>
          <div className="mt-3">
            <MiniPlayer hidden={hideMini} className="w-full" />
          </div>
        </aside>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <main
          className={`relative z-10 flex min-h-lvh flex-1 flex-col px-5 md:px-7 ${
            !showChrome
              ? "pb-[max(1.25rem,env(safe-area-inset-bottom))]"
              : "pb-[calc(7.5rem+env(safe-area-inset-bottom))] lg:pb-8"
          }`}
          style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
        >
          {children}
        </main>
        {showChrome ? (
          <div
            className={`fixed inset-x-0 bottom-0 z-30 ${SHELL_MAX} lg:hidden`}
            style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
          >
            <MiniPlayer hidden={hideMini} />
            <nav className="glass-strong mx-3 flex items-center justify-around rounded-[22px] px-2 py-2">
              <NavButtons pathname={pathname} onGo={go} />
            </nav>
          </div>
        ) : null}
      </div>
    </div>
  );
}

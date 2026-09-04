"use client";

import { usePathname, useRouter } from "next/navigation";
import { BookOpen, BookType, Headphones, Plus, Settings } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { BusyBar, BusyOverlay, Spinner } from "./Busy";
import { MiniPlayer } from "./MiniPlayer";
import { useCatalog } from "@/context/CatalogProvider";
import type { ReactNode } from "react";

const TABS = [
  { href: "/listen", label: "Nghe", icon: Headphones },
  { href: "/lessons", label: "Bài học", icon: BookOpen },
  { href: "/grammar", label: "Ngữ pháp", icon: BookType },
  { href: "/create", label: "Tạo", icon: Plus },
  { href: "/settings", label: "Cài đặt", icon: Settings },
] as const;

function tabActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavButtons({
  pathname,
  pendingHref,
  onGo,
  rail,
}: {
  pathname: string;
  pendingHref: string | null;
  onGo: (href: string) => void;
  rail?: boolean;
}) {
  return TABS.map((tab) => {
    const active = tabActive(pathname, tab.href);
    const pending = pendingHref === tab.href;
    const Icon = tab.icon;
    return (
      <button
        key={tab.href}
        type="button"
        onClick={() => onGo(tab.href)}
        className={
          rail
            ? `flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-[13px] font-bold transition ${
                active || pending ? "bg-[#EFEAFF] text-[#7C5CFC]" : "text-[#7C7A9C] hover:bg-white/60"
              }`
            : `flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-2xl px-0.5 py-1.5 text-[10px] font-bold transition ${
                active || pending ? "text-[#7C5CFC]" : "text-[#7C7A9C]"
              }`
        }
      >
        {pending ? (
          <Spinner size={rail ? 20 : 22} />
        ) : (
          <Icon size={rail ? 20 : 22} strokeWidth={active ? 2.4 : 1.8} />
        )}
        {tab.label}
      </button>
    );
  });
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { catalogReady, catalogBusy, lessons } = useCatalog();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [navOverlay, setNavOverlay] = useState(false);
  const [, startNav] = useTransition();
  const showChrome = pathname !== "/";
  const hideMini = pathname === "/listen";
  const navigating = Boolean(pendingHref);
  const blocking = navOverlay || (!catalogReady && lessons.length === 0);
  const showBar = navigating || catalogBusy || !catalogReady;

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  useEffect(() => {
    if (!pendingHref) {
      setNavOverlay(false);
      return;
    }
    const show = window.setTimeout(() => setNavOverlay(true), 180);
    // ponytail: hung router.push never updates pathname; drop when Next exposes nav pending.
    const stop = window.setTimeout(() => setPendingHref(null), 12_000);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(stop);
    };
  }, [pendingHref]);

  function go(href: string) {
    if (pathname === href) {
      return;
    }
    setPendingHref(href);
    startNav(() => router.push(href));
  }

  return (
    <div className="relative mx-auto flex min-h-lvh w-full max-w-[460px] flex-col bg-[#f6f3ff] md:max-w-none md:flex-row">
      <BusyBar show={showBar} />
      <div className="aurora" />
      {showChrome ? (
        <aside className="relative z-20 hidden h-lvh w-56 shrink-0 self-start p-3 md:sticky md:top-0 md:flex lg:w-60 lg:p-4">
          <div className="glass-strong flex h-full min-h-0 w-full flex-col rounded-[28px] p-3">
            <div className="mb-4 flex items-center gap-2.5 px-1">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#7C5CFC] text-sm font-extrabold text-white">
                あ
              </span>
              <span className="text-[15px] font-extrabold text-[#1E1B4B]">Learn Japan</span>
            </div>
            <nav className="flex flex-col gap-1">
              <NavButtons pathname={pathname} pendingHref={pendingHref} onGo={go} rail />
            </nav>
            <div className="mt-auto pt-3">
              <MiniPlayer hidden={hideMini} className="w-full" />
            </div>
          </div>
        </aside>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <main
          className={`relative z-10 flex min-h-lvh flex-1 flex-col px-5 md:px-6 lg:px-8 ${
            !showChrome
              ? "pb-[max(1.25rem,env(safe-area-inset-bottom))]"
              : "pb-[calc(7.5rem+env(safe-area-inset-bottom))] md:pb-6"
          }`}
          style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
          aria-busy={blocking || catalogBusy}
        >
          {children}
          <BusyOverlay show={blocking} />
        </main>
        {showChrome ? (
          <div
            className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[460px] md:hidden"
            style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
          >
            <MiniPlayer hidden={hideMini} />
            <nav className="glass-strong mx-3 flex items-center justify-around rounded-[22px] px-2 py-2">
              <NavButtons pathname={pathname} pendingHref={pendingHref} onGo={go} />
            </nav>
          </div>
        ) : null}
      </div>
    </div>
  );
}

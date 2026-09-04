"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { usePlayer } from "@/context/PlayerProvider";
import { useCatalog } from "@/context/CatalogProvider";

gsap.registerPlugin(useGSAP);

export default function WelcomePage() {
  const root = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { playLesson } = usePlayer();
  const { lessons, allWords, catalogReady } = useCatalog();

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        return;
      }
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".welcome-brand", { y: -16, opacity: 0, duration: 0.5 })
        .from(".welcome-hero", { scale: 0.82, opacity: 0, duration: 0.7 }, "-=0.2")
        .from(".welcome-stat", { y: 24, opacity: 0, stagger: 0.08, duration: 0.45 }, "-=0.35")
        .from(".welcome-copy", { y: 20, opacity: 0, duration: 0.5 }, "-=0.2")
        .from(".welcome-cta", { y: 16, opacity: 0, duration: 0.4 }, "-=0.2");
    },
    { scope: root },
  );

  return (
    <div ref={root} className="flex min-h-full flex-1 flex-col">
      <div className="welcome-brand glass-strong inline-flex w-fit items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7C5CFC] text-sm font-extrabold text-white">
          あ
        </span>
        <span className="text-sm font-bold text-[#1E1B4B]">Minna no Nihongo</span>
      </div>

      <div className="welcome-hero relative mx-auto my-6 flex justify-center">
        <div className="absolute h-56 w-56 rounded-full bg-[#7C5CFC]/25 blur-3xl" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hero-listening.png" alt="" className="relative z-10 h-56 w-56 object-contain" />
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {[
          [String(lessons.length), "bài học"],
          [allWords.length.toLocaleString("vi-VN"), "từ vựng"],
          ["N5→N4", "trình độ"],
        ].map(([value, label]) => (
          <div key={label} className="welcome-stat glass rounded-[22px] px-2 py-3 text-center">
            <div className="text-lg font-extrabold text-[#1E1B4B]">{value}</div>
            <div className="text-[11px] font-semibold text-[#7C7A9C]">{label}</div>
          </div>
        ))}
      </div>

      <div className="welcome-copy mt-8">
        <h1 className="text-[32px] font-extrabold leading-10 text-[#1E1B4B]">
          Học từ vựng
          <br />
          bằng đôi tai.
        </h1>
        <p className="mt-3 text-[15px] font-semibold leading-6 text-[#4A4470]">
          Nghe phát âm chuẩn từng từ, lặp lại theo bài. Mỗi ngày một chút, nhớ lâu hơn học chay.
        </p>
      </div>

      <button
        type="button"
        disabled={!catalogReady || lessons.length === 0}
        className="welcome-cta mt-auto flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#A78BFA] to-[#7C5CFC] py-4 text-base font-extrabold text-white shadow-[0_14px_24px_rgba(124,92,252,0.32)] disabled:opacity-60"
        onClick={() => {
          playLesson(lessons[0]?.lesson ?? 1, 0);
          router.push("/listen");
        }}
      >
        Bắt đầu học
        <ArrowRight size={18} />
      </button>
      <p className="welcome-cta mt-3 mb-2 text-center text-xs font-semibold text-[#7C7A9C]">
        Thêm ra màn hình chính để dùng như app
      </p>
    </div>
  );
}

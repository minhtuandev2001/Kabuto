"use client";

import { Minus, Plus } from "lucide-react";
import { useSettings } from "@/context/SettingsProvider";
import { MAX_WORD_GAP_MS, MIN_WORD_GAP_MS, WORD_GAP_PRESETS, WORD_GAP_STEP_MS, formatWordGap } from "@/lib/theme";

export default function SettingsPage() {
  const { wordGapMs, setWordGapMs } = useSettings();

  return (
    <div>
      <p className="text-[11px] font-bold tracking-wider text-[#7C5CFC]">TÙY CHỈNH</p>
      <h1 className="mt-1 text-[26px] font-extrabold text-[#1E1B4B] md:text-[32px]">Cài đặt</h1>
      <p className="mt-1 text-sm font-semibold text-[#4A4470]">Chỉnh nhịp nghe cho vừa tốc độ học của bạn.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="glass-strong rounded-[28px] p-4 md:p-6">
          <p className="text-[15px] font-extrabold text-[#1E1B4B]">Nghỉ giữa các từ</p>
          <p className="mt-1 text-[12.5px] font-semibold leading-5 text-[#7C7A9C]">
            Sau khi phát xong một từ, đợi rồi mới sang từ kế. Khi khóa màn hình, app bỏ khoảng nghỉ để nghe không bị đứt.
          </p>
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              disabled={wordGapMs <= MIN_WORD_GAP_MS}
              onClick={() => setWordGapMs(wordGapMs - WORD_GAP_STEP_MS)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EFEAFF] text-[#7C5CFC] disabled:opacity-40"
            >
              <Minus size={18} />
            </button>
            <p className="text-xl font-extrabold text-[#1E1B4B]">{formatWordGap(wordGapMs)}</p>
            <button
              type="button"
              disabled={wordGapMs >= MAX_WORD_GAP_MS}
              onClick={() => setWordGapMs(wordGapMs + WORD_GAP_STEP_MS)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EFEAFF] text-[#7C5CFC] disabled:opacity-40"
            >
              <Plus size={18} />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {WORD_GAP_PRESETS.map((ms) => (
              <button
                key={ms}
                type="button"
                onClick={() => setWordGapMs(ms)}
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  wordGapMs === ms ? "bg-[#7C5CFC] text-white" : "bg-white/70 text-[#4A4470]"
                }`}
              >
                {formatWordGap(ms)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="glass rounded-[28px] p-4 text-[12.5px] font-semibold leading-5 text-[#4A4470] md:p-6">
            Trên iPhone: mở Safari → nút Chia sẻ →{" "}
            <span className="font-extrabold text-[#1E1B4B]">Thêm vào màn hình chính</span>
            . App hiện icon riêng, nghe được khi Safari/PWA còn mở.
          </div>
          <div className="text-[11.5px] font-semibold leading-5 text-[#7C7A9C]">
            Từ vựng N3–N1 lấy từ{" "}
            <a className="text-[#7C5CFC] underline" href="https://github.com/evanclan/OpenJLPT" target="_blank" rel="noreferrer">
              OpenJLPT
            </a>{" "}
            (danh sách tanos.co.uk + JMdict/EDICT), giấy phép{" "}
            <a className="text-[#7C5CFC] underline" href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">
              CC BY-SA 4.0
            </a>
            . Nghĩa gốc tiếng Anh. Không dùng giáo trình có bản quyền.
          </div>
        </div>
      </div>
    </div>
  );
}

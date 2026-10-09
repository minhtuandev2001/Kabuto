"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  DUPLICATE_REFUND,
  GACHA_COST,
  OUTFITS,
  RARITY_LABEL,
  outfitEmoji,
  type Outfit,
  type PlayProgress,
  type Rarity,
} from "@/lib/play/progress";
import { sfx } from "@/lib/play/sfx";
import { Neko } from "./Neko";

const RARITY_COLOR: Record<Rarity, string> = {
  common: "bg-[#EFEAFF] text-[#7C5CFC]",
  rare: "bg-[#DBEAFE] text-[#1D4ED8]",
  epic: "bg-[#FCE7F3] text-[#BE185D]",
  legendary: "bg-[#FEF3C7] text-[#B45309]",
};

export function GachaSheet({
  progress,
  onRoll,
  onEquip,
  onClose,
}: {
  progress: PlayProgress;
  onRoll: () => { outfit: Outfit; duplicate: boolean } | null;
  onEquip: (id: string | null) => void;
  onClose: () => void;
}) {
  const [rolling, setRolling] = useState(false);
  const [last, setLast] = useState<{ outfit: Outfit; duplicate: boolean; id: number } | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current != null) {
        window.clearTimeout(timerRef.current);
      }
    },
    [],
  );

  function roll() {
    if (rolling || progress.koban < GACHA_COST) {
      return;
    }
    setRolling(true);
    setLast(null);
    sfx.gacha();
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      const result = onRoll();
      setRolling(false);
      if (result) {
        setLast({ ...result, id: Date.now() });
        if (result.duplicate) {
          sfx.coin();
        } else {
          sfx.fanfare();
        }
      }
    }, 900);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#1E1B4B]/40 backdrop-blur-[2px] md:items-center" onClick={onClose}>
      <div
        className="glass-strong max-h-[88lvh] w-full max-w-[460px] overflow-y-auto rounded-t-[32px] bg-white/95 p-4 md:rounded-[32px]"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-wider text-[#7C5CFC]">GASHAPON</p>
            <h2 className="text-[22px] font-extrabold text-[#1E1B4B]">Tủ đồ của Neko</h2>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EFEAFF] text-[#7C5CFC]" aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        <div className="mt-3 flex items-center gap-4 rounded-[24px] bg-gradient-to-br from-[#FFF4E6] to-[#FCE7F3] p-4">
          <Neko mood={last && !last.duplicate ? "happy" : "idle"} moodKey={last?.id} accessory={outfitEmoji(progress.equipped)} size={92} />
          <div className="min-w-0 flex-1 text-center">
            {rolling ? (
              <span className="play-capsule inline-block text-[56px]">🎁</span>
            ) : last ? (
              <div key={last.id}>
                <span className="play-reveal inline-block text-[52px] leading-[60px]">{last.outfit.emoji}</span>
                <p className="text-[15px] font-extrabold text-[#1E1B4B]">{last.outfit.name}</p>
                <p className="text-[12px] font-bold text-[#7C7A9C]">
                  {last.duplicate ? `Trùng rồi · hoàn ${DUPLICATE_REFUND} 🪙` : `Mới! · ${RARITY_LABEL[last.outfit.rarity]}`}
                </p>
              </div>
            ) : (
              <span className="text-[56px]">🎰</span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={roll}
          disabled={rolling || progress.koban < GACHA_COST}
          className="mt-3 w-full rounded-full bg-gradient-to-r from-[#F472B6] to-[#7C5CFC] py-3.5 text-[15px] font-extrabold text-white shadow-[0_10px_20px_rgba(124,92,252,0.3)] disabled:opacity-45"
        >
          {rolling ? "Đang quay…" : `Quay gacha · ${GACHA_COST} 🪙`}
        </button>
        <p className="mt-1.5 text-center text-[12px] font-bold text-[#7C7A9C]">
          Bạn có {progress.koban} 🪙 · trả lời đúng để kiếm thêm
        </p>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {OUTFITS.map((item) => {
            const owned = progress.owned.includes(item.id);
            const equipped = progress.equipped === item.id;
            return (
              <button
                key={item.id}
                type="button"
                disabled={!owned}
                onClick={() => onEquip(equipped ? null : item.id)}
                className={`flex flex-col items-center rounded-[18px] px-1 py-2 ${equipped ? "bg-[#7C5CFC] text-white" : "bg-white/80"} ${
                  owned ? "" : "opacity-60"
                }`}
              >
                <span className="text-[28px] leading-9">{owned ? item.emoji : "❓"}</span>
                <span className={`mt-0.5 line-clamp-1 text-[10.5px] font-bold ${equipped ? "text-white" : "text-[#1E1B4B]"}`}>
                  {owned ? item.name : "???"}
                </span>
                <span className={`mt-1 rounded-full px-1.5 text-[9px] font-extrabold ${equipped ? "bg-white/25 text-white" : RARITY_COLOR[item.rarity]}`}>
                  {equipped ? "Đang đeo" : RARITY_LABEL[item.rarity]}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-center text-[11.5px] font-semibold text-[#7C7A9C]">
          Đã có {progress.owned.length}/{OUTFITS.length} món · chạm món đã có để đeo hoặc tháo
        </p>
      </div>
    </div>
  );
}

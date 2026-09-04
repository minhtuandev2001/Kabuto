import { Spinner } from "@/components/Busy";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20">
      <Spinner />
      <p className="text-[13px] font-bold text-[#7C5CFC]">Đang tải</p>
    </div>
  );
}

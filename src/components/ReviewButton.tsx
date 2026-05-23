"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReviewButton({
  hasYesterdayWorksheet,
  prevTopic,
}: {
  hasYesterdayWorksheet: boolean;
  prevTopic: string | null;
}) {
  const router = useRouter();
  const [toast, setToast] = useState(false);

  if (!prevTopic) return null;

  function handleClick() {
    if (hasYesterdayWorksheet) {
      router.push("/worksheet?review=true");
    } else {
      setToast(true);
      setTimeout(() => setToast(false), 3000);
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="h-10 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-[13.5px] font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 border border-white/15"
      >
        <span className="whitespace-nowrap">어제 복습하기</span>
      </button>
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-ink-900 text-white text-[13.5px] font-medium px-4 py-3 rounded-xl shadow-card">
          어제 학습 기록이 없어요
        </div>
      )}
    </>
  );
}

"use client";
import { useRouter } from "next/navigation";

export default function ContinueButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/worksheet")}
      className="w-full bg-blue-600 text-white py-4 rounded-xl text-lg font-medium hover:bg-blue-700 transition-colors"
    >
      이어서 학습하기 →
    </button>
  );
}

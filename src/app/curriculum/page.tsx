"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { Curriculum } from "@/types";

function CurriculumContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get("userId");

  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [refining, setRefining] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/curriculum?userId=${userId}`)
      .then((r) => r.json())
      .then((data) => {
        setCurriculum(data);
        setLoading(false);
      });
  }, [userId]);

  async function handleFeedback() {
    if (!feedback.trim() || !userId) return;
    setRefining(true);
    const res = await fetch("/api/curriculum", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, feedback }),
    });
    const data = await res.json();
    setCurriculum(data);
    setFeedback("");
    setRefining(false);
  }

  async function handleConfirm() {
    router.push(`/worksheet?userId=${userId}`);
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-4">📚</div>
          <p className="text-gray-600">커리큘럼을 생성하는 중이에요...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          나만의 커리큘럼 🎯
        </h1>
        <p className="text-gray-500 mb-8">
          AI가 설계한 커리큘럼이에요. 수정하고 싶은 부분을 말씀해주세요!
        </p>

        {/* 토픽 목록 */}
        <div className="space-y-3 mb-8">
          {curriculum?.topics.map((topic, i) => (
            <div
              key={topic.topicId}
              className="bg-white rounded-xl p-4 shadow-sm flex items-start gap-4"
            >
              <span className="text-blue-600 font-bold text-lg w-6 shrink-0">
                {i + 1}
              </span>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{topic.title}</p>
                <p className="text-sm text-gray-500 mt-1">{topic.description}</p>
              </div>
              <span className="text-xs text-gray-400 shrink-0">
                {topic.estimatedMinutes}분
              </span>
            </div>
          ))}
        </div>

        {/* 피드백 입력 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <h2 className="font-medium text-gray-900 mb-3">
            💬 수정 요청하기
          </h2>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="예: 3번 토픽을 더 자세하게 해줘, 실습을 더 추가해줘"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-400 focus:outline-none text-gray-700 resize-none"
            rows={3}
          />
          <button
            onClick={handleFeedback}
            disabled={refining || !feedback.trim()}
            className="mt-3 w-full bg-gray-800 text-white py-3 rounded-lg font-medium hover:bg-gray-900 transition-colors disabled:opacity-40"
          >
            {refining ? "수정 중..." : "커리큘럼 수정하기"}
          </button>
        </div>

        {/* 최종 확정 */}
        <button
          onClick={handleConfirm}
          className="w-full bg-blue-600 text-white py-4 rounded-xl text-lg font-medium hover:bg-blue-700 transition-colors"
        >
          이 커리큘럼으로 시작하기 →
        </button>
      </div>
    </main>
  );
}

export default function CurriculumPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>로딩 중...</p></div>}>
      <CurriculumContent />
    </Suspense>
  );
}

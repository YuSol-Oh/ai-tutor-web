"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Worksheet, Question } from "@/types";

function QuestionCard({
  question,
  index,
  worksheetId,
}: {
  question: Question;
  index: number;
  worksheetId: string;
}) {
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [textAnswer, setTextAnswer] = useState("");
  const [hintsShown, setHintsShown] = useState(0);
  const [result, setResult] = useState<{
    isCorrect: boolean;
    correctAnswer: string;
    explanation: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const answer = question.type === "multiple-choice" ? selectedAnswer : textAnswer;
    if (!answer) return;
    setLoading(true);
    const res = await fetch("/api/worksheet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ worksheetId, questionId: question.questionId, answer }),
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  function showNextHint() {
    if (hintsShown < 3) setHintsShown((h) => h + 1);
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="bg-blue-100 text-blue-700 text-sm font-medium px-2.5 py-0.5 rounded-full">
          문제 {index + 1}
        </span>
        <span className="text-xs text-gray-400">
          {question.type === "multiple-choice" ? "객관식" : question.type === "short-answer" ? "단답형" : "서술형"}
        </span>
      </div>

      <p className="text-gray-900 font-medium mb-4">{question.text}</p>

      {/* 객관식 보기 */}
      {question.type === "multiple-choice" && question.choices && !result && (
        <div className="space-y-2 mb-4">
          {question.choices.map((choice) => (
            <button
              key={choice.id}
              onClick={() => setSelectedAnswer(choice.id)}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                selectedAnswer === choice.id
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-gray-300 text-gray-700"
              }`}
            >
              <span className="font-medium mr-2">{choice.id.toUpperCase()}.</span>
              {choice.text}
            </button>
          ))}
        </div>
      )}

      {/* 단답형/서술형 입력 */}
      {question.type !== "multiple-choice" && !result && (
        <textarea
          value={textAnswer}
          onChange={(e) => setTextAnswer(e.target.value)}
          placeholder="답을 입력해주세요..."
          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-400 focus:outline-none text-gray-700 resize-none mb-4"
          rows={3}
        />
      )}

      {/* 힌트 영역 */}
      {!result && hintsShown > 0 && (
        <div className="mb-4 space-y-2">
          {question.hints.slice(0, hintsShown).map((hint, i) => (
            <div key={i} className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
              <span className="text-amber-700 text-sm">
                💡 힌트 {i + 1}: {hint}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 결과 영역 */}
      {result && (
        <div className={`rounded-lg p-4 mb-4 ${result.isCorrect ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
          <p className={`font-medium mb-2 ${result.isCorrect ? "text-green-700" : "text-red-700"}`}>
            {result.isCorrect ? "✅ 정답이에요!" : "❌ 아쉬워요!"}
          </p>
          {!result.isCorrect && (
            <p className="text-sm text-gray-600 mb-2">
              정답: <span className="font-medium">{result.correctAnswer}</span>
            </p>
          )}
          <p className="text-sm text-gray-600">💬 {result.explanation}</p>
        </div>
      )}

      {/* 버튼 영역 */}
      {!result && (
        <div className="flex gap-2">
          {hintsShown < 3 && (
            <button
              onClick={showNextHint}
              className="px-4 py-2 text-sm text-amber-600 border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors"
            >
              힌트 보기 ({hintsShown}/3)
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={loading || (!selectedAnswer && !textAnswer)}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-40"
          >
            {loading ? "확인 중..." : "제출하기"}
          </button>
        </div>
      )}
    </div>
  );
}

function WorksheetContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const [worksheet, setWorksheet] = useState<Worksheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [allDone, setAllDone] = useState(false);

  useEffect(() => {
    fetch("/api/worksheet")
      .then((r) => r.json())
      .then((data) => {
        setWorksheet(data);
        setLoading(false);
      });
  }, []);

  async function handleComplete() {
    const res = await fetch("/api/complete", { method: "POST" });
    const data = await res.json();
    if (data.isCompleted) {
      setAllDone(true);
    } else {
      setAllDone(true);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-4">📝</div>
          <p className="text-gray-600">오늘의 학습지를 준비하는 중이에요...</p>
          <p className="text-sm text-gray-400 mt-2">Claude가 문제를 만들고 있어요!</p>
        </div>
      </main>
    );
  }

  if (allDone) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center px-4">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">오늘 학습 완료!</h1>
          <p className="text-gray-500 mb-6">수고하셨어요. 꾸준히 하면 반드시 성장해요!</p>
          <a
            href="/"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            홈으로 돌아가기
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <span className="text-sm text-blue-600 font-medium">오늘의 학습</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">
            {worksheet?.topicTitle}
          </h1>
        </div>

        {/* 개념 파트 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">📖 핵심 개념</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            {worksheet?.conceptSummary}
          </p>
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-sm text-blue-700">
              <span className="font-medium">💼 실무 예시</span><br />
              {worksheet?.realWorldExample}
            </p>
          </div>
        </div>

        {/* 문제 파트 */}
        <h2 className="font-semibold text-gray-900 mb-3">✏️ 확인 문제</h2>
        {worksheet?.questions.map((q, i) => (
          <QuestionCard key={q.questionId} question={q} index={i} worksheetId={(worksheet as Worksheet & { id: string }).id} />
        ))}

        {/* 실습 파트 */}
        {worksheet?.handsOnTask && (
          <div className="bg-purple-50 rounded-2xl p-6 shadow-sm mb-6">
            <h2 className="font-semibold text-purple-900 mb-3">🛠️ 실습 과제</h2>
            <p className="text-purple-800 mb-3">{worksheet.handsOnTask.instruction}</p>
            <div className="bg-white rounded-xl p-4 mb-3">
              <p className="text-sm text-gray-600">
                <span className="font-medium">기대 결과물:</span> {worksheet.handsOnTask.expectedOutcome}
              </p>
            </div>
            {worksheet.handsOnTask.toolSuggestion && (
              <p className="text-sm text-purple-600">
                🔧 추천 도구: {worksheet.handsOnTask.toolSuggestion}
              </p>
            )}
          </div>
        )}

        {/* 완료 버튼 */}
        <button
          onClick={handleComplete}
          className="w-full bg-green-600 text-white py-4 rounded-xl text-lg font-medium hover:bg-green-700 transition-colors"
        >
          오늘 학습 완료! 🎉
        </button>
      </div>
    </main>
  );
}

export default function WorksheetPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>로딩 중...</p></div>}>
      <WorksheetContent />
    </Suspense>
  );
}

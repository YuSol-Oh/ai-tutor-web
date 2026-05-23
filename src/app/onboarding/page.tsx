"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const STEPS = [
  {
    id: "subject",
    question: "어떤 분야를 배우고 싶으세요?",
    type: "text",
    placeholder: "예: 머신러닝, 온톨로지, 블록체인, 부동산 투자, UX 디자인 등",
    required: true,
  },
  {
    id: "purpose",
    question: "배우려는 이유가 뭔가요?",
    type: "choice",
    required: true,
    choices: [
      { value: "project", label: "🚀 지금 진행 중인 프로젝트 때문에" },
      { value: "career", label: "💼 커리어 전환을 준비 중이라서" },
      { value: "curiosity", label: "🧠 그냥 궁금해서" },
      { value: "upskill", label: "⚡ 업무 역량을 높이고 싶어서" },
    ],
  },
  {
    id: "currentLevel",
    question: "현재 수준이 어느 정도예요?",
    type: "choice",
    required: true,
    choices: [
      { value: "beginner", label: "🌱 완전 처음이에요" },
      { value: "intermediate", label: "📚 기초는 알아요" },
      { value: "advanced", label: "🚀 심화가 필요해요" },
    ],
  },
  {
    id: "interestedTopics",
    question: "특히 더 파고 싶은 주제가 있나요?",
    type: "text",
    placeholder: "예: 머신러닝, 재무제표 읽기 (없으면 비워도 돼요)",
    required: false,
  },
  {
    id: "learningStyle",
    question: "어떤 방식으로 배우는 게 잘 맞아요?",
    type: "choice",
    required: true,
    choices: [
      { value: "reading", label: "📖 읽고 이해하는 게 좋아요" },
      { value: "problem", label: "✏️ 문제 풀면서 익히는 게 좋아요" },
      { value: "hands-on", label: "🛠️ 직접 해보면서 배우는 게 좋아요" },
    ],
  },
  {
    id: "includeHandsOn",
    question: "실습 과제도 포함할까요?",
    type: "choice",
    required: true,
    choices: [
      { value: "true", label: "✅ 네, 실습도 포함해주세요" },
      { value: "false", label: "📝 아니요, 개념 위주로 할게요" },
    ],
  },
  {
    id: "pace",
    question: "어떤 페이스로 배우고 싶어요?",
    type: "choice",
    required: true,
    choices: [
      { value: "fast", label: "⚡ 빠르게 훑고 싶어요" },
      { value: "deep", label: "🔍 깊게 이해하고 싶어요" },
    ],
  },
  {
    id: "mode",
    question: "어떤 방식으로 배우고 싶어요?",
    type: "choice",
    required: true,
    choices: [
      { value: "curriculum", label: "📋 처음부터 차근차근 커리큘럼대로" },
      { value: "project", label: "🎯 지금 당장 필요한 것만 빠르게" },
    ],
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [textInput, setTextInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  function goBack() {
    if (currentStep > 0) {
      const prevStep = STEPS[currentStep - 1];
      setTextInput(answers[prevStep.id] || "");
      setCurrentStep((s) => s - 1);
      setError("");
    }
  }

  async function handleChoice(value: string) {
    const newAnswers = { ...answers, [step.id]: value };
    if (step.id === "mode" && value === "project") {
      const context = prompt("어떤 프로젝트예요? 간단히 설명해주세요!");
      if (context) newAnswers["projectContext"] = context;
    }
    setAnswers(newAnswers);
    if (isLast) {
      await submit(newAnswers);
    } else {
      setCurrentStep((s) => s + 1);
      setTextInput(answers[STEPS[currentStep + 1]?.id] || "");
    }
  }

  async function handleText() {
    if (step.required && !textInput.trim()) {
      setError("필수 항목이에요. 입력해주세요!");
      return;
    }
    const newAnswers = { ...answers, [step.id]: textInput };
    setAnswers(newAnswers);
    setTextInput("");
    setError("");
    if (isLast) {
      await submit(newAnswers);
    } else {
      setCurrentStep((s) => s + 1);
    }
  }

  async function submit(finalAnswers: Record<string, string>) {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalAnswers),
      });
      if (!res.ok) throw new Error("서버 오류");
      router.push("/curriculum");
    } catch {
      setError("오류가 발생했어요. 다시 시도해주세요.");
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🤖</div>
          <p className="text-gray-700 font-medium">커리큘럼을 설계하는 중이에요...</p>
          <p className="text-gray-400 text-sm mt-2">AI가 맞춤 학습 플랜을 만들고 있어요!</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full">
        {/* 진행 바 */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>{currentStep + 1} / {STEPS.length}</span>
            <span>{Math.round(((currentStep + 1) / STEPS.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* 질문 카드 */}
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-medium text-gray-900 mb-6">
            {step.question}
          </h2>

          {step.type === "choice" && (
            <div className="space-y-3">
              {step.choices?.map((c) => (
                <button
                  key={c.value}
                  onClick={() => handleChoice(c.value)}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                    answers[step.id] === c.value
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}

          {step.type === "text" && (
            <div className="space-y-3">
              <input
                type="text"
                value={textInput}
                onChange={(e) => { setTextInput(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleText()}
                placeholder={step.placeholder}
                className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none text-gray-700 transition-colors ${
                  error ? "border-red-400" : "border-gray-200 focus:border-blue-400"
                }`}
                autoFocus
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                onClick={handleText}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                다음 →
              </button>
            </div>
          )}
        </div>

        {/* 뒤로가기 */}
        {currentStep > 0 && (
          <button
            onClick={goBack}
            className="mt-4 w-full text-gray-400 text-sm hover:text-gray-600 transition-colors"
          >
            ← 이전 질문으로 돌아가기
          </button>
        )}
      </div>
    </main>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const STEPS = [
  {
    id: "name",
    question: "안녕하세요! 먼저 이름을 알려주세요 😊",
    type: "text",
    placeholder: "이름을 입력해주세요",
  },
  {
    id: "subject",
    question: "어떤 분야를 배우고 싶으세요?",
    type: "choice",
    choices: [
      { value: "ai-data", label: "AI · 데이터 기초" },
      { value: "economics", label: "경제 · 금융 기초" },
      { value: "marketing", label: "마케팅 기초" },
    ],
  },
  {
    id: "purpose",
    question: "배우려는 이유가 뭔가요?",
    type: "choice",
    choices: [
      { value: "project", label: "지금 진행 중인 프로젝트 때문에" },
      { value: "career", label: "커리어 전환을 준비 중이라서" },
      { value: "curiosity", label: "그냥 궁금해서" },
      { value: "upskill", label: "업무 역량을 높이고 싶어서" },
    ],
  },
  {
    id: "currentLevel",
    question: "현재 수준이 어느 정도예요?",
    type: "choice",
    choices: [
      { value: "beginner", label: "완전 처음이에요" },
      { value: "intermediate", label: "기초는 알아요" },
      { value: "advanced", label: "심화가 필요해요" },
    ],
  },
  {
    id: "interestedTopics",
    question: "특히 더 파고 싶은 주제가 있나요?",
    type: "text",
    placeholder: "예: 머신러닝, 재무제표 읽기 (없으면 비워도 돼요)",
  },
  {
    id: "learningStyle",
    question: "어떤 방식으로 배우는 게 잘 맞아요?",
    type: "choice",
    choices: [
      { value: "reading", label: "읽고 이해하는 게 좋아요" },
      { value: "problem", label: "문제 풀면서 익히는 게 좋아요" },
      { value: "hands-on", label: "직접 해보면서 배우는 게 좋아요" },
    ],
  },
  {
    id: "includeHandsOn",
    question: "실습 과제도 포함할까요?",
    type: "choice",
    choices: [
      { value: "true", label: "네, 실습도 포함해주세요" },
      { value: "false", label: "아니요, 개념 위주로 할게요" },
    ],
  },
  {
    id: "pace",
    question: "어떤 페이스로 배우고 싶어요?",
    type: "choice",
    choices: [
      { value: "fast", label: "빠르게 훑고 싶어요" },
      { value: "deep", label: "깊게 이해하고 싶어요" },
    ],
  },
  {
    id: "mode",
    question: "어떤 방식으로 배우고 싶어요?",
    type: "choice",
    choices: [
      { value: "curriculum", label: "처음부터 차근차근 커리큘럼대로" },
      { value: "project", label: "지금 당장 필요한 것만 빠르게" },
    ],
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [textInput, setTextInput] = useState("");
  const [loading, setLoading] = useState(false);

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  async function handleChoice(value: string) {
    const newAnswers = { ...answers, [step.id]: value };
    setAnswers(newAnswers);

    if (step.id === "mode" && value === "project") {
      const context = prompt("어떤 프로젝트예요? 간단히 설명해주세요!");
      if (context) newAnswers["projectContext"] = context;
    }

    if (isLast) {
      await submit(newAnswers);
    } else {
      setCurrentStep((s) => s + 1);
    }
  }

  async function handleText() {
    const newAnswers = { ...answers, [step.id]: textInput };
    setAnswers(newAnswers);
    setTextInput("");
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
      const data = await res.json();
      router.push(`/curriculum?userId=${data.userId}`);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-4">🤖</div>
          <p className="text-gray-600">커리큘럼을 설계하는 중이에요...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full">
        {/* 진행 바 */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>{currentStep + 1} / {STEPS.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all"
              style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* 질문 */}
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
                  className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors text-gray-700"
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
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleText()}
                placeholder={step.placeholder}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-400 focus:outline-none text-gray-700"
                autoFocus
              />
              <button
                onClick={handleText}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                다음 →
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

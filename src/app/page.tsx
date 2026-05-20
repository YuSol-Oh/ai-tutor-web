export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          AI 1:1 과외
        </h1>
        <p className="text-gray-600 mb-8">
          나에게 딱 맞는 학습 플랜을 AI가 설계해드립니다.
          배우고 싶은 분야를 말씀해주세요.
        </p>
        <a
          href="/onboarding"
          className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
        >
          학습 시작하기 →
        </a>
      </div>
    </main>
  );
}

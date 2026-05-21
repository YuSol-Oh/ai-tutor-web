import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import ContinueButton from "@/components/ContinueButton";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 기존 커리큘럼 & 진도 확인
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("current_topic_index, name")
    .eq("id", user.id)
    .single();

  const { data: curriculum } = await supabase
    .from("curricula")
    .select("total_topics, topics")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const hasExisting = !!curriculum;
  const userName = profile?.name || user.user_metadata.full_name || "학습자";
  const currentIndex = profile?.current_topic_index || 0;
  const totalTopics = curriculum?.total_topics || 0;
  const progressPercent = totalTopics > 0 ? Math.round((currentIndex / totalTopics) * 100) : 0;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm px-4 py-4">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <h1 className="text-lg font-bold text-gray-900">AI 1:1 과외</h1>
          <LogoutButton />
        </div>
      </header>

      <div className="max-w-md mx-auto p-6">
        {/* 환영 메시지 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            안녕하세요, {userName}님! 👋
          </h2>
          <p className="text-gray-500">오늘도 새로운 것을 배워볼까요?</p>
        </div>

        {hasExisting ? (
          <>
            {/* 진도 카드 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-900">학습 진도</h3>
                <span className="text-sm text-blue-600 font-medium">{progressPercent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-sm text-gray-500">
                전체 {totalTopics}개 토픽 중 {currentIndex}개 완료
              </p>
            </div>

            {/* 이어서 학습 / 새로 시작 */}
            <ContinueButton />
            <Link
              href="/dashboard"
              className="mt-3 block w-full text-center text-gray-400 text-sm hover:text-gray-600 py-2 transition-colors"
            >
              학습 현황 보기 →
            </Link>
            <a
              href="/onboarding"
              className="mt-3 block w-full text-center text-gray-400 text-sm hover:text-gray-600 py-2 transition-colors"
            >
              새로운 커리큘럼 시작하기
            </a>
          </>
        ) : (
          <a
            href="/onboarding"
            className="block w-full bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-medium hover:bg-blue-700 transition-colors text-center"
          >
            학습 시작하기 →
          </a>
        )}
      </div>
    </main>
  );
}

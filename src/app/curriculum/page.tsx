import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase";
import CurriculumDetailClient, { TopicItem } from "./CurriculumDetailClient";

const SUBJECT_CONFIG: Record<string, { emoji: string; label: string; accent: string; subtitle: string }> = {
  "ai-data":   { emoji: "🤖", label: "AI·데이터 기초",  accent: "violet",  subtitle: "데이터 사이언스 입문" },
  "economics": { emoji: "💰", label: "경제·금융 기초",  accent: "emerald", subtitle: "경제·금융 입문" },
  "marketing": { emoji: "📈", label: "마케팅 기초",     accent: "amber",   subtitle: "디지털 마케팅 입문" },
  "backend":   { emoji: "💻", label: "백엔드 입문",     accent: "brand",   subtitle: "서버 개발 입문" },
};

const LEVEL_MAP: Record<string, string> = {
  beginner: "초급 · Lv.1", intermediate: "중급 · Lv.2", advanced: "고급 · Lv.3",
};

const SUBJECT_FIELD_MAP: Record<string, string> = {
  "ai-data": "AI · 데이터", economics: "경제 · 금융", marketing: "마케팅",
};

export default async function CurriculumPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const [profileRes, curriculaRes] = await Promise.all([
    admin.from("user_profiles").select("*").eq("id", user.id).single(),
    admin.from("curricula").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const curricula = (curriculaRes.data ?? []) as Record<string, unknown>[];
  if (curricula.length === 0) redirect("/");

  const curriculum = curricula[0];
  const profile = profileRes.data as Record<string, unknown> | null;

  const subject = (curriculum.subject as string) ?? (profile?.subject as string) ?? "ai-data";
  const conf = SUBJECT_CONFIG[subject] ?? SUBJECT_CONFIG["ai-data"];

  const topics: TopicItem[] = Array.isArray(curriculum.topics)
    ? (curriculum.topics as TopicItem[])
    : [];

  const currentTopicIndex = (profile?.current_topic_index as number) ?? 0;

  const userName =
    (profile?.name as string | null) ??
    user.user_metadata?.full_name ??
    user.email?.split("@")[0] ??
    "학습자";

  const userField = profile
    ? (SUBJECT_FIELD_MAP[profile.subject as string] ?? (profile.subject as string) ?? "학습")
    : "AI 과외";

  const weeksCount = Math.ceil(topics.length / 4);
  const courseSubtitle = `${conf.subtitle} · ${weeksCount}주 코스`;
  const courseMeta = `총 ${topics.length}회차 · ${weeksCount}주 코스`;

  return (
    <CurriculumDetailClient
      userName={userName}
      userField={userField}
      courseEmoji={conf.emoji}
      courseTitle={conf.label}
      courseSubtitle={courseSubtitle}
      courseMeta={courseMeta}
      courseAccent={conf.accent}
      currentTopicIndex={currentTopicIndex}
      topics={topics}
    />
  );
}

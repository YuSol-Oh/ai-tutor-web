import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase";

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const admin = createAdminClient();

    // 현재 토픽 인덱스 가져오기
    const { data: profile } = await admin
      .from("user_profiles")
      .select("current_topic_index")
      .eq("id", user.id)
      .single();

    if (!profile) return NextResponse.json({ error: "profile not found" }, { status: 404 });

    // 커리큘럼 가져오기
    const { data: curriculum } = await admin
      .from("curricula")
      .select("total_topics, topics")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!curriculum) return NextResponse.json({ error: "curriculum not found" }, { status: 404 });

    const nextIndex = profile.current_topic_index + 1;
    const isCompleted = nextIndex >= curriculum.total_topics;

    // 진도 업데이트
    await admin
      .from("user_profiles")
      .update({ current_topic_index: nextIndex })
      .eq("id", user.id);

    return NextResponse.json({
      nextTopicIndex: nextIndex,
      isCompleted,
      totalTopics: curriculum.total_topics,
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

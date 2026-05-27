import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase";
import Anthropic from "@anthropic-ai/sdk";

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const curriculumId = url.searchParams.get("id");
    if (!curriculumId) {
      return NextResponse.json({ error: "id 파라미터가 필요합니다" }, { status: 400 });
    }

    const admin = createAdminClient();

    // 소유권 확인 + 토픽 ID 목록 조회
    const { data: curriculum, error: fetchError } = await admin
      .from("curricula")
      .select("id, topics")
      .eq("id", curriculumId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !curriculum) {
      console.error("[curriculum DELETE] 조회 실패:", fetchError);
      return NextResponse.json({ error: "커리큘럼을 찾을 수 없어요" }, { status: 404 });
    }

    // 연관 worksheets 삭제 (topic_id 기준)
    const topics = (curriculum.topics ?? []) as Array<{ topicId: string }>;
    const topicIds = topics.map((t) => t.topicId).filter(Boolean);
    if (topicIds.length > 0) {
      const { error: wsDeleteError } = await admin
        .from("worksheets")
        .delete()
        .eq("user_id", user.id)
        .in("topic_id", topicIds);
      if (wsDeleteError) {
        console.error("[curriculum DELETE] worksheets 삭제 실패:", wsDeleteError);
      }
    }

    // 커리큘럼 삭제
    const { error: deleteError } = await admin
      .from("curricula")
      .delete()
      .eq("id", curriculumId)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("[curriculum DELETE] 삭제 실패:", deleteError);
      return NextResponse.json({ error: `[삭제 실패] ${deleteError.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    console.error("[curriculum DELETE] 예외:", e);
    return NextResponse.json({ error: `[예외] ${String(e)}` }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { data, error } = await createAdminClient()
      .from("curricula")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({
      ...data,
      topics: data.topics,
      adjustmentHistory: data.adjustment_history,
      totalTopics: data.total_topics,
      userId: data.user_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { feedback } = await req.json();
    const admin = createAdminClient();

    // ── 커리큘럼 조회 ────────────────────────────────────────────────────────────
    const { data: curriculum, error: fetchError } = await admin
      .from("curricula")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !curriculum) {
      console.error("[curriculum POST] 커리큘럼 조회 실패:", fetchError);
      return NextResponse.json(
        { error: `[커리큘럼 조회 실패] ${fetchError?.message ?? "데이터 없음"}` },
        { status: 404 }
      );
    }

    // ── Claude API 호출 ──────────────────────────────────────────────────────────
    const client = new Anthropic();
    const prompt = `아래는 현재 커리큘럼이에요.
${JSON.stringify(curriculum.topics, null, 2)}

사용자 피드백: "${feedback}"

피드백을 반영해서 커리큘럼을 수정하고, 아래 JSON 형식으로만 출력해주세요.
{
  "topics": [ ... ],
  "summary": "무엇을 어떻게 수정했는지 자연스러운 한두 문장으로",
  "changes": ["변경사항 1", "변경사항 2", "변경사항 3"]
}`;

    let message;
    try {
      message = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      });
    } catch (e) {
      console.error("[curriculum POST] Claude API 오류:", e);
      return NextResponse.json({ error: `[Claude API 오류] ${String(e)}` }, { status: 500 });
    }

    // ── 응답 파싱 (3단계 전략) ───────────────────────────────────────────────────
    const text = message.content[0].type === "text" ? message.content[0].text : "";
    let parsed: { topics: unknown[]; summary?: string; changes?: string[] } | undefined;

    try { parsed = JSON.parse(text); } catch {}

    if (!parsed) {
      const fenced = text.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
      if (fenced) { try { parsed = JSON.parse(fenced[1]); } catch {} }
    }

    if (!parsed) {
      const objMatch = text.match(/\{[\s\S]*\}/);
      if (objMatch) { try { parsed = JSON.parse(objMatch[0]); } catch {} }
    }

    if (!parsed?.topics) {
      console.error("[curriculum POST] 파싱 실패. Claude 응답:", text.slice(0, 500));
      return NextResponse.json(
        { error: `[파싱 실패] Claude 응답을 JSON으로 읽을 수 없어요. 응답: ${text.slice(0, 300)}` },
        { status: 500 }
      );
    }

    const { topics, summary: revisionSummary, changes: revisionChanges } = parsed;

    // ── DB 업데이트 ───────────────────────────────────────────────────────────────
    const adjustmentHistory = [
      ...(curriculum.adjustment_history || []),
      { date: new Date().toISOString(), reason: `사용자 피드백: ${feedback}` },
    ];

    const { data: updated, error: updateError } = await admin
      .from("curricula")
      .update({
        topics,
        total_topics: topics.length,
        updated_at: new Date().toISOString(),
        adjustment_history: adjustmentHistory,
      })
      .eq("id", curriculum.id)
      .select()
      .single();

    if (updateError) {
      console.error("[curriculum POST] DB 업데이트 실패:", updateError);
      return NextResponse.json(
        { error: `[DB 업데이트 실패] ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...updated,
      topics: updated.topics,
      adjustmentHistory: updated.adjustment_history,
      totalTopics: updated.total_topics,
      userId: updated.user_id,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
      revisionSummary: revisionSummary ?? "말씀하신 내용을 반영해서 커리큘럼을 수정했어요.",
      revisionChanges: revisionChanges ?? [],
    });
  } catch (e: unknown) {
    console.error("[curriculum POST] 예상치 못한 예외:", e);
    return NextResponse.json({ error: `[예외] ${String(e)}` }, { status: 500 });
  }
}

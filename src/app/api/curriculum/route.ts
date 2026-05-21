import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase";
import Anthropic from "@anthropic-ai/sdk";

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

    const { data: curriculum, error } = await admin
      .from("curricula")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !curriculum) return NextResponse.json({ error: "curriculum not found" }, { status: 404 });

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

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    let parsed: { topics: unknown[]; summary?: string; changes?: string[] };
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/```json\n?([\s\S]*?)\n?```/);
      if (!match) return NextResponse.json({ error: "파싱 실패: " + text }, { status: 500 });
      parsed = JSON.parse(match[1]);
    }

    const { topics, summary: revisionSummary, changes: revisionChanges } = parsed;
    if (!topics) return NextResponse.json({ error: "토픽 생성 실패" }, { status: 500 });

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

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
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
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

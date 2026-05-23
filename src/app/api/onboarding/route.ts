import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await req.json();
    const admin = createAdminClient();

    // 유저 프로필 저장
    const profile = {
      id: user.id,
      name: user.user_metadata?.full_name || user.email?.split("@")[0] || "사용자",
      subject: body.subject || "ai-data",
      purpose: body.purpose || "curiosity",
      current_level: body.currentLevel || "beginner",
      interested_topics: body.interestedTopics
        ? body.interestedTopics.split(",").map((t: string) => t.trim()).filter(Boolean)
        : [],
      learning_style: body.learningStyle || "reading",
      include_hands_on: body.includeHandsOn === "true",
      pace: body.pace || "deep",
      mode: body.mode || "curriculum",
      project_context: body.projectContext || null,
      current_topic_index: 0,
      completed_topics: [],
    };

    const { error: profileError } = await admin
      .from("user_profiles")
      .upsert(profile);

    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

    // 커리큘럼 생성
    const client = new Anthropic();
    const prompt = `당신은 AI 과외 서비스의 커리큘럼 설계 전문가입니다.
아래 유저 프로필을 분석해서 맞춤 커리큘럼을 JSON 형식으로 설계해주세요.

## 유저 프로필
- 이름: ${profile.name}
- 학습 분야: ${profile.subject}
- 학습 목적: ${profile.purpose}
- 현재 수준: ${profile.current_level}
- 관심 세부 주제: ${profile.interested_topics.join(", ") || "없음"}
- 학습 스타일: ${profile.learning_style}
- 실습 포함: ${profile.include_hands_on}
- 학습 페이스: ${profile.pace}
- 학습 모드: ${profile.mode}
${profile.project_context ? `- 프로젝트 맥락: ${profile.project_context}` : ""}

## 설계 원칙
- ${profile.current_level === "beginner" ? "핵심 개념 5~7개" : profile.current_level === "intermediate" ? "기초 확인 3~4개 + 심화 4~5개" : "심화 개념 위주 6~8개"}
- 각 토픽은 ${profile.pace === "fast" ? "15분" : "25~30분"} 분량으로

## 출력 형식 (JSON만 출력)
{
  "topics": [
    {
      "topicId": "${profile.subject}-001",
      "title": "토픽 제목",
      "description": "2~3줄 설명",
      "estimatedMinutes": 20,
      "hasHandsOn": ${profile.include_hands_on},
      "dependsOn": []
    }
  ]
}`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    let topics;
    try {
      topics = JSON.parse(text).topics;
    } catch {
      const match = text.match(/```json\n?([\s\S]*?)\n?```/);
      if (!match) return NextResponse.json({ error: "파싱 실패" }, { status: 500 });
      topics = JSON.parse(match[1]).topics;
    }

    const { error: curriculumError } = await admin
      .from("curricula")
      .insert({
        user_id: user.id,
        subject: profile.subject,
        mode: profile.mode,
        total_topics: topics.length,
        topics,
        adjustment_history: [],
      });

    if (curriculumError) return NextResponse.json({ error: curriculumError.message }, { status: 500 });

    return NextResponse.json({ userId: user.id });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

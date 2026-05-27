import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase";
import Anthropic from "@anthropic-ai/sdk";

function parseTopicsFromText(text: string) {
  // 1. Raw JSON
  try {
    const parsed = JSON.parse(text);
    if (parsed.topics) return parsed.topics;
  } catch {}

  // 2. ```json ... ``` code block
  const fenced = text.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
  if (fenced) {
    try {
      const parsed = JSON.parse(fenced[1]);
      if (parsed.topics) return parsed.topics;
    } catch {}
  }

  // 3. First { ... } JSON object in the text
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try {
      const parsed = JSON.parse(objMatch[0]);
      if (parsed.topics) return parsed.topics;
    } catch {}
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await req.json();
    const admin = createAdminClient();

    // ── 프로필 저장 ──────────────────────────────────────────────────────────
    const profile = {
      id: user.id,
      name: user.user_metadata?.full_name || user.email?.split("@")[0] || "사용자",
      subject: String(body.subject || ""),
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

    if (profileError) {
      return NextResponse.json({ error: `[프로필 저장 실패] ${profileError.message}` }, { status: 500 });
    }

    // ── 커리큘럼 생성 (Claude) ────────────────────────────────────────────────
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

## 출력 형식 (JSON만 출력, 마크다운 없이)
{
  "topics": [
    {
      "topicId": "${profile.subject.replace(/\s+/g, "-").toLowerCase()}-001",
      "title": "토픽 제목",
      "description": "2~3줄 설명",
      "estimatedMinutes": 20,
      "hasHandsOn": ${profile.include_hands_on},
      "dependsOn": []
    }
  ]
}`;

    let claudeText: string;
    try {
      const message = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      });
      claudeText = message.content[0].type === "text" ? message.content[0].text : "";
    } catch (e) {
      return NextResponse.json({ error: `[Claude API 오류] ${String(e)}` }, { status: 500 });
    }

    const topics = parseTopicsFromText(claudeText);
    if (!topics || !Array.isArray(topics) || topics.length === 0) {
      return NextResponse.json({
        error: `[파싱 실패] Claude 응답을 JSON으로 읽을 수 없어요. 응답: ${claudeText.slice(0, 300)}`,
      }, { status: 500 });
    }

    // ── 커리큘럼 제목 생성 ────────────────────────────────────────────────────
    let title = profile.subject;
    try {
      const titleMessage = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 50,
        messages: [{
          role: "user",
          content: `아래 토픽 목록을 보고 이 커리큘럼의 핵심 주제를 담은 짧은 제목을 한국어로 만들어줘. 10자 이내로, 제목만 출력해줘.\n토픽 목록: ${(topics as { title: string }[]).map((t) => t.title).join(", ")}`,
        }],
      });
      if (titleMessage.content[0].type === "text") {
        title = titleMessage.content[0].text.trim();
      }
    } catch {
      // 제목 생성 실패 시 subject 사용 (비필수)
    }

    // ── DB 저장 ───────────────────────────────────────────────────────────────
    let { error: curriculumError } = await admin
      .from("curricula")
      .insert({
        user_id: user.id,
        subject: profile.subject,
        mode: profile.mode,
        total_topics: topics.length,
        topics,
        title,
        adjustment_history: [],
      });

    // title 컬럼이 없는 경우 (DB 마이그레이션 미적용) 폴백
    if (curriculumError?.message?.includes("title")) {
      ({ error: curriculumError } = await admin
        .from("curricula")
        .insert({
          user_id: user.id,
          subject: profile.subject,
          mode: profile.mode,
          total_topics: topics.length,
          topics,
          adjustment_history: [],
        }));
    }

    if (curriculumError) {
      return NextResponse.json({ error: `[DB 저장 실패] ${curriculumError.message}` }, { status: 500 });
    }

    return NextResponse.json({ userId: user.id });
  } catch (e: unknown) {
    return NextResponse.json({ error: `[예외] ${String(e)}` }, { status: 500 });
  }
}

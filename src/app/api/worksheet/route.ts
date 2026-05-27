import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase";
import Anthropic from "@anthropic-ai/sdk";

function parseWorksheetFromText(text: string) {
  // 전략 1: ```json ... ``` 펜스드 블록 추출
  const fenceMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (fenceMatch) {
    try {
      const result = JSON.parse(fenceMatch[1]);
      console.log("[파싱 성공] 전략 1");
      return result;
    } catch (e: unknown) {
      console.log("[파싱 실패 원인]", e instanceof Error ? e.message : String(e));
    }
  }

  // 전략 2: ``` ... ``` 펜스드 블록 추출 (json 없이)
  const fenceMatch2 = text.match(/```\s*([\s\S]*?)\s*```/);
  if (fenceMatch2) {
    try {
      const result = JSON.parse(fenceMatch2[1]);
      console.log("[파싱 성공] 전략 2");
      return result;
    } catch (e: unknown) {
      console.log("[파싱 실패 원인]", e instanceof Error ? e.message : String(e));
    }
  }

  // 전략 3: 직접 JSON.parse
  try {
    const result = JSON.parse(text);
    console.log("[파싱 성공] 전략 3");
    return result;
  } catch (e: unknown) {
    console.log("[파싱 실패 원인]", e instanceof Error ? e.message : String(e));
  }

  // 전략 4: 첫 번째 { ... } 추출
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try {
      const result = JSON.parse(braceMatch[0]);
      console.log("[파싱 성공] 전략 4");
      return result;
    } catch (e: unknown) {
      console.log("[파싱 실패 원인]", e instanceof Error ? e.message : String(e));
    }
  }

  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function camelCaseWorksheet(ws: Record<string, any>) {
  return {
    ...ws,
    worksheetId: ws.id,
    topicId: ws.topic_id,
    topicTitle: ws.topic_title,
    conceptSummary: ws.concept_summary,
    realWorldExample: ws.real_world_example,
    handsOnTask: ws.hands_on_task,
    userId: ws.user_id,
    createdAt: ws.created_at,
  };
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const admin = createAdminClient();
    const today = new Date().toISOString().split("T")[0];

    // 복습 모드: 어제 학습지 반환
    const url = new URL(req.url);
    if (url.searchParams.get("review") === "true") {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      const { data: yesterdayWs } = await admin
        .from("worksheets")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", `${yesterday}T00:00:00Z`)
        .lt("created_at", `${today}T00:00:00Z`)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!yesterdayWs) return NextResponse.json({ error: "no yesterday worksheet" }, { status: 404 });

      return NextResponse.json(camelCaseWorksheet(yesterdayWs));
    }

    // 유저 프로필 조회
    const { data: profile, error: profileError } = await admin
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) return NextResponse.json({ error: "profile not found" }, { status: 404 });

    // 커리큘럼 조회
    const { data: curriculum, error: curriculumError } = await admin
      .from("curricula")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (curriculumError || !curriculum) return NextResponse.json({ error: "curriculum not found" }, { status: 404 });

    const topics = curriculum.topics as Array<{
      topicId: string;
      title: string;
      description: string;
      estimatedMinutes: number;
      hasHandsOn: boolean;
    }>;
    const currentTopic = topics[profile.current_topic_index];
    if (!currentTopic) return NextResponse.json({ error: "no more topics" }, { status: 404 });

    // 오늘 학습지 조회
    const { data: existing } = await admin
      .from("worksheets")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", `${today}T00:00:00Z`)
      .limit(1)
      .single();

    // 기존 학습지가 있고 현재 토픽과 동일하면 그대로 반환
    if (existing && existing.topic_id === currentTopic.topicId) {
      return NextResponse.json(camelCaseWorksheet(existing));
    }
    // 토픽이 달라졌으면 새로 생성 (기존 학습지 무시)

    // Claude API로 학습지 생성
    const client = new Anthropic();
    const prompt = `당신은 AI 과외 서비스의 학습지 제작 전문가입니다.
아래 정보를 바탕으로 오늘의 학습지를 JSON 형식으로 만들어주세요.

## 유저 정보
- 수준: ${profile.current_level}
- 학습 스타일: ${profile.learning_style}
- 실습 포함: ${profile.include_hands_on}

## 오늘의 토픽
- 제목: ${currentTopic.title}
- 설명: ${currentTopic.description}
- 예상 시간: ${currentTopic.estimatedMinutes}분

## 문제 유형 기준
- beginner: 객관식(multiple-choice) 위주
- intermediate: 객관식 + 단답형(short-answer) 혼합
- advanced: 단답형 + 서술형(descriptive) 위주
- 현재 수준(${profile.current_level})에 맞게 문제 2개 출제

## 힌트 설계 원칙
- hints[0]: 방향만 살짝 제시
- hints[1]: 핵심 키워드 언급
- hints[2]: 거의 답에 가까운 힌트

## conceptSummary 작성 규칙
- 마크다운 문법 사용 금지 (볼드(**), 헤더(###), 리스트(-) 등)
- 순수 텍스트로 500자 이내 작성

## 출력 형식 (JSON만 출력)
{
  "topicId": "${currentTopic.topicId}",
  "topicTitle": "${currentTopic.title}",
  "conceptSummary": "핵심 개념 한 페이지 설명",
  "realWorldExample": "실생활/업무 연결 예시",
  "questions": [
    {
      "questionId": "q1",
      "type": "multiple-choice",
      "text": "문제 내용",
      "choices": [
        {"id": "a", "text": "보기1"},
        {"id": "b", "text": "보기2"},
        {"id": "c", "text": "보기3"},
        {"id": "d", "text": "보기4"}
      ],
      "correctAnswer": "a",
      "hints": ["힌트1", "힌트2", "힌트3"],
      "explanation": "정답 해설"
    }
  ],
  "handsOnTask": ${profile.include_hands_on ? `{
    "taskId": "task-1",
    "instruction": "실습 과제",
    "expectedOutcome": "기대 결과물",
    "toolSuggestion": "추천 도구"
  }` : "null"}
}`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const worksheetData = parseWorksheetFromText(text);

    if (!worksheetData) {
      return NextResponse.json({ error: `[파싱 실패] Claude 응답: ${text.slice(0, 500)}` }, { status: 500 });
    }

    // Supabase에 저장
    const { data: worksheet, error: insertError } = await admin
      .from("worksheets")
      .insert({
        user_id: user.id,
        topic_id: worksheetData.topicId,
        topic_title: worksheetData.topicTitle,
        concept_summary: worksheetData.conceptSummary,
        real_world_example: worksheetData.realWorldExample,
        questions: worksheetData.questions,
        hands_on_task: worksheetData.handsOnTask || null,
      })
      .select()
      .single();

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
    return NextResponse.json(camelCaseWorksheet(worksheet));

  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { worksheetId, questionId, answer } = await req.json();
    const admin = createAdminClient();

    const { data: worksheet, error } = await admin
      .from("worksheets")
      .select("*")
      .eq("id", worksheetId)
      .eq("user_id", user.id)
      .single();

    if (error || !worksheet) return NextResponse.json({ error: "worksheet not found" }, { status: 404 });

    const questions = worksheet.questions as Array<{
      questionId: string;
      type: string;
      correctAnswer: string;
      explanation: string;
    }>;
    const question = questions.find((q) => q.questionId === questionId);
    if (!question) return NextResponse.json({ error: "question not found" }, { status: 404 });

    const isCorrect =
      question.type === "multiple-choice"
        ? answer.toLowerCase() === question.correctAnswer.toLowerCase()
        : answer.trim().length > 0;

    return NextResponse.json({
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
    });

  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

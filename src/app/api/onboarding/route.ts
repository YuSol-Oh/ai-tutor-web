import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import { UserProfile } from "@/types";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const profile: UserProfile = {
    userId: "user-" + Date.now(),
    createdAt: new Date().toISOString(),
    name: body.name || "사용자",
    subject: body.subject || "ai-data",
    purpose: body.purpose || "curiosity",
    currentLevel: body.currentLevel || "beginner",
    interestedTopics: body.interestedTopics
      ? body.interestedTopics.split(",").map((t: string) => t.trim()).filter(Boolean)
      : [],
    learningStyle: body.learningStyle || "reading",
    includeHandsOn: body.includeHandsOn === "true",
    pace: body.pace || "deep",
    mode: body.mode || "curriculum",
    projectContext: body.projectContext || undefined,
    currentTopicIndex: 0,
    completedTopics: [],
  };

  const dir = path.join(process.cwd(), "src/data/users");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, `${profile.userId}.json`),
    JSON.stringify(profile, null, 2)
  );

  // 커리큘럼 즉시 생성
  await generateCurriculum(profile);

  return NextResponse.json({ userId: profile.userId });
}

async function generateCurriculum(profile: UserProfile) {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic();

  const prompt = `당신은 AI 과외 서비스의 커리큘럼 설계 전문가입니다.
아래 유저 프로필을 분석해서 맞춤 커리큘럼을 JSON 형식으로 설계해주세요.

## 유저 프로필
- 이름: ${profile.name}
- 학습 분야: ${profile.subject}
- 학습 목적: ${profile.purpose}
- 현재 수준: ${profile.currentLevel}
- 관심 세부 주제: ${profile.interestedTopics.join(", ") || "없음"}
- 학습 스타일: ${profile.learningStyle}
- 실습 포함: ${profile.includeHandsOn}
- 학습 페이스: ${profile.pace}
- 학습 모드: ${profile.mode}
${profile.projectContext ? `- 프로젝트 맥락: ${profile.projectContext}` : ""}

## 설계 원칙
- ${profile.currentLevel === "beginner" ? "핵심 개념 5~7개" : profile.currentLevel === "intermediate" ? "기초 확인 3~4개 + 심화 4~5개" : "심화 개념 위주 6~8개"}
- 각 토픽은 ${profile.pace === "fast" ? "15분" : "25~30분"} 분량으로

## 출력 형식 (JSON만 출력)
{
  "topics": [
    {
      "topicId": "${profile.subject}-001",
      "title": "토픽 제목",
      "description": "2~3줄 설명",
      "estimatedMinutes": 20,
      "hasHandsOn": ${profile.includeHandsOn},
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
    topics = JSON.parse(match![1]).topics;
  }

  const curriculum = {
    curriculumId: `curriculum-${Date.now()}`,
    userId: profile.userId,
    subject: profile.subject,
    mode: profile.mode,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totalTopics: topics.length,
    topics,
    adjustmentHistory: [],
  };

  const dir = path.join(process.cwd(), "src/data/curricula");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, `${profile.userId}-${profile.subject}.json`),
    JSON.stringify(curriculum, null, 2)
  );
}

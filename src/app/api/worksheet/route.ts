import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import { UserProfile, Curriculum, Worksheet } from "@/types";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const today = new Date().toISOString().split("T")[0];
  const worksheetDir = path.join(process.cwd(), "src/data/worksheets");
  if (!fs.existsSync(worksheetDir)) fs.mkdirSync(worksheetDir, { recursive: true });

  const existingFile = path.join(worksheetDir, `${userId}-${today}.json`);
  if (fs.existsSync(existingFile)) {
    return NextResponse.json(JSON.parse(fs.readFileSync(existingFile, "utf-8")));
  }

  const userDir = path.join(process.cwd(), "src/data/users");
  const userFile = fs.readdirSync(userDir).find((f) => f === `${userId}.json`);
  if (!userFile) return NextResponse.json({ error: "user not found" }, { status: 404 });
  const profile: UserProfile = JSON.parse(fs.readFileSync(path.join(userDir, userFile), "utf-8"));

  const curriculumDir = path.join(process.cwd(), "src/data/curricula");
  const curriculumFile = fs.readdirSync(curriculumDir).find((f) => f.startsWith(userId));
  if (!curriculumFile) return NextResponse.json({ error: "curriculum not found" }, { status: 404 });
  const curriculum: Curriculum = JSON.parse(fs.readFileSync(path.join(curriculumDir, curriculumFile), "utf-8"));

  const currentTopic = curriculum.topics[profile.currentTopicIndex];
  if (!currentTopic) return NextResponse.json({ error: "no more topics" }, { status: 404 });

  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic();

  const prompt = `당신은 AI 과외 서비스의 학습지 제작 전문가입니다.
아래 정보를 바탕으로 오늘의 학습지를 JSON 형식으로 만들어주세요.

## 유저 정보
- 수준: ${profile.currentLevel}
- 학습 스타일: ${profile.learningStyle}
- 실습 포함: ${profile.includeHandsOn}

## 오늘의 토픽
- 제목: ${currentTopic.title}
- 설명: ${currentTopic.description}
- 예상 시간: ${currentTopic.estimatedMinutes}분

## 문제 유형 기준
- beginner: 객관식(multiple-choice) 위주
- intermediate: 객관식 + 단답형(short-answer) 혼합
- advanced: 단답형 + 서술형(descriptive) 위주
- 현재 수준(${profile.currentLevel})에 맞게 문제 2개 출제

## 힌트 설계 원칙
- hints[0]: 방향만 살짝 제시 (추상적)
- hints[1]: 핵심 키워드 언급
- hints[2]: 거의 답에 가까운 힌트

## 출력 형식 (JSON만 출력, 다른 텍스트 없이)
{
  "worksheetId": "ws-${Date.now()}",
  "userId": "${userId}",
  "topicId": "${currentTopic.topicId}",
  "topicTitle": "${currentTopic.title}",
  "createdAt": "${new Date().toISOString()}",
  "conceptSummary": "핵심 개념을 3~5줄로 압축 설명",
  "realWorldExample": "실생활이나 업무에서의 연결 예시",
  "questions": [
    {
      "questionId": "q1",
      "type": "multiple-choice 또는 short-answer 또는 descriptive",
      "text": "문제 내용",
      "choices": [
        {"id": "a", "text": "보기1"},
        {"id": "b", "text": "보기2"},
        {"id": "c", "text": "보기3"},
        {"id": "d", "text": "보기4"}
      ],
      "correctAnswer": "a (객관식) 또는 모범답안 텍스트",
      "hints": ["힌트1(방향)", "힌트2(키워드)", "힌트3(거의답)"],
      "explanation": "왜 이게 정답인지 원리까지 설명"
    }
  ],
  "handsOnTask": ${profile.includeHandsOn ? `{
    "taskId": "task-1",
    "instruction": "직접 해볼 수 있는 실습 과제",
    "expectedOutcome": "완성했을 때 어떤 결과가 나와야 하는지",
    "toolSuggestion": "사용할 도구 제안"
  }` : "null"}
}`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 3000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  let worksheet: Worksheet;
  try {
    worksheet = JSON.parse(text);
  } catch {
    const match = text.match(/```json\n?([\s\S]*?)\n?```/);
    worksheet = JSON.parse(match![1]);
  }

  fs.writeFileSync(existingFile, JSON.stringify(worksheet, null, 2));

  const updatedProfile = { ...profile, currentTopicIndex: profile.currentTopicIndex };
  fs.writeFileSync(path.join(userDir, `${userId}.json`), JSON.stringify(updatedProfile, null, 2));

  return NextResponse.json(worksheet);
}

export async function POST(req: NextRequest) {
  const { userId, questionId, answer } = await req.json();

  const today = new Date().toISOString().split("T")[0];
  const worksheetPath = path.join(process.cwd(), "src/data/worksheets", `${userId}-${today}.json`);
  if (!fs.existsSync(worksheetPath)) {
    return NextResponse.json({ error: "worksheet not found" }, { status: 404 });
  }

  const worksheet: Worksheet = JSON.parse(fs.readFileSync(worksheetPath, "utf-8"));
  const question = worksheet.questions.find((q) => q.questionId === questionId);
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
}

import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import { Curriculum } from "@/types";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  const dir = path.join(process.cwd(), "src/data/curricula");
  const files = fs.readdirSync(dir).filter((f) => f.startsWith(userId!));
  if (files.length === 0) return NextResponse.json({ error: "not found" }, { status: 404 });
  const curriculum = JSON.parse(fs.readFileSync(path.join(dir, files[0]), "utf-8"));
  return NextResponse.json(curriculum);
}

export async function POST(req: NextRequest) {
  const { userId, feedback } = await req.json();

  const dir = path.join(process.cwd(), "src/data/curricula");
  const files = fs.readdirSync(dir).filter((f) => f.startsWith(userId));
  const curriculumPath = path.join(dir, files[0]);
  const curriculum: Curriculum = JSON.parse(fs.readFileSync(curriculumPath, "utf-8"));

  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic();

  const prompt = `아래는 현재 커리큘럼이에요.
${JSON.stringify(curriculum.topics, null, 2)}

사용자 피드백: "${feedback}"

피드백을 반영해서 커리큘럼을 수정하고, 아래 형식으로 전체 토픽 목록을 JSON만 출력해주세요.
{
  "topics": [ ... ]
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

  curriculum.topics = topics;
  curriculum.totalTopics = topics.length;
  curriculum.updatedAt = new Date().toISOString();
  curriculum.adjustmentHistory.push({
    date: new Date().toISOString(),
    reason: `사용자 피드백: ${feedback}`,
  });

  fs.writeFileSync(curriculumPath, JSON.stringify(curriculum, null, 2));
  return NextResponse.json(curriculum);
}

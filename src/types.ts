// ================================================
// 1. 유저 프로필 (초기 설문 결과)
// ================================================

export type LearningPurpose =
  | "project"        // 진행 중인 프로젝트 대응
  | "career"         // 커리어 전환
  | "curiosity"      // 순수한 지적 호기심
  | "upskill";       // 업무 역량 강화

export type KnowledgeLevel =
  | "beginner"       // 처음 배우는 수준
  | "intermediate"   // 기초는 알고 있음
  | "advanced";      // 심화가 필요한 수준

export type LearningStyle =
  | "reading"        // 읽기 중심
  | "problem"        // 문제 풀이 중심
  | "hands-on";      // 실습 중심

export type LearningPace =
  | "fast"           // 빠르게 훑기
  | "deep";          // 깊게 이해하기

export type Subject = string;

export type LearningMode =
  | "curriculum"     // 처음부터 체계적으로
  | "project";       // 지금 당장 필요한 것만

export interface UserProfile {
  userId: string;
  createdAt: string;           // ISO 날짜 문자열
  name: string;

  // 설문 결과
  subject: Subject;
  purpose: LearningPurpose;
  currentLevel: KnowledgeLevel;
  interestedTopics: string[];  // 특히 더 파고 싶은 세부 주제
  learningStyle: LearningStyle;
  includeHandsOn: boolean;     // 실습 포함 여부
  pace: LearningPace;
  mode: LearningMode;

  // 프로젝트 모드일 때
  projectContext?: string;     // "지금 SQL 써야 하는 프로젝트가 생겼어" 같은 맥락

  // 학습 진행 현황
  currentTopicIndex: number;   // 커리큘럼에서 현재 위치
  completedTopics: string[];   // 완료한 토픽 ID 목록
}

// ================================================
// 2. 커리큘럼
// ================================================

export interface Topic {
  topicId: string;
  title: string;
  description: string;
  estimatedMinutes: number;    // 예상 소요 시간
  hasHandsOn: boolean;         // 실습 포함 여부
  dependsOn: string[];         // 선행 토픽 ID (없으면 빈 배열)
}

export interface Curriculum {
  curriculumId: string;
  userId: string;
  subject: Subject;
  mode: LearningMode;
  createdAt: string;
  updatedAt: string;

  totalTopics: number;
  topics: Topic[];

  // 적응형 조정 이력
  adjustmentHistory: {
    date: string;
    reason: string;            // "오답률 높음 - 개념X 복습 삽입" 등
  }[];
}

// ================================================
// 3. 학습지 (오늘의 세션)
// ================================================

export type QuestionType =
  | "multiple-choice"          // 객관식
  | "short-answer"             // 단답형
  | "descriptive";             // 서술형

export interface Choice {
  id: string;                  // "a" | "b" | "c" | "d"
  text: string;
}

export interface Question {
  questionId: string;
  type: QuestionType;
  text: string;
  choices?: Choice[];          // 객관식일 때만
  correctAnswer: string;       // 객관식: "a" / 단답형·서술형: 모범답안
  hints: [string, string, string];  // 힌트 3개 고정
  explanation: string;         // 정답 시 보여줄 풀이 해설
}

export interface HandsOnTask {
  taskId: string;
  instruction: string;         // 실습 지시문
  expectedOutcome: string;     // 기대 결과물 설명
  toolSuggestion?: string;     // "Google Colab 사용 권장" 등
}

export interface Worksheet {
  worksheetId: string;
  userId: string;
  topicId: string;
  topicTitle: string;
  createdAt: string;

  // 개념 파트
  conceptSummary: string;      // 핵심 개념 요약
  realWorldExample: string;    // 실생활·업무 연결 예시

  // 문제 파트
  questions: Question[];       // 1~3개

  // 실습 파트 (선택)
  handsOnTask?: HandsOnTask;
}

// ================================================
// 4. 학습 결과 (세션 완료 후 저장)
// ================================================

export type AnswerResult = "correct" | "incorrect" | "skipped";

export interface QuestionAttempt {
  questionId: string;
  result: AnswerResult;
  hintsUsed: number;           // 0~3
  userAnswer: string;
}

export interface SessionResult {
  sessionId: string;
  userId: string;
  worksheetId: string;
  topicId: string;
  completedAt: string;

  attempts: QuestionAttempt[];

  // 집계
  correctCount: number;
  totalQuestions: number;
  scorePercent: number;        // 0~100

  // 다음 커리큘럼 조정에 쓰이는 신호
  needsReview: boolean;        // scorePercent < 60이면 true
}
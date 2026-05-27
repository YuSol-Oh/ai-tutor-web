"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Worksheet, Question, HandsOnTask } from "@/types";

// ─── Extended API type ────────────────────────────────────────────────────────

interface WorksheetData extends Worksheet {
  id: string;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IBack(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M15 18l-6-6 6-6"/></svg>;
}
function ISpark(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/></svg>;
}
function IBulb(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/></svg>;
}
function ICheck(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12.5l4.5 4.5L19 7"/></svg>;
}
function IX(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 6l12 12M18 6L6 18"/></svg>;
}
function IArrow(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
}
function IChevron(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 9l6 6 6-6"/></svg>;
}
function IClip(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 12.5l-8.5 8.5a5.5 5.5 0 1 1-7.8-7.8L13 5a3.7 3.7 0 0 1 5.2 5.2l-8.6 8.6a1.9 1.9 0 1 1-2.7-2.7l7.7-7.7"/></svg>;
}

// ─── Atoms ────────────────────────────────────────────────────────────────────

type BadgeTone = "ink" | "brand" | "amber" | "emerald" | "rose" | "violet";

function Badge({ tone = "ink", children }: { tone?: BadgeTone; children: React.ReactNode }) {
  const tones: Record<BadgeTone, string> = {
    ink:     "bg-ink-100 text-ink-700 border-ink-200",
    brand:   "bg-brand-50 text-brand-700 border-brand-100",
    amber:   "bg-amber-50 text-amber-700 border-amber-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rose:    "bg-rose-50 text-rose-700 border-rose-200",
    violet:  "bg-violet-50 text-violet-700 border-violet-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${tones[tone]}`}>
      {children}
    </span>
  );
}

function Avatar({ size = 28 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size }} className="rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shadow-soft shrink-0">
      <ISpark className="w-3.5 h-3.5" />
    </div>
  );
}

function Skel({ w = "100%", h = 12, className = "" }: { w?: string | number; h?: number; className?: string }) {
  return (
    <div
      className={`rounded-md bg-ink-100 animate-pulse-soft ${className}`}
      style={{ width: typeof w === "number" ? `${w}px` : w, height: h }}
    />
  );
}

function typeLabel(type: Question["type"]) {
  return type === "multiple-choice" ? "객관식" : type === "short-answer" ? "단답형" : "서술형";
}

// ─── Skip Modal ───────────────────────────────────────────────────────────────

function SkipModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-card p-7 max-w-sm w-full mx-4">
        <h2 className="text-[17px] font-bold text-ink-900">오늘 학습을 건너뛸까요?</h2>
        <p className="mt-2 text-[13.5px] text-ink-600 leading-relaxed">
          건너뛰면 다음 토픽으로 넘어가고, 오늘 학습 기회는 지나가요. 계속할까요?
        </p>
        <div className="mt-6 flex gap-2.5">
          <button
            onClick={onCancel}
            className="flex-1 h-11 rounded-xl border border-ink-200 hover:bg-ink-50 text-[13.5px] font-medium text-ink-700 transition whitespace-nowrap"
          >
            계속 학습하기
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-11 rounded-xl bg-ink-900 hover:bg-ink-700 text-white text-[13.5px] font-semibold transition whitespace-nowrap"
          >
            건너뛰기
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Header ──────────────────────────────────────────────────────────────────

function Header({
  worksheet, loading, answeredCount, isReview, onSkip,
}: {
  worksheet: WorksheetData | null;
  loading: boolean;
  answeredCount: number;
  isReview: boolean;
  onSkip: () => void;
}) {
  const totalQ = worksheet?.questions.length ?? 0;
  const progressPct = totalQ > 0 ? Math.round((answeredCount / totalQ) * 100) : 0;

  return (
    <header className="shrink-0 border-b border-ink-200 bg-white/90 backdrop-blur z-10">
      <div className="flex items-center gap-3 px-8 h-16">
        <a href="/" className="w-9 h-9 rounded-full hover:bg-ink-100 text-ink-700 flex items-center justify-center">
          <IBack className="w-5 h-5" />
        </a>
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[15.5px] font-semibold text-ink-900 truncate">
                {loading ? "학습지 준비 중..." : (worksheet?.topicTitle ?? "오늘의 학습")}
              </span>
              {!loading && (
                isReview
                  ? <Badge tone="violet">복습 모드</Badge>
                  : <Badge tone="brand">학습 중</Badge>
              )}
            </div>
            <div className="text-[12px] text-ink-500 mt-0.5 truncate">
              {loading ? "AI가 맞춤 문제를 만들고 있어요" : `문제 ${totalQ}개 · 예상 학습 시간 ${worksheet?.questions.length ? worksheet.questions.length * 5 : 20}분`}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!isReview && (
            <button
              onClick={onSkip}
              className="h-9 px-3 rounded-lg text-[13px] font-medium text-ink-700 hover:bg-ink-100 transition whitespace-nowrap shrink-0"
            >
              건너뛰기
            </button>
          )}
          <div className="flex items-center gap-2 pl-3 border-l border-ink-200 h-8 shrink-0">
            <Avatar size={28} />
            <span className="text-[12.5px] text-ink-700 font-medium whitespace-nowrap">AI 튜터</span>
          </div>
        </div>
      </div>
      <div className="px-8 pb-3">
        {loading ? (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-ink-100 overflow-hidden">
              <div className="h-full w-[64%] bg-gradient-to-r from-brand-500 to-brand-700 rounded-full animate-pulse-soft" />
            </div>
            <span className="text-[12px] font-medium text-ink-500 whitespace-nowrap shrink-0 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse shrink-0" />
              AI가 학습지를 준비하는 중이에요…
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-ink-100 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-brand-700 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(progressPct, 8)}%` }}
              />
            </div>
            <span className="text-[12px] font-medium text-ink-500 tabular-nums whitespace-nowrap shrink-0">
              진행률 {progressPct}% · 문제 {answeredCount}/{totalQ}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}

// ─── Left Panel ──────────────────────────────────────────────────────────────

function LeftPanelSkeleton() {
  return (
    <div className="px-9 py-8 space-y-6">
      <div className="space-y-3">
        <Skel w={80} h={12} />
        <Skel w="75%" h={28} />
        <Skel w="55%" h={14} />
      </div>
      <div className="space-y-3 mt-8">
        <Skel w={100} h={16} />
        {[90, 82, 88, 76].map((w, i) => <Skel key={i} w={`${w}%`} h={13} />)}
      </div>
      <div className="rounded-2xl bg-brand-50 border border-brand-100 p-5 space-y-2">
        <Skel w={120} h={14} />
        {[88, 72].map((w, i) => <Skel key={i} w={`${w}%`} h={12} />)}
      </div>
    </div>
  );
}

function LeftPanel({ worksheet }: { worksheet: WorksheetData | null }) {
  return (
    <aside className="w-[40%] shrink-0 border-r border-ink-200 bg-white overflow-y-auto">
      {!worksheet ? (
        <LeftPanelSkeleton />
      ) : (
        <div className="px-9 py-8">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-brand-600 whitespace-nowrap">
            <span className="tracking-wide uppercase">오늘의 학습</span>
          </div>
          <h1 className="mt-3 text-[28px] leading-tight font-bold text-ink-900 tracking-tight">
            {worksheet.topicTitle}
          </h1>

          <section className="mt-8">
            <h2 className="text-[15px] font-bold text-ink-900 flex items-center gap-2 whitespace-nowrap">
              <span className="w-1 h-4 rounded-full bg-brand-600 shrink-0" />
              <span>핵심 개념</span>
            </h2>
            <div className="mt-3 prose prose-sm max-w-none text-ink-700 [&_strong]:text-ink-900 [&_code]:text-brand-700 [&_code]:bg-brand-50 [&_code]:px-1 [&_code]:rounded">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{worksheet.conceptSummary}</ReactMarkdown>
            </div>
          </section>

          <section className="mt-8">
            <div className="rounded-2xl bg-brand-50 border border-brand-100 p-5">
              <div className="flex items-center gap-2 text-[12px] font-semibold text-brand-700 whitespace-nowrap">
                <span className="w-5 h-5 rounded-md bg-brand-600 text-white flex items-center justify-center text-[11px] shrink-0">예</span>
                <span>실무 예시</span>
              </div>
              <div className="mt-2 text-[13px] text-brand-900/80 leading-relaxed prose prose-sm max-w-none [&_pre]:bg-white/80 [&_pre]:border [&_pre]:border-brand-100 [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:text-[12px] [&_code]:text-brand-700 [&_strong]:text-brand-900">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{worksheet.realWorldExample}</ReactMarkdown>
              </div>
            </div>
          </section>
        </div>
      )}
    </aside>
  );
}

// ─── Loading Right ────────────────────────────────────────────────────────────

function LoadingRight() {
  return (
    <main className="flex-1 bg-ink-50 overflow-y-auto">
      <div className="px-10 py-8 space-y-6">
        <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-soft">
          <div className="flex items-start gap-3">
            <div className="relative">
              <Avatar size={36} />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[14px] font-semibold text-ink-900 whitespace-nowrap">AI 튜터</span>
                <Badge tone="brand">생성 중</Badge>
              </div>
              <p className="mt-1 text-[13px] text-ink-600 leading-relaxed">
                학습 내용을 바탕으로 <b className="text-ink-900">맞춤 문제</b>와 <b className="text-ink-900">실습 과제</b>를 준비하고 있어요.
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  ["핵심 개념 정리", true],
                  ["문제 생성", "active"],
                  ["실습 과제 구성", false],
                ].map(([t, s]) => (
                  <div key={String(t)} className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-[12px] min-w-0
                    ${s === true ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : s === "active" ? "bg-brand-50 border-brand-200 text-brand-700"
                      : "bg-white border-ink-200 text-ink-400"}`}
                  >
                    {s === true
                      ? <ICheck className="w-3.5 h-3.5 shrink-0" />
                      : s === "active"
                      ? <span className="w-3.5 h-3.5 rounded-full border-2 border-brand-500 border-t-transparent animate-spin shrink-0" />
                      : <span className="w-3.5 h-3.5 rounded-full border-2 border-ink-200 shrink-0" />
                    }
                    <span className="font-medium truncate">{String(t)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-ink-200 bg-white p-6 shadow-soft">
          <div className="flex items-center gap-2">
            <Skel w={64} h={20} /><Skel w={56} h={20} />
          </div>
          <div className="mt-5 space-y-2.5">
            <Skel w="92%" h={14} /><Skel w="78%" h={14} />
          </div>
          <div className="mt-6 space-y-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl border border-ink-200">
                <div className="w-6 h-6 rounded-full bg-ink-100 shrink-0" />
                <Skel w={`${60 + (i % 3) * 10}%`} h={12} />
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between">
            <Skel w={100} h={32} /><Skel w={120} h={36} />
          </div>
        </div>

        <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <Skel w={180} h={16} /><Skel w={20} h={16} />
          </div>
          <div className="mt-3 space-y-2">
            <Skel w="90%" h={12} /><Skel w="60%" h={12} />
          </div>
        </div>

        <div className="text-center text-[12px] text-ink-400 pb-2">
          평균 8–12초 정도 소요돼요. 잠시만 기다려주세요.
        </div>
      </div>
    </main>
  );
}

// ─── MCQ Option ───────────────────────────────────────────────────────────────

function MCOption({
  opt, qState, selected, onSelect, correctAnswer,
}: {
  opt: { id: string; text: string };
  qState: "idle" | "answered";
  selected: string;
  onSelect: (id: string) => void;
  correctAnswer: string;
}) {
  const isSelected = selected === opt.id;
  const isCorrect  = opt.id === correctAnswer;

  let cls      = "border-ink-200 hover:border-brand-300 hover:bg-brand-50/40";
  let badgeCls = "bg-ink-100 text-ink-700";

  if (qState === "idle" && isSelected) {
    cls      = "border-brand-500 bg-brand-50 ring-2 ring-brand-100";
    badgeCls = "bg-brand-600 text-white";
  } else if (qState === "answered") {
    if (isCorrect) {
      cls      = "border-emerald-300 bg-emerald-50";
      badgeCls = "bg-emerald-600 text-white";
    } else if (isSelected) {
      cls      = "border-rose-300 bg-rose-50";
      badgeCls = "bg-rose-600 text-white";
    } else {
      cls = "border-ink-200 opacity-70";
    }
  }

  return (
    <button
      onClick={() => qState === "idle" && onSelect(opt.id)}
      disabled={qState === "answered"}
      className={`w-full text-left flex items-start gap-3.5 p-4 rounded-xl border-2 transition-all ${cls}`}
    >
      <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold uppercase ${badgeCls}`}>
        {opt.id}
      </span>
      <span className="text-[14px] text-ink-900 leading-relaxed pt-0.5">{opt.text}</span>
      {qState === "answered" && isCorrect && <ICheck className="ml-auto w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
      {qState === "answered" && isSelected && !isCorrect && <IX className="ml-auto w-5 h-5 text-rose-600 shrink-0 mt-0.5" />}
    </button>
  );
}

// ─── Question Card ────────────────────────────────────────────────────────────

function QuestionCard({
  question, index, total, worksheetId, onAnswered,
}: {
  question: Question;
  index: number;
  total: number;
  worksheetId: string;
  onAnswered: () => void;
}) {
  const [selected, setSelected]   = useState("");
  const [textAns, setTextAns]     = useState("");
  const [qState, setQState]       = useState<"idle" | "answered">("idle");
  const [hintsUsed, setHintsUsed] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ isCorrect: boolean; correctAnswer: string; explanation: string } | null>(null);

  const answer = question.type === "multiple-choice" ? selected : textAns;
  const canSubmit = answer.trim().length > 0 && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    const res = await fetch("/api/worksheet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ worksheetId, questionId: question.questionId, answer }),
    });
    const data = await res.json();
    setResult(data);
    setQState("answered");
    setSubmitting(false);
    onAnswered();
  }

  function handleRetry() {
    setQState("idle");
    setSelected("");
    setTextAns("");
    setResult(null);
  }

  function showHint() {
    if (hintsUsed < 3) setHintsUsed((h) => h + 1);
  }

  return (
    <article className="rounded-2xl border border-ink-200 bg-white p-7 shadow-soft">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600 text-white text-[13px] font-bold shrink-0">
            {index + 1}
          </span>
          <Badge tone="brand">{typeLabel(question.type)}</Badge>
        </div>
        <span className="text-[12px] text-ink-400 font-medium whitespace-nowrap">문제 {index + 1} / {total}</span>
      </div>

      <h3 className="mt-5 text-[18px] font-bold text-ink-900 leading-snug tracking-tight">
        {question.text}
      </h3>

      {hintsUsed > 0 && (
        <div className="mt-5 space-y-2">
          {question.hints.slice(0, hintsUsed).map((hint, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <IBulb className="w-4 h-4" />
              </div>
              <div className="flex-1 rounded-2xl rounded-tl-md bg-amber-50 border border-amber-200 px-4 py-3">
                <div className="text-[11.5px] font-bold text-amber-800 uppercase tracking-wide">힌트 {i + 1}</div>
                <p className="mt-1 text-[13.5px] text-amber-900 leading-relaxed">{hint}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {question.type === "multiple-choice" && question.choices && (
        <div className="mt-5 space-y-2.5">
          {question.choices.map((o) => (
            <MCOption
              key={o.id}
              opt={o}
              qState={qState}
              selected={selected}
              onSelect={setSelected}
              correctAnswer={result?.correctAnswer ?? question.correctAnswer}
            />
          ))}
        </div>
      )}

      {question.type !== "multiple-choice" && qState === "idle" && (
        <div className="mt-5 rounded-xl border border-ink-200 bg-ink-50 p-3 focus-within:bg-white focus-within:border-brand-400 transition">
          <textarea
            rows={4}
            value={textAns}
            onChange={(e) => setTextAns(e.target.value)}
            placeholder="답을 입력해주세요..."
            className="w-full bg-transparent outline-none text-[14px] text-ink-900 placeholder:text-ink-400 resize-none leading-relaxed"
          />
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          onClick={showHint}
          disabled={hintsUsed >= 3 || qState === "answered"}
          className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-lg border border-ink-200 hover:border-amber-300 hover:bg-amber-50 text-[13px] font-medium text-ink-700 transition whitespace-nowrap shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>💡</span>
          <span>힌트</span>
          <span className="text-amber-700 font-bold">{hintsUsed}/3</span>
        </button>

        {qState === "idle" ? (
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`h-10 px-5 rounded-lg text-[13.5px] font-semibold inline-flex items-center gap-2 transition whitespace-nowrap shrink-0 ${
              canSubmit
                ? "bg-brand-600 hover:bg-brand-700 text-white shadow-soft"
                : "bg-ink-100 text-ink-400 cursor-not-allowed"
            }`}
          >
            {submitting ? "확인 중..." : <><span>제출하기</span> <IArrow className="w-4 h-4" /></>}
          </button>
        ) : (
          <button
            onClick={handleRetry}
            className="h-10 px-4 rounded-lg border border-ink-200 hover:bg-ink-50 text-[13px] font-medium text-ink-700 whitespace-nowrap shrink-0"
          >
            다시 풀기
          </button>
        )}
      </div>

      {qState === "answered" && result && (
        <div className={`mt-5 rounded-xl border p-4 ${
          result.isCorrect ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"
        }`}>
          <div className={`flex items-center gap-2 font-bold text-[14px] ${result.isCorrect ? "text-emerald-700" : "text-rose-700"}`}>
            {result.isCorrect ? <><ICheck className="w-4 h-4" /> 정답이에요! 🎉</> : <><IX className="w-4 h-4" /> 아쉬워요!</>}
          </div>
          <p className={`mt-1.5 text-[13.5px] leading-relaxed ${result.isCorrect ? "text-emerald-900/85" : "text-rose-900/85"}`}>
            {result.explanation}
          </p>
        </div>
      )}
    </article>
  );
}

// ─── Collapsed Question Preview ────────────────────────────────────────────────

function CollapsedQuestion({ question, index, total }: { question: Question; index: number; total: number }) {
  return (
    <article className="rounded-2xl border border-ink-200 bg-white px-6 py-4 shadow-soft flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-ink-100 text-ink-700 text-[13px] font-bold shrink-0">
          {index + 1}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[14px] font-semibold text-ink-900 truncate">{question.text}</span>
            <Badge tone="ink">{typeLabel(question.type)}</Badge>
          </div>
          <div className="text-[12px] text-ink-500 mt-0.5">문제 {index + 1} / {total}</div>
        </div>
      </div>
    </article>
  );
}

// ─── Task Accordion ───────────────────────────────────────────────────────────

function TaskAccordion({ task }: { task: HandsOnTask }) {
  const [open, setOpen]   = useState(true);
  const [done, setDone]   = useState(false);
  const [answer, setAnswer] = useState("");

  return (
    <article className="rounded-2xl border border-ink-200 bg-white shadow-soft overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-6 py-4 text-left hover:bg-ink-50/60"
      >
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-indigo-50 text-brand-700 flex items-center justify-center shrink-0">
            <IClip className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[15px] font-bold text-ink-900 whitespace-nowrap">실습 과제</span>
              <Badge tone="amber">선택</Badge>
            </div>
            <div className="text-[12px] text-ink-500">직접 해볼 때 가장 잘 기억돼요</div>
          </div>
        </div>
        <IChevron className={`w-5 h-5 text-ink-400 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="px-6 pb-6">
          <p className="text-[14px] text-ink-700 leading-relaxed">{task.instruction}</p>

          {task.expectedOutcome && (
            <div className="mt-3 rounded-lg border border-ink-200 bg-ink-50 px-4 py-3 text-[13px] text-ink-600">
              <span className="font-semibold text-ink-900">기대 결과물:</span> {task.expectedOutcome}
            </div>
          )}

          {task.toolSuggestion && (
            <p className="mt-2 text-[12.5px] text-brand-700">🔧 추천 도구: {task.toolSuggestion}</p>
          )}

          <label className="mt-4 flex items-center gap-2.5 cursor-pointer select-none">
            <input type="checkbox" checked={done} onChange={(e) => setDone(e.target.checked)} className="sr-only peer" />
            <span className="w-5 h-5 rounded-md border-2 border-ink-300 peer-checked:bg-brand-600 peer-checked:border-brand-600 flex items-center justify-center text-white transition">
              {done && <ICheck className="w-3 h-3" />}
            </span>
            <span className={`text-[13.5px] ${done ? "text-ink-900 font-medium" : "text-ink-700"}`}>과제를 완료했어요</span>
          </label>

          <div className="mt-4 rounded-xl border border-ink-200 bg-ink-50 p-3 focus-within:bg-white focus-within:border-brand-400 transition">
            <textarea
              rows={5}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="여기에 결과물을 적어주세요..."
              className="w-full bg-transparent outline-none text-[13.5px] font-mono text-ink-900 leading-relaxed placeholder:text-ink-400 resize-none"
            />
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-[12px] text-ink-400">AI가 피드백을 드릴 거예요 · 약 3–5초 소요</span>
            <button className="h-9 px-4 rounded-lg bg-ink-900 hover:bg-ink-700 text-white text-[13px] font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition">
              <ISpark className="w-3.5 h-3.5" /> AI 피드백 받기
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

// ─── Complete Right Panel ─────────────────────────────────────────────────────

function CompleteRight({
  worksheet, onComplete, onAnswered, isReview,
}: {
  worksheet: WorksheetData;
  onComplete: () => void;
  onAnswered: () => void;
  isReview: boolean;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const questions = worksheet.questions;

  function handleQuestionAnswered(i: number) {
    onAnswered();
    if (i === activeIdx && activeIdx < questions.length - 1) {
      setActiveIdx(i + 1);
    }
  }

  return (
    <main className="flex-1 bg-ink-50 overflow-y-auto">
      <div className="px-10 py-8 space-y-6">
        {questions.map((q, i) => (
          i <= activeIdx ? (
            <QuestionCard
              key={q.questionId}
              question={q}
              index={i}
              total={questions.length}
              worksheetId={worksheet.id}
              onAnswered={() => handleQuestionAnswered(i)}
            />
          ) : (
            <CollapsedQuestion
              key={q.questionId}
              question={q}
              index={i}
              total={questions.length}
            />
          )
        ))}

        {worksheet.handsOnTask && (
          <TaskAccordion task={worksheet.handsOnTask} />
        )}

        <div className="pt-2 pb-1 flex items-center justify-between gap-3">
          <div className="text-[13px] text-ink-500 min-w-0">
            <span className="text-ink-900 font-semibold">잘하고 있어요!</span>
            {isReview
              ? " 복습을 완료하면 홈으로 돌아가요."
              : " 오늘 학습을 완료하면 다음 토픽으로 넘어가요."}
          </div>
          <button
            onClick={onComplete}
            className="h-12 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-[14.5px] font-semibold inline-flex items-center gap-2 shadow-soft transition active:scale-[0.99] whitespace-nowrap shrink-0"
          >
            <ICheck className="w-4 h-4" />
            {isReview ? "복습 완료!" : "오늘 학습 완료!"}
            <IArrow className="w-4 h-4" />
          </button>
        </div>
      </div>
    </main>
  );
}

// ─── Done Screen ──────────────────────────────────────────────────────────────

function DoneScreen({ onHome }: { onHome: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50">
      <div className="text-center px-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mx-auto mb-6 shadow-soft">
          <ICheck className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-[28px] font-bold text-ink-900 tracking-tight">오늘 학습 완료!</h1>
        <p className="mt-2 text-ink-500 text-[15px]">수고하셨어요. 꾸준히 하면 반드시 성장해요!</p>
        <button
          onClick={onHome}
          className="mt-8 h-12 px-8 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-[15px] font-semibold inline-flex items-center gap-2 shadow-soft transition"
        >
          홈으로 돌아가기 <IArrow className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Worksheet Content (inner, uses useSearchParams) ─────────────────────────

function WorksheetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isReview = searchParams.get("review") === "true";

  const [worksheet, setWorksheet] = useState<WorksheetData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [done, setDone]           = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [showSkipModal, setShowSkipModal] = useState(false);

  useEffect(() => {
    const url = isReview ? "/api/worksheet?review=true" : "/api/worksheet";
    fetch(url)
      .then(async (r) => {
        if (!r.ok) {
          const data = await r.json().catch(() => ({})) as { error?: string };
          throw new Error(data.error || `서버 오류 (${r.status})`);
        }
        return r.json();
      })
      .then((data: WorksheetData) => {
        setWorksheet(data);
        setLoading(false);
      })
      .catch((e: Error) => {
        setError(e.message);
        setLoading(false);
      });
  }, [isReview]);

  async function handleComplete() {
    if (isReview) {
      router.push("/");
    } else {
      await fetch("/api/complete", { method: "POST" });
      setDone(true);
    }
  }

  async function handleSkipConfirm() {
    setShowSkipModal(false);
    await fetch("/api/complete", { method: "POST" });
    router.push("/");
  }

  if (done) return <DoneScreen onHome={() => router.push("/")} />;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-50">
        <div className="text-center space-y-4">
          <p className="text-ink-700">{error}</p>
          <button
            onClick={() => router.push("/curriculum")}
            className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition"
          >
            커리큘럼으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ls-frame w-screen h-screen flex flex-col bg-white overflow-hidden">
      {showSkipModal && (
        <SkipModal
          onConfirm={handleSkipConfirm}
          onCancel={() => setShowSkipModal(false)}
        />
      )}
      <Header
        worksheet={worksheet}
        loading={loading}
        answeredCount={answeredCount}
        isReview={isReview}
        onSkip={() => setShowSkipModal(true)}
      />
      <div className="flex-1 min-h-0 flex overflow-hidden">
        <LeftPanel worksheet={worksheet} />
        {loading
          ? <LoadingRight />
          : <CompleteRight
              worksheet={worksheet!}
              onComplete={handleComplete}
              onAnswered={() => setAnsweredCount((c) => c + 1)}
              isReview={isReview}
            />
        }
      </div>
    </div>
  );
}

// ─── Page (Suspense wrapper for useSearchParams) ──────────────────────────────

export default function WorksheetPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-ink-50">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-4 border-brand-600 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-ink-500 text-[14px]">로딩 중…</p>
        </div>
      </div>
    }>
      <WorksheetContent />
    </Suspense>
  );
}

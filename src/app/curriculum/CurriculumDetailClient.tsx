"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";

// ─── Types ────────────────────────────────────────────────────────────────────

type TopicStatus = "done" | "current" | "next" | "locked";
type FilterKey = "all" | "active" | "done";

type ChatMsg =
  | { type: "ai-intro" }
  | { type: "ai-revise"; summary: string; changes: string[] }
  | { type: "user"; text: string };

export interface TopicItem {
  topicId: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  hasHandsOn: boolean;
}

interface Props {
  userName: string;
  userField: string;
  courseEmoji: string;
  courseTitle: string;
  courseSubtitle: string;
  courseMeta: string;
  courseAccent: string;
  currentTopicIndex: number;
  topics: TopicItem[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function topicStatus(idx: number, currentIdx: number): TopicStatus {
  if (idx < currentIdx) return "done";
  if (idx === currentIdx) return "current";
  if (idx <= currentIdx + 3) return "next";
  return "locked";
}

const ACCENT_TILE: Record<string, string> = {
  violet:  "bg-violet-50 text-violet-700 ring-violet-100",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  amber:   "bg-amber-50 text-amber-700 ring-amber-100",
  brand:   "bg-brand-50 text-brand-700 ring-brand-100",
};

const ACCENT_BADGE: Record<string, string> = {
  violet:  "bg-violet-50 text-violet-700 border-violet-100",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
  amber:   "bg-amber-50 text-amber-700 border-amber-100",
  brand:   "bg-brand-50 text-brand-700 border-brand-100",
};

const ACCENT_DOT: Record<string, string> = {
  violet:  "bg-violet-500",
  emerald: "bg-emerald-500",
  amber:   "bg-amber-500",
  brand:   "bg-brand-500",
};

// ─── Icons ────────────────────────────────────────────────────────────────────

function ISpark(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/></svg>;
}
function IBack(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M15 18l-6-6 6-6"/></svg>;
}
function IArrow(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
}
function ICheck(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12.5l4.5 4.5L19 7"/></svg>;
}
function IPlay(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M8 5v14l11-7z"/></svg>;
}
function ISend(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12l14-7-4 14-3-6-7-1z"/></svg>;
}
function IClock(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
}
function ILock(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>;
}
function IBell(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 8a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6zM10 19a2 2 0 0 0 4 0"/></svg>;
}
function IEdit(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>;
}
function ILogout(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M15 17l5-5-5-5M20 12H9M12 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6"/></svg>;
}

// ─── Status Icon ──────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: TopicStatus }) {
  if (status === "done") return (
    <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
      <ICheck className="w-3.5 h-3.5" />
    </span>
  );
  if (status === "current") return (
    <span className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0 ring-4 ring-brand-100">
      <IPlay className="w-3 h-3" />
    </span>
  );
  if (status === "locked") return (
    <span className="w-6 h-6 rounded-full bg-ink-100 text-ink-400 flex items-center justify-center shrink-0">
      <ILock className="w-3 h-3" />
    </span>
  );
  return (
    <span className="w-6 h-6 rounded-full border-2 border-ink-200 flex items-center justify-center shrink-0" />
  );
}

// ─── Topic List Item ──────────────────────────────────────────────────────────

function TopicListItem({
  topic, n, status, selected, onClick,
}: {
  topic: TopicItem;
  n: number;
  status: TopicStatus;
  selected: boolean;
  onClick: () => void;
}) {
  const labels: Record<TopicStatus, string> = {
    done: "완료", current: "진행 중", next: "예정", locked: "잠금",
  };
  const labelTone: Record<TopicStatus, string> = {
    done: "text-emerald-700",
    current: "text-brand-700",
    next: "text-ink-500",
    locked: "text-ink-400",
  };
  const titleTone =
    status === "locked" ? "text-ink-400"
    : status === "done" ? "text-ink-700"
    : "text-ink-900";

  return (
    <button
      onClick={onClick}
      className={`group w-full flex items-start gap-3 px-3.5 py-3 rounded-xl text-left transition-all border ${
        selected
          ? "bg-brand-50 border-brand-200 ring-1 ring-brand-100"
          : "bg-transparent border-transparent hover:bg-ink-50"
      }`}
    >
      <StatusIcon status={status} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[10.5px] font-bold uppercase tabular-nums text-ink-400 tracking-wider">
            #{String(n).padStart(2, "0")}
          </span>
          <span className={`text-[10.5px] font-bold ${labelTone[status]} whitespace-nowrap`}>
            · {labels[status]}
          </span>
        </div>
        <div className={`mt-0.5 text-[13px] font-semibold leading-snug ${titleTone}`}>
          {topic.title}
        </div>
        <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-ink-400">
          <IClock className="w-3 h-3" />
          <span className="whitespace-nowrap">{topic.estimatedMinutes}분</span>
        </div>
      </div>
    </button>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

type SectionItem = { type: "section"; label: string };
type TopicGroupItem = { type: "topic"; topic: TopicItem; idx: number };
type GroupItem = SectionItem | TopicGroupItem;

function Sidebar({
  topics, currentTopicIndex, selectedIdx, onSelect,
  courseEmoji, courseTitle, courseSubtitle, courseAccent,
}: {
  topics: TopicItem[];
  currentTopicIndex: number;
  selectedIdx: number;
  onSelect: (idx: number) => void;
  courseEmoji: string;
  courseTitle: string;
  courseSubtitle: string;
  courseAccent: string;
}) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const tileCls = ACCENT_TILE[courseAccent] ?? ACCENT_TILE.brand;

  const doneCount = topics.filter((_, i) => topicStatus(i, currentTopicIndex) === "done").length;
  const pct = topics.length > 0 ? Math.round((doneCount / topics.length) * 100) : 0;

  const grouped = useMemo<GroupItem[]>(() => {
    const result: GroupItem[] = [];
    let prevWeek = -1;
    topics.forEach((topic, idx) => {
      const status = topicStatus(idx, currentTopicIndex);
      if (filter === "active" && status !== "current" && status !== "next") return;
      if (filter === "done" && status !== "done") return;
      const week = Math.floor(idx / 4);
      if (week !== prevWeek) {
        prevWeek = week;
        result.push({ type: "section", label: `Week ${week + 1}` });
      }
      result.push({ type: "topic", topic, idx });
    });
    return result;
  }, [topics, currentTopicIndex, filter]);

  const filters: [FilterKey, string][] = [
    ["all", "전체"],
    ["active", "진행 중"],
    ["done", "완료"],
  ];

  return (
    <aside className="w-[300px] shrink-0 border-r border-ink-200 bg-white flex flex-col min-h-0">
      {/* Course header */}
      <div className="px-5 pt-5 pb-4 border-b border-ink-100">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-[11.5px] font-medium text-ink-500 hover:text-ink-900 mb-2.5"
        >
          <IBack className="w-3.5 h-3.5" />
          <span className="whitespace-nowrap">내 학습으로</span>
        </Link>

        <div className="flex items-start gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-[22px] ring-4 shrink-0 ${tileCls}`}>
            <span aria-hidden>{courseEmoji}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-[15px] font-bold text-ink-900 leading-tight truncate">{courseTitle}</h1>
            <p className="mt-0.5 text-[11.5px] text-ink-500 truncate">{courseSubtitle}</p>
          </div>
        </div>

        {/* Progress strip */}
        <div className="mt-4">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400">진도</span>
            <span className="text-[11.5px] tabular-nums text-ink-700">
              <span className="font-bold text-ink-900">{doneCount}</span>
              <span className="text-ink-400"> / {topics.length} 토픽</span>
              <span className="ml-2 text-brand-700 font-semibold">{pct}%</span>
            </span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-ink-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-brand-700 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="mt-4 flex items-center gap-0.5 p-0.5 rounded-lg border border-ink-200 bg-ink-50 text-[11.5px] font-medium">
          {filters.map(([k, l]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`flex-1 h-7 rounded-md transition whitespace-nowrap ${
                filter === k
                  ? "bg-white text-ink-900 shadow-soft"
                  : "text-ink-500 hover:text-ink-900"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Topic list */}
      <div className="flex-1 min-h-0 overflow-y-auto thin-scroll px-2 py-3">
        {grouped.map((g, i) =>
          g.type === "section" ? (
            <div
              key={`s-${i}`}
              className="px-3.5 pt-3 pb-2 text-[10.5px] font-bold uppercase tracking-wider text-ink-400"
            >
              {g.label}
            </div>
          ) : (
            <TopicListItem
              key={g.idx}
              topic={g.topic}
              n={g.idx + 1}
              status={topicStatus(g.idx, currentTopicIndex)}
              selected={selectedIdx === g.idx}
              onClick={() => onSelect(g.idx)}
            />
          )
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-ink-100 px-4 py-3">
        <button
          onClick={() => (document.getElementById("curriculum-feedback-input") as HTMLTextAreaElement | null)?.focus()}
          className="w-full h-9 rounded-lg border border-ink-200 hover:bg-ink-50 text-[12px] font-medium text-ink-700 inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
        >
          <IEdit className="w-3.5 h-3.5" />
          <span className="whitespace-nowrap">커리큘럼 수정</span>
        </button>
      </div>
    </aside>
  );
}

// ─── Chat Bubbles ─────────────────────────────────────────────────────────────

function AIBubble({ children, revised }: { children: React.ReactNode; revised?: boolean }) {
  return (
    <div className="flex gap-3 items-start animate-fade-up">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shrink-0 shadow-soft">
        <ISpark className="w-4 h-4" />
      </div>
      <div className="flex-1 max-w-3xl">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[13px] font-semibold text-ink-900">AI 튜터</span>
          {revised ? (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 font-semibold rounded-full border bg-violet-50 text-violet-700 border-violet-100 whitespace-nowrap">
              수정됨
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 font-semibold rounded-full border bg-brand-50 text-brand-700 border-brand-100 whitespace-nowrap">
              제안
            </span>
          )}
          <span className="text-[11px] text-ink-400">방금 전</span>
        </div>
        <div className="rounded-2xl rounded-tl-md bg-white border border-ink-200 shadow-soft px-5 py-4 text-[14px] text-ink-900 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}

function UserChatBubble({ text, userName }: { text: string; userName: string }) {
  const initial = userName.charAt(0);
  return (
    <div className="flex justify-end animate-fade-up">
      <div className="flex gap-3 items-start max-w-[80%] flex-row-reverse">
        <div className="w-9 h-9 rounded-full bg-ink-100 text-ink-700 flex items-center justify-center font-semibold shrink-0 text-[13px] shadow-soft">
          {initial}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1.5 justify-end">
            <span className="text-[11px] text-ink-400">방금 전</span>
            <span className="text-[13px] font-semibold text-ink-900">{userName}님</span>
          </div>
          <div className="rounded-2xl rounded-tr-md bg-brand-600 text-white px-5 py-3.5 text-[14px] leading-relaxed shadow-soft whitespace-pre-wrap">
            {text}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Topic Detail Card ────────────────────────────────────────────────────────

function TopicDetail({
  topic, n, total, status,
}: {
  topic: TopicItem;
  n: number;
  total: number;
  status: TopicStatus;
}) {
  const week = Math.floor((n - 1) / 4) + 1;

  const statusBadge: Record<TopicStatus, React.ReactNode> = {
    done: (
      <span className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 font-semibold rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />완료한 토픽
      </span>
    ),
    current: (
      <span className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 font-semibold rounded-full border bg-brand-50 text-brand-700 border-brand-100 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />진행 중인 토픽
      </span>
    ),
    next: (
      <span className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 font-semibold rounded-full border bg-ink-100 text-ink-700 border-ink-200 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-ink-400 shrink-0" />다음 예정
      </span>
    ),
    locked: (
      <span className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 font-semibold rounded-full border bg-ink-100 text-ink-700 border-ink-200 whitespace-nowrap">
        <ILock className="w-3 h-3 -ml-0.5" />잠긴 토픽
      </span>
    ),
  };

  return (
    <article className="rounded-2xl border border-ink-200 bg-white shadow-card overflow-hidden animate-fade-up">
      {/* Header */}
      <header className="px-7 pt-6 pb-5 border-b border-ink-100">
        <div className="flex items-center gap-2 flex-wrap">
          {statusBadge[status]}
          <span className="text-[11.5px] font-semibold tracking-wide text-brand-600 uppercase">
            Week {week}
          </span>
          <span className="text-ink-300">·</span>
          <span className="text-[11.5px] font-medium text-ink-500 whitespace-nowrap">
            토픽 {String(n).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
        </div>
        <h2 className="mt-3 text-[24px] font-bold text-ink-900 tracking-tight leading-tight">
          {topic.title}
        </h2>
        <p className="mt-2 text-[14px] text-ink-600 leading-relaxed">{topic.description}</p>

        <div className="mt-4 grid grid-cols-3 gap-2 max-w-md">
          <div className="rounded-lg bg-ink-50 px-3 py-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-400">예상 시간</div>
            <div className="mt-0.5 text-[14px] font-bold text-ink-900 tabular-nums whitespace-nowrap">
              {topic.estimatedMinutes}분
            </div>
          </div>
          <div className="rounded-lg bg-ink-50 px-3 py-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-400">문제</div>
            <div className="mt-0.5 text-[14px] font-bold text-ink-900 tabular-nums whitespace-nowrap">3 문항</div>
          </div>
          <div className="rounded-lg bg-ink-50 px-3 py-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-400">실습</div>
            <div className="mt-0.5 text-[14px] font-bold text-ink-900 tabular-nums whitespace-nowrap">
              {topic.hasHandsOn ? "1 과제" : "없음"}
            </div>
          </div>
        </div>
      </header>

      {/* Practice card */}
      {topic.hasHandsOn && (
        <div className="px-7 py-6">
          <div className="rounded-2xl bg-brand-50 border border-brand-100 p-5">
            <div className="flex items-center gap-2 text-[12px] font-semibold text-brand-700">
              <span className="w-5 h-5 rounded-md bg-brand-600 text-white flex items-center justify-center text-[11px] shrink-0">
                실
              </span>
              <span className="whitespace-nowrap">이번 토픽의 실습</span>
            </div>
            <p className="mt-2 text-[13.5px] text-brand-900 leading-relaxed opacity-85">
              이 토픽을 학습한 후 직접 실습 과제를 진행하게 돼요. 학습지에서 자세한 내용을 확인해보세요.
            </p>
          </div>
        </div>
      )}
    </article>
  );
}

// ─── Main Area ────────────────────────────────────────────────────────────────

function MainArea({
  topics, currentTopicIndex, selectedIdx, onSelect,
  courseTitle, courseMeta, userName, courseAccent,
}: {
  topics: TopicItem[];
  currentTopicIndex: number;
  selectedIdx: number;
  onSelect: (idx: number) => void;
  courseTitle: string;
  courseMeta: string;
  userName: string;
  courseAccent: string;
}) {
  const [messages, setMessages] = useState<ChatMsg[]>([{ type: "ai-intro" }]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const badgeCls = ACCENT_BADGE[courseAccent] ?? ACCENT_BADGE.brand;
  const dotCls = ACCENT_DOT[courseAccent] ?? ACCENT_DOT.brand;

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  async function send() {
    const value = input.trim();
    if (!value) return;
    setInput("");
    setMessages((m) => [...m, { type: "user", text: value }]);
    setTyping(true);

    try {
      const res = await fetch("/api/curriculum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: value }),
      });
      if (!res.ok) throw new Error("수정 요청에 실패했어요.");
      const data = await res.json() as { revisionSummary?: string; revisionChanges?: string[] };
      setMessages((m) => [
        ...m,
        {
          type: "ai-revise",
          summary: data.revisionSummary ?? "커리큘럼을 수정했어요.",
          changes: data.revisionChanges ?? [],
        },
      ]);
    } catch (e: unknown) {
      setMessages((m) => [
        ...m,
        {
          type: "ai-revise",
          summary: e instanceof Error ? e.message : "오류가 발생했어요.",
          changes: [],
        },
      ]);
    } finally {
      setTyping(false);
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const selectedTopic = topics[selectedIdx];
  const selectedStatus = selectedTopic ? topicStatus(selectedIdx, currentTopicIndex) : "locked";

  return (
    <main className="flex-1 min-w-0 flex flex-col bg-ink-50/60">
      {/* Sticky top bar */}
      <div className="shrink-0 px-9 pt-5 pb-3 border-b border-ink-100 bg-white/70 backdrop-blur flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 font-semibold rounded-full border whitespace-nowrap shrink-0 ${badgeCls}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotCls}`} />
            {courseTitle}
          </span>
          <span className="text-ink-300 shrink-0">›</span>
          <span className="text-[13px] font-semibold text-ink-900 truncate">
            {selectedTopic?.title ?? "토픽을 선택하세요"}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => selectedIdx > 0 && onSelect(selectedIdx - 1)}
            disabled={selectedIdx === 0}
            className="h-8 px-3 rounded-lg border border-ink-200 hover:bg-ink-50 disabled:opacity-40 text-[12.5px] font-medium text-ink-700 whitespace-nowrap transition"
          >
            이전 토픽
          </button>
          <button
            onClick={() => selectedIdx < topics.length - 1 && onSelect(selectedIdx + 1)}
            disabled={selectedIdx === topics.length - 1}
            className="h-8 px-3 rounded-lg border border-ink-200 hover:bg-ink-50 disabled:opacity-40 text-[12.5px] font-medium text-ink-700 whitespace-nowrap transition"
          >
            다음 토픽
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto thin-scroll">
        <div className="max-w-[920px] mx-auto px-9 py-7 space-y-7">
          {/* AI chat */}
          <div className="space-y-5">
            {messages.map((msg, i) => {
              if (msg.type === "ai-intro") {
                return (
                  <AIBubble key={i}>
                    <p>
                      안녕하세요! 설문을 바탕으로 <b>{courseTitle}</b> 커리큘럼을 만들었어요 😊
                    </p>
                    <p className="mt-1.5 text-ink-700">
                      {courseMeta} 기준으로 구성됐어요. 왼쪽 목록에서 각 토픽을 눌러 자세한 내용을 확인하고, 수정이 필요하면 아래에 알려주세요.
                    </p>
                  </AIBubble>
                );
              }
              if (msg.type === "user") {
                return <UserChatBubble key={i} text={msg.text} userName={userName} />;
              }
              if (msg.type === "ai-revise") {
                return (
                  <AIBubble key={i} revised>
                    {msg.summary}
                    {msg.changes.length > 0 && (
                      <ul className="mt-2.5 space-y-1.5 text-[13px] text-ink-700">
                        {msg.changes.map((c, j) => (
                          <li key={j} className="flex gap-2">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </AIBubble>
                );
              }
              return null;
            })}

            {typing && (
              <div className="flex gap-3 items-start animate-fade-up">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shrink-0 shadow-soft">
                  <ISpark className="w-4 h-4" />
                </div>
                <div className="mt-2">
                  <div className="flex items-center gap-1.5 px-4 py-3 bg-white border border-ink-200 rounded-2xl rounded-tl-md shadow-soft">
                    <span className="w-1.5 h-1.5 rounded-full bg-ink-400 animate-blink" />
                    <span className="w-1.5 h-1.5 rounded-full bg-ink-400 animate-blink dot-2" />
                    <span className="w-1.5 h-1.5 rounded-full bg-ink-400 animate-blink dot-3" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-ink-200" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400 whitespace-nowrap">
              선택한 토픽
            </span>
            <div className="flex-1 h-px bg-ink-200" />
          </div>

          {/* Selected topic detail */}
          {selectedTopic ? (
            <TopicDetail
              topic={selectedTopic}
              n={selectedIdx + 1}
              total={topics.length}
              status={selectedStatus}
            />
          ) : (
            <div className="rounded-2xl border border-ink-200 bg-white p-10 text-center text-[14px] text-ink-500">
              왼쪽에서 토픽을 선택해주세요
            </div>
          )}

          <div className="text-center text-[11px] text-ink-400 pb-2">
            커리큘럼을 확정하면 매일 자동으로 다음 토픽이 열려요
          </div>
        </div>
      </div>

      {/* Sticky footer */}
      <footer className="shrink-0 border-t border-ink-200 bg-white px-9 py-4">
        <div className="max-w-[920px] mx-auto flex items-end gap-3">
          <div
            className="flex-1 flex items-end bg-ink-50 border border-ink-200 rounded-2xl px-4 py-2.5 transition"
            onFocusCapture={(e) => {
              e.currentTarget.style.borderColor = "var(--color-brand-500)";
              e.currentTarget.style.boxShadow = "var(--shadow-ring)";
            }}
            onBlurCapture={(e) => {
              e.currentTarget.style.borderColor = "";
              e.currentTarget.style.boxShadow = "";
            }}
          >
            <textarea
              id="curriculum-feedback-input"
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="수정하고 싶은 부분이나 더 다루고 싶은 주제를 입력해주세요"
              className="flex-1 bg-transparent resize-none outline-none text-[14px] text-ink-900 placeholder:text-ink-400 leading-relaxed max-h-32"
            />
            <button
              onClick={send}
              disabled={!input.trim()}
              aria-label="전송"
              className={`ml-2 w-9 h-9 rounded-xl flex items-center justify-center transition shrink-0 ${
                input.trim()
                  ? "bg-brand-600 hover:bg-brand-700 text-white shadow-soft"
                  : "bg-ink-100 text-ink-400"
              }`}
            >
              <ISend className="w-4 h-4" />
            </button>
          </div>
          <Link
            href="/worksheet"
            className="h-12 px-5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-[14px] font-bold inline-flex items-center gap-2 shadow-soft whitespace-nowrap shrink-0 transition active:scale-[0.99]"
          >
            <IPlay className="w-3.5 h-3.5" />
            이 커리큘럼으로 시작
            <IArrow className="w-4 h-4" />
          </Link>
        </div>
        <div className="max-w-[920px] mx-auto mt-2 flex items-center justify-between text-[11px] text-ink-400">
          <span className="whitespace-nowrap">
            Enter로 전송 · 토픽 추가·삭제·재배치는 채팅으로 요청해주세요
          </span>
          <span className="whitespace-nowrap">자동 저장됨</span>
        </div>
      </footer>
    </main>
  );
}


// ─── Root Component ───────────────────────────────────────────────────────────

export default function CurriculumDetailClient({
  userName, userField, courseEmoji, courseTitle, courseSubtitle,
  courseMeta, courseAccent, currentTopicIndex, topics,
}: Props) {
  const clampedInitial = Math.min(
    currentTopicIndex,
    Math.max(0, topics.length - 1),
  );
  const [selectedIdx, setSelectedIdx] = useState(clampedInitial);

  return (
    <div
      className="h-screen w-full flex flex-col bg-white text-ink-900 overflow-hidden"
      style={{ wordBreak: "keep-all", overflowWrap: "break-word" }}
    >
      <AppHeader userName={userName} userField={userField} breadcrumbTitle={courseTitle} />
      <div className="flex-1 min-h-0 flex">
        <Sidebar
          topics={topics}
          currentTopicIndex={currentTopicIndex}
          selectedIdx={selectedIdx}
          onSelect={setSelectedIdx}
          courseEmoji={courseEmoji}
          courseTitle={courseTitle}
          courseSubtitle={courseSubtitle}
          courseAccent={courseAccent}
        />
        <MainArea
          topics={topics}
          currentTopicIndex={currentTopicIndex}
          selectedIdx={selectedIdx}
          onSelect={setSelectedIdx}
          courseTitle={courseTitle}
          courseMeta={courseMeta}
          userName={userName}
          courseAccent={courseAccent}
        />
      </div>
    </div>
  );
}

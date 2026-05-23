"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CurriculumData {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  accent: string;
  total: number;
  done: number;
  nextTopic: string | null;
  lastStudied: string;
  status: "active" | "done";
}

// ─── Config ───────────────────────────────────────────────────────────────────

const ACCENTS: Record<string, { tile: string; bar: string; ring: string; dot: string }> = {
  brand:   { tile: "bg-brand-50 text-brand-700",     bar: "from-brand-500 to-brand-700",    ring: "ring-brand-100",   dot: "bg-brand-500" },
  violet:  { tile: "bg-violet-50 text-violet-700",   bar: "from-violet-500 to-fuchsia-600", ring: "ring-violet-100",  dot: "bg-violet-500" },
  emerald: { tile: "bg-emerald-50 text-emerald-700", bar: "from-emerald-500 to-teal-600",   ring: "ring-emerald-100", dot: "bg-emerald-500" },
  amber:   { tile: "bg-amber-50 text-amber-700",     bar: "from-amber-400 to-orange-500",   ring: "ring-amber-100",   dot: "bg-amber-500" },
};

// ─── Icons ────────────────────────────────────────────────────────────────────

function IPlay(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M8 5v14l11-7z"/></svg>;
}
function IArrow(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
}
function ICheck(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12.5l4.5 4.5L19 7"/></svg>;
}
function IHistory(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/></svg>;
}
function IDots(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="currentColor" {...p}><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>;
}
function IPlus(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 5v14M5 12h14"/></svg>;
}

// ─── Badge ────────────────────────────────────────────────────────────────────

type BadgeTone = "ink" | "brand" | "emerald";

function Badge({ tone = "ink", dot = false, children }: { tone?: BadgeTone; dot?: boolean; children: React.ReactNode }) {
  const cls: Record<BadgeTone, string> = {
    ink:     "bg-ink-100 text-ink-700 border-ink-200",
    brand:   "bg-brand-50 text-brand-700 border-brand-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  const dotCls: Record<BadgeTone, string> = {
    ink: "bg-ink-400", brand: "bg-brand-500", emerald: "bg-emerald-500",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${cls[tone]}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotCls[tone]}`} />}
      {children}
    </span>
  );
}

// ─── Curriculum Card ──────────────────────────────────────────────────────────

function CurriculumCard({ c }: { c: CurriculumData }) {
  const pct = c.total > 0 ? Math.round((c.done / c.total) * 100) : 0;
  const a = ACCENTS[c.accent] ?? ACCENTS.brand;
  const completed = c.status === "done";

  return (
    <article className="group relative rounded-2xl border border-ink-200 bg-white p-5 shadow-soft hover:shadow-card hover:-translate-y-0.5 hover:border-brand-200 transition-all flex flex-col">
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-xl ${a.tile} flex items-center justify-center text-2xl shrink-0 ring-4 ${a.ring}`}>
          <span>{c.emoji}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {completed
              ? <Badge tone="emerald" dot><span className="whitespace-nowrap">완료</span></Badge>
              : <Badge tone="brand" dot><span className="whitespace-nowrap">진행 중</span></Badge>}
            <span className="text-[11px] text-ink-400 whitespace-nowrap">마지막 학습 · {c.lastStudied}</span>
          </div>
          <h3 className="mt-1.5 text-[16px] font-bold text-ink-900 leading-tight tracking-tight">
            <Link href="/curriculum" className="hover:text-brand-700">{c.title}</Link>
          </h3>
          <div className="mt-0.5 text-[12px] text-ink-500 truncate">{c.subtitle}</div>
        </div>
        <button className="opacity-0 group-hover:opacity-100 transition w-7 h-7 rounded-md text-ink-400 hover:bg-ink-100 hover:text-ink-700 flex items-center justify-center shrink-0">
          <IDots className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400">진도</span>
          <span className="text-[12px] tabular-nums text-ink-700">
            <span className={`font-bold text-[15px] ${completed ? "text-emerald-700" : "text-ink-900"}`}>{pct}%</span>
            <span className="text-ink-400 ml-1.5">{c.done} / {c.total} 토픽</span>
          </span>
        </div>
        <div className="mt-1.5 h-2 rounded-full bg-ink-100 overflow-hidden">
          <div className={`h-full rounded-full bg-gradient-to-r ${a.bar}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="mt-4 min-h-[48px]">
        {!completed ? (
          <div className="flex items-start gap-2">
            <span className={`mt-1 w-1.5 h-1.5 rounded-full ${a.dot} shrink-0`} />
            <div className="min-w-0">
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-ink-400">다음 토픽</div>
              <div className="text-[12.5px] text-ink-700 leading-snug mt-0.5 line-clamp-2">{c.nextTopic}</div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 text-[12px] text-emerald-800 inline-flex items-center gap-1.5">
            <ICheck className="w-3.5 h-3.5" /> <span className="whitespace-nowrap">모든 토픽을 마쳤어요</span>
          </div>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-ink-100 flex items-center gap-2">
        {completed ? (
          <>
            <Link href="/curriculum" className="flex-1 h-10 rounded-lg bg-ink-100 hover:bg-ink-200 text-ink-700 text-[13px] font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition">
              <span className="whitespace-nowrap">복습하기</span>
            </Link>
            <button className="h-10 px-3 rounded-lg border border-ink-200 hover:border-brand-300 hover:bg-brand-50 text-[12.5px] font-semibold text-ink-700 hover:text-brand-700 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition">
              <IHistory className="w-3.5 h-3.5" /> <span className="whitespace-nowrap">리포트</span>
            </button>
          </>
        ) : (
          <Link href="/worksheet" className="flex-1 h-10 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-[13px] font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shadow-soft transition active:scale-[0.99]">
            <IPlay className="w-3 h-3" /> <span className="whitespace-nowrap">이어서 학습</span> <IArrow className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </article>
  );
}

// ─── New Learning Card ────────────────────────────────────────────────────────

function NewLearningCard() {
  return (
    <Link href="/onboarding" className="group rounded-2xl border-2 border-dashed border-ink-300 hover:border-brand-400 hover:bg-brand-50/40 bg-white/50 p-5 flex flex-col items-start justify-center min-h-[300px] transition-all">
      <div className="w-12 h-12 rounded-xl bg-ink-100 group-hover:bg-brand-100 text-ink-400 group-hover:text-brand-600 flex items-center justify-center transition">
        <IPlus className="w-6 h-6" />
      </div>
      <div className="mt-4 text-[15px] font-bold text-ink-900 group-hover:text-brand-700 transition whitespace-nowrap">새 학습 추가하기</div>
      <p className="mt-1.5 text-[12.5px] text-ink-500 leading-relaxed">
        관심 분야를 알려주시면 AI 튜터가<br />맞춤 커리큘럼을 만들어 드려요
      </p>
      <span className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold text-brand-700 group-hover:text-brand-800">
        <span className="whitespace-nowrap">설문 시작</span> <IArrow className="w-3.5 h-3.5" />
      </span>
    </Link>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type FilterKey = "all" | "active" | "done";

export default function MyLearningSection({
  curricula,
  totalLearningTime,
}: {
  curricula: CurriculumData[];
  totalLearningTime: string;
}) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const filtered = filter === "all" ? curricula : curricula.filter((c) => c.status === filter);
  const activeCount = curricula.filter((c) => c.status === "active").length;
  const doneCount   = curricula.filter((c) => c.status === "done").length;

  const filterLabels: [FilterKey, string][] = [
    ["all",    "전체"],
    ["active", "진행 중"],
    ["done",   "완료"],
  ];

  return (
    <section>
      <header className="flex items-end justify-between gap-3 mb-4">
        <div>
          <h2 className="text-[20px] font-bold text-ink-900 tracking-tight flex items-center gap-2">
            <span className="whitespace-nowrap">내 학습</span>
            <Badge tone="brand">{curricula.length}개</Badge>
          </h2>
          <p className="mt-1 text-[13px] text-ink-500">
            <span className="whitespace-nowrap">진행 중 <b className="text-ink-900 tabular-nums">{activeCount}</b></span>
            <span className="mx-2 text-ink-300">·</span>
            <span className="whitespace-nowrap">완료 <b className="text-ink-900 tabular-nums">{doneCount}</b></span>
            <span className="mx-2 text-ink-300">·</span>
            <span className="whitespace-nowrap">총 학습 시간 <b className="text-ink-900 tabular-nums">{totalLearningTime}</b></span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden md:flex items-center gap-0.5 p-0.5 rounded-lg border border-ink-200 bg-white text-[12px] font-medium">
            {filterLabels.map(([k, l]) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`px-2.5 h-7 rounded-md transition whitespace-nowrap inline-flex items-center ${
                  filter === k ? "bg-ink-100 text-ink-900" : "text-ink-500 hover:text-ink-900"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <Link href="/onboarding" className="h-9 px-3 rounded-lg border border-ink-200 hover:bg-ink-50 text-[12.5px] font-medium text-ink-700 inline-flex items-center gap-1.5 whitespace-nowrap transition">
            <span aria-hidden>＋</span> <span className="whitespace-nowrap">새 학습 추가</span>
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {filtered.map((c) => <CurriculumCard key={c.id} c={c} />)}
        <NewLearningCard />
      </div>
    </section>
  );
}

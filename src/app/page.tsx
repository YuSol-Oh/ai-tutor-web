import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase";
import { redirect } from "next/navigation";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import MyLearningSection, { CurriculumData } from "@/components/MyLearningSection";
import ReviewButton from "@/components/ReviewButton";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TopicRow {
  topicId: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  hasHandsOn: boolean;
}

interface WorksheetRow {
  id: string;
  topic_id: string;
  topic_title: string;
  created_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeStreak(rows: WorksheetRow[]): number {
  if (!rows.length) return 0;
  const days = [...new Set(rows.map((r) => r.created_at.split("T")[0]))].sort().reverse();
  const today = new Date().toISOString().split("T")[0];
  let streak = 0;
  let check = today;
  for (const day of days) {
    if (day === check) {
      streak++;
      const d = new Date(check);
      d.setDate(d.getDate() - 1);
      check = d.toISOString().split("T")[0];
    } else if (day < check) break;
  }
  return streak;
}

function countThisWeek(rows: WorksheetRow[]): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  return rows.filter((r) => new Date(r.created_at) >= cutoff).length;
}

function fmtDate(iso: string) {
  return new Date(iso)
    .toLocaleDateString("ko-KR", { year: "numeric", month: "numeric", day: "numeric" })
    .replace(/\. /g, ".")
    .replace(/\.$/, "");
}

function todayLabel() {
  return new Date().toLocaleDateString("ko-KR", {
    year: "numeric", month: "numeric", day: "numeric", weekday: "short",
  });
}

function fmtMins(totalMins: number): string {
  if (totalMins < 60) return `${totalMins}m`;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function relativeDate(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diff === 0) return "오늘";
  if (diff === 1) return "어제";
  return `${diff}일 전`;
}

// ─── Accent config ────────────────────────────────────────────────────────────

const SUBJECT_CONFIG: Record<string, { emoji: string; label: string; accent: string }> = {
  "ai-data":   { emoji: "🤖", label: "AI·데이터 기초", accent: "violet" },
  "economics": { emoji: "💰", label: "경제·금융 기초", accent: "emerald" },
  "marketing": { emoji: "📈", label: "마케팅 기초",    accent: "amber" },
  "backend":   { emoji: "💻", label: "백엔드 입문",    accent: "brand" },
};

// ─── Icons ────────────────────────────────────────────────────────────────────

function ISpark(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/></svg>;
}
function IPlay(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M8 5v14l11-7z"/></svg>;
}
function IFlame(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3s4 4 4 8a4 4 0 1 1-8 0c0-2 1-3 1-3s1 2 3 2c0-3-1-5 0-7z"/></svg>;
}
function IClock(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
}
function ITarget(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/></svg>;
}
function IHistory(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/></svg>;
}
function IArrow(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
}
function IDots(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="currentColor" {...p}><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>;
}

// ─── Atoms ────────────────────────────────────────────────────────────────────

type Tone = "ink" | "brand" | "amber" | "emerald" | "rose";

function Badge({ tone = "ink", dot = false, children }: { tone?: Tone; dot?: boolean; children: React.ReactNode }) {
  const cls: Record<Tone, string> = {
    ink:     "bg-ink-100 text-ink-700 border-ink-200",
    brand:   "bg-brand-50 text-brand-700 border-brand-100",
    amber:   "bg-amber-50 text-amber-700 border-amber-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rose:    "bg-rose-50 text-rose-700 border-rose-200",
  };
  const dotCls: Record<Tone, string> = {
    ink: "bg-ink-400", brand: "bg-brand-500", amber: "bg-amber-500",
    emerald: "bg-emerald-500", rose: "bg-rose-500",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${cls[tone]}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotCls[tone]}`} />}
      {children}
    </span>
  );
}

// ─── Welcome Card ─────────────────────────────────────────────────────────────

function Welcome({ userName, dateLabel, prevTopic, todayTopic, streak, weekSessions, hasYesterdayWorksheet }: {
  userName: string; dateLabel: string; prevTopic: string | null;
  todayTopic: string | null; streak: number; weekSessions: number;
  hasYesterdayWorksheet: boolean;
}) {
  const weeklyGoal = 7;
  const weeklyPct = Math.min(Math.round((weekSessions / weeklyGoal) * 100), 100);
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-900 text-white shadow-card">
      <div className="absolute inset-0 dot-grid opacity-60 pointer-events-none" />
      <div className="absolute -top-16 -right-10 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-20 right-40 w-72 h-72 rounded-full bg-indigo-400/20 blur-3xl" />
      <div className="relative px-8 py-7 flex items-center gap-8">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-[12px] font-medium text-brand-100">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-300" />
            <span className="whitespace-nowrap">{dateLabel} · 오늘의 학습 준비됨</span>
          </div>
          <h1 className="mt-2 text-[26px] leading-tight font-bold tracking-tight">
            안녕하세요 <span className="text-amber-200">{userName}</span>님!<br />
            오늘도 함께 배워볼까요?
          </h1>
          <p className="mt-2 text-[13.5px] text-brand-100/90 leading-relaxed max-w-lg">
            {prevTopic
              ? <>어제는 <b className="text-white">'{prevTopic}'</b>을 잘 마치셨어요.{todayTopic && <> 오늘은 <b className="text-white">{todayTopic}</b>를 배워볼 차례예요.</>}</>
              : "오늘부터 AI 1:1 과외를 시작해볼까요? 첫 학습이 기다리고 있어요!"}
          </p>
          <div className="mt-5 flex items-center gap-2">
            <Link href="/worksheet" className="h-10 px-4 rounded-xl bg-white text-brand-700 hover:bg-brand-50 text-[13.5px] font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-soft">
              <IPlay className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">오늘 학습 시작</span>
            </Link>
            <ReviewButton hasYesterdayWorksheet={hasYesterdayWorksheet} prevTopic={prevTopic} />
          </div>
        </div>

        <div className="hidden md:grid grid-cols-2 gap-2.5 w-[260px] shrink-0">
          <div className="rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm p-3.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-100">
              <IFlame className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">연속 학습</span>
            </div>
            <div className="mt-1 text-[24px] font-bold tabular-nums leading-none">
              {streak}<span className="text-[12px] font-medium text-brand-100/80 ml-1">일</span>
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm p-3.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-100">
              <IClock className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">이번 주</span>
            </div>
            <div className="mt-1 text-[24px] font-bold tabular-nums leading-none">
              {weekSessions > 0 ? fmtMins(weekSessions * 20) : "—"}
            </div>
          </div>
          <div className="col-span-2 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm p-3.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-100">
              <ITarget className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">이번 주 목표</span>
            </div>
            <div className="mt-2 flex items-end justify-between gap-2">
              <div className="text-[20px] font-bold tabular-nums leading-none whitespace-nowrap">
                {weekSessions}<span className="text-[12px] font-medium text-brand-100/80"> / {weeklyGoal}회</span>
              </div>
              {weekSessions > 0 && <div className="text-[11px] text-emerald-200 font-semibold whitespace-nowrap">+1 오늘</div>}
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-white/15 overflow-hidden">
              <div className="h-full bg-amber-300 rounded-full transition-all" style={{ width: `${weeklyPct}%` }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── History Section ──────────────────────────────────────────────────────────

function HistorySection({ worksheets, topicToCourse }: {
  worksheets: WorksheetRow[];
  topicToCourse: Map<string, string>;
}) {
  return (
    <section className="rounded-2xl border border-ink-200 bg-white shadow-soft overflow-hidden">
      <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-ink-100">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-ink-100 text-ink-700 flex items-center justify-center shrink-0">
            <IHistory className="w-3.5 h-3.5" />
          </span>
          <h2 className="text-[15px] font-bold text-ink-900 whitespace-nowrap">최근 학습 기록</h2>
          <Badge tone="ink">최근 7일</Badge>
        </div>
        <Link href="/history" className="text-[12.5px] font-semibold text-brand-700 hover:text-brand-800 inline-flex items-center gap-1 whitespace-nowrap shrink-0">
          <span className="whitespace-nowrap">전체 기록 보기</span>
          <IArrow className="w-3.5 h-3.5" />
        </Link>
      </header>

      {worksheets.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📚</div>
          <p className="text-ink-500 text-[14px]">아직 학습 기록이 없어요</p>
          <Link href="/worksheet" className="mt-3 inline-block text-brand-700 text-[13px] font-medium hover:underline">
            첫 학습 시작하기 →
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-[120px_1fr_120px_120px_100px_40px] items-center gap-4 px-5 h-9 bg-ink-50 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
            <div>날짜</div>
            <div>토픽</div>
            <div>학습 시간</div>
            <div>정답률</div>
            <div>상태</div>
            <div />
          </div>
          <ul>
            {worksheets.map((ws, i) => {
              const isLast = i === worksheets.length - 1;
              const courseName = topicToCourse.get(ws.topic_id) ?? "—";
              return (
                <li
                  key={ws.id}
                  className={`grid grid-cols-[120px_1fr_120px_120px_100px_40px] items-center gap-4 px-5 h-16 hover:bg-ink-50/60 transition ${!isLast ? "border-b border-ink-100" : ""}`}
                >
                  <div className="text-[12.5px] text-ink-500 tabular-nums whitespace-nowrap">
                    {fmtDate(ws.created_at)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-semibold text-ink-900 truncate">{ws.topic_title}</div>
                    <div className="text-[11.5px] text-ink-500 whitespace-nowrap">{courseName}</div>
                  </div>
                  <div className="text-[12.5px] text-ink-400 whitespace-nowrap">—</div>
                  <div className="text-[12.5px] text-ink-400 whitespace-nowrap">—</div>
                  <Badge tone="emerald" dot>완료</Badge>
                  <button className="w-8 h-8 rounded-md text-ink-400 hover:bg-ink-100 hover:text-ink-700 flex items-center justify-center">
                    <IDots className="w-4 h-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}

// ─── No-curriculum Welcome ────────────────────────────────────────────────────

function NoCurriculumWelcome({ userName }: { userName: string }) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-indigo-700 to-indigo-900 text-white shadow-card">
      <div className="absolute inset-0 dot-grid opacity-60 pointer-events-none" />
      <div className="absolute -top-16 -right-10 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-20 left-40 w-72 h-72 rounded-full bg-indigo-400/20 blur-3xl" />
      <div className="relative px-8 py-12 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center mb-6">
          <ISpark className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-[28px] font-bold tracking-tight leading-tight">
          안녕하세요, <span className="text-amber-200">{userName}</span>님!
        </h1>
        <p className="mt-3 text-[15px] text-indigo-100/90 leading-relaxed max-w-md">
          AI 1:1 과외를 시작해볼까요?<br />나만의 맞춤 커리큘럼이 기다리고 있어요.
        </p>
        <Link
          href="/onboarding"
          className="mt-8 h-12 px-8 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 text-[15px] font-bold inline-flex items-center gap-2 shadow-soft transition"
        >
          학습 시작하기 <IArrow className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const [profileRes, curriculaRes, worksheetsRes] = await Promise.all([
    admin.from("user_profiles").select("*").eq("id", user.id).single(),
    admin.from("curricula").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    admin.from("worksheets").select("id, topic_id, topic_title, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
  ]);

  const profile     = profileRes.data;
  const rawCurricula = (curriculaRes.data ?? []) as Record<string, unknown>[];
  const worksheets  = (worksheetsRes.data ?? []) as WorksheetRow[];
  const hasCurriculum = rawCurricula.length > 0;

  const levelMap: Record<string, string> = {
    beginner: "초급 · Lv.1", intermediate: "중급 · Lv.2", advanced: "고급 · Lv.3",
  };
  const subjectMap: Record<string, string> = {
    "ai-data": "AI · 데이터", economics: "경제 · 금융", marketing: "마케팅",
  };

  const userName  = (profile?.name as string | null) ?? user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "학습자";
  const userField = profile ? (subjectMap[profile.subject as string] ?? (profile.subject as string) ?? "학습") : "AI 과외";
  const level     = profile ? (levelMap[profile.current_level as string] ?? (profile.current_level as string) ?? "초급 · Lv.1") : "초급 · Lv.1";

  const streak       = computeStreak(worksheets);
  const weekSessions = countThisWeek(worksheets);
  const dateLabel    = todayLabel();

  // Yesterday worksheet check (for review button)
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const hasYesterdayWorksheet = worksheets.some((ws) => ws.created_at.startsWith(yesterdayStr));

  // Build topicId → course name map for history display
  const topicToCourse = new Map<string, string>();
  rawCurricula.forEach((c, idx) => {
    const topics: TopicRow[] = Array.isArray(c.topics) ? (c.topics as TopicRow[]) : [];
    const subject   = (c.subject as string) ?? (profile?.subject as string) ?? "";
    const conf      = SUBJECT_CONFIG[subject];
    const courseName = conf?.label ?? (c.title as string) ?? `커리큘럼 ${idx + 1}`;
    topics.forEach((t) => topicToCourse.set(t.topicId, courseName));
  });

  // Build CurriculumData array for cards
  const completedTopicIds = new Set(worksheets.map((ws) => ws.topic_id));

  const curriculaData: CurriculumData[] = rawCurricula.map((c, idx) => {
    const topics: TopicRow[] = Array.isArray(c.topics) ? (c.topics as TopicRow[]) : [];
    const total = (c.total_topics as number) ?? topics.length;

    const done = idx === 0 && profile
      ? ((profile.current_topic_index as number) ?? 0)
      : topics.filter((t) => completedTopicIds.has(t.topicId)).length;

    const status: "active" | "done" = done >= total && total > 0 ? "done" : "active";
    const nextTopic = status === "active" && done < topics.length ? (topics[done]?.title ?? null) : null;

    const subject = (c.subject as string) ?? (profile?.subject as string) ?? "";
    const conf    = SUBJECT_CONFIG[subject];

    const topicIds = new Set(topics.map((t) => t.topicId));
    const lastWs   = worksheets.find((ws) => topicIds.has(ws.topic_id));
    const lastStudied = lastWs ? relativeDate(lastWs.created_at) : "—";

    return {
      id:         (c.id as string) ?? String(idx),
      emoji:      conf?.emoji ?? "📚",
      title:      (c.title as string) ?? conf?.label ?? `커리큘럼 ${idx + 1}`,
      subtitle:   `${level} · ${total}개 토픽`,
      accent:     conf?.accent ?? "brand",
      total,
      done,
      nextTopic,
      lastStudied,
      status,
    };
  });

  const totalLearningTime = fmtMins(worksheets.length * 20);

  const prevTopic = worksheets[0]?.topic_title ?? null;
  const primaryTopics: TopicRow[] = rawCurricula[0] && Array.isArray(rawCurricula[0].topics)
    ? (rawCurricula[0].topics as TopicRow[])
    : [];
  const primaryIndex = (profile?.current_topic_index as number) ?? 0;
  const todayTopic   = primaryTopics[primaryIndex]?.title ?? null;

  return (
    <div className="min-h-screen w-full flex flex-col bg-ink-100 text-ink-900" style={{ wordBreak: "keep-all", overflowWrap: "break-word" }}>
      <AppHeader userName={userName} userField={userField} />
      <div className="flex-1 min-h-0 flex">
        <AppSidebar userName={userName} userField={userField} level={level} streak={streak} />
        <main className="flex-1 min-w-0 overflow-y-auto clean-scroll">
          <div className="max-w-[1240px] mx-auto px-8 py-7 space-y-6">
            {hasCurriculum ? (
              <>
                <Welcome
                  userName={userName}
                  dateLabel={dateLabel}
                  prevTopic={prevTopic}
                  todayTopic={todayTopic}
                  streak={streak}
                  weekSessions={weekSessions}
                  hasYesterdayWorksheet={hasYesterdayWorksheet}
                />
                <MyLearningSection curricula={curriculaData} totalLearningTime={totalLearningTime} />
                <HistorySection worksheets={worksheets} topicToCourse={topicToCourse} />
                <div className="text-center text-[11px] text-ink-400 pt-2 pb-6">
                  학습 기록은 매일 자정에 자동으로 저장돼요
                </div>
              </>
            ) : (
              <NoCurriculumWelcome userName={userName} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

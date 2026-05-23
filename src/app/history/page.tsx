import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase";
import { redirect } from "next/navigation";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WorksheetRow {
  id: string;
  topic_id: string;
  topic_title: string;
  created_at: string;
}

interface TopicRow {
  topicId: string;
  title: string;
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

function fmtMins(totalMins: number): string {
  if (totalMins < 60) return `${totalMins}분`;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
}

function fmtDate(iso: string) {
  return new Date(iso)
    .toLocaleDateString("ko-KR", { month: "numeric", day: "numeric", weekday: "short" });
}

function monthLabel(yyyymm: string): string {
  const [y, m] = yyyymm.split("-");
  return `${y}년 ${parseInt(m)}월`;
}

function groupByMonth(rows: WorksheetRow[]): [string, WorksheetRow[]][] {
  const groups: Record<string, WorksheetRow[]> = {};
  for (const ws of rows) {
    const key = ws.created_at.substring(0, 7);
    if (!groups[key]) groups[key] = [];
    groups[key].push(ws);
  }
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IHistory(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/></svg>;
}
function IFlame(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3s4 4 4 8a4 4 0 1 1-8 0c0-2 1-3 1-3s1 2 3 2c0-3-1-5 0-7z"/></svg>;
}
function IClock(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
}
function IBook(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15z"/></svg>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HistoryPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const [profileRes, curriculaRes, worksheetsRes] = await Promise.all([
    admin.from("user_profiles").select("*").eq("id", user.id).single(),
    admin.from("curricula").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    admin.from("worksheets")
      .select("id, topic_id, topic_title, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const profile = profileRes.data;
  const rawCurricula = (curriculaRes.data ?? []) as Record<string, unknown>[];
  const worksheets = (worksheetsRes.data ?? []) as WorksheetRow[];

  const levelMap: Record<string, string> = {
    beginner: "초급 · Lv.1", intermediate: "중급 · Lv.2", advanced: "고급 · Lv.3",
  };
  const subjectMap: Record<string, string> = {
    "ai-data": "AI · 데이터", economics: "경제 · 금융", marketing: "마케팅",
  };

  const userName  = (profile?.name as string | null) ?? user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "학습자";
  const userField = profile ? (subjectMap[profile.subject as string] ?? (profile.subject as string) ?? "학습") : "AI 과외";
  const level     = profile ? (levelMap[profile.current_level as string] ?? (profile.current_level as string) ?? "초급 · Lv.1") : "초급 · Lv.1";
  const streak    = computeStreak(worksheets);

  // topicId → course name
  const topicToCourse = new Map<string, string>();
  rawCurricula.forEach((c, idx) => {
    const topics: TopicRow[] = Array.isArray(c.topics) ? (c.topics as TopicRow[]) : [];
    const courseName = (c.title as string) ?? `커리큘럼 ${idx + 1}`;
    topics.forEach((t) => topicToCourse.set(t.topicId, courseName));
  });

  const totalSessions = worksheets.length;
  const totalTime = fmtMins(totalSessions * 20);
  const monthGroups = groupByMonth(worksheets);

  return (
    <div className="min-h-screen w-full flex flex-col bg-ink-100 text-ink-900" style={{ wordBreak: "keep-all", overflowWrap: "break-word" }}>
      <AppHeader userName={userName} userField={userField} />
      <div className="flex-1 min-h-0 flex">
        <AppSidebar userName={userName} userField={userField} level={level} streak={streak} />
        <main className="flex-1 min-w-0 overflow-y-auto clean-scroll">
          <div className="max-w-[1000px] mx-auto px-8 py-7 space-y-6">

            {/* Page title */}
            <div>
              <h1 className="text-[26px] font-bold text-ink-900 tracking-tight flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-white border border-ink-200 text-ink-700 flex items-center justify-center shadow-soft shrink-0">
                  <IHistory className="w-5 h-5" />
                </span>
                학습 기록
              </h1>
              <p className="mt-1 text-[13.5px] text-ink-500">지금까지 쌓아온 학습의 발자취예요</p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-soft">
                <div className="flex items-center gap-2 text-[12px] font-semibold text-ink-500">
                  <IBook className="w-4 h-4" />
                  <span className="whitespace-nowrap">총 학습 횟수</span>
                </div>
                <div className="mt-2 text-[32px] font-bold text-ink-900 tabular-nums leading-none">
                  {totalSessions}
                  <span className="text-[15px] font-medium text-ink-500 ml-1">회</span>
                </div>
              </div>
              <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-soft">
                <div className="flex items-center gap-2 text-[12px] font-semibold text-ink-500">
                  <IFlame className="w-4 h-4" />
                  <span className="whitespace-nowrap">연속 학습</span>
                </div>
                <div className="mt-2 text-[32px] font-bold text-ink-900 tabular-nums leading-none">
                  {streak}
                  <span className="text-[15px] font-medium text-ink-500 ml-1">일</span>
                </div>
              </div>
              <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-soft">
                <div className="flex items-center gap-2 text-[12px] font-semibold text-ink-500">
                  <IClock className="w-4 h-4" />
                  <span className="whitespace-nowrap">총 학습 시간</span>
                </div>
                <div className="mt-2 text-[32px] font-bold text-ink-900 tabular-nums leading-none">
                  {totalSessions > 0 ? totalTime : "—"}
                </div>
                {totalSessions > 0 && (
                  <div className="mt-0.5 text-[11px] text-ink-400">회당 약 20분 기준</div>
                )}
              </div>
            </div>

            {/* Monthly grouped history */}
            {worksheets.length === 0 ? (
              <div className="rounded-2xl border border-ink-200 bg-white shadow-soft text-center py-16">
                <div className="text-4xl mb-3">📚</div>
                <p className="text-ink-500 text-[14px]">아직 학습 기록이 없어요</p>
                <Link href="/worksheet" className="mt-3 inline-block text-brand-700 text-[13px] font-medium hover:underline">
                  첫 학습 시작하기 →
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {monthGroups.map(([month, rows]) => (
                  <section key={month}>
                    <div className="flex items-center gap-3 mb-3">
                      <h2 className="text-[14px] font-bold text-ink-700 whitespace-nowrap">{monthLabel(month)}</h2>
                      <span className="text-[11px] font-semibold text-ink-400 whitespace-nowrap">{rows.length}회</span>
                      <div className="flex-1 h-px bg-ink-200" />
                    </div>
                    <div className="rounded-2xl border border-ink-200 bg-white shadow-soft overflow-hidden">
                      <div className="grid grid-cols-[100px_1fr_160px_80px_40px] items-center gap-4 px-5 h-9 bg-ink-50 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
                        <div>날짜</div>
                        <div>토픽</div>
                        <div>커리큘럼</div>
                        <div>상태</div>
                        <div />
                      </div>
                      <ul>
                        {rows.map((ws, i) => {
                          const isLast = i === rows.length - 1;
                          const courseName = topicToCourse.get(ws.topic_id) ?? "—";
                          return (
                            <li
                              key={ws.id}
                              className={`grid grid-cols-[100px_1fr_160px_80px_40px] items-center gap-4 px-5 h-[60px] hover:bg-ink-50/60 transition ${!isLast ? "border-b border-ink-100" : ""}`}
                            >
                              <div className="text-[12px] text-ink-500 whitespace-nowrap">{fmtDate(ws.created_at)}</div>
                              <div className="min-w-0">
                                <div className="text-[13.5px] font-semibold text-ink-900 truncate">{ws.topic_title}</div>
                              </div>
                              <div className="text-[12px] text-ink-500 truncate">{courseName}</div>
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0 bg-emerald-50 text-emerald-700 border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />완료
                              </span>
                              <div />
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </section>
                ))}
              </div>
            )}

            <div className="text-center text-[11px] text-ink-400 pb-6">
              학습 기록은 매일 자정에 자동으로 저장돼요
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

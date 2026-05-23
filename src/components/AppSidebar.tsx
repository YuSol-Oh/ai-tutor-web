"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function IHome(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 11l9-8 9 8M5 10v10h14V10"/></svg>;
}
function IToday(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>;
}
function IList(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01"/></svg>;
}
function IHistory(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/></svg>;
}
function IFlame(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3s4 4 4 8a4 4 0 1 1-8 0c0-2 1-3 1-3s1 2 3 2c0-3-1-5 0-7z"/></svg>;
}
function ISpark(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/></svg>;
}

type Tone = "ink" | "brand" | "amber";
function Badge({ tone = "ink", dot = false, children }: { tone?: Tone; dot?: boolean; children: React.ReactNode }) {
  const cls: Record<Tone, string> = {
    ink:   "bg-ink-100 text-ink-700 border-ink-200",
    brand: "bg-brand-50 text-brand-700 border-brand-100",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
  };
  const dotCls: Record<Tone, string> = {
    ink: "bg-ink-400", brand: "bg-brand-500", amber: "bg-amber-500",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${cls[tone]}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotCls[tone]}`} />}
      {children}
    </span>
  );
}

export interface AppSidebarProps {
  userName: string;
  userField: string;
  level: string;
  streak: number;
}

export default function AppSidebar({ userName, userField, level, streak }: AppSidebarProps) {
  const pathname = usePathname();
  const initial = userName.slice(-2, -1) || userName[0] || "U";

  const items = [
    { href: "/",           label: "홈",           Icon: IHome,    badge: null },
    { href: "/worksheet",  label: "오늘 학습",     Icon: IToday,   badge: "1" },
    { href: "/history",    label: "학습 기록",     Icon: IHistory, badge: null },
    { href: "/curriculum", label: "전체 커리큘럼", Icon: IList,    badge: null },
  ];

  return (
    <aside className="w-[240px] shrink-0 border-r border-ink-200 bg-white flex flex-col">
      <div className="p-4">
        <div className="rounded-2xl border border-ink-200 bg-ink-50/70 p-4">
          <div className="flex items-center gap-3">
            <div
              className="rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-semibold shadow-soft text-[16px] shrink-0"
              style={{ width: 44, height: 44 }}
            >
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-bold text-ink-900 truncate">{userName}님</div>
              <div className="text-[11.5px] text-ink-500 truncate">{userField}</div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 flex-wrap">
            <Badge tone="brand">{level}</Badge>
            {streak > 0 && (
              <Badge tone="amber" dot>
                <IFlame className="w-3 h-3 -ml-0.5" /> {streak}일 연속
              </Badge>
            )}
          </div>
        </div>
      </div>

      <nav className="px-3 pb-3 space-y-0.5">
        <div className="px-3 pt-2 pb-1.5 text-[10.5px] font-bold uppercase tracking-wider text-ink-400">메뉴</div>
        {items.map(({ href, label, Icon, badge }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={label}
              href={href}
              className={`w-full flex items-center gap-2.5 h-10 px-3 rounded-lg text-[13.5px] transition ${
                active ? "bg-brand-50 text-brand-700 font-semibold" : "text-ink-700 hover:bg-ink-50 font-medium"
              }`}
            >
              <Icon
                className={`shrink-0 ${active ? "text-brand-600" : "text-ink-400"}`}
                style={{ width: 18, height: 18 }}
              />
              <span className="flex-1 text-left whitespace-nowrap">{label}</span>
              {badge && (
                <span
                  className="text-[10px] font-bold px-1.5 inline-flex items-center justify-center rounded-full bg-brand-600 text-white shrink-0"
                  style={{ height: 18, minWidth: 18 }}
                >
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4">
        <div className="rounded-xl border border-ink-200 bg-white p-3.5">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <ISpark className="w-3.5 h-3.5" />
            </span>
            <span className="text-[12.5px] font-semibold text-ink-900 whitespace-nowrap">AI 튜터에게 질문하기</span>
          </div>
          <p className="mt-1.5 text-[11.5px] text-ink-500 leading-relaxed">학습 중 막힌 부분은 언제든 채팅으로 물어보세요.</p>
        </div>
      </div>
    </aside>
  );
}

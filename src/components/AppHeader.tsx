"use client";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

function ISpark(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/></svg>;
}
function ILogout(p: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M15 17l5-5-5-5M20 12H9M12 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6"/></svg>;
}

export interface AppHeaderProps {
  userName: string;
  userField: string;
  breadcrumbTitle?: string;
}

export default function AppHeader({ userName, userField, breadcrumbTitle }: AppHeaderProps) {
  const router = useRouter();
  const initial = userName.slice(-2, -1) || userName[0] || "U";

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="shrink-0 border-b border-ink-200 bg-white/90 backdrop-blur z-10">
      <div className="flex items-center gap-3 px-8 h-16">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shadow-soft shrink-0">
            <ISpark className="w-4 h-4" />
          </div>
          <div className="leading-tight">
            <div className="text-[15px] font-bold tracking-tight text-ink-900">Tutor<span className="text-brand-600">.</span></div>
            <div className="text-[10px] font-medium text-ink-400 -mt-0.5">AI 1:1 과외</div>
          </div>
        </Link>

        {breadcrumbTitle && (
          <div className="flex items-center gap-2 ml-2">
            <span className="text-ink-300 text-[14px]">/</span>
            <span className="text-[14px] font-semibold text-ink-700 whitespace-nowrap">{breadcrumbTitle}</span>
          </div>
        )}

        <div className="flex-1" />

        <div className="flex items-center gap-2.5 pl-3 border-l border-ink-200 h-9 shrink-0">
          <div
            className="rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-semibold shadow-soft text-[13px] shrink-0"
            style={{ width: 32, height: 32 }}
          >
            {initial}
          </div>
          <div className="leading-tight">
            <div className="text-[13px] font-semibold text-ink-900 whitespace-nowrap">{userName}님</div>
            <div className="text-[11px] text-ink-500 whitespace-nowrap">{userField}</div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="ml-1 h-9 px-3 rounded-lg text-[12.5px] font-medium text-ink-600 hover:bg-ink-100 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition"
        >
          <ILogout className="w-4 h-4" />
          로그아웃
        </button>
      </div>
    </header>
  );
}

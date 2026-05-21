"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Curriculum, Topic } from "@/types";

// ─── Message Types ────────────────────────────────────────────────────────────

type CurriculumMsg = {
  type: "ai-curriculum";
  data: Curriculum;
  version: number;
  updatedTopicIds: string[];
};

type Message =
  | { type: "ai-intro" }
  | CurriculumMsg
  | { type: "ai-followup" }
  | { type: "user"; text: string }
  | { type: "ai-revise"; summary: string; changes: string[] }
  | { type: "ai-confirm-hint" };

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconBack(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function IconSend(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M5 12l14-7-4 14-3-6-7-1z" />
    </svg>
  );
}

function IconArrow(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function IconSparkle(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6" />
    </svg>
  );
}

function IconCheck(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
      strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  );
}

function IconRefresh(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 12a9 9 0 0 1 15.5-6.3L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15.5 6.3L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}

// ─── Atoms ────────────────────────────────────────────────────────────────────

function Avatar() {
  return (
    <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shadow-soft">
      <IconSparkle className="w-4 h-4" />
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3 bg-white border border-ink-200 rounded-2xl rounded-tl-md shadow-soft">
      <span className="w-1.5 h-1.5 rounded-full bg-ink-400 animate-blink" />
      <span className="w-1.5 h-1.5 rounded-full bg-ink-400 animate-blink dot-2" />
      <span className="w-1.5 h-1.5 rounded-full bg-ink-400 animate-blink dot-3" />
    </div>
  );
}

function AiBubble({ children, withAvatar = true }: {
  children: React.ReactNode;
  withAvatar?: boolean;
}) {
  return (
    <div className="flex gap-2.5 items-end animate-fade-up">
      <div className="w-8">{withAvatar && <Avatar />}</div>
      <div className="max-w-[82%]">
        <div className="px-4 py-3 bg-white border border-ink-200 rounded-2xl rounded-tl-md shadow-soft text-[14.5px] leading-relaxed text-ink-900">
          {children}
        </div>
      </div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end animate-fade-up">
      <div className="max-w-[82%] px-4 py-3 bg-brand-600 text-white rounded-2xl rounded-tr-md shadow-soft text-[14.5px] leading-relaxed whitespace-pre-wrap">
        {text}
      </div>
    </div>
  );
}

// ─── Curriculum Card ──────────────────────────────────────────────────────────

function CurriculumCard({
  data, version, updatedTopicIds, onConfirm, confirmed,
}: {
  data: Curriculum;
  version: number;
  updatedTopicIds: string[];
  onConfirm: () => void;
  confirmed: boolean;
}) {
  const updatedSet = new Set(updatedTopicIds);

  return (
    <div className="flex gap-2.5 items-end animate-fade-up">
      <div className="w-8"><Avatar /></div>
      <div className="flex-1 max-w-[88%]">
        <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden shadow-soft">
          {/* header */}
          <div className="px-4 pt-4 pb-3 border-b border-ink-100">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold tracking-wide text-brand-600 uppercase">
                  Curriculum v{version}
                </div>
                <div className="mt-0.5 text-[15px] font-semibold text-ink-900 leading-snug">
                  {data.subject} 커리큘럼
                </div>
                <div className="mt-1 text-[12px] text-ink-500">
                  총 {data.totalTopics}개 토픽
                </div>
              </div>
              {version > 1 && (
                <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-medium text-brand-700 bg-brand-50 border border-brand-100 px-2 py-1 rounded-full">
                  <IconRefresh className="w-3 h-3" /> 수정됨
                </span>
              )}
            </div>
          </div>

          {/* topics */}
          <ol className="px-2 py-2">
            {data.topics.map((t: Topic, i: number) => {
              const isUpdated = updatedSet.has(t.topicId);
              return (
                <li
                  key={t.topicId}
                  className={`flex gap-3 px-2 py-2.5 rounded-xl ${isUpdated ? "bg-brand-50/60 ring-1 ring-inset ring-brand-100" : ""}`}
                >
                  <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-semibold mt-0.5 ${
                    isUpdated ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-700"
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[14px] font-semibold text-ink-900 leading-snug">{t.title}</span>
                      {isUpdated && (
                        <span className="text-[10px] font-semibold text-brand-700 bg-white border border-brand-200 px-1.5 py-0.5 rounded">
                          UPDATED
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-[12.5px] text-ink-500 leading-relaxed">{t.description}</div>
                    <div className="mt-1 text-[11px] text-ink-400 font-medium">{t.estimatedMinutes}분 · 회차 {i + 1}</div>
                  </div>
                </li>
              );
            })}
          </ol>

          {/* confirm button */}
          <div className="px-3 pt-1 pb-3">
            <button
              onClick={onConfirm}
              disabled={confirmed}
              className={`w-full h-12 rounded-xl text-[14.5px] font-semibold transition-all flex items-center justify-center gap-2 ${
                confirmed
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
                  : "bg-brand-600 hover:bg-brand-700 text-white shadow-soft active:scale-[0.99]"
              }`}
            >
              {confirmed ? (
                <><IconCheck className="w-4 h-4" /> 이 커리큘럼으로 시작했어요</>
              ) : (
                <>이 커리큘럼으로 시작하기 <IconArrow className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Suggestions ──────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  "3번 토픽을 더 자세하게 해주세요",
  "실습 비중을 늘려주세요",
  "하루 30분으로 늘리고 싶어요",
];

// ─── Diff helper ─────────────────────────────────────────────────────────────

function diffTopics(oldTopics: Topic[], newTopics: Topic[]): string[] {
  const oldMap = new Map(oldTopics.map((t) => [t.topicId, t]));
  return newTopics
    .filter((t) => {
      const o = oldMap.get(t.topicId);
      return !o || o.title !== t.title || o.description !== t.description || o.estimatedMinutes !== t.estimatedMinutes;
    })
    .map((t) => t.topicId);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CurriculumPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastTopics, setLastTopics] = useState<Topic[]>([]);
  const [curriculumVersion, setCurriculumVersion] = useState(1);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/curriculum")
      .then((r) => {
        if (!r.ok) throw new Error("커리큘럼을 불러올 수 없어요.");
        return r.json();
      })
      .then((data: Curriculum) => {
        setLastTopics(data.topics);
        setMessages([
          { type: "ai-intro" },
          { type: "ai-curriculum", data, version: 1, updatedTopicIds: [] },
          { type: "ai-followup" },
        ]);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  async function send(text?: string) {
    const value = (text ?? input).trim();
    if (!value || confirmed) return;
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
      const data: Curriculum & { revisionSummary: string; revisionChanges: string[] } = await res.json();

      const updated = diffTopics(lastTopics, data.topics);
      setLastTopics(data.topics);
      const newVersion = curriculumVersion + 1;
      setCurriculumVersion(newVersion);

      setMessages((m) => [
        ...m,
        {
          type: "ai-revise",
          summary: data.revisionSummary,
          changes: data.revisionChanges,
        },
        {
          type: "ai-curriculum",
          data,
          version: newVersion,
          updatedTopicIds: updated,
        },
        { type: "ai-confirm-hint" },
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

  function handleConfirm() {
    setConfirmed(true);
    setTimeout(() => router.push("/worksheet"), 800);
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-ink-100">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mx-auto shadow-soft">
            <IconSparkle className="w-6 h-6 text-white" />
          </div>
          <p className="text-ink-500 text-sm">커리큘럼을 불러오는 중이에요...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-ink-100">
        <div className="text-center space-y-4">
          <p className="text-ink-700">{error}</p>
          <button
            onClick={() => router.push("/onboarding")}
            className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            설문 다시 시작하기
          </button>
        </div>
      </main>
    );
  }

  // ── Chat UI ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen w-full flex items-start sm:items-center justify-center bg-ink-100 sm:p-6">
      <div className="w-full sm:max-w-[420px] sm:rounded-[28px] sm:shadow-[0_20px_60px_-15px_rgba(15,23,42,0.25)] sm:border sm:border-ink-200 bg-ink-50 overflow-hidden flex flex-col min-h-screen sm:min-h-[860px] sm:h-[860px]">

        {/* Header */}
        <header className="shrink-0 bg-white/85 backdrop-blur border-b border-ink-100">
          <div className="flex items-center gap-2 px-3 h-14">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-full hover:bg-ink-100 text-ink-700 flex items-center justify-center"
              aria-label="뒤로"
            >
              <IconBack className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-semibold text-ink-900 leading-tight truncate">나만의 커리큘럼 만들기</div>
              <div className="text-[11.5px] text-ink-500 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                AI 튜터가 함께하고 있어요
              </div>
            </div>
            <div className="text-[11px] font-medium text-ink-500 px-2.5 py-1 bg-ink-100 rounded-full whitespace-nowrap">
              3 / 4 단계
            </div>
          </div>
          {/* progress bar */}
          <div className="h-1 bg-ink-100">
            <div className="h-full w-3/4 bg-gradient-to-r from-brand-500 to-brand-700" />
          </div>
        </header>

        {/* Chat scroll */}
        <main ref={scrollRef} className="flex-1 overflow-y-auto scroll-clean px-4 py-5 space-y-4">
          {messages.map((m, i) => {
            if (m.type === "ai-intro") {
              return (
                <AiBubble key={i}>
                  안녕하세요! 설문을 바탕으로 커리큘럼을 만들었어요 😊
                  <div className="mt-1.5 text-ink-700">아래 순서로 진행하면 어떨까요?</div>
                </AiBubble>
              );
            }

            if (m.type === "ai-curriculum") {
              return (
                <CurriculumCard
                  key={i}
                  data={m.data}
                  version={m.version}
                  updatedTopicIds={m.updatedTopicIds}
                  confirmed={confirmed}
                  onConfirm={handleConfirm}
                />
              );
            }

            if (m.type === "ai-followup") {
              return (
                <AiBubble key={i} withAvatar={false}>
                  수정하고 싶은 부분이 있으면 말씀해주세요!
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        disabled={confirmed}
                        className="text-[12px] text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-100 px-2.5 py-1.5 rounded-full transition disabled:opacity-40"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </AiBubble>
              );
            }

            if (m.type === "user") {
              return <UserBubble key={i} text={m.text} />;
            }

            if (m.type === "ai-revise") {
              return (
                <AiBubble key={i}>
                  {m.summary}
                  {m.changes.length > 0 && (
                    <ul className="mt-2 space-y-1.5">
                      {m.changes.map((c, idx) => (
                        <li key={idx} className="flex gap-2 text-[13.5px] text-ink-700">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                          <span className="leading-relaxed">{c}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </AiBubble>
              );
            }

            if (m.type === "ai-confirm-hint") {
              return (
                <AiBubble key={i} withAvatar={false}>
                  더 수정할 부분이 없다면 아래 버튼으로 시작할 수 있어요.{" "}
                  <span className="text-ink-500">언제든 다시 말씀해주셔도 좋아요.</span>
                </AiBubble>
              );
            }

            return null;
          })}

          {typing && (
            <div className="flex gap-2.5 items-end animate-fade-up">
              <div className="w-8"><Avatar /></div>
              <TypingDots />
            </div>
          )}
        </main>

        {/* Input */}
        <footer className="shrink-0 bg-white border-t border-ink-100 px-3 pt-3 pb-4">
          <div className="flex items-end gap-2">
            <div
              className="flex-1 flex items-end bg-ink-50 border border-ink-200 rounded-2xl px-3.5 py-2.5 transition"
              style={{
                outline: undefined,
              }}
              onFocusCapture={(e) => (e.currentTarget.style.boxShadow = "var(--shadow-ring)")}
              onBlurCapture={(e) => (e.currentTarget.style.boxShadow = "")}
            >
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKey}
                placeholder={confirmed ? "학습을 시작했어요 🎉" : "수정하고 싶은 내용을 입력해주세요"}
                disabled={confirmed}
                className="flex-1 bg-transparent resize-none outline-none text-[14.5px] text-ink-900 placeholder:text-ink-400 leading-relaxed max-h-32 disabled:cursor-not-allowed"
              />
            </div>
            <button
              onClick={() => send()}
              disabled={!input.trim() || confirmed}
              className={`shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center transition ${
                !input.trim() || confirmed
                  ? "bg-ink-100 text-ink-400 cursor-not-allowed"
                  : "bg-brand-600 hover:bg-brand-700 text-white shadow-soft active:scale-95"
              }`}
              aria-label="전송"
            >
              <IconSend className="w-5 h-5 -translate-x-px translate-y-px" />
            </button>
          </div>
          <div className="mt-2 text-center text-[11px] text-ink-400">
            AI가 작성한 커리큘럼은 학습 진행에 따라 자동으로 조정돼요
          </div>
        </footer>
      </div>
    </div>
  );
}

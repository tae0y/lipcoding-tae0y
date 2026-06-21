import { useState } from "react";
import type { Emotion, Idea, Screen, UserState } from "../lib/types";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { WaitingProgress } from "../components/WaitingProgress";
import { TopNav } from "../components/TopNav";

const EMOTIONS: Array<{ value: Emotion; label: string }> = [
    { value: "bad", label: "😶 안개" },
    { value: "normal", label: "🌊 잔잔" },
    { value: "good", label: "☀️ 화창" },
];

interface CaptureScreenProps {
    onNavigate: (s: Screen) => void;
    ideaText: string;
    onIdeaTextChange: (v: string) => void;
    onSubmit: () => void;
    submitting: boolean;
    lastVerdict: Idea | null;
    verdictError: string | null;
    userState: UserState | null;
    onEmotion: (e: Emotion) => void;
    onToggleCalendar: () => void;
    onAddTodo: (text: string) => void;
    onRemoveTodo: (index: number) => void;
}

export default function CaptureScreen({
    onNavigate,
    ideaText,
    onIdeaTextChange,
    onSubmit,
    submitting,
    lastVerdict,
    verdictError,
    userState,
    onEmotion,
    onToggleCalendar,
    onAddTodo,
    onRemoveTodo,
}: CaptureScreenProps) {
    const [todoInput, setTodoInput] = useState("");

    function handleAddTodo() {
        const text = todoInput.trim();
        if (!text) return;
        onAddTodo(text);
        setTodoInput("");
    }

    return (
        <div className="min-h-screen">
            <TopNav active="capture" onNavigate={onNavigate} />

            <main className="mx-auto max-w-[640px] px-4 py-10 space-y-12">
                <section className="space-y-6">
                    <div className="space-y-1.5">
                        <h1 className="font-display text-3xl font-extrabold tracking-tight text-[var(--ink)]">
                            지금 떠오른 생각, 한 줄로
                        </h1>
                        <p className="text-sm text-[var(--ink-soft)]">
                            담아두고 머릿속을 비우세요. 중요한 일에 집중하세요.
                        </p>
                    </div>

                    <Textarea
                        value={ideaText}
                        onChange={(e) => onIdeaTextChange(e.target.value)}
                        placeholder="여기에 떠오른 생각을 한 줄로…"
                        rows={3}
                        disabled={submitting}
                        autoFocus
                    />
                    <div className="flex justify-end">
                        <Button onClick={onSubmit} disabled={submitting || !ideaText.trim()}>
                            {submitting ? "담는 중…" : "담기"}
                        </Button>
                    </div>
                    <WaitingProgress active={submitting} />

                    {verdictError ? (
                        <div
                            role="alert"
                            className="rounded-2xl border border-[rgba(225,29,72,0.28)] bg-[rgba(225,29,72,0.10)] px-4 py-3 text-sm text-[var(--ink)]"
                        >
                            담는 중 문제가 생겼어요: {verdictError}
                        </div>
                    ) : !submitting && lastVerdict ? (
                        <VerdictCard idea={lastVerdict} onNavigate={onNavigate} />
                    ) : null}
                </section>

                <section className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-[var(--glass-edge)] pb-2">
                        <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                        <h2 className="font-display text-xl font-extrabold tracking-tight text-[var(--ink)]">
                            오늘 상태
                        </h2>
                    </div>
                    <Card>
                        <CardContent className="space-y-5">
                            {userState == null ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-5 w-2/3" />
                                    <Skeleton className="h-5 w-1/2" />
                                    <Skeleton className="h-5 w-3/4" />
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-[var(--ink-faint)]">기분</p>
                                        <div className="flex gap-2">
                                            {EMOTIONS.map((e) => (
                                                <Button
                                                    key={e.value}
                                                    variant={
                                                        userState.emotion === e.value ? "primary" : "outline"
                                                    }
                                                    onClick={() => onEmotion(e.value)}
                                                >
                                                    {e.label}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-[var(--ink-faint)]">저녕</p>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant={!userState.calendarBusy ? "primary" : "outline"}
                                                onClick={onToggleCalendar}
                                                aria-pressed={!userState.calendarBusy}
                                            >
                                                {!userState.calendarBusy ? "☑" : "☐"} 저녁 비었음
                                            </Button>
                                            <span className="text-xs text-[var(--ink-faint)]">
                                                (끄면 = 약속 있음)
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-[var(--ink-faint)]">할일</p>
                                        <ul className="space-y-1">
                                            {userState.todos.map((todo, i) => (
                                                <li
                                                    key={i}
                                                    className="flex items-center justify-between gap-2 text-sm"
                                                >
                                                    <span className="text-[var(--ink)]">{todo}</span>
                                                    <Button
                                                        variant="ghost"
                                                        className="px-2 py-1 text-[var(--ink-faint)]"
                                                        aria-label="할일 삭제"
                                                        onClick={() => onRemoveTodo(i)}
                                                    >
                                                        ✕
                                                    </Button>
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={todoInput}
                                                onChange={(e) => setTodoInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") handleAddTodo();
                                                }}
                                                placeholder="할일 추가…"
                                                className="w-full rounded-2xl border border-[var(--glass-edge)] bg-[var(--glass-fill)] px-3 py-2 text-sm font-semibold text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/15"
                                            />
                                            <Button variant="secondary" onClick={handleAddTodo}>
                                                + 추가
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </section>
            </main>
        </div>
    );
}

function VerdictCard({
    idea,
    onNavigate,
}: {
    idea: Idea;
    onNavigate: (s: Screen) => void;
}) {
    const isInbox = idea.status === "inbox";
    const isInfoGap = idea.dumpReason === "info_gap";
    const researchCount = idea.research?.materials.length ?? 0;

    const title = isInbox
        ? "✅ 바로 착수 가능 — 인박스로"
        : isInfoGap
            ? "🔎 정보가 더 필요해요 — 덤프(사전조사)"
            : "🌙 지금은 여유가 부족 — 덤프(나중에)";

    return (
        <div
            role="status"
            aria-live="polite"
            className="rounded-2xl border border-[var(--glass-edge)] bg-[var(--glass-fill)] px-4 py-3 space-y-2 backdrop-blur-md"
        >
            <p className="text-sm font-extrabold text-[var(--ink)]">{title}</p>
            <p className="text-xs text-[var(--ink-soft)]">“{idea.text}”</p>
            {isInfoGap ? (
                researchCount > 0 ? (
                    <p className="text-xs text-[var(--ink-soft)]">
                        AI가 사전조사 자료 {researchCount}건을 자동으로 붙였어요.
                    </p>
                ) : (
                    <p className="text-xs text-[var(--ink-soft)]">
                        사전조사는 인박스에서 다시 시도할 수 있어요.
                    </p>
                )
            ) : null}
            <div className="flex justify-end pt-1">
                <Button variant="secondary" onClick={() => onNavigate("inbox")}>
                    인박스 보기 →
                </Button>
            </div>
        </div>
    );
}

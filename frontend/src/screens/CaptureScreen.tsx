import { useState } from "react";
import type { Emotion, Screen, UserState } from "../lib/types";
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
                        <h1 className="text-2xl font-extrabold tracking-tight text-white">
                            지금 떠오른 생각, 한 줄로
                        </h1>
                        <p className="text-sm text-[rgba(255,255,255,0.55)]">
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
                </section>

                <section className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.20)] pb-2">
                        <span className="h-2 w-2 rounded-full bg-[#e8252a]" />
                        <h2 className="text-xl font-extrabold tracking-tight text-white">
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
                                        <p className="text-xs font-bold text-[rgba(255,255,255,0.45)]">기분</p>
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
                                        <p className="text-xs font-bold text-[rgba(255,255,255,0.45)]">저녀</p>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant={!userState.calendarBusy ? "primary" : "outline"}
                                                onClick={onToggleCalendar}
                                                aria-pressed={!userState.calendarBusy}
                                            >
                                                {!userState.calendarBusy ? "☑" : "☐"} 저녁 비었음
                                            </Button>
                                            <span className="text-xs text-[#6a6a72]">
                                                (끄면 = 약속 있음)
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-[rgba(255,255,255,0.45)]">할일</p>
                                        <ul className="space-y-1">
                                            {userState.todos.map((todo, i) => (
                                                <li
                                                    key={i}
                                                    className="flex items-center justify-between gap-2 text-sm"
                                                >
                                                    <span className="text-[rgba(255,255,255,0.90)]">{todo}</span>
                                                    <Button
                                                        variant="ghost"
                                                        className="px-2 py-1 text-[rgba(255,255,255,0.45)]"
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
                                                className="w-full rounded-[14px] border border-[rgba(255,255,255,0.45)] bg-[rgba(255,255,255,0.08)] px-3 py-2 text-sm font-semibold text-white placeholder:text-[rgba(255,255,255,0.38)] focus:outline-none focus:ring-2 focus:ring-white/15"
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

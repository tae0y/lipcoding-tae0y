import { useState } from "react";
import type { Emotion, Screen, UserState } from "../lib/types";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { TopNav } from "../components/TopNav";

const EMOTIONS: Array<{ value: Emotion; label: string }> = [
    { value: "bad", label: "나쁨" },
    { value: "normal", label: "보통" },
    { value: "good", label: "좋음" },
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
                        <h2 className="text-xl font-semibold tracking-tight text-neutral-900">
                            지금 떠오른 생각, 한 줄로
                        </h2>
                        <p className="text-sm text-neutral-500">
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
                </section>

                <section className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-neutral-200 pb-2">
                        <span className="h-2 w-2 rounded-full bg-sky-400" />
                        <h2 className="text-sm font-semibold tracking-tight text-neutral-900">
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
                                        <p className="text-xs font-medium text-neutral-500">기분</p>
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
                                        <p className="text-xs font-medium text-neutral-500">저녁</p>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant={!userState.calendarBusy ? "primary" : "outline"}
                                                onClick={onToggleCalendar}
                                                aria-pressed={!userState.calendarBusy}
                                            >
                                                {!userState.calendarBusy ? "☑" : "☐"} 저녁 비었음
                                            </Button>
                                            <span className="text-xs text-neutral-500">
                                                (끄면 = 약속 있음)
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-xs font-medium text-neutral-500">할일</p>
                                        <ul className="space-y-1">
                                            {userState.todos.map((todo, i) => (
                                                <li
                                                    key={i}
                                                    className="flex items-center justify-between gap-2 text-sm"
                                                >
                                                    <span className="text-neutral-800">{todo}</span>
                                                    <Button
                                                        variant="ghost"
                                                        className="px-2 py-1 text-neutral-400"
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
                                                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
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

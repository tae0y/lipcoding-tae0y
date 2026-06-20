import { useState } from "react";
import type {
    DumpReason,
    Emotion,
    Idea,
    UserState,
} from "../lib/types";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";

interface CaptureScreenProps {
    onNavigate: () => void;
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
    onSchedule: (weekday: number, time: string) => void;
}

const EMOTIONS: Array<{ value: Emotion; label: string }> = [
    { value: "bad", label: "나쁨" },
    { value: "normal", label: "보통" },
    { value: "good", label: "좋음" },
];

const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];

const DUMP_HELPER: Record<DumpReason, string> = {
    info_gap: "AI가 사전조사 중…",
    no_capacity: "여유 생기면 추천할게요",
};

const DUMP_LABEL: Record<DumpReason, string> = {
    info_gap: "사전조사 대기",
    no_capacity: "여유 부족",
};

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
    onSchedule,
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
            <header className="sticky top-0 z-10 border-b border-neutral-200/70 bg-neutral-50/80 backdrop-blur">
                <div className="mx-auto flex max-w-[640px] items-center justify-between px-4 py-3.5">
                    <h1 className="text-base font-semibold tracking-tight">Ideas</h1>
                    <Button variant="ghost" onClick={onNavigate}>
                        조회 →
                    </Button>
                </div>
            </header>

            <main className="mx-auto max-w-[640px] px-4 py-8 space-y-10">
                <section className="space-y-3">
                    <h2 className="text-xs font-semibold tracking-wide text-neutral-500">
                        아이디어 한 줄
                    </h2>
                    <Textarea
                        value={ideaText}
                        onChange={(e) => onIdeaTextChange(e.target.value)}
                        placeholder="여기에 떠오른 생각을 한 줄로…"
                        rows={2}
                        disabled={submitting}
                    />
                    <div className="flex justify-end">
                        <Button onClick={onSubmit} disabled={submitting}>
                            {submitting ? "담는 중…" : "담기"}
                        </Button>
                    </div>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xs font-semibold tracking-wide text-neutral-500">
                        판정 결과
                    </h2>
                    <Card>
                        <CardContent className="space-y-2">
                            {verdictError ? (
                                <div className="rounded-md bg-neutral-100 px-3 py-2 text-sm text-neutral-600">
                                    판정 실패 — 초안 저장됨. 재시도?
                                </div>
                            ) : lastVerdict ? (
                                lastVerdict.status === "inbox" ? (
                                    <p className="text-sm text-neutral-900">
                                        지금 착수 가능 → 인박스에 추가됨
                                    </p>
                                ) : (
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-neutral-900">덤프 보관</span>
                                            {lastVerdict.dumpReason ? (
                                                <Badge>{DUMP_LABEL[lastVerdict.dumpReason]}</Badge>
                                            ) : null}
                                        </div>
                                        {lastVerdict.dumpReason ? (
                                            <p className="text-xs text-neutral-500">
                                                {DUMP_HELPER[lastVerdict.dumpReason]}
                                            </p>
                                        ) : null}
                                    </div>
                                )
                            ) : (
                                <p className="text-sm text-neutral-400">아직 판정 없음</p>
                            )}
                        </CardContent>
                    </Card>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xs font-semibold tracking-wide text-neutral-500">
                        오늘 상태
                    </h2>
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

                <section className="space-y-3">
                    <h2 className="text-xs font-semibold tracking-wide text-neutral-500">
                        주간 추천 시각
                    </h2>
                    <Card>
                        <CardContent className="space-y-3">
                            {userState == null ? (
                                <Skeleton className="h-9 w-full" />
                            ) : (
                                <>
                                    <div className="flex gap-2">
                                        <select
                                            value={userState.triggerSchedule.weekday}
                                            onChange={(e) =>
                                                onSchedule(
                                                    Number(e.target.value),
                                                    userState.triggerSchedule.time,
                                                )
                                            }
                                            aria-label="요일"
                                            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                                        >
                                            {WEEKDAYS.map((label, i) => (
                                                <option key={i} value={i}>
                                                    {label}
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type="time"
                                            value={userState.triggerSchedule.time}
                                            onChange={(e) =>
                                                onSchedule(
                                                    userState.triggerSchedule.weekday,
                                                    e.target.value,
                                                )
                                            }
                                            aria-label="시각"
                                            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                                        />
                                    </div>
                                    <p className="text-xs text-neutral-500">
                                        (퇴근 + 20~30분 버퍼 권장)
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </section>
            </main>
        </div>
    );
}

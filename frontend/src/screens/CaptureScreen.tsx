import type { DumpReason, Idea } from "../lib/types";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";

interface CaptureScreenProps {
    onNavigate: () => void;
    ideaText: string;
    onIdeaTextChange: (v: string) => void;
    onSubmit: () => void;
    submitting: boolean;
    lastVerdict: Idea | null;
    verdictError: string | null;
}

const DUMP_HELPER: Record<DumpReason, string> = {
    info_gap: "사전조사 후 인박스에서 실행 가능",
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
}: CaptureScreenProps) {
    const hasVerdict = Boolean(lastVerdict || verdictError);

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

            <main className="mx-auto max-w-[640px] px-4 py-16 space-y-6">
                <div className="space-y-1.5">
                    <h2 className="text-xl font-semibold tracking-tight text-neutral-900">
                        지금 떠오른 생각, 한 줄로
                    </h2>
                    <p className="text-sm text-neutral-500">
                        담아두고 머릿속에서 비우세요. 판단은 나중에 AI가 대신합니다.
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

                {hasVerdict ? (
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
                            ) : null}
                        </CardContent>
                    </Card>
                ) : null}
            </main>
        </div>
    );
}

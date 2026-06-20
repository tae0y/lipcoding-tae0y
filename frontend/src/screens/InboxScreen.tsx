import type {
    Idea,
    Suggestion,
    SuggestionDecision,
} from "../lib/types";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";

interface InboxScreenProps {
    onNavigate: () => void;
    loading: boolean;
    suggestion: Suggestion | null;
    onDecide: (decision: SuggestionDecision) => void;
    inboxIdeas: Idea[];
    dumpIdeas: Idea[];
    onRunResearch?: (ideaId: string) => void;
    researchingId?: string | null;
}

const REASON_ROWS: Array<{
    key: "lowLoad" | "researchDone" | "relevance";
    label: string;
}> = [
        { key: "lowLoad", label: "부하 낮음" },
        { key: "researchDone", label: "사전조사" },
        { key: "relevance", label: "관심사 연관" },
    ];

const DUMP_REASON_LABEL: Record<string, string> = {
    info_gap: "사전조사 대기",
    no_capacity: "여유 부족",
};

export default function InboxScreen({
    onNavigate,
    loading,
    suggestion,
    onDecide,
    inboxIdeas,
    dumpIdeas,
    onRunResearch,
    researchingId,
}: InboxScreenProps) {
    return (
        <div className="min-h-screen">
            <header className="sticky top-0 z-10 border-b border-neutral-200/70 bg-neutral-50/80 backdrop-blur">
                <div className="mx-auto flex max-w-[640px] items-center justify-between px-4 py-3.5">
                    <h1 className="text-base font-semibold tracking-tight">Inbox</h1>
                    <Button variant="ghost" onClick={onNavigate}>
                        + 입력
                    </Button>
                </div>
            </header>

            <main className="mx-auto max-w-[640px] px-4 py-8 space-y-10">
                <section className="space-y-3">
                    <h2 className="text-xs font-semibold tracking-wide text-neutral-500">
                        이번 주 추천
                    </h2>
                    {loading ? (
                        <Card>
                            <CardContent className="space-y-3">
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-2/3" />
                            </CardContent>
                        </Card>
                    ) : suggestion ? (
                        <Card className="border-transparent bg-white shadow-[0_12px_44px_-16px_rgba(99,102,241,0.45)] ring-1 ring-inset ring-indigo-200">
                            <CardHeader>
                                <CardTitle className="text-base">
                                    {suggestion.idea?.text ?? suggestion.ideaId}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <ul className="space-y-2">
                                    {REASON_ROWS.map(({ key, label }) => (
                                        <li
                                            key={key}
                                            className="flex items-start justify-between gap-3 text-sm"
                                        >
                                            <span className="text-neutral-700">
                                                {suggestion.reasons[key]}
                                            </span>
                                            <Badge>{label}</Badge>
                                        </li>
                                    ))}
                                </ul>
                                {suggestion.decision ? (
                                    <Badge>{suggestion.decision}</Badge>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        <Button variant="gradient" onClick={() => onDecide("accepted")}>
                                            지금 해볼게요
                                        </Button>
                                        <Button variant="outline" onClick={() => onDecide("postponed")}>
                                            다음에
                                        </Button>
                                        <Button variant="ghost" onClick={() => onDecide("dismissed")}>
                                            관심없음
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <p className="text-sm text-neutral-500">지금은 제안 없음.</p>
                    )}
                </section>

                <section className="space-y-3">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xs font-semibold tracking-wide text-neutral-500">
                            지금 착수 가능 (inbox)
                        </h2>
                        <Badge>{inboxIdeas.length}</Badge>
                    </div>
                    <Card>
                        <CardContent>
                            {inboxIdeas.length === 0 ? (
                                <p className="text-sm text-neutral-400">비어 있음</p>
                            ) : (
                                <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-800">
                                    {inboxIdeas.map((idea) => (
                                        <li key={idea.id}>{idea.text}</li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </section>

                <section className="space-y-3">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xs font-semibold tracking-wide text-neutral-500">
                            보관함 / 덤프
                        </h2>
                        <Badge>{dumpIdeas.length}</Badge>
                    </div>
                    <Card>
                        <CardContent>
                            {dumpIdeas.length === 0 ? (
                                <p className="text-sm text-neutral-400">비어 있음</p>
                            ) : (
                                <ul className="space-y-3">
                                    {dumpIdeas.map((idea) => (
                                        <li key={idea.id} className="space-y-2">
                                            <div className="flex items-start justify-between gap-3">
                                                <span className="text-sm text-neutral-800">
                                                    {idea.text}
                                                </span>
                                                {idea.dumpReason ? (
                                                    <Badge>
                                                        {DUMP_REASON_LABEL[
                                                            idea.dumpReason
                                                        ] ?? idea.dumpReason}
                                                    </Badge>
                                                ) : null}
                                            </div>
                                            {idea.dumpReason === "info_gap" && !idea.research && onRunResearch ? (
                                                <Button
                                                    variant="outline"
                                                    onClick={() => onRunResearch(idea.id)}
                                                    disabled={researchingId === idea.id}
                                                    className="text-xs h-7 px-2"
                                                >
                                                    {researchingId === idea.id ? "조사 중…" : "사전조사 실행"}
                                                </Button>
                                            ) : null}
                                            {idea.research ? (
                                                <details className="text-sm">
                                                    <summary className="cursor-pointer text-neutral-600">
                                                        ▸ 조사노트
                                                    </summary>
                                                    <div className="mt-2 space-y-3 pl-3">
                                                        {idea.research.materials.length > 0 ? (
                                                            <ul className="space-y-1">
                                                                {idea.research.materials.map((m, i) => (
                                                                    <li key={i} className="text-neutral-700">
                                                                        {m.fact}
                                                                        {m.url ? (
                                                                            <>
                                                                                {" "}
                                                                                <a
                                                                                    href={m.url}
                                                                                    target="_blank"
                                                                                    rel="noreferrer"
                                                                                    className="text-neutral-900 underline"
                                                                                >
                                                                                    링크
                                                                                </a>
                                                                            </>
                                                                        ) : null}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : null}
                                                        {idea.research.options.length > 0 ? (
                                                            <ul className="list-disc space-y-1 pl-5 text-neutral-700">
                                                                {idea.research.options.map((opt, i) => (
                                                                    <li key={i}>{opt}</li>
                                                                ))}
                                                            </ul>
                                                        ) : null}
                                                    </div>
                                                </details>
                                            ) : null}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </section>
            </main>
        </div>
    );
}

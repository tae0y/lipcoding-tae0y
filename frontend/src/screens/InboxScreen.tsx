import type {
    Idea,
    Screen,
    Suggestion,
    SuggestionDecision,
} from "../lib/types";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { WaitingProgress, RESEARCH_PHRASES } from "../components/WaitingProgress";
import { TopNav } from "../components/TopNav";

interface InboxScreenProps {
    onNavigate: (s: Screen) => void;
    loading: boolean;
    suggestion: Suggestion | null;
    onDecide: (decision: SuggestionDecision) => void;
    inboxIdeas: Idea[];
    dumpIdeas: Idea[];
    onRunResearch?: (ideaId: string) => void;
    onDeleteIdea?: (id: string) => void;
    researchingId?: string | null;
    researchProgress?: string;
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

const DECISION_LABEL: Record<string, string> = {
    accepted: "할게요",
    postponed: "다음에",
    dismissed: "관심없음",
};

export default function InboxScreen({
    onNavigate,
    loading,
    suggestion,
    onDecide,
    inboxIdeas,
    dumpIdeas,
    onRunResearch,
    onDeleteIdea,
    researchingId,
    researchProgress,
}: InboxScreenProps) {
    return (
        <div className="min-h-screen">
            <TopNav active="inbox" onNavigate={onNavigate} />

            <main className="mx-auto max-w-[640px] px-4 py-8 space-y-12">
                <section className="space-y-3">
                    <div className="flex items-baseline justify-between border-b border-neutral-200 pb-2">
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-violet-400" />
                            <h2 className="text-sm font-semibold tracking-tight text-neutral-900">
                                이번 주 추천
                            </h2>
                        </div>
                    </div>
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
                                    <Badge>
                                        {DECISION_LABEL[suggestion.decision] ??
                                            suggestion.decision}
                                    </Badge>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        <Button onClick={() => onDecide("accepted")}>
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
                    <div className="flex items-baseline justify-between border-b border-neutral-200 pb-2">
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-400" />
                            <h2 className="text-sm font-semibold tracking-tight text-neutral-900">
                                지금 착수 가능
                            </h2>
                        </div>
                        <span className="text-xs font-medium text-neutral-400">
                            {inboxIdeas.length}개
                        </span>
                    </div>
                    <Card>
                        <CardContent>
                            {inboxIdeas.length === 0 ? (
                                <p className="text-sm text-neutral-400">비어 있음</p>
                            ) : (
                                <ul className="space-y-1 text-sm text-neutral-800">
                                    {inboxIdeas.map((idea) => (
                                        <li key={idea.id} className="flex items-center justify-between gap-2">
                                            <span>{idea.text}</span>
                                            {onDeleteIdea && (
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => onDeleteIdea(idea.id)}
                                                >
                                                    삭제
                                                </Button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </section>

                <section className="space-y-3">
                    <div className="flex items-baseline justify-between border-b border-neutral-200 pb-2">
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-amber-400" />
                            <h2 className="text-sm font-semibold tracking-tight text-neutral-900">
                                보관함 / 덤프
                            </h2>
                        </div>
                        <span className="text-xs font-medium text-neutral-400">
                            {dumpIdeas.length}개
                        </span>
                    </div>
                    <Card>
                        <CardContent>
                            {dumpIdeas.length === 0 ? (
                                <p className="text-sm text-neutral-400">비어 있음</p>
                            ) : (
                                <ul className="divide-y divide-neutral-100">
                                    {dumpIdeas.map((idea) => (
                                        <li key={idea.id} className="space-y-2 py-3 first:pt-0 last:pb-0">
                                            <div className="flex items-start justify-between gap-3">
                                                <span className="text-sm text-neutral-800">
                                                    {idea.text}
                                                </span>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {idea.dumpReason ? (
                                                        <Badge>
                                                            {idea.dumpReason === "info_gap" && idea.research
                                                                ? "사전조사 완료"
                                                                : DUMP_REASON_LABEL[idea.dumpReason] ?? idea.dumpReason}
                                                        </Badge>
                                                    ) : null}
                                                    {onDeleteIdea && (
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => onDeleteIdea(idea.id)}
                                                        >
                                                            삭제
                                                        </Button>
                                                    )}
                                                </div>
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
                                            {researchingId === idea.id ? (
                                                <WaitingProgress
                                                    active
                                                    phrases={RESEARCH_PHRASES}
                                                    className="mt-1"
                                                />
                                            ) : null}
                                            {researchingId === idea.id && researchProgress ? (
                                                <p className="mt-1 whitespace-pre-wrap text-xs text-neutral-500">
                                                    {researchProgress}
                                                </p>
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

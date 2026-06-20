import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";

interface CaptureScreenProps {
    onNavigate: () => void;
    ideaText: string;
    onIdeaTextChange: (v: string) => void;
    onSubmit: () => void;
    submitting: boolean;
}

export default function CaptureScreen({
    onNavigate,
    ideaText,
    onIdeaTextChange,
    onSubmit,
    submitting,
}: CaptureScreenProps) {
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
            </main>
        </div>
    );
}

import type { Idea } from "../lib/types";
import { Button } from "./ui/button";
import { UNDO_WINDOW_MS } from "../hooks/useIdeas";

interface UndoToastProps {
    idea: Idea | null;
    onUndo: () => void;
    onDismiss: () => void;
}

/** 소프트 삭제 직후 N초 동안 떠 있는 글래스 되돌리기 토스트. */
export function UndoToast({ idea, onUndo, onDismiss }: UndoToastProps) {
    if (!idea) return null;
    return (
        <div
            role="status"
            aria-live="polite"
            // key 로 재마운트 → 연속 삭제 시 rise-in/countdown 애니메이션 재시작
            key={idea.id}
            className="undo-toast glass fixed bottom-6 left-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 overflow-hidden rounded-2xl"
            style={{ animation: "toast-rise 0.22s ease-out both" }}
        >
            <div className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-extrabold uppercase tracking-widest text-[var(--ink-faint)]">
                        삭제함
                    </p>
                    <p className="truncate text-sm font-semibold text-[var(--ink)]">
                        {idea.text}
                    </p>
                </div>
                <Button variant="secondary" size="sm" onClick={onUndo}>
                    되돌리기
                </Button>
                <button
                    type="button"
                    onClick={onDismiss}
                    aria-label="닫기"
                    className="shrink-0 rounded-full px-1.5 text-lg leading-none text-[var(--ink-faint)] transition-colors hover:text-[var(--ink)]"
                >
                    ×
                </button>
            </div>
            <div
                className="undo-toast__bar h-1 origin-left bg-[var(--accent)]"
                style={{ animation: `undo-bar ${UNDO_WINDOW_MS}ms linear forwards` }}
            />
        </div>
    );
}

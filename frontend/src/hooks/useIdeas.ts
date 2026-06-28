import { useCallback, useEffect, useRef, useState } from "react";
import type { Idea } from "../lib/types";
import {
    createIdea,
    deleteIdea as apiDeleteIdea,
    listIdeas,
    restoreIdea as apiRestoreIdea,
} from "../lib/api";

export const UNDO_WINDOW_MS = 10_000;

export function useIdeas(enabled: boolean = true) {
    const [inboxIdeas, setInboxIdeas] = useState<Idea[]>([]);
    const [dumpIdeas, setDumpIdeas] = useState<Idea[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [lastVerdict, setLastVerdict] = useState<Idea | null>(null);
    const [verdictError, setVerdictError] = useState<string | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    // 방금 소프트 삭제한 아이디어. 되돌리기 토스트 표시에 사용한다.
    const [pendingDelete, setPendingDelete] = useState<Idea | null>(null);
    const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearUndoTimer = useCallback(() => {
        if (undoTimer.current !== null) {
            clearTimeout(undoTimer.current);
            undoTimer.current = null;
        }
    }, []);

    const reload = useCallback(async () => {
        try {
            const [inbox, dump] = await Promise.all([
                listIdeas({ status: "inbox" }),
                listIdeas({ status: "dump" }),
            ]);
            setInboxIdeas(inbox);
            setDumpIdeas(dump);
            setLoadError(null);
        } catch (e) {
            setLoadError(e instanceof Error ? e.message : "목록을 불러오지 못했어요");
        }
    }, []);

    useEffect(() => {
        if (!enabled) return;
        let active = true;
        (async () => {
            setLoading(true);
            try {
                const [inbox, dump] = await Promise.all([
                    listIdeas({ status: "inbox" }),
                    listIdeas({ status: "dump" }),
                ]);
                if (active) {
                    setInboxIdeas(inbox);
                    setDumpIdeas(dump);
                    setLoadError(null);
                }
            } catch (e) {
                if (active) {
                    setLoadError(
                        e instanceof Error ? e.message : "목록을 불러오지 못했어요"
                    );
                }
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => {
            active = false;
        };
    }, [enabled]);

    const captureIdea = useCallback(
        async (text: string) => {
            setSubmitting(true);
            setVerdictError(null);
            try {
                const verdict = await createIdea(text);
                setLastVerdict(verdict);
                await reload();
            } catch (e) {
                setVerdictError(e instanceof Error ? e.message : "Failed to capture");
            } finally {
                setSubmitting(false);
            }
        },
        [reload]
    );

    const deleteIdea = useCallback(
        async (id: string) => {
            // 낙관적 제거 + 되돌리기 토스트. 백엔드는 소프트 삭제(tombstone)라 restore 로 복구 가능.
            const target =
                inboxIdeas.find((i) => i.id === id) ??
                dumpIdeas.find((i) => i.id === id) ??
                null;
            setInboxIdeas((prev) => prev.filter((i) => i.id !== id));
            setDumpIdeas((prev) => prev.filter((i) => i.id !== id));
            try {
                await apiDeleteIdea(id);
            } catch {
                await reload();
                return;
            }
            if (target) {
                clearUndoTimer();
                setPendingDelete(target);
                undoTimer.current = setTimeout(() => {
                    setPendingDelete(null);
                    undoTimer.current = null;
                }, UNDO_WINDOW_MS);
            }
        },
        [inboxIdeas, dumpIdeas, reload, clearUndoTimer]
    );

    const undoDelete = useCallback(async () => {
        if (!pendingDelete) return;
        clearUndoTimer();
        const id = pendingDelete.id;
        setPendingDelete(null);
        try {
            await apiRestoreIdea(id);
        } finally {
            await reload();
        }
    }, [pendingDelete, reload, clearUndoTimer]);

    const dismissUndo = useCallback(() => {
        clearUndoTimer();
        setPendingDelete(null);
    }, [clearUndoTimer]);

    useEffect(() => clearUndoTimer, [clearUndoTimer]);

    return {
        inboxIdeas,
        dumpIdeas,
        submitting,
        lastVerdict,
        verdictError,
        captureIdea,
        deleteIdea,
        pendingDelete,
        undoDelete,
        dismissUndo,
        reload,
        loading,
        loadError,
    };
}

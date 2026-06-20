import { useCallback, useEffect, useState } from "react";
import type { Idea } from "../lib/types";
import { createIdea, listIdeas } from "../lib/api";

export function useIdeas() {
    const [inboxIdeas, setInboxIdeas] = useState<Idea[]>([]);
    const [dumpIdeas, setDumpIdeas] = useState<Idea[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [lastVerdict, setLastVerdict] = useState<Idea | null>(null);
    const [verdictError, setVerdictError] = useState<string | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

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
    }, []);

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

    return {
        inboxIdeas,
        dumpIdeas,
        submitting,
        lastVerdict,
        verdictError,
        captureIdea,
        reload,
        loading,
        loadError,
    };
}

import { useCallback, useEffect, useState } from "react";
import type { Suggestion, SuggestionDecision } from "../lib/types";
import {
    decideSuggestion,
    getCurrentSuggestion,
    runWeeklyTrigger,
} from "../lib/api";

export function useSuggestion() {
    const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        let current = await getCurrentSuggestion();
        if (!current) {
            const result = await runWeeklyTrigger();
            current = result.suggestion ?? null;
        }
        setSuggestion(current);
    }, []);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            await load();
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : "추천을 불러오지 못했어요");
        } finally {
            setLoading(false);
        }
    }, [load]);

    useEffect(() => {
        let active = true;
        (async () => {
            setLoading(true);
            try {
                let current = await getCurrentSuggestion();
                if (!current) {
                    const result = await runWeeklyTrigger();
                    current = result.suggestion ?? null;
                }
                if (active) setSuggestion(current);
            } catch (e) {
                if (active) {
                    setError(
                        e instanceof Error ? e.message : "추천을 불러오지 못했어요"
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

    const decide = useCallback(
        async (decision: SuggestionDecision) => {
            if (!suggestion) return;
            const prev = suggestion;
            try {
                const updated = await decideSuggestion(suggestion.ideaId, decision);
                setSuggestion(updated);
                setError(null);
            } catch (e) {
                setError(e instanceof Error ? e.message : "결정을 저장하지 못했어요");
                setSuggestion(prev);
            }
        },
        [suggestion]
    );

    return { suggestion, loading, error, decide, refresh };
}

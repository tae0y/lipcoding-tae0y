import { useCallback, useEffect, useState } from "react";
import type { Emotion, UserState } from "../lib/types";
import { getUserState, updateUserState } from "../lib/api";

export function useUserState() {
    const [userState, setUserState] = useState<UserState | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const reload = useCallback(async () => {
        try {
            const next = await getUserState();
            setUserState(next);
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load user state");
        }
    }, []);

    useEffect(() => {
        let active = true;
        (async () => {
            setLoading(true);
            try {
                const next = await getUserState();
                if (active) {
                    setUserState(next);
                    setError(null);
                }
            } catch (e) {
                if (active) {
                    setError(
                        e instanceof Error ? e.message : "Failed to load user state"
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

    const apply = useCallback(
        async (next: UserState, patch: Partial<UserState>) => {
            const prev = userState;
            setUserState(next);
            try {
                const saved = await updateUserState(patch);
                setUserState(saved);
                setError(null);
            } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to update");
                setUserState(prev);
                await reload();
            }
        },
        [userState, reload]
    );

    const setEmotion = useCallback(
        (emotion: Emotion) => {
            if (!userState) return;
            void apply({ ...userState, emotion }, { emotion });
        },
        [userState, apply]
    );

    const toggleCalendar = useCallback(() => {
        if (!userState) return;
        const calendarBusy = !userState.calendarBusy;
        void apply({ ...userState, calendarBusy }, { calendarBusy });
    }, [userState, apply]);

    const addTodo = useCallback(
        (todo: string) => {
            if (!userState) return;
            const todos = [...userState.todos, todo];
            void apply({ ...userState, todos }, { todos });
        },
        [userState, apply]
    );

    const removeTodo = useCallback(
        (index: number) => {
            if (!userState) return;
            const todos = userState.todos.filter((_, i) => i !== index);
            void apply({ ...userState, todos }, { todos });
        },
        [userState, apply]
    );

    const setSchedule = useCallback(
        (weekday: number, time: string) => {
            if (!userState) return;
            const triggerSchedule = { weekday, time };
            void apply({ ...userState, triggerSchedule }, { triggerSchedule });
        },
        [userState, apply]
    );

    return {
        userState,
        loading,
        error,
        reload,
        setEmotion,
        toggleCalendar,
        addTodo,
        removeTodo,
        setSchedule,
    };
}

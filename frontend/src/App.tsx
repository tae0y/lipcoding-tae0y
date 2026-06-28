import { useCallback, useState } from "react";
import CaptureScreen from "./screens/CaptureScreen";
import InboxScreen from "./screens/InboxScreen";
import SettingsScreen from "./screens/SettingsScreen";
import LoginScreen from "./screens/LoginScreen";
import { useIdeas } from "./hooks/useIdeas";
import { useUserState } from "./hooks/useUserState";
import { useSuggestion } from "./hooks/useSuggestion";
import { useAuth } from "./hooks/useAuth";
import { logout, runResearchStream } from "./lib/api";
import { UndoToast } from "./components/UndoToast";
import type { Screen } from "./lib/types";

export default function App() {
    const auth = useAuth();
    // 인증이 확정되기 전에는 데이터를 조회하지 않는다(401 → stale 에러 방지).
    const authed = !auth.loading && auth.authenticated;
    const [screen, setScreen] = useState<Screen>("capture");
    const [ideaText, setIdeaText] = useState("");
    const [researchingId, setResearchingId] = useState<string | null>(null);
    const [researchProgress, setResearchProgress] = useState<string>("");

    const {
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
        reload: reloadIdeas,
        loadError: ideasError,
    } = useIdeas(authed);

    const {
        userState,
        setEmotion,
        toggleCalendar,
        addTodo,
        removeTodo,
        setSchedule,
        error: userStateError,
        reload: reloadUserState,
    } = useUserState(authed);

    const {
        suggestion,
        loading: suggestionLoading,
        decide,
        error: suggestionError,
        refresh: refreshSuggestion,
    } = useSuggestion(authed);

    const handleEmotion = useCallback(async (emotion: Parameters<typeof setEmotion>[0]) => {
        await setEmotion(emotion);
        void refreshSuggestion();
    }, [setEmotion, refreshSuggestion]);

    const handleToggleCalendar = useCallback(async () => {
        await toggleCalendar();
        void refreshSuggestion();
    }, [toggleCalendar, refreshSuggestion]);

    const connectionError = ideasError || userStateError || suggestionError;

    const handleRetry = () => {
        void reloadIdeas();
        void reloadUserState();
        void refreshSuggestion();
    };

    const handleRunResearch = async (ideaId: string) => {
        setResearchingId(ideaId);
        setResearchProgress("");
        try {
            await runResearchStream(ideaId, (chunk) => {
                setResearchProgress((prev) => prev + chunk);
            });
            void reloadIdeas();
        } catch {
            // silent — ideas will still show without research
        } finally {
            setResearchingId(null);
            setResearchProgress("");
        }
    };


    const banner = connectionError ? (
        <div className="border-b border-[rgba(225,29,72,0.25)] bg-[rgba(225,29,72,0.10)] backdrop-blur-md text-[var(--ink)]">
            <div className="mx-auto flex max-w-[640px] items-center justify-between gap-3 px-4 py-2 text-sm">
                <span className="text-[var(--ink-soft)]">
                    서버 연결이 불안정해요. 입력은 저장되며 일부 정보가 안 보일 수 있어요.
                </span>
                <button
                    type="button"
                    onClick={handleRetry}
                    className="shrink-0 rounded-full border border-[var(--glass-edge)] bg-[var(--glass-fill)] px-3 py-1 text-xs font-extrabold text-[var(--ink)] hover:bg-[var(--glass-fill-strong)] transition-colors"
                >
                    다시 시도
                </button>
            </div>
        </div>
    ) : null;

    const handleSubmit = async () => {
        const text = ideaText.trim();
        if (!text) return;
        await captureIdea(text);
        setIdeaText("");
        // 제출 직후 AI 판정을 캡처 화면에서 보여준다(자동 이동하지 않음).
    };

    const handleLogout = async () => {
        try {
            await logout();
        } finally {
            void auth.refresh();
        }
    };

    if (auth.loading) {
        return <div className="min-h-screen" />;
    }
    if (auth.authRequired && !auth.authenticated) {
        return <LoginScreen onSuccess={auth.refresh} />;
    }

    return (
        <>
            {banner}
            {auth.authRequired ? (
                <div className="mx-auto flex max-w-[640px] justify-end px-4 pt-3">
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="rounded-full border border-[var(--glass-edge)] bg-[var(--glass-fill)] px-3 py-1 text-xs font-extrabold text-[var(--ink-soft)] hover:bg-[var(--glass-fill-strong)] hover:text-[var(--ink)] transition-colors"
                    >
                        로그아웃
                    </button>
                </div>
            ) : null}
            {screen === "capture" ? (
                <CaptureScreen
                    onNavigate={setScreen}
                    ideaText={ideaText}
                    onIdeaTextChange={setIdeaText}
                    onSubmit={handleSubmit}
                    submitting={submitting}
                    lastVerdict={lastVerdict}
                    verdictError={verdictError}
                    userState={userState}
                    onEmotion={handleEmotion}
                    onToggleCalendar={handleToggleCalendar}
                    onAddTodo={addTodo}
                    onRemoveTodo={removeTodo}
                />
            ) : screen === "inbox" ? (
                <InboxScreen
                    onNavigate={setScreen}
                    loading={suggestionLoading}
                    suggestion={suggestion}
                    onDecide={decide}
                    inboxIdeas={inboxIdeas}
                    dumpIdeas={dumpIdeas}
                    userState={userState}
                    onRunResearch={handleRunResearch}
                    onDeleteIdea={deleteIdea}
                    researchingId={researchingId}
                    researchProgress={researchProgress}
                />
            ) : (
                <SettingsScreen
                    onNavigate={setScreen}
                    userState={userState}
                    onSchedule={setSchedule}
                />
            )}
            <UndoToast
                idea={pendingDelete}
                onUndo={undoDelete}
                onDismiss={dismissUndo}
            />
        </>
    );
}

import { useCallback, useState } from "react";
import CaptureScreen from "./screens/CaptureScreen";
import InboxScreen from "./screens/InboxScreen";
import SettingsScreen from "./screens/SettingsScreen";
import { useIdeas } from "./hooks/useIdeas";
import { useUserState } from "./hooks/useUserState";
import { useSuggestion } from "./hooks/useSuggestion";
import { runResearchStream } from "./lib/api";
import type { Screen } from "./lib/types";

export default function App() {
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
        reload: reloadIdeas,
        loadError: ideasError,
    } = useIdeas();

    const {
        userState,
        setEmotion,
        toggleCalendar,
        addTodo,
        removeTodo,
        setSchedule,
        error: userStateError,
        reload: reloadUserState,
    } = useUserState();

    const {
        suggestion,
        loading: suggestionLoading,
        decide,
        error: suggestionError,
        refresh: refreshSuggestion,
    } = useSuggestion();

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

    const handleSubmit = async () => {
        const text = ideaText.trim();
        if (!text) return;
        await captureIdea(text);
        setIdeaText("");
        // 제출 직후 AI 판정을 캡처 화면에서 보여준다(자동 이동하지 않음).
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
        <div className="border-b border-[rgba(232,37,42,0.35)] bg-[rgba(232,37,42,0.12)] backdrop-blur-md text-white">
            <div className="mx-auto flex max-w-[640px] items-center justify-between gap-3 px-4 py-2 text-sm">
                <span className="text-[rgba(255,255,255,0.90)]">
                    서버 연결이 불안정해요. 입력은 저장되며 일부 정보가 안 보일 수 있어요.
                </span>
                <button
                    type="button"
                    onClick={handleRetry}
                    className="shrink-0 rounded-full border border-[rgba(255,255,255,0.45)] bg-[rgba(255,255,255,0.08)] px-3 py-1 text-xs font-extrabold text-white hover:bg-[rgba(255,255,255,0.20)] transition-colors"
                >
                    다시 시도
                </button>
            </div>
        </div>
    ) : null;

    return (
        <>
            {banner}
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
        </>
    );
}

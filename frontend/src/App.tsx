import { useState } from "react";
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
        setScreen("inbox");
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
        <div className="bg-red-50 text-red-700">
            <div className="mx-auto flex max-w-[640px] items-center justify-between gap-3 px-4 py-2 text-sm">
                <span>
                    서버 연결이 불안정해요. 입력은 저장되며 일부 정보가 안 보일 수 있어요.
                </span>
                <button
                    type="button"
                    onClick={handleRetry}
                    className="shrink-0 rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
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
                    userState={userState}
                    onEmotion={setEmotion}
                    onToggleCalendar={toggleCalendar}
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

export type Screen = "capture" | "inbox" | "settings";
export type IdeaStatus = "inbox" | "dump";
export type DumpReason = "info_gap" | "no_capacity";
export type Emotion = "bad" | "normal" | "good";
export type SuggestionDecision = "accepted" | "postponed" | "dismissed";

export interface ResearchMaterial {
    fact: string;
    url?: string | null;
}

export interface Research {
    materials: ResearchMaterial[];
    options: string[];
    generatedAt?: string | null;
}

export interface Idea {
    id: string;
    text: string;
    status: IdeaStatus;
    dumpReason?: DumpReason | null;
    research?: Research | null;
    createdAt: string;
}

export interface TriggerSchedule {
    weekday: number;
    time: string;
}

export interface UserState {
    emotion: Emotion;
    todos: string[];
    calendarBusy: boolean;
    triggerSchedule: TriggerSchedule;
}

export interface SuggestionReasons {
    lowLoad: string;
    researchDone: string;
    relevance: string;
}

export interface Suggestion {
    ideaId: string;
    idea?: Idea | null;
    reasons: SuggestionReasons;
    decision?: SuggestionDecision | null;
    createdAt?: string | null;
}

export interface WeeklyTriggerResult {
    gatePassed: boolean;
    suggestion?: Suggestion | null;
    skippedReason?: string | null;
}

export interface SessionInfo {
    authenticated: boolean;
    authRequired: boolean;
}

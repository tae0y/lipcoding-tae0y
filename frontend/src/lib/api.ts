import type {
    Idea,
    IdeaStatus,
    DumpReason,
    UserState,
    Suggestion,
    SuggestionDecision,
    WeeklyTriggerResult,
} from "./types";

const BASE_URL = "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(BASE_URL + path, {
        headers: { "Content-Type": "application/json" },
        ...init,
    });

    if (!res.ok) {
        let message = res.statusText;
        try {
            const body = await res.json();
            if (body && typeof body.message === "string") {
                message = body.message;
            }
        } catch {
            // ignore JSON parse errors, fall back to statusText
        }
        throw new Error(message);
    }

    if (res.status === 204) {
        return undefined as T;
    }

    const text = await res.text();
    if (!text) {
        return undefined as T;
    }
    return JSON.parse(text) as T;
}

export function listIdeas(params?: {
    status?: IdeaStatus;
    dumpReason?: DumpReason;
}): Promise<Idea[]> {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.dumpReason) query.set("dumpReason", params.dumpReason);
    const qs = query.toString();
    return request<Idea[]>(`/api/ideas${qs ? `?${qs}` : ""}`);
}

export function createIdea(text: string): Promise<Idea> {
    return request<Idea>("/api/ideas", {
        method: "POST",
        body: JSON.stringify({ text }),
    });
}

export function deleteIdea(id: string): Promise<void> {
    return request<void>(`/api/ideas/${id}`, { method: "DELETE" });
}

export function getUserState(): Promise<UserState> {
    return request<UserState>("/api/user-state");
}

export function updateUserState(patch: Partial<UserState>): Promise<UserState> {
    return request<UserState>("/api/user-state", {
        method: "PUT",
        body: JSON.stringify(patch),
    });
}

export function runWeeklyTrigger(): Promise<WeeklyTriggerResult> {
    return request<WeeklyTriggerResult>("/api/suggestions/run", {
        method: "POST",
    });
}

export async function getCurrentSuggestion(): Promise<Suggestion | null> {
    const result = await request<Suggestion | null | undefined>(
        "/api/suggestions/current"
    );
    return result ?? null;
}

export function decideSuggestion(
    ideaId: string,
    decision: SuggestionDecision
): Promise<Suggestion> {
    return request<Suggestion>(`/api/suggestions/${ideaId}/decision`, {
        method: "POST",
        body: JSON.stringify({ decision }),
    });
}

export function runResearch(ideaId: string): Promise<unknown> {
    return request<unknown>(`/api/ideas/${ideaId}/research`, { method: "POST" });
}

export async function runResearchStream(
    ideaId: string,
    onDelta: (chunk: string) => void,
): Promise<void> {
    const res = await fetch(`/api/ideas/${ideaId}/research?stream=true`, {
        method: "POST",
    });
    if (!res.ok) throw new Error(res.statusText);
    if (!res.body) return;
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const blocks = buf.split("\n\n");
        buf = blocks.pop() ?? "";
        for (const block of blocks) {
            let eventType = "";
            let data = "";
            for (const line of block.split("\n")) {
                if (line.startsWith("event: ")) eventType = line.slice(7).trim();
                else if (line.startsWith("data: ")) data = line.slice(6);
            }
            if (eventType === "delta" && data) onDelta(data);
        }
    }
}

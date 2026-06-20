import { useEffect, useState } from "react";

/** 캡처(게이트 판정) 대기 중 보여줄 문구 — 가볍고 기다림을 견디게. */
export const CAPTURE_PHRASES = [
    "생각을 차곡차곡 담는 중…",
    "AI가 메모를 들여다보는 중…",
    "지금 착수할 수 있는지 따져보는 중…",
    "머릿속 짐을 덜어내는 중…",
    "정보가 충분한지 점검하는 중…",
    "지금 할지 나중에 할지 저울질하는 중…",
    "좋은 아이디어엔 좋은 타이밍이 필요하죠…",
    "잠깐 숨 고르셔도 돼요 ☕",
];

/** 사전조사 대기 중 보여줄 문구. */
export const RESEARCH_PHRASES = [
    "필요한 재료를 모으는 중…",
    "참고할 사실을 찾아보는 중…",
    "접근할 수 있는 선택지를 그려보는 중…",
    "결정은 당신 몫, 재료만 챙기는 중…",
    "쓸 만한 실마리를 추리는 중…",
    "거의 정리됐어요…",
];

interface WaitingProgressProps {
    active: boolean;
    phrases?: string[];
    className?: string;
}

/**
 * 응답이 느린(특히 Copilot CLI 경유) 작업을 기다리는 동안
 * 진행 막대 + 경과 시간 + 순환 문구로 체감 대기를 줄인다.
 * 실제 진행 신호가 없으므로 막대는 ~95%까지 점근적으로 차오른다.
 */
export function WaitingProgress({
    active,
    phrases = CAPTURE_PHRASES,
    className = "",
}: WaitingProgressProps) {
    const [pct, setPct] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const [idx, setIdx] = useState(0);

    useEffect(() => {
        if (!active) {
            setPct(0);
            setElapsed(0);
            setIdx(0);
            return;
        }
        setPct(8);
        const creep = setInterval(() => {
            setPct((p) => (p >= 95 ? 95 : p + (95 - p) * 0.1));
        }, 600);
        const tick = setInterval(() => setElapsed((e) => e + 1), 1000);
        const rotate = setInterval(
            () => setIdx((i) => (i + 1) % phrases.length),
            2800
        );
        return () => {
            clearInterval(creep);
            clearInterval(tick);
            clearInterval(rotate);
        };
    }, [active, phrases.length]);

    if (!active) return null;

    return (
        <div className={`space-y-2 ${className}`} role="status" aria-live="polite">
            <div className="flex items-center justify-between gap-3 text-xs">
                <span className="text-neutral-600">{phrases[idx]}</span>
                <span className="shrink-0 tabular-nums text-neutral-400">{elapsed}s</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                <div
                    className="h-full rounded-full bg-neutral-900 transition-[width] duration-500 ease-out"
                    style={{ width: `${pct}%` }}
                />
            </div>
            {elapsed >= 8 ? (
                <p className="text-[11px] text-neutral-400">
                    AI가 처음엔 살짝 느릴 수 있어요. 거의 다 왔어요…
                </p>
            ) : null}
        </div>
    );
}

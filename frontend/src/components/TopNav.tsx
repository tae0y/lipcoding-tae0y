import type { Screen } from "../lib/types";

function cx(...parts: Array<string | undefined | false>): string {
    return parts.filter(Boolean).join(" ");
}

const TABS: Array<{ key: Screen; label: string; sub: string }> = [
    { key: "capture", label: "아이디어 담기", sub: "생각을 던지는 곳" },
    { key: "inbox", label: "추천 · 인박스", sub: "제안과 목록 보기" },
    { key: "settings", label: "설정", sub: "" },
];

interface TopNavProps {
    active: Screen;
    onNavigate: (s: Screen) => void;
}

export function TopNav({ active, onNavigate }: TopNavProps) {
    return (
        <header className="sticky top-0 z-10 border-b border-[var(--glass-edge)] bg-[var(--glass-fill)] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
            <nav className="mx-auto flex max-w-[640px] items-stretch gap-1.5 px-4 py-2.5">
                {TABS.map((tab) => {
                    const isActive = tab.key === active;
                    return (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => onNavigate(tab.key)}
                            aria-current={isActive ? "page" : undefined}
                            className={cx(
                                "flex flex-col justify-center rounded-2xl border px-4 py-2 text-left transition-all",
                                isActive
                                    ? "border-transparent bg-[var(--accent)] text-white shadow-[0_8px_20px_-8px_rgba(79,70,229,0.7)]"
                                    : "border-[var(--glass-edge)] bg-white/40 text-[var(--ink-soft)] hover:bg-white/60 hover:text-[var(--ink)]",
                            )}
                        >
                            <span className="block text-sm font-extrabold leading-tight tracking-[0.01em]">{tab.label}</span>
                            <span
                                aria-hidden={tab.sub ? undefined : true}
                                className={cx("block text-[10px] leading-tight mt-0.5", isActive ? "text-[rgba(255,255,255,0.75)]" : "text-[var(--ink-faint)]")}
                            >
                                {tab.sub || "\u00A0"}
                            </span>
                        </button>
                    );
                })}
            </nav>
        </header>
    );
}

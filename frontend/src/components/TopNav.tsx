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
        <header className="sticky top-0 z-10 border-b border-[rgba(255,255,255,0.30)] bg-black/80 backdrop-blur-md shadow-[inset_0_-1px_0_rgba(255,255,255,0.08)]">
            <nav className="mx-auto flex max-w-[640px] items-center gap-1.5 px-4 py-2.5">
                {TABS.map((tab) => {
                    const isActive = tab.key === active;
                    return (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => onNavigate(tab.key)}
                            aria-current={isActive ? "page" : undefined}
                            className={cx(
                                "rounded-full px-3 py-1.5 text-left transition-all",
                                isActive
                                    ? "bg-white text-[#15120c] shadow-[0_8px_20px_rgba(0,0,0,0.25)]"
                                    : "bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.45)] text-[rgba(255,255,255,0.70)] hover:bg-[rgba(255,255,255,0.20)] hover:text-white",
                            )}
                        >
                            <span className="block text-sm font-extrabold leading-tight tracking-[0.01em]">{tab.label}</span>
                            {tab.sub && (
                                <span className={cx("block text-[10px] leading-tight mt-0.5", isActive ? "text-[rgba(21,18,12,0.60)]" : "text-[rgba(255,255,255,0.42)]")}>
                                    {tab.sub}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>
        </header>
    );
}

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
        <header className="sticky top-0 z-10 border-b border-neutral-200/70 bg-neutral-50/80 backdrop-blur">
            <nav className="mx-auto flex max-w-[640px] items-center gap-1 px-4 py-2.5">
                {TABS.map((tab) => {
                    const isActive = tab.key === active;
                    return (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => onNavigate(tab.key)}
                            aria-current={isActive ? "page" : undefined}
                            className={cx(
                                "rounded-lg px-3 py-1.5 text-left transition-colors",
                                isActive
                                    ? "bg-neutral-900 text-white shadow-sm"
                                    : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900",
                            )}
                        >
                            <span className="block text-sm font-semibold leading-tight">{tab.label}</span>
                            {tab.sub && (
                                <span className={cx("block text-[10px] leading-tight mt-0.5", isActive ? "text-neutral-300" : "text-neutral-400")}>
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

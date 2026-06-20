import type { Screen } from "../lib/types";

function cx(...parts: Array<string | undefined | false>): string {
    return parts.filter(Boolean).join(" ");
}

const TABS: Array<{ key: Screen; label: string }> = [
    { key: "capture", label: "입력" },
    { key: "inbox", label: "조회" },
    { key: "settings", label: "설정" },
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
                                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-neutral-900 text-white shadow-sm"
                                    : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900",
                            )}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </nav>
        </header>
    );
}

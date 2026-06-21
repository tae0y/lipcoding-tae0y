import type { TextareaHTMLAttributes } from "react";

function cx(...parts: Array<string | undefined>): string {
    return parts.filter(Boolean).join(" ");
}

export function Textarea({
    className,
    ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return (
        <textarea
            className={cx(
                "w-full rounded-2xl border border-[var(--glass-edge)] bg-[var(--glass-fill)] px-3.5 py-2.5 text-sm font-semibold text-[var(--ink)] shadow-sm backdrop-blur-md transition-colors placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/15",
                className,
            )}
            {...props}
        />
    );
}

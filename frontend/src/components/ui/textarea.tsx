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
                "w-full rounded-[14px] border border-[rgba(255,255,255,0.45)] bg-[rgba(255,255,255,0.08)] px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm backdrop-blur-md transition-colors placeholder:text-[rgba(255,255,255,0.38)] focus:border-[rgba(255,255,255,0.60)] focus:outline-none focus:ring-2 focus:ring-white/15",
                className,
            )}
            {...props}
        />
    );
}

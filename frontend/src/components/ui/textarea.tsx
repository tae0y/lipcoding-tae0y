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
                "w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-950/10",
                className,
            )}
            {...props}
        />
    );
}

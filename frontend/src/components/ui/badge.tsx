import type { HTMLAttributes } from "react";

function cx(...parts: Array<string | undefined>): string {
    return parts.filter(Boolean).join(" ");
}

type Variant = "secondary" | "destructive";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: Variant;
}

const variants: Record<Variant, string> = {
    /* light-glass pill tag */
    secondary:
        "border border-[var(--glass-edge)] bg-[var(--glass-fill-strong)] text-[var(--ink)] backdrop-blur",
    destructive:
        "border border-[rgba(225,29,72,0.28)] bg-[rgba(225,29,72,0.10)] text-[var(--danger)]",
};

export function Badge({ className, variant = "secondary", ...props }: BadgeProps) {
    return (
        <span
            className={cx(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium tracking-tight",
                variants[variant],
                className,
            )}
            {...props}
        />
    );
}

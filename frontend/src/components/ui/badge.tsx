import type { HTMLAttributes } from "react";

function cx(...parts: Array<string | undefined>): string {
    return parts.filter(Boolean).join(" ");
}

type Variant = "secondary" | "destructive";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: Variant;
}

const variants: Record<Variant, string> = {
    /* pill tag — matches HALFTONE / ORIGINAL label from Color Halftone */
    secondary:
        "border border-[rgba(0,0,0,0.12)] bg-[rgba(255,255,255,0.70)] text-[#1f1c16]",
    destructive:
        "border border-[rgba(232,37,42,0.45)] bg-[rgba(232,37,42,0.14)] text-[#f87171]",
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

import type { HTMLAttributes } from "react";

function cx(...parts: Array<string | undefined>): string {
    return parts.filter(Boolean).join(" ");
}

type Variant = "secondary" | "destructive";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: Variant;
}

const variants: Record<Variant, string> = {
    secondary: "border border-neutral-200 bg-neutral-50 text-neutral-600",
    destructive: "border border-red-200 bg-red-50 text-red-600",
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

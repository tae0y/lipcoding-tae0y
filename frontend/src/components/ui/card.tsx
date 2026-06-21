import type { HTMLAttributes } from "react";

function cx(...parts: Array<string | undefined>): string {
    return parts.filter(Boolean).join(" ");
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cx(
                "rounded-3xl border border-[var(--glass-edge)] bg-[var(--glass-fill)] backdrop-blur-xl shadow-[0_24px_60px_-28px_rgba(33,29,23,0.35),inset_0_1px_0_rgba(255,255,255,0.9)] text-[var(--ink)]",
                className,
            )}
            {...props}
        />
    );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div className={cx("px-6 pt-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3
            className={cx(
                "font-display text-sm font-bold tracking-tight text-[var(--ink)]",
                className,
            )}
            {...props}
        />
    );
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div className={cx("p-6", className)} {...props} />;
}

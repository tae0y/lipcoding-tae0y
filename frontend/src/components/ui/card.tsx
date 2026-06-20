import type { HTMLAttributes } from "react";

function cx(...parts: Array<string | undefined>): string {
    return parts.filter(Boolean).join(" ");
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cx(
                "rounded-3xl border border-[rgba(255,255,255,0.30)] bg-[rgba(255,255,255,0.06)] backdrop-blur-xl shadow-[0_24px_60px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.35)] text-white",
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
                "text-sm font-bold tracking-tight text-white",
                className,
            )}
            {...props}
        />
    );
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div className={cx("p-6", className)} {...props} />;
}

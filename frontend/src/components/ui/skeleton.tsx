import type { HTMLAttributes } from "react";

function cx(...parts: Array<string | undefined>): string {
    return parts.filter(Boolean).join(" ");
}

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cx("animate-pulse rounded-md bg-[rgba(33,29,23,0.08)]", className)}
            {...props}
        />
    );
}

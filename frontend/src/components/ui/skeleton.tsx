import type { HTMLAttributes } from "react";

function cx(...parts: Array<string | undefined>): string {
    return parts.filter(Boolean).join(" ");
}

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cx("animate-pulse rounded-md bg-neutral-100", className)}
            {...props}
        />
    );
}

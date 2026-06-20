import type { ButtonHTMLAttributes } from "react";

function cx(...parts: Array<string | undefined>): string {
    return parts.filter(Boolean).join(" ");
}

type Variant = "primary" | "secondary" | "ghost" | "outline" | "gradient";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
}

const variants: Record<Variant, string> = {
    primary:
        "bg-neutral-900 text-white shadow-sm hover:bg-neutral-800 active:bg-neutral-950",
    secondary: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200",
    outline:
        "border border-neutral-200 bg-white text-neutral-800 shadow-sm hover:bg-neutral-50 hover:text-neutral-900",
    ghost: "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
    gradient:
        "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_6px_20px_-6px_rgba(99,102,241,0.6)] hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 active:to-violet-700",
};

export function Button({ className, variant = "primary", type = "button", ...props }: ButtonProps) {
    return (
        <button
            type={type}
            className={cx(
                "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/15 focus-visible:ring-offset-1 focus-visible:ring-offset-neutral-50",
                variants[variant],
                className,
            )}
            {...props}
        />
    );
}

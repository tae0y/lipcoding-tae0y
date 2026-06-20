import type { ButtonHTMLAttributes } from "react";

function cx(...parts: Array<string | undefined>): string {
    return parts.filter(Boolean).join(" ");
}

type Variant = "primary" | "secondary" | "ghost" | "outline" | "gradient" | "destructive";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: "sm" | "md";
}

const variants: Record<Variant, string> = {
    primary:
        "bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 active:bg-indigo-700 shadow-[0_4px_12px_-4px_rgba(99,102,241,0.45)]",
    secondary: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200",
    outline:
        "border border-neutral-200 bg-white text-neutral-800 shadow-sm hover:bg-neutral-50 hover:text-neutral-900",
    ghost: "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
    gradient:
        "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_6px_20px_-6px_rgba(99,102,241,0.6)] hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 active:to-violet-700",
    destructive:
        "border border-rose-200 bg-white text-rose-500 shadow-sm hover:bg-rose-50 hover:text-rose-600 active:bg-rose-100",
};

export function Button({ className, variant = "primary", size = "md", type = "button", ...props }: ButtonProps) {
    return (
        <button
            type={type}
            className={cx(
                "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/15 focus-visible:ring-offset-1 focus-visible:ring-offset-neutral-50",
                size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-2 text-sm",
                variants[variant],
                className,
            )}
            {...props}
        />
    );
}

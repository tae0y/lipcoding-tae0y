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
    /* filled indigo — primary action (asset blue button) */
    primary:
        "bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)] shadow-[0_12px_28px_-12px_rgba(79,70,229,0.7)] hover:-translate-y-px",
    /* light glass — secondary action */
    secondary:
        "bg-[var(--glass-fill)] text-[var(--ink)] border border-[var(--glass-edge)] backdrop-blur-md hover:bg-[var(--glass-fill-strong)]",
    outline:
        "border border-[rgba(33,29,23,0.18)] bg-transparent text-[var(--ink)] hover:bg-white/45 hover:border-[rgba(33,29,23,0.28)]",
    ghost:
        "text-[var(--ink-soft)] hover:bg-white/45 hover:text-[var(--ink)]",
    /* solid ink — dark secondary (asset "Handshake" button) */
    gradient:
        "bg-[var(--ink)] text-white shadow-[0_12px_28px_-12px_rgba(33,29,23,0.6)] hover:bg-black hover:-translate-y-px",
    destructive:
        "border border-[rgba(225,29,72,0.28)] bg-[rgba(225,29,72,0.10)] text-[var(--danger)] hover:bg-[rgba(225,29,72,0.18)]",
};

export function Button({ className, variant = "primary", size = "md", type = "button", ...props }: ButtonProps) {
    return (
        <button
            type={type}
            className={cx(
                "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-extrabold tracking-[0.02em] transition-all disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-2 text-sm",
                variants[variant],
                className,
            )}
            {...props}
        />
    );
}

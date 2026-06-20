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
    /* solid white — matches Color Halftone primary button */
    primary:
        "bg-white text-[#15120c] hover:bg-[rgba(255,255,255,0.92)] active:bg-[rgba(220,220,220,1)] shadow-[0_10px_26px_rgba(0,0,0,0.22)] hover:-translate-y-px",
    /* glass — matches Color Halftone secondary button */
    secondary:
        "bg-[rgba(255,255,255,0.08)] text-white border border-[rgba(255,255,255,0.45)] hover:bg-[rgba(255,255,255,0.20)]",
    outline:
        "border border-[rgba(255,255,255,0.45)] bg-transparent text-white hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.60)]",
    ghost:
        "text-[rgba(255,255,255,0.68)] hover:bg-[rgba(255,255,255,0.08)] hover:text-white",
    gradient:
        "bg-gradient-to-r from-[#e8252a] to-[#c9181d] text-white shadow-[0_6px_20px_-6px_rgba(232,37,42,0.55)] hover:from-[#d01f24] hover:to-[#b5151a]",
    destructive:
        "border border-[rgba(232,37,42,0.45)] bg-[rgba(232,37,42,0.14)] text-[#f87171] hover:bg-[rgba(232,37,42,0.24)]",
};

export function Button({ className, variant = "primary", size = "md", type = "button", ...props }: ButtonProps) {
    return (
        <button
            type={type}
            className={cx(
                "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[14px] font-extrabold tracking-[0.02em] transition-all disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-1 focus-visible:ring-offset-black",
                size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-2 text-sm",
                variants[variant],
                className,
            )}
            {...props}
        />
    );
}

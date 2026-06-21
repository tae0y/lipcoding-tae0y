import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { login } from "../lib/api";

interface LoginScreenProps {
    onSuccess: () => void;
}

export default function LoginScreen({ onSuccess }: LoginScreenProps) {
    const [passphrase, setPassphrase] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const value = passphrase.trim();
        if (!value || submitting) return;
        setSubmitting(true);
        setError(null);
        try {
            await login(value);
            setPassphrase("");
            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : "로그인에 실패했어요");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <Card className="w-full max-w-[400px]">
                <CardContent className="p-6 space-y-5">
                    <div className="space-y-1.5">
                        <h1 className="font-display text-2xl font-extrabold text-[var(--ink)]">떠올림</h1>
                        <p className="text-sm text-[var(--ink-soft)]">
                            계속하려면 패스프레이즈를 입력하세요.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="space-y-1.5">
                            <label
                                htmlFor="passphrase"
                                className="block text-xs font-bold text-[var(--ink-soft)]"
                            >
                                패스프레이즈
                            </label>
                            <input
                                id="passphrase"
                                type="password"
                                autoComplete="current-password"
                                autoFocus
                                value={passphrase}
                                onChange={(e) => setPassphrase(e.target.value)}
                                className="w-full rounded-2xl border border-[var(--glass-edge)] bg-[var(--glass-fill)] px-3.5 py-2.5 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)]/40 focus:ring-2 focus:ring-[var(--accent)]/15"
                                placeholder="••••••••"
                            />
                        </div>

                        {error ? (
                            <p
                                role="alert"
                                className="text-xs font-bold text-[var(--danger)]"
                            >
                                {error}
                            </p>
                        ) : null}

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={submitting || !passphrase.trim()}
                        >
                            {submitting ? "확인 중…" : "들어가기"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

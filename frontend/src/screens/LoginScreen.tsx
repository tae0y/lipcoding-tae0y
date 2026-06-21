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
                        <h1 className="text-xl font-extrabold text-white">떠올림</h1>
                        <p className="text-sm text-[rgba(255,255,255,0.68)]">
                            계속하려면 패스프레이즈를 입력하세요.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="space-y-1.5">
                            <label
                                htmlFor="passphrase"
                                className="block text-xs font-bold text-[rgba(255,255,255,0.78)]"
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
                                className="w-full rounded-[14px] border border-[rgba(255,255,255,0.20)] bg-[rgba(255,255,255,0.06)] px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-[rgba(255,255,255,0.40)] focus:border-[rgba(255,255,255,0.45)]"
                                placeholder="••••••••"
                            />
                        </div>

                        {error ? (
                            <p
                                role="alert"
                                className="text-xs font-bold text-[#f87171]"
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

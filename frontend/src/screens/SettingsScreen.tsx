import type { Screen, UserState } from "../lib/types";
import { Card, CardContent } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { TopNav } from "../components/TopNav";

const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];

interface SettingsScreenProps {
    onNavigate: (s: Screen) => void;
    userState: UserState | null;
    onSchedule: (weekday: number, time: string) => void;
}

export default function SettingsScreen({
    onNavigate,
    userState,
    onSchedule,
}: SettingsScreenProps) {
    return (
        <div className="min-h-screen">
            <TopNav active="settings" onNavigate={onNavigate} />

            <main className="mx-auto max-w-[640px] px-4 py-10 space-y-12">
                <section className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-neutral-200 pb-2">
                        <span className="h-2 w-2 rounded-full bg-neutral-400" />
                        <h2 className="text-sm font-semibold tracking-tight text-neutral-900">
                            주간 추천 시각
                        </h2>
                    </div>
                    <Card>
                        <CardContent className="space-y-3">
                            {userState == null ? (
                                <Skeleton className="h-9 w-full" />
                            ) : (
                                <>
                                    <div className="flex gap-2">
                                        <select
                                            value={userState.triggerSchedule.weekday}
                                            onChange={(e) =>
                                                onSchedule(
                                                    Number(e.target.value),
                                                    userState.triggerSchedule.time,
                                                )
                                            }
                                            aria-label="요일"
                                            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                                        >
                                            {WEEKDAYS.map((label, i) => (
                                                <option key={i} value={i}>
                                                    {label}
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type="time"
                                            value={userState.triggerSchedule.time}
                                            onChange={(e) =>
                                                onSchedule(
                                                    userState.triggerSchedule.weekday,
                                                    e.target.value,
                                                )
                                            }
                                            aria-label="시각"
                                            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                                        />
                                    </div>
                                    <p className="text-xs text-neutral-500">
                                        (퇴근 + 20~30분 버퍼 권장)
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </section>
            </main>
        </div>
    );
}

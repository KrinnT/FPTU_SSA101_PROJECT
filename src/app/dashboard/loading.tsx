import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
    return (
        <div className="min-h-screen p-4 md:p-8 space-y-8 bg-background flex flex-col items-center justify-center">
            <div className="relative flex flex-col items-center justify-center p-8 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden min-w-[300px]">
                {/* Background glow */}
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 via-purple-500/10 to-transparent blur-2xl" />

                {/* Spinner Rings */}
                <div className="relative w-24 h-24 mb-6">
                    <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                    <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin" />
                    <div className="absolute inset-2 border-4 border-rose-400 rounded-full border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl animate-pulse">🧠</span>
                    </div>
                </div>

                {/* Text Context */}
                <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-rose-400 bg-clip-text text-transparent mb-2">
                    Loading Dashboard
                </h3>
                <p className="text-sm text-muted-foreground text-center animate-pulse">
                    Waking up secure database... <br />
                    <span className="text-xs opacity-70">(This might take ~2s on the first load)</span>
                </p>
            </div>
        </div>
    );
}

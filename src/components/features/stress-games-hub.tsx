"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Circle, Eraser, Music, Gamepad2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Lazy load games to reduce initial bundle size (especially matter.js)
const EraserGame = dynamic(() => import("./games/eraser-game").then(mod => mod.EraserGame), {
    loading: () => <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>,
    ssr: false
});
const AmbientGame = dynamic(() => import("./games/ambient-game").then(mod => mod.AmbientGame), {
    loading: () => <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>,
    ssr: false
});
const BubblePopGame = dynamic(() => import("./games/bubble-pop").then(mod => mod.BubblePopGame), {
    loading: () => <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>,
    ssr: false
});

export function StressGamesHub() {
    const [activeGame, setActiveGame] = useState<"bubble" | "eraser" | "ambient">("bubble");

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Game Selector */}
            <div className="flex justify-center flex-wrap gap-4">
                <div className="bg-secondary/50 p-1 rounded-full flex gap-1 overflow-x-auto max-w-[90vw]">
                    <button
                        onClick={() => setActiveGame("bubble")}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                            activeGame === "bubble" ? "bg-background shadow-md text-primary" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Circle className="w-4 h-4" /> Bubble Pop
                    </button>
                    <button
                        onClick={() => setActiveGame("eraser")}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                            activeGame === "eraser" ? "bg-background shadow-md text-primary" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Eraser className="w-4 h-4" /> The Eraser
                    </button>
                    <button
                        onClick={() => setActiveGame("ambient")}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                            activeGame === "ambient" ? "bg-background shadow-md text-primary" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Music className="w-4 h-4" /> Ambient
                    </button>
                </div>
            </div>

            {/* Game Container */}
            <div className="min-h-[600px] flex items-center justify-center bg-card/50 border rounded-3xl shadow-sm relative overflow-hidden p-4 md:p-8">
                {/* Background ambient light */}
                <div className={cn(
                    "absolute inset-0 opacity-10 blur-[100px] transition-colors duration-1000",
                    activeGame === "bubble" ? "bg-cyan-500/20" :
                        activeGame === "eraser" ? "bg-rose-500/20" : "bg-purple-500/20"
                )} />

                <div className="relative z-10 w-full h-full max-w-4xl">
                    {activeGame === "bubble" && <BubblePopGame />}
                    {activeGame === "eraser" && <EraserGame />}
                    {activeGame === "ambient" && <AmbientGame />}
                </div>
            </div>
        </div>
    );
}

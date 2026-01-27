"use client";

import { StressGamesHub } from "@/components/features/stress-games-hub";
import { Gamepad2 } from "lucide-react";

export default function GamesPage() {
    return (
        <div className="container max-w-4xl mx-auto space-y-8 pt-4">
            {/* Header Section */}
            <div className="flex flex-col items-center text-center gap-2 relative z-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg mb-4">
                    <Gamepad2 className="w-8 h-8 text-white" />
                </div>

                <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
                    Stress Relief Games
                </h1>
                <p className="text-muted-foreground text-lg max-w-xl">
                    Interactive experiences designed to help you relax, focus, and regain your calm.
                </p>
            </div>

            <StressGamesHub />
        </div>
    );
}

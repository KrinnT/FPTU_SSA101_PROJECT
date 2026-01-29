"use client";

import { FocusTimer } from "@/components/features/focus-timer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function FocusPage() {
    return (
        <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
            {/* Background Blobs - Similar to layout but isolated */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[150px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[10%] w-[40%] h-[40%] rounded-full bg-rose-500/10 blur-[150px] animate-pulse delay-1000" />
            </div>

            {/* Minimal Header */}
            <header className="absolute top-0 left-0 p-6 z-50">
                <Link href="/dashboard">
                    <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="w-4 h-4" /> Exit Focus Mode
                    </Button>
                </Link>
            </header>

            <main className="flex-1 flex items-center justify-center p-4">
                <FocusTimer />
            </main>
        </div>
    );
}

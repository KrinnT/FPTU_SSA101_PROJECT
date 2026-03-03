"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wind, Play, Square, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BreathingGame() {
    const [isActive, setIsActive] = useState(false);
    const [phase, setPhase] = useState<"inhale" | "hold" | "exhale" | "idle">("idle");
    const [timeLeft, setTimeLeft] = useState(0);

    // 4-7-8 Breathing Technique
    const INHALE_TIME = 4;
    const HOLD_TIME = 7;
    const EXHALE_TIME = 8;

    useEffect(() => {
        let timer: NodeJS.Timeout;

        if (isActive) {
            if (timeLeft > 0) {
                timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            } else {
                // Transition to next phase
                if (phase === "idle" || phase === "exhale") {
                    setPhase("inhale");
                    setTimeLeft(INHALE_TIME);
                } else if (phase === "inhale") {
                    setPhase("hold");
                    setTimeLeft(HOLD_TIME);
                } else if (phase === "hold") {
                    setPhase("exhale");
                    setTimeLeft(EXHALE_TIME);
                }
            }
        } else {
            setPhase("idle");
            setTimeLeft(0);
        }

        return () => clearTimeout(timer);
    }, [isActive, phase, timeLeft]);

    const getInstruction = () => {
        switch (phase) {
            case "inhale": return "Breathe In (Qua mũi)";
            case "hold": return "Hold Breath";
            case "exhale": return "Breathe Out (Từ từ)";
            default: return "Ready to relax?";
        }
    };

    const getScale = () => {
        switch (phase) {
            case "inhale": return 1.5;
            case "hold": return 1.5;
            case "exhale": return 1;
            default: return 1;
        }
    };

    const getDuration = () => {
        switch (phase) {
            case "inhale": return INHALE_TIME;
            case "hold": return HOLD_TIME;
            case "exhale": return EXHALE_TIME;
            default: return 0.5;
        }
    };

    const getColor = () => {
        switch (phase) {
            case "inhale": return "bg-teal-400";
            case "hold": return "bg-indigo-400";
            case "exhale": return "bg-blue-400";
            default: return "bg-slate-300 dark:bg-slate-700";
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[500px] w-full bg-background rounded-3xl p-6">
            <div className="text-center mb-12 space-y-2">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 text-transparent bg-clip-text">4-7-8 Breathing</h2>
                <p className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
                    <Info className="w-4 h-4" /> Reduces anxiety and helps you sleep
                </p>
            </div>

            <div className="relative flex items-center justify-center w-64 h-64 mb-16">
                {/* Outer guiding ring */}
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-teal-500/30 w-full h-full scale-[1.5]" />

                {/* Breathing Circle */}
                <motion.div
                    className={`rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(45,212,191,0.3)] ${getColor()}`}
                    initial={{ width: 120, height: 120 }}
                    animate={{
                        scale: getScale(),
                        opacity: isActive ? 1 : 0.8
                    }}
                    transition={{
                        duration: isActive ? getDuration() : 0.5,
                        ease: "linear" // Linear so it matches the steady breathing
                    }}
                    style={{ width: 120, height: 120 }}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={phase + timeLeft}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-white font-bold text-3xl drop-shadow-md"
                        >
                            {isActive && timeLeft > 0 ? timeLeft : <Wind className="w-10 h-10" />}
                        </motion.div>
                    </AnimatePresence>
                </motion.div>
            </div>

            <div className="text-center mb-8 h-8">
                <motion.p
                    key={phase}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-2xl font-medium tracking-wide text-foreground/80"
                >
                    {getInstruction()}
                </motion.p>
            </div>

            <div className="flex gap-4">
                <Button
                    size="lg"
                    onClick={() => setIsActive(!isActive)}
                    className={`rounded-full px-8 ${isActive ? 'bg-rose-500 hover:bg-rose-600 text-white' : 'bg-teal-500 hover:bg-teal-600 text-white'}`}
                >
                    {isActive ? (
                        <>
                            <Square className="w-5 h-5 mr-2 fill-current" /> Stop
                        </>
                    ) : (
                        <>
                            <Play className="w-5 h-5 mr-2 fill-current" /> Start Breathing
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}

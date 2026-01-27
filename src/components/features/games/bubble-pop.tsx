"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const GRID_SIZE = 5; // 5x5 grid
const TOTAL_BUBBLES = GRID_SIZE * GRID_SIZE;

export function BubblePopGame() {
    const [bubbles, setBubbles] = useState<boolean[]>(Array(TOTAL_BUBBLES).fill(false)); // false = intact, true = popped
    const [score, setScore] = useState(0);

    const playPopSound = useCallback(() => {
        const audio = new Audio("https://actions.google.com/sounds/v1/cartoon/pop.ogg");
        audio.volume = 0.5;
        audio.play().catch(() => { });
    }, []);

    const handlePop = (index: number) => {
        if (!bubbles[index]) {
            const newBubbles = [...bubbles];
            newBubbles[index] = true;
            setBubbles(newBubbles);
            setScore(s => s + 1);
            playPopSound();

            // Auto reset if all popped
            if (newBubbles.every(b => b)) {
                setTimeout(() => resetGame(), 1000);
            }
        }
    };

    const resetGame = () => {
        setBubbles(Array(TOTAL_BUBBLES).fill(false));
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-8 p-4">
            <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold flex items-center justify-center gap-2">
                    <Trophy className="text-yellow-500 w-6 h-6" /> Score: {score}
                </h3>
                <p className="text-muted-foreground text-sm">Pop all the bubbles to reset!</p>
            </div>

            <div
                className="grid gap-4 p-6 bg-secondary/30 rounded-3xl backdrop-blur-sm shadow-xl"
                style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
            >
                {bubbles.map((isPopped, index) => (
                    <Bubble
                        key={index}
                        isPopped={isPopped}
                        onClick={() => handlePop(index)}
                    />
                ))}
            </div>

            <Button variant="outline" onClick={resetGame} className="gap-2">
                <RefreshCw className="w-4 h-4" /> Reset Board
            </Button>
        </div>
    );
}

function Bubble({ isPopped, onClick }: { isPopped: boolean; onClick: () => void }) {
    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClick}
            className={cn(
                "w-12 h-12 md:w-16 md:h-16 rounded-full shadow-lg transition-colors relative overflow-hidden",
                isPopped
                    ? "bg-secondary/50 shadow-inner cursor-default"
                    : "bg-gradient-to-br from-cyan-400 to-blue-500 cursor-pointer hover:shadow-cyan-500/50"
            )}
        >
            {/* Glossy Effect */}
            {!isPopped && (
                <div className="absolute top-1 left-2 w-4 h-2 bg-white/40 rounded-full rotate-[-45deg] blur-[1px]" />
            )}

            <AnimatePresence>
                {isPopped && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 bg-white rounded-full"
                    />
                )}
            </AnimatePresence>
        </motion.button>
    );
}

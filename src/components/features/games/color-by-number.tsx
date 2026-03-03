"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Palette, RotateCcw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// A simple pixel-art style template
// Numbers 1-4 correspond to specific colors
const TEMPLATES = [
    {
        name: "Heart",
        grid: [
            [0, 1, 1, 0, 1, 1, 0],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 2, 1, 2, 1, 1],
            [0, 1, 1, 1, 1, 1, 0],
            [0, 0, 1, 1, 1, 0, 0],
            [0, 0, 0, 1, 0, 0, 0]
        ]
    },
    {
        name: "Flower",
        grid: [
            [0, 0, 3, 3, 3, 0, 0],
            [0, 3, 4, 3, 4, 3, 0],
            [0, 3, 3, 4, 3, 3, 0],
            [0, 0, 3, 3, 3, 0, 0],
            [0, 0, 0, 2, 0, 0, 0],
            [0, 0, 2, 2, 2, 0, 0]
        ]
    }
];

const COLORS = {
    1: { name: "Rose", hex: "#f43f5e", bgClass: "bg-rose-500" },
    2: { name: "Emerald", hex: "#10b981", bgClass: "bg-emerald-500" },
    3: { name: "Violet", hex: "#8b5cf6", bgClass: "bg-violet-500" },
    4: { name: "Amber", hex: "#f59e0b", bgClass: "bg-amber-500" },
    0: { name: "Empty", hex: "transparent", bgClass: "bg-transparent" }
};

export function ColorByNumberGame() {
    const [currentTemplate, setCurrentTemplate] = useState(0);
    const [selectedColor, setSelectedColor] = useState<number>(1);

    // Initialize empty canvas matching template size
    const initializeCanvas = (templateIndex: number) => {
        const template = TEMPLATES[templateIndex];
        return Array(template.grid.length).fill(0).map(() => Array(template.grid[0].length).fill(null)); // null means uncolored
    };

    const [canvas, setCanvas] = useState<(number | null)[][]>(() => initializeCanvas(0));

    const template = TEMPLATES[currentTemplate];

    // Check if fully and correctly colored
    const isComplete = () => {
        for (let r = 0; r < template.grid.length; r++) {
            for (let c = 0; c < template.grid[0].length; c++) {
                if (template.grid[r][c] !== 0 && canvas[r][c] !== template.grid[r][c]) {
                    return false;
                }
            }
        }
        return true;
    };

    const handleCellClick = (r: number, c: number) => {
        if (template.grid[r][c] === 0) return; // Ignore blank spaces

        const newCanvas = [...canvas];
        newCanvas[r] = [...newCanvas[r]];

        // Allowed to color wrong, but it won't complete until right
        newCanvas[r][c] = selectedColor;
        setCanvas(newCanvas);
    };

    const handleReset = () => {
        setCanvas(initializeCanvas(currentTemplate));
    };

    const handleNext = () => {
        const nextIdx = (currentTemplate + 1) % TEMPLATES.length;
        setCurrentTemplate(nextIdx);
        setCanvas(initializeCanvas(nextIdx));
    };

    return (
        <div className="flex flex-col items-center justify-center p-6 bg-background rounded-3xl min-h-[500px]">
            <div className="text-center mb-8 space-y-2">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-500 text-transparent bg-clip-text flex items-center justify-center gap-2">
                    <Palette className="w-8 h-8 text-violet-500" /> Color By Number
                </h2>
                <p className="text-muted-foreground text-sm">
                    Focus on matching the numbers to the colors. Art Therapy to clear your mind.
                </p>
            </div>

            {/* Color Palette Selection */}
            <div className="flex gap-4 mb-8 p-4 bg-secondary/30 rounded-2xl">
                {[1, 2, 3, 4].map(num => (
                    <button
                        key={num}
                        onClick={() => setSelectedColor(num)}
                        className={`flex flex-col items-center gap-2 transition-transform ${selectedColor === num ? 'scale-110' : 'opacity-70 hover:opacity-100'}`}
                    >
                        <div
                            className={`w-10 h-10 rounded-full border-4 shadow-sm ${COLORS[num as keyof typeof COLORS].bgClass}`}
                            style={{ borderColor: selectedColor === num ? 'rgba(255,255,255,0.8)' : 'transparent' }}
                        >
                            <span className="flex items-center justify-center h-full text-white font-bold opacity-80">{num}</span>
                        </div>
                    </button>
                ))}
            </div>

            {/* Canvas Grid */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-inner border border-border/50">
                <div
                    className="grid gap-1"
                    style={{ gridTemplateColumns: `repeat(${template.grid[0].length}, minmax(0, 1fr))` }}
                >
                    {template.grid.map((row, rIdx) => (
                        row.map((targetColor, cIdx) => {
                            const isBlank = targetColor === 0;
                            const currentColor = canvas[rIdx][cIdx];

                            // Determine cell background
                            let cellClass = "w-10 h-10 md:w-12 md:h-12 rounded-sm flex items-center justify-center text-xs font-semibold cursor-pointer transition-colors";

                            if (isBlank) {
                                cellClass += " bg-transparent cursor-default";
                            } else if (currentColor !== null) {
                                cellClass += ` ${COLORS[currentColor as keyof typeof COLORS].bgClass} text-white/50`;
                            } else {
                                cellClass += " bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600";
                            }

                            return (
                                <div
                                    key={`${rIdx}-${cIdx}`}
                                    onClick={() => handleCellClick(rIdx, cIdx)}
                                    className={cellClass}
                                >
                                    {!isBlank && currentColor === null ? targetColor : ""}
                                </div>
                            );
                        })
                    ))}
                </div>
            </div>

            {/* Victory / Controls */}
            <div className="mt-8 h-12 flex items-center justify-center w-full">
                {isComplete() ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-4"
                    >
                        <span className="text-emerald-500 font-bold flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5" /> Beautifully done!
                        </span>
                        <Button onClick={handleNext} variant="outline" size="sm" className="rounded-full">
                            Next Art
                        </Button>
                    </motion.div>
                ) : (
                    <Button onClick={handleReset} variant="ghost" size="sm" className="text-muted-foreground rounded-full">
                        <RotateCcw className="w-4 h-4 mr-2" /> Start Over
                    </Button>
                )}
            </div>
        </div>
    );
}

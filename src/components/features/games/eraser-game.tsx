"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Matter from "matter-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eraser, Hand, Trash2, Send, Sparkles, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Types
type BodyItem = {
    id: number;
    text: string;
    x: number;
    y: number;
    angle: number;
    color: string;
    width: number;
    height: number;
};

type Particle = {
    id: number;
    x: number;
    y: number;
    color: string;
    vx: number;
    vy: number;
    life: number;
};

const COLORS = [
    "bg-rose-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-red-600",
    "bg-pink-600",
];

export function EraserGame() {
    const sceneRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<Matter.Engine | null>(null);
    const [bodies, setBodies] = useState<BodyItem[]>([]);
    const [particles, setParticles] = useState<Particle[]>([]);
    const [inputType, setInputType] = useState("");
    const [tool, setTool] = useState<"hand" | "eraser">("hand");
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [isHoveringCanvas, setIsHoveringCanvas] = useState(false);
    const [isHoveringBody, setIsHoveringBody] = useState<number | null>(null);

    // Physics Loop Sync
    useEffect(() => {
        const Engine = Matter.Engine,
            Runner = Matter.Runner,
            World = Matter.World,
            Bodies = Matter.Bodies,
            Mouse = Matter.Mouse,
            MouseConstraint = Matter.MouseConstraint;

        const engine = Engine.create();
        engineRef.current = engine;

        // Custom gravity
        engine.gravity.y = 1.2;

        // Wall Boundaries
        const width = sceneRef.current?.clientWidth || 800;
        const height = 600;

        const ground = Bodies.rectangle(width / 2, height + 50, width, 100, { isStatic: true });
        const leftWall = Bodies.rectangle(-50, height / 2, 100, height, { isStatic: true });
        const rightWall = Bodies.rectangle(width + 50, height / 2, 100, height, { isStatic: true });

        World.add(engine.world, [ground, leftWall, rightWall]);

        // Mouse Control (for Hand Tool)
        const mouse = Mouse.create(sceneRef.current!);
        const mouseConstraint = MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.1, // Softer drag
                damping: 0.1,   // Less shaky
                render: { visible: false },
            },
        });
        World.add(engine.world, mouseConstraint);

        // Runner
        const runner = Runner.create();
        Runner.run(runner, engine);

        // Sync Loop
        let animationFrameId: number;
        const updateLoop = () => {
            const allBodies = Matter.Composite.allBodies(engine.world);
            const syncedBodies: BodyItem[] = [];

            allBodies.forEach(b => {
                if (b.label === "word" && !b.isStatic) {
                    // @ts-ignore
                    syncedBodies.push({
                        id: b.id,
                        // @ts-ignore
                        text: b.text,
                        x: b.position.x,
                        y: b.position.y,
                        angle: b.angle,
                        // @ts-ignore
                        color: b.color,
                        // @ts-ignore
                        width: b.width,
                        // @ts-ignore
                        height: b.height
                    });
                }
            });

            setBodies(syncedBodies);
            updateParticles();
            animationFrameId = requestAnimationFrame(updateLoop);
        };
        updateLoop();

        return () => {
            Runner.stop(runner);
            Engine.clear(engine);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    const updateParticles = () => {
        setParticles(prev => prev
            .map(p => ({
                ...p,
                x: p.x + p.vx,
                y: p.y + p.vy,
                life: p.life - 0.02,
                vy: p.vy + 0.2 // lighter gravity
            }))
            .filter(p => p.life > 0)
        );
    };

    const spawnParticles = (x: number, y: number, color: string) => {
        const newParticles: Particle[] = [];
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            newParticles.push({
                id: Math.random(),
                x,
                y,
                color,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0
            });
        }
        setParticles(prev => [...prev, ...newParticles]);
    };

    const addWord = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputType.trim() || !engineRef.current || !sceneRef.current) return;

        const width = sceneRef.current.clientWidth;
        const x = Math.random() * (width - 200) + 100;
        const textLength = inputType.length * 14 + 48; // Adjusted width
        const height = 50;
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];

        const box = Matter.Bodies.rectangle(x, -50, textLength, height, {
            restitution: 0.5,
            friction: 0.5,
            density: 0.01, // Heavier feel
            label: "word",
            angle: (Math.random() - 0.5) * 0.2
        });

        // @ts-ignore
        box.text = inputType;
        // @ts-ignore
        box.color = color;
        // @ts-ignore
        box.width = textLength;
        // @ts-ignore
        box.height = height;

        Matter.World.add(engineRef.current.world, box);
        setInputType("");
    };

    const handleBodyClick = (bodyId: number) => {
        if (tool === "eraser" && engineRef.current) {
            const body = Matter.Composite.get(engineRef.current.world, bodyId, "body");
            if (body) {
                // @ts-ignore
                spawnParticles(body.position.x, body.position.y, body.color || "bg-rose-500");
                Matter.World.remove(engineRef.current.world, body);
            }
        }
    };

    const clearAll = () => {
        if (!engineRef.current) return;
        const bodies = Matter.Composite.allBodies(engineRef.current.world).filter(b => b.label === "word");
        bodies.forEach(b => {
            // @ts-ignore
            spawnParticles(b.position.x, b.position.y, "bg-white");
        });
        Matter.Composite.remove(engineRef.current.world, bodies);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = sceneRef.current?.getBoundingClientRect();
        if (rect) {
            setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }
    };

    return (
        <div className="flex flex-col space-y-6 max-w-4xl mx-auto w-full p-4">
            <div className="text-center space-y-2">
                <h3 className="text-3xl font-bold flex items-center justify-center gap-3 text-slate-800 dark:text-slate-100">
                    <Eraser className="w-8 h-8 text-rose-500" /> Stress Eraser Pro
                </h3>
                <p className="text-muted-foreground">Type your worries, then choose how to handle them.</p>
            </div>

            <div
                className={cn(
                    "relative group rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shadow-xl min-h-[600px] select-none",
                    tool === "eraser" && "cursor-none"
                )}
                onMouseEnter={() => setIsHoveringCanvas(true)}
                onMouseLeave={() => setIsHoveringCanvas(false)}
                onMouseMove={handleMouseMove}
            >

                {/* Background (Fixed) */}
                <div
                    className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out -z-10"
                    style={{
                        backgroundImage: 'url(https://images.unsplash.com/photo-1490730141103-6cac27aaab94?q=80&w=2070&auto=format&fit=crop)',
                        filter: bodies.length > 0 ? 'blur(8px) grayscale(50%)' : 'none',
                        opacity: bodies.length > 0 ? 0.4 : 1
                    }}
                />

                {/* Physics Scene Container */}
                <div ref={sceneRef} className="absolute inset-0 z-10 w-full h-full">
                    {/* Render Bodies using React */}
                    <AnimatePresence>
                        {bodies.map(body => (
                            <motion.div
                                key={body.id}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                // Events need to go to physics engine essentially, but for click detection React is simpler
                                onClick={() => handleBodyClick(body.id)}
                                onMouseEnter={() => setIsHoveringBody(body.id)}
                                onMouseLeave={() => setIsHoveringBody(null)}
                                className={cn(
                                    "absolute flex items-center justify-center px-6 py-3 rounded-xl shadow-lg text-white font-bold cursor-pointer transition-transform border-b-4 border-black/20",
                                    body.color,
                                    tool === "eraser" && isHoveringBody === body.id && "ring-4 ring-white/80 scale-105 brightness-110",
                                    tool === "hand" && "hover:scale-105 active:scale-95"
                                )}
                                style={{
                                    left: 0,
                                    top: 0,
                                    width: body.width,
                                    height: body.height,
                                    x: body.x - body.width / 2,
                                    y: body.y - body.height / 2,
                                    rotate: body.angle * (180 / Math.PI)
                                }}
                            >
                                <span className="drop-shadow-md text-lg">{body.text}</span>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Render Particles */}
                    {particles.map(p => (
                        <div
                            key={p.id}
                            className={cn("absolute w-4 h-4 rounded-full pointer-events-none blur-[1px]", p.color)}
                            style={{
                                left: p.x,
                                top: p.y,
                                opacity: p.life,
                                transform: `scale(${p.life})`
                            }}
                        />
                    ))}

                    {/* Custom Eraser Cursor */}
                    <AnimatePresence>
                        {tool === "eraser" && isHoveringCanvas && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="absolute pointer-events-none z-50 mix-blend-difference"
                                style={{
                                    left: cursorPos.x,
                                    top: cursorPos.y,
                                    x: "-50%",
                                    y: "-50%"
                                }}
                            >
                                <div className="w-16 h-16 rounded-full border-2 border-white bg-white/20 backdrop-invert shadow-[0_0_15px_rgba(255,255,255,0.5)] flex items-center justify-center">
                                    <div className="w-2 h-2 bg-white rounded-full" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Empty State Message */}
                <AnimatePresence>
                    {bodies.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center z-0 pointer-events-none"
                        >
                            <h2 className="text-4xl md:text-6xl font-black text-white drop-shadow-lg text-center px-4">
                                Breathe Free
                            </h2>
                            <p className="text-white/90 text-xl font-medium mt-2 drop-shadow-md bg-black/20 px-6 py-2 rounded-full backdrop-blur-md">
                                Your mind is clear.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Toolbar */}
                <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 bg-white/90 dark:bg-black/50 p-2 rounded-xl backdrop-blur-md shadow-lg border border-white/20">
                    <Button
                        size="icon"
                        variant={tool === "hand" ? "default" : "ghost"}
                        onClick={() => setTool("hand")}
                        title="Move (Hand)"
                        className={cn("rounded-lg transition-all", tool === "hand" && "bg-sky-500 hover:bg-sky-600")}
                    >
                        <Hand className="w-5 h-5" />
                    </Button>
                    <Button
                        size="icon"
                        variant={tool === "eraser" ? "default" : "ghost"}
                        onClick={() => setTool("eraser")}
                        title="Erase"
                        className={cn("rounded-lg transition-all", tool === "eraser" && "bg-rose-500 hover:bg-rose-600")}
                    >
                        <Eraser className="w-5 h-5" />
                    </Button>
                    <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={clearAll}
                        title="Clear All"
                        disabled={bodies.length === 0}
                        className="text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                        <Trash2 className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Input Controls */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md border border-slate-100 dark:border-slate-700">
                <form onSubmit={addWord} className="flex gap-3">
                    <Input
                        value={inputType}
                        onChange={e => setInputType(e.target.value)}
                        placeholder="Type a stressor here..."
                        className="flex-1 text-lg h-12 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus-visible:ring-rose-500"
                        autoFocus
                    />
                    <Button
                        type="submit"
                        disabled={!inputType.trim()}
                        className="h-12 px-6 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white font-bold shadow-md transition-transform active:scale-95"
                    >
                        <PlaceIcon /> Materialize
                    </Button>
                </form>
            </div>
        </div>
    );
}

function PlaceIcon() {
    return <Sparkles className="w-5 h-5 mr-2" />
}

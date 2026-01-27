"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, Music } from "lucide-react";
import { Button } from "@/components/ui/button";

// Pentatonic Scale Frequencies (C Major Pentatonic: C, D, E, G, A) across octaves
const SCALES = [
    130.81, 146.83, 164.81, 196.00, 220.00, // C3
    261.63, 293.66, 329.63, 392.00, 440.00, // C4
    523.25, 587.33, 659.25, 783.99, 880.00, // C5
];

export function AmbientGame() {
    const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
    const [ripples, setRipples] = useState<{ id: number; x: number; y: number; color: string }[]>([]);
    const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        // Initialize Audio Context on user interaction (handled in handleInteraction) or mount
        // Browsers require interaction to resume AudioContext
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioCtx(ctx);
        return () => {
            ctx.close();
        };
    }, []);

    const playTone = useCallback((freq: number) => {
        if (!audioCtx || isMuted) return;
        if (audioCtx.state === "suspended") audioCtx.resume();

        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc.type = "sine"; // Soft wave
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

        // Envelope: Attack -> Decay
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.1); // Attack
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 3); // Long Decay (3s reverb feel)

        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 3.1);
    }, [audioCtx, isMuted]);

    const playChord = useCallback(() => {
        // Play a random harmonious chord background occasionally?
        // Let's stick to user interaction primarily.
    }, []);

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Map y-position to pitch (higher y = lower pitch usually, or flip it)
        // Let's do: Lower on screen = Lower pitch
        const percentY = 1 - (y / rect.height); // 0 to 1
        const scaleIndex = Math.floor(percentY * SCALES.length);
        const freq = SCALES[Math.min(scaleIndex, SCALES.length - 1)];

        playTone(freq);

        const newRipple = {
            id: Date.now(),
            x: e.clientX, // Global coordinates for fixed overlay or relative?
            // Use relative to container usually better, but fixed overlay is easier for ripple effect
            y: e.clientY,
            color: `hsl(${Math.random() * 60 + 180}, 80%, 70%)` // Cyans and Blues
        };

        // We use relative coordinates for the rendering inside the container
        setRipples(prev => [...prev, { ...newRipple, x, y }]);
    };

    const removeRipple = (id: number) => {
        setRipples(prev => prev.filter(r => r.id !== id));
    };

    return (
        <div className="flex flex-col space-y-4 h-full">
            <div className="flex items-center justify-between px-4">
                <div>
                    <h3 className="text-2xl font-bold flex items-center gap-2">
                        <Music className="w-5 h-5 text-cyan-500" /> Sonic Universe
                    </h3>
                    <p className="text-muted-foreground text-sm">Tap anywhere to create sound & light.</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)}>
                    {isMuted ? <VolumeX /> : <Volume2 />}
                </Button>
            </div>

            <div
                className="relative w-full h-[500px] bg-[#0a0a0a] rounded-xl overflow-hidden cursor-pointer shadow-2xl border border-white/10"
                onClick={handleClick}
            >
                {/* Floating Ambient Particles */}
                {[...Array(10)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 bg-white/20 rounded-full"
                        animate={{
                            x: [Math.random() * 100, Math.random() * 500],
                            y: [Math.random() * 100, Math.random() * 500],
                            opacity: [0.2, 0.5, 0.2],
                        }}
                        transition={{
                            duration: Math.random() * 10 + 10,
                            repeat: Infinity,
                            repeatType: "reverse",
                            ease: "linear"
                        }}
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                    />
                ))}

                <AnimatePresence>
                    {ripples.map(ripple => (
                        <Ripple
                            key={ripple.id}
                            x={ripple.x}
                            y={ripple.y}
                            color={ripple.color}
                            onComplete={() => removeRipple(ripple.id)}
                        />
                    ))}
                </AnimatePresence>

                <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
                    <span className="text-9xl font-bold tracking-tighter text-white">LISTEN</span>
                </div>
            </div>
        </div>
    );
}

function Ripple({ x, y, color, onComplete }: { x: number, y: number, color: string, onComplete: () => void }) {
    return (
        <motion.div
            initial={{ width: 0, height: 0, opacity: 0.8, borderWidth: 20 }}
            animate={{ width: 500, height: 500, opacity: 0, borderWidth: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: "easeOut" }}
            onAnimationComplete={onComplete}
            className="absolute rounded-full border-solid pointer-events-none"
            style={{
                left: x,
                top: y,
                transform: "translate(-50%, -50%)",
                borderColor: color,
                boxShadow: `0 0 20px ${color}`
            }}
        />
    );
}

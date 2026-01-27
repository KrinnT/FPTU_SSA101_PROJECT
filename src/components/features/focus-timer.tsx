"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, RotateCcw, Lock, Unlock, Music, Volume2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function FocusTimer() {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<"focus" | "shortBreak" | "longBreak">("focus");
    const [task, setTask] = useState("");
    const [isStrict, setIsStrict] = useState(false);
    const [isEditingTask, setIsEditingTask] = useState(true);
    const [ambient, setAmbient] = useState<string | null>(null);
    const [volume, setVolume] = useState(0.5);

    const [timerType, setTimerType] = useState<"pomodoro" | "custom">("pomodoro");
    const [customMinutes, setCustomMinutes] = useState(30);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Timer Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
            audio.play().catch(console.error);
        }

        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    // Audio Control Logic
    useEffect(() => {
        if (audioRef.current) {
            if (ambient) {
                audioRef.current.play().catch(console.error);
            } else {
                audioRef.current.pause();
            }
        }
    }, [ambient]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    const toggleTimer = () => {
        if (!task.trim() && !isActive) {
            return alert("Please enter a task first!");
        }
        if (isEditingTask) setIsEditingTask(false);
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        setIsActive(false);
        if (timerType === "pomodoro") {
            setTimeLeft(mode === "focus" ? 25 * 60 : mode === "shortBreak" ? 5 * 60 : 15 * 60);
        } else {
            setTimeLeft(customMinutes * 60);
        }
    };

    const changeMode = (newMode: typeof mode) => {
        setMode(newMode);
        setIsActive(false);
        setTimeLeft(newMode === "focus" ? 25 * 60 : newMode === "shortBreak" ? 5 * 60 : 15 * 60);
    };

    // Handle Custom Time Change
    const handleCustomTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value) || 0;
        setCustomMinutes(val);
        if (!isActive) {
            setTimeLeft(val * 60);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const sounds = [
        { id: "rain", label: "Rain 🌧️", url: "https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg" },
        { id: "cafe", label: "Cafe ☕", url: "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg" },
        { id: "waves", label: "Waves 🌊", url: "https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg" },
    ];

    // Update Browser Title (Taskbar)
    useEffect(() => {
        if (isActive) {
            document.title = `(${formatTime(timeLeft)}) Focus Mode`;
        } else {
            document.title = "Psych Support | Focus";
        }
        return () => {
            document.title = "Psych Support";
        };
    }, [timeLeft, isActive]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Ambient Audio Player */}
            <audio ref={audioRef} loop src={ambient ? sounds.find(s => s.id === ambient)?.url : undefined} />

            {/* Mode Toggle */}
            <div className="bg-secondary/50 p-1 rounded-full flex relative z-20">
                <Button
                    variant={timerType === "pomodoro" ? "default" : "ghost"}
                    onClick={() => {
                        setTimerType("pomodoro");
                        setIsActive(false);
                        setTimeLeft(25 * 60);
                        setMode("focus");
                    }}
                    className="rounded-full px-6"
                >
                    🍅 Pomodoro
                </Button>
                <Button
                    variant={timerType === "custom" ? "default" : "ghost"}
                    onClick={() => {
                        setTimerType("custom");
                        setIsActive(false);
                        setTimeLeft(customMinutes * 60);
                    }}
                    className="rounded-full px-6"
                >
                    ⏳ Custom
                </Button>
            </div>

            {/* Task Binding */}
            <div className="w-full text-center space-y-2 relative z-20">
                {/* ... (keep task input logic) */}
                {isEditingTask ? (
                    <Input
                        placeholder="What is your focused goal?"
                        className="text-center text-xl md:text-2xl font-medium border-none bg-transparent placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                        value={task}
                        onChange={(e) => setTask(e.target.value)}
                        onBlur={() => task.trim() && setIsEditingTask(false)}
                        onKeyDown={(e) => e.key === "Enter" && task.trim() && setIsEditingTask(false)}
                        autoFocus
                    />
                ) : (
                    <div
                        onClick={() => !isActive && setIsEditingTask(true)}
                        className={cn(
                            "text-xl md:text-3xl font-bold cursor-pointer hover:opacity-80 transition-all flex items-center justify-center gap-2",
                            isActive ? "opacity-100" : "opacity-60"
                        )}
                    >
                        <span>{task}</span>
                        {!isActive && <span className="text-xs align-top text-muted-foreground">(Click to edit)</span>}
                    </div>
                )}
                <p className="text-sm text-muted-foreground uppercase tracking-widest">Current Objective</p>
            </div>

            {/* Timer Display */}
            <div className="relative group">
                <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full animate-pulse pointer-events-none" />
                <div className="relative text-[8rem] md:text-[12rem] font-bold tabular-nums leading-none tracking-tighter drop-shadow-2xl transition-all">
                    {formatTime(timeLeft)}
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center gap-6 relative z-20">

                {/* Main Actions */}
                <div className="flex items-center gap-4">
                    <Button
                        size="icon"
                        variant="secondary"
                        className="w-16 h-16 rounded-full"
                        onClick={resetTimer}
                    >
                        <RotateCcw className="w-6 h-6" />
                    </Button>

                    <Button
                        size="icon"
                        className={cn(
                            "w-24 h-24 rounded-full transition-all duration-300",
                            isActive ? "bg-rose-500 hover:bg-rose-600" : "bg-emerald-500 hover:bg-emerald-600"
                        )}
                        onClick={toggleTimer}
                    >
                        {isActive ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10 ml-1" />}
                    </Button>

                    <Button
                        size="icon"
                        variant={isStrict ? "destructive" : "secondary"}
                        className={cn("w-16 h-16 rounded-full", isStrict && "ring-4 ring-rose-500/30")}
                        onClick={() => {
                            if (!isActive) {
                                const newStrict = !isStrict;
                                setIsStrict(newStrict);
                                if (newStrict) {
                                    document.documentElement.requestFullscreen().catch((err) => console.log(err));
                                } else {
                                    document.exitFullscreen().catch((err) => console.log(err));
                                }
                            }
                        }}
                        title="Strict Mode (Fullscreen)"
                    >
                        {isStrict ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
                    </Button>
                </div>

                {/* Specific Mode Controls */}
                {timerType === "pomodoro" ? (
                    <div className="flex items-center p-1 bg-secondary/50 rounded-full">
                        <Button
                            variant={mode === "focus" ? "default" : "ghost"}
                            onClick={() => changeMode("focus")}
                            className="rounded-full px-6"
                        >
                            Focus
                        </Button>
                        <Button
                            variant={mode === "shortBreak" ? "default" : "ghost"}
                            onClick={() => changeMode("shortBreak")}
                            className="rounded-full px-6"
                        >
                            Short Break
                        </Button>
                        <Button
                            variant={mode === "longBreak" ? "default" : "ghost"}
                            onClick={() => changeMode("longBreak")}
                            className="rounded-full px-6"
                        >
                            Long Break
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center gap-4 bg-secondary/30 p-4 rounded-xl">
                        <span className="text-sm font-medium">Duration (min):</span>
                        <Input
                            type="number"
                            min="1"
                            max="180"
                            value={customMinutes}
                            onChange={handleCustomTimeChange}
                            disabled={isActive}
                            className="w-20 text-center font-bold text-lg"
                        />
                    </div>
                )}

                {/* Ambient Sounds */}
                <Card className="glass-card mt-4 border-none bg-white/5">
                    <CardContent className="p-4 flex items-center gap-4">
                        <Music className="w-4 h-4 text-muted-foreground" />
                        <div className="flex bg-background/50 rounded-lg p-1">
                            <Button
                                size="sm"
                                variant={ambient === null ? "secondary" : "ghost"}
                                onClick={() => setAmbient(null)}
                                className="text-xs h-7"
                            >
                                Off
                            </Button>
                            {sounds.map(s => (
                                <Button
                                    key={s.id}
                                    size="sm"
                                    variant={ambient === s.id ? "secondary" : "ghost"}
                                    onClick={() => setAmbient(s.id)}
                                    className="text-xs h-7"
                                >
                                    {s.label}
                                </Button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 w-24">
                            <Volume2 className="w-4 h-4 text-muted-foreground" />
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={volume}
                                onChange={(e) => setVolume(parseFloat(e.target.value))}
                                className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                        </div>
                    </CardContent>
                </Card>

                {isStrict && (
                    <div className="flex items-center gap-2 text-rose-400 text-sm animate-pulse">
                        <AlertCircle className="w-4 h-4" />
                        <span>Strict Mode Active: Tab switching will pause timer!</span>
                    </div>
                )}
            </div>
        </div>
    );
}

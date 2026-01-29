"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wind, Lightbulb, BookOpen, Activity, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ProtectedRoute from "@/components/layout/protected-route";

// Simple Tabs implementation
function SimpleTabs({
    options,
    active,
    onChange
}: {
    options: { id: string, label: string, icon: React.ReactNode }[],
    active: string,
    onChange: (id: string) => void
}) {
    return (
        <div className="flex p-1 bg-secondary/20 rounded-xl">
            {options.map((opt) => (
                <button
                    key={opt.id}
                    onClick={() => onChange(opt.id)}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all",
                        active === opt.id
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                    )}
                >
                    {opt.icon}
                    {opt.label}
                </button>
            ))}
        </div>
    )
}

export default function ExercisesPage() {
    return (
        <ProtectedRoute>
            <ExercisesContent />
        </ProtectedRoute>
    )
}

function ExercisesContent() {
    const [activeTab, setActiveTab] = useState("breathing");
    const [breathingState, setBreathingState] = useState<"inhale" | "hold" | "exhale" | "idle">("idle");

    // Breathing Logic
    const startBreathing = () => {
        if (breathingState !== "idle") {
            setBreathingState("idle");
            return;
        }

        let phase = 0; // 0: inhale, 1: hold, 2: exhale
        setBreathingState("inhale");

        const cycle = () => {
            if (phase === 0) {
                setBreathingState("inhale");
                setTimeout(() => { phase = 1; cycle(); }, 4000); // 4s Inhale
            } else if (phase === 1) {
                setBreathingState("hold");
                setTimeout(() => { phase = 2; cycle(); }, 7000); // 7s Hold
            } else if (phase === 2) {
                setBreathingState("exhale");
                setTimeout(() => { phase = 0; cycle(); }, 8000); // 8s Exhale
            }
        };
        cycle();
    };


    // Diary Logic
    const [diaryEntries, setDiaryEntries] = useState<any[]>([]);

    // Load diary on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const history = JSON.parse(localStorage.getItem("cbtJournal") || "[]");
            setDiaryEntries(history);
        }
    }, []);

    const saveDiary = () => {
        const trigger = (document.getElementById("cbt-trigger") as HTMLTextAreaElement).value;
        const thought = (document.getElementById("cbt-thought") as HTMLTextAreaElement).value;
        const evidence = (document.getElementById("cbt-evidence") as HTMLTextAreaElement).value;
        const balanced = (document.getElementById("cbt-balanced") as HTMLTextAreaElement).value;

        if (!trigger || !balanced) return alert("Please complete at least the situation and balanced thought.");

        const entry = { date: new Date().toISOString(), trigger, thought, evidence, balanced };
        const newHistory = [entry, ...diaryEntries];

        localStorage.setItem("cbtJournal", JSON.stringify(newHistory));
        setDiaryEntries(newHistory);

        alert("Thinking Diary Saved! Great job challenging that thought.");
        // Reset
        ["cbt-trigger", "cbt-thought", "cbt-evidence", "cbt-balanced"].forEach(id => (document.getElementById(id) as HTMLTextAreaElement).value = "");
    };

    const deleteEntry = (index: number) => {
        if (!confirm("Are you sure you want to delete this entry?")) return;

        const newHistory = [...diaryEntries];
        newHistory.splice(index, 1);

        localStorage.setItem("cbtJournal", JSON.stringify(newHistory));
        setDiaryEntries(newHistory);
    };

    return (
        <div className="min-h-screen w-full p-4 md:p-8 flex flex-col items-center">
            <div className="w-full max-w-4xl space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold">Coping Toolkit</h1>
                    <p className="text-muted-foreground">Practical tools to regain balance and focus.</p>
                </div>

                <SimpleTabs
                    active={activeTab}
                    onChange={setActiveTab}
                    options={[
                        { id: "breathing", label: "Breathing", icon: <Wind className="w-4 h-4" /> },
                        { id: "cbt", label: "Thinking Diary", icon: <Lightbulb className="w-4 h-4" /> },
                        { id: "media", label: "Relaxation Media", icon: <Activity className="w-4 h-4" /> },
                        { id: "tips", label: "Study Tips", icon: <BookOpen className="w-4 h-4" /> }
                    ]}
                />

                <div className="min-h-[400px]">
                    {activeTab === "breathing" && (
                        <Card className="glass-card text-center">
                            <CardHeader>
                                <CardTitle>4-7-8 Relaxation Breathing</CardTitle>
                                <CardDescription>Inhale for 4s, Hold for 7s, Exhale for 8s.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center min-h-[300px] gap-8">
                                <div className="relative flex items-center justify-center w-64 h-64">
                                    {/* Background Circles */}
                                    <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl" />

                                    <motion.div
                                        animate={{
                                            scale: breathingState === "inhale" ? 1.5 : breathingState === "exhale" ? 1 : 1.2,
                                            opacity: breathingState === "exhale" ? 0.6 : 1,
                                        }}
                                        transition={{ duration: breathingState === "inhale" ? 4 : breathingState === "exhale" ? 8 : 0 }}
                                        className="w-32 h-32 bg-primary/30 rounded-full flex items-center justify-center backdrop-blur-sm border border-primary/20 relative z-10"
                                    >
                                        <span className="text-xl font-medium uppercase tracking-widest text-primary-foreground">
                                            {breathingState === "idle" ? "Ready" : breathingState}
                                        </span>
                                    </motion.div>
                                </div>
                                <Button size="lg" onClick={startBreathing}>
                                    {breathingState === "idle" ? "Start Exercise" : "Stop"}
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === "cbt" && (
                        <div className="space-y-6">
                            <Card className="glass-card">
                                <CardHeader>
                                    <CardTitle>CBT Thinking Diary</CardTitle>
                                    <CardDescription>Identify and challenge negative thoughts to improve your mood.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">1. The Situation (Trigger)</label>
                                        <textarea
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 min-h-[80px] focus:ring-primary"
                                            placeholder="e.g., I have a Calculus calculus exam tomorrow."
                                            id="cbt-trigger"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">2. Automatic Negative Thought</label>
                                        <textarea
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 min-h-[80px]"
                                            placeholder="e.g., I'm going to fail. I'm stupid."
                                            id="cbt-thought"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">3. Challenge (Evidence against thought)</label>
                                        <textarea
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 min-h-[80px]"
                                            placeholder="e.g., I passed the last quiz. I've studied for 3 days."
                                            id="cbt-evidence"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">4. Balanced / Alternative Thought</label>
                                        <textarea
                                            className="w-full bg-primary/5 border border-primary/20 rounded-lg p-3 min-h-[80px]"
                                            placeholder="e.g., It will be challenging, but I'm prepared enough to do my best."
                                            id="cbt-balanced"
                                        />
                                    </div>
                                    <Button
                                        className="w-full"
                                        onClick={saveDiary}
                                    >
                                        Save to Diary
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Diary History */}
                            <div className="space-y-4">
                                <h3 className="text-xl font-semibold px-2">Past Entries</h3>
                                {diaryEntries.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-8">No entries yet. Start writing above!</p>
                                ) : (
                                    diaryEntries.map((entry, i) => (
                                        <Card key={i} className="glass-card hover:bg-white/5 transition-colors group relative">
                                            <CardContent className="p-4 space-y-2">
                                                <div className="flex justify-between items-start">
                                                    <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                                                        {new Date(entry.date).toLocaleDateString()}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-muted-foreground hover:text-red-500 -mt-1 -mr-1"
                                                        onClick={() => deleteEntry(i)}
                                                        title="Delete Entry"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                                <div>
                                                    <span className="text-xs font-semibold text-rose-400 block">Trigger</span>
                                                    <p className="text-sm">{entry.trigger}</p>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                                    <div>
                                                        <span className="text-xs font-semibold text-muted-foreground block">Negative Thought</span>
                                                        <p className="text-sm text-muted-foreground italic">"{entry.thought}"</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-semibold text-emerald-400 block">Balanced Thought</span>
                                                        <p className="text-sm">{entry.balanced}</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === "media" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* White Noise */}
                            <Card className="glass-card overflow-hidden">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Wind className="w-5 h-5 text-blue-400" /> White Noise
                                    </CardTitle>
                                    <CardDescription>Deep Focus & Relaxation</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0 pb-4 px-4">
                                    <div className="aspect-video w-full rounded-lg overflow-hidden border border-white/10 shadow-lg">
                                        <iframe
                                            width="100%"
                                            height="100%"
                                            src="https://www.youtube.com/embed/nMfPqeZjc2c"
                                            title="White Noise"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Therapy Podcast */}
                            <Card className="glass-card overflow-hidden">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-green-400" /> Therapy Podcast
                                    </CardTitle>
                                    <CardDescription>Mental Health Awareness</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0 pb-4 px-4">
                                    <div className="aspect-video w-full rounded-lg overflow-hidden border border-white/10 shadow-lg">
                                        <iframe
                                            width="100%"
                                            height="100%"
                                            src="https://www.youtube.com/embed/OTQJmkXC2EI"
                                            title="Therapy Podcast"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Mental Health Manage Guide (Old Box Breathing) */}
                            <Card className="glass-card md:col-span-2 overflow-hidden">
                                <CardHeader>
                                    <CardTitle className="text-lg">Mental Health Manage Guide</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0 pb-4 px-4">
                                    <div className="aspect-video w-full rounded-lg overflow-hidden border border-white/10 shadow-lg">
                                        <iframe
                                            width="100%"
                                            height="100%"
                                            src="https://www.youtube.com/embed/rkZl2gsLUp4"
                                            title="Mental Health Manage Guide"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* New Box Breathing Video */}
                            <Card className="glass-card md:col-span-2 overflow-hidden">
                                <CardHeader>
                                    <CardTitle className="text-lg">Guided Video: Box Breathing</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0 pb-4 px-4">
                                    <div className="aspect-video w-full rounded-lg overflow-hidden border border-white/10 shadow-lg">
                                        <iframe
                                            width="100%"
                                            height="100%"
                                            src="https://www.youtube.com/embed/oN8xV3Kb5-Q"
                                            title="Box Breathing"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeTab === "tips" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="glass-card hover:bg-white/5 transition-colors group">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center justify-between">
                                        Pomodoro Technique
                                        <Wind className="w-4 h-4 text-primary opacity-50" />
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <p className="text-sm text-muted-foreground">
                                        **Best for:** Beating procrastination & staying fresh.
                                    </p>
                                    <ul className="text-xs space-y-1 list-disc pl-4 text-muted-foreground">
                                        <li>Pick a single task.</li>
                                        <li>Set a timer for 25 minutes (1 Pomodoro).</li>
                                        <li>Work until the timer rings.</li>
                                        <li>Take a short 5-minute break.</li>
                                        <li>After 4 cycles, take a longer 15-30 min break.</li>
                                    </ul>
                                    <a
                                        href="https://todoist.com/productivity-methods/pomodoro-technique"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-primary hover:underline flex items-center gap-1 pt-2"
                                    >
                                        Learn how to apply <BookOpen className="w-3 h-3" />
                                    </a>
                                </CardContent>
                            </Card>

                            <Card className="glass-card hover:bg-white/5 transition-colors group">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center justify-between">
                                        Feynman Method
                                        <Lightbulb className="w-4 h-4 text-yellow-500 opacity-50" />
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <p className="text-sm text-muted-foreground">
                                        **Best for:** Deep understanding & memorization.
                                    </p>
                                    <ul className="text-xs space-y-1 list-disc pl-4 text-muted-foreground">
                                        <li>Choose a concept you want to learn.</li>
                                        <li>Pretend you are teaching it to a 6th grader.</li>
                                        <li>Identify gaps in your explanation.</li>
                                        <li>Review the source material to fill gaps.</li>
                                        <li>Simplify and create analogies.</li>
                                    </ul>
                                    <a
                                        href="https://fs.blog/feynman-technique/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-primary hover:underline flex items-center gap-1 pt-2"
                                    >
                                        Read full guide <BookOpen className="w-3 h-3" />
                                    </a>
                                </CardContent>
                            </Card>

                            <Card className="glass-card hover:bg-white/5 transition-colors group md:col-span-2">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center justify-between">
                                        Spaced Repetition (SRS)
                                        <Activity className="w-4 h-4 text-green-500 opacity-50" />
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <p className="text-sm text-muted-foreground">
                                        **Best for:** Long-term memory & exams.
                                    </p>
                                    <div className="text-xs text-muted-foreground">
                                        Instead of cramming, review material at increasing intervals.
                                        <br />
                                        <span className="font-semibold text-foreground">Schedule:</span>
                                        <span className="block mt-1 pl-2 border-l-2 border-primary/20">
                                            1st Review: Immediate<br />
                                            2nd Review: After 24 hours<br />
                                            3rd Review: After 3 days<br />
                                            4th Review: After 1 week
                                        </span>
                                    </div>
                                    <a
                                        href="https://e-student.org/spaced-repetition/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-primary hover:underline flex items-center gap-1 pt-2"
                                    >
                                        Master this technique <BookOpen className="w-3 h-3" />
                                    </a>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

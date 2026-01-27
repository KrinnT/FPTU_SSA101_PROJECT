"use client";

import { useState } from "react";
import Link from "next/link";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Plus, NotebookPen, BarChart3, Activity, Download, AlertTriangle, PhoneCall, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardClientProps {
    user: any;
    initialHistory: any[];
    assessmentData: any; // null if no assessment
}

export default function DashboardClient({ user, initialHistory, assessmentData }: DashboardClientProps) {
    const [history, setHistory] = useState<any[]>(initialHistory);
    const [showCheckIn, setShowCheckIn] = useState(false);

    // New Check-in State
    const [energyLevel, setEnergyLevel] = useState(50);
    const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);

    // Emotions Data
    const emotions = [
        { id: "anxious", label: "Lo lắng", icon: "😨", val: 1 },
        { id: "tired", label: "Chán nản", icon: "😴", val: 2 },
        { id: "pressure", label: "Áp lực", icon: "😤", val: 2 },
        { id: "normal", label: "Bình thường", icon: "😐", val: 3 },
        { id: "excited", label: "Hào hứng", icon: "🤩", val: 5 },
    ];

    // Helper for Assessment Color
    const getSeverityColor = (score: number) => {
        if (score <= 10) return "text-green-500";
        if (score <= 18) return "text-yellow-500";
        return "text-rose-500";
    };

    const handleSubmitCheckIn = async () => {
        if (!selectedEmotion) return alert("Please select an emotion.");

        const emotionData = emotions.find(e => e.id === selectedEmotion);
        const moodVal = emotionData?.val || 3;

        try {
            const res = await fetch("/api/mood", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mood: moodVal,
                    energy: energyLevel,
                    emotion: selectedEmotion,
                    focus: energyLevel > 70 ? 5 : energyLevel > 40 ? 3 : 1,
                }),
            });

            if (res.ok) {
                const newLog = await res.json();

                // Format new log to match history structure
                const formattedLog = {
                    ...newLog,
                    mood: Number(newLog.mood),
                    focus: Number(newLog.focus),
                    date: new Date(newLog.createdAt).toLocaleDateString('en-US', { weekday: 'short' }),
                };

                setHistory(prev => [formattedLog, ...prev]); // Add to start or end? 
                // Original code: setHistory(prev => [...prev, newLog]);
                // But original fetch reverse()ed data: "recentData.reverse()". 
                // API returns "orderBy: { createdAt: 'desc' }".
                // So [newest, older, oldest].
                // reversed -> [oldest, older, newest].
                // So we should append newLog to end.
                setHistory(prev => [...prev, formattedLog]);

                setShowCheckIn(false);
                setEnergyLevel(50);
                setSelectedEmotion(null);
            }
        } catch (error) {
            alert("Failed to save check-in");
        }
    };

    const handleExportPDF = () => {
        alert("Generating Learning Mental Health Map (PDF)... \n[Simulation: File downloaded]");
    };

    // Risk & Suggestion Logic
    // History is [oldest ... newest]
    const latestEntry = history[history.length - 1];
    const isHighRisk = latestEntry ? (latestEntry.energy < 30 || ["anxious", "tired", "pressure"].includes(latestEntry.emotion)) : false;

    const getSuggestion = () => {
        if (!latestEntry) return "Complete your daily check-in to get personalized advice.";

        if (latestEntry.energy < 30) {
            return "⚠️ **Low Battery:** Your energy is critically low. Switch to 'Passive Learning' mode (Audiobooks) or take a 10-minute non-sleep deep rest (NSDR).";
        }
        if (latestEntry.emotion === "anxious" || latestEntry.emotion === "pressure") {
            return "🌪 **Stressed:** High pressure detected. Try the 'Box Breathing' exercise in the Toolkit before continuing.";
        }
        if (latestEntry.energy > 70 && latestEntry.emotion === "excited") {
            return "🚀 **Flow State Ready:** You are in prime condition! Tackle your hardest subject (Deep Work) right now.";
        }
        return "✅ **Balanced:** You are doing fine. Maintain your regular study schedule with 25m Pomodoro intervals.";
    };

    const hasAssessment = !!assessmentData;

    return (
        <div className="min-h-screen p-4 md:p-8 space-y-8 bg-background">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* ... Header ... */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                            Hi, <span className="bg-gradient-to-r from-sky-400 via-rose-400 to-lime-400 bg-clip-text text-transparent animate-gradient-x">{user?.name || "Friend"}</span> 👋
                        </h1>
                        <p className="text-lg text-muted-foreground font-medium">Have a wonderful day ahead!</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/focus">
                            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20">
                                <Play className="w-4 h-4" /> Focus Mode
                            </Button>
                        </Link>
                        <Button variant="outline" onClick={handleExportPDF} className="gap-2 text-primary border-primary/20 hover:bg-primary/10">
                            <Download className="w-4 h-4" /> Export Map (PDF)
                        </Button>
                        {!hasAssessment && (
                            <Link href="/assessment">
                                <Button variant="outline" className="gap-2">
                                    <NotebookPen className="w-4 h-4" /> New Assessment
                                </Button>
                            </Link>
                        )}
                        <Button onClick={() => setShowCheckIn(!showCheckIn)} className="gap-2 animate-bounce-subtle" variant="outline">
                            <Plus className="w-4 h-4" /> Check-in
                        </Button>
                    </div>
                </div>

                {/* Risk Alert Banner */}
                {isHighRisk && (
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-start gap-4 animate-pulse">
                        <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0" />
                        <div className="space-y-1">
                            <h3 className="font-bold text-rose-500">We noticed you've been feeling down lately.</h3>
                            <p className="text-sm text-rose-200">
                                Your well-being is our top priority. Consider reaching out to a counselor or using our support hotline.
                            </p>
                            <div className="pt-2 flex gap-4">
                                <Button size="sm" variant="destructive" className="gap-2">
                                    <PhoneCall className="w-4 h-4" /> Call Hotline (111)
                                </Button>
                                <Link href="/exercises">
                                    <Button size="sm" variant="outline" className="text-rose-200 border-rose-500/30 hover:bg-rose-500/20">
                                        Try Relaxation Exercises
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {!hasAssessment && (
                    <Card className="glass-card border-indigo-500/20 bg-indigo-500/5">
                        <CardHeader>
                            <CardTitle>Complete your Assessment</CardTitle>
                            <CardDescription>Take the DASS-21 assessment to generate your mental health map.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Link href="/assessment">
                                <Button className="w-full">Start Assessment</Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}

                {/* Daily Check-in Widget */}
                {showCheckIn && (
                    <Card className="glass-card border-primary/20 animate-in slide-in-from-top-4">
                        <CardHeader>
                            <CardTitle>Daily Micro-assessment (&lt; 30s)</CardTitle>
                            <CardDescription>Track your energy and emotion to improve learning efficiency.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* 1. Energy Battery */}
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm font-medium">
                                    <span>Energy Level 🔋</span>
                                    <span className={cn(
                                        energyLevel < 30 ? "text-rose-400" : energyLevel > 70 ? "text-emerald-400" : "text-yellow-400"
                                    )}>{energyLevel}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={energyLevel}
                                    onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                                    className="w-full h-2 bg-secondary/30 rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Exhausted</span>
                                    <span>Fully Charged</span>
                                </div>
                            </div>

                            {/* 2. Emotion Selection */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium block">How do you feel about studying today?</label>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {emotions.map((emo) => (
                                        <button
                                            key={emo.id}
                                            onClick={() => setSelectedEmotion(emo.id)}
                                            className={cn(
                                                "flex flex-col items-center gap-1 p-3 rounded-xl border transition-all min-w-[80px]",
                                                selectedEmotion === emo.id
                                                    ? "bg-primary/20 border-primary scale-105 shadow-lg"
                                                    : "bg-white/5 border-white/10 hover:bg-white/10"
                                            )}
                                        >
                                            <span className="text-2xl">{emo.icon}</span>
                                            <span className="text-xs font-medium">{emo.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Button onClick={handleSubmitCheckIn} className="w-full" size="lg">
                                Save Check-in
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Assessment Snapshot Card (NEW) */}
                    {assessmentData && (
                        <Card className="glass-card md:col-span-3 lg:col-span-1">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <NotebookPen className="w-5 h-5 text-indigo-400" /> Assessment Profile
                                </CardTitle>
                                <CardDescription>Latest DASS-21 Results</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Depression</span>
                                    <span className={cn("font-bold", getSeverityColor(assessmentData.scores.Depression))}>
                                        {assessmentData.scores.Depression}
                                    </span>
                                </div>
                                <Progress value={(assessmentData.scores.Depression / 42) * 100} className="h-1.5" />

                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Anxiety</span>
                                    <span className={cn("font-bold", getSeverityColor(assessmentData.scores.Anxiety))}>
                                        {assessmentData.scores.Anxiety}
                                    </span>
                                </div>
                                <Progress value={(assessmentData.scores.Anxiety / 42) * 100} className="h-1.5" />

                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Stress</span>
                                    <span className={cn("font-bold", getSeverityColor(assessmentData.scores.Stress))}>
                                        {assessmentData.scores.Stress}
                                    </span>
                                </div>
                                <Progress value={(assessmentData.scores.Stress / 42) * 100} className="h-1.5" />
                            </CardContent>
                        </Card>
                    )}

                    {/* Main Trend Chart */}
                    <Card className="glass-card md:col-span-3 lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="w-5 h-5 text-primary" />
                                Mood & Focus Trends
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            {history.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={history}>
                                        <defs>
                                            <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis domain={[0, 6]} hide />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'var(--color-card)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            itemStyle={{ color: 'var(--color-foreground)' }}
                                        />
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                        <Area
                                            type="monotone"
                                            dataKey="mood"
                                            stroke="#0ea5e9"
                                            fillOpacity={1}
                                            fill="url(#colorMood)"
                                            strokeWidth={3}
                                            name="Mood Score"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="focus"
                                            stroke="#0d9488"
                                            strokeWidth={2}
                                            strokeDasharray="5 5"
                                            dot={false}
                                            name="Focus Level"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                                    <p>No daily data yet.</p>
                                    <Button variant="outline" size="sm" onClick={() => setShowCheckIn(true)}>
                                        <Plus className="w-4 h-4 mr-2" /> Add First Check-in
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Weekly Summary */}
                    <div className="space-y-6 md:col-span-3 lg:col-span-1">
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-indigo-500" />
                                    Weekly Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Avg Mood</span>
                                    <span className="text-2xl font-bold">{(history.reduce((acc, curr) => acc + curr.mood, 0) / (history.length || 1)).toFixed(1)}</span>
                                </div>
                                <Progress value={(history.reduce((acc, curr) => acc + curr.mood, 0) / (history.length || 1) / 5) * 100} className="h-2" />

                                <div className="flex items-center justify-between mt-4">
                                    <span className="text-sm text-muted-foreground">Avg Focus</span>
                                    <span className="text-2xl font-bold">{(history.reduce((acc, curr) => acc + curr.focus, 0) / (history.length || 1)).toFixed(1)}</span>
                                </div>
                                <Progress value={(history.reduce((acc, curr) => acc + curr.focus, 0) / (history.length || 1) / 5) * 100} className="h-2 bg-secondary/20" />
                            </CardContent>
                        </Card>

                        <Card className="glass-card bg-primary/5 border-primary/10">
                            <CardHeader>
                                <CardTitle className="text-base text-primary">Suggestions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {getSuggestion()}
                                </p>
                                <Link href="/exercises" className="inline-block mt-3">
                                    <Button variant="link" className="px-0 h-auto text-primary">
                                        View Relaxing Tools
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </div>
        </div>
    );
}

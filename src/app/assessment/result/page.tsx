"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Home, AlertTriangle, CheckCircle2, Info, BarChart3 } from "lucide-react";
import { DASS_THRESHOLDS, type Category } from "@/lib/assessment-data";
import { cn } from "@/lib/utils";
import ProtectedRoute from "@/components/layout/protected-route";
import { ProfessionalHelpModal } from "@/components/features/professional-help-modal";

interface AssessmentResult {
    date: string;
    scores: Record<Category, number>;
}

export default function ResultPage() {
    return (
        <ProtectedRoute>
            <ResultContent />
        </ProtectedRoute>
    );
}

function ResultContent() {
    const [result, setResult] = useState<AssessmentResult | null>(null);

    useEffect(() => {
        async function fetchResult() {
            try {
                const res = await fetch("/api/assessment");
                if (res.ok) {
                    const data = await res.json();
                    if (data) {
                        setResult({
                            date: data.date,
                            scores: {
                                Depression: data.depressionScore,
                                Anxiety: data.anxietyScore,
                                Stress: data.stressScore
                            }
                        });
                    }
                }
            } catch (e) {
                console.error(e);
            }
        }
        fetchResult();
    }, []);

    const [showModal, setShowModal] = useState(false);

    const getSeverity = (category: Category, score: number) => {
        const t = DASS_THRESHOLDS[category];
        if (score <= t.normal) return { label: "Normal", color: "text-green-500", bg: "bg-green-500/10" };
        if (score <= t.mild) return { label: "Mild", color: "text-yellow-500", bg: "bg-yellow-500/10" };
        if (score <= t.moderate) return { label: "Moderate", color: "text-orange-500", bg: "bg-orange-500/10" };
        if (score <= t.severe) return { label: "Severe", color: "text-rose-500", bg: "bg-rose-500/10" };
        return { label: "Extremely Severe", color: "text-rose-700", bg: "bg-rose-700/10" };
    };

    useEffect(() => {
        if (result) {
            const risk = (
                getSeverity("Depression", result.scores.Depression).label === "Severe" ||
                getSeverity("Depression", result.scores.Depression).label === "Extremely Severe" ||
                getSeverity("Anxiety", result.scores.Anxiety).label === "Severe" ||
                getSeverity("Anxiety", result.scores.Anxiety).label === "Extremely Severe" ||
                result.scores.Stress > 30
            );
            if (risk) setShowModal(true);
        }
    }, [result]);

    if (!result) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse">Loading analysis...</div>
            </div>
        );
    }

    // Prepare data for chart
    const data = [
        { name: "Depression", score: result.scores.Depression, color: "#3b82f6" }, // Blue
        { name: "Anxiety", score: result.scores.Anxiety, color: "#8b5cf6" },    // Violet
        { name: "Stress", score: result.scores.Stress, color: "#f43f5e" }      // Rose
    ];

    // Helper to determine severity




    return (
        <div className="min-h-screen p-4 md:p-8 space-y-8 bg-background">
            {/* Auto-trigger modal if high risk */}
            <ProfessionalHelpModal
                open={showModal}
                onOpenChange={setShowModal}
                reason="score"
            />

            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Your Mental Health Profile</h1>
                    <p className="text-muted-foreground">Analysis based on DASS-21 Scale</p>
                </div>

                {/* Score Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(Object.keys(result.scores) as Category[]).map((category) => {
                        const score = result.scores[category];
                        const severity = getSeverity(category, score);
                        return (
                            <Card key={category} className="glass-card border-t-4" style={{ borderColor: category === 'Depression' ? '#3b82f6' : category === 'Anxiety' ? '#8b5cf6' : '#f43f5e' }}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg">{category}</CardTitle>
                                    <CardDescription>Score: {score}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", severity.bg, severity.color)}>
                                        {severity.label}
                                    </div>
                                    <p className="mt-3 text-sm text-muted-foreground">
                                        {category === 'Depression' && "Evaluation of dysphoria, hopelessness, and lack of interest."}
                                        {category === 'Anxiety' && "Assessment of autonomic arousal and situational anxiety."}
                                        {category === 'Stress' && "Measurement of chronic non-specific arousal and tension."}
                                    </p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Chart */}
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle>Score Visualization</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
                                <XAxis type="number" domain={[0, 42]} hide />
                                <YAxis dataKey="name" type="category" width={80} tick={{ fill: 'currentColor' }} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ backgroundColor: 'var(--color-card)', borderRadius: '8px', border: 'none' }}
                                />
                                <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={32}>
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Recommendations */}
                <Card className="glass-card bg-primary/5 border-primary/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Info className="w-5 h-5 text-primary" />
                            Next Steps
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            This assessment is a screening tool, not a diagnosis. If your scores are in the Severe or Extremely Severe range, consider reaching out to a mental health professional.
                        </p>

                        {/* Reference Table */}
                        <div className="mt-4 p-4 bg-background/50 rounded-lg border text-xs text-muted-foreground">
                            <p className="font-semibold mb-2">Severity Scale Reference (DASS-21 Raw Scores)</p>
                            <div className="grid grid-cols-4 gap-2 text-center">
                                <div></div>
                                <div>Depression</div>
                                <div>Anxiety</div>
                                <div>Stress</div>

                                <div className="text-left font-medium">Normal</div>
                                <div>0-4</div>
                                <div>0-3</div>
                                <div>0-7</div>

                                <div className="text-left font-medium">Mild</div>
                                <div>5-6</div>
                                <div>4-5</div>
                                <div>8-9</div>

                                <div className="text-left font-medium">Moderate</div>
                                <div>7-10</div>
                                <div>6-7</div>
                                <div>10-12</div>

                                <div className="text-left font-medium">Severe</div>
                                <div>11-13</div>
                                <div>8-9</div>
                                <div>13-16</div>

                                <div className="text-left font-medium">Extremely Severe</div>
                                <div>14+</div>
                                <div>10+</div>
                                <div>17+</div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-2">
                            <Link href="/exercises">
                                <Button className="gap-2">
                                    Go to Exercises <ArrowRight className="w-4 h-4" />
                                </Button>
                            </Link>
                            <Link href="/dashboard">
                                <Button variant="secondary" className="gap-2">
                                    <BarChart3 className="w-4 h-4" /> Dashboard
                                </Button>
                            </Link>
                            <Link href="/">
                                <Button variant="outline" className="gap-2">
                                    <Home className="w-4 h-4" /> Home
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}

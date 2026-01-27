"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { questions, type Category } from "@/lib/assessment-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";

export default function AssessmentPage() {
    const router = useRouter();
    const [shuffledQuestions, setShuffledQuestions] = useState(questions);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [hasStarted, setHasStarted] = useState(false);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Randomize questions on mount to ensure variety
        setShuffledQuestions([...questions].sort(() => Math.random() - 0.5));
    }, []);

    const currentQuestion = shuffledQuestions[currentIndex];

    // Prevent crash if questions are missing or index is out of bounds
    if (!currentQuestion) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    const progress = ((currentIndex) / shuffledQuestions.length) * 100;

    const handleAnswer = (value: number) => {
        setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
        if (currentIndex < shuffledQuestions.length - 1) {
            setTimeout(() => setCurrentIndex((prev) => prev + 1), 250);
        }
    };

    const handleNext = () => {
        if (currentIndex < shuffledQuestions.length - 1) {
            setCurrentIndex((prev) => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1);
        }
    };

    const calculateResults = () => {
        const scores: Record<Category, number> = {
            Depression: 0,
            Anxiety: 0,
            Stress: 0,
        };

        // We can iterate over the original 'questions' or 'shuffledQuestions', result is the same
        questions.forEach((q) => {
            const value = answers[q.id] || 0; // Default to 0
            scores[q.category] += value;
        });

        // Note: We are now using raw DASS-21 scores and thresholds directly
        // instead of multiplying by 2 to match DASS-42.
        // This provides more accurate mapping to the DASS-21 specific norms.

        return scores;
    };

    const finishAssessment = async () => {
        setIsSubmitting(true);
        const results = calculateResults();

        try {
            const res = await fetch("/api/assessment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ scores: results }),
            });

            if (res.ok) {
                router.push("/assessment/result");
            } else {
                alert("Failed to save results. User may not be logged in.");
                setIsSubmitting(false);
            }
        } catch (e) {
            setIsSubmitting(false);
        }
    };

    if (!hasStarted) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-background">
                <Card className="max-w-md w-full glass-card text-center p-6 space-y-6 animate-in fade-in zoom-in duration-500">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold">Mental Health Check</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-muted-foreground">
                            This DASS-21 assessment will help you understand your current emotional state regarding Depression, Anxiety, and Stress.
                        </p>
                        <div className="bg-secondary/50 p-4 rounded-lg text-sm text-left space-y-2">
                            <p>📝 <strong>Questions:</strong> 21 items</p>
                            <p>⏳ <strong>Time:</strong> ~2-3 minutes</p>
                            <p>🔒 <strong>Privacy:</strong> Results are private</p>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button size="lg" className="w-full text-lg h-12 rounded-full shadow-lg hover:shadow-primary/20 transition-all" onClick={() => setHasStarted(true)}>
                            Start Assessment
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <div className="w-full max-w-2xl space-y-8">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium text-muted-foreground">
                        <span>Question {currentIndex + 1} of {shuffledQuestions.length}</span>
                        <span>{Math.round(progress)}% Completed</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Card className="glass-card min-h-[400px] flex flex-col justify-between">
                            <CardHeader>
                                <CardTitle className="text-xl md:text-2xl leading-relaxed text-center pt-8">
                                    {currentQuestion.text}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {[0, 1, 2, 3].map((val) => (
                                        <Button
                                            key={val}
                                            variant="outline"
                                            className={cn(
                                                "h-auto py-4 px-4 text-left justify-start gap-3 hover:border-primary/50 hover:bg-primary/5 transition-all whitespace-normal",
                                                answers[currentQuestion.id] === val
                                                    ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                                                    : "opacity-80 hover:opacity-100"
                                            )}
                                            onClick={() => handleAnswer(val)}
                                        >
                                            <div className={cn(
                                                "w-6 h-6 rounded-full border flex items-center justify-center shrink-0",
                                                answers[currentQuestion.id] === val ? "border-primary bg-primary text-white" : "border-muted-foreground"
                                            )}>
                                                {answers[currentQuestion.id] === val && <div className="w-2 h-2 bg-white rounded-full" />}
                                            </div>
                                            <span className="text-sm md:text-base font-medium">
                                                {val === 0 ? "Did not apply to me at all" :
                                                    val === 1 ? "Applied to me to some degree, or some of the time" :
                                                        val === 2 ? "Applied to me to a considerable degree or a good part of time" :
                                                            "Applied to me very much or most of the time"}
                                            </span>
                                        </Button>
                                    ))}
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button
                                    variant="ghost"
                                    onClick={handlePrev}
                                    disabled={currentIndex === 0}
                                >
                                    <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                                </Button>

                                {currentIndex === shuffledQuestions.length - 1 ? (
                                    <Button
                                        onClick={finishAssessment}
                                        disabled={answers[currentQuestion.id] === undefined || isSubmitting}
                                        className="bg-primary text-white"
                                    >
                                        {isSubmitting ? "Analyzing..." : "Finish Assessment"}
                                        {!isSubmitting && <CheckCircle2 className="w-4 h-4 ml-2" />}
                                    </Button>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        onClick={handleNext}
                                        disabled={answers[currentQuestion.id] === undefined}
                                    >
                                        Next <ChevronRight className="w-4 h-4 ml-2" />
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Settings, Heart, Coffee, BookOpen } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const MESSAGES = [
    { text: "Bạn không cần hoàn hảo để tiến bộ.", type: "motivation", icon: <Heart className="w-5 h-5 text-rose-400" /> },
    { text: "Uống một ngụm nước nhé! 💧", type: "health", icon: <Coffee className="w-5 h-5 text-blue-400" /> },
    { text: "Đã ngồi lâu rồi, đứng dậy vươn vai nào! 🧘", type: "health", icon: <Coffee className="w-5 h-5 text-green-400" /> },
    { text: "Nếu thấy mệt, hãy chợp mắt 15 phút.", type: "health", icon: <Clock className="w-5 h-5 text-indigo-400" /> },
    { text: "Học từng chút một, đừng áp lực quá.", type: "study", icon: <BookOpen className="w-5 h-5 text-amber-400" /> },
    { text: "Tin vào bản thân mình. Bạn làm được mà!", type: "motivation", icon: <Heart className="w-5 h-5 text-rose-400" /> },
    { text: "Hít thở sâu... 1... 2... 3... Thở ra.", type: "health", icon: <WindIcon /> },
];

function WindIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-400"><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" /><path d="M9.6 4.6A2 2 0 1 1 11 8H2" /><path d="M12.6 19.4A2 2 0 1 0 14 16H2" /></svg>
    )
}

export function NudgeSystem() {
    const [isVisible, setIsVisible] = useState(false);
    const [message, setMessage] = useState(MESSAGES[0]);
    const [frequency, setFrequency] = useState(30); // minutes
    const [showSettings, setShowSettings] = useState(false);
    const [nextTime, setNextTime] = useState(Date.now() + 5000); // Start 5s after load for demo

    useEffect(() => {
        // Check every 5 seconds if it's time to nudge
        const interval = setInterval(() => {
            if (Date.now() >= nextTime && !isVisible) {
                triggerNudge();
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [nextTime, isVisible]);

    const triggerNudge = () => {
        const randomMsg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
        setMessage(randomMsg);
        setIsVisible(true);
        // Special sound effect could go here
    };

    const dismiss = () => {
        setIsVisible(false);
        // Schedule next one based on frequency
        setNextTime(Date.now() + frequency * 60 * 1000);
    };

    const updateFrequency = (mins: number) => {
        setFrequency(mins);
        setNextTime(Date.now() + mins * 60 * 1000); // Reset timer
        setShowSettings(false);
        alert(`Đã cập nhật: Nhắc nhở mỗi ${mins} phút.`);
    };

    return (
        <>
            {/* Main Nudge Toast */}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="fixed bottom-6 right-6 z-50 max-w-sm w-full"
                    >
                        <div className="glass-card p-4 rounded-2xl shadow-2xl border-l-4 border-l-primary flex items-start gap-4 relative overflow-hidden backdrop-blur-xl bg-background/80">
                            {/* Icon Blob */}
                            <div className="p-3 bg-secondary/10 rounded-full shrink-0">
                                {message.icon}
                            </div>

                            <div className="flex-1 space-y-1">
                                <h4 className="font-semibold text-sm text-primary uppercase tracking-wider">
                                    Positive Reminder
                                </h4>
                                <p className="text-foreground/90 leading-relaxed">
                                    {message.text}
                                </p>
                            </div>

                            <div className="flex flex-col gap-1 items-center justify-start h-full -mr-1">
                                <button
                                    onClick={dismiss}
                                    className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <X className="w-4 h-4 text-muted-foreground" />
                                </button>
                                <button
                                    onClick={() => setShowSettings(!showSettings)}
                                    className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors mt-auto"
                                    title="Settings"
                                >
                                    <Settings className="w-3 h-3 text-muted-foreground" />
                                </button>
                            </div>

                            {/* Settings Popover inside Toast */}
                            {showSettings && (
                                <div className="absolute inset-0 bg-background/95 backdrop-blur-md flex flex-col items-center justify-center p-4 gap-2 z-10 animate-in fade-in">
                                    <p className="text-xs font-semibold text-muted-foreground mb-1">Tần suất nhắc nhở:</p>
                                    <div className="flex gap-2">
                                        {[15, 30, 45, 60].map(m => (
                                            <button
                                                key={m}
                                                onClick={() => updateFrequency(m)}
                                                className={`px-3 py-1 rounded-full text-xs border ${frequency === m ? 'bg-primary text-white border-primary' : 'bg-transparent border-input hover:bg-accent'}`}
                                            >
                                                {m}p
                                            </button>
                                        ))}
                                    </div>
                                    <button onClick={() => setShowSettings(false)} className="text-xs text-muted-foreground mt-2 hover:underline">
                                        Đóng
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

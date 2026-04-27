"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Settings, Heart, Coffee, BookOpen } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { usePathname } from "next/navigation";

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
    const { user } = useAuth();
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(false);
    const [message, setMessage] = useState(MESSAGES[0]);
    const [frequency, setFrequency] = useState(15); // Default 15 minutes per user request
    const [showSettings, setShowSettings] = useState(false);
    const [nextTime, setNextTime] = useState(0);
    const [isClient, setIsClient] = useState(false);

    const triggerNudge = useCallback(() => {
        const randomMsg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
        setMessage(randomMsg);
        setIsVisible(true);
    }, []);

    const dismiss = useCallback(() => {
        setIsVisible(false);
        const now = Date.now();
        setNextTime(now + frequency * 60 * 1000);
    }, [frequency]);

    const updateFrequency = useCallback((mins: number) => {
        setFrequency(mins);
        const now = Date.now();
        setNextTime(now + mins * 60 * 1000); // Reset timer
        setShowSettings(false);
        alert(`Đã cập nhật: Nhắc nhở mỗi ${mins} phút.`);
    }, []);

    useEffect(() => {
        setIsClient(true);
        const now = Date.now();
        setNextTime(now + frequency * 60 * 1000); // Initialize timer after hydration
    }, [frequency]);

    useEffect(() => {
        const isAuthPage = ['/login', '/register', '/verify'].includes(pathname || '');
        if (!user || isAuthPage || !isClient || nextTime === 0) {
            setIsVisible(false);
            return;
        }

        // Check every 5 seconds if it's time to nudge
        const interval = setInterval(() => {
            const now = Date.now();
            if (now >= nextTime && !isVisible) {
                triggerNudge();
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [nextTime, isVisible, user, pathname, isClient, triggerNudge]);

    return (
        <>
            {/* Main Nudge Toast */}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="fixed bottom-[100px] md:bottom-6 left-4 right-4 md:left-auto md:right-6 z-50 md:w-96 max-w-[calc(100vw-32px)]"
                    >
                        <div className="glass-card p-3 md:p-4 rounded-2xl shadow-2xl border-l-4 border-l-primary flex items-start gap-3 md:gap-4 relative overflow-hidden backdrop-blur-xl bg-background/80">
                            {/* Icon Blob */}
                            <div className="p-2 md:p-3 bg-secondary/10 rounded-full shrink-0 flex items-center justify-center">
                                <div className="scale-75 md:scale-100 flex">{message.icon}</div>
                            </div>

                            <div className="flex-1 space-y-0.5 md:space-y-1">
                                <h4 className="font-semibold text-xs md:text-sm text-primary uppercase tracking-wider">
                                    Positive Reminder
                                </h4>
                                <p className="text-foreground/90 leading-relaxed text-xs md:text-sm">
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

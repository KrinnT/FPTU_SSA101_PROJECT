"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, HeartHandshake, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ProfessionalHelpModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reason?: "score" | "chat" | "manual"; // Why was this triggered?
}

export function ProfessionalHelpModal({ open, onOpenChange, reason }: ProfessionalHelpModalProps) {
    // Prevent scrolling when modal is open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => { document.body.style.overflow = "unset"; };
    }, [open]);

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => onOpenChange(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity"
                    />

                    {/* Modal Content */}
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-background/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-white/10 border-l-4 border-l-rose-500 relative">
                                <button
                                    onClick={() => onOpenChange(false)}
                                    className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/10 transition-colors"
                                >
                                    <X className="w-5 h-5 text-muted-foreground" />
                                </button>

                                <div className="flex items-center gap-2 text-rose-500 mb-2">
                                    <HeartHandshake className="w-6 h-6" />
                                    <span className="font-semibold uppercase tracking-wider text-xs">Support Recommendation</span>
                                </div>
                                <h2 className="text-xl font-bold">
                                    {reason === "manual" ? "We are here for you." : "We noticed you might be going through a tough time."}
                                </h2>
                                <p className="pt-2 text-foreground/80 leading-relaxed text-sm">
                                    {reason === "score" && "Your assessment results suggest you are experiencing high levels of distress."}
                                    {reason === "chat" && "Your recent messages indicate you might need more support than an AI can provide."}
                                    {reason === "manual" && "It takes courage to ask for help."}
                                    <br />
                                    Mental health is just as important as physical health. Connecting with a professional can provide you with the personalized care you deserve.
                                </p>
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-4 overflow-y-auto">
                                {/* Hotlines */}
                                <div className="bg-rose-500/10 p-4 rounded-lg border border-rose-500/20">
                                    <h4 className="font-semibold text-rose-500 flex items-center gap-2 mb-2 text-sm">
                                        <Phone className="w-4 h-4" /> Emergency Hotlines (Vietnam)
                                    </h4>
                                    <ul className="space-y-4 text-sm">
                                        <li className="flex flex-col gap-1">
                                            <span className="font-semibold text-rose-600">Tổng đài Quốc gia Bảo vệ Trẻ em:</span>
                                            <a href="tel:111" className="font-mono font-bold text-lg hover:underline flex items-center gap-2">
                                                <Phone className="w-4 h-4" /> 111
                                            </a>
                                        </li>
                                        <li className="flex flex-col gap-1">
                                            <span className="font-semibold text-rose-600">Đường dây nóng Ngày Mai:</span>
                                            <a href="tel:0963061414" className="font-mono font-bold text-lg hover:underline flex items-center gap-2">
                                                <Phone className="w-4 h-4" /> 096 306 1414
                                            </a>
                                            <span className="text-xs text-muted-foreground">(Hỗ trợ người trẻ trầm cảm)</span>
                                        </li>
                                        <li className="flex flex-col gap-1">
                                            <span className="font-semibold text-rose-600">HOPE – Đường dây nóng phòng chống tự tử:</span>
                                            <div className="flex flex-col gap-1">
                                                <a href="tel:0865044400" className="font-mono font-bold text-lg hover:underline flex items-center gap-2">
                                                    <Phone className="w-4 h-4" /> 0865 044 400
                                                </a>
                                                <div className="text-xs text-muted-foreground">
                                                    Cung cấp hỗ trợ tinh thần và can thiệp khủng hoảng bí mật.
                                                </div>
                                            </div>
                                        </li>
                                    </ul>
                                </div>

                                {/* Clinics */}
                                <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
                                    <h4 className="font-semibold text-blue-500 flex items-center gap-2 mb-2 text-sm">
                                        <MapPin className="w-4 h-4" /> Recommended Centers
                                    </h4>
                                    <ul className="space-y-1 text-sm list-disc pl-4 text-muted-foreground">
                                        <li><strong>TP.HCM:</strong> Bệnh viện Tâm thần TP.HCM</li>
                                        <li><strong>Hà Nội:</strong> Bệnh viện Tâm thần Hà Nội</li>
                                        <li><strong>TP. Đà Nẵng:</strong> Bệnh viện Tâm thần Đà Nẵng</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end">
                                <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                                    I understand, thank you
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}

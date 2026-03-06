"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Phone } from "lucide-react";
import { ProfessionalHelpModal } from "@/components/features/professional-help-modal";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function CrisisFloatingButton() {
    const [open, setOpen] = useState(false);
    const { user } = useAuth();
    const pathname = usePathname();

    const isAuthPage = ['/login', '/register', '/verify'].includes(pathname || '');
    if (!user || isAuthPage) return null;

    return (
        <>
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1 }}
                className="fixed bottom-24 md:bottom-6 left-4 md:left-6 z-50 pointer-events-auto"
            >
                <Button
                    variant="destructive"
                    size="icon"
                    className="h-10 w-10 md:h-14 md:w-14 rounded-full shadow-2xl border-2 md:border-4 border-white/20 animate-pulse hover:animate-none"
                    onClick={() => setOpen(true)}
                    title="Emergency Support / Crisis Help"
                >
                    <ShieldAlert className="w-5 h-5 md:w-8 md:h-8" />
                </Button>
            </motion.div>

            <ProfessionalHelpModal
                open={open}
                onOpenChange={setOpen}
                reason="manual"
            />
        </>
    );
}

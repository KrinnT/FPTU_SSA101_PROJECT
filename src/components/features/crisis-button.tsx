"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Phone } from "lucide-react";
import { ProfessionalHelpModal } from "@/components/features/professional-help-modal";
import { motion } from "framer-motion";

export function CrisisFloatingButton() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1 }}
                className="fixed bottom-6 left-6 z-50"
            >
                <Button
                    variant="destructive"
                    size="icon"
                    className="h-14 w-14 rounded-full shadow-2xl border-4 border-white/20 animate-pulse hover:animate-none"
                    onClick={() => setOpen(true)}
                    title="Emergency Support / Crisis Help"
                >
                    <ShieldAlert className="w-8 h-8" />
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

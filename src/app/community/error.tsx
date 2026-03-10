"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Community Page Crash:", error);
    }, [error]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
            <div className="bg-destructive/10 p-6 rounded-2xl max-w-md w-full border border-destructive/20 space-y-4">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
                <h2 className="text-xl font-bold text-destructive">Community Service Offline</h2>
                <div className="text-sm text-muted-foreground bg-black/5 p-3 rounded-md text-left overflow-auto max-h-32">
                    <p className="font-mono text-xs">{error.message}</p>
                    {error.digest && <p className="font-mono text-xs mt-1 text-primary">Digest: {error.digest}</p>}
                </div>
                <p className="text-sm">We are unable to connect to the database. This happens when the Vercel Preview Environment lacks the correct DATABASE_URL variable.</p>
                <Button onClick={() => reset()} variant="outline" className="w-full">
                    Try Again
                </Button>
            </div>
        </div>
    );
}

import { Suspense } from "react";
import { Sparkles } from "lucide-react";
import { FlashcardListServer } from "@/components/features/flashcards/flashcard-list-server";
import { FlashcardSkeleton } from "@/components/features/flashcards/flashcard-skeleton";

export const dynamic = "force-dynamic";

export default function FlashcardsPage() {
    return (
        <div className="container max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col gap-2 relative">
                <div className="absolute -top-10 -left-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-pulse" />

                <h1 className="text-4xl md:text-5xl font-bold tracking-tight z-10">
                    Flashcards
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl z-10 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Create, manage, and study your own vocabulary or concept decks.
                </p>
            </div>

            {/* Streaming Section */}
            <Suspense fallback={<FlashcardSkeleton />}>
                <FlashcardListServer />
            </Suspense>
        </div>
    );
}

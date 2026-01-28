import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { FlashcardSystem } from "@/components/features/flashcard-system";
import { Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function FlashcardsPage() {
    // 1. Server-side Auth Check
    const session = await getSession();
    if (!session || !session.user) {
        redirect("/login");
    }

    // 2. Fetch Data Server-side
    const rawDecks = await prisma.flashcardDeck.findMany({
        where: { userId: session.user.id },
        include: { cards: true },
        orderBy: { createdAt: 'desc' }
    });

    const decks = rawDecks.map(deck => ({
        ...deck,
        description: deck.description || undefined // Handle null -> undefined
    }));

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

            {/* Main System */}
            <FlashcardSystem initialDecks={decks} />
        </div>
    );
}

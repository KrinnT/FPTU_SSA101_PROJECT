import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { FlashcardSystem } from "@/components/features/flashcard-system";
import { redirect } from "next/navigation";

export async function FlashcardListServer() {
    const session = await getSession();
    if (!session || !session.user) {
        redirect("/login");
    }

    // Artificial delay to demonstrate streaming (optional, remove in prod)
    // await new Promise(resolve => setTimeout(resolve, 1000));

    const rawDecks = await prisma.flashcardDeck.findMany({
        where: { userId: session.user.id },
        include: { cards: true },
        orderBy: { createdAt: 'desc' }
    });

    const decks = rawDecks.map(deck => ({
        ...deck,
        description: deck.description || undefined
    }));

    return <FlashcardSystem initialDecks={decks} />;
}

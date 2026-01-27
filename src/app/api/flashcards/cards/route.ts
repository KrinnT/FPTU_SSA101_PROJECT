
import { NextResponse } from 'next/server';
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// POST: Add card to a deck
export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { deckId, front, back } = await req.json();

        if (!deckId || !front || !back) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // Verify deck ownership
        const deck = await prisma.flashcardDeck.findUnique({
            where: { id: deckId }
        });

        if (!deck || deck.userId !== session.user.id) {
            return NextResponse.json({ error: "Deck not found" }, { status: 404 });
        }

        const card = await prisma.flashcard.create({
            data: {
                deckId,
                front,
                back
            }
        });

        return NextResponse.json(card);

    } catch (error) {
        console.error("Create Card Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

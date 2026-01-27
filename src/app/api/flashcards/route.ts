
import { NextResponse } from 'next/server';
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// GET: Fetch all decks for user
export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decks = await prisma.flashcardDeck.findMany({
            where: { userId: session.user.id },
            include: { cards: true },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(decks);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: Create a new deck
export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { title, description, color } = await req.json();

        if (!title || !color) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const deck = await prisma.flashcardDeck.create({
            data: {
                userId: session.user.id,
                title,
                description,
                color
            },
            include: { cards: true }
        });

        return NextResponse.json(deck);

    } catch (error) {
        console.error("Create Deck Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

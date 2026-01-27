import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET: Fetch Mood History
export async function GET() {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const logs = await prisma.moodLog.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 7
    });

    return NextResponse.json(logs);
}

// POST: Save Mood Check-in
export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        const log = await prisma.moodLog.create({
            data: {
                userId: session.user.id,
                mood: body.mood,
                energy: body.energy,
                emotion: body.emotion,
                focus: body.focus,
                note: body.note || ""
            }
        });

        return NextResponse.json(log);
    } catch (error) {
        console.error("POST /api/mood error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

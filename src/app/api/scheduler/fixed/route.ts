
import { NextResponse } from 'next/server';
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// POST: Create Fixed Event
export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, day, startTime, endTime } = await req.json();

        const event = await prisma.fixedEvent.create({
            data: {
                userId: session.user.id,
                name, day, startTime, endTime
            }
        });

        return NextResponse.json(event);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

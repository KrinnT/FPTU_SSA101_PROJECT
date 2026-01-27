
import { NextResponse } from 'next/server';
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// POST: Create Task
export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, duration, scheduledDay, scheduledStartTime } = await req.json();

        const task = await prisma.task.create({
            data: {
                userId: session.user.id,
                name,
                duration,
                scheduledDay,
                scheduledStartTime
            }
        });

        return NextResponse.json(task);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

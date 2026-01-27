
import { NextResponse } from 'next/server';
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// PUT: Batch update tasks (for schedule generation)
export async function PUT(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { updates } = await req.json(); // Array of { id, assignedSlot: { day, startTime } }

        if (!Array.isArray(updates)) {
            return NextResponse.json({ error: "Invalid format" }, { status: 400 });
        }

        // Perform updates in transaction or parallel
        // Prisma transaction is safer
        await prisma.$transaction(
            updates.map((u: any) =>
                prisma.task.update({
                    where: { id: u.id, userId: session.user.id },
                    data: {
                        scheduledDay: u.assignedSlot?.day || null,
                        scheduledStartTime: u.assignedSlot?.startTime || null
                    }
                })
            )
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Batch update error", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

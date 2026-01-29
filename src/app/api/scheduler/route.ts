
import { NextResponse } from 'next/server';
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// GET: Fetch all scheduler data (FixedEvents + Tasks)
export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const [fixedEvents, tasks] = await Promise.all([
            prisma.fixedEvent.findMany({ where: { userId: session.user.id } }),
            prisma.task.findMany({ where: { userId: session.user.id } })
        ]);

        return NextResponse.json({ fixedEvents, tasks });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE: Clear all scheduler data for user (Reset)
export async function DELETE(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await prisma.$transaction([
            prisma.task.deleteMany({ where: { userId: session.user.id } }),
            prisma.fixedEvent.deleteMany({ where: { userId: session.user.id } })
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

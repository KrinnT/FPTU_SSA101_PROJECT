import { NextResponse } from 'next/server';
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// POST: Create Multiple Tasks
export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { tasks } = await req.json();

        if (!Array.isArray(tasks) || tasks.length === 0) {
            return NextResponse.json({ error: "Invalid tasks payload" }, { status: 400 });
        }

        const userId = session.user.id;
        const groupId = tasks[0]?.groupId; // Assuming they all share the same groupId if they are an everyday task

        // Insert all tasks in a single query
        await prisma.task.createMany({
            data: tasks.map(t => ({
                userId,
                name: t.name,
                duration: t.duration,
                scheduledDay: t.scheduledDay,
                scheduledStartTime: t.scheduledStartTime,
                groupId: t.groupId
            }))
        });

        // Since createMany doesn't return the inserted records (only the count),
        // we'll fetch them back using the groupId to get their generated IDs
        let createdTasks = [];
        if (groupId) {
            createdTasks = await prisma.task.findMany({
                where: { userId, groupId }
            });
        } else {
            // Fallback if no groupId was provided (though for Everyday tasks there always should be)
            createdTasks = await prisma.task.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: tasks.length
            });
        }

        return NextResponse.json(createdTasks);
    } catch (error) {
        console.error("Batch create tasks error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

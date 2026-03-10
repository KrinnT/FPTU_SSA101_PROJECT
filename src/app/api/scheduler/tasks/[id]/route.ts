export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const resolvedParams = await params;
        const taskId = resolvedParams.id;

        // Find the task first to check if it has a groupId
        const task = await prisma.task.findUnique({
            where: { id: taskId, userId: session.user.id }
        });

        if (!task) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        // If it has a groupId, delete all tasks with that groupId
        if (task.groupId) {
            await prisma.task.deleteMany({
                where: {
                    userId: session.user.id,
                    groupId: task.groupId
                }
            });
        } else {
            // Otherwise just delete the single task
            await prisma.task.delete({
                where: { id: taskId, userId: session.user.id }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete task error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// PATCH: Update single task (used for drag and drop)
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const resolvedParams = await params;
        const taskId = resolvedParams.id;
        const { scheduledDay, scheduledStartTime } = await req.json();

        const updatedTask = await prisma.task.update({
            where: { id: taskId, userId: session.user.id },
            data: { scheduledDay, scheduledStartTime }
        });

        return NextResponse.json(updatedTask);
    } catch (error) {
        console.error("Update task error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

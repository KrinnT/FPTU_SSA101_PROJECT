
import { NextResponse } from 'next/server';
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// POST: Like post
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Simplified interaction: Just increment likes
        // In a real app we'd track WHO liked it to prevent duplicates
        // But schema request was simple "likes Int".

        const post = await prisma.post.update({
            where: { id },
            data: { likes: { increment: 1 } }
        });

        return NextResponse.json({ likes: post.likes });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

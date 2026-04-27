export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { revalidateTag, revalidatePath } from 'next/cache';

// POST: Add reply
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const { content } = await req.json();

        const comment = await prisma.comment.create({
            data: {
                postId: id,
                authorId: session.user.id,
                content
            },
            include: { author: { select: { name: true } } }
        });

        // @ts-expect-error TypeScript doesn't know about stream body typing fully
        revalidateTag('community-posts');
        revalidatePath('/community');

        return NextResponse.json(comment);
    } catch (error) {
        console.error("Comment error", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

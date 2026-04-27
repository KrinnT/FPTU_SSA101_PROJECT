export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { revalidateTag, revalidatePath } from 'next/cache';

// POST: Like post
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const userId = session.user.id;

        const existingLike = await prisma.postLike.findUnique({
            where: {
                userId_postId: {
                    userId,
                    postId: id
                }
            }
        });

        if (existingLike) {
            // Unlike
            await prisma.postLike.delete({ where: { id: existingLike.id } });
        } else {
            // Like
            await prisma.postLike.create({
                data: { userId, postId: id }
            });
        }

        // Count exact likes to avoid race conditions
        const likesCount = await prisma.postLike.count({ where: { postId: id } });
        await prisma.post.update({
            where: { id },
            data: { likes: likesCount }
        });

        // @ts-expect-error revalidateTag
        revalidateTag('community-posts');
        revalidatePath('/community');

        return NextResponse.json({ likes: likesCount, liked: !existingLike });
    } catch (error) {
        console.error("Like error", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

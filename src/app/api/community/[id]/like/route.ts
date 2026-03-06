
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
            const post = await prisma.post.update({
                where: { id },
                data: { likes: { decrement: 1 } }
            });
            return NextResponse.json({ likes: post.likes, liked: false });
        } else {
            // Like
            await prisma.postLike.create({
                data: { userId, postId: id }
            });
            const post = await prisma.post.update({
                where: { id },
                data: { likes: { increment: 1 } }
            });
            return NextResponse.json({ likes: post.likes, liked: true });
        }
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { unstable_cache, revalidateTag } from 'next/cache';

const getCachedPosts = unstable_cache(
    async (category?: string) => {
        const whereClause = (category && category !== "ALL") ? { category: category as any } : {};
        return await prisma.post.findMany({
            where: whereClause,
            include: {
                author: {
                    select: { name: true, email: true }
                },
                comments: {
                    include: {
                        author: { select: { name: true } }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    },
    ['community-posts'], // Key parts
    { tags: ['community-posts'], revalidate: 60 } // Revalidate every 60s or on demand
);

// GET: Fetch posts (optional category filter)
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const category = searchParams.get("category") || undefined;

        const posts = await getCachedPosts(category);

        return NextResponse.json(posts);
    } catch (error) {
        console.error("GET Community Error", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: Create new post
export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { content, category } = await req.json();

        if (!content) return NextResponse.json({ error: "Content missing" }, { status: 400 });

        const post = await prisma.post.create({
            data: {
                authorId: session.user.id,
                content,
                category: category || "OTHER"
            },
            include: { author: { select: { name: true } } }
        });

        return NextResponse.json(post);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    } finally {
        revalidateTag('community-posts');
    }
}

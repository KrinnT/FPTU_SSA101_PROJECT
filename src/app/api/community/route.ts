import { NextResponse } from 'next/server';
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { unstable_cache, revalidateTag } from 'next/cache';

const getCachedPosts = unstable_cache(
    async (category?: string, page: number = 1, limit: number = 10) => {
        const whereClause = (category && category !== "ALL") ? { category: category as any } : {};
        return await prisma.post.findMany({
            where: whereClause,
            take: limit,
            skip: (page - 1) * limit,
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
    ['community-posts'],
    { tags: ['community-posts'], revalidate: 60 }
);

// GET: Fetch posts (optional category filter)
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const category = searchParams.get("category") || undefined;
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");

        // If filtering by page > 1, we might want to skip cache or create granular keys
        // For simplicity with unstable_cache, we'll append to key in a real world scenario
        // But unstable_cache only allows string keys. 
        // We will SKIP cache for pages > 1 for now to ensure load-more works dynamically
        // Or we better fetch directly from DB for load more to avoid complex cache keys

        if (page > 1) {
            const whereClause = (category && category !== "ALL") ? { category: category as any } : {};
            const posts = await prisma.post.findMany({
                where: whereClause,
                take: limit,
                skip: (page - 1) * limit,
                include: {
                    author: { select: { name: true, email: true } },
                    comments: {
                        include: { author: { select: { name: true } } },
                        orderBy: { createdAt: 'asc' }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
            return NextResponse.json(posts);
        }

        const posts = await getCachedPosts(category, page, limit);

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


import { NextResponse } from 'next/server';
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// GET: Fetch posts (optional category filter)
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const category = searchParams.get("category");

        const whereClause = (category && category !== "ALL") ? { category: category as any } : {};

        const posts = await prisma.post.findMany({
            where: whereClause,
            include: {
                author: {
                    select: { name: true, email: true } // Don't expose sensitive info
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

        // Map to simpler structure if needed, or send as is
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
    }
}

import { prisma } from "@/lib/prisma";
import { CommunityFeed } from "@/components/features/community/community-feed";

export async function CommunityPosts() {
    // Artificial delay to demonstrate streaming (optional, remove in prod if not needed, but good for testing)
    // await new Promise(resolve => setTimeout(resolve, 1000));

    const initialPosts = await prisma.post.findMany({
        take: 10,
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

    // Serialize dates for Client Component
    const serializedPosts = initialPosts.map(post => ({
        ...post,
        createdAt: post.createdAt.toISOString(),
        author: {
            ...post.author,
            name: post.author.name || "Anonymous"
        },
        comments: post.comments.map(c => ({
            ...c,
            createdAt: c.createdAt.toISOString(),
            author: {
                ...c.author,
                name: c.author.name || "Anonymous"
            }
        }))
    }));

    return <CommunityFeed initialPosts={serializedPosts} />;
}

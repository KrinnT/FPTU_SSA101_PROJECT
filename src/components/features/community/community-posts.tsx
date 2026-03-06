import { prisma } from "@/lib/prisma";
import { CommunityFeed } from "@/components/features/community/community-feed";
import { getSession } from "@/lib/session";

export async function CommunityPosts() {
    const session = await getSession();
    const userId = session?.user?.id;

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
            },
            ...(userId ? { postLikes: { where: { userId } } } : {})
        },
        orderBy: { createdAt: 'desc' }
    });

    // Serialize dates for Client Component
    const serializedPosts = initialPosts.map((post: any) => ({
        ...post,
        likedByUser: !!(post.postLikes && post.postLikes.length > 0),
        createdAt: post.createdAt.toISOString(),
        author: {
            ...post.author,
            name: post.author.name || "Anonymous"
        },
        comments: post.comments.map((c: any) => ({
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

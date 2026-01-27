
import { prisma } from "@/lib/prisma";
import ProtectedRoute from "@/components/layout/protected-route";
import { CommunityFeed } from "@/components/features/community/community-feed";

export const dynamic = "force-dynamic"; // Ensures data is always fresh

export default async function ForumPage() {
    // Server-side fetching
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

    // Serialize dates for Client Component (Next.js requirement: passing objects between Server/Client)
    // Serialize dates for Client Component (Next.js requirement: passing objects between Server/Client)
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

    return (
        <ProtectedRoute>
            <div className="min-h-screen p-4 md:p-8 bg-background flex justify-center">
                <CommunityFeed initialPosts={serializedPosts} />
            </div>
        </ProtectedRoute>
    );
}

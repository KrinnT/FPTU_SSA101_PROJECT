import { Suspense } from "react";
import ProtectedRoute from "@/components/layout/protected-route";
import Loading from "./loading";
import { CommunityPosts } from "@/components/features/community/community-posts";

export const dynamic = "force-dynamic"; // Ensures data is always fresh

export default function ForumPage() {
    return (
        <ProtectedRoute>
            <div className="min-h-screen p-4 md:p-8 bg-background flex flex-col items-center w-full max-w-full overflow-x-hidden">
                <div className="w-full max-w-4xl">
                    <Suspense fallback={<Loading />}>
                        <CommunityPosts />
                    </Suspense>
                </div>
            </div>
        </ProtectedRoute>
    );
}

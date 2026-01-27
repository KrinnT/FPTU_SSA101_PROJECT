import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
    return (
        <div className="min-h-screen p-4 md:p-8 bg-background flex justify-center">
            <div className="max-w-4xl w-full space-y-6">
                {/* Header Skeleton */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <Skeleton className="h-10 w-48 rounded-lg" />
                    <div className="flex gap-2 w-full md:w-auto overflow-hidden">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-8 w-24 rounded-full" />
                        ))}
                    </div>
                </div>

                {/* Create Post Skeleton */}
                <Card className="border-primary/20">
                    <CardContent className="space-y-4 pt-6">
                        <Skeleton className="h-24 w-full rounded-xl" />
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-9 w-32 rounded-lg" />
                            <Skeleton className="h-9 w-32 rounded-lg" />
                        </div>
                    </CardContent>
                </Card>

                {/* Posts List Skeleton */}
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="border-border/50">
                            <CardContent className="pt-6 space-y-3">
                                <div className="flex justify-between items-start">
                                    <Skeleton className="h-5 w-20 rounded" />
                                    <Skeleton className="h-4 w-24 rounded" />
                                </div>
                                <Skeleton className="h-16 w-full rounded-md" />
                                <div className="flex gap-4 pt-2">
                                    <Skeleton className="h-8 w-16 rounded-md" />
                                    <Skeleton className="h-8 w-16 rounded-md" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}

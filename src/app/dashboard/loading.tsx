import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
    return (
        <div className="min-h-screen p-4 md:p-8 space-y-8 bg-background">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header Skeleton */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-12 w-64 rounded-lg" />
                        <Skeleton className="h-6 w-48 rounded" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-24 rounded-md" />
                        <Skeleton className="h-10 w-24 rounded-md" />
                        <Skeleton className="h-10 w-24 rounded-md" />
                    </div>
                </div>

                {/* Dashboard Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Assessment Card Skeleton */}
                    <Card className="md:col-span-3 lg:col-span-1">
                        <CardHeader>
                            <Skeleton className="h-6 w-40 rounded" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="space-y-1">
                                    <div className="flex justify-between">
                                        <Skeleton className="h-4 w-20 rounded" />
                                        <Skeleton className="h-4 w-10 rounded" />
                                    </div>
                                    <Skeleton className="h-2 w-full rounded-full" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Chart Skeleton */}
                    <Card className="md:col-span-3 lg:col-span-2">
                        <CardHeader>
                            <Skeleton className="h-6 w-48 rounded" />
                        </CardHeader>
                        <CardContent className="h-[300px] flex items-end justify-between gap-1 pb-4 px-4">
                            {[...Array(10)].map((_, i) => (
                                <Skeleton key={i} className="w-full rounded-t-md" style={{ height: `${Math.random() * 80 + 20}%` }} />
                            ))}
                        </CardContent>
                    </Card>

                    {/* Summary Skeleton */}
                    <Card className="md:col-span-3 lg:col-span-1">
                        <CardHeader>
                            <Skeleton className="h-6 w-32 rounded" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-4 w-full rounded" />
                            <Skeleton className="h-2 w-full rounded" />
                            <Skeleton className="h-4 w-full rounded mt-4" />
                            <Skeleton className="h-2 w-full rounded" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

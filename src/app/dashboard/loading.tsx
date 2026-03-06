import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <p className="text-muted-foreground animate-pulse">Loading...</p>
        </div>
    );
}

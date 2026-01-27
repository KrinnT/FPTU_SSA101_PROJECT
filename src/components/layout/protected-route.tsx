"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push("/login"); // Redirect to login if not authenticated
        }
    }, [isAuthenticated, loading, router]);

    // If loading, show nothing or spinner. 
    // If not authenticated, we return null until the redirect happens.
    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>; // Or a proper spinner component
    }

    if (!isAuthenticated) {
        return null;
    }

    return <>{children}</>;
}

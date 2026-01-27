"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
    id: string;
    name: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    login: (identifier: string, password: string) => Promise<boolean>;
    register: (name: string, email: string, phone: string, password: string) => Promise<{ success: boolean; error?: string; requireVerification?: boolean }>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check session from API
        const checkSession = async () => {
            try {
                const res = await fetch("/api/auth/me");
                const data = await res.json();
                if (data.user) {
                    setUser(data.user);
                }
            } catch (err) {
                console.error("Session check failed", err);
            } finally {
                setLoading(false);
            }
        };
        checkSession();
    }, []);

    const login = async (identifier: string, password: string): Promise<boolean> => {
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ identifier, password }),
            });

            if (!res.ok) return false;

            const data = await res.json();
            setUser(data.user);
            router.push("/dashboard");
            return true;
        } catch (e) {
            return false;
        }
    };

    const register = async (name: string, email: string, phone: string, password: string): Promise<{ success: boolean; error?: string; requireVerification?: boolean }> => {
        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, phone, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                return { success: false, error: data.error || "Registration failed" };
            }

            if (data.requireVerification) {
                return { success: true, requireVerification: true };
            }

            if (data.user) {
                setUser(data.user);
                router.push("/dashboard");
            }
            return { success: true };
        } catch (e) {
            return { success: false, error: "Network error" };
        }
    };

    const logout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            setUser(null);
            router.push("/login");
        } catch (e) {
            console.error("Logout failed", e);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

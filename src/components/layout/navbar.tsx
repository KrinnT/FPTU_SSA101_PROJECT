"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, MessageCircle, HeartPulse, Users, Brain, Home, LogIn, LogOut, Clock, Play, Gamepad2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function Navbar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    // Debug: Log version to help user verify deployment
    useEffect(() => {
        console.log("%c VERSION: V5-EXTREME-SPEED-OPTIMIZED ", "background: #000; color: #00ff00; font-size: 20px; font-weight: bold; border: 2px solid #00ff00; padding: 10px;");
        console.log("If you see this, the NEW code is running.");
    }, []);

    const psychItems = [
        { name: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
        { name: "Assessment", href: "/assessment", icon: <Brain className="w-4 h-4" /> },
        { name: "Chat", href: "/chat", icon: <MessageCircle className="w-4 h-4" /> },
        { name: "Relax", href: "/exercises", icon: <HeartPulse className="w-4 h-4" /> },
        { name: "Games", href: "/games", icon: <Gamepad2 className="w-4 h-4" /> },
    ];

    const studyItems = [
        { name: "Focus", href: "/focus", icon: <Play className="w-4 h-4" /> },
        { name: "Flashcards", href: "/flashcards", icon: <Brain className="w-4 h-4" /> },
        { name: "Schedule", href: "/scheduler", icon: <Clock className="w-4 h-4" /> },
    ];

    const commItems = [
        { name: "Home", href: "/", icon: <Home className="w-4 h-4" /> },
        { name: "Community", href: "/community", icon: <Users className="w-4 h-4" /> },
    ];

    if (pathname === "/" || pathname === "/login" || pathname === "/register") return null;

    const NavLink = ({ item }: { item: any }) => (
        <Link
            href={item.href}
            className={cn(
                "flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-3 py-2 rounded-full text-[10px] md:text-sm font-medium transition-all whitespace-nowrap shrink-0",
                pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/")
                    ? "bg-primary text-primary-foreground shadow-lg scale-105"
                    : "text-muted-foreground hover:bg-secondary/10 hover:text-foreground"
            )}
        >
            {item.icon}
            <span className="hidden md:inline">{item.name}</span>
            <span className="md:hidden text-[9px]">{item.name}</span>
        </Link>
    );

    return (
        <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[95%] md:w-auto z-50">
            <div className="flex items-center justify-between md:justify-center p-2 bg-white/80 dark:bg-black/80 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-full shadow-2xl gap-1 md:gap-1 overflow-x-auto no-scrollbar whitespace-nowrap">

                {/* Group 1: Psych */}
                {psychItems.map((item) => <NavLink key={item.href} item={item} />)}

                {/* Divider */}
                <div className="h-5 w-px bg-gray-400 dark:bg-white/40 mx-2 self-center" />

                {/* Group 2: Study */}
                {studyItems.map((item) => <NavLink key={item.href} item={item} />)}

                {/* Divider */}
                <div className="h-5 w-px bg-gray-400 dark:bg-white/40 mx-2 self-center" />

                {/* Group 3: Community & Auth */}
                {commItems.map((item) => <NavLink key={item.href} item={item} />)}

                {user ? (
                    <button
                        onClick={async () => {
                            // Force clear local storage to prevent data leakage between users
                            localStorage.removeItem("chat_history");
                            localStorage.removeItem("psych-flashcards");
                            localStorage.removeItem("scheduler_fixed");
                            localStorage.removeItem("scheduler_tasks");
                            // Clear community and exercises local storage
                            localStorage.removeItem("forumPosts_clean");
                            localStorage.removeItem("cbtJournal");
                            await logout();
                        }}
                        className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-3 py-2 rounded-full text-[10px] md:text-sm font-medium text-rose-500 hover:bg-rose-500/10 transition-all shrink-0"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden md:inline">Logout</span>
                    </button> // Removed mobile text for logout to save space, icon is clear enough? or keep standard. Keeping standard for consistency but let's hide text on mobile if needed. Actually let's keep it consistent.
                ) : (
                    <Link
                        href="/login"
                        className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-3 py-2 rounded-full text-[10px] md:text-sm font-medium text-primary hover:bg-primary/10 transition-all shrink-0"
                    >
                        <LogIn className="w-4 h-4" />
                        <span className="hidden md:inline">Login</span>
                    </Link>
                )}
            </div>
        </nav>
    );
}

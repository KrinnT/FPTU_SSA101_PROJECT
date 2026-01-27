"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { MessageSquare, Heart, AlertCircle, Reply, BookOpen, Brain, FileText, Globe, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ProtectedRoute from "@/components/layout/protected-route";
import { useAuth } from "@/lib/auth-context";

// Category Definitions
const CATEGORIES = [
    { id: "ALL", label: "All Posts", icon: <Globe className="w-4 h-4" /> },
    { id: "ACADEMIC", label: "Learning Exchange", icon: <BookOpen className="w-4 h-4" /> },     // Trao đổi học tập
    { id: "PSYCHOLOGY", label: "Psychology Support", icon: <Brain className="w-4 h-4" /> },     // Tâm lý
    { id: "RESOURCES", label: "Documents & Exams", icon: <FileText className="w-4 h-4" /> }     // Tài liệu - đề thi
];

interface Comment {
    id: string;
    content: string;
    author: { name: string; };
    createdAt: string;
}

interface Post {
    id: string;
    content: string;
    category: string;
    likes: number;
    createdAt: string;
    authorId: string;
    author: { name: string; };
    comments: Comment[];
}

const BAD_WORDS = ["kill", "die", "stupid", "hate", "ugly", "chết", "ngu", "giết", "fuck", "bitch", "shit", "ass", "cunt", "damn", "whore", "đụ", "cặc", "lồn"];

export default function ForumPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [newPost, setNewPost] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("ALL");
    const [postCategory, setPostCategory] = useState("ACADEMIC"); // Default for new posts
    const [error, setError] = useState("");
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState("");

    const { user } = useAuth();

    // Load from DB
    useEffect(() => {
        fetchPosts();
    }, [selectedCategory]);

    const fetchPosts = async () => {
        try {
            const url = selectedCategory === "ALL" ? "/api/community" : `/api/community?category=${selectedCategory}`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setPosts(data);
            }
        } catch (e) { console.error(e); }
    };

    const handlePost = async () => {
        if (!newPost.trim()) return;

        // Moderation
        if (BAD_WORDS.some(word => newPost.toLowerCase().includes(word))) {
            setError("Your post contains content that violates our community guidelines.");
            return;
        }

        try {
            const res = await fetch("/api/community", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newPost, category: postCategory })
            });

            if (res.ok) {
                setNewPost("");
                setError("");
                fetchPosts(); // Refresh
            }
        } catch (e) { setError("Failed to post."); }
    };

    const handleReply = async (postId: string) => {
        if (!replyContent.trim()) return;

        if (BAD_WORDS.some(word => replyContent.toLowerCase().includes(word))) {
            alert("Please be kind.");
            return;
        }

        try {
            const res = await fetch(`/api/community/${postId}/reply`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: replyContent })
            });

            if (res.ok) {
                setReplyContent("");
                setReplyingTo(null);
                fetchPosts(); // Refresh to show comment
            }
        } catch (e) { alert("Failed to reply"); }
    };

    const handleLike = async (id: string) => {
        try {
            await fetch(`/api/community/${id}/like`, { method: "POST" });
            // Optimistic update
            setPosts(posts.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p));
        } catch (e) { }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this post?")) return;
        try {
            const res = await fetch(`/api/community/${id}`, { method: "DELETE" });
            if (res.ok) {
                setPosts(posts.filter(p => p.id !== id));
            } else {
                alert("Failed to delete post");
            }
        } catch (e) { alert("Error deleting post"); }
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen p-4 md:p-8 bg-background flex justify-center">
                <div className="w-full max-w-3xl space-y-6">
                    <div className="space-y-2 text-center md:text-left">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">Community Board</h1>
                        <p className="text-muted-foreground">Connect, learn, and share resources.</p>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                                    selectedCategory === cat.id
                                        ? "bg-primary text-primary-foreground shadow-lg"
                                        : "bg-secondary/50 hover:bg-secondary text-muted-foreground"
                                )}
                            >
                                {cat.icon} {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Create Post */}
                    <Card className="glass-card border-t-4 border-t-primary">
                        <CardContent className="pt-6 space-y-4">
                            <textarea
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-4 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground resize-none"
                                placeholder="Share your thoughts, ask a question, or upload advice..."
                                value={newPost}
                                onChange={(e) => {
                                    setNewPost(e.target.value);
                                    if (error) setError("");
                                }}
                            />

                            <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
                                {/* Category Selector for New Post */}
                                <div className="flex gap-2">
                                    <span className="text-xs font-medium text-muted-foreground self-center">Topic:</span>
                                    <select
                                        value={postCategory}
                                        onChange={(e) => setPostCategory(e.target.value)}
                                        className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm focus:ring-primary focus:outline-none"
                                    >
                                        <option value="ACADEMIC">Learning Exchange</option>
                                        <option value="PSYCHOLOGY">Psychology Support</option>
                                        <option value="RESOURCES">Documents & Exams</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>

                                <Button onClick={handlePost} disabled={!newPost.trim()} className="w-full md:w-auto">
                                    Post to Community
                                </Button>
                            </div>

                            {error && (
                                <div className="text-sm text-rose-500 flex items-center gap-2 animate-pulse">
                                    <AlertCircle className="w-4 h-4" /> {error}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Feed */}
                    <div className="space-y-4">
                        {posts.length === 0 && (
                            <div className="text-center py-10 text-muted-foreground">
                                No posts in this category yet. Be the first!
                            </div>
                        )}
                        {posts.map((post) => (
                            <Card key={post.id} className="glass-card hover:bg-white/5 transition-colors">
                                <CardContent className="pt-6 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <span className={cn(
                                            "text-[10px] font-bold px-2 py-1 rounded bg-secondary uppercase tracking-wider",
                                            post.category === "ACADEMIC" && "text-blue-400 bg-blue-500/10",
                                            post.category === "PSYCHOLOGY" && "text-rose-400 bg-rose-500/10",
                                            post.category === "RESOURCES" && "text-emerald-400 bg-emerald-500/10"
                                        )}>
                                            {CATEGORIES.find(c => c.id === post.category)?.label || post.category}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleDateString()}</span>
                                            {user?.id === post.authorId && (
                                                <button
                                                    onClick={() => handleDelete(post.id)}
                                                    className="text-muted-foreground hover:text-rose-500 transition-colors"
                                                    title="Delete Post"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-base leading-relaxed whitespace-pre-wrap">{post.content}</p>
                                    <p className="text-xs text-muted-foreground/50">Posted by {post.author.name || "Anonymous"}</p>
                                </CardContent>
                                <CardFooter className="flex flex-col gap-2 border-t border-white/5 py-3">
                                    <div className="flex justify-between w-full text-sm text-muted-foreground">
                                        <div className="flex gap-4">
                                            <button onClick={() => handleLike(post.id)} className="flex items-center gap-1 hover:text-rose-500 transition-colors">
                                                <Heart className={cn("w-4 h-4", post.likes > 0 && "fill-rose-500 text-rose-500")} /> {post.likes}
                                            </button>
                                            <button onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)} className="flex items-center gap-1 hover:text-primary transition-colors">
                                                <MessageSquare className="w-4 h-4" /> {post.comments?.length || 0} Replies
                                            </button>
                                        </div>
                                    </div>

                                    {/* Replies Section */}
                                    {post.comments && post.comments.length > 0 && (
                                        <div className="w-full mt-2 space-y-2 pl-4 border-l-2 border-white/10">
                                            {post.comments.map(reply => (
                                                <div key={reply.id} className="bg-black/20 p-2 rounded text-sm space-y-1">
                                                    <div className="flex justify-between text-[10px] text-muted-foreground">
                                                        <span>{reply.author.name}</span>
                                                        <span>{new Date(reply.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <p>{reply.content}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Reply Input */}
                                    {replyingTo === post.id && (
                                        <div className="w-full flex gap-2 mt-2 animate-in slide-in-from-top-2">
                                            <input
                                                className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm focus:ring-primary focus:outline-none"
                                                placeholder="Write a supportive reply..."
                                                value={replyContent}
                                                onChange={(e) => setReplyContent(e.target.value)}
                                                onKeyDown={(e) => e.key === "Enter" && handleReply(post.id)}
                                            />
                                            <Button size="sm" onClick={() => handleReply(post.id)}>
                                                <Reply className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}

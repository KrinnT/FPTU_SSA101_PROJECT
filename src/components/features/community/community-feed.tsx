"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { PostItem } from "@/components/features/community/post-item";
import { useAuth } from "@/lib/auth-context";

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

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    author: { name: string; };
}

const CATEGORIES = [
    { id: "ALL", label: "All Topics" },
    { id: "ACADEMIC", label: "Academic Stress" },
    { id: "PSYCHOLOGY", label: "Psychology Q&A" },
    { id: "RESOURCES", label: "Study Resources" },
    { id: "OTHER", label: "General Support" }
];

const BAD_WORDS = ["kill", "die", "stupid", "hate", "ugly", "chết", "ngu", "giết", "fuck", "bitch", "shit", "ass", "cunt", "damn", "whore", "đụ", "cặc", "lồn"];

export function CommunityFeed({ initialPosts }: { initialPosts: Post[] }) {
    const { user } = useAuth();
    const [posts, setPosts] = useState<Post[]>(initialPosts);
    const [newPost, setNewPost] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("ALL");
    const [postCategory, setPostCategory] = useState("ACADEMIC");
    const [error, setError] = useState("");
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState("");

    const handlePost = async () => {
        if (!newPost.trim()) return;
        if (BAD_WORDS.some(word => newPost.toLowerCase().includes(word))) {
            setError("Please keep the community fast and supportive. Negative words detected.");
            return;
        }

        try {
            const res = await fetch("/api/community", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newPost, category: postCategory }),
            });

            if (res.ok) {
                const post = await res.json();
                setPosts([post, ...posts]);
                setNewPost("");
                setError("");
            } else {
                setError("Failed to post. Please try again.");
            }
        } catch (e) {
            setError("Network error.");
        }
    };

    const handleLike = async (id: string) => {
        try {
            await fetch(`/api/community/${id}/like`, { method: "POST" });
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

    const handleReply = async (postId: string) => {
        if (!replyContent.trim()) return;
        try {
            const res = await fetch(`/api/community/${postId}/comment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: replyContent }),
            });

            if (res.ok) {
                const newComment = await res.json();
                setPosts(posts.map(p => {
                    if (p.id === postId) {
                        return { ...p, comments: [...(p.comments || []), newComment] };
                    }
                    return p;
                }));
                setReplyContent("");
                setReplyingTo(null);
            }
        } catch (e) { }
    };

    const filteredPosts = selectedCategory === "ALL"
        ? posts
        : posts.filter(p => p.category === selectedCategory);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500">
                    Community Board
                </h1>
                <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-4 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap ${selectedCategory === cat.id
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                                    : "bg-secondary/50 hover:bg-secondary text-muted-foreground"
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            <Card className="glass-card border-primary/20">
                <CardContent className="space-y-4 pt-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Create a supportive post</label>
                        <textarea
                            className="w-full h-24 bg-black/20 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none resize-none"
                            placeholder="Share your thoughts, ask for advice, or vent safely..."
                            value={newPost}
                            onChange={(e) => setNewPost(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col md:flex-row justify-between gap-4">
                        <select
                            className="bg-secondary/50 rounded-lg px-3 py-2 text-sm focus:outline-none"
                            value={postCategory}
                            onChange={(e) => setPostCategory(e.target.value)}
                        >
                            {CATEGORIES.filter(c => c.id !== 'ALL').map(c => (
                                <option key={c.id} value={c.id}>{c.label}</option>
                            ))}
                        </select>
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

            <div className="space-y-4">
                {filteredPosts.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground">
                        No posts in this category yet. Be the first!
                    </div>
                )}
                {filteredPosts.map((post) => (
                    <PostItem
                        key={post.id}
                        post={post}
                        currentUserId={user?.id}
                        onLike={handleLike}
                        onDelete={handleDelete}
                        onReply={(id) => setReplyingTo(replyingTo === id ? null : id)}
                        isReplying={replyingTo === post.id}
                        replyContent={replyContent}
                        setReplyContent={setReplyContent}
                        onSubmitReply={handleReply}
                        categories={CATEGORIES}
                    />
                ))}
            </div>
        </div>
    );
}

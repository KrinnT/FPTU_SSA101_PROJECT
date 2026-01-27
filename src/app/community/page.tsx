"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Heart, Share2, AlertCircle, Reply } from "lucide-react";
import { cn } from "@/lib/utils";

interface Post {
    id: string;
    content: string;
    likes: number;
    timestamp: string;
    color: string;
    replies?: Post[];
}

const BAD_WORDS = ["kill", "die", "stupid", "hate", "ugly", "chết", "ngu", "giết", "fuck", "bitch", "shit", "ass", "cunt", "damn", "whore", "đụ", "cặc", "lồn"]; // Expanded list per user request

export default function ForumPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [newPost, setNewPost] = useState("");
    const [error, setError] = useState("");
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState("");

    useEffect(() => {
        const stored = localStorage.getItem("forumPosts_clean");
        if (stored) {
            setPosts(JSON.parse(stored));
        } else {
            // Seed initial data - Start fresh or empty? User said "delete history", so maybe empty seed?
            // Let's keep one friendly welcome post.
            const seed: Post[] = [
                { id: "1", content: "Welcome to the new community feed! Remember to be kind.", likes: 0, timestamp: new Date().toISOString(), color: "bg-primary/10", replies: [] }
            ];
            setPosts(seed);
            localStorage.setItem("forumPosts_clean", JSON.stringify(seed));
        }
    }, []);

    const handlePost = () => {
        if (!newPost.trim()) return;

        // Moderation
        const hasBadWords = BAD_WORDS.some(word => newPost.toLowerCase().includes(word));
        if (hasBadWords) {
            setError("Your post contains content that violates our community guidelines. Please be kind.");
            return;
        }

        const post: Post = {
            id: Date.now().toString(),
            content: newPost,
            likes: 0,
            timestamp: new Date().toISOString(),
            color: `bg-${["blue", "purple", "indigo", "teal"][Math.floor(Math.random() * 4)]}-500/10`,
            replies: []
        };

        const updatedPosts = [post, ...posts];
        setPosts(updatedPosts);
        localStorage.setItem("forumPosts_clean", JSON.stringify(updatedPosts));
        setNewPost("");
        setError("");
    };

    const handleReply = (postId: string) => {
        if (!replyContent.trim()) return;

        const hasBadWords = BAD_WORDS.some(word => replyContent.toLowerCase().includes(word));
        if (hasBadWords) {
            alert("Please be kind.");
            return;
        }

        const updatedPosts = posts.map(p => {
            if (p.id === postId) {
                return {
                    ...p,
                    replies: [...(p.replies || []), {
                        id: Date.now().toString(),
                        content: replyContent,
                        likes: 0,
                        timestamp: new Date().toISOString(),
                        color: "bg-white/5"
                    }]
                };
            }
            return p;
        });

        setPosts(updatedPosts);
        localStorage.setItem("forumPosts_clean", JSON.stringify(updatedPosts));
        setReplyingTo(null);
        setReplyContent("");
    };

    const handleLike = (id: string) => {
        const updatedPosts = posts.map(p => {
            if (p.id === id) return { ...p, likes: p.likes + 1 };
            return p;
        });
        setPosts(updatedPosts);
        localStorage.setItem("forumPosts_clean", JSON.stringify(updatedPosts));
    };

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="min-h-screen p-4 md:p-8 bg-background flex justify-center">
            <div className="w-full max-w-2xl space-y-6">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold">Community Board</h1>
                    <p className="text-muted-foreground">Share your feelings anonymously. You are not alone.</p>
                </div>

                {/* Create Post */}
                <Card className="glass-card">
                    <CardContent className="pt-6 space-y-4">
                        <textarea
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-4 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground"
                            placeholder="What's on your mind?"
                            value={newPost}
                            onChange={(e) => {
                                setNewPost(e.target.value);
                                if (error) setError("");
                            }}
                        />
                        {error && (
                            <div className="text-sm text-rose-500 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" /> {error}
                            </div>
                        )}
                        <div className="flex justify-end">
                            <Button onClick={handlePost} disabled={!newPost.trim()}>
                                Post Anonymously
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Feed */}
                <div className="space-y-4">
                    {posts.map((post) => (
                        <Card key={post.id} className={cn("glass-card border-l-4 border-l-primary", post.color)}>
                            <CardContent className="pt-6 pb-2">
                                <p className="text-lg leading-relaxed">{post.content}</p>
                            </CardContent>
                            <CardFooter className="flex flex-col gap-2 border-t border-white/5 py-3">
                                <div className="flex justify-between w-full text-sm text-muted-foreground">
                                    <span>{formatDate(post.timestamp)}</span>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => handleLike(post.id)}
                                            className="flex items-center gap-1 hover:text-rose-500 transition-colors"
                                        >
                                            <Heart className="w-4 h-4" /> {post.likes}
                                        </button>
                                        <button
                                            onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)}
                                            className="flex items-center gap-1 hover:text-primary transition-colors"
                                        >
                                            <MessageSquare className="w-4 h-4" /> Reply
                                        </button>
                                    </div>
                                </div>

                                {/* Replies Section */}
                                {post.replies && post.replies.length > 0 && (
                                    <div className="w-full mt-2 pl-4 border-l-2 border-white/10 space-y-2">
                                        {post.replies.map(reply => (
                                            <div key={reply.id} className="bg-white/5 p-2 rounded text-sm">
                                                {reply.content}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Reply Input */}
                                {replyingTo === post.id && (
                                    <div className="w-full flex gap-2 mt-2 animate-in slide-in-from-top-2">
                                        <input
                                            className="flex-1 bg-white/5 border border-white/10 rounded px-2 text-sm"
                                            placeholder="Write a reply..."
                                            value={replyContent}
                                            onChange={(e) => setReplyContent(e.target.value)}
                                        />
                                        <Button size="sm" onClick={() => handleReply(post.id)}>
                                            <Reply className="w-3 h-3" />
                                        </Button>
                                    </div>
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}


import { memo, useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { MessageSquare, Heart, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PostItemProps {
    post: any;
    currentUserId?: string;
    onLike: (id: string) => void;
    onDelete: (id: string) => void;
    onReply: (id: string) => void;
    isReplying: boolean;
    replyContent: string;
    setReplyContent: (val: string) => void;
    onSubmitReply: (id: string) => void;
    categories: { id: string; label: string }[];
}

export const PostItem = memo(({
    post,
    currentUserId,
    onLike,
    onDelete,
    onReply,
    isReplying,
    replyContent,
    setReplyContent,
    onSubmitReply,
    categories
}: PostItemProps) => {
    return (
        <Card className="glass-card hover:bg-white/5 transition-colors">
            <CardContent className="pt-6 space-y-3">
                <div className="flex justify-between items-start">
                    <span className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded bg-secondary uppercase tracking-wider",
                        post.category === "ACADEMIC" && "text-blue-400 bg-blue-500/10",
                        post.category === "PSYCHOLOGY" && "text-rose-400 bg-rose-500/10",
                        post.category === "RESOURCES" && "text-emerald-400 bg-emerald-500/10"
                    )}>
                        {categories.find(c => c.id === post.category)?.label || post.category}
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleDateString()}</span>
                        {currentUserId === post.authorId && (
                            <button
                                onClick={() => onDelete(post.id)}
                                className="text-muted-foreground hover:text-rose-500 transition-colors"
                                title="Delete Post"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
                <p className="text-base leading-relaxed whitespace-pre-wrap">{post.content}</p>
                <p className="text-xs text-muted-foreground/50">Posted by Anonymous</p>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 border-t border-white/5 py-3">
                <div className="flex justify-between w-full text-sm text-muted-foreground">
                    <div className="flex gap-4">
                        <button onClick={() => onLike(post.id)} className="flex items-center gap-1 hover:text-rose-500 transition-colors">
                            <Heart className={cn("w-4 h-4", post.likes > 0 && "fill-rose-500 text-rose-500")} /> {post.likes}
                        </button>
                        <button onClick={() => onReply(post.id)} className="flex items-center gap-1 hover:text-primary transition-colors">
                            <MessageSquare className="w-4 h-4" /> {post.comments?.length || 0} Replies
                        </button>
                    </div>
                </div>

                {/* Replies Section */}
                {post.comments && post.comments.length > 0 && (
                    <div className="w-full mt-2 space-y-2 pl-4 border-l-2 border-white/10">
                        {post.comments.map((reply: any) => (
                            <div key={reply.id} className="bg-black/20 p-2 rounded text-sm space-y-1">
                                <div className="flex justify-between text-[10px] text-muted-foreground">
                                    <span>Anonymous</span>
                                    <span>{new Date(reply.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p>{reply.content}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Reply Input */}
                {isReplying && (
                    <div className="w-full flex gap-2 mt-2 animate-in slide-in-from-top-2">
                        <input
                            className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm focus:ring-primary focus:outline-none"
                            placeholder="Write a supportive reply..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && onSubmitReply(post.id)}
                        />
                        <Button size="sm" onClick={() => onSubmitReply(post.id)}>Reply</Button>
                    </div>
                )}
            </CardFooter>
        </Card>
    );
});

PostItem.displayName = "PostItem";

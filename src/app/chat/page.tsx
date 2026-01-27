"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Send, User, PhoneCall, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import ProtectedRoute from "@/components/layout/protected-route";
import { ProfessionalHelpModal } from "@/components/features/professional-help-modal";

// --- SMART LOGIC ENGINE ---

interface Message {
    id: string;
    role: "user" | "bot";
    text: string;
    timestamp: Date;
    type?: "normal" | "risk";
}

type Sentiment = "risk" | "academic_stress" | "general_stress" | "sadness" | "anxiety" | "distracted" | "positive" | "greeting" | "neutral" | "question";

interface ChatState {
    currentTopic: Sentiment | null;
    interactionCount: number;
    lastSentiment: Sentiment | null;
}

const INITIAL_STATE: ChatState = {
    currentTopic: null,
    interactionCount: 0,
    lastSentiment: null
};

// Keyword Dictionary with weighting
const KEYWORDS: Record<string, Sentiment> = {
    // Risk
    "kill": "risk", "suicide": "risk", "die": "risk", "dead": "risk", "hurt myself": "risk", "end it": "risk",

    // Academic
    "exam": "academic_stress", "test": "academic_stress", "study": "academic_stress",
    "grade": "academic_stress", "fail": "academic_stress", "school": "academic_stress",
    "homework": "academic_stress", "deadline": "academic_stress", "assignment": "academic_stress",

    // Anxiety
    "anxious": "anxiety", "worried": "anxiety", "scared": "anxiety", "panic": "anxiety", "nervous": "anxiety", "dread": "anxiety",

    // Sadness
    "sad": "sadness", "cry": "sadness", "lonely": "sadness", "hopeless": "sadness", "depressed": "sadness", "empty": "sadness",

    // General Stress
    "stress": "general_stress", "tired": "general_stress", "exhausted": "general_stress", "overwhelmed": "general_stress", "burnout": "general_stress",

    // Distracted
    "focus": "distracted", "concentrate": "distracted", "procrastinate": "distracted", "lazy": "distracted", "distracted": "distracted",

    // Positive
    "happy": "positive", "good": "positive", "great": "positive", "excited": "positive", "better": "positive", "proud": "positive",

    // Greeting
    "hello": "greeting", "hi": "greeting", "hey": "greeting",

    // Questions
    "?": "question", "what": "question", "how": "question", "help": "question"
};

const analyzeInput = (text: string, currentState: ChatState): Sentiment => {
    const lower = text.toLowerCase();

    // 1. Immediate Risk Check (High Priority)
    if (lower.match(/die|kill|suicide|chết|tự tử|không muốn sống|muốn chết|end my life/)) return "risk";

    // 2. Score based on keywords
    const scores: Record<string, number> = {};

    Object.entries(KEYWORDS).forEach(([word, category]) => {
        if (lower.includes(word)) {
            scores[category] = (scores[category] || 0) + 1;
        }
    });

    // 3. Determine winner
    let bestMatch: Sentiment = "neutral";
    let maxScore = 0;

    Object.entries(scores).forEach(([cat, score]) => {
        if (score > maxScore) {
            maxScore = score;
            bestMatch = cat as Sentiment;
        }
    });

    // 4. Context fallback
    // If no strong keywords found, but we are deep in a topic, assume continuation
    if (maxScore === 0 && currentState.currentTopic && currentState.currentTopic !== "greeting" && currentState.currentTopic !== "neutral") {
        // Simple heuristic: if user says "yes/no/maybe" or short sentences, keep topic
        if (lower.length < 50 || lower.match(/yes|no|yeah|nah/)) {
            return currentState.currentTopic;
        }
    }

    // Default to neutral if nothing matches
    return bestMatch;
};

const getResponse = (sentiment: Sentiment, state: ChatState): { text: string, newState: ChatState, type: "normal" | "risk" } => {
    const nextState = { ...state, lastSentiment: sentiment, interactionCount: state.interactionCount + 1 };

    // Risk Override
    if (sentiment === "risk") {
        return {
            text: "I am very concerned about what you just shared. You are important. Please call a helpline immediately using the button above or dial 111/115.",
            newState: nextState,
            type: "risk"
        };
    }

    // New Topic Detection
    const isNewTopic = sentiment !== state.currentTopic;
    if (isNewTopic && sentiment !== "neutral" && sentiment !== "question") {
        nextState.currentTopic = sentiment;
        nextState.interactionCount = 1; // Reset count for new topic
    }

    // --- RESPONSE LOGIC ---

    // 1. Greeting
    if (sentiment === "greeting") {
        return {
            text: "Hello! I'm here to support you. How are you feeling right now? (e.g., stressed, anxious, or just need to chat)",
            newState: nextState,
            type: "normal"
        };
    }

    // 2. Topic-based flows
    if (nextState.currentTopic) {
        const topic = nextState.currentTopic;
        const count = nextState.interactionCount;

        // Flow: 1. Acknowledge -> 2. Explore -> 3. Advice -> 4. Wrap up
        if (topic === "academic_stress") {
            if (count === 1) return { text: "It sounds like school is weighing heavily on you. Is it a specific exam or just everything piling up?", newState: nextState, type: "normal" };
            if (count === 2) return { text: "That is a really heavy load to carry. How have you been sleeping and eating while dealing with this?", newState: nextState, type: "normal" };
            if (count === 3) return { text: "One thing that helps is breaking it down. What is ONE tiny thing you can finish in the next 15 minutes?", newState: nextState, type: "normal" };
            return { text: "Remember, your grades don't define your worth. I'm here if you need to vent more.", newState: nextState, type: "normal" };
        }

        if (topic === "anxiety") {
            if (count === 1) return { text: "I hear that you're feeling anxious. That's a really uncomfortable feeling. Can you tell me where you feel it in your body?", newState: nextState, type: "normal" };
            if (count === 2) return { text: "It's scary when our body reacts like that. You are safe. Try to take a slow breath with me. In for 4... Out for 4...", newState: nextState, type: "normal" };
            return { text: "Would you like to try the 'Grounding' exercise in our Exercises tab? It can really help stop the spiral.", newState: nextState, type: "normal" };
        }

        if (topic === "sadness") {
            if (count === 1) return { text: "I'm so sorry you're feeling this way. It's okay not to be okay. Do you want to talk about what happened?", newState: nextState, type: "normal" };
            if (count === 2) return { text: "Thank you for sharing that with me. It sounds incredibly tough. You are not alone.", newState: nextState, type: "normal" };
            return { text: "Be gentle with yourself today. Maybe do one small thing that brings you a tiny bit of comfort, like a warm drink.", newState: nextState, type: "normal" };
        }

        if (topic === "general_stress") {
            if (count === 1) return { text: "You sound exhausted. It seems like you've been carrying a lot lately.", newState: nextState, type: "normal" };
            return { text: "When was the last time you took a proper break, with no screens and no demands?", newState: nextState, type: "normal" };
        }

        if (topic === "distracted") {
            if (count === 1) return { text: "Focus is really hard sometimes. Are you finding it hard to start, or hard to keep going?", newState: nextState, type: "normal" };
            return { text: "Sometimes we procrastinate because the task feels too big. Try 'The 5 Minute Rule' - just promise to work for 5 minutes only.", newState: nextState, type: "normal" };
        }

        if (topic === "positive") {
            return { text: "That is wonderful to hear! It's so important to celebrate these wins. What do you think contributed to this good feeling?", newState: nextState, type: "normal" };
        }
    }

    // 3. Fallback / Neutral / Question
    if (sentiment === "question") {
        return { text: "That's a good question. As an AI, I suggest looking into our 'Exercises' or 'Assessment' tabs for more specific tools. How else can I help?", newState: nextState, type: "normal" };
    }

    // Generic fallback
    return {
        text: "I'm listening. Tell me more about that.",
        newState: nextState,
        type: "normal"
    };
};

export default function ChatPage() {
    return (
        <ProtectedRoute>
            <ChatContent />
        </ProtectedRoute>
    )
}

function ChatContent() {
    const [messages, setMessages] = useState<Message[]>([
        { id: "1", role: "bot", text: "Hello! I'm your learning support companion. How are you feeling about your studies today?", timestamp: new Date(), type: "normal" }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [helpReason, setHelpReason] = useState<"score" | "chat" | "manual">("manual");
    const [chatState, setChatState] = useState<ChatState>(INITIAL_STATE);

    // Load history on mount
    useEffect(() => {
        const saved = localStorage.getItem("chat_history");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Convert string dates back to Date objects
                const hydrated = parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
                setMessages(hydrated);
            } catch (e) {
                console.error("Failed to parse chat history");
            }
        }
    }, []);

    // Save history on changes
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem("chat_history", JSON.stringify(messages));
        }
    }, [messages]);

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = () => {
        if (!input.trim()) return;

        const userMsg: Message = { id: Date.now().toString(), role: "user", text: input, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        const sentiment = analyzeInput(userMsg.text, chatState);

        // RISK DETECTION
        if (sentiment === "risk") {
            setHelpReason("chat");
            setShowHelpModal(true);
        }

        (async () => {
            try {
                const response = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        messages: [
                            ...messages.map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text })),
                            { role: "user", content: userMsg.text }
                        ]
                    })
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.error || "API Request Failed");
                }

                const data = await response.json();

                const botMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    role: "bot",
                    text: data.reply,
                    timestamp: new Date(),
                    type: "normal"
                };
                setMessages(prev => [...prev, botMsg]);

            } catch (error: any) {
                console.error(error);
                const errorMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    role: "bot",
                    text: `Error: ${error.message || "Connection failed"}. Please check your API usage or try again.`,
                    timestamp: new Date(),
                    type: "normal"
                };
                setMessages(prev => [...prev, errorMsg]);
            } finally {
                setIsTyping(false);
            }
        })();
    };

    const resetChat = () => {
        const initialMsg: Message = { id: Date.now().toString(), role: "bot", text: "Chat history cleared. How can I help you now?", timestamp: new Date(), type: "normal" };
        setMessages([initialMsg]);
        setChatState(INITIAL_STATE);
        localStorage.removeItem("chat_history");
    };

    return (
        <div className="min-h-screen p-4 md:p-8 bg-background flex items-center justify-center">
            <ProfessionalHelpModal
                open={showHelpModal}
                onOpenChange={setShowHelpModal}
                reason={helpReason}
            />

            <Card className="w-full max-w-3xl h-[80vh] flex flex-col glass-card relative overflow-hidden">
                <CardHeader className="border-b border-white/10 relative z-10 flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Bot className="w-6 h-6 text-primary" />
                        AI Support Assistant
                    </CardTitle>
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={resetChat}
                            title="Clear Chat History"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            className="text-xs h-7 gap-1"
                            onClick={() => {
                                setHelpReason("manual");
                                setShowHelpModal(true);
                            }}
                        >
                            <PhoneCall className="w-3 h-3" /> I need support
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0 relative z-10">
                    <div
                        ref={scrollRef}
                        className="h-full overflow-y-auto p-4 space-y-4 scroll-smooth"
                    >
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex w-full mb-4",
                                    msg.role === "user" ? "justify-end" : "justify-start"
                                )}
                            >
                                <div className={cn(
                                    "flex max-w-[85%] gap-3",
                                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                                )}>
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                        msg.role === "user" ? "bg-primary text-primary-foreground" :
                                            msg.type === "risk" ? "bg-red-500 text-white" : "bg-secondary text-secondary-foreground"
                                    )}>
                                        {msg.role === "user" ? <User className="w-5 h-5" /> :
                                            msg.type === "risk" ? <PhoneCall className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <div className={cn(
                                            "p-4 rounded-2xl shadow-sm text-sm leading-relaxed",
                                            msg.role === "user"
                                                ? "bg-primary/20 text-foreground rounded-tr-none border border-primary/20"
                                                : msg.type === "risk"
                                                    ? "bg-red-500/10 text-red-200 border border-red-500/50 rounded-tl-none"
                                                    : "bg-white/50 dark:bg-white/10 backdrop-blur-md rounded-tl-none border border-white/20"
                                        )}>
                                            {msg.text}
                                        </div>
                                        {msg.type === "risk" && (
                                            <div className="text-xs text-red-400 pl-2">
                                                Hotline: 111 (Child Helpline) or 115
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start w-full">
                                <div className="flex max-w-[80%] gap-3">
                                    <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shrink-0">
                                        <Bot className="w-5 h-5" />
                                    </div>
                                    <div className="bg-white/50 dark:bg-white/10 p-4 rounded-2xl rounded-tl-none border border-white/20 flex gap-1 items-center h-12">
                                        <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" />
                                        <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce delay-100" />
                                        <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce delay-200" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="p-4 border-t border-white/10 bg-white/5 relative z-10">
                    <div className="flex w-full gap-2">
                        <input
                            className="flex h-12 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Type your message..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        />
                        <Button onClick={handleSend} size="icon" className="h-12 w-12 rounded-lg">
                            <Send className="w-5 h-5" />
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}


import { NextResponse } from 'next/server';
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const API_KEY = "sk-pE3s1y9Rcxz8AyAn2jh6bRrHbjhb5";

// --- GET: Fetch Chat History ---
export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        // For now, simple logic: get the most recent chat or create one
        let chat = await prisma.chat.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: { messages: { orderBy: { createdAt: 'asc' } } }
        });

        if (!chat) {
            // No chat exists, return empty or create?
            // Let's just return empty array, frontend will handle the rest
            return NextResponse.json({ messages: [] });
        }

        // Map DB messages to Frontend format
        const formattedMessages = chat.messages.map(msg => ({
            id: msg.id,
            role: msg.role === 'assistant' ? 'bot' : msg.role, // Map 'assistant' -> 'bot'
            text: msg.content,
            timestamp: msg.createdAt,
            type: "normal" // Default for now, DB doesn't store 'type' yet
        }));

        return NextResponse.json({ messages: formattedMessages });

    } catch (error) {
        console.error("GET Chat Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// --- POST: Send Message & Reply ---
export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const body = await req.json();
        const { messages } = body;
        // Frontend sends WHOLE history array including the new user message at the end.

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
        }

        const lastUserMessage = messages[messages.length - 1]; // The new one
        if (lastUserMessage.role !== 'user') {
            // If frontend logic sends something else, handle gracefully?
            // But usually the last one IS the user's prompt.
        }

        // 1. Find or Create Chat
        let chat = await prisma.chat.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        if (!chat) {
            chat = await prisma.chat.create({
                data: {
                    userId,
                    title: "New Conversation",
                }
            });
        }

        // 2. Save User Message to DB
        // (Only save the NEW one. We assume the previous ones are already there or we don't duplicate them)
        // Check if we should sync entire history? No, that's heavy.
        // We assume the frontend state matches the DB state mostly.

        await prisma.message.create({
            data: {
                chatId: chat.id,
                role: 'user',
                content: lastUserMessage.content
            }
        });

        // 3. Call AI API
        const response = await fetch("https://api.apifree.ai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "openai/gpt-5", // API specific model
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a compassionate, supportive, and knowledgeable mental health and study companion for students. Your goal is to listen without judgment, offer empathetic support, and provide practical study or stress-management advice when appropriate. If a user seems to be in immediate danger (suicidal), urge them to seek professional help immediately, but remain calm and supportive. Keep responses concise and natural."
                    },
                    ...messages // Pass full context to AI
                ]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("OpenRouter API Error:", errorText);
            return NextResponse.json({ error: `OpenRouter Error: ${errorText}` }, { status: 500 });
        }

        const data = await response.json();
        const reply = data.choices[0]?.message?.content || "I couldn't generate a response.";

        // 4. Save Bot Reply to DB
        await prisma.message.create({
            data: {
                chatId: chat.id,
                role: 'assistant',
                content: reply
            }
        });

        return NextResponse.json({ reply });

    } catch (error) {
        console.error("Server Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

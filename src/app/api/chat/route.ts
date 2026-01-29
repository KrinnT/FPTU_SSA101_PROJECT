
import { NextResponse } from 'next/server';
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const API_KEY = process.env.CHAT_API_KEY;
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Extend timeout for streaming

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

// --- POST: Send Message & Reply (Streaming) ---
export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const body = await req.json();
        const { messages } = body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
        }

        const lastUserMessage = messages[messages.length - 1];

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
        await prisma.message.create({
            data: {
                chatId: chat.id,
                role: 'user',
                content: lastUserMessage.content
            }
        });

        // 3. Call AI API with Streaming
        const response = await fetch("https://api.apifree.ai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "openai/gpt-5", // API specific model
                "stream": true, // ENABLE STREAMING
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a compassionate, supportive, and knowledgeable mental health and study companion for students. Your goal is to listen without judgment, offer empathetic support, and provide practical study or stress-management advice when appropriate. If a user seems to be in immediate danger (suicidal), urge them to seek professional help immediately, but remain calm and supportive. Keep responses concise and natural."
                    },
                    ...messages
                ]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("OpenRouter API Error:", errorText);
            return NextResponse.json({ error: `OpenRouter Error: ${errorText}` }, { status: 500 });
        }

        // 4. Transform Stream for Client + DB Saving
        // We need to parse the SSE (Server-Sent Events) from the AI API
        // and forward just the text content to the client, while accumulating full text.

        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        let fullReply = "";
        let buffer = ""; // Buffer for partial lines

        const transformStream = new TransformStream({
            async transform(chunk, controller) {
                const text = decoder.decode(chunk, { stream: true });
                buffer += text;

                const lines = buffer.split('\n');
                buffer = lines.pop() || ""; // Keep the last partial line in buffer

                for (const line of lines) {
                    if (line.trim().startsWith('data: ')) {
                        const data = line.trim().slice(6);
                        if (data === '[DONE]') continue;

                        try {
                            const json = JSON.parse(data);
                            const content = json.choices[0]?.delta?.content || "";
                            if (content) {
                                fullReply += content;
                                controller.enqueue(encoder.encode(content));
                            }
                        } catch (e) {
                            // Only ignore true parse errors (though with buffering, these should be rare)
                        }
                    }
                }
            },
            async flush() {
                // Stream finished, save to DB
                if (fullReply) {
                    try {
                        await prisma.message.create({
                            data: {
                                chatId: chat.id,
                                role: 'assistant',
                                content: fullReply
                            }
                        });
                    } catch (e) {
                        console.error("Failed to save bot reply to DB:", e);
                    }
                }
            }
        });

        // Pipe the AI response body through our transformer
        // @ts-ignore
        const stream = response.body.pipeThrough(transformStream);

        return new NextResponse(stream, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });

    } catch (error) {
        console.error("Server Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

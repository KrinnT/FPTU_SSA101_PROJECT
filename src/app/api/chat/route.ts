import { NextResponse } from 'next/server';
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const API_KEY = process.env.CHAT_API_KEY || "sk-pE3s1y9Rcxz8AyAn2jh6bRrHbjhb5";
export const dynamic = 'force-dynamic';
export const maxDuration = 60;


export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        let chat = await prisma.chat.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: { messages: { orderBy: { createdAt: 'asc' } } }
        });

        if (!chat) {
            return NextResponse.json({ messages: [] });
        }

        const formattedMessages = chat.messages.map(msg => ({
            id: msg.id,
            role: msg.role === 'assistant' ? 'bot' : msg.role,
            text: msg.content,
            timestamp: msg.createdAt,
            type: "normal"
        }));

        return NextResponse.json({ messages: formattedMessages });

    } catch (error) {
        console.error("GET Chat Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}


export async function DELETE(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        // Delete all chats; messages cascade automatically
        await prisma.chat.deleteMany({ where: { userId } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE Chat Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}


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

        let chat = await prisma.chat.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        if (!chat) {
            chat = await prisma.chat.create({
                data: { userId, title: "New Conversation" }
            });
        }

        await prisma.message.create({
            data: { chatId: chat.id, role: 'user', content: lastUserMessage.content }
        });

        const response = await fetch("https://api.apifree.ai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "openai/gpt-5",
                "stream": true,
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
            console.error("AI API Error:", errorText);
            return NextResponse.json({ error: `AI API Error: ${errorText}` }, { status: 500 });
        }

        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        let fullReply = "";
        let buffer = "";

        const transformStream = new TransformStream({
            async transform(chunk, controller) {
                const text = decoder.decode(chunk, { stream: true });
                buffer += text;
                const lines = buffer.split('\n');
                buffer = lines.pop() || "";
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
                        } catch (e) { /* ignore parse errors */ }
                    }
                }
            },
            async flush() {
                if (fullReply) {
                    try {
                        await prisma.message.create({
                            data: { chatId: chat.id, role: 'assistant', content: fullReply }
                        });
                    } catch (e) {
                        console.error("Failed to save bot reply to DB:", e);
                    }
                }
            }
        });

        // @ts-ignore
        const stream = response.body.pipeThrough(transformStream);

        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
            }
        });

    } catch (error) {
        console.error("Server Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

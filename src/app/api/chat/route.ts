
import { NextResponse } from 'next/server';

const API_KEY = "sk-pE3s1y9Rcxz8AyAn2jh6bRrHbjhb5";
const SITE_URL = "http://localhost:3000"; // Optional for OpenRouter
const SITE_NAME = "PsychSupport"; // Optional for OpenRouter

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { messages } = body;

        const response = await fetch("https://api.apifree.ai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "openai/gpt-5",
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

        const data = await response.json();
        const reply = data.choices[0]?.message?.content || "I couldn't generate a response.";

        return NextResponse.json({ reply });

    } catch (error) {
        console.error("Server Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        // A super lightweight query just to wake up the database
        await prisma.$queryRaw`SELECT 1`;
        return NextResponse.json({ status: "ok", message: "Database is warm" }, { status: 200 });
    } catch (error) {
        console.error("Keepalive Error:", error);
        return NextResponse.json({ status: "error", message: "Failed to connect" }, { status: 500 });
    }
}

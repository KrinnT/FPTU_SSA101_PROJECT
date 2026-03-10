export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

// GET: Increment download counter (used by the frontend after triggering download)
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await prisma.material.update({
            where: { id },
            data: { totalDownloads: { increment: 1 } }
        });
        return NextResponse.json({ ok: true });
    } catch (error) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
}

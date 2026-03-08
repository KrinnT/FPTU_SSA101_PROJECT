import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

// GET: Download a file (increments counter and returns the file URL)
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const material = await prisma.material.findUnique({
            where: { id }
        });

        if (!material) {
            return NextResponse.json({ error: "Material not found" }, { status: 404 });
        }

        // Increment download counter
        await prisma.material.update({
            where: { id },
            data: { totalDownloads: { increment: 1 } }
        });

        return NextResponse.json({ fileUrl: material.fileUrl });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

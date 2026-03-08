import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

// GET: Serve the base64 file content stored in DB
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

        const material = await prisma.material.findUnique({
            where: { id },
            select: { fileContent: true, title: true, type: true }
        });

        if (!material || !material.fileContent) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        // Parse the data URL: data:mime;base64,xxxxx
        const [header, base64Data] = material.fileContent.split(',');
        const mimeMatch = header.match(/data:([^;]+)/);
        const mimeType = mimeMatch?.[1] || 'application/octet-stream';

        const buffer = Buffer.from(base64Data, 'base64');

        // Increment download counter (fire-and-forget)
        prisma.material.update({ where: { id }, data: { totalDownloads: { increment: 1 } } }).catch(() => { });

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': mimeType,
                'Content-Disposition': `attachment; filename="${material.title}.${material.type.toLowerCase()}"`,
                'Content-Length': String(buffer.length),
            }
        });
    } catch (error) {
        console.error('[exam-materials/file]', error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

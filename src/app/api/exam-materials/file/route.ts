import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

// GET: Serve the base64 file content stored in DB
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const fileId = searchParams.get('fileId');
        if (!id && !fileId) return NextResponse.json({ error: "Missing id or fileId" }, { status: 400 });

        let fileContent = null;
        let title = '';
        let type = '';

        if (fileId) {
            const materialFile = await prisma.materialFile.findUnique({
                where: { id: fileId },
                select: { fileContent: true, name: true, type: true, materialId: true }
            });
            if (!materialFile) return NextResponse.json({ error: "File not found" }, { status: 404 });

            fileContent = materialFile.fileContent;
            title = materialFile.name.split('.')[0];
            type = materialFile.type;

            // Increment download counter safely (fire-and-forget)
            prisma.material.update({ where: { id: materialFile.materialId }, data: { totalDownloads: { increment: 1 } } }).catch(() => { });
        } else if (id) {
            const material = await prisma.material.findUnique({
                where: { id },
                select: { fileContent: true, title: true, type: true }
            });

            if (!material || !material.fileContent) {
                return NextResponse.json({ error: "File not found" }, { status: 404 });
            }

            fileContent = material.fileContent;
            title = material.title;
            type = material.type;

            // Increment download counter safely (fire-and-forget)
            prisma.material.update({ where: { id }, data: { totalDownloads: { increment: 1 } } }).catch(() => { });
        }

        const [header, base64Data] = fileContent!.split(',');
        const mimeMatch = header.match(/data:([^;]+)/);
        const mimeType = mimeMatch?.[1] || 'application/octet-stream';

        const buffer = Buffer.from(base64Data, 'base64');

        const forceDownload = new URL(req.url).searchParams.get('download') === '1';
        const disposition = forceDownload
            ? `attachment; filename="${title}.${type.toLowerCase()}"`
            : `inline; filename="${title}.${type.toLowerCase()}"`;

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': mimeType,
                'Content-Disposition': disposition,
                'Content-Length': String(buffer.length),
                'Cache-Control': 'private, max-age=300',
            }
        });
    } catch (error) {
        console.error('[exam-materials/file]', error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

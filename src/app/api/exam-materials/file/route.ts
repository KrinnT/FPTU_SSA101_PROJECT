export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

// GET: Serve file — redirects to Vercel Blob URL (new) or serves base64 (legacy)
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const fileId = searchParams.get('fileId');
        const forceDownload = searchParams.get('download') === '1';

        if (!id && !fileId) return NextResponse.json({ error: "Missing id or fileId" }, { status: 400 });

        
        if (fileId) {
            const materialFile = await prisma.materialFile.findUnique({
                where: { id: fileId },
                select: { fileUrl: true, fileContent: true, name: true, type: true, materialId: true }
            });
            if (!materialFile) return NextResponse.json({ error: "File not found" }, { status: 404 });

            // Increment counter (fire-and-forget)
            if (forceDownload) {
                prisma.material.update({
                    where: { id: materialFile.materialId },
                    data: { totalDownloads: { increment: 1 } }
                }).catch(() => { });
            }

            // New file: has a direct Blob URL — redirect to CDN
            if (materialFile.fileUrl && materialFile.fileUrl.startsWith('https://')) {
                if (forceDownload) {
                    // Proxy with attachment header so browser downloads
                    const res = await fetch(materialFile.fileUrl);
                    const buf = await res.arrayBuffer();
                    return new NextResponse(buf, {
                        headers: {
                            'Content-Type': res.headers.get('Content-Type') || 'application/octet-stream',
                            'Content-Disposition': `attachment; filename="${materialFile.name}"`,
                        }
                    });
                }
                return NextResponse.redirect(materialFile.fileUrl);
            }

            // Legacy file: decode base64
            if (!materialFile.fileContent) return NextResponse.json({ error: "No file content" }, { status: 404 });
            const [header, base64Data] = materialFile.fileContent.split(',');
            const mimeType = header.match(/data:([^;]+)/)?.[1] || 'application/octet-stream';
            const buffer = Buffer.from(base64Data, 'base64');
            const disposition = forceDownload
                ? `attachment; filename="${materialFile.name}"`
                : `inline; filename="${materialFile.name}"`;
            return new NextResponse(buffer, {
                headers: {
                    'Content-Type': mimeType,
                    'Content-Disposition': disposition,
                    'Content-Length': String(buffer.length),
                    'Cache-Control': 'private, max-age=300',
                }
            });
        }

        
        if (id) {
            const material = await prisma.material.findUnique({
                where: { id },
                select: { fileUrl: true, fileContent: true, title: true, type: true, files: { select: { fileUrl: true, name: true, type: true }, take: 1 } }
            });
            if (!material) return NextResponse.json({ error: "File not found" }, { status: 404 });

            if (forceDownload) {
                prisma.material.update({ where: { id }, data: { totalDownloads: { increment: 1 } } }).catch(() => { });
            }

            // Prefer first child file (new Blob URL)
            const primaryFile = material.files[0];
            if (primaryFile?.fileUrl?.startsWith('https://')) {
                if (forceDownload) {
                    const res = await fetch(primaryFile.fileUrl);
                    const buf = await res.arrayBuffer();
                    return new NextResponse(buf, {
                        headers: {
                            'Content-Type': res.headers.get('Content-Type') || 'application/octet-stream',
                            'Content-Disposition': `attachment; filename="${primaryFile.name}"`,
                        }
                    });
                }
                return NextResponse.redirect(primaryFile.fileUrl);
            }

            // Legacy base64 fallback
            if (!material.fileContent) return NextResponse.json({ error: "File not found" }, { status: 404 });
            const [header, base64Data] = material.fileContent.split(',');
            const mimeType = header.match(/data:([^;]+)/)?.[1] || 'application/octet-stream';
            const buffer = Buffer.from(base64Data, 'base64');
            const disposition = forceDownload
                ? `attachment; filename="${material.title}.${material.type?.toLowerCase()}"`
                : `inline; filename="${material.title}.${material.type?.toLowerCase()}"`;
            return new NextResponse(buffer, {
                headers: {
                    'Content-Type': mimeType,
                    'Content-Disposition': disposition,
                    'Content-Length': String(buffer.length),
                    'Cache-Control': 'private, max-age=300',
                }
            });
        }

        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    } catch (error) {
        console.error('[exam-materials/file]', error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

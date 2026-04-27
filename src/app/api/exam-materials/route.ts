import { NextResponse } from 'next/server';
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { put } from '@vercel/blob';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET: Fetch materials with optional filters
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const semesterId = searchParams.get('semesterId');
        const subjectId = searchParams.get('subjectId');
        const search = searchParams.get('search') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = 20;
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = { status: 'APPROVED' };
        if (semesterId) where.semesterId = semesterId;
        if (subjectId) where.subjectId = subjectId;
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { subject: { code: { contains: search, mode: 'insensitive' } } },
                { semester: { name: { contains: search, mode: 'insensitive' } } },
            ];
        }

        const [materials, total] = await Promise.all([
            prisma.material.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true, title: true, description: true, fileUrl: true,
                    size: true, type: true, totalDownloads: true, createdAt: true,
                    semester: { select: { id: true, name: true } },
                    subject: { select: { id: true, code: true } },
                    uploadedBy: { select: { id: true, name: true } },
                    files: { select: { id: true, name: true, type: true, fileUrl: true } },
                }
            }),
            prisma.material.count({ where })
        ]);

        return NextResponse.json({ materials, total, page, limit });
    } catch (error) {
        console.error('[exam-materials GET ERROR]', error instanceof Error ? error.stack : error, JSON.stringify(error));
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: Upload a new material (auth required) - stores files in Vercel Blob
export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized - please login first" }, { status: 401 });
        }

        const formData = await req.formData();
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const semesterId = formData.get('semesterId') as string;
        const subjectId = formData.get('subjectId') as string;
        
        // Handle both direct file upload (old) and client-side upload metadata (new)
        const files = formData.getAll('files') as File[];
        const uploadedFilesJson = formData.get('uploadedFiles') as string;
        
        if (!title || !semesterId || !subjectId) {
            return NextResponse.json({ error: "Missing required fields (title, semester, subject)" }, { status: 400 });
        }

        let materialFiles: { url: string; name: string; size: number }[] = [];

        if (uploadedFilesJson) {
            // New way: Client uploaded directly to Blob and sent us URLs
            try {
                materialFiles = JSON.parse(uploadedFilesJson);
            } catch (e) {
                return NextResponse.json({ error: "Invalid uploadedFiles data" }, { status: 400 });
            }
        } else if (files && files.length > 0) {
            // Old way: Files sent to our server (limited to 4.5MB by Vercel)
            const blockedExtensions = ['.exe', '.sh', '.bat', '.cmd', '.ps1', '.vbs', '.msi', '.dll'];
            const allowedExtensions = ['.pdf', '.docx', '.doc', '.pptx', '.ppt', '.zip', '.png', '.jpg', '.jpeg'];
            const MAX_SIZE = 4.5 * 1024 * 1024; // Lowered to 4.5MB to match Vercel hobby limit for server-side

            const mimeMap: Record<string, string> = {
                pdf: 'application/pdf',
                docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                doc: 'application/msword',
                pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                ppt: 'application/vnd.ms-powerpoint',
                zip: 'application/zip',
                png: 'image/png',
                jpg: 'image/jpeg',
                jpeg: 'image/jpeg',
            };

            for (const file of files) {
                const fileName = file.name.toLowerCase();
                if (blockedExtensions.some(ext => fileName.endsWith(ext))) {
                    return NextResponse.json({ error: `File type not allowed: ${fileName}` }, { status: 400 });
                }
                if (!allowedExtensions.some(ext => fileName.endsWith(ext))) {
                    return NextResponse.json({ error: `Only PDF, DOCX, PPTX, ZIP, PNG, JPG files are allowed: ${fileName}` }, { status: 400 });
                }
                if (file.size > MAX_SIZE) {
                    return NextResponse.json({ error: `File too large for direct upload (${(file.size / 1024 / 1024).toFixed(1)}MB). Vercel limits direct uploads to 4.5MB. Please try again with client-side upload.` }, { status: 400 });
                }
            }

            // Upload files to Blob if they came to the server
            const uploadResults = await Promise.all(files.map(async (file) => {
                const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
                const contentType = mimeMap[ext] || 'application/octet-stream';

                if (!process.env.BLOB_READ_WRITE_TOKEN) {
                    console.error('[exam-materials POST] BLOB_READ_WRITE_TOKEN is missing');
                    throw new Error("Storage configuration error (BLOB TOKEN MISSING)");
                }

                const blob = await put(`exam-materials/temp/${Date.now()}-${file.name}`, file, {
                    access: 'public',
                    contentType,
                });
                
                return { url: blob.url, name: file.name, size: file.size };
            }));
            materialFiles = uploadResults;
        }

        if (materialFiles.length === 0) {
            return NextResponse.json({ error: "No files provided" }, { status: 400 });
        }

        const totalSize = materialFiles.reduce((acc, f) => acc + f.size, 0);
        const primaryExt = materialFiles[0].name.split('.').pop()?.toUpperCase() || 'UNKNOWN';

        // Create the Material record
        const material = await prisma.material.create({
            data: {
                title,
                description: description || null,
                fileUrl: materialFiles[0].url,
                size: totalSize,
                type: materialFiles.length > 1 ? 'MULTIPLE' : primaryExt,
                semesterId,
                subjectId,
                uploadedById: session.user.id,
                status: 'APPROVED',
            }
        });

        // Create MaterialFile records
        await Promise.all(materialFiles.map((file) => 
            prisma.materialFile.create({
                data: {
                    materialId: material.id,
                    name: file.name,
                    fileUrl: file.url,
                    type: file.name.split('.').pop()?.toUpperCase() || 'BIN',
                    size: file.size,
                }
            })
        ));

        return NextResponse.json({
            id: material.id,
            title: material.title,
            type: material.type,
            size: material.size,
            createdAt: material.createdAt
        });
    } catch (error) {
        console.error('[exam-materials POST]', error);
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

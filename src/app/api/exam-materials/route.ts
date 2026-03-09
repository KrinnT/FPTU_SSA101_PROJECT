import { NextResponse } from 'next/server';
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

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

        const where: any = { status: 'APPROVED' };
        if (semesterId) where.semesterId = semesterId;
        if (subjectId) where.subjectId = subjectId;
        if (search) where.title = { contains: search, mode: 'insensitive' };

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
                    // DO NOT select fileContent here (too large)
                }
            }),
            prisma.material.count({ where })
        ]);

        return NextResponse.json({ materials, total, page, limit });
    } catch (error) {
        console.error('[exam-materials GET]', error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: Upload a new material (auth required) - stores file as base64 in DB
export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized - please login first" }, { status: 401 });
        }

        const formData = await req.formData();
        const files = formData.getAll('files') as File[];
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const semesterId = formData.get('semesterId') as string;
        const subjectId = formData.get('subjectId') as string;

        if (!files || files.length === 0 || !title || !semesterId || !subjectId) {
            return NextResponse.json({ error: "Missing required fields (title, semester, subject, files)" }, { status: 400 });
        }

        const blockedExtensions = ['.exe', '.sh', '.bat', '.cmd', '.ps1', '.vbs', '.msi', '.dll'];
        const allowedExtensions = ['.pdf', '.docx', '.doc', '.pptx', '.ppt', '.zip', '.png', '.jpg', '.jpeg'];
        const MAX_SIZE = 10 * 1024 * 1024; // 10MB limit per file

        const fileDataArray = [];

        for (const file of files) {
            const fileName = file.name.toLowerCase();

            if (blockedExtensions.some(ext => fileName.endsWith(ext))) {
                return NextResponse.json({ error: `File type not allowed for security reasons: ${fileName}` }, { status: 400 });
            }
            if (!allowedExtensions.some(ext => fileName.endsWith(ext))) {
                return NextResponse.json({ error: `Only PDF, DOCX, PPTX, ZIP, PNG, JPG files are allowed: ${fileName}` }, { status: 400 });
            }
            if (file.size > MAX_SIZE) {
                return NextResponse.json({ error: `File too large (max 10MB): ${fileName}` }, { status: 400 });
            }

            const bytes = await file.arrayBuffer();
            const base64 = Buffer.from(bytes).toString('base64');
            const ext = fileName.split('.').pop()?.toUpperCase() || 'UNKNOWN';

            const mimeMap: Record<string, string> = {
                pdf: 'application/pdf', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                doc: 'application/msword', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                ppt: 'application/vnd.ms-powerpoint', zip: 'application/zip',
                png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
            };
            const mime = mimeMap[ext.toLowerCase()] || 'application/octet-stream';

            fileDataArray.push({
                name: file.name,
                fileContent: `data:${mime};base64,${base64}`,
                size: file.size,
                type: ext
            });
        }

        const primaryExt = files.length > 1 ? 'MULTIPLE' : fileDataArray[0].type;
        const totalSize = fileDataArray.reduce((acc, f) => acc + f.size, 0);

        const material = await prisma.material.create({
            data: {
                title,
                description: description || null,
                size: totalSize,
                type: primaryExt,
                semesterId,
                subjectId,
                uploadedById: session.user.id,
                status: 'APPROVED',
                files: {
                    create: fileDataArray.map(f => ({
                        name: f.name,
                        fileContent: f.fileContent,
                        type: f.type,
                        size: f.size,
                        fileUrl: `/api/exam-materials/file?fileId=PLACEHOLDER` // updated below
                    }))
                }
            },
            include: { files: true }
        });

        // Update fileUrl for each created file with its actual ID
        for (const f of material.files) {
            await prisma.materialFile.update({
                where: { id: f.id },
                data: { fileUrl: `/api/exam-materials/file?fileId=${f.id}` }
            });
        }

        return NextResponse.json({
            id: material.id, title: material.title, type: material.type,
            size: material.size, createdAt: material.createdAt
        });
    } catch (error) {
        console.error('[exam-materials POST]', error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

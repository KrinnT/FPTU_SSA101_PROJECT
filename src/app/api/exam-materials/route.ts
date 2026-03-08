import { NextResponse } from 'next/server';
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { put } from '@vercel/blob';

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

        const where: any = {
            status: 'APPROVED',
        };

        if (semesterId) where.semesterId = semesterId;
        if (subjectId) where.subjectId = subjectId;
        if (search) {
            where.title = { contains: search, mode: 'insensitive' };
        }

        const [materials, total] = await Promise.all([
            prisma.material.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    semester: { select: { id: true, name: true } },
                    subject: { select: { id: true, code: true } },
                    uploadedBy: { select: { id: true, name: true } },
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

// POST: Upload a new material (auth required)
export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized - please login first" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const semesterId = formData.get('semesterId') as string;
        const subjectId = formData.get('subjectId') as string;

        if (!file || !title || !semesterId || !subjectId) {
            return NextResponse.json({ error: "Missing required fields (title, semester, subject, file)" }, { status: 400 });
        }

        // Security: block dangerous file types
        const blockedExtensions = ['.exe', '.sh', '.bat', '.cmd', '.ps1', '.vbs', '.msi', '.dll'];
        const fileName = file.name.toLowerCase();
        const isBlocked = blockedExtensions.some(ext => fileName.endsWith(ext));
        if (isBlocked) {
            return NextResponse.json({ error: "File type not allowed for security reasons" }, { status: 400 });
        }

        // Validate allowed types
        const allowedExtensions = ['.pdf', '.docx', '.doc', '.pptx', '.ppt', '.zip', '.png', '.jpg', '.jpeg'];
        const isAllowed = allowedExtensions.some(ext => fileName.endsWith(ext));
        if (!isAllowed) {
            return NextResponse.json({ error: "Only PDF, DOCX, PPTX, ZIP, PNG, JPG files are allowed" }, { status: 400 });
        }

        // Size limit: 25MB
        const MAX_SIZE = 25 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            return NextResponse.json({ error: "File too large (max 25MB)" }, { status: 400 });
        }

        // Sanitize filename and upload to Vercel Blob
        const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const blobName = `exam-materials/${Date.now()}_${sanitized}`;

        const blob = await put(blobName, file, {
            access: 'public',
        });

        const ext = sanitized.split('.').pop()?.toUpperCase() || 'UNKNOWN';

        const material = await prisma.material.create({
            data: {
                title,
                description: description || null,
                fileUrl: blob.url,
                size: file.size,
                type: ext,
                semesterId,
                subjectId,
                uploadedById: session.user.id,
                status: 'APPROVED',
            },
            include: {
                semester: { select: { name: true } },
                subject: { select: { code: true } },
                uploadedBy: { select: { name: true } },
            }
        });

        return NextResponse.json(material);
    } catch (error) {
        console.error('[exam-materials POST]', error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

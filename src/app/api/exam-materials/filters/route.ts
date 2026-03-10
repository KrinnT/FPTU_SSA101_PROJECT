import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { unstable_cache } from 'next/cache';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET: Fetch all semesters with their subjects (for dropdowns)
export async function GET() {
    try {
        const semesters = await prisma.semester.findMany({
            orderBy: { name: 'asc' },
            include: {
                subjects: {
                    orderBy: { code: 'asc' }
                }
            }
        });

        return NextResponse.json(semesters);
    } catch (error) {
        // TEMPORARY DEBUG: Return actual error to client to bypass Vercel log limits
        const errMessage = error instanceof Error ? error.message : String(error);
        const errStack = error instanceof Error ? error.stack : '';
        return NextResponse.json({ error: "Internal Server Error", detail: errMessage, stack: errStack }, { status: 500 });
    }
}

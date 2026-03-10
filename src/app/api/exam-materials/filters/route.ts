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
        console.error('[exam-materials/filters GET ERROR]', error instanceof Error ? error.stack : error, JSON.stringify(error));
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

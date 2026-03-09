import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { unstable_cache } from 'next/cache';

// Cache semesters+subjects for 5 minutes — this data rarely changes
const getCachedFilters = unstable_cache(
    async () => {
        return prisma.semester.findMany({
            orderBy: { name: 'asc' },
            include: {
                subjects: {
                    orderBy: { code: 'asc' },
                    select: { id: true, code: true }
                }
            },
            // Only select what's needed
            // (semester includes id, name by default)
        });
    },
    ['exam-filters'],
    { revalidate: 300 } // 5 minutes
);

// GET: Fetch all semesters with their subjects (for dropdowns)
export async function GET() {
    try {
        const semesters = await getCachedFilters();

        return NextResponse.json(semesters, {
            headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
            }
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

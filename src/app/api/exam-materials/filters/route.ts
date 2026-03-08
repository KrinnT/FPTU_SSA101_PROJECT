import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

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
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

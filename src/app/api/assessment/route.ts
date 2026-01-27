import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET: Fetch Latest Assessment
export async function GET() {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const latest = await prisma.assessment.findFirst({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(latest);
}

// POST: Save Assessment Result
export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json(); // { scores: { Depression, Anxiety, Stress } }

        const assessment = await prisma.assessment.create({
            data: {
                userId: session.user.id,
                depressionScore: body.scores.Depression,
                anxietyScore: body.scores.Anxiety,
                stressScore: body.scores.Stress
            }
        });

        return NextResponse.json(assessment);
    } catch (error) {
        console.error("POST /api/assessment error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

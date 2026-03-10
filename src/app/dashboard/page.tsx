import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./dashboard-client";

// Force dynamic since we use cookies/session
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
    // 1. Server-side Auth Check
    const session = await getSession();
    if (!session || !session.user) {
        redirect("/login");
    }

    let assessmentData = null;
    let history: any[] = [];

    try {
        // 2. Parallel Data Fetching
        const [assessment, moodLogs] = await Promise.all([
            prisma.assessment.findFirst({
                where: { userId: session.user.id },
                orderBy: { createdAt: 'desc' },
                select: { depressionScore: true, anxietyScore: true, stressScore: true }
            }),
            prisma.moodLog.findMany({
                where: { userId: session.user.id },
                orderBy: { createdAt: 'desc' },
                take: 14,
                select: {
                    mood: true,
                    focus: true,
                    createdAt: true,
                    emotion: true,
                    energy: true
                }
            })
        ]);

        // 3. Process Data for Client
        if (assessment) {
            assessmentData = {
                scores: {
                    Depression: assessment.depressionScore,
                    Anxiety: assessment.anxietyScore,
                    Stress: assessment.stressScore
                }
            };
        }

        // Mood History (Reverse: Oldest -> Newest for Chart)
        history = moodLogs.reverse().map((log: any) => ({
            ...log,
            mood: Number(log.mood),
            focus: Number(log.focus),
            createdAt: log.createdAt.toISOString(),
            date: log.createdAt.toLocaleDateString('en-US', { weekday: 'short' }),
        }));

        // Pad with empty if single entry (UI consistency)
        if (history.length === 1) {
            history.push({ ...history[0], date: "" });
        }
    } catch (error) {
        console.error("[Dashboard SSR Error]", error);
        // Fall back gracefully - show empty dashboard instead of crashing
    }

    // 4. Render Client Component
    return (
        <DashboardClient
            user={session.user}
            initialHistory={history}
            assessmentData={assessmentData}
        />
    );
}

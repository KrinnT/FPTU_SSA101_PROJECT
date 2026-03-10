export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getSession, setSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET: Return full profile
export async function GET() {
    try {
        const session = await getSession();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, name: true, email: true, phone: true, createdAt: true }
        });

        return NextResponse.json({ user });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// PATCH: Update profile fields
export async function PATCH(req: Request) {
    try {
        const session = await getSession();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { action, name, phone, newEmail, currentPassword, newPassword } = body;

        const userId = session.user.id;

        // ── Action: update personal info ────────────────────────────────────
        if (action === "updateProfile") {
            const updated = await prisma.user.update({
                where: { id: userId },
                data: {
                    ...(name !== undefined && { name }),
                    ...(phone !== undefined && { phone }),
                },
                select: { id: true, name: true, email: true, phone: true }
            });

            // Refresh session with new name
            await setSession({ id: updated.id, email: updated.email, name: updated.name ?? undefined });
            return NextResponse.json({ user: updated });
        }

        // ── Action: change email ─────────────────────────────────────────────
        if (action === "changeEmail") {
            if (!currentPassword || !newEmail) {
                return NextResponse.json({ error: "Current password and new email are required" }, { status: 400 });
            }

            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

            const valid = await bcrypt.compare(currentPassword, user.password);
            if (!valid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });

            // Check email not already taken
            const existing = await prisma.user.findUnique({ where: { email: newEmail } });
            if (existing && existing.id !== userId) {
                return NextResponse.json({ error: "Email already in use" }, { status: 400 });
            }

            const updated = await prisma.user.update({
                where: { id: userId },
                data: { email: newEmail },
                select: { id: true, name: true, email: true }
            });

            await setSession({ id: updated.id, email: updated.email, name: updated.name ?? undefined });
            return NextResponse.json({ user: updated });
        }

        // ── Action: change password ──────────────────────────────────────────
        if (action === "changePassword") {
            if (!currentPassword || !newPassword) {
                return NextResponse.json({ error: "Both current and new passwords are required" }, { status: 400 });
            }

            if (newPassword.length < 8) {
                return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
            }

            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

            const valid = await bcrypt.compare(currentPassword, user.password);
            if (!valid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });

            const hashed = await bcrypt.hash(newPassword, 12);
            await prisma.user.update({ where: { id: userId }, data: { password: hashed } });

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    } catch (error) {
        console.error("[profile PATCH]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

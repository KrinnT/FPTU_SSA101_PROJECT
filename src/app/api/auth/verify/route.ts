import { NextRequest, NextResponse } from "next/server";
import { getPendingSession, setSession, clearPendingSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const { code } = await req.json();
        const pending = await getPendingSession();

        if (!pending) {
            return NextResponse.json({ error: "Verification session expired. Please register again." }, { status: 400 });
        }

        if (pending.otp !== code) {
            return NextResponse.json({ error: "Invalid verification code." }, { status: 400 });
        }

        // OTP Matches! Create user in DB
        const newUser = await prisma.user.create({
            data: {
                email: pending.user.email,
                name: pending.user.name,
                phone: pending.user.phone,
                password: pending.user.password // Already hashed from register route
            }
        });

        // DO NOT set session here. Force manual login.
        await clearPendingSession();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Verification Error:", error);
        // Handle unique constraint violation just in case
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

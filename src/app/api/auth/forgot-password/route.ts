
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            // Security: Don't reveal if user exists. Fake success.
            // But for detailed UX, we might want to tell them. Let's stick to standard practice:
            // "If an account exists, a code has been sent."
            return NextResponse.json({ message: "If an account exists, a code has been sent." });
        }

        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        await prisma.user.update({
            where: { email },
            data: {
                resetCode: code,
                resetCodeExpires: expires
            }
        });

        await sendPasswordResetEmail(email, code);

        return NextResponse.json({ message: "Code sent successfully" });

    } catch (error) {
        console.error("Forgot password error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

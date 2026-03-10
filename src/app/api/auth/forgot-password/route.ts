export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required." }, { status: 400 });
        }

        // 1. Check if user exists
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // Security best practice: Do not reveal if email exists or not, just return success
            return NextResponse.json(
                { message: "If your email is in our system, you will receive a reset code." },
                { status: 200 }
            );
        }

        // 2. Generate 6 digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins from now

        // 3. Save code to User model
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetCode: code,
                resetCodeExpires: expires,
            },
        });

        // 4. Send Email
        const emailSent = await sendPasswordResetEmail(user.email, code);

        // Security best practice: Always return same message
        return NextResponse.json(
            { message: "If your email is in our system, you will receive a reset code." },
            { status: 200 }
        );

    } catch (error) {
        console.error("Forgot password error:", error);
        return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
    }
}

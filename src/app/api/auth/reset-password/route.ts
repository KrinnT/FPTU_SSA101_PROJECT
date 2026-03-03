import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { email, code, newPassword } = await req.json();

        if (!email || !code || !newPassword) {
            return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
        }

        // 1. Find user by email
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json({ error: "Invalid code or email." }, { status: 400 });
        }

        // 2. Validate code and expiration
        if (user.resetCode !== code) {
            return NextResponse.json({ error: "Invalid reset code." }, { status: 400 });
        }

        if (!user.resetCodeExpires || new Date() > user.resetCodeExpires) {
            return NextResponse.json({ error: "Reset code has expired. Please request a new one." }, { status: 400 });
        }

        // 3. Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // 4. Update password and clear reset code fields
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetCode: null,
                resetCodeExpires: null,
            },
        });

        return NextResponse.json({ message: "Password has been successfully reset." }, { status: 200 });

    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
    }
}

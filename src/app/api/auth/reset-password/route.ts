
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { email, code, newPassword } = await req.json();

        if (!email || !code || !newPassword) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 });
        }

        if (!user.resetCode || !user.resetCodeExpires) {
            return NextResponse.json({ error: "No reset request pending" }, { status: 400 });
        }

        if (user.resetCode !== code) {
            return NextResponse.json({ error: "Invalid code" }, { status: 400 });
        }

        if (new Date() > user.resetCodeExpires) {
            return NextResponse.json({ error: "Code expired" }, { status: 400 });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { email },
            data: {
                password: hashedPassword,
                resetCode: null,
                resetCodeExpires: null
            }
        });

        return NextResponse.json({ message: "Password updated successfully" });

    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

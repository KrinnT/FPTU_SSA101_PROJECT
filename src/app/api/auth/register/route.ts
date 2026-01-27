import { NextRequest, NextResponse } from "next/server";
import { setPendingSession } from "@/lib/session";
import { sendVerificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
    try {
        const { name, email, phone, password } = await req.json();

        if ((!email && !phone) || !password) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Check availability in DB
        const existing = await prisma.user.findUnique({
            where: { email: email || "" } // simple check for now, phone logic assumes email primary
        });

        if (existing) {
            return NextResponse.json({ error: "User already exists" }, { status: 400 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Prepare user object (NOT creating yet, just staging)
        const user = {
            email: email,
            name: name,
            phone: phone,
            password: hashedPassword // Store hashed password in the pending cookie
        };

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Attempt to send real email
        const emailSent = await sendVerificationEmail(user.email, otp);

        if (!emailSent) {
            console.error("❌ Failed to send verification email. Please check SMTP configuration.");
            console.error(`[DEBUG BACKUP] Verification Code for ${user.email}: ${otp}`);
        }

        // Set pending session instead of full session
        // Store the user data AND the OTP in the signed cookie
        await setPendingSession({ user, otp });

        return NextResponse.json({ requireVerification: true });
    } catch (error) {
        console.error("Register Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

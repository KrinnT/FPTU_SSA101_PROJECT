import nodemailer from "nodemailer";

export async function sendVerificationEmail(to: string, code: string) {
    // Check if SMTP credentials are set
    if (!process.env.SMTP_USER || process.env.SMTP_USER.includes("example.com")) {
        console.warn("⚠️ SMTP Credentials not configured. Email will NOT be sent.");
        return false;
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"CHATGPT Team Support" <no-reply@example.com>',
            to,
            subject: "Your Verification Code - CHATGPT Team Support",
            text: `Your verification code is: ${code}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4; border-radius: 8px;">
                    <h2 style="color: #333;">Welcome to CHATGPT Team Support!</h2>
                    <p>Please use the following code to verify your account:</p>
                    <div style="background: #fff; padding: 15px; border-radius: 5px; font-size: 24px; font-weight: bold; letter-spacing: 5px; text-align: center; border: 1px solid #ddd;">
                        ${code}
                    </div>
                    <p style="margin-top: 20px; font-size: 12px; color: #666;">If you didn't request this, please ignore this email.</p>
                </div>
            `,
        });

        console.log("Message sent: %s", info.messageId);
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
}

export async function sendPasswordResetEmail(to: string, code: string) {
    // Check if SMTP credentials are set
    if (!process.env.SMTP_USER || process.env.SMTP_USER.includes("example.com")) {
        console.warn("⚠️ SMTP Credentials not configured. Resest Email will NOT be sent.");
        return false;
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"CHATGPT Team Support" <no-reply@example.com>',
            to,
            subject: "Reset Your Password - CHATGPT Team Support",
            text: `Your password reset code is: ${code}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4; border-radius: 8px;">
                    <h2 style="color: #333;">Reset Your Password</h2>
                    <p>You requested a password reset. Use the code below to proceed:</p>
                    <div style="background: #fff; padding: 15px; border-radius: 5px; font-size: 24px; font-weight: bold; letter-spacing: 5px; text-align: center; border: 1px solid #ddd; color: #e11d48;">
                        ${code}
                    </div>
                    <p style="margin-top: 20px; font-size: 12px; color: #666;">This code expires in 15 minutes. If you didn't request this, please ignore it.</p>
                </div>
            `,
        });

        console.log("Reset Email sent: %s", info.messageId);
        return true;
    } catch (error) {
        console.error("Error sending reset email:", error);
        return false;
    }
}

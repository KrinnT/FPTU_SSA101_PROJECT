
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function verify() {
    console.log("Testing email configuration...");
    console.log(`User: ${process.env.SMTP_USER}`);

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
        await transporter.verify();
        console.log("✅ Configuration is valid!");

        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"Test" <no-reply@example.com>',
            to: process.env.SMTP_USER, // Send to self
            subject: "Test Email from Psych Support Web",
            text: "If you receive this, the email configuration is working.",
        });
        console.log("✅ Test email sent:", info.messageId);
    } catch (error) {
        console.error("❌ Email verification failed:", error);
    }
}

verify();

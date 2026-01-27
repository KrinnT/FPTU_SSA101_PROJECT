
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

// Manually parse .env.local because dotenv might be flaky in some environments
const envPath = path.resolve(process.cwd(), ".env.local");
let dbUrl = "";

if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, "utf8");
    const match = envConfig.match(/DATABASE_URL=(.*)/);
    if (match && match[1]) {
        dbUrl = match[1].trim().replace(/['"]+/g, ''); // Remove quotes if any
    }
}

if (!dbUrl) {
    console.error("❌ Could not find DATABASE_URL in .env.local");
    process.exit(1);
}

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: dbUrl,
        },
    },
});

async function main() {
    console.log("⚠️  STARTING DATABASE RESET...");

    try {
        // Delete in order of dependencies (child first, then parent)
        const deletedLogs = await prisma.moodLog.deleteMany();
        console.log(`✅ Deleted ${deletedLogs.count} Mood Logs`);

        const deletedAssessments = await prisma.assessment.deleteMany();
        console.log(`✅ Deleted ${deletedAssessments.count} Assessments`);

        const deletedUsers = await prisma.user.deleteMany();
        console.log(`✅ Deleted ${deletedUsers.count} Users`);

        console.log("🎉 Database cleared successfully!");
    } catch (error) {
        console.error("❌ Error resetting database:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();


const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });
const prisma = new PrismaClient();

async function main() {
    console.log("⏳ Connecting to database...");
    try {
        const userCount = await prisma.user.count();
        const moodCount = await prisma.moodLog.count();
        console.log("✅ Database Connected Successfully!");
        console.log(`📊 Users: ${userCount}`);
        console.log(`📝 Mood Logs: ${moodCount}`);

        const logs = await prisma.moodLog.findMany({ take: 5 });
        console.log("Latest logs:", logs);
    } catch (e) {
        console.error("❌ Connection failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();

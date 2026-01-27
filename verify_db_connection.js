
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });
const { PrismaClient } = require('@prisma/client');

// Use the same logic as src/lib/prisma.ts (simplified for JS)
const prisma = new PrismaClient({
    log: ["query", "info", "warn", "error"],
});

async function main() {
    console.log("-----------------------------------------");
    console.log("Testing Database Connection...");
    console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Defined" : "MISSING");

    try {
        await prisma.$connect();
        console.log("✅ Connection established successfully!");

        // Simple query to verify schema
        const count = await prisma.user.count();
        console.log(`✅ Database queried successfully. User count: ${count}`);

    } catch (error) {
        console.error("❌ Database connection failed:");
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

main();

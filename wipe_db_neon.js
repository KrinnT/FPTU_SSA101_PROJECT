const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const dbUrl = "postgresql://neondb_owner:npg_OQiSBHLd1s7a@ep-frosty-thunder-a1z54541-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: dbUrl
        }
    }
});

async function clearDB() {
    try {
        console.log("Connecting to the provided Neon DB string...");
        const usersCount = await prisma.user.count();
        console.log(`Found ${usersCount} users before deletion.`);

        // Delete all users (due to referential actions/cascade, this will delete everything else)
        const result = await prisma.user.deleteMany({});
        console.log(`Deleted ${result.count} users successfully.`);

        const countAfter = await prisma.user.count();
        console.log(`Remaining users: ${countAfter}`);
    } catch (err) {
        console.error("Error wiping db:", err);
    } finally {
        await prisma.$disconnect();
    }
}

clearDB();

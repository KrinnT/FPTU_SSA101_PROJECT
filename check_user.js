
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://neondb_owner:npg_0Dtkm6cMhbyB@ep-muddy-block-a1elytxs-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
        }
    }
});

async function main() {
    console.log("Checking for user: khanhtuong2302@gmail.com");
    // Just try to connect
    const count = await prisma.user.count();
    console.log(`User count: ${count}`);

    const user = await prisma.user.findUnique({
        where: { email: "khanhtuong2302@gmail.com" }
    });

    if (user) {
        console.log("User found:", user);
    } else {
        console.log("User NOT found.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });

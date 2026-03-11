const fs = require('fs');
const envStr = fs.readFileSync('.env.local', 'utf8');
envStr.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        const key = match[1].trim();
        const val = match[2].trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
        process.env[key] = process.env[key] || val;
    }
});

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Starting data wipe...");
    const result = await prisma.user.deleteMany({});
    console.log(`Successfully deleted ${result.count} users and all associated cascaded user data.`);
}

main()
    .catch(e => {
        console.error("Error clearing data:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

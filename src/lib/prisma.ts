import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: ["query"],
        datasources: {
            db: {
                url: "postgresql://neondb_owner:npg_OQiSBHLd1s7a@ep-frosty-thunder-a1z54541-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
            },
        },
    });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

import { PrismaClient } from "@prisma/client";

// Global singleton to reuse connection across hot-reloads in dev
// In production (Neon serverless), the pooler URL ensures connection pooling
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        // Only log in development — query logging adds latency in production
        log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
        datasources: {
            db: {
                // Always use env var — never hardcode credentials
                url: process.env.DATABASE_URL,
            },
        },
    });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

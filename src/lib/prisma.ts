import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

function createPrismaClient() {
    // PrismaNeonHttp uses Neon's HTTP API — no TCP handshake, no cold start
    const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {
        fetchOptions: { cache: "no-store" },
    });

    return new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

import { PrismaClient } from "@/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 has no built-in query engine — it talks to Postgres through a
// driver adapter. We reuse a single client (and connection pool) per process
// to avoid exhausting connections in dev (hot reload) and on serverless.
const prismaClientSingleton = () => {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
};

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof prismaClientSingleton> | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

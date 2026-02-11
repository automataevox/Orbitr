import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let _prisma: PrismaClient | undefined;

function initPrismaClient(): PrismaClient {
  if (_prisma) return _prisma;
  
  _prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });

  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = _prisma;
  
  return _prisma;
}

// Create a lazy proxy that initializes Prisma only when accessed
export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    const client = initPrismaClient();
    const value = client[prop as keyof PrismaClient];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});

export * from "@prisma/client";
export default prisma;

import { PrismaClient } from "@prisma/client";
import { env } from "./env";

// Singleton Prisma Client. `tsx watch` restarts the whole Node process on
// file change (unlike Next.js's dev server, which keeps modules alive across
// HMR), so this alone would already avoid the "too many connections" issue
// that pattern usually guards against — the globalThis cache below is kept
// anyway as cheap, standard insurance in case this app is ever run under a
// runtime that does keep modules warm across reloads.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.isDevelopment ? ["warn", "error"] : ["error"],
  });

if (!env.isProduction) {
  globalForPrisma.prisma = prisma;
}

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

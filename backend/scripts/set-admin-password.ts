// Sets (or creates) the admin account from ADMIN_EMAIL / ADMIN_PASSWORD and
// signs out every existing session. Unlike `db:seed`, this never touches menu
// data, so it is safe to run against a live production database.
import { PrismaClient } from "@prisma/client";
import { env } from "../src/config/env";
import { hashPassword } from "../src/utils/password";

const prisma = new PrismaClient();

async function main() {
  if (env.ADMIN_PASSWORD.length < 12 && env.isProduction) {
    throw new Error("Use an ADMIN_PASSWORD of at least 12 characters in production.");
  }
  const passwordHash = await hashPassword(env.ADMIN_PASSWORD);
  await prisma.adminUser.upsert({
    where: { email: env.ADMIN_EMAIL },
    create: { email: env.ADMIN_EMAIL, passwordHash, name: "Grill Out Admin" },
    update: { passwordHash, sessionVersion: { increment: 1 } },
  });
  console.log(`Password set for ${env.ADMIN_EMAIL}. Existing sessions were signed out.`);
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

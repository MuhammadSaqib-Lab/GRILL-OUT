// Links orders/reservations that were placed before customer accounts existed
// (as a guest) to a registered account — ONLY when you, the operator, have
// confirmed the person owns that email address.
//
//   npm run customers:link-legacy -- --email jane@example.com           (dry run: just counts)
//   npm run customers:link-legacy -- --email jane@example.com --apply   (actually moves them)
//
// Nothing is deleted; records that already belong to a real account are never touched.
import { PrismaClient } from "@prisma/client";
import { linkLegacyRecords } from "../src/services/legacyLink.service";

const args = process.argv.slice(2);
const emailIndex = args.indexOf("--email");
const email = emailIndex >= 0 ? args[emailIndex + 1] : undefined;
const apply = args.includes("--apply");

async function main() {
  if (!email) throw new Error("Usage: --email <address> [--apply]");
  const result = await linkLegacyRecords({ email, apply });
  if (!result.accountFound) {
    console.log(`No registered account for ${email}. The customer must sign up first.`);
    return;
  }
  console.log(
    `${result.applied ? "Linked" : "Would link"} ${result.orders} order(s) and ${result.reservations} reservation(s) to ${email}.` +
      (result.applied ? "" : " Re-run with --apply to do it.")
  );
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => new PrismaClient().$disconnect());

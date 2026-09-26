// Configures the dashboard admin account.
//
//   npm run admin:setup
//
// Asks you for the admin email and password in the terminal (the password is
// masked while you type and asked twice). If ADMIN_EMAIL / ADMIN_PASSWORD are
// already supplied in the server environment those are used instead and
// nothing is asked. Either way only a bcrypt hash is stored in the database;
// the password is never printed, logged, or written to any file.
//
// Safe to run repeatedly: it updates the existing admin (email and password)
// instead of adding another, and signs out that account's active sessions.
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { AdminSetupError, configureAdmin } from "../src/services/adminSetup.service";
import { SetupInputError, collectAdminCredentials } from "../src/services/adminSetupCli";
import { PromptAborted, canPromptInteractively, promptHidden, promptLine } from "../src/utils/prompt";

const prisma = new PrismaClient();

async function describeSituation(): Promise<string> {
  const admins = await prisma.adminUser.count();
  if (admins === 0) return "No admin account exists yet — one will be created.";
  if (admins === 1) return "One admin account exists — its email and password will be replaced.";
  return `${admins} admin accounts exist — enter the email of the one you want to update.`;
}

async function main() {
  const interactive = canPromptInteractively();
  if (interactive) console.log(await describeSituation());

  const { email, password } = await collectAdminCredentials(
    { ADMIN_EMAIL: process.env.ADMIN_EMAIL, ADMIN_PASSWORD: process.env.ADMIN_PASSWORD },
    {
      interactive,
      askEmail: () => promptLine("Enter your admin email: "),
      askPassword: () => promptHidden("Enter your admin password: "),
      askPasswordAgain: () => promptHidden("Confirm your admin password: "),
      say: (message) => console.log(message),
    }
  );

  const result = await configureAdmin({ email, password });
  console.log(
    result === "updated"
      ? "Admin account configured successfully (existing account updated; its active sessions were signed out)."
      : "Admin account configured successfully (account created)."
  );
}

main()
  .catch((err) => {
    // Only our own messages are shown — none of them can contain the password.
    if (err instanceof PromptAborted) console.error("\nCancelled — nothing was changed.");
    else if (err instanceof AdminSetupError || err instanceof SetupInputError) console.error(`Admin setup failed: ${err.message}`);
    else console.error("Admin setup failed (database unreachable or misconfigured).");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

import { z } from "zod";
import { prisma } from "../config/prisma";
import { hashPassword } from "../utils/password";

/**
 * Creates or updates THE admin account from an email + password supplied by
 * the operator (via the server's environment — see scripts/setup-admin.ts).
 *
 * Nothing in the repository contains an admin credential: no default email,
 * no default password, no seeded hash. The password is validated, hashed with
 * the project's bcrypt helper, and only the hash is stored.
 *
 * Idempotent and duplicate-free:
 *   - an admin with this email exists          -> its password hash is replaced
 *   - else exactly one admin exists            -> that account's email AND hash are replaced
 *   - else no admin exists                     -> one is created
 *   - else several admins, none with the email -> refuse (ambiguous), change nothing
 * Any existing sessions are signed out whenever an existing account changes.
 */

// The placeholder text shipped in .env.example must never be accepted as real.
const PLACEHOLDER = /your-admin-email|your-secure-password|change[-_ ]?me|change-this|replace-with|example\.com$/i;

export const adminCredentialsSchema = z.object({
  email: z
    .string({ required_error: "ADMIN_EMAIL is not set" })
    .trim()
    .toLowerCase()
    .email("ADMIN_EMAIL is not a valid email address")
    .max(254)
    .refine((v) => !PLACEHOLDER.test(v), "ADMIN_EMAIL is still the .env.example placeholder"),
  password: z
    .string({ required_error: "ADMIN_PASSWORD is not set" })
    .min(12, "ADMIN_PASSWORD must be at least 12 characters")
    // bcrypt silently ignores everything after 72 bytes, which would make two
    // different long passwords equivalent — refuse instead of truncating.
    .refine((v) => Buffer.byteLength(v, "utf8") <= 72, "ADMIN_PASSWORD must be at most 72 bytes")
    .refine((v) => /[A-Za-z]/.test(v) && /[0-9]/.test(v), "ADMIN_PASSWORD must contain at least one letter and one number")
    .refine((v) => !PLACEHOLDER.test(v), "ADMIN_PASSWORD is still the .env.example placeholder"),
});

/** Storage the setup logic needs — a small interface so it can be tested
 * without a database, and so it never touches anything but admin rows. */
export interface AdminStore {
  findByEmail(email: string): Promise<{ id: string } | null>;
  count(): Promise<number>;
  findOnly(): Promise<{ id: string } | null>;
  create(data: { email: string; passwordHash: string; name: string }): Promise<void>;
  update(id: string, data: { email: string; passwordHash: string }): Promise<void>;
}

export const prismaAdminStore: AdminStore = {
  findByEmail: (email) => prisma.adminUser.findUnique({ where: { email }, select: { id: true } }),
  count: () => prisma.adminUser.count(),
  findOnly: () => prisma.adminUser.findFirst({ select: { id: true } }),
  async create(data) {
    await prisma.adminUser.create({ data });
  },
  async update(id, data) {
    // sessionVersion bump = every existing session for this account stops working.
    await prisma.adminUser.update({ where: { id }, data: { ...data, sessionVersion: { increment: 1 } } });
  },
};

export type AdminSetupResult = "created" | "updated";

export class AdminSetupError extends Error {}

/** Throws AdminSetupError with a message that never contains the password. */
export async function configureAdmin(
  input: { email: string | undefined; password: string | undefined },
  store: AdminStore = prismaAdminStore
): Promise<AdminSetupResult> {
  const parsed = adminCredentialsSchema.safeParse(input);
  if (!parsed.success) {
    // Zod messages above are fixed strings; they never echo the offending value.
    throw new AdminSetupError(parsed.error.issues.map((i) => i.message).join("; "));
  }
  const { email, password } = parsed.data;

  const byEmail = await store.findByEmail(email);
  let target = byEmail;
  if (!target) {
    const total = await store.count();
    if (total > 1) {
      throw new AdminSetupError(
        "Several admin accounts exist and none uses ADMIN_EMAIL. Set ADMIN_EMAIL to the address of the account you want to change."
      );
    }
    target = total === 1 ? await store.findOnly() : null;
  }

  const passwordHash = await hashPassword(password);
  if (target) {
    await store.update(target.id, { email, passwordHash });
    return "updated";
  }
  await store.create({ email, passwordHash, name: "Grill Out Admin" });
  return "created";
}

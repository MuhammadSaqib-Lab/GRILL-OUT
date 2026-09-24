import bcrypt from "bcryptjs";

// Cost 12 (~250ms per hash): existing cost-10 hashes keep verifying — the
// cost is stored inside each hash — and are simply upgraded the next time a
// password is (re)hashed.
const SALT_ROUNDS = process.env.NODE_ENV === "test" ? 4 : 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// A real bcrypt hash of a throwaway string. Login compares against this when
// the email doesn't exist, so "unknown email" and "wrong password" take the
// same time and can't be told apart by response timing.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", SALT_ROUNDS);

export async function burnPasswordCheck(plain: string): Promise<void> {
  await bcrypt.compare(plain, DUMMY_HASH);
}

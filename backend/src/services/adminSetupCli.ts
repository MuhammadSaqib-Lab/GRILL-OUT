import { adminCredentialsSchema } from "./adminSetup.service";

/**
 * Works out the admin email + password for `npm run admin:setup`:
 *
 *  - Values already in the environment are used as-is (never printed).
 *  - Anything missing (or still a .env.example placeholder / invalid) is asked
 *    for interactively: the email as a normal line, the password hidden and
 *    entered twice. Invalid answers are explained and asked again; nothing is
 *    saved until both are valid.
 *  - With no terminal to ask on (CI, piped input) and nothing supplied, it
 *    stops with a clear message instead of guessing.
 *
 * The prompts are injected so the flow is testable without a real terminal.
 */

export interface SetupPrompts {
  interactive: boolean;
  askEmail(): Promise<string>;
  askPassword(): Promise<string>;
  askPasswordAgain(): Promise<string>;
  say(message: string): void;
}

export class SetupInputError extends Error {}

const emailField = adminCredentialsSchema.shape.email;
const passwordField = adminCredentialsSchema.shape.password;

const reasons = (r: { success: false; error: { issues: { message: string }[] } }) => r.error.issues.map((i) => i.message);

export async function collectAdminCredentials(
  env: { ADMIN_EMAIL?: string; ADMIN_PASSWORD?: string },
  prompts: SetupPrompts
): Promise<{ email: string; password: string }> {
  // ---- email ----
  let email: string | undefined;
  const envEmail = env.ADMIN_EMAIL?.trim();
  if (envEmail) {
    const r = emailField.safeParse(envEmail);
    if (r.success) email = r.data;
    else if (!prompts.interactive) throw new SetupInputError(`ADMIN_EMAIL: ${reasons(r).join("; ")}`);
    else prompts.say(`ADMIN_EMAIL in the environment can't be used (${reasons(r).join("; ").replace("ADMIN_EMAIL ", "")}) — asking instead.`);
  }
  if (!email) {
    if (!prompts.interactive) {
      throw new SetupInputError(
        "No terminal to ask on and ADMIN_EMAIL is not set. Run `npm run admin:setup` in an interactive terminal."
      );
    }
    for (;;) {
      const r = emailField.safeParse(await prompts.askEmail());
      if (r.success) {
        email = r.data;
        break;
      }
      prompts.say(`That email can't be used: ${reasons(r).join("; ").replace(/ADMIN_EMAIL (is )?/, "")}. Please try again.`);
    }
  }

  // ---- password ----
  const envPassword = env.ADMIN_PASSWORD;
  if (envPassword) {
    const r = passwordField.safeParse(envPassword);
    if (r.success) return { email, password: r.data };
    if (!prompts.interactive) throw new SetupInputError(`ADMIN_PASSWORD: ${reasons(r).join("; ")}`);
    prompts.say(`ADMIN_PASSWORD in the environment can't be used (${reasons(r).join("; ").replace("ADMIN_PASSWORD ", "")}) — asking instead.`);
  }
  if (!prompts.interactive) {
    throw new SetupInputError(
      "No terminal to ask on and ADMIN_PASSWORD is not set. Run `npm run admin:setup` in an interactive terminal."
    );
  }

  for (;;) {
    const r = passwordField.safeParse(await prompts.askPassword());
    if (!r.success) {
      // Messages are fixed strings — they describe the rule, never the typed value.
      prompts.say(`That password can't be used: ${reasons(r).join("; ").replace("ADMIN_PASSWORD ", "")}. Please try again.`);
      continue;
    }
    if ((await prompts.askPasswordAgain()) !== r.data) {
      prompts.say("The two passwords didn't match. Please try again.");
      continue;
    }
    return { email, password: r.data };
  }
}

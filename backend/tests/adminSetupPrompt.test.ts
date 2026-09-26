import { spawnSync } from "child_process";
import path from "path";
import { PassThrough } from "stream";
import { describe, expect, it, vi } from "vitest";
import { SetupInputError, collectAdminCredentials, type SetupPrompts } from "../src/services/adminSetupCli";
import { PromptAborted, canPromptInteractively, promptHidden, promptLine } from "../src/utils/prompt";

/** A fake terminal: stdin that claims to be a TTY (and records raw-mode changes) + a captured stdout. */
function fakeTerminal(isTTY = true) {
  const input = Object.assign(new PassThrough(), { isTTY, setRawMode: vi.fn() });
  const output = new PassThrough();
  let written = "";
  output.on("data", (d) => (written += d.toString()));
  return { input, output, written: () => written };
}
const tick = () => new Promise((r) => setImmediate(r));

describe("promptHidden: the password is never echoed", () => {
  it("shows one '*' per character and returns the typed value", async () => {
    const t = fakeTerminal();
    const p = promptHidden("Enter your admin password: ", t);
    await tick();
    t.input.write("Sup3r-Secret-pass");
    t.input.write("\r");
    expect(await p).toBe("Sup3r-Secret-pass");

    const shown = t.written();
    expect(shown).toContain("Enter your admin password: ");
    expect(shown).toContain("*".repeat("Sup3r-Secret-pass".length));
    expect(shown).not.toMatch(/Sup3r|Secret|pass\b/); // no typed character appears in the output
  });

  it("supports backspace, pastes, and ignores arrow keys / control keys", async () => {
    const t = fakeTerminal();
    const p = promptHidden("pw: ", t);
    await tick();
    t.input.write("abcx");
    t.input.write("\u007f"); // backspace removes the x
    t.input.write("\u001b[A"); // up arrow: ignored
    t.input.write("\tdef1\r"); // tab ignored, then enter (one chunk, as a paste would arrive)
    expect(await p).toBe("abcdef1");
    expect(t.written().replace(/pw: /, "")).not.toMatch(/[a-df]/); // typed letters never echoed (only * and backspace erase)
  });

  it("counts a multi-byte character as one", async () => {
    const t = fakeTerminal();
    const p = promptHidden("pw: ", t);
    await tick();
    t.input.write("pässwörd-😀-9\r");
    expect(await p).toBe("pässwörd-😀-9");
  });

  it("switches the terminal to raw mode while typing and always back afterwards", async () => {
    const t = fakeTerminal();
    const p = promptHidden("pw: ", t);
    await tick();
    t.input.write("x\r");
    await p;
    expect(t.input.setRawMode.mock.calls.map((c) => c[0])).toEqual([true, false]);
  });

  it("Ctrl+C cancels, returns the terminal to normal, and yields nothing", async () => {
    const t = fakeTerminal();
    const p = promptHidden("pw: ", t);
    await tick();
    t.input.write("partial\u0003");
    await expect(p).rejects.toBeInstanceOf(PromptAborted);
    expect(t.input.setRawMode.mock.calls.at(-1)?.[0]).toBe(false);
  });

  it("refuses to prompt for a password when there is no terminal (it could not be hidden)", async () => {
    const t = fakeTerminal(false);
    expect(canPromptInteractively(t)).toBe(false);
    await expect(promptHidden("pw: ", t)).rejects.toThrow(/interactive terminal/);
  });

  it("promptLine returns a trimmed visible answer", async () => {
    const t = fakeTerminal();
    const p = promptLine("Enter your admin email: ", t);
    await tick();
    t.input.write("  owner@restaurant.test  \n");
    expect(await p).toBe("owner@restaurant.test");
  });
});

/** Scripted answers, recorded messages — and a guard that no message ever contains a password. */
function scripted(answers: { emails?: string[]; passwords?: string[]; again?: string[] }, interactive = true) {
  const said: string[] = [];
  const asked: string[] = [];
  const next = (list: string[] | undefined, label: string) => async () => {
    asked.push(label);
    const v = list?.shift();
    if (v === undefined) throw new Error(`unexpected prompt: ${label}`);
    return v;
  };
  const prompts: SetupPrompts = {
    interactive,
    askEmail: next(answers.emails, "email"),
    askPassword: next(answers.passwords, "password"),
    askPasswordAgain: next(answers.again, "confirm"),
    say: (m) => said.push(m),
  };
  return { prompts, said, asked };
}
const GOOD = "Correct-Horse-Battery-9";

describe("collectAdminCredentials", () => {
  it("asks for the email and (twice) the password when nothing is in the environment", async () => {
    const s = scripted({ emails: ["Owner@Restaurant.TEST"], passwords: [GOOD], again: [GOOD] });
    expect(await collectAdminCredentials({}, s.prompts)).toEqual({ email: "owner@restaurant.test", password: GOOD });
    expect(s.asked).toEqual(["email", "password", "confirm"]);
  });

  it("uses valid environment values without asking anything, and prints nothing", async () => {
    const s = scripted({});
    const got = await collectAdminCredentials({ ADMIN_EMAIL: "env.owner@restaurant.test", ADMIN_PASSWORD: GOOD }, s.prompts);
    expect(got).toEqual({ email: "env.owner@restaurant.test", password: GOOD });
    expect(s.asked).toEqual([]);
    expect(s.said).toEqual([]);
  });

  it("asks only for what is missing (email from env, password typed)", async () => {
    const s = scripted({ passwords: [GOOD], again: [GOOD] });
    const got = await collectAdminCredentials({ ADMIN_EMAIL: "env.owner@restaurant.test" }, s.prompts);
    expect(got.email).toBe("env.owner@restaurant.test");
    expect(s.asked).toEqual(["password", "confirm"]);
  });

  it("treats blank and .env.example placeholder values as 'not supplied' and asks instead", async () => {
    const s = scripted({ emails: ["me@restaurant.test"], passwords: [GOOD], again: [GOOD] });
    const got = await collectAdminCredentials({ ADMIN_EMAIL: "your-admin-email@example.com", ADMIN_PASSWORD: "your-secure-password" }, s.prompts);
    expect(got).toEqual({ email: "me@restaurant.test", password: GOOD });
    expect(s.said.join("\n")).toMatch(/asking instead/);
    expect(s.said.join("\n")).not.toContain("your-secure-password");
  });

  it("explains an invalid email and asks again", async () => {
    const s = scripted({ emails: ["not-an-email", "  ", "ok@restaurant.test"], passwords: [GOOD], again: [GOOD] });
    expect((await collectAdminCredentials({}, s.prompts)).email).toBe("ok@restaurant.test");
    expect(s.said.filter((m) => /can't be used/.test(m))).toHaveLength(2);
    expect(s.asked.filter((a) => a === "email")).toHaveLength(3);
  });

  it("explains each invalid password and asks again — and never repeats the typed value", async () => {
    const bad = ["short-Sec1", "no-digits-here-at-all", "1234567890123", "a1".repeat(37), "your-secure-password"];
    const s = scripted({ emails: ["me@restaurant.test"], passwords: [...bad, GOOD], again: [GOOD] });
    await collectAdminCredentials({}, s.prompts);
    const said = s.said.join("\n");
    expect(said).toMatch(/at least 12 characters/);
    expect(said).toMatch(/letter and one number/);
    expect(said).toMatch(/72 bytes/);
    for (const pw of [...bad, GOOD]) expect(said).not.toContain(pw);
    expect(s.asked.filter((a) => a === "password")).toHaveLength(bad.length + 1);
    expect(s.asked.filter((a) => a === "confirm")).toHaveLength(1); // only asked to confirm a valid one
  });

  it("re-asks from the top when the confirmation doesn't match", async () => {
    const s = scripted({ emails: ["me@restaurant.test"], passwords: [GOOD, "Another-Valid-Pass-7"], again: ["Typo-Different-1", "Another-Valid-Pass-7"] });
    expect((await collectAdminCredentials({}, s.prompts)).password).toBe("Another-Valid-Pass-7");
    expect(s.said.join("\n")).toMatch(/didn't match/);
    expect(s.said.join("\n")).not.toContain(GOOD);
  });

  it("with no terminal and nothing supplied it stops with an explanation instead of guessing", async () => {
    const s = scripted({}, false);
    await expect(collectAdminCredentials({}, s.prompts)).rejects.toBeInstanceOf(SetupInputError);
    await expect(collectAdminCredentials({ ADMIN_EMAIL: "me@restaurant.test" }, s.prompts)).rejects.toThrow(/No terminal to ask on/);
    expect(s.asked).toEqual([]);
  });

  it("with no terminal, invalid environment values fail without echoing them", async () => {
    const s = scripted({}, false);
    const err = await collectAdminCredentials({ ADMIN_EMAIL: "me@restaurant.test", ADMIN_PASSWORD: "weak-Pass-1" }, s.prompts).catch((e) => e);
    expect(err).toBeInstanceOf(SetupInputError);
    expect((err as Error).message).not.toContain("weak-Pass-1");
  });
});

describe("the real command, run without a terminal", () => {
  const run = (env: Record<string, string>) =>
    spawnSync("npx", ["tsx", "scripts/setup-admin.ts"], {
      cwd: path.resolve(__dirname, ".."),
      encoding: "utf8",
      shell: true,
      input: "", // stdin is a pipe, not a terminal
      env: { ...process.env, ADMIN_EMAIL: "", ADMIN_PASSWORD: "", ...env },
    });

  it("does not hang or guess: explains that it needs a terminal", () => {
    const res = run({});
    const out = `${res.stdout}${res.stderr}`;
    expect(res.status).toBe(1);
    expect(out).toMatch(/No terminal to ask on/);
  }, 60_000);

  it("never prints a rejected password from the environment", () => {
    const secret = "tiny-Sec1";
    const res = run({ ADMIN_EMAIL: "me@restaurant.test", ADMIN_PASSWORD: secret });
    expect(res.status).toBe(1);
    expect(`${res.stdout}${res.stderr}`).not.toContain(secret);
  }, 60_000);
});

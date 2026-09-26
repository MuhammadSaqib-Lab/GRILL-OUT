import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/config/prisma";
import { AdminSetupError, configureAdmin, type AdminStore } from "../src/services/adminSetup.service";
import { adminCookieHeader, testAdmin } from "./helpers";

const app = createApp();
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const GOOD_PASSWORD = "Correct-Horse-Battery-9";

/** In-memory AdminStore so every branch of the setup logic can be exercised
 * without touching the shared test database. */
function fakeStore(initial: Array<{ id: string; email: string }> = []) {
  const rows = initial.map((r) => ({ ...r, passwordHash: "" }));
  let nextId = 100;
  const store: AdminStore = {
    findByEmail: async (email) => rows.find((r) => r.email === email) ?? null,
    count: async () => rows.length,
    findOnly: async () => rows[0] ?? null,
    create: async (d) => void rows.push({ id: String(nextId++), email: d.email, passwordHash: d.passwordHash }),
    update: async (id, d) => {
      const row = rows.find((r) => r.id === id);
      if (!row) throw new Error("no such row");
      row.email = d.email;
      row.passwordHash = d.passwordHash;
    },
  };
  return { store, rows };
}

describe("admin setup: validation (nothing is written, nothing echoes the password)", () => {
  it.each([
    ["missing email", { email: undefined, password: GOOD_PASSWORD }],
    ["missing password", { email: "owner@restaurant.test", password: undefined }],
    ["malformed email", { email: "not-an-email", password: GOOD_PASSWORD }],
    ["placeholder email from .env.example", { email: "your-admin-email@example.com", password: GOOD_PASSWORD }],
    ["placeholder password from .env.example", { email: "owner@restaurant.test", password: "your-secure-password" }],
    ["old default password", { email: "owner@restaurant.test", password: "ChangeMe123!" }],
    ["password shorter than 12", { email: "owner@restaurant.test", password: "Short1pass" }],
    ["password without a number", { email: "owner@restaurant.test", password: "OnlyLettersHereAbc" }],
    ["password without a letter", { email: "owner@restaurant.test", password: "1234567890123" }],
    ["password over bcrypt's 72 bytes", { email: "owner@restaurant.test", password: "a1".repeat(37) }],
  ])("rejects %s", async (_label, input) => {
    const { store, rows } = fakeStore();
    await expect(configureAdmin(input, store)).rejects.toBeInstanceOf(AdminSetupError);
    expect(rows).toHaveLength(0);
  });

  it("never puts the offending password in the error message", async () => {
    for (const pw of ["short-Sec1", "no-digits-here-at-all", "weak-Secret-9" + "x".repeat(70), "your-secure-password"]) {
      const err = await configureAdmin({ email: "owner@restaurant.test", password: pw }, fakeStore().store).catch((e) => e);
      expect(err).toBeInstanceOf(AdminSetupError);
      expect((err as Error).message).not.toContain(pw);
    }
  });
});

describe("admin setup: create / update logic", () => {
  it("creates the admin when none exists, storing only a bcrypt hash and a lower-cased email", async () => {
    const { store, rows } = fakeStore();
    expect(await configureAdmin({ email: "  Owner@Restaurant.TEST ", password: GOOD_PASSWORD }, store)).toBe("created");
    expect(rows).toHaveLength(1);
    expect(rows[0]?.email).toBe("owner@restaurant.test");
    expect(rows[0]?.passwordHash).toMatch(/^\$2[aby]\$\d\d\$/);
    expect(rows[0]?.passwordHash).not.toContain(GOOD_PASSWORD);
  });

  it("is idempotent: running it again updates the same account — never a second one", async () => {
    const { store, rows } = fakeStore();
    await configureAdmin({ email: "owner@restaurant.test", password: GOOD_PASSWORD }, store);
    const firstHash = rows[0]?.passwordHash;
    expect(await configureAdmin({ email: "owner@restaurant.test", password: "Another-Passw0rd-42" }, store)).toBe("updated");
    expect(rows).toHaveLength(1);
    expect(rows[0]?.passwordHash).not.toBe(firstHash);
  });

  it("replaces the email AND password of the only existing admin (e.g. the old default account)", async () => {
    const { store, rows } = fakeStore([{ id: "1", email: "old-default@grillout.local" }]);
    expect(await configureAdmin({ email: "me@restaurant.test", password: GOOD_PASSWORD }, store)).toBe("updated");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: "1", email: "me@restaurant.test" });
    expect(rows[0]?.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it("updates the matching account when several admins exist", async () => {
    const { store, rows } = fakeStore([{ id: "1", email: "a@x.test" }, { id: "2", email: "b@x.test" }]);
    expect(await configureAdmin({ email: "b@x.test", password: GOOD_PASSWORD }, store)).toBe("updated");
    expect(rows.find((r) => r.id === "2")?.passwordHash).toMatch(/^\$2/);
    expect(rows.find((r) => r.id === "1")?.passwordHash).toBe("");
  });

  it("refuses to guess when several admins exist and none matches", async () => {
    const { store, rows } = fakeStore([{ id: "1", email: "a@x.test" }, { id: "2", email: "b@x.test" }]);
    await expect(configureAdmin({ email: "c@x.test", password: GOOD_PASSWORD }, store)).rejects.toThrow(/several admin accounts/i);
    expect(rows.map((r) => r.email)).toEqual(["a@x.test", "b@x.test"]);
  });
});

describe("admin setup against the real database", () => {
  it("the configured credentials log in; wrong password / wrong email are rejected identically", async () => {
    const admin = await testAdmin();
    const newPassword = `New-${GOOD_PASSWORD}`;

    // Same email -> the existing account is updated in place (no duplicate row).
    const before = await prisma.adminUser.count({ where: { email: admin.email } });
    expect(await configureAdmin({ email: admin.email.toUpperCase(), password: newPassword })).toBe("updated");
    expect(await prisma.adminUser.count({ where: { email: admin.email } })).toBe(before);

    const row = await prisma.adminUser.findUniqueOrThrow({ where: { email: admin.email } });
    expect(row.passwordHash).toMatch(/^\$2[aby]\$\d\d\$/);
    expect(row.passwordHash).not.toContain(newPassword);

    // case-insensitive email, new password works
    const ok = await request(app).post("/api/admin/auth/login").send({ email: admin.email.toUpperCase(), password: newPassword });
    expect(ok.status).toBe(200);
    expect(ok.body.data.email).toBe(admin.email);

    // the previous password no longer works, nor does a wrong one
    const old = await request(app).post("/api/admin/auth/login").send({ email: admin.email, password: admin.password });
    const wrongPw = await request(app).post("/api/admin/auth/login").send({ email: admin.email, password: "definitely-wrong-1" });
    const wrongEmail = await request(app).post("/api/admin/auth/login").send({ email: "nobody@grillout.test", password: newPassword });
    for (const res of [old, wrongPw, wrongEmail]) {
      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe("Invalid email or password.");
    }
    expect(wrongPw.body).toEqual(wrongEmail.body); // cannot tell whether the email exists
  });

  it("signs out every existing session when the credentials are updated", async () => {
    const admin = await testAdmin();
    const cookie = await adminCookieHeader();
    expect((await request(app).get("/api/admin/dashboard").set("Cookie", cookie)).status).toBe(200);

    await configureAdmin({ email: admin.email, password: `Again-${GOOD_PASSWORD}` });
    expect((await request(app).get("/api/admin/dashboard").set("Cookie", cookie)).status).toBe(401);
  });
});

describe("credentials and hashes never leave the server", () => {
  it("no admin API response contains the password, a hash, or the session version", async () => {
    const admin = await testAdmin();
    const agent = request.agent(app);
    const login = await agent.post("/api/admin/auth/login").send({ email: admin.email, password: `Again-${GOOD_PASSWORD}` });
    // (the previous test changed the password; fall back to a fresh cookie if needed)
    const cookie = login.status === 200 ? undefined : await adminCookieHeader();

    const responses = [
      login,
      ...(await Promise.all(
        ["/api/admin/auth/me", "/api/admin/dashboard", "/api/admin/orders", "/api/admin/customers", "/api/admin/reservations"].map((p) => {
          const r = cookie ? request(app).get(p).set("Cookie", cookie) : agent.get(p);
          return r;
        })
      )),
    ];
    for (const res of responses) {
      const text = JSON.stringify(res.body) + JSON.stringify(res.headers);
      expect(text).not.toMatch(/\$2[aby]\$/); // a bcrypt hash
      expect(text).not.toMatch(/passwordHash|sessionVersion/);
      expect(text).not.toContain(admin.password);
      expect(text).not.toContain(GOOD_PASSWORD);
    }
  });

  it("logout invalidates the session", async () => {
    const admin = await testAdmin();
    const agent = request.agent(app);
    await configureAdmin({ email: admin.email, password: GOOD_PASSWORD });
    expect((await agent.post("/api/admin/auth/login").send({ email: admin.email, password: GOOD_PASSWORD })).status).toBe(200);
    expect((await agent.get("/api/admin/auth/me")).status).toBe(200);
    expect((await agent.post("/api/admin/auth/logout")).status).toBe(200);
    expect((await agent.get("/api/admin/auth/me")).status).toBe(401);
  });

  it("unauthenticated requests to the admin API are rejected, and the admin pages carry no data", async () => {
    for (const p of ["/api/admin/dashboard", "/api/admin/orders", "/api/admin/menu/items", "/api/admin/auth/me"]) {
      expect((await request(app).get(p)).status, p).toBe(401);
    }
    const page = await request(app).get("/admin/dashboard.html");
    expect(page.status).toBe(200); // a static shell — the data behind it is what's protected
    expect(page.text).not.toMatch(/\$2[aby]\$/);
  });
});

describe("no credential is hardcoded anywhere in the project", () => {
  // Files the browser can ever receive.
  const FRONTEND_DIRS = ["backend/admin-ui", "js", "css", "login", "signup", "account", "images"];
  const FRONTEND_FILES = ["index.html", "404.html"];

  function walk(dir: string, out: string[] = []): string[] {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full, out);
      else if (/\.(html|js|css|json|webmanifest|svg|txt)$/i.test(entry.name)) out.push(full);
    }
    return out;
  }

  it("the frontend files contain no admin email/password values or hashes", () => {
    const files = [
      ...FRONTEND_DIRS.filter((d) => fs.existsSync(path.join(REPO_ROOT, d))).flatMap((d) => walk(path.join(REPO_ROOT, d))),
      ...FRONTEND_FILES.map((f) => path.join(REPO_ROOT, f)),
    ];
    expect(files.length).toBeGreaterThan(10);

    // Values that could be the operator's real credentials, if present in this process's environment.
    const live = [process.env.ADMIN_PASSWORD, process.env.ADMIN_EMAIL].filter((v): v is string => Boolean(v && v.length >= 6));

    for (const file of files) {
      const text = fs.readFileSync(file, "utf8");
      const rel = path.relative(REPO_ROOT, file);
      expect(text, rel).not.toMatch(/\$2[aby]\$\d\d\$/); // a bcrypt hash
      expect(text, rel).not.toMatch(/ChangeMe123|admin@grillout\.local/);
      for (const value of live) expect(text.includes(value), `${rel} contains a configured admin credential`).toBe(false);
    }
  });

  it("no git-tracked file contains the old default admin email or password", () => {
    const res = spawnSync("git", ["grep", "-n", "-I", "-e", "ChangeMe123", "-e", "admin@grillout.local", "--", ".", ":!backend/tests"], {
      cwd: REPO_ROOT,
      encoding: "utf8",
    });
    // git grep: exit 1 = no matches. (Anything else, e.g. a match or git missing, fails the test.)
    expect(res.stdout, "old default credentials still present:\n" + res.stdout).toBe("");
    expect(res.status).toBe(1);
  });

  it("the server config has no default admin credentials", async () => {
    const { env } = await import("../src/config/env");
    expect(Object.keys(env)).not.toContain("ADMIN_PASSWORD");
    const src = fs.readFileSync(path.join(REPO_ROOT, "backend/src/config/env.ts"), "utf8");
    expect(src).not.toMatch(/ADMIN_PASSWORD\s*:/);
    expect(src).not.toMatch(/ADMIN_EMAIL\s*:\s*z\.string\(\)\.email\(\)\.default/);
  });

  it("the seed script does not create or reference an admin account", () => {
    const seed = fs.readFileSync(path.join(REPO_ROOT, "backend/prisma/seed.ts"), "utf8");
    expect(seed).not.toMatch(/adminUser|hashPassword|ADMIN_PASSWORD|ADMIN_EMAIL/);
  });

  it("the setup command fails cleanly on bad input without ever printing the password", () => {
    const secret = "tiny-Sec1"; // too short on purpose
    const res = spawnSync("npx", ["tsx", "scripts/setup-admin.ts"], {
      cwd: path.join(REPO_ROOT, "backend"),
      encoding: "utf8",
      shell: true,
      env: { ...process.env, ADMIN_EMAIL: "owner@restaurant.test", ADMIN_PASSWORD: secret },
    });
    const output = `${res.stdout}\n${res.stderr}`;
    expect(res.status).toBe(1);
    expect(output).toMatch(/Admin setup failed/);
    expect(output).not.toContain(secret);
  }, 60_000);
});

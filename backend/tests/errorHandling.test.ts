import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

const app = createApp();

describe("centralized error handling", () => {
  it("returns a consistent 404 body for an unknown route", async () => {
    const res = await request(app).get("/api/this-route-does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("ROUTE_NOT_FOUND");
  });

  it("never leaks a stack trace to the client", async () => {
    const res = await request(app).get("/api/menu/not-a-number");
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).not.toMatch(/at Object\.|\.ts:\d+:\d+/);
  });

  it("rejects a malformed JSON body with 400, not a crash", async () => {
    const res = await request(app)
      .post("/api/orders")
      .set("Content-Type", "application/json")
      .send("{ not valid json");
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("every response — success or error — uses the documented envelope", async () => {
    const ok = await request(app).get("/api/health");
    expect(ok.body).toHaveProperty("success", true);
    expect(ok.body).toHaveProperty("data");

    const bad = await request(app).get("/api/menu/999999");
    expect(bad.body).toHaveProperty("success", false);
    expect(bad.body.error).toHaveProperty("code");
    expect(bad.body.error).toHaveProperty("message");
  });
});

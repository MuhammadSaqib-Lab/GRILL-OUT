import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

const app = createApp();

describe("GET /api/health", () => {
  it("returns 200 with an ok status", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("ok");
    // Public endpoint: must not reveal environment, uptime, or connection details.
    expect(res.body.data.environment).toBeUndefined();
    expect(res.body.data.uptimeSeconds).toBeUndefined();
  });
});

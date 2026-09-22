import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

const app = createApp();

describe("GET /api/menu", () => {
  it("returns all 99 menu items ported from the frontend", async () => {
    const res = await request(app).get("/api/menu");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(99);
  });

  it("filters by featured=true", async () => {
    const res = await request(app).get("/api/menu?featured=true");
    expect(res.status).toBe(200);
    expect(res.body.data.every((item: { featured: boolean }) => item.featured === true)).toBe(true);
  });

  it("rejects a garbage query value", async () => {
    const res = await request(app).get("/api/menu?featured=maybe");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("GET /api/menu/:id", () => {
  it("returns a known item with the exact frontend name and price", async () => {
    const res = await request(app).get("/api/menu/21");
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Ba Zinga");
    expect(res.body.data.price).toBe(599);
  });

  it("returns an item that has size options with prices intact", async () => {
    const res = await request(app).get("/api/menu/1");
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Crown Crust Pizza");
    expect(res.body.data.options).toEqual([
      { label: "M", price: 1399 },
      { label: "L", price: 1949 },
    ]);
  });

  it("404s for an id that does not exist", async () => {
    const res = await request(app).get("/api/menu/999999");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("400s for a non-numeric id instead of 500ing", async () => {
    const res = await request(app).get("/api/menu/not-a-number");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("GET /api/menu/category/:category", () => {
  it("returns only burgers for the burgers category", async () => {
    const res = await request(app).get("/api/menu/category/burgers");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(10);
    expect(res.body.data.every((item: { category: string }) => item.category === "burgers")).toBe(true);
  });

  it("404s for an unknown category", async () => {
    const res = await request(app).get("/api/menu/category/not-a-real-category");
    expect(res.status).toBe(404);
  });
});

describe("GET /api/categories", () => {
  it("returns the 20 real menu categories", async () => {
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(20);
    expect(res.body.data[0]).toHaveProperty("key");
    expect(res.body.data[0]).toHaveProperty("label");
  });
});

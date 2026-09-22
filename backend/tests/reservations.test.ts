import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

const app = createApp();

function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

describe("POST /api/reservations", () => {
  it("creates a reservation matching the reservation form's own field shape", async () => {
    const res = await request(app)
      .post("/api/reservations")
      .send({
        customerName: "Ahmed Khan",
        phone: "0300-1234567",
        date: tomorrow(),
        time: "19:00",
        guests: "3-4",
        specialRequests: "Window seat please",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toMatch(/^RES-/);
    expect(res.body.data.status).toBe("PENDING");
    expect(res.body.data.guests).toBe("3-4");
  });

  it("rejects a reservation date in the past", async () => {
    const res = await request(app)
      .post("/api/reservations")
      .send({
        customerName: "Past Date",
        phone: "0300-1234567",
        date: "2020-01-01",
        time: "19:00",
        guests: "1-2",
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects a guests value the frontend select doesn't offer", async () => {
    const res = await request(app)
      .post("/api/reservations")
      .send({
        customerName: "Bad Guests",
        phone: "0300-1234567",
        date: tomorrow(),
        time: "19:00",
        guests: "20+",
      });

    expect(res.status).toBe(400);
  });

  it("rejects a malformed phone number", async () => {
    const res = await request(app)
      .post("/api/reservations")
      .send({
        customerName: "Bad Phone",
        phone: "abc",
        date: tomorrow(),
        time: "19:00",
        guests: "1-2",
      });

    expect(res.status).toBe(400);
  });

  it("rejects a request missing every field", async () => {
    const res = await request(app).post("/api/reservations").send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("GET /api/reservations/:id and cancel", () => {
  it("fetches then cancels a reservation it just created", async () => {
    const created = await request(app)
      .post("/api/reservations")
      .send({
        customerName: "Cancel Flow",
        phone: "0300-1234567",
        date: tomorrow(),
        time: "20:00",
        guests: "5-6",
      });
    const id = created.body.data.id;

    const fetched = await request(app).get(`/api/reservations/${id}`);
    expect(fetched.status).toBe(200);

    const cancelled = await request(app).post(`/api/reservations/${id}/cancel`);
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.data.status).toBe("CANCELLED");
  });

  it("404s for a reservation id that was never created", async () => {
    const res = await request(app).get("/api/reservations/RES-DOESNOTEXIST");
    expect(res.status).toBe(404);
  });
});

import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { registerCustomer, reservationBody, type TestCustomer } from "./helpers";

const app = createApp();

let customer: TestCustomer;
beforeAll(async () => {
  customer = await registerCustomer(app, { name: "Ahmed Khan" });
});

function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

describe("POST /api/reservations", () => {
  it("creates a reservation and takes name/email from the logged-in account", async () => {
    const res = await customer.agent.post("/api/reservations").send(
      reservationBody({ phone: "0300-1234567", time: "19:00", specialRequests: "Window seat please" })
    );

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toMatch(/^RES-/);
    expect(res.body.data.status).toBe("PENDING");
    expect(res.body.data.guests).toBe("3-4");
    expect(res.body.data.customerName).toBe("Ahmed Khan");
    expect(res.body.data.email).toBe(customer.email);
  });

  it("requires login", async () => {
    const res = await request(app).post("/api/reservations").send(reservationBody());
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("ignores a name/email sent by the client", async () => {
    const res = await customer.agent
      .post("/api/reservations")
      .send(reservationBody({ customerName: "Somebody Else", email: "other@example.com" }));
    expect(res.status).toBe(201);
    expect(res.body.data.customerName).toBe("Ahmed Khan");
    expect(res.body.data.email).toBe(customer.email);
  });

  it("rejects a reservation date in the past", async () => {
    const res = await customer.agent.post("/api/reservations").send(reservationBody({ date: "2020-01-01", guests: "1-2" }));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects a guests value the frontend select doesn't offer", async () => {
    const res = await customer.agent.post("/api/reservations").send(reservationBody({ date: tomorrow(), guests: "20+" }));
    expect(res.status).toBe(400);
  });

  it("rejects a malformed phone number", async () => {
    const res = await customer.agent.post("/api/reservations").send(reservationBody({ phone: "abc" }));
    expect(res.status).toBe(400);
  });

  it("rejects a request missing every field", async () => {
    const res = await customer.agent.post("/api/reservations").send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("cancelling a reservation", () => {
  it("lets the owner cancel their own reservation", async () => {
    const created = await customer.agent.post("/api/reservations").send(reservationBody({ time: "20:00", guests: "5-6" }));
    const id = created.body.data.id;

    const cancelled = await customer.agent.post(`/api/reservations/${id}/cancel`);
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.data.status).toBe("CANCELLED");

    const again = await customer.agent.post(`/api/reservations/${id}/cancel`);
    expect(again.status).toBe(409);
  });

  it("404s for a reservation id that was never created", async () => {
    const res = await customer.agent.post("/api/reservations/RES-DOESNOTEXIST/cancel");
    expect(res.status).toBe(404);
  });
});

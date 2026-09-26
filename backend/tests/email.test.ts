import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { env } from "../src/config/env";
import { escapeHtml, mailOutbox, type MailMessage } from "../src/services/email.service";
import { adminCookieHeader, orderBody, registerCustomer, reservationBody, type TestCustomer } from "./helpers";

const app = createApp();

let customer: TestCustomer;
beforeAll(async () => {
  customer = await registerCustomer(app, { name: "Email Diner" });
});
beforeEach(() => mailOutbox.clear());

const adminInbox = env.ADMIN_NOTIFY_EMAIL;

async function adminSetOrder(id: string, body: Record<string, unknown>) {
  return request(app).patch(`/api/admin/orders/${id}/status`).set("Cookie", await adminCookieHeader()).send(body);
}
async function adminSetReservation(id: string, body: Record<string, unknown>) {
  return request(app).patch(`/api/admin/reservations/${id}/status`).set("Cookie", await adminCookieHeader()).send(body);
}

describe("emails to the restaurant", () => {
  it("sends the admin a new-order email with the customer, order number, items and total", async () => {
    const res = await customer.agent
      .post("/api/orders")
      .send(orderBody({ phone: "0300-5550101", orderType: "delivery", deliveryAddress: "House 5, GT Road", specialInstructions: "No onions" }));
    expect(res.status).toBe(201);

    expect(mailOutbox.all()).toHaveLength(1);
    const mail = mailOutbox.all()[0] as MailMessage;
    expect(mail.to).toBe(adminInbox);
    expect(mail.subject).toContain(res.body.data.id);
    for (const expected of ["Email Diner", customer.email, "0300-5550101", res.body.data.id, "2 x Ba Zinga", "Rs. 1,348", "House 5, GT Road", "No onions", "Delivery"]) {
      expect(mail.text, expected).toContain(expected);
      expect(mail.html, expected).toContain(escapeHtml(expected));
    }
  });

  it("sends the admin a new-reservation email with name, email, date, time and guests", async () => {
    const body = reservationBody({ phone: "0300-5550102", time: "20:15", guests: "5-6", specialRequests: "Birthday" });
    const res = await customer.agent.post("/api/reservations").send(body);
    expect(res.status).toBe(201);

    expect(mailOutbox.all()).toHaveLength(1);
    const mail = mailOutbox.all()[0] as MailMessage;
    expect(mail.to).toBe(adminInbox);
    for (const expected of ["Email Diner", customer.email, res.body.data.id, String(body.date), "20:15", "5-6", "Birthday"]) {
      expect(mail.text, expected).toContain(expected);
    }
  });

  it("sends nothing when the order is rejected", async () => {
    const res = await customer.agent.post("/api/orders").send(orderBody({ items: [{ menuItemId: 999999, quantity: 1 }] }));
    expect(res.status).toBe(400);
    const anon = await request(app).post("/api/orders").send(orderBody());
    expect(anon.status).toBe(401);
    expect(mailOutbox.all()).toHaveLength(0);
  });
});

describe("emails to the customer about their order", () => {
  it("confirmation goes to the account's email, with number, summary, status and the admin's message", async () => {
    const order = (await customer.agent.post("/api/orders").send(orderBody())).body.data;
    mailOutbox.clear();

    await adminSetOrder(order.id, { status: "CONFIRMED", message: "Confirmed — ready in 25 minutes." });
    expect(mailOutbox.all()).toHaveLength(1);
    const mail = mailOutbox.all()[0] as MailMessage;
    expect(mail.to).toBe(customer.email);
    expect(mail.subject).toBe("Your Grill Out Order Has Been Confirmed");
    for (const expected of [order.id, "Confirmed", "2 x Ba Zinga", "Rs. 1,198", "Message from Grill Out", "Confirmed — ready in 25 minutes."]) {
      expect(mail.text, expected).toContain(expected);
    }
  });

  it("confirmation without a message has no message section — and no invented one", async () => {
    const order = (await customer.agent.post("/api/orders").send(orderBody())).body.data;
    mailOutbox.clear();
    await adminSetOrder(order.id, { status: "CONFIRMED" });
    const mail = mailOutbox.all()[0] as MailMessage;
    expect(mail.subject).toBe("Your Grill Out Order Has Been Confirmed");
    expect(mail.text).not.toContain("Message from Grill Out");
    expect(mail.html).not.toContain("Message from Grill Out");
  });

  it("cancellation email says Cancelled and includes the reason when given", async () => {
    const order = (await customer.agent.post("/api/orders").send(orderBody())).body.data;
    mailOutbox.clear();
    await adminSetOrder(order.id, { status: "CANCELLED", message: "Sorry, we cannot deliver to your area." });
    const mail = mailOutbox.all()[0] as MailMessage;
    expect(mail.to).toBe(customer.email);
    expect(mail.subject).toBe("Your Grill Out Order Has Been Cancelled");
    expect(mail.text).toContain("Cancelled");
    expect(mail.text).toContain("Sorry, we cannot deliver to your area.");
  });

  it("cancellation without a reason carries no reason at all", async () => {
    const order = (await customer.agent.post("/api/orders").send(orderBody())).body.data;
    mailOutbox.clear();
    await adminSetOrder(order.id, { status: "CANCELLED" });
    const mail = mailOutbox.all()[0] as MailMessage;
    expect(mail.subject).toBe("Your Grill Out Order Has Been Cancelled");
    expect(mail.text).not.toContain("Message from Grill Out");
    expect(mail.text).not.toMatch(/reason/i);
  });

  it("HTML-escapes the admin's message in the HTML body (plain text keeps it raw)", async () => {
    const order = (await customer.agent.post("/api/orders").send(orderBody())).body.data;
    mailOutbox.clear();
    const payload = `<script>alert(1)</script><a href="https://evil.example">click</a>`;
    await adminSetOrder(order.id, { status: "CONFIRMED", message: payload });
    const mail = mailOutbox.all()[0] as MailMessage;
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).not.toContain('<a href="https://evil.example">');
    expect(mail.html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(mail.text).toContain(payload);
  });

  it("other status changes email only when the admin wrote a message", async () => {
    const order = (await customer.agent.post("/api/orders").send(orderBody())).body.data;
    mailOutbox.clear();

    await adminSetOrder(order.id, { status: "PREPARING" });
    expect(mailOutbox.all()).toHaveLength(0);

    await adminSetOrder(order.id, { status: "READY", message: "Your order is ready for pickup." });
    expect(mailOutbox.all()).toHaveLength(1);
    expect((mailOutbox.all()[0] as MailMessage).subject).toContain("Ready");
    expect((mailOutbox.all()[0] as MailMessage).text).toContain("Your order is ready for pickup.");
  });

  it("a rejected status change sends nothing", async () => {
    const order = (await customer.agent.post("/api/orders").send(orderBody())).body.data;
    mailOutbox.clear();
    expect((await adminSetOrder(order.id, { status: "SHIPPED", message: "x" })).status).toBe(400);
    expect((await request(app).patch(`/api/admin/orders/${order.id}/status`).send({ status: "CONFIRMED" })).status).toBe(401);
    expect(mailOutbox.all()).toHaveLength(0);
  });
});

describe("emails to the customer about their reservation", () => {
  it("confirmation email, with the message", async () => {
    const reservation = (await customer.agent.post("/api/reservations").send(reservationBody({ time: "19:00" }))).body.data;
    mailOutbox.clear();
    await adminSetReservation(reservation.id, { status: "CONFIRMED", message: "Your table is reserved." });
    const mail = mailOutbox.all()[0] as MailMessage;
    expect(mail.to).toBe(customer.email);
    expect(mail.subject).toBe("Your Grill Out Table Reservation Is Confirmed");
    for (const expected of [reservation.id, "Confirmed", reservation.date, "19:00", "Message from Grill Out", "Your table is reserved."]) {
      expect(mail.text, expected).toContain(expected);
    }
  });

  it("cancellation email with and without a reason", async () => {
    const withReason = (await customer.agent.post("/api/reservations").send(reservationBody())).body.data;
    const without = (await customer.agent.post("/api/reservations").send(reservationBody())).body.data;
    mailOutbox.clear();

    await adminSetReservation(withReason.id, { status: "CANCELLED", message: "We are fully booked." });
    await adminSetReservation(without.id, { status: "CANCELLED" });

    const [a, b] = mailOutbox.all() as [MailMessage, MailMessage];
    expect(a.subject).toBe("Your Grill Out Table Reservation Has Been Cancelled");
    expect(a.text).toContain("We are fully booked.");
    expect(b.subject).toBe("Your Grill Out Table Reservation Has Been Cancelled");
    expect(b.text).not.toContain("Message from Grill Out");
  });
});

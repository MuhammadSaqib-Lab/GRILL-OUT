// /account — the customer's own orders, reservations and profile.
//
// The server decides who this is (from the session cookie) and only ever
// returns that customer's records; nothing here sends an id or email to ask
// for "someone's" data. Every value is escaped before it is put into the page,
// including the restaurant's messages (plain text, never HTML).

const root = document.getElementById("account-root");
const state = { me: null, orders: [], reservations: [], loadedAt: null, error: "" };

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "orders", label: "My Orders" },
  { key: "reservations", label: "My Reservations" },
  { key: "profile", label: "Profile" },
];

// ---- formatting ---------------------------------------------------------------

const money = (n) => `Rs. ${Number(n).toLocaleString("en-PK")}`;
const when = (iso) => new Date(iso).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" });

function prettyDate(ymd) {
  const d = new Date(`${ymd}T00:00:00`);
  return Number.isNaN(d.getTime()) ? ymd : d.toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "short", year: "numeric" });
}
function prettyTime(hm) {
  const [h, m] = String(hm).split(":").map(Number);
  if (Number.isNaN(h)) return hm;
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

const ORDER_STATUS = {
  PENDING: { label: "Pending", cls: "bg-amber-500/15 text-amber-400" },
  CONFIRMED: { label: "Confirmed", cls: "bg-blue-500/15 text-blue-400" },
  PREPARING: { label: "Preparing", cls: "bg-purple-500/15 text-purple-400" },
  READY: { label: "Ready", cls: "bg-cyan-500/15 text-cyan-400" },
  OUT_FOR_DELIVERY: { label: "Out for delivery", cls: "bg-orange-500/15 text-orange-400" },
  COMPLETED: { label: "Completed", cls: "bg-green-500/15 text-green-400" },
  CANCELLED: { label: "Cancelled", cls: "bg-red-500/15 text-red-400" },
};
const RESERVATION_STATUS = {
  PENDING: { label: "Pending", headline: "Pending", cls: "bg-amber-500/15 text-amber-400" },
  CONFIRMED: { label: "Confirmed", headline: "Confirmed", cls: "bg-blue-500/15 text-blue-400" },
  COMPLETED: { label: "Completed", headline: "Completed", cls: "bg-green-500/15 text-green-400" },
  CANCELLED: { label: "Cancelled", headline: "Cancelled", cls: "bg-red-500/15 text-red-400" },
};

const badge = (map, status) => {
  const s = map[status] || { label: status, cls: "bg-white/10 text-gray-300" };
  return `<span class="inline-flex rounded-full px-3 py-1 text-xs font-semibold ${s.cls}">${esc(s.label)}</span>`;
};

const messageBox = (message) =>
  message
    ? `<div class="mt-4 rounded-xl border border-flame/25 bg-flame/5 p-3.5">
         <p class="text-xs font-semibold uppercase tracking-wide text-flame">Message from Grill Out</p>
         <p class="mt-1 whitespace-pre-line text-sm leading-relaxed text-gray-200">${esc(message)}</p>
       </div>`
    : "";

// Simple progress steps for an order (there is no per-step history, so this
// shows how far along the CURRENT status is).
function orderTimeline(o) {
  if (o.status === "CANCELLED") {
    return `<p class="mt-4 flex items-center gap-2 text-sm font-semibold text-red-400"><span aria-hidden="true">✕</span> Order cancelled</p>`;
  }
  const steps =
    o.orderType === "delivery"
      ? [["PENDING", "Received"], ["CONFIRMED", "Confirmed"], ["PREPARING", "Preparing"], ["OUT_FOR_DELIVERY", "On the way"], ["COMPLETED", "Delivered"]]
      : [["PENDING", "Received"], ["CONFIRMED", "Confirmed"], ["PREPARING", "Preparing"], ["READY", "Ready"], ["COMPLETED", "Collected"]];
  let current = steps.findIndex(([key]) => key === o.status);
  if (current < 0) current = o.status === "READY" ? 3 : 0;
  return `<ol class="mt-4 flex items-start gap-1 text-[11px] sm:text-xs" aria-label="Order progress">${steps
    .map(([, label], i) => {
      const done = i <= current;
      return `<li class="flex-1 text-center" ${i === current ? 'aria-current="step"' : ""}>
        <span class="mx-auto flex h-6 w-6 items-center justify-center rounded-full border text-[11px] ${done ? "border-flame bg-flame text-white" : "border-white/15 text-gray-500"}" aria-hidden="true">${done ? "✓" : ""}</span>
        <span class="mt-1 block ${done ? "text-gray-200" : "text-gray-500"}">${esc(label)}</span>
      </li>`;
    })
    .join("")}</ol>`;
}

// ---- cards -----------------------------------------------------------------------

function orderCard(o) {
  const items = o.items
    .map((l) => `<li class="flex justify-between gap-3"><span>${esc(l.quantity)}× ${esc(l.name)}${l.optionLabel ? ` (${esc(l.optionLabel)})` : ""}</span><span class="text-gray-400">${esc(money(l.subtotal))}</span></li>`)
    .join("");
  return `<article class="rounded-2xl border border-white/5 bg-charcoal2 p-5" aria-label="Order ${esc(o.id)}">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 class="font-display text-xl tracking-wide">Order ${esc(o.id)}</h3>
        <p class="text-xs text-gray-400">${esc(when(o.createdAt))} · ${o.orderType === "delivery" ? "Delivery" : "Pickup"}</p>
      </div>
      ${badge(ORDER_STATUS, o.status)}
    </div>
    ${orderTimeline(o)}
    <ul class="mt-4 space-y-1 border-t border-white/5 pt-4 text-sm text-gray-300">${items}</ul>
    <dl class="mt-3 space-y-1 text-sm">
      ${o.deliveryFee ? `<div class="flex justify-between text-gray-400"><dt>Delivery fee</dt><dd>${esc(money(o.deliveryFee))}</dd></div>` : ""}
      <div class="flex justify-between font-semibold"><dt>Total</dt><dd class="text-flame">${esc(money(o.total))}</dd></div>
    </dl>
    ${o.deliveryAddress ? `<p class="mt-3 text-xs text-gray-400">Deliver to: ${esc(o.deliveryAddress)}</p>` : ""}
    ${messageBox(o.adminMessage)}
  </article>`;
}

function reservationCard(r) {
  const s = RESERVATION_STATUS[r.status] || { headline: r.status };
  return `<article class="rounded-2xl border border-white/5 bg-charcoal2 p-5" aria-label="Reservation ${esc(r.id)}">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 class="font-display text-xl tracking-wide">Table Reservation — ${esc(s.headline)}</h3>
        <p class="text-xs text-gray-400">Reservation ${esc(r.id)} · booked ${esc(when(r.createdAt))}</p>
      </div>
      ${badge(RESERVATION_STATUS, r.status)}
    </div>
    <dl class="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
      <div><dt class="text-xs uppercase tracking-wide text-gray-500">Date</dt><dd class="mt-0.5">${esc(prettyDate(r.date))}</dd></div>
      <div><dt class="text-xs uppercase tracking-wide text-gray-500">Time</dt><dd class="mt-0.5">${esc(prettyTime(r.time))}</dd></div>
      <div><dt class="text-xs uppercase tracking-wide text-gray-500">Guests</dt><dd class="mt-0.5">${esc(r.guests)}</dd></div>
      <div><dt class="text-xs uppercase tracking-wide text-gray-500">Name</dt><dd class="mt-0.5">${esc(r.customerName)}</dd></div>
      <div><dt class="text-xs uppercase tracking-wide text-gray-500">Phone</dt><dd class="mt-0.5">${esc(r.phone)}</dd></div>
      <div class="col-span-1 sm:col-span-2"><dt class="text-xs uppercase tracking-wide text-gray-500">Email</dt><dd class="mt-0.5 break-all">${esc(r.email || "")}</dd></div>
    </dl>
    ${r.specialRequests ? `<p class="mt-3 text-xs text-gray-400">Your request: ${esc(r.specialRequests)}</p>` : ""}
    ${messageBox(r.adminMessage)}
  </article>`;
}

const empty = (text, cta) =>
  `<div class="rounded-2xl border border-dashed border-white/10 bg-charcoal2 px-6 py-12 text-center">
     <p class="text-sm text-gray-400">${esc(text)}</p>
     ${cta ? `<a href="${esc(cta.href)}" class="mt-4 inline-block rounded-full border border-flame px-5 py-2 text-sm font-semibold text-flame transition hover:bg-flame hover:text-white">${esc(cta.label)}</a>` : ""}
   </div>`;

// ---- sections ---------------------------------------------------------------------

function overview() {
  const latestOrders = state.orders.slice(0, 3);
  const latestReservations = state.reservations.slice(0, 3);
  return `
    <div class="grid gap-4 sm:grid-cols-2">
      <a href="#orders" class="rounded-2xl border border-white/5 bg-charcoal2 p-5 transition hover:border-flame/40">
        <p class="text-xs uppercase tracking-wide text-gray-500">My Orders</p>
        <p class="mt-1 font-display text-4xl text-flame">${state.orders.length}</p>
        <p class="text-xs text-gray-400">${state.orders[0] ? `Latest: ${esc(ORDER_STATUS[state.orders[0].status]?.label || state.orders[0].status)}` : "No orders yet"}</p>
      </a>
      <a href="#reservations" class="rounded-2xl border border-white/5 bg-charcoal2 p-5 transition hover:border-flame/40">
        <p class="text-xs uppercase tracking-wide text-gray-500">My Reservations</p>
        <p class="mt-1 font-display text-4xl text-flame">${state.reservations.length}</p>
        <p class="text-xs text-gray-400">${state.reservations[0] ? `Latest: ${esc(RESERVATION_STATUS[state.reservations[0].status]?.label || state.reservations[0].status)}` : "No reservations yet"}</p>
      </a>
    </div>
    <h2 class="mt-10 font-display text-2xl tracking-wide">Recent Orders</h2>
    <div class="mt-3 space-y-4">${latestOrders.length ? latestOrders.map(orderCard).join("") : empty("You don't have any orders yet.", { href: "/#menu", label: "Browse the menu" })}</div>
    <h2 class="mt-10 font-display text-2xl tracking-wide">Recent Reservations</h2>
    <div class="mt-3 space-y-4">${latestReservations.length ? latestReservations.map(reservationCard).join("") : empty("You don't have any reservations yet.", { href: "/#reservations", label: "Book a table" })}</div>`;
}

function ordersSection() {
  return `<h2 class="font-display text-2xl tracking-wide">My Orders</h2>
    <div class="mt-3 space-y-4">${state.orders.length ? state.orders.map(orderCard).join("") : empty("You don't have any orders yet.", { href: "/#menu", label: "Browse the menu" })}</div>`;
}

function reservationsSection() {
  return `<h2 class="font-display text-2xl tracking-wide">My Reservations</h2>
    <div class="mt-3 space-y-4">${state.reservations.length ? state.reservations.map(reservationCard).join("") : empty("You don't have any reservations yet.", { href: "/#reservations", label: "Book a table" })}</div>`;
}

function profileSection() {
  return `<h2 class="font-display text-2xl tracking-wide">Profile</h2>
    <div class="mt-3 max-w-md rounded-2xl border border-white/5 bg-charcoal2 p-6">
      <dl class="space-y-4 text-sm">
        <div><dt class="text-xs uppercase tracking-wide text-gray-500">Name</dt><dd class="mt-0.5">${esc(state.me.name)}</dd></div>
        <div><dt class="text-xs uppercase tracking-wide text-gray-500">Email</dt><dd class="mt-0.5 break-all">${esc(state.me.email)}</dd></div>
      </dl>
      <button type="button" data-logout class="mt-6 w-full rounded-full border border-white/15 px-6 py-2.5 text-sm font-semibold text-white transition hover:border-red-500 hover:text-red-400">Log Out</button>
    </div>`;
}

const SECTIONS = { overview, orders: ordersSection, reservations: reservationsSection, profile: profileSection };
const currentTab = () => (SECTIONS[location.hash.slice(1)] ? location.hash.slice(1) : "overview");

function render() {
  const tab = currentTab();
  root.innerHTML = `
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p class="text-sm font-semibold uppercase tracking-widest text-flame">Account</p>
        <h1 class="font-display text-4xl tracking-wide sm:text-5xl">Welcome, ${esc(state.me.name)}</h1>
      </div>
      <div class="flex items-center gap-3 text-xs text-gray-400">
        ${state.loadedAt ? `<span>Updated ${esc(state.loadedAt.toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit" }))}</span>` : ""}
        <button type="button" data-refresh class="rounded-full border border-white/15 px-4 py-1.5 font-semibold text-gray-200 transition hover:border-flame hover:text-flame">Refresh</button>
      </div>
    </div>
    <nav aria-label="Account sections" class="mt-6 flex gap-2 overflow-x-auto border-b border-white/10 pb-3">
      ${TABS.map((t) => `<a href="#${t.key}" ${t.key === tab ? 'aria-current="page"' : ""} class="whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${t.key === tab ? "bg-flame text-white" : "text-gray-300 hover:text-flame"}">${esc(t.label)}</a>`).join("")}
    </nav>
    ${state.error ? `<p role="alert" class="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">${esc(state.error)}</p>` : ""}
    <section class="mt-8" aria-label="${esc(TABS.find((t) => t.key === tab).label)}">${SECTIONS[tab]()}</section>`;
  document.title = `${TABS.find((t) => t.key === tab).label} | Grill Out`;
}

// ---- data ---------------------------------------------------------------------------

async function load() {
  try {
    const [orders, reservations] = await Promise.all([apiFetch("/customer/orders"), apiFetch("/customer/reservations")]);
    if (orders.status === 401 || reservations.status === 401) {
      location.replace(loginUrl("/account/"));
      return;
    }
    if (!orders.ok || !reservations.ok) throw new Error("load failed");
    state.orders = orders.data;
    state.reservations = reservations.data;
    state.loadedAt = new Date();
    state.error = "";
  } catch {
    state.error = "We couldn't load your latest orders and reservations. Please check your connection and press Refresh.";
  }
  render();
}

async function logoutAndLeave() {
  await Account.logout();
  location.href = "/";
}

root.addEventListener("click", (e) => {
  if (e.target.closest("[data-refresh]")) load();
  if (e.target.closest("[data-logout]")) logoutAndLeave();
});
window.addEventListener("hashchange", () => {
  render();
  window.scrollTo({ top: 0 });
});

// The database is the source of truth: re-read it whenever the customer comes
// back to this tab, and every minute while it's open.
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && state.me) load();
});
setInterval(() => {
  if (!document.hidden && state.me) load();
}, 60000);

(async () => {
  const me = await Account.me();
  if (!me) {
    location.replace(loginUrl("/account/"));
    return;
  }
  state.me = me;
  render();
  load();
})();

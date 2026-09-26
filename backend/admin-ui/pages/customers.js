const state = { page: 1, search: "" };

function renderPage() {
  document.getElementById("page-content").innerHTML = `
    <div class="mb-4">
      <input id="f-search" type="search" aria-label="Search customers" placeholder="Search name, phone, or email…"
        class="w-full max-w-xs rounded-xl border border-white/10 bg-charcoal2 px-4 py-2 text-sm outline-none focus:border-flame" />
    </div>

    <div class="overflow-x-auto rounded-2xl border border-white/10 bg-charcoal2">
      <table class="w-full text-left text-sm">
          <caption class="sr-only">Customers</caption>
        <thead class="border-b border-white/10 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th scope="col" class="px-4 py-3">Customer</th>
            <th scope="col" class="px-4 py-3">Orders</th>
            <th scope="col" class="px-4 py-3">Total Spent</th>
            <th scope="col" class="px-4 py-3">Last Order</th>
            <th scope="col" class="px-4 py-3">Reservations</th>
            <th scope="col" class="px-4 py-3">Customer Since</th>
            <th scope="col" class="px-4 py-3"><span class="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody id="cust-tbody"></tbody>
      </table>
    </div>
    <div id="pagination-host"></div>
  `;

  document.getElementById("f-search").addEventListener("input", debounce((e) => {
    state.search = e.target.value.trim();
    state.page = 1;
    load();
  }));
}

async function load() {
  const tbody = document.getElementById("cust-tbody");
  tbody.innerHTML = loadingRow(7);
  try {
    const params = new URLSearchParams({ page: state.page, limit: 20 });
    if (state.search) params.set("search", state.search);
    const { data } = await AdminAPI.get(`/customers?${params}`);
    renderRows(data);
  } catch (err) {
    tbody.innerHTML = errorRow(7, `Failed to load customers: ${err.message}`);
  }
}

// A customer's order and reservation history, straight from the database.
async function openCustomer(id) {
  const { overlay } = openModal(
    `<div class="flex items-start justify-between">
        <h2 id="cust-modal-title" class="font-display text-2xl tracking-wide">Customer</h2>
        <button type="button" data-close aria-label="Close" class="rounded-lg p-1 text-gray-400 hover:text-white">${icon("x")}</button>
      </div>
      <div id="cust-body" class="mt-4 text-sm text-gray-400" aria-live="polite">Loading…</div>`,
    { labelId: "cust-modal-title", widthClass: "max-w-2xl" }
  );
  const body = overlay.querySelector("#cust-body");
  try {
    const { data: c } = await AdminAPI.get(`/customers/${encodeURIComponent(id)}`);
    const orders = c.orders.length
      ? c.orders
          .map(
            (o) => `<li class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/5 bg-charcoal px-3 py-2">
              <span><span class="font-mono text-xs text-gray-400">${esc(o.id)}</span> · ${esc(o.itemCount)} item${o.itemCount === 1 ? "" : "s"} · ${esc(formatMoney(o.total))}<br /><span class="text-xs text-gray-500">${esc(formatDate(o.createdAt))}</span>${o.adminMessage ? `<br /><span class="text-xs text-flame">Message: ${esc(o.adminMessage)}</span>` : ""}</span>
              ${statusBadge(o.status, ORDER_STATUS_STYLES)}</li>`
          )
          .join("")
      : `<li class="text-gray-500">No orders.</li>`;
    const reservations = c.reservations.length
      ? c.reservations
          .map(
            (r) => `<li class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/5 bg-charcoal px-3 py-2">
              <span><span class="font-mono text-xs text-gray-400">${esc(r.id)}</span> · ${esc(r.date)} ${esc(r.time)} · ${esc(r.guests)} guests<br /><span class="text-xs text-gray-500">Booked ${esc(formatDate(r.createdAt))}</span>${r.adminMessage ? `<br /><span class="text-xs text-flame">Message: ${esc(r.adminMessage)}</span>` : ""}</span>
              ${statusBadge(r.status, RESERVATION_STATUS_STYLES)}</li>`
          )
          .join("")
      : `<li class="text-gray-500">No reservations.</li>`;
    body.innerHTML = `
      <div class="rounded-xl border border-white/5 bg-charcoal p-3">
        <p class="font-medium text-white">${esc(c.name)} <span class="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-gray-300">${c.kind === "account" ? "Registered account" : "Guest (pre-accounts)"}</span></p>
        <p class="text-xs text-gray-500">${esc(c.email || "no email")}${c.phone ? " · " + esc(c.phone) : ""} · Customer since ${esc(formatDate(c.createdAt))}</p>
      </div>
      <h3 class="mt-5 font-display text-lg tracking-wide text-white">Orders (${c.orders.length})</h3>
      <ul class="mt-2 space-y-2">${orders}</ul>
      <h3 class="mt-5 font-display text-lg tracking-wide text-white">Reservations (${c.reservations.length})</h3>
      <ul class="mt-2 space-y-2">${reservations}</ul>`;
  } catch (err) {
    body.innerHTML = `<p class="text-red-400" role="alert">Failed to load customer: ${esc(err.message)}</p>`;
  }
}

function renderRows(result) {
  const tbody = document.getElementById("cust-tbody");
  tbody.innerHTML = "";
  if (result.items.length === 0) {
    tbody.innerHTML = emptyRow(7, "No customers match this search.");
    document.getElementById("pagination-host").innerHTML = "";
    return;
  }
  result.items.forEach((c) => {
    const tr = document.createElement("tr");
    tr.className = "border-b border-white/5 last:border-0 hover:bg-white/[0.03]";
    tr.innerHTML = `
      <td class="px-4 py-3">
        <p class="font-medium">${esc(c.name)}</p>
        <p class="text-xs text-gray-500">${esc(c.phone ?? "")}${c.phone && c.email ? " · " + esc(c.email) : ""}</p>
      </td>
      <td class="px-4 py-3 text-gray-300">${esc(c.totalOrders)}</td>
      <td class="px-4 py-3 font-medium">${esc(formatMoney(c.totalSpent))}</td>
      <td class="px-4 py-3 text-xs text-gray-500">${c.lastOrderAt ? esc(formatDate(c.lastOrderAt)) : "—"}</td>
      <td class="px-4 py-3 text-gray-300">${esc(c.reservationCount)}</td>
      <td class="px-4 py-3 text-xs text-gray-500">${esc(formatDate(c.createdAt))}</td>
      <td class="px-4 py-3 text-right"><button type="button" class="view-btn rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-gray-300 hover:border-flame hover:text-flame" aria-label="View ${esc(c.name)}">View</button></td>`;
    tr.querySelector(".view-btn").addEventListener("click", () => openCustomer(c.id));
    tbody.appendChild(tr);
  });

  const host = document.getElementById("pagination-host");
  host.innerHTML = "";
  host.appendChild(paginationControls(result, (p) => { state.page = p; load(); }));
}

(async () => {
  const profile = await mountShell("customers", "Customers");
  if (!profile) return;
  renderPage();
  onRefresh(load);
  load();
})();

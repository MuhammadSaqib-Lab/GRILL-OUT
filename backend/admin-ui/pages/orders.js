const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "COMPLETED", "CANCELLED"];
const state = { page: 1, status: "", orderType: "", search: "" };

function renderPage() {
  document.getElementById("page-content").innerHTML = `
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <input id="f-search" type="search" aria-label="Search orders" placeholder="Search order id, name, or phone…"
        class="w-full max-w-xs rounded-xl border border-white/10 bg-charcoal2 px-4 py-2 text-sm outline-none focus:border-flame sm:w-auto" />
      <select id="f-status" aria-label="Filter by status" class="rounded-xl border border-white/10 bg-charcoal2 px-3 py-2 text-sm outline-none focus:border-flame">
        <option value="">All statuses</option>
        ${ORDER_STATUSES.map((s) => `<option value="${s}">${s.replace(/_/g, " ")}</option>`).join("")}
      </select>
      <select id="f-type" aria-label="Filter by order type" class="rounded-xl border border-white/10 bg-charcoal2 px-3 py-2 text-sm outline-none focus:border-flame">
        <option value="">All types</option>
        <option value="pickup">Pickup</option>
        <option value="delivery">Delivery</option>
      </select>
    </div>

    <div class="overflow-x-auto rounded-2xl border border-white/10 bg-charcoal2">
      <table class="w-full text-left text-sm">
          <caption class="sr-only">Orders</caption>
        <caption class="sr-only">Orders</caption>
        <thead class="border-b border-white/10 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th scope="col" class="px-4 py-3">Order</th>
            <th scope="col" class="px-4 py-3">Customer</th>
            <th scope="col" class="px-4 py-3">Type</th>
            <th scope="col" class="px-4 py-3">Items</th>
            <th scope="col" class="px-4 py-3">Total</th>
            <th scope="col" class="px-4 py-3">Status</th>
            <th scope="col" class="px-4 py-3">Placed</th>
            <th scope="col" class="px-4 py-3"><span class="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody id="orders-tbody"></tbody>
      </table>
    </div>
    <div id="pagination-host"></div>
  `;

  document.getElementById("f-search").addEventListener("input", debounce((e) => {
    state.search = e.target.value.trim();
    state.page = 1;
    load();
  }));
  document.getElementById("f-status").addEventListener("change", (e) => {
    state.status = e.target.value;
    state.page = 1;
    load();
  });
  document.getElementById("f-type").addEventListener("change", (e) => {
    state.orderType = e.target.value;
    state.page = 1;
    load();
  });
}

function buildQuery() {
  const params = new URLSearchParams({ page: state.page, limit: 20 });
  if (state.status) params.set("status", state.status);
  if (state.orderType) params.set("orderType", state.orderType);
  if (state.search) params.set("search", state.search);
  return params.toString();
}

async function load() {
  const tbody = document.getElementById("orders-tbody");
  tbody.innerHTML = loadingRow(8);
  try {
    const { data } = await AdminAPI.get(`/orders?${buildQuery()}`);
    renderRows(data);
  } catch (err) {
    tbody.innerHTML = errorRow(8, `Failed to load orders: ${err.message}`);
  }
}

function renderRows(result) {
  const tbody = document.getElementById("orders-tbody");
  tbody.innerHTML = "";
  if (result.items.length === 0) {
    tbody.innerHTML = emptyRow(8, "No orders match these filters.");
  } else {
    result.items.forEach((o) => {
      const tr = document.createElement("tr");
      tr.className = "border-b border-white/5 last:border-0 hover:bg-white/[0.03]";
      tr.innerHTML = `
        <td class="px-4 py-3 font-mono text-xs text-gray-400">${esc(o.id)}</td>
        <td class="px-4 py-3">
          <p class="font-medium">${esc(o.customerName)}</p>
          <p class="text-xs text-gray-500">${esc(o.phone)}</p>
        </td>
        <td class="px-4 py-3 capitalize text-gray-300">${esc(o.orderType)}</td>
        <td class="px-4 py-3 text-gray-300">${esc(o.itemCount)}</td>
        <td class="px-4 py-3 font-medium">${esc(formatMoney(o.total))}</td>
        <td class="px-4 py-3">${statusBadge(o.status, ORDER_STATUS_STYLES)}</td>
        <td class="px-4 py-3 text-xs text-gray-500">${esc(formatDate(o.createdAt))}</td>
        <td class="px-4 py-3 text-right">
          <button data-id="${esc(o.id)}" aria-label="View order ${esc(o.id)}" class="view-btn rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-gray-300 hover:border-flame hover:text-flame">View</button>
        </td>`;
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll(".view-btn").forEach((btn) =>
      btn.addEventListener("click", () => openDetail(btn.dataset.id))
    );
  }

  const host = document.getElementById("pagination-host");
  host.innerHTML = "";
  host.appendChild(paginationControls(result, (p) => { state.page = p; load(); }));
}

const NEXT_STATUS = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY"],
  READY: ["OUT_FOR_DELIVERY", "COMPLETED"],
  OUT_FOR_DELIVERY: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

const MESSAGE_MAX = 500;

// One entry per status an admin can move an order to: the button/heading text,
// the submit-button text, and an example to hint at what a good message looks like.
const STATUS_ACTIONS = {
  CONFIRMED: { label: "Confirm Order", submit: "Confirm Order", hint: "Your order has been confirmed and is now being prepared." },
  PREPARING: { label: "Start Preparing", submit: "Confirm Status Change", hint: "Your food is on the grill." },
  READY: { label: "Mark as Ready", submit: "Confirm Status Change", hint: "Your order is ready for pickup." },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", submit: "Confirm Status Change", hint: "Our rider is on the way to you." },
  COMPLETED: { label: "Complete Order", submit: "Confirm Status Change", hint: "Thank you for ordering from Grill Out!" },
  CANCELLED: {
    label: "Cancel Order",
    submit: "Cancel Order",
    hint: "Sorry, we are currently unable to deliver to your area.",
    messageLabel: "Reason / Message to Customer (Optional)",
    back: "Keep Order",
  },
};

// Shows the optional-message form for one status change. The order is never
// deleted: "Cancel Order" just sets its status to CANCELLED.
function openStatusPanel(body, id, newStatus, closeModal) {
  const action = STATUS_ACTIONS[newStatus];
  const danger = newStatus === "CANCELLED";
  const panel = body.querySelector("#status-panel");
  body.querySelector("#status-actions").classList.add("hidden");
  panel.classList.remove("hidden");
  panel.innerHTML = `
    <form id="status-form" class="rounded-xl border ${danger ? "border-red-500/30" : "border-white/10"} bg-charcoal p-4" novalidate>
      <h3 id="status-panel-title" class="font-display text-lg tracking-wide ${danger ? "text-red-400" : "text-white"}">${esc(action.label)}</h3>
      <label for="status-message" class="mt-3 block text-xs font-medium text-gray-400">${esc(action.messageLabel || "Message to Customer (Optional)")}</label>
      <textarea id="status-message" rows="3" maxlength="${MESSAGE_MAX}" aria-describedby="status-message-help"
        class="mt-1 w-full resize-none rounded-xl border border-white/10 bg-charcoal2 px-3.5 py-2 text-sm text-white outline-none focus:border-flame"></textarea>
      <div id="status-message-help" class="mt-1 flex justify-between gap-3 text-xs text-gray-500">
        <span>Shown to the customer with their order status. Leave blank to send none.</span>
        <span id="status-message-count" aria-live="off">0/${MESSAGE_MAX}</span>
      </div>
      <p id="status-error" role="alert" class="mt-2 hidden rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400"></p>
      <div class="mt-4 flex flex-wrap justify-end gap-2">
        <button type="button" id="status-back" class="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-gray-300 hover:border-white/30">${esc(action.back || "Back")}</button>
        <button type="submit" id="status-submit" class="rounded-full px-4 py-2 text-xs font-semibold text-white disabled:opacity-60 ${danger ? "bg-red-600 hover:bg-red-500" : "bg-flame hover:bg-flame-light"}">${esc(action.submit)}</button>
      </div>
    </form>`;

  const textarea = panel.querySelector("#status-message");
  const counter = panel.querySelector("#status-message-count");
  const errorEl = panel.querySelector("#status-error");
  textarea.placeholder = `e.g. ${action.hint}`;
  textarea.focus();
  textarea.addEventListener("input", () => (counter.textContent = `${textarea.value.length}/${MESSAGE_MAX}`));

  panel.querySelector("#status-back").addEventListener("click", () => {
    panel.classList.add("hidden");
    panel.innerHTML = "";
    const actions = body.querySelector("#status-actions");
    actions.classList.remove("hidden");
    actions.querySelector(`[data-status="${newStatus}"]`)?.focus();
  });

  panel.querySelector("#status-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.classList.add("hidden");
    const message = textarea.value.trim();
    if (message.length > MESSAGE_MAX) {
      errorEl.textContent = `Message must be ${MESSAGE_MAX} characters or fewer.`;
      errorEl.classList.remove("hidden");
      return;
    }
    const submit = panel.querySelector("#status-submit");
    submit.disabled = true;
    try {
      await AdminAPI.patch(`/orders/${encodeURIComponent(id)}/status`, { status: newStatus, message: message || null });
      showToast(`Order ${id} ${danger ? "cancelled" : "marked as " + newStatus.replace(/_/g, " ")}${message ? " — message saved to their account" : ""}`);
      closeModal();
      load();
    } catch (err) {
      const detail = err.details && Object.values(err.details)[0]?.[0];
      errorEl.textContent = detail || err.message;
      errorEl.classList.remove("hidden");
      submit.disabled = false;
    }
  });
}

async function openDetail(id) {
  const { overlay, close } = openModal(
    `<div class="flex items-start justify-between">
        <h2 id="order-modal-title" class="font-display text-2xl tracking-wide">Order ${esc(id)}</h2>
        <button type="button" data-close aria-label="Close" class="rounded-lg p-1 text-gray-400 hover:text-white">${icon("x")}</button>
      </div>
      <div id="detail-body" class="mt-4 text-sm text-gray-400" aria-live="polite">Loading…</div>`,
    { labelId: "order-modal-title" }
  );

  try {
    const { data: order } = await AdminAPI.get(`/orders/${encodeURIComponent(id)}`);
    const body = overlay.querySelector("#detail-body");
    const nextOptions = NEXT_STATUS[order.status] || [];
    body.innerHTML = `
      <div class="flex items-center justify-between">
        <div>
          <p class="font-medium text-white">${esc(order.customerName)}</p>
          <p class="text-xs text-gray-500">${esc(order.phone)}${order.email ? " · " + esc(order.email) : ""}</p>
        </div>
        ${statusBadge(order.status, ORDER_STATUS_STYLES)}
      </div>
      ${
        order.adminMessage
          ? `<div class="mt-4 rounded-xl border border-flame/20 bg-flame/5 p-3">
              <p class="text-xs font-medium uppercase tracking-wide text-flame">Message shown to customer</p>
              <p class="mt-1 whitespace-pre-line text-sm text-gray-200">${esc(order.adminMessage)}</p>
            </div>`
          : ""
      }
      <div class="mt-4 rounded-xl border border-white/5 bg-charcoal p-3">
        <p class="text-xs uppercase tracking-wide text-gray-500">${esc(order.orderType)}${order.deliveryAddress ? " · " + esc(order.deliveryAddress) : ""}</p>
        ${order.specialInstructions ? `<p class="mt-1 text-xs text-gray-400">Note: ${esc(order.specialInstructions)}</p>` : ""}
      </div>
      <div class="mt-4 divide-y divide-white/5 rounded-xl border border-white/5">
        ${order.items
          .map(
            (line) => `
          <div class="flex items-center justify-between px-3 py-2 text-sm">
            <span>${esc(line.quantity)}× ${esc(line.name)}${line.optionLabel ? ` (${esc(line.optionLabel)})` : ""}</span>
            <span class="text-gray-400">${esc(formatMoney(line.subtotal))}</span>
          </div>`
          )
          .join("")}
      </div>
      <div class="mt-4 space-y-1 text-sm">
        <div class="flex justify-between text-gray-400"><span>Subtotal</span><span>${esc(formatMoney(order.subtotal))}</span></div>
        <div class="flex justify-between text-gray-400"><span>Delivery Fee</span><span>${esc(formatMoney(order.deliveryFee))}</span></div>
        <div class="flex justify-between font-display text-lg text-flame"><span>Total</span><span>${esc(formatMoney(order.total))}</span></div>
      </div>
      ${
        nextOptions.length
          ? `<div id="status-actions" class="mt-5">
              <p class="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Change Order Status</p>
              <div class="flex flex-wrap gap-2">
                ${nextOptions
                  .map(
                    (s) =>
                      `<button type="button" data-status="${esc(s)}" class="status-btn rounded-full border px-3.5 py-1.5 text-xs font-semibold ${s === "CANCELLED" ? "border-red-500/40 text-red-400 hover:border-red-500" : "border-white/10 hover:border-flame hover:text-flame"}">${esc(STATUS_ACTIONS[s].label)}</button>`
                  )
                  .join("")}
              </div>
            </div>
            <div id="status-panel" class="mt-5 hidden"></div>`
          : `<p class="mt-5 text-xs text-gray-500">This order is in a final state and can no longer be updated.</p>`
      }
    `;

    body.querySelectorAll(".status-btn").forEach((btn) =>
      btn.addEventListener("click", () => openStatusPanel(body, id, btn.dataset.status, close))
    );
  } catch (err) {
    overlay.querySelector("#detail-body").innerHTML = `<p class="text-red-400" role="alert">Failed to load order: ${esc(err.message)}</p>`;
  }
}

(async () => {
  const profile = await mountShell("orders", "Orders");
  if (!profile) return;
  renderPage();
  onRefresh(load);
  load();
})();

const RES_STATUSES = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];
const NEXT_STATUS = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};
const state = { page: 1, status: "", when: "", search: "" };

function renderPage() {
  document.getElementById("page-content").innerHTML = `
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <input id="f-search" type="search" aria-label="Search reservations" placeholder="Search name or phone…"
        class="w-full max-w-xs rounded-xl border border-white/10 bg-charcoal2 px-4 py-2 text-sm outline-none focus:border-flame sm:w-auto" />
      <select id="f-when" aria-label="Filter by date" class="rounded-xl border border-white/10 bg-charcoal2 px-3 py-2 text-sm outline-none focus:border-flame">
        <option value="">All dates</option>
        <option value="today">Today</option>
        <option value="upcoming">Upcoming</option>
      </select>
      <select id="f-status" aria-label="Filter by status" class="rounded-xl border border-white/10 bg-charcoal2 px-3 py-2 text-sm outline-none focus:border-flame">
        <option value="">All statuses</option>
        ${RES_STATUSES.map((s) => `<option value="${s}">${s}</option>`).join("")}
      </select>
    </div>

    <div class="overflow-x-auto rounded-2xl border border-white/10 bg-charcoal2">
      <table class="w-full text-left text-sm">
          <caption class="sr-only">Reservations</caption>
        <thead class="border-b border-white/10 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th scope="col" class="px-4 py-3">Guest</th>
            <th scope="col" class="px-4 py-3">Date &amp; Time</th>
            <th scope="col" class="px-4 py-3">Guests</th>
            <th scope="col" class="px-4 py-3">Notes</th>
            <th scope="col" class="px-4 py-3">Status</th>
            <th scope="col" class="px-4 py-3"><span class="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody id="res-tbody"></tbody>
      </table>
    </div>
    <div id="pagination-host"></div>
  `;

  document.getElementById("f-search").addEventListener("input", debounce((e) => {
    state.search = e.target.value.trim();
    state.page = 1;
    load();
  }));
  document.getElementById("f-when").addEventListener("change", (e) => {
    state.when = e.target.value;
    state.page = 1;
    load();
  });
  document.getElementById("f-status").addEventListener("change", (e) => {
    state.status = e.target.value;
    state.page = 1;
    load();
  });
}

function buildQuery() {
  const params = new URLSearchParams({ page: state.page, limit: 20 });
  if (state.status) params.set("status", state.status);
  if (state.when) params.set("when", state.when);
  if (state.search) params.set("search", state.search);
  return params.toString();
}

async function load() {
  const tbody = document.getElementById("res-tbody");
  tbody.innerHTML = loadingRow(6);
  try {
    const { data } = await AdminAPI.get(`/reservations?${buildQuery()}`);
    renderRows(data);
  } catch (err) {
    tbody.innerHTML = errorRow(6, `Failed to load reservations: ${err.message}`);
  }
}

const MESSAGE_MAX = 500;
const ACTIONS = {
  CONFIRMED: { title: "Confirm Reservation", submit: "Confirm Reservation", hint: "Your table is reserved. We look forward to seeing you!" },
  COMPLETED: { title: "Complete Reservation", submit: "Confirm Status Change", hint: "Thank you for dining with us!" },
  CANCELLED: {
    title: "Cancel Reservation",
    submit: "Cancel Reservation",
    label: "Reason / Message to Customer (Optional)",
    hint: "Sorry, we are fully booked at that time.",
    back: "Keep Reservation",
  },
};

// Optional message to the customer, saved with the status change and shown in
// their account (and emailed). Cancelling only changes the status — the
// reservation record is never deleted.
function openStatusModal(id, status, customerName) {
  const action = ACTIONS[status];
  const danger = status === "CANCELLED";
  const { overlay, close } = openModal(
    `<div class="flex items-start justify-between">
        <h2 id="res-modal-title" class="font-display text-2xl tracking-wide ${danger ? "text-red-400" : ""}">${esc(action.title)}</h2>
        <button type="button" data-close aria-label="Close" class="rounded-lg p-1 text-gray-400 hover:text-white">${icon("x")}</button>
      </div>
      <p class="mt-1 text-xs text-gray-500">${esc(id)} · ${esc(customerName)}</p>
      <form id="res-status-form" class="mt-4" novalidate>
        <label for="res-status-message" class="block text-xs font-medium text-gray-400">${esc(action.label || "Message to Customer (Optional)")}</label>
        <textarea id="res-status-message" rows="3" maxlength="${MESSAGE_MAX}" aria-describedby="res-status-help"
          class="mt-1 w-full resize-none rounded-xl border border-white/10 bg-charcoal px-3.5 py-2 text-sm text-white outline-none focus:border-flame"></textarea>
        <div id="res-status-help" class="mt-1 flex justify-between gap-3 text-xs text-gray-500">
          <span>Shown to the customer with their reservation status. Leave blank to send none.</span>
          <span id="res-status-count">0/${MESSAGE_MAX}</span>
        </div>
        <p id="res-status-error" role="alert" class="mt-2 hidden rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400"></p>
        <div class="mt-4 flex flex-wrap justify-end gap-2">
          <button type="button" data-close class="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-gray-300 hover:border-white/30">${esc(action.back || "Back")}</button>
          <button type="submit" id="res-status-submit" class="rounded-full px-4 py-2 text-xs font-semibold text-white disabled:opacity-60 ${danger ? "bg-red-600 hover:bg-red-500" : "bg-flame hover:bg-flame-light"}">${esc(action.submit)}</button>
        </div>
      </form>`,
    { labelId: "res-modal-title", widthClass: "max-w-md" }
  );

  const textarea = overlay.querySelector("#res-status-message");
  const errorEl = overlay.querySelector("#res-status-error");
  textarea.placeholder = `e.g. ${action.hint}`;
  textarea.addEventListener("input", () => (overlay.querySelector("#res-status-count").textContent = `${textarea.value.length}/${MESSAGE_MAX}`));

  overlay.querySelector("#res-status-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.classList.add("hidden");
    const submit = overlay.querySelector("#res-status-submit");
    const message = textarea.value.trim();
    submit.disabled = true;
    try {
      await AdminAPI.patch(`/reservations/${encodeURIComponent(id)}/status`, { status, message: message || null });
      showToast(`Reservation ${danger ? "cancelled" : "marked as " + status}${message ? " — message saved to their account" : ""}`);
      close();
      load();
    } catch (err) {
      const detail = err.details && Object.values(err.details)[0]?.[0];
      errorEl.textContent = detail || err.message;
      errorEl.classList.remove("hidden");
      submit.disabled = false;
    }
  });
}

function renderRows(result) {
  const tbody = document.getElementById("res-tbody");
  tbody.innerHTML = "";
  if (result.items.length === 0) {
    tbody.innerHTML = emptyRow(6, "No reservations match these filters.");
    document.getElementById("pagination-host").innerHTML = "";
    return;
  }
  result.items.forEach((r) => {
    const tr = document.createElement("tr");
    tr.className = "border-b border-white/5 last:border-0 hover:bg-white/[0.03]";
    const nextOptions = NEXT_STATUS[r.status] || [];
    tr.innerHTML = `
      <td class="px-4 py-3">
        <p class="font-medium">${esc(r.customerName)}</p>
        <p class="text-xs text-gray-500">${esc(r.phone)}${r.email ? " · " + esc(r.email) : ""}</p>
      </td>
      <td class="px-4 py-3 text-gray-300">${esc(r.date)} · ${esc(r.time)}</td>
      <td class="px-4 py-3 text-gray-300">${esc(r.guests)}</td>
      <td class="px-4 py-3 max-w-xs text-xs text-gray-500">
        <p class="truncate" title="${esc(r.specialRequests || "")}">${esc(r.specialRequests || "—")}</p>
        ${r.adminMessage ? `<p class="mt-1 truncate text-flame" title="${esc(r.adminMessage)}">Sent: ${esc(r.adminMessage)}</p>` : ""}
      </td>
      <td class="px-4 py-3">${statusBadge(r.status, RESERVATION_STATUS_STYLES)}</td>
      <td class="px-4 py-3 text-right">
        <div class="flex justify-end gap-2">
          ${nextOptions
            .map(
              (s) =>
                `<button type="button" data-id="${esc(r.id)}" data-status="${esc(s)}" data-name="${esc(r.customerName)}" aria-label="${s === "CANCELLED" ? "Cancel" : s === "COMPLETED" ? "Complete" : "Confirm"} reservation for ${esc(r.customerName)}" class="status-btn rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold hover:border-flame hover:text-flame">${s === "CANCELLED" ? "Cancel" : s === "COMPLETED" ? "Complete" : "Confirm"}</button>`
            )
            .join("")}
        </div>
      </td>`;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll(".status-btn").forEach((btn) =>
    btn.addEventListener("click", () => openStatusModal(btn.dataset.id, btn.dataset.status, btn.dataset.name))
  );

  const host = document.getElementById("pagination-host");
  host.innerHTML = "";
  host.appendChild(paginationControls(result, (p) => { state.page = p; load(); }));
}

(async () => {
  const profile = await mountShell("reservations", "Reservations");
  if (!profile) return;
  renderPage();
  onRefresh(load);
  load();
})();

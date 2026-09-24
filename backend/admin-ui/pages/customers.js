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
  tbody.innerHTML = loadingRow(6);
  try {
    const params = new URLSearchParams({ page: state.page, limit: 20 });
    if (state.search) params.set("search", state.search);
    const { data } = await AdminAPI.get(`/customers?${params}`);
    renderRows(data);
  } catch (err) {
    tbody.innerHTML = errorRow(6, `Failed to load customers: ${err.message}`);
  }
}

function renderRows(result) {
  const tbody = document.getElementById("cust-tbody");
  tbody.innerHTML = "";
  if (result.items.length === 0) {
    tbody.innerHTML = emptyRow(6, "No customers match this search.");
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
      <td class="px-4 py-3 text-xs text-gray-500">${esc(formatDate(c.createdAt))}</td>`;
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

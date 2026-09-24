async function load() {
  const grid = document.getElementById("stats-grid");
  const statusGrid = document.getElementById("status-grid");
  const popularList = document.getElementById("popular-list");
  grid.innerHTML = `<p class="col-span-full text-sm text-gray-500">Loading stats…</p>`;

  try {
    const { data } = await AdminAPI.get("/dashboard");
    renderStats(data.stats);
    renderStatusBreakdown(data.stats.ordersByStatus);
    renderPopular(data.popularItems || []);
  } catch (err) {
    grid.innerHTML = `<p class="col-span-full text-sm text-red-400" role="alert">Failed to load dashboard: ${esc(err.message)}</p>`;
  }
}

function statCard(label, value, sub) {
  const el = document.createElement("div");
  el.className = "rounded-2xl border border-white/10 bg-charcoal2 p-5";
  el.innerHTML = `
    <p class="text-xs font-medium uppercase tracking-wide text-gray-500">${esc(label)}</p>
    <p class="mt-2 font-display text-3xl tracking-wide text-white">${esc(value)}</p>
    ${sub ? `<p class="mt-1 text-xs text-gray-500">${esc(sub)}</p>` : ""}`;
  return el;
}

function renderStats(data) {
  const grid = document.getElementById("stats-grid");
  grid.innerHTML = "";
  grid.append(
    statCard("Orders Today", data.todaysOrders, `${data.totalOrders} all-time`),
    statCard("Pending Orders", data.pendingOrders, "Needs attention"),
    statCard("Revenue Today", formatMoney(data.revenueToday), `${formatMoney(data.revenueThisWeek)} this week`),
    statCard("Revenue This Month", formatMoney(data.revenueThisMonth), ""),
    statCard("Reservations Today", data.todaysReservations, `${data.totalReservations} all-time`),
    statCard("Total Customers", data.totalCustomers, "")
  );
}

function renderStatusBreakdown(byStatus) {
  const wrap = document.getElementById("status-grid");
  wrap.innerHTML = "";
  const entries = Object.entries(byStatus || {});
  if (entries.length === 0) {
    wrap.innerHTML = `<p class="text-sm text-gray-500">No order data yet.</p>`;
    return;
  }
  entries.forEach(([status, count]) => {
    const row = document.createElement("div");
    row.className = "flex items-center justify-between rounded-xl border border-white/5 bg-charcoal px-4 py-3";
    row.innerHTML = `${statusBadge(status, ORDER_STATUS_STYLES)}<span class="font-display text-xl">${esc(count)}</span>`;
    wrap.appendChild(row);
  });
}

function renderPopular(items) {
  const wrap = document.getElementById("popular-list");
  wrap.innerHTML = "";
  if (items.length === 0) {
    wrap.innerHTML = `<p class="text-sm text-gray-500">Not enough order history yet to rank popular items.</p>`;
    return;
  }
  items.forEach((item, i) => {
    const row = document.createElement("div");
    row.className = "flex items-center gap-4 rounded-xl border border-white/5 bg-charcoal px-4 py-3";
    row.innerHTML = `
      <span class="font-display w-6 text-lg text-flame" aria-hidden="true">${i + 1}</span>
      ${item.image ? `<img src="${esc(item.image)}" alt="" loading="lazy" class="h-10 w-10 rounded-lg object-cover" />` : `<div class="h-10 w-10 rounded-lg bg-white/5"></div>`}
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-medium">${esc(item.name)}</p>
        <p class="text-xs text-gray-500">${esc(item.quantitySold)} sold · ${esc(formatMoney(item.revenue))}</p>
      </div>`;
    wrap.appendChild(row);
  });
}

(async () => {
  const profile = await mountShell("dashboard", "Dashboard");
  if (!profile) return;

  document.getElementById("page-content").innerHTML = `
    <div id="stats-grid" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"></div>

    <div class="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div>
        <h2 class="mb-3 font-display text-xl tracking-wide">Orders by Status</h2>
        <div id="status-grid" class="flex flex-col gap-2"></div>
      </div>
      <div>
        <h2 class="mb-3 font-display text-xl tracking-wide">Popular Items</h2>
        <div id="popular-list" class="flex flex-col gap-2"></div>
      </div>
    </div>`;

  onRefresh(load);
  load();
})();

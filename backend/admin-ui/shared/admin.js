// ============================================================
// Grill Out Admin — shared shell, auth guard, API helper, and
// small reusable UI pieces (toast, confirm dialog). Loaded by
// every admin-ui page except login.html.
//
// Security note: this file does NOT protect anything by itself.
// It redirects to the login page for a nicer UX when a session is
// missing/expired, but the real protection is server-side —
// every fetch below hits /api/admin/* which requireAdmin verifies
// on every single request (see backend/src/middleware/requireAdmin.ts).
// ============================================================

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", href: "dashboard.html", icon: "layout-dashboard" },
  { key: "orders", label: "Orders", href: "orders.html", icon: "receipt" },
  { key: "menu", label: "Menu", href: "menu.html", icon: "utensils" },
  { key: "reservations", label: "Reservations", href: "reservations.html", icon: "calendar" },
  { key: "customers", label: "Customers", href: "customers.html", icon: "users" },
  { key: "messages", label: "Messages", href: "messages.html", icon: "mail" },
  { key: "newsletter", label: "Newsletter", href: "newsletter.html", icon: "send" },
  { key: "settings", label: "Settings", href: "settings.html", icon: "settings" },
];

// Minimal inline icon set (no icon-font/CDN dependency) — just enough
// strokes to read clearly at sidebar size.
const ICONS = {
  "layout-dashboard": '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  receipt: '<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2V3z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  utensils: '<path d="M7 3v7a2 2 0 0 0 2 2v9M7 3v7M11 3v7M11 12h-.01M17 3c-2 1-3 3-3 6v12"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6M16 8.5a3.5 3.5 0 1 1 0 .01M21.5 20c0-3-2-5.3-4.8-5.9"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  send: '<path d="m3 11 18-8-8 18-2-8-8-2z"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.14.36.4.66.73.85.24.14.5.22.78.24H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  menu: '<path d="M3 12h18M3 6h18M3 18h18"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6"/>',
};

function icon(name, cls = "h-5 w-5") {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${cls}">${ICONS[name] || ""}</svg>`;
}

// ---- API helper -------------------------------------------------------------

const AdminAPI = {
  async request(path, options = {}) {
    const res = await fetch(`/api/admin${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
    });

    if (res.status === 401) {
      if (!location.pathname.endsWith("login.html")) {
        location.href = "login.html";
      }
      throw new Error("Not authenticated");
    }

    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.success) {
      const message = body?.error?.message || `Request failed (${res.status})`;
      const err = new Error(message);
      err.details = body?.error?.details;
      throw err;
    }
    return body;
  },
  get(path) {
    return this.request(path);
  },
  post(path, data) {
    return this.request(path, { method: "POST", body: JSON.stringify(data ?? {}) });
  },
  patch(path, data) {
    return this.request(path, { method: "PATCH", body: JSON.stringify(data ?? {}) });
  },
  delete(path) {
    return this.request(path, { method: "DELETE" });
  },
};

// ---- Auth guard ---------------------------------------------------------------

async function requireAuth() {
  try {
    const { data } = await AdminAPI.get("/auth/me");
    return data;
  } catch {
    location.href = "login.html";
    return null;
  }
}

async function logout() {
  try {
    await AdminAPI.post("/auth/logout");
  } finally {
    location.href = "login.html";
  }
}

// ---- Shell (sidebar + topbar) --------------------------------------------------

function renderShell(activeKey) {
  const root = document.getElementById("admin-shell");
  if (!root) return;

  const navLinks = NAV_ITEMS.map(
    (item) => `
    <a href="${item.href}" data-nav="${item.key}"
      class="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition
        ${item.key === activeKey ? "bg-flame/15 text-flame" : "text-gray-400 hover:bg-white/5 hover:text-white"}">
      ${icon(item.icon, "h-[18px] w-[18px] shrink-0")}
      <span>${item.label}</span>
    </a>`
  ).join("");

  root.innerHTML = `
    <div class="flex min-h-screen bg-charcoal text-white">
      <!-- Mobile sidebar backdrop -->
      <div id="sidebar-backdrop" class="fixed inset-0 z-30 hidden bg-black/60 lg:hidden"></div>

      <!-- Sidebar -->
      <aside id="sidebar" class="fixed inset-y-0 left-0 z-40 w-64 -translate-x-full border-r border-white/5 bg-charcoal2 transition-transform lg:static lg:translate-x-0">
        <div class="flex h-16 items-center gap-2 border-b border-white/5 px-5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-6 w-6 text-flame">
            <path d="M12.5 1.5c1 3-2 4.5-2 7.5a2.5 2.5 0 0 0 5 0c0-.6-.2-1.1-.5-1.6 2 1 3.5 3 3.5 5.6a6.5 6.5 0 1 1-13 0c0-4 2.5-6 4-8.5.7-1.1 1.3-2.1 3-3z"/>
          </svg>
          <span class="font-display text-lg tracking-wider">GRILL <span class="text-flame">OUT</span></span>
          <span class="ml-auto rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">Admin</span>
        </div>
        <nav class="flex flex-col gap-1 p-3">${navLinks}</nav>
      </aside>

      <!-- Main -->
      <div class="flex min-h-screen flex-1 flex-col">
        <!-- Topbar -->
        <header class="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-white/5 bg-charcoal/90 px-4 backdrop-blur sm:px-6">
          <button id="sidebar-toggle" type="button" class="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white lg:hidden" aria-label="Toggle menu">
            ${icon("menu")}
          </button>
          <h1 id="page-title" class="font-display text-xl tracking-wide sm:text-2xl"></h1>
          <div class="ml-auto flex items-center gap-3">
            <button id="refresh-btn" type="button" class="hidden items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-gray-300 transition hover:border-flame hover:text-flame sm:flex" aria-label="Refresh data">
              ${icon("refresh", "h-3.5 w-3.5")} Refresh
            </button>
            <div class="hidden text-right sm:block">
              <p id="admin-name" class="text-sm font-medium leading-tight">…</p>
              <p id="admin-email" class="text-xs leading-tight text-gray-500"></p>
            </div>
            <button id="logout-btn" type="button" class="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-gray-300 transition hover:border-red-500 hover:text-red-400" aria-label="Log out">
              ${icon("logout", "h-3.5 w-3.5")} <span class="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        <main id="page-content" class="flex-1 p-4 sm:p-6 lg:p-8"></main>
      </div>
    </div>`;

  document.getElementById("logout-btn").addEventListener("click", logout);

  const sidebar = document.getElementById("sidebar");
  const backdrop = document.getElementById("sidebar-backdrop");
  const openSidebar = () => {
    sidebar.classList.remove("-translate-x-full");
    backdrop.classList.remove("hidden");
  };
  const closeSidebar = () => {
    sidebar.classList.add("-translate-x-full");
    backdrop.classList.add("hidden");
  };
  document.getElementById("sidebar-toggle").addEventListener("click", openSidebar);
  backdrop.addEventListener("click", closeSidebar);
  sidebar.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeSidebar));
}

function setPageTitle(title) {
  const el = document.getElementById("page-title");
  if (el) el.textContent = title;
}

function onRefresh(handler) {
  const btn = document.getElementById("refresh-btn");
  if (!btn) return;
  btn.classList.remove("hidden");
  btn.addEventListener("click", handler);
}

async function mountShell(activeKey, title) {
  renderShell(activeKey);
  setPageTitle(title);
  const profile = await requireAuth();
  if (!profile) return null;
  document.getElementById("admin-name").textContent = profile.name;
  document.getElementById("admin-email").textContent = profile.email;
  return profile;
}

// ---- Toast --------------------------------------------------------------------

function showToast(message, type = "success") {
  let host = document.getElementById("toast-host");
  if (!host) {
    host = document.createElement("div");
    host.id = "toast-host";
    host.className = "fixed bottom-4 right-4 z-[100] flex flex-col gap-2";
    document.body.appendChild(host);
  }
  const colors = {
    success: "border-flame/40 bg-charcoal2 text-white",
    error: "border-red-500/40 bg-charcoal2 text-white",
  };
  const el = document.createElement("div");
  el.className = `pointer-events-auto rounded-xl border ${colors[type] || colors.success} px-4 py-3 text-sm shadow-lg transition-opacity duration-300`;
  el.textContent = message;
  host.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 300);
  }, 3200);
}

// ---- Confirm dialog -------------------------------------------------------------

function confirmDialog({ title, message, confirmLabel = "Confirm", danger = false }) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4";
    overlay.innerHTML = `
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" class="w-full max-w-sm rounded-2xl border border-white/10 bg-charcoal2 p-6">
        <h2 id="confirm-title" class="font-display text-xl tracking-wide">${title}</h2>
        <p class="mt-2 text-sm text-gray-400">${message}</p>
        <div class="mt-6 flex justify-end gap-3">
          <button data-action="cancel" class="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-gray-300 hover:border-white/30">Cancel</button>
          <button data-action="confirm" class="rounded-full px-4 py-2 text-sm font-semibold text-white ${danger ? "bg-red-600 hover:bg-red-500" : "bg-flame hover:bg-flame-light"}">${confirmLabel}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const cleanup = (result) => {
      overlay.remove();
      resolve(result);
    };
    overlay.querySelector('[data-action="cancel"]').addEventListener("click", () => cleanup(false));
    overlay.querySelector('[data-action="confirm"]').addEventListener("click", () => cleanup(true));
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) cleanup(false);
    });
    const onKey = (e) => {
      if (e.key === "Escape") {
        cleanup(false);
        document.removeEventListener("keydown", onKey);
      }
    };
    document.addEventListener("keydown", onKey);
    overlay.querySelector('[data-action="confirm"]').focus();
  });
}

// ---- Small formatting/state helpers ---------------------------------------------

function formatMoney(n) {
  return `Rs. ${Number(n).toLocaleString("en-PK")}`;
}
function formatDate(iso) {
  return new Date(iso).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" });
}
function debounce(fn, ms = 350) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

const ORDER_STATUS_STYLES = {
  PENDING: "bg-amber-500/15 text-amber-400",
  CONFIRMED: "bg-blue-500/15 text-blue-400",
  PREPARING: "bg-purple-500/15 text-purple-400",
  READY: "bg-cyan-500/15 text-cyan-400",
  OUT_FOR_DELIVERY: "bg-flame/15 text-flame",
  COMPLETED: "bg-green-500/15 text-green-400",
  CANCELLED: "bg-red-500/15 text-red-400",
};
const RESERVATION_STATUS_STYLES = {
  PENDING: "bg-amber-500/15 text-amber-400",
  CONFIRMED: "bg-blue-500/15 text-blue-400",
  COMPLETED: "bg-green-500/15 text-green-400",
  CANCELLED: "bg-red-500/15 text-red-400",
};

function statusBadge(status, map) {
  const cls = map[status] || "bg-white/10 text-gray-300";
  return `<span class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${cls}">${status.replace(/_/g, " ")}</span>`;
}

function loadingRow(colspan, label = "Loading…") {
  return `<tr><td colspan="${colspan}" class="py-12 text-center text-sm text-gray-500">
    <span class="inline-flex items-center gap-2">
      <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.25"/><path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>
      ${label}
    </span></td></tr>`;
}
function emptyRow(colspan, label) {
  return `<tr><td colspan="${colspan}" class="py-12 text-center text-sm text-gray-500">${label}</td></tr>`;
}
function errorRow(colspan, message) {
  return `<tr><td colspan="${colspan}" class="py-12 text-center text-sm text-red-400">${message}</td></tr>`;
}

function paginationControls(result, onPage) {
  const { page, totalPages, total } = result;
  const wrap = document.createElement("div");
  wrap.className = "mt-4 flex items-center justify-between text-sm text-gray-400";
  wrap.innerHTML = `
    <span>${total} total · page ${page} of ${totalPages}</span>
    <div class="flex gap-2">
      <button data-dir="prev" ${page <= 1 ? "disabled" : ""} class="rounded-full border border-white/10 px-3 py-1.5 font-semibold disabled:opacity-30 hover:border-flame hover:text-flame disabled:hover:border-white/10 disabled:hover:text-gray-400">Previous</button>
      <button data-dir="next" ${page >= totalPages ? "disabled" : ""} class="rounded-full border border-white/10 px-3 py-1.5 font-semibold disabled:opacity-30 hover:border-flame hover:text-flame disabled:hover:border-white/10 disabled:hover:text-gray-400">Next</button>
    </div>`;
  wrap.querySelector('[data-dir="prev"]').addEventListener("click", () => onPage(page - 1));
  wrap.querySelector('[data-dir="next"]').addEventListener("click", () => onPage(page + 1));
  return wrap;
}

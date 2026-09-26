// Shared by every public page: where the API lives, a small fetch wrapper that
// always sends the login cookie, and the current customer ("Account").
//
// The session itself is an httpOnly cookie set by the server — this file never
// sees, stores or sends a token or password anywhere except the login/signup
// request bodies.

// - Local development (localhost / 127.0.0.1): the API on port 4000.
// - Anywhere else: same-origin "/api" (site and API behind one domain / reverse
//   proxy — see DEPLOYMENT.md), unless js/config.js sets
//   window.GRILL_OUT_CONFIG.apiBaseUrl for a separately hosted API.
const API_BASE_URL = (() => {
  const configured = window.GRILL_OUT_CONFIG && window.GRILL_OUT_CONFIG.apiBaseUrl;
  if (configured) return String(configured).replace(/\/+$/, "");
  const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  return isLocal ? "http://localhost:4000/api" : "/api";
})();

/** Calls the API. Never throws for HTTP errors — returns { ok, status, data, error }.
 * Throws (TypeError) only when the network itself is unreachable. */
async function apiFetch(path, { method = "GET", body } = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    credentials: "include",
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let payload = null;
  try {
    payload = await res.json();
  } catch {
    /* non-JSON error page */
  }
  return {
    ok: res.ok && Boolean(payload && payload.success),
    status: res.status,
    data: payload ? payload.data : undefined,
    error: payload ? payload.error : undefined,
  };
}

/** First human-readable problem in an API error (field errors first, then the message). */
function apiErrorMessage(result, fallback) {
  const details = result.error && result.error.details;
  const firstField = details && Object.values(details)[0] && Object.values(details)[0][0];
  return firstField || (result.error && result.error.message) || fallback;
}

// Everything that comes from the server or the customer must be escaped before
// it goes into innerHTML. Admin messages, names and addresses are all "user text".
const ESC_MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "`": "&#96;" };
function esc(value) {
  return String(value === null || value === undefined ? "" : value).replace(/[&<>"'`]/g, (c) => ESC_MAP[c]);
}

/** Only ever redirect to a path on THIS site (never to another origin), so a
 * crafted ?next= link can't bounce a customer to a phishing page after login. */
function safeNext(raw, fallback = "/") {
  if (typeof raw !== "string") return fallback;
  if (!/^\/(?!\/)[A-Za-z0-9_\-./?=&%#]*$/.test(raw)) return fallback;
  return raw;
}

function loginUrl(next) {
  return `/login/?next=${encodeURIComponent(safeNext(next, "/"))}`;
}
function signupUrl(next) {
  return `/signup/?next=${encodeURIComponent(safeNext(next, "/"))}`;
}

const Account = {
  _me: undefined,

  _pending: null,

  /** The logged-in customer ({ name, email }) or null. One request per page load,
   * shared by every caller (nav, checkout, reservation form all ask at once). */
  async me(force = false) {
    if (this._me !== undefined && !force) return this._me;
    if (!this._pending || force) {
      // /session answers 200 with { customer: null } when logged out (no console 401).
      this._pending = apiFetch("/auth/customer/session")
        .then((res) => {
          this._me = res.ok && res.data && res.data.customer ? res.data.customer : null;
          return this._me;
        })
        .catch(() => {
          this._me = null;
          return null;
        })
        .finally(() => {
          this._pending = null;
        });
    }
    return this._pending;
  },

  set(profile) {
    this._me = profile;
  },

  async logout() {
    try {
      await apiFetch("/auth/customer/logout", { method: "POST" });
    } finally {
      this._me = null;
    }
  },
};

/** Fills every [data-account-link] (nav) with Login or My Account. */
async function updateAccountLinks() {
  const me = await Account.me();
  document.querySelectorAll("[data-account-link]").forEach((el) => {
    const label = el.querySelector("[data-account-label]") || el;
    if (me) {
      el.setAttribute("href", "/account/");
      label.textContent = el.dataset.loggedInText || "My Account";
      el.setAttribute("aria-label", `My account (${me.name})`);
    } else {
      el.setAttribute("href", loginUrl(el.dataset.next || "/"));
      label.textContent = el.dataset.loggedOutText || "Login";
      el.setAttribute("aria-label", "Log in or sign up");
    }
  });
}

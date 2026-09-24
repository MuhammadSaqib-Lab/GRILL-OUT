const form = document.getElementById("login-form");
const errorBox = document.getElementById("form-error");
const submitBtn = document.getElementById("submit-btn");
const submitLabel = document.getElementById("submit-label");

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
}
function hideError() {
  errorBox.classList.add("hidden");
}

// If already logged in, skip straight to the dashboard.
fetch("/api/admin/auth/me", { credentials: "include" })
  .then((res) => { if (res.ok) location.href = "dashboard.html"; })
  .catch(() => {});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideError();
  submitBtn.disabled = true;
  submitLabel.textContent = "Logging in…";

  try {
    const res = await fetch("/api/admin/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email.value.trim(),
        password: form.password.value,
      }),
    });
    const body = await res.json().catch(() => ({}));

    if (!res.ok || !body.success) {
      throw new Error(body?.error?.message || "Login failed");
    }
    location.href = "dashboard.html";
  } catch (err) {
    showError(err.message || "Something went wrong. Please try again.");
    submitBtn.disabled = false;
    submitLabel.textContent = "Log In";
  }
});

// Login and signup pages. Both forms post to the same API the rest of the site
// uses; after success the customer is returned to wherever they came from
// (?next=…, validated by safeNext) — e.g. straight back to the reservation form.

const nextTarget = () => safeNext(new URLSearchParams(location.search).get("next"), "/account/");

function setFieldError(input, message) {
  const help = document.getElementById(`${input.id}-error`);
  if (help) {
    help.textContent = message || "";
    help.classList.toggle("hidden", !message);
  }
  input.setAttribute("aria-invalid", message ? "true" : "false");
}

function showFormError(message) {
  const box = document.getElementById("form-error");
  box.textContent = message;
  box.classList.remove("hidden");
  box.focus();
}

async function submitAuth(form, path, buildBody, validate) {
  const submit = form.querySelector('[type="submit"]');
  const label = submit.querySelector("[data-label]");
  document.getElementById("form-error").classList.add("hidden");

  if (validate && !validate()) return;

  const original = label.textContent;
  submit.disabled = true;
  label.textContent = "Please wait…";
  try {
    const res = await apiFetch(path, { method: "POST", body: buildBody() });
    if (!res.ok) {
      if (res.status === 429) {
        showFormError("Too many attempts. Please wait a few minutes and try again.");
      } else if (res.status === 409) {
        setFieldError(form.email, res.error.message);
        form.email.focus();
      } else if (res.status === 400 && res.error && res.error.details) {
        showFormError(apiErrorMessage(res, "Please check the form and try again."));
      } else {
        showFormError(apiErrorMessage(res, "Something went wrong. Please try again."));
      }
      return;
    }
    Account.set(res.data);
    location.href = nextTarget();
  } catch {
    showFormError("Can't reach the server right now. Please check your connection and try again.");
  } finally {
    submit.disabled = false;
    label.textContent = original;
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    submitAuth(
      loginForm,
      "/auth/customer/login",
      () => ({ email: loginForm.email.value.trim(), password: loginForm.password.value }),
      () => {
        const okEmail = EMAIL_RE.test(loginForm.email.value.trim());
        setFieldError(loginForm.email, okEmail ? "" : "Enter your email address.");
        const okPw = loginForm.password.value.length > 0;
        setFieldError(loginForm.password, okPw ? "" : "Enter your password.");
        if (!okEmail) loginForm.email.focus();
        else if (!okPw) loginForm.password.focus();
        return okEmail && okPw;
      }
    );
  });
}

const signupForm = document.getElementById("signup-form");
if (signupForm) {
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    submitAuth(
      signupForm,
      "/auth/customer/signup",
      () => ({
        name: signupForm.name.value.trim(),
        email: signupForm.email.value.trim(),
        password: signupForm.password.value,
        confirmPassword: signupForm.confirmPassword.value,
      }),
      () => {
        const pw = signupForm.password.value;
        const checks = [
          [signupForm.name, signupForm.name.value.trim().length >= 2, "Please enter your full name."],
          [signupForm.email, EMAIL_RE.test(signupForm.email.value.trim()), "Enter a valid email address."],
          [signupForm.password, pw.length >= 8 && /[A-Za-z]/.test(pw) && /[0-9]/.test(pw), "Use at least 8 characters, with a letter and a number."],
          [signupForm.confirmPassword, signupForm.confirmPassword.value === pw && pw.length > 0, "Passwords do not match."],
        ];
        let firstBad = null;
        for (const [input, ok, msg] of checks) {
          setFieldError(input, ok ? "" : msg);
          if (!ok && !firstBad) firstBad = input;
        }
        if (firstBad) firstBad.focus();
        return !firstBad;
      }
    );
  });
}

// Already logged in? No need to see the form again.
Account.me().then((me) => {
  if (me) location.replace(nextTarget());
});

// Keep the "other page" link carrying the same ?next=
document.querySelectorAll("[data-switch-auth]").forEach((a) => {
  const target = a.dataset.switchAuth; // "login" | "signup"
  const next = new URLSearchParams(location.search).get("next");
  a.setAttribute("href", next ? `/${target}/?next=${encodeURIComponent(safeNext(next, "/"))}` : `/${target}/`);
});

document.getElementById("year").textContent = new Date().getFullYear();

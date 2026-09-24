(async () => {
  const profile = await mountShell("settings", "Settings");
  if (!profile) return;

  document.getElementById("page-content").innerHTML = `
    <div class="max-w-md rounded-2xl border border-white/10 bg-charcoal2 p-6">
      <h2 class="font-display text-xl tracking-wide">Admin Profile</h2>
      <div class="mt-4 space-y-3 text-sm">
        <div>
          <p class="text-xs uppercase tracking-wide text-gray-500">Name</p>
          <p class="mt-0.5">${esc(profile.name)}</p>
        </div>
        <div>
          <p class="text-xs uppercase tracking-wide text-gray-500">Email</p>
          <p class="mt-0.5">${esc(profile.email)}</p>
        </div>
      </div>
      <p class="mt-5 text-xs text-gray-600">
        Account details are managed via environment configuration. To change the admin password, update
        <code class="rounded bg-white/5 px-1 py-0.5">ADMIN_PASSWORD</code> and re-run the seed script.
      </p>
      <button id="logout-btn-2" type="button" class="mt-6 w-full rounded-full border border-white/10 py-2.5 text-sm font-semibold text-red-400 hover:border-red-500">Log Out</button>
    </div>`;

  document.getElementById("logout-btn-2").addEventListener("click", logout);
})();

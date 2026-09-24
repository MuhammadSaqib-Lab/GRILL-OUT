(async () => {
  const profile = await mountShell("newsletter", "Newsletter");
  if (!profile) return;
  document.getElementById("page-content").innerHTML = `
    <div class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-charcoal2 py-20 text-center">
      ${icon("send", "h-10 w-10 text-gray-600")}
      <h2 class="mt-4 font-display text-2xl tracking-wide">No Newsletter Signup Yet</h2>
      <p class="mt-2 max-w-sm text-sm text-gray-500">
        The public Grill Out website doesn't have a newsletter signup form, so there's no subscriber list to manage here.
        This section will activate automatically once a signup form is added to the site.
      </p>
    </div>`;
})();

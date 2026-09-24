let categories = [];
let items = [];
let activeTab = "items";

function clientSlugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function renderPage() {
  document.getElementById("page-content").innerHTML = `
    <div class="mb-5 flex items-center justify-between">
      <div class="inline-flex rounded-full border border-white/10 bg-charcoal2 p-1" role="tablist" aria-label="Menu sections">
        <button type="button" role="tab" id="tab-items" aria-controls="tab-content" class="tab-btn rounded-full px-4 py-1.5 text-sm font-semibold">Items</button>
        <button type="button" role="tab" id="tab-categories" aria-controls="tab-content" class="tab-btn rounded-full px-4 py-1.5 text-sm font-semibold">Categories</button>
      </div>
      <button type="button" id="add-btn" class="rounded-full bg-flame px-4 py-2 text-sm font-semibold hover:bg-flame-light"></button>
    </div>
    <div id="tab-content" role="tabpanel" aria-live="polite"></div>
  `;
  document.getElementById("tab-items").addEventListener("click", () => switchTab("items"));
  document.getElementById("tab-categories").addEventListener("click", () => switchTab("categories"));
  switchTab(activeTab);
}

function switchTab(tab) {
  activeTab = tab;
  for (const key of ["items", "categories"]) {
    const btn = document.getElementById(`tab-${key}`);
    const on = key === tab;
    btn.className = "tab-btn rounded-full px-4 py-1.5 text-sm font-semibold " + (on ? "bg-flame text-white" : "text-gray-400");
    btn.setAttribute("aria-selected", on ? "true" : "false");
  }

  const addBtn = document.getElementById("add-btn");
  addBtn.textContent = tab === "items" ? "+ Add Item" : "+ Add Category";
  addBtn.onclick = () => (tab === "items" ? openItemForm() : openCategoryForm());

  if (tab === "items") renderItemsTab();
  else renderCategoriesTab();
}

// ---- Categories ---------------------------------------------------------

async function loadCategories() {
  const { data } = await AdminAPI.get("/menu/categories");
  categories = data;
  return data;
}

async function renderCategoriesTab() {
  const host = document.getElementById("tab-content");
  host.innerHTML = `<p class="text-sm text-gray-500">Loading categories…</p>`;
  try {
    await loadCategories();
    if (categories.length === 0) {
      host.innerHTML = `<p class="py-12 text-center text-sm text-gray-500">No categories yet.</p>`;
      return;
    }
    host.innerHTML = `<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" id="cat-grid"></div>`;
    const grid = document.getElementById("cat-grid");
    categories.forEach((c) => {
      const card = document.createElement("div");
      card.className = "rounded-2xl border border-white/10 bg-charcoal2 p-4";
      card.innerHTML = `
        <div class="flex items-start justify-between">
          <div>
            <p class="font-medium">${esc(c.name)}</p>
            <p class="text-xs text-gray-500">/${esc(c.slug)} · ${esc(c._count?.items ?? 0)} items</p>
          </div>
          ${c.isActive ? "" : `<span class="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-gray-400">Inactive</span>`}
        </div>
        ${c.description ? `<p class="mt-2 text-xs text-gray-500">${esc(c.description)}</p>` : ""}
        <div class="mt-3 flex gap-2">
          <button type="button" data-edit aria-label="Edit category ${esc(c.name)}" class="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold hover:border-flame hover:text-flame">Edit</button>
          <button type="button" data-delete aria-label="Delete category ${esc(c.name)}" class="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-red-400 hover:border-red-500">Delete</button>
        </div>`;
      card.querySelector("[data-edit]").addEventListener("click", () => openCategoryForm(c));
      card.querySelector("[data-delete]").addEventListener("click", () => deleteCategory(c));
      grid.appendChild(card);
    });
  } catch (err) {
    host.innerHTML = `<p class="py-12 text-center text-sm text-red-400" role="alert">Failed to load categories: ${esc(err.message)}</p>`;
  }
}

function openCategoryForm(existing) {
  const isEdit = Boolean(existing);
  const { overlay, close } = openModal(
    `<div class="flex items-start justify-between">
        <h2 id="cat-modal-title" class="font-display text-2xl tracking-wide">${isEdit ? "Edit Category" : "New Category"}</h2>
        <button type="button" data-close aria-label="Close" class="rounded-lg p-1 text-gray-400 hover:text-white">${icon("x")}</button>
      </div>
      <form id="cat-form" class="mt-4 space-y-3">
        <div>
          <label for="cat-name" class="mb-1 block text-xs font-medium text-gray-400">Name</label>
          <input id="cat-name" name="name" required maxlength="100" value="${esc(existing?.name ?? "")}" class="w-full rounded-xl border border-white/10 bg-charcoal px-3.5 py-2 text-sm outline-none focus:border-flame" />
        </div>
        <div>
          <label for="cat-description" class="mb-1 block text-xs font-medium text-gray-400">Description</label>
          <textarea id="cat-description" name="description" rows="2" maxlength="500" class="w-full rounded-xl border border-white/10 bg-charcoal px-3.5 py-2 text-sm outline-none focus:border-flame">${esc(existing?.description ?? "")}</textarea>
        </div>
        <div>
          <label for="cat-image" class="mb-1 block text-xs font-medium text-gray-400">Image URL</label>
          <input id="cat-image" name="image" type="url" value="${esc(existing?.image ?? "")}" class="w-full rounded-xl border border-white/10 bg-charcoal px-3.5 py-2 text-sm outline-none focus:border-flame" />
        </div>
        <div>
          <label for="cat-sort" class="mb-1 block text-xs font-medium text-gray-400">Sort Order</label>
          <input id="cat-sort" name="sortOrder" type="number" min="0" max="100000" value="${esc(existing?.sortOrder ?? 0)}" class="w-full rounded-xl border border-white/10 bg-charcoal px-3.5 py-2 text-sm outline-none focus:border-flame" />
        </div>
        ${
          isEdit
            ? `<label class="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" name="isActive" ${existing.isActive ? "checked" : ""} class="h-4 w-4 rounded border-white/20 bg-charcoal accent-flame" /> Active
              </label>`
            : ""
        }
        <div id="cat-form-error" role="alert" class="hidden rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400"></div>
        <button type="submit" class="w-full rounded-full bg-flame py-2.5 text-sm font-semibold hover:bg-flame-light disabled:opacity-60">${isEdit ? "Save Changes" : "Create Category"}</button>
      </form>`,
    { labelId: "cat-modal-title", widthClass: "max-w-md" }
  );

  overlay.querySelector("#cat-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorBox = overlay.querySelector("#cat-form-error");
    const submit = e.target.querySelector('[type="submit"]');
    errorBox.classList.add("hidden");
    const fd = new FormData(e.target);
    const payload = {
      name: fd.get("name").trim(),
      description: fd.get("description").trim() || undefined,
      image: fd.get("image").trim() || undefined,
      sortOrder: Number(fd.get("sortOrder")) || 0,
    };
    if (isEdit) {
      payload.isActive = fd.has("isActive");
    } else {
      payload.slug = clientSlugify(payload.name);
    }
    submit.disabled = true;
    try {
      if (isEdit) await AdminAPI.patch(`/menu/categories/${existing.id}`, payload);
      else await AdminAPI.post("/menu/categories", payload);
      showToast(isEdit ? "Category updated" : "Category created");
      close();
      renderCategoriesTab();
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.classList.remove("hidden");
      submit.disabled = false;
    }
  });
}

async function deleteCategory(c) {
  const ok = await confirmDialog({
    title: "Delete category?",
    message: `Delete "${c.name}"? If it still has menu items it will be deactivated instead of deleted.`,
    confirmLabel: "Delete",
    danger: true,
  });
  if (!ok) return;
  try {
    const { data, message } = await AdminAPI.delete(`/menu/categories/${c.id}`);
    showToast(message || `Category ${data.action}`);
    renderCategoriesTab();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ---- Items ----------------------------------------------------------------

async function loadItems() {
  const [itemsRes] = await Promise.all([AdminAPI.get("/menu/items"), categories.length ? Promise.resolve() : loadCategories()]);
  items = itemsRes.data;
  return items;
}

async function renderItemsTab() {
  const host = document.getElementById("tab-content");
  host.innerHTML = `<p class="text-sm text-gray-500">Loading items…</p>`;
  try {
    await loadItems();
    if (items.length === 0) {
      host.innerHTML = `<p class="py-12 text-center text-sm text-gray-500">No menu items yet.</p>`;
      return;
    }
    host.innerHTML = `
      <div class="overflow-x-auto rounded-2xl border border-white/10 bg-charcoal2">
        <table class="w-full text-left text-sm">
          <caption class="sr-only">Menu items</caption>
          <thead class="border-b border-white/10 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th scope="col" class="px-4 py-3">Item</th>
              <th scope="col" class="px-4 py-3">Category</th>
              <th scope="col" class="px-4 py-3">Price</th>
              <th scope="col" class="px-4 py-3">Available</th>
              <th scope="col" class="px-4 py-3">Featured</th>
              <th scope="col" class="px-4 py-3"><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody id="items-tbody"></tbody>
        </table>
      </div>`;
    const tbody = document.getElementById("items-tbody");
    items.forEach((item) => {
      const cat = categories.find((c) => c.slug === item.category);
      const tr = document.createElement("tr");
      tr.className = "border-b border-white/5 last:border-0 hover:bg-white/[0.03]";
      tr.innerHTML = `
        <td class="px-4 py-3">
          <div class="flex items-center gap-3">
            <img src="${esc(item.image)}" alt="" loading="lazy" width="40" height="40" class="h-10 w-10 rounded-lg object-cover" />
            <span class="font-medium">${esc(item.name)}</span>
          </div>
        </td>
        <td class="px-4 py-3 text-gray-300">${esc(cat?.name ?? item.category)}</td>
        <td class="px-4 py-3">${item.options?.length ? `from ${esc(formatMoney(item.price))}` : esc(formatMoney(item.price))}</td>
        <td class="px-4 py-3"><input type="checkbox" data-toggle="isAvailable" aria-label="${esc(item.name)} available" ${item.available ? "checked" : ""} class="h-4 w-4 rounded border-white/20 bg-charcoal accent-flame" /></td>
        <td class="px-4 py-3"><input type="checkbox" data-toggle="isFeatured" aria-label="${esc(item.name)} featured" ${item.featured ? "checked" : ""} class="h-4 w-4 rounded border-white/20 bg-charcoal accent-flame" /></td>
        <td class="px-4 py-3 text-right">
          <div class="flex justify-end gap-2">
            <button type="button" data-edit aria-label="Edit ${esc(item.name)}" class="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold hover:border-flame hover:text-flame">Edit</button>
            <button type="button" data-delete aria-label="Delete ${esc(item.name)}" class="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-red-400 hover:border-red-500">Delete</button>
          </div>
        </td>`;
      // A broken image URL shouldn't leave a broken-image glyph (CSP forbids inline onerror).
      tr.querySelector("img").addEventListener("error", (e) => (e.target.style.visibility = "hidden"));
      tr.querySelector('[data-toggle="isAvailable"]').addEventListener("change", (e) => toggleField(item, "isAvailable", e.target.checked));
      tr.querySelector('[data-toggle="isFeatured"]').addEventListener("change", (e) => toggleField(item, "isFeatured", e.target.checked));
      tr.querySelector("[data-edit]").addEventListener("click", () => openItemForm(item));
      tr.querySelector("[data-delete]").addEventListener("click", () => deleteItem(item));
      tbody.appendChild(tr);
    });
  } catch (err) {
    host.innerHTML = `<p class="py-12 text-center text-sm text-red-400" role="alert">Failed to load menu items: ${esc(err.message)}</p>`;
  }
}

async function toggleField(item, field, value) {
  try {
    await AdminAPI.patch(`/menu/items/${item.id}`, { [field]: value });
    showToast("Menu item updated");
  } catch (err) {
    showToast(err.message, "error");
    renderItemsTab();
  }
}

async function deleteItem(item) {
  const ok = await confirmDialog({
    title: "Delete menu item?",
    message: `Delete "${item.name}"? If it's part of any past order it will be deactivated instead of deleted.`,
    confirmLabel: "Delete",
    danger: true,
  });
  if (!ok) return;
  try {
    const { data, message } = await AdminAPI.delete(`/menu/items/${item.id}`);
    showToast(message || `Item ${data.action}`);
    renderItemsTab();
  } catch (err) {
    showToast(err.message, "error");
  }
}

function optionRow(label = "", price = "") {
  const row = document.createElement("div");
  row.className = "flex gap-2";
  row.innerHTML = `
    <input aria-label="Option label" placeholder="Label (e.g. Small)" maxlength="60" value="${esc(label)}" data-opt-label class="w-1/2 rounded-xl border border-white/10 bg-charcoal px-3 py-1.5 text-sm outline-none focus:border-flame" />
    <input aria-label="Option price" placeholder="Price" type="number" min="0" step="0.01" value="${esc(price)}" data-opt-price class="w-1/2 rounded-xl border border-white/10 bg-charcoal px-3 py-1.5 text-sm outline-none focus:border-flame" />
    <button type="button" data-remove-opt aria-label="Remove option" class="shrink-0 rounded-xl border border-white/10 px-2 text-gray-400 hover:text-red-400">${icon("x", "h-4 w-4")}</button>`;
  row.querySelector("[data-remove-opt]").addEventListener("click", () => row.remove());
  return row;
}

function openItemForm(existing) {
  const isEdit = Boolean(existing);
  const currentCat = existing ? categories.find((c) => c.slug === existing.category) : null;
  const { overlay, close } = openModal(
    `<div class="flex items-start justify-between">
        <h2 id="item-modal-title" class="font-display text-2xl tracking-wide">${isEdit ? "Edit Item" : "New Item"}</h2>
        <button type="button" data-close aria-label="Close" class="rounded-lg p-1 text-gray-400 hover:text-white">${icon("x")}</button>
      </div>
      <form id="item-form" class="mt-4 space-y-3">
        <div>
          <label for="item-category" class="mb-1 block text-xs font-medium text-gray-400">Category</label>
          <select id="item-category" name="categoryId" required class="w-full rounded-xl border border-white/10 bg-charcoal px-3.5 py-2 text-sm outline-none focus:border-flame">
            ${categories.map((c) => `<option value="${esc(c.id)}" ${currentCat?.id === c.id ? "selected" : ""}>${esc(c.name)}</option>`).join("")}
          </select>
        </div>
        <div>
          <label for="item-name" class="mb-1 block text-xs font-medium text-gray-400">Name</label>
          <input id="item-name" name="name" required maxlength="120" value="${esc(existing?.name ?? "")}" class="w-full rounded-xl border border-white/10 bg-charcoal px-3.5 py-2 text-sm outline-none focus:border-flame" />
        </div>
        <div>
          <label for="item-description" class="mb-1 block text-xs font-medium text-gray-400">Description</label>
          <textarea id="item-description" name="description" required rows="2" maxlength="1000" class="w-full rounded-xl border border-white/10 bg-charcoal px-3.5 py-2 text-sm outline-none focus:border-flame">${esc(existing?.description ?? "")}</textarea>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="item-price" class="mb-1 block text-xs font-medium text-gray-400">Base Price (Rs.)</label>
            <input id="item-price" name="price" type="number" min="0" step="0.01" required value="${esc(existing?.price ?? "")}" class="w-full rounded-xl border border-white/10 bg-charcoal px-3.5 py-2 text-sm outline-none focus:border-flame" />
          </div>
          <div>
            <label for="item-sort" class="mb-1 block text-xs font-medium text-gray-400">Sort Order</label>
            <input id="item-sort" name="sortOrder" type="number" min="0" max="100000" value="0" class="w-full rounded-xl border border-white/10 bg-charcoal px-3.5 py-2 text-sm outline-none focus:border-flame" />
          </div>
        </div>
        <div>
          <label for="item-image" class="mb-1 block text-xs font-medium text-gray-400">Image URL</label>
          <input id="item-image" name="image" type="url" required value="${esc(existing?.image ?? "")}" class="w-full rounded-xl border border-white/10 bg-charcoal px-3.5 py-2 text-sm outline-none focus:border-flame" />
        </div>

        <div>
          <div class="mb-1 flex items-center justify-between">
            <span id="item-options-label" class="text-xs font-medium text-gray-400">Size / Variant Options (optional)</span>
            <button type="button" id="add-opt" class="text-xs font-semibold text-flame hover:text-flame-light">+ Add option</button>
          </div>
          <div id="opt-rows" role="group" aria-labelledby="item-options-label" class="space-y-2"></div>
        </div>

        <div class="flex gap-5">
          <label class="flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" name="isAvailable" ${existing ? (existing.available ? "checked" : "") : "checked"} class="h-4 w-4 rounded border-white/20 bg-charcoal accent-flame" /> Available
          </label>
          <label class="flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" name="isFeatured" ${existing?.featured ? "checked" : ""} class="h-4 w-4 rounded border-white/20 bg-charcoal accent-flame" /> Featured
          </label>
        </div>

        <div id="item-form-error" role="alert" class="hidden rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400"></div>
        <button type="submit" class="w-full rounded-full bg-flame py-2.5 text-sm font-semibold hover:bg-flame-light disabled:opacity-60">${isEdit ? "Save Changes" : "Create Item"}</button>
      </form>`,
    { labelId: "item-modal-title" }
  );

  const optRows = overlay.querySelector("#opt-rows");
  (existing?.options || []).forEach((o) => optRows.appendChild(optionRow(o.label, o.price)));
  overlay.querySelector("#add-opt").addEventListener("click", () => optRows.appendChild(optionRow()));

  overlay.querySelector("#item-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorBox = overlay.querySelector("#item-form-error");
    const submit = e.target.querySelector('[type="submit"]');
    errorBox.classList.add("hidden");
    const fd = new FormData(e.target);

    const options = [...optRows.querySelectorAll(":scope > div")]
      .map((row) => ({
        label: row.querySelector("[data-opt-label]").value.trim(),
        price: Number(row.querySelector("[data-opt-price]").value),
      }))
      .filter((o) => o.label && o.price > 0);

    const payload = {
      categoryId: Number(fd.get("categoryId")),
      name: fd.get("name").trim(),
      description: fd.get("description").trim(),
      price: Number(fd.get("price")),
      image: fd.get("image").trim(),
      sortOrder: Number(fd.get("sortOrder")) || 0,
      isAvailable: fd.has("isAvailable"),
      isFeatured: fd.has("isFeatured"),
      options,
    };

    submit.disabled = true;
    try {
      if (isEdit) await AdminAPI.patch(`/menu/items/${existing.id}`, payload);
      else await AdminAPI.post("/menu/items", payload);
      showToast(isEdit ? "Item updated" : "Item created");
      close();
      renderItemsTab();
    } catch (err) {
      const detail = err.details && Object.values(err.details)[0]?.[0];
      errorBox.textContent = detail || err.message;
      errorBox.classList.remove("hidden");
      submit.disabled = false;
    }
  });
}

(async () => {
  const profile = await mountShell("menu", "Menu Management");
  if (!profile) return;
  renderPage();
})();

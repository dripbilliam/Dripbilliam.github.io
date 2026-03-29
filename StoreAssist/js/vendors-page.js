import { ensureState, loadState, num, saveState, uid } from "./store-data.js";

let state = ensureState(loadState());

const els = {
  addVendorBtn: document.getElementById("addVendorBtn"),
  vendorRows: document.getElementById("vendorRows"),
  addLocationBtn: document.getElementById("addLocationBtn"),
  locationRows: document.getElementById("locationRows")
};

bindEvents();
render();

function persist() {
  state = ensureState(state);
  saveState(state);
}

function bindEvents() {
  els.addVendorBtn.addEventListener("click", () => {
    state.vendors.push({ id: uid(), name: "New Vendor", contact: "", notes: "", active: true });
    persist();
    render();
  });

  els.addLocationBtn.addEventListener("click", () => {
    const name = prompt("Location name:", "");
    if (!name) return;
    const location = { id: uid(), name: name.trim() || "Location" };
    state.locations.push(location);
    state.inventoryItems.forEach((item) => {
      if (!item.stocks) item.stocks = {};
      if (!Object.prototype.hasOwnProperty.call(item.stocks, location.id)) {
        item.stocks[location.id] = 0;
      }
      if (!item.locationConfig) item.locationConfig = {};
      if (!Object.prototype.hasOwnProperty.call(item.locationConfig, location.id)) {
        const marginPct = Math.max(0, num(state.settings.defaultMarkupPct));
        item.locationConfig[location.id] = {
          taxId: state.settings.defaultTaxId,
          marginPct,
          price: Math.max(0, num(item.unitCost)) * (1 + (marginPct / 100)),
          reorderPoint: 0,
          parDisabled: !state.settings.enableParTracking
        };
      }
    });
    persist();
    render();
  });
}

function render() {
  renderVendors();
  renderLocations();
}

function renderVendors() {
  if (!state.vendors.length) {
    els.vendorRows.innerHTML = `<tr><td colspan="5">No vendors configured.</td></tr>`;
    return;
  }

  els.vendorRows.innerHTML = state.vendors.map((vendor) => `
    <tr>
      <td><input data-action="name" data-id="${vendor.id}" value="${escapeHtml(vendor.name)}" /></td>
      <td><input data-action="contact" data-id="${vendor.id}" value="${escapeHtml(vendor.contact)}" /></td>
      <td><input data-action="notes" data-id="${vendor.id}" value="${escapeHtml(vendor.notes)}" /></td>
      <td><input data-action="active" data-id="${vendor.id}" type="checkbox" ${vendor.active ? "checked" : ""} /></td>
      <td><button data-action="delete" data-id="${vendor.id}" class="danger">Delete</button></td>
    </tr>
  `).join("");

  els.vendorRows.querySelectorAll("input").forEach((input) => {
    const eventName = input.type === "checkbox" ? "change" : "input";
    input.addEventListener(eventName, onVendorInput);
  });
  els.vendorRows.querySelectorAll("button[data-action='delete']").forEach((button) => {
    button.addEventListener("click", onDeleteVendor);
  });
}

function onVendorInput(event) {
  const vendor = state.vendors.find((entry) => entry.id === event.target.dataset.id);
  if (!vendor) return;

  const action = event.target.dataset.action;
  if (action === "name") vendor.name = event.target.value;
  if (action === "contact") vendor.contact = event.target.value;
  if (action === "notes") vendor.notes = event.target.value;
  if (action === "active") vendor.active = !!event.target.checked;

  persist();
}

function onDeleteVendor(event) {
  const id = event.target.dataset.id;
  if (state.vendors.length <= 1) {
    alert("At least one vendor is required.");
    return;
  }

  const assignedItems = state.inventoryItems.filter((item) => item.vendorId === id).length;
  if (assignedItems && !confirm(`This vendor is assigned to ${assignedItems} items. Reassign to default and delete?`)) {
    return;
  }

  state.vendors = state.vendors.filter((vendor) => vendor.id !== id);
  const fallback = state.vendors[0]?.id || "";
  state.inventoryItems.forEach((item) => {
    if (item.vendorId === id) item.vendorId = fallback;
  });
  state.specialOrders.forEach((order) => {
    if (order.vendorId === id) order.vendorId = fallback;
  });

  persist();
  render();
}

function renderLocations() {
  els.locationRows.innerHTML = state.locations.map((location) => {
    const locationQty = state.inventoryItems.reduce((sum, item) => sum + Math.max(0, num(item.stocks?.[location.id])), 0);
    return `
      <tr>
        <td>${escapeHtml(location.name)} <span class="muted-note">(QoH: ${locationQty})</span></td>
        <td>
          <button data-action="rename-location" data-id="${location.id}" class="secondary">Rename</button>
          <button data-action="delete-location" data-id="${location.id}" class="danger">Delete</button>
        </td>
      </tr>
    `;
  }).join("");

  els.locationRows.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", onLocationAction);
  });
}

function onLocationAction(event) {
  const action = event.target.dataset.action;
  const id = event.target.dataset.id;

  if (action === "rename-location") {
    const row = state.locations.find((location) => location.id === id);
    if (!row) return;
    const next = prompt("Rename location:", row.name);
    if (!next) return;
    row.name = next.trim() || row.name;
    persist();
    render();
    return;
  }

  if (action === "delete-location") {
    if (state.locations.length <= 1) {
      alert("At least one location is required.");
      return;
    }

    const orderCount = state.specialOrders.filter((order) => order.locationId === id).length;
    if (orderCount && !confirm(`This location is set on ${orderCount} orders. Reassign to default and delete?`)) {
      return;
    }

    state.locations = state.locations.filter((location) => location.id !== id);
    const fallback = state.locations[0]?.id || "";
    state.inventoryItems.forEach((item) => {
      delete item.stocks[id];
      if (item.locationConfig) delete item.locationConfig[id];
      if (!Object.prototype.hasOwnProperty.call(item.stocks, fallback)) {
        item.stocks[fallback] = 0;
      }
      if (!item.locationConfig) item.locationConfig = {};
      if (!Object.prototype.hasOwnProperty.call(item.locationConfig, fallback)) {
        const marginPct = Math.max(0, num(state.settings.defaultMarkupPct));
        item.locationConfig[fallback] = {
          taxId: state.settings.defaultTaxId,
          marginPct,
          price: Math.max(0, num(item.unitCost)) * (1 + (marginPct / 100)),
          reorderPoint: 0,
          parDisabled: !state.settings.enableParTracking
        };
      }
    });
    state.specialOrders.forEach((order) => {
      if (order.locationId === id) order.locationId = fallback;
    });
    persist();
    render();
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

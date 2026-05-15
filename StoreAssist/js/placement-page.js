import {
  ensureState,
  getItemPriceForLocation,
  itemLabel,
  loadState,
  num,
  saveState
} from "./store-data.js";

let state = ensureState(loadState());
let activeTab = "pricing";

const els = {
  placementLocationSections: document.getElementById("placementLocationSections"),
  wandCapToggle: document.getElementById("wandCapToggle"),
  salesRowsContainer: document.getElementById("salesRowsContainer"),
  tabButtons: Array.from(document.querySelectorAll("button[data-tab-target]")),
  tabPanels: Array.from(document.querySelectorAll("[data-tab-panel]"))
};

bindEvents();
render();

function bindEvents() {
  if (els.wandCapToggle) {
    els.wandCapToggle.addEventListener("change", () => {
      state.settings.wandPriceCapEnabled = !!els.wandCapToggle.checked;
      saveState(state);
      render();
    });
  }

  if (els.tabButtons.length) {
    els.tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        activeTab = button.dataset.tabTarget === "sales" ? "sales" : "pricing";
        applyTabState();
      });
    });
  }

  if (els.salesRowsContainer) {
    els.salesRowsContainer.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action='mark-sold']");
      if (!button) return;

      const row = button.closest("tr");
      if (!row) return;

      const qtyInput = row.querySelector("input[data-sale-qty]");
      const qty = Math.max(0, Math.floor(num(qtyInput?.value)));
      const locationId = button.dataset.locationId || "";
      const itemId = button.dataset.itemId || "";
      recordSale(locationId, itemId, qty);
  });
  }

  if (els.placementLocationSections) {
    els.placementLocationSections.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action='toggle-row-complete']");
      if (!button) return;

      const key = button.dataset.key;
      if (!key) return;

      state.placementCompletions = state.placementCompletions || {};
      if (state.placementCompletions[key]) {
        delete state.placementCompletions[key];
      } else {
        state.placementCompletions[key] = true;
      }

      saveState(state);
      render();
    });
  }
}

function render() {
  state = ensureState(loadState());
  if (els.wandCapToggle) {
    els.wandCapToggle.checked = state.settings.wandPriceCapEnabled === true;
  }

  const locationMarkup = state.locations.map((location) => {
    const rows = buildLocationRows(location.id)
      .sort((a, b) => a.itemName.localeCompare(b.itemName));

    if (!rows.length) {
      return `
        <section class="card location-pricing-card">
          <div class="panel-head compact-head">
            <h3>${escapeHtml(location.name)}</h3>
          </div>
          <p class="hint">No items found for this location.</p>
        </section>
      `;
    }

    const totalQoh = rows.reduce((sum, row) => sum + row.qoh, 0);
    const totalQohValue = rows.reduce((sum, row) => sum + row.qohTotal, 0);

    const grouped = {
      wand: rows.filter((row) => row.group === "wand"),
      scroll: rows.filter((row) => row.group === "scroll"),
      potion: rows.filter((row) => row.group === "potion"),
      found: rows.filter((row) => row.group === "found"),
      crafted: rows.filter((row) => row.group === "crafted")
    };

    return `
      <section class="card location-pricing-card">
        <div class="panel-head compact-head">
          <h3>${escapeHtml(location.name)}</h3>
        </div>
        <p class="hint"><strong>${formatInt(totalQoh)}</strong> total QoH | <strong>${formatMoney(totalQohValue)}</strong> total QoH value</p>
        ${renderTypeBlock("Wands", grouped.wand)}
        ${renderTypeBlock("Scrolls", grouped.scroll)}
        ${renderTypeBlock("Potions", grouped.potion)}
        ${renderTypeBlock("Found", grouped.found)}
        ${renderTypeBlock("Crafted", grouped.crafted)}
      </section>
    `;
  }).join("");

  els.placementLocationSections.innerHTML = locationMarkup || `<article class="card"><p class="hint">No locations found.</p></article>`;
  renderSalesRows();
  applyTabState();
}

function buildLocationRows(locationId) {
  const rows = [];

  state.inventoryItems.forEach((item) => {
    const config = item?.locationConfig?.[locationId];
    const qoh = Math.max(0, Math.floor(num(item?.stocks?.[locationId])));
    const baseUnitPrice = Math.max(0, num(getItemPriceForLocation(state, item, locationId)));
    const parQty = Math.max(0, Math.floor(num(config?.reorderPoint)));
    const group = getItemGroup(item);
    const shouldCapWand = group === "wand" && state.settings.wandPriceCapEnabled === true && item?.wandPriceCapOverride !== true;
    const unitPrice = shouldCapWand ? Math.min(5000, baseUnitPrice) : baseUnitPrice;
    const unitCost = Math.max(0, num(item?.unitCost));

    if (group === "found") {
      if (qoh <= 0) return;
    } else {
      if (!config || config.parDisabled || parQty <= 0) return;
    }

    rows.push({
      itemId: item.id,
      locationId,
      itemName: itemLabel(state, item),
      qoh,
      unitCost,
      qohCostTotal: qoh * unitCost,
      unitPrice,
      qohTotal: qoh * unitPrice,
      group
    });
  });

  return rows;
}

function getItemGroup(item) {
  if (item?.type === "crafted-spell") {
    const kind = String(item?.spellCraftKind || "").toLowerCase();
    if (kind === "wand") return "wand";
    if (kind === "scroll") return "scroll";
    return "potion";
  }

  if (item?.type === "found") return "found";
  return "crafted";
}

function renderTypeBlock(title, rows) {
  const showCostColumn = state?.settings?.showPricingCostColumn === true;

  if (!rows.length) {
    return `
      <div class="top-gap">
        <h4>${escapeHtml(title)}</h4>
        <p class="hint">No ${escapeHtml(title.toLowerCase())} items.</p>
      </div>
    `;
  }

  return `
    <div class="top-gap">
      <h4>${escapeHtml(title)}</h4>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>QoH</th>
              <th>Price For QoH</th>
              ${showCostColumn ? "<th>Cost For QoH</th>" : ""}
              ${showCostColumn ? "<th>Unit Cost</th>" : ""}
              <th>Unit Price</th>
              <th>Done</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((row) => `
              <tr class="${isRowComplete(row) ? "row-complete" : ""}">
                <td>${escapeHtml(row.itemName)}</td>
                <td>${formatInt(row.qoh)}</td>
                <td>${formatMoney(row.qohTotal)}</td>
                ${showCostColumn ? `<td>${formatMoney(row.qohCostTotal)}</td>` : ""}
                ${showCostColumn ? `<td>${formatMoney(row.unitCost)}</td>` : ""}
                <td>${formatMoney(row.unitPrice)}</td>
                <td><button type="button" data-action="toggle-row-complete" data-key="${escapeHtml(getRowKey(row))}" class="secondary">${isRowComplete(row) ? "Done" : "Mark"}</button></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function formatInt(value) {
  return Math.max(0, Math.floor(num(value))).toLocaleString();
}

function formatMoney(value) {
  const amount = Math.max(0, num(value));
  return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getRowKey(row) {
  return `${row.locationId}:${row.itemId}`;
}

function isRowComplete(row) {
  const key = getRowKey(row);
  return !!state?.placementCompletions?.[key];
}

function applyTabState() {
  els.tabButtons.forEach((button) => {
    const tabName = button.dataset.tabTarget;
    button.classList.toggle("tab-active", tabName === activeTab);
    button.setAttribute("aria-pressed", tabName === activeTab ? "true" : "false");
  });

  els.tabPanels.forEach((panel) => {
    const panelName = panel.dataset.tabPanel;
    panel.hidden = panelName !== activeTab;
  });
}

function renderSalesRows() {
  if (!els.salesRowsContainer) return;

  const rows = [];

  state.locations.forEach((location) => {
    state.inventoryItems.forEach((item) => {
      const qoh = Math.max(0, Math.floor(num(item?.stocks?.[location.id])));
      if (qoh <= 0) return;
      rows.push({
        locationId: location.id,
        locationName: location.name,
        itemId: item.id,
        itemName: itemLabel(state, item),
        qoh,
        group: getItemGroup(item)
      });
    });
  });

  rows.sort((a, b) => {
    const locationCompare = a.locationName.localeCompare(b.locationName);
    if (locationCompare !== 0) return locationCompare;
    return a.itemName.localeCompare(b.itemName);
  });

  if (!rows.length) {
    els.salesRowsContainer.innerHTML = `
      <table>
        <tbody>
          <tr><td class="hint">No items with QoH found.</td></tr>
        </tbody>
      </table>
    `;
    return;
  }

  const grouped = {
    wand: rows.filter((row) => row.group === "wand"),
    scroll: rows.filter((row) => row.group === "scroll"),
    potion: rows.filter((row) => row.group === "potion"),
    found: rows.filter((row) => row.group === "found"),
    crafted: rows.filter((row) => row.group === "crafted")
  };

  els.salesRowsContainer.innerHTML = `
    ${renderSalesGroupBlock("Wands", grouped.wand)}
    ${renderSalesGroupBlock("Scrolls", grouped.scroll)}
    ${renderSalesGroupBlock("Potions", grouped.potion)}
    ${renderSalesGroupBlock("Found", grouped.found)}
    ${renderSalesGroupBlock("Crafted", grouped.crafted)}
  `;
}

function renderSalesGroupBlock(title, rows) {
  if (!rows.length) {
    return `
      <div class="top-gap">
        <h4>${escapeHtml(title)}</h4>
        <p class="hint">No ${escapeHtml(title.toLowerCase())} items with QoH.</p>
      </div>
    `;
  }

  return `
    <div class="top-gap">
      <h4>${escapeHtml(title)}</h4>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Location</th>
              <th>Item</th>
              <th>QoH</th>
              <th>X Sold</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((row) => `
              <tr>
                <td>${escapeHtml(row.locationName)}</td>
                <td>${escapeHtml(row.itemName)}</td>
                <td>${formatInt(row.qoh)}</td>
                <td><input class="sale-qty-input" data-sale-qty type="number" min="0" step="1" value="0" /></td>
                <td><button type="button" data-action="mark-sold" data-location-id="${escapeHtml(row.locationId)}" data-item-id="${escapeHtml(row.itemId)}" class="secondary">Mark Sold</button></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function recordSale(locationId, itemId, qty) {
  if (!locationId || !itemId) {
    alert("Pick a location and item.");
    return;
  }

  if (qty <= 0) {
    alert("Enter sold quantity greater than 0.");
    return;
  }

  const item = state.inventoryItems.find((entry) => entry.id === itemId);
  if (!item) return;

  if (!item.stocks) item.stocks = {};
  const current = Math.max(0, Math.floor(num(item.stocks[locationId])));
  item.stocks[locationId] = Math.max(0, current - qty);

  saveState(state);
  render();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

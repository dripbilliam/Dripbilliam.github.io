import {
  CRAFT_ITEM_TYPES,
  deriveCraftedUnitCost,
  estimateUnitCostFromSpell,
  PROFESSIONS,
  ensureState,
  findTax,
  getItemPriceForLocation,
  gold,
  itemLabel,
  loadState,
  normalizeType,
  num,
  saveState,
  totalQoh,
  uid
} from "./store-data.js";

let state = ensureState(loadState());
let searchTerm = "";
let isEditorOpen = false;
let showAllInventoryItems = true;

const els = {
  inventoryBrowsePage: document.getElementById("inventoryBrowsePage"),
  inventoryEditorPage: document.getElementById("inventoryEditorPage"),
  addInventoryItemBtn: document.getElementById("addInventoryItemBtn"),
  inventorySearchInput: document.getElementById("inventorySearchInput"),
  showAllInventoryToggle: document.getElementById("showAllInventoryToggle"),
  inventoryItemList: document.getElementById("inventoryItemList"),
  itemModalTitle: document.getElementById("itemModalTitle"),
  closeItemEditorBtn: document.getElementById("closeItemModalBtn"),
  itemNameInput: document.getElementById("itemNameInput"),
  itemTypeInput: document.getElementById("itemTypeInput"),
  spellBasedFields: document.getElementById("spellBasedFields"),
  craftedFields: document.getElementById("craftedFields"),
  recipeTitle: document.getElementById("recipeTitle"),
  childItemsWrap: document.getElementById("childItemsWrap"),
  itemSpellInput: document.getElementById("itemSpellInput"),
  itemSpellCraftKindInput: document.getElementById("itemSpellCraftKindInput"),
  itemWandCapOverrideInput: document.getElementById("itemWandCapOverrideInput"),
  itemWandCapOverrideWrap: document.getElementById("itemWandCapOverrideWrap"),
  itemUnitCostInput: document.getElementById("itemUnitCostInput"),
  itemStackableInput: document.getElementById("itemStackableInput"),
  itemStackCountInput: document.getElementById("itemStackCountInput"),
  itemCraftPointsInput: document.getElementById("itemCraftPointsInput"),
  itemCraftDcInput: document.getElementById("itemCraftDcInput"),
  itemCraftOutputQtyInput: document.getElementById("itemCraftOutputQtyInput"),
  itemDisableDerivedCostInput: document.getElementById("itemDisableDerivedCostInput"),
  itemDerivedCostValue: document.getElementById("itemDerivedCostValue"),
  itemCraftPointCostValue: document.getElementById("itemCraftPointCostValue"),
  itemCraftPointCostFormula: document.getElementById("itemCraftPointCostFormula"),
  itemProfessionInput: document.getElementById("itemProfessionInput"),
  addChildItemBtn: document.getElementById("addChildItemBtn"),
  childItemRows: document.getElementById("childItemRows"),
  itemNotesInput: document.getElementById("itemNotesInput"),
  itemLocationRows: document.getElementById("itemLocationRows"),
  itemTotalQty: document.getElementById("itemTotalQty"),
  itemListingCount: document.getElementById("itemListingCount"),
  itemCostValue: document.getElementById("itemCostValue"),
  itemRetailValue: document.getElementById("itemRetailValue"),
  itemReorderSignal: document.getElementById("itemReorderSignal"),
  duplicateInventoryItemBtn: document.getElementById("duplicateInventoryItemBtn"),
  deleteInventoryItemBtn: document.getElementById("deleteInventoryItemBtn"),
  lowStockRows: document.getElementById("lowStockRows"),
  unpricedStockRows: document.getElementById("unpricedStockRows")
};

bindEvents();
render();

function persist() {
  state = ensureState(state);
  saveState(state);
}

function roundMoney(value) {
  return Math.max(0, Math.round(num(value) * 100) / 100);
}

function derivePriceFromMargin(unitCost, marginPct) {
  return roundMoney(num(unitCost) * (1 + (Math.max(0, num(marginPct)) / 100)));
}

function deriveMarginFromPrice(unitCost, price) {
  const cost = Math.max(0, num(unitCost));
  const sale = Math.max(0, num(price));
  if (cost <= 0) return 0;
  return roundMoney(((sale - cost) / cost) * 100);
}

function bindEvents() {
  els.addInventoryItemBtn.addEventListener("click", () => {
    const created = {
      id: uid(),
      name: "New Item",
      type: "found",
      spellId: "",
      spellCraftKind: "potion",
      vendorId: "",
      unitCost: 0,
      stackable: false,
      stackCount: 1,
      locationConfig: Object.fromEntries(state.locations.map((location) => {
        const marginPct = 0;
        return [location.id, {
          taxId: state.settings.defaultTaxId,
          marginPct,
          price: 0,
          reorderPoint: 0,
          parDisabled: !state.settings.enableParTracking
        }];
      })),
      craftingPoints: 0,
      craftDc: 0,
      craftedOutputQty: 1,
      disableDerivedCosting: false,
      profession: "",
      wandPriceCapOverride: false,
      components: [],
      notes: "",
      stocks: Object.fromEntries(state.locations.map((location) => [location.id, 0]))
    };

    state.inventoryItems.push(created);
    state.selectedInventoryId = created.id;
    persist();
    render();
    openItemEditor("create");
  });

  els.inventorySearchInput.addEventListener("input", () => {
    searchTerm = (els.inventorySearchInput.value || "").trim().toLowerCase();
    renderItemList();
  });

  els.showAllInventoryToggle.addEventListener("change", () => {
    showAllInventoryItems = !!els.showAllInventoryToggle.checked;
    renderItemList();
  });

  els.inventoryItemList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-id]");
    if (!button) return;

    state.selectedInventoryId = button.dataset.id;
    persist();
    renderItemList();
    openItemEditor("edit");
  });

  els.lowStockRows.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action='open-item']");
    if (!button) return;
    openItemFromTable(button.dataset.id);
  });

  els.unpricedStockRows.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action='open-item']");
    if (!button) return;
    openItemFromTable(button.dataset.id);
  });

  els.closeItemEditorBtn.addEventListener("click", closeItemEditor);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isEditorOpen) closeItemEditor();
  });

  els.itemLocationRows.addEventListener("input", (event) => {
    const selected = getSelectedItem();
    if (!selected) return;

    const locationId = event.target.dataset.locationId;
    if (!locationId) return;

    const action = event.target.dataset.action;
    const config = getLocationConfig(selected, locationId);

    if (action === "qty") selected.stocks[locationId] = Math.max(0, Math.floor(num(event.target.value)));
    if (action === "reorder") config.reorderPoint = Math.max(0, Math.floor(num(event.target.value)));

    if (action !== "qty" && action !== "reorder") return;

    persist();
    renderItemSummary(selected);
    renderItemList();
    renderLowStock();
    renderUnpricedStock();
  });

  els.itemLocationRows.addEventListener("change", (event) => {
    const selected = getSelectedItem();
    if (!selected) return;

    const locationId = event.target.dataset.locationId;
    if (!locationId) return;
    const action = event.target.dataset.action;
    const config = getLocationConfig(selected, locationId);
    const isFound = selected.type === "found";

    if (action === "tax") {
      config.taxId = state.settings.taxes.some((tax) => tax.id === event.target.value)
        ? event.target.value
        : state.settings.defaultTaxId;
    }

    if (action === "margin" && !isFound) {
      config.marginPct = roundMoney(event.target.value);
      config.price = derivePriceFromMargin(selected.unitCost, config.marginPct);
    }

    if (action === "price" && !isFound) {
      config.price = roundMoney(event.target.value);
      config.marginPct = deriveMarginFromPrice(selected.unitCost, config.price);
    }

    if (action === "par-disabled") {
      config.parDisabled = !state.settings.enableParTracking || !!event.target.checked;
    }

    if (!["tax", "margin", "price", "par-disabled"].includes(action)) return;

    persist();
    renderItemDetail();
    renderItemList();
    renderLowStock();
    renderUnpricedStock();
  });

  els.childItemRows.addEventListener("input", (event) => {
    const selected = getSelectedItem();
    if (!selected) return;

    const rowId = event.target.dataset.componentId;
    const component = selected.components.find((entry) => entry.id === rowId);
    if (!component) return;

    const action = event.target.dataset.action;
    if (action !== "child-qty") return;
    if (action === "child-qty") component.qty = Math.max(1, Math.floor(num(event.target.value)));

    if (selected.type === "crafted" && selected.disableDerivedCosting !== true) {
      syncCraftedItemUnitCost(selected);
    }

    persist();
    renderItemDetail();
    renderItemList();
    renderLowStock();
    renderUnpricedStock();
  });

  els.childItemRows.addEventListener("change", (event) => {
    const selected = getSelectedItem();
    if (!selected) return;

    const rowId = event.target.dataset.componentId;
    const component = selected.components.find((entry) => entry.id === rowId);
    if (!component) return;

    const action = event.target.dataset.action;
    if (action === "child-item-search") {
      const name = String(event.target.value || "").trim().toLowerCase();
      const child = state.inventoryItems.find((entry) => entry.id !== selected.id && itemLabel(state, entry).trim().toLowerCase() === name);
      component.itemId = child?.id || "";
    }

    if (selected.type === "crafted" && selected.disableDerivedCosting !== true) {
      syncCraftedItemUnitCost(selected);
    }

    persist();
    renderItemDetail();
    renderItemList();
    renderLowStock();
    renderUnpricedStock();
  });

  els.childItemRows.addEventListener("click", (event) => {
    const selected = getSelectedItem();
    if (!selected) return;

    const action = event.target.dataset.action;
    const componentId = event.target.dataset.componentId;
    if (!action || !componentId) return;

    if (action === "remove-child") {
      selected.components = selected.components.filter((entry) => entry.id !== componentId);
      if (selected.type === "crafted" && selected.disableDerivedCosting !== true) {
        syncCraftedItemUnitCost(selected);
      }
      persist();
      renderItemDetail();
      renderItemList();
      renderLowStock();
      renderUnpricedStock();
      return;
    }

    if (action === "open-child") {
      const component = selected.components.find((entry) => entry.id === componentId);
      if (!component || !component.itemId) return;
      if (component.itemId === selected.id) return;
      state.selectedInventoryId = component.itemId;
      persist();
      render();
      openItemEditor("edit");
    }
  });

  els.addChildItemBtn.addEventListener("click", () => {
    const selected = getSelectedItem();
    if (!selected) return;
    if (selected.type !== "crafted") return;

    const defaultChild = state.inventoryItems.find((item) => item.id !== selected.id)?.id || "";
    selected.components.push({ id: uid(), itemId: defaultChild, qty: 1 });
    if (selected.disableDerivedCosting !== true) {
      syncCraftedItemUnitCost(selected);
    }
    persist();
    renderItemDetail();
    renderItemList();
    renderLowStock();
    renderUnpricedStock();
  });

  const staticFields = [
    "itemNameInput", "itemTypeInput", "itemSpellInput",
    "itemSpellCraftKindInput", "itemWandCapOverrideInput", "itemUnitCostInput",
    "itemStackableInput", "itemStackCountInput", "itemCraftPointsInput", "itemCraftDcInput", "itemCraftOutputQtyInput", "itemDisableDerivedCostInput", "itemProfessionInput", "itemNotesInput"
  ];
  staticFields.forEach((key) => {
    els[key].addEventListener("input", onItemFieldChange);
    els[key].addEventListener("change", onItemFieldChange);
  });

  els.duplicateInventoryItemBtn.addEventListener("click", () => {
    const selected = getSelectedItem();
    if (!selected) return;

    const cloned = {
      ...structuredClone(selected),
      id: uid(),
      name: `${selected.name} Copy`,
      components: Array.isArray(selected.components)
        ? selected.components.map((component) => ({ ...component, id: uid() }))
        : []
    };

    state.inventoryItems.push(cloned);
    state.selectedInventoryId = cloned.id;
    persist();
    render();
    openItemEditor("edit");
  });

  els.deleteInventoryItemBtn.addEventListener("click", () => {
    const selected = getSelectedItem();
    if (!selected) return;
    if (!confirm("Delete selected inventory item?")) return;

    state.inventoryItems = state.inventoryItems.filter((item) => item.id !== selected.id);
    state.inventoryItems.forEach((item) => {
      item.components = Array.isArray(item.components)
        ? item.components.filter((component) => component.itemId !== selected.id)
        : [];
    });
    state.specialOrders.forEach((order) => {
      order.lines = order.lines.filter((line) => line.itemId !== selected.id);
    });
    state.selectedInventoryId = state.inventoryItems[0]?.id || "";

    persist();
    render();
    closeItemEditor();
  });
}

function render() {
  renderItemList();
  renderLowStock();
  renderUnpricedStock();
  renderEditorPageState();

  if (isEditorOpen) {
    renderItemDetail();
  }
}

function renderItemList() {
  els.showAllInventoryToggle.checked = showAllInventoryItems;

  const filtered = state.inventoryItems
    .slice()
    .sort((a, b) => itemLabel(state, a).localeCompare(itemLabel(state, b)))
    .filter((item) => {
      if (!showAllInventoryItems && !hasParOrQoh(item)) return false;
      if (!searchTerm) return true;
      const haystack = `${itemLabel(state, item)}`.toLowerCase();
      return haystack.includes(searchTerm);
    });

  if (!filtered.length) {
    if (searchTerm) {
      els.inventoryItemList.innerHTML = `<p class="hint">No items match your search.</p>`;
      return;
    }

    if (!state.inventoryItems.length) {
      els.inventoryItemList.innerHTML = `<p class="hint">No items yet. Add one or seed from Craft Queue.</p>`;
      return;
    }

    if (!showAllInventoryItems) {
      els.inventoryItemList.innerHTML = `<p class="hint">No items with PAR target or QoH found. Enable Show All Items to view everything.</p>`;
      return;
    }

    els.inventoryItemList.innerHTML = `<p class="hint">No items available.</p>`;
    return;
  }

  els.inventoryItemList.innerHTML = filtered.map((item) => {
    const isSelected = item.id === state.selectedInventoryId;
    const qoh = totalQoh(item, state.locations);
    return `
      <button class="inventory-item ${isSelected ? "selected" : ""}" data-id="${item.id}">
        <span class="inventory-item-name">${escapeHtml(itemLabel(state, item))}</span>
        <span class="inventory-item-meta">QoH ${qoh}</span>
      </button>
    `;
  }).join("");
}

function openItemEditor(mode) {
  if (!getSelectedItem()) return;
  isEditorOpen = true;
  els.itemModalTitle.textContent = mode === "create" ? "Create Item" : "Edit Item";
  renderEditorPageState();
  renderItemDetail();
}

function closeItemEditor() {
  isEditorOpen = false;
  renderEditorPageState();
}

function renderEditorPageState() {
  if (els.inventoryBrowsePage) {
    els.inventoryBrowsePage.hidden = isEditorOpen;
  }
  if (els.inventoryEditorPage) {
    els.inventoryEditorPage.hidden = !isEditorOpen;
  }
}

function renderItemDetail() {
  const selected = getSelectedItem();
  if (!selected) return;

  els.itemNameInput.value = selected.name || "";
  els.itemTypeInput.value = normalizeType(selected.type);
  els.itemSpellInput.innerHTML = `<option value="">No spell item</option>` + state.spells.map((spell) => {
    return `<option value="${spell.id}" ${spell.id === selected.spellId ? "selected" : ""}>${escapeHtml(spell.name || "(Unnamed spell)")}</option>`;
  }).join("");
  els.itemSpellCraftKindInput.value = CRAFT_ITEM_TYPES.includes(selected.spellCraftKind) ? selected.spellCraftKind : "potion";
  const isWandCraft = selected.type === "crafted-spell" && selected.spellCraftKind === "wand";
  els.itemWandCapOverrideInput.checked = !!selected.wandPriceCapOverride;
  els.itemWandCapOverrideWrap.hidden = !isWandCraft;

  if (selected.type === "crafted" && selected.disableDerivedCosting !== true) {
    syncCraftedItemUnitCost(selected);
  }

  els.itemUnitCostInput.value = String(roundMoney(selected.unitCost));
  els.itemUnitCostInput.disabled = selected.type === "crafted" && selected.disableDerivedCosting !== true;
  els.itemStackableInput.checked = !!selected.stackable;
  els.itemStackCountInput.value = String(Math.max(1, Math.floor(num(selected.stackCount || 1))));
  els.itemStackCountInput.disabled = !selected.stackable;

  els.itemCraftPointsInput.value = String(Math.max(0, Math.floor(num(selected.craftingPoints))));
  els.itemCraftDcInput.value = String(Math.max(0, Math.floor(num(selected.craftDc))));
  els.itemCraftOutputQtyInput.value = String(Math.max(1, Math.floor(num(selected.craftedOutputQty || 1))));
  els.itemDisableDerivedCostInput.checked = selected.disableDerivedCosting === true;
  els.itemDerivedCostValue.textContent = gold(deriveCraftedUnitCost(state, selected));
  const craftPoints = Math.max(0, Math.floor(num(selected.craftingPoints)));
  const coinsPerCraftPoint = Math.max(0, num(state.settings.coinsPerCraftingPoint));
  const outputQty = Math.max(1, Math.floor(num(selected.craftedOutputQty || 1)));
  const craftPointCostBatch = craftPoints * coinsPerCraftPoint;
  const craftPointCostPerUnit = craftPointCostBatch / outputQty;
  els.itemCraftPointCostValue.textContent = gold(craftPointCostPerUnit);
  els.itemCraftPointCostFormula.textContent = `${craftPoints} x ${gold(coinsPerCraftPoint)} / ${outputQty}`;
  els.itemProfessionInput.innerHTML = `<option value="">Select Profession</option>` + PROFESSIONS.map((profession) => {
    return `<option value="${profession}" ${profession === selected.profession ? "selected" : ""}>${titleCase(profession)}</option>`;
  }).join("");

  els.itemNotesInput.value = selected.notes || "";

  renderTypeSpecificFields(selected);
  renderChildItems(selected);

  els.itemLocationRows.innerHTML = state.locations.map((location) => {
    const qty = Math.max(0, Math.floor(num(selected.stocks?.[location.id])));
    const config = getLocationConfig(selected, location.id);
    const isFound = selected.type === "found";
    const taxOptions = state.settings.taxes.map((tax) => {
      return `<option value="${tax.id}" ${tax.id === config.taxId ? "selected" : ""}>${escapeHtml(tax.name)} (${tax.ratePct}%)</option>`;
    }).join("");

    return `
      <tr>
        <td>${escapeHtml(location.name)}</td>
        <td><input type="number" min="0" step="1" data-action="qty" data-location-id="${location.id}" value="${qty}" /></td>
        <td><select data-action="tax" data-location-id="${location.id}">${taxOptions}</select></td>
        <td><input type="number" min="0" step="0.01" data-action="price" data-location-id="${location.id}" value="${roundMoney(config.price)}" ${isFound ? "disabled" : ""} /></td>
        <td><input type="number" min="0" step="0.01" data-action="margin" data-location-id="${location.id}" value="${roundMoney(config.marginPct)}" ${isFound ? "disabled" : ""} /></td>
        <td><input type="number" min="0" step="1" data-action="reorder" data-location-id="${location.id}" value="${Math.max(0, Math.floor(num(config.reorderPoint)))}" /></td>
        <td><input type="checkbox" data-action="par-disabled" data-location-id="${location.id}" ${config.parDisabled ? "checked" : ""} ${state.settings.enableParTracking ? "" : "disabled"} /></td>
      </tr>
    `;
  }).join("");

  renderItemSummary(selected);
}

function renderTypeSpecificFields(item) {
  const isSpellBased = item.type === "crafted-spell";
  const isCraftedOnly = item.type === "crafted";

  els.spellBasedFields.hidden = !isSpellBased;
  els.craftedFields.hidden = !isCraftedOnly;
  els.recipeTitle.hidden = !isCraftedOnly;
  els.childItemsWrap.hidden = !isCraftedOnly;
  els.addChildItemBtn.hidden = !isCraftedOnly;
}

function renderChildItems(item) {
  const isCraftedOnly = item.type === "crafted";
  if (!isCraftedOnly) {
    els.childItemRows.innerHTML = "";
    return;
  }

  if (!Array.isArray(item.components) || !item.components.length) {
    els.childItemRows.innerHTML = `<tr><td colspan="5">No child items yet.</td></tr>`;
    return;
  }

  els.childItemRows.innerHTML = item.components.map((component) => {
    const child = state.inventoryItems.find((entry) => entry.id === component.itemId) || null;
    const childUnitCost = Math.max(0, num(child?.unitCost));
    const lineCost = Math.max(1, Math.floor(num(component.qty))) * childUnitCost;
    const listId = `child-item-list-${component.id}`;
    const options = state.inventoryItems
      .filter((entry) => entry.id !== item.id)
      .map((entry) => `<option value="${escapeHtml(itemLabel(state, entry))}"></option>`)
      .join("");

    return `
      <tr>
        <td>
          <input data-action="child-item-search" data-component-id="${component.id}" type="search" list="${listId}" value="${escapeHtml(child ? itemLabel(state, child) : "")}" placeholder="Search child item" />
          <datalist id="${listId}">${options}</datalist>
        </td>
        <td><input data-action="child-qty" data-component-id="${component.id}" type="number" min="1" step="1" value="${Math.max(1, Math.floor(num(component.qty)))}" /></td>
        <td>${gold(childUnitCost)}</td>
        <td>${gold(lineCost)}</td>
        <td>
          <button type="button" data-action="open-child" data-component-id="${component.id}" class="secondary">Open</button>
          <button type="button" data-action="remove-child" data-component-id="${component.id}" class="danger">Remove</button>
        </td>
      </tr>
    `;
  }).join("");
}

function renderItemSummary(item) {
  const qty = totalQoh(item, state.locations);
  const stackCount = Math.max(1, Math.floor(num(item.stackCount || 1)));
  const listingCount = item.stackable ? Math.ceil(qty / stackCount) : qty;
  const costValue = qty * num(item.unitCost);

  const retailValue = state.locations.reduce((sum, location) => {
    const locationQty = Math.max(0, Math.floor(num(item?.stocks?.[location.id])));
    const locationPrice = getItemPriceForLocation(state, item, location.id);
    return sum + (locationQty * locationPrice);
  }, 0);

  els.itemTotalQty.textContent = String(qty);
  els.itemListingCount.textContent = String(listingCount);
  els.itemCostValue.textContent = gold(costValue);
  els.itemRetailValue.textContent = gold(retailValue);

  const lowLocations = state.locations.filter((location) => {
    const config = getLocationConfig(item, location.id);
    if (!state.settings.enableParTracking || config.parDisabled) return false;
    const target = Math.max(0, Math.floor(num(config.reorderPoint)));
    if (target <= 0) return false;
    const locationQty = Math.max(0, Math.floor(num(item?.stocks?.[location.id])));
    return locationQty < target;
  });

  if (!state.settings.enableParTracking) {
    els.itemReorderSignal.textContent = "PAR tracking disabled";
  } else if (lowLocations.length) {
    const primary = lowLocations[0];
    const tax = findTax(state, getLocationConfig(item, primary.id).taxId);
    const taxPart = tax ? ` | Tax: ${tax.name}` : "";
    els.itemReorderSignal.textContent = `Below PAR at ${lowLocations.length} location(s)${taxPart}`;
  } else {
    els.itemReorderSignal.textContent = "Stock healthy across locations";
  }
}

function renderLowStock() {
  if (!state.settings.enableParTracking) {
    els.lowStockRows.innerHTML = `<tr><td colspan="4">PAR tracking is disabled in Settings.</td></tr>`;
    return;
  }

  const rows = [];
  state.inventoryItems.forEach((item) => {
    state.locations.forEach((location) => {
      const config = getLocationConfig(item, location.id);
      if (config.parDisabled) return;
      const locationQty = Math.max(0, Math.floor(num(item?.stocks?.[location.id])));
      const target = Math.max(0, Math.floor(num(config.reorderPoint)));
      if (target <= 0) return;
      if (locationQty < target) {
        rows.push({ item, location, locationQty, target });
      }
    });
  });

  if (!rows.length) {
    els.lowStockRows.innerHTML = `<tr><td colspan="4">No low-stock items.</td></tr>`;
    return;
  }

  els.lowStockRows.innerHTML = rows.map((row) => {
    return `
      <tr>
        <td><button class="table-link-button" data-action="open-item" data-id="${row.item.id}">${escapeHtml(itemLabel(state, row.item))}</button></td>
        <td>${escapeHtml(row.location.name)}</td>
        <td>${row.locationQty}</td>
        <td>${row.target}</td>
      </tr>
    `;
  }).join("");
}

function renderUnpricedStock() {
  const rows = [];

  state.inventoryItems.forEach((item) => {
    state.locations.forEach((location) => {
      const locationQty = Math.max(0, Math.floor(num(item?.stocks?.[location.id])));
      if (locationQty <= 0) return;

      const price = Math.max(0, num(getItemPriceForLocation(state, item, location.id)));
      if (price > 0) return;

      rows.push({ item, location, locationQty, price });
    });
  });

  if (!rows.length) {
    els.unpricedStockRows.innerHTML = `<tr><td colspan="4">No stocked items without price.</td></tr>`;
    return;
  }

  els.unpricedStockRows.innerHTML = rows.map((row) => {
    return `
      <tr>
        <td><button class="table-link-button" data-action="open-item" data-id="${row.item.id}">${escapeHtml(itemLabel(state, row.item))}</button></td>
        <td>${escapeHtml(row.location.name)}</td>
        <td>${row.locationQty}</td>
        <td>${gold(row.price)}</td>
      </tr>
    `;
  }).join("");
}

function onItemFieldChange(event) {
  const selected = getSelectedItem();
  if (!selected) return;
  const sourceId = event?.target?.id || "";

  selected.name = els.itemNameInput.value;
  selected.type = normalizeType(els.itemTypeInput.value);

  if (selected.type === "crafted-spell") {
    selected.spellId = els.itemSpellInput.value;
    selected.spellCraftKind = CRAFT_ITEM_TYPES.includes(els.itemSpellCraftKindInput.value)
      ? els.itemSpellCraftKindInput.value
      : "potion";
    selected.wandPriceCapOverride = selected.spellCraftKind === "wand" && !!els.itemWandCapOverrideInput.checked;

    if (sourceId !== "itemUnitCostInput") {
      selected.unitCost = resolveSpellUnitCost(selected.spellId, selected.spellCraftKind);
      els.itemUnitCostInput.value = String(selected.unitCost);
    }
  } else {
    selected.spellId = "";
    selected.spellCraftKind = "potion";
    selected.wandPriceCapOverride = false;
  }

  selected.unitCost = roundMoney(els.itemUnitCostInput.value);

  if (selected.type === "found") {
    Object.keys(selected.locationConfig || {}).forEach((locationId) => {
      const config = getLocationConfig(selected, locationId);
      config.price = roundMoney(selected.unitCost);
      config.marginPct = 0;
    });
  }

  // If cost changes, keep per-location prices fixed and recompute displayed margins.
  Object.keys(selected.locationConfig || {}).forEach((locationId) => {
    const config = getLocationConfig(selected, locationId);
    if (selected.type !== "found") {
      config.marginPct = deriveMarginFromPrice(selected.unitCost, config.price);
    }
  });

  selected.stackable = !!els.itemStackableInput.checked;
  selected.stackCount = Math.max(1, Math.floor(num(els.itemStackCountInput.value || 1)));
  if (!selected.stackable) {
    selected.stackCount = 1;
  }

  const isCraftedOnly = selected.type === "crafted";
  if (isCraftedOnly) {
    selected.craftingPoints = Math.max(0, Math.floor(num(els.itemCraftPointsInput.value)));
    selected.craftDc = Math.max(0, Math.floor(num(els.itemCraftDcInput.value)));
    selected.craftedOutputQty = Math.max(1, Math.floor(num(els.itemCraftOutputQtyInput.value || 1)));
    selected.disableDerivedCosting = !!els.itemDisableDerivedCostInput.checked;
    selected.profession = PROFESSIONS.includes(els.itemProfessionInput.value) ? els.itemProfessionInput.value : "";
    if (!Array.isArray(selected.components)) selected.components = [];
    if (selected.disableDerivedCosting !== true) {
      syncCraftedItemUnitCost(selected);
    }
    els.itemUnitCostInput.value = String(roundMoney(selected.unitCost));
  } else {
    selected.craftingPoints = 0;
    selected.craftDc = 0;
    selected.craftedOutputQty = 1;
    selected.disableDerivedCosting = false;
    selected.profession = "";
    selected.components = [];
  }

  selected.notes = els.itemNotesInput.value;

  persist();
  renderItemDetail();
  renderItemList();
  renderLowStock();
  renderUnpricedStock();
}

function resolveSpellUnitCost(spellId, craftKind) {
  const spell = state.spells.find((entry) => entry.id === spellId);
  return roundMoney(estimateUnitCostFromSpell(spell, craftKind));
}

function syncCraftedItemUnitCost(item) {
  if (!item || item.type !== "crafted") return;
  if (item.disableDerivedCosting === true) return;
  item.unitCost = roundMoney(deriveCraftedUnitCost(state, item));
}

function getLocationConfig(item, locationId) {
  if (!item.locationConfig) item.locationConfig = {};
  if (!item.locationConfig[locationId]) {
    const isFound = item.type === "found";
    const marginPct = isFound ? 0 : Math.max(0, num(state.settings.defaultMarkupPct));
    item.locationConfig[locationId] = {
      taxId: state.settings.defaultTaxId,
      marginPct,
      price: isFound ? roundMoney(item.unitCost) : derivePriceFromMargin(item.unitCost, marginPct),
      reorderPoint: 0,
      parDisabled: !state.settings.enableParTracking
    };
  }

  const config = item.locationConfig[locationId];
  config.taxId = state.settings.taxes.some((tax) => tax.id === config.taxId) ? config.taxId : state.settings.defaultTaxId;
  if (item.type === "found") {
    config.marginPct = 0;
    config.price = roundMoney(item.unitCost);
  } else {
    config.marginPct = roundMoney(config.marginPct);
    config.price = roundMoney(config.price);
  }
  config.reorderPoint = Math.max(0, Math.floor(num(config.reorderPoint)));
  if (!state.settings.enableParTracking) {
    config.parDisabled = true;
  } else {
    config.parDisabled = !!config.parDisabled;
  }
  return config;
}

function getSelectedItem() {
  return state.inventoryItems.find((item) => item.id === state.selectedInventoryId) || null;
}

function openItemFromTable(itemId) {
  if (!itemId) return;
  if (!state.inventoryItems.some((item) => item.id === itemId)) return;
  state.selectedInventoryId = itemId;
  persist();
  renderItemList();
  openItemEditor("edit");
}

function hasParOrQoh(item) {
  const totalQty = totalQoh(item, state.locations);
  if (totalQty > 0) return true;

  return state.locations.some((location) => {
    const config = getLocationConfig(item, location.id);
    return Math.max(0, Math.floor(num(config.reorderPoint))) > 0;
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function titleCase(value) {
  return String(value || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

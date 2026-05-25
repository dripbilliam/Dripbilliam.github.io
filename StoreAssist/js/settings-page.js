import { createPortableBackup, deriveCraftedUnitCost, ensureState, findSpell, getSpellCraftYieldPerPrep, loadState, num, parsePortableBackup, saveState, uid } from "./store-data.js";

let state = ensureState(loadState());
const ALL_CLASSES_VALUE = "__all";
let importClassFilter = ALL_CLASSES_VALUE;

const BASE_ITEM_COLUMNS = [
  "id",
  "name",
  "type",
  "spellId",
  "spellCraftKind",
  "vendorId",
  "unitCost",
  "stackable",
  "stackCount",
  "craftingPoints",
  "craftDc",
  "craftedOutputQty",
  "profession",
  "wandPriceCapOverride",
  "disableDerivedCosting",
  "notes"
];

const LOCATION_FIELD_SPECS = [
  { key: "stock", source: "stocks", valueKey: null },
  { key: "taxId", source: "locationConfig", valueKey: "taxId" },
  { key: "marginPct", source: "locationConfig", valueKey: "marginPct" },
  { key: "price", source: "locationConfig", valueKey: "price" },
  { key: "reorderPoint", source: "locationConfig", valueKey: "reorderPoint" },
  { key: "parDisabled", source: "locationConfig", valueKey: "parDisabled" }
];

const els = {
  addTaxBtn: document.getElementById("addTaxBtn"),
  taxRows: document.getElementById("taxRows"),
  defaultMarkupInput: document.getElementById("defaultMarkupInput"),
  coinsPerCraftingPointInput: document.getElementById("coinsPerCraftingPointInput"),
  updateDerivedCostingBtn: document.getElementById("updateDerivedCostingBtn"),
  parTrackingEnabledInput: document.getElementById("parTrackingEnabledInput"),
  showPricingCostColumnInput: document.getElementById("showPricingCostColumnInput"),
  addLocationBtn: document.getElementById("addLocationBtn"),
  locationRows: document.getElementById("locationRows"),
  importSpellClassFilter: document.getElementById("importSpellClassFilter"),
  backloadSpellDataBtn: document.getElementById("backloadSpellDataBtn"),
  seedSpellDataBtn: document.getElementById("seedSpellDataBtn"),
  deleteAllSpellsBtn: document.getElementById("deleteAllSpellsBtn"),
  migratePotionScrollStacksBtn: document.getElementById("migratePotionScrollStacksBtn"),
  migratePotionCostsBtn: document.getElementById("migratePotionCostsBtn"),
  migrateScrollCostsBtn: document.getElementById("migrateScrollCostsBtn"),
  migratePricesFromMarginBtn: document.getElementById("migratePricesFromMarginBtn"),
  exportItemFieldsBtn: document.getElementById("exportItemFieldsBtn"),
  importItemFieldsInput: document.getElementById("importItemFieldsInput"),
  exportItemFieldsCsvBtn: document.getElementById("exportItemFieldsCsvBtn"),
  importItemFieldsCsvInput: document.getElementById("importItemFieldsCsvInput"),
  exportFullBackupBtn: document.getElementById("exportFullBackupBtn"),
  importFullBackupInput: document.getElementById("importFullBackupInput")
};

bindEvents();
render();
hydrateImportClassFilterFromCombinedData();

function persist() {
  state = ensureState(state);
  saveState(state);
}

function roundMoney(value) {
  return Math.max(0, Math.round(num(value) * 100) / 100);
}

function deriveMarginFromPrice(unitCost, price) {
  const cost = Math.max(0, num(unitCost));
  const sale = Math.max(0, num(price));
  if (cost <= 0) return 0;
  return roundMoney(((sale - cost) / cost) * 100);
}

function derivePriceFromMargin(unitCost, marginPct) {
  return roundMoney(num(unitCost) * (1 + (Math.max(0, num(marginPct)) / 100)));
}

function syncAllCraftedDerivedCosts() {
  let updated = 0;
  state.inventoryItems.forEach((item) => {
    if (item.type !== "crafted") return;
    if (item.disableDerivedCosting === true) return;

    const nextUnitCost = deriveCraftedUnitCost(state, item);
    if (nextUnitCost !== item.unitCost) {
      updated += 1;
    }
    item.unitCost = nextUnitCost;

    Object.keys(item.locationConfig || {}).forEach((locationId) => {
      const config = item.locationConfig[locationId];
      if (!config) return;
      config.marginPct = deriveMarginFromPrice(nextUnitCost, config.price);
    });
  });
  return updated;
}

function bindEvents() {
  els.addTaxBtn.addEventListener("click", () => {
    state.settings.taxes.push({ id: `tax-${uid()}`, name: "New Tax", ratePct: 0 });
    persist();
    render();
  });

  els.defaultMarkupInput.addEventListener("input", () => {
    state.settings.defaultMarkupPct = Math.max(0, num(els.defaultMarkupInput.value));
    persist();
  });

  els.coinsPerCraftingPointInput.addEventListener("input", () => {
    state.settings.coinsPerCraftingPoint = Math.max(0, num(els.coinsPerCraftingPointInput.value));
    syncAllCraftedDerivedCosts();
    persist();
  });

  els.updateDerivedCostingBtn.addEventListener("click", () => {
    const updated = syncAllCraftedDerivedCosts();
    persist();
    alert(`Derived costing refreshed. Updated ${updated} crafted item(s).`);
  });

  els.parTrackingEnabledInput.addEventListener("change", () => {
    state.settings.enableParTracking = !!els.parTrackingEnabledInput.checked;
    if (!state.settings.enableParTracking) {
      state.inventoryItems.forEach((item) => {
        if (!item.locationConfig) item.locationConfig = {};
        state.locations.forEach((location) => {
          if (!item.locationConfig[location.id]) {
            const marginPct = Math.max(0, num(state.settings.defaultMarkupPct));
            item.locationConfig[location.id] = {
              taxId: state.settings.defaultTaxId,
              marginPct,
              price: Math.max(0, num(item.unitCost)) * (1 + (marginPct / 100)),
              reorderPoint: 0,
              parDisabled: true
            };
          }
          item.locationConfig[location.id].parDisabled = true;
        });
      });
    }
    persist();
  });

  els.showPricingCostColumnInput.addEventListener("change", () => {
    state.settings.showPricingCostColumn = !!els.showPricingCostColumnInput.checked;
    persist();
  });

  els.addLocationBtn.addEventListener("click", () => {
    const name = prompt("Location name:", "");
    if (!name) return;
    const location = { id: uid(), name: name.trim() || "Location" };
    state.locations.push(location);
    state.inventoryItems.forEach((item) => {
      if (!item.stocks) item.stocks = {};
      item.stocks[location.id] = 0;
      if (!item.locationConfig) item.locationConfig = {};
      const marginPct = Math.max(0, num(state.settings.defaultMarkupPct));
      item.locationConfig[location.id] = {
        taxId: state.settings.defaultTaxId,
        marginPct,
        price: Math.max(0, num(item.unitCost)) * (1 + (marginPct / 100)),
        reorderPoint: 0,
        parDisabled: !state.settings.enableParTracking
      };
    });
    persist();
    render();
  });

  els.importSpellClassFilter.addEventListener("change", () => {
    importClassFilter = els.importSpellClassFilter.value || ALL_CLASSES_VALUE;
  });

  els.backloadSpellDataBtn.addEventListener("click", backloadSpellData);

  els.seedSpellDataBtn.addEventListener("click", () => {
    if (state.spells.length && !confirm("Replace existing spells with sample data?")) return;
    state.spells = [
      { id: uid(), name: "Camouflage", innateLevel: 3, casterLevel: 0, classes: ["Ranger", "Druid"] },
      { id: uid(), name: "Spider Skin", innateLevel: 5, casterLevel: 0, classes: ["Druid", "Shaman"] },
      { id: uid(), name: "Barkskin", innateLevel: 2, casterLevel: 0, classes: ["Druid", "Ranger", "Shaman"] },
      { id: uid(), name: "Freedom of Movement", innateLevel: 4, casterLevel: 0, classes: ["Druid", "Cleric", "Ranger"] },
      { id: uid(), name: "Death Ward", innateLevel: 4, casterLevel: 0, classes: ["Cleric", "Paladin"] }
    ];
    persist();
    alert("Spell seed complete.");
  });

  els.deleteAllSpellsBtn.addEventListener("click", () => {
    if (!state.spells.length) return;
    if (!confirm("Delete all spells? This cannot be undone.")) return;
    state.spells = [];
    persist();
    alert("All spells deleted.");
  });

  els.migratePotionScrollStacksBtn.addEventListener("click", () => {
    if (!confirm("Update all potion/scroll inventory items to stack count 100?")) return;

    let updated = 0;
    state.inventoryItems.forEach((item) => {
      const craftKind = String(item?.spellCraftKind || "").toLowerCase();
      if (craftKind !== "potion" && craftKind !== "scroll") return;

      const nextStackCount = 100;
      const currentStackCount = Math.max(1, Math.floor(num(item?.stackCount || 1)));
      const shouldBeStackable = true;

      if (currentStackCount !== nextStackCount || item.stackable !== shouldBeStackable) {
        item.stackCount = nextStackCount;
        item.stackable = shouldBeStackable;
        updated += 1;
      }
    });

    persist();
    alert(`Migration complete. Updated ${updated} item(s).`);
  });

  els.migratePotionCostsBtn.addEventListener("click", () => {
    if (!confirm("Multiply all potion crafted-spell unit costs by 10 and refresh location prices from margin settings?")) return;

    let updated = 0;

    state.inventoryItems.forEach((item) => {
      const isPotionSpellItem = item?.type === "crafted-spell" && String(item?.spellCraftKind || "").toLowerCase() === "potion";
      if (!isPotionSpellItem) return;

      const currentUnitCost = Math.max(0, num(item.unitCost));
      const nextUnitCost = Math.max(0, Math.round((currentUnitCost * 10) * 100) / 100);
      if (nextUnitCost === currentUnitCost) return;

      item.unitCost = nextUnitCost;

      if (!item.locationConfig) item.locationConfig = {};
      state.locations.forEach((location) => {
        const marginPct = Math.max(0, num(item.locationConfig?.[location.id]?.marginPct ?? state.settings.defaultMarkupPct));
        if (!item.locationConfig[location.id]) {
          item.locationConfig[location.id] = {
            taxId: state.settings.defaultTaxId,
            marginPct,
            price: nextUnitCost * (1 + (marginPct / 100)),
            reorderPoint: 0,
            parDisabled: !state.settings.enableParTracking
          };
          return;
        }

        item.locationConfig[location.id].marginPct = marginPct;
        item.locationConfig[location.id].price = nextUnitCost * (1 + (marginPct / 100));
      });

      updated += 1;
    });

    persist();
    alert(`Migration complete. Updated ${updated} potion item(s).`);
  });

  els.migrateScrollCostsBtn.addEventListener("click", () => {
    if (!confirm("Multiply all scroll crafted-spell unit costs by their legacy yield divisor and refresh location prices from margin settings?")) return;

    let updated = 0;

    state.inventoryItems.forEach((item) => {
      const isScrollSpellItem = item?.type === "crafted-spell" && String(item?.spellCraftKind || "").toLowerCase() === "scroll";
      if (!isScrollSpellItem) return;

      const spell = findSpell(state, item.spellId);
      const legacyDivisor = Math.max(1, Math.floor(num(getSpellCraftYieldPerPrep(spell, "scroll"))));
      const currentUnitCost = Math.max(0, num(item.unitCost));
      const nextUnitCost = Math.max(0, Math.round((currentUnitCost * legacyDivisor) * 100) / 100);
      if (nextUnitCost === currentUnitCost) return;

      item.unitCost = nextUnitCost;

      if (!item.locationConfig) item.locationConfig = {};
      state.locations.forEach((location) => {
        const marginPct = Math.max(0, num(item.locationConfig?.[location.id]?.marginPct ?? state.settings.defaultMarkupPct));
        if (!item.locationConfig[location.id]) {
          item.locationConfig[location.id] = {
            taxId: state.settings.defaultTaxId,
            marginPct,
            price: nextUnitCost * (1 + (marginPct / 100)),
            reorderPoint: 0,
            parDisabled: !state.settings.enableParTracking
          };
          return;
        }

        item.locationConfig[location.id].marginPct = marginPct;
        item.locationConfig[location.id].price = nextUnitCost * (1 + (marginPct / 100));
      });

      updated += 1;
    });

    persist();
    alert(`Migration complete. Updated ${updated} scroll item(s).`);
  });

  els.migratePricesFromMarginBtn.addEventListener("click", () => {
    if (!confirm("Rebuild all location prices from unit cost and margin values? Found items will be set to unit cost.")) return;

    let updated = 0;

    state.inventoryItems.forEach((item) => {
      if (!item.locationConfig) item.locationConfig = {};

      state.locations.forEach((location) => {
        const locationId = location.id;

        if (!item.locationConfig[locationId]) {
          const marginPct = Math.max(0, num(state.settings.defaultMarkupPct));
          item.locationConfig[locationId] = {
            taxId: state.settings.defaultTaxId,
            marginPct,
            price: derivePriceFromMargin(item.unitCost, marginPct),
            reorderPoint: 0,
            parDisabled: !state.settings.enableParTracking
          };
        }

        const config = item.locationConfig[locationId];
        const prevPrice = roundMoney(config.price);

        if (item.type === "found") {
          config.marginPct = 0;
          config.price = roundMoney(item.unitCost);
        } else {
          config.marginPct = roundMoney(config.marginPct);
          config.price = derivePriceFromMargin(item.unitCost, config.marginPct);
        }

        if (roundMoney(config.price) !== prevPrice) {
          updated += 1;
        }
      });
    });

    persist();
    alert(`Migration complete. Rebuilt ${updated} location price entr${updated === 1 ? "y" : "ies"}.`);
  });

  els.exportItemFieldsBtn.addEventListener("click", () => {
    const payload = {
      app: "StoreAssistItemFields",
      backupVersion: 1,
      exportedAt: new Date().toISOString(),
      itemCount: state.inventoryItems.length,
      // Keep a direct full-copy of inventory items so all fields are round-trippable.
      items: state.inventoryItems.map((item) => JSON.parse(JSON.stringify(item)))
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `storeassist-item-fields-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  });

  els.exportItemFieldsCsvBtn.addEventListener("click", () => {
    const { columns, rows } = buildItemCsvRows(state);
    const csv = toCsv(rows, columns);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `storeassist-item-fields-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  });

  els.importItemFieldsInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const parsed = JSON.parse(await file.text());
      const incomingItems = extractIncomingItems(parsed);
      applyImportedItems(incomingItems);
    } catch {
      alert("Import failed. Please provide a valid item fields JSON file.");
    } finally {
      event.target.value = "";
    }
  });

  els.importItemFieldsCsvInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const raw = await file.text();
      const rows = parseCsv(raw);
      if (!rows.length) {
        alert("Import failed: CSV has no rows.");
        return;
      }

      const { items: incomingItems, errors } = parseItemCsvRows(rows, state);

      if (errors.length) {
        alert(`Import failed: invalid CSV data at ${errors.slice(0, 10).join(", ")}.`);
        return;
      }

      applyImportedItems(incomingItems);
    } catch {
      alert("Import failed. Please provide a valid item fields CSV file.");
    } finally {
      event.target.value = "";
    }
  });

  els.exportFullBackupBtn.addEventListener("click", () => {
    const backup = createPortableBackup(state);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `storeassist-full-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  });

  els.importFullBackupInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const parsed = JSON.parse(await file.text());
      state = parsePortableBackup(parsed);
      persist();
      render();
      alert("Full backup import complete.");
    } catch {
      alert("Import failed. Please provide a valid StoreAssist backup JSON file.");
    } finally {
      event.target.value = "";
    }
  });
}

function render() {
  els.defaultMarkupInput.value = String(Math.max(0, num(state.settings.defaultMarkupPct)));
  els.coinsPerCraftingPointInput.value = String(Math.max(0, num(state.settings.coinsPerCraftingPoint)));
  els.parTrackingEnabledInput.checked = state.settings.enableParTracking !== false;
  els.showPricingCostColumnInput.checked = state.settings.showPricingCostColumn === true;
  renderTaxes();
  renderLocations();
  renderImportClassFilter(collectKnownClasses(state.spells));
}

function renderTaxes() {
  els.taxRows.innerHTML = state.settings.taxes.map((tax) => `
    <tr>
      <td><input data-action="name" data-id="${tax.id}" value="${escapeHtml(tax.name)}" /></td>
      <td><input data-action="rate" data-id="${tax.id}" type="number" min="0" step="0.01" value="${Math.max(0, num(tax.ratePct))}" /></td>
      <td><input data-action="default" data-id="${tax.id}" type="radio" name="defaultTax" ${tax.id === state.settings.defaultTaxId ? "checked" : ""} /></td>
      <td><button data-action="delete" data-id="${tax.id}" class="danger">Delete</button></td>
    </tr>
  `).join("");

  els.taxRows.querySelectorAll("input[data-action='name'], input[data-action='rate']").forEach((input) => {
    input.addEventListener("input", (event) => {
      const tax = state.settings.taxes.find((entry) => entry.id === event.target.dataset.id);
      if (!tax) return;
      if (event.target.dataset.action === "name") tax.name = event.target.value || tax.name;
      if (event.target.dataset.action === "rate") tax.ratePct = Math.max(0, num(event.target.value));
      persist();
    });
  });

  els.taxRows.querySelectorAll("input[data-action='default']").forEach((radio) => {
    radio.addEventListener("change", (event) => {
      state.settings.defaultTaxId = event.target.dataset.id;
      persist();
    });
  });

  els.taxRows.querySelectorAll("button[data-action='delete']").forEach((button) => {
    button.addEventListener("click", (event) => {
      if (state.settings.taxes.length <= 1) {
        alert("At least one tax class is required.");
        return;
      }

      const id = event.target.dataset.id;
      state.settings.taxes = state.settings.taxes.filter((entry) => entry.id !== id);
      if (state.settings.defaultTaxId === id) {
        state.settings.defaultTaxId = state.settings.taxes[0].id;
      }
      state.inventoryItems.forEach((item) => {
        Object.values(item.locationConfig || {}).forEach((config) => {
          if (config.taxId === id) config.taxId = state.settings.defaultTaxId;
        });
      });
      persist();
      render();
    });
  });
}

function renderLocations() {
  els.locationRows.innerHTML = state.locations.map((location) => `
    <tr>
      <td>${escapeHtml(location.name)}</td>
      <td>
        <button data-action="rename" data-id="${location.id}" class="secondary">Rename</button>
        <button data-action="delete" data-id="${location.id}" class="danger">Delete</button>
      </td>
    </tr>
  `).join("");

  els.locationRows.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", (event) => {
      const action = event.target.dataset.action;
      const id = event.target.dataset.id;

      if (action === "rename") {
        const row = state.locations.find((entry) => entry.id === id);
        if (!row) return;
        const next = prompt("Rename location:", row.name);
        if (!next) return;
        row.name = next.trim() || row.name;
        persist();
        render();
        return;
      }

      if (action === "delete") {
        if (state.locations.length <= 1) {
          alert("At least one location is required.");
          return;
        }

        state.locations = state.locations.filter((entry) => entry.id !== id);
        const fallback = state.locations[0].id;
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
    });
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

async function backloadSpellData() {
  const classLabel = importClassFilter === ALL_CLASSES_VALUE
    ? "All Classes"
    : (els.importSpellClassFilter.selectedOptions[0]?.textContent || "Selected Class");

  if (!confirm(`Backload spells from combinedSpellFeatData.json for ${classLabel}? This will merge by spell name and set caster level to 0.`)) return;

  try {
    const response = await fetch("combinedSpellFeatData.json", { cache: "no-store" });
    if (!response.ok) {
      alert("Backload failed: could not read combinedSpellFeatData.json.");
      return;
    }

    const payload = await response.json();
    if (!Array.isArray(payload)) {
      alert("Backload failed: unexpected JSON format.");
      return;
    }

    const byName = new Map(state.spells.map((spell) => [normalizeSpellName(spell.name), spell]));
    let added = 0;
    let updated = 0;

    payload.forEach((entry) => {
      if (String(entry?.type || "").toLowerCase() !== "spell") return;

      const name = String(entry?.name || "").trim();
      if (!name) return;

      const classes = parsePayloadClasses(entry?.classes);
      if (importClassFilter !== ALL_CLASSES_VALUE && !classes.some((className) => normalizeClassKey(className) === importClassFilter)) {
        return;
      }

      const innateLevel = Math.max(0, Math.min(9, Math.floor(num(entry?.innateLevel))));
      const key = normalizeSpellName(name);
      const existing = byName.get(key);

      if (existing) {
        existing.name = name;
        existing.innateLevel = innateLevel;
        existing.classes = classes;
        existing.casterLevel = 0;
        updated += 1;
      } else {
        const created = {
          id: uid(),
          name,
          innateLevel,
          casterLevel: 0,
          classes
        };
        state.spells.push(created);
        byName.set(key, created);
        added += 1;
      }
    });

    renderImportClassFilter(collectKnownClasses(state.spells), payload);
    persist();
    alert(`Backload complete (${classLabel}). Added ${added} spells and updated ${updated}.`);
  } catch {
    alert("Backload failed: unable to parse combinedSpellFeatData.json.");
  }
}

async function hydrateImportClassFilterFromCombinedData() {
  try {
    const response = await fetch("combinedSpellFeatData.json", { cache: "no-store" });
    if (!response.ok) return;
    const payload = await response.json();
    if (!Array.isArray(payload)) return;
    renderImportClassFilter(collectKnownClasses(state.spells), payload);
  } catch {
    // Keep fallback options from current spell state.
  }
}

function renderImportClassFilter(existingClasses, payload = null) {
  const classMap = new Map();

  existingClasses.forEach((entry) => {
    const key = normalizeClassKey(entry);
    if (!key || classMap.has(key)) return;
    classMap.set(key, entry);
  });

  if (Array.isArray(payload)) {
    payload.forEach((entry) => {
      if (String(entry?.type || "").toLowerCase() !== "spell") return;
      parsePayloadClasses(entry?.classes).forEach((className) => {
        const key = normalizeClassKey(className);
        if (!key || classMap.has(key)) return;
        classMap.set(key, className);
      });
    });
  }

  const options = [`<option value="${ALL_CLASSES_VALUE}">All Classes</option>`]
    .concat(Array.from(classMap.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([key, label]) => `<option value="${escapeHtml(key)}">${escapeHtml(label)}</option>`));

  els.importSpellClassFilter.innerHTML = options.join("");

  if (importClassFilter !== ALL_CLASSES_VALUE && !classMap.has(importClassFilter)) {
    importClassFilter = ALL_CLASSES_VALUE;
  }

  els.importSpellClassFilter.value = importClassFilter;
}

function collectKnownClasses(spells) {
  const seen = new Set();
  const classes = [];
  (Array.isArray(spells) ? spells : []).forEach((spell) => {
    const entries = Array.isArray(spell?.classes) ? spell.classes : [];
    entries.forEach((className) => {
      const label = String(className || "").trim();
      const key = normalizeClassKey(label);
      if (!key || seen.has(key)) return;
      seen.add(key);
      classes.push(label);
    });
  });
  return classes;
}

function parsePayloadClasses(rawClasses) {
  if (!Array.isArray(rawClasses)) return [];

  return rawClasses
    .map((entry) => {
      if (typeof entry === "string") return entry.trim();
      if (entry && typeof entry.class === "string") return entry.class.trim();
      return "";
    })
    .filter(Boolean)
    .filter((entry, index, self) => self.indexOf(entry) === index)
    .sort((a, b) => a.localeCompare(b));
}

function normalizeSpellName(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeClassKey(value) {
  return String(value || "").trim().toLowerCase();
}

function extractIncomingItems(payload) {
  if (Array.isArray(payload)) {
    return payload.filter((entry) => entry && typeof entry === "object" && typeof entry.id === "string" && entry.id.trim());
  }

  if (payload && typeof payload === "object" && Array.isArray(payload.items)) {
    return payload.items.filter((entry) => entry && typeof entry === "object" && typeof entry.id === "string" && entry.id.trim());
  }

  return [];
}

function findDuplicateItemIds(items) {
  const seen = new Set();
  const duplicates = new Set();

  items.forEach((item) => {
    const id = String(item.id || "").trim();
    if (!id) return;
    if (seen.has(id)) {
      duplicates.add(id);
      return;
    }
    seen.add(id);
  });

  return Array.from(duplicates);
}

function applyImportedItems(incomingItems) {
  if (!incomingItems.length) {
    alert("Import failed: no items found.");
    return;
  }

  const duplicateIds = findDuplicateItemIds(incomingItems);
  if (duplicateIds.length) {
    alert(`Import failed: duplicate item id(s) detected in import payload: ${duplicateIds.slice(0, 10).join(", ")}`);
    return;
  }

  const existingById = new Map(state.inventoryItems.map((item) => [item.id, item]));
  const incomingById = new Map(incomingItems.map((item) => [String(item.id), item]));

  let updated = 0;
  const unknownIds = [];

  state.inventoryItems = state.inventoryItems.map((item) => {
    const incoming = incomingById.get(item.id);
    if (!incoming) return item;

    const nextItem = JSON.parse(JSON.stringify(incoming));
    nextItem.id = item.id;
    syncImportedPricingFields(item, nextItem);

    if (JSON.stringify(item) !== JSON.stringify(nextItem)) {
      updated += 1;
    }

    return nextItem;
  });

  incomingById.forEach((incoming, id) => {
    if (!existingById.has(id)) unknownIds.push(id);
  });

  let added = 0;
  if (unknownIds.length) {
    const addUnknown = confirm(
      `${unknownIds.length} imported item id(s) were not found in current data. Add them as new items using their imported UUIDs?`
    );

    if (addUnknown) {
      unknownIds.forEach((id) => {
        const incoming = incomingById.get(id);
        if (!incoming) return;
        state.inventoryItems.push(JSON.parse(JSON.stringify(incoming)));
        added += 1;
      });
    }
  }

  persist();
  render();

  const skipped = Math.max(0, unknownIds.length - added);
  alert(`Item field import complete. Updated ${updated}, added ${added}, skipped ${skipped}.`);
}

function syncImportedPricingFields(existingItem, importedItem) {
  if (!importedItem || typeof importedItem !== "object") return;
  const nextUnitCost = roundMoney(importedItem.unitCost);
  const prevUnitCost = roundMoney(existingItem?.unitCost);
  const unitCostChanged = nextUnitCost !== prevUnitCost;

  if (importedItem.type === "found") {
    Object.keys(importedItem.locationConfig || {}).forEach((locationId) => {
      const config = importedItem.locationConfig[locationId];
      if (!config) return;
      config.marginPct = 0;
      config.price = nextUnitCost;
    });
    return;
  }

  const locationIds = new Set([
    ...Object.keys(existingItem?.locationConfig || {}),
    ...Object.keys(importedItem.locationConfig || {})
  ]);

  locationIds.forEach((locationId) => {
    const prevConfig = existingItem?.locationConfig?.[locationId] || null;
    const nextConfig = importedItem?.locationConfig?.[locationId] || null;
    if (!nextConfig) return;

    const prevMargin = roundMoney(prevConfig?.marginPct);
    const prevPrice = roundMoney(prevConfig?.price);
    const nextMargin = roundMoney(nextConfig.marginPct);
    const nextPrice = roundMoney(nextConfig.price);

    const marginChanged = !!prevConfig && nextMargin !== prevMargin;
    const priceChanged = !!prevConfig && nextPrice !== prevPrice;

    if (marginChanged && !priceChanged) {
      nextConfig.price = derivePriceFromMargin(nextUnitCost, nextMargin);
      return;
    }

    if (priceChanged && !marginChanged) {
      nextConfig.marginPct = deriveMarginFromPrice(nextUnitCost, nextPrice);
      return;
    }

    // Match item editor behavior: if cost changes while neither price/margin changed,
    // keep price fixed and recompute displayed margin.
    if (unitCostChanged && !marginChanged && !priceChanged) {
      nextConfig.marginPct = deriveMarginFromPrice(nextUnitCost, nextPrice);
    }
  });
}

function buildItemCsvRows(currentState) {
  const locationIds = currentState.locations.map((location) => location.id);
  const maxComponentCount = currentState.inventoryItems.reduce((maxCount, item) => {
    const count = Array.isArray(item?.components) ? item.components.length : 0;
    return Math.max(maxCount, count);
  }, 0);

  const componentColumns = [];
  for (let i = 1; i <= maxComponentCount; i += 1) {
    componentColumns.push(`componentItemId__${i}`);
    componentColumns.push(`componentQty__${i}`);
  }

  const locationColumns = locationIds.flatMap((locationId) => (
    LOCATION_FIELD_SPECS.map((field) => `${field.key}__${locationId}`)
  ));

  const columns = [
    ...BASE_ITEM_COLUMNS,
    ...locationColumns,
    ...componentColumns
  ];

  const rows = currentState.inventoryItems.map((item) => {
    const row = {
      id: String(item?.id || ""),
      name: String(item?.name || ""),
      type: String(item?.type || ""),
      spellId: String(item?.spellId || ""),
      spellCraftKind: String(item?.spellCraftKind || ""),
      vendorId: String(item?.vendorId || ""),
      unitCost: safeNumberString(item?.unitCost),
      stackable: boolToCsv(item?.stackable),
      stackCount: safeIntegerString(item?.stackCount),
      craftingPoints: safeIntegerString(item?.craftingPoints),
      craftDc: safeIntegerString(item?.craftDc),
      craftedOutputQty: safeIntegerString(item?.craftedOutputQty),
      profession: String(item?.profession || ""),
      wandPriceCapOverride: boolToCsv(item?.wandPriceCapOverride),
      disableDerivedCosting: boolToCsv(item?.disableDerivedCosting),
      notes: String(item?.notes || "")
    };

    locationIds.forEach((locationId) => {
      const config = item?.locationConfig?.[locationId] || {};
      const stock = item?.stocks?.[locationId];

      row[`stock__${locationId}`] = safeIntegerString(stock);
      row[`taxId__${locationId}`] = String(config?.taxId || "");
      row[`marginPct__${locationId}`] = safeNumberString(config?.marginPct);
      row[`price__${locationId}`] = safeNumberString(config?.price);
      row[`reorderPoint__${locationId}`] = safeIntegerString(config?.reorderPoint);
      row[`parDisabled__${locationId}`] = boolToCsv(config?.parDisabled);
    });

    const components = Array.isArray(item?.components) ? item.components : [];
    for (let i = 1; i <= maxComponentCount; i += 1) {
      const component = components[i - 1] || null;
      row[`componentItemId__${i}`] = String(component?.itemId || "");
      row[`componentQty__${i}`] = component ? safeIntegerString(component.qty) : "";
    }

    return row;
  });

  return { columns, rows };
}

function parseItemCsvRows(rows, currentState) {
  const errors = [];
  const items = [];
  const componentIndices = collectComponentIndices(rows);

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const id = String(row.id || "").trim();
    if (!id) {
      errors.push(`row ${rowNumber} (missing id)`);
      return;
    }

    const parsed = {
      id,
      name: String(row.name || "").trim(),
      type: String(row.type || "").trim(),
      spellId: String(row.spellId || "").trim(),
      spellCraftKind: String(row.spellCraftKind || "").trim(),
      vendorId: String(row.vendorId || "").trim(),
      unitCost: parseRequiredNumber(row.unitCost, `row ${rowNumber} (unitCost)`, errors),
      stackable: parseBooleanCell(row.stackable, false),
      stackCount: parseRequiredInteger(row.stackCount, `row ${rowNumber} (stackCount)`, errors),
      craftingPoints: parseRequiredInteger(row.craftingPoints, `row ${rowNumber} (craftingPoints)`, errors),
      craftDc: parseRequiredInteger(row.craftDc, `row ${rowNumber} (craftDc)`, errors),
      craftedOutputQty: parseRequiredInteger(row.craftedOutputQty, `row ${rowNumber} (craftedOutputQty)`, errors),
      profession: String(row.profession || "").trim(),
      wandPriceCapOverride: parseBooleanCell(row.wandPriceCapOverride, false),
      disableDerivedCosting: parseBooleanCell(row.disableDerivedCosting, false),
      notes: String(row.notes || ""),
      stocks: {},
      locationConfig: {},
      components: []
    };

    currentState.locations.forEach((location) => {
      const locationId = location.id;
      const stock = parseRequiredInteger(
        row[`stock__${locationId}`],
        `row ${rowNumber} (stock__${locationId})`,
        errors
      );
      const taxId = String(row[`taxId__${locationId}`] || "").trim();
      const marginPct = parseRequiredNumber(
        row[`marginPct__${locationId}`],
        `row ${rowNumber} (marginPct__${locationId})`,
        errors
      );
      const price = parseRequiredNumber(
        row[`price__${locationId}`],
        `row ${rowNumber} (price__${locationId})`,
        errors
      );
      const reorderPoint = parseRequiredInteger(
        row[`reorderPoint__${locationId}`],
        `row ${rowNumber} (reorderPoint__${locationId})`,
        errors
      );
      const parDisabled = parseBooleanCell(row[`parDisabled__${locationId}`], false);

      parsed.stocks[locationId] = stock;
      parsed.locationConfig[locationId] = {
        taxId,
        marginPct,
        price,
        reorderPoint,
        parDisabled
      };
    });

    componentIndices.forEach((componentIndex) => {
      const itemId = String(row[`componentItemId__${componentIndex}`] || "").trim();
      const qtyCell = String(row[`componentQty__${componentIndex}`] || "").trim();
      if (!itemId && !qtyCell) return;
      if (!itemId) {
        errors.push(`row ${rowNumber} (componentItemId__${componentIndex})`);
        return;
      }
      const qty = parseRequiredInteger(
        qtyCell,
        `row ${rowNumber} (componentQty__${componentIndex})`,
        errors
      );
      parsed.components.push({ id: uid(), itemId, qty });
    });

    items.push(parsed);
  });

  return { items, errors };
}

function collectComponentIndices(rows) {
  const indices = new Set();

  rows.forEach((row) => {
    Object.keys(row).forEach((key) => {
      const itemMatch = /^componentItemId__(\d+)$/.exec(key);
      if (itemMatch) indices.add(Number(itemMatch[1]));

      const qtyMatch = /^componentQty__(\d+)$/.exec(key);
      if (qtyMatch) indices.add(Number(qtyMatch[1]));
    });
  });

  return Array.from(indices).sort((a, b) => a - b);
}

function parseRequiredInteger(value, context, errors) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    errors.push(`${context} missing`);
    return 0;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    errors.push(`${context} invalid`);
    return 0;
  }
  return Math.max(0, Math.floor(parsed));
}

function parseRequiredNumber(value, context, errors) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    errors.push(`${context} missing`);
    return 0;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    errors.push(`${context} invalid`);
    return 0;
  }
  return Math.max(0, parsed);
}

function parseBooleanCell(value, fallback) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) return !!fallback;
  if (["true", "1", "yes", "y"].includes(normalized)) return true;
  if (["false", "0", "no", "n"].includes(normalized)) return false;
  return !!fallback;
}

function boolToCsv(value) {
  return value ? "true" : "false";
}

function safeIntegerString(value) {
  if (!Number.isFinite(Number(value))) return "0";
  return String(Math.max(0, Math.floor(Number(value))));
}

function safeNumberString(value) {
  if (!Number.isFinite(Number(value))) return "0";
  return String(Math.max(0, Number(value)));
}

function toCsv(rows, columns) {
  const header = columns.map(escapeCsvCell).join(",");
  const body = rows.map((row) => columns.map((column) => escapeCsvCell(row[column])).join(",")).join("\n");
  return `${header}\n${body}`;
}

function escapeCsvCell(value) {
  const cell = String(value ?? "");
  if (!/[",\n\r]/.test(cell)) return cell;
  return `"${cell.replaceAll('"', '""')}"`;
}

function parseCsv(text) {
  const rows = [];
  let current = "";
  let row = [];
  let insideQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (insideQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === "," && !insideQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(current);
      current = "";

      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    current += char;
  }

  row.push(current);
  if (row.some((cell) => cell.length > 0)) {
    rows.push(row);
  }

  if (!rows.length) return [];

  const headers = rows[0].map((header) => String(header || "").trim());
  const records = [];

  for (let i = 1; i < rows.length; i += 1) {
    const values = rows[i];
    const record = {};
    headers.forEach((header, index) => {
      record[header] = values[index] ?? "";
    });
    records.push(record);
  }

  return records;
}

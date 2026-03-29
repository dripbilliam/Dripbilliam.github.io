import { deriveCraftedUnitCost, ensureState, findSpell, getSpellCraftYieldPerPrep, loadState, num, saveState, uid } from "./store-data.js";

let state = ensureState(loadState());
const ALL_CLASSES_VALUE = "__all";
let importClassFilter = ALL_CLASSES_VALUE;

const els = {
  addTaxBtn: document.getElementById("addTaxBtn"),
  taxRows: document.getElementById("taxRows"),
  defaultMarkupInput: document.getElementById("defaultMarkupInput"),
  coinsPerCraftingPointInput: document.getElementById("coinsPerCraftingPointInput"),
  updateDerivedCostingBtn: document.getElementById("updateDerivedCostingBtn"),
  parTrackingEnabledInput: document.getElementById("parTrackingEnabledInput"),
  addLocationBtn: document.getElementById("addLocationBtn"),
  locationRows: document.getElementById("locationRows"),
  importSpellClassFilter: document.getElementById("importSpellClassFilter"),
  backloadSpellDataBtn: document.getElementById("backloadSpellDataBtn"),
  seedSpellDataBtn: document.getElementById("seedSpellDataBtn"),
  deleteAllSpellsBtn: document.getElementById("deleteAllSpellsBtn"),
  migratePotionScrollStacksBtn: document.getElementById("migratePotionScrollStacksBtn"),
  migratePotionCostsBtn: document.getElementById("migratePotionCostsBtn"),
  migrateScrollCostsBtn: document.getElementById("migrateScrollCostsBtn")
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
}

function render() {
  els.defaultMarkupInput.value = String(Math.max(0, num(state.settings.defaultMarkupPct)));
  els.coinsPerCraftingPointInput.value = String(Math.max(0, num(state.settings.coinsPerCraftingPoint)));
  els.parTrackingEnabledInput.checked = state.settings.enableParTracking !== false;
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

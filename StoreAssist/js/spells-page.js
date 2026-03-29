import {
  allowedCraftTypesForLevel,
  createInventoryFromCraft,
  deriveCasterLevelFromCraftCost,
  ensureState,
  getSpellCraftGoldPerPrep,
  getSpellInnateLevel,
  loadState,
  saveState,
  uid,
  num,
  STORAGE_KEY
} from "./store-data.js";

let state = ensureState(loadState());
const ALL_CLASSES_VALUE = "__all";
let autogenClassFilter = ALL_CLASSES_VALUE;
let spellSearchTerm = "";
let isSpellModalOpen = false;
let spellModalMode = "create";
let activeSpellId = "";
let draftSpell = null;

const els = {
  spellRows: document.getElementById("spellRows"),
  spellSearchInput: document.getElementById("spellSearchInput"),
  addSpellBtn: document.getElementById("addSpellBtn"),
  autogenClassSelect: document.getElementById("autogenClassSelect"),
  autogenItemsBtn: document.getElementById("autogenItemsBtn"),
  exportBtn: document.getElementById("exportBtn"),
  importInput: document.getElementById("importInput"),
  clearAllBtn: document.getElementById("clearAllBtn"),
  spellModal: document.getElementById("spellModal"),
  spellModalTitle: document.getElementById("spellModalTitle"),
  closeSpellModalBtn: document.getElementById("closeSpellModalBtn"),
  saveSpellBtn: document.getElementById("saveSpellBtn"),
  saveAndPushSpellBtn: document.getElementById("saveAndPushSpellBtn"),
  spellNameInput: document.getElementById("spellNameInput"),
  spellInnateLevelInput: document.getElementById("spellInnateLevelInput"),
  spellCasterLevelInput: document.getElementById("spellCasterLevelInput"),
  spellClassesInput: document.getElementById("spellClassesInput"),
  spellPotionGoldInput: document.getElementById("spellPotionGoldInput"),
  spellWandGoldInput: document.getElementById("spellWandGoldInput"),
  spellScrollGoldInput: document.getElementById("spellScrollGoldInput")
};

bindEvents();
render();

function persist() {
  state = ensureState(state);
  saveState(state);
}

function bindEvents() {
  els.addSpellBtn.addEventListener("click", () => {
    openSpellModalForCreate();
  });

  els.spellSearchInput.addEventListener("input", () => {
    spellSearchTerm = String(els.spellSearchInput.value || "").trim().toLowerCase();
    render();
  });

  els.autogenClassSelect.addEventListener("change", () => {
    autogenClassFilter = els.autogenClassSelect.value || ALL_CLASSES_VALUE;
  });

  els.autogenItemsBtn.addEventListener("click", () => {
    autogenClassFilter = els.autogenClassSelect.value || ALL_CLASSES_VALUE;

    if (!state.spells.length) {
      alert("No spells found. Add spells first.");
      return;
    }

    const filteredSpells = state.spells.filter((spell) => {
      if (autogenClassFilter === ALL_CLASSES_VALUE) return true;
      const classes = Array.isArray(spell.classes) ? spell.classes : [];
      return classes.some((className) => normalizeClassKey(className) === autogenClassFilter);
    });

    if (!filteredSpells.length) {
      alert("No spells match the selected class filter.");
      return;
    }

    let created = 0;
    let alreadyMapped = 0;

    filteredSpells.forEach((spell) => {
      const allowedTypes = allowedCraftTypesForLevel(getSpellInnateLevel(spell));
      allowedTypes.forEach((craftType) => {
        const beforeCount = state.inventoryItems.length;
        const createdItem = createInventoryFromCraft(state, craftType, spell.id);
        if (createdItem && state.inventoryItems.length > beforeCount) created += 1;
        if (createdItem && state.inventoryItems.length === beforeCount) alreadyMapped += 1;
      });
    });

    persist();
    const skipped = Math.max(0, alreadyMapped);
    const classLabel = autogenClassFilter === ALL_CLASSES_VALUE
      ? "All Classes"
      : (els.autogenClassSelect.selectedOptions[0]?.textContent || "Selected Class");
    alert(`Auto-generation complete (${classLabel}). Created ${created} items. Skipped ${skipped} already mapped spell/type combos.`);
  });

  els.exportBtn.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `storeassist-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  });

  els.importInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      state = ensureState(parsed);
      persist();
      render();
    } catch {
      alert("Import failed. Please provide a valid JSON backup file.");
    } finally {
      event.target.value = "";
    }
  });

  els.clearAllBtn.addEventListener("click", () => {
    if (!confirm("Clear all StoreAssist data?")) return;
    localStorage.removeItem(STORAGE_KEY);
    state = ensureState(loadState());
    persist();
    render();
    closeSpellModal();
  });

  els.spellRows.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    const spellId = button.dataset.id;

    if (action === "open") {
      openSpellModalForEdit(spellId);
      return;
    }

    if (action === "delete") {
      state.spells = state.spells.filter((entry) => entry.id !== spellId);
      if (activeSpellId === spellId) closeSpellModal();
      persist();
      render();
    }
  });

  els.closeSpellModalBtn.addEventListener("click", closeSpellModal);
  els.spellModal.addEventListener("click", (event) => {
    if (event.target === els.spellModal) closeSpellModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isSpellModalOpen) closeSpellModal();
  });

  els.saveSpellBtn.addEventListener("click", () => {
    saveSpellFromModal();
  });

  els.saveAndPushSpellBtn.addEventListener("click", () => {
    saveSpellFromModal({ pushCosts: true });
  });

  els.spellNameInput.addEventListener("input", () => {
    if (!draftSpell) return;
    draftSpell.name = els.spellNameInput.value;
  });

  els.spellClassesInput.addEventListener("change", () => {
    if (!draftSpell) return;
    draftSpell.classes = parseClassList(els.spellClassesInput.value);
    syncSpellModalFields();
  });

  els.spellInnateLevelInput.addEventListener("change", () => {
    if (!draftSpell) return;
    draftSpell.innateLevel = Math.max(0, Math.min(9, Math.floor(num(els.spellInnateLevelInput.value))));
    syncSpellModalFields();
  });

  els.spellCasterLevelInput.addEventListener("change", () => {
    if (!draftSpell) return;
    draftSpell.casterLevel = Math.max(0, Math.floor(num(els.spellCasterLevelInput.value)));
    syncSpellModalFields();
  });

  els.spellPotionGoldInput.addEventListener("change", () => {
    if (!draftSpell) return;
    draftSpell.casterLevel = deriveCasterLevelFromCraftCost(draftSpell, "potion", els.spellPotionGoldInput.value);
    syncSpellModalFields();
  });

  els.spellWandGoldInput.addEventListener("change", () => {
    if (!draftSpell) return;
    draftSpell.casterLevel = deriveCasterLevelFromCraftCost(draftSpell, "wand", els.spellWandGoldInput.value);
    syncSpellModalFields();
  });

  els.spellScrollGoldInput.addEventListener("change", () => {
    if (!draftSpell) return;
    draftSpell.casterLevel = deriveCasterLevelFromCraftCost(draftSpell, "scroll", els.spellScrollGoldInput.value);
    syncSpellModalFields();
  });
}

function render() {
  renderAutogenClassSelect();

  els.spellSearchInput.value = spellSearchTerm;

  const visibleSpells = state.spells.filter((spell) => matchesSpellSearch(spell));

  if (!state.spells.length) {
    els.spellRows.innerHTML = `<tr><td colspan="7">No spells yet. Add one to begin.</td></tr>`;
    return;
  }

  if (!visibleSpells.length) {
    els.spellRows.innerHTML = `<tr><td colspan="7">No spells match your search.</td></tr>`;
    return;
  }

  els.spellRows.innerHTML = visibleSpells.map((spell) => `
    <tr>
      <td><button class="table-link-button" data-action="open" data-id="${spell.id}">${escapeHtml(spell.name || "(Unnamed spell)")}</button></td>
      <td>${num(spell.innateLevel)}</td>
      <td>${num(spell.casterLevel)}</td>
      <td>${getDisplayedCraftGold(spell, "potion")}</td>
      <td>${getDisplayedCraftGold(spell, "wand")}</td>
      <td>${getDisplayedCraftGold(spell, "scroll")}</td>
      <td><button data-action="delete" data-id="${spell.id}" class="danger">Delete</button></td>
    </tr>
  `).join("");
}

function openSpellModalForCreate() {
  spellModalMode = "create";
  activeSpellId = "";
  draftSpell = {
    name: "",
    innateLevel: 1,
    casterLevel: 0,
    classes: []
  };
  openSpellModal("Add Spell");
}

function openSpellModalForEdit(spellId) {
  const existing = state.spells.find((entry) => entry.id === spellId);
  if (!existing) return;

  spellModalMode = "edit";
  activeSpellId = spellId;
  draftSpell = {
    id: existing.id,
    name: existing.name,
    innateLevel: num(existing.innateLevel),
    casterLevel: num(existing.casterLevel),
    classes: Array.isArray(existing.classes) ? [...existing.classes] : []
  };
  openSpellModal("Edit Spell");
}

function openSpellModal(title) {
  isSpellModalOpen = true;
  els.spellModal.hidden = false;
  els.spellModal.style.display = "flex";
  els.spellModalTitle.textContent = title;
  syncSpellModalFields();
}

function closeSpellModal() {
  isSpellModalOpen = false;
  els.spellModal.hidden = true;
  els.spellModal.style.display = "none";
  draftSpell = null;
  activeSpellId = "";
}

function saveSpellFromModal(options = {}) {
  const pushCosts = options.pushCosts === true;

  if (!draftSpell) return;

  const normalized = {
    id: spellModalMode === "edit" ? activeSpellId : uid(),
    name: String(draftSpell.name || "").trim(),
    innateLevel: Math.max(0, Math.min(9, Math.floor(num(draftSpell.innateLevel)))),
    casterLevel: Math.max(0, Math.floor(num(draftSpell.casterLevel))),
    classes: parseClassList((draftSpell.classes || []).join(","))
  };

  if (spellModalMode === "edit") {
    const index = state.spells.findIndex((entry) => entry.id === activeSpellId);
    if (index === -1) return;
    state.spells[index] = normalized;
  } else {
    state.spells.push(normalized);
  }

  let syncedCount = 0;
  if (pushCosts) {
    syncedCount = syncSpellCostsToRelatedItems(normalized);
  }

  persist();
  render();
  closeSpellModal();

  if (pushCosts) {
    alert(`Saved spell and updated ${syncedCount} related item(s).`);
  }
}

function syncSpellModalFields() {
  if (!draftSpell) return;

  els.spellNameInput.value = String(draftSpell.name || "");
  els.spellInnateLevelInput.value = String(Math.max(0, Math.min(9, Math.floor(num(draftSpell.innateLevel)))));
  els.spellCasterLevelInput.value = String(Math.max(0, Math.floor(num(draftSpell.casterLevel))));
  els.spellClassesInput.value = Array.isArray(draftSpell.classes) ? draftSpell.classes.join(", ") : "";

  syncCraftCostInput(els.spellPotionGoldInput, draftSpell, "potion");
  syncCraftCostInput(els.spellWandGoldInput, draftSpell, "wand");
  syncCraftCostInput(els.spellScrollGoldInput, draftSpell, "scroll");
}

function syncCraftCostInput(inputEl, spell, craftType) {
  const enabled = allowedCraftTypesForLevel(spell?.innateLevel).includes(craftType);
  inputEl.disabled = !enabled;
  inputEl.title = enabled ? "" : "Disabled by spell level rules";
  inputEl.value = String(getDisplayedCraftGold(spell, craftType));
}

function renderAutogenClassSelect() {
  const classes = collectClasses();
  const options = [`<option value="${ALL_CLASSES_VALUE}">All Classes</option>`]
    .concat(classes.map((entry) => `<option value="${escapeHtml(entry.key)}">${escapeHtml(entry.label)}</option>`));
  els.autogenClassSelect.innerHTML = options.join("");
  if (autogenClassFilter !== ALL_CLASSES_VALUE && !classes.some((entry) => entry.key === autogenClassFilter)) {
    autogenClassFilter = ALL_CLASSES_VALUE;
  }
  els.autogenClassSelect.value = autogenClassFilter;
}

function collectClasses() {
  const classMap = new Map();
  state.spells.forEach((spell) => {
    const classes = Array.isArray(spell.classes) ? spell.classes : [];
    classes.forEach((entry) => {
      const label = String(entry || "").trim();
      const key = normalizeClassKey(label);
      if (!key || classMap.has(key)) return;
      classMap.set(key, label);
    });
  });

  return Array.from(classMap.entries())
    .map(([key, label]) => ({ key, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function parseClassList(rawValue) {
  const seen = new Set();

  return String(rawValue || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .filter((entry) => {
      const key = normalizeClassKey(entry);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function normalizeClassKey(value) {
  return String(value || "").trim().toLowerCase();
}

function getDisplayedCraftGold(spell, craftType) {
  const enabled = allowedCraftTypesForLevel(spell?.innateLevel).includes(craftType);
  if (!enabled) return 0;
  return num(getSpellCraftGoldPerPrep(spell, craftType));
}

function syncSpellCostsToRelatedItems(spell) {
  const allowedTypes = allowedCraftTypesForLevel(spell?.innateLevel);
  let updated = 0;

  state.inventoryItems.forEach((item) => {
    if (item?.type !== "crafted-spell") return;
    if (item?.spellId !== spell.id) return;

    const craftKind = String(item?.spellCraftKind || "").toLowerCase();
    const nextUnitCost = allowedTypes.includes(craftKind)
      ? Math.max(0, num(getSpellCraftGoldPerPrep(spell, craftKind)))
      : 0;

    const currentUnitCost = Math.max(0, num(item?.unitCost));
    if (currentUnitCost === nextUnitCost) return;

    item.unitCost = nextUnitCost;
    updated += 1;
  });

  return updated;
}

function matchesSpellSearch(spell) {
  if (!spellSearchTerm) return true;

  const classes = Array.isArray(spell?.classes) ? spell.classes.join(" ") : "";
  const haystack = [
    spell?.name,
    classes,
    String(num(spell?.innateLevel)),
    String(num(spell?.casterLevel))
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(spellSearchTerm);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

import {
  createInventoryFromCraft,
  CRAFT_ITEM_TYPES,
  ensureState,
  getSpellCraftGoldPerPrep,
  getSpellCraftYieldPerPrep,
  itemLabel,
  loadState,
  num,
  saveState,
  titleCase,
  gold,
  uid
} from "./store-data.js";

let state = ensureState(loadState());

const els = {
  addManualBtn: document.getElementById("addManualBtn"),
  manualJobRows: document.getElementById("manualJobRows"),
  parPrepRows: document.getElementById("parPrepRows"),
  summaryPreps: document.getElementById("summaryPreps"),
  summaryGold: document.getElementById("summaryGold")
};

bindEvents();
render();

function persist() {
  state = ensureState(state);
  saveState(state);
}

function bindEvents() {
  els.addManualBtn.addEventListener("click", () => {
    state.manualJobs.push({ id: uid(), type: "potion", spellId: state.spells[0]?.id || "", qty: 0 });
    persist();
    render();
  });
}

function render() {
  const manualJobs = state.manualJobs.map(expandManualJob);
  const parRows = getParDeficitRows();
  const parJobs = parRows.map(expandParJob);
  const allJobs = [...manualJobs, ...parJobs];

  if (!allJobs.length) {
    els.manualJobRows.innerHTML = `<tr><td colspan="9">No jobs yet. Add a manual job.</td></tr>`;
  } else {
    els.manualJobRows.innerHTML = allJobs.map((job) => `
    <tr>
      <td>${escapeHtml(job.sourceLabel)}</td>
      <td>${job.typeControlHtml}</td>
      <td>${job.spellControlHtml}</td>
      <td>${job.qtyControlHtml}</td>
      <td>${job.yieldDisplay}</td>
      <td>${job.prepsDisplay}</td>
      <td>${job.goldPerPrepDisplay}</td>
      <td>${job.totalGoldDisplay}</td>
      <td>
        ${job.actionsHtml}
      </td>
    </tr>
  `).join("");
  }

  const totalPreps = allJobs.reduce((sum, job) => sum + job.preps, 0);
  const totalGold = allJobs.reduce((sum, job) => sum + job.totalGold, 0);
  els.summaryPreps.textContent = String(totalPreps);
  els.summaryGold.textContent = gold(totalGold);

  if (manualJobs.length) {
    els.manualJobRows.querySelectorAll("input[data-source='manual'], select[data-source='manual']").forEach((el) => {
      el.addEventListener("input", onInput);
    });
  }

  if (allJobs.length) {
    els.manualJobRows.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", onButtonClick);
    });
  }

  renderParPrepRequirements(parRows);
}

function getParDeficitRows() {
  if (state.settings.enableParTracking === false) {
    return [];
  }

  const rows = [];
  state.inventoryItems.forEach((item) => {
    state.locations.forEach((location) => {
      const config = item?.locationConfig?.[location.id];
      if (!config || config.parDisabled) return;
      const target = Math.max(0, Math.floor(num(config.reorderPoint)));
      if (target <= 0) return;

      const qoh = Math.max(0, Math.floor(num(item?.stocks?.[location.id])));
      if (qoh >= target) return;

      rows.push({
        item,
        location,
        qoh,
        target,
        deficit: target - qoh
      });
    });
  });

  return rows;
}

function renderParPrepRequirements(deficitRows) {
  if (state.settings.enableParTracking === false) {
    els.parPrepRows.innerHTML = `<tr><td colspan="3">PAR tracking is disabled in Settings.</td></tr>`;
    return;
  }

  const prepMap = new Map();

  deficitRows.forEach((row) => {
    const item = row.item;
    if (!item || item.type !== "crafted-spell") return;

    const spell = state.spells.find((entry) => entry.id === item.spellId);
    if (!spell) return;

    const craftType = normalizeCraftType(item.spellCraftKind);
    const key = item.spellId;
    const yieldPerPrep = Math.max(1, Math.floor(num(getSpellCraftYieldPerPrep(spell, craftType))));
    const deficitUnits = Math.max(0, Math.floor(num(row.deficit)));
    const requiredPreps = Math.ceil(deficitUnits / yieldPerPrep);

    const existing = prepMap.get(key) || {
      spellName: spell.name || "(Unnamed spell)",
      deficitUnits: 0,
      requiredPreps: 0
    };

    existing.deficitUnits += deficitUnits;
    existing.requiredPreps += requiredPreps;
    prepMap.set(key, existing);
  });

  const preps = Array.from(prepMap.values())
    .sort((a, b) => a.spellName.localeCompare(b.spellName));

  if (!preps.length) {
    els.parPrepRows.innerHTML = `<tr><td colspan="3">No spell-based deficits found.</td></tr>`;
    return;
  }

  els.parPrepRows.innerHTML = preps.map((entry) => `
    <tr>
      <td>${escapeHtml(entry.spellName)}</td>
      <td>${entry.deficitUnits}</td>
      <td>${entry.requiredPreps}</td>
    </tr>
  `).join("");
}

function onInput(event) {
  const id = event.target.dataset.id;
  const source = event.target.dataset.source;
  if (source !== "manual") return;

  const job = state.manualJobs.find((entry) => entry.id === id);
  if (!job) return;

  const action = event.target.dataset.action;
  if (action === "type") job.type = normalizeCraftType(event.target.value);
  if (action === "spell") job.spellId = event.target.value;
  if (action === "qty") job.qty = Math.max(0, Math.floor(num(event.target.value)));

  persist();
  render();
}

function onButtonClick(event) {
  const action = event.target.dataset.action;
  const itemId = event.target.dataset.itemId;
  const locationId = event.target.dataset.locationId;

  if (action === "mark-crafted") {
    if (!itemId || !locationId) return;

    const qtyInput = els.manualJobRows.querySelector(`input[data-item-id='${itemId}'][data-location-id='${locationId}']`);
    const qty = Math.max(0, Math.floor(num(qtyInput?.value)));
    if (qty <= 0) {
      alert("Enter crafted quantity greater than 0.");
      return;
    }

    const item = state.inventoryItems.find((entry) => entry.id === itemId);
    if (!item) return;
    if (!item.stocks) item.stocks = {};
    item.stocks[locationId] = Math.max(0, Math.floor(num(item.stocks[locationId]))) + qty;

    persist();
    render();
    return;
  }

  const id = event.target.dataset.id;
  const source = event.target.dataset.source;
  if (source !== "manual") return;

  const job = state.manualJobs.find((entry) => entry.id === id);

  if (action === "delete") {
    state.manualJobs = state.manualJobs.filter((entry) => entry.id !== id);
    persist();
    render();
    return;
  }

  if (action === "seed-item" && job) {
    const created = createInventoryFromCraft(state, job.type, job.spellId);
    if (!created) {
      alert("This spell does not allow that craft type.");
      return;
    }
    state.selectedInventoryId = created.id;
    persist();
    window.location.href = "inventory.html";
  }
}

function expandManualJob(job) {
  const spell = state.spells.find((entry) => entry.id === job.spellId);
  const type = normalizeCraftType(job.type);
  const qty = Math.max(0, Math.floor(num(job.qty)));
  const yieldPerPrep = Math.max(1, Math.floor(num(getSpellCraftYieldPerPrep(spell, type))));
  const goldPerPrep = num(getSpellCraftGoldPerPrep(spell, type));
  const preps = yieldPerPrep ? Math.ceil(qty / yieldPerPrep) : 0;
  const totalGold = preps * goldPerPrep;
  return {
    ...job,
    source: "manual",
    sourceLabel: "Manual",
    type,
    qty,
    preps,
    totalGold,
    typeControlHtml: typeSelect(job.id, type),
    spellControlHtml: spellSelect(job.id, job.spellId),
    qtyControlHtml: `<input data-source="manual" data-action="qty" data-id="${job.id}" type="number" min="0" value="${qty}" />`,
    yieldDisplay: String(yieldPerPrep),
    prepsDisplay: String(preps),
    goldPerPrepDisplay: gold(goldPerPrep),
    totalGoldDisplay: gold(totalGold),
    actionsHtml: `
      <button data-source="manual" data-action="seed-item" data-id="${job.id}">Create Inventory Item</button>
      <button data-source="manual" data-action="delete" data-id="${job.id}" class="danger">Delete</button>
    `
  };
}

function expandParJob(row) {
  const item = row.item;
  const spell = state.spells.find((entry) => entry.id === item.spellId);
  const isSpellCraft = item?.type === "crafted-spell" && !!spell;
  const type = normalizeCraftType(item.spellCraftKind);
  const qty = Math.max(0, Math.floor(num(row.deficit)));

  let yieldPerPrep = 0;
  let goldPerPrep = 0;
  let preps = 0;
  let totalGold = 0;
  let typeLabel = "Restock";
  let spellLabel = `${itemLabel(state, item)} @ ${row.location.name}`;

  if (isSpellCraft) {
    yieldPerPrep = Math.max(1, Math.floor(num(getSpellCraftYieldPerPrep(spell, type))));
    goldPerPrep = num(getSpellCraftGoldPerPrep(spell, type));
    preps = Math.ceil(qty / yieldPerPrep);
    totalGold = preps * goldPerPrep;
    typeLabel = titleCase(type);
    spellLabel = `${spell.name || "(Unnamed spell)"} @ ${row.location.name}`;
  }

  return {
    source: "par",
    sourceLabel: "PAR Restock",
    preps,
    totalGold,
    typeControlHtml: escapeHtml(typeLabel),
    spellControlHtml: escapeHtml(spellLabel),
    qtyControlHtml: `<input type="number" min="1" step="1" value="${qty}" data-item-id="${item.id}" data-location-id="${row.location.id}" />`,
    yieldDisplay: isSpellCraft ? String(yieldPerPrep) : "-",
    prepsDisplay: isSpellCraft ? String(preps) : "-",
    goldPerPrepDisplay: isSpellCraft ? gold(goldPerPrep) : "-",
    totalGoldDisplay: isSpellCraft ? gold(totalGold) : "-",
    actionsHtml: `<button data-action="mark-crafted" data-item-id="${item.id}" data-location-id="${row.location.id}">Mark Crafted</button>`
  };
}

function typeSelect(id, selected) {
  const options = CRAFT_ITEM_TYPES.map((type) => `<option value="${type}" ${type === selected ? "selected" : ""}>${titleCase(type)}</option>`).join("");
  return `<select data-source="manual" data-action="type" data-id="${id}">${options}</select>`;
}

function normalizeCraftType(value) {
  return CRAFT_ITEM_TYPES.includes(value) ? value : "potion";
}

function spellSelect(id, selectedId) {
  if (!state.spells.length) return `<select data-source="manual" data-action="spell" data-id="${id}"><option value="">No spells</option></select>`;
  const options = state.spells.map((spell) => `<option value="${spell.id}" ${spell.id === selectedId ? "selected" : ""}>${escapeHtml(spell.name || "(Unnamed spell)")}</option>`).join("");
  return `<select data-source="manual" data-action="spell" data-id="${id}">${options}</select>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

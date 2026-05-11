import {
  ensureState,
  findSpell,
  itemLabel,
  loadState,
  normalizeType,
  num,
  saveState,
  titleCase
} from "./store-data.js";

let state = ensureState(loadState());
let parsedLines = [];
let matchedSummaries = [];
let unmatchedLines = [];
let selectedLocationId = "";

const els = {
  countLocationSelect: document.getElementById("countLocationSelect"),
  parseInventoryLogBtn: document.getElementById("parseInventoryLogBtn"),
  clearInventoryLogBtn: document.getElementById("clearInventoryLogBtn"),
  inventoryLogInput: document.getElementById("inventoryLogInput"),
  selectAllMatchedBtn: document.getElementById("selectAllMatchedBtn"),
  clearSelectionBtn: document.getElementById("clearSelectionBtn"),
  applySelectedCountsBtn: document.getElementById("applySelectedCountsBtn"),
  countParsedLinesValue: document.getElementById("countParsedLinesValue"),
  countMatchedLinesValue: document.getElementById("countMatchedLinesValue"),
  countMatchedItemsValue: document.getElementById("countMatchedItemsValue"),
  countUnmatchedLinesValue: document.getElementById("countUnmatchedLinesValue"),
  countSelectedRowsValue: document.getElementById("countSelectedRowsValue"),
  countMatchedRows: document.getElementById("countMatchedRows"),
  countUnmatchedRows: document.getElementById("countUnmatchedRows")
};

bindEvents();
render();

function persist() {
  state = ensureState(state);
  saveState(state);
}

function bindEvents() {
  els.countLocationSelect.addEventListener("change", () => {
    selectedLocationId = resolveLocationId(els.countLocationSelect.value);
    renderMatchedRows();
    renderCounters();
  });

  els.parseInventoryLogBtn.addEventListener("click", () => {
    parseAndMatch();
    render();
  });

  els.clearInventoryLogBtn.addEventListener("click", () => {
    els.inventoryLogInput.value = "";
    parsedLines = [];
    matchedSummaries = [];
    unmatchedLines = [];
    render();
  });

  els.selectAllMatchedBtn.addEventListener("click", () => {
    matchedSummaries.forEach((row) => {
      row.selected = true;
    });
    renderMatchedRows();
    renderCounters();
  });

  els.clearSelectionBtn.addEventListener("click", () => {
    matchedSummaries.forEach((row) => {
      row.selected = false;
    });
    renderMatchedRows();
    renderCounters();
  });

  els.countMatchedRows.addEventListener("change", (event) => {
    const rowId = event.target.dataset.rowId;
    if (!rowId) return;
    const row = matchedSummaries.find((entry) => entry.id === rowId);
    if (!row) return;

    if (event.target.dataset.action === "row-selected") {
      row.selected = !!event.target.checked;
      renderCounters();
    }
  });

  els.applySelectedCountsBtn.addEventListener("click", () => {
    if (!matchedSummaries.length) {
      alert("No matched rows to apply.");
      return;
    }

    const selectedRows = matchedSummaries.filter((row) => row.selected);
    if (!selectedRows.length) {
      alert("Select at least one matched row.");
      return;
    }

    const locationId = resolveLocationId(selectedLocationId);
    if (!locationId) {
      alert("Select a location first.");
      return;
    }

    selectedRows.forEach((row) => {
      const item = state.inventoryItems.find((entry) => entry.id === row.itemId);
      if (!item) return;
      if (!item.stocks || typeof item.stocks !== "object") item.stocks = {};
      item.stocks[locationId] = Math.max(0, Math.floor(num(row.totalQty)));
    });

    persist();
    state = ensureState(loadState());

    const updatedCount = selectedRows.length;
    parseAndMatch();
    render();
    alert(`Updated QoH for ${updatedCount} item(s) at ${locationName(locationId)}.`);
  });
}

function render() {
  if (!state.locations.length) {
    els.countLocationSelect.innerHTML = `<option value="">No locations</option>`;
    selectedLocationId = "";
  } else {
    if (!resolveLocationId(selectedLocationId)) {
      selectedLocationId = state.locations[0].id;
    }

    els.countLocationSelect.innerHTML = state.locations
      .map((location) => `<option value="${escapeHtml(location.id)}" ${location.id === selectedLocationId ? "selected" : ""}>${escapeHtml(location.name)}</option>`)
      .join("");
  }

  renderCounters();
  renderMatchedRows();
  renderUnmatchedRows();
}

function parseAndMatch() {
  const rawLines = String(els.inventoryLogInput.value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  parsedLines = rawLines.map((line) => parseInventoryLine(line));

  const matched = [];
  const unmatched = [];

  parsedLines.forEach((line, index) => {
    const match = matchParsedLine(line);
    if (!match) {
      unmatched.push({ ...line, sourceIndex: index });
      return;
    }

    matched.push({
      itemId: match.id,
      qty: line.qty,
      parsedName: line.parsedName,
      raw: line.raw,
      sourceIndex: index
    });
  });

  const grouped = new Map();
  matched.forEach((entry) => {
    const key = entry.itemId;
    if (!grouped.has(key)) {
      grouped.set(key, {
        id: `match-${key}`,
        itemId: key,
        totalQty: 0,
        matchedLines: 0,
        selected: true
      });
    }

    const row = grouped.get(key);
    row.totalQty += entry.qty;
    row.matchedLines += 1;
  });

  matchedSummaries = Array.from(grouped.values())
    .sort((a, b) => {
      const aItem = state.inventoryItems.find((entry) => entry.id === a.itemId);
      const bItem = state.inventoryItems.find((entry) => entry.id === b.itemId);
      const aLabel = aItem ? itemLabel(state, aItem) : "";
      const bLabel = bItem ? itemLabel(state, bItem) : "";
      return aLabel.localeCompare(bLabel);
    });

  unmatchedLines = unmatched;
}

function parseInventoryLine(line) {
  const trimmed = String(line || "").trim();

  let qty = 1;
  let nameSegment = trimmed;

  const qtyMatch = trimmed.match(/\sx\s(\d+)\s*:/i);
  if (qtyMatch) {
    qty = Math.max(0, Math.floor(num(qtyMatch[1])));
    nameSegment = trimmed.slice(0, qtyMatch.index).trim();
  } else {
    const lastColonIndex = trimmed.lastIndexOf(":");
    nameSegment = lastColonIndex > 0 ? trimmed.slice(0, lastColonIndex).trim() : trimmed;
  }

  const cleanedName = nameSegment.replace(/^"+|"+$/g, "").trim();

  return {
    raw: trimmed,
    parsedName: cleanedName,
    qty: Math.max(0, Math.floor(num(qty || 1)))
  };
}

function matchParsedLine(line) {
  const parsedName = String(line?.parsedName || "").trim();
  if (!parsedName) return null;

  const spellHint = parseSpellHint(parsedName);
  if (spellHint) {
    const match = matchCraftedSpellByHint(spellHint);
    if (match) return match;

    // Plain spell names are treated as scroll intent only.
    // If no scroll item exists yet, do not count this line by fallback alias matching.
    if (spellHint.kind === "scroll") return null;
  }

  const normalized = normalizeMatchKey(parsedName);
  if (!normalized) return null;

  const exact = findUniqueInventoryMatch((item) => {
    const aliases = inventoryAliases(item);
    return aliases.has(normalized);
  });
  if (exact) return exact;

  return null;
}

function parseSpellHint(name) {
  const raw = String(name || "").trim();
  if (!raw) return null;

  const lower = raw.toLowerCase();
  if (lower.startsWith("wand of ")) {
    const withoutPrefix = raw.slice(8).trim();
    const spellName = withoutPrefix.replace(/\s*\(\d+\)\s*$/i, "").trim();
    return spellName ? { kind: "wand", spellName } : null;
  }

  if (lower.startsWith("potion of ")) {
    const spellName = raw.slice(10).trim();
    return spellName ? { kind: "potion", spellName } : null;
  }

  return { kind: "scroll", spellName: raw };
}

function matchCraftedSpellByHint(hint) {
  const spellKey = normalizeMatchKey(hint.spellName);
  if (!spellKey) return null;

  const candidates = state.inventoryItems.filter((item) => {
    if (normalizeType(item.type) !== "crafted-spell") return false;
    if (hint.kind && item.spellCraftKind !== hint.kind) return false;
    const spell = findSpell(state, item.spellId);
    if (!spell) return false;
    return normalizeMatchKey(spell.name) === spellKey;
  });

  if (candidates.length === 1) return candidates[0];
  return null;
}

function inventoryAliases(item) {
  const aliases = new Set();
  const itemName = String(item?.name || "").trim();
  if (itemName) aliases.add(normalizeMatchKey(itemName));

  const labeled = itemLabel(state, item);
  if (labeled) aliases.add(normalizeMatchKey(labeled));

  if (normalizeType(item.type) === "crafted-spell") {
    const spell = findSpell(state, item.spellId);
    const spellName = String(spell?.name || "").trim();
    if (spellName) {
      if (item.spellCraftKind === "wand") aliases.add(normalizeMatchKey(`Wand of ${spellName}`));
      if (item.spellCraftKind === "potion") aliases.add(normalizeMatchKey(`Potion of ${spellName}`));
      if (item.spellCraftKind === "scroll") aliases.add(normalizeMatchKey(spellName));
    }
  }

  aliases.delete("");
  return aliases;
}

function findUniqueInventoryMatch(predicate) {
  const candidates = state.inventoryItems.filter(predicate);
  if (candidates.length !== 1) return null;
  return candidates[0];
}

function normalizeMatchKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/^"+|"+$/g, "")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\(\d+\)\s*$/g, " ")
    .replace(/[^a-z0-9+]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function renderCounters() {
  const matchedLinesCount = matchedSummaries.reduce((sum, row) => sum + row.matchedLines, 0);
  const selectedRowsCount = matchedSummaries.filter((row) => row.selected).length;

  els.countParsedLinesValue.textContent = String(parsedLines.length);
  els.countMatchedLinesValue.textContent = String(matchedLinesCount);
  els.countMatchedItemsValue.textContent = String(matchedSummaries.length);
  els.countUnmatchedLinesValue.textContent = String(unmatchedLines.length);
  els.countSelectedRowsValue.textContent = String(selectedRowsCount);
}

function renderMatchedRows() {
  if (!matchedSummaries.length) {
    els.countMatchedRows.innerHTML = `<tr><td colspan="7">No matched rows yet.</td></tr>`;
    return;
  }

  const locationId = resolveLocationId(selectedLocationId);

  els.countMatchedRows.innerHTML = matchedSummaries
    .map((row) => {
      const item = state.inventoryItems.find((entry) => entry.id === row.itemId);
      if (!item) return "";

      const currentQoh = locationId ? Math.max(0, Math.floor(num(item?.stocks?.[locationId]))) : 0;
      const typeLabel = typeText(item);

      return `
        <tr>
          <td><input type="checkbox" data-action="row-selected" data-row-id="${escapeHtml(row.id)}" ${row.selected ? "checked" : ""} /></td>
          <td>${escapeHtml(itemLabel(state, item))}</td>
          <td>${escapeHtml(typeLabel)}</td>
          <td>${Math.max(0, Math.floor(num(row.totalQty)))}</td>
          <td>${currentQoh}</td>
          <td>${Math.max(0, Math.floor(num(row.totalQty)))}</td>
          <td>${row.matchedLines}</td>
        </tr>
      `;
    })
    .join("");
}

function renderUnmatchedRows() {
  if (!unmatchedLines.length) {
    els.countUnmatchedRows.innerHTML = `<tr><td colspan="3">No unmatched lines.</td></tr>`;
    return;
  }

  els.countUnmatchedRows.innerHTML = unmatchedLines
    .map((line) => `
      <tr>
        <td>${escapeHtml(line.parsedName)}</td>
        <td>${Math.max(0, Math.floor(num(line.qty)))}</td>
        <td>${escapeHtml(line.raw)}</td>
      </tr>
    `)
    .join("");
}

function resolveLocationId(value) {
  if (!state.locations.length) return "";
  return state.locations.some((location) => location.id === value)
    ? value
    : state.locations[0].id;
}

function locationName(locationId) {
  return state.locations.find((location) => location.id === locationId)?.name || "selected location";
}

function typeText(item) {
  const type = normalizeType(item?.type);
  if (type === "crafted-spell") {
    const mode = item?.spellCraftKind ? titleCase(item.spellCraftKind) : "Spell";
    return `Crafted Spell (${mode})`;
  }
  if (type === "crafted") return "Crafted";
  return "Found";
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

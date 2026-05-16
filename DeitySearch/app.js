const DOMAIN_POWERS = [
  "Air", "Animal", "Chaos", "Cold", "Darkness", "Death", "Destruction", "Earth",
  "Evil", "Fire", "Forge", "Good", "Healing", "Illusion", "Knowledge", "Law",
  "Luck", "Magic", "Mind", "Moon", "Ooze", "Plant", "Protection", "Storm",
  "Strength", "Suffering", "Sun", "Travel", "Trickery", "Undeath", "Vermin", "War", "Water"
];

const state = {
  allDeities: [],
  deityByLabel: new Map(),
  selectedDomains: new Set(),
  selectedClericAlignments: new Set(),
  selectedDeityAlignments: new Set(),
  selectedAspects: new Set()
};

const els = {
  nameFilter: document.getElementById("nameFilter"),
  domainChips: document.getElementById("domainChips"),
  clericAlignChips: document.getElementById("clericAlignChips"),
  deityAlignChips: document.getElementById("deityAlignChips"),
  aspectChips: document.getElementById("aspectChips"),
  raceFilter: document.getElementById("raceFilter"),
  shadowFilter: document.getElementById("shadowFilter"),
  sortFilter: document.getElementById("sortFilter"),
  applyBtn: document.getElementById("applyBtn"),
  resetBtn: document.getElementById("resetBtn"),
  meta: document.getElementById("meta"),
  resultsGrid: document.getElementById("resultsGrid"),
  deityModalBackdrop: document.getElementById("deityModalBackdrop"),
  deityModalTitle: document.getElementById("deityModalTitle"),
  deityModalSub: document.getElementById("deityModalSub"),
  deityModalDetails: document.getElementById("deityModalDetails"),
  deityModalPortfolio: document.getElementById("deityModalPortfolio"),
  deityModalClose: document.getElementById("deityModalClose")
};

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function titleCase(value) {
  return String(value || "").replace(/\w\S*/g, (txt) => txt[0].toUpperCase() + txt.slice(1).toLowerCase());
}

function parseCsv(value) {
  if (!value) {
    return [];
  }
  return String(value)
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function addChip(container, label, setRef, value) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "chip";
  btn.textContent = label;
  btn.dataset.active = "false";

  btn.addEventListener("click", () => {
    if (setRef.has(value)) {
      setRef.delete(value);
      btn.dataset.active = "false";
    } else {
      setRef.add(value);
      btn.dataset.active = "true";
    }
    applyFilters();
  });

  container.appendChild(btn);
}

function initFilters(deities) {
  const allAspects = new Set();
  const allClericAligns = new Set();
  const allDeityAligns = new Set();
  const allRaces = new Set(["All"]);

  for (const deity of deities) {
    allAspects.add(deity.Aspect1);
    allAspects.add(deity.Aspect2);
    allRaces.add(deity.Race || "All Races");
    allDeityAligns.add(deity.Alignment || "");

    for (const value of deity.ClericAlignList) {
      allClericAligns.add(value);
    }
  }

  const domainList = [...DOMAIN_POWERS].sort((a, b) => a.localeCompare(b));
  for (const domain of domainList) {
    addChip(els.domainChips, domain, state.selectedDomains, domain);
  }

  for (const align of [...allClericAligns].sort()) {
    addChip(els.clericAlignChips, align, state.selectedClericAlignments, align);
  }

  for (const align of [...allDeityAligns].sort()) {
    addChip(els.deityAlignChips, align, state.selectedDeityAlignments, align);
  }

  for (const aspect of [...allAspects].filter(Boolean).sort((a, b) => a.localeCompare(b))) {
    addChip(els.aspectChips, aspect, state.selectedAspects, aspect);
  }

  const races = [...allRaces].sort((a, b) => a.localeCompare(b));
  els.raceFilter.innerHTML = "";
  for (const race of races) {
    const option = document.createElement("option");
    option.value = race;
    option.textContent = race;
    els.raceFilter.appendChild(option);
  }

  // Keep default selection stable even when alphabetical sorting moves "All".
  els.raceFilter.value = "All";
}

function domainAllowed(deity, domain) {
  const banned = new Set((deity.BannedDomains || []).map((d) => normalize(d)));
  return !banned.has(normalize(domain));
}

function hasAllSelectedDomains(deity) {
  if (!state.selectedDomains.size) {
    return true;
  }

  for (const domain of state.selectedDomains) {
    if (!domainAllowed(deity, domain)) {
      return false;
    }
  }

  return true;
}

function hasAllSelectedClericAlignments(deity) {
  if (!state.selectedClericAlignments.size) {
    return true;
  }

  const available = new Set(deity.ClericAlignList.map((a) => normalize(a)));
  for (const wanted of state.selectedClericAlignments) {
    if (!available.has(normalize(wanted))) {
      return false;
    }
  }

  return true;
}

function matchesDeityAlignment(deity) {
  if (!state.selectedDeityAlignments.size) {
    return true;
  }

  return state.selectedDeityAlignments.has(deity.Alignment);
}

function hasAllSelectedAspects(deity) {
  if (!state.selectedAspects.size) {
    return true;
  }

  const aspects = new Set([deity.Aspect1, deity.Aspect2].map((v) => normalize(v)));
  for (const wanted of state.selectedAspects) {
    if (!aspects.has(normalize(wanted))) {
      return false;
    }
  }

  return true;
}

function matchesShadowFilter(deity) {
  const mode = els.shadowFilter.value;
  if (mode === "any") {
    return true;
  }
  return mode === "yes" ? Boolean(deity.ShadowMagic) : !deity.ShadowMagic;
}

function matchesRace(deity) {
  const wanted = els.raceFilter.value;
  if (!wanted || wanted === "All") {
    return true;
  }
  return deity.Race === wanted;
}

function matchesSearch(deity) {
  const q = normalize(els.nameFilter.value);
  if (!q) {
    return true;
  }

  const haystack = [
    deity.Name,
    deity.Label,
    deity.Race,
    deity.Aspect1,
    deity.Aspect2,
    deity.Alignment,
    deity.ClericAlign,
    ...(deity.Portfolio || [])
  ].join(" | ").toLowerCase();

  return haystack.includes(q);
}

function getAllowedDomains(deity) {
  return DOMAIN_POWERS.filter((domain) => domainAllowed(deity, domain));
}

function applySort(results) {
  const mode = els.sortFilter.value;
  const sorted = [...results];

  if (mode === "alignment") {
    sorted.sort((a, b) => String(a.Alignment).localeCompare(String(b.Alignment)) || a.Name.localeCompare(b.Name));
    return sorted;
  }

  if (mode === "race") {
    sorted.sort((a, b) => String(a.Race).localeCompare(String(b.Race)) || a.Name.localeCompare(b.Name));
    return sorted;
  }

  sorted.sort((a, b) => a.Name.localeCompare(b.Name));
  return sorted;
}

function cardHtml(deity) {
  const allowedDomains = getAllowedDomains(deity);
  const bannedDomains = deity.BannedDomains || [];

  return `
    <article class="card" data-label="${escapeHtml(deity.Label)}" tabindex="0" title="Open full deity details">
      <h3>${escapeHtml(deity.Name)}
        <span class="pill">${escapeHtml(deity.Alignment)}</span>
      </h3>
      <p class="muted"><strong>Aspects:</strong> ${escapeHtml(deity.Aspect1)} | ${escapeHtml(deity.Aspect2)}</p>
      <p class="muted"><strong>Race:</strong> ${escapeHtml(deity.Race)}</p>
      <p class="muted"><strong>Cleric Align:</strong> ${escapeHtml(deity.ClericAlignList.join(", "))}</p>
      <p class="muted ${deity.ShadowMagic ? "ok" : "warn"}"><strong>Shadow Magic:</strong> ${deity.ShadowMagic ? "Yes" : "No"}</p>
      <p class="muted"><strong>Banned Domains:</strong> ${escapeHtml(bannedDomains.length ? bannedDomains.join(", ") : "None")}</p>
      <p class="muted"><strong>Allowed Domains:</strong> ${escapeHtml(allowedDomains.join(", "))}</p>
    </article>
  `;
}

function detailRowHtml(label, value) {
  return `
    <div class="detail-item">
      <div class="detail-label">${escapeHtml(label)}</div>
      <div>${escapeHtml(value)}</div>
    </div>
  `;
}

function portfolioItemHtml(entry) {
  const raw = String(entry || "").trim();
  const splitIndex = raw.indexOf(":");
  if (splitIndex > 0) {
    const key = raw.slice(0, splitIndex).trim();
    const value = raw.slice(splitIndex + 1).trim();
    return `
      <li class="portfolio-item">
        <span class="portfolio-key">${escapeHtml(key)}</span>
        <div>${escapeHtml(value)}</div>
      </li>
    `;
  }

  return `<li class="portfolio-item">${escapeHtml(raw)}</li>`;
}

function openDeityModal(deity) {
  const allowedDomains = getAllowedDomains(deity);
  const bannedDomains = deity.BannedDomains || [];

  els.deityModalTitle.textContent = deity.Name || "Unknown Deity";
  els.deityModalSub.textContent = `Label: ${deity.Label || "(none)"}`;
  els.deityModalDetails.innerHTML = [
    detailRowHtml("Alignment", deity.Alignment || "-"),
    detailRowHtml("Cleric Alignments", deity.ClericAlignList.join(", ") || "-"),
    detailRowHtml("Race", deity.Race || "-"),
    detailRowHtml("Shadow Magic", deity.ShadowMagic ? "Yes" : "No"),
    detailRowHtml("Aspect 1", deity.Aspect1 || "-"),
    detailRowHtml("Aspect 2", deity.Aspect2 || "-"),
    detailRowHtml("Banned Domains", bannedDomains.length ? bannedDomains.join(", ") : "None"),
    detailRowHtml("Allowed Domains", allowedDomains.join(", "))
  ].join("");

  const portfolio = (deity.Portfolio || []).map(portfolioItemHtml).join("");
  els.deityModalPortfolio.innerHTML = portfolio || "<li class=\"portfolio-item\">No portfolio details listed.</li>";

  els.deityModalBackdrop.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeDeityModal() {
  els.deityModalBackdrop.hidden = true;
  document.body.style.overflow = "";
}

function setupModalEvents() {
  els.resultsGrid.addEventListener("click", (event) => {
    const card = event.target.closest(".card[data-label]");
    if (!card) {
      return;
    }

    const deity = state.deityByLabel.get(card.dataset.label);
    if (deity) {
      openDeityModal(deity);
    }
  });

  els.resultsGrid.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    const card = event.target.closest(".card[data-label]");
    if (!card) {
      return;
    }

    event.preventDefault();
    const deity = state.deityByLabel.get(card.dataset.label);
    if (deity) {
      openDeityModal(deity);
    }
  });

  els.deityModalClose.addEventListener("click", closeDeityModal);

  els.deityModalBackdrop.addEventListener("click", (event) => {
    if (event.target === els.deityModalBackdrop) {
      closeDeityModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !els.deityModalBackdrop.hidden) {
      closeDeityModal();
    }
  });
}

function render(results) {
  const domainTxt = state.selectedDomains.size
    ? [...state.selectedDomains].join(", ")
    : "none";
  const clericAlignTxt = state.selectedClericAlignments.size
    ? [...state.selectedClericAlignments].join(", ")
    : "none";
  const deityAlignTxt = state.selectedDeityAlignments.size
    ? [...state.selectedDeityAlignments].join(", ")
    : "none";
  const aspectTxt = state.selectedAspects.size
    ? [...state.selectedAspects].join(", ")
    : "none";

  els.meta.innerHTML = `
    <span class="stat">Matches: ${results.length}</span>
    <span class="stat">Domains: ${domainTxt}</span>
    <span class="stat">Cleric Align: ${clericAlignTxt}</span>
    <span class="stat">Deity Align: ${deityAlignTxt}</span>
    <span class="stat">Aspects: ${aspectTxt}</span>
  `;

  if (!results.length) {
    els.resultsGrid.innerHTML = `<div class="empty">No deities match the current filters. Try removing one domain/alignment/aspect.</div>`;
    return;
  }

  els.resultsGrid.innerHTML = results.map(cardHtml).join("");
}

function applyFilters() {
  const filtered = state.allDeities.filter((deity) => {
    return hasAllSelectedDomains(deity)
      && hasAllSelectedClericAlignments(deity)
      && matchesDeityAlignment(deity)
      && hasAllSelectedAspects(deity)
      && matchesShadowFilter(deity)
      && matchesRace(deity)
      && matchesSearch(deity);
  });

  render(applySort(filtered));
}

function resetFilters() {
  state.selectedDomains.clear();
  state.selectedClericAlignments.clear();
  state.selectedDeityAlignments.clear();
  state.selectedAspects.clear();

  els.nameFilter.value = "";
  els.shadowFilter.value = "any";
  els.sortFilter.value = "name";
  els.raceFilter.value = "All";

  for (const chip of document.querySelectorAll(".chip")) {
    chip.dataset.active = "false";
  }

  applyFilters();
}

async function load() {
  const response = await fetch("./dieties.josn");
  if (!response.ok) {
    throw new Error(`Failed to load dieties.josn (${response.status})`);
  }

  const data = await response.json();
  state.allDeities = data.map((entry) => ({
    ...entry,
    ClericAlignList: parseCsv(entry.ClericAlign)
  }));

  state.deityByLabel = new Map(state.allDeities.map((deity) => [deity.Label, deity]));

  initFilters(state.allDeities);

  // Keep default sort stable on first load.
  els.sortFilter.value = "name";

  els.applyBtn.addEventListener("click", applyFilters);
  els.resetBtn.addEventListener("click", resetFilters);
  setupModalEvents();

  // Auto-apply on control changes for fast iteration.
  [els.nameFilter, els.shadowFilter, els.raceFilter, els.sortFilter].forEach((el) => {
    el.addEventListener("input", applyFilters);
    el.addEventListener("change", applyFilters);
  });

  applyFilters();
}

load().catch((err) => {
  els.meta.innerHTML = "<span class=\"stat\">Load error</span>";
  els.resultsGrid.innerHTML = `<div class=\"empty\">${err.message}</div>`;
});

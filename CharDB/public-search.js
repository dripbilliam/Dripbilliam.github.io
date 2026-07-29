(function () {
  const els = {
    raceFilterInput: document.getElementById("raceFilterInput"),
    classFilterInput: document.getElementById("classFilterInput"),
    featFilterInput: document.getElementById("featFilterInput"),
    tagFilterInput: document.getElementById("tagFilterInput"),
    applyFiltersBtn: document.getElementById("applyFiltersBtn"),
    clearFiltersBtn: document.getElementById("clearFiltersBtn"),
    resultsHeading: document.getElementById("resultsHeading"),
    resultsCount: document.getElementById("resultsCount"),
    publicSheetsResults: document.getElementById("publicSheetsResults"),
    publicStatusMessage: document.getElementById("publicStatusMessage"),
    readonlyPanel: document.getElementById("readonlyPanel"),
    readonlyTitle: document.getElementById("readonlyTitle"),
    readonlyMeta: document.getElementById("readonlyMeta"),
    readonlyLevelBody: document.getElementById("readonlyLevelBody"),
    readonlySkillsHeadRow: document.getElementById("readonlySkillsHeadRow"),
    readonlySkillsBody: document.getElementById("readonlySkillsBody"),
    closeReadonlyBtn: document.getElementById("closeReadonlyBtn")
  };

  let supabase = null;
  let allPublicSheets = [];

  function normalize(value) {
    return String(value || "").toLowerCase().trim();
  }

  function splitTokens(value) {
    return String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => item.toLowerCase());
  }

  function sanitizeTags(value) {
    return String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .join(", ");
  }

  function setStatus(message, kind) {
    els.publicStatusMessage.textContent = message || "";
    els.publicStatusMessage.classList.remove("error", "success");
    if (kind) {
      els.publicStatusMessage.classList.add(kind);
    }
  }

  function getRuntimeConfig() {
    const staticCfg = window.CHARDB_SUPABASE_CONFIG || {};
    return {
      url: (staticCfg.url || "").trim(),
      anonKey: (staticCfg.anonKey || "").trim()
    };
  }

  function extractSearchData(levelData) {
    const classes = [];
    const feats = [];

    (Array.isArray(levelData) ? levelData : []).forEach((row) => {
      if (!row || Number(row.level) <= 0) {
        return;
      }

      const classTaken = String(row.classTaken || "").trim();
      if (classTaken) {
        classes.push(classTaken);
      }

      ["feat", "bonusFeat", "grantedFeat"].forEach((field) => {
        const text = String(row[field] || "").trim();
        if (text) {
          feats.push(text);
        }
      });
    });

    return {
      classes,
      classBlob: normalize(classes.join(" | ")),
      featBlob: normalize(feats.join(" | "))
    };
  }

  function formatDate(value) {
    try {
      return new Date(value).toLocaleString();
    } catch {
      return "";
    }
  }

  function createTextCell(tag, text) {
    const node = document.createElement(tag);
    node.textContent = text;
    return node;
  }

  function getLevelRows(levelData) {
    return (Array.isArray(levelData) ? levelData : [])
      .filter((row) => row && Number(row.level) > 0)
      .sort((a, b) => Number(a.level) - Number(b.level));
  }

  function prettySkillKey(key) {
    const withSpaces = String(key || "")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .trim();

    if (!withSpaces) {
      return "Skill";
    }

    return withSpaces
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  function collectUsedSkillKeys(levelRows) {
    const keys = new Set();
    levelRows.forEach((row) => {
      Object.entries(row.skillRanks || {}).forEach(([key, value]) => {
        const text = String(value == null ? "" : value).trim();
        if (text !== "") {
          keys.add(key);
        }
      });
    });

    return Array.from(keys).sort((a, b) => prettySkillKey(a).localeCompare(prettySkillKey(b)));
  }

  function renderReadonlySheet(sheet) {
    const title = `${sheet.character_name || "Untitled"} (Read-Only)`;
    els.readonlyTitle.textContent = title;

    els.readonlyMeta.innerHTML = "";
    const metaRows = [
      ["Race", sheet.race || "-"],
      ["Tags", sheet.tags || "-"],
      ["Alignment", sheet.alignment || "-"],
      ["Updated", formatDate(sheet.updated_at) || "-"]
    ];

    metaRows.forEach(([label, value]) => {
      const block = document.createElement("div");
      block.className = "readonly-meta-item";
      block.appendChild(createTextCell("strong", `${label}: `));
      block.appendChild(createTextCell("span", value));
      els.readonlyMeta.appendChild(block);
    });

    els.readonlyLevelBody.innerHTML = "";
    els.readonlySkillsHeadRow.innerHTML = "";
    els.readonlySkillsBody.innerHTML = "";

    const levelRows = getLevelRows(sheet.level_data);
    const usedSkillKeys = collectUsedSkillKeys(levelRows);

    els.readonlySkillsHeadRow.appendChild(createTextCell("th", "Level"));
    usedSkillKeys.forEach((key) => {
      els.readonlySkillsHeadRow.appendChild(createTextCell("th", prettySkillKey(key)));
    });

    if (!usedSkillKeys.length) {
      els.readonlySkillsHeadRow.appendChild(createTextCell("th", "No Used Skills"));
    }

    levelRows.forEach((row) => {
      const tr = document.createElement("tr");
      const fields = [
        row.level,
        row.classTaken || "-",
        row.bab || "-",
        row.hp || "-",
        row.str || "-",
        row.dex || "-",
        row.con || "-",
        row.wis || "-",
        row.int || "-",
        row.cha || "-",
        row.feat || "-",
        row.bonusFeat || "-",
        row.grantedFeat || "-"
      ];

      fields.forEach((value) => tr.appendChild(createTextCell("td", String(value))));
      els.readonlyLevelBody.appendChild(tr);

      const skillTr = document.createElement("tr");
      skillTr.appendChild(createTextCell("td", String(row.level)));

      if (!usedSkillKeys.length) {
        skillTr.appendChild(createTextCell("td", "-"));
      } else {
        usedSkillKeys.forEach((key) => {
          const value = String((row.skillRanks || {})[key] ?? "").trim();
          skillTr.appendChild(createTextCell("td", value || "-"));
        });
      }

      els.readonlySkillsBody.appendChild(skillTr);
    });

    if (!levelRows.length) {
      const emptyLevel = document.createElement("tr");
      const tdLevel = document.createElement("td");
      tdLevel.colSpan = 13;
      tdLevel.textContent = "No level data.";
      emptyLevel.appendChild(tdLevel);
      els.readonlyLevelBody.appendChild(emptyLevel);

      const emptySkill = document.createElement("tr");
      const tdSkill = document.createElement("td");
      tdSkill.colSpan = Math.max(1, els.readonlySkillsHeadRow.children.length);
      tdSkill.textContent = "No skill data.";
      emptySkill.appendChild(tdSkill);
      els.readonlySkillsBody.appendChild(emptySkill);
    }

    els.readonlyPanel.classList.remove("hidden");
    els.readonlyPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function buildSheetCard(sheet) {
    const card = document.createElement("article");
    card.className = "public-sheet-card";

    const classSummary = sheet.search.classes.length
      ? Array.from(new Set(sheet.search.classes)).join(", ")
      : "-";

    card.innerHTML = `
      <h3>${sheet.character_name || "Untitled"}</h3>
      <p class="public-meta">Race: ${sheet.race || "-"}</p>
      <p class="public-meta">Tags: ${sheet.tags || "-"}</p>
      <p class="public-meta">Alignment: ${sheet.alignment || "-"}</p>
      <p class="public-meta">Classes: ${classSummary}</p>
      <p class="public-meta">Updated: ${formatDate(sheet.updated_at)}</p>
    `;

    const openBtn = document.createElement("button");
    openBtn.type = "button";
    openBtn.className = "btn ghost";
    openBtn.textContent = "Open";
    openBtn.addEventListener("click", () => renderReadonlySheet(sheet));
    card.appendChild(openBtn);

    return card;
  }

  function applyFilters() {
    const raceQuery = normalize(els.raceFilterInput.value);
    const classTokens = splitTokens(els.classFilterInput.value);
    const featTokens = splitTokens(els.featFilterInput.value);
    const tagTokens = splitTokens(els.tagFilterInput.value);

    const filtered = allPublicSheets.filter((sheet) => {
      const raceOk = !raceQuery || normalize(sheet.race).includes(raceQuery);
      if (!raceOk) {
        return false;
      }

      const classesOk = classTokens.every((token) => sheet.search.classBlob.includes(token));
      if (!classesOk) {
        return false;
      }

      const featsOk = featTokens.every((token) => sheet.search.featBlob.includes(token));
      if (!featsOk) {
        return false;
      }

      const tagsOk = tagTokens.every((token) => sheet.search.tagBlob.includes(token));
      return tagsOk;
    });

    renderResults(filtered);
  }

  function renderResults(rows) {
    els.publicSheetsResults.innerHTML = "";

    if (!rows.length) {
      const empty = document.createElement("p");
      empty.className = "muted-text";
      empty.textContent = "No public sheets match these filters.";
      els.publicSheetsResults.appendChild(empty);
      els.resultsCount.textContent = "0 results";
      return;
    }

    const frag = document.createDocumentFragment();
    rows.forEach((sheet) => frag.appendChild(buildSheetCard(sheet)));
    els.publicSheetsResults.appendChild(frag);
    els.resultsCount.textContent = `${rows.length} result${rows.length === 1 ? "" : "s"}`;
  }

  async function loadPublicSheets() {
    let data = null;
    let error = null;

    const primaryQuery = await supabase
      .from("character_sheets")
      .select("id, character_name, race, tags, alignment, level_data, updated_at, is_public")
      .eq("is_public", true)
      .order("updated_at", { ascending: false })
      .limit(500);

    data = primaryQuery.data;
    error = primaryQuery.error;

    const missingTagsColumn = error && /column\s+character_sheets\.tags\s+does not exist/i.test(String(error.message || ""));
    if (missingTagsColumn) {
      const fallbackQuery = await supabase
        .from("character_sheets")
        .select("id, character_name, race, alignment, level_data, updated_at, is_public")
        .eq("is_public", true)
        .order("updated_at", { ascending: false })
        .limit(500);

      data = (fallbackQuery.data || []).map((sheet) => ({ ...sheet, tags: "" }));
      error = fallbackQuery.error;
      if (!error) {
        setStatus("Loaded without tags. Run CharDB schema migration to enable tag search.", "warning");
      }
    }

    if (error) {
      setStatus(`Failed to load public sheets: ${error.message}`, "error");
      return;
    }

    allPublicSheets = (data || []).map((sheet) => ({
      ...sheet,
      tags: sanitizeTags(sheet.tags || ""),
      search: extractSearchData(sheet.level_data)
    }));

    allPublicSheets.forEach((sheet) => {
      sheet.search.tagBlob = normalize(sheet.tags || "");
    });

    renderResults(allPublicSheets);
    setStatus(`Loaded ${allPublicSheets.length} public sheets.`, "success");
  }

  function wireEvents() {
    els.applyFiltersBtn.addEventListener("click", applyFilters);
    els.closeReadonlyBtn.addEventListener("click", () => {
      els.readonlyPanel.classList.add("hidden");
    });
    els.clearFiltersBtn.addEventListener("click", () => {
      els.raceFilterInput.value = "";
      els.classFilterInput.value = "";
      els.featFilterInput.value = "";
      els.tagFilterInput.value = "";
      renderResults(allPublicSheets);
    });
  }

  function bootSupabaseClient() {
    const cfg = getRuntimeConfig();

    if (!cfg.url || !cfg.anonKey) {
      setStatus("Missing Supabase config in supabase.config.js.", "error");
      return false;
    }

    if (typeof window.supabase === "undefined" || !window.supabase.createClient) {
      setStatus("Supabase JS failed to load.", "error");
      return false;
    }

    supabase = window.supabase.createClient(cfg.url, cfg.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });

    return true;
  }

  async function init() {
    wireEvents();
    if (!bootSupabaseClient()) {
      return;
    }
    await loadPublicSheets();
  }

  init();
})();

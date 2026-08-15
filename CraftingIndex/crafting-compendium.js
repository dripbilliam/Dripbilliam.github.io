(function () {
  'use strict';

  const STORAGE = {
    queue: 'craftingCompendium.queue.v2',
    prefs: 'craftingCompendium.prefs.v2',
  };

  const DEFAULT_DETAILS_FILENAME = 'recipe-details.json';
  const LEGACY_DETAILS_FILENAME = 'arelith-recipe-details-2026-08-11T02-27-39-871Z.json';

  const state = {
    data: null,
    advancedOn: false,
    view: { type: 'home' },
    queue: [],
    detailsUploadData: null,
    pendingChoice: null,
  };

  const els = {};

  function normalizeName(value) {
    return String(value || '').trim().toLowerCase();
  }

  function escapeHtml(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function toInt(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function nowId() {
    return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function setStatus(text, meta, isWarning) {
    els.loadStatus.textContent = text;
    els.loadStatus.classList.toggle('warning', !!isWarning);
    els.loadMeta.textContent = meta || '';
  }

  function applyAdvancedUi() {
    document.body.classList.toggle('advanced-on', state.advancedOn);
    if (els.advancedModeToggle) {
      els.advancedModeToggle.checked = !!state.advancedOn;
    }
  }

  function getQueryParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name) || '';
  }

  function normalizeBase(value) {
    const v = String(value || '').trim();
    if (!v) {
      return '';
    }
    return v.endsWith('/') ? v : `${v}/`;
  }

  function candidateUrls(fileName, remoteBase) {
    const list = [];
    const base = normalizeBase(remoteBase);
    const qBase = normalizeBase(getQueryParam('remoteBase'));

    if (base) {
      list.push(`${base}${fileName}`);
    }
    if (qBase && qBase !== base) {
      list.push(`${qBase}${fileName}`);
    }

    list.push(fileName);
    list.push(`./${fileName}`);

    if (window.location.hostname.includes('github.io')) {
      list.push(new URL(fileName, new URL('./', window.location.href)).toString());
    }

    const deduped = [];
    const seen = new Set();
    for (const entry of list) {
      if (!seen.has(entry)) {
        seen.add(entry);
        deduped.push(entry);
      }
    }
    return deduped;
  }

  async function fetchJsonFromCandidates(label, urls, trace) {
    let lastError = null;

    for (const url of urls) {
      try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        trace.push(`${label}: ${url}`);
        return data;
      } catch (error) {
        lastError = error;
      }
    }

    throw new Error(`${label} unavailable (${lastError ? lastError.message : 'unknown'})`);
  }

  function parseUploadedJson(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          resolve(JSON.parse(String(reader.result || '')));
        } catch (error) {
          reject(new Error(`Invalid JSON: ${error.message}`));
        }
      };
      reader.onerror = () => reject(new Error('Read failed'));
      reader.readAsText(file);
    });
  }

  function normalizeStringList(value) {
    if (!value) {
      return [];
    }
    if (Array.isArray(value)) {
      return value.map((x) => String(x || '').trim()).filter(Boolean);
    }
    if (typeof value === 'object') {
      const arr = [];
      for (const [key, raw] of Object.entries(value)) {
        const k = String(key || '').trim();
        const v = String(raw || '').trim();
        if (v) {
          arr.push(v);
        } else if (k) {
          arr.push(k);
        }
      }
      return arr;
    }
    const s = String(value).trim();
    return s ? [s] : [];
  }

  function normalizeFeatList(value) {
    if (!value) {
      return [];
    }
    if (!Array.isArray(value)) {
      return normalizeStringList(value);
    }
    return value
      .map((entry) => {
        if (!entry) {
          return '';
        }
        if (typeof entry === 'string') {
          return entry.trim();
        }
        if (typeof entry === 'object' && entry.name) {
          return String(entry.name).trim();
        }
        return '';
      })
      .filter(Boolean);
  }

  function normalizeItem(row) {
    if (!row || typeof row !== 'object') {
      return null;
    }
    const name = String(row.name || '').trim();
    if (!name) {
      return null;
    }
    return {
      id: row.id != null ? Number(row.id) : null,
      name,
      quantity: Math.max(1, Math.floor(toInt(row.quantity, 1))),
    };
  }

  function buildDataModel(skillsJson, inputsJson, recipesJson, detailsJson) {
    const skills = Array.isArray(skillsJson) ? skillsJson : [];
    const inputsCatalog = Array.isArray(inputsJson) ? inputsJson : [];
    const baseRecipes = Array.isArray(recipesJson) ? recipesJson : [];
    const detailRecords = Array.isArray(detailsJson && detailsJson.records) ? detailsJson.records : [];

    const skillNameById = new Map();
    for (const skill of skills) {
      if (!skill || !Number.isFinite(Number(skill.id))) {
        continue;
      }
      skillNameById.set(Number(skill.id), String(skill.name || `Skill ${skill.id}`));
    }

    const detailById = new Map();
    for (const row of detailRecords) {
      if (!row || !row.ok) {
        continue;
      }
      const recipe = row.payload && row.payload.pageProps && row.payload.pageProps.recipe;
      if (recipe && Number.isFinite(Number(recipe.id))) {
        detailById.set(Number(recipe.id), recipe);
      }
    }

    const recipes = [];

    for (const base of baseRecipes) {
      if (!base || !Number.isFinite(Number(base.id))) {
        continue;
      }
      const detail = detailById.get(Number(base.id)) || null;
      const source = detail || base;

      const inputs = Array.isArray(detail && detail.input)
        ? detail.input.map(normalizeItem).filter(Boolean)
        : (Array.isArray(base.inputs) ? base.inputs.map((name) => ({ id: null, name: String(name || '').trim(), quantity: 1 })).filter((x) => x.name) : []);

      const outputs = Array.isArray(detail && detail.output)
        ? detail.output.map(normalizeItem).filter(Boolean)
        : (Array.isArray(base.outputs) ? base.outputs.map((name) => ({ id: null, name: String(name || '').trim(), quantity: 1 })).filter((x) => x.name) : []);

      const recipe = {
        id: Number(source.id != null ? source.id : base.id),
        skill: Number(source.skill != null ? source.skill : base.skill),
        skillName: skillNameById.get(Number(source.skill != null ? source.skill : base.skill)) || `Skill ${base.skill}`,
        category: Number(source.category != null ? source.category : base.category),
        categoryName: String((detail && detail.categoryName) || '').trim(),
        name: String(source.name || base.name || '').trim(),
        cp: toInt(source.cp, toInt(base.cp, 0)),
        dc: toInt(source.dc, toInt(base.dc, 0)),
        value: toInt(source.value, toInt(base.value, 0)),
        classes: normalizeStringList(source.classes != null ? source.classes : base.classes),
        races: normalizeStringList(source.races != null ? source.races : base.races),
        feats: normalizeFeatList(source.feats != null ? source.feats : base.feats),
        inputs,
        outputs,
      };

      if (!recipe.name) {
        continue;
      }
      recipes.push(recipe);
    }

    recipes.sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id);

    const recipeById = new Map();
    const categoriesBySkill = new Map();
    const recipesBySkill = new Map();
    const inputIndex = new Map();
    const outputIndex = new Map();
    const producersByItem = new Map();

    function indexMapSet(map, key, value) {
      if (!map.has(key)) {
        map.set(key, new Set());
      }
      map.get(key).add(value);
    }

    for (const recipe of recipes) {
      recipeById.set(recipe.id, recipe);

      if (!recipesBySkill.has(recipe.skill)) {
        recipesBySkill.set(recipe.skill, []);
      }
      recipesBySkill.get(recipe.skill).push(recipe);

      if (!categoriesBySkill.has(recipe.skill)) {
        categoriesBySkill.set(recipe.skill, new Map());
      }
      const catMap = categoriesBySkill.get(recipe.skill);
      if (!catMap.has(recipe.category)) {
        catMap.set(recipe.category, {
          id: recipe.category,
          name: recipe.categoryName || `Category ${recipe.category}`,
          recipes: [],
        });
      }
      const cat = catMap.get(recipe.category);
      if (!cat.name && recipe.categoryName) {
        cat.name = recipe.categoryName;
      }
      cat.recipes.push(recipe);

      for (const input of recipe.inputs) {
        indexMapSet(inputIndex, normalizeName(input.name), recipe.id);
      }
      for (const output of recipe.outputs) {
        const key = normalizeName(output.name);
        indexMapSet(outputIndex, key, recipe.id);
        if (!producersByItem.has(key)) {
          producersByItem.set(key, []);
        }
        producersByItem.get(key).push({
          recipeId: recipe.id,
          recipeName: recipe.name,
          outputQty: Math.max(1, output.quantity || 1),
          cp: recipe.cp,
          dc: recipe.dc,
          skillName: recipe.skillName,
        });
      }
    }

    for (const [, map] of categoriesBySkill) {
      for (const [, category] of map) {
        category.recipes.sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id);
      }
    }

    const ingredients = inputsCatalog
      .map((row) => String((row && row.name) || '').trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    return {
      skills,
      skillNameById,
      recipes,
      recipeById,
      recipesBySkill,
      categoriesBySkill,
      inputIndex,
      outputIndex,
      producersByItem,
      ingredients,
    };
  }

  function persistQueue() {
    localStorage.setItem(STORAGE.queue, JSON.stringify(state.queue));
  }

  function loadQueue() {
    try {
      const raw = localStorage.getItem(STORAGE.queue);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return;
      }
      state.queue = parsed
        .filter((row) => row && typeof row.recipeId === 'number' && typeof row.qty === 'number')
        .map((row) => ({
          uid: row.uid || nowId(),
          recipeId: row.recipeId,
          qty: Math.max(1, Math.floor(row.qty)),
          parentUid: row.parentUid || null,
          reasonItemName: typeof row.reasonItemName === 'string' ? row.reasonItemName : null,
        }));
    } catch (error) {
      console.warn('Failed to load queue', error);
    }
  }

  function savePrefs() {
    const prefs = {
      remoteBase: els.remoteBaseInput.value.trim(),
      detailsFilename: els.fallbackDetailsName.value.trim() || DEFAULT_DETAILS_FILENAME,
      classFilter: els.classFilterInput.value,
      raceFilter: els.raceFilterInput.value,
      featFilter: els.featFilterInput.value,
      advancedOn: !!state.advancedOn,
    };
    localStorage.setItem(STORAGE.prefs, JSON.stringify(prefs));
  }

  function loadPrefs() {
    try {
      const raw = localStorage.getItem(STORAGE.prefs);
      if (!raw) {
        return;
      }
      const prefs = JSON.parse(raw);
      if (!prefs || typeof prefs !== 'object') {
        return;
      }
      if (typeof prefs.remoteBase === 'string') {
        els.remoteBaseInput.value = prefs.remoteBase;
      }
      if (typeof prefs.detailsFilename === 'string' && prefs.detailsFilename.trim()) {
        els.fallbackDetailsName.value = prefs.detailsFilename;
      }
      if (typeof prefs.classFilter === 'string') {
        els.classFilterInput.value = prefs.classFilter;
      }
      if (typeof prefs.raceFilter === 'string') {
        els.raceFilterInput.value = prefs.raceFilter;
      }
      if (typeof prefs.featFilter === 'string') {
        els.featFilterInput.value = prefs.featFilter;
      }
      if (typeof prefs.advancedOn === 'boolean') {
        state.advancedOn = prefs.advancedOn;
      }
    } catch (error) {
      console.warn('Failed to parse prefs', error);
    }
  }

  async function loadData() {
    savePrefs();
    const trace = [];
    const remoteBase = normalizeBase(els.remoteBaseInput.value);
    const detailsFilename = (els.fallbackDetailsName.value || DEFAULT_DETAILS_FILENAME).trim() || DEFAULT_DETAILS_FILENAME;

    setStatus('Loading data...', 'Trying GitHub Pages source first, then local fallback.', false);

    try {
      const skillsPromise = fetchJsonFromCandidates('skills', candidateUrls('skills.response.json', remoteBase), trace);
      const inputsPromise = fetchJsonFromCandidates('inputs', candidateUrls('inputs.response.json', remoteBase), trace);
      const recipesPromise = fetchJsonFromCandidates('recipes', candidateUrls('recipes.response.json', remoteBase), trace);

      let detailsData = null;
      if (state.detailsUploadData) {
        detailsData = state.detailsUploadData;
        trace.push('details: upload');
      } else {
        const candidates = [...candidateUrls(detailsFilename, remoteBase), ...candidateUrls(LEGACY_DETAILS_FILENAME, remoteBase)];
        try {
          detailsData = await fetchJsonFromCandidates('details', [...new Set(candidates)], trace);
        } catch (error) {
          detailsData = { records: [] };
          trace.push('details: optional missing');
        }
      }

      const [skillsData, inputsData, recipesData] = await Promise.all([skillsPromise, inputsPromise, recipesPromise]);

      state.data = buildDataModel(skillsData, inputsData, recipesData, detailsData);
      setStatus('Data loaded.', `Recipes: ${state.data.recipes.length} | Ingredients: ${state.data.ingredients.length}`, false);
      console.log('[Compendium] load trace', trace);

      if (!state.view || !state.view.type) {
        state.view = { type: 'home' };
      }
      render();
    } catch (error) {
      setStatus('Load failed.', error.message, true);
      els.contentArea.innerHTML = '<p>Unable to load compendium data.</p>';
      console.error(error);
    }
  }

  function getRecipeById(id) {
    if (!state.data) {
      return null;
    }
    return state.data.recipeById.get(Number(id)) || null;
  }

  function queueTotalCp() {
    return state.queue.reduce((sum, row) => {
      const recipe = getRecipeById(row.recipeId);
      return recipe ? sum + (recipe.cp * row.qty) : sum;
    }, 0);
  }

  function queueSummaryText() {
    const count = state.queue.length;
    const cp = queueTotalCp();
    return `Queue Entries: ${count} | Total Craft Points: ${cp}`;
  }

  function hasCycle(parentUid, candidateRecipeId) {
    let cursor = parentUid;
    while (cursor) {
      const row = state.queue.find((entry) => entry.uid === cursor);
      if (!row) {
        break;
      }
      if (row.recipeId === candidateRecipeId) {
        return true;
      }
      cursor = row.parentUid;
    }
    return false;
  }

  function recipeOutputQty(recipe, itemName) {
    const key = normalizeName(itemName);
    const row = recipe.outputs.find((x) => normalizeName(x.name) === key);
    return row ? Math.max(1, row.quantity || 1) : 1;
  }

  function addRecipeToQueue(recipeId, qty, parentUid, reasonItemName) {
    const recipe = getRecipeById(recipeId);
    if (!recipe) {
      return;
    }

    const safeQty = Math.max(1, Math.floor(toInt(qty, 1)));

    if (parentUid && hasCycle(parentUid, recipeId)) {
      setStatus('Queue branch blocked.', `Cycle detected via ${recipe.name}.`, true);
      return;
    }

    const existing = state.queue.find((entry) =>
      entry.recipeId === recipeId &&
      entry.parentUid === (parentUid || null) &&
      (entry.reasonItemName || '') === (reasonItemName || '')
    );

    if (existing) {
      existing.qty += safeQty;
    } else {
      state.queue.push({
        uid: nowId(),
        recipeId,
        qty: safeQty,
        parentUid: parentUid || null,
        reasonItemName: reasonItemName || null,
      });
    }

    persistQueue();
    renderQueueSummary();
    if (state.view && state.view.type === 'queue') {
      render();
    }
  }

  function clearQueue() {
    state.queue = [];
    persistQueue();
    renderQueueSummary();
    if (state.view && state.view.type === 'queue') {
      render();
    }
  }

  function removeQueueEntry(uid) {
    const key = String(uid || '');
    if (!key) {
      return;
    }

    const toDelete = new Set([key]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const row of state.queue) {
        if (!toDelete.has(row.uid) && row.parentUid && toDelete.has(row.parentUid)) {
          toDelete.add(row.uid);
          changed = true;
        }
      }
    }

    state.queue = state.queue.filter((row) => !toDelete.has(row.uid));
    persistQueue();
    renderQueueSummary();
    if (state.view && state.view.type === 'queue') {
      render();
    }
  }

  function showRecipeChoice(itemName, neededQty, parentUid) {
    const key = normalizeName(itemName);
    const producers = (state.data.producersByItem.get(key) || []).slice();

    if (!producers.length) {
      setStatus('No producer recipe found.', itemName, true);
      return;
    }

    if (producers.length === 1) {
      const one = producers[0];
      const recipe = getRecipeById(one.recipeId);
      const outQty = recipe ? recipeOutputQty(recipe, itemName) : 1;
      const runs = Math.max(1, Math.ceil(neededQty / outQty));
      addRecipeToQueue(one.recipeId, runs, parentUid || null, itemName);
      return;
    }

    state.pendingChoice = { itemName, neededQty, parentUid: parentUid || null };
    els.recipeChoiceHint.textContent = `Multiple recipes can produce ${itemName}. Choose one variant.`;

    els.recipeChoiceOptions.innerHTML = producers
      .map((producer) => {
        const recipe = getRecipeById(producer.recipeId);
        const outQty = recipe ? recipeOutputQty(recipe, itemName) : producer.outputQty;
        const runs = Math.max(1, Math.ceil(neededQty / outQty));
        return `
          <div class="choice-option">
            <div><strong>${escapeHtml(producer.recipeName)}</strong></div>
            <div>${escapeHtml(producer.skillName)} | ID ${producer.recipeId} | Output ${outQty}</div>
            <div>Queue runs: ${runs}</div>
            <button type="button" data-action="choice-pick" data-recipe-id="${producer.recipeId}">Use Recipe</button>
          </div>
        `;
      })
      .join('');

    if (typeof els.recipeChoiceDialog.showModal === 'function') {
      els.recipeChoiceDialog.showModal();
    } else {
      els.recipeChoiceDialog.setAttribute('open', 'open');
    }
  }

  function resolveChoice(recipeId) {
    if (!state.pendingChoice) {
      return;
    }
    const choice = state.pendingChoice;
    const recipe = getRecipeById(recipeId);
    const outQty = recipe ? recipeOutputQty(recipe, choice.itemName) : 1;
    const runs = Math.max(1, Math.ceil(choice.neededQty / outQty));
    addRecipeToQueue(recipeId, runs, choice.parentUid, choice.itemName);
    state.pendingChoice = null;
    if (typeof els.recipeChoiceDialog.close === 'function') {
      els.recipeChoiceDialog.close();
    } else {
      els.recipeChoiceDialog.removeAttribute('open');
    }
  }

  function requirementFiltersPass(recipe) {
    const classFilter = normalizeName(els.classFilterInput.value);
    const raceFilter = normalizeName(els.raceFilterInput.value);
    const featFilter = normalizeName(els.featFilterInput.value);

    if (!classFilter && !raceFilter && !featFilter) {
      return true;
    }

    if (classFilter && !recipe.classes.some((x) => normalizeName(x).includes(classFilter))) {
      return false;
    }
    if (raceFilter && !recipe.races.some((x) => normalizeName(x).includes(raceFilter))) {
      return false;
    }
    if (featFilter && !recipe.feats.some((x) => normalizeName(x).includes(featFilter))) {
      return false;
    }

    return true;
  }

  function renderQueueSummary() {
    els.queueSummary.textContent = queueSummaryText();
    els.queueSummary.classList.add('queue-clickable');
    els.queueSummary.title = 'Open queue';
  }

  function breadcrumb(parts) {
    return parts.join(' - ');
  }

  function renderLead(lead) {
    if (!Array.isArray(lead)) {
      els.pageLead.textContent = lead || '';
      return;
    }

    const html = lead
      .map((part, idx) => {
        const label = escapeHtml(part && part.label ? part.label : '');
        if (!label) {
          return '';
        }

        const isLast = idx === lead.length - 1;
        if (part && part.view && !isLast) {
          const payload = encodeURIComponent(JSON.stringify(part.view));
          return `<a href="#" class="lead-link" data-action="lead-nav" data-lead-view="${payload}">${label}</a>`;
        }

        return `<span>${label}</span>`;
      })
      .filter(Boolean)
      .join('<span class="lead-sep"> - </span>');

    els.pageLead.innerHTML = html;
  }

  function setPage(title, lead, searchPlaceholder, showSearch) {
    els.pageTitle.textContent = title;
    renderLead(lead);
    els.searchInput.placeholder = searchPlaceholder || 'Search by Name or ID';
    els.searchInput.style.display = showSearch ? 'block' : 'none';
  }

  function renderHome() {
    const q = normalizeName(els.searchInput.value);

    if (q) {
      const recipeRows = state.data.recipes.filter((recipe) => {
        if (!requirementFiltersPass(recipe)) {
          return false;
        }
        return normalizeName(recipe.name).includes(q) || String(recipe.id).includes(q);
      });

      const ingredientRows = state.data.ingredients.filter((name) => normalizeName(name).includes(q));
      const skillRows = state.data.skills.filter((skill) => {
        const sid = toInt(skill && skill.id, 0);
        const sname = String((skill && skill.name) || '');
        return normalizeName(sname).includes(q) || String(sid).includes(q);
      });

      setPage('Search Results', [
        { label: 'Compendium', view: { type: 'home' } },
        { label: `Search: ${q}` },
      ], 'Search by Name or ID', true);
      els.homeLink.textContent = 'Compendium';

      const skillsHtml = skillRows.length
        ? `
          <h3 class="section-title">Skills (${skillRows.length})</h3>
          <ul class="list-links">
            ${skillRows.map((skill) => `<li><a href="#" class="list-link" data-action="open-skill" data-skill-id="${toInt(skill.id, 0)}">${escapeHtml(skill.name)} (${toInt(skill.id, 0)})</a></li>`).join('')}
          </ul>
        `
        : '';

      const recipesHtml = recipeRows.length
        ? `
          <h3 class="section-title">Recipes (${recipeRows.length})</h3>
          <ul class="list-links">
            ${recipeRows.map((recipe) => `<li><a href="#" class="list-link" data-action="open-recipe" data-recipe-id="${recipe.id}">${escapeHtml(recipe.name)} (ID: ${recipe.id})</a></li>`).join('')}
          </ul>
        `
        : '';

      const ingredientsHtml = ingredientRows.length
        ? `
          <h3 class="section-title">Ingredients (${ingredientRows.length})</h3>
          <ul class="list-links">
            ${ingredientRows.map((name) => `
              <li class="row">
                <span class="row-link">${escapeHtml(name)}</span>
                <span class="item-actions">
                  <a href="#" class="action-link" data-action="search-io" data-direction="input" data-item-name="${escapeHtml(name)}">IN</a>
                  <a href="#" class="action-link" data-action="search-io" data-direction="output" data-item-name="${escapeHtml(name)}">OUT</a>
                </span>
              </li>
            `).join('')}
          </ul>
        `
        : '';

      if (!skillsHtml && !recipesHtml && !ingredientsHtml) {
        els.contentArea.innerHTML = '<p>No matches found.</p>';
        return;
      }

      els.contentArea.innerHTML = `${skillsHtml}${recipesHtml}${ingredientsHtml}`;
      return;
    }

    const skills = [...state.data.skills]
      .filter((s) => Number.isFinite(Number(s.id)))
      .sort((a, b) => Number(a.id) - Number(b.id));

    setPage(
      'Crafting Compendium',
      'Your personal crafting journal, select a craft skill to start finding the recipe you are looking for. Recipes are sorted by craft skill and category, or you can view all recipes available.',
      'Search by Name or ID',
      true
    );
    els.homeLink.textContent = 'Compendium';

    const allRecipesCount = state.data.recipes.length;
    const allIngredientsCount = state.data.ingredients.length;

    const links = [];
    links.push(`<li><a href="#" class="list-link" data-action="open-all-recipes">All Recipes (${allRecipesCount})</a></li>`);
    links.push(`<li><a href="#" class="list-link" data-action="open-ingredients">All Ingredients (${allIngredientsCount})</a></li>`);

    for (const skill of skills) {
      const count = (state.data.recipesBySkill.get(Number(skill.id)) || []).length;
      links.push(`<li><a href="#" class="list-link" data-action="open-skill" data-skill-id="${Number(skill.id)}">${escapeHtml(skill.name)} (${count})</a></li>`);
    }

    els.contentArea.innerHTML = `<ul class="list-links">${links.join('')}</ul>`;
  }

  function renderSkill(skillId) {
    const sid = Number(skillId);
    const skillName = state.data.skillNameById.get(sid) || `Skill ${sid}`;
    const catMap = state.data.categoriesBySkill.get(sid) || new Map();
    const categories = [...catMap.values()].sort((a, b) => a.name.localeCompare(b.name));
    const q = normalizeName(els.searchInput.value);

    setPage(skillName, [
      { label: 'Compendium', view: { type: 'home' } },
      { label: skillName },
    ], 'Search by Name or ID', true);
    els.homeLink.textContent = 'Compendium';

    const filtered = categories.filter((cat) => {
      if (!q) {
        return true;
      }
      return normalizeName(cat.name).includes(q) || String(cat.id).includes(q);
    });

    els.contentArea.innerHTML = `
      <ul class="list-links">
        ${filtered.map((cat) => `<li><a href="#" class="list-link" data-action="open-category" data-skill-id="${sid}" data-category-id="${cat.id}">${escapeHtml(cat.name)} (${cat.recipes.length})</a></li>`).join('')}
      </ul>
    `;
  }

  function renderQueue() {
    const q = normalizeName(els.searchInput.value);

    setPage('Queue', [
      { label: 'Compendium', view: { type: 'home' } },
      { label: 'Queue' },
    ], 'Search queued recipe by Name or ID', true);
    els.homeLink.textContent = 'Compendium';

    if (!state.queue.length) {
      els.contentArea.innerHTML = '<p>Your queue is empty.</p>';
      return;
    }

    const rows = state.queue
      .map((entry, idx) => {
        const recipe = getRecipeById(entry.recipeId);
        if (!recipe) {
          return null;
        }
        return {
          index: idx + 1,
          uid: entry.uid,
          recipe,
          qty: Math.max(1, toInt(entry.qty, 1)),
          reasonItemName: entry.reasonItemName || '',
          parentUid: entry.parentUid || null,
        };
      })
      .filter(Boolean)
      .filter((row) => {
        if (!q) {
          return true;
        }
        return normalizeName(row.recipe.name).includes(q) || String(row.recipe.id).includes(q);
      });

    const list = rows.map((row) => {
      const parentText = row.parentUid ? ' | Child dependency' : '';
      const reasonText = row.reasonItemName ? ` | For ${escapeHtml(row.reasonItemName)}` : '';
      return `
        <li class="row">
          <span class="row-link">#${row.index} ${escapeHtml(row.recipe.name)} (ID: ${row.recipe.id})</span>
          <span class="inline-small">Qty: ${row.qty} | CP each: ${row.recipe.cp} | Total: ${row.recipe.cp * row.qty}${parentText}${reasonText}</span>
          <span class="item-actions">
            <a href="#" class="action-link" data-action="open-recipe" data-recipe-id="${row.recipe.id}">Open</a>
            <a href="#" class="action-link" data-action="queue-remove" data-queue-uid="${escapeHtml(row.uid)}">Remove</a>
          </span>
        </li>
      `;
    });

    els.contentArea.innerHTML = `
      <div class="queue-head">Queue Entries: ${state.queue.length} | Total Craft Points: ${queueTotalCp()}</div>
      <ul class="list-links">${list.join('')}</ul>
    `;
  }

  function renderAllRecipes() {
    const q = normalizeName(els.searchInput.value);

    setPage('All Recipes', [
      { label: 'Compendium', view: { type: 'home' } },
      { label: 'All Recipes' },
    ], 'Search by Name or ID', true);
    els.homeLink.textContent = 'Compendium';

    const rows = state.data.recipes.filter((recipe) => {
      if (!requirementFiltersPass(recipe)) {
        return false;
      }
      if (!q) {
        return true;
      }
      return normalizeName(recipe.name).includes(q) || String(recipe.id).includes(q);
    });

    els.contentArea.innerHTML = `
      <ul class="list-links">
        ${rows.map((recipe) => `<li><a href="#" class="list-link" data-action="open-recipe" data-recipe-id="${recipe.id}">${escapeHtml(recipe.name)} (ID: ${recipe.id})</a></li>`).join('')}
      </ul>
    `;
  }

  function renderIngredients() {
    const q = normalizeName(els.searchInput.value);

    setPage('All Crafting Ingredients', [
      { label: 'Compendium', view: { type: 'home' } },
      { label: 'All Ingredients' },
    ], 'Search by Name or ID', true);
    els.homeLink.textContent = 'Compendium';

    const rows = state.data.ingredients.filter((name) => {
      if (!q) {
        return true;
      }
      return normalizeName(name).includes(q);
    });

    els.contentArea.innerHTML = `
      <ul class="list-links">
        ${rows.map((name) => `
          <li class="row">
            <span class="row-link">${escapeHtml(name)}</span>
            <span class="item-actions">
              <a href="#" class="action-link" data-action="search-io" data-direction="input" data-item-name="${escapeHtml(name)}">IN</a>
              <a href="#" class="action-link" data-action="search-io" data-direction="output" data-item-name="${escapeHtml(name)}">OUT</a>
            </span>
          </li>
        `).join('')}
      </ul>
    `;
  }

  function renderCategory(skillId, categoryId) {
    const sid = Number(skillId);
    const cid = Number(categoryId);
    const skillName = state.data.skillNameById.get(sid) || `Skill ${sid}`;
    const cat = state.data.categoriesBySkill.get(sid) && state.data.categoriesBySkill.get(sid).get(cid);

    if (!cat) {
      els.contentArea.innerHTML = '<p>Category not found.</p>';
      return;
    }

    const q = normalizeName(els.searchInput.value);

    setPage(cat.name || `Category ${cid}`, [
      { label: 'Compendium', view: { type: 'home' } },
      { label: skillName, view: { type: 'skill', skillId: sid } },
      { label: cat.name || `Category ${cid}` },
    ], 'Search by Name or ID', true);
    els.homeLink.textContent = 'Compendium';

    const rows = cat.recipes.filter((recipe) => {
      if (!requirementFiltersPass(recipe)) {
        return false;
      }
      if (!q) {
        return true;
      }
      return normalizeName(recipe.name).includes(q) || String(recipe.id).includes(q);
    });

    els.contentArea.innerHTML = `
      <ul class="list-links">
        ${rows.map((recipe) => `<li><a href="#" class="list-link" data-action="open-recipe" data-recipe-id="${recipe.id}">${escapeHtml(recipe.name)} (ID: ${recipe.id})</a></li>`).join('')}
      </ul>
    `;
  }

  function renderIoFilter(direction, itemName) {
    const q = normalizeName(els.searchInput.value);
    const itemKey = normalizeName(itemName);

    const rows = state.data.recipes.filter((recipe) => {
      if (!requirementFiltersPass(recipe)) {
        return false;
      }

      const items = direction === 'input' ? recipe.inputs : recipe.outputs;
      const hasTerm = items.some((x) => normalizeName(x.name) === itemKey);
      if (!hasTerm) {
        return false;
      }

      if (!q) {
        return true;
      }

      return normalizeName(recipe.name).includes(q) || String(recipe.id).includes(q);
    });

    setPage(
      direction === 'input' ? `Input Filter: ${itemName}` : `Output Filter: ${itemName}`,
      [
        { label: 'Compendium', view: { type: 'home' } },
        { label: direction === 'input' ? 'Input Search' : 'Output Search' },
        { label: itemName },
      ],
      'Search by Name or ID',
      true
    );
    els.homeLink.textContent = 'Compendium';

    els.contentArea.innerHTML = `
      <ul class="list-links">
        ${rows.map((recipe) => `<li><a href="#" class="list-link" data-action="open-recipe" data-recipe-id="${recipe.id}">${escapeHtml(recipe.name)} (ID: ${recipe.id})</a></li>`).join('')}
      </ul>
    `;
  }

  function renderRecipe(recipeId) {
    const recipe = getRecipeById(recipeId);
    if (!recipe) {
      els.contentArea.innerHTML = '<p>Recipe not found.</p>';
      return;
    }

    const skillName = recipe.skillName;
    const categoryName = recipe.categoryName || `Category ${recipe.category}`;

    setPage('Recipe', [
      { label: 'Compendium', view: { type: 'home' } },
      { label: skillName, view: { type: 'skill', skillId: recipe.skill } },
      { label: categoryName, view: { type: 'category', skillId: recipe.skill, categoryId: recipe.category } },
      { label: recipe.name },
    ], 'Search by Name or ID', true);
    els.homeLink.textContent = 'Compendium';

    const requirementsBlock = [];
    if (recipe.classes.length) {
      requirementsBlock.push(`<h3 class="section-title">Classes</h3><ul class="bulleted">${recipe.classes.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul>`);
    }
    if (recipe.races.length) {
      requirementsBlock.push(`<h3 class="section-title">Races</h3><ul class="bulleted">${recipe.races.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul>`);
    }
    if (recipe.feats.length) {
      requirementsBlock.push(`<h3 class="section-title">Feats</h3><ul class="bulleted">${recipe.feats.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul>`);
    }

    function inputRow(row) {
      const canCraft = state.data.producersByItem.has(normalizeName(row.name));
      return `
        <li>
          ${escapeHtml(row.name)} (${row.quantity})
          <span class="item-actions">
            ${canCraft ? `<a href="#" class="action-link" data-action="queue-item" data-item-name="${escapeHtml(row.name)}" data-item-qty="${row.quantity}" data-parent-recipe-id="${recipe.id}">Q</a>` : ''}
            <a href="#" class="action-link" data-action="search-io" data-direction="input" data-item-name="${escapeHtml(row.name)}">IN</a>
            <a href="#" class="action-link" data-action="search-io" data-direction="output" data-item-name="${escapeHtml(row.name)}">OUT</a>
          </span>
        </li>
      `;
    }

    function outputRow(row) {
      const canCraft = state.data.producersByItem.has(normalizeName(row.name));
      return `
        <li>
          ${escapeHtml(row.name)} (${row.quantity})
          <span class="item-actions">
            ${canCraft ? `<a href="#" class="action-link" data-action="queue-item" data-item-name="${escapeHtml(row.name)}" data-item-qty="${row.quantity}" data-parent-recipe-id="${recipe.id}">Q</a>` : ''}
            <a href="#" class="action-link" data-action="search-io" data-direction="input" data-item-name="${escapeHtml(row.name)}">IN</a>
            <a href="#" class="action-link" data-action="search-io" data-direction="output" data-item-name="${escapeHtml(row.name)}">OUT</a>
          </span>
        </li>
      `;
    }

    els.contentArea.innerHTML = `
      <div class="recipe-header">
        <div class="row">
          <a href="#" class="action-link" data-action="queue-recipe" data-recipe-id="${recipe.id}" data-recipe-runs="1">Queue Recipe</a>
          <a href="#" class="action-link" data-action="queue-recipe" data-recipe-id="${recipe.id}" data-recipe-runs="5">Queue x5</a>
        </div>
        <h2 class="recipe-title">${escapeHtml(recipe.name)}</h2>
        <div class="recipe-meta">DC: ${recipe.dc}</div>
        <div class="recipe-meta">Craft Points: ${recipe.cp}</div>
        <div class="recipe-meta">Value: ${recipe.value}</div>
        <div class="recipe-meta">ID: ${recipe.id}${state.advancedOn ? ` | Category: ${recipe.category}${recipe.categoryName ? ` (${escapeHtml(recipe.categoryName)})` : ''}` : ''}</div>
      </div>

      <h3 class="section-title">Inputs</h3>
      <ul class="bulleted">${recipe.inputs.map(inputRow).join('')}</ul>

      <h3 class="section-title">Outputs</h3>
      <ul class="bulleted">${recipe.outputs.map(outputRow).join('')}</ul>

      ${requirementsBlock.join('')}
    `;
  }

  function render() {
    if (!state.data) {
      return;
    }

    renderQueueSummary();

    const view = state.view || { type: 'home' };
    if (view.type === 'home') {
      renderHome();
      return;
    }
    if (view.type === 'all-recipes') {
      renderAllRecipes();
      return;
    }
    if (view.type === 'ingredients') {
      renderIngredients();
      return;
    }
    if (view.type === 'queue') {
      renderQueue();
      return;
    }
    if (view.type === 'skill') {
      renderSkill(view.skillId);
      return;
    }
    if (view.type === 'category') {
      renderCategory(view.skillId, view.categoryId);
      return;
    }
    if (view.type === 'filter-io') {
      renderIoFilter(view.direction, view.itemName);
      return;
    }
    if (view.type === 'recipe') {
      renderRecipe(view.recipeId);
      return;
    }

    renderHome();
  }

  function onContentClick(event) {
    const target = event.target.closest('[data-action]');
    if (!target) {
      return;
    }

    event.preventDefault();

    const action = target.getAttribute('data-action');

    if (action === 'open-all-recipes') {
      state.view = { type: 'all-recipes' };
      render();
      return;
    }
    if (action === 'open-ingredients') {
      state.view = { type: 'ingredients' };
      render();
      return;
    }
    if (action === 'open-queue') {
      state.view = { type: 'queue' };
      render();
      return;
    }
    if (action === 'open-skill') {
      state.view = { type: 'skill', skillId: toInt(target.getAttribute('data-skill-id'), 0) };
      render();
      return;
    }
    if (action === 'open-category') {
      state.view = {
        type: 'category',
        skillId: toInt(target.getAttribute('data-skill-id'), 0),
        categoryId: toInt(target.getAttribute('data-category-id'), 0),
      };
      render();
      return;
    }
    if (action === 'open-recipe') {
      state.view = { type: 'recipe', recipeId: toInt(target.getAttribute('data-recipe-id'), 0) };
      render();
      return;
    }
    if (action === 'search-io') {
      const direction = target.getAttribute('data-direction') === 'output' ? 'output' : 'input';
      const itemName = target.getAttribute('data-item-name') || '';
      els.searchInput.value = '';
      state.view = { type: 'filter-io', direction, itemName };
      render();
      return;
    }
    if (action === 'queue-recipe') {
      const recipeId = toInt(target.getAttribute('data-recipe-id'), 0);
      const runs = Math.max(1, toInt(target.getAttribute('data-recipe-runs'), 1));
      addRecipeToQueue(recipeId, runs, null, null);
      return;
    }
    if (action === 'queue-item') {
      const itemName = target.getAttribute('data-item-name') || '';
      const itemQty = Math.max(1, toInt(target.getAttribute('data-item-qty'), 1));
      const parentRecipeId = toInt(target.getAttribute('data-parent-recipe-id'), 0);
      const parentEntry = state.queue.find((row) => row.recipeId === parentRecipeId) || null;
      showRecipeChoice(itemName, itemQty, parentEntry ? parentEntry.uid : null);
      return;
    }
    if (action === 'queue-remove') {
      const uid = target.getAttribute('data-queue-uid') || '';
      removeQueueEntry(uid);
      return;
    }
  }

  function bindEvents() {
    els.homeLink.addEventListener('click', (event) => {
      event.preventDefault();
      state.view = { type: 'home' };
      render();
    });

    els.reloadDataBtn.addEventListener('click', loadData);
    els.settingsBtn.addEventListener('click', () => {
      if (typeof els.settingsDialog.showModal === 'function') {
        els.settingsDialog.showModal();
      } else {
        els.settingsDialog.setAttribute('open', 'open');
      }
    });
    els.viewQueueBtn.addEventListener('click', () => {
      state.view = { type: 'queue' };
      render();
    });
    els.clearQueueBtn.addEventListener('click', () => {
      clearQueue();
      setStatus('Queue cleared.', '', false);
    });

    els.queueSummary.addEventListener('click', () => {
      state.view = { type: 'queue' };
      render();
    });

    els.searchInput.addEventListener('input', render);
    els.advancedModeToggle.addEventListener('change', () => {
      state.advancedOn = !!els.advancedModeToggle.checked;
      applyAdvancedUi();
      savePrefs();
      render();
    });

    els.classFilterInput.addEventListener('input', () => {
      savePrefs();
      render();
    });
    els.raceFilterInput.addEventListener('input', () => {
      savePrefs();
      render();
    });
    els.featFilterInput.addEventListener('input', () => {
      savePrefs();
      render();
    });

    els.remoteBaseInput.addEventListener('change', savePrefs);
    els.fallbackDetailsName.addEventListener('change', savePrefs);

    els.detailsFileInput.addEventListener('change', (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) {
        return;
      }
      parseUploadedJson(file)
        .then((parsed) => {
          state.detailsUploadData = parsed;
          setStatus('Details file loaded.', file.name, false);
        })
        .catch((error) => {
          setStatus('Details upload failed.', error.message, true);
        });
    });

    els.contentArea.addEventListener('click', onContentClick);
    els.pageLead.addEventListener('click', (event) => {
      const target = event.target.closest('[data-action="lead-nav"]');
      if (!target) {
        return;
      }

      event.preventDefault();
      const raw = target.getAttribute('data-lead-view') || '';
      if (!raw) {
        return;
      }

      try {
        const view = JSON.parse(decodeURIComponent(raw));
        if (view && typeof view === 'object' && view.type) {
          state.view = view;
          render();
        }
      } catch (error) {
        console.warn('Failed to parse breadcrumb route', error);
      }
    });

    els.recipeChoiceOptions.addEventListener('click', (event) => {
      const button = event.target.closest('[data-action="choice-pick"]');
      if (!button) {
        return;
      }
      const recipeId = toInt(button.getAttribute('data-recipe-id'), 0);
      if (!recipeId) {
        return;
      }
      resolveChoice(recipeId);
    });

    els.recipeChoiceDialog.addEventListener('close', () => {
      state.pendingChoice = null;
    });

    window.addEventListener('keydown', (event) => {
      if (event.altKey && String(event.key || '').toLowerCase() === 'y') {
        event.preventDefault();
        state.advancedOn = !state.advancedOn;
        applyAdvancedUi();
        savePrefs();
        render();
      }
    });
  }

  function cacheElements() {
    els.homeLink = document.getElementById('homeLink');
    els.settingsBtn = document.getElementById('settingsBtn');
    els.viewQueueBtn = document.getElementById('viewQueueBtn');
    els.reloadDataBtn = document.getElementById('reloadDataBtn');
    els.clearQueueBtn = document.getElementById('clearQueueBtn');

    els.remoteBaseInput = document.getElementById('remoteBaseInput');
    els.fallbackDetailsName = document.getElementById('fallbackDetailsName');
    els.detailsFileInput = document.getElementById('detailsFileInput');
    els.classFilterInput = document.getElementById('classFilterInput');
    els.raceFilterInput = document.getElementById('raceFilterInput');
    els.featFilterInput = document.getElementById('featFilterInput');

    els.loadStatus = document.getElementById('loadStatus');
    els.loadMeta = document.getElementById('loadMeta');

    els.pageTitle = document.getElementById('pageTitle');
    els.pageLead = document.getElementById('pageLead');
    els.searchInput = document.getElementById('searchInput');
    els.advancedModeToggle = document.getElementById('advancedModeToggle');
    els.queueSummary = document.getElementById('queueSummary');
    els.contentArea = document.getElementById('contentArea');

    els.settingsDialog = document.getElementById('settingsDialog');
    els.recipeChoiceDialog = document.getElementById('recipeChoiceDialog');
    els.recipeChoiceHint = document.getElementById('recipeChoiceHint');
    els.recipeChoiceOptions = document.getElementById('recipeChoiceOptions');
  }

  function init() {
    cacheElements();
    loadPrefs();
    loadQueue();
    applyAdvancedUi();
    bindEvents();
    renderQueueSummary();
    loadData();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

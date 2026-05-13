export const STORAGE_KEY = "storeAssistPosDataV3";
export const PORTABLE_BACKUP_VERSION = 1;
export const ITEM_TYPES = ["crafted-spell", "crafted", "found"];
export const CRAFT_ITEM_TYPES = ["potion", "wand", "scroll"];
export const PROFESSIONS = ["smithing", "herbalism", "alchemy", "carpentry", "tailoring", "artistry"];
export const ORDER_STATUSES = ["open", "assigned", "in-progress", "ready", "completed", "cancelled"];
const NON_SCRIBABLE_SCROLL_SPELLS = new Set(["greater sanctuary", "holy sword"]);
const NON_WANDABLE_SPELLS = new Set(["divine power", "invisibility purge"]);
const FIXED_SCROLL_COSTS = {
  "Raise Dead": 10000,
  "Resurrection": 20000
};

function spellNameKey(value) {
  return String(value || "").trim().toLowerCase();
}

function getSpellName(spell) {
  return String(spell?.name || "").trim();
}

export function getSpellInnateLevel(spell) {
  const raw = spell?.innateLevel ?? spell?.level;
  return Math.max(0, Math.min(9, Math.floor(num(raw))));
}

export function getSpellCasterLevel(spell) {
  const fallback = 0;
  const raw = spell?.casterLevel;
  return Math.max(0, Math.floor(num(raw ?? fallback)));
}

export function allowedCraftTypesForLevel(level) {
  const normalizedLevel = Math.max(0, Math.min(9, Math.floor(num(level))));
  if (normalizedLevel <= 3) return ["potion", "wand", "scroll"];
  if (normalizedLevel <= 4) return ["wand", "scroll"];
  return ["scroll"];
}

export function isCraftTypeAllowedForSpell(spell, craftType) {
  if (!spell) return false;
  const mode = CRAFT_ITEM_TYPES.includes(craftType) ? craftType : "potion";
  const innateLevel = getSpellInnateLevel(spell);
  if (!allowedCraftTypesForLevel(innateLevel).includes(mode)) return false;

  const nameKey = spellNameKey(getSpellName(spell));
  if (mode === "scroll" && NON_SCRIBABLE_SCROLL_SPELLS.has(nameKey)) return false;
  if (mode === "wand" && NON_WANDABLE_SPELLS.has(nameKey)) return false;
  return true;
}

export function findMappedCraftedSpellItem(state, spellId, craftType) {
  const mode = CRAFT_ITEM_TYPES.includes(craftType) ? craftType : "potion";
  return state.inventoryItems.find((item) => item.type === "crafted-spell" && item.spellId === spellId && item.spellCraftKind === mode) || null;
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function num(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function gold(value) {
  return Math.round(num(value)).toLocaleString();
}

export function titleCase(value) {
  const raw = String(value || "");
  if (!raw) return "";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function normalizeType(type) {
  const mapped = normalizeLegacyType(type);
  return ITEM_TYPES.includes(mapped) ? mapped : "crafted";
}

function normalizeLegacyType(type) {
  if (type === "potion" || type === "wand" || type === "scroll") return "crafted-spell";
  if (type === "general") return "found";
  return type;
}

function toMoney(value) {
  return Math.max(0, Math.round(num(value) * 100) / 100);
}

function derivePrice(unitCost, marginPct) {
  return toMoney(num(unitCost) * (1 + (Math.max(0, num(marginPct)) / 100)));
}

function deriveMarginPct(unitCost, price) {
  const cost = Math.max(0, num(unitCost));
  const sale = Math.max(0, num(price));
  if (cost <= 0) return 0;
  return toMoney(((sale - cost) / cost) * 100);
}

function defaultStackCountForCraftKind(craftKind) {
  if (craftKind === "wand") return 1;
  if (craftKind === "potion" || craftKind === "scroll") return 100;
  return 1;
}

function defaultLocationPricing(settings, unitCost, forceParDisabled = false) {
  const marginPct = Math.max(0, num(settings.defaultMarkupPct));
  return {
    taxId: settings.defaultTaxId,
    marginPct,
    price: derivePrice(unitCost, marginPct),
    reorderPoint: 0,
    parDisabled: forceParDisabled || settings.enableParTracking === false
  };
}

export function defaultState() {
  const baseTaxId = "tax-standard";

  return {
    settings: {
      taxes: [{ id: baseTaxId, name: "Standard", ratePct: 0 }],
      defaultTaxId: baseTaxId,
      defaultMarkupPct: 100,
      coinsPerCraftingPoint: 0,
      enableParTracking: true,
      wandPriceCapEnabled: false
    },
    spells: [],
    manualJobs: [],
    locations: [{ id: uid(), name: "Main" }],
    vendors: [{ id: uid(), name: "Default Crafter", contact: "", notes: "", active: true }],
    inventoryItems: [],
    specialOrders: [],
    placementCompletions: {},
    selectedInventoryId: "",
    selectedOrderId: ""
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return ensureState(defaultState());
    return ensureState(JSON.parse(raw));
  } catch {
    return ensureState(defaultState());
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function createPortableBackup(state) {
  return {
    app: "StoreAssist",
    backupVersion: PORTABLE_BACKUP_VERSION,
    storageKey: STORAGE_KEY,
    exportedAt: new Date().toISOString(),
    state: ensureState(state)
  };
}

export function parsePortableBackup(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid backup payload.");
  }

  // Support both wrapped portable backups and legacy raw state JSON exports.
  if (payload.app === "StoreAssist" && payload.state && typeof payload.state === "object") {
    return ensureState(payload.state);
  }

  return ensureState(payload);
}

export function ensureState(state) {
  const base = defaultState();
  const next = {
    ...base,
    ...state,
    settings: { ...base.settings, ...state?.settings },
    spells: Array.isArray(state?.spells) ? state.spells : [],
    manualJobs: Array.isArray(state?.manualJobs) ? state.manualJobs : [],
    locations: Array.isArray(state?.locations) ? state.locations : [],
    vendors: Array.isArray(state?.vendors) ? state.vendors : [],
    inventoryItems: Array.isArray(state?.inventoryItems) ? state.inventoryItems : [],
    specialOrders: Array.isArray(state?.specialOrders) ? state.specialOrders : [],
    placementCompletions: state?.placementCompletions && typeof state.placementCompletions === "object"
      ? state.placementCompletions
      : {}
  };

  next.settings = normalizeSettings(next.settings, base.settings);
  next.spells = normalizeSpells(next.spells);
  next.locations = normalizeLocations(next.locations);
  next.vendors = normalizeVendors(next.vendors);
  next.inventoryItems = normalizeInventory(next.inventoryItems, next.locations, next.vendors, next.spells, next.settings);

  // Keep crafted item unit costs consistent with configured crafting economics.
  next.inventoryItems.forEach((item) => {
    if (item.type !== "crafted") return;
    if (item.disableDerivedCosting === true) return;
    item.unitCost = deriveCraftedUnitCost(next, item);
  });

  next.specialOrders = normalizeOrders(next.specialOrders, next.inventoryItems, next.locations, next.vendors);

  if (!next.inventoryItems.some((item) => item.id === next.selectedInventoryId)) {
    next.selectedInventoryId = next.inventoryItems[0]?.id || "";
  }
  if (!next.specialOrders.some((order) => order.id === next.selectedOrderId)) {
    next.selectedOrderId = next.specialOrders[0]?.id || "";
  }

  return next;
}

function normalizeSpells(spells) {
  return spells
    .map((rawSpell) => {
      const name = typeof rawSpell?.name === "string" && rawSpell.name.trim()
        ? rawSpell.name.trim()
        : "Unnamed Spell";
      const innateLevel = getSpellInnateLevel(rawSpell);
      const classesRaw = Array.isArray(rawSpell?.classes) ? rawSpell.classes : [];
      const classes = classesRaw
        .map((entry) => {
          if (typeof entry === "string") return entry.trim();
          if (entry && typeof entry.class === "string") return entry.class.trim();
          return "";
        })
        .filter(Boolean)
        .filter((value, index, self) => self.indexOf(value) === index)
        .sort((a, b) => a.localeCompare(b));

      return {
        id: typeof rawSpell?.id === "string" && rawSpell.id ? rawSpell.id : uid(),
        name,
        innateLevel,
        casterLevel: Math.max(0, Math.floor(num(rawSpell?.casterLevel ?? 0))),
        classes
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function normalizeSettings(settings, fallback) {
  const taxesRaw = Array.isArray(settings?.taxes) ? settings.taxes : [];
  const taxes = taxesRaw.map((tax) => ({
    id: typeof tax?.id === "string" && tax.id ? tax.id : uid(),
    name: typeof tax?.name === "string" && tax.name.trim() ? tax.name.trim() : "Tax",
    ratePct: Math.max(0, num(tax?.ratePct))
  }));

  if (!taxes.length) {
    taxes.push({ id: "tax-standard", name: "Standard", ratePct: 0 });
  }

  const defaultTaxId = taxes.some((tax) => tax.id === settings?.defaultTaxId)
    ? settings.defaultTaxId
    : taxes[0].id;

  return {
    taxes,
    defaultTaxId,
    defaultMarkupPct: Math.max(0, num(settings?.defaultMarkupPct ?? fallback?.defaultMarkupPct)),
    coinsPerCraftingPoint: Math.max(0, num(settings?.coinsPerCraftingPoint ?? fallback?.coinsPerCraftingPoint)),
    enableParTracking: settings?.enableParTracking !== false,
    wandPriceCapEnabled: settings?.wandPriceCapEnabled === true
  };
}

function normalizeLocations(locations) {
  const fixed = locations.map((location) => ({
    id: typeof location?.id === "string" && location.id ? location.id : uid(),
    name: typeof location?.name === "string" && location.name.trim() ? location.name.trim() : "Location"
  }));

  if (!fixed.length) fixed.push({ id: uid(), name: "Main" });
  return fixed;
}

function normalizeVendors(vendors) {
  const fixed = vendors.map((vendor) => ({
    id: typeof vendor?.id === "string" && vendor.id ? vendor.id : uid(),
    name: typeof vendor?.name === "string" && vendor.name.trim() ? vendor.name.trim() : "Unnamed Vendor",
    contact: typeof vendor?.contact === "string" ? vendor.contact : "",
    notes: typeof vendor?.notes === "string" ? vendor.notes : "",
    active: vendor?.active !== false
  }));

  if (!fixed.length) {
    fixed.push({ id: uid(), name: "Default Crafter", contact: "", notes: "", active: true });
  }
  return fixed;
}

function normalizeInventory(items, locations, vendors, spells, settings) {
  const vendorFallback = vendors[0]?.id || "";

  return items.map((rawItem) => {
    const type = normalizeType(rawItem?.type);
    const spellCraftKind = CRAFT_ITEM_TYPES.includes(rawItem?.spellCraftKind) ? rawItem.spellCraftKind : "potion";
    const spellId = type === "crafted-spell" && typeof rawItem?.spellId === "string" ? rawItem.spellId : "";
    const spellName = spells.find((spell) => spell.id === spellId)?.name || "No Spell";

    const unitCost = Math.max(0, num(rawItem?.unitCost));

    const stocks = {};
    locations.forEach((location) => {
      stocks[location.id] = Math.max(0, Math.floor(num(rawItem?.stocks?.[location.id])));
    });

    const components = Array.isArray(rawItem?.components)
      ? rawItem.components
        .map((component) => ({
          id: typeof component?.id === "string" && component.id ? component.id : uid(),
          itemId: typeof component?.itemId === "string" ? component.itemId : "",
          qty: Math.max(1, Math.floor(num(component?.qty || 1)))
        }))
      : [];

    const profession = PROFESSIONS.includes(rawItem?.profession) ? rawItem.profession : "";
    const stackable = rawItem?.stackable === true;
    const defaultStackCount = type === "crafted-spell"
      ? defaultStackCountForCraftKind(spellCraftKind)
      : 1;
    const stackCount = Math.max(1, Math.floor(num(rawItem?.stackCount ?? defaultStackCount)));
    const craftedOutputQty = Math.max(1, Math.floor(num(rawItem?.craftedOutputQty || 1)));
      const disableDerivedCosting = rawItem?.disableDerivedCosting === true;

    const legacyParDisabled = rawItem?.parDisabled === true;
    const legacyReorderPoint = Math.max(0, Math.floor(num(rawItem?.reorderPoint)));
    const legacyTaxId = settings.taxes.some((entry) => entry.id === rawItem?.taxId) ? rawItem.taxId : settings.defaultTaxId;
    const legacyPriceLevels = rawItem?.priceLevels && typeof rawItem.priceLevels === "object" ? Object.values(rawItem.priceLevels) : [];
    const legacyPrice = Math.max(0, num(legacyPriceLevels.find((value) => Number.isFinite(Number(value)))));

    const locationConfig = {};
    locations.forEach((location) => {
      const defaults = defaultLocationPricing(settings, unitCost, legacyParDisabled);
      const rawConfig = rawItem?.locationConfig?.[location.id] || {};

      const taxId = settings.taxes.some((entry) => entry.id === rawConfig?.taxId)
        ? rawConfig.taxId
        : legacyTaxId;

      const marginPct = Math.max(0, num(rawConfig?.marginPct ?? rawConfig?.markupPct ?? defaults.marginPct));
      const configuredPrice = rawConfig?.price;
      const price = Number.isFinite(Number(configuredPrice))
        ? toMoney(configuredPrice)
        : (legacyPrice > 0 ? legacyPrice : derivePrice(unitCost, marginPct));

      const normalizedPrice = type === "found" ? toMoney(unitCost) : price;
      const normalizedMarginPct = type === "found"
        ? 0
        : (Number.isFinite(Number(rawConfig?.marginPct)) || Number.isFinite(Number(rawConfig?.markupPct))
          ? marginPct
          : deriveMarginPct(unitCost, price));

      locationConfig[location.id] = {
        taxId,
        marginPct: normalizedMarginPct,
        price: normalizedPrice,
        reorderPoint: Math.max(0, Math.floor(num(rawConfig?.reorderPoint ?? legacyReorderPoint))),
        parDisabled: settings.enableParTracking === false
          ? true
          : (rawConfig?.parDisabled === true || legacyParDisabled)
      };
    });

    const rawName = typeof rawItem?.name === "string" ? rawItem.name : "";

    return {
      id: typeof rawItem?.id === "string" && rawItem.id ? rawItem.id : uid(),
      name: rawName.trim() ? rawName : `${titleCase(type)} - ${spellName}`,
      type,
      spellId,
      spellCraftKind,
      vendorId: vendors.some((entry) => entry.id === rawItem?.vendorId) ? rawItem.vendorId : vendorFallback,
      unitCost,
      stackable,
      stackCount,
      locationConfig,
      craftingPoints: Math.max(0, Math.floor(num(rawItem?.craftingPoints))),
      craftDc: Math.max(0, Math.floor(num(rawItem?.craftDc))),
      craftedOutputQty,
      profession,
      wandPriceCapOverride: type === "crafted-spell" && spellCraftKind === "wand" && rawItem?.wandPriceCapOverride === true,
      components,
      notes: typeof rawItem?.notes === "string" ? rawItem.notes : "",
      stocks,
      disableDerivedCosting
    };
  });
}

function normalizeOrders(orders, inventoryItems, locations, vendors) {
  const locationFallback = locations[0]?.id || "";
  const vendorFallback = vendors[0]?.id || "";

  return orders.map((order) => {
    const status = ORDER_STATUSES.includes(order?.status) ? order.status : "open";

    return {
      id: typeof order?.id === "string" && order.id ? order.id : uid(),
      orderNumber: typeof order?.orderNumber === "string" && order.orderNumber ? order.orderNumber : `SO-${Date.now().toString().slice(-6)}`,
      customer: typeof order?.customer === "string" ? order.customer : "",
      status,
      vendorId: vendors.some((entry) => entry.id === order?.vendorId) ? order.vendorId : vendorFallback,
      assignedTo: typeof order?.assignedTo === "string" ? order.assignedTo : "",
      locationId: locations.some((entry) => entry.id === order?.locationId) ? order.locationId : locationFallback,
      dueDate: typeof order?.dueDate === "string" ? order.dueDate : "",
      deposit: Math.max(0, num(order?.deposit)),
      notes: typeof order?.notes === "string" ? order.notes : "",
      lines: Array.isArray(order?.lines)
        ? order.lines.map((line) => ({
          id: typeof line?.id === "string" && line.id ? line.id : uid(),
          itemId: inventoryItems.some((entry) => entry.id === line?.itemId) ? line.itemId : "",
          qty: Math.max(0, Math.floor(num(line?.qty))),
          completedQty: Math.max(0, Math.floor(num(line?.completedQty))),
          pricingMode: line?.pricingMode === "cost" ? "cost" : "price",
          unitPrice: toMoney(line?.unitPrice)
        }))
        : []
    };
  });
}

export function findSpell(state, spellId) {
  return state.spells.find((spell) => spell.id === spellId) || null;
}

export function findVendor(state, vendorId) {
  return state.vendors.find((vendor) => vendor.id === vendorId) || null;
}

export function findTax(state, taxId) {
  return state.settings.taxes.find((tax) => tax.id === taxId) || null;
}

export function totalQoh(item, locations) {
  return locations.reduce((sum, location) => sum + Math.max(0, Math.floor(num(item?.stocks?.[location.id]))), 0);
}

export function itemTypeLabel(type) {
  if (type === "crafted-spell") return "Crafted (Spell Based)";
  if (type === "crafted") return "Crafted";
  if (type === "found") return "Found";
  return titleCase(type);
}

export function itemLabel(state, item) {
  const baseName = item.name || itemTypeLabel(item.type);
  if (item.type !== "crafted-spell") return baseName;
  const spell = findSpell(state, item.spellId);
  const spellPart = spell?.name ? ` - ${spell.name}` : "";
  const mode = item.spellCraftKind ? ` (${titleCase(item.spellCraftKind)})` : "";
  return `${baseName}${spellPart}${mode}`;
}

export function getItemPriceForLocation(state, item, locationId) {
  if (!item) return 0;
  if (item.type === "found") return toMoney(item.unitCost);
  const fallbackLocationId = locationId || state.locations[0]?.id;
  const config = item?.locationConfig?.[fallbackLocationId];
  if (!config) {
    return derivePrice(item.unitCost, state.settings.defaultMarkupPct);
  }
  return toMoney(config.price);
}

export function deriveCraftedUnitCost(state, item, seen = new Set()) {
  if (!item) return 0;
  if (item.type !== "crafted") return toMoney(item.unitCost);
  if (item.disableDerivedCosting === true) return toMoney(item.unitCost);

  if (item.id && seen.has(item.id)) {
    return toMoney(item.unitCost);
  }

  const nextSeen = new Set(seen);
  if (item.id) nextSeen.add(item.id);

  const coinsPerCraftPoint = Math.max(0, num(state?.settings?.coinsPerCraftingPoint));
  const craftPointCost = Math.max(0, Math.floor(num(item.craftingPoints))) * coinsPerCraftPoint;
  const outputQty = Math.max(1, Math.floor(num(item.craftedOutputQty || 1)));

  const componentCost = Array.isArray(item.components)
    ? item.components.reduce((sum, component) => {
      const qty = Math.max(1, Math.floor(num(component?.qty || 1)));
      const child = state.inventoryItems.find((entry) => entry.id === component?.itemId);
      if (!child) return sum;

      const childUnitCost = child.type === "crafted"
        ? deriveCraftedUnitCost(state, child, nextSeen)
        : toMoney(child.unitCost);

      return sum + (qty * childUnitCost);
    }, 0)
    : 0;

  return toMoney((craftPointCost + componentCost) / outputQty);
}

export function createInventoryFromCraft(state, jobType, spellId) {
  const mode = CRAFT_ITEM_TYPES.includes(jobType) ? jobType : "potion";
  const existing = findMappedCraftedSpellItem(state, spellId, mode);
  if (existing) return existing;

  const spell = findSpell(state, spellId);
  if (!isCraftTypeAllowedForSpell(spell, mode)) return null;

  const unitCost = estimateUnitCostFromSpell(spell, mode);
  const locationConfig = Object.fromEntries(state.locations.map((location) => [
    location.id,
    defaultLocationPricing(state.settings, unitCost)
  ]));

  const created = {
    id: uid(),
    name: `${titleCase(mode)} Craft`,
    type: "crafted-spell",
    spellId,
    spellCraftKind: mode,
    vendorId: state.vendors[0]?.id || "",
    unitCost,
    stackable: true,
    stackCount: defaultStackCountForCraftKind(mode),
    locationConfig,
    craftingPoints: 0,
    craftDc: 0,
    profession: "alchemy",
    wandPriceCapOverride: false,
    components: [],
    notes: "",
    stocks: Object.fromEntries(state.locations.map((location) => [location.id, 0])),
    disableDerivedCosting: false
  };

  state.inventoryItems.push(created);
  return created;
}

export function getSpellCraftYieldPerPrep(spell, mode) {
  if (mode === "potion") return 10;
  if (mode === "wand") return 1;
  const innateLevel = getSpellInnateLevel(spell);
  return Math.max(1, 10 - innateLevel);
}

export function getSpellCraftGoldPerPrep(spell, mode) {
  if (!spell) return 0;
  const casterLevel = getSpellCasterLevel(spell);
  const innateLevel = getSpellInnateLevel(spell);

  if (mode === "potion") {
    return Math.floor(casterLevel * innateLevel * 15);
  }

  if (mode === "wand") {
    return Math.floor(casterLevel * innateLevel * 132);
  }

  const fixed = FIXED_SCROLL_COSTS[getSpellName(spell)];
  if (Number.isFinite(fixed)) return fixed;
  return Math.floor(casterLevel * innateLevel * 18.75);
}

export function deriveCasterLevelFromCraftCost(spell, mode, goldPerPrep) {
  if (!spell) return 0;
  const innateLevel = getSpellInnateLevel(spell);
  const cost = Math.max(0, num(goldPerPrep));
  if (innateLevel <= 0) return 0;

  if (mode === "potion") {
    return Math.max(0, Math.round(cost / (innateLevel * 15)));
  }

  if (mode === "wand") {
    return Math.max(0, Math.round(cost / (innateLevel * 132)));
  }

  const fixed = FIXED_SCROLL_COSTS[getSpellName(spell)];
  if (Number.isFinite(fixed)) {
    return getSpellCasterLevel(spell);
  }

  return Math.max(0, Math.round(cost / (innateLevel * 18.75)));
}

export function estimateUnitCostFromSpell(spell, mode) {
  if (!spell) return 0;
  const goldPerPrep = getSpellCraftGoldPerPrep(spell, mode);
  return Math.max(0, num(goldPerPrep));
}

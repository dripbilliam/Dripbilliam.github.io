(function () {
  const LEVEL_CAP = 30;
  const LEVEL_FIELDS = [
    "classTaken",
    "bab",
    "hp",
    "str",
    "dex",
    "con",
    "wis",
    "int",
    "cha",
    "feat",
    "bonusFeat",
    "grantedFeat"
  ];
  const PROPAGATED_LEVEL_FIELDS = ["str", "dex", "con", "wis", "int", "cha"];

  const SKILL_DEFINITIONS = [
    { key: "animalEmpathy", label: "Animal Empathy", classes: ["Barbarian", "Bard", "Druid", "Ranger", "Shaman", "Shifter"] },
    { key: "appraise", label: "Appraise", classes: ["Assassin", "Bard", "Commoner", "Harper", "Rogue"] },
    { key: "bluff", label: "Bluff", classes: ["Assassin", "Bard", "Blackguard", "Commoner", "Elementalist", "Harbinger", "Harper", "Hemomancer", "Invisible Blade", "Liberator", "Rogue", "Shadowdancer", "Shifter", "Sorcerer", "Swashbuckler", "Vigilante", "Warlock", "Zhentarim"] },
    { key: "climb", label: "Climb", classes: ["Barbarian", "Bard", "Dragon Disciple", "Invisible Blade", "Liberator", "Ranger", "Rogue", "Shadowdancer", "Swashbuckler", "Vigilante"] },
    { key: "concentration", label: "Concentration", classes: ["Arcane Archer", "Bard", "Blackguard", "Cavalier", "Cleric", "Divine Champion", "Dragon Disciple", "Druid", "Earthkin Defender", "Elementalist", "Fighter", "Harbinger", "Hemomancer", "Invisible Blade", "Knight", "Liberator", "Monk", "Paladin", "Pale Master", "Ranger", "Shaman", "Shifter", "Sorcerer", "Spellsword", "Vigilante", "Warlock", "Weapon Master", "Wizard", "Zhentarim"] },
    { key: "craftMastery", label: "Craft Mastery", classes: "ALL" },
    { key: "disableTrap", label: "Disable Trap", classes: ["Assassin", "Harbinger", "Ranger", "Rogue", "Vigilante"] },
    { key: "discipline", label: "Discipline", classes: ["Barbarian", "Bard", "Blackguard", "Cavalier", "Divine Champion", "Dragon Disciple", "Earthkin Defender", "Fighter", "Harbinger", "Invisible Blade", "Knight", "Liberator", "Monk", "Paladin", "Ranger", "Spellsword", "Swashbuckler", "Vigilante", "Warlock", "Weapon Master"] },
    { key: "heal", label: "Heal", classes: "ALL" },
    { key: "hide", label: "Hide", classes: ["Arcane Archer", "Assassin", "Bard", "Harper", "Invisible Blade", "Monk", "Pale Master", "Ranger", "Rogue", "Shadowdancer", "Shifter", "Vigilante", "Warlock", "Zhentarim"] },
    { key: "intimidate", label: "Intimidate", classes: ["Assassin", "Barbarian", "Bard", "Blackguard", "Cavalier", "Cleric", "Commoner", "Divine Champion", "Dragon Disciple", "Fighter", "Harbinger", "Harper", "Knight", "Liberator", "Monk", "Paladin", "Pale Master", "Ranger", "Rogue", "Swashbuckler", "Vigilante", "Warlock", "Weapon Master"] },
    { key: "leadership", label: "Leadership", classes: ["Bard", "Blackguard", "Cavalier", "Cleric", "Commoner", "Divine Champion", "Druid", "Elementalist", "Fighter", "Harbinger", "Harper", "Hemomancer", "Knight", "Monk", "Paladin", "Rogue", "Shaman", "Sorcerer", "Spellsword", "Swashbuckler", "Warlock", "Zhentarim"] },
    { key: "linguistics", label: "Linguistics", classes: "ALL" },
    { key: "listen", label: "Listen", classes: ["Arcane Archer", "Assassin", "Barbarian", "Bard", "Blackguard", "Cavalier", "Commoner", "Divine Champion", "Dragon Disciple", "Earthkin Defender", "Fighter", "Harbinger", "Harper", "Invisible Blade", "Knight", "Liberator", "Monk", "Paladin", "Ranger", "Rogue", "Shadowdancer", "Shifter", "Spellsword", "Vigilante", "Weapon Master"] },
    { key: "lore", label: "Lore", classes: "ALL" },
    { key: "moveSilently", label: "Move Silently", classes: ["Arcane Archer", "Assassin", "Bard", "Harper", "Invisible Blade", "Monk", "Pale Master", "Ranger", "Rogue", "Shadowdancer", "Shifter", "Vigilante", "Warlock", "Zhentarim"] },
    { key: "openLock", label: "Open Lock", classes: ["Assassin", "Harper", "Rogue", "Vigilante"] },
    { key: "parry", label: "Parry", classes: ["Assassin", "Barbarian", "Bard", "Blackguard", "Divine Champion", "Earthkin Defender", "Fighter", "Harbinger", "Harper", "Invisible Blade", "Knight", "Liberator", "Monk", "Paladin", "Ranger", "Rogue", "Shadowdancer", "Spellsword", "Swashbuckler", "Vigilante", "Weapon Master"] },
    { key: "perform", label: "Perform", classes: ["Assassin", "Bard", "Commoner", "Harper", "Monk", "Rogue", "Shadowdancer", "Swashbuckler", "Warlock", "Weapon Master"] },
    { key: "ride", label: "Ride", classes: ["Arcane Archer", "Assassin", "Barbarian", "Bard", "Blackguard", "Cavalier", "Cleric", "Commoner", "Divine Champion", "Earthkin Defender", "Fighter", "Harbinger", "Harper", "Invisible Blade", "Knight", "Liberator", "Monk", "Paladin", "Ranger", "Rogue", "Shadowdancer", "Shifter", "Spellsword", "Swashbuckler", "Vigilante", "Weapon Master", "Zhentarim"] },
    { key: "sail", label: "Sail", classes: "ALL" },
    { key: "search", label: "Search", classes: ["Assassin", "Bard", "Commoner", "Dragon Disciple", "Harbinger", "Harper", "Ranger", "Rogue", "Shadowdancer", "Vigilante"] },
    { key: "sleightOfHand", label: "Sleight Of Hand", classes: ["Assassin", "Bard", "Harper", "Invisible Blade", "Rogue", "Shadowdancer", "Vigilante"] },
    { key: "spellcraft", label: "Spellcraft", classes: ["Bard", "Cleric", "Dragon Disciple", "Druid", "Elementalist", "Hemomancer", "Pale Master", "Shaman", "Sorcerer", "Spellsword", "Warlock", "Wizard", "Zhentarim"] },
    { key: "spot", label: "Spot", classes: ["Arcane Archer", "Assassin", "Barbarian", "Bard", "Blackguard", "Cavalier", "Commoner", "Divine Champion", "Dragon Disciple", "Earthkin Defender", "Fighter", "Harbinger", "Harper", "Invisible Blade", "Knight", "Liberator", "Monk", "Paladin", "Ranger", "Rogue", "Shadowdancer", "Shifter", "Spellsword", "Swashbuckler", "Vigilante", "Warlock", "Weapon Master"] },
    { key: "taunt", label: "Taunt", classes: ["Barbarian", "Bard", "Blackguard", "Cavalier", "Commoner", "Divine Champion", "Earthkin Defender", "Fighter", "Harbinger", "Knight", "Liberator", "Paladin", "Rogue", "Swashbuckler", "Vigilante", "Weapon Master"] },
    { key: "tumble", label: "Tumble", classes: ["Assassin", "Bard", "Harper", "Invisible Blade", "Monk", "Rogue", "Shadowdancer", "Swashbuckler", "Vigilante", "Warlock", "Zhentarim"] },
    { key: "useMagicDevice", label: "Use Magic Device", classes: ["Assassin", "Bard", "Harper", "Rogue", "Warlock"] },
    { key: "useTraps", label: "Use Traps", classes: ["Assassin", "Harbinger", "Harper", "Liberator", "Ranger", "Rogue", "Vigilante"] }
  ];

  const CANON_CLASS_SET = new Set(
    SKILL_DEFINITIONS
      .filter((item) => item.classes !== "ALL")
      .flatMap((item) => item.classes)
  );
  const CANON_CLASSES = Array.from(CANON_CLASS_SET).sort((a, b) => a.localeCompare(b));
  const CLASS_ONLY_SKILLS = new Set(["useMagicDevice", "useTraps", "sleightOfHand"]);
  const META_LEVEL = 0;

  const RACE_GIFT_RULES = [
    { ecl: 0, major: 2, minor: 1, races: ["Human", "Deep Imaskari", "Shield Dwarf", "Gold Dwarf", "Wild Dwarf", "Arctic Dwarf", "Moon Elf", "Avariel", "Fey'ri", "Sun Elf", "Wild Elf", "Wood Elf", "Rock Gnome", "Forest Gnome", "Lightfoot Halfling", "Ghostwise Halfling", "Strongheart Halfling", "Half-Elf", "Half-Orc", "Bugbear", "Kenku", "Goblin", "Kobold", "Air Genasi", "Earth Genasi", "Fire Genasi", "Water Genasi", "Aasimar", "Tiefling"] },
    { ecl: 1, major: 1, minor: 1, races: ["Aquatic Elf", "Green Hag", "Shadovar", "Duergar", "Derro", "Gnoll", "Troglodyte", "Hobgoblin", "Gith"] },
    { ecl: 2, major: 1, minor: 1, races: ["Gloaming", "Drow", "Orog", "Svirfneblin", "Durzagon"] },
    { ecl: 3, major: 0, minor: 1, races: ["Firbolg", "Fey", "Half-Giant", "Imp", "Ogre", "Yuan-ti Pureblood", "Vampire"] },
    { ecl: 4, major: 0, minor: 1, races: ["Minotaur"] },
    { ecl: 5, major: 0, minor: 1, races: ["Rakshasa"] }
  ];

  const MAJOR_GIFTS = [
    "Gift of Might",
    "Gift of Grace",
    "Gift of Endurance",
    "Gift of Learning",
    "Gift of Insight",
    "Gift of Confidence",
    "Gift of Fortune"
  ];

  const MINOR_GIFTS = [
    "Gift of Wealth",
    "Gift of Tongues",
    "Gift of Hardiness",
    "Gift of Darkness",
    "Gift of Hiding",
    "Gift of Light",
    "Gift of the Gab",
    "Gift of Lightfingers",
    "Gift of the Hunter",
    "Gift of the Sneak",
    "Gift of Stardom",
    "Gift of Sailing",
    "Gift of Craftsmanship",
    "Gift of Devotion",
    "Gift of Greenfingers"
  ];

  const RACE_RULES_BY_NAME = (() => {
    const map = new Map();
    RACE_GIFT_RULES.forEach((rule) => {
      rule.races.forEach((race) => {
        map.set(race, { ecl: rule.ecl, major: rule.major, minor: rule.minor });
      });
    });
    return map;
  })();

  const ALL_RACES = Array.from(RACE_RULES_BY_NAME.keys()).sort((a, b) => a.localeCompare(b));
  const ADMIN_TEST_USER_ID = "90e31197-a21c-48f5-9c99-39722f1360f7";
  const CLASS_COMBAT_LOCAL_SOURCE = "./data/classCombatMeta.json";
  const CLASS_COMBAT_FALLBACK_SOURCE = "../CharacterCalculator/classData.json";
  const RACE_FEAT_LOCAL_SOURCE = "./data/raceFeatsMeta.json";
  const RACE_FEAT_FALLBACK_SOURCE = "../Extras/docs/ArelithRaces.xml";

  const els = {
    authPanel: document.getElementById("authPanel"),
    appPanel: document.getElementById("appPanel"),
    authStateBadge: document.getElementById("authStateBadge"),
    signOutBtn: document.getElementById("signOutBtn"),
    statusMessage: document.getElementById("statusMessage"),
    signInDiscordBtn: document.getElementById("signInDiscordBtn"),
    newSheetBtn: document.getElementById("newSheetBtn"),
    generateRandomSheetBtn: document.getElementById("generateRandomSheetBtn"),
    saveSheetBtn: document.getElementById("saveSheetBtn"),
    deleteSheetBtn: document.getElementById("deleteSheetBtn"),
    sheetItems: document.getElementById("sheetItems"),
    editorHeading: document.getElementById("editorHeading"),
    levelRows: document.getElementById("levelRows"),
    skillRows: document.getElementById("skillRows"),
    characterNameInput: document.getElementById("characterNameInput"),
    raceInput: document.getElementById("raceInput"),
    tagsInput: document.getElementById("tagsInput"),
    raceEclValue: document.getElementById("raceEclValue"),
    isPublicInput: document.getElementById("isPublicInput"),
    isShareEnabledInput: document.getElementById("isShareEnabledInput"),
    majorGiftSlotsValue: document.getElementById("majorGiftSlotsValue"),
    minorGiftSlotsValue: document.getElementById("minorGiftSlotsValue"),
    raceFeatRaceName: document.getElementById("raceFeatRaceName"),
    raceFeatList: document.getElementById("raceFeatList"),
    majorGiftOptions: document.getElementById("majorGiftOptions"),
    minorGiftOptions: document.getElementById("minorGiftOptions"),
    alignmentInput: document.getElementById("alignmentInput"),
    copyShareLinkBtn: document.getElementById("copyShareLinkBtn")
  };

  let supabase = null;
  let activeUser = null;
  let sheets = [];
  let selectedSheetId = null;
  let selectedMajorGifts = [];
  let selectedMinorGifts = [];
  let classCombatMeta = new Map();
  let raceFeatMeta = new Map();

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pickRandom(list) {
    if (!Array.isArray(list) || !list.length) {
      return "";
    }
    return list[randomInt(0, list.length - 1)];
  }

  function isAdminTester(user) {
    return Boolean(user && user.id === ADMIN_TEST_USER_ID);
  }

  function decodeEntities(raw) {
    const decoder = document.createElement("textarea");
    decoder.innerHTML = String(raw || "");
    return decoder.value;
  }

  function normalizeRaceName(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function dedupeStrings(values) {
    const seen = new Set();
    return values.filter((value) => {
      const key = normalizeRaceName(value);
      if (!key || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  function extractFeatLabels(rawFeats) {
    const decoded = decodeEntities(rawFeats)
      .replace(/<\s*br\s*\/?\s*>/gi, "\n")
      .replace(/'''+/g, "")
      .trim();

    const lines = decoded
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const feats = [];
    lines.forEach((line) => {
      const links = Array.from(line.matchAll(/\[\[([^\]]+)\]\]/g));
      if (links.length) {
        links.forEach((linkMatch) => {
          const inside = String(linkMatch[1] || "").trim();
          if (!inside) {
            return;
          }
          const label = inside.includes("|") ? inside.split("|").pop() : inside;
          const cleaned = String(label || "").replace(/#.*/, "").trim();
          if (cleaned) {
            feats.push(cleaned);
          }
        });
        return;
      }

      const plain = line.replace(/\{\{[^}]+\}\}/g, "").replace(/\s+/g, " ").trim();
      if (plain) {
        feats.push(plain);
      }
    });

    return dedupeStrings(feats);
  }

  async function loadRaceFeatMeta() {
    try {
      const localResponse = await fetch(RACE_FEAT_LOCAL_SOURCE, { cache: "no-store" });
      if (localResponse.ok) {
        const localData = await localResponse.json();
        applyRaceFeatMetaFromObject(localData);
        return;
      }

      const fallbackResponse = await fetch(RACE_FEAT_FALLBACK_SOURCE, { cache: "no-store" });
      if (!fallbackResponse.ok) {
        throw new Error(`HTTP ${fallbackResponse.status}`);
      }

      const xmlText = await fallbackResponse.text();
      const decoded = decodeEntities(xmlText);
      const blockPattern = /\|NAME=([^\r\n|]+)[\s\S]*?\|FEATS=([\s\S]*?)(?=\r?\n\|[A-Z_]+=|\r?\n\}\}|$)/g;
      const shaped = {};

      let match;
      while ((match = blockPattern.exec(decoded)) !== null) {
        const raceName = String(match[1] || "").trim();
        const feats = extractFeatLabels(match[2] || "");
        if (!raceName || !feats.length) {
          continue;
        }

        shaped[raceName] = feats;
      }

      applyRaceFeatMetaFromObject(shaped);
    } catch (error) {
      console.warn(`Race feat data unavailable: ${error.message}`);
      raceFeatMeta = new Map();
    }
  }

  function getRaceFeatsForSelection(raceName) {
    const normalized = normalizeRaceName(raceName);
    if (!normalized) {
      return [];
    }

    if (raceFeatMeta.has(normalized)) {
      return raceFeatMeta.get(normalized);
    }

    for (const [key, feats] of raceFeatMeta.entries()) {
      if (key.startsWith(normalized) || normalized.startsWith(key)) {
        return feats;
      }
    }

    return [];
  }

  function renderRaceFeatPanel() {
    const raceName = String(els.raceInput.value || "").trim();
    els.raceFeatRaceName.textContent = raceName || "No race selected";

    const feats = getRaceFeatsForSelection(raceName);
    if (!raceName) {
      els.raceFeatList.innerHTML = '<li class="muted-text">Select a race to see extracted racial feats.</li>';
      return;
    }

    if (!feats.length) {
      els.raceFeatList.innerHTML = '<li class="muted-text">No extracted racial feats found for this race yet.</li>';
      return;
    }

    els.raceFeatList.innerHTML = feats.map((feat) => `<li>${feat}</li>`).join("");
  }

  function parseHitDieToMax(value) {
    const text = String(value || "");
    const match = text.match(/d\s*(\d+)/i);
    if (!match) {
      return 8;
    }
    return Number.parseInt(match[1], 10) || 8;
  }

  function parseBabRate(value) {
    const text = String(value || "").toLowerCase();
    if (text.includes("1/level") || text.includes("full")) {
      return 1;
    }
    if (text.includes("3/4")) {
      return 0.75;
    }
    if (text.includes("1/2")) {
      return 0.5;
    }
    return 0.75;
  }

  function applyClassCombatMetaFromObject(source) {
    const map = new Map();

    Object.entries(source || {}).forEach(([key, value]) => {
      const className = String((value && value.className) || (value && value.name) || key || "").trim();
      if (!className) {
        return;
      }

      const hitDie = Number.parseInt(value && value.hitDie, 10);
      const babRate = Number.parseFloat(value && value.babRate);
      map.set(normalizeClassName(className), {
        className,
        hitDie: Number.isNaN(hitDie) ? 8 : hitDie,
        babRate: Number.isNaN(babRate) ? 0.75 : babRate
      });
    });

    classCombatMeta = map;
  }

  async function loadClassCombatMeta() {
    try {
      const localResponse = await fetch(CLASS_COMBAT_LOCAL_SOURCE, { cache: "no-store" });
      if (localResponse.ok) {
        const localData = await localResponse.json();
        applyClassCombatMetaFromObject(localData);
        return;
      }

      const fallbackResponse = await fetch(CLASS_COMBAT_FALLBACK_SOURCE, { cache: "no-store" });
      if (!fallbackResponse.ok) {
        throw new Error(`HTTP ${fallbackResponse.status}`);
      }

      const fallbackData = await fallbackResponse.json();
      const shaped = {};
      Object.entries(fallbackData || {}).forEach(([key, value]) => {
        const className = String((value && value.name) || key || "").trim();
        if (!className) {
          return;
        }

        shaped[normalizeClassName(className)] = {
          className,
          hitDie: parseHitDieToMax((value && (value.hitDie || value.hitdie)) || "d8"),
          babRate: parseBabRate(value && value.baseAttackBonus)
        };
      });

      applyClassCombatMetaFromObject(shaped);
    } catch (error) {
      setStatus(`Class data unavailable, using defaults for BAB/HP. (${error.message})`, "error");
    }
  }

  function applyRaceFeatMetaFromObject(source) {
    const map = new Map();
    Object.entries(source || {}).forEach(([key, value]) => {
      const feats = Array.isArray(value)
        ? value.map((item) => String(item || "").trim()).filter(Boolean)
        : [];

      if (!feats.length) {
        return;
      }

      map.set(normalizeRaceName(key), dedupeStrings(feats));
    });

    raceFeatMeta = map;
  }

  function getClassCombatInfo(classTaken) {
    const normalized = normalizeClassName(classTaken);
    if (!normalized) {
      return null;
    }

    if (classCombatMeta.has(normalized)) {
      return classCombatMeta.get(normalized);
    }

    const candidates = getClassCandidates(classTaken);
    for (const candidate of candidates) {
      const key = normalizeClassName(candidate);
      if (classCombatMeta.has(key)) {
        return classCombatMeta.get(key);
      }
    }

    return null;
  }

  function randomCharacterName() {
    const starts = ["Ar", "Bel", "Cor", "Da", "El", "Fae", "Gra", "Hel", "Iri", "Ka", "Lor", "Mor", "Ny", "Or", "Pra", "Quel", "Ryn", "Syl", "Tor", "Val"];
    const middles = ["an", "er", "ia", "or", "ul", "yn", "eth", "ar", "is", "on", "ae", "ir"];
    const ends = ["dawn", "spire", "rend", "moor", "vale", "thorn", "watch", "blade", "song", "ward", "stride", "helm"];
    const tag = String(Date.now()).slice(-4);
    return `${pickRandom(starts)}${pickRandom(middles)} ${pickRandom(ends)} ${tag}`;
  }

  function sanitizeTags(value) {
    const tags = String(value || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const seen = new Set();
    const deduped = tags.filter((tag) => {
      const key = tag.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });

    return deduped.join(", ");
  }

  function chooseRandomClassPlan() {
    const classes = [...CANON_CLASSES];
    const primary = pickRandom(classes) || "Fighter";
    const secondary = Math.random() < 0.45 ? pickRandom(classes.filter((name) => name !== primary)) : "";
    const tertiary = Math.random() < 0.2 ? pickRandom(classes.filter((name) => name !== primary && name !== secondary)) : "";

    const plan = [];
    for (let level = 1; level <= LEVEL_CAP; level += 1) {
      let picked = primary;
      if (secondary && Math.random() < 0.22) {
        picked = secondary;
      }
      if (tertiary && Math.random() < 0.08) {
        picked = tertiary;
      }
      plan.push(picked);
    }
    return plan;
  }

  function chooseRandomAlignment() {
    return pickRandom(["LG", "NG", "CG", "LN", "TN", "CN", "LE", "NE", "CE"]) || "TN";
  }

  function chooseRandomTags() {
    const pool = ["PvE", "PvP", "Tank", "Healer", "Support", "Stealth", "Crafting", "Solo", "Party", "Underdark", "Surface", "Roleplay"];
    const picks = randomInt(1, 4);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return sanitizeTags(shuffled.slice(0, picks).join(", "));
  }

  function setRandomGiftsForRace(raceName) {
    const rule = getRaceRule(raceName);
    const majorPool = [...MAJOR_GIFTS].sort(() => Math.random() - 0.5);
    const minorPool = [...MINOR_GIFTS].sort(() => Math.random() - 0.5);

    selectedMajorGifts = majorPool.slice(0, Math.max(0, rule.major));
    selectedMinorGifts = minorPool.slice(0, Math.max(0, rule.minor));
    applyRaceGiftState();
  }

  function populateRandomLevelAndSkillData() {
    const classPlan = chooseRandomClassPlan();
    const statFields = ["str", "dex", "con", "wis", "int", "cha"];
    const baseStats = {
      str: randomInt(10, 18),
      dex: randomInt(10, 18),
      con: randomInt(10, 18),
      wis: randomInt(10, 18),
      int: randomInt(10, 18),
      cha: randomInt(10, 18)
    };

    for (let level = 1; level <= LEVEL_CAP; level += 1) {
      if (level > 1 && level % 4 === 0) {
        const chosenStat = pickRandom(statFields);
        baseStats[chosenStat] += 1;
      }

      const classControl = getLevelFieldControl(level, "classTaken");
      if (classControl) {
        classControl.value = classPlan[level - 1];
      }

      statFields.forEach((field) => {
        const control = getLevelFieldControl(level, field);
        if (!control) {
          return;
        }
        control.value = String(baseStats[field]);
      });

      const featControl = getLevelFieldControl(level, "feat");
      if (featControl) {
        featControl.value = level % 3 === 0 ? `Random Feat ${level}` : "";
      }

      const bonusFeatControl = getLevelFieldControl(level, "bonusFeat");
      if (bonusFeatControl) {
        bonusFeatControl.value = Math.random() < 0.12 ? `Random Bonus ${level}` : "";
      }

      const grantedFeatControl = getLevelFieldControl(level, "grantedFeat");
      if (grantedFeatControl) {
        grantedFeatControl.value = Math.random() < 0.08 ? `Granted ${level}` : "";
      }
    }

    deriveExplicitAnchorsFromLevelValues();
    recomputePropagatedLevelColumns();
    recomputeAutoBabHp();
    applySkillRulesAndPropagation();

    const skillChoices = [...SKILL_DEFINITIONS]
      .sort(() => Math.random() - 0.5)
      .slice(0, randomInt(6, 10));

    skillChoices.forEach((skillDef) => {
      let rank = 0;
      for (let level = 1; level <= LEVEL_CAP; level += 1) {
        const input = getSkillInput(level, skillDef.key);
        if (!input || input.readOnly) {
          continue;
        }

        const classTaken = getLevelClassTaken(level);
        const cap = getSkillCapForRow(level, skillDef, classTaken);
        if (rank < cap && Math.random() < 0.55) {
          rank += Math.random() < 0.2 ? 2 : 1;
        }
        rank = Math.min(rank, cap);
        input.value = String(rank);
        input.dataset.explicit = "1";
      }

      recomputeSkillColumn(skillDef.key);
    });
  }

  async function generateRandomTestSheet() {
    if (!isAdminTester(activeUser)) {
      setStatus("Only the configured admin test user can generate random sheets.", "error");
      return;
    }

    clearSheetForm();
    els.characterNameInput.value = randomCharacterName();
    els.raceInput.value = pickRandom(ALL_RACES) || "Human";
    els.tagsInput.value = chooseRandomTags();
    els.alignmentInput.value = chooseRandomAlignment();
    els.isPublicInput.checked = true;

    setRandomGiftsForRace(els.raceInput.value);
    populateRandomLevelAndSkillData();

    await saveSheet();
    setStatus("Randomized test sheet generated and saved.", "success");
  }

  function recomputeAutoBabHp() {
    let totalBab = 0;
    let totalHp = 0;

    for (let level = 1; level <= LEVEL_CAP; level += 1) {
      const classTaken = getLevelClassTaken(level);
      const info = getClassCombatInfo(classTaken);
      const conMod = getConModifierForLevel(level);

      if (info) {
        totalBab += Number(info.babRate || 0);
        totalHp += Number(info.hitDie || 0) + conMod;
      }

      const babControl = getLevelFieldControl(level, "bab");
      const hpControl = getLevelFieldControl(level, "hp");

      if (babControl) {
        babControl.value = String(Math.ceil(totalBab));
        babControl.readOnly = true;
        babControl.title = info
          ? `Auto from ${info.className}: +${info.babRate}/level (partial BAB rounds up)`
          : "Auto BAB. Select a class for this level.";
      }

      if (hpControl) {
        hpControl.value = String(totalHp);
        hpControl.readOnly = true;
        hpControl.title = info
          ? `Auto from ${info.className}: d${info.hitDie} max HP + CON mod (${conMod >= 0 ? "+" : ""}${conMod}) at this level`
          : "Auto HP. Select a class for this level.";
      }
    }
  }

  function cleanOAuthParamsFromUrl() {
    const url = new URL(window.location.href);
    const keys = ["code", "state", "error", "error_code", "error_description"];
    let changed = false;

    keys.forEach((key) => {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        changed = true;
      }
    });

    if (url.hash && (url.hash.includes("access_token") || url.hash.includes("refresh_token"))) {
      url.hash = "";
      changed = true;
    }

    if (changed) {
      const next = `${url.pathname}${url.search}${url.hash}`;
      window.history.replaceState({}, "", next);
    }
  }

  function setStatus(message, kind) {
    els.statusMessage.textContent = message || "";
    els.statusMessage.classList.remove("error", "success");
    if (kind) {
      els.statusMessage.classList.add(kind);
    }
  }

  function setAuthBadge(text, isOk) {
    els.authStateBadge.textContent = text;
    els.authStateBadge.classList.toggle("ok", Boolean(isOk));
    els.authStateBadge.classList.toggle("muted", !isOk);
  }

  function getRuntimeConfig() {
    const staticCfg = window.CHARDB_SUPABASE_CONFIG || {};
    return {
      url: (staticCfg.url || "").trim(),
      anonKey: (staticCfg.anonKey || "").trim(),
      persistSession: staticCfg.persistSession !== false,
      oauthRedirectUrl: (staticCfg.oauthRedirectUrl || "").trim()
    };
  }

  function getOAuthRedirectUrl() {
    const cfg = getRuntimeConfig();
    const fallback = `${window.location.origin}${window.location.pathname}`;
    if (!cfg.oauthRedirectUrl) {
      return fallback;
    }

    try {
      const url = new URL(cfg.oauthRedirectUrl);
      return `${url.origin}${url.pathname}`;
    } catch (_err) {
      return fallback;
    }
  }

  function randomShareToken() {
    const bytes = new Uint8Array(24);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(bytes);
      return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    }

    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
  }

  function getSharePageUrl() {
    const basePath = window.location.pathname.replace(/[^/]+$/, "");
    return `${window.location.origin}${basePath}public-search.html`;
  }

  function getShareUrl(token) {
    if (!token) {
      return "";
    }
    return `${getSharePageUrl()}?t=${encodeURIComponent(token)}`;
  }

  function getSelectedSheetRecord() {
    return sheets.find((sheet) => sheet.id === selectedSheetId) || null;
  }

  function updateSharePanel(sheet) {
    if (!selectedSheetId || !sheet) {
      els.isShareEnabledInput.checked = false;
      els.isShareEnabledInput.disabled = true;
      els.copyShareLinkBtn.disabled = true;
      return;
    }

    const enabled = Boolean(sheet.share_enabled && sheet.share_token);
    els.isShareEnabledInput.disabled = false;
    els.isShareEnabledInput.checked = enabled;
    els.copyShareLinkBtn.disabled = !enabled;
  }

  async function setShareEnabledForSelected(enabled) {
    if (!supabase || !activeUser || !selectedSheetId) {
      setStatus("Save the sheet before managing share links.", "error");
      return;
    }

    const existing = getSelectedSheetRecord();
    const token = enabled ? (existing && existing.share_token ? existing.share_token : randomShareToken()) : null;

    const { error } = await supabase
      .from("character_sheets")
      .update({
        share_enabled: Boolean(enabled),
        share_token: token
      })
      .eq("id", selectedSheetId);

    if (error) {
      setStatus(`Share update failed: ${error.message}`, "error");
      return;
    }

    setStatus(enabled ? "Unlisted read-only link enabled." : "Unlisted read-only link disabled.", "success");
    await loadSheets();
  }

  async function copyShareLinkForSelected() {
    const sheet = getSelectedSheetRecord();
    const url = sheet && sheet.share_enabled ? getShareUrl(sheet.share_token) : "";
    if (!url) {
      setStatus("Enable unlisted sharing first.", "error");
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setStatus("Share link copied.", "success");
    } catch (_error) {
      window.prompt("Copy this share link:", url);
      setStatus("Clipboard unavailable. Share link shown for manual copy.", "error");
    }
  }

  function getRaceRule(raceName) {
    return RACE_RULES_BY_NAME.get(raceName) || { ecl: 0, major: 0, minor: 0 };
  }

  function getMetaRow(levelData) {
    return (Array.isArray(levelData) ? levelData : []).find((row) => Number(row.level) === META_LEVEL && row.meta);
  }

  function buildLevelRowsForSave() {
    return readLevelDataFromForm().filter((row) => Number(row.level) > 0);
  }

  function buildMetaRow() {
    return {
      level: META_LEVEL,
      meta: {
        selectedMajorGifts,
        selectedMinorGifts,
        raceRule: getRaceRule(els.raceInput.value)
      }
    };
  }

  function setRaceGiftStats() {
    const rule = getRaceRule(els.raceInput.value);
    els.raceEclValue.textContent = String(rule.ecl);
    els.majorGiftSlotsValue.textContent = String(rule.major);
    els.minorGiftSlotsValue.textContent = String(rule.minor);
  }

  function renderRaceOptions() {
    els.raceInput.innerHTML = [
      '<option value="">Select race</option>',
      ...ALL_RACES.map((race) => {
        const rule = getRaceRule(race);
        return `<option value="${race}">${race} (ECL +${rule.ecl})</option>`;
      })
    ].join("");
  }

  function getCheckedGiftValues(container) {
    return Array.from(container.querySelectorAll('input[type="checkbox"]:checked')).map((input) => input.value);
  }

  function applyGiftSelectionLimits(type) {
    const raceRule = getRaceRule(els.raceInput.value);
    const limit = type === "major" ? raceRule.major : raceRule.minor;
    const container = type === "major" ? els.majorGiftOptions : els.minorGiftOptions;
    const checked = getCheckedGiftValues(container);

    if (checked.length <= limit) {
      if (type === "major") {
        selectedMajorGifts = checked;
      } else {
        selectedMinorGifts = checked;
      }
      return true;
    }

    const last = container.querySelector('input[type="checkbox"][data-last-change="1"]');
    if (last) {
      last.checked = false;
      last.dataset.lastChange = "0";
    }

    setStatus(`Too many ${type} gifts selected for this race. Limit: ${limit}.`, "error");
    return false;
  }

  function renderGiftOptions() {
    const makeCheckboxes = (items, type) => items.map((gift) => {
      const selected = (type === "major" ? selectedMajorGifts : selectedMinorGifts).includes(gift);
      return `
        <label class="gift-option-item">
          <span>${gift}</span>
          <input type="checkbox" value="${gift}" data-gift-type="${type}" ${selected ? "checked" : ""}>
        </label>
      `;
    }).join("");

    els.majorGiftOptions.innerHTML = makeCheckboxes(MAJOR_GIFTS, "major");
    els.minorGiftOptions.innerHTML = makeCheckboxes(MINOR_GIFTS, "minor");
    setRaceGiftStats();

    const wire = (container, type) => {
      container.querySelectorAll('input[type="checkbox"]').forEach((input) => {
        input.addEventListener("change", () => {
          container.querySelectorAll('input[type="checkbox"]').forEach((cb) => { cb.dataset.lastChange = "0"; });
          input.dataset.lastChange = "1";
          if (applyGiftSelectionLimits(type)) {
            setStatus("");
          }
        });
      });
    };

    wire(els.majorGiftOptions, "major");
    wire(els.minorGiftOptions, "minor");
  }

  function applyRaceGiftState() {
    setRaceGiftStats();
    renderGiftOptions();
    applyGiftSelectionLimits("major");
    applyGiftSelectionLimits("minor");
    renderRaceFeatPanel();
  }

  function normalizeClassName(value) {
    return String(value || "").toLowerCase().replace(/[^a-z]/g, "");
  }

  function getClassCandidates(rawClass) {
    const token = normalizeClassName(rawClass);
    if (!token) {
      return [];
    }

    const exact = CANON_CLASSES.filter((name) => normalizeClassName(name) === token);
    if (exact.length) {
      return exact;
    }

    return CANON_CLASSES.filter((name) => {
      const norm = normalizeClassName(name);
      return norm.startsWith(token) || token.startsWith(norm);
    });
  }

  function sanitizeSkillRank(value) {
    const trimmed = String(value || "").trim();
    if (!trimmed) {
      return "";
    }
    const parsed = Number.parseInt(trimmed, 10);
    if (Number.isNaN(parsed) || parsed < 0) {
      return "";
    }
    return String(parsed);
  }

  function parseSkillRank(value) {
    const normalized = sanitizeSkillRank(value);
    if (normalized === "") {
      return null;
    }
    return Number.parseInt(normalized, 10);
  }

  function getSkillCapForRow(level, skillDef, classTaken) {
    const isClassSkill = canClassIncreaseSkill(skillDef, classTaken);
    if (isClassSkill) {
      return level + 3;
    }
    return Math.floor((level + 3) / 2);
  }

  function sanitizeLevelPropValue(value) {
    const trimmed = String(value || "").trim();
    if (!trimmed) {
      return "";
    }
    const parsed = Number.parseInt(trimmed, 10);
    if (Number.isNaN(parsed)) {
      return "";
    }
    return String(parsed);
  }

  function getLevelFieldControl(level, field) {
    const row = els.levelRows.querySelector(`tr[data-level="${level}"]`);
    return row ? row.querySelector(`[data-field="${field}"]`) : null;
  }

  function getConModifierForLevel(level) {
    const conControl = getLevelFieldControl(level, "con");
    const conValue = Number.parseInt(conControl && conControl.value ? conControl.value : "10", 10);
    const score = Number.isNaN(conValue) ? 10 : conValue;
    return Math.floor((score - 10) / 2);
  }

  function recomputeLevelColumn(field) {
    let carry = "";
    for (let level = 1; level <= LEVEL_CAP; level += 1) {
      const control = getLevelFieldControl(level, field);
      if (!control) {
        continue;
      }

      const explicit = control.dataset.explicit === "1";
      const value = sanitizeLevelPropValue(control.value);

      if (explicit) {
        carry = value;
        control.value = carry;
      } else {
        control.dataset.explicit = "0";
        control.value = carry;
      }
    }
  }

  function recomputePropagatedLevelColumns() {
    PROPAGATED_LEVEL_FIELDS.forEach((field) => {
      recomputeLevelColumn(field);
    });
  }

  function deriveExplicitAnchorsFromLevelValues() {
    PROPAGATED_LEVEL_FIELDS.forEach((field) => {
      let carry = "";
      for (let level = 1; level <= LEVEL_CAP; level += 1) {
        const control = getLevelFieldControl(level, field);
        if (!control) {
          continue;
        }

        const value = sanitizeLevelPropValue(control.value);
        control.value = value;
        if (value !== carry) {
          control.dataset.explicit = "1";
          carry = value;
        } else {
          control.dataset.explicit = "0";
        }
      }
    });
  }

  function buildLevelRows() {
    const classOptions = ['<option value="">-</option>']
      .concat(CANON_CLASSES.map((name) => `<option value="${name}">${name}</option>`))
      .join("");

    const frag = document.createDocumentFragment();
    for (let level = 1; level <= LEVEL_CAP; level += 1) {
      const tr = document.createElement("tr");
      tr.dataset.level = String(level);
      tr.innerHTML = [
        `<td class="level-col">${level}</td>`,
        `<td><select class="wide-cell class-select-cell" data-field="classTaken">${classOptions}</select></td>`,
        '<td><input class="tiny-cell auto-derived-cell" data-field="bab" maxlength="6" placeholder="0" readonly></td>',
        '<td><input class="tiny-cell auto-derived-cell" data-field="hp" maxlength="6" placeholder="0" readonly></td>',
        '<td><input class="tiny-cell" data-field="str" maxlength="6" placeholder="8"></td>',
        '<td><input class="tiny-cell" data-field="dex" maxlength="6" placeholder="8"></td>',
        '<td><input class="tiny-cell" data-field="con" maxlength="6" placeholder="8"></td>',
        '<td><input class="tiny-cell" data-field="wis" maxlength="6" placeholder="8"></td>',
        '<td><input class="tiny-cell" data-field="int" maxlength="6" placeholder="8"></td>',
        '<td><input class="tiny-cell" data-field="cha" maxlength="6" placeholder="8"></td>',
        '<td><input class="wide-cell" data-field="feat" maxlength="220" placeholder="Feat"></td>',
        '<td><input class="wide-cell" data-field="bonusFeat" maxlength="220" placeholder="Bonus Feat"></td>',
        '<td><input class="wide-cell" data-field="grantedFeat" maxlength="220" placeholder="Granted Feat"></td>'
      ].join("");
      frag.appendChild(tr);
    }
    els.levelRows.appendChild(frag);
  }

  function buildSkillRows() {
    const frag = document.createDocumentFragment();
    for (let level = 1; level <= LEVEL_CAP; level += 1) {
      const tr = document.createElement("tr");
      tr.dataset.level = String(level);

      const cells = [`<td class="level-col">${level}</td>`];
      SKILL_DEFINITIONS.forEach((skill) => {
        cells.push(`<td><input class="tiny-cell skill-cell" data-skill="${skill.key}" inputmode="numeric" maxlength="4" placeholder="0"></td>`);
      });

      tr.innerHTML = cells.join("");
      frag.appendChild(tr);
    }
    els.skillRows.appendChild(frag);
  }

  function getLevelClassTaken(level) {
    const row = els.levelRows.querySelector(`tr[data-level="${level}"]`);
    if (!row) {
      return "";
    }
    const classControl = row.querySelector('[data-field="classTaken"]');
    return classControl ? classControl.value : "";
  }

  function getSkillInput(level, skillKey) {
    const row = els.skillRows.querySelector(`tr[data-level="${level}"]`);
    return row ? row.querySelector(`input[data-skill="${skillKey}"]`) : null;
  }

  function canClassIncreaseSkill(skillDef, classTaken) {
    if (skillDef.classes === "ALL") {
      return true;
    }

    const candidates = getClassCandidates(classTaken);
    if (!candidates.length) {
      return false;
    }

    return candidates.some((candidate) => skillDef.classes.includes(candidate));
  }

  function refreshSkillCellLocks() {
    for (let level = 1; level <= LEVEL_CAP; level += 1) {
      const classTaken = getLevelClassTaken(level);
      SKILL_DEFINITIONS.forEach((skillDef) => {
        const input = getSkillInput(level, skillDef.key);
        if (!input) {
          return;
        }

        const isClassSkill = canClassIncreaseSkill(skillDef, classTaken);
        const isClassOnlySkill = CLASS_ONLY_SKILLS.has(skillDef.key);
        const editable = isClassSkill || !isClassOnlySkill;
        const cap = getSkillCapForRow(level, skillDef, classTaken);
        input.readOnly = !editable;
        input.classList.toggle("locked-skill", !editable);
        input.classList.toggle("class-skill-cell", isClassSkill);
        input.classList.toggle("cross-skill-cell", !isClassSkill);

        if (isClassSkill) {
          input.title = `Class skill | Cap ${cap} at level ${level}`;
        } else if (isClassOnlySkill) {
          input.title = `Class-only skill for this class on level ${level} | Direct increase disabled`;
        } else {
          input.title = `Cross-class skill | Cap ${cap} at level ${level}`;
        }

        if (!editable) {
          input.dataset.explicit = "0";
        }
      });
    }
  }

  function recomputeSkillColumn(skillKey) {
    const skillDef = SKILL_DEFINITIONS.find((item) => item.key === skillKey);
    if (!skillDef) {
      return;
    }

    let carry = null;

    for (let level = 1; level <= LEVEL_CAP; level += 1) {
      const input = getSkillInput(level, skillKey);
      if (!input) {
        continue;
      }

      const explicit = input.dataset.explicit === "1";
      const editable = !input.readOnly;
      const classTaken = getLevelClassTaken(level);
      const cap = getSkillCapForRow(level, skillDef, classTaken);
      const value = parseSkillRank(input.value);

      if (editable && explicit) {
        carry = value === null ? null : Math.min(value, cap);
      } else {
        input.dataset.explicit = "0";
      }

      if (carry !== null) {
        carry = Math.min(carry, cap);
      }

      input.value = carry === null ? "" : String(carry);
    }
  }

  function recomputeAllSkillColumns() {
    SKILL_DEFINITIONS.forEach((skillDef) => {
      recomputeSkillColumn(skillDef.key);
    });
  }

  function deriveExplicitAnchorsFromSkillValues() {
    SKILL_DEFINITIONS.forEach((skillDef) => {
      let carry = null;
      for (let level = 1; level <= LEVEL_CAP; level += 1) {
        const input = getSkillInput(level, skillDef.key);
        if (!input) {
          continue;
        }
        const classTaken = getLevelClassTaken(level);
        const cap = getSkillCapForRow(level, skillDef, classTaken);
        const value = parseSkillRank(input.value);
        const editable = !input.readOnly;
        const capped = value === null ? null : Math.min(value, cap);
        input.value = capped === null ? "" : String(capped);

        if (editable && capped !== carry) {
          input.dataset.explicit = "1";
          carry = capped;
        } else {
          input.dataset.explicit = "0";
        }

        if (carry !== null) {
          carry = Math.min(carry, cap);
        }
      }
    });
  }

  function applySkillRulesAndPropagation() {
    refreshSkillCellLocks();
    recomputeAllSkillColumns();
  }

  function readLevelDataFromForm() {
    const rows = Array.from(els.levelRows.querySelectorAll("tr"));
    return rows.map((row) => {
      const level = Number(row.dataset.level);
      const get = (field) => {
        const control = row.querySelector(`[data-field="${field}"]`);
        return (control && control.value ? control.value : "").trim();
      };
      return {
        level,
        classTaken: get("classTaken"),
        bab: get("bab"),
        hp: get("hp"),
        str: get("str"),
        dex: get("dex"),
        con: get("con"),
        wis: get("wis"),
        int: get("int"),
        cha: get("cha"),
        feat: get("feat"),
        bonusFeat: get("bonusFeat"),
        grantedFeat: get("grantedFeat"),
        skillRanks: readSkillRanksForLevel(level)
      };
    });
  }

  function readSkillRanksForLevel(level) {
    const values = {};
    SKILL_DEFINITIONS.forEach((skillDef) => {
      const input = getSkillInput(level, skillDef.key);
      if (!input) {
        return;
      }
      const value = sanitizeSkillRank(input.value);
      if (value !== "") {
        values[skillDef.key] = value;
      }
    });
    return values;
  }

  function writeLevelDataToForm(levelData) {
    const byLevel = new Map();
    (Array.isArray(levelData) ? levelData : []).forEach((row) => {
      if (row && Number.isInteger(Number(row.level))) {
        byLevel.set(Number(row.level), row);
      }
    });

    const rows = Array.from(els.levelRows.querySelectorAll("tr"));
    rows.forEach((row) => {
      const level = Number(row.dataset.level);
      const source = byLevel.get(level) || {};
      if (typeof source.feat !== "string" && typeof source.feats === "string") {
        source.feat = source.feats;
      }
      LEVEL_FIELDS.forEach((field) => {
        const control = row.querySelector(`[data-field="${field}"]`);
        if (control) {
          control.value = typeof source[field] === "string" ? source[field] : "";
        }
      });
    });

    deriveExplicitAnchorsFromLevelValues();
    recomputePropagatedLevelColumns();
    recomputeAutoBabHp();

    writeSkillDataToForm(levelData);
  }

  function writeSkillDataToForm(levelData) {
    const byLevel = new Map();
    (Array.isArray(levelData) ? levelData : []).forEach((row) => {
      if (row && Number.isInteger(Number(row.level))) {
        byLevel.set(Number(row.level), row.skillRanks || {});
      }
    });

    for (let level = 1; level <= LEVEL_CAP; level += 1) {
      const skillRanks = byLevel.get(level) || {};
      SKILL_DEFINITIONS.forEach((skillDef) => {
        const input = getSkillInput(level, skillDef.key);
        if (!input) {
          return;
        }
        const value = sanitizeSkillRank(skillRanks[skillDef.key] || "");
        input.value = value;
        input.dataset.explicit = "0";
      });
    }

    refreshSkillCellLocks();
    deriveExplicitAnchorsFromSkillValues();
    recomputeAllSkillColumns();
  }

  function clearSheetForm() {
    selectedSheetId = null;
    els.editorHeading.textContent = "New Character Sheet";
    els.deleteSheetBtn.disabled = true;

    [
      els.characterNameInput,
      els.raceInput,
      els.tagsInput,
      els.alignmentInput
    ].forEach((input) => {
      input.value = "";
    });
    els.isPublicInput.checked = false;
    els.isShareEnabledInput.checked = false;

    selectedMajorGifts = [];
    selectedMinorGifts = [];
    applyRaceGiftState();
    updateSharePanel(null);

    writeLevelDataToForm([]);
    renderSheetList();
  }

  function writeSheetToForm(sheet) {
    selectedSheetId = sheet.id;
    els.editorHeading.textContent = `Editing: ${sheet.character_name || "Untitled"}`;
    els.deleteSheetBtn.disabled = false;

    els.characterNameInput.value = sheet.character_name || "";
    els.raceInput.value = sheet.race || "";
    els.tagsInput.value = sanitizeTags(sheet.tags || "");
    els.alignmentInput.value = sheet.alignment || "";
    els.isPublicInput.checked = Boolean(sheet.is_public);
    els.isShareEnabledInput.checked = Boolean(sheet.share_enabled);

    const metaRow = getMetaRow(sheet.level_data || []);
    selectedMajorGifts = Array.isArray(metaRow && metaRow.meta && metaRow.meta.selectedMajorGifts)
      ? metaRow.meta.selectedMajorGifts
      : [];
    selectedMinorGifts = Array.isArray(metaRow && metaRow.meta && metaRow.meta.selectedMinorGifts)
      ? metaRow.meta.selectedMinorGifts
      : [];
    writeLevelDataToForm(sheet.level_data || []);
    applyRaceGiftState();
    updateSharePanel(sheet);
    renderSheetList();
  }

  function buildPayload() {
    const levelRows = buildLevelRowsForSave();
    const levelData = levelRows.concat(buildMetaRow());

    return {
      character_name: (els.characterNameInput.value || "").trim(),
      race: (els.raceInput.value || "").trim(),
      tags: sanitizeTags(els.tagsInput.value || ""),
      alignment: (els.alignmentInput.value || "").trim(),
      is_public: Boolean(els.isPublicInput.checked),
      level_data: levelData
    };
  }

  function formatDate(value) {
    try {
      return new Date(value).toLocaleString();
    } catch {
      return "";
    }
  }

  function renderSheetList() {
    els.sheetItems.innerHTML = "";
    if (!sheets.length) {
      const p = document.createElement("p");
      p.className = "muted-text";
      p.textContent = "No saved sheets yet.";
      els.sheetItems.appendChild(p);
      return;
    }

    sheets.forEach((sheet) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "sheet-item";
      if (sheet.id === selectedSheetId) {
        item.classList.add("active");
      }

      const subtitleBits = [];
      if (sheet.race) subtitleBits.push(sheet.race);
      if (sheet.tags) subtitleBits.push(sheet.tags);
      subtitleBits.push(sheet.is_public ? "Public" : "Private");
      if (sheet.share_enabled) subtitleBits.push("Unlisted Link");

      item.innerHTML = `
        <strong>${sheet.character_name || "Untitled"}</strong>
        <div class="meta">${subtitleBits.join(" | ") || "No summary"}</div>
        <div class="meta">Updated ${formatDate(sheet.updated_at)}</div>
      `;

      item.addEventListener("click", () => writeSheetToForm(sheet));
      els.sheetItems.appendChild(item);
    });
  }

  async function loadSheets() {
    if (!supabase || !activeUser) {
      return;
    }

    const { data, error } = await supabase
      .from("character_sheets")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      setStatus(`Failed to load sheets: ${error.message}`, "error");
      return;
    }

    sheets = data || [];
    renderSheetList();

    if (selectedSheetId) {
      updateSharePanel(getSelectedSheetRecord());
    }

    if (selectedSheetId) {
      const existing = sheets.find((s) => s.id === selectedSheetId);
      if (existing) {
        writeSheetToForm(existing);
      }
    }
  }

  async function saveSheet() {
    if (!supabase || !activeUser) {
      setStatus("Sign in first.", "error");
      return;
    }

    const payload = buildPayload();
    if (!payload.character_name) {
      setStatus("Character name is required.", "error");
      els.characterNameInput.focus();
      return;
    }

    let query;
    if (selectedSheetId) {
      query = supabase
        .from("character_sheets")
        .update(payload)
        .eq("id", selectedSheetId)
        .select()
        .single();
    } else {
      query = supabase
        .from("character_sheets")
        .insert({ ...payload, user_id: activeUser.id })
        .select()
        .single();
    }

    const { data, error } = await query;
    if (error) {
      setStatus(`Save failed: ${error.message}`, "error");
      return;
    }

    setStatus("Sheet saved.", "success");
    selectedSheetId = data.id;
    await loadSheets();
  }

  async function deleteSelectedSheet() {
    if (!supabase || !selectedSheetId) {
      return;
    }

    const ok = window.confirm("Delete this character sheet?");
    if (!ok) {
      return;
    }

    const { error } = await supabase
      .from("character_sheets")
      .delete()
      .eq("id", selectedSheetId);

    if (error) {
      setStatus(`Delete failed: ${error.message}`, "error");
      return;
    }

    setStatus("Sheet deleted.", "success");
    clearSheetForm();
    await loadSheets();
  }

  function updateSignedInUI(user) {
    const isSignedIn = Boolean(user);
    const metadata = (user && user.user_metadata) ? user.user_metadata : {};
    const displayName = isSignedIn
      ? (metadata.preferred_username || metadata.full_name || metadata.name || user.email || user.id)
      : "";

    setAuthBadge(isSignedIn ? `Signed in: ${displayName}` : "Signed out", isSignedIn);
    els.signOutBtn.disabled = !isSignedIn;
    const allowGenerator = isSignedIn && isAdminTester(user);
    els.generateRandomSheetBtn.classList.toggle("hidden", !allowGenerator);
    els.generateRandomSheetBtn.disabled = !allowGenerator;
    els.authPanel.classList.toggle("hidden", isSignedIn);
    els.appPanel.classList.toggle("hidden", !isSignedIn);
  }

  function applySignedOutState() {
    activeUser = null;
    sheets = [];
    selectedSheetId = null;
    updateSignedInUI(null);
    clearSheetForm();
  }

  async function handleAuthSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      setStatus(`Session error: ${error.message}`, "error");
      return;
    }

    activeUser = data.session && data.session.user ? data.session.user : null;
    updateSignedInUI(activeUser);

    if (activeUser) {
      cleanOAuthParamsFromUrl();
      await loadSheets();
    } else {
      sheets = [];
      clearSheetForm();
    }
  }

  function wireEvents() {
    els.signInDiscordBtn.addEventListener("click", async () => {
      if (!supabase) return;

      const redirectTo = getOAuthRedirectUrl();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "discord",
        options: {
          redirectTo
        }
      });

      if (error) {
        setStatus(`Discord sign-in failed: ${error.message}`, "error");
        return;
      }

      setStatus("Redirecting to Discord...", "success");
    });

    els.signOutBtn.addEventListener("click", async () => {
      if (!supabase) return;
      els.signOutBtn.disabled = true;
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) {
        setStatus(`Sign-out failed: ${error.message}`, "error");
        els.signOutBtn.disabled = false;
        return;
      }

      applySignedOutState();
      cleanOAuthParamsFromUrl();
      setStatus("Signed out.", "success");
    });

    els.newSheetBtn.addEventListener("click", clearSheetForm);
    els.generateRandomSheetBtn.addEventListener("click", generateRandomTestSheet);
    els.saveSheetBtn.addEventListener("click", saveSheet);
    els.deleteSheetBtn.addEventListener("click", deleteSelectedSheet);
    els.isShareEnabledInput.addEventListener("change", () => {
      setShareEnabledForSelected(Boolean(els.isShareEnabledInput.checked));
    });
    els.copyShareLinkBtn.addEventListener("click", copyShareLinkForSelected);

    els.raceInput.addEventListener("change", () => {
      applyRaceGiftState();
    });

    const handleLevelRowClassChange = (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLSelectElement)) {
        return;
      }
      if (target.dataset.field === "classTaken") {
        recomputeAutoBabHp();
        applySkillRulesAndPropagation();
      }
    };

    els.levelRows.addEventListener("input", handleLevelRowClassChange);
    els.levelRows.addEventListener("change", handleLevelRowClassChange);

    els.levelRows.addEventListener("input", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) {
        return;
      }

      const field = target.dataset.field;
      if (!field || !PROPAGATED_LEVEL_FIELDS.includes(field)) {
        return;
      }

      target.value = sanitizeLevelPropValue(target.value);
      target.dataset.explicit = "1";
      recomputeLevelColumn(field);
      if (field === "con") {
        recomputeAutoBabHp();
      }
    });

    els.skillRows.addEventListener("input", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) {
        return;
      }

      const skillKey = target.dataset.skill;
      if (!skillKey) {
        return;
      }

      if (target.readOnly) {
        return;
      }

      target.value = sanitizeSkillRank(target.value);
      target.dataset.explicit = "1";
      recomputeSkillColumn(skillKey);
    });
  }

  function bootSupabaseClient() {
    const cfg = getRuntimeConfig();

    if (!cfg.url) {
      setStatus("Missing Supabase URL in supabase.config.js.", "error");
      return false;
    }

    if (!cfg.anonKey) {
      setStatus("Admin setup required: add the Supabase publishable key in CharDB/supabase.config.js.", "error");
      return false;
    }

    if (typeof window.supabase === "undefined" || !window.supabase.createClient) {
      setStatus("Supabase JS failed to load.", "error");
      return false;
    }

    supabase = window.supabase.createClient(cfg.url, cfg.anonKey, {
      auth: {
        persistSession: cfg.persistSession,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    return true;
  }

  async function init() {
    await loadClassCombatMeta();
    await loadRaceFeatMeta();
    renderRaceOptions();
    applyRaceGiftState();
    buildLevelRows();
    buildSkillRows();
    wireEvents();
    recomputeAutoBabHp();

    if (!bootSupabaseClient()) {
      return;
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      activeUser = session && session.user ? session.user : null;
      updateSignedInUI(activeUser);
      if (activeUser) {
        cleanOAuthParamsFromUrl();
        loadSheets();
      } else {
        sheets = [];
        clearSheetForm();
      }
    });

    await handleAuthSession();
  }

  init();
})();
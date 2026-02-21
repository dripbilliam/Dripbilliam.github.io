const fs = require("fs");
const path = require("path");
const xml2js = require("xml2js");

const inputPath = path.resolve(__dirname, "..", "docs", "NWNFeatData(BaseGame).xml");
const outputPath = path.resolve(__dirname, "feats.json");

const FEAT_TEMPLATE_REGEX = /\{\{\s*feat[\s\S]*?\}\}/i;

const readTextValue = (textNode) => {
  if (!textNode) {
    return "";
  }
  if (typeof textNode === "string") {
    return textNode;
  }
  if (typeof textNode._ === "string") {
    return textNode._;
  }
  return "";
};

const ABILITY_MAP = {
  strength: "str",
  dexterity: "dex",
  constitution: "con",
  intelligence: "int",
  wisdom: "wis",
  charisma: "cha"
};

const RACE_SET = new Set([
  "human",
  "elf",
  "half-elf",
  "half elf",
  "dwarf",
  "gnome",
  "halfling",
  "half-orc",
  "half orc"
]);

const CLASS_SET = new Set([
  "barbarian",
  "bard",
  "cleric",
  "druid",
  "fighter",
  "monk",
  "paladin",
  "ranger",
  "rogue",
  "sorcerer",
  "wizard",
  "assassin",
  "blackguard",
  "champion of torm",
  "dwarven defender",
  "arcane archer",
  "shifter",
  "weapon master",
  "shadowdancer",
  "pale master",
  "red dragon disciple",
  "harper scout",
  "purple dragon knight"
]);

const SKILL_SET = new Set([
  "appraise",
  "bluff",
  "concentration",
  "craft armor",
  "craft trap",
  "discipline",
  "heal",
  "hide",
  "listen",
  "lore",
  "move silently",
  "open lock",
  "parry",
  "perform",
  "persuade",
  "persuasion",
  "pick pocket",
  "search",
  "set trap",
  "spellcraft",
  "spot",
  "taunt",
  "tumble",
  "use magic device",
  "intimidate",
  "ride"
]);

const SPELL_SCHOOLS = [
  "Abjuration",
  "Conjuration",
  "Divination",
  "Enchantment",
  "Evocation",
  "Illusion",
  "Necromancy",
  "Transmutation"
];

const stripWikiMarkup = (value) => {
  return value
    .replace(/<del>[\s\S]*?<\/del>/gi, " ")
    .replace(/<strike>[\s\S]*?<\/strike>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/''/g, "")
    .replace(/&mdash;/g, "-")
    .replace(/\s+/g, " ")
    .trim();
};

const parseRequirements = (value) => {
  const requirements = {
    level: null,
    feats: [],
    skills: {},
    stats: {},
    bab: null,
    class: [],
    race: [],
    alignment: null,
    spells: {},
    other: []
  };

  if (!value) {
    return requirements;
  }

  const trimmed = value.trim();
  if (trimmed === "-" || trimmed.toLowerCase() === "none" || trimmed.toLowerCase() === "unknown") {
    return requirements;
  }

  const text = stripWikiMarkup(trimmed);
  if (!text) {
    return requirements;
  }

  const tokens = text.split(/[,;]/).map((token) => token.trim()).filter(Boolean);

  for (const token of tokens) {
    const lower = token.toLowerCase();

    if (!lower) {
      continue;
    }

    if (lower.includes(" or ") || lower.includes(" either ")) {
      requirements.other.push(token);
      continue;
    }

    const levelMatch = lower.match(/(\d+)(st|nd|rd|th)\s+level/);
    if (levelMatch) {
      const levelValue = Number(levelMatch[1]);
      if (!Number.isNaN(levelValue)) {
        requirements.level = Math.max(requirements.level || 0, levelValue);
        continue;
      }
    }

    if (lower.includes("epic")) {
      requirements.other.push(token);
      continue;
    }

    const babMatch = lower.match(/base attack bonus(?: of)?\s*\+?(\d+)/);
    if (babMatch) {
      requirements.bab = Number(babMatch[1]);
      continue;
    }

    const castMatch = lower.match(/ability to cast\s+(\d+)(st|nd|rd|th)?\s+level\s+spells?/);
    if (castMatch) {
      requirements.spells.maxCircle = Number(castMatch[1]);
      requirements.other.push("ability to cast " + castMatch[1] + "th level spells");
      continue;
    }

    const spellcasterLevelMatch = lower.match(/spellcaster level\s*(\d+)/);
    if (spellcasterLevelMatch) {
      requirements.spells.casterLevel = Number(spellcasterLevelMatch[1]);
      continue;
    }

    const abilityMatch = lower.match(/(strength|dexterity|constitution|intelligence|wisdom|charisma)\s*(\d+)/);
    if (abilityMatch) {
      const key = ABILITY_MAP[abilityMatch[1]];
      requirements.stats[key] = Number(abilityMatch[2]);
      continue;
    }

    const skillMatch = lower.match(/([a-z' ]+)\s+(\d+)(?:\s*skill\s*rank|\s*rank|\s*ranks)?/);
    if (skillMatch) {
      const skillName = skillMatch[1].trim();
      if (SKILL_SET.has(skillName)) {
        requirements.skills[skillName] = Number(skillMatch[2]);
        continue;
      }
    }

    if (RACE_SET.has(lower)) {
      const raceValue = lower.replace("half ", "half-");
      requirements.race.push(raceValue);
      continue;
    }

    let matchedClass = false;
    for (const className of CLASS_SET) {
      if (lower.startsWith(className)) {
        const levelMatches = Array.from(lower.matchAll(/\b(\d+)\b/g)).map((match) => Number(match[1]));
        if (levelMatches.length) {
          requirements.class.push({
            name: className,
            levels: levelMatches
          });
        } else {
          requirements.class.push({
            name: className,
            level: 1
          });
        }
        matchedClass = true;
        break;
      }
    }
    if (matchedClass) {
      continue;
    }

    const alignmentMatch = lower.match(/(lawful good|neutral good|chaotic good|lawful neutral|true neutral|chaotic neutral|lawful evil|neutral evil|chaotic evil|lawful|neutral|chaotic|good|evil)/);
    if (alignmentMatch) {
      requirements.alignment = alignmentMatch[1];
      continue;
    }

    if (lower.includes("ability to cast") || lower.includes("exclusive to")) {
      requirements.other.push(token);
      continue;
    }

    if (token) {
      requirements.feats.push(token);
    }
  }

  return requirements;
};

const parseFeatTemplate = (text) => {
  const match = text.match(FEAT_TEMPLATE_REGEX);
  if (!match) {
    return null;
  }

  const template = match[0];
  const lines = template.split(/\r?\n/);
  const fields = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(1, separatorIndex).trim().toLowerCase();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (!key) {
      continue;
    }

    fields[key] = value;
  }

  return fields;
};

const buildFeatEntry = (title, fields) => {
  return {
    name: title,
    requirements: parseRequirements(fields.prereq || fields.prereqs || fields.requirements),
    effects: {
      stats: {},
      ac: {},
      skills: {},
      hp: null,
      other: []
    },
    source: {
      type: fields.type || "",
      desc: fields.desc || ""
    }
  };
};

const cloneEntry = (entry) => JSON.parse(JSON.stringify(entry));

const expandSpellSchoolFeats = (feats) => {
  const expansions = [
    {
      baseKey: "Spell focus",
      namePrefix: "Spell Focus",
      update: () => {}
    },
    {
      baseKey: "Greater spell focus",
      namePrefix: "Greater Spell Focus",
      update: (entry, school) => {
        entry.requirements.feats = [`Spell Focus: ${school}`];
      }
    },
    {
      baseKey: "Epic spell focus",
      namePrefix: "Epic Spell Focus",
      update: (entry, school) => {
        entry.requirements.feats = [`Greater Spell Focus: ${school}`];
      }
    },
    {
      baseKey: "Arcane defense",
      namePrefix: "Arcane Defense",
      update: (entry, school) => {
        entry.requirements.feats = [`Spell Focus: ${school}`];
      }
    }
  ];

  for (const expansion of expansions) {
    const baseEntry = feats[expansion.baseKey];
    if (!baseEntry) {
      continue;
    }

    for (const school of SPELL_SCHOOLS) {
      const entry = cloneEntry(baseEntry);
      entry.name = `${expansion.namePrefix}: ${school}`;
      expansion.update(entry, school);
      feats[entry.name] = entry;
    }

    delete feats[expansion.baseKey];
  }
};

const main = async () => {
  const xml = fs.readFileSync(inputPath, "utf8");
  const parser = new xml2js.Parser({
    explicitArray: false,
    mergeAttrs: true,
    preserveChildrenOrder: true,
    explicitRoot: true
  });

  const data = await parser.parseStringPromise(xml);
  const pages = Array.isArray(data.mediawiki.page) ? data.mediawiki.page : [data.mediawiki.page];

  const feats = {};

  for (const page of pages) {
    const title = page.title;
    const text = readTextValue(page?.revision?.text);
    if (!title || !text) {
      continue;
    }

    if (!FEAT_TEMPLATE_REGEX.test(text)) {
      continue;
    }

    const fields = parseFeatTemplate(text);
    if (!fields) {
      continue;
    }

    feats[title] = buildFeatEntry(title, fields);
  }

  expandSpellSchoolFeats(feats);

  const sortedFeats = Object.keys(feats)
    .sort((a, b) => a.localeCompare(b))
    .reduce((acc, key) => {
      acc[key] = feats[key];
      return acc;
    }, {});

  fs.writeFileSync(outputPath, JSON.stringify(sortedFeats, null, 2) + "\n", "utf8");

  console.log(`Wrote ${Object.keys(sortedFeats).length} feats to ${outputPath}`);
};

main().catch((error) => {
  console.error("Failed to parse feat data:", error);
  process.exit(1);
});

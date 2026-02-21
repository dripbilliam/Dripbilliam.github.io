const fs = require("fs");
const path = require("path");
const xml2js = require("xml2js");

const inputPath = path.resolve(__dirname, "..", "docs", "ArelithRaces.xml");
const outputPath = path.resolve(__dirname, "races.json");

const args = process.argv.slice(2);
const limitArgIndex = args.indexOf("--limit");
const onlyArgIndex = args.indexOf("--only");

const limit = limitArgIndex !== -1 ? Number(args[limitArgIndex + 1]) : null;
const onlyNames = new Set();

if (onlyArgIndex !== -1 && args[onlyArgIndex + 1]) {
  const raw = args[onlyArgIndex + 1];
  raw.split(",").map((name) => name.trim()).filter(Boolean).forEach((name) => onlyNames.add(name));
}

const decodeEntities = (value) => {
  if (!value) {
    return "";
  }
  return value
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(/&nbsp;/gi, " ");
};

const stripWikiMarkupPreserveNewlines = (value) => {
  return value
    .replace(/<del>[\s\S]*?<\/del>/gi, " ")
    .replace(/<strike>[\s\S]*?<\/strike>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/''/g, "")
    .replace(/&mdash;/g, "-")
    .replace(/\r\n/g, "\n")
    .replace(/[\t ]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
};

const stripWikiMarkup = (value) => stripWikiMarkupPreserveNewlines(value).replace(/\s+/g, " ").trim();

const splitList = (value) => {
  if (!value) {
    return [];
  }
  const decoded = decodeEntities(value);
  const normalized = decoded.replace(/<\s*br\s*\/?>/gi, "\n").replace(/<\s*\/br\s*>/gi, "\n");
  const cleaned = stripWikiMarkupPreserveNewlines(normalized);
  return cleaned
    .split(/\n|\r\n|;/)
    .map((item) => item.trim())
    .filter((item) => item && item.toLowerCase() !== "none");
};

const parseSignedNumber = (value) => {
  if (!value) {
    return 0;
  }
  const match = value.match(/[-+]?\d+/);
  if (!match) {
    return 0;
  }
  return Number(match[0]);
};

const extractSkills = (bonusValue) => {
  const skills = {};
  const entries = splitList(bonusValue);

  for (const entry of entries) {
    const lower = entry.toLowerCase();
    if (!lower.includes("skill affinity")) {
      continue;
    }

    const isGreater = lower.includes("greater skill affinity");
    const match = entry.match(/skill affinity[: ]+(.+)$/i);
    if (!match) {
      continue;
    }

    const skillName = match[1].trim().replace(/\.$/, "");
    if (!skillName) {
      continue;
    }

    const key = skillName.toLowerCase();
    const bonus = isGreater ? 4 : 2;
    skills[key] = (skills[key] || 0) + bonus;
  }

  return skills;
};

const parseSkillBonusEntries = (value) => {
  const skills = {};
  const entries = splitList(value);

  for (const entry of entries) {
    const match = entry.match(/([+-]?\d+)\s+(.+)/);
    if (!match) {
      continue;
    }
    const bonus = Number(match[1]);
    const skillName = match[2].trim().replace(/\.$/, "");
    if (!skillName) {
      continue;
    }
    const key = skillName.toLowerCase();
    skills[key] = (skills[key] || 0) + bonus;
  }

  return skills;
};

const extractAasimarHeritageTable = (text) => {
  const lower = text.toLowerCase();
  const headerIndex = lower.indexOf("===heritage===");
  if (headerIndex === -1) {
    return null;
  }

  const tableStart = lower.indexOf("{|", headerIndex);
  if (tableStart === -1) {
    return null;
  }

  const tableEnd = lower.indexOf("|}", tableStart);
  if (tableEnd === -1) {
    return null;
  }

  return text.slice(tableStart, tableEnd + 2);
};

const parseAasimarHeritages = (text) => {
  const tableText = extractAasimarHeritageTable(text);
  if (!tableText) {
    return [];
  }

  const normalized = decodeEntities(tableText).replace(/\r\n/g, "\n");
  const rows = normalized.split(/\n\|-\s*/).slice(1);
  const entries = [];

  for (const row of rows) {
    const cleanedRow = row.replace(/\n\|/g, "|").trim();
    if (!cleanedRow || cleanedRow.startsWith("!")) {
      continue;
    }

    const cells = cleanedRow
      .replace(/^\|/, "")
      .split("||")
      .map((cell) => stripWikiMarkupPreserveNewlines(cell).trim())
      .filter(Boolean);

    if (cells.length < 7) {
      continue;
    }

    const heritageName = cells[0].replace(/^'+|'+$/g, "").trim();
    if (!heritageName) {
      continue;
    }

    const bonusFeat = cells[2];
    const skillBonus = cells[4];
    const innateAbility = cells[6];

    const feats = [...splitList(bonusFeat), ...splitList(innateAbility)];
    const skills = parseSkillBonusEntries(skillBonus);

    entries.push({
      name: `Aasimar (${heritageName})`,
      stats: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
      feats,
      skills
    });
  }

  return entries;
};

const extractTemplate = (text, templateName) => {
  const startIndex = text.toLowerCase().indexOf("{{" + templateName.toLowerCase());
  if (startIndex === -1) {
    return null;
  }

  let index = startIndex;
  let depth = 0;

  while (index < text.length) {
    if (text.startsWith("{{", index)) {
      depth += 1;
      index += 2;
      continue;
    }
    if (text.startsWith("}}", index)) {
      depth -= 1;
      index += 2;
      if (depth === 0) {
        return text.slice(startIndex, index);
      }
      continue;
    }
    index += 1;
  }

  return null;
};

const parseRaceTemplate = (templateText) => {
  if (!templateText) {
    return null;
  }

  const inner = templateText.replace(/^\{\{Race/i, "").replace(/\}\}\s*$/, "");
  const lines = inner.split(/\r?\n/);
  const fields = {};
  let currentKey = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    if (trimmed.startsWith("|")) {
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) {
        currentKey = trimmed.slice(1).trim().toUpperCase();
        fields[currentKey] = "";
      } else {
        currentKey = trimmed.slice(1, eqIndex).trim().toUpperCase();
        fields[currentKey] = trimmed.slice(eqIndex + 1).trim();
      }
      continue;
    }
    if (currentKey) {
      fields[currentKey] += "\n" + trimmed;
    }
  }

  return fields;
};

const buildRaceEntry = (title, fields) => {
  const name = stripWikiMarkup(decodeEntities(fields.NAME || title || "")).trim();
  if (!name) {
    return null;
  }

  const stats = {
    str: parseSignedNumber(fields.STR),
    dex: parseSignedNumber(fields.DEX),
    con: parseSignedNumber(fields.CON),
    int: parseSignedNumber(fields.INT),
    wis: parseSignedNumber(fields.WIS),
    cha: parseSignedNumber(fields.CHA)
  };

  const feats = splitList(fields.FEATS || "");
  const skills = extractSkills(fields.BONUS || "");

  return {
    name,
    stats,
    feats,
    skills
  };
};

const parseXml = async () => {
  const xml = fs.readFileSync(inputPath, "utf8");
  const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });
  const data = await parser.parseStringPromise(xml);
  const pages = Array.isArray(data?.mediawiki?.page) ? data.mediawiki.page : [data?.mediawiki?.page].filter(Boolean);

  const races = {};
  let pageCount = 0;

  for (const page of pages) {
    const title = page?.title || "";
    const text = page?.revision?.text?._ || page?.revision?.text || "";
    if (typeof text !== "string" || !text) {
      continue;
    }

    const entries = [];

    const template = extractTemplate(text, "Race");
    if (template) {
      const fields = parseRaceTemplate(template);
      if (fields) {
        const entry = buildRaceEntry(title, fields);
        if (entry) {
          entries.push(entry);
        }
      }
    }

    if (title.toLowerCase() === "aasimar") {
      entries.push(...parseAasimarHeritages(text));
    }

    let added = 0;
    for (const entry of entries) {
      if (onlyNames.size && !onlyNames.has(entry.name)) {
        continue;
      }
      races[entry.name] = entry;
      added += 1;
    }

    if (added > 0) {
      pageCount += 1;
      if (limit && pageCount >= limit) {
        break;
      }
    }
  }

  fs.writeFileSync(outputPath, JSON.stringify(races, null, 2), "utf8");
  console.log("Saved races to", outputPath);
};

parseXml().catch((error) => {
  console.error("Failed to parse races:", error);
  process.exitCode = 1;
});

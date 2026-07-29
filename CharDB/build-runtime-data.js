const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const classPath = path.join(root, "CharacterCalculator", "classData.json");
const racesPath = path.join(root, "Extras", "docs", "ArelithRaces.xml");
const outDir = path.join(__dirname, "data");

function normalizeClassName(value) {
  return String(value || "").toLowerCase().replace(/[^a-z]/g, "");
}

function normalizeRaceName(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseHitDieToMax(value) {
  const text = String(value || "");
  const match = text.match(/d\s*(\d+)/i);
  if (!match) {
    return 8;
  }
  const parsed = Number.parseInt(match[1], 10);
  return Number.isNaN(parsed) ? 8 : parsed;
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

function decodeEntities(raw) {
  return String(raw || "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

function dedupeStrings(values) {
  const seen = new Set();
  const out = [];
  values.forEach((value) => {
    const cleaned = String(value || "").trim();
    const key = normalizeRaceName(cleaned);
    if (!key || seen.has(key)) {
      return;
    }
    seen.add(key);
    out.push(cleaned);
  });
  return out;
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

function buildClassCombatMeta() {
  const classData = JSON.parse(fs.readFileSync(classPath, "utf8"));
  const out = {};

  Object.entries(classData || {}).forEach(([key, value]) => {
    const className = String((value && value.name) || key || "").trim();
    if (!className) {
      return;
    }

    out[normalizeClassName(className)] = {
      className,
      hitDie: parseHitDieToMax((value && (value.hitDie || value.hitdie)) || "d8"),
      babRate: parseBabRate(value && value.baseAttackBonus)
    };
  });

  return out;
}

function buildRaceFeatsMeta() {
  const xmlText = fs.readFileSync(racesPath, "utf8");
  const decoded = decodeEntities(xmlText);
  const blockPattern = /\|NAME=([^\r\n|]+)[\s\S]*?\|FEATS=([\s\S]*?)(?=\r?\n\|[A-Z_]+=|\r?\n\}\}|$)/g;
  const out = {};

  let match;
  while ((match = blockPattern.exec(decoded)) !== null) {
    const raceName = String(match[1] || "").trim();
    const feats = extractFeatLabels(match[2] || "");
    if (!raceName || !feats.length) {
      continue;
    }

    out[normalizeRaceName(raceName)] = feats;
  }

  return out;
}

function writeJson(fileName, data) {
  fs.mkdirSync(outDir, { recursive: true });
  const filePath = path.join(outDir, fileName);
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  return filePath;
}

function main() {
  const classMeta = buildClassCombatMeta();
  const raceMeta = buildRaceFeatsMeta();

  const classOutPath = writeJson("classCombatMeta.json", classMeta);
  const raceOutPath = writeJson("raceFeatsMeta.json", raceMeta);

  console.log(`Wrote ${Object.keys(classMeta).length} class rows to ${classOutPath}`);
  console.log(`Wrote ${Object.keys(raceMeta).length} race rows to ${raceOutPath}`);
}

main();
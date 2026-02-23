const fs = require("fs");
const path = require("path");
const xml2js = require("xml2js");
const readline = require("readline");

const xmlPath = path.resolve(__dirname, "..", "docs", "ArelithClassData.xml");
const classDataPath = path.resolve(__dirname, "classData.json");

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

const stripWikiMarkup = (value) => {
  let output = decodeEntities(value || "");

  output = output
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\s*\/br\s*>/gi, "\n");

  while (/\{\{[^{}]*\}\}/.test(output)) {
    output = output.replace(/\{\{[^{}]*\}\}/g, " ");
  }

  output = output
    .replace(/<[^>]+>/g, " ")
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/'''''/g, "")
    .replace(/'''/g, "")
    .replace(/''/g, "")
    .replace(/&mdash;/gi, "-")
    .replace(/\s+/g, " ")
    .trim();

  return output;
};

const normalizeSkillName = (value) => {
  const raw = (value || "")
    .toLowerCase()
    .replace(/[.;:]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!raw || raw === "none") {
    return "";
  }

  const aliasMap = {
    "use traps": "use trap",
    "sleight hand": "sleight of hand"
  };

  return aliasMap[raw] || raw;
};

const extractClassSkills = (pageText) => {
  const lines = decodeEntities(pageText || "").split(/\r?\n/);
  const markerRegex = /'''\s*class skills\s*:\s*'''/i;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!markerRegex.test(line)) {
      continue;
    }

    const rowValues = [];
    const first = line.split(markerRegex)[1] || "";
    rowValues.push(first);

    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const follow = lines[cursor] || "";
      const trimmed = follow.trim();

      if (!trimmed) {
        break;
      }
      if (/^==+/.test(trimmed)) {
        break;
      }
      if (/^\{\|/.test(trimmed) || /^\|-/.test(trimmed) || /^\|\}/.test(trimmed)) {
        break;
      }
      if (/^'''\s*[a-z][^:]{0,80}:\s*'''/i.test(trimmed)) {
        break;
      }

      rowValues.push(trimmed);
    }

    const merged = stripWikiMarkup(rowValues.join(" "));
    if (!merged) {
      return [];
    }

    return merged
      .split(/,|\n|;/)
      .map((part) => normalizeSkillName(part))
      .filter(Boolean)
      .filter((value, pos, array) => array.indexOf(value) === pos);
  }

  return [];
};

const getTextNode = (page) => {
  const revision = page && page.revision && page.revision[0];
  if (!revision || !revision.text || !revision.text[0]) {
    return "";
  }

  const rawTextNode = revision.text[0];
  if (typeof rawTextNode === "string") {
    return rawTextNode;
  }
  if (rawTextNode && typeof rawTextNode._ === "string") {
    return rawTextNode._;
  }
  return "";
};

const findClassKey = (classData, title) => {
  const normalizedTitle = (title || "").trim().toLowerCase();
  if (!normalizedTitle) {
    return null;
  }

  for (const key of Object.keys(classData)) {
    if (key.toLowerCase() === normalizedTitle) {
      return key;
    }

    const className = classData[key] && classData[key].name;
    if (typeof className === "string" && className.trim().toLowerCase() === normalizedTitle) {
      return key;
    }
  }

  return null;
};

const findMatchingDelimiter = (text, startIndex, openChar, closeChar) => {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = startIndex; index < text.length; index += 1) {
    const char = text[index];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === openChar) {
      depth += 1;
      continue;
    }

    if (char === closeChar) {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
};

const buildClassSkillsArrayText = (skills, baseIndent) => {
  if (!Array.isArray(skills) || skills.length === 0) {
    return "[]";
  }

  const itemIndent = `${baseIndent}  `;
  const rows = skills.map((skill) => `${itemIndent}${JSON.stringify(skill)}`);
  return `[\n${rows.join(",\n")}\n${baseIndent}]`;
};

const upsertClassSkillsInRawJson = (rawJson, classKey, classSkills) => {
  const classKeyPattern = `\"${classKey.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\"\\s*:\\s*\\{`;
  const classKeyRegex = new RegExp(classKeyPattern, "m");
  const keyMatch = classKeyRegex.exec(rawJson);
  if (!keyMatch) {
    return rawJson;
  }

  const objectStart = rawJson.indexOf("{", keyMatch.index);
  if (objectStart === -1) {
    return rawJson;
  }
  const objectEnd = findMatchingDelimiter(rawJson, objectStart, "{", "}");
  if (objectEnd === -1) {
    return rawJson;
  }

  const objectText = rawJson.slice(objectStart, objectEnd + 1);
  const classSkillsRegex = /"classSkills"\s*:\s*\[/m;
  const classSkillsMatch = classSkillsRegex.exec(objectText);
  const eol = rawJson.includes("\r\n") ? "\r\n" : "\n";

  if (classSkillsMatch) {
    const propertyStart = classSkillsMatch.index;
    const arrayStart = propertyStart + classSkillsMatch[0].lastIndexOf("[");
    const arrayEnd = findMatchingDelimiter(objectText, arrayStart, "[", "]");
    if (arrayEnd === -1) {
      return rawJson;
    }

    const beforeProp = objectText.slice(0, propertyStart);
    const lineStart = beforeProp.lastIndexOf("\n") + 1;
    const propertyIndent = beforeProp.slice(lineStart).match(/^\s*/)[0];
    const baseIndent = propertyIndent;
    const arrayText = buildClassSkillsArrayText(classSkills, baseIndent);
    const replacement = `${propertyIndent}\"classSkills\": ${arrayText.replace(/\n/g, eol)}`;

    const afterArray = objectText.slice(arrayEnd + 1);
    let propertyEnd = arrayEnd + 1;
    if (afterArray.startsWith(",")) {
      propertyEnd += 1;
    }

    const newObjectText = objectText.slice(0, propertyStart) + replacement + objectText.slice(propertyEnd);
    return rawJson.slice(0, objectStart) + newObjectText + rawJson.slice(objectEnd + 1);
  }

  const closingBraceIndex = objectText.lastIndexOf("}");
  const beforeClosing = objectText.slice(0, closingBraceIndex);
  const lineStart = beforeClosing.lastIndexOf("\n") + 1;
  const objectCloseIndent = beforeClosing.slice(lineStart).match(/^\s*/)[0];
  const propertyIndent = `${objectCloseIndent}  `;
  const arrayText = buildClassSkillsArrayText(classSkills, propertyIndent);
  const propertyText = `${propertyIndent}\"classSkills\": ${arrayText.replace(/\n/g, eol)}`;

  const trimmedBefore = beforeClosing.trimEnd();
  const hadTrailingComma = trimmedBefore.endsWith(",");
  const prefix = hadTrailingComma ? beforeClosing : `${beforeClosing},`;
  const newObjectText = `${prefix}${eol}${propertyText}${eol}${objectCloseIndent}}`;

  return rawJson.slice(0, objectStart) + newObjectText + rawJson.slice(objectEnd + 1);
};

const parseManualSkills = (input) => {
  if (!input) {
    return [];
  }

  return input
    .split(/,|;/)
    .map((part) => normalizeSkillName(part))
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) === index);
};

const promptForMissingClassSkills = async (classData, missingEntries) => {
  if (!missingEntries.length) {
    return 0;
  }

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.log("Non-interactive terminal detected; skipping manual classSkills prompts.");
    return 0;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const ask = (question) => new Promise((resolve) => rl.question(question, resolve));
  let manuallyUpdated = 0;

  console.log("\nSome classes still have no parsed Class Skills.");
  console.log("Enter comma-separated skills to set them manually, or press Enter to skip.\n");

  for (const entry of missingEntries) {
    const current = classData[entry.classKey] && Array.isArray(classData[entry.classKey].classSkills)
      ? classData[entry.classKey].classSkills
      : [];

    if (current.length > 0) {
      continue;
    }

    const titleHint = entry.title && entry.title !== entry.classKey ? ` (wiki: ${entry.title})` : "";
    const response = await ask(`${entry.classKey}${titleHint} classSkills: `);
    const parsed = parseManualSkills(response);
    if (parsed.length > 0) {
      classData[entry.classKey].classSkills = parsed;
      manuallyUpdated += 1;
    }
  }

  rl.close();
  return manuallyUpdated;
};

async function main() {
  const xmlRaw = fs.readFileSync(xmlPath, "utf-8");
  const parser = new xml2js.Parser({ explicitArray: true, mergeAttrs: true, trim: false });
  const parsed = await parser.parseStringPromise(xmlRaw);

  const classDataRaw = fs.readFileSync(classDataPath, "utf-8");
  const classData = JSON.parse(classDataRaw);

  const pages = (((parsed || {}).mediawiki || {}).page) || [];
  let updated = 0;
  let withoutSkills = 0;
  const unmatchedPages = [];
  const missingEntries = [];
  const classSkillUpdates = new Map();

  for (const page of pages) {
    const title = page && page.title && page.title[0] ? page.title[0] : "";
    const classKey = findClassKey(classData, title);
    if (!classKey) {
      continue;
    }

    const text = getTextNode(page);
    const classSkills = extractClassSkills(text);

    if (classSkills.length === 0) {
      withoutSkills += 1;
      missingEntries.push({ classKey, title });
      continue;
    }

    classData[classKey].classSkills = classSkills;
    classSkillUpdates.set(classKey, classSkills);
    updated += 1;

    if ((title || "").trim().toLowerCase() !== classKey.trim().toLowerCase()) {
      unmatchedPages.push({ title, classKey });
    }
  }

  const uniqueMissingEntries = missingEntries.filter((entry, index, array) => {
    return array.findIndex((other) => other.classKey === entry.classKey) === index;
  });

  const manuallyUpdated = await promptForMissingClassSkills(classData, uniqueMissingEntries);
  if (manuallyUpdated > 0) {
    uniqueMissingEntries.forEach((entry) => {
      const skills = classData[entry.classKey] && classData[entry.classKey].classSkills;
      if (Array.isArray(skills) && skills.length > 0) {
        classSkillUpdates.set(entry.classKey, skills);
      }
    });
  }

  let nextRaw = classDataRaw;
  classSkillUpdates.forEach((skills, classKey) => {
    nextRaw = upsertClassSkillsInRawJson(nextRaw, classKey, skills);
  });

  fs.writeFileSync(classDataPath, nextRaw, "utf-8");

  console.log(`Updated classSkills for ${updated} classes.`);
  console.log(`Matched classes with no extracted class skills: ${withoutSkills}.`);
  console.log(`Manually updated classSkills: ${manuallyUpdated}.`);
  if (uniqueMissingEntries.length > 0) {
    const unresolved = uniqueMissingEntries.filter((entry) => {
      const skills = classData[entry.classKey] && classData[entry.classKey].classSkills;
      return !Array.isArray(skills) || skills.length === 0;
    });

    if (unresolved.length > 0) {
      console.log("Still missing classSkills:");
      unresolved.forEach((entry) => {
        console.log(`  - ${entry.classKey}`);
      });
    }
  }
  if (unmatchedPages.length > 0) {
    console.log("Title-to-key matches (case/name differences):");
    unmatchedPages.slice(0, 20).forEach(({ title, classKey }) => {
      console.log(`  ${title} -> ${classKey}`);
    });
    if (unmatchedPages.length > 20) {
      console.log(`  ...and ${unmatchedPages.length - 20} more`);
    }
  }
}

main().catch((error) => {
  console.error("Failed to parse class skills:", error);
  process.exitCode = 1;
});

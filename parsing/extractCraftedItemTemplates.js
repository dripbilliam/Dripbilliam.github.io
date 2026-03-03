const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const XML_PATHS = [
  path.join(ROOT, 'docs', 'ArelithCraftedArmourAndWeapons.xml'),
  path.join(ROOT, 'docs', 'ArelithCraftedArmours.xml'),
  path.join(ROOT, 'docs', 'ArelithCraftedStaffAdditions.xml')
];
const CLASS_DATA_PATH = path.join(ROOT, 'CharacterCalculator', 'classData.json');
const OUTPUT_DIR = path.join(ROOT, 'Parsed');
const OUTPUT_TEMPLATES = path.join(OUTPUT_DIR, 'craftedItemTemplates.json');
const OUTPUT_AMBIGUOUS = path.join(OUTPUT_DIR, 'craftedItemAmbiguous.json');
const OUTPUT_TEMPLATES_WEB = path.join(ROOT, 'CharacterCalculator', 'craftedItemTemplates.json');

const DAMAGE_TYPE_MAP = {
  slash: 'Acid',
  slashing: 'Acid',
  pierce: 'Positive',
  piercing: 'Positive',
  bludgeon: 'Sonic',
  bludgeoning: 'Sonic',
  cold: 'Cold',
  fire: 'Fire',
  electrical: 'Electrical',
  electric: 'Electrical',
  sonic: 'Sonic',
  acid: 'Acid',
  divine: 'Divine',
  negative: 'Negative',
  positive: 'Positive',
  poison: 'Poison',
  entropy: 'Entropy',
  psychic: 'Psychic',
  magical: 'Divine'
};

const SPECIFIC_SAVE_KIND_MAP = {
  acid: 'acid',
  cold: 'cold',
  death: 'death',
  disease: 'disease',
  divine: 'divine',
  electrical: 'electrical',
  electric: 'electrical',
  fear: 'fear',
  fire: 'fire',
  mind: 'mind',
  poison: 'poison',
  positive: 'positive',
  negative: 'negative',
  sonic: 'sonic'
};

const ALIGNMENT_PATTERNS = [
  'lawful good',
  'neutral good',
  'chaotic good',
  'lawful neutral',
  'true neutral',
  'chaotic neutral',
  'lawful evil',
  'neutral evil',
  'chaotic evil',
  'non-good',
  'non-evil',
  'non-lawful',
  'non-chaotic',
  'lawful',
  'neutral',
  'chaotic',
  'good',
  'evil'
];

const SKILL_NAME_MAP = {
  appraise: 'appraise',
  bluff: 'bluff',
  concentration: 'concentration',
  climb: 'climb',
  craftarmor: 'craft armor',
  craftarmorandweapons: 'craft armor',
  craftweapon: 'craft weapon',
  crafttrap: 'craft trap',
  disabletrap: 'disable trap',
  disabletraps: 'disable trap',
  heal: 'heal',
  hide: 'hide',
  intimidate: 'intimidate',
  leadership: 'leadership',
  listen: 'listen',
  lore: 'lore',
  movesilently: 'move silently',
  openlock: 'open lock',
  openlocks: 'open lock',
  parry: 'parry',
  perform: 'perform',
  persuade: 'persuade',
  pickpocket: 'pick pocket',
  search: 'search',
  settrap: 'set trap',
  sail: 'sail',
  ride: 'ride',
  discipline: 'discipline',
  animalempathy: 'animal empathy',
  sleightofhand: 'sleight of hand',
  spellcraft: 'spellcraft',
  spot: 'spot',
  taunt: 'taunt',
  tumble: 'tumble',
  usemagicdevice: 'use magic device',
  usetrap: 'use trap',
  usetraps: 'use trap'
};

function main() {
  const sources = XML_PATHS
    .filter(filePath => fs.existsSync(filePath))
    .map(filePath => ({ filePath, xml: fs.readFileSync(filePath, 'utf-8') }));

  if (sources.length === 0) {
    throw new Error(`No source XML files found. Checked: ${XML_PATHS.join(', ')}`);
  }

  const classSet = loadClassSet();

  const pages = sources.flatMap(source => extractPages(source.xml, source.filePath));
  const templateByKey = new Map();
  const ambiguousByKey = new Map();

  for (const page of pages) {
    const rows = parseTableRows(page.text);
    const sectionWeaponMetaByTableIndex = parseSectionWeaponMetaByTableIndex(page.text, page.title);
    for (const row of rows) {
      if (!row.cells || row.cells.length < 2) continue;
      const name = cleanInline(row.cells[0]);
      if (!name || /^Name$/i.test(name)) continue;

      const propertiesCell = row.cells[row.cells.length - 1] || '';
      const propertyLines = splitPropertyLines(propertiesCell);

      const template = {
        itemName: name,
        rowId: row.id || '',
        sourcePage: page.title,
        sourceFile: path.basename(page.sourcePath || ''),
        slotCategory: inferTemplateSlotCategory(page.title, row.id, name),
        meta: {
          baseWeaponChart: '',
          baseWeaponType: '',
          finesse: '',
          focusGroup: '',
          baseDamage: '',
          critRange: '',
          damageType: '',
          proficiency: '',
          ranged: false,
          classRestriction: '',
          raceRestriction: '',
          umdBypass: 0,
          loreBypass: 0,
          special: {
            castSpells: [],
            extraMeleeDamageTypes: [],
            extraDamageTypes: [],
            aprConditions: [],
            weightIncrease: '',
            weightReductionText: '',
            arcaneSpellFailure: '',
            allowedBaseTypes: [],
            armorBonusBySubtype: {},
            touchAttack: false,
            ammoNotes: [],
            notes: []
          }
        },
        requirements: createDefaultRequirements(),
        properties: []
      };

      const sectionWeaponMeta = sectionWeaponMetaByTableIndex.get(Number(row.tableIndex)) || null;
      applySectionWeaponMetaToTemplate(template, sectionWeaponMeta);

      const unmatchedLines = [];

      for (const rawLine of propertyLines) {
        const line = normalizePropertyLine(rawLine);
        if (!line) continue;

        if (shouldIgnoreLine(line)) continue;

        const handled = parsePropertyLine(line, template, classSet);
        if (!handled) {
          unmatchedLines.push(line);
        }
      }

      const key = makeTemplateKey(template);
      verifyRequirementsSchema(template);
      templateByKey.set(key, template);

      if (unmatchedLines.length > 0) {
        ambiguousByKey.set(key, {
          itemName: name,
          rowId: row.id || '',
          sourcePage: page.title,
          sourceFile: path.basename(page.sourcePath || ''),
          unmatchedLines
        });
      } else {
        ambiguousByKey.delete(key);
      }
    }
  }

  const templates = Array.from(templateByKey.values());
  const ambiguous = Array.from(ambiguousByKey.values());

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_TEMPLATES, JSON.stringify(templates, null, 2), 'utf-8');
  fs.writeFileSync(OUTPUT_AMBIGUOUS, JSON.stringify(ambiguous, null, 2), 'utf-8');
  fs.writeFileSync(OUTPUT_TEMPLATES_WEB, JSON.stringify(templates, null, 2), 'utf-8');

  console.log(`Wrote ${templates.length} templates -> ${OUTPUT_TEMPLATES}`);
  console.log(`Wrote ${templates.length} templates -> ${OUTPUT_TEMPLATES_WEB}`);
  console.log(`Found ${ambiguous.length} items with unmatched lines -> ${OUTPUT_AMBIGUOUS}`);
}

function createDefaultRequirements() {
  return {
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
}

function loadClassSet() {
  try {
    const raw = fs.readFileSync(CLASS_DATA_PATH, 'utf-8');
    const json = JSON.parse(raw);
    return new Set(Object.keys(json).map(v => String(v).toLowerCase()));
  } catch {
    return new Set();
  }
}

function makeTemplateKey(template) {
  const itemName = String(template?.itemName || '').trim().toLowerCase();
  const sourcePage = String(template?.sourcePage || '').trim().toLowerCase();
  const rowId = String(template?.rowId || '').trim().toLowerCase();
  return [itemName, sourcePage, rowId].join('|');
}

function inferTemplateSlotCategory(pageTitle, rowId, itemName) {
  const haystack = [pageTitle, rowId, itemName]
    .map(value => String(value || '').toLowerCase())
    .join(' ');

  if (/\bring\b/.test(haystack)) return 'ring';
  if (/amulet|necklace|torc|holy symbol|fetish/.test(haystack)) return 'necklace';
  if (/\bbelt\b/.test(haystack)) return 'belt';
  if (/\bboots?\b|\bgreaves\b/.test(haystack)) return 'boots';
  if (/bracer|bracelet|gauntlet|gloves?|knuckles?|wraps?/.test(haystack)) return 'gloves';
  if (/\bcloak\b|mantle|cape/.test(haystack)) return 'cloak';
  if (/helmet|helm|crown|circlet|diadem|hood/.test(haystack)) return 'head';
  if (/shield|buckler/.test(haystack)) return 'shield';

  if (/armor|armour|plate|mail|chain|leather|hide|robe|vestment|tunic|clothing/.test(haystack)) {
    return 'chest';
  }

  if (/sword|axe|hammer|mace|staff|spear|bow|crossbow|dagger|weapon|blade|scythe|flail|whip|kama|katana|estoc|rapier|club|maul|trident|pike|halberd|naginata|yari|wakizashi|pick|sling|shuriken/.test(haystack)) {
    return 'weapon';
  }

  return 'any';
}

function parseSectionWeaponMetaByTableIndex(pageText, pageTitle = '') {
  const lines = String(pageText || '').split(/\r?\n/);
  const map = new Map();
  let tableIndex = -1;
  let currentHeading = '';
  let currentMeta = null;

  const toDamageType = (value) => {
    const text = String(value || '').trim().toLowerCase();
    if (!text) return '';
    if (/slashing\s+and\s+piercing/.test(text)) return 'slashing-piercing';
    if (/bludgeoning\s+and\s+piercing/.test(text)) return 'bludgeoning-piercing';
    if (/slashing\s+and\s+bludgeoning/.test(text)) return 'slashing-bludgeoning';
    if (text.includes('slashing')) return 'slashing';
    if (text.includes('piercing')) return 'piercing';
    if (text.includes('bludgeoning')) return 'bludgeoning';
    return text;
  };

  const isRangedSection = /ranged\s+weapons/i.test(String(pageTitle || ''));

  for (const rawLine of lines) {
    const trimmed = String(rawLine || '').trim();
    if (!trimmed) continue;

    const headingMatch = trimmed.match(/^={2,}\s*(.*?)\s*={2,}$/);
    if (headingMatch) {
      currentHeading = cleanInline(headingMatch[1]);
      currentMeta = {
        baseWeaponName: currentHeading,
        baseDamage: '',
        critRange: '',
        damageType: '',
        proficiency: '',
        focusGroup: '',
        ranged: isRangedSection
      };
      continue;
    }

    if (trimmed.startsWith('{|')) {
      tableIndex += 1;
      map.set(tableIndex, currentMeta ? { ...currentMeta } : null);
      continue;
    }

    if (!currentMeta) continue;

    const clean = cleanInline(trimmed);

    let match = clean.match(/^Base Damage\s*:\s*(.+)$/i);
    if (match) {
      currentMeta.baseDamage = String(match[1] || '').trim();
      continue;
    }

    match = clean.match(/^Base Critical Threat\s*:\s*(.+)$/i);
    if (match) {
      currentMeta.critRange = String(match[1] || '').trim();
      continue;
    }

    match = clean.match(/^Base Damage Type\s*:\s*(.+)$/i);
    if (match) {
      currentMeta.damageType = toDamageType(match[1]);
      continue;
    }

    match = clean.match(/^Weapon Proficiency\s*:\s*(.+)$/i);
    if (match) {
      currentMeta.proficiency = String(match[1] || '').trim();
      continue;
    }

    match = clean.match(/^Weapon Focus Group\s*:\s*(.+)$/i);
    if (match) {
      const rawFocus = String(match[1] || '').trim();
      const tokens = rawFocus
        .split(',')
        .map(value => String(value || '').trim())
        .filter(Boolean);

      const normalized = [];
      const seen = new Set();
      const addGroup = (label) => {
        const text = String(label || '').trim();
        if (!text) return;
        const key = text.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        normalized.push(text);
      };

      tokens.forEach(token => {
        if (/miss/i.test(token)) {
          addGroup('Missle');
          currentMeta.ranged = true;
          return;
        }
        if (/thrown/i.test(token)) {
          addGroup('Thrown');
          currentMeta.ranged = true;
          return;
        }
        if (/concussion/i.test(token)) {
          addGroup('Concussion');
          return;
        }
        if (/polearm/i.test(token)) {
          addGroup('Polearm');
          return;
        }
        if (/unarmed/i.test(token)) {
          addGroup('Unarmed');
          return;
        }
        if (/2\s*\-?\s*handed/i.test(token)) {
          addGroup('Two-Handed');
          return;
        }
        if (/1\s*\-?\s*h\s*edged|1\s*\-?\s*handed\s*edged/i.test(token)) {
          addGroup('One-Handed Edge');
          return;
        }
        addGroup(token);
      });

      currentMeta.focusGroup = normalized.join(', ');
    }
  }

  return map;
}

function inferBaseWeaponNameFromItemName(itemName) {
  const original = cleanInline(itemName || '');
  if (!original) return '';

  const withoutParen = original.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
  const stripped = withoutParen
    .replace(/\b(Grand\s+Masterly|Masterly|Grand|Powerful|Enhanced|Elite|Sturdy|Hardened|Enchanted)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return stripped || withoutParen || original;
}

function applySectionWeaponMetaToTemplate(template, sectionMeta) {
  if (!template || template.slotCategory !== 'weapon' || !template.meta) return;

  const inferredBase = inferBaseWeaponNameFromItemName(template.itemName);
  const sectionBase = sectionMeta && sectionMeta.baseWeaponName ? String(sectionMeta.baseWeaponName).trim() : '';
  const baseWeaponName = inferredBase || sectionBase;

  if (baseWeaponName) {
    template.meta.baseWeaponChart = baseWeaponName;
    template.meta.baseWeaponType = baseWeaponName;
  }

  if (sectionMeta && typeof sectionMeta === 'object') {
    if (sectionMeta.baseDamage) template.meta.baseDamage = sectionMeta.baseDamage;
    if (sectionMeta.critRange) template.meta.critRange = sectionMeta.critRange;
    if (sectionMeta.damageType) template.meta.damageType = sectionMeta.damageType;
    if (sectionMeta.proficiency) template.meta.proficiency = sectionMeta.proficiency;
    if (sectionMeta.focusGroup) template.meta.focusGroup = sectionMeta.focusGroup;
    if (sectionMeta.ranged) template.meta.ranged = true;
  }
}

function extractPages(xml, sourcePath = '') {
  const pages = [];
  const pageRegex = /<page>([\s\S]*?)<\/page>/g;
  let match;

  while ((match = pageRegex.exec(xml)) !== null) {
    const pageXml = match[1];
    const titleMatch = pageXml.match(/<title>([\s\S]*?)<\/title>/);
    const textMatch = pageXml.match(/<text[^>]*>([\s\S]*?)<\/text>/);
    if (!titleMatch || !textMatch) continue;

    pages.push({
      title: decodeEntities(titleMatch[1]).trim(),
      text: decodeEntities(textMatch[1]),
      sourcePath
    });
  }

  return pages;
}

function parseTableRows(pageText) {
  const rows = [];
  const lines = pageText.split(/\r?\n/);
  let inTable = false;
  let currentRow = null;
  let tableIndex = -1;

  const flushRow = () => {
    if (currentRow && currentRow.cells.length > 0) {
      currentRow.cells = currentRow.cells.map(cell => String(cell || '').trim());
      rows.push(currentRow);
    }
    currentRow = null;
  };

  for (const rawLine of lines) {
    const line = rawLine || '';
    const trimmed = line.trim();

    if (trimmed.startsWith('{|')) {
      inTable = true;
      tableIndex += 1;
      flushRow();
      continue;
    }

    if (!inTable) continue;

    if (trimmed.startsWith('|}')) {
      flushRow();
      inTable = false;
      continue;
    }

    if (trimmed.startsWith('|-')) {
      flushRow();
      const idMatch = trimmed.match(/\bid\s*=\s*([^\s|]+)/i);
      currentRow = {
        id: idMatch ? idMatch[1].trim() : '',
        tableIndex,
        cells: []
      };
      continue;
    }

    if (!currentRow) continue;

    if (trimmed.startsWith('!')) {
      continue;
    }

    if (trimmed.startsWith('|')) {
      currentRow.cells.push(trimmed.slice(1).trim());
      continue;
    }

    if (currentRow.cells.length > 0) {
      const lastIndex = currentRow.cells.length - 1;
      currentRow.cells[lastIndex] = `${currentRow.cells[lastIndex]}\n${trimmed}`.trim();
    }
  }

  flushRow();
  return rows;
}

function splitPropertyLines(cellText) {
  const normalized = String(cellText || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/\|\s*$/g, '')
    .trim();

  if (!normalized) return [];
  return normalized.split(/\n+/g).map(v => v.trim()).filter(Boolean);
}

function normalizePropertyLine(line) {
  let text = cleanInline(line);
  text = text.replace(/^[-*]+\s*/, '');
  text = text.replace(/^'+|'+$/g, '');
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

function shouldIgnoreLine(line) {
  if (!line) return true;
  if (/^\(none\)$/i.test(line)) return true;
  if (/^Runic$/i.test(line)) return true;
  if (/\bRunic\b/i.test(line)) return true;
  if (/^Tier\s*\d+\s+Rune\b/i.test(line)) return true;
  if (/^Rune\s*\(/i.test(line)) return true;
  if (/^Rune\s*:/i.test(line)) return true;
  if (/^Rune\s*T\d+/i.test(line)) return true;
  if (/^Tier\s*\d+\s+.*Rune$/i.test(line)) return true;
  if (/^Weight\s*:/i.test(line)) return true;
  if (/^Weight Reduction\s*:/i.test(line)) return false;
  if (/^Cannot be Repaired$/i.test(line)) return true;
  if (/^Special\s*:/i.test(line)) return true;
  if (/^Note\s*:/i.test(line)) return true;
  if (/^The physical bonus damage on this weapon stacks/i.test(line)) return true;
  if (/^\d+\s+[A-Za-z]/.test(line)) {
    const maybeSkill = normalizeSkillName(line.replace(/^[+-]?\d+\s+/, ''));
    if (!maybeSkill) return true;
  }
  if (/^Carpentry$/i.test(line)) return true;
  return false;
}

function parsePropertyLine(line, template, classSet) {
  const props = template.properties;
  const special = template.meta.special;

  let match = line.match(/^Attack Bonus\s*(?:vs\.?\s*:?\s*([^:]+))?\s*:?\s*([+-]?\d+)/i);
  if (match) {
    const target = match[1] ? cleanInline(match[1]) : '';
    const value = Math.abs(parseInt(match[2], 10) || 0);
    if (target) {
      props.push({
        type: 'Attack Bonus vs Alignment/Race/Alignment',
        innate: true,
        params: { target, value }
      });
    } else {
      props.push({
        type: 'Attack Bonus',
        innate: false,
        params: { value: Math.max(1, value) }
      });
    }
    return true;
  }

  match = line.match(/^([+-]?\d+)\s+Attack\s+Bonus$/i);
  if (match) {
    props.push({
      type: 'Attack Bonus',
      innate: false,
      params: { value: Math.max(1, Math.abs(parseInt(match[1], 10) || 1)) }
    });
    return true;
  }

  match = line.match(/^([+-]?\d+)\s+AB$/i);
  if (match) {
    props.push({
      type: 'Attack Bonus',
      innate: false,
      params: { value: Math.max(1, Math.abs(parseInt(match[1], 10) || 1)) }
    });
    return true;
  }

  match = line.match(/^(Enhancement Bonus|Enhancement)\s*:?\s*(.+)$/i);
  if (match) {
    const rest = cleanInline(match[2]);
    const sure = rest.match(/(?:Sure\s*Strike|Sure\s*Striking)\s*([+-]?\d+)/i);
    if (sure) {
      props.push({
        type: 'Enhancement vs Alignment/Race',
        innate: true,
        params: { target: 'sure strike', value: Math.abs(parseInt(sure[1], 10) || 1) }
      });
      return true;
    }

    const justValue = rest.match(/^([+-]?\d+)$/);
    if (justValue) {
      props.push({
        type: 'Enhancement',
        innate: false,
        params: { value: Math.abs(parseInt(justValue[1], 10) || 1) }
      });
      return true;
    }

    const statValue = rest.match(/^(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\s*([+-]?\d+)$/i);
    if (statValue) {
      const stat = normalizeStat(statValue[1]);
      if (stat) {
        props.push({
          type: 'Ability',
          innate: false,
          params: { stat, value: Math.abs(parseInt(statValue[2], 10) || 1) }
        });
        return true;
      }

    }

    const prefixedStatValue = rest.match(/^([+-]?\d+)\s*(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)$/i);
    if (prefixedStatValue) {
      const stat = normalizeStat(prefixedStatValue[2]);
      if (stat) {
        props.push({
          type: 'Ability',
          innate: false,
          params: { stat, value: Math.abs(parseInt(prefixedStatValue[1], 10) || 1) }
        });
        return true;
      }
    }
  }

  match = line.match(/^Enchantment Bonus\s*:?\s*(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\s*([+-]?\d+)$/i);
  if (match) {
    const stat = normalizeStat(match[1]);
    if (stat) {
      props.push({ type: 'Ability', innate: false, params: { stat, value: Math.abs(parseInt(match[2], 10) || 1) } });
      return true;
    }
  }

  match = line.match(/^Enchantment Bonus\s*:?\s*([+-]?\d+)\s*(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)$/i);
  if (match) {
    const stat = normalizeStat(match[2]);
    if (stat) {
      props.push({ type: 'Ability', innate: false, params: { stat, value: Math.abs(parseInt(match[1], 10) || 1) } });
      return true;
    }
  }

  match = line.match(/^Enchantment Bonus\s*:?\s*([+-]?\d+)/i);
  if (match) {
    props.push({ type: 'Enhancement', innate: false, params: { value: Math.abs(parseInt(match[1], 10) || 1) } });
    return true;
  }

  match = line.match(/^(?:\+)?\s*(\d+)\s+Sure\s*Strik(?:e|ing)\b/i);
  if (match) {
    props.push({
      type: 'Enhancement vs Alignment/Race',
      innate: true,
      params: { target: 'sure strike', value: Math.abs(parseInt(match[1], 10) || 1) }
    });
    return true;
  }

  match = line.match(/^Sure\s*Strik(?:e|ing)\s*([+-]?\d+)/i);
  if (match) {
    props.push({
      type: 'Enhancement vs Alignment/Race',
      innate: true,
      params: { target: 'sure strike', value: Math.abs(parseInt(match[1], 10) || 1) }
    });
    return true;
  }

  match = line.match(/^Bonus Feat\s*:\s*(.+)$/i);
  if (match) {
    props.push({ type: 'Granted Feat', innate: true, params: { featName: cleanInline(match[1]) } });
    return true;
  }

  match = line.match(/^Sneak Attack\s*:?\s*([+-]?\d+d\d+|[+-]?\d+)/i);
  if (match) {
    const label = String(match[1]).replace(/^\+/, '');
    props.push({ type: 'Granted Feat', innate: true, params: { featName: `Sneak Attack (+${label})` } });
    return true;
  }

  match = line.match(/^Massive Criticals?\s*:?\s*([+-]?\d+d\d+|[+-]?\d+)/i);
  if (match) {
    const notation = String(match[1]).replace(/^\+/, '');
    const avg = amountToAverage(notation);
    props.push({
      type: 'Massive Criticals',
      innate: false,
      params: {
        mode: 'flat4',
        avgDamage: avg,
        diceLabel: notation
      }
    });
    return true;
  }

  match = line.match(/^Damage Bonus\s*(?:vs\.?\s*:?\s*([^:]+))?\s*:?\s*(.+)$/i);
  if (match) {
    const target = match[1] ? cleanInline(match[1]) : '';
    const payload = cleanInline(match[2]);
    const parsed = parseDamagePayload(payload);
    if (parsed) {
      const type = target ? 'Damage vs Alignment/Race/Alignment' : 'Damage';
      const params = {
        damageType: parsed.damageType,
        mode: 'flat2',
        avgDamage: parsed.avgDamage,
        diceLabel: parsed.label
      };
      if (target) params.target = target;
      props.push({ type, innate: Boolean(target), params });
      return true;
    }
  }

  match = line.match(/^Damage\s*(?:Bonus\s*)?vs\.?\s*:?\s*([^:]+)\s*:\s*(.+)$/i);
  if (match) {
    const target = cleanInline(match[1]);
    const parsed = parseDamagePayload(cleanInline(match[2]));
    if (parsed) {
      props.push({
        type: 'Damage vs Alignment/Race/Alignment',
        innate: true,
        params: {
          target,
          damageType: parsed.damageType,
          mode: 'flat2',
          avgDamage: parsed.avgDamage,
          diceLabel: parsed.label
        }
      });
      return true;
    }
  }

  match = line.match(/^Damage\s*(?:Bonus\s*)?vs\.?\s*:?\s*([A-Za-z\- ]+)\s+(.+)$/i);
  if (match) {
    const target = cleanInline(match[1]);
    const parsed = parseDamagePayload(cleanInline(match[2]));
    if (parsed) {
      props.push({
        type: 'Damage vs Alignment/Race/Alignment',
        innate: true,
        params: {
          target,
          damageType: parsed.damageType,
          mode: 'flat2',
          avgDamage: parsed.avgDamage,
          diceLabel: parsed.label
        }
      });
      return true;
    }
  }

  match = line.match(/^([+-]?\d+)\s+([A-Za-z ]+)\s+Damage$/i);
  if (match) {
    const value = Math.abs(parseInt(match[1], 10) || 0);
    if (value > 0) {
      const diceLabel = String(value);
      props.push({
        type: 'Damage',
        innate: false,
        params: {
          damageType: normalizeDamageType(match[2]),
          mode: 'flat2',
          avgDamage: amountToAverage(diceLabel),
          diceLabel
        }
      });
      return true;
    }
  }

  match = line.match(/^([A-Za-z ]+)\s+Damage\s+([+-]?\d+)$/i);
  if (match) {
    const value = Math.abs(parseInt(match[2], 10) || 0);
    if (value > 0) {
      const diceLabel = String(value);
      props.push({
        type: 'Damage',
        innate: false,
        params: {
          damageType: normalizeDamageType(match[1]),
          mode: 'flat2',
          avgDamage: amountToAverage(diceLabel),
          diceLabel
        }
      });
      return true;
    }
  }

  match = line.match(/^Mighty\s*:?\s*([+-]?\d+)/i);
  if (match) {
    props.push({
      type: 'Mighty',
      innate: false,
      params: { value: Math.abs(parseInt(match[1], 10) || 1) }
    });
    return true;
  }

  if (/^Keen\b/i.test(line)) {
    props.push({ type: 'Keen', innate: false, params: { profile: '20' } });
    return true;
  }

  match = line.match(/^Light\b/i);
  if (match) {
    props.push({ type: 'Light', innate: false, params: {} });
    return true;
  }

  match = line.match(/^Weight Reduction\s*:\s*(\d+)%/i);
  if (match) {
    props.push({ type: 'Weight Reduction', innate: false, params: { reduction: Math.max(0, parseInt(match[1], 10) || 0) } });
    return true;
  }

  match = line.match(/^Weight Reduction\s*(\d+)%$/i);
  if (match) {
    props.push({ type: 'Weight Reduction', innate: false, params: { reduction: Math.max(0, parseInt(match[1], 10) || 0) } });
    return true;
  }

  match = line.match(/^Weigh\s+Reduction\s*:\s*(\d+)%/i);
  if (match) {
    props.push({ type: 'Weight Reduction', innate: false, params: { reduction: Math.max(0, parseInt(match[1], 10) || 0) } });
    return true;
  }

  match = line.match(/^Base Item Weight Reduction\s*:\s*(\d+)%/i);
  if (match) {
    props.push({ type: 'Weight Reduction', innate: false, params: { reduction: Math.max(0, parseInt(match[1], 10) || 0) } });
    template.meta.special.weightReductionText = cleanInline(line);
    return true;
  }

  match = line.match(/^Base Weight Reduction\s*:\s*(\d+)%/i);
  if (match) {
    props.push({ type: 'Weight Reduction', innate: false, params: { reduction: Math.max(0, parseInt(match[1], 10) || 0) } });
    template.meta.special.weightReductionText = cleanInline(line);
    return true;
  }

  match = line.match(/^Arcane Spell Failure set to\s*(.+)$/i);
  if (match) {
    special.arcaneSpellFailure = cleanInline(match[1]);
    return true;
  }

  match = line.match(/^Arcane\s+Spell\s+Failure\s*(\d+)%\s+increased$/i);
  if (match) {
    special.arcaneSpellFailure = `+${Math.max(0, parseInt(match[1], 10) || 0)}%`;
    return true;
  }

  match = line.match(/^Arcane\s+Spell\s+Failure\s*\[\s*([+-]?\d+)%\s*\]$/i);
  if (match) {
    const n = parseInt(match[1], 10) || 0;
    special.arcaneSpellFailure = `${n >= 0 ? '+' : ''}${n}%`;
    return true;
  }

  match = line.match(/^Arcane\s+Spell\s+Failure\s*([+-]?\d+)%$/i);
  if (match) {
    const n = parseInt(match[1], 10) || 0;
    special.arcaneSpellFailure = `${n >= 0 ? '+' : ''}${n}%`;
    return true;
  }

  match = line.match(/^Arcane Spell Failure\s*:\s*(.+)$/i);
  if (match) {
    special.arcaneSpellFailure = cleanInline(match[1]);
    return true;
  }

  match = line.match(/^Only\s+(.+?)\s+can be forged with Greensteel$/i);
  if (match) {
    const allowed = normalizeRestrictionList(match[1]).split(',').map(v => v.trim()).filter(Boolean);
    special.allowedBaseTypes = Array.from(new Set([...(special.allowedBaseTypes || []), ...allowed]));
    return true;
  }

  match = line.match(/^:?Armor Bonus\s*:\s*\+?(\d+)\s*\(AC\s*(Armor|Shield)\s*Modifier\)\s*for\s*(.+)$/i);
  if (match) {
    const bonus = Math.max(0, parseInt(match[1], 10) || 0);
    const acType = String(match[2] || '').toLowerCase();
    const subtype = cleanInline(match[3]);
    const key = `${acType}:${subtype}`;
    special.armorBonusBySubtype[key] = bonus;
    return true;
  }

  match = line.match(/^Armor Bonus\s*:?\s*\+?(\d+)\s*\(AC\s*(Armor|Shield|Natural|Deflection|Dodge)\s*Modifier\)/i);
  if (match) {
    props.push({
      type: 'Armor',
      innate: true,
      params: {
        value: Math.max(1, parseInt(match[1], 10) || 1),
        armorType: String(match[2] || '').toLowerCase()
      }
    });
    return true;
  }

  match = line.match(/^Armor Bonus\s*:\s*AC\s*(Armor|Shield|Natural|Deflection|Dodge)\s*Modi(?:fier|fer)\s*\+?(\d+)(?:\s*\(AC\s*(?:Armor|Shield|Natural|Deflection|Dodge)\s*Modi(?:fier|fer)\))?$/i);
  if (match) {
    props.push({
      type: 'Armor',
      innate: true,
      params: {
        value: Math.max(1, parseInt(match[2], 10) || 1),
        armorType: String(match[1] || '').toLowerCase()
      }
    });
    return true;
  }

  match = line.match(/^Armor Bonus\s*:\s*([+-]?\d+)/i);
  if (match) {
    props.push({ type: 'Armor', innate: true, params: { value: Math.abs(parseInt(match[1], 10) || 1), armorType: 'armor' } });
    return true;
  }

  match = line.match(/^AC Bonus\s*\+?\s*([+-]?\d+)/i);
  if (match) {
    props.push({ type: 'Armor', innate: true, params: { value: Math.abs(parseInt(match[1], 10) || 1), armorType: 'armor' } });
    return true;
  }

  match = line.match(/^AC Bonus\s*:\s*\+?\s*([+-]?\d+)/i);
  if (match) {
    props.push({ type: 'Armor', innate: true, params: { value: Math.abs(parseInt(match[1], 10) || 1), armorType: 'armor' } });
    return true;
  }

  match = line.match(/^Decreased\s+AC\s*:\s*AC\s+(Armor|Shield|Natural|Deflection|Dodge)\s*([+-]?\d+)/i);
  if (match) {
    const acType = String(match[1] || '').toLowerCase();
    const value = -Math.abs(parseInt(match[2], 10) || 1);
    props.push({
      type: 'Armor',
      innate: true,
      params: { value, armorType: acType }
    });
    return true;
  }

  match = line.match(/^Damage Immunity\s*:\s*(\d+)%/i);
  if (match) {
    props.push({ type: 'Damage Immunity', innate: true, params: { damageType: 'Acid', percent: Math.abs(parseInt(match[1], 10) || 0) } });
    return true;
  }

  match = line.match(/^Improved Saving Throws?\s*:\s*Universal\s*([+-]?\d+)/i);
  if (match) {
    props.push({ type: 'Specific Saving Throws', innate: true, params: { saveKind: 'universal', value: Math.abs(parseInt(match[1], 10) || 1) } });
    return true;
  }

  match = line.match(/^Vampiric\s*Regen(?:eration)?\s*:?\s*([+-]?\d+)/i);
  if (match) {
    props.push({ type: 'Vampiric Regeneration', innate: true, params: { value: Math.abs(parseInt(match[1], 10) || 1) } });
    return true;
  }

  match = line.match(/^([+-]?\d+)\s+Vampiric\s*Regen(?:eration)?$/i);
  if (match) {
    props.push({ type: 'Vampiric Regeneration', innate: true, params: { value: Math.abs(parseInt(match[1], 10) || 1) } });
    return true;
  }

  match = line.match(/^Regeneration\s*:?\s*([+-]?\d+)/i);
  if (match) {
    props.push({ type: 'Regeneration', innate: true, params: { value: Math.abs(parseInt(match[1], 10) || 1) } });
    return true;
  }

  match = line.match(/^Skill\s*(Bonus|Penalty)\s*:\s*(.+)$/i);
  if (match) {
    const mode = String(match[1] || '').toLowerCase();
    const payload = cleanInline(match[2]);
    const parsed = parseSkillPayload(payload);
    if (parsed) {
      const value = mode === 'penalty' ? -Math.abs(parsed.value) : parsed.value;
      props.push({
        type: 'Skill',
        innate: false,
        params: { skill: parsed.skill, value }
      });
      return true;
    }
  }

  match = line.match(/^Bonus\s+Skill\s*:\s*(.+)$/i);
  if (match) {
    const payload = cleanInline(match[1]);
    const parsed = parseSkillPayload(payload);
    if (parsed) {
      props.push({
        type: 'Skill',
        innate: false,
        params: { skill: parsed.skill, value: parsed.value }
      });
      return true;
    }
  }

  match = line.match(/^(?:Decreased|Reduced)\s+Skill\s+Modi(?:fier|fer)\s*:\s*([A-Za-z ']+?)\s*([+-]?\d+)$/i);
  if (match) {
    const skill = normalizeSkillName(match[1]);
    const value = parseInt(match[2], 10) || 0;
    if (skill && value !== 0) {
      props.push({
        type: 'Skill',
        innate: false,
        params: { skill, value: -Math.abs(value) }
      });
      return true;
    }
  }

  match = line.match(/^(?:Decreased|Reduced)\s+Skill\s+Modi(?:fier|fer)\s*:\s*(.+)$/i);
  if (match) {
    const payload = cleanInline(match[1]);
    const parsed = parseSkillPayload(payload);
    if (parsed) {
      props.push({
        type: 'Skill',
        innate: false,
        params: { skill: parsed.skill, value: -Math.abs(parsed.value) }
      });
      return true;
    }
  }

  match = line.match(/^Saving Throw Bonus\s*:\s*([+-]?\d+)\s*vs\s*(.+)$/i);
  if (match) {
    const value = Math.abs(parseInt(match[1], 10) || 1);
    const kind = normalizeSpecificSaveKind(match[2]);
    props.push({
      type: 'Specific Saving Throws',
      innate: false,
      params: { saveKind: kind, value }
    });
    return true;
  }

  match = line.match(/^Increased\s+Saving\s+Throw\s*:\s*(Fortitude|Reflex|Will)\s*([+-]?\d+)$/i);
  if (match) {
    const marker = String(match[1] || '').toLowerCase();
    const save = marker.startsWith('fort') ? 'fort' : marker.startsWith('ref') ? 'ref' : 'will';
    const value = Math.abs(parseInt(match[2], 10) || 1);
    props.push({ type: 'General Saving Throws', innate: false, params: { save, value } });
    return true;
  }

  match = line.match(/^([+-]?\d+)\s+(Fortitude|Reflex|Will)\s+Saves?\s+vs\s+(.+)$/i);
  if (match) {
    const value = Math.abs(parseInt(match[1], 10) || 1);
    props.push({
      type: 'Specific Saving Throws',
      innate: false,
      params: { saveKind: normalizeSpecificSaveKind(match[3]), value }
    });
    return true;
  }

  match = line.match(/^Saving Throw Bonus\s*:\s*Specific\s*:\s*(Fortitude|Reflex|Will)\s*([+-]?\d+)$/i);
  if (match) {
    const marker = String(match[1] || '').toLowerCase();
    const save = marker.startsWith('fort') ? 'fort' : marker.startsWith('ref') ? 'ref' : 'will';
    const value = Math.abs(parseInt(match[2], 10) || 1);
    props.push({ type: 'General Saving Throws', innate: false, params: { save, value } });
    return true;
  }

  match = line.match(/^Saving Throw Bonus\s*:\s*([A-Za-z\- ]+)\s*([+-]?\d+)$/i);
  if (match) {
    const marker = String(match[1] || '').trim().toLowerCase();
    const value = Math.abs(parseInt(match[2], 10) || 1);

    if (marker.includes('will') || marker.includes('fort') || marker.includes('reflex')) {
      const save = marker.includes('fort') ? 'fort' : marker.includes('ref') ? 'ref' : 'will';
      props.push({ type: 'General Saving Throws', innate: false, params: { save, value } });
    } else {
      props.push({ type: 'Specific Saving Throws', innate: false, params: { saveKind: normalizeSpecificSaveKind(marker), value } });
    }
    return true;
  }

  match = line.match(/^(?:Reduced|Decreased)\s+Saving\s+Throws?\s*:\s*(.+)$/i);
  if (match) {
    const payload = cleanInline(match[1]);
    const parsed = payload.match(/^(.+?)\s*([+-]?\d+)$/);
    if (parsed) {
      const marker = String(parsed[1] || '').trim().toLowerCase();
      const value = -Math.abs(parseInt(parsed[2], 10) || 1);

      if (marker.includes('will') || marker.includes('fort') || marker.includes('reflex')) {
        const save = marker.includes('fort') ? 'fort' : marker.includes('ref') ? 'ref' : 'will';
        props.push({ type: 'General Saving Throws', innate: false, params: { save, value } });
      } else {
        props.push({ type: 'Specific Saving Throws', innate: false, params: { saveKind: normalizeSpecificSaveKind(marker), value } });
      }
      return true;
    }
  }

  match = line.match(/^Only\s+Us(?:e|a)ble\s+By\s*:?\s*(.+)$/i);
  if (match) {
    applyClassOrRaceRestriction(template, match[1], classSet);
    return true;
  }

  match = line.match(/^Only\s+Useable\s+by\s*:?\s*(.+)$/i);
  if (match) {
    applyClassOrRaceRestriction(template, match[1], classSet);
    return true;
  }

  match = line.match(/^Usable\s+by\s+(.+)$/i);
  if (match) {
    applyClassOrRaceRestriction(template, String(match[1] || '').replace(/\band\b/gi, ','), classSet);
    return true;
  }

  match = line.match(/^Class Requirement\s*:\s*(.+)$/i);
  if (match) {
    addClassRequirement(template, match[1]);
    return true;
  }

  match = line.match(/^Race (?:Requirement|Restriction)\s*:\s*(.+)$/i);
  if (match) {
    addRaceRequirement(template, match[1]);
    return true;
  }

  match = line.match(/^Alignment (?:Requirement|Restriction)\s*:\s*(.+)$/i);
  if (match) {
    addAlignmentRequirement(template, match[1]);
    return true;
  }

  match = line.match(/^Requirement\s*:\s*(.+)$/i);
  if (match) {
    applyClassOrRaceRestriction(template, match[1], classSet);
    return true;
  }

  match = line.match(/^Level\s+Requirement\s*:\s*(\d+)/i);
  if (match) {
    const req = template.requirements || (template.requirements = createDefaultRequirements());
    req.level = Math.max(parseInt(req.level, 10) || 0, parseInt(match[1], 10) || 0);
    return true;
  }

  match = line.match(/^Level\s+Requirement\s*\(\s*(\d+)\s*\)$/i);
  if (match) {
    const req = template.requirements || (template.requirements = createDefaultRequirements());
    req.level = Math.max(parseInt(req.level, 10) || 0, parseInt(match[1], 10) || 0);
    return true;
  }

  match = line.match(/^ILR\s*:\s*(\d+)$/i);
  if (match) {
    const req = template.requirements || (template.requirements = createDefaultRequirements());
    req.level = Math.max(parseInt(req.level, 10) || 0, parseInt(match[1], 10) || 0);
    return true;
  }

  match = line.match(/^Increase(?:d)?\s+UMD\s+Requirements?\s*[:(]?\s*(\d+)/i);
  if (match) {
    const delta = Math.max(0, parseInt(match[1], 10) || 0);
    template.meta.umdBypass = Math.max(0, Number(template.meta.umdBypass) || 0) + delta;
    return true;
  }

  match = line.match(/^UMD\s+Requirements?\s*[:(]?\s*(\d+)/i);
  if (match) {
    template.meta.umdBypass = Math.max(template.meta.umdBypass || 0, parseInt(match[1], 10) || 0);
    return true;
  }

  match = line.match(/^Use\s+Magic\s+Device\s*-\s*\+?(\d+)$/i);
  if (match) {
    template.meta.umdBypass = Math.max(template.meta.umdBypass || 0, parseInt(match[1], 10) || 0);
    return true;
  }

  if (/^The racial restriction cannot be bypassed with UMD$/i.test(line)) {
    template.meta.umdBypass = Math.max(template.meta.umdBypass || 0, 900);
    const req = template.requirements || (template.requirements = createDefaultRequirements());
    pushUnique(req.other, 'racial restriction cannot be bypassed with UMD');
    return true;
  }

  match = line.match(/Lore Requirement\s*[:(]?\s*(\d+)/i);
  if (match) {
    template.meta.loreBypass = Math.max(template.meta.loreBypass || 0, parseInt(match[1], 10) || 0);
    return true;
  }

  match = line.match(/^Saving Throw Bonus\s*:\s*([+-]?\d+)\s*(Will|Fortitude|Reflex|Fear|Mind Affecting)?/i);
  if (match) {
    const value = Math.abs(parseInt(match[1], 10) || 1);
    const tag = String(match[2] || '').toLowerCase();
    if (tag === 'will' || tag === 'fortitude' || tag === 'reflex') {
      const save = tag.startsWith('fort') ? 'fort' : tag.startsWith('ref') ? 'ref' : 'will';
      props.push({ type: 'General Saving Throws', innate: false, params: { save, value } });
    } else {
      const saveKind = tag ? normalizeSpecificSaveKind(tag) : 'universal';
      props.push({ type: 'Specific Saving Throws', innate: false, params: { saveKind, value } });
    }
    return true;
  }

  match = line.match(/^Saving Throw\s*:\s*Universal\s*([+-]?\d+)/i);
  if (match) {
    const value = Math.abs(parseInt(match[1], 10) || 1);
    props.push({ type: 'Specific Saving Throws', innate: false, params: { saveKind: 'universal', value } });
    return true;
  }

  match = line.match(/^Improved Saving Throws?\s*:\s*\+?(\d+)\s*vs\s*(.+)$/i);
  if (match) {
    props.push({
      type: 'Specific Saving Throws',
      innate: true,
      params: { saveKind: normalizeSpecificSaveKind(match[2]), value: Math.max(1, parseInt(match[1], 10) || 1) }
    });
    return true;
  }

  match = line.match(/^Extra\s+Melee\s+Damage(?:\s+Type)?\s*:\s*(.+)$/i);
  if (match) {
    template.meta.special.extraMeleeDamageTypes.push(cleanInline(match[1]));
    return true;
  }

  match = line.match(/^Extra\s+Damage\s+Type\s*:\s*(.+)$/i);
  if (match) {
    template.meta.special.extraDamageTypes.push(cleanInline(match[1]));
    return true;
  }

  match = line.match(/^Cast\s+Spell\s*:\s*(.+)$/i);
  if (match) {
    template.meta.special.castSpells.push(cleanInline(match[1]));
    return true;
  }

  match = line.match(/^(.+?)\s*\((\d+)\)\s*(\d+)\s*(?:uses?|charges?)\s*(?:per\s*\/?\s*day|\/?\s*(?:day|use))/i);
  if (match) {
    template.meta.special.castSpells.push(cleanInline(`${match[1]} (${match[2]}) ${match[3]} uses/day`));
    return true;
  }

  if (/\bAPR\b/i.test(line) && /\bfeats?\b/i.test(line)) {
    template.meta.special.aprConditions.push(cleanInline(line));
    return true;
  }

  match = line.match(/^Base\s+Strength\s+of\s*(\d+)\+?\s+Required$/i);
  if (match) {
    setRequiredStat(template, 'str', parseInt(match[1], 10) || 0);
    return true;
  }

  match = line.match(/^Base\s+Strength\s*(\d+)\+?\s+Requirement$/i);
  if (match) {
    setRequiredStat(template, 'str', parseInt(match[1], 10) || 0);
    return true;
  }

  match = line.match(/^(\d+)\+\s+Hard\s+(Strength|Dexterity)\s+Requirement$/i);
  if (match) {
    const amount = Math.max(0, parseInt(match[1], 10) || 0);
    const stat = String(match[2] || '').toLowerCase();
    if (stat.startsWith('str')) {
      setRequiredStat(template, 'str', amount);
    } else if (stat.startsWith('dex')) {
      setRequiredStat(template, 'dex', amount);
    }
    return true;
  }

  match = line.match(/^Base\s*\(Hard\)\s*(Strength|Dexterity)\s*(\d+)\+\s*Requirement$/i);
  if (match) {
    const stat = String(match[1] || '').toLowerCase();
    const amount = Math.max(0, parseInt(match[2], 10) || 0);
    if (stat.startsWith('str')) {
      setRequiredStat(template, 'str', amount);
    } else if (stat.startsWith('dex')) {
      setRequiredStat(template, 'dex', amount);
    }
    return true;
  }

  match = line.match(/^(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\s+Requirement\s*:?\s*(\d+)\+?$/i);
  if (match) {
    const stat = normalizeStat(match[1]);
    if (stat) {
      setRequiredStat(template, stat, parseInt(match[2], 10) || 0);
      return true;
    }
  }

  match = line.match(/^Weight\s+Increase\s*:\s*(.+)$/i);
  if (match) {
    template.meta.special.weightIncrease = cleanInline(match[1]);
    return true;
  }

  match = line.match(/^Bleeding Damage\s*:\s*([+-]?\d+d\d+|[+-]?\d+)/i);
  if (match) {
    const notation = String(match[1]).replace(/^\+/, '');
    props.push({
      type: 'Damage',
      innate: true,
      params: { damageType: 'Bleeding', mode: 'flat2', avgDamage: amountToAverage(notation), diceLabel: notation }
    });
    return true;
  }

  match = line.match(/^Carry\s+Weight\s*:\s*(.+)$/i);
  if (match) {
    template.meta.special.weightIncrease = cleanInline(match[1]);
    return true;
  }

  if (/^Only\s+Usable\s+While\s+Mounted$/i.test(line)) {
    special.notes.push('Only usable while mounted');
    return true;
  }

  match = line.match(/^Passive\s+Concealment\s*(\d+)%/i);
  if (match) {
    special.notes.push(cleanInline(`Passive Concealment ${match[1]}%`));
    return true;
  }

  match = line.match(/^Passive\s+Concealment\s*:\s*(\d+)%/i);
  if (match) {
    special.notes.push(cleanInline(`Passive Concealment ${match[1]}%`));
    return true;
  }

  if (/touch attack/i.test(line)) {
    template.meta.special.touchAttack = true;
    template.meta.special.notes.push(cleanInline(line));
    return true;
  }

  if (/Unlimited\s+Ammo/i.test(line)) {
    template.meta.special.ammoNotes.push(cleanInline(line));
    return true;
  }

  if (/^Darkvision$/i.test(line)) {
    props.push({ type: 'Granted Feat', innate: true, params: { featName: 'Darkvision' } });
    return true;
  }

  match = line.match(/^Ability Bonus\s*:\s*([+-]?\d+)\s+(Strength|Strenght|Dexterity|Constitution|Intelligence|Wisdom|Charisma)$/i);
  if (match) {
    const stat = normalizeStat(match[2]);
    if (stat) {
      props.push({ type: 'Ability', innate: false, params: { stat, value: Math.abs(parseInt(match[1], 10) || 1) } });
      return true;
    }
  }

  match = line.match(/^Ability Bonus\s*:\s*(Strength|Strenght|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\s*([+-]?\d+)$/i);
  if (match) {
    const stat = normalizeStat(match[1]);
    if (stat) {
      props.push({ type: 'Ability', innate: false, params: { stat, value: Math.abs(parseInt(match[2], 10) || 1) } });
      return true;
    }
  }

  match = line.match(/^Ability\s+Score\s+Penalty\s*:\s*(Strength|Strenght|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\s*([+-]?\d+)$/i);
  if (match) {
    const stat = normalizeStat(match[1]);
    if (stat) {
      const value = -Math.abs(parseInt(match[2], 10) || 1);
      props.push({ type: 'Ability', innate: false, params: { stat, value } });
      return true;
    }
  }

  match = line.match(/^Improved Saving Throws?\s*:\s*(.+)$/i);
  if (match) {
    const payload = cleanInline(match[1]);
    const specific = payload.match(/^(.+?)\s*([+-]?\d+)$/);
    if (specific) {
      const marker = String(specific[1] || '').trim().toLowerCase();
      const value = Math.abs(parseInt(specific[2], 10) || 1);
      if (marker.includes('reflex') || marker.includes('fort') || marker.includes('will')) {
        const save = marker.includes('fort') ? 'fort' : marker.includes('ref') ? 'ref' : 'will';
        props.push({ type: 'General Saving Throws', innate: false, params: { save, value } });
      } else {
        props.push({ type: 'Specific Saving Throws', innate: false, params: { saveKind: normalizeSpecificSaveKind(marker), value } });
      }
      return true;
    }
  }

  match = line.match(/^Additional Property\s*:\s*Use Magic Device\s*[-+\s]*(\d+)/i);
  if (match) {
    template.meta.umdBypass = Math.max(template.meta.umdBypass || 0, parseInt(match[1], 10) || 0);
    return true;
  }

  match = line.match(/^Additional Property\s*:\s*(.+)$/i);
  if (match) {
    special.notes.push(cleanInline(`Additional Property: ${match[1]}`));
    return true;
  }

  if (/^Mundane Item$/i.test(line)) {
    special.notes.push('Mundane Item');
    return true;
  }

  if (/^Mundane$/i.test(line)) {
    special.notes.push('Mundane');
    return true;
  }

  match = line.match(/^Use Limitation\s*\(Class\)\s*:\s*(.+)$/i);
  if (match) {
    addClassRequirement(template, match[1]);
    return true;
  }

  match = line.match(/^Use Limitation\s*\(Alignment\)\s*:\s*(.+)$/i);
  if (match) {
    addAlignmentRequirement(template, match[1]);
    return true;
  }

  match = line.match(/^Use Limitation\s*:\s*Alignment Group\s*:?\s*(.+)$/i);
  if (match) {
    addAlignmentRequirement(template, match[1]);
    return true;
  }

  match = line.match(/^Use Limitation\s*:\s*Class\s*:?\s*(.+)$/i);
  if (match) {
    addClassRequirement(template, match[1]);
    return true;
  }

  if (/^[A-Za-z]{1,12}(?:\s*,\s*[A-Za-z]{1,12})+$/.test(line)) {
    const compactAlignment = normalizeAlignmentCompositeList(line);
    if (compactAlignment) {
      addAlignmentRequirement(template, compactAlignment);
      return true;
    }
    const anyOfAlignment = normalizeAlignmentAnyOfList(line);
    if (anyOfAlignment) {
      const req = template.requirements || (template.requirements = createDefaultRequirements());
      req.alignment = anyOfAlignment;
      return true;
    }
  }

  match = line.match(/^([A-Za-z ]+)\s*([+-]\d+)$/);
  if (match) {
    const maybeSkill = normalizeSkillName(match[1]);
    if (maybeSkill) {
      props.push({
        type: 'Skill',
        innate: false,
        params: { skill: maybeSkill, value: parseInt(match[2], 10) || 0 }
      });
      return true;
    }
  }

  match = line.match(/^([A-Za-z\-']+)\s*([+-]\d+)$/);
  if (match) {
    const maybeSkill = normalizeSkillName(match[1]);
    if (maybeSkill) {
      props.push({
        type: 'Skill',
        innate: false,
        params: { skill: maybeSkill, value: parseInt(match[2], 10) || 0 }
      });
      return true;
    }
  }

  match = line.match(/^([A-Za-z ]+)\s*:\s*([+-]?\d+)$/);
  if (match) {
    const maybeSkill = normalizeSkillName(match[1]);
    const value = parseInt(match[2], 10) || 0;
    if (maybeSkill && value !== 0) {
      props.push({
        type: 'Skill',
        innate: false,
        params: { skill: maybeSkill, value }
      });
      return true;
    }
  }

  match = line.match(/^([+-]?\d+)\s+([A-Za-z ]+)$/);
  if (match) {
    const maybeSkill = normalizeSkillName(match[2]);
    const value = parseInt(match[1], 10) || 0;
    if (maybeSkill && value !== 0) {
      props.push({
        type: 'Skill',
        innate: false,
        params: { skill: maybeSkill, value }
      });
      return true;
    }
  }

  match = line.match(/^([A-Za-z]+)\s+Skill\s*:\s*([+-]?\d+)$/i);
  if (match) {
    const maybeSkill = normalizeSkillName(match[1]);
    if (maybeSkill) {
      props.push({ type: 'Skill', innate: false, params: { skill: maybeSkill, value: parseInt(match[2], 10) || 0 } });
      return true;
    }
  }

  match = line.match(/^Ranger Spell Slot\s*:\s*(\d+)/i);
  if (match) {
    props.push({
      type: 'Bonus Spell Slots',
      innate: false,
      params: { casterClass: 'Ranger', spellLevel: 1, slots: Math.max(1, parseInt(match[1], 10) || 1) }
    });
    return true;
  }

  match = line.match(/^Bonus Spell Slot\s*:\s*([A-Za-z ]+)\s+Level\s*(\d+)/i);
  if (match) {
    props.push({
      type: 'Bonus Spell Slots',
      innate: false,
      params: { casterClass: cleanInline(match[1]), spellLevel: Math.max(1, parseInt(match[2], 10) || 1), slots: 1 }
    });
    return true;
  }

  match = line.match(/^Bonus Spell Slot\s*:\s*([A-Za-z ]+?)\s+(\d+)$/i);
  if (match) {
    props.push({
      type: 'Bonus Spell Slots',
      innate: false,
      params: { casterClass: cleanInline(match[1]), spellLevel: Math.max(1, parseInt(match[2], 10) || 1), slots: 1 }
    });
    return true;
  }

  match = line.match(/^Bonus Spell Slot of Level\s*:\s*([A-Za-z ]+)\s+Level\s*(\d+)/i);
  if (match) {
    props.push({
      type: 'Bonus Spell Slots',
      innate: false,
      params: { casterClass: cleanInline(match[1]), spellLevel: Math.max(1, parseInt(match[2], 10) || 1), slots: 1 }
    });
    return true;
  }

  match = line.match(/^([A-Za-z '&]+)\s+Spell Slot\s*:\s*(.+)$/i);
  if (match) {
    const classes = normalizeRestrictionList(String(match[1] || '').replace(/&/g, ','))
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);
    const levelSpecs = parseSpellSlotSpecs(match[2]);
    if (classes.length > 0 && levelSpecs.length > 0) {
      classes.forEach(cls => {
        levelSpecs.forEach(spec => {
          props.push({
            type: 'Bonus Spell Slots',
            innate: false,
            params: { casterClass: cls, spellLevel: spec.level, slots: spec.slots }
          });
        });
      });
      return true;
    }
  }

  match = line.match(/^Spell Slot\s*:\s*(.+)$/i);
  if (match) {
    const entries = String(match[1] || '')
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);
    const parsed = [];
    entries.forEach(entry => {
      const chunk = entry.match(/^([A-Za-z ]+?)\s*(\d+)(?:\s*x\s*(\d+))?$/i);
      if (!chunk) return;
      parsed.push({
        casterClass: cleanInline(chunk[1]),
        spellLevel: Math.max(1, parseInt(chunk[2], 10) || 1),
        slots: Math.max(1, parseInt(chunk[3], 10) || 1)
      });
    });
    if (parsed.length > 0) {
      parsed.forEach(spec => {
        props.push({
          type: 'Bonus Spell Slots',
          innate: false,
          params: { casterClass: spec.casterClass, spellLevel: spec.spellLevel, slots: spec.slots }
        });
      });
      return true;
    }
  }

  match = line.match(/^([A-Za-z ,]+)\s+Spell Slot\s*:\s*(\d+)/i);
  if (match) {
    const classes = normalizeRestrictionList(match[1]).split(',').map(v => v.trim()).filter(Boolean);
    classes.forEach(cls => {
      props.push({
        type: 'Bonus Spell Slots',
        innate: false,
        params: { casterClass: cls, spellLevel: Math.max(1, parseInt(match[2], 10) || 1), slots: 1 }
      });
    });
    return true;
  }

  match = line.match(/^Druid Spell Slot\s*:\s*([\d, ]+)/i);
  if (match) {
    const levels = String(match[1]).split(',').map(v => parseInt(v.trim(), 10)).filter(v => Number.isFinite(v) && v > 0);
    levels.forEach(level => {
      props.push({ type: 'Bonus Spell Slots', innate: false, params: { casterClass: 'Druid', spellLevel: level, slots: 1 } });
    });
    return true;
  }

  if (/^No Damage$/i.test(line)) {
    return true;
  }

  match = line.match(/^Enhancement Bonus\s+vs\s+(.+?)\s*([+-]?\d+)$/i);
  if (match) {
    props.push({
      type: 'Enhancement vs Alignment/Race',
      innate: true,
      params: { target: cleanInline(match[1]), value: Math.abs(parseInt(match[2], 10) || 1) }
    });
    return true;
  }

  match = line.match(/^Enhancement Bonus\s+vs\.?\s*:?\s*(.+?)\s*([+-]?\d+)$/i);
  if (match) {
    props.push({
      type: 'Enhancement vs Alignment/Race',
      innate: true,
      params: { target: cleanInline(match[1]), value: Math.abs(parseInt(match[2], 10) || 1) }
    });
    return true;
  }

  match = line.match(/^AC Bonus\s+vs\.?\s*(?:Alignment|Racial)?\s*Group\s*:\s*(.+?)\s*([+-]?\d+)$/i);
  if (match) {
    props.push({
      type: 'Armor vs Damage type/Race/Alignment',
      innate: true,
      params: { target: cleanInline(match[1]), value: Math.abs(parseInt(match[2], 10) || 1), armorType: 'armor' }
    });
    return true;
  }

  match = line.match(/^AC Bonus\s+vs\.?\s*(.+?)\s*([+-]?\d+)$/i);
  if (match) {
    props.push({
      type: 'Armor vs Damage type/Race/Alignment',
      innate: true,
      params: { target: cleanInline(match[1]), value: Math.abs(parseInt(match[2], 10) || 1), armorType: 'armor' }
    });
    return true;
  }

  match = line.match(/^Attack Bonus\s+vs\.?\s*(?:Alignment|Racial)?\s*Group\s*:\s*(.+?)\s*([+-]?\d+)$/i);
  if (match) {
    props.push({
      type: 'Attack Bonus vs Alignment/Race/Alignment',
      innate: false,
      params: { target: cleanInline(match[1]), value: Math.abs(parseInt(match[2], 10) || 1) }
    });
    return true;
  }

  match = line.match(/^Mass\s*Criticals?\s*:?\s*([+-]?\d+d\d+|[+-]?\d+)/i);
  if (match) {
    const notation = String(match[1]).replace(/^\+/, '');
    props.push({
      type: 'Massive Criticals',
      innate: false,
      params: {
        mode: 'flat4',
        avgDamage: amountToAverage(notation),
        diceLabel: notation
      }
    });
    return true;
  }

  match = line.match(/^Spell Resistance\s*:\s*(\d+)/i);
  if (match) {
    props.push({ type: 'Spell Resistance', innate: false, params: { sr: Math.max(0, parseInt(match[1], 10) || 0) } });
    return true;
  }

  match = line.match(/^Damage Immunity\s*:\s*([A-Za-z ]+)\s*(\d+)%/i);
  if (match) {
    props.push({
      type: 'Damage Immunity',
      innate: true,
      params: { damageType: normalizeDamageType(match[1]), percent: Math.max(0, parseInt(match[2], 10) || 0) }
    });
    return true;
  }

  match = line.match(/^Damage\s+Immunity\s*:\s*([A-Za-z ]+)\s*:\s*(\d+)%$/i);
  if (match) {
    props.push({
      type: 'Damage Immunity',
      innate: true,
      params: { damageType: normalizeDamageType(match[1]), percent: Math.max(0, parseInt(match[2], 10) || 0) }
    });
    return true;
  }

  match = line.match(/^Damage Vulnerability\s*:\s*(\d+)%\s*([A-Za-z ]+)/i);
  if (match) {
    props.push({
      type: 'Damage Vulnerability',
      innate: true,
      params: {
        damageType: normalizeDamageType(match[2]),
        percent: Math.max(0, parseInt(match[1], 10) || 0)
      }
    });
    return true;
  }

  match = line.match(/^Immunity\s*:\s*Damage\s+Type\s*:\s*([A-Za-z ]+)\s*\(?\s*(\d+)%\s+Immunity\s+Bonus\s*\)?/i);
  if (match) {
    props.push({
      type: 'Damage Immunity',
      innate: true,
      params: {
        damageType: normalizeDamageType(match[1]),
        percent: Math.max(0, parseInt(match[2], 10) || 0)
      }
    });
    return true;
  }

  match = line.match(/^Immunity\s*:\s*([A-Za-z ]+)\s*(\d+)%\s*Immunity\s*Bonus$/i);
  if (match) {
    props.push({
      type: 'Damage Immunity',
      innate: true,
      params: {
        damageType: normalizeDamageType(match[1]),
        percent: Math.max(0, parseInt(match[2], 10) || 0)
      }
    });
    return true;
  }

  match = line.match(/^Immunity\s*:\s*Damage\s+Type\s*:?\s*([A-Za-z ]+)\s*(\d+)%$/i);
  if (match) {
    props.push({
      type: 'Damage Immunity',
      innate: true,
      params: {
        damageType: normalizeDamageType(match[1]),
        percent: Math.max(0, parseInt(match[2], 10) || 0)
      }
    });
    return true;
  }

  match = line.match(/^Damage Reduction\s*:\s*(\d+)\s*\/\s*\+?(\d+)/i);
  if (match) {
    props.push({
      type: 'Damage Reduction',
      innate: true,
      params: {
        soak: Math.max(0, parseInt(match[1], 10) || 0),
        pierce: Math.max(1, parseInt(match[2], 10) || 1)
      }
    });
    return true;
  }

  match = line.match(/^Damage\s+Resist\s*:\s*([A-Za-z ]+)\s*(\d+)\s*\/\s*(\+?\d+|-)$/i);
  if (match) {
    const bypassRaw = String(match[3] || '').trim();
    const pierce = bypassRaw === '-' ? 0 : Math.max(0, parseInt(bypassRaw.replace(/^\+/, ''), 10) || 0);
    props.push({
      type: 'Damage Resist',
      innate: true,
      params: {
        damageType: normalizeDamageType(match[1]),
        resist: Math.max(0, parseInt(match[2], 10) || 0),
        pierce
      }
    });
    return true;
  }

  match = line.match(/^Damage\s+Shield\s*:\s*([A-Za-z ]+)\s*(\d+)\s*Damage$/i);
  if (match) {
    props.push({
      type: 'Damage Resist',
      innate: true,
      params: {
        damageType: normalizeDamageType(match[1]),
        resist: Math.max(0, parseInt(match[2], 10) || 0),
        pierce: 0
      }
    });
    return true;
  }

  match = line.match(/^Armor Bonus\s*vs\.?\s*:?\s*(.+?)\s*\+?(\d+)\s*\(AC\s*(?:Deflection|Shield|Armor|Natural|Dodge)\s*Modifier\)?/i);
  if (match) {
    props.push({
      type: 'Armor vs Damage type/Race/Alignment',
      innate: true,
      params: { target: cleanInline(match[1]), value: Math.max(1, parseInt(match[2], 10) || 1) }
    });
    special.notes.push('Armor bonus vs target uses deflection AC modifier');
    return true;
  }

  match = line.match(/^AC\s+Bonus\s+vs\.?\s+Racial\s+Group\s*:\s*(.+?)\s*\+?(\d+)$/i);
  if (match) {
    props.push({
      type: 'Armor vs Damage type/Race/Alignment',
      innate: true,
      params: { target: cleanInline(match[1]), value: Math.max(1, parseInt(match[2], 10) || 1) }
    });
    return true;
  }

  match = line.match(/^Damage Resistance\s*:/i);
  if (match) {
    special.notes.push(cleanInline(line));
    return true;
  }

  match = line.match(/^Immunity\s+Damage\s+Type\s*:/i);
  if (match) {
    special.notes.push(cleanInline(line));
    return true;
  }

  match = line.match(/^On Hit\s*:/i);
  if (match) {
    special.notes.push(cleanInline(line));
    return true;
  }

  if (/^Cooldown\s+Reduction\s*:/i.test(line)) {
    special.notes.push(cleanInline(line));
    return true;
  }

  match = line.match(/^Material\s*:/i);
  if (match) {
    special.notes.push(cleanInline(line));
    return true;
  }

  match = line.match(/^DEV\s+Note\s*:\s*(.+)$/i);
  if (match) {
    special.notes.push(cleanInline(line));
    return true;
  }

  match = line.match(/^Only\s+craftable\s+by\s*:\s*(.+)$/i);
  if (match) {
    special.notes.push(cleanInline(line));
    return true;
  }

  match = line.match(/^Quality\s*:/i);
  if (match) {
    special.notes.push(cleanInline(line));
    return true;
  }

  match = line.match(/^Visual Effect\s*:/i);
  if (match) {
    special.notes.push(cleanInline(line));
    return true;
  }

  match = line.match(/^Spell\s*:\s*(.+)$/i);
  if (match) {
    special.castSpells.push(cleanInline(match[1]));
    return true;
  }

  match = line.match(/^Feat\s*:\s*(.+)$/i);
  if (match) {
    props.push({ type: 'Granted Feat', innate: true, params: { featName: cleanInline(match[1]) } });
    return true;
  }

  match = line.match(/^Use\s*:\s*(.+)$/i);
  if (match) {
    special.castSpells.push(cleanInline(match[1]));
    return true;
  }

  if (/\bTier\s*3\b.*\bRune\b/i.test(line) || /\bRune\b.*\bTier\s*3\b/i.test(line)) {
    special.notes.push(cleanInline(line));
    return true;
  }

  if (/^Skill Bonus\s*:\s*$/i.test(line)) {
    return true;
  }

  if (/^Restricted\s*:\s*$/i.test(line)) {
    special.notes.push('Restricted list follows');
    return true;
  }

  if (/^All\s+except\s+Craft\s+Mastery\s*[+-]?\d+$/i.test(line)) {
    return true;
  }

  if (isAlignmentValue(line)) {
    addAlignmentRequirement(template, line);
    return true;
  }

  if (looksLikeClassList(line, classSet)) {
    addClassRequirement(template, line);
    return true;
  }

  if (/Some of the physical bonus damage on this weapon stacks with Enhancement bonuses/i.test(line)) {
    special.notes.push(cleanInline(line));
    return true;
  }

  if (/does not stack with Enhancement bonuses/i.test(line)) {
    special.notes.push(cleanInline(line));
    return true;
  }

  match = line.match(/^Unique Power\s*:\s*\+?(\d+d\d+)\s*\(Random Elemental Damage\)$/i);
  if (match) {
    const notation = String(match[1]).replace(/^\+/, '');
    props.push({
      type: 'Damage',
      innate: true,
      params: { damageType: 'Random Elemental', mode: 'flat2', avgDamage: amountToAverage(notation), diceLabel: notation }
    });
    return true;
  }

  if (/feature or a bug/i.test(line)) {
    special.notes.push(cleanInline(line));
    return true;
  }

  if (/^Sequencer\s*:\s*No$/i.test(line)) {
    special.notes.push('Sequencer: No');
    return true;
  }

  if (/^Divine Shield is ineffective while wearing this armour\.?$/i.test(line)) {
    special.notes.push(cleanInline(line));
    return true;
  }

  if (/^Cannot use Divine Shield whilst wearing this Armour\.?$/i.test(line)) {
    special.notes.push(cleanInline(line));
    return true;
  }

  match = line.match(/^(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\s*:?\s*([+-]?\d+)$/i);
  if (match) {
    const stat = normalizeStat(match[1]);
    if (stat) {
      props.push({ type: 'Ability', innate: false, params: { stat, value: Math.abs(parseInt(match[2], 10) || 1) } });
      return true;
    }
  }

  return false;
}

function parseDamagePayload(payload) {
  const cleaned = cleanInline(payload)
    .replace(/\bDamage\b/gi, '')
    .trim();

  if (!cleaned) return null;

  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return null;

  const amountIndex = parts.findIndex(isAmount);
  if (amountIndex < 0) return null;

  const amount = parts[amountIndex];
  let type = parts.slice(0, amountIndex).join(' ').trim();
  if (!type) {
    type = parts.slice(amountIndex + 1).join(' ').trim();
  }
  type = type.replace(/\bDamage\b/gi, '').trim();
  if (!type) type = 'untyped';

  const avgDamage = amountToAverage(amount);
  if (!Number.isFinite(avgDamage) || avgDamage <= 0) return null;

  return {
    damageType: normalizeDamageType(type),
    avgDamage,
    label: amount.replace(/^\+/, '')
  };
}

function parseSkillPayload(payload) {
  const v1 = payload.match(/^([+-]?\d+)\s+(.+)$/);
  if (v1) {
    const value = Math.abs(parseInt(v1[1], 10) || 0);
    const skill = normalizeSkillName(v1[2]);
    if (!skill || !value) return null;
    return { skill, value };
  }

  const v2 = payload.match(/^(.+?)\s+([+-]?\d+)$/);
  if (v2) {
    const value = Math.abs(parseInt(v2[2], 10) || 0);
    const skill = normalizeSkillName(v2[1]);
    if (!skill || !value) return null;
    return { skill, value };
  }

  return null;
}

function parseSpellSlotSpecs(payload) {
  const entries = String(payload || '')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
  const out = [];

  entries.forEach(entry => {
    let match = entry.match(/^(\d+)\s*x\s*(\d+)$/i);
    if (match) {
      out.push({
        level: Math.max(1, parseInt(match[1], 10) || 1),
        slots: Math.max(1, parseInt(match[2], 10) || 1)
      });
      return;
    }

    match = entry.match(/^(\d+)$/);
    if (match) {
      out.push({
        level: Math.max(1, parseInt(match[1], 10) || 1),
        slots: 1
      });
    }
  });

  return out;
}

function applyClassOrRaceRestriction(template, rawValue, classSet) {
  const value = normalizeRestrictionList(rawValue);
  const tokens = splitRestrictionTokens(value);
  const classTokens = [];
  const raceTokens = [];
  const otherTokens = [];

  if (tokens.length === 0) {
    return;
  }

  for (const token of tokens) {
    const key = token.toLowerCase();
    if (isAlignmentValue(token)) {
      addAlignmentRequirement(template, token);
    } else if (classSet.has(key)) {
      classTokens.push(token);
    } else if (looksLikeRestrictionMetaToken(token)) {
      otherTokens.push(token);
    } else {
      raceTokens.push(token);
    }
  }

  if (classTokens.length > 0) {
    addClassRequirement(template, classTokens.join(', '));
  }
  if (raceTokens.length > 0) {
    addRaceRequirement(template, raceTokens.join(', '));
  }
  if (otherTokens.length > 0) {
    const req = template.requirements || (template.requirements = createDefaultRequirements());
    for (const token of otherTokens) {
      pushUnique(req.other, token);
    }
  }
}

function addClassRequirement(template, rawValue) {
  const normalized = normalizeRestrictionList(rawValue);
  if (!normalized) return;

  template.meta.classRestriction = mergeRestriction(template.meta.classRestriction, normalized);

  const req = template.requirements || (template.requirements = createDefaultRequirements());
  for (const token of splitRestrictionTokens(normalized)) {
    pushUnique(req.class, token);
  }
}

function addRaceRequirement(template, rawValue) {
  const normalized = normalizeRestrictionList(rawValue);
  if (!normalized) return;

  template.meta.raceRestriction = mergeRestriction(template.meta.raceRestriction, normalized);

  const req = template.requirements || (template.requirements = createDefaultRequirements());
  for (const token of splitRestrictionTokens(normalized)) {
    pushUnique(req.race, normalizeRaceToken(token));
  }
}

function addAlignmentRequirement(template, rawValue) {
  const normalized = normalizeAlignmentValue(rawValue);
  if (!normalized) return;

  const req = template.requirements || (template.requirements = createDefaultRequirements());
  req.alignment = normalized;
}

function setRequiredStat(template, statKey, amount) {
  const key = String(statKey || '').toLowerCase();
  if (!key || !['str', 'dex', 'con', 'int', 'wis', 'cha'].includes(key)) return;

  const value = Math.max(0, parseInt(amount, 10) || 0);
  if (!value) return;

  const req = template.requirements || (template.requirements = createDefaultRequirements());
  req.stats = req.stats && typeof req.stats === 'object' && !Array.isArray(req.stats) ? req.stats : {};
  req.stats[key] = Math.max(parseInt(req.stats[key], 10) || 0, value);
}

function verifyRequirementsSchema(template) {
  const req = template.requirements || createDefaultRequirements();
  req.level = Number.isFinite(req.level) ? req.level : null;
  req.bab = Number.isFinite(req.bab) ? req.bab : null;

  req.feats = normalizeArray(req.feats);
  req.class = normalizeArray(req.class);
  req.race = normalizeArray(req.race).map(normalizeRaceToken);
  req.other = normalizeArray(req.other);

  req.skills = req.skills && typeof req.skills === 'object' && !Array.isArray(req.skills) ? req.skills : {};
  req.stats = req.stats && typeof req.stats === 'object' && !Array.isArray(req.stats) ? req.stats : {};
  req.spells = req.spells && typeof req.spells === 'object' && !Array.isArray(req.spells) ? req.spells : {};

  if (req.alignment && typeof req.alignment === 'object' && !Array.isArray(req.alignment) && Array.isArray(req.alignment.anyOf)) {
    const normalizedAnyOf = req.alignment.anyOf
      .map(value => normalizeAlignmentValue(value))
      .filter(Boolean);
    req.alignment = normalizedAnyOf.length > 0 ? { anyOf: Array.from(new Set(normalizedAnyOf)) } : null;
  } else {
    req.alignment = normalizeAlignmentValue(req.alignment);
  }

  if (!req.alignment && template.meta && template.meta.raceRestriction) {
    for (const token of splitRestrictionTokens(template.meta.raceRestriction)) {
      const parsed = normalizeAlignmentValue(token);
      if (parsed) {
        req.alignment = parsed;
        break;
      }
    }
  }

  template.requirements = req;
}

function normalizeArray(value) {
  if (!Array.isArray(value)) return [];
  const out = [];
  for (const entry of value) {
    if (typeof entry !== 'string') continue;
    const cleaned = cleanInline(entry);
    if (!cleaned) continue;
    if (!out.includes(cleaned)) out.push(cleaned);
  }
  return out;
}

function pushUnique(target, value) {
  if (!Array.isArray(target)) return;
  const cleaned = cleanInline(value);
  if (!cleaned) return;
  if (!target.includes(cleaned)) target.push(cleaned);
}

function splitRestrictionTokens(value) {
  return String(value || '')
    .split(',')
    .map(v => cleanInline(v))
    .filter(Boolean);
}

function normalizeRaceToken(token) {
  return String(token || '')
    .toLowerCase()
    .replace(/\bhalf\s+/g, 'half-')
    .replace(/\s+/g, ' ')
    .trim();
}

function looksLikeRestrictionMetaToken(token) {
  const lower = String(token || '').toLowerCase().trim();
  return lower === 'any' || lower === 'all' || lower === 'none';
}

function isAlignmentValue(value) {
  return Boolean(normalizeAlignmentValue(value));
}

function normalizeAlignmentValue(value) {
  const normalized = cleanInline(value)
    .toLowerCase()
    .replace(/\balignment\b/g, '')
    .replace(/\bgroup\b/g, '')
    .replace(/[()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) return null;

  for (const pattern of ALIGNMENT_PATTERNS) {
    if (normalized === pattern) return pattern;
  }

  if (/^(?:any\s+)?non[- ](good|evil|lawful|chaotic)$/.test(normalized)) {
    return normalized.replace(/\s+/g, '-').replace('any-', '');
  }

  return null;
}

function normalizeAlignmentCompositeList(value) {
  const tokens = String(value || '')
    .split(',')
    .map(v => String(v || '').trim())
    .filter(Boolean);
  if (tokens.length < 2) return null;

  const all = ['lawful good', 'neutral good', 'chaotic good', 'lawful neutral', 'true neutral', 'chaotic neutral', 'lawful evil', 'neutral evil', 'chaotic evil'];
  const allowed = new Set();

  for (const token of tokens) {
    const expanded = expandAlignmentToken(token);
    if (!expanded || expanded.length === 0) return null;
    expanded.forEach(entry => allowed.add(entry));
  }

  if (allowed.size === 0) return null;
  if (allowed.size === 1) return Array.from(allowed)[0];

  const hasAll = (group) => group.every(entry => allowed.has(entry));
  const equals = (group) => allowed.size === group.length && hasAll(group);

  const nonGoodSet = all.filter(entry => !entry.includes('good'));
  const nonEvilSet = all.filter(entry => !entry.includes('evil'));
  const nonLawfulSet = all.filter(entry => !entry.includes('lawful'));
  const nonChaoticSet = all.filter(entry => !entry.includes('chaotic'));

  if (equals(nonGoodSet)) return 'non-good';
  if (equals(nonEvilSet)) return 'non-evil';
  if (equals(nonLawfulSet)) return 'non-lawful';
  if (equals(nonChaoticSet)) return 'non-chaotic';

  return null;
}

function normalizeAlignmentAnyOfList(value) {
  const tokens = String(value || '')
    .split(',')
    .map(v => String(v || '').trim())
    .filter(Boolean);
  if (tokens.length < 2) return null;

  const values = [];
  tokens.forEach(token => {
    const lower = token.toLowerCase();
    if (lower === 'neutral') {
      pushUnique(values, 'lawful neutral');
      pushUnique(values, 'true neutral');
      pushUnique(values, 'chaotic neutral');
      return;
    }

    const expanded = expandAlignmentToken(token);
    expanded.forEach(entry => pushUnique(values, entry));
  });

  if (values.length < 2) return null;
  return { anyOf: values };
}

function expandAlignmentToken(token) {
  const lower = String(token || '').trim().toLowerCase();
  if (!lower) return [];

  const shorthand = {
    lg: 'lawful good',
    ng: 'neutral good',
    cg: 'chaotic good',
    ln: 'lawful neutral',
    tn: 'true neutral',
    n: 'true neutral',
    cn: 'chaotic neutral',
    le: 'lawful evil',
    ne: 'neutral evil',
    ce: 'chaotic evil'
  };

  if (shorthand[lower]) return [shorthand[lower]];

  if (lower === 'good') return ['lawful good', 'neutral good', 'chaotic good'];
  if (lower === 'evil') return ['lawful evil', 'neutral evil', 'chaotic evil'];
  if (lower === 'lawful') return ['lawful good', 'lawful neutral', 'lawful evil'];
  if (lower === 'chaotic') return ['chaotic good', 'chaotic neutral', 'chaotic evil'];
  if (lower === 'neutral') return ['lawful neutral', 'true neutral', 'chaotic neutral', 'neutral good', 'neutral evil'];

  const normalized = normalizeAlignmentValue(token);
  return normalized ? [normalized] : [];
}

function mergeRestriction(existing, incoming) {
  const values = new Set();
  [existing, incoming]
    .map(v => normalizeRestrictionList(v))
    .forEach(chunk => {
      chunk.split(',').map(v => v.trim()).filter(Boolean).forEach(v => values.add(v));
    });
  return Array.from(values).join(', ');
}

function normalizeRestrictionList(value) {
  return cleanInline(value)
    .replace(/\bOR\b/gi, ',')
    .replace(/\(any\)/gi, '')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .replace(/^,+|,+$/g, '')
    .trim();
}

function looksLikeClassList(line, classSet) {
  const parts = normalizeRestrictionList(line)
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
  if (parts.length === 0) return false;
  return parts.every(part => classSet.has(part.toLowerCase()));
}

function normalizeSpecificSaveKind(value) {
  const key = String(value || '').trim().toLowerCase();
  for (const [raw, normalized] of Object.entries(SPECIFIC_SAVE_KIND_MAP)) {
    if (key.includes(raw)) return normalized;
  }
  return 'universal';
}

function normalizeStat(statName) {
  const key = String(statName || '').trim().toLowerCase();
  if (key.startsWith('strenght')) return 'str';
  if (key.startsWith('str')) return 'str';
  if (key.startsWith('dex')) return 'dex';
  if (key.startsWith('con')) return 'con';
  if (key.startsWith('int')) return 'int';
  if (key.startsWith('wis')) return 'wis';
  if (key.startsWith('cha')) return 'cha';
  return '';
}

function normalizeSkillName(rawSkill) {
  const plain = String(rawSkill || '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
  return SKILL_NAME_MAP[plain] || '';
}

function normalizeDamageType(rawType) {
  const key = String(rawType || '').trim().toLowerCase();
  for (const [token, mapped] of Object.entries(DAMAGE_TYPE_MAP)) {
    if (key.includes(token)) return mapped;
  }
  return 'Acid';
}

function isAmount(value) {
  return /^([+-]?\d+|[+-]?\d+d\d+)$/i.test(String(value || '').trim());
}

function amountToAverage(value) {
  const raw = String(value || '').trim().replace(/^\+/, '');
  const dice = raw.match(/^(\d+)d(\d+)$/i);
  if (dice) {
    const count = parseInt(dice[1], 10) || 0;
    const die = parseInt(dice[2], 10) || 0;
    return count > 0 && die > 0 ? (count * (die + 1)) / 2 : 0;
  }

  const flat = parseFloat(raw);
  return Number.isFinite(flat) ? flat : 0;
}

function cleanInline(value) {
  let text = decodeEntities(String(value || ''));
  text = text.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2');
  text = text.replace(/\[\[([^\]]+)\]\]/g, (_, target) => {
    const clean = String(target || '').split('|')[0].split('#')[0].trim();
    return clean;
  });
  text = text.replace(/\{\{[^{}]*\}\}/g, '');
  text = text.replace(/'''?/g, '');
  text = text.replace(/<[^>]+>/g, ' ');
  text = text.replace(/&nbsp;/gi, ' ');
  text = text.replace(/\s+/g, ' ');
  return text.trim();
}

function decodeEntities(value) {
  return String(value || '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

main();

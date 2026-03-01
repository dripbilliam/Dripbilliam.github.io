const fs = require('fs');
const path = require('path');

const INPUT_XML = path.join(__dirname, '..', 'docs', 'ArelithBard.xml');
const OUTPUT_JSON = path.join(__dirname, '..', 'Parsed', 'bardSongTables.json');

function decodeEntities(value) {
  return String(value || '')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/&nbsp;/gi, ' ');
}

function cleanWikiText(value) {
  return decodeEntities(value)
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/'''''/g, '')
    .replace(/'''/g, '')
    .replace(/''/g, '')
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+$/g, '')
    .trim();
}

function normalizeKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function extractWikiTextFromXml(xmlText) {
  const textMatch = xmlText.match(/<text[^>]*>([\s\S]*?)<\/text>/i);
  if (!textMatch) {
    throw new Error('Could not locate <text>...</text> in XML file');
  }
  return decodeEntities(textMatch[1]);
}

function extractSection(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  if (start === -1) {
    throw new Error(`Section start marker not found: ${startMarker}`);
  }
  const end = text.indexOf(endMarker, start + startMarker.length);
  if (end === -1) {
    throw new Error(`Section end marker not found after ${startMarker}: ${endMarker}`);
  }
  return text.slice(start, end);
}

function parseCellLine(rawLine) {
  const line = rawLine.trim();
  if (!line || (line[0] !== '|' && line[0] !== '!')) {
    return null;
  }

  const body = line.slice(1).trim();
  const pipeIndex = body.indexOf('|');

  let attrsText = '';
  let valueText = body;
  if (pipeIndex >= 0) {
    attrsText = body.slice(0, pipeIndex).trim();
    valueText = body.slice(pipeIndex + 1).trim();
  }

  const colspanMatch = attrsText.match(/colspan\s*=\s*"?(\d+)"?/i);
  const rowspanMatch = attrsText.match(/rowspan\s*=\s*"?(\d+)"?/i);

  return {
    text: cleanWikiText(valueText),
    colspan: colspanMatch ? Number(colspanMatch[1]) : 1,
    rowspan: rowspanMatch ? Number(rowspanMatch[1]) : 1
  };
}

function parseWikiTable(tableText) {
  const lines = tableText.split(/\r?\n/);
  const rows = [];
  let currentRow = [];

  const pushRow = () => {
    if (currentRow.length > 0) {
      rows.push(currentRow);
      currentRow = [];
    }
  };

  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) {
      continue;
    }

    if (trimmed.startsWith('{|')) {
      continue;
    }
    if (trimmed.startsWith('|}')) {
      pushRow();
      break;
    }
    if (trimmed.startsWith('|-')) {
      pushRow();
      continue;
    }

    const parsedCell = parseCellLine(trimmed);
    if (parsedCell) {
      currentRow.push(parsedCell);
      continue;
    }

    if (currentRow.length > 0) {
      const last = currentRow[currentRow.length - 1];
      const continuation = cleanWikiText(trimmed);
      if (continuation) {
        last.text = last.text ? `${last.text}\n${continuation}` : continuation;
      }
    }
  }

  pushRow();
  return rows;
}

function expandTableRows(rows) {
  const expandedRows = [];
  const rowSpanCarry = [];
  let maxColumns = 0;

  for (const rowCells of rows) {
    const expanded = [];

    for (let col = 0; col < rowSpanCarry.length; col += 1) {
      const carry = rowSpanCarry[col];
      if (carry && carry.remaining > 0) {
        expanded[col] = carry.text;
        carry.remaining -= 1;
        if (carry.remaining === 0) {
          rowSpanCarry[col] = null;
        }
      }
    }

    let cursor = 0;
    const nextOpenColumn = () => {
      while (expanded[cursor] !== undefined) {
        cursor += 1;
      }
      return cursor;
    };

    for (const cell of rowCells) {
      const startCol = nextOpenColumn();
      const span = Math.max(1, Number(cell.colspan) || 1);
      const rowSpan = Math.max(1, Number(cell.rowspan) || 1);

      for (let offset = 0; offset < span; offset += 1) {
        const colIndex = startCol + offset;
        expanded[colIndex] = cell.text;
        if (rowSpan > 1) {
          rowSpanCarry[colIndex] = {
            text: cell.text,
            remaining: rowSpan - 1
          };
        }
      }
    }

    maxColumns = Math.max(maxColumns, expanded.length);
    expandedRows.push(expanded);
  }

  return expandedRows.map((row) => {
    const copy = row.slice();
    while (copy.length < maxColumns) {
      copy.push('');
    }
    return copy;
  });
}

function extractFirstTableFromSection(sectionText) {
  const start = sectionText.indexOf('{|');
  const end = sectionText.indexOf('|}', start);
  if (start === -1 || end === -1) {
    throw new Error('Could not locate table markup in section');
  }
  return sectionText.slice(start, end + 2);
}

function findColumnConfig(expandedRows, markerLabel) {
  for (let rowIndex = 0; rowIndex < expandedRows.length; rowIndex += 1) {
    const row = expandedRows[rowIndex];
    for (let colIndex = 0; colIndex < row.length; colIndex += 1) {
      if (normalizeKey(row[colIndex]) === normalizeKey(markerLabel)) {
        const levelLabels = row
          .slice(colIndex + 1)
          .map((value) => String(value || '').trim())
          .filter(Boolean);
        return {
          markerRow: rowIndex,
          markerCol: colIndex,
          levelLabels
        };
      }
    }
  }

  throw new Error(`Unable to find marker column: ${markerLabel}`);
}

function parseSongTable(expandedRows, markerLabel, tableName) {
  const config = findColumnConfig(expandedRows, markerLabel);
  const metaCols = config.markerCol;
  const effectCol = config.markerCol;
  const valueStartCol = effectCol + 1;
  const levelLabels = config.levelLabels;

  const songsById = {};
  const songsByName = {};

  const separatorRegex = /^\s*$/;

  for (let rowIndex = config.markerRow + 1; rowIndex < expandedRows.length; rowIndex += 1) {
    const row = expandedRows[rowIndex];

    const effectLabel = String(row[effectCol] || '').trim();
    const songName = String(row[1] || '').trim();
    const songId = String(row[0] || '').trim();

    if (!songName || !effectLabel || separatorRegex.test(effectLabel)) {
      continue;
    }

    const normalizedSongName = normalizeKey(songName);
    const songKey = songId ? `${songId}:${normalizedSongName}` : normalizedSongName;
    if (!songsById[songKey]) {
      songsById[songKey] = {
        id: songId,
        name: songName,
        esfPerformBonus: String(row[2] || '').trim(),
        synergyLevels: String(row[3] || '').trim(),
        effects: {}
      };
    }

    if (tableName === 'curse' && metaCols >= 5) {
      songsById[songKey].notes = String(row[4] || '').trim();
    }

    const values = {};
    for (let idx = 0; idx < levelLabels.length; idx += 1) {
      const label = levelLabels[idx];
      const col = valueStartCol + idx;
      values[label] = String(row[col] || '').trim();
    }

    const effectKey = normalizeKey(effectLabel);
    const effectRecord = {
      label: effectLabel,
      valuesByLevel: {},
      sothBonus: null
    };

    for (const [levelLabel, value] of Object.entries(values)) {
      if (normalizeKey(levelLabel) === 'soth') {
        effectRecord.sothBonus = value || null;
      } else {
        effectRecord.valuesByLevel[levelLabel] = value;
      }
    }

    songsById[songKey].effects[effectKey] = effectRecord;
    songsByName[normalizedSongName] = songsById[songKey];
  }

  const hasSoth = levelLabels.some((label) => normalizeKey(label) === 'soth');
  const numericLevels = levelLabels.filter((label) => /^\d+$/.test(String(label).trim()));

  return {
    table: tableName,
    levelLabels,
    levels: numericLevels,
    hasSoth,
    songsById,
    songsByName
  };
}

function applySoth(baseValue, sothBonus) {
  if (!sothBonus || sothBonus === '-' || normalizeKey(sothBonus) === 'n a') {
    return baseValue;
  }

  const numericBase = String(baseValue || '').trim().match(/^(-?\d+(?:\.\d+)?)$/);
  const numericBonus = String(sothBonus || '').trim().match(/^\+?(-?\d+(?:\.\d+)?)$/);
  if (numericBase && numericBonus) {
    return String(Number(numericBase[1]) + Number(numericBonus[1]));
  }

  const percentBase = String(baseValue || '').trim().match(/^(-?\d+(?:\.\d+)?)%$/);
  const percentBonus = String(sothBonus || '').trim().match(/^\+?(-?\d+(?:\.\d+)?)%$/);
  if (percentBase && percentBonus) {
    return `${Number(percentBase[1]) + Number(percentBonus[1])}%`;
  }

  return `${baseValue} (${sothBonus} SOTH)`;
}

function querySongValue(parsedData, options) {
  const tableName = normalizeKey(options.table || 'bard') === 'curse' ? 'curse' : 'bard';
  const tableData = tableName === 'curse' ? parsedData.curseSongTable : parsedData.bardSongTable;
  const songKey = normalizeKey(options.song || '');
  const effectKey = normalizeKey(options.effect || '');
  const level = String(options.level || '').trim();

  const song = tableData.songsByName[songKey];
  if (!song) {
    throw new Error(`Song not found in ${tableName} table: ${options.song}`);
  }

  const effect = song.effects[effectKey];
  if (!effect) {
    throw new Error(`Effect not found for song ${song.name}: ${options.effect}`);
  }

  const baseValue = effect.valuesByLevel[level];
  if (baseValue === undefined) {
    throw new Error(`Level ${level} not found for ${song.name} -> ${effect.label}`);
  }

  const withSoth = Boolean(options.withSoth);
  return {
    table: tableName,
    songId: song.id,
    song: song.name,
    effect: effect.label,
    level,
    baseValue,
    sothBonus: effect.sothBonus,
    value: withSoth && tableData.hasSoth ? applySoth(baseValue, effect.sothBonus) : baseValue
  };
}

function parseBardSongTablesFromXml(xmlPath = INPUT_XML) {
  const xmlText = fs.readFileSync(xmlPath, 'utf-8');
  const wikiText = extractWikiTextFromXml(xmlText);

  const bardSection = extractSection(wikiText, '===== Bard Song Table =====', '===== Curse Song Table =====');
  const curseSection = extractSection(wikiText, '===== Curse Song Table =====', '===Starting Songs===');

  const bardTableMarkup = extractFirstTableFromSection(bardSection);
  const curseTableMarkup = extractFirstTableFromSection(curseSection);

  const bardRows = expandTableRows(parseWikiTable(bardTableMarkup));
  const curseRows = expandTableRows(parseWikiTable(curseTableMarkup));

  const bardSongTable = parseSongTable(bardRows, 'Song Level', 'bard');
  const curseSongTable = parseSongTable(curseRows, 'Scaling Effect', 'curse');

  return {
    generatedAt: new Date().toISOString(),
    sourceFile: path.relative(path.join(__dirname, '..'), xmlPath).replace(/\\/g, '/'),
    bardSongTable,
    curseSongTable
  };
}

function writeParsedOutput(parsedData, outputPath = OUTPUT_JSON) {
  fs.writeFileSync(outputPath, JSON.stringify(parsedData, null, 2), 'utf-8');
  return outputPath;
}

function parseCliArgs(argv) {
  const args = argv.slice(2);
  const options = {
    table: 'bard',
    withSoth: false,
    query: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (token === '--query') {
      options.query = true;
      continue;
    }
    if (token === '--table') {
      options.table = args[index + 1];
      index += 1;
      continue;
    }
    if (token === '--song') {
      options.song = args[index + 1];
      index += 1;
      continue;
    }
    if (token === '--effect') {
      options.effect = args[index + 1];
      index += 1;
      continue;
    }
    if (token === '--level') {
      options.level = args[index + 1];
      index += 1;
      continue;
    }
    if (token === '--with-soth') {
      options.withSoth = true;
      continue;
    }
    if (token === '--input') {
      options.input = args[index + 1];
      index += 1;
      continue;
    }
    if (token === '--output') {
      options.output = args[index + 1];
      index += 1;
    }
  }

  return options;
}

if (require.main === module) {
  try {
    const options = parseCliArgs(process.argv);
    const parsed = parseBardSongTablesFromXml(options.input || INPUT_XML);

    if (options.query) {
      const result = querySongValue(parsed, {
        table: options.table,
        song: options.song,
        effect: options.effect,
        level: options.level,
        withSoth: options.withSoth
      });
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    }

    const written = writeParsedOutput(parsed, options.output || OUTPUT_JSON);
    console.log(`Wrote bard song tables to ${written}`);
  } catch (error) {
    console.error(`Bard table parse failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  parseBardSongTablesFromXml,
  writeParsedOutput,
  querySongValue
};

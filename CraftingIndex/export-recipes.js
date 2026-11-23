'use strict';

const fs = require('node:fs');
const path = require('node:path');

// Keep source arrays/objects as JSON so IDs, requirements, and quantities survive CSV export.
function csvCell(value) {
  const text = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function wikiText(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('|', '&#124;')
    .replace(/\r\n|\r|\n/g, '<br>');
}

function itemText(items, products, escape = String) {
  return items.map((item) => {
    const quantity = item.quantity ?? '?';
    const name = escape(item.name);
    return products ? `${quantity} ${name}` : `${name} (${quantity})`;
  }).join('<br>');
}

function makeWikiRow(recipe, inputs, outputs) {
  return [
    '|-',
    `<!--Name    -->|${wikiText(recipe.name)}`,
    `<!--ID      -->|${wikiText(recipe.id)}`,
    `<!--DC      -->|${wikiText(recipe.dc)}`,
    `<!--Craft pt-->|${wikiText(recipe.cp)}`,
    `<!--Value   -->|${wikiText(recipe.value)}`,
    `<!--Material-->|${itemText(inputs, false, wikiText)}`,
    `<!--Product -->|${itemText(outputs, true, wikiText)}`,
    '<!--Properti-->|',
    `<!--Img     -->|${wikiText(recipe.image)}`,
  ].join('\n');
}

function buildExport(recipes, skills, details = { records: [] }, overrides = {}) {
  if (!Array.isArray(recipes) || !Array.isArray(skills) || !Array.isArray(details.records)) {
    throw new Error('Expected recipe/skill arrays and a details object containing records.');
  }
  const skillNames = new Map(skills.map((skill) => [Number(skill.id), skill.name]));
  const detailById = new Map();
  for (const record of details.records) {
    const props = record.payload?.pageProps;
    if (record.ok && props?.recipe) {
      detailById.set(Number(props.recipe.id), props);
    }
  }

  const rows = recipes.map((base) => {
    const props = detailById.get(Number(base.id));
    const detail = props?.recipe;
    const recipe = { ...base, ...detail };
    // Harvested details take precedence; retain conflicting base values for review.
    for (const [key, value] of Object.entries(base)) {
      if (detail && Object.hasOwn(detail, key) && JSON.stringify(value) !== JSON.stringify(detail[key])) {
        recipe[`base_${key}`] = value;
      }
    }
    const override = overrides[String(base.id)] || {};
    const inputs = Array.isArray(detail?.input) ? detail.input
      : (base.inputs || []).map((name) => ({ name, quantity: null }));
    const outputs = Array.isArray(detail?.output) ? detail.output
      : (base.outputs || []).map((name) => ({ name, quantity: null }));
    recipe.properties = '';
    recipe.image = override.image ?? recipe.image ?? 'N/A';
    return {
      ...recipe,
      skillName: skillNames.get(Number(recipe.skill)) ?? '',
      categoryName: recipe.categoryName ?? '',
      input: inputs,
      output: outputs,
      materials: itemText(inputs, false),
      products: itemText(outputs, true),
      recipeImageUrl: props?.recipeImageUrl ?? '',
      detailStatus: detail ? 'complete' : 'missing: quantities unavailable',
      wikitext: makeWikiRow(recipe, inputs, outputs),
    };
  });

  // Include every source field, even one that only appears in a later recipe.
  const preferred = [
    'name', 'id', 'skill', 'skillName', 'category', 'categoryName', 'dc', 'cp', 'value',
    'races', 'classes', 'feats', 'inputs', 'outputs', 'input', 'output',
    'materials', 'products', 'properties', 'image', 'recipeImageUrl', 'detailStatus',
  ];
  const fields = new Set(rows.flatMap(Object.keys));
  const headers = [...preferred.filter((key) => fields.has(key)),
    ...[...fields].filter((key) => !preferred.includes(key) && key !== 'wikitext'), 'wikitext'];
  const csv = '\uFEFF' + [headers.map(csvCell).join(','),
    ...rows.map((row) => headers.map((key) => csvCell(row[key])).join(','))].join('\r\n') + '\r\n';
  return { rows, headers, csv };
}

function main(args) {
  const options = {};
  for (let i = 0; i < args.length; i += 1) {
    const flag = args[i];
    if (flag === '--help') {
      console.log('Usage: node export-recipes.js [--data-dir DIR] [--details FILE|none] [--overrides FILE] [--output FILE]');
      return;
    }
    if (!['--data-dir', '--details', '--overrides', '--output'].includes(flag) || !args[i + 1] || args[i + 1].startsWith('--')) {
      throw new Error(`Invalid option or missing value: ${flag}. Use --help for usage.`);
    }
    options[flag] = args[++i];
  }
  const directory = path.resolve(options['--data-dir'] || __dirname);
  const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
  let detailsFile = options['--details'];
  if (!detailsFile) {
    detailsFile = fs.existsSync(path.join(directory, 'recipe-details.json')) ? 'recipe-details.json'
      : fs.readdirSync(directory).filter((file) => /^arelith-recipe-details-.*\.json$/.test(file)).sort().pop();
  }
  const details = detailsFile && detailsFile !== 'none'
    ? readJson(path.resolve(directory, detailsFile)) : { records: [] };
  const overrides = options['--overrides'] ? readJson(path.resolve(options['--overrides'])) : {};
  const result = buildExport(readJson(path.join(directory, 'recipes.response.json')),
    readJson(path.join(directory, 'skills.response.json')), details, overrides);
  const output = path.resolve(options['--output'] || path.join(directory, 'recipes.csv'));
  fs.writeFileSync(output, result.csv, 'utf8');
  const missing = result.rows.filter((row) => row.detailStatus !== 'complete').length;
  console.log(`Exported ${result.rows.length} recipes, ${result.headers.length} columns to ${output}`);
  if (missing) console.warn(`${missing} recipes lack details; unknown quantities are marked ?. Supply --details to include them.`);
}

module.exports = { buildExport, makeWikiRow };
if (require.main === module) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(`Export failed: ${error.message}`);
    process.exitCode = 1;
  }
}

const fs = require('fs');
const path = require('path');

const ENHANCED_DATA_PATH = path.join(__dirname, '../SpellSearch/enhancedSpellData.json');
const OUTPUT_DIR = path.join(__dirname, './output');

const CATEGORY_MAPPINGS = {
  damageTypes: {
    'Acid': 'Acid Damage',
    'Bludgeoning': 'Bludgeoning Damage',
    'Cold': 'Cold Damage',
    'Divine': 'Divine Damage',
    'Electricity': 'Electric Damage',
    'Entropy': 'Entropy Damage',
    'Fire': 'Fire Damage',
    'Magical': 'Magical Damage',
    'Negative': 'Negative Energy',
    'Piercing': 'Piercing Damage',
    'Positive': 'Positive Energy',
    'Slashing': 'Slashing Damage',
    'Sonic': 'Sonic Damage'
  },
  saveTypes: {
    'Will': 'Will Save',
    'Fortitude': 'Fortitude Save',
    'Reflex': 'Reflex Save'
  },
  schools: {
    'Abjuration': 'Abjuration School',
    'Conjuration': 'Conjuration School',
    'Divination': 'Divination School',
    'Enchantment': 'Enchantment School',
    'Evocation': 'Evocation School',
    'Illusion': 'Illusion School',
    'Necromancy': 'Necromancy School',
    'Transmutation': 'Transmutation School'
  },
  keywords: {
    'mind-affecting': 'Mind-Affecting',
    'fear': 'Fear Effect',
    'death': 'Death Effect',
    'healing': 'Healing',
    'negative energy': 'Negative Energy',
    'positive energy': 'Positive Energy',
    'undead': 'Undead',
    'summoning': 'Summoning',
    'teleportation': 'Teleportation',
    'permanent': 'Permanent Effect',
    'curse': 'Curse',
    'polymorph': 'Polymorph',
    'invisibility': 'Invisibility',
    'stun': 'Stun',
    'paralysis': 'Paralysis',
    'petrification': 'Petrification',
    'cold': 'Cold Damage',
    'fire': 'Fire Damage',
    'electricity': 'Electric Damage',
    'acid': 'Acid Damage',
    'sonic': 'Sonic Damage'
  }
};

function generateCategoryTags(spell) {
  const tags = [];

  if (spell.school && CATEGORY_MAPPINGS.schools[spell.school]) {
    tags.push(CATEGORY_MAPPINGS.schools[spell.school]);
  }

  if (spell.damageTypes && Array.isArray(spell.damageTypes)) {
    spell.damageTypes.forEach(dmgType => {
      if (CATEGORY_MAPPINGS.damageTypes[dmgType]) {
        const category = CATEGORY_MAPPINGS.damageTypes[dmgType];
        if (!tags.includes(category)) {
          tags.push(category);
        }
      }
    });
  }

  if (spell.saveType && spell.saveType !== 'None' && spell.saveType !== 'Special') {
    const saveParts = spell.saveType.split('/');
    saveParts.forEach(savePart => {
      const cleanSave = savePart.trim();
      if (CATEGORY_MAPPINGS.saveTypes[cleanSave]) {
        const category = CATEGORY_MAPPINGS.saveTypes[cleanSave];
        if (!tags.includes(category)) {
          tags.push(category);
        }
      }
    });
  }

  const descriptorsToCheck = spell.descriptors ? 
    spell.descriptors.toLowerCase().split(',').map(d => d.trim()) : [];
  
  if (Array.isArray(spell.tags)) {
    spell.tags.forEach(tag => {
      descriptorsToCheck.push(tag.toLowerCase());
    });
  }

  descriptorsToCheck.forEach(descriptor => {
    const normalizedDescriptor = descriptor.replace(/[-\s]+/g, '-');
    for (const [keyword, category] of Object.entries(CATEGORY_MAPPINGS.keywords)) {
      const normalizedKeyword = keyword.replace(/[-\s]+/g, '-');
      if (normalizedDescriptor.includes(normalizedKeyword)) {
        if (!tags.includes(category)) {
          tags.push(category);
        }
      }
    }
  });

  if (spell.description) {
    const descLower = spell.description.toLowerCase();
    for (const [keyword, category] of Object.entries(CATEGORY_MAPPINGS.keywords)) {
      if (descLower.includes(keyword) && !tags.includes(category)) {
        tags.push(category);
      }
    }
  }

  return tags;
}

function generateWikiMarkup(spell) {
  const tags = generateCategoryTags(spell);
  const markup = tags.map(tag => `[[Category:${tag}]]`).join('\n');
  return markup;
}

function generateAnnotatedJSON(spells) {
  return spells.map(spell => ({
    id: spell.id,
    name: spell.name,
    originalName: spell.originalName,
    school: spell.school,
    innateLevel: spell.innateLevel,
    damageTypes: spell.damageTypes,
    descriptors: spell.descriptors,
    tags: spell.tags,
    categories: generateCategoryTags(spell),
    wikiMarkup: generateWikiMarkup(spell)
  }));
}

function generateCSV(spells) {
  const annotated = generateAnnotatedJSON(spells);
  
  const headers = ['ID', 'Name', 'School', 'Damage Types', 'Descriptors', 'Tags', 'Wiki Categories'];
  const rows = annotated.map(spell => [
    spell.id,
    `"${spell.name.replace(/"/g, '""')}"`,
    spell.school,
    spell.damageTypes ? spell.damageTypes.join('; ') : '',
    spell.descriptors || '',
    spell.tags ? spell.tags.join('; ') : '',
    spell.categories.join('; ')
  ]);
  
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  return csv;
}

function main() {
  try {
    console.log('Reading enhanced spell data...');
    const spellData = JSON.parse(fs.readFileSync(ENHANCED_DATA_PATH, 'utf8'));
    
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    console.log(`Processing ${spellData.length} spells...`);

    console.log('Generating annotated JSON...');
    const annotated = generateAnnotatedJSON(spellData);
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'spellsWithCategories.json'),
      JSON.stringify(annotated, null, 2)
    );
    console.log('✓ spellsWithCategories.json written');

    console.log('Generating CSV...');
    const csv = generateCSV(spellData);
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'spellCategories.csv'),
      csv
    );
    console.log('✓ spellCategories.csv written');

    console.log('Generating wiki markup file...');
    const wikiMarkupLines = spellData.map(spell => {
      const markup = generateWikiMarkup(spell);
      return `== ${spell.name} (ID: ${spell.id}) ==\n${markup}`;
    });
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'wikiMarkup.txt'),
      wikiMarkupLines.join('\n\n')
    );
    console.log('✓ wikiMarkup.txt written');

    console.log('Generating category summary...');
    const categorySummary = {};
    annotated.forEach(spell => {
      spell.categories.forEach(category => {
        if (!categorySummary[category]) {
          categorySummary[category] = [];
        }
        categorySummary[category].push(spell.name);
      });
    });

    const summaryText = Object.entries(categorySummary)
      .sort((a, b) => b[1].length - a[1].length)
      .map(([category, spells]) => 
        `[[Category:${category}]]: ${spells.length} spells\n  ${spells.slice(0, 10).join(', ')}${spells.length > 10 ? '...' : ''}`
      ).join('\n');
    
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'categorySummary.txt'),
      summaryText
    );
    console.log('✓ categorySummary.txt written');

    console.log('\n=== ENRICHMENT COMPLETE ===');
    console.log(`Total spells processed: ${spellData.length}`);
    console.log(`Total unique categories created: ${Object.keys(categorySummary).length}`);
    console.log('\nOutput files:');
    console.log('  - spellsWithCategories.json (detailed annotated data)');
    console.log('  - spellCategories.csv (spreadsheet-compatible)');
    console.log('  - wikiMarkup.txt (ready-to-paste wiki markup)');
    console.log('  - categorySummary.txt (category overview)');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

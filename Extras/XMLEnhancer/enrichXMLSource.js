const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

const ENHANCED_DATA_PATH = path.join(__dirname, '../SpellSearch/enhancedSpellData.json');
const XML_INPUT_PATH = path.join(__dirname, '../docs/ArelithSpellsandFeats.xml');
const OUTPUT_PATH = path.join(__dirname, './output/ArelithSpellsandFeats_Enhanced.xml');

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

function extractDescriptorsFromWikiText(text) {
  const descriptorMatch = text.match(/\|\s*Descriptors\s*=\s*([^\n|]+)/i);
  if (descriptorMatch) {
    return descriptorMatch[1].trim();
  }
  return null;
}

function generateCategoryTagsFromDescriptor(descriptorString) {
  const tags = [];
  
  if (!descriptorString || descriptorString.toLowerCase() === 'none') {
    return tags;
  }

  const descriptorsToCheck = descriptorString.toLowerCase().split(',').map(d => d.trim());
  
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

  return tags;
}

function generateCategoryTags(spell) {
  const tags = [];

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

function normalizeSpellName(name) {
  return name.toLowerCase().trim();
}

async function main() {
  try {
    console.log('Reading enhanced spell data...');
    const spellData = JSON.parse(fs.readFileSync(ENHANCED_DATA_PATH, 'utf8'));
    
    console.log('Reading XML file...');
    const xmlContent = fs.readFileSync(XML_INPUT_PATH, 'utf8');
    
    const parser = new xml2js.Parser({ preserveChildrenOrder: true });
    const xmlObj = await parser.parseStringPromise(xmlContent);
    
    console.log(`Processing ${spellData.length} spells...`);
    
    const spellMap = {};
    spellData.forEach(spell => {
      const normalized = normalizeSpellName(spell.name);
      spellMap[normalized] = spell;
    });
    
    let matchedCount = 0;
    let addedCategoriesCount = 0;
    
    if (xmlObj.mediawiki && xmlObj.mediawiki.page) {
      const pages = xmlObj.mediawiki.page;
      
      pages.forEach(page => {
        if (page.title && page.title[0]) {
          const pageTitle = page.title[0];
          const normalizedTitle = normalizeSpellName(pageTitle);
          
          let categories = [];
          
          if (spellMap[normalizedTitle]) {
            matchedCount++;
            const spell = spellMap[normalizedTitle];
            categories = generateCategoryTags(spell);
          } else {
            if (page.revision && page.revision[0] && page.revision[0].text) {
              const textObj = page.revision[0].text[0];
              const textContent = typeof textObj === 'string' ? textObj : textObj._;
              const descriptorStr = extractDescriptorsFromWikiText(textContent);
              if (descriptorStr) {
                categories = generateCategoryTagsFromDescriptor(descriptorStr);
              }
            }
          }
          
          if (categories.length > 0 && page.revision && page.revision[0] && page.revision[0].text) {
            const textObj = page.revision[0].text[0];
            let textContent = typeof textObj === 'string' ? textObj : textObj._;
            
            categories.forEach(category => {
              const categoryLink = `[[Category:${category}]]`;
              if (!textContent.includes(categoryLink)) {
                textContent += '\n' + categoryLink;
                addedCategoriesCount++;
              }
            });
            
            if (typeof textObj === 'string') {
              page.revision[0].text[0] = textContent;
            } else {
              textObj._ = textContent;
            }
          }
        }
      });
    }
    
    console.log(`Matched ${matchedCount} spells from enhanced data`);
    console.log(`Added ${addedCategoriesCount} new category tags`);
    
    const builder = new xml2js.Builder({ 
      preserveChildrenOrder: true,
      xmldec: { version: '1.0', encoding: 'UTF-8' }
    });
    const newXml = builder.buildObject(xmlObj);
    
    fs.writeFileSync(OUTPUT_PATH, newXml);
    console.log('✓ Enhanced XML written to: output/ArelithSpellsandFeats_Enhanced.xml');
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

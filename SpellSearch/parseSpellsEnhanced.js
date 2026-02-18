const fs = require('fs');
const path = require('path');

function parseSpellFeatIDs(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').slice(1);
    const spellFeatMap = new Map();
    
    for (const line of lines) {
        if (!line.trim()) continue;
        const [name, id] = line.split('\t');
        if (name && id !== undefined) {
            spellFeatMap.set(name.trim(), id.trim());
        }
    }
    
    return spellFeatMap;
}

function parseXMLData(xmlContent) {
    const pages = [];
    const pageRegex = /<page>([\s\S]*?)<\/page>/g;
    let match;
    
    while ((match = pageRegex.exec(xmlContent)) !== null) {
        const pageContent = match[1];
        
        const titleMatch = /<title>(.*?)<\/title>/.exec(pageContent);
        if (!titleMatch) continue;
        let title = titleMatch[1];
        
        title = title.replace(/\s*\([^)]*\)\s*$/, '').trim();
        
        const textMatch = /<text[^>]*>([\s\S]*?)<\/text>/.exec(pageContent);
        if (!textMatch) continue;
        const text = textMatch[1];
        
        if (!text.includes('{{SpellBookPage')) {
            continue;
        }
        
        const data = {
            title: title,
            type: 'spell',
            spellLevel: extractParameter(text, 'Spell Level'),
            innateLevel: extractParameter(text, 'Innate Level'),
            school: extractParameter(text, 'Spell School'),
            descriptors: extractParameter(text, 'Descriptors'),
            components: extractParameter(text, 'Components'),
            range: extractParameter(text, 'Range'),
            areaOfEffect: extractParameter(text, 'Area of Effect'),
            duration: extractParameter(text, 'Duration'),
            saves: extractParameter(text, 'Saves'),
            spellResistance: extractParameter(text, 'Spell Resistance'),
            description: extractParameter(text, 'Description'),
            rawText: text
        };
        
        data.classes = parseClassLevels(data.spellLevel);
        
        data.damageTypes = extractDamageTypes(data.descriptors, data.description);
        data.tags = extractTags(data.descriptors);
        data.durationType = categorizeDuration(data.duration);
        data.rangeCategory = categorizeRange(data.range);
        data.aoeCategory = categorizeAoE(data.areaOfEffect);
        data.saveType = categorizeSave(data.saves);
        data.hasSpellResistance = categorizeSpellResistance(data.spellResistance);
        
        pages.push(data);
    }
    
    return pages;
}

function extractParameter(text, paramName) {
    const regex = new RegExp(`\\|\\s*${paramName}\\s*=\\s*([^\\n]*?)(?=\\n\\s*\\||\\n\\s*}}|$)`, 'is');
    const match = regex.exec(text);
    return match ? match[1].trim() : '';
}

function extractDamageTypes(descriptors, description) {
    const damageTypes = new Set();
    const text = (descriptors + ' ' + description).toLowerCase();
    
    const types = [
        'acid', 'cold', 'fire', 'electricity', 'sonic',
        'negative', 'positive', 'divine', 'magical',
        'bludgeoning', 'piercing', 'slashing',
        'entropy'
    ];
    
    for (const type of types) {
        if (text.includes(type)) {
            damageTypes.add(type.charAt(0).toUpperCase() + type.slice(1));
        }
    }
    
    return Array.from(damageTypes).sort();
}

function extractTags(descriptors) {
    if (!descriptors || descriptors.toLowerCase() === 'none') {
        return [];
    }
    
    const tags = descriptors.split(',')
        .map(tag => {
            let normalized = tag.trim()
                .replace(/-/g, ' ')
                .replace(/\s+/g, ' ')
                .toLowerCase();
            
            if (!normalized || normalized === 'n/a' || normalized === 'none') {
                return null;
            }
            
            return normalized
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        })
        .filter(tag => tag !== null);
    
    return [...new Set(tags)];
}

function categorizeDuration(duration) {
    if (!duration) return 'Unknown';
    
    const lower = duration.toLowerCase();
    
    if (lower.includes('instant')) return 'Instantaneous';
    if (lower.includes('permanent')) return 'Permanent';
    if (lower.includes('concentration')) return 'Concentration';
    if (lower.includes('round')) return 'Rounds';
    if (lower.includes('turn')) return 'Turns';
    if (lower.includes('minute')) return 'Minutes';
    if (lower.includes('hour')) return 'Hours';
    if (lower.includes('day') || lower.includes('24 hours')) return 'Days';
    if (lower.includes('special')) return 'Special';
    
    return 'Other';
}

function categorizeRange(range) {
    if (!range) return 'Unknown';
    
    const lower = range.toLowerCase();
    
    if (lower.includes('personal')) return 'Personal';
    if (lower.includes('touch')) return 'Touch';
    if (lower.includes('short')) return 'Short';
    if (lower.includes('medium')) return 'Medium';
    if (lower.includes('long')) return 'Long';
    if (lower.includes('unlimited')) return 'Unlimited';
    
    return 'Other';
}

function categorizeAoE(aoe) {
    if (!aoe) return 'Unknown';
    
    const lower = aoe.toLowerCase();
    
    if (lower.includes('single') || lower.includes('one creature')) return 'Single Target';
    if (lower.includes('colossal')) return 'Colossal';
    if (lower.includes('gargantuan')) return 'Gargantuan';
    if (lower.includes('huge')) return 'Huge';
    if (lower.includes('large')) return 'Large';
    if (lower.includes('medium')) return 'Medium';
    if (lower.includes('small')) return 'Small';
    if (lower.includes('cone')) return 'Cone';
    if (lower.includes('line')) return 'Line';
    if (lower.includes('personal')) return 'Personal';
    if (lower.includes('special')) return 'Special';
    
    return 'Other';
}

function categorizeSave(saves) {
    if (!saves) return 'None';
    
    const lower = saves.toLowerCase();
    
    if (lower === 'none' || lower === 'no') return 'None';
    
    const saveTypes = [];
    if (lower.includes('fortitude') || lower.includes('fort')) saveTypes.push('Fortitude');
    if (lower.includes('reflex') || lower.includes('ref')) saveTypes.push('Reflex');
    if (lower.includes('will')) saveTypes.push('Will');
    
    return saveTypes.length > 0 ? saveTypes.join('/') : 'Special';
}

function categorizeSpellResistance(sr) {
    if (!sr) return false;
    
    const lower = sr.toLowerCase();
    return lower === 'yes' || lower === 'true';
}

function parseClassLevels(spellLevelStr) {
    if (!spellLevelStr) return [];
    
    const classes = [];
    
    const domainPattern = /\[\[([^\]]+?)\]\]\(([^\)]+)\)\s*(\d+)/g;
    let match;
    
    let remainingStr = spellLevelStr;
    
    while ((match = domainPattern.exec(spellLevelStr)) !== null) {
        const className = match[1];
        const domainsStr = match[2];
        const level = parseInt(match[3]);
        
        const domainRegex = /\[\[([^\]|]+)/g;
        const domains = [];
        let domainSubMatch;
        while ((domainSubMatch = domainRegex.exec(domainsStr)) !== null) {
            domains.push(domainSubMatch[1]);
        }
        
        classes.push({
            class: className,
            domain: domains.length > 0 ? domains.join(', ') : null,
            level: level
        });
        
        remainingStr = remainingStr.replace(match[0], '');
    }
    
    const simplePattern = /\[\[([^\]]+?)\]\]\s*(\d+)/g;
    while ((match = simplePattern.exec(remainingStr)) !== null) {
        const className = match[1];
        const level = parseInt(match[2]);
        
        classes.push({
            class: className,
            domain: null,
            level: level
        });
    }
    
    return classes;
}

function normalizeName(name) {
    return name
        .toLowerCase()
        .replace(/\//, ' ')
        .replace(/ and /g, ' ')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}


function parseEnhancedSpellData() {
    console.log('Starting enhanced spell parse...');
    
    const idMapPath = path.join(__dirname, '..', 'docs', 'SpellandFeatID.txt');
    const spellFeatIDs = parseSpellFeatIDs(idMapPath);
    console.log(`Loaded ${spellFeatIDs.size} spell/feat IDs`);
    
    let combatData = {};
    try {
        const combatDataPath = path.join(__dirname, 'combatData.json');
        if (fs.existsSync(combatDataPath)) {
            combatData = JSON.parse(fs.readFileSync(combatDataPath, 'utf-8'));
            console.log(`Loaded ${Object.keys(combatData).length} combat data entries`);
        }
    } catch (e) {
        console.warn('Could not load combat data:', e.message);
    }
    
    const classDataPath = path.join(__dirname, '..', 'docs', 'ArelithClassData.xml');
    const spellsFeatsPath = path.join(__dirname, '..', 'docs', 'ArelithSpellsandFeats.xml');
    
    console.log('Parsing ClassData XML...');
    const classDataXML = fs.readFileSync(classDataPath, 'utf-8');
    const classData = parseXMLData(classDataXML);
    console.log(`Found ${classData.length} spells in ClassData`);
    
    console.log('Parsing SpellsandFeats XML...');
    const spellsFeatsXML = fs.readFileSync(spellsFeatsPath, 'utf-8');
    const spellsFeatsData = parseXMLData(spellsFeatsXML);
    console.log(`Found ${spellsFeatsData.length} spells in SpellsandFeats`);
    
    const allData = [...classData, ...spellsFeatsData];
    
    const dataByName = new Map();
    for (const item of allData) {
        const normalized = normalizeName(item.title);
        dataByName.set(normalized, item);
    }
    
    const enhancedSpells = [];
    const notFound = [];
    
    for (const [name, id] of spellFeatIDs) {
        const normalized = normalizeName(name);
        let data = dataByName.get(normalized);
        let usedName = name;
        
        if (!data && name.startsWith('SPELL ')) {
            const withoutSpellPrefix = name.substring(6);
            const normalizedWithout = normalizeName(withoutSpellPrefix);
            data = dataByName.get(normalizedWithout);
            if (data) {
                usedName = withoutSpellPrefix;
            }
        }
        
        if (data && data.type === 'spell') {
            const spellNormalized = normalizeName(data.title);
            const combat = combatData[spellNormalized] || {};
            
            enhancedSpells.push({
                id: id,
                name: usedName,
                originalName: data.title,
                school: data.school || 'Unknown',
                innateLevel: data.innateLevel || '0',
                classes: data.classes || [],
                descriptors: data.descriptors || 'None',
                components: data.components || '',
                range: data.range || '',
                rangeCategory: data.rangeCategory || 'Unknown',
                areaOfEffect: data.areaOfEffect || '',
                aoeCategory: data.aoeCategory || 'Unknown',
                duration: data.duration || '',
                durationType: data.durationType || 'Unknown',
                saves: data.saves || '',
                saveType: data.saveType || 'None',
                spellResistance: data.spellResistance || '',
                hasSpellResistance: data.hasSpellResistance || false,
                damageTypes: data.damageTypes || [],
                tags: data.tags || [],
                description: data.description || '',
                combatInfo: combat.isDirect || combat.isPersistentAoE ? {
                    damageFormula: combat.damageFormula || null,
                    maxDamage: combat.maxDamage || null,
                    avgDamage: combat.avgDamage || null,
                    combatRange: combat.range || null,
                    combatEffects: combat.effects || null,
                    combatAoE: combat.aoeType || null,
                    isPersistentAoE: combat.isPersistentAoE || false,
                    checkTiming: combat.checkTiming || null,
                    speedReduction: combat.speedReduction || null
                } : null
            });
        }
    }
    
    enhancedSpells.sort((a, b) => parseInt(a.id) - parseInt(b.id));
    
    const outputPath = path.join(__dirname, 'enhancedSpellData.json');
    fs.writeFileSync(outputPath, JSON.stringify(enhancedSpells, null, 2));
    console.log(`\nWrote ${enhancedSpells.length} enhanced spell entries to ${outputPath}`);
    
    const stats = generateStatistics(enhancedSpells);
    console.log('\n=== Enhanced Spell Statistics ===');
    console.log(`Total Spells: ${stats.total}`);
    console.log(`\nSchools: ${stats.schools.join(', ')}`);
    console.log(`\nDamage Types Found: ${stats.damageTypes.join(', ')}`);
    console.log(`\nTags Found: ${stats.tags.slice(0, 20).join(', ')}${stats.tags.length > 20 ? '...' : ''}`);
    console.log(`\nDuration Types: ${stats.durationTypes.join(', ')}`);
    console.log(`\nRange Categories: ${stats.rangeCategories.join(', ')}`);
    console.log(`\nAoE Categories: ${stats.aoeCategories.join(', ')}`);
    console.log(`\nSave Types: ${stats.saveTypes.join(', ')}`);
    console.log(`\nSpells with SR: ${stats.spellsWithSR}`);
    console.log(`Spells without SR: ${stats.spellsWithoutSR}`);
    
    return enhancedSpells;
}

function generateStatistics(spells) {
    const schools = [...new Set(spells.map(s => s.school).filter(s => s))].sort();
    const damageTypes = [...new Set(spells.flatMap(s => s.damageTypes))].sort();
    const tags = [...new Set(spells.flatMap(s => s.tags))].sort();
    const durationTypes = [...new Set(spells.map(s => s.durationType))].sort();
    const rangeCategories = [...new Set(spells.map(s => s.rangeCategory))].sort();
    const aoeCategories = [...new Set(spells.map(s => s.aoeCategory))].sort();
    const saveTypes = [...new Set(spells.map(s => s.saveType))].sort();
    
    const spellsWithSR = spells.filter(s => s.hasSpellResistance).length;
    const spellsWithoutSR = spells.length - spellsWithSR;
    
    return {
        total: spells.length,
        schools,
        damageTypes,
        tags,
        durationTypes,
        rangeCategories,
        aoeCategories,
        saveTypes,
        spellsWithSR,
        spellsWithoutSR
    };
}

if (require.main === module) {
    try {
        parseEnhancedSpellData();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

module.exports = { parseEnhancedSpellData };

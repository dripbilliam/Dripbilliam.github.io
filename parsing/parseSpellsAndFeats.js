const fs = require('fs');
const path = require('path');

let extractGroup;
try {
    const groupModule = require('./groupNotFound.js');
    extractGroup = groupModule.extractGroup;
} catch (e) {
    extractGroup = () => null;
}

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
        
        const data = {
            title: title,
            rawText: text
        };
        
        if (text.includes('{{SpellBookPage')) {
            data.type = 'spell';
            data.spellLevel = extractParameter(text, 'Spell Level');
            data.innateLevel = extractParameter(text, 'Innate Level');
            data.school = extractParameter(text, 'Spell School');
            data.descriptors = extractParameter(text, 'Descriptors');
            data.components = extractParameter(text, 'Components');
            data.range = extractParameter(text, 'Range');
            data.areaOfEffect = extractParameter(text, 'Area of Effect');
            data.duration = extractParameter(text, 'Duration');
            data.saves = extractParameter(text, 'Saves');
            data.spellResistance = extractParameter(text, 'Spell Resistance');
            
            data.classes = parseClassLevels(data.spellLevel);
        }
        
        if (text.match(/Type:\?\s*(General|Fighter|Metamagic|Special|Divine|Class)/i) ||
            text.match(/Prerequisites?:\?/i)) {
            data.type = 'feat';
            
            const prereqMatch = text.match(/Prerequisites?:\?\s*([^\n|]*)/i);
            if (prereqMatch) {
                data.prerequisites = prereqMatch[1].trim();
            }
            
            const typeMatch = text.match(/Type:\?\s*([^\n|]*)/i);
            if (typeMatch) {
                data.featType = typeMatch[1].trim();
            }
        }
        
        if (text.match(/{{.*Level Progression/i)) {
            continue;
        }
        
        pages.push(data);
    }
    
    return pages;
}

function extractParameter(text, paramName) {
    const regex = new RegExp(`\\|\\s*${paramName}\\s*=\\s*([^\\n]*?)(?=\\n\\s*\\||\\n\\s*}}|$)`, 'is');
    const match = regex.exec(text);
    return match ? match[1].trim() : '';
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
        .replace(/\\/, ' ')
        .replace(/ and /g, ' ')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function combineSpellFeatData() {
    console.log('Starting parse...');
    
    const idMapPath = path.join(__dirname, '..', 'docs', 'SpellandFeatID.txt');
    const spellFeatIDs = parseSpellFeatIDs(idMapPath);
    console.log(`Loaded ${spellFeatIDs.size} spell/feat IDs`);
    
    const classDataPath = path.join(__dirname, '..', 'docs', 'ArelithClassData.xml');
    const spellsFeatsPath = path.join(__dirname, '..', 'docs', 'ArelithSpellsandFeats.xml');
    
    console.log('Parsing ClassData XML...');
    const classDataXML = fs.readFileSync(classDataPath, 'utf-8');
    const classData = parseXMLData(classDataXML);
    console.log(`Found ${classData.length} pages in ClassData`);
    
    console.log('Parsing SpellsandFeats XML...');
    const spellsFeatsXML = fs.readFileSync(spellsFeatsPath, 'utf-8');
    const spellsFeatsData = parseXMLData(spellsFeatsXML);
    console.log(`Found ${spellsFeatsData.length} pages in SpellsandFeats`);
    
    const allData = [...classData, ...spellsFeatsData];
    
    const dataByName = new Map();
    for (const item of allData) {
        const normalized = normalizeName(item.title);
        dataByName.set(normalized, item);
    }
    
    const combinedData = [];
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
        
        if (data) {
            combinedData.push({
                id: id,
                name: usedName,
                originalName: data.title,
                type: data.type || 'unknown',
                school: data.school || '',
                innateLevel: data.innateLevel || '',
                classes: data.classes || [],
                prerequisites: data.prerequisites || '',
                featType: data.featType || '',
                descriptors: data.descriptors || '',
                components: data.components || '',
                range: data.range || '',
                areaOfEffect: data.areaOfEffect || '',
                duration: data.duration || '',
                saves: data.saves || '',
                spellResistance: data.spellResistance || ''
            });
        } else {
            notFound.push({ name, id });
        }
    }
    
    const groupedCombinedData = combinedData.map(item => {
        const group = extractGroup(item.name);
        return { ...item, group };
    });
    
    const groupedNotFound = notFound.map(item => {
        const group = extractGroup(item.name);
        return { ...item, group };
    });
    
    const allGroups = new Map();
    for (const item of [...groupedCombinedData, ...groupedNotFound]) {
        if (item.group) {
            if (!allGroups.has(item.group)) {
                allGroups.set(item.group, []);
            }
            allGroups.get(item.group).push(item);
        }
    }
    
    const spellNames = new Set();
    for (const item of groupedCombinedData) {
        if (item.type === 'spell') {
            spellNames.add(normalizeName(item.name));
        }
    }
    
    const validGroups = new Set();
    for (const [groupName, members] of allGroups) {
        if (members.length >= 2) {
            const hasNonSpell = members.some(item => item.type !== 'spell');
            
            let shouldInclude = hasNonSpell;
            if (groupName.startsWith('SPELL ') && !groupName.includes('Pact')) {
                const baseGroupName = groupName.substring(6);
                
                const hasValidSpellVariant = members.some(item => {
                    let variant = item.name;
                    if (variant.startsWith(groupName + ' ')) {
                        variant = variant.substring(groupName.length + 1);
                    }
                    
                    const expectedSpellName = baseGroupName + ' ' + variant;
                    const normalizedSpellName = normalizeName(expectedSpellName);
                    
                    return spellNames.has(normalizedSpellName);
                });
                
                shouldInclude = hasValidSpellVariant;
            }
            
            if (shouldInclude) {
                validGroups.add(groupName);
            }
        }
    }
    
    const finalCombinedData = groupedCombinedData.map(item => {
        if (item.group && validGroups.has(item.group)) {
            return item;
        }
        return { ...item, group: null };
    });
    
    const finalNotFound = groupedNotFound.map(item => {
        if (item.group && validGroups.has(item.group)) {
            return item;
        }
        return { ...item, group: null };
    });
    
    finalCombinedData.sort((a, b) => parseInt(a.id) - parseInt(b.id));
    
    const outputPath = path.join(__dirname, '..', 'Parsed', 'combinedSpellFeatData.json');
    fs.writeFileSync(outputPath, JSON.stringify(finalCombinedData, null, 2));
    console.log(`\nWrote ${finalCombinedData.length} combined entries to ${outputPath}`);
    
    if (finalNotFound.length > 0) {
        const notFoundPath = path.join(__dirname, '..', 'Parsed', 'notFound.json');
        fs.writeFileSync(notFoundPath, JSON.stringify(finalNotFound, null, 2));
        console.log(`${finalNotFound.length} items not found in XML - written to ${notFoundPath}`);
        
        const groupedCount = finalNotFound.filter(item => item.group !== null).length;
        const uniqueGroups = new Set(finalNotFound.filter(item => item.group).map(item => item.group)).size;
        if (groupedCount > 0) {
            console.log(`  - ${groupedCount} items in ${uniqueGroups} groups`);
            console.log(`  - ${finalNotFound.length - groupedCount} ungrouped items`);
        }
    }
    
    const stats = {
        total: finalCombinedData.length,
        spells: finalCombinedData.filter(d => d.type === 'spell').length,
        feats: finalCombinedData.filter(d => d.type === 'feat').length,
        unknown: finalCombinedData.filter(d => d.type === 'unknown').length,
        notFound: finalNotFound.length,
        schools: [...new Set(finalCombinedData.map(d => d.school).filter(s => s))],
        classes: [...new Set(finalCombinedData.flatMap(d => d.classes.map(c => c.class)))]
    };
    
    console.log('\n=== Statistics ===');
    console.log(`Total: ${stats.total}`);
    console.log(`Spells: ${stats.spells}`);
    console.log(`Feats: ${stats.feats}`);
    console.log(`Unknown: ${stats.unknown}`);
    console.log(`Not Found: ${stats.notFound}`);
    console.log(`\nSchools of Magic: ${stats.schools.join(', ')}`);
    console.log(`\nClasses Found: ${stats.classes.sort().join(', ')}`);
    
    return finalCombinedData;
}

function buildStandaloneHTML() {
    try {
        console.log('\n=== Building Standalone HTML ===');
        
        const combinedDataPath = path.join(__dirname, '..', 'Parsed', 'combinedSpellFeatData.json');
        const notFoundDataPath = path.join(__dirname, '..', 'Parsed', 'notFound.json');
        const blacklistPath = path.join(__dirname, '..', 'Parsed', 'blacklist.json');
        const htmlTemplatePath = path.join(__dirname, '..', 'sequenceBuilder.html');
        
        const combinedData = JSON.parse(fs.readFileSync(combinedDataPath, 'utf-8'));
        const notFoundData = JSON.parse(fs.readFileSync(notFoundDataPath, 'utf-8'));
        const blacklist = JSON.parse(fs.readFileSync(blacklistPath, 'utf-8'));
        const htmlTemplate = fs.readFileSync(htmlTemplatePath, 'utf-8');
        
        const dataInjection = `
        const COMBINED_DATA = ${JSON.stringify(combinedData)};
        const NOT_FOUND_DATA = ${JSON.stringify(notFoundData)};
        const BLACKLIST = ${JSON.stringify(blacklist.blacklistedGroups)};

        `;
        
        const modifiedHtml = htmlTemplate.replace(
            /(\/\/ Load data with custom path support\s+async function loadData\(\))/,
            `${dataInjection}$1`
        );
        
        const outputPath = path.join(__dirname, '..', 'sequenceBuilder_standalone.html');
        fs.writeFileSync(outputPath, modifiedHtml);
        
        console.log(`Built standalone HTML: ${path.basename(outputPath)}`);
        console.log('This file can be opened directly in a browser without a web server.');
    } catch (error) {
        console.error('Error building standalone HTML:', error.message);
    }
}

if (require.main === module) {
    try {
        combineSpellFeatData();
        buildStandaloneHTML();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

module.exports = { combineSpellFeatData, parseSpellFeatIDs, parseXMLData };

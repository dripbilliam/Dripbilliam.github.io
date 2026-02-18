const fs = require('fs');
const path = require('path');

function parseDirectDamageData(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    const combatData = {};
    let inDataSection = false;
    
    for (const line of lines) {
        if (line.startsWith('Spell\t')) {
            inDataSection = true;
            continue;
        }
        
        if (!inDataSection || !line.trim()) continue;
        
        const parts = line.split('\t');
        if (parts.length < 2) continue;
        
        const spellName = parts[0].trim();
        if (!spellName) continue;
        
        combatData[spellName] = {
            innateLevel: (parts[1] || '').trim(),
            range: (parts[2] || '').trim(),
            saves: (parts[3] || '').trim(),
            effects: (parts[4] || '').trim(),
            spellResistanceNote: (parts[5] || '').trim(),
            damageFormula: (parts[6] || '').trim(),
            damageType: (parts[7] || '').trim(),
            maxDamage: (parts[8] || '').trim(),
            avgDamage: (parts[9] || '').trim(),
            aoeType: (parts[10] || '').trim(),
            isDirect: true
        };
    }
    
    return combatData;
}

function parseAoEData(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    const aoeData = {};
    let inDataSection = false;
    
    for (const line of lines) {
        if (line.includes('AoE Spells\t')) {
            inDataSection = true;
            continue;
        }
        
        if (!inDataSection || !line.trim()) continue;
        
        const parts = line.split('\t');
        if (parts.length < 2) continue;
        
        const spellName = parts[0].trim();
        if (!spellName) continue;
        
        aoeData[spellName] = {
            innateLevel: (parts[1] || '').trim(),
            checkTiming: (parts[2] || '').trim(),
            speedReduction: (parts[3] || '').trim(),
            isPersistentAoE: true
        };
    }
    
    return aoeData;
}

function normalizeName(name) {
    return name
        .toLowerCase()
        .replace(/'/g, '')
        .replace(/\//g, ' ')
        .replace(/ and /g, ' ')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function generateCombatDataJSON() {
    console.log('Parsing combat data files...');
    
    const directDmgPath = path.join(__dirname, '..', 'docs', 'DirectDmginfo.txt');
    const aoePath = path.join(__dirname, '..', 'docs', 'AOEDmgInfo.txt');
    
    let directData = {};
    let aoeData = {};
    
    try {
        directData = parseDirectDamageData(directDmgPath);
        console.log(`Parsed ${Object.keys(directData).length} direct damage spells`);
    } catch (e) {
        console.warn('Could not parse DirectDmginfo.txt:', e.message);
    }
    
    try {
        aoeData = parseAoEData(aoePath);
        console.log(`Parsed ${Object.keys(aoeData).length} persistent AoE spells`);
    } catch (e) {
        console.warn('Could not parse AOEDmgInfo.txt:', e.message);
    }
    
    const combinedData = {};
    

    for (const [name, data] of Object.entries(directData)) {
        const normalized = normalizeName(name);
        combinedData[normalized] = {
            originalName: name,
            ...data
        };
    }
    
    for (const [name, data] of Object.entries(aoeData)) {
        const normalized = normalizeName(name);
        if (combinedData[normalized]) {
            combinedData[normalized] = {
                ...combinedData[normalized],
                ...data
            };
        } else {
            combinedData[normalized] = {
                originalName: name,
                ...data
            };
        }
    }
    
    const outputPath = path.join(__dirname, 'combatData.json');
    fs.writeFileSync(outputPath, JSON.stringify(combinedData, null, 2));
    console.log(`\nWrote ${Object.keys(combinedData).length} combat data entries to ${outputPath}`);
    
    return combinedData;
}

if (require.main === module) {
    try {
        generateCombatDataJSON();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

module.exports = { generateCombatDataJSON, normalizeName };

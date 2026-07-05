const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log('  Arelith Spell Tools - Full Rebuild');
console.log('========================================\n');

const { combineSpellFeatData, buildStandaloneHTML } = require('./Website/parsing/parseSpellsAndFeats.js');
const { parseBardSongTablesFromXml, writeParsedOutput } = require('./Website/parsing/parseBardSongTables.js');
const { generateCombatDataJSON } = require('./SpellSearch/parseCombatData.js');
const { parseEnhancedSpellData } = require('./SpellSearch/parseSpellsEnhanced.js');
const { buildStandaloneSpellSearch } = require('./SpellSearch/buildStandalone.js');

async function rebuild() {
    try {
        console.log('Step 1: Building Sequence Builder data...');
        console.log('==========================================');
        combineSpellFeatData();
        const bardSongData = parseBardSongTablesFromXml();
        writeParsedOutput(bardSongData);
        buildStandaloneHTML();
        
        console.log('\nStep 2: Parsing combat data...');
        console.log('======================================');
        generateCombatDataJSON();
        
        console.log('\nStep 3: Building Spell Search data...');
        console.log('======================================');
        parseEnhancedSpellData();
        
        console.log('\nStep 4: Building standalone HTML files...');
        console.log('==========================================');
        buildStandaloneSpellSearch();
        
        console.log('\n========================================');
        console.log('  ✓ Full Rebuild Complete!');
        console.log('========================================');
        console.log('\nGenerated files:');
        console.log('  - Website/Parsed/combinedSpellFeatData.json');
        console.log('  - Website/Parsed/bardSongTables.json');
        console.log('  - Website/Parsed/notFound.json');
        console.log('  - Website/sequenceBuilder_standalone.html');
        console.log('  - SpellSearch/combatData.json');
        console.log('  - SpellSearch/enhancedSpellData.json');
        console.log('  - SpellSearch/spellSearch_standalone.html');
        console.log('\nReady for GitHub Pages deployment!');
        
    } catch (error) {
        console.error('\n❌ Rebuild failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

rebuild();

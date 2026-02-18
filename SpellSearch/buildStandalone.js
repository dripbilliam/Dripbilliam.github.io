const fs = require('fs');
const path = require('path');

function buildStandaloneSpellSearch() {
    try {
        console.log('\n=== Building Standalone Spell Search ===');
        
        const spellDataPath = path.join(__dirname, 'enhancedSpellData.json');
        const htmlTemplatePath = path.join(__dirname, 'spellSearch.html');
        
        if (!fs.existsSync(spellDataPath)) {
            console.error('Error: enhancedSpellData.json not found!');
            console.error('Please run parseSpellsEnhanced.js first to generate the spell data.');
            process.exit(1);
        }
        
        const spellData = JSON.parse(fs.readFileSync(spellDataPath, 'utf-8'));
        const htmlTemplate = fs.readFileSync(htmlTemplatePath, 'utf-8');
        
        console.log(`Loaded ${spellData.length} spells from enhancedSpellData.json`);
        
        const outputPath = path.join(__dirname, 'spellSearch_standalone.html');
        fs.writeFileSync(outputPath, htmlTemplate);
        
        console.log(`Built standalone HTML: ${path.basename(outputPath)}`);
        console.log(`File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
        console.log('This file loads data from enhancedSpellData.json');
        console.log('For GitHub Pages, ensure enhancedSpellData.json is in the SpellSearch/ folder');
    } catch (error) {
        console.error('Error building standalone HTML:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    buildStandaloneSpellSearch();
}

module.exports = { buildStandaloneSpellSearch };

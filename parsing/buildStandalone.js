const fs = require('fs');
const path = require('path');

console.log('Building sequence builder with embedded data...');

const combinedData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'Parsed', 'combinedSpellFeatData.json'), 'utf-8'));
const notFoundData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'Parsed', 'notFound.json'), 'utf-8'));
const blacklist = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'Parsed', 'blacklist.json'), 'utf-8'));

console.log(`Loaded ${combinedData.length} combined entries`);
console.log(`Loaded ${notFoundData.length} not found entries`);
console.log(`Loaded ${blacklist.blacklistedGroups.length} blacklisted groups`);

const htmlTemplate = fs.readFileSync(path.join(__dirname, '..', 'SequenceBuilder', 'sequenceBuilder.html'), 'utf-8');

const modifiedHtml = htmlTemplate.replace(
    /\/\/ Load data\s+async function loadData\(\) \{[\s\S]*?\}\s+catch \(error\) \{[\s\S]*?\}\s+\}/,
    `const COMBINED_DATA = ${JSON.stringify(combinedData)};
        const NOT_FOUND_DATA = ${JSON.stringify(notFoundData)};
        const BLACKLIST = ${JSON.stringify(blacklist.blacklistedGroups)};

        async function loadData() {
            try {
                allData = COMBINED_DATA;
                notFoundData = NOT_FOUND_DATA;

                const combinedForDisplay = [
                    ...allData,
                    ...notFoundData.map(item => ({
                        id: item.id,
                        name: item.name,
                        type: 'unknown',
                        group: item.group,
                        classes: [],
                        school: '',
                        innateLevel: '',
                        descriptors: '',
                        prerequisites: ''
                    }))
                ];

                allData = combinedForDisplay;
                
                displaySpells(allData);
                updateStats();
            } catch (error) {
                document.getElementById('spellList').innerHTML = 
                    '<div class="empty-state">Error loading data.</div>';
                console.error('Error loading data:', error);
            }
        }`
);

const outputPath = path.join(__dirname, '..', 'SequenceBuilder', 'sequenceBuilder_standalone.html');
fs.writeFileSync(outputPath, modifiedHtml);

console.log(`\nBuilt standalone HTML: ${outputPath}`);
console.log('This file can be opened directly in a browser without a web server.');

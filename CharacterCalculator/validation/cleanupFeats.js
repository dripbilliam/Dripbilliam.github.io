const fs = require('fs');
const path = require('path');

// Read the feats.json file
const featsPath = path.join(__dirname, 'feats.json');
const featsData = JSON.parse(fs.readFileSync(featsPath, 'utf8'));

let changesCount = {
  givenRemoved: 0,
  repeatableAdded: 0,
  repeatableCountAdded: 0,
  levelGateAdded: 0
};

// Process each feat
Object.values(featsData).forEach(feat => {
  if (feat.requirements) {
    // Remove "given" field
    if (feat.requirements.hasOwnProperty('given')) {
      delete feat.requirements.given;
      changesCount.givenRemoved++;
    }

    // Add repeatable if missing
    if (!feat.requirements.hasOwnProperty('repeatable')) {
      feat.requirements.repeatable = false;
      changesCount.repeatableAdded++;
    }

    // Add repeatableCount if missing
    if (!feat.requirements.hasOwnProperty('repeatableCount')) {
      feat.requirements.repeatableCount = 0;
      changesCount.repeatableCountAdded++;
    }

    // Add levelGate if missing
    if (!feat.requirements.hasOwnProperty('levelGate')) {
      feat.requirements.levelGate = null;
      changesCount.levelGateAdded++;
    }
  }
});

// Write back to file with proper formatting
fs.writeFileSync(featsPath, JSON.stringify(featsData, null, 2) + '\n');

console.log('=== CLEANUP COMPLETE ===\n');
console.log(`Feats "given" field removed: ${changesCount.givenRemoved}`);
console.log(`Feats "repeatable" field added: ${changesCount.repeatableAdded}`);
console.log(`Feats "repeatableCount" field added: ${changesCount.repeatableCountAdded}`);
console.log(`Feats "levelGate" field added: ${changesCount.levelGateAdded}`);
console.log('\nFile saved to feats.json');

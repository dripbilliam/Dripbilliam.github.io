const fs = require('fs');
const classData = require('./classData.json');
const featsData = require('./feats.json');

// Helper to normalize feat name
const normalizeFeat = (feat) => {
  if (typeof feat === 'string') return feat.toLowerCase();
  if (typeof feat === 'object' && feat.name) return feat.name.toLowerCase();
  return String(feat).toLowerCase();
};

// Helper to extract individual feats from objects (handles anyOf, etc.)
const extractFeats = (feat) => {
  if (typeof feat === 'string') {
    return [feat];
  }
  if (typeof feat === 'object' && feat !== null) {
    // Handle anyOf structures
    if (feat.type === 'anyOf' && Array.isArray(feat.values)) {
      return feat.values.flatMap(v => extractFeats(v));
    }
    // Handle objects with a name property
    if (feat.name) {
      return [feat.name];
    }
  }
  return [];
};

// Collect all feat names from classData and track their sources
const featsInClasses = new Map(); // Maps normalized feat name to array of sources

Object.entries(classData).forEach(([className, classInfo]) => {
  // Check requirements.feats
  if (classInfo.requirements && Array.isArray(classInfo.requirements.feats)) {
    classInfo.requirements.feats.forEach(feat => {
      if (feat) {
        const extractedFeats = extractFeats(feat);
        extractedFeats.forEach(f => {
          const normalized = normalizeFeat(f);
          const source = `${className} > requirements.feats`;
          if (!featsInClasses.has(normalized)) {
            featsInClasses.set(normalized, []);
          }
          featsInClasses.get(normalized).push({ source, original: f });
        });
      }
    });
  }
  
  // Check unavailableFeats
  if (Array.isArray(classInfo.unavailableFeats)) {
    classInfo.unavailableFeats.forEach(feat => {
      if (feat) {
        const extractedFeats = extractFeats(feat);
        extractedFeats.forEach(f => {
          const normalized = normalizeFeat(f);
          const source = `${className} > unavailableFeats`;
          if (!featsInClasses.has(normalized)) {
            featsInClasses.set(normalized, []);
          }
          featsInClasses.get(normalized).push({ source, original: f });
        });
      }
    });
  }
  
  // Check epicBonusFeats
  if (Array.isArray(classInfo.epicBonusFeats)) {
    classInfo.epicBonusFeats.forEach(feat => {
      if (feat) {
        const extractedFeats = extractFeats(feat);
        extractedFeats.forEach(f => {
          const normalized = normalizeFeat(f);
          const source = `${className} > epicBonusFeats`;
          if (!featsInClasses.has(normalized)) {
            featsInClasses.set(normalized, []);
          }
          featsInClasses.get(normalized).push({ source, original: f });
        });
      }
    });
  }
  
  // Check bonusFeats if exists
  if (Array.isArray(classInfo.bonusFeats)) {
    classInfo.bonusFeats.forEach(feat => {
      if (feat) {
        const extractedFeats = extractFeats(feat);
        extractedFeats.forEach(f => {
          const normalized = normalizeFeat(f);
          const source = `${className} > bonusFeats`;
          if (!featsInClasses.has(normalized)) {
            featsInClasses.set(normalized, []);
          }
          featsInClasses.get(normalized).push({ source, original: f });
        });
      }
    });
  }
  
  // Check availableFeats if exists
  if (Array.isArray(classInfo.availableFeats)) {
    classInfo.availableFeats.forEach(feat => {
      if (feat) {
        const extractedFeats = extractFeats(feat);
        extractedFeats.forEach(f => {
          const normalized = normalizeFeat(f);
          const source = `${className} > availableFeats`;
          if (!featsInClasses.has(normalized)) {
            featsInClasses.set(normalized, []);
          }
          featsInClasses.get(normalized).push({ source, original: f });
        });
      }
    });
  }
});

// Get all feat names from feats.json
const featsInJson = new Set(Object.keys(featsData).map(key => key.toLowerCase()));

// Find mismatches with sources
const mismatchesWithSources = [];
featsInClasses.forEach((sources, feat) => {
  if (!featsInJson.has(feat)) {
    mismatchesWithSources.push({
      feat: feat,
      sources: sources
    });
  }
});

// Create report object
const report = {
  summary: {
    totalFeatsInClasses: featsInClasses.size,
    totalFeatsInFeatsJson: featsInJson.size,
    totalMismatches: mismatchesWithSources.length,
    timestamp: new Date().toISOString()
  },
  mismatchesWithSources: mismatchesWithSources.map(m => ({
    feat: m.feat,
    count: m.sources.length,
    sources: m.sources
  }))
};

// Console output
console.log('Total unique feats referenced in classData.json:', featsInClasses.size);
console.log('Total feats in feats.json:', featsInJson.size);
console.log('\n=== MISMATCH REPORT ===');
console.log('Number of mismatches:', mismatchesWithSources.length);
console.log('\nFeats in classes but MISSING from feats.json:\n');
mismatchesWithSources.sort((a, b) => a.feat.localeCompare(b.feat)).forEach(m => {
  console.log(`  [${m.sources.length}x] ${m.feat}`);
  m.sources.forEach(s => {
    console.log(`      - ${s.source}`);
    if (typeof s.original === 'object') {
      console.log(`        (object: ${JSON.stringify(s.original)})`);
    }
  });
});

// Save to file
const outputFile = './featMismatches.json';
fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));
console.log(`\n✓ Report saved to ${outputFile}`);

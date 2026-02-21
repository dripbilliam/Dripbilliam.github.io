const fs = require('fs');
const path = require('path');

// Read the feats.json file
const featsPath = path.join(__dirname, 'feats.json');
const featsData = JSON.parse(fs.readFileSync(featsPath, 'utf8'));

console.log('=== FEATS JSON SCHEMA VALIDATION ===\n');

// Track schema information
const schemaInfo = {
  totalFeats: 0,
  topLevelFields: new Set(),
  requirementFields: new Set(),
  effectsFields: new Set(),
  sourceFields: new Set(),
  fieldsByFeat: {},
  specialFields: new Set(), // Fields that don't exist in all feats
  anyOfLocations: [],
  inconsistencies: []
};

// Analyze each feat
Object.entries(featsData).forEach(([featName, featData]) => {
  schemaInfo.totalFeats++;
  schemaInfo.fieldsByFeat[featName] = {
    topLevel: Object.keys(featData),
    requirements: featData.requirements ? Object.keys(featData.requirements) : [],
    effects: featData.effects ? Object.keys(featData.effects) : [],
    source: featData.source ? Object.keys(featData.source) : []
  };

  // Collect top level fields
  Object.keys(featData).forEach(field => schemaInfo.topLevelFields.add(field));

  // Collect and analyze requirements
  if (featData.requirements) {
    Object.keys(featData.requirements).forEach(field => {
      schemaInfo.requirementFields.add(field);
      
      // Check for anyOf patterns in requirements
      if (typeof featData.requirements[field] === 'object' && 
          featData.requirements[field] !== null &&
          featData.requirements[field].type === 'anyOf') {
        schemaInfo.anyOfLocations.push({
          feat: featName,
          location: `requirements.${field}`,
          value: featData.requirements[field]
        });
      }
    });
  }

  // Collect and analyze effects
  if (featData.effects) {
    Object.keys(featData.effects).forEach(field => {
      schemaInfo.effectsFields.add(field);
      
      // Check for anyOf patterns in effects
      if (typeof featData.effects[field] === 'object' && 
          featData.effects[field] !== null &&
          featData.effects[field].type === 'anyOf') {
        schemaInfo.anyOfLocations.push({
          feat: featName,
          location: `effects.${field}`,
          value: featData.effects[field]
        });
      }
    });
  }

  // Collect source fields
  if (featData.source) {
    Object.keys(featData.source).forEach(field => schemaInfo.sourceFields.add(field));
  }
});

// Report findings
console.log(`Total Feats: ${schemaInfo.totalFeats}\n`);

console.log('=== TOP-LEVEL FIELDS ===');
console.log(Array.from(schemaInfo.topLevelFields).sort());

console.log('\n=== REQUIREMENTS FIELDS ===');
console.log(Array.from(schemaInfo.requirementFields).sort());

console.log('\n=== EFFECTS FIELDS ===');
console.log(Array.from(schemaInfo.effectsFields).sort());

console.log('\n=== SOURCE FIELDS ===');
console.log(Array.from(schemaInfo.sourceFields).sort());

// Check for field consistency in requirements
console.log('\n=== FIELD CONSISTENCY CHECK ===\n');

const expectedRequirementFields = Array.from(schemaInfo.requirementFields).sort();
const expectedEffectsFields = Array.from(schemaInfo.effectsFields).sort();

let requirementInconsistencies = 0;
let effectsInconsistencies = 0;
let missingFields = {};

Object.entries(schemaInfo.fieldsByFeat).forEach(([featName, fields]) => {
  // Check requirements
  const missingReq = expectedRequirementFields.filter(f => !fields.requirements.includes(f));
  if (missingReq.length > 0) {
    if (!missingFields[featName]) missingFields[featName] = { requirements: [], effects: [] };
    missingFields[featName].requirements = missingReq;
    requirementInconsistencies++;
  }

  // Check effects
  const missingEff = expectedEffectsFields.filter(f => !fields.effects.includes(f));
  if (missingEff.length > 0) {
    if (!missingFields[featName]) missingFields[featName] = { requirements: [], effects: [] };
    missingFields[featName].effects = missingEff;
    effectsInconsistencies++;
  }
});

console.log(`Feats with inconsistent requirements: ${requirementInconsistencies}`);
console.log(`Feats with inconsistent effects: ${effectsInconsistencies}`);

if (requirementInconsistencies > 0 || effectsInconsistencies > 0) {
  console.log('\nMissing Fields by Feat:');
  Object.entries(missingFields).forEach(([featName, missing]) => {
    if (missing.requirements.length > 0 || missing.effects.length > 0) {
      console.log(`  ${featName}:`);
      if (missing.requirements.length > 0) {
        console.log(`    Missing requirements: ${missing.requirements.join(', ')}`);
      }
      if (missing.effects.length > 0) {
        console.log(`    Missing effects: ${missing.effects.join(', ')}`);
      }
    }
  });
}

// Check for anyOf patterns
console.log(`\n=== ANYOF PATTERNS FOUND ===`);
console.log(`Total anyOf locations: ${schemaInfo.anyOfLocations.length}`);

if (schemaInfo.anyOfLocations.length > 0) {
  console.log('\nDetails:');
  schemaInfo.anyOfLocations.forEach((loc, idx) => {
    console.log(`\n${idx + 1}. ${loc.feat}`);
    console.log(`   Location: ${loc.location}`);
    console.log(`   Value: ${JSON.stringify(loc.value, null, 2)}`);
  });
}

// Detailed field type analysis
console.log('\n=== DETAILED FIELD TYPE ANALYSIS ===\n');

console.log('Requirements Fields Type Consistency:');
Array.from(schemaInfo.requirementFields).forEach(field => {
  const types = new Set();
  Object.values(schemaInfo.fieldsByFeat).forEach(fields => {
    if (fields.requirements.includes(field)) {
      const idx = Object.keys(featsData).findIndex(feat => 
        Object.keys(featsData[feat].requirements || {}).includes(field)
      );
      if (idx !== -1) {
        const featKey = Object.keys(featsData)[idx];
        const value = featsData[featKey].requirements[field];
        const type = Array.isArray(value) ? 'array' :
                     value === null ? 'null' :
                     typeof value;
        types.add(type);
      }
    }
  });
  
  if (types.size > 1) {
    console.log(`  ⚠️  ${field}: ${Array.from(types).join(', ')}`);
  } else {
    console.log(`  ✓ ${field}: ${Array.from(types)[0]}`);
  }
});

console.log('\nEffects Fields Type Consistency:');
Array.from(schemaInfo.effectsFields).forEach(field => {
  const types = new Set();
  Object.values(schemaInfo.fieldsByFeat).forEach(fields => {
    if (fields.effects.includes(field)) {
      const idx = Object.keys(featsData).findIndex(feat => 
        Object.keys(featsData[feat].effects || {}).includes(field)
      );
      if (idx !== -1) {
        const featKey = Object.keys(featsData)[idx];
        const value = featsData[featKey].effects[field];
        const type = Array.isArray(value) ? 'array' :
                     value === null ? 'null' :
                     typeof value;
        types.add(type);
      }
    }
  });
  
  if (types.size > 1) {
    console.log(`  ⚠️  ${field}: ${Array.from(types).join(', ')}`);
  } else {
    console.log(`  ✓ ${field}: ${Array.from(types)[0]}`);
  }
});

console.log('\n=== VALIDATION SUMMARY ===');
const totalIssues = requirementInconsistencies + effectsInconsistencies + 
                   (schemaInfo.anyOfLocations.length > 0 ? 1 : 0);
console.log(`Total Schema Issues: ${totalIssues}`);
console.log(`Status: ${totalIssues === 0 ? '✓ CLEAN' : '⚠️  NEEDS ATTENTION'}`);

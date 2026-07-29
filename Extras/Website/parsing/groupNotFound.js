const fs = require('fs');
const path = require('path');

/**
 * Extract common prefix from a spell/feat name
 * Looks for patterns like "PREFIX Variation" or "PREFIX_Variation"
 */
function extractGroup(name) {
    // Common patterns to look for:
    // 1. All caps prefix followed by space and word (e.g., "SHADOW CON Darkness")
    // 2. Capitalized word followed by lowercase word and space (e.g., "Shapechange BALOR")
    // 3. Mixed case with underscore or specific pattern (e.g., "ARArrowOfDeath")
    // 4. Prefix followed by number (e.g., "Rage 3")
    
    // Pattern 1: ALL CAPS PREFIX + possible second word + variation
    // e.g., "SHADOW CON Darkness", "BG AURA DESPAIR", "SPELL PACT ABYSSAL 1"
    const allCapsPattern = /^([A-Z][A-Z\s]+?)(?=[A-Z][a-z]|\d|\b)/;
    let match = allCapsPattern.exec(name);
    if (match) {
        const prefix = match[1].trim();
        // If it's more than one word, take up to 2-3 words
        const words = prefix.split(/\s+/);
        if (words.length >= 2) {
            return words.slice(0, 3).join(' ');
        }
    }
    
    // Pattern 2: Initial caps word(s) followed by space and variation
    // e.g., "Shapechange BALOR", "Polymorph GIANT SPIDER", "Undead Shape risen lord"
    const mixedPattern = /^([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s+/;
    match = mixedPattern.exec(name);
    if (match) {
        return match[1].trim();
    }
    
    // Pattern 2a: CamelCase word followed by space and variation
    // e.g., "GWildShape DriderDarkness", "BalefulPolymorph BADGER"
    const camelCasePattern = /^([A-Z][a-zA-Z]+)\s+/;
    match = camelCasePattern.exec(name);
    if (match && /[a-z]/.test(match[1]) && /[A-Z].*[A-Z]/.test(match[1])) {
        // Ensure it has both lowercase and multiple uppercase (true camelCase)
        return match[1].trim();
    }
    
    // Pattern 3: Prefix with underscore or camelCase
    // e.g., "ARArrowOfDeath", "ASEtheralVis", "BGCreateDead"
    const prefixPattern = /^([A-Z]{2,})[A-Z][a-z]/;
    match = prefixPattern.exec(name);
    if (match) {
        return match[1];
    }
    
    // Pattern 4: Word followed by number
    // e.g., "Rage 3", "Rage 4"
    const numberPattern = /^(.+?)\s+\d+$/;
    match = numberPattern.exec(name);
    if (match) {
        return match[1].trim();
    }
    
    // Pattern 5: Compound words with specific separators
    // e.g., "BalefulPolymorph BAT", "Wild Shape BADGER"
    const compoundPattern = /^(.+?)(?:[A-Z]{2,}|[A-Z][a-z]+)$/;
    match = compoundPattern.exec(name);
    if (match && match[1].length > 3) {
        return match[1].trim();
    }
    
    // Pattern 6: Domain Power variations
    if (name.startsWith('Domain Power')) {
        return 'Domain Power';
    }
    
    // Pattern 7: Warlock variations
    if (name.startsWith('WARLOCK')) {
        // Group by second word
        const warlockMatch = /^(WARLOCK\s+[A-Z]+)/.exec(name);
        if (warlockMatch) {
            return warlockMatch[1];
        }
        return 'WARLOCK';
    }
    
    // Pattern 8: SPELL prefix
    if (name.startsWith('SPELL ')) {
        // Try to get more specific category
        const spellMatch = /^(SPELL\s+[A-Z]+(?:\s+[A-Z]+)?)/.exec(name);
        if (spellMatch) {
            const spellPrefix = spellMatch[1];
            // Group common spell types
            if (spellPrefix.includes('DIRGE')) return 'SPELL DIRGE';
            if (spellPrefix.includes('PACT')) return 'SPELL PACT';
            if (spellPrefix.includes('ELDRITCH')) return 'SPELL ELDRITCH';
            if (spellPrefix.includes('MASS ZOO')) return 'SPELL MASS ZOO';
            if (spellPrefix.includes('DARK INVOCATION')) return 'SPELL DARK INVOCATION';
        }
        return 'SPELL';
    }
    
    // Default: no group (single item)
    return null;
}

/**
 * Group items by their common prefix
 */
function groupNotFoundItems(items) {
    const groups = new Map();
    const ungrouped = [];
    
    for (const item of items) {
        const group = extractGroup(item.name);
        
        if (group) {
            if (!groups.has(group)) {
                groups.set(group, []);
            }
            groups.get(group).push({
                ...item,
                group: group
            });
        } else {
            ungrouped.push({
                ...item,
                group: null
            });
        }
    }
    
    // Filter out groups with only 1 item - treat them as ungrouped
    const finalGroups = new Map();
    for (const [groupName, items] of groups) {
        if (items.length > 1) {
            finalGroups.set(groupName, items);
        } else {
            ungrouped.push({...items[0], group: null});
        }
    }
    
    return {
        groups: finalGroups,
        ungrouped: ungrouped
    };
}

/**
 * Main function
 */
function processNotFound() {
    console.log('Processing notFound items...');
    
    const notFoundPath = path.join(__dirname, '..', 'Parsed', 'notFound.json');
    const notFoundItems = JSON.parse(fs.readFileSync(notFoundPath, 'utf-8'));
    
    console.log(`Total notFound items: ${notFoundItems.length}`);
    
    const { groups, ungrouped } = groupNotFoundItems(notFoundItems);
    
    // Create grouped structure
    const groupedData = {
        summary: {
            total: notFoundItems.length,
            grouped: Array.from(groups.values()).flat().length,
            ungrouped: ungrouped.length,
            groupCount: groups.size
        },
        groups: Array.from(groups.entries()).map(([name, items]) => ({
            groupName: name,
            count: items.length,
            items: items
        })).sort((a, b) => b.count - a.count), // Sort by count descending
        ungrouped: ungrouped.sort((a, b) => a.name.localeCompare(b.name))
    };
    
    // Write grouped data
    const outputPath = path.join(__dirname, '..', 'Parsed', 'notFoundGrouped.json');
    fs.writeFileSync(outputPath, JSON.stringify(groupedData, null, 2));
    
    console.log(`\n=== Grouping Results ===`);
    console.log(`Total items: ${groupedData.summary.total}`);
    console.log(`Grouped items: ${groupedData.summary.grouped}`);
    console.log(`Ungrouped items: ${groupedData.summary.ungrouped}`);
    console.log(`Number of groups: ${groupedData.summary.groupCount}`);
    
    console.log(`\n=== Top 20 Groups ===`);
    groupedData.groups.slice(0, 20).forEach((group, idx) => {
        console.log(`${idx + 1}. ${group.groupName}: ${group.count} items`);
    });
    
    console.log(`\nGrouped data written to: ${outputPath}`);
    
    // Also create a flat version with group tags
    const flatWithGroups = notFoundItems.map(item => {
        const group = extractGroup(item.name);
        // Only set group if it has multiple items
        const groupItems = groups.get(group);
        return {
            ...item,
            group: groupItems && groupItems.length > 1 ? group : null
        };
    });
    
    const flatOutputPath = path.join(__dirname, '..', 'Parsed', 'notFoundWithGroups.json');
    fs.writeFileSync(flatOutputPath, JSON.stringify(flatWithGroups, null, 2));
    console.log(`Flat version with groups written to: ${flatOutputPath}`);
    
    return groupedData;
}

// Run the processor
if (require.main === module) {
    try {
        processNotFound();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

module.exports = { groupNotFoundItems, extractGroup };

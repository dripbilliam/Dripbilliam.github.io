# Arelith Spell Search & Filter

An advanced spell database tool for Neverwinter Nights: Arelith with comprehensive filtering capabilities.

## Features

- **Search by Name** - Quickly find spells by typing their name
- **Filter by School** - Abjuration, Conjuration, Divination, Enchantment, Evocation, Illusion, Necromancy, Transmutation
- **Filter by Class** - Find spells available to specific classes and their domains
- **Filter by Level** - 0 (Cantrips) through 9
- **Filter by Damage Type** - Acid, Cold, Fire, Electricity, Sonic, Negative, Positive, Divine, and more
- **Filter by Duration** - Instantaneous, Rounds, Turns, Hours, Permanent, etc.
- **Filter by Range** - Personal, Touch, Short, Medium, Long
- **Filter by Save Type** - Fortitude, Reflex, Will, or None
- **Filter by Tags** - Mind-affecting, Evil, Chaos, Fear, Death, and many more
- **Spell Resistance Filter** - Find only spells that allow spell resistance

## Files

- **parseSpellsEnhanced.js** - Parser that extracts detailed spell data from Arelith Wiki XML files
- **enhancedSpellData.json** - Database containing 356 spells with enhanced metadata
- **spellSearch.html** - Main HTML interface (requires web server or GitHub Pages)
- **spellSearch_standalone.html** - Self-contained version with embedded data (works offline)
- **buildStandalone.js** - Script to generate the standalone version

## Usage

### For GitHub Pages Deployment

Use `spellSearch_standalone.html` - it will automatically:
1. Try to load from GitHub Pages (https://raw.githubusercontent.com/...)
2. Fall back to local JSON file if needed
3. Use embedded data as final fallback

### For Local Development

You can use either version:
- `spellSearch.html` - Loads data from `enhancedSpellData.json`
- `spellSearch_standalone.html` - Has data embedded, works without a server

## Building

To regenerate all data files:

```bash
# From the root directory
node rebuild.js
```

Or build just the spell search:

```bash
node SpellSearch/parseSpellsEnhanced.js
node SpellSearch/buildStandalone.js
```

## Data Structure

Each spell in the database includes:

```json
{
  "id": "0",
  "name": "Spell Name",
  "originalName": "Spell Name",
  "school": "Evocation",
  "innateLevel": "3",
  "classes": [
    {
      "class": "Wizard",
      "domain": null,
      "level": 3
    }
  ],
  "descriptors": "Fire",
  "components": "Verbal, Somatic",
  "range": "Medium (20 meters)",
  "rangeCategory": "Medium",
  "areaOfEffect": "Single",
  "aoeCategory": "Single Target",
  "duration": "Instantaneous",
  "durationType": "Instantaneous",
  "saves": "Reflex 1/2",
  "saveType": "Reflex",
  "spellResistance": "Yes",
  "hasSpellResistance": true,
  "damageTypes": ["Fire"],
  "tags": ["Fire"],
  "description": "Full spell description..."
}
```

## Data Source

All spell data is parsed from the official Arelith Wiki XML exports:
- `docs/ArelithSpellsandFeats.xml`
- `docs/ArelithClassData.xml`



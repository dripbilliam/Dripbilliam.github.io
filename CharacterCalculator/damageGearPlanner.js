(function () {
    const SLOT_CONFIG = [
        { key: 'mainHand', label: 'Main Hand', category: 'weapon' },
        { key: 'offHand', label: 'Off Hand', category: 'offhand' },
        { key: 'head', label: 'Head', category: 'head' },
        { key: 'chest', label: 'Chest', category: 'chest' },
        { key: 'cloak', label: 'Cloak', category: 'cloak' },
        { key: 'belt', label: 'Belt', category: 'belt' },
        { key: 'gloves', label: 'Gloves/Bracer', category: 'gloves' },
        { key: 'ring1', label: 'Ring 1', category: 'ring' },
        { key: 'ring2', label: 'Ring 2', category: 'ring' },
        { key: 'necklace', label: 'Necklace', category: 'necklace' },
        { key: 'boots', label: 'Boots', category: 'boots' }
    ];

    const PROPERTY_TYPES = [
        'Ability',
        'Armor',
        'Armor vs Damage type/Race/Alignment',
        'Enhancement',
        'Enhancement vs Alignment/Race',
        'Weight Reduction',
        'Bonus Spell Slots',
        'Damage',
        'Damage vs Alignment/Race/Alignment',
        'Damage Immunity',
        'Damage Vulnerability',
        'Damage Reduction',
        'Damage Resist',
        'Darkvision',
        'Spell Resistance',
        'Specific Saving Throws',
        'General Saving Throws',
        'Keen',
        'Light',
        'Mighty',
        'Regeneration',
        'Skill',
        'Attack Bonus',
        'Attack Bonus vs Alignment/Race/Alignment',
        'Vampiric Regeneration',
        'Massive Criticals',
        'Granted Feat'
    ];

    const SPELL_SLOT_COSTS = { 1: 1, 2: 2, 3: 3, 4: 6, 5: 8, 6: 10, 7: 14, 8: 16, 9: 18 };
    const SPELL_SLOT_CLASS_RANGES = {
        Bard: { min: 1, max: 3 },
        Cleric: { min: 1, max: 4 },
        Druid: { min: 1, max: 4 },
        Paladin: { min: 1, max: 3 },
        Ranger: { min: 1, max: 3 },
        Sorc: { min: 1, max: 4 },
        Wizard: { min: 1, max: 4 },
        'Favored Soul': { min: 1, max: 4 },
        Shaman: { min: 1, max: 4 },
        Warlock: { min: 1, max: 4 },
        Spellsword: { min: 1, max: 4 },
        Harbinger: { min: 1, max: 3 }
    };
    const WEIGHT_REDUCTION_COSTS = { 90: 2, 80: 1 };
    const KEEN_COSTS = {
        '20': 4,
        '19-20': 6,
        '18-20': 8
    };
    const DAMAGE_TYPES = ['Acid', 'Cold', 'Divine', 'Electrical', 'Fire', 'Negative', 'Positive', 'Sonic', 'Poison', 'Entropy', 'Psychic'];
    const SPECIFIC_SAVE_TYPES = [
        { value: 'universal', label: 'Universal' },
        { value: 'acid', label: 'Vs Acid' },
        { value: 'cold', label: 'Vs Cold' },
        { value: 'death', label: 'Vs Death' },
        { value: 'disease', label: 'Vs Disease' },
        { value: 'divine', label: 'Vs Divine' },
        { value: 'electrical', label: 'Vs Electrical' },
        { value: 'fear', label: 'Vs Fear' },
        { value: 'fire', label: 'Vs Fire' },
        { value: 'mind', label: 'Vs Mind Affecting' },
        { value: 'negative', label: 'Vs Negative' },
        { value: 'poison', label: 'Vs Poison' },
        { value: 'positive', label: 'Vs Positive' },
        { value: 'sonic', label: 'Vs Sonic' }
    ];
    const DAMAGE_ADD_MODES = [
        { value: 'flat2', label: '+2' },
        { value: 'd4', label: '+1d4' }
    ];
    const MASSIVE_CRIT_MODES = [
        { value: 'flat4', label: '4' },
        { value: 'd8', label: '1d8' }
    ];
    const WEAPON_FOCUS_GROUPS = [
        'Concussion',
        'Two-Handed',
        'Polearm',
        'One-Handed Edge',
        'Unarmed',
        'Missle'
    ];
    const BASE_WEAPON_DAMAGE_TYPES = [
        'slashing',
        'bludgeoning',
        'piercing',
        'slashing-piercing',
        'bludgeoning-piercing',
        'slashing-bludgeoning'
    ];
    const ITEM_SPECIAL_KEY_OPTIONS = [
        'castSpells',
        'extraMeleeDamageTypes',
        'extraDamageTypes',
        'aprConditions',
        'weightIncrease',
        'weightReductionText',
        'arcaneSpellFailure',
        'allowedBaseTypes',
        'armorBonusBySubtype',
        'touchAttack',
        'ammoNotes',
        'notes'
    ];
    const ITEM_SPECIAL_KEY_TYPES = {
        castSpells: 'array',
        extraMeleeDamageTypes: 'array',
        extraDamageTypes: 'array',
        aprConditions: 'array',
        weightIncrease: 'string',
        weightReductionText: 'string',
        arcaneSpellFailure: 'string',
        allowedBaseTypes: 'array',
        armorBonusBySubtype: 'object',
        touchAttack: 'boolean',
        ammoNotes: 'array',
        notes: 'array'
    };
    const BASE_WEAPON_DATA = [
        { name: 'Bastard Sword', finesse: 'yes', damage: '1d10', critical: '19-20/x2', damageType: 'slashing', proficiency: 'Exotic, Cavalier', concussion: false, oneHandEdged: true, twoHanded: true, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Battleaxe', finesse: 'no', damage: '1d8', critical: 'x3', damageType: 'slashing', proficiency: 'Martial', concussion: false, oneHandEdged: true, twoHanded: false, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Billhook', finesse: 'no', damage: '1d8', critical: 'x3', damageType: 'slashing', proficiency: 'Martial', concussion: false, oneHandEdged: false, twoHanded: false, polearm: true, unarmed: false, missile: false, thrown: false },
        { name: 'Cane', finesse: 'yes', damage: '1d4/1d4', critical: '19-20/x2', damageType: 'bludgeoning', proficiency: 'Simple, Druid, Monk, Rogue, Wizard', concussion: false, oneHandEdged: false, twoHanded: true, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Cavalry Axe', finesse: 'no', damage: '2d4', critical: 'x3', damageType: 'slashing-piercing', proficiency: 'Exotic, Cavalier', concussion: false, oneHandEdged: true, twoHanded: false, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Cavalry Hammer', finesse: 'no', damage: '2d4', critical: 'x3', damageType: 'bludgeoning-piercing', proficiency: 'Exotic, Cavalier', concussion: true, oneHandEdged: false, twoHanded: false, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Cavalry Sword', finesse: 'no', damage: '2d3', critical: '18-20/x2', damageType: 'slashing-piercing', proficiency: 'Exotic, Cavalier', concussion: false, oneHandEdged: true, twoHanded: false, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Club', finesse: 'no', damage: '1d6', critical: 'x2', damageType: 'bludgeoning', proficiency: 'Simple, Primitive, Druid, Monk, Rogue, Wizard', concussion: true, oneHandEdged: false, twoHanded: false, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Colossal Axe', finesse: 'no', damage: '2d8', critical: 'x3', damageType: 'slashing', proficiency: 'Martial', concussion: false, oneHandEdged: false, twoHanded: true, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Colossal Hammer', finesse: 'no', damage: '2d8', critical: 'x3', damageType: 'bludgeoning', proficiency: 'Martial', concussion: false, oneHandEdged: false, twoHanded: true, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Colossal Spear', finesse: 'no', damage: '2d6', critical: 'x3', damageType: 'piercing', proficiency: 'Martial', concussion: false, oneHandEdged: false, twoHanded: false, polearm: true, unarmed: false, missile: false, thrown: false },
        { name: 'Colossal Sword', finesse: 'no', damage: '2d8', critical: '19-20/x2', damageType: 'slashing', proficiency: 'Martial', concussion: false, oneHandEdged: false, twoHanded: true, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Dagger', finesse: 'yes', damage: '1d4', critical: '19-20/x2', damageType: 'piercing', proficiency: 'Simple, Druid, Monk, Rogue, Wizard', concussion: false, oneHandEdged: true, twoHanded: false, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Dart', finesse: 'na', damage: '1d4', critical: 'x2', damageType: 'piercing', proficiency: 'Simple, Primitive, Druid, Rogue', concussion: false, oneHandEdged: false, twoHanded: false, polearm: false, unarmed: false, missile: false, thrown: true },
        { name: 'Dire Maca', finesse: 'no', damage: '2d6', critical: 'x3', damageType: 'bludgeoning', proficiency: 'Exotic, Primitive', concussion: true, oneHandEdged: true, twoHanded: false, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Dire Mace', finesse: 'no', damage: '1d12/1d12', critical: 'x3', damageType: 'bludgeoning', proficiency: 'Exotic', concussion: false, oneHandEdged: true, twoHanded: true, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Double Axe', finesse: 'no', damage: '3d4/3d4', critical: 'x3', damageType: 'slashing', proficiency: 'Exotic', concussion: false, oneHandEdged: true, twoHanded: true, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Dwarven Waraxe', finesse: 'no', damage: '1d10', critical: 'x3', damageType: 'slashing', proficiency: 'Exotic, Dwarf', concussion: false, oneHandEdged: true, twoHanded: false, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Estoc', finesse: 'yes', damage: '2d4', critical: '18-20/x2', damageType: 'piercing', proficiency: 'Exotic', concussion: false, oneHandEdged: false, twoHanded: true, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Falchion', finesse: 'yes', damage: '2d4', critical: '18-20/x2', damageType: 'slashing', proficiency: 'Exotic', concussion: false, oneHandEdged: false, twoHanded: true, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Great Club', finesse: 'no', damage: '1d10', critical: 'x2', damageType: 'bludgeoning', proficiency: 'Simple, Primitive, Druid', concussion: false, oneHandEdged: false, twoHanded: true, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Greataxe', finesse: 'no', damage: '3d4', critical: 'x3', damageType: 'slashing', proficiency: 'Martial', concussion: false, oneHandEdged: false, twoHanded: true, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Greatsword', finesse: 'no', damage: '2d6', critical: '19-20/x2', damageType: 'slashing', proficiency: 'Martial', concussion: false, oneHandEdged: false, twoHanded: true, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Halberd', finesse: 'no', damage: '1d12', critical: 'x3', damageType: 'slashing-piercing', proficiency: 'Martial', concussion: false, oneHandEdged: false, twoHanded: false, polearm: true, unarmed: false, missile: false, thrown: false },
        { name: 'Handaxe', finesse: 'yes', damage: '1d6', critical: 'x3', damageType: 'slashing', proficiency: 'Martial, Monk, Rogue', concussion: false, oneHandEdged: true, twoHanded: false, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Heavy Crossbow', finesse: 'na', damage: '1d10', critical: '19-20/x2', damageType: 'piercing', proficiency: 'Simple, Monk, Rogue, Wizard', concussion: false, oneHandEdged: false, twoHanded: false, polearm: false, unarmed: false, missile: true, thrown: false },
        { name: 'Heavy Flail', finesse: 'no', damage: '1d12', critical: '19-20/x2', damageType: 'bludgeoning', proficiency: 'Martial, Cavalier', concussion: true, oneHandEdged: true, twoHanded: false, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Heavy Pick', finesse: 'no', damage: '1d8', critical: 'x3', damageType: 'piercing', proficiency: 'Martial', concussion: false, oneHandEdged: true, twoHanded: false, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Hookhammer', finesse: 'yes', damage: '1d8/1d8', critical: 'x3', damageType: 'bludgeoning-piercing', proficiency: 'Exotic, Gnome', concussion: false, oneHandEdged: false, twoHanded: true, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Kama', finesse: 'yes', damage: '1d6', critical: '19-20/x2', damageType: 'slashing', proficiency: 'Exotic, Assassin, Monk', concussion: false, oneHandEdged: true, twoHanded: false, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Katana', finesse: 'yes', damage: '1d10', critical: '19-20/x2', damageType: 'slashing', proficiency: 'Exotic, Monk, Cavalier', concussion: false, oneHandEdged: true, twoHanded: true, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Katar', finesse: 'yes', damage: '2d2', critical: '19-20/x2', damageType: 'slashing-piercing', proficiency: 'Exotic, Assassin, Monk', concussion: false, oneHandEdged: true, twoHanded: false, polearm: false, unarmed: true, missile: false, thrown: false },
        { name: 'Kukri', finesse: 'yes', damage: '1d4', critical: '18-20/x2', damageType: 'slashing', proficiency: 'Exotic', concussion: false, oneHandEdged: true, twoHanded: false, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Lance', finesse: 'no', damage: '1d8', critical: 'x3', damageType: 'piercing', proficiency: 'Martial, Cavalier', concussion: false, oneHandEdged: false, twoHanded: false, polearm: true, unarmed: false, missile: false, thrown: false },
        { name: 'Lance (Small)', finesse: 'no', damage: '1d6', critical: 'x3', damageType: 'piercing', proficiency: 'Martial', concussion: false, oneHandEdged: false, twoHanded: false, polearm: true, unarmed: false, missile: false, thrown: false },
        { name: 'Light Crossbow', finesse: 'na', damage: '1d8', critical: '19-20/x2', damageType: 'piercing', proficiency: 'Simple, Monk, Rogue, Wizard', concussion: false, oneHandEdged: false, twoHanded: false, polearm: false, unarmed: false, missile: true, thrown: false },
        { name: 'Light Flail', finesse: 'yes', damage: '1d6', critical: '19-20/x2', damageType: 'bludgeoning', proficiency: 'Martial, Cavalier', concussion: true, oneHandEdged: false, twoHanded: false, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Light Hammer', finesse: 'yes', damage: '1d6', critical: 'x3', damageType: 'bludgeoning', proficiency: 'Martial', concussion: true, oneHandEdged: false, twoHanded: false, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Light Pick', finesse: 'yes', damage: '1d6', critical: 'x3', damageType: 'piercing', proficiency: 'Martial, Rogue', concussion: false, oneHandEdged: true, twoHanded: false, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Longbow', finesse: 'na', damage: '1d8', critical: 'x3', damageType: 'piercing', proficiency: 'Martial, Elf, Aquatic Elf', concussion: false, oneHandEdged: false, twoHanded: false, polearm: false, unarmed: false, missile: true, thrown: false },
        { name: 'Longsword', finesse: 'yes', damage: '1d8', critical: '19-20/x2', damageType: 'slashing', proficiency: 'Martial, Elf, Rogue', concussion: false, oneHandEdged: true, twoHanded: false, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Maca', finesse: 'no', damage: '2d4', critical: 'x3', damageType: 'slashing', proficiency: 'Exotic, Primitive', concussion: true, oneHandEdged: true, twoHanded: false, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Mace (Light Mace)', finesse: 'yes', damage: '1d6', critical: 'x3', damageType: 'bludgeoning', proficiency: 'Simple, Rogue, Cavalier', concussion: true, oneHandEdged: false, twoHanded: false, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Magic Staff', finesse: 'no', damage: '1d6', critical: 'x2', damageType: 'bludgeoning', proficiency: 'Simple, Druid, Monk, Rogue, Wizard', concussion: true, oneHandEdged: true, twoHanded: false, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Maul', finesse: 'no', damage: '2d6', critical: 'x3', damageType: 'bludgeoning', proficiency: 'Martial', concussion: true, oneHandEdged: true, twoHanded: false, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Morningstar', finesse: 'no', damage: '1d6', critical: 'x3', damageType: 'bludgeoning-piercing', proficiency: 'Simple, Rogue, Cavalier', concussion: true, oneHandEdged: false, twoHanded: false, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Naginata', finesse: 'yes', damage: '1d10', critical: 'x3', damageType: 'bludgeoning-piercing', proficiency: 'Exotic, Monk, Cavalier', concussion: false, oneHandEdged: false, twoHanded: false, polearm: true, unarmed: false, missile: false, thrown: false },
        { name: 'Nodachi', finesse: 'yes', damage: '3d4', critical: '19-20/x2', damageType: 'slashing', proficiency: 'Exotic, Cavalier, Monk', concussion: false, oneHandEdged: false, twoHanded: true, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Pike', finesse: 'no', damage: '1d8', critical: '20/x3', damageType: 'piercing', proficiency: 'Simple, Primitive, Sea Elf', concussion: false, oneHandEdged: false, twoHanded: false, polearm: true, unarmed: false, missile: false, thrown: false },
        { name: 'Quarterstaff', finesse: 'yes', damage: '1d6/1d6', critical: '19-20/x2', damageType: 'bludgeoning', proficiency: 'Simple, Druid, Monk, Rogue, Wizard', concussion: false, oneHandEdged: false, twoHanded: true, polearm: false, unarmed: true, missile: false, thrown: false },
        { name: 'Rapier', finesse: 'yes', damage: '1d6', critical: '18-20/x2', damageType: 'piercing', proficiency: 'Martial, Elf, Rogue', concussion: false, oneHandEdged: true, twoHanded: false, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Sai', finesse: 'yes', damage: '1d4', critical: '19-20/x2', damageType: 'bludgeoning', proficiency: 'Exotic, Assassin, Monk', concussion: false, oneHandEdged: true, twoHanded: false, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Scimitar', finesse: 'yes', damage: '1d6', critical: '18-20/x2', damageType: 'slashing', proficiency: 'Martial, Druid, Rogue', concussion: false, oneHandEdged: true, twoHanded: false, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Scythe', finesse: 'no', damage: '2d4', critical: 'x3', damageType: 'slashing-piercing', proficiency: 'Simple, Druid, Cavalier', concussion: false, oneHandEdged: false, twoHanded: false, polearm: true, unarmed: false, missile: false, thrown: false },
        { name: 'Short Sword', finesse: 'yes', damage: '1d6', critical: '19-20/x2', damageType: 'piercing', proficiency: 'Martial, Rogue', concussion: false, oneHandEdged: true, twoHanded: false, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Shortbow', finesse: 'na', damage: '1d6', critical: 'x3', damageType: 'piercing', proficiency: 'Martial, Primitive, Elf, Rogue, Aquatic Elf', concussion: false, oneHandEdged: false, twoHanded: false, polearm: false, unarmed: false, missile: true, thrown: false },
        { name: 'Shuriken', finesse: 'na', damage: '1d3', critical: 'x2', damageType: 'piercing', proficiency: 'Exotic, Monk', concussion: false, oneHandEdged: false, twoHanded: false, polearm: false, unarmed: false, missile: false, thrown: true },
        { name: 'Sickle', finesse: 'yes', damage: '1d6', critical: 'x3', damageType: 'slashing', proficiency: 'Simple, Druid', concussion: false, oneHandEdged: true, twoHanded: false, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Sling', finesse: 'na', damage: '1d4', critical: 'x2', damageType: 'bludgeoning', proficiency: 'Simple, Primitive, Druid, Monk, Rogue', concussion: false, oneHandEdged: false, twoHanded: false, polearm: false, unarmed: false, missile: true, thrown: true },
        { name: 'Spear', finesse: 'yes', damage: '1d6', critical: 'x3', damageType: 'piercing', proficiency: 'Simple, Primitive, Druid, Aquatic Elf, Cavalier', concussion: false, oneHandEdged: false, twoHanded: false, polearm: true, unarmed: false, missile: false, thrown: false },
        { name: 'Throwing Axe', finesse: 'na', damage: '1d8', critical: 'x2', damageType: 'slashing', proficiency: 'Martial', concussion: false, oneHandEdged: false, twoHanded: false, polearm: false, unarmed: false, missile: false, thrown: true },
        { name: 'Throwing Dagger', finesse: 'na', damage: '1d4', critical: 'x2', damageType: 'piercing', proficiency: 'Simple, Primitive, Druid, Rogue', concussion: false, oneHandEdged: false, twoHanded: false, polearm: false, unarmed: false, missile: false, thrown: true },
        { name: 'Trident', finesse: 'no', damage: '1d10', critical: 'x3', damageType: 'piercing', proficiency: 'Martial, Aquatic Elf', concussion: false, oneHandEdged: false, twoHanded: false, polearm: true, unarmed: false, missile: false, thrown: false },
        { name: 'Two-Bladed Sword', finesse: 'yes', damage: '1d6/1d6', critical: '18-20/x2', damageType: 'slashing', proficiency: 'Exotic', concussion: false, oneHandEdged: true, twoHanded: true, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Wakizashi', finesse: 'yes', damage: '1d8', critical: '19-20/x2', damageType: 'slashing', proficiency: 'Exotic, Monk, Cavalier', concussion: false, oneHandEdged: true, twoHanded: false, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'War Mace', finesse: 'no', damage: '1d10', critical: 'x3', damageType: 'bludgeoning', proficiency: 'Exotic, Cavalier', concussion: true, oneHandEdged: false, twoHanded: true, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Warhammer', finesse: 'no', damage: '1d8', critical: 'x3', damageType: 'bludgeoning', proficiency: 'Martial', concussion: true, oneHandEdged: false, twoHanded: false, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Whip', finesse: 'yes', damage: '1d2', critical: '20/x2', damageType: 'slashing', proficiency: 'Exotic, Rogue, Drow', concussion: true, oneHandEdged: true, twoHanded: false, polearm: false, unarmed: false, missile: false, thrown: false },
        { name: 'Yari', finesse: 'yes', damage: '1d10', critical: 'x3', damageType: 'piercing', proficiency: 'Exotic, Monk, Cavalier', concussion: false, oneHandEdged: false, twoHanded: false, polearm: true, unarmed: false, missile: false, thrown: false }
    ];
    const BASE_WEAPON_LOOKUP = new Map(
        BASE_WEAPON_DATA.map(weapon => [weapon.name.toLowerCase(), weapon])
    );
    const INNATE_ONLY_TYPES = new Set([
        'Regeneration',
        'Vampiric Regeneration',
        'Armor vs Damage type/Race/Alignment',
        'Enhancement vs Alignment/Race',
        'Damage vs Alignment/Race/Alignment',
        'Attack Bonus vs Alignment/Race/Alignment',
        'Granted Feat'
    ]);

    function normalizeBaseDamageType(rawType) {
        const raw = String(rawType || '').trim().toLowerCase();
        if (!raw) return 'slashing';
        const normalized = raw
            .replace(/,/g, '-')
            .replace(/\s+/g, '')
            .replace(/bludgeon/g, 'bludgeoning')
            .replace(/slash/g, 'slashing')
            .replace(/pierce/g, 'piercing');

        if (normalized.includes('slashing') && normalized.includes('piercing') && !normalized.includes('bludgeoning')) {
            return 'slashing-piercing';
        }
        if (normalized.includes('bludgeoning') && normalized.includes('piercing') && !normalized.includes('slashing')) {
            return 'bludgeoning-piercing';
        }
        if (normalized.includes('slashing') && normalized.includes('bludgeoning') && !normalized.includes('piercing')) {
            return 'slashing-bludgeoning';
        }
        if (normalized.includes('piercing')) return 'piercing';
        if (normalized.includes('bludgeoning')) return 'bludgeoning';
        return 'slashing';
    }

    function getFocusGroupFromWeaponFlags(weapon) {
        if (!weapon || typeof weapon !== 'object') return '';
        if (weapon.concussion) return 'Concussion';
        if (weapon.twoHanded) return 'Two-Handed';
        if (weapon.polearm) return 'Polearm';
        if (weapon.oneHandEdged) return 'One-Handed Edge';
        if (weapon.unarmed) return 'Unarmed';
        if (weapon.missile) return 'Missle';
        return '';
    }

    function applyBaseWeaponMeta(meta, weapon) {
        if (!meta || !weapon) return;
        meta.baseWeaponChart = weapon.name || '';
        meta.baseWeaponType = weapon.name || '';
        meta.finesse = weapon.finesse || '';
        meta.baseDamage = weapon.damage || '';
        meta.critRange = weapon.critical || '';
        meta.damageType = normalizeBaseDamageType(weapon.damageType);
        meta.proficiency = weapon.proficiency || '';
        meta.concussion = Boolean(weapon.concussion);
        meta.oneHandEdged = Boolean(weapon.oneHandEdged);
        meta.twoHanded = Boolean(weapon.twoHanded);
        meta.polearm = Boolean(weapon.polearm);
        meta.unarmed = Boolean(weapon.unarmed);
        meta.missile = Boolean(weapon.missile);
        meta.thrown = Boolean(weapon.thrown);
        meta.focusGroup = getFocusGroupFromWeaponFlags(weapon);
    }

    const state = {
        selectedSlot: 'mainHand',
        ui: {
            baseDrawerOpen: true,
            restrictionDrawerOpen: false,
            specialDrawerOpen: false,
            weaponOptionsDrawerOpen: true,
            wearableOptionsDrawerOpen: true
        },
        slots: {}
    };

    let craftedTemplateEntries = [];
    let craftedTemplateLookup = new Map();
    let craftedTemplatesLoaded = false;
    let pendingGearRefresh = false;
    let softErrorSlotKeys = new Set();

    let rootEls = null;

    function scheduleGearRefreshAndValidation() {
        if (pendingGearRefresh) return;
        pendingGearRefresh = true;

        requestAnimationFrame(() => {
            pendingGearRefresh = false;
            renderSummaries();

            if (typeof window.updateGrid === 'function') {
                try {
                    window.updateGrid();
                } catch {
                    // no-op
                }
            }

            if (typeof window.updateStatGrid === 'function') {
                try {
                    window.updateStatGrid();
                } catch {
                    // no-op
                }
            }

            if (typeof window.updateSkillGrid === 'function') {
                try {
                    window.updateSkillGrid();
                } catch {
                    // no-op
                }
            }

            if (typeof window.validateCharacterRealtime === 'function') {
                try {
                    window.validateCharacterRealtime();
                } catch {
                    // no-op
                }
            }
        });
    }

    function bindGearRealtimeWatchers() {
        const container = rootEls && rootEls.damageGear;
        if (!container || container.__gearRealtimeBound) return;

        const maybeRefresh = (event) => {
            const target = event && event.target;
            if (!target) return;
            const tag = String(target.tagName || '').toLowerCase();
            if (tag === 'input' || tag === 'select' || tag === 'textarea' || tag === 'button') {
                scheduleGearRefreshAndValidation();
            }
        };

        container.addEventListener('input', maybeRefresh, true);
        container.addEventListener('change', maybeRefresh, true);
        container.addEventListener('click', maybeRefresh, true);
        container.__gearRealtimeBound = true;
    }

    function ensureSlotState(slotKey) {
        if (!state.slots[slotKey]) {
            state.slots[slotKey] = {
                name: '',
                offHandType: 'shield',
                meta: getDefaultItemMeta(),
                properties: []
            };
        }
        if (!state.slots[slotKey].meta || typeof state.slots[slotKey].meta !== 'object') {
            state.slots[slotKey].meta = getDefaultItemMeta();
        }
        return state.slots[slotKey];
    }

    function createDefaultProperty(type = 'Ability') {
        return {
            id: `${Date.now()}_${Math.floor(Math.random() * 100000)}`,
            type,
            innate: INNATE_ONLY_TYPES.has(type),
            params: defaultParamsForType(type)
        };
    }

    function enforceInnateOnlyProperty(property) {
        if (!property || typeof property !== 'object') return;
        if (INNATE_ONLY_TYPES.has(property.type)) {
            property.innate = true;
        }
    }

    function getDefaultItemMeta() {
        return {
            craftedTemplateKey: '',
            baseWeaponChart: '',
            baseWeaponType: '',
            finesse: '',
            focusGroup: '',
            baseDamage: '',
            critRange: '',
            damageType: 'slashing',
            proficiency: '',
            concussion: false,
            oneHandEdged: false,
            twoHanded: false,
            polearm: false,
            unarmed: false,
            missile: false,
            thrown: false,
            baseArmor: 0,
            classRestriction: '',
            minClassLevel: 0,
            raceRestriction: '',
            umdBypass: 0,
            loreBypass: 0
        };
    }

    function buildCraftedTemplateLabel(template) {
        if (!template || typeof template !== 'object') return 'Unknown Template';
        const itemName = String(template.itemName || '').trim() || 'Unnamed Item';
        const sourcePage = String(template.sourcePage || '').trim();
        return sourcePage ? `${itemName} (${sourcePage})` : itemName;
    }

    function createCraftedTemplateEntry(template, index) {
        const itemName = String(template && template.itemName ? template.itemName : '').trim() || `template_${index}`;
        const sourcePage = String(template && template.sourcePage ? template.sourcePage : '').trim();
        const rowId = String(template && template.rowId ? template.rowId : '').trim();
        const key = [itemName, sourcePage, rowId, index].join('|');
        return {
            key,
            label: buildCraftedTemplateLabel(template),
            template
        };
    }

    function setCraftedTemplates(templates) {
        const list = Array.isArray(templates) ? templates : [];
        craftedTemplateEntries = list
            .filter(entry => entry && typeof entry === 'object' && entry.itemName)
            .map((entry, index) => createCraftedTemplateEntry(entry, index))
            .sort((left, right) => left.label.localeCompare(right.label));
        craftedTemplateLookup = new Map(craftedTemplateEntries.map(entry => [entry.key, entry]));
        craftedTemplatesLoaded = true;
    }

    function isKnowWhatImDoingActive() {
        try {
            if (typeof isKnowWhatImDoingEnabled === 'function') {
                return Boolean(isKnowWhatImDoingEnabled());
            }
        } catch (error) {
            // no-op
        }

        const toggle = document.getElementById('knowWhatImDoingToggle');
        return Boolean(toggle && toggle.checked);
    }

    function inferTemplateSlotCategory(template) {
        if (!template || typeof template !== 'object') return 'any';
        const explicit = String(template.slotCategory || '').trim().toLowerCase();
        if (explicit) return explicit;

        const sourcePage = String(template.sourcePage || '').toLowerCase();
        const itemName = String(template.itemName || '').toLowerCase();
        const rowId = String(template.rowId || '').toLowerCase();
        const haystack = `${sourcePage} ${itemName} ${rowId}`;

        if (/\bring\b/.test(haystack)) return 'ring';
        if (/amulet|necklace|torc|holy symbol|fetish/.test(haystack)) return 'necklace';
        if (/\bbelt\b/.test(haystack)) return 'belt';
        if (/\bboots?\b|\bgreaves\b/.test(haystack)) return 'boots';
        if (/bracer|bracelet|gauntlet|gloves?|knuckles?|wraps?/.test(haystack)) return 'gloves';
        if (/\bcloak\b|mantle|cape/.test(haystack)) return 'cloak';
        if (/helmet|helm|crown|circlet|diadem|hood/.test(haystack)) return 'head';
        if (/shield|buckler/.test(haystack)) return 'shield';
        if (/armor|armour|plate|mail|chain|leather|hide|robe|vestment|tunic|clothing/.test(haystack)) return 'chest';
        if (/sword|axe|hammer|mace|staff|spear|bow|crossbow|dagger|weapon|blade|scythe|flail|whip|kama|katana|estoc|rapier|club|maul|trident|pike|halberd|naginata|yari|wakizashi|pick|sling|shuriken/.test(haystack)) return 'weapon';

        return 'any';
    }

    function isTemplateCompatibleWithSlot(template, slotKey) {
        const slotCategory = getSlotCategory(slotKey);
        const templateCategory = inferTemplateSlotCategory(template);

        if (!templateCategory || templateCategory === 'any') return true;
        if (slotCategory === 'weapon') return templateCategory === 'weapon';
        if (slotCategory === 'shield') return templateCategory === 'shield';
        return templateCategory === slotCategory;
    }

    async function loadCraftedTemplates() {
        const candidates = [
            './craftedItemTemplates.json',
            '/craftedItemTemplates.json'
        ];

        for (const url of candidates) {
            try {
                const response = await fetch(url, { cache: 'no-store' });
                if (!response.ok) continue;
                const json = await response.json();
                if (Array.isArray(json)) {
                    setCraftedTemplates(json);
                    return;
                }
            } catch (error) {
                continue;
            }
        }

        setCraftedTemplates([]);
    }

    function applyCraftedTemplateToSlot(slotState, templateEntry) {
        if (!slotState || !templateEntry || !templateEntry.template) return;
        const template = templateEntry.template;

        const incomingMeta = template.meta && typeof template.meta === 'object' ? template.meta : {};
        slotState.meta = {
            ...getDefaultItemMeta(),
            ...JSON.parse(JSON.stringify(incomingMeta)),
            craftedTemplateKey: templateEntry.key
        };

        slotState.name = String(template.itemName || slotState.name || '').trim();

        const incomingProperties = Array.isArray(template.properties) ? template.properties : [];
        slotState.properties = incomingProperties
            .filter(property => property && typeof property === 'object' && typeof property.type === 'string')
            .map(property => {
                const resolvedType = PROPERTY_TYPES.includes(property.type) ? property.type : 'Ability';
                const params = property.params && typeof property.params === 'object'
                    ? JSON.parse(JSON.stringify(property.params))
                    : defaultParamsForType(resolvedType);
                const mapped = {
                    id: `${Date.now()}_${Math.floor(Math.random() * 100000)}`,
                    type: resolvedType,
                    innate: true,
                    params
                };
                enforceInnateOnlyProperty(mapped);
                return mapped;
            });
    }

    function defaultParamsForType(type) {
        switch (type) {
            case 'Ability':
                return { stat: 'str', value: 1 };
            case 'Armor':
            case 'Armor vs Damage type/Race/Alignment':
            case 'Enhancement':
            case 'Enhancement vs Alignment/Race':
            case 'Mighty':
            case 'Regeneration':
            case 'Skill':
            case 'Attack Bonus':
            case 'Attack Bonus vs Alignment/Race/Alignment':
            case 'Vampiric Regeneration':
                return { value: 1, target: '', save: 'fort', saveKind: 'other', skill: '' };
            case 'Specific Saving Throws':
                return { saveKind: 'universal' };
            case 'General Saving Throws':
                return { save: 'fort' };
            case 'Weight Reduction':
                return { reduction: 90 };
            case 'Bonus Spell Slots':
                return { casterClass: 'Bard', spellLevel: 1, slots: 1 };
            case 'Damage':
                return { damageType: 'Acid', mode: 'flat2', avgDamage: 2, diceLabel: '+2' };
            case 'Damage vs Alignment/Race/Alignment':
                return { damageType: 'Acid', mode: 'flat2', avgDamage: 2, target: '', diceLabel: '+2' };
            case 'Massive Criticals':
                return { mode: 'flat4', avgDamage: 4, diceLabel: '4' };
            case 'Damage Immunity':
                return { damageType: 'Acid', percent: 5 };
            case 'Damage Vulnerability':
                return { damageType: 'Acid', percent: 5 };
            case 'Damage Reduction':
                return { soak: 5, pierce: 1 };
            case 'Damage Resist':
                return { resist: 5 };
            case 'Spell Resistance':
                return { sr: 10 };
            case 'Keen':
                return { profile: '20' };
            case 'Granted Feat':
                return { featName: '' };
            default:
                return {};
        }
    }

    function init() {
        rootEls = {
            damageGear: document.getElementById('damageGear'),
            paperDoll: document.getElementById('gearPaperDoll'),
            editorTitle: document.getElementById('gearEditorTitle'),
            itemName: document.getElementById('gearItemName'),
            itemMeta: document.getElementById('gearItemMeta'),
            offHandRow: document.getElementById('offHandTypeRow'),
            offHandType: document.getElementById('offHandType'),
            addPropertyBtn: document.getElementById('addGearPropertyBtn'),
            propertyRows: document.getElementById('gearPropertyRows'),
            slotMoteTotal: document.getElementById('selectedSlotMoteTotal'),
            totalMotes: document.getElementById('gearMoteTotal'),
            flags: document.getElementById('gearFlags'),
            baseSummary: document.getElementById('baseDerivedSummary'),
            gearSummary: document.getElementById('gearDerivedSummary')
        };

        if (!rootEls.paperDoll) return;

        SLOT_CONFIG.forEach(slot => ensureSlotState(slot.key));
        bindGearRealtimeWatchers();
        renderPaperDoll();
        bindEditorEvents();
        renderEditor();
        renderSummaries();
        patchPlannerHooks();

        loadCraftedTemplates().then(() => {
            renderEditor();
        });

        const knowWhatImDoingToggle = document.getElementById('knowWhatImDoingToggle');
        if (knowWhatImDoingToggle) {
            knowWhatImDoingToggle.addEventListener('change', () => {
                renderEditor();
                renderSummaries();
            });
        }
    }

    function bindEditorEvents() {
        rootEls.itemName.addEventListener('input', () => {
            const slot = ensureSlotState(state.selectedSlot);
            slot.name = rootEls.itemName.value;
            renderPaperDoll();
        });

        rootEls.offHandType.addEventListener('change', () => {
            const slot = ensureSlotState('offHand');
            slot.offHandType = rootEls.offHandType.value;
            renderSummaries();
        });

        rootEls.addPropertyBtn.addEventListener('click', () => {
            const slot = ensureSlotState(state.selectedSlot);
            slot.properties.push(createDefaultProperty('Ability'));
            renderEditor();
            renderSummaries();
        });
    }

    function renderPaperDoll() {
        rootEls.paperDoll.innerHTML = '';

        SLOT_CONFIG.forEach(slot => {
            const slotState = ensureSlotState(slot.key);
            const btn = document.createElement('button');
            btn.type = 'button';
            const hasSoftError = softErrorSlotKeys.has(slot.key);
            btn.className = `gear-slot-btn${state.selectedSlot === slot.key ? ' active' : ''}${hasSoftError ? ' soft-error' : ''}`;
            const itemLabel = slotState.name ? `\n${slotState.name}` : '';
            btn.textContent = `${slot.label}${itemLabel}`;
            btn.addEventListener('click', () => {
                state.selectedSlot = slot.key;
                renderPaperDoll();
                renderEditor();
            });
            rootEls.paperDoll.appendChild(btn);
        });
    }

    function renderEditor() {
        const slotCfg = SLOT_CONFIG.find(s => s.key === state.selectedSlot);
        const slotState = ensureSlotState(state.selectedSlot);

        rootEls.editorTitle.textContent = `Slot Editor: ${slotCfg.label}`;
        rootEls.itemName.value = slotState.name || '';
        rootEls.offHandRow.style.display = state.selectedSlot === 'offHand' ? 'flex' : 'none';
        if (state.selectedSlot === 'offHand') {
            rootEls.offHandType.value = slotState.offHandType || 'shield';
        }

        renderItemMetaEditor(slotState);

        rootEls.propertyRows.innerHTML = '';

        slotState.properties.forEach((property, index) => {
            enforceInnateOnlyProperty(property);
            const row = document.createElement('tr');

            const propertyCell = document.createElement('td');
            const propertySelect = document.createElement('select');
            PROPERTY_TYPES.forEach(type => {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = type;
                if (property.type === type) option.selected = true;
                propertySelect.appendChild(option);
            });
            propertySelect.addEventListener('change', () => {
                property.type = propertySelect.value;
                property.params = defaultParamsForType(property.type);
                enforceInnateOnlyProperty(property);
                renderEditor();
                renderSummaries();
            });
            propertyCell.appendChild(propertySelect);

            const paramsCell = document.createElement('td');
            const innateWrap = document.createElement('div');
            innateWrap.className = 'gear-field-row';
            const innateLabel = document.createElement('label');
            innateLabel.style.minWidth = '68px';
            innateLabel.style.fontWeight = 'bold';
            innateLabel.textContent = 'Innate';
            const innateToggle = document.createElement('input');
            innateToggle.type = 'checkbox';
            innateToggle.checked = Boolean(property.innate);
            const innateOnly = INNATE_ONLY_TYPES.has(property.type);
            innateToggle.disabled = innateOnly;
            innateToggle.addEventListener('change', () => {
                property.innate = Boolean(innateToggle.checked);
                renderEditor();
                renderSummaries();
            });
            innateWrap.appendChild(innateLabel);
            innateWrap.appendChild(innateToggle);
            if (innateOnly) {
                const hint = document.createElement('span');
                hint.className = 'muted-note';
                hint.textContent = 'required';
                innateWrap.appendChild(hint);
            }
            paramsCell.appendChild(innateWrap);
            renderPropertyParams(paramsCell, property, state.selectedSlot, () => {
                renderEditor();
                renderSummaries();
            });

            const moteCell = document.createElement('td');
            moteCell.textContent = `${formatMote(calcPropertyMotes(property))}`;

            const actionCell = document.createElement('td');
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.textContent = 'Remove';
            removeBtn.addEventListener('click', () => {
                slotState.properties.splice(index, 1);
                renderEditor();
                renderSummaries();
            });
            actionCell.appendChild(removeBtn);

            row.appendChild(propertyCell);
            row.appendChild(paramsCell);
            row.appendChild(moteCell);
            row.appendChild(actionCell);
            rootEls.propertyRows.appendChild(row);
        });

        const slotMoteSum = slotState.properties.reduce((sum, p) => sum + calcPropertyMotes(p), 0);
        rootEls.slotMoteTotal.textContent = `Slot Motes: ${formatMote(slotMoteSum)}`;
    }

    function renderPropertyParams(container, property, slotKey, onChange) {
        const existingHeader = container.firstChild;
        container.innerHTML = '';
        if (existingHeader) {
            container.appendChild(existingHeader);
        }
        const p = property.params || {};
        const removeCaps = Boolean(property.innate);

        const addNumber = (key, label, options = {}) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'gear-field-row';
            const labelEl = document.createElement('label');
            labelEl.textContent = label;
            labelEl.style.minWidth = '68px';
            const input = document.createElement('input');
            input.type = 'number';
            if (options.min !== undefined) input.min = String(options.min);
            if (!removeCaps && options.max !== undefined) input.max = String(options.max);
            if (options.step !== undefined) input.step = String(options.step);
            input.value = String(p[key] ?? (options.defaultValue ?? 0));
            input.addEventListener('input', () => {
                p[key] = parseFloat(input.value) || 0;
                onChange();
            });
            wrapper.appendChild(labelEl);
            wrapper.appendChild(input);
            container.appendChild(wrapper);
        };

        const addText = (key, label, placeholder = '') => {
            const wrapper = document.createElement('div');
            wrapper.className = 'gear-field-row';
            const labelEl = document.createElement('label');
            labelEl.textContent = label;
            labelEl.style.minWidth = '68px';
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = placeholder;
            input.value = p[key] || '';
            input.addEventListener('input', () => {
                p[key] = input.value;
                onChange();
            });
            wrapper.appendChild(labelEl);
            wrapper.appendChild(input);
            container.appendChild(wrapper);
        };

        const addSelect = (key, label, values) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'gear-field-row';
            const labelEl = document.createElement('label');
            labelEl.textContent = label;
            labelEl.style.minWidth = '68px';
            const select = document.createElement('select');
            let matchedOptionValue = null;
            const currentValue = p[key] === undefined || p[key] === null ? '' : String(p[key]);
            const currentValueLower = currentValue.toLowerCase();
            values.forEach(value => {
                const option = document.createElement('option');
                if (typeof value === 'object') {
                    option.value = value.value;
                    option.textContent = value.label;
                } else {
                    option.value = value;
                    option.textContent = value;
                }
                if (currentValue && String(option.value).toLowerCase() === currentValueLower) {
                    option.selected = true;
                    matchedOptionValue = option.value;
                }
                select.appendChild(option);
            });
            if (matchedOptionValue !== null) {
                p[key] = matchedOptionValue;
            }
            if (!p[key] && values.length > 0) {
                const firstValue = typeof values[0] === 'object' ? values[0].value : values[0];
                p[key] = firstValue;
            }
            select.addEventListener('change', () => {
                p[key] = select.value;
                onChange();
            });
            wrapper.appendChild(labelEl);
            wrapper.appendChild(select);
            container.appendChild(wrapper);
        };

        switch (property.type) {
            case 'Ability':
                addSelect('stat', 'Stat', [
                    { value: 'str', label: 'STR' },
                    { value: 'dex', label: 'DEX' },
                    { value: 'con', label: 'CON' },
                    { value: 'int', label: 'INT' },
                    { value: 'wis', label: 'WIS' },
                    { value: 'cha', label: 'CHA' }
                ]);
                addNumber('value', '+/-', {
                    min: -20,
                    max: 20,
                    step: 1,
                    defaultValue: 1
                });
                break;
            case 'Armor':
                addNumber('value', '+', {
                    min: 1,
                    step: 1,
                    defaultValue: 1
                });
                if (removeCaps) {
                    addSelect('armorType', 'AC Type', [
                        { value: 'armor', label: 'armor' },
                        { value: 'shield', label: 'shield' },
                        { value: 'natural', label: 'natural' },
                        { value: 'deflection', label: 'deflection' },
                        { value: 'dodge', label: 'dodge' },
                        { value: 'other', label: 'other' }
                    ]);
                }
                break;
            case 'Enhancement':
            case 'Attack Bonus':
            case 'Mighty':
            case 'Regeneration':
            case 'Vampiric Regeneration':
                addNumber('value', '+', {
                    min: 1,
                    max: (property.type === 'Attack Bonus' || property.type === 'Vampiric Regeneration') ? 1 : undefined,
                    step: 1,
                    defaultValue: 1
                });
                break;
            case 'Armor vs Damage type/Race/Alignment':
            case 'Enhancement vs Alignment/Race':
            case 'Attack Bonus vs Alignment/Race/Alignment':
                addText('target', 'Target', 'e.g. evil, undead, fire');
                addNumber('value', '+', {
                    min: 1,
                    max: property.type === 'Attack Bonus vs Alignment/Race/Alignment' ? 1 : undefined,
                    step: 1,
                    defaultValue: 1
                });
                break;
            case 'Weight Reduction':
                if (removeCaps) {
                    addNumber('reduction', 'Applied %', { min: 0, max: 100, step: 1, defaultValue: 90 });
                } else {
                    addSelect('reduction', '%', [90, 80]);
                }
                break;
            case 'Bonus Spell Slots':
                if (removeCaps) {
                    addText('casterClass', 'Class', 'e.g. Bard');
                    addNumber('spellLevel', 'Level', { min: 1, max: 9, step: 1, defaultValue: 1 });
                } else {
                    addSelect('casterClass', 'Class', Object.keys(SPELL_SLOT_CLASS_RANGES));
                    addSelect('spellLevel', 'Level', getSpellLevelsForClass(p.casterClass));
                }
                addNumber('slots', 'Slots', { min: 1, step: 1, defaultValue: 1 });
                break;
            case 'Damage':
            case 'Damage vs Alignment/Race/Alignment':
                addSelect('damageType', 'Type', DAMAGE_TYPES);
                if (removeCaps) {
                    addNumber('avgDamage', 'Avg Dmg', { min: 0, step: 0.25, defaultValue: 2 });
                    addText('diceLabel', 'Label', 'e.g. 1d12');
                } else {
                    addSelect('mode', 'Add', DAMAGE_ADD_MODES);
                }
                if (property.type === 'Damage vs Alignment/Race/Alignment') {
                    addText('target', 'Target', 'e.g. evil, undead, fire');
                }
                break;
            case 'Damage Immunity':
                if (removeCaps) {
                    addText('damageType', 'Type', 'e.g. Electrical');
                    addNumber('percent', '%', { min: 0, max: 100, step: 1, defaultValue: 5 });
                } else {
                    addSelect('damageType', 'Type', DAMAGE_TYPES);
                    addSelect('percent', '%', [5, 10, 15, 20, 25, 30, 35, 40, 45, 50]);
                }
                break;
            case 'Damage Vulnerability':
                if (removeCaps) {
                    addText('damageType', 'Type', 'e.g. Electrical');
                    addNumber('percent', '%', { min: 0, max: 100, step: 1, defaultValue: 5 });
                } else {
                    addSelect('damageType', 'Type', DAMAGE_TYPES);
                    addSelect('percent', '%', [5, 10, 15, 20, 25, 30, 35, 40, 45, 50]);
                }
                break;
            case 'Damage Reduction':
                addSelect('soak', 'Soak', [5, 10, 15, 20]);
                addSelect('pierce', 'Pierce', [1, 2, 3, 4, 5]);
                break;
            case 'Damage Resist':
                addNumber('resist', 'Resist', { min: 5, step: 5, defaultValue: 5 });
                break;
            case 'Darkvision':
            case 'Light':
                container.textContent = 'No parameters';
                break;
            case 'Spell Resistance':
                if (removeCaps) {
                    addNumber('sr', 'SR', { min: 8, step: 1, defaultValue: 10 });
                } else {
                    p.sr = 10;
                    const fixed = document.createElement('div');
                    fixed.className = 'muted-note';
                    fixed.textContent = 'Fixed SR 10';
                    container.appendChild(fixed);
                }
                break;
            case 'Specific Saving Throws':
                addSelect('saveKind', 'Kind', SPECIFIC_SAVE_TYPES);
                if (removeCaps) {
                    addNumber('value', '+', { min: 1, step: 1, defaultValue: 1 });
                } else {
                    p.value = 1;
                    const fixed = document.createElement('div');
                    fixed.className = 'muted-note';
                    fixed.textContent = 'Value fixed at +1';
                    container.appendChild(fixed);
                }
                break;
            case 'General Saving Throws':
                addSelect('save', 'Save', [
                    { value: 'fort', label: 'Fortitude' },
                    { value: 'ref', label: 'Reflex' },
                    { value: 'will', label: 'Will' }
                ]);
                if (removeCaps) {
                    addNumber('value', '+', { min: 1, step: 1, defaultValue: 1 });
                } else {
                    p.value = 1;
                    const fixed = document.createElement('div');
                    fixed.className = 'muted-note';
                    fixed.textContent = 'Value fixed at +1';
                    container.appendChild(fixed);
                }
                break;
            case 'Keen':
                if (removeCaps) {
                    addText('profile', 'Crit', 'e.g. 20 -> 19-20');
                } else {
                    addSelect('profile', 'Crit', [
                        { value: '20', label: '20 -> 19-20' },
                        { value: '19-20', label: '19-20 -> 17-20' },
                        { value: '18-20', label: '18-20 -> 15-20' }
                    ]);
                }
                break;
            case 'Skill':
                addSelect('skill', 'Skill', getSkillOptions());
                if (removeCaps) {
                    addNumber('value', '+/-', { min: -50, step: 1, defaultValue: 1 });
                } else {
                    addSelect('value', '+/-', [-2, -1, 1, 2]);
                }
                break;
            case 'Massive Criticals':
                if (removeCaps) {
                    addNumber('avgDamage', 'Avg Dmg', { min: 0, step: 0.25, defaultValue: 4 });
                    addText('diceLabel', 'Label', 'e.g. 1d8');
                } else {
                    addSelect('mode', 'Value', MASSIVE_CRIT_MODES);
                }
                break;
            case 'Granted Feat':
                addSelect('featName', 'Feat', getFeatOptions(p.featName));
                break;
            default:
                container.textContent = 'No parameters';
                break;
        }

        property.params = p;
    }

    function calcPropertyMotes(property) {
        if (property && property.innate) return 0;
        const p = property.params || {};
        const value = Math.max(0, Number(p.value) || 0);
        switch (property.type) {
            case 'Ability':
                return 8;
            case 'Armor':
                return 6 * value;
            case 'Armor vs Damage type/Race/Alignment':
                return 3 * value;
            case 'Enhancement':
                return 6 * value;
            case 'Enhancement vs Alignment/Race':
                return 4 * value;
            case 'Weight Reduction':
                return WEIGHT_REDUCTION_COSTS[Number(p.reduction)] ?? 0;
            case 'Bonus Spell Slots': {
                const classRange = getSpellSlotClassRange(p.casterClass);
                const levelRaw = Number(p.spellLevel) || classRange.min;
                const level = Math.max(classRange.min, Math.min(classRange.max, levelRaw));
                const slots = Math.max(1, Number(p.slots) || 1);
                return (SPELL_SLOT_COSTS[level] || 0) * slots;
            }
            case 'Damage':
                return (2 * getAverageDamageFromParams(p)) + 4;
            case 'Damage vs Alignment/Race/Alignment':
                return 2 * getAverageDamageFromParams(p);
            case 'Damage Immunity': {
                const type = String(p.damageType || '');
                const unit = type.toLowerCase() === 'acid' ||
                    type.toLowerCase() === 'cold' ||
                    type.toLowerCase() === 'divine' ||
                    type.toLowerCase() === 'electrical' ||
                    type.toLowerCase() === 'fire' ||
                    type.toLowerCase() === 'negative' ||
                    type.toLowerCase() === 'positive' ||
                    type.toLowerCase() === 'sonic' ||
                    type.toLowerCase() === 'poison' ||
                    type.toLowerCase() === 'entropy' ||
                    type.toLowerCase() === 'psychic'
                    ? 5
                    : 5;
                const percent = Math.max(0, Number(p.percent) || 0);
                return (percent / 5) * unit;
            }
            case 'Damage Vulnerability':
                return 0;
            case 'Damage Reduction': {
                const soak = Math.max(0, Number(p.soak) || 0);
                const pierce = Math.max(0, Number(p.pierce) || 0);
                return (soak / 5) * pierce;
            }
            case 'Damage Resist':
                return 2 * ((Math.max(0, Number(p.resist) || 0)) / 5);
            case 'Darkvision':
                return 2;
            case 'Spell Resistance':
                return 2;
            case 'Specific Saving Throws': {
                const kind = String(p.saveKind || 'universal');
                const unit = kind === 'universal' ? 6 : ((kind === 'death' || kind === 'mind') ? 2 : 1);
                return unit;
            }
            case 'General Saving Throws':
                return 2;
            case 'Keen':
                return KEEN_COSTS[String(p.profile || '20')] || 0;
            case 'Light':
                return 0;
            case 'Mighty':
                return 2 * value;
            case 'Regeneration':
                return 4 * value;
            case 'Skill':
                return 1 * Math.max(1, Math.min(2, Math.abs(Number(p.value) || 1)));
            case 'Attack Bonus':
                return 4 * Math.min(1, Math.max(0, Number(p.value) || 0));
            case 'Attack Bonus vs Alignment/Race/Alignment':
                return 2 * Math.min(1, Math.max(0, Number(p.value) || 0));
            case 'Vampiric Regeneration':
                return 4 * Math.min(1, Math.max(0, Number(p.value) || 0));
            case 'Massive Criticals':
                return 8;
            case 'Granted Feat':
                return 0;
            default:
                return 0;
        }
    }

    function getAverageDamageFromMode(mode) {
        if (String(mode || '').toLowerCase() === 'd4') return 2.5;
        return 2;
    }

    function getAverageDamageFromParams(params) {
        const p = params || {};
        const direct = Number(p.avgDamage);
        if (Number.isFinite(direct) && direct > 0) return direct;
        return getAverageDamageFromMode(p.mode);
    }

    function getSpellSlotClassRange(casterClass) {
        const key = String(casterClass || 'Bard');
        return SPELL_SLOT_CLASS_RANGES[key] || { min: 1, max: 4 };
    }

    function getSpellLevelsForClass(casterClass) {
        const range = getSpellSlotClassRange(casterClass);
        const levels = [];
        for (let level = range.min; level <= range.max; level++) {
            levels.push(level);
        }
        return levels;
    }

    function getMassiveCriticalAverage(mode) {
        if (String(mode || '').toLowerCase() === 'd8') return 4.5;
        return 4;
    }

    function getMassiveCriticalAverageFromParams(params) {
        const p = params || {};
        const direct = Number(p.avgDamage);
        if (Number.isFinite(direct) && direct > 0) return direct;
        return getMassiveCriticalAverage(p.mode);
    }

    function normalizeAcBucket(value) {
        const key = String(value || '').trim().toLowerCase();
        if (key === 'armor' || key === 'shield' || key === 'natural' || key === 'deflection' || key === 'dodge' || key === 'other') {
            return key;
        }
        return null;
    }

    function getSkillOptions() {
        try {
            if (Array.isArray(SKILL_LIST) && SKILL_LIST.length > 0) {
                return SKILL_LIST.map(skill => ({ value: skill, label: skill }));
            }
        } catch (error) {
            return [{ value: 'discipline', label: 'discipline' }];
        }
        return [{ value: 'discipline', label: 'discipline' }];
    }

    function getFeatOptions(currentValue = '') {
        const options = [];
        try {
            if (featData && typeof featData === 'object') {
                Object.keys(featData)
                    .sort((left, right) => left.localeCompare(right))
                    .forEach(featName => {
                        options.push({ value: featName, label: featName });
                    });
            }
        } catch (error) {
            // no-op
        }

        if (options.length === 0) {
            options.push({ value: '', label: '-- No feats loaded --' });
        }

        const selected = String(currentValue || '').trim();
        if (selected && !options.some(option => option.value.toLowerCase() === selected.toLowerCase())) {
            options.unshift({ value: selected, label: selected });
        }

        return options;
    }

    function getSlotCategory(slotKey) {
        const cfg = SLOT_CONFIG.find(slot => slot.key === slotKey);
        if (!cfg) return 'other';
        if (slotKey === 'offHand') {
            const offHand = ensureSlotState('offHand');
            return offHand.offHandType === 'weapon' ? 'weapon' : 'shield';
        }
        return cfg.category;
    }

    function getArmorTypeForSlot(slotKey) {
        const category = getSlotCategory(slotKey);
        if (category === 'chest') return 'armor';
        if (category === 'shield') return 'shield';
        if (category === 'boots') return 'dodge';
        if (category === 'necklace') return 'natural';
        return 'deflection';
    }

    function buildGearEffects() {
        const effects = {
            acBuckets: {
                armor: [],
                shield: [],
                natural: [],
                deflection: [],
                dodge: [],
                other: []
            },
            saveBonus: { fort: 0, ref: 0, will: 0 },
            attackBonus: 0,
            enhancementAttackBonus: 0,
            directAttackBonus: 0,
            damageBonus: 0,
            damageAdds: {
                flat: 0,
                diceByType: new Map()
            },
            critDamageBonus: 0,
            softStats: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
            maxSpellResistance: 0,
            flags: new Set(),
            situational: [],
            itemGrantedFeats: new Map(),
            itemSkillBonuses: new Map()
        };

        const normalizeFeatName = (rawFeatName) => {
            const text = String(rawFeatName || '').trim();
            if (!text) return '';
            if (typeof resolveFeatName === 'function') {
                return resolveFeatName(text);
            }
            return text;
        };

        SLOT_CONFIG.forEach(slot => {
            const slotState = ensureSlotState(slot.key);
            slotState.properties.forEach(property => {
                enforceInnateOnlyProperty(property);
                const p = property.params || {};
                const rawValue = Number(p.value) || 0;
                const value = Math.max(0, rawValue);

                if (property.type === 'Ability') {
                    const stat = String(p.stat || '').toLowerCase();
                    const hasAbilityValue = p.value !== undefined && p.value !== null && p.value !== '';
                    const abilityValue = hasAbilityValue ? (Number(p.value) || 0) : 1;
                    if (Object.prototype.hasOwnProperty.call(effects.softStats, stat)) {
                        effects.softStats[stat] += abilityValue;
                    }
                }

                if (property.type === 'Armor') {
                    const overrideType = property.innate ? normalizeAcBucket(p.armorType) : null;
                    const bucket = overrideType || getArmorTypeForSlot(slot.key);
                    effects.acBuckets[bucket].push(value);
                }

                if (property.type === 'Enhancement') {
                    if (getSlotCategory(slot.key) === 'weapon') {
                        effects.enhancementAttackBonus += value;
                        effects.damageBonus += value;
                    } else {
                        effects.acBuckets[getArmorTypeForSlot(slot.key)].push(value);
                    }
                }

                if (property.type === 'Attack Bonus') {
                    effects.directAttackBonus += property.innate ? value : Math.min(1, value);
                }

                if (property.type === 'Mighty') {
                    effects.damageBonus += value;
                }

                if (property.type === 'Damage') {
                    effects.damageBonus += getAverageDamageFromParams(p);
                    addDamageAddToSummary(effects.damageAdds, p);
                }

                if (property.type === 'Massive Criticals') {
                    effects.critDamageBonus += getMassiveCriticalAverageFromParams(p);
                }

                if (property.type === 'General Saving Throws') {
                    const save = String(p.save || 'fort');
                    const amount = property.innate ? Math.max(0, Number(p.value) || 0) : 1;
                    if (save === 'fort' || save === 'ref' || save === 'will') {
                        effects.saveBonus[save] += amount;
                    }
                }

                if (property.type === 'Specific Saving Throws') {
                    const kind = String(p.saveKind || 'universal');
                    const amount = property.innate ? Math.max(0, Number(p.value) || 0) : 1;
                    if (kind === 'universal') {
                        effects.saveBonus.fort += amount;
                        effects.saveBonus.ref += amount;
                        effects.saveBonus.will += amount;
                    } else {
                        effects.situational.push(`${property.type} ${kind} +1`);
                    }
                }

                if (property.type === 'Spell Resistance') {
                    const srValue = property.innate ? Math.max(0, Number(p.sr) || 0) : 10;
                    effects.maxSpellResistance = Math.max(effects.maxSpellResistance, srValue);
                }

                if (property.type === 'Darkvision') {
                    effects.flags.add('darkvision');
                }

                if (property.type === 'Light') {
                    effects.flags.add('light');
                }

                if (property.type === 'Keen') {
                    effects.flags.add(`keen ${String(p.profile || '')}`);
                }

                if (property.type === 'Damage Immunity' || property.type === 'Damage Reduction' || property.type === 'Damage Resist') {
                    if (property.type === 'Damage Immunity') {
                        effects.situational.push(`${property.type} ${String(p.damageType || '')} ${Math.max(0, Number(p.percent) || 0)}%`);
                    } else {
                        effects.situational.push(property.type);
                    }
                }

                if (property.type === 'Damage Vulnerability') {
                    effects.situational.push(`${property.type} ${String(p.damageType || '')} ${Math.max(0, Number(p.percent) || 0)}%`);
                }

                if (property.type === 'Granted Feat') {
                    const normalizedName = normalizeFeatName(p.featName);
                    if (normalizedName) {
                        const key = normalizedName.toLowerCase();
                        if (!effects.itemGrantedFeats.has(key)) {
                            effects.itemGrantedFeats.set(key, {
                                name: normalizedName,
                                sources: new Set()
                            });
                        }
                        effects.itemGrantedFeats.get(key).sources.add(slotState.name || slot.label);
                    }
                }

                if (property.type === 'Armor vs Damage type/Race/Alignment' || property.type === 'Enhancement vs Alignment/Race' || property.type === 'Damage vs Alignment/Race/Alignment' || property.type === 'Attack Bonus vs Alignment/Race/Alignment') {
                    const target = String(p.target || '').trim();
                    const val = property.type.includes('Damage') ? getAverageDamageFromParams(p) : (Number(p.value) || 0);
                    effects.situational.push(`${property.type}${target ? ` (${target})` : ''}${val ? ` +${val}` : ''}`);
                }

                if (property.type === 'Skill' || property.type === 'Regeneration' || property.type === 'Vampiric Regeneration' || property.type === 'Bonus Spell Slots') {
                    const hasSkillValue = p.value !== undefined && p.value !== null && p.value !== '';
                    const skillValue = hasSkillValue ? (Number(p.value) || 0) : 1;
                    const suffix = property.type === 'Skill'
                        ? ` ${String(p.skill || '').trim()} ${skillValue >= 0 ? '+' : ''}${skillValue}`
                        : '';
                    effects.situational.push(`${property.type}${suffix}`);
                }

                if (property.type === 'Skill') {
                    const normalizedSkill = typeof normalizeSkillKey === 'function'
                        ? normalizeSkillKey(String(p.skill || ''))
                        : String(p.skill || '').trim().toLowerCase();
                    if (normalizedSkill) {
                        const hasSkillValue = p.value !== undefined && p.value !== null && p.value !== '';
                        const value = hasSkillValue ? (Number(p.value) || 0) : 1;
                        effects.itemSkillBonuses.set(normalizedSkill, (effects.itemSkillBonuses.get(normalizedSkill) || 0) + value);
                    }
                }
            });
        });

        effects.attackBonus = Math.max(effects.enhancementAttackBonus, effects.directAttackBonus);

        return effects;
    }

    function computeStackedAc(effects) {
        const armor = Math.max(0, ...effects.acBuckets.armor);
        const shield = Math.max(0, ...effects.acBuckets.shield);
        const natural = Math.max(0, ...effects.acBuckets.natural);
        const deflection = Math.max(0, ...effects.acBuckets.deflection);
        const dodge = Math.min(20, effects.acBuckets.dodge.reduce((sum, value) => sum + value, 0));
        const other = effects.acBuckets.other.reduce((sum, value) => sum + value, 0);

        return {
            armor,
            shield,
            natural,
            deflection,
            dodge,
            other,
            total: armor + shield + natural + deflection + dodge + other
        };
    }

    function addDamageAddToSummary(damageAdds, params) {
        if (!damageAdds || !params) return;

        const mode = String(params.mode || '').toLowerCase();
        const damageType = String(params.damageType || '').trim().toLowerCase() || 'untyped';

        if (mode === 'flat2') {
            damageAdds.flat += 2;
            return;
        }

        if (mode === 'd4') {
            const key = `${damageType}|d4`;
            damageAdds.diceByType.set(key, (damageAdds.diceByType.get(key) || 0) + 1);
            return;
        }

        const label = String(params.diceLabel || '').trim().toLowerCase();
        const diceMatch = label.match(/^(\d+)d(\d+)$/i);
        if (diceMatch) {
            const count = Math.max(1, parseInt(diceMatch[1], 10) || 1);
            const dieSize = parseInt(diceMatch[2], 10) || 0;
            if (dieSize > 0) {
                const key = `${damageType}|d${dieSize}`;
                damageAdds.diceByType.set(key, (damageAdds.diceByType.get(key) || 0) + count);
                return;
            }
        }

        const avgDamage = Number(params.avgDamage);
        if (Number.isFinite(avgDamage) && avgDamage > 0) {
            if (Number.isInteger(avgDamage)) {
                damageAdds.flat += avgDamage;
            } else {
                const key = `${damageType}|avg`;
                damageAdds.diceByType.set(key, (damageAdds.diceByType.get(key) || 0) + avgDamage);
            }
        }
    }

    function formatDamageAddSummary(damageAdds) {
        if (!damageAdds) return 'none';

        const chunks = [];
        if ((damageAdds.flat || 0) > 0) {
            chunks.push(`${round2(damageAdds.flat)}`);
        }

        const diceEntries = Array.from(damageAdds.diceByType.entries())
            .sort((left, right) => left[0].localeCompare(right[0]));

        diceEntries.forEach(([key, amount]) => {
            const [type, die] = key.split('|');
            if (die === 'avg') {
                chunks.push(`${round2(amount)} ${type}`);
                return;
            }

            const typeText = type === 'untyped' ? '' : ` ${type}`;
            const amountText = Number.isInteger(amount) ? amount : round2(amount);
            chunks.push(`${amountText}${die}${typeText}`.trim());
        });

        return chunks.length > 0 ? chunks.join(', ') : 'none';
    }

    function getCurrentCharacterLevel() {
        const levels = getPlannerLevelData();
        if (!Array.isArray(levels)) return 1;
        for (let level = levels.length; level >= 1; level--) {
            const row = levels[level - 1];
            if (row && row.class) return level;
        }
        return 1;
    }

    function getBaseDerivedSummary() {
        const level = getCurrentCharacterLevel();
        const levels = getPlannerLevelData();
        const row = (Array.isArray(levels) && levels[level - 1]) ? levels[level - 1] : null;
        return {
            level,
            bab: row ? (row.bab || 0) : 0,
            fort: row ? (row.fort || 0) : 0,
            ref: row ? (row.ref || 0) : 0,
            will: row ? (row.will || 0) : 0,
            hp: row ? (row.hp || 0) : 0
        };
    }

    function getPlannerLevelData() {
        try {
            return Array.isArray(levelData) ? levelData : null;
        } catch (error) {
            return null;
        }
    }

    function renderSummaries() {
        if (!rootEls || !rootEls.baseSummary || !rootEls.gearSummary) return;

        const base = getBaseDerivedSummary();
        const effects = buildGearEffects();
        const ac = computeStackedAc(effects);

        const totalMotes = SLOT_CONFIG.reduce((sum, slot) => {
            const slotState = ensureSlotState(slot.key);
            return sum + slotState.properties.reduce((inner, p) => inner + calcPropertyMotes(p), 0);
        }, 0);

        const derived = {
            attackBonus: base.bab + effects.attackBonus,
            fort: base.fort + effects.saveBonus.fort,
            ref: base.ref + effects.saveBonus.ref,
            will: base.will + effects.saveBonus.will,
            hp: base.hp,
            bab: base.bab,
            damageBonus: effects.damageBonus,
            critDamageBonus: effects.critDamageBonus,
            spellResistance: effects.maxSpellResistance,
            ac
        };

        const damageAddSummary = formatDamageAddSummary(effects.damageAdds);

        const restrictionWarningDetails = getRestrictionSoftWarnings(base.level, { includeSlotKeys: true });
        const restrictionWarnings = restrictionWarningDetails.map(entry => entry.message);

        const nextSoftErrorSlotKeys = new Set(
            restrictionWarningDetails
                .map(entry => entry.slotKey)
                .filter(Boolean)
        );
        const slotErrorSetChanged = nextSoftErrorSlotKeys.size !== softErrorSlotKeys.size
            || Array.from(nextSoftErrorSlotKeys).some(slotKey => !softErrorSlotKeys.has(slotKey));
        softErrorSlotKeys = nextSoftErrorSlotKeys;

        if (slotErrorSetChanged) {
            renderPaperDoll();
        }

        rootEls.baseSummary.innerHTML = [
            `<div class="gear-chip">Build Level: ${base.level}</div>`,
            `<div class="gear-chip">BAB: +${base.bab}</div>`,
            `<div class="gear-chip">Fort: +${base.fort}</div>`,
            `<div class="gear-chip">Ref: +${base.ref}</div>`,
            `<div class="gear-chip">Will: +${base.will}</div>`,
            `<div class="gear-chip">HP: ${base.hp}</div>`
        ].join('');

        rootEls.gearSummary.innerHTML = [
            `<div class="gear-chip">Attack Bonus: +${derived.attackBonus}</div>`,
            `<div class="gear-chip">Damage Bonus (avg): +${round2(derived.damageBonus)}</div>`,
            `<div class="gear-chip">Damage Adds: ${damageAddSummary}</div>`,
            `<div class="gear-chip">Massive Criticals (avg): +${round2(derived.critDamageBonus)}</div>`,
            `<div class="gear-chip">Fort: +${derived.fort}</div>`,
            `<div class="gear-chip">Ref: +${derived.ref}</div>`,
            `<div class="gear-chip">Will: +${derived.will}</div>`,
            `<div class="gear-chip">HP: ${derived.hp}</div>`,
            `<div class="gear-chip">AC bonus total: +${round2(derived.ac.total)}</div>`,
            `<div class="gear-chip">Armor ${round2(derived.ac.armor)} | Shield ${round2(derived.ac.shield)} | Natural ${round2(derived.ac.natural)} | Deflection ${round2(derived.ac.deflection)} | Dodge ${round2(derived.ac.dodge)}</div>`,
            `<div class="gear-chip">Spell Resistance: ${derived.spellResistance || 0}</div>`
        ].join('');

        rootEls.totalMotes.textContent = `Total Motes: ${formatMote(totalMotes)}`;

        const flagList = Array.from(effects.flags);
        const uniqueSituational = Array.from(new Set(effects.situational));

        const flagLines = [
            `<div>Flags: ${escapeHtml(flagList.length > 0 ? flagList.join(', ') : 'none')}</div>`
        ];

        if (uniqueSituational.length > 0) {
            flagLines.push(`<div>Situational: ${escapeHtml(uniqueSituational.join('; '))}</div>`);
        }

        if (restrictionWarnings.length > 0) {
            flagLines.push('<div>Soft Errors:</div>');
            restrictionWarnings.forEach(message => {
                flagLines.push(`<div class="gear-soft-error-line">- ${escapeHtml(message)}</div>`);
            });
        }

        rootEls.flags.innerHTML = flagLines.join('');
    }

    function renderItemMetaEditor(slotState) {
        if (!rootEls.itemMeta) return;
        const meta = slotState.meta || getDefaultItemMeta();
        const specialData = meta.special && typeof meta.special === 'object' ? meta.special : {};
        const isWeaponSlot = getSlotCategory(state.selectedSlot) === 'weapon';
        const specialKeyOptions = ITEM_SPECIAL_KEY_OPTIONS.filter(key => isWeaponSlot || key !== 'touchAttack');
        const specialKeyOptionHtml = specialKeyOptions
            .map(key => `<option value="${escapeHtml(key)}">${escapeHtml(key)}</option>`)
            .join('');
        const parseSpecialInputValue = (key, rawValue) => {
            const normalizedKey = String(key || '').trim();
            const valueType = ITEM_SPECIAL_KEY_TYPES[normalizedKey] || 'string';
            const text = String(rawValue || '').trim();

            if (valueType === 'boolean') {
                return /^(true|1|yes|y)$/i.test(text);
            }

            if (valueType === 'array') {
                if (!text) return [];
                if (text.startsWith('[')) {
                    try {
                        const parsed = JSON.parse(text);
                        if (Array.isArray(parsed)) {
                            return parsed
                                .map(entry => String(entry == null ? '' : entry).trim())
                                .filter(Boolean);
                        }
                    } catch (error) {
                        // no-op
                    }
                }
                return text
                    .split(/[,;\n]/)
                    .map(token => token.trim())
                    .filter(Boolean);
            }

            if (valueType === 'object') {
                if (!text) return {};
                if (text.startsWith('{')) {
                    try {
                        const parsed = JSON.parse(text);
                        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                            return parsed;
                        }
                    } catch (error) {
                        // no-op
                    }
                }

                const pairs = text
                    .split(/[,;\n]/)
                    .map(token => token.trim())
                    .filter(Boolean);
                const output = {};
                pairs.forEach(pair => {
                    const separatorIndex = pair.indexOf(':');
                    if (separatorIndex < 0) return;
                    const subKey = pair.slice(0, separatorIndex).trim();
                    const subValueRaw = pair.slice(separatorIndex + 1).trim();
                    if (!subKey) return;
                    const asNumber = Number(subValueRaw);
                    output[subKey] = Number.isFinite(asNumber) && subValueRaw !== '' ? asNumber : subValueRaw;
                });
                return output;
            }

            return text;
        };
        const stripWikiLinkMarkup = (text) => String(text || '').replace(/\[(https?:\/\/[^\s\]]+)\s+([^\]]+)\]/g, '$2').trim();
        const isSpecialValueVisible = (key, value) => {
            if (key === 'touchAttack' && !isWeaponSlot) return false;
            if (value === null || value === undefined) return false;
            if (typeof value === 'string') {
                const trimmed = value.trim();
                if (!trimmed) return false;
                if (trimmed === '-' || trimmed === '—') return false;
                return true;
            }
            if (Array.isArray(value)) {
                return value.some(entry => isSpecialValueVisible(key, entry));
            }
            if (typeof value === 'object') {
                return Object.entries(value).some(([childKey, childValue]) => isSpecialValueVisible(childKey, childValue));
            }
            return true;
        };
        const formatSpecialValue = (value) => {
            if (Array.isArray(value)) {
                const visibleEntries = value.filter(entry => isSpecialValueVisible('', entry));
                if (visibleEntries.length === 0) return '';
                return visibleEntries.map(entry => formatSpecialValue(entry)).join(', ');
            }
            if (value && typeof value === 'object') {
                const entries = Object.entries(value).filter(([key, entryValue]) => isSpecialValueVisible(key, entryValue));
                if (entries.length === 0) return '';
                return entries
                    .map(([key, entryValue]) => `${key}: ${formatSpecialValue(entryValue)}`)
                    .join('; ');
            }
            if (value === null || value === undefined || value === '') return '';
            if (typeof value === 'boolean') return value ? 'true' : 'false';
            return stripWikiLinkMarkup(String(value));
        };
        const formatSpecialValueForInput = (key, value) => {
            const valueType = ITEM_SPECIAL_KEY_TYPES[String(key || '').trim()] || 'string';
            if (valueType === 'array') {
                return Array.isArray(value) ? value.map(entry => stripWikiLinkMarkup(String(entry || ''))).filter(Boolean).join(', ') : '';
            }
            if (valueType === 'object') {
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    return JSON.stringify(value);
                }
                return '';
            }
            if (valueType === 'boolean') {
                return value ? 'true' : 'false';
            }
            return stripWikiLinkMarkup(String(value || ''));
        };
        const visibleSpecialEntries = Object.entries(specialData)
            .filter(([key, value]) => isSpecialValueVisible(key, value));
        const specialRowsHtml = visibleSpecialEntries.length === 0
            ? '<tr><td colspan="3" class="muted-note">No Item.Special data.</td></tr>'
            : visibleSpecialEntries
                .map(([key, value]) => `
                    <tr class="gear-special-row">
                        <td class="gear-special-key-col">${escapeHtml(key)}</td>
                        <td style="white-space:normal; overflow-wrap:anywhere;">${escapeHtml(formatSpecialValue(value))}</td>
                        <td class="gear-special-action-col">
                            <button type="button" class="gear-special-row-action" data-special-edit-key="${escapeHtml(key)}">Edit</button>
                        </td>
                    </tr>
                `)
                .join('');
        const knowWhatImDoing = isKnowWhatImDoingActive();
        const compatibleCraftedEntries = knowWhatImDoing
            ? craftedTemplateEntries
            : craftedTemplateEntries.filter(entry => isTemplateCompatibleWithSlot(entry.template, state.selectedSlot));

        const selectedTemplateEntry = meta.craftedTemplateKey
            ? craftedTemplateLookup.get(meta.craftedTemplateKey)
            : null;

        const selectedTemplateIsCompatible = !selectedTemplateEntry
            || knowWhatImDoing
            || isTemplateCompatibleWithSlot(selectedTemplateEntry.template, state.selectedSlot);

        const craftedEntriesForOptions = selectedTemplateEntry && !selectedTemplateIsCompatible
            ? [selectedTemplateEntry].concat(compatibleCraftedEntries.filter(entry => entry.key !== selectedTemplateEntry.key))
            : compatibleCraftedEntries;

        const focusOptions = ['<option value="">-- Select focus group --</option>']
            .concat(WEAPON_FOCUS_GROUPS.map(group => `<option value="${escapeHtml(group)}">${escapeHtml(group)}</option>`))
            .join('');
        const baseWeaponOptions = ['<option value="">-- Select base weapon --</option>']
            .concat(BASE_WEAPON_DATA.map(weapon => `<option value="${escapeHtml(weapon.name)}">${escapeHtml(weapon.name)}</option>`))
            .join('');
        const craftedTemplateOptions = craftedTemplatesLoaded
            ? ['<option value="">-- Select crafted item template --</option>']
                .concat(craftedEntriesForOptions.map(entry => {
                    const incompatibleSelected = selectedTemplateEntry
                        && entry.key === selectedTemplateEntry.key
                        && !selectedTemplateIsCompatible;
                    const suffix = incompatibleSelected ? ' [slot mismatch]' : '';
                    return `<option value="${escapeHtml(entry.key)}">${escapeHtml(`${entry.label}${suffix}`)}</option>`;
                }))
                .join('')
            : '<option value="">Loading crafted templates...</option>';
        const baseDamageTypeOptions = BASE_WEAPON_DAMAGE_TYPES
            .map(type => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`)
            .join('');
        const showWeaponOptions = state.selectedSlot === 'mainHand' || state.selectedSlot === 'offHand';
        const showWearableOptions = !showWeaponOptions;

        const section = document.createElement('div');
        section.innerHTML = `
            <div class="gear-drawer ${state.ui.baseDrawerOpen ? 'open' : ''}" id="drawer_baseSetup">
                <button type="button" class="gear-drawer-header" id="drawer_baseSetup_btn">Base Item Setup</button>
                <div class="gear-drawer-body">
                    <div class="gear-field-row">
                        <label style="min-width:90px; font-weight:bold;">Crafted Item</label>
                        <select id="meta_craftedTemplate">${craftedTemplateOptions}</select>
                    </div>

                    ${showWeaponOptions ? `
                    <div class="gear-drawer ${state.ui.weaponOptionsDrawerOpen ? 'open' : ''}" id="drawer_weaponOptions">
                        <button type="button" class="gear-drawer-header" id="drawer_weaponOptions_btn">Weapon Options</button>
                        <div class="gear-drawer-body">
                            <div class="gear-field-row">
                                <label style="min-width:90px; font-weight:bold;">Base Weapon</label>
                                <select id="meta_baseWeaponChart">${baseWeaponOptions}</select>
                            </div>
                            <div class="gear-field-row">
                                <label style="min-width:90px; font-weight:bold;">Weapon Type</label>
                                <input id="meta_baseWeaponType" type="text" placeholder="e.g. Longsword" value="${escapeHtml(meta.baseWeaponType || '')}">
                                <label style="min-width:80px; font-weight:bold;">Finesse</label>
                                <select id="meta_finesse">
                                    <option value="">--</option>
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                    <option value="na">N/A</option>
                                </select>
                            </div>
                            <div class="gear-field-row">
                                <label style="min-width:90px; font-weight:bold;">Focus Group</label>
                                <select id="meta_focusGroup">${focusOptions}</select>
                                <label style="min-width:80px; font-weight:bold;">Proficiency</label>
                                <input id="meta_proficiency" type="text" placeholder="e.g. Martial, Rogue" value="${escapeHtml(meta.proficiency || '')}">
                            </div>
                            <div class="gear-field-row">
                                <label style="min-width:90px; font-weight:bold;">Base Damage</label>
                                <input id="meta_baseDamage" type="text" placeholder="e.g. 1d8" value="${escapeHtml(meta.baseDamage || '')}">
                                <label style="min-width:80px; font-weight:bold;">Crit Range</label>
                                <input id="meta_critRange" type="text" placeholder="e.g. 19-20/x2" value="${escapeHtml(meta.critRange || '')}">
                            </div>
                            <div class="gear-field-row">
                                <label style="min-width:90px; font-weight:bold;">Damage Type</label>
                                <select id="meta_damageType">${baseDamageTypeOptions}</select>
                            </div>
                            <div class="gear-field-row">
                                <label style="min-width:90px; font-weight:bold;">Tags</label>
                                <label><input id="meta_concussion" type="checkbox"> Concussion</label>
                                <label><input id="meta_oneHandEdged" type="checkbox"> 1H Edged</label>
                                <label><input id="meta_twoHanded" type="checkbox"> 2-Handed</label>
                                <label><input id="meta_polearm" type="checkbox"> Polearm</label>
                                <label><input id="meta_unarmed" type="checkbox"> Unarmed</label>
                                <label><input id="meta_missile" type="checkbox"> Missile</label>
                                <label><input id="meta_thrown" type="checkbox"> Thrown</label>
                            </div>
                        </div>
                    </div>
                    ` : ''}

                    ${showWearableOptions ? `
                    <div class="gear-drawer ${state.ui.wearableOptionsDrawerOpen ? 'open' : ''}" id="drawer_wearableOptions">
                        <button type="button" class="gear-drawer-header" id="drawer_wearableOptions_btn">Wearable Options</button>
                        <div class="gear-drawer-body">
                            <div class="gear-field-row">
                                <label style="min-width:90px; font-weight:bold;">Base Armor</label>
                                <input id="meta_baseArmor" type="number" min="0" step="1" value="${Number(meta.baseArmor) || 0}">
                            </div>
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>

            <div class="gear-drawer ${state.ui.restrictionDrawerOpen ? 'open' : ''}" id="drawer_restrictions">
                <button type="button" class="gear-drawer-header" id="drawer_restrictions_btn">Restrictions & Bypass</button>
                <div class="gear-drawer-body">
                    <div class="gear-field-row">
                        <label style="min-width:90px; font-weight:bold;">Class Restrict</label>
                        <input id="meta_classRestriction" type="text" placeholder="e.g. Fighter, Paladin" value="${escapeHtml(meta.classRestriction || '')}">
                        <label style="min-width:80px; font-weight:bold;">Min Level</label>
                        <input id="meta_minClassLevel" type="number" min="0" step="1" value="${Number(meta.minClassLevel) || 0}">
                    </div>
                    <div class="gear-field-row">
                        <label style="min-width:90px; font-weight:bold;">Race Restrict</label>
                        <input id="meta_raceRestriction" type="text" placeholder="e.g. Human, Elf" value="${escapeHtml(meta.raceRestriction || '')}">
                    </div>
                    <div class="gear-field-row">
                        <label style="min-width:90px; font-weight:bold;">UMD Bypass</label>
                        <input id="meta_umdBypass" type="number" min="0" step="1" value="${Number(meta.umdBypass) || 0}">
                        <label style="min-width:80px; font-weight:bold;">Lore Bypass</label>
                        <input id="meta_loreBypass" type="number" min="0" step="1" value="${Number(meta.loreBypass) || 0}">
                    </div>
                </div>
            </div>

            <div class="gear-drawer ${state.ui.specialDrawerOpen ? 'open' : ''}" id="drawer_itemSpecial">
                <button type="button" class="gear-drawer-header" id="drawer_itemSpecial_btn">Item.Special</button>
                <div class="gear-drawer-body">
                    <table class="gear-special-table">
                        <thead>
                            <tr>
                                <th class="gear-special-key-col">Key</th>
                                <th>Value</th>
                                <th class="gear-special-action-col"></th>
                            </tr>
                        </thead>
                        <tbody>
                            ${specialRowsHtml}
                        </tbody>
                    </table>
                    <div class="gear-special-footer">
                        <button type="button" id="meta_special_addmore_btn">Add More</button>
                    </div>
                    <div class="gear-field-row" id="meta_special_editor_row" style="display:none; align-items:flex-start;">
                        <label style="min-width:90px; font-weight:bold;">Key</label>
                        <select id="meta_special_key">${specialKeyOptionHtml}</select>
                        <label style="min-width:80px; font-weight:bold;">Value</label>
                        <input id="meta_special_value" type="text" placeholder="Comma-separated, JSON, or plain value">
                        <button type="button" id="meta_special_save_btn">Save</button>
                        <button type="button" id="meta_special_cancel_btn">Cancel</button>
                    </div>
                    <div class="muted-note">Use the existing Item.Special keys. Arrays accept comma-separated values or JSON arrays.</div>
                </div>
            </div>
        `;

        rootEls.itemMeta.innerHTML = '';
        rootEls.itemMeta.appendChild(section);

        const damageTypeSelect = section.querySelector('#meta_damageType');
        if (damageTypeSelect) {
            const normalizedDamageType = normalizeBaseDamageType(meta.damageType || 'slashing');
            damageTypeSelect.value = BASE_WEAPON_DAMAGE_TYPES.includes(normalizedDamageType) ? normalizedDamageType : 'slashing';
            meta.damageType = damageTypeSelect.value;
        }

        const focusGroupSelect = section.querySelector('#meta_focusGroup');
        if (focusGroupSelect) {
            focusGroupSelect.value = meta.focusGroup || '';
        }

        const baseWeaponSelect = section.querySelector('#meta_baseWeaponChart');
        if (baseWeaponSelect) {
            baseWeaponSelect.value = meta.baseWeaponChart || '';
        }

        const craftedTemplateSelect = section.querySelector('#meta_craftedTemplate');
        if (craftedTemplateSelect) {
            craftedTemplateSelect.value = meta.craftedTemplateKey || '';
            craftedTemplateSelect.disabled = !craftedTemplatesLoaded;
        }

        const finesseSelect = section.querySelector('#meta_finesse');
        if (finesseSelect) {
            finesseSelect.value = String(meta.finesse || '').toLowerCase();
        }

        const syncTagCheckboxes = () => {
            const setChecked = (selector, value) => {
                const checkbox = section.querySelector(selector);
                if (checkbox) checkbox.checked = Boolean(value);
            };
            setChecked('#meta_concussion', meta.concussion);
            setChecked('#meta_oneHandEdged', meta.oneHandEdged);
            setChecked('#meta_twoHanded', meta.twoHanded);
            setChecked('#meta_polearm', meta.polearm);
            setChecked('#meta_unarmed', meta.unarmed);
            setChecked('#meta_missile', meta.missile);
            setChecked('#meta_thrown', meta.thrown);
        };
        syncTagCheckboxes();

        const bindInput = (selector, key, parser = (value) => value) => {
            const input = section.querySelector(selector);
            if (!input) return;
            input.addEventListener('input', () => {
                meta[key] = parser(input.value);
                slotState.meta = meta;
                scheduleGearRefreshAndValidation();
            });
            input.addEventListener('change', () => {
                meta[key] = parser(input.value);
                slotState.meta = meta;
                scheduleGearRefreshAndValidation();
            });
        };

        const bindCheckbox = (selector, key) => {
            const input = section.querySelector(selector);
            if (!input) return;
            input.addEventListener('change', () => {
                meta[key] = Boolean(input.checked);
                slotState.meta = meta;
                scheduleGearRefreshAndValidation();
            });
        };

        const applyBaseWeaponSelection = () => {
            const selected = baseWeaponSelect ? String(baseWeaponSelect.value || '').trim().toLowerCase() : '';
            const weapon = selected ? BASE_WEAPON_LOOKUP.get(selected) : null;
            if (!weapon) return;
            applyBaseWeaponMeta(meta, weapon);
            slotState.meta = meta;
            renderEditor();
            scheduleGearRefreshAndValidation();
        };

        if (craftedTemplateSelect) {
            craftedTemplateSelect.addEventListener('change', () => {
                const selectedKey = craftedTemplateSelect.value || '';
                meta.craftedTemplateKey = selectedKey;
                slotState.meta = meta;

                if (!selectedKey) {
                    scheduleGearRefreshAndValidation();
                    return;
                }

                const templateEntry = craftedTemplateLookup.get(selectedKey);
                if (!templateEntry) {
                    scheduleGearRefreshAndValidation();
                    return;
                }

                applyCraftedTemplateToSlot(slotState, templateEntry);
                renderPaperDoll();
                renderEditor();
                scheduleGearRefreshAndValidation();
            });
        }

        if (baseWeaponSelect) {
            baseWeaponSelect.addEventListener('change', () => {
                meta.baseWeaponChart = baseWeaponSelect.value || '';
                slotState.meta = meta;
                applyBaseWeaponSelection();
            });
        }

        const baseDrawer = section.querySelector('#drawer_baseSetup');
        const restrictionDrawer = section.querySelector('#drawer_restrictions');
        const specialDrawer = section.querySelector('#drawer_itemSpecial');
        const weaponOptionsDrawer = section.querySelector('#drawer_weaponOptions');
        const wearableOptionsDrawer = section.querySelector('#drawer_wearableOptions');
        const baseDrawerBtn = section.querySelector('#drawer_baseSetup_btn');
        const restrictionDrawerBtn = section.querySelector('#drawer_restrictions_btn');
        const specialDrawerBtn = section.querySelector('#drawer_itemSpecial_btn');
        const weaponOptionsDrawerBtn = section.querySelector('#drawer_weaponOptions_btn');
        const wearableOptionsDrawerBtn = section.querySelector('#drawer_wearableOptions_btn');

        if (baseDrawer && baseDrawerBtn) {
            baseDrawerBtn.addEventListener('click', () => {
                state.ui.baseDrawerOpen = !state.ui.baseDrawerOpen;
                baseDrawer.classList.toggle('open', state.ui.baseDrawerOpen);
            });
        }

        if (restrictionDrawer && restrictionDrawerBtn) {
            restrictionDrawerBtn.addEventListener('click', () => {
                state.ui.restrictionDrawerOpen = !state.ui.restrictionDrawerOpen;
                restrictionDrawer.classList.toggle('open', state.ui.restrictionDrawerOpen);
            });
        }

        if (specialDrawer && specialDrawerBtn) {
            specialDrawerBtn.addEventListener('click', () => {
                state.ui.specialDrawerOpen = !state.ui.specialDrawerOpen;
                specialDrawer.classList.toggle('open', state.ui.specialDrawerOpen);
            });
        }

        const specialEditorRow = section.querySelector('#meta_special_editor_row');
        const specialKeySelect = section.querySelector('#meta_special_key');
        const specialValueInput = section.querySelector('#meta_special_value');
        const specialSaveBtn = section.querySelector('#meta_special_save_btn');
        const specialCancelBtn = section.querySelector('#meta_special_cancel_btn');
        const specialAddMoreBtn = section.querySelector('#meta_special_addmore_btn');
        let specialEditingKey = null;

        const openSpecialEditor = (key, existingValue) => {
            if (!specialEditorRow || !specialKeySelect || !specialValueInput) return;
            specialEditingKey = key ? String(key).trim() : null;
            const fallbackKey = specialKeyOptions.length > 0 ? specialKeyOptions[0] : '';
            const targetKey = specialEditingKey && specialKeyOptions.includes(specialEditingKey)
                ? specialEditingKey
                : fallbackKey;
            specialKeySelect.value = targetKey;
            specialValueInput.value = targetKey
                ? formatSpecialValueForInput(targetKey, existingValue)
                : '';
            specialEditorRow.style.display = 'flex';
            specialValueInput.focus();
        };

        const closeSpecialEditor = () => {
            if (!specialEditorRow) return;
            specialEditingKey = null;
            specialEditorRow.style.display = 'none';
            if (specialValueInput) specialValueInput.value = '';
        };

        const applySpecialEdit = () => {
            if (!specialKeySelect || !specialValueInput) return;
            const key = String(specialKeySelect.value || '').trim();
            if (!key) return;
            if (!meta.special || typeof meta.special !== 'object') {
                meta.special = {};
            }
            if (specialEditingKey && specialEditingKey !== key) {
                delete meta.special[specialEditingKey];
            }
            meta.special[key] = parseSpecialInputValue(key, specialValueInput.value);
            slotState.meta = meta;
            renderEditor();
            renderSummaries();
        };

        if (specialAddMoreBtn) {
            specialAddMoreBtn.addEventListener('click', () => openSpecialEditor('', ''));
        }

        section.querySelectorAll('[data-special-edit-key]').forEach(button => {
            button.addEventListener('click', () => {
                const key = String(button.getAttribute('data-special-edit-key') || '').trim();
                if (!key) return;
                openSpecialEditor(key, specialData[key]);
            });
        });

        if (specialSaveBtn) {
            specialSaveBtn.addEventListener('click', applySpecialEdit);
        }
        if (specialCancelBtn) {
            specialCancelBtn.addEventListener('click', closeSpecialEditor);
        }
        if (specialValueInput) {
            specialValueInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    applySpecialEdit();
                }
            });
        }

        if (weaponOptionsDrawer && weaponOptionsDrawerBtn) {
            weaponOptionsDrawerBtn.addEventListener('click', () => {
                state.ui.weaponOptionsDrawerOpen = !state.ui.weaponOptionsDrawerOpen;
                weaponOptionsDrawer.classList.toggle('open', state.ui.weaponOptionsDrawerOpen);
            });
        }

        if (wearableOptionsDrawer && wearableOptionsDrawerBtn) {
            wearableOptionsDrawerBtn.addEventListener('click', () => {
                state.ui.wearableOptionsDrawerOpen = !state.ui.wearableOptionsDrawerOpen;
                wearableOptionsDrawer.classList.toggle('open', state.ui.wearableOptionsDrawerOpen);
            });
        }

        bindInput('#meta_craftedTemplate', 'craftedTemplateKey', value => value || '');
        bindInput('#meta_baseWeaponChart', 'baseWeaponChart', value => value || '');
        bindInput('#meta_baseWeaponType', 'baseWeaponType', value => value || '');
        bindInput('#meta_finesse', 'finesse', value => String(value || '').toLowerCase());
        bindInput('#meta_focusGroup', 'focusGroup', value => value || '');
        bindInput('#meta_proficiency', 'proficiency', value => value || '');
        bindInput('#meta_baseDamage', 'baseDamage', value => value || '');
        bindInput('#meta_critRange', 'critRange', value => value || '');
        bindInput('#meta_damageType', 'damageType', value => normalizeBaseDamageType(value));
        bindInput('#meta_baseArmor', 'baseArmor', value => Math.max(0, parseInt(value, 10) || 0));
        bindCheckbox('#meta_concussion', 'concussion');
        bindCheckbox('#meta_oneHandEdged', 'oneHandEdged');
        bindCheckbox('#meta_twoHanded', 'twoHanded');
        bindCheckbox('#meta_polearm', 'polearm');
        bindCheckbox('#meta_unarmed', 'unarmed');
        bindCheckbox('#meta_missile', 'missile');
        bindCheckbox('#meta_thrown', 'thrown');
        bindInput('#meta_classRestriction', 'classRestriction', value => value || '');
        bindInput('#meta_minClassLevel', 'minClassLevel', value => Math.max(0, parseInt(value, 10) || 0));
        bindInput('#meta_raceRestriction', 'raceRestriction', value => value || '');
        bindInput('#meta_umdBypass', 'umdBypass', value => Math.max(0, parseInt(value, 10) || 0));
        bindInput('#meta_loreBypass', 'loreBypass', value => Math.max(0, parseInt(value, 10) || 0));
    }

    function parseList(value) {
        return String(value || '')
            .split(',')
            .map(token => token.trim())
            .filter(Boolean);
    }

    function getTemplateForSlot(slotState) {
        if (!slotState || !slotState.meta) return null;
        const templateKey = String(slotState.meta.craftedTemplateKey || '').trim();
        if (!templateKey) return null;
        const entry = craftedTemplateLookup.get(templateKey);
        return entry && entry.template ? entry.template : null;
    }

    function normalizeStatRequirementKey(statName) {
        const raw = String(statName || '').trim().toLowerCase();
        const aliases = {
            str: 'str',
            strength: 'str',
            dex: 'dex',
            dexterity: 'dex',
            con: 'con',
            constitution: 'con',
            int: 'int',
            intelligence: 'int',
            wis: 'wis',
            wisdom: 'wis',
            cha: 'cha',
            charisma: 'cha'
        };
        return aliases[raw] || '';
    }

    function normalizeRequirementSkillName(skillName) {
        const raw = String(skillName || '').trim();
        if (!raw) return '';
        if (typeof normalizeSkillKey === 'function') {
            return String(normalizeSkillKey(raw) || '').trim().toLowerCase();
        }
        return raw.toLowerCase().replace(/\s+/g, ' ').trim();
    }

    function getCharacterStatsAtLevel(level) {
        if (typeof getStatsAtLevel === 'function') {
            const stats = getStatsAtLevel(level);
            if (stats && typeof stats === 'object') {
                return stats;
            }
        }

        const readStat = (id) => Math.max(0, parseInt((document.getElementById(id) || {}).value, 10) || 10);
        return {
            str: readStat('stat_str'),
            dex: readStat('stat_dex'),
            con: readStat('stat_con'),
            int: readStat('stat_int'),
            wis: readStat('stat_wis'),
            cha: readStat('stat_cha')
        };
    }

    function getCurrentRace() {
        const raceElement = document.getElementById('raceSelect');
        return raceElement ? String(raceElement.value || '').trim() : '';
    }

    function getClassLevelAtBuildLevel(className, level) {
        if (!className) return 0;
        if (typeof getClassLevelUpTo === 'function') {
            return getClassLevelUpTo(className, level) || 0;
        }

        const levels = getPlannerLevelData();
        if (!Array.isArray(levels)) return 0;
        let count = 0;
        for (let index = 0; index < level; index++) {
            const selectedClass = levels[index] && levels[index].class ? String(levels[index].class).toLowerCase() : '';
            if (selectedClass === String(className).toLowerCase()) count += 1;
        }
        return count;
    }

    function getSkillValueAtLevel(level, skillName) {
        if (typeof getRawSkillAtLevel === 'function') {
            return Math.max(0, Number(getRawSkillAtLevel(level, skillName)) || 0);
        }
        return 0;
    }

    function getRestrictionSoftWarnings(level, options = {}) {
        const warnings = [];
        const includeSlotKeys = Boolean(options.includeSlotKeys);
        const currentRace = getCurrentRace();
        const currentStats = getCharacterStatsAtLevel(level);

        SLOT_CONFIG.forEach(slot => {
            const slotState = ensureSlotState(slot.key);
            const meta = slotState.meta || getDefaultItemMeta();
            const template = getTemplateForSlot(slotState);
            const requirements = template && template.requirements && typeof template.requirements === 'object'
                ? template.requirements
                : null;

            const requirementClassList = Array.isArray(requirements && requirements.class)
                ? requirements.class.map(name => String(name || '').trim()).filter(Boolean)
                : [];
            const requirementRaceList = Array.isArray(requirements && requirements.race)
                ? requirements.race.map(name => String(name || '').trim()).filter(Boolean)
                : [];
            const requirementLevel = Math.max(0, Number(requirements && requirements.level) || 0);

            const requirementStats = (requirements && requirements.stats && typeof requirements.stats === 'object')
                ? requirements.stats
                : {};
            const requirementSkills = (requirements && requirements.skills && typeof requirements.skills === 'object')
                ? requirements.skills
                : {};

            const restrictedClasses = requirementClassList.length > 0
                ? requirementClassList
                : parseList(meta.classRestriction);
            const restrictedRaces = requirementRaceList.length > 0
                ? requirementRaceList
                : parseList(meta.raceRestriction);
            const minClassLevel = Math.max(0, Number(meta.minClassLevel) || 0);
            const minCharacterLevel = requirementLevel;

            const hasClassRestriction = restrictedClasses.length > 0 || minClassLevel > 0;
            const hasRaceRestriction = restrictedRaces.length > 0;
            const hasCharacterLevelRequirement = minCharacterLevel > 0;

            const failedStatRequirements = [];
            Object.entries(requirementStats).forEach(([rawStatName, rawRequiredValue]) => {
                const statKey = normalizeStatRequirementKey(rawStatName);
                const requiredValue = Math.max(0, Number(rawRequiredValue) || 0);
                if (!statKey || requiredValue <= 0) return;
                const statValue = Math.max(0, Number(currentStats && currentStats[statKey]) || 0);
                if (statValue < requiredValue) {
                    failedStatRequirements.push(`${statKey.toUpperCase()} ${statValue}/${requiredValue}`);
                }
            });

            const failedSkillRequirements = [];
            Object.entries(requirementSkills).forEach(([rawSkillName, rawRequiredValue]) => {
                const skillName = normalizeRequirementSkillName(rawSkillName);
                const requiredValue = Math.max(0, Number(rawRequiredValue) || 0);
                if (!skillName || requiredValue <= 0) return;
                const skillValue = getSkillValueAtLevel(level, skillName);
                if (skillValue < requiredValue) {
                    failedSkillRequirements.push(`${skillName} ${skillValue}/${requiredValue}`);
                }
            });

            const hasStatRequirement = failedStatRequirements.length > 0 || Object.keys(requirementStats).length > 0;
            const hasSkillRequirement = failedSkillRequirements.length > 0 || Object.keys(requirementSkills).length > 0;

            if (!hasClassRestriction && !hasRaceRestriction && !hasCharacterLevelRequirement && !hasStatRequirement && !hasSkillRequirement) {
                return;
            }

            let classMet = true;
            if (restrictedClasses.length > 0) {
                classMet = restrictedClasses.some(className => {
                    const classLevel = getClassLevelAtBuildLevel(className, level);
                    const required = minClassLevel > 0 ? minClassLevel : 1;
                    return classLevel >= required;
                });
            } else if (minClassLevel > 0) {
                classMet = level >= minClassLevel;
            }

            const raceMet = restrictedRaces.length === 0
                ? true
                : restrictedRaces.some(race => String(race).toLowerCase() === String(currentRace).toLowerCase());

            const classAndRaceMet = classMet && raceMet;
            const characterLevelMet = minCharacterLevel <= 0 || level >= minCharacterLevel;
            const statRequirementsMet = failedStatRequirements.length === 0;
            const skillRequirementsMet = failedSkillRequirements.length === 0;

            const umdRequired = Math.max(0, Number(meta.umdBypass) || 0);
            const loreRequired = Math.max(0, Number(meta.loreBypass) || 0);
            const hasBypassRequirement = umdRequired > 0 || loreRequired > 0;

            let bypassMet = false;
            if (hasBypassRequirement && !classAndRaceMet) {
                const umdValue = getSkillValueAtLevel(level, 'use magic device');
                const loreValue = getSkillValueAtLevel(level, 'lore');
                bypassMet = (umdRequired > 0 && umdValue >= umdRequired) || (loreRequired > 0 && loreValue >= loreRequired);
            }

            const finalRestrictionMet = (classAndRaceMet || bypassMet) && characterLevelMet && statRequirementsMet && skillRequirementsMet;
            if (finalRestrictionMet) return;

            const label = slotState.name ? `${slot.label} (${slotState.name})` : slot.label;
            const classText = hasClassRestriction && !classMet
                ? `class ${restrictedClasses.length > 0 ? restrictedClasses.join('/') : 'any'}${minClassLevel > 0 ? ` lvl ${minClassLevel}+` : ''}`
                : '';
            const raceText = hasRaceRestriction && !raceMet ? `race ${restrictedRaces.join('/')}` : '';
            const levelText = hasCharacterLevelRequirement && !characterLevelMet ? `character level ${level}/${minCharacterLevel}` : '';
            const statsText = failedStatRequirements.length > 0 ? `stats ${failedStatRequirements.join(', ')}` : '';
            const skillsText = failedSkillRequirements.length > 0 ? `skills ${failedSkillRequirements.join(', ')}` : '';

            const unmetParts = [classText, raceText, levelText, statsText, skillsText].filter(Boolean);
            let warning = `${label} unmet (${unmetParts.length > 0 ? unmetParts.join('; ') : 'restricted'})`;

            if (!classAndRaceMet && hasBypassRequirement && !bypassMet) {
                warning += ` and bypass unmet (UMD ${umdRequired || '-'} / Lore ${loreRequired || '-'})`;
            }

            if (includeSlotKeys) {
                warnings.push({
                    slotKey: slot.key,
                    message: warning
                });
            } else {
                warnings.push(warning);
            }
        });

        return warnings;
    }

    function getItemSkillBonusForSkill(level, skillName) {
        const numericLevel = parseInt(level, 10) || 0;
        if (numericLevel < 30) return 0;

        const normalizedSkill = typeof normalizeSkillKey === 'function'
            ? normalizeSkillKey(skillName)
            : String(skillName || '').trim().toLowerCase();

        if (!normalizedSkill) return 0;

        const effects = buildGearEffects();
        return effects.itemSkillBonuses.get(normalizedSkill) || 0;
    }

    function getItemStatBonusForStat(level, statName) {
        const numericLevel = parseInt(level, 10) || 0;
        if (numericLevel < 30) return 0;

        const normalizedStat = normalizeStatRequirementKey(statName);
        if (!normalizedStat) return 0;

        const effects = buildGearEffects();
        return Number(effects.softStats[normalizedStat]) || 0;
    }

    function getItemGrantedFeatDetails(level = 30) {
        const effects = buildGearEffects();
        const ownedFeatSet = new Set();

        if (typeof getEffectiveOwnedFeatDetailsAtLevel === 'function') {
            const ownedMap = getEffectiveOwnedFeatDetailsAtLevel(level, { includeSelectedCurrentLevel: true });
            if (ownedMap && typeof ownedMap.forEach === 'function') {
                ownedMap.forEach((detail, key) => {
                    if (key) ownedFeatSet.add(String(key).toLowerCase());
                    if (detail && detail.name) {
                        const normalized = typeof resolveFeatName === 'function'
                            ? resolveFeatName(detail.name)
                            : String(detail.name);
                        ownedFeatSet.add(String(normalized).toLowerCase());
                    }
                });
            }
        }

        return Array.from(effects.itemGrantedFeats.values())
            .map(detail => {
                const normalizedName = typeof resolveFeatName === 'function'
                    ? resolveFeatName(detail.name)
                    : detail.name;
                const key = String(normalizedName || '').toLowerCase();
                const alreadyOwned = ownedFeatSet.has(key);
                return {
                    name: normalizedName || detail.name,
                    sources: Array.from(detail.sources || []).filter(Boolean),
                    stacks: !alreadyOwned,
                    alreadyOwned
                };
            })
            .sort((left, right) => left.name.localeCompare(right.name));
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function round2(value) {
        return Math.round((Number(value) || 0) * 100) / 100;
    }

    function formatMote(value) {
        const rounded = round2(value);
        return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
    }

    function patchPlannerHooks() {
        const wrap = (name, afterFn) => {
            const original = window[name];
            if (typeof original !== 'function') return;
            if (original.__gearWrapped) return;
            const wrapped = function (...args) {
                const result = original.apply(this, args);
                afterFn(args, result);
                return result;
            };
            wrapped.__gearWrapped = true;
            window[name] = wrapped;
        };

        wrap('switchTab', (args) => {
            if (args[0] === 'damageGear') {
                renderSummaries();
            }
        });

        wrap('updateGrid', () => renderSummaries());
        wrap('updateStatGrid', () => renderSummaries());
        wrap('validateCharacterRealtime', () => renderSummaries());

        wrap('getCharacterSnapshot', (args, snapshot) => {
            if (snapshot && typeof snapshot === 'object') {
                snapshot.gearPlanner = getGearPlannerSnapshot();
            }
        });

        wrap('applyCharacterSnapshot', (args) => {
            const character = args[0];
            if (character && character.gearPlanner) {
                applyGearPlannerSnapshot(character.gearPlanner);
            } else {
                resetGearPlannerState();
            }
            renderSummaries();
        });

        wrap('newCharacter', () => {
            resetGearPlannerState();
            renderSummaries();
        });
    }

    function getGearPlannerSnapshot() {
        return {
            selectedSlot: state.selectedSlot,
            slots: JSON.parse(JSON.stringify(state.slots))
        };
    }

    function applyGearPlannerSnapshot(snapshot) {
        if (!snapshot || typeof snapshot !== 'object') {
            resetGearPlannerState();
            return;
        }

        state.selectedSlot = snapshot.selectedSlot || 'mainHand';
        state.slots = {};

        SLOT_CONFIG.forEach(slot => {
            const incomingSlot = snapshot.slots && snapshot.slots[slot.key] ? snapshot.slots[slot.key] : null;
            const slotState = ensureSlotState(slot.key);
            if (incomingSlot && typeof incomingSlot === 'object') {
                slotState.name = typeof incomingSlot.name === 'string' ? incomingSlot.name : '';
                slotState.offHandType = incomingSlot.offHandType === 'weapon' ? 'weapon' : 'shield';
                slotState.properties = Array.isArray(incomingSlot.properties)
                    ? incomingSlot.properties
                        .filter(prop => prop && typeof prop === 'object' && typeof prop.type === 'string')
                        .map(prop => ({
                            id: prop.id || `${Date.now()}_${Math.floor(Math.random() * 100000)}`,
                            type: PROPERTY_TYPES.includes(prop.type) ? prop.type : 'Ability',
                            innate: INNATE_ONLY_TYPES.has(prop.type) ? true : Boolean(prop.innate),
                            params: typeof prop.params === 'object' && prop.params ? prop.params : defaultParamsForType(prop.type)
                        }))
                    : [];

                slotState.meta = incomingSlot.meta && typeof incomingSlot.meta === 'object'
                    ? {
                        ...getDefaultItemMeta(),
                        ...incomingSlot.meta
                    }
                    : getDefaultItemMeta();
            }
        });

        if (!SLOT_CONFIG.some(slot => slot.key === state.selectedSlot)) {
            state.selectedSlot = 'mainHand';
        }

        renderPaperDoll();
        renderEditor();
        scheduleGearRefreshAndValidation();
    }

    function resetGearPlannerState() {
        state.selectedSlot = 'mainHand';
        state.slots = {};
        SLOT_CONFIG.forEach(slot => ensureSlotState(slot.key));
        renderPaperDoll();
        renderEditor();
        scheduleGearRefreshAndValidation();
    }

    window.getGearPlannerSnapshot = getGearPlannerSnapshot;
    window.applyGearPlannerSnapshot = applyGearPlannerSnapshot;
    window.resetGearPlannerState = resetGearPlannerState;
    window.refreshGearPlannerDerivedSummary = renderSummaries;
    window.getItemGrantedFeatDetails = getItemGrantedFeatDetails;
    window.getItemSkillBonusForSkill = getItemSkillBonusForSkill;
    window.getItemStatBonusForStat = getItemStatBonusForStat;

    document.addEventListener('DOMContentLoaded', init);
})();

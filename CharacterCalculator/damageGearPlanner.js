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

    const DEFAULT_PROPERTY_TYPES = [
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

    const DEFAULT_INNATE_ONLY_TYPES = [
        'Regeneration',
        'Vampiric Regeneration',
        'Armor vs Damage type/Race/Alignment',
        'Enhancement vs Alignment/Race',
        'Damage vs Alignment/Race/Alignment',
        'Attack Bonus vs Alignment/Race/Alignment',
        'Granted Feat'
    ];

    const DEFAULT_PROPERTY_PARAM_ROWS = [
        { type: 'Ability', params: { stat: 'str', value: 1 } },
        { type: 'Armor', params: { value: 1, target: '', save: 'fort', saveKind: 'other', skill: '' } },
        { type: 'Armor vs Damage type/Race/Alignment', params: { value: 1, target: '', save: 'fort', saveKind: 'other', skill: '' } },
        { type: 'Enhancement', params: { value: 1, target: '', save: 'fort', saveKind: 'other', skill: '' } },
        { type: 'Enhancement vs Alignment/Race', params: { value: 1, target: '', save: 'fort', saveKind: 'other', skill: '' } },
        { type: 'Mighty', params: { value: 1, target: '', save: 'fort', saveKind: 'other', skill: '' } },
        { type: 'Regeneration', params: { value: 1, target: '', save: 'fort', saveKind: 'other', skill: '' } },
        { type: 'Skill', params: { value: 1, target: '', save: 'fort', saveKind: 'other', skill: '' } },
        { type: 'Attack Bonus', params: { value: 1, target: '', save: 'fort', saveKind: 'other', skill: '' } },
        { type: 'Attack Bonus vs Alignment/Race/Alignment', params: { value: 1, target: '', save: 'fort', saveKind: 'other', skill: '' } },
        { type: 'Vampiric Regeneration', params: { value: 1, target: '', save: 'fort', saveKind: 'other', skill: '' } },
        { type: 'Specific Saving Throws', params: { saveKind: 'universal' } },
        { type: 'General Saving Throws', params: { save: 'fort' } },
        { type: 'Weight Reduction', params: { reduction: 90 } },
        { type: 'Bonus Spell Slots', params: { casterClass: 'Bard', spellLevel: 1, slots: 1 } },
        { type: 'Damage', params: { damageType: 'Acid', mode: 'flat2', avgDamage: 2, diceLabel: '+2' } },
        { type: 'Damage vs Alignment/Race/Alignment', params: { damageType: 'Acid', mode: 'flat2', avgDamage: 2, target: '', diceLabel: '+2' } },
        { type: 'Massive Criticals', params: { mode: 'flat4', avgDamage: 4, diceLabel: '4' } },
        { type: 'Damage Immunity', params: { damageType: 'Acid', percent: 5 } },
        { type: 'Damage Vulnerability', params: { damageType: 'Acid', percent: 5 } },
        { type: 'Damage Reduction', params: { soak: 5, pierce: 1 } },
        { type: 'Damage Resist', params: { resist: 5 } },
        { type: 'Spell Resistance', params: { sr: 10 } },
        { type: 'Keen', params: { profile: '20' } },
        { type: 'Granted Feat', params: { featName: '' } }
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
    const DEFAULT_WEAPON_FOCUS_GROUPS = [
        'Concussion',
        'Two-Handed',
        'Polearm',
        'One-Handed Edge',
        'Unarmed',
        'Missle',
        'Thrown'
    ];
    const DEFAULT_BASE_WEAPON_DAMAGE_TYPES = [
        'slashing',
        'bludgeoning',
        'piercing',
        'slashing-piercing',
        'bludgeoning-piercing',
        'slashing-bludgeoning'
    ];
    const DEFAULT_ITEM_SPECIAL_KEY_ROWS = [
        { key: 'castSpells', valueType: 'array' },
        { key: 'extraMeleeDamageTypes', valueType: 'array' },
        { key: 'extraDamageTypes', valueType: 'array' },
        { key: 'aprConditions', valueType: 'array' },
        { key: 'weightIncrease', valueType: 'string' },
        { key: 'weightReductionText', valueType: 'string' },
        { key: 'arcaneSpellFailure', valueType: 'string' },
        { key: 'allowedBaseTypes', valueType: 'array' },
        { key: 'armorBonusBySubtype', valueType: 'object' },
        { key: 'touchAttack', valueType: 'boolean' },
        { key: 'ammoNotes', valueType: 'array' },
        { key: 'notes', valueType: 'array' }
    ];

    const DEFAULT_ITEM_META_DEFAULTS = {
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
        ranged: false,
        baseArmor: 0,
        baseArmorType: '',
        maxDexAc: null,
        arcaneSpellFailure: 0,
        armorCheckPenalty: 0,
        applyArmorCheckPenalty: true,
        classRestriction: '',
        minClassLevel: 0,
        raceRestriction: '',
        umdBypass: 0,
        loreBypass: 0
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
    const BUFF_DEFINITION_KEYS = [
        'id',
        'name',
        'label',
        'description',
        'category',
        'modifies',
        'mode',
        'value',
        'hasCasterLevel',
        'minCasterLevel',
        'maxCasterLevel',
        'hasSecondCast',
        'secondCastMode',
        'secondCastValue',
        'statBuff',
        'mutuallyExclusiveWith',
        'requiresFeat',
        'requiresClass',
        'requiresClassLevel',
        'derivedEffects',
        'notes',
        'enabledByDefault',
        'uiOrder'
    ];

    const BUFF_GROUP_KEYS = [
        'id',
        'name',
        'label',
        'color',
        'uiOrder',
        'notes'
    ];

    function createBlankBuffDefinition() {
        return {
            id: '',
            name: '',
            label: '',
            groupId: '',
            description: '',
            category: '',
            modifies: [],
            mode: 'flat',
            value: 0,
            hasCasterLevel: false,
            minCasterLevel: null,
            maxCasterLevel: null,
            hasSecondCast: false,
            secondCastMode: null,
            secondCastValue: null,
            statBuff: null,
            mutuallyExclusiveWith: [],
            requiresFeat: null,
            requiresClass: null,
            requiresClassLevel: null,
            derivedEffects: [],
            notes: null,
            enabledByDefault: false,
            uiOrder: 0
        };
    }

    function normalizeBuffDefinitionRow(rawRow, index = 0) {
        const raw = rawRow && typeof rawRow === 'object' ? rawRow : {};
        const normalized = createBlankBuffDefinition();
        BUFF_DEFINITION_KEYS.forEach(key => {
            if (Object.prototype.hasOwnProperty.call(raw, key)) {
                normalized[key] = raw[key];
            }
        });
        if (Object.prototype.hasOwnProperty.call(raw, 'groupId')) {
            normalized.groupId = raw.groupId;
        }

        normalized.id = String(normalized.id || normalized.name || `buff_${index + 1}`).trim().toLowerCase();
        normalized.name = String(normalized.name || normalized.id || `buff_${index + 1}`).trim().toLowerCase();
        normalized.label = String(normalized.label || normalized.name || `Buff ${index + 1}`).trim();
        normalized.groupId = normalized.groupId == null ? '' : String(normalized.groupId).trim().toLowerCase();
        normalized.description = normalized.description == null ? '' : String(normalized.description).trim();
        normalized.category = normalized.category == null ? '' : String(normalized.category).trim();
        normalized.mode = String(normalized.mode || 'flat').trim().toLowerCase() || 'flat';
        normalized.value = Number.isFinite(Number(normalized.value)) ? Number(normalized.value) : 0;
        normalized.hasCasterLevel = Boolean(normalized.hasCasterLevel);
        normalized.minCasterLevel = Number.isFinite(Number(normalized.minCasterLevel)) ? Number(normalized.minCasterLevel) : null;
        normalized.maxCasterLevel = Number.isFinite(Number(normalized.maxCasterLevel)) ? Number(normalized.maxCasterLevel) : null;
        normalized.hasSecondCast = Boolean(normalized.hasSecondCast);
        normalized.secondCastMode = normalized.secondCastMode == null ? null : String(normalized.secondCastMode).trim().toLowerCase();
        normalized.secondCastValue = Number.isFinite(Number(normalized.secondCastValue)) ? Number(normalized.secondCastValue) : null;
        normalized.statBuff = normalized.statBuff == null ? null : String(normalized.statBuff).trim().toLowerCase();
        normalized.requiresFeat = normalized.requiresFeat == null ? null : String(normalized.requiresFeat).trim();
        normalized.requiresClass = normalized.requiresClass == null ? null : String(normalized.requiresClass).trim();
        normalized.requiresClassLevel = Number.isFinite(Number(normalized.requiresClassLevel)) ? Number(normalized.requiresClassLevel) : null;
        normalized.derivedEffects = Array.isArray(normalized.derivedEffects)
            ? normalized.derivedEffects
                .filter(effect => effect && typeof effect === 'object')
                .map((effect, effectIndex) => {
                    const legacyModifier = Array.isArray(effect.modifies)
                        ? String(effect.modifies[0] || '').trim()
                        : '';
                    const legacy = legacyModifierToDerivedEffectType(legacyModifier);
                    const explicitType = String(effect.effectType || '').trim();
                    const explicitTarget = effect.target == null ? '' : String(effect.target).trim().toLowerCase();
                    return {
                        id: String(effect.id || `derived_${effectIndex + 1}`).trim().toLowerCase(),
                        label: String(effect.label || '').trim(),
                        effectType: (explicitType || legacy.effectType || '').trim(),
                        target: (explicitTarget || legacy.target || '') || null,
                        mode: String(effect.mode || 'flat').trim().toLowerCase() || 'flat',
                        value: Number.isFinite(Number(effect.value)) ? Number(effect.value) : 0,
                        valueSource: String(effect.valueSource || 'constant').trim(),
                        minValue: (effect.minValue !== null
                            && effect.minValue !== undefined
                            && String(effect.minValue).trim() !== ''
                            && Number.isFinite(Number(effect.minValue)))
                            ? Number(effect.minValue)
                            : null,
                        maxValue: (effect.maxValue !== null
                            && effect.maxValue !== undefined
                            && String(effect.maxValue).trim() !== ''
                            && Number.isFinite(Number(effect.maxValue)))
                            ? Number(effect.maxValue)
                            : null,
                        notes: effect.notes == null ? null : String(effect.notes).trim()
                    };
                })
            : [];
        normalized.notes = normalized.notes == null ? null : String(normalized.notes).trim();
        normalized.enabledByDefault = Boolean(normalized.enabledByDefault);
        normalized.uiOrder = Number.isFinite(Number(normalized.uiOrder)) ? Number(normalized.uiOrder) : index;

        normalized.modifies = Array.isArray(normalized.modifies)
            ? normalized.modifies.map(value => String(value || '').trim()).filter(Boolean)
            : [];

        normalized.mutuallyExclusiveWith = Array.isArray(normalized.mutuallyExclusiveWith)
            ? normalized.mutuallyExclusiveWith.map(value => String(value || '').trim().toLowerCase()).filter(Boolean)
            : [];

        return normalized;
    }

    function toRuntimeBuffDefinition(row, index = 0) {
        const normalized = normalizeBuffDefinitionRow(row, index);
        return {
            name: normalized.name,
            label: normalized.label,
            modifies: normalized.modifies,
            mode: normalized.mode,
            value: normalized.value,
            hasCasterLevel: normalized.hasCasterLevel,
            minCasterLevel: normalized.minCasterLevel == null ? 1 : normalized.minCasterLevel,
            maxCasterLevel: normalized.maxCasterLevel == null ? 30 : normalized.maxCasterLevel,
            hasSecondCast: normalized.hasSecondCast,
            statBuff: normalized.statBuff,
            groupId: normalized.groupId,
            mutuallyExclusiveWith: normalized.mutuallyExclusiveWith,
            derivedEffects: normalized.derivedEffects,
            enabledByDefault: normalized.enabledByDefault,
            uiOrder: normalized.uiOrder
        };
    }

    function createBlankBuffGroupDefinition() {
        return {
            id: '',
            name: '',
            label: '',
            color: '',
            uiOrder: 0,
            notes: null
        };
    }

    function normalizeBuffGroupRow(rawRow, index = 0) {
        const raw = rawRow && typeof rawRow === 'object' ? rawRow : {};
        const normalized = createBlankBuffGroupDefinition();
        BUFF_GROUP_KEYS.forEach(key => {
            if (Object.prototype.hasOwnProperty.call(raw, key)) {
                normalized[key] = raw[key];
            }
        });

        normalized.id = String(normalized.id || normalized.name || `buff_group_${index + 1}`).trim().toLowerCase();
        normalized.name = String(normalized.name || normalized.id || `buff_group_${index + 1}`).trim().toLowerCase();
        normalized.label = String(normalized.label || normalized.name || `Buff Group ${index + 1}`).trim();
        normalized.color = normalized.color == null ? '' : String(normalized.color).trim();
        normalized.uiOrder = Number.isFinite(Number(normalized.uiOrder)) ? Number(normalized.uiOrder) : index;
        normalized.notes = normalized.notes == null ? null : String(normalized.notes).trim();
        return normalized;
    }

    function toRuntimeBuffGroupDefinition(row, index = 0) {
        const normalized = normalizeBuffGroupRow(row, index);
        return {
            id: normalized.id,
            name: normalized.name,
            label: normalized.label,
            color: normalized.color,
            uiOrder: normalized.uiOrder,
            notes: normalized.notes
        };
    }

    function legacyModifierToDerivedEffectType(modifier) {
        const normalized = String(modifier || '').trim().toLowerCase();
        if (!normalized) return { effectType: '', target: null };
        if (normalized === 'fighterbaboverride') return { effectType: 'setBabOverride', target: null };
        if (normalized === 'strengthminimum' || normalized === 'damageabilityoverride') return { effectType: 'setAbilityMinimum', target: 'str' };
        if (normalized === 'hitpoints' || normalized === 'hpbonus') return { effectType: 'addHitPoints', target: null };
        return { effectType: normalized, target: null };
    }

    function derivedEffectTypeToLegacyModifiers(effectType, target) {
        const normalizedType = String(effectType || '').trim().toLowerCase();
        const normalizedTarget = String(target || '').trim().toLowerCase();
        if (!normalizedType) return [];
        if (normalizedType === 'setbaboverride') return ['fighterBabOverride'];
        if (normalizedType === 'setabilityminimum' && normalizedTarget === 'str') return ['strengthMinimum'];
        if (normalizedType === 'addhitpoints') return ['hitPoints'];
        if (normalizedType === 'addarmorac') return ['armorAc'];
        if (normalizedType === 'addshieldac') return ['shieldAc'];
        if (normalizedType === 'addnaturalac') return ['naturalAc'];
        if (normalizedType === 'adddeflectionac') return ['deflectionAc'];
        if (normalizedType === 'adddodgeac') return ['dodgeAc'];
        if (normalizedType === 'addotherac') return ['otherAc'];
        return [];
    }

    function deepCloneJsonValue(value) {
        if (value === null || value === undefined) return value;
        return JSON.parse(JSON.stringify(value));
    }

    function hasRequiredUniformKeys(rows, requiredKeys) {
        if (!Array.isArray(rows) || rows.length === 0) return false;
        const expected = Array.isArray(requiredKeys) ? requiredKeys.slice().sort() : [];
        if (expected.length === 0) return false;

        return rows.every(row => {
            if (!row || typeof row !== 'object' || Array.isArray(row)) return false;
            const keys = Object.keys(row).slice().sort();
            if (keys.length !== expected.length) return false;
            for (let index = 0; index < expected.length; index += 1) {
                if (keys[index] !== expected[index]) return false;
            }
            return true;
        });
    }

    let BUFF_DEFINITIONS = [];
    let BUFF_GROUP_DEFINITIONS = [];

    const CLASS_ATTACK_RULE_KEYS = [
        'id',
        'name',
        'key',
        'groupId',
        'label',
        'description',
        'sourceLabel',
        'className',
        'requiresFeat',
        'requiresClass',
        'requiresClassLevel',
        'extraNameCandidates',
        'defaultEnabled',
        'behaviorType',
        'behaviorConfig',
        'special',
        'notes',
        'uiOrder'
    ];

    const CLASS_ATTACK_GROUP_KEYS = [
        'id',
        'name',
        'label',
        'color',
        'uiOrder',
        'notes'
    ];

    function createBlankClassAttackRuleDefinition() {
        return {
            id: '',
            name: '',
            key: '',
            groupId: '',
            label: '',
            description: '',
            sourceLabel: '',
            className: '',
            requiresFeat: null,
            requiresClass: null,
            requiresClassLevel: null,
            extraNameCandidates: [],
            defaultEnabled: false,
            behaviorType: null,
            behaviorConfig: {},
            special: null,
            notes: null,
            uiOrder: 0
        };
    }

    function normalizeClassAttackRuleRow(rawRow, index = 0) {
        const raw = rawRow && typeof rawRow === 'object' ? rawRow : {};
        const normalized = createBlankClassAttackRuleDefinition();
        CLASS_ATTACK_RULE_KEYS.forEach(key => {
            if (Object.prototype.hasOwnProperty.call(raw, key)) {
                normalized[key] = raw[key];
            }
        });

        normalized.id = String(normalized.id || normalized.name || normalized.key || `class_attack_rule_${index + 1}`).trim().toLowerCase();
        normalized.name = String(normalized.name || normalized.id || `class_attack_rule_${index + 1}`).trim().toLowerCase();
        normalized.key = String(normalized.key || normalized.name || normalized.id || `classAttackRule${index + 1}`).trim();
        normalized.groupId = normalized.groupId == null ? '' : String(normalized.groupId).trim().toLowerCase();
        normalized.label = String(normalized.label || normalized.key || `Class Rule ${index + 1}`).trim();
        normalized.description = normalized.description == null ? '' : String(normalized.description).trim();
        normalized.sourceLabel = String(normalized.sourceLabel || normalized.label || normalized.key).trim();
        normalized.className = String(normalized.className || '').trim();
        normalized.requiresFeat = normalized.requiresFeat == null ? null : String(normalized.requiresFeat).trim();
        normalized.requiresClass = normalized.requiresClass == null ? null : String(normalized.requiresClass).trim();
        normalized.requiresClassLevel = Number.isFinite(Number(normalized.requiresClassLevel)) ? Number(normalized.requiresClassLevel) : null;
        normalized.extraNameCandidates = Array.isArray(normalized.extraNameCandidates)
            ? normalized.extraNameCandidates.map(value => String(value || '').trim()).filter(Boolean)
            : [];
        normalized.defaultEnabled = Boolean(normalized.defaultEnabled);
        normalized.behaviorType = String(normalized.behaviorType || '').trim() || null;
        normalized.behaviorConfig = normalized.behaviorConfig && typeof normalized.behaviorConfig === 'object' && !Array.isArray(normalized.behaviorConfig)
            ? normalized.behaviorConfig
            : {};
        normalized.special = normalized.special == null ? null : String(normalized.special).trim();
        normalized.notes = normalized.notes == null ? null : String(normalized.notes).trim();
        normalized.uiOrder = Number.isFinite(Number(normalized.uiOrder)) ? Number(normalized.uiOrder) : index;

        return normalized;
    }

    function toRuntimeClassAttackRuleDefinition(row, index = 0) {
        const normalized = normalizeClassAttackRuleRow(row, index);
        return {
            key: normalized.key,
            groupId: normalized.groupId,
            label: normalized.label,
            sourceLabel: normalized.sourceLabel,
            className: normalized.className,
            requiresFeat: normalized.requiresFeat,
            requiresClass: normalized.requiresClass,
            requiresClassLevel: normalized.requiresClassLevel,
            extraNameCandidates: normalized.extraNameCandidates,
            defaultEnabled: normalized.defaultEnabled,
            behaviorType: normalized.behaviorType,
            behaviorConfig: normalized.behaviorConfig,
            special: normalized.special,
            uiOrder: normalized.uiOrder
        };
    }

    function createBlankClassAttackGroupDefinition() {
        return {
            id: '',
            name: '',
            label: '',
            color: '',
            uiOrder: 0,
            notes: null
        };
    }

    function normalizeClassAttackGroupRow(rawRow, index = 0) {
        const raw = rawRow && typeof rawRow === 'object' ? rawRow : {};
        const normalized = createBlankClassAttackGroupDefinition();
        CLASS_ATTACK_GROUP_KEYS.forEach(key => {
            if (Object.prototype.hasOwnProperty.call(raw, key)) {
                normalized[key] = raw[key];
            }
        });

        normalized.id = String(normalized.id || normalized.name || `class_rule_group_${index + 1}`).trim().toLowerCase();
        normalized.name = String(normalized.name || normalized.id || `class_rule_group_${index + 1}`).trim().toLowerCase();
        normalized.label = String(normalized.label || normalized.name || `Class Group ${index + 1}`).trim();
        normalized.color = normalized.color == null ? '' : String(normalized.color).trim();
        normalized.uiOrder = Number.isFinite(Number(normalized.uiOrder)) ? Number(normalized.uiOrder) : index;
        normalized.notes = normalized.notes == null ? null : String(normalized.notes).trim();
        return normalized;
    }

    function toRuntimeClassAttackGroupDefinition(row, index = 0) {
        const normalized = normalizeClassAttackGroupRow(row, index);
        return {
            id: normalized.id,
            name: normalized.name,
            label: normalized.label,
            color: normalized.color,
            uiOrder: normalized.uiOrder,
            notes: normalized.notes
        };
    }

    let CLASS_ATTACK_BONUS_TOGGLE_DEFINITIONS = [];
    let CLASS_ATTACK_GROUP_DEFINITIONS = [];

    const SPELLSWORD_PRIMARY_ATTRIBUTE_OPTIONS = [
        { value: 'str', label: 'Strength Primary' },
        { value: 'dex', label: 'Dexterity Primary' }
    ];

    const SONG_RULE_SKILL_ALIAS_KEYS = ['id', 'name', 'key', 'values', 'notes', 'uiOrder'];
    const SONG_RULE_CONDITIONAL_TARGET_KEYS = ['id', 'name', 'key', 'target', 'notes', 'uiOrder'];
    const SONG_RULE_LABEL_GROUP_KEYS = ['id', 'name', 'groupKey', 'label', 'notes', 'uiOrder'];
    const SONG_RULE_TOKEN_KEYS = ['id', 'name', 'groupKey', 'token', 'notes', 'uiOrder'];
    const ITEM_ENHANCEMENT_PROPERTY_TYPE_KEYS = ['type'];
    const ITEM_ENHANCEMENT_INNATE_TYPE_KEYS = ['type'];
    const ITEM_ENHANCEMENT_DEFAULT_PARAM_KEYS = ['type', 'params'];
    const ITEM_META_SPECIAL_KEY_KEYS = ['key', 'valueType'];
    const ITEM_META_VALUE_ROW_KEYS = ['value'];

    const DEFAULT_SONG_SKILL_ALIAS_ROWS = [];

    const DEFAULT_SONG_CONDITIONAL_TARGET_ROWS = [];

    const DEFAULT_SONG_LABEL_GROUP_ROWS = [];

    const DEFAULT_SONG_TOKEN_ROWS = [];

    function buildSongSkillAliasMap(rows) {
        const map = {};
        const sorted = Array.isArray(rows)
            ? rows.slice().sort((left, right) => (Number(left.uiOrder) || 0) - (Number(right.uiOrder) || 0))
            : [];
        sorted.forEach(row => {
            const key = normalizeSongNameKey(row && row.key);
            const values = Array.isArray(row && row.values)
                ? row.values.map(value => String(value || '').trim().toLowerCase()).filter(Boolean)
                : [];
            if (!key || values.length === 0) return;
            map[key] = values;
        });
        return map;
    }

    function buildSongConditionalTargetMap(rows) {
        const map = {};
        const sorted = Array.isArray(rows)
            ? rows.slice().sort((left, right) => (Number(left.uiOrder) || 0) - (Number(right.uiOrder) || 0))
            : [];
        sorted.forEach(row => {
            const key = normalizeSongNameKey(row && row.key);
            const target = String(row && row.target || '').trim();
            if (!key || !target) return;
            map[key] = target;
        });
        return map;
    }

    function createEmptySongLabelGroups() {
        return {
            universalSaveLabels: new Set(),
            multiSaveLabels: new Set(),
            dodgeLabels: new Set(),
            directDamageLabels: new Set(),
            singleSkillLabels: new Set(),
            allSkillsLabels: new Set()
        };
    }

    function createEmptySongTokenGroups() {
        return {
            conditionalAttackPrefixes: [],
            conditionalAcPrefixes: [],
            conditionalDodgePrefixes: [],
            directDamageIncludeTokens: [],
            directDamageExcludeTokens: [],
            unmappedIgnoreTokens: []
        };
    }

    function buildSongLabelGroups(rows) {
        const groups = createEmptySongLabelGroups();
        const sorted = Array.isArray(rows)
            ? rows.slice().sort((left, right) => (Number(left.uiOrder) || 0) - (Number(right.uiOrder) || 0))
            : [];

        sorted.forEach(row => {
            const groupKey = String(row && row.groupKey || '').trim();
            const label = normalizeSongNameKey(row && row.label);
            if (!groupKey || !label || !(groups[groupKey] instanceof Set)) return;
            groups[groupKey].add(label);
        });

        return groups;
    }

    function buildSongTokenGroups(rows) {
        const groups = createEmptySongTokenGroups();
        const sorted = Array.isArray(rows)
            ? rows.slice().sort((left, right) => (Number(left.uiOrder) || 0) - (Number(right.uiOrder) || 0))
            : [];

        sorted.forEach(row => {
            const groupKey = String(row && row.groupKey || '').trim();
            const token = String(row && row.token || '').trim().toLowerCase();
            if (!groupKey || !token || !Array.isArray(groups[groupKey])) return;
            groups[groupKey].push(token);
        });

        return groups;
    }

    let SONG_SKILL_LABEL_ALIASES = buildSongSkillAliasMap(DEFAULT_SONG_SKILL_ALIAS_ROWS);
    let SONG_CONDITIONAL_TARGET_MAP = buildSongConditionalTargetMap(DEFAULT_SONG_CONDITIONAL_TARGET_ROWS);
    let SONG_LABEL_GROUPS = buildSongLabelGroups(DEFAULT_SONG_LABEL_GROUP_ROWS);
    let SONG_TOKEN_GROUPS = buildSongTokenGroups(DEFAULT_SONG_TOKEN_ROWS);

    let PROPERTY_TYPES = DEFAULT_PROPERTY_TYPES.slice();
    let INNATE_ONLY_TYPES = new Set(DEFAULT_INNATE_ONLY_TYPES);
    let PROPERTY_DEFAULT_PARAMS_BY_TYPE = new Map(
        DEFAULT_PROPERTY_PARAM_ROWS.map(row => [row.type, deepCloneJsonValue(row.params)])
    );
    let ITEM_ENHANCEMENT_TYPE_CONFIGS = new Map();

    let ITEM_META_DEFAULTS = deepCloneJsonValue(DEFAULT_ITEM_META_DEFAULTS);
    let WEAPON_FOCUS_GROUPS = DEFAULT_WEAPON_FOCUS_GROUPS.slice();
    let BASE_WEAPON_DAMAGE_TYPES = DEFAULT_BASE_WEAPON_DAMAGE_TYPES.slice();
    let ITEM_SPECIAL_KEY_OPTIONS = DEFAULT_ITEM_SPECIAL_KEY_ROWS.map(row => row.key);
    let ITEM_SPECIAL_KEY_TYPES = Object.fromEntries(DEFAULT_ITEM_SPECIAL_KEY_ROWS.map(row => [row.key, row.valueType]));

    const SONG_TARGET_TOGGLE_DEFS = [];

    const TARGET_ALIGNMENT_OPTIONS = [
        { value: 'any', label: 'Any Alignment' },
        { value: 'lg', label: 'Lawful Good' },
        { value: 'ng', label: 'Neutral Good' },
        { value: 'cg', label: 'Chaotic Good' },
        { value: 'ln', label: 'Lawful Neutral' },
        { value: 'tn', label: 'True Neutral' },
        { value: 'cn', label: 'Chaotic Neutral' },
        { value: 'le', label: 'Lawful Evil' },
        { value: 'ne', label: 'Neutral Evil' },
        { value: 'ce', label: 'Chaotic Evil' }
    ];

    const TARGET_RACE_GROUP_OPTIONS = [
        { value: '', label: 'Any Target Type' },
        { value: 'beastAnimal', label: 'Beast/Animal' },
        { value: 'shapeshift', label: 'Shapeshifted' },
        { value: 'construct', label: 'Construct' },
        { value: 'elemental', label: 'Elemental' },
        { value: 'ooze', label: 'Ooze' },
        { value: 'dragon', label: 'Dragon' },
        { value: 'giantOgreHalfGiant', label: 'Giant/Ogre/Half-Giant' },
        { value: 'goblinoid', label: 'Goblinoid' },
        { value: 'orc', label: 'Orc' }
    ];

    function createDefaultSongTargetConditions() {
        return SONG_TARGET_TOGGLE_DEFS.reduce((acc, def) => {
            acc[def.key] = false;
            return acc;
        }, {});
    }

    function createDefaultClassAttackToggleState() {
        return CLASS_ATTACK_BONUS_TOGGLE_DEFINITIONS.reduce((acc, def) => {
            acc[def.key] = Boolean(def.defaultEnabled);
            return acc;
        }, {});
    }

    function getClassRuleOptionDefinitions() {
        const optionDefs = [];
        const seen = new Set();

        CLASS_ATTACK_BONUS_TOGGLE_DEFINITIONS.forEach(def => {
            const config = def && def.behaviorConfig && typeof def.behaviorConfig === 'object'
                ? def.behaviorConfig
                : null;
            const option = config && config.option && typeof config.option === 'object'
                ? config.option
                : null;
            if (!option) return;

            const key = String(option.key || '').trim();
            if (!key || seen.has(key)) return;
            seen.add(key);

            const values = Array.isArray(option.values)
                ? option.values
                    .map(value => String(value || '').trim().toLowerCase())
                    .filter(Boolean)
                : [];
            if (!values.length) return;

            const defaultValue = String(option.defaultValue || values[0]).trim().toLowerCase();
            optionDefs.push({ key, values, defaultValue: values.includes(defaultValue) ? defaultValue : values[0] });
        });

        return optionDefs;
    }

    function createDefaultClassBonusOptions() {
        const defaults = {};
        getClassRuleOptionDefinitions().forEach(def => {
            defaults[def.key] = def.defaultValue;
        });
        return defaults;
    }

    function createDefaultLazyProxyState() {
        return {
            enabled: false,
            cappedAbBonus: 0,
            uncappedAbBonus: 0,
            weaponBonusFloor: 0,
            damageBonus: 0,
            damageEntries: '',
            stats: {
                str: 0,
                dex: 0,
                con: 0,
                int: 0,
                wis: 0,
                cha: 0
            }
        };
    }

    function createDefaultSkillAcState() {
        return {
            tumbleEnabled: false,
            rideEnabled: false,
            parryEnabled: false
        };
    }

    function ensureLazyProxyState() {
        if (!state.lazyProxy || typeof state.lazyProxy !== 'object') {
            state.lazyProxy = createDefaultLazyProxyState();
            return;
        }

        if (typeof state.lazyProxy.enabled !== 'boolean') {
            state.lazyProxy.enabled = false;
        }

        const numericKeys = ['cappedAbBonus', 'uncappedAbBonus', 'weaponBonusFloor', 'damageBonus'];
        numericKeys.forEach(key => {
            if (!Number.isFinite(Number(state.lazyProxy[key]))) {
                state.lazyProxy[key] = 0;
            }
        });

        if (typeof state.lazyProxy.damageEntries !== 'string') {
            state.lazyProxy.damageEntries = '';
        }

        if (!state.lazyProxy.stats || typeof state.lazyProxy.stats !== 'object') {
            state.lazyProxy.stats = createDefaultLazyProxyState().stats;
        }

        ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(statKey => {
            if (!Number.isFinite(Number(state.lazyProxy.stats[statKey]))) {
                state.lazyProxy.stats[statKey] = 0;
            }
        });
    }

    function ensureClassAttackToggleState() {
        if (!state.classAttackToggles || typeof state.classAttackToggles !== 'object') {
            state.classAttackToggles = createDefaultClassAttackToggleState();
            return;
        }

        CLASS_ATTACK_BONUS_TOGGLE_DEFINITIONS.forEach(def => {
            if (!Object.prototype.hasOwnProperty.call(state.classAttackToggles, def.key)) {
                state.classAttackToggles[def.key] = Boolean(def.defaultEnabled);
            }
        });
    }

    function ensureClassBonusOptionsState() {
        if (!state.classBonusOptions || typeof state.classBonusOptions !== 'object') {
            state.classBonusOptions = createDefaultClassBonusOptions();
            return;
        }

        getClassRuleOptionDefinitions().forEach(def => {
            if (!Object.prototype.hasOwnProperty.call(state.classBonusOptions, def.key)) {
                state.classBonusOptions[def.key] = def.defaultValue;
                return;
            }

            const selected = String(state.classBonusOptions[def.key] || '').trim().toLowerCase();
            state.classBonusOptions[def.key] = def.values.includes(selected)
                ? selected
                : def.defaultValue;
        });
    }

    function ensureSkillAcState() {
        if (!state.skillAc || typeof state.skillAc !== 'object') {
            state.skillAc = createDefaultSkillAcState();
            return;
        }

        if (typeof state.skillAc.tumbleEnabled !== 'boolean') {
            state.skillAc.tumbleEnabled = false;
        }
        if (typeof state.skillAc.rideEnabled !== 'boolean') {
            state.skillAc.rideEnabled = false;
        }
        if (typeof state.skillAc.parryEnabled !== 'boolean') {
            state.skillAc.parryEnabled = false;
        }

        if (state.skillAc.tumbleEnabled && state.skillAc.rideEnabled) {
            state.skillAc.tumbleEnabled = false;
        }

        if (typeof state.skillAc.mounted === 'boolean') {
            const hasExplicitToggle = Object.prototype.hasOwnProperty.call(state.skillAc, 'tumbleEnabled')
                || Object.prototype.hasOwnProperty.call(state.skillAc, 'rideEnabled');
            if (!hasExplicitToggle) {
                state.skillAc.rideEnabled = Boolean(state.skillAc.mounted);
                state.skillAc.tumbleEnabled = !state.skillAc.rideEnabled;
            }
            delete state.skillAc.mounted;
        }
    }

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

    function isDebugLogsEnabled() {
        try {
            if (typeof debugLogsEnabled === 'boolean') {
                return debugLogsEnabled;
            }
        } catch (error) {
            // no-op
        }

        try {
            return localStorage.getItem('planner_debug_logs') === '1';
        } catch (error) {
            return false;
        }
    }

    function plannerDebugLog(label, payload = null) {
        if (!isDebugLogsEnabled()) return;
        if (payload === null || payload === undefined) {
            console.log(`[Gear Debug] ${label}`);
            return;
        }
        console.log(`[Gear Debug] ${label}`, payload);
    }

    function getFocusGroupFromWeaponFlags(weapon) {
        if (!weapon || typeof weapon !== 'object') return '';
        if (weapon.concussion) return 'Concussion';
        if (weapon.twoHanded) return 'Two-Handed';
        if (weapon.polearm) return 'Polearm';
        if (weapon.oneHandEdged) return 'One-Handed Edge';
        if (weapon.unarmed) return 'Unarmed';
        if (weapon.thrown) return 'Thrown';
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
        meta.ranged = Boolean(weapon.missile) && !Boolean(weapon.thrown);
        meta.focusGroup = getFocusGroupFromWeaponFlags(weapon);
    }

    const state = {
        selectedSlot: 'mainHand',
        ui: {
            baseDrawerOpen: true,
            restrictionDrawerOpen: false,
            specialDrawerOpen: false,
            weaponOptionsDrawerOpen: true,
            wearableOptionsDrawerOpen: true,
            buffGroupDrawerOpen: {},
            classRuleDrawerOpen: {},
            lazyDrawerOpen: true,
            damageSubtab: 'planner',
            debugSubtab: 'summary',
            debugPresetIndex: 0
        },
        buffs: {},
        lazyProxy: createDefaultLazyProxyState(),
        classAttackToggles: createDefaultClassAttackToggleState(),
        classBonusOptions: createDefaultClassBonusOptions(),
        skillAc: createDefaultSkillAcState(),
        targeting: {
            alignment: 'any',
            race: '',
            targetConditions: createDefaultSongTargetConditions()
        },
        song: {
            enabled: false,
            name: 'bardic rhythm',
            level: 30,
            useSoth: false,
            propagateToPlanner: false
        },
        songData: null,
        slots: {}
    };

    let craftedTemplateEntries = [];
    let craftedTemplateLookup = new Map();
    let craftedTemplatesLoaded = false;
    let debugClassPresetEntries = [];
    let pendingGearRefresh = false;
    let softErrorSlotKeys = new Set();
    let lastCombatDebugSnapshot = null;
    let lastApplyDetailsPulseKey = null;

    let rootEls = null;

    function scheduleGearRefreshAndValidation() {
        if (pendingGearRefresh) return;
        pendingGearRefresh = true;

        requestAnimationFrame(() => {
            pendingGearRefresh = false;

            if (typeof window.calculateStatProgression === 'function') {
                try {
                    window.calculateStatProgression();
                } catch {
                    // no-op
                }
            }

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

            renderSummaries();
        });
    }

    function bindGearRealtimeWatchers() {
        const container = rootEls && rootEls.damageGear;
        if (!container || container.__gearRealtimeBound) return;

        const maybeRefresh = (event) => {
            const target = event && event.target;
            if (!target) return;
            const tag = String(target.tagName || '').toLowerCase();
            if (tag === 'select' || tag === 'textarea') {
                scheduleGearRefreshAndValidation();
            }
        };

        container.addEventListener('change', maybeRefresh, true);
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
        return deepCloneJsonValue(ITEM_META_DEFAULTS);
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

    function normalizeDebugClassPresetRows(rows) {
        if (!Array.isArray(rows)) return [];
        return rows
            .map((row, index) => {
                if (!row || typeof row !== 'object') return null;
                const name = String(row.name || '').trim();
                const description = String(row.description || '').trim();
                const encodedSave = String(row.encodedSave || row.save || row.code || '').trim();
                if (!name || !encodedSave) return null;
                return {
                    id: String(row.id || `${name}-${index}`),
                    name,
                    description,
                    encodedSave
                };
            })
            .filter(Boolean);
    }

    function setDebugClassPresets(rows) {
        debugClassPresetEntries = normalizeDebugClassPresetRows(rows);
        const maxIndex = Math.max(0, debugClassPresetEntries.length - 1);
        const nextIndex = Number(state.ui.debugPresetIndex) || 0;
        state.ui.debugPresetIndex = Math.min(Math.max(0, nextIndex), maxIndex);
        renderDebugClassPresetEditor();
    }

    async function loadDebugClassPresets() {
        const candidates = [
            './debugPresets/classPresets.json',
            '/CharacterCalculator/debugPresets/classPresets.json',
            '/debugPresets/classPresets.json'
        ];

        for (const url of candidates) {
            try {
                const response = await fetch(url, { cache: 'no-store' });
                if (!response.ok) continue;
                const json = await response.json();
                if (Array.isArray(json)) {
                    setDebugClassPresets(json);
                    if (rootEls && rootEls.debugClassPresetStatus) {
                        rootEls.debugClassPresetStatus.textContent = `Loaded ${debugClassPresetEntries.length} preset(s).`;
                    }
                    return;
                }
            } catch {
                continue;
            }
        }

        setDebugClassPresets([]);
        if (rootEls && rootEls.debugClassPresetStatus) {
            rootEls.debugClassPresetStatus.textContent = 'No presets loaded (debugPresets/classPresets.json not found).';
        }
    }

    function renderDebugClassPresetEditor() {
        if (!rootEls) return;

        const select = rootEls.debugClassPresetSelect;
        const descriptionEl = rootEls.debugClassPresetDescription;

        if (select) {
            select.innerHTML = '';
            if (!debugClassPresetEntries.length) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No presets available';
                select.appendChild(option);
                select.disabled = true;
            } else {
                debugClassPresetEntries.forEach((preset, index) => {
                    const option = document.createElement('option');
                    option.value = String(index);
                    option.textContent = preset.name;
                    select.appendChild(option);
                });
                select.disabled = false;
                const selectedIndex = Math.min(Math.max(0, Number(state.ui.debugPresetIndex) || 0), debugClassPresetEntries.length - 1);
                state.ui.debugPresetIndex = selectedIndex;
                select.value = String(selectedIndex);
            }
        }

        const selectedPreset = debugClassPresetEntries[Number(state.ui.debugPresetIndex) || 0] || null;
        if (descriptionEl) {
            descriptionEl.textContent = selectedPreset
                ? (selectedPreset.description || 'No description provided.')
                : 'No preset description available.';
        }
    }

    async function applySelectedDebugClassPreset() {
        const preset = debugClassPresetEntries[Number(state.ui.debugPresetIndex) || 0];
        if (!preset) {
            if (rootEls && rootEls.debugClassPresetStatus) {
                rootEls.debugClassPresetStatus.textContent = 'No preset selected.';
            }
            return;
        }

        if (typeof window.decodeCharacterFromShareText !== 'function' || typeof window.applyCharacterSnapshot !== 'function') {
            if (rootEls && rootEls.debugClassPresetStatus) {
                rootEls.debugClassPresetStatus.textContent = 'Cannot load preset: share import helpers are unavailable.';
            }
            return;
        }

        if (rootEls && rootEls.debugClassPresetStatus) {
            rootEls.debugClassPresetStatus.textContent = `Loading preset: ${preset.name}...`;
        }

        try {
            const parsed = await window.decodeCharacterFromShareText(preset.encodedSave);
            window.applyCharacterSnapshot(parsed);

            if (typeof window.getCharacterSnapshot === 'function') {
                localStorage.setItem('dnd_character', JSON.stringify(window.getCharacterSnapshot()));
            }

            renderSummaries();

            if (rootEls && rootEls.debugClassPresetStatus) {
                rootEls.debugClassPresetStatus.textContent = `Loaded preset: ${preset.name}`;
            }
        } catch (error) {
            if (rootEls && rootEls.debugClassPresetStatus) {
                const message = error && error.message ? error.message : 'Unknown import error';
                rootEls.debugClassPresetStatus.textContent = `Failed to load preset: ${message}`;
            }
        }
    }

    async function loadBardSongTables() {
        const candidates = [
            './combatData/songData.json',
            '/CharacterCalculator/combatData/songData.json',
            '/combatData/songData.json'
        ];

        const errors = [];

        for (const url of candidates) {
            try {
                const response = await fetch(url, { cache: 'no-store' });
                if (!response.ok) {
                    errors.push(`${url}: ${response.status} ${response.statusText}`);
                    continue;
                }
                const json = await response.json();
                if (json && json.bardSongTable && json.bardSongTable.songsByName) {
                    state.songData = json;
                    return;
                }
                errors.push(`${url}: missing bardSongTable.songsByName`);
            } catch {
                errors.push(`${url}: fetch/parse failure`);
                continue;
            }
        }

        state.songData = null;
        throw new Error(`Unable to load required song data from combatData/songData.json. ${errors.join(' | ')}`);
    }

    async function loadSongRuleDefinitions() {
        const candidates = [
            './combatData/songRules.json',
            '/CharacterCalculator/combatData/songRules.json',
            '/combatData/songRules.json'
        ];

        const errors = [];

        for (const url of candidates) {
            try {
                const response = await fetch(url, { cache: 'no-store' });
                if (!response.ok) continue;

                const json = await response.json();
                const skillAliasRows = json && Array.isArray(json.skillAliasRows) ? json.skillAliasRows : [];
                const conditionalTargetRows = json && Array.isArray(json.conditionalTargetRows) ? json.conditionalTargetRows : [];
                const labelGroupRows = json && Array.isArray(json.labelGroupRows) ? json.labelGroupRows : [];
                const tokenRows = json && Array.isArray(json.tokenRows) ? json.tokenRows : [];
                if (!skillAliasRows.length || !conditionalTargetRows.length || !labelGroupRows.length || !tokenRows.length) {
                    errors.push(`${url}: missing required song rule arrays`);
                    continue;
                }

                if (!hasRequiredUniformKeys(skillAliasRows, SONG_RULE_SKILL_ALIAS_KEYS)) {
                    plannerDebugLog('Rejected song rules: non-uniform skillAliasRows keys', { url, expectedKeys: SONG_RULE_SKILL_ALIAS_KEYS });
                    errors.push(`${url}: non-uniform skillAliasRows keys`);
                    continue;
                }
                if (!hasRequiredUniformKeys(conditionalTargetRows, SONG_RULE_CONDITIONAL_TARGET_KEYS)) {
                    plannerDebugLog('Rejected song rules: non-uniform conditionalTargetRows keys', { url, expectedKeys: SONG_RULE_CONDITIONAL_TARGET_KEYS });
                    errors.push(`${url}: non-uniform conditionalTargetRows keys`);
                    continue;
                }
                if (!hasRequiredUniformKeys(labelGroupRows, SONG_RULE_LABEL_GROUP_KEYS)) {
                    plannerDebugLog('Rejected song rules: non-uniform labelGroupRows keys', { url, expectedKeys: SONG_RULE_LABEL_GROUP_KEYS });
                    errors.push(`${url}: non-uniform labelGroupRows keys`);
                    continue;
                }
                if (!hasRequiredUniformKeys(tokenRows, SONG_RULE_TOKEN_KEYS)) {
                    plannerDebugLog('Rejected song rules: non-uniform tokenRows keys', { url, expectedKeys: SONG_RULE_TOKEN_KEYS });
                    errors.push(`${url}: non-uniform tokenRows keys`);
                    continue;
                }

                SONG_SKILL_LABEL_ALIASES = buildSongSkillAliasMap(skillAliasRows);
                SONG_CONDITIONAL_TARGET_MAP = buildSongConditionalTargetMap(conditionalTargetRows);
                SONG_LABEL_GROUPS = buildSongLabelGroups(labelGroupRows);
                SONG_TOKEN_GROUPS = buildSongTokenGroups(tokenRows);

                plannerDebugLog('Loaded song interpretation rules from JSON', {
                    url,
                    skillAliases: Object.keys(SONG_SKILL_LABEL_ALIASES).length,
                    conditionalTargets: Object.keys(SONG_CONDITIONAL_TARGET_MAP).length,
                    labelGroupCounts: {
                        universalSaveLabels: SONG_LABEL_GROUPS.universalSaveLabels.size,
                        multiSaveLabels: SONG_LABEL_GROUPS.multiSaveLabels.size,
                        dodgeLabels: SONG_LABEL_GROUPS.dodgeLabels.size,
                        directDamageLabels: SONG_LABEL_GROUPS.directDamageLabels.size
                    },
                    tokenGroupCounts: Object.fromEntries(Object.entries(SONG_TOKEN_GROUPS).map(([key, value]) => [key, Array.isArray(value) ? value.length : 0]))
                });
                return;
            } catch {
                errors.push(`${url}: fetch/parse failure`);
                continue;
            }
        }

        SONG_SKILL_LABEL_ALIASES = {};
        SONG_CONDITIONAL_TARGET_MAP = {};
        SONG_LABEL_GROUPS = createEmptySongLabelGroups();
        SONG_TOKEN_GROUPS = createEmptySongTokenGroups();
        throw new Error(`Unable to load required song interpretation rules from combatData/songRules.json. ${errors.join(' | ')}`);
    }

    function normalizeItemEnhancementTypeRows(rows) {
        return rows
            .map(row => String(row && row.type || '').trim())
            .filter(Boolean);
    }

    function normalizeItemEnhancementDefaultParamRows(rows) {
        const map = new Map();
        rows.forEach(row => {
            const type = String(row && row.type || '').trim();
            const params = row && typeof row.params === 'object' && !Array.isArray(row.params)
                ? deepCloneJsonValue(row.params)
                : {};
            if (!type) return;
            map.set(type, params);
        });
        return map;
    }

    function normalizeItemEnhancementTypeConfigs(rawConfigs) {
        const map = new Map();
        if (!rawConfigs || typeof rawConfigs !== 'object' || Array.isArray(rawConfigs)) return map;

        Object.entries(rawConfigs).forEach(([typeName, config]) => {
            const type = String(typeName || '').trim();
            if (!type || !config || typeof config !== 'object' || Array.isArray(config)) return;
            const fields = Array.isArray(config.fields)
                ? config.fields
                    .filter(field => field && typeof field === 'object' && !Array.isArray(field))
                    .map(field => ({
                        key: String(field.key || '').trim(),
                        label: String(field.label || field.key || '').trim(),
                        control: String(field.control || 'number').trim().toLowerCase(),
                        optionSource: String(field.optionSource || '').trim(),
                        options: Array.isArray(field.options) ? deepCloneJsonValue(field.options) : [],
                        min: field.min,
                        max: field.max,
                        step: field.step,
                        defaultValue: field.defaultValue,
                        placeholder: field.placeholder == null ? '' : String(field.placeholder),
                        uiOrder: Number.isFinite(Number(field.uiOrder)) ? Number(field.uiOrder) : 0
                    }))
                    .filter(field => field.key)
                : [];
            const behaviorOps = Array.isArray(config.behaviorOps)
                ? deepCloneJsonValue(config.behaviorOps).filter(op => op && typeof op === 'object' && !Array.isArray(op))
                : [];
            const moteRule = config.moteRule && typeof config.moteRule === 'object' && !Array.isArray(config.moteRule)
                ? deepCloneJsonValue(config.moteRule)
                : null;

            map.set(type, {
                fields,
                behaviorOps,
                moteRule
            });
        });

        return map;
    }

    function getItemEnhancementTypeConfig(type) {
        const key = String(type || '').trim();
        if (!key) return null;
        return ITEM_ENHANCEMENT_TYPE_CONFIGS.get(key) || null;
    }

    function resolveEnhancementBehaviorNumericValue(op, params) {
        const p = params && typeof params === 'object' ? params : {};
        if (op && op.valueFrom != null) {
            const fieldKey = String(op.valueFrom);
            const rawValue = Number(p[fieldKey]);
            if (!Number.isFinite(rawValue)) {
                if (op.nonInnateValue !== undefined && op.nonInnateValue !== null) {
                    return Number(op.nonInnateValue) || 0;
                }
                return 0;
            }
            return rawValue;
        }
        return Number(op && op.value) || 0;
    }

    function applyEnhancementBehaviorTemplate(rawTemplate, params) {
        const template = String(rawTemplate || '');
        const p = params && typeof params === 'object' ? params : {};
        return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key) => {
            const value = p[key];
            return value === undefined || value === null ? '' : String(value);
        }).trim();
    }

    function applyExternalEnhancementBehavior(property, effects, sourcePrefix, slotKey) {
        const config = getItemEnhancementTypeConfig(property && property.type);
        if (!config) return false;
        if (!Array.isArray(config.behaviorOps) || config.behaviorOps.length === 0) return true;

        const params = property && property.params && typeof property.params === 'object' ? property.params : {};
        let appliedAny = false;

        config.behaviorOps.forEach(op => {
            const opType = String(op && op.op || '').trim();
            if (!opType) return;

            if (opType === 'addToEffect') {
                const effectKey = String(op.effectKey || '').trim();
                if (!effectKey || !Object.prototype.hasOwnProperty.call(effects, effectKey)) return;
                let addValue = resolveEnhancementBehaviorNumericValue(op, params);
                if (!Number.isFinite(addValue)) return;
                if (op.nonInnateMax !== undefined && op.nonInnateMax !== null && !(property && property.innate)) {
                    const cap = Number(op.nonInnateMax);
                    if (Number.isFinite(cap)) {
                        addValue = Math.min(cap, Math.max(0, addValue));
                    }
                }
                const mode = String(op.mode || 'add').trim().toLowerCase();
                if (mode === 'max') {
                    effects[effectKey] = Math.max(Number(effects[effectKey]) || 0, addValue);
                } else {
                    effects[effectKey] += addValue;
                }

                if (effectKey === 'directAttackBonus' && effects.sourceDetails && Array.isArray(effects.sourceDetails.directAttack)) {
                    effects.sourceDetails.directAttack.push({ label: sourcePrefix, value: addValue });
                }
                if (effectKey === 'damageBonus' && effects.sourceDetails && Array.isArray(effects.sourceDetails.damageBonus)) {
                    effects.sourceDetails.damageBonus.push({ label: sourcePrefix, value: addValue });
                }
                if (effectKey === 'maxSpellResistance' && effects.sourceDetails && Array.isArray(effects.sourceDetails.spellResistance)) {
                    effects.sourceDetails.spellResistance.push({ label: sourcePrefix, value: addValue });
                }
                appliedAny = true;
                return;
            }

            if (opType === 'addSoftStat') {
                const statField = String(op.statField || 'stat').trim();
                const valueField = String(op.valueField || 'value').trim();
                const stat = String(params[statField] || '').trim().toLowerCase();
                const fallback = Number(op.defaultValue);
                const value = (params[valueField] !== undefined && params[valueField] !== null && params[valueField] !== '')
                    ? (Number(params[valueField]) || 0)
                    : (Number.isFinite(fallback) ? fallback : 0);
                if (!stat || !Object.prototype.hasOwnProperty.call(effects.softStats, stat)) return;
                effects.softStats[stat] += value;
                if (effects.sourceDetails && effects.sourceDetails.softStats && Array.isArray(effects.sourceDetails.softStats[stat])) {
                    effects.sourceDetails.softStats[stat].push({ label: sourcePrefix, value });
                }
                appliedAny = true;
                return;
            }

            if (opType === 'addAcBySlotOrParam') {
                const valueField = String(op.valueField || 'value').trim();
                const typeField = String(op.bucketField || 'armorType').trim();
                const amount = Math.max(0, Number(params[valueField]) || 0);
                const overrideType = (property && property.innate && params[typeField]) ? normalizeAcBucket(params[typeField]) : null;
                const bucket = overrideType || getArmorTypeForSlot(slotKey);
                const resolvedBucket = bucket || 'armor';
                if (!Array.isArray(effects.acBuckets[resolvedBucket])) return;
                effects.acBuckets[resolvedBucket].push(amount);
                if (effects.sourceDetails && effects.sourceDetails.acBuckets && Array.isArray(effects.sourceDetails.acBuckets[resolvedBucket])) {
                    effects.sourceDetails.acBuckets[resolvedBucket].push({
                        label: `${sourcePrefix}${overrideType ? ` (${resolvedBucket})` : ''}`,
                        value: amount
                    });
                }
                appliedAny = true;
                return;
            }

            if (opType === 'addEnhancementBySlotCategory') {
                const valueField = String(op.valueField || 'value').trim();
                const resolvedSlotKey = String(slotKey || '').trim();
                const amount = Math.max(0, Number(params[valueField]) || 0);
                if (getSlotCategory(resolvedSlotKey) === 'weapon') {
                    effects.enhancementAttackBonus += amount;
                    effects.damageBonus += amount;
                    if (effects.sourceDetails) {
                        if (Array.isArray(effects.sourceDetails.enhancementAttack)) {
                            effects.sourceDetails.enhancementAttack.push({ label: sourcePrefix, value: amount });
                        }
                        if (Array.isArray(effects.sourceDetails.damageBonus)) {
                            effects.sourceDetails.damageBonus.push({ label: `${sourcePrefix} (weapon enhancement)`, value: amount });
                        }
                    }
                } else {
                    const bucket = getArmorTypeForSlot(resolvedSlotKey);
                    if (Array.isArray(effects.acBuckets[bucket])) {
                        effects.acBuckets[bucket].push(amount);
                    }
                    if (effects.sourceDetails && effects.sourceDetails.acBuckets && Array.isArray(effects.sourceDetails.acBuckets[bucket])) {
                        effects.sourceDetails.acBuckets[bucket].push({ label: sourcePrefix, value: amount });
                    }
                }
                appliedAny = true;
                return;
            }

            if (opType === 'addDamageFromParams') {
                const avgDamage = getAverageDamageFromParams(params);
                effects.damageBonus += avgDamage;
                addDamageAddToSummary(effects.damageAdds, params);
                if (effects.sourceDetails && Array.isArray(effects.sourceDetails.damageBonus)) {
                    effects.sourceDetails.damageBonus.push({
                        label: `${sourcePrefix} (${String(params.damageType || 'untyped')})`,
                        value: avgDamage
                    });
                }
                appliedAny = true;
                return;
            }

            if (opType === 'addCritDamageFromParams') {
                const avgCrit = getMassiveCriticalAverageFromParams(params);
                effects.critDamageBonus += avgCrit;
                if (effects.sourceDetails && Array.isArray(effects.sourceDetails.critDamageBonus)) {
                    effects.sourceDetails.critDamageBonus.push({ label: sourcePrefix, value: avgCrit });
                }
                appliedAny = true;
                return;
            }

            if (opType === 'addGeneralSaveFromParams') {
                const saveField = String(op.saveField || 'save').trim();
                const valueField = String(op.valueField || 'value').trim();
                const save = String(params[saveField] || 'fort').trim();
                const amount = (property && property.innate)
                    ? Math.max(0, Number(params[valueField]) || 0)
                    : Math.max(0, Number(op.nonInnateValue) || 1);
                if (!Object.prototype.hasOwnProperty.call(effects.saveBonus, save)) return;
                effects.saveBonus[save] += amount;
                if (effects.sourceDetails && effects.sourceDetails.saveBonus && Array.isArray(effects.sourceDetails.saveBonus[save])) {
                    effects.sourceDetails.saveBonus[save].push({ label: sourcePrefix, value: amount });
                }
                appliedAny = true;
                return;
            }

            if (opType === 'addSpecificSaveFromParams') {
                const kindField = String(op.kindField || 'saveKind').trim();
                const valueField = String(op.valueField || 'value').trim();
                const kind = String(params[kindField] || 'universal').trim().toLowerCase();
                const amount = (property && property.innate)
                    ? Math.max(0, Number(params[valueField]) || 0)
                    : Math.max(0, Number(op.nonInnateValue) || 1);
                if (kind === 'universal') {
                    effects.saveBonus.fort += amount;
                    effects.saveBonus.ref += amount;
                    effects.saveBonus.will += amount;
                    if (effects.sourceDetails && effects.sourceDetails.saveBonus) {
                        if (Array.isArray(effects.sourceDetails.saveBonus.fort)) effects.sourceDetails.saveBonus.fort.push({ label: `${sourcePrefix} (universal)`, value: amount });
                        if (Array.isArray(effects.sourceDetails.saveBonus.ref)) effects.sourceDetails.saveBonus.ref.push({ label: `${sourcePrefix} (universal)`, value: amount });
                        if (Array.isArray(effects.sourceDetails.saveBonus.will)) effects.sourceDetails.saveBonus.will.push({ label: `${sourcePrefix} (universal)`, value: amount });
                    }
                } else {
                    effects.situational.push(`${property.type} ${kind} +${amount}`);
                }
                appliedAny = true;
                return;
            }

            if (opType === 'addSkillBonus') {
                const skillField = String(op.skillField || 'skill').trim();
                const valueField = String(op.valueField || 'value').trim();
                const fallback = Number(op.defaultValue);
                const rawSkill = String(params[skillField] || '').trim();
                const normalizedSkill = typeof normalizeSkillKey === 'function'
                    ? normalizeSkillKey(rawSkill)
                    : rawSkill.toLowerCase();
                if (!normalizedSkill) return;
                const hasValue = params[valueField] !== undefined && params[valueField] !== null && params[valueField] !== '';
                const amount = hasValue ? (Number(params[valueField]) || 0) : (Number.isFinite(fallback) ? fallback : 0);
                effects.itemSkillBonuses.set(normalizedSkill, (effects.itemSkillBonuses.get(normalizedSkill) || 0) + amount);
                if (effects.sourceDetails && Array.isArray(effects.sourceDetails.skillBonuses)) {
                    effects.sourceDetails.skillBonuses.push({
                        label: `${sourcePrefix} (${normalizedSkill})`,
                        value: amount
                    });
                }
                appliedAny = true;
                return;
            }

            if (opType === 'addGrantedFeat') {
                const featField = String(op.featField || 'featName').trim();
                const normalizedName = (typeof resolveFeatName === 'function')
                    ? resolveFeatName(String(params[featField] || '').trim())
                    : String(params[featField] || '').trim();
                if (!normalizedName) return;
                const key = normalizedName.toLowerCase();
                if (!effects.itemGrantedFeats.has(key)) {
                    effects.itemGrantedFeats.set(key, { name: normalizedName, sources: new Set() });
                }
                effects.itemGrantedFeats.get(key).sources.add(sourcePrefix.split(' • ')[0]);
                appliedAny = true;
                return;
            }

            if (opType === 'appendSituational') {
                const text = applyEnhancementBehaviorTemplate(op.template, params);
                if (!text) return;
                effects.situational.push(text);
                appliedAny = true;
                return;
            }

            if (opType === 'addFlag') {
                const flag = applyEnhancementBehaviorTemplate(op.flag, params);
                if (!flag) return;
                effects.flags.add(flag);
                appliedAny = true;
            }
        });

        return true;
    }

    function calcExternalEnhancementMotes(property) {
        const config = getItemEnhancementTypeConfig(property && property.type);
        const rule = config && config.moteRule && typeof config.moteRule === 'object' ? config.moteRule : null;
        if (!rule) return null;

        const params = property && property.params && typeof property.params === 'object' ? property.params : {};
        const mode = String(rule.mode || '').trim().toLowerCase();
        if (!mode) return null;

        if (mode === 'linear') {
            const valueFrom = String(rule.valueFrom || 'value');
            const coefficient = Number(rule.coefficient);
            const constant = Number(rule.constant);
            let sourceValue = Number(params[valueFrom]) || 0;
            if (rule.clampMin !== undefined && rule.clampMin !== null) {
                sourceValue = Math.max(Number(rule.clampMin) || 0, sourceValue);
            }
            if (rule.clampMax !== undefined && rule.clampMax !== null) {
                sourceValue = Math.min(Number(rule.clampMax) || sourceValue, sourceValue);
            }
            return (Number.isFinite(coefficient) ? coefficient : 1) * sourceValue + (Number.isFinite(constant) ? constant : 0);
        }

        if (mode === 'fixed') {
            return Number(rule.value) || 0;
        }

        if (mode === 'lookup') {
            const valueFrom = String(rule.valueFrom || 'value');
            const table = rule.table && typeof rule.table === 'object' && !Array.isArray(rule.table) ? rule.table : {};
            const key = String(params[valueFrom]);
            return Number(table[key]) || 0;
        }

        if (mode === 'sumcomponents') {
            const components = Array.isArray(rule.components) ? rule.components : [];
            let total = 0;
            components.forEach(component => {
                if (!component || typeof component !== 'object') return;
                const valueFrom = String(component.valueFrom || '').trim();
                if (!valueFrom) return;
                const multiplier = Number(component.multiplier);
                const sourceValue = Number(params[valueFrom]) || 0;
                total += sourceValue * (Number.isFinite(multiplier) ? multiplier : 1);
            });
            return total;
        }

        if (mode === 'damagereduction') {
            const soakField = String(rule.soakField || 'soak');
            const pierceField = String(rule.pierceField || 'pierce');
            const soak = Math.max(0, Number(params[soakField]) || 0);
            const pierce = Math.max(0, Number(params[pierceField]) || 0);
            return (soak / 5) * pierce;
        }

        if (mode === 'damageaverage') {
            const coefficient = Number(rule.coefficient);
            const constant = Number(rule.constant);
            const avg = getAverageDamageFromParams(params);
            return avg * (Number.isFinite(coefficient) ? coefficient : 1) + (Number.isFinite(constant) ? constant : 0);
        }

        if (mode === 'specificsavekind') {
            const kindField = String(rule.kindField || 'saveKind');
            const kind = String(params[kindField] || 'universal').trim().toLowerCase();
            if (kind === 'universal') return 6;
            if (kind === 'death' || kind === 'mind') return 2;
            return 1;
        }

        if (mode === 'skilllegacy') {
            const valueField = String(rule.valueField || 'value');
            const value = Math.abs(Number(params[valueField]) || 1);
            return Math.max(1, Math.min(2, value));
        }

        if (mode === 'spellslot') {
            const classField = String(rule.classField || 'casterClass');
            const levelField = String(rule.levelField || 'spellLevel');
            const slotsField = String(rule.slotsField || 'slots');
            const classRange = getSpellSlotClassRange(params[classField]);
            const levelRaw = Number(params[levelField]) || classRange.min;
            const level = Math.max(classRange.min, Math.min(classRange.max, levelRaw));
            const slots = Math.max(1, Number(params[slotsField]) || 1);
            return (SPELL_SLOT_COSTS[level] || 0) * slots;
        }

        return null;
    }

    async function loadItemEnhancementDefinitions() {
        const candidates = [
            './combatData/itemEnhancements.json',
            '/CharacterCalculator/combatData/itemEnhancements.json',
            '/combatData/itemEnhancements.json'
        ];

        const errors = [];

        for (const url of candidates) {
            try {
                const response = await fetch(url, { cache: 'no-store' });
                if (!response.ok) {
                    errors.push(`${url}: ${response.status} ${response.statusText}`);
                    continue;
                }

                const json = await response.json();
                const propertyTypeRows = json && Array.isArray(json.propertyTypeRows) ? json.propertyTypeRows : [];
                const innateOnlyTypeRows = json && Array.isArray(json.innateOnlyTypeRows) ? json.innateOnlyTypeRows : [];
                const defaultParamRows = json && Array.isArray(json.defaultParamRows) ? json.defaultParamRows : [];
                const typeConfigs = json && json.typeConfigs && typeof json.typeConfigs === 'object' && !Array.isArray(json.typeConfigs)
                    ? json.typeConfigs
                    : {};
                if (!propertyTypeRows.length || !innateOnlyTypeRows.length || !defaultParamRows.length) {
                    errors.push(`${url}: missing required enhancement rule arrays`);
                    continue;
                }

                if (!hasRequiredUniformKeys(propertyTypeRows, ITEM_ENHANCEMENT_PROPERTY_TYPE_KEYS)) {
                    errors.push(`${url}: non-uniform propertyTypeRows keys`);
                    continue;
                }
                if (!hasRequiredUniformKeys(innateOnlyTypeRows, ITEM_ENHANCEMENT_INNATE_TYPE_KEYS)) {
                    errors.push(`${url}: non-uniform innateOnlyTypeRows keys`);
                    continue;
                }
                if (!hasRequiredUniformKeys(defaultParamRows, ITEM_ENHANCEMENT_DEFAULT_PARAM_KEYS)) {
                    errors.push(`${url}: non-uniform defaultParamRows keys`);
                    continue;
                }

                const propertyTypes = normalizeItemEnhancementTypeRows(propertyTypeRows);
                const innateOnlyTypes = normalizeItemEnhancementTypeRows(innateOnlyTypeRows);
                const paramMap = normalizeItemEnhancementDefaultParamRows(defaultParamRows);
                if (propertyTypes.length === 0 || paramMap.size === 0) {
                    errors.push(`${url}: normalized enhancement data is empty`);
                    continue;
                }

                PROPERTY_TYPES = propertyTypes;
                INNATE_ONLY_TYPES = new Set(innateOnlyTypes);
                PROPERTY_DEFAULT_PARAMS_BY_TYPE = paramMap;
                ITEM_ENHANCEMENT_TYPE_CONFIGS = normalizeItemEnhancementTypeConfigs(typeConfigs);

                plannerDebugLog('Loaded item enhancement definitions from JSON', {
                    url,
                    propertyTypes: PROPERTY_TYPES.length,
                    innateOnlyTypes: INNATE_ONLY_TYPES.size,
                    defaultParams: PROPERTY_DEFAULT_PARAMS_BY_TYPE.size,
                    typeConfigs: ITEM_ENHANCEMENT_TYPE_CONFIGS.size
                });
                return;
            } catch {
                errors.push(`${url}: fetch/parse failure`);
            }
        }

        PROPERTY_TYPES = DEFAULT_PROPERTY_TYPES.slice();
        INNATE_ONLY_TYPES = new Set(DEFAULT_INNATE_ONLY_TYPES);
        PROPERTY_DEFAULT_PARAMS_BY_TYPE = new Map(
            DEFAULT_PROPERTY_PARAM_ROWS.map(row => [row.type, deepCloneJsonValue(row.params)])
        );
        ITEM_ENHANCEMENT_TYPE_CONFIGS = new Map();
        throw new Error(`Unable to load required item enhancement definitions from combatData/itemEnhancements.json. ${errors.join(' | ')}`);
    }

    function normalizeItemMetaValueRows(rows) {
        return rows
            .map(row => String(row && row.value || '').trim())
            .filter(Boolean);
    }

    function normalizeItemMetaSpecialKeyRows(rows) {
        return rows
            .map(row => ({
                key: String(row && row.key || '').trim(),
                valueType: String(row && row.valueType || '').trim()
            }))
            .filter(row => row.key && row.valueType);
    }

    async function loadItemMetaDefinitions() {
        const candidates = [
            './combatData/itemMeta.json',
            '/CharacterCalculator/combatData/itemMeta.json',
            '/combatData/itemMeta.json'
        ];

        const errors = [];

        for (const url of candidates) {
            try {
                const response = await fetch(url, { cache: 'no-store' });
                if (!response.ok) {
                    errors.push(`${url}: ${response.status} ${response.statusText}`);
                    continue;
                }

                const json = await response.json();
                const metaDefaults = json && typeof json.metaDefaults === 'object' && !Array.isArray(json.metaDefaults)
                    ? json.metaDefaults
                    : null;
                const weaponFocusGroupRows = json && Array.isArray(json.weaponFocusGroupRows) ? json.weaponFocusGroupRows : [];
                const baseWeaponDamageTypeRows = json && Array.isArray(json.baseWeaponDamageTypeRows) ? json.baseWeaponDamageTypeRows : [];
                const specialKeyRows = json && Array.isArray(json.specialKeyRows) ? json.specialKeyRows : [];
                if (!metaDefaults || !weaponFocusGroupRows.length || !baseWeaponDamageTypeRows.length || !specialKeyRows.length) {
                    errors.push(`${url}: missing required item meta sections`);
                    continue;
                }

                if (!hasRequiredUniformKeys(weaponFocusGroupRows, ITEM_META_VALUE_ROW_KEYS)) {
                    errors.push(`${url}: non-uniform weaponFocusGroupRows keys`);
                    continue;
                }
                if (!hasRequiredUniformKeys(baseWeaponDamageTypeRows, ITEM_META_VALUE_ROW_KEYS)) {
                    errors.push(`${url}: non-uniform baseWeaponDamageTypeRows keys`);
                    continue;
                }
                if (!hasRequiredUniformKeys(specialKeyRows, ITEM_META_SPECIAL_KEY_KEYS)) {
                    errors.push(`${url}: non-uniform specialKeyRows keys`);
                    continue;
                }

                const normalizedMetaDefaults = {
                    ...DEFAULT_ITEM_META_DEFAULTS,
                    ...deepCloneJsonValue(metaDefaults)
                };
                const focusGroups = normalizeItemMetaValueRows(weaponFocusGroupRows);
                const damageTypes = normalizeItemMetaValueRows(baseWeaponDamageTypeRows);
                const normalizedSpecialRows = normalizeItemMetaSpecialKeyRows(specialKeyRows);
                if (!focusGroups.length || !damageTypes.length || !normalizedSpecialRows.length) {
                    errors.push(`${url}: normalized item meta data is empty`);
                    continue;
                }

                ITEM_META_DEFAULTS = normalizedMetaDefaults;
                WEAPON_FOCUS_GROUPS = focusGroups;
                BASE_WEAPON_DAMAGE_TYPES = damageTypes;
                ITEM_SPECIAL_KEY_OPTIONS = normalizedSpecialRows.map(row => row.key);
                ITEM_SPECIAL_KEY_TYPES = Object.fromEntries(normalizedSpecialRows.map(row => [row.key, row.valueType]));

                plannerDebugLog('Loaded item meta definitions from JSON', {
                    url,
                    focusGroups: WEAPON_FOCUS_GROUPS.length,
                    baseDamageTypes: BASE_WEAPON_DAMAGE_TYPES.length,
                    specialKeys: ITEM_SPECIAL_KEY_OPTIONS.length
                });
                return;
            } catch {
                errors.push(`${url}: fetch/parse failure`);
            }
        }

        ITEM_META_DEFAULTS = deepCloneJsonValue(DEFAULT_ITEM_META_DEFAULTS);
        WEAPON_FOCUS_GROUPS = DEFAULT_WEAPON_FOCUS_GROUPS.slice();
        BASE_WEAPON_DAMAGE_TYPES = DEFAULT_BASE_WEAPON_DAMAGE_TYPES.slice();
        ITEM_SPECIAL_KEY_OPTIONS = DEFAULT_ITEM_SPECIAL_KEY_ROWS.map(row => row.key);
        ITEM_SPECIAL_KEY_TYPES = Object.fromEntries(DEFAULT_ITEM_SPECIAL_KEY_ROWS.map(row => [row.key, row.valueType]));
        throw new Error(`Unable to load required item meta definitions from combatData/itemMeta.json. ${errors.join(' | ')}`);
    }

    async function loadCombatBuffDefinitions() {
        const candidates = [
            './combatData/buffs.json',
            '/CharacterCalculator/combatData/buffs.json',
            '/combatData/buffs.json'
        ];
        const errors = [];

        for (const url of candidates) {
            try {
                const response = await fetch(url, { cache: 'no-store' });
                if (!response.ok) continue;
                const json = await response.json();
                const rows = Array.isArray(json)
                    ? json
                    : (json && Array.isArray(json.items) ? json.items : []);
                const groupRows = json && Array.isArray(json.groups) ? json.groups : [];
                if (!Array.isArray(rows) || rows.length === 0) {
                    errors.push(`${url}: missing/empty items array`);
                    continue;
                }
                const hasRequiredBuffKeys = rows.every(row => {
                    if (!row || typeof row !== 'object' || Array.isArray(row)) return false;
                    return BUFF_DEFINITION_KEYS.every(key => Object.prototype.hasOwnProperty.call(row, key));
                });
                if (!hasRequiredBuffKeys) {
                    plannerDebugLog('Rejected combat buff definitions: non-uniform keys', {
                        url,
                        expectedKeys: BUFF_DEFINITION_KEYS
                    });
                    errors.push(`${url}: missing required keys`);
                    continue;
                }

                BUFF_DEFINITIONS = rows
                    .map((row, index) => toRuntimeBuffDefinition(row, index))
                    .filter(def => def && def.name)
                    .sort((left, right) => (Number(left.uiOrder) || 0) - (Number(right.uiOrder) || 0));

                const explicitGroups = hasRequiredUniformKeys(groupRows, BUFF_GROUP_KEYS)
                    ? groupRows
                        .map((row, index) => toRuntimeBuffGroupDefinition(row, index))
                        .filter(group => group && group.id)
                    : [];
                const groupMap = new Map(explicitGroups.map(group => [group.id, group]));

                BUFF_DEFINITIONS.forEach((def, index) => {
                    if (!def || !def.name) return;
                    if (!def.groupId) {
                        def.groupId = String(def.category || '').trim().toLowerCase();
                    }
                    if (!def.groupId) {
                        def.groupId = 'other';
                    }

                    if (!groupMap.has(def.groupId)) {
                        const source = String(def.groupId || '').trim();
                        const fallbackLabel = source
                            ? source.split(/[_\s-]+/).map(part => part ? `${part.charAt(0).toUpperCase()}${part.slice(1)}` : '').join(' ')
                            : 'Other';
                        groupMap.set(def.groupId, {
                            id: def.groupId,
                            name: def.groupId,
                            label: fallbackLabel || 'Other',
                            color: '',
                            uiOrder: 1000 + index,
                            notes: null
                        });
                    }
                });

                BUFF_GROUP_DEFINITIONS = Array.from(groupMap.values())
                    .sort((left, right) => {
                        const leftOrder = Number(left && left.uiOrder) || 0;
                        const rightOrder = Number(right && right.uiOrder) || 0;
                        if (leftOrder !== rightOrder) return leftOrder - rightOrder;
                        return String(left && left.label || '').localeCompare(String(right && right.label || ''));
                    });

                if (BUFF_DEFINITIONS.length > 0) {
                    plannerDebugLog('Loaded combat buff definitions from JSON', {
                        url,
                        count: BUFF_DEFINITIONS.length,
                        groups: BUFF_GROUP_DEFINITIONS.length
                    });
                    return;
                }
            } catch (error) {
                errors.push(`${url}: fetch/parse failure`);
                continue;
            }
        }

        BUFF_DEFINITIONS = [];
        BUFF_GROUP_DEFINITIONS = [];
        throw new Error(`Unable to load required buff definitions from combatData/buffs.json. ${errors.join(' | ')}`);
    }

    async function loadClassAttackRuleDefinitions() {
        const candidates = [
            './combatData/classAttackRules.json',
            '/CharacterCalculator/combatData/classAttackRules.json',
            '/combatData/classAttackRules.json'
        ];
        const errors = [];

        for (const url of candidates) {
            try {
                const response = await fetch(url, { cache: 'no-store' });
                if (!response.ok) {
                    errors.push(`${url}: ${response.status} ${response.statusText}`);
                    continue;
                }
                const json = await response.json();
                const rows = Array.isArray(json)
                    ? json
                    : (json && Array.isArray(json.items) ? json.items : []);
                const groupRows = json && Array.isArray(json.groups) ? json.groups : [];
                if (!Array.isArray(rows) || rows.length === 0) {
                    errors.push(`${url}: missing/empty items array`);
                    continue;
                }
                const hasRequiredClassRuleKeys = rows.every(row => {
                    if (!row || typeof row !== 'object' || Array.isArray(row)) return false;
                    const requiredCoreKeys = CLASS_ATTACK_RULE_KEYS.filter(key => key !== 'groupId' && key !== 'requiresFeat' && key !== 'requiresClass' && key !== 'requiresClassLevel');
                    return requiredCoreKeys.every(key => Object.prototype.hasOwnProperty.call(row, key));
                });
                if (!hasRequiredClassRuleKeys) {
                    plannerDebugLog('Rejected class attack rule definitions: non-uniform keys', {
                        url,
                        expectedKeys: CLASS_ATTACK_RULE_KEYS
                    });
                    errors.push(`${url}: missing required keys`);
                    continue;
                }

                CLASS_ATTACK_BONUS_TOGGLE_DEFINITIONS = rows
                    .map((row, index) => toRuntimeClassAttackRuleDefinition(row, index))
                    .filter(def => def && def.key)
                    .sort((left, right) => (Number(left.uiOrder) || 0) - (Number(right.uiOrder) || 0));

                const explicitGroups = hasRequiredUniformKeys(groupRows, CLASS_ATTACK_GROUP_KEYS)
                    ? groupRows
                        .map((row, index) => toRuntimeClassAttackGroupDefinition(row, index))
                        .filter(group => group && group.id)
                    : [];
                const groupMap = new Map(explicitGroups.map(group => [group.id, group]));

                CLASS_ATTACK_BONUS_TOGGLE_DEFINITIONS.forEach((def, index) => {
                    if (!def || !def.key) return;
                    if (!def.groupId) {
                        const classToken = String(def.className || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
                        def.groupId = classToken || 'class_specific';
                    }
                    if (!groupMap.has(def.groupId)) {
                        const source = String(def.groupId || '').trim();
                        const fallbackLabel = source
                            ? source.split(/[_\s-]+/).map(part => part ? `${part.charAt(0).toUpperCase()}${part.slice(1)}` : '').join(' ')
                            : 'Class Specific';
                        groupMap.set(def.groupId, {
                            id: def.groupId,
                            name: def.groupId,
                            label: fallbackLabel || 'Class Specific',
                            color: '',
                            uiOrder: 1000 + index,
                            notes: null
                        });
                    }
                });

                CLASS_ATTACK_GROUP_DEFINITIONS = Array.from(groupMap.values())
                    .sort((left, right) => {
                        const leftOrder = Number(left && left.uiOrder) || 0;
                        const rightOrder = Number(right && right.uiOrder) || 0;
                        if (leftOrder !== rightOrder) return leftOrder - rightOrder;
                        return String(left && left.label || '').localeCompare(String(right && right.label || ''));
                    });

                if (CLASS_ATTACK_BONUS_TOGGLE_DEFINITIONS.length > 0) {
                    plannerDebugLog('Loaded class attack rule definitions from JSON', {
                        url,
                        count: CLASS_ATTACK_BONUS_TOGGLE_DEFINITIONS.length,
                        groups: CLASS_ATTACK_GROUP_DEFINITIONS.length
                    });
                    return;
                }
            } catch {
                errors.push(`${url}: fetch/parse failure`);
                continue;
            }
        }

        CLASS_ATTACK_BONUS_TOGGLE_DEFINITIONS = [];
        CLASS_ATTACK_GROUP_DEFINITIONS = [];
        throw new Error(`Unable to load required class attack rule definitions from combatData/classAttackRules.json. ${errors.join(' | ')}`);
    }

    function initializeBuffStateFromDefinitions(existingBuffState = null) {
        const source = existingBuffState && typeof existingBuffState === 'object' ? existingBuffState : {};
        const seeded = {};

        BUFF_DEFINITIONS.forEach(def => {
            const incoming = source[def.name] && typeof source[def.name] === 'object' ? source[def.name] : null;
            seeded[def.name] = {
                enabled: incoming ? Boolean(incoming.enabled) : Boolean(def.enabledByDefault),
                casterLevel: Math.max(1, Math.min(30, Math.floor(Number(incoming && incoming.casterLevel) || 30))),
                secondCast: incoming ? Boolean(incoming.secondCast) : false
            };
        });

        return seeded;
    }

    function buildBuffMutualExclusionAdjacency(definitions) {
        const defs = Array.isArray(definitions) ? definitions : [];
        const byName = new Map();
        defs.forEach(def => {
            const name = String(def && def.name || '').trim().toLowerCase();
            if (!name) return;
            byName.set(name, def);
        });

        const adjacency = new Map();
        byName.forEach((_, key) => adjacency.set(key, new Set()));

        byName.forEach((def, key) => {
            const excludes = Array.isArray(def && def.mutuallyExclusiveWith) ? def.mutuallyExclusiveWith : [];
            excludes.forEach(raw => {
                const excluded = String(raw || '').trim().toLowerCase();
                if (!excluded || !byName.has(excluded) || excluded === key) return;
                adjacency.get(key).add(excluded);
                adjacency.get(excluded).add(key);
            });
        });

        return adjacency;
    }

    function getBuffUiLockState(featSet) {
        const normalizedFeatSet = featSet instanceof Set ? featSet : new Set();
        const adjacency = buildBuffMutualExclusionAdjacency(BUFF_DEFINITIONS);
        const output = new Map();

        adjacency.forEach((blockedSet, buffName) => {
            const lockers = [];
            blockedSet.forEach(sourceName => {
                if (sourceName === buffName) return;
                const sourceState = state.buffs && state.buffs[sourceName];
                if (!sourceState || !sourceState.enabled) return;
                const sourceDef = BUFF_DEFINITIONS.find(def => String(def && def.name || '').trim().toLowerCase() === sourceName);
                if (sourceDef && sourceDef.requiresFeat && !normalizedFeatSet.has(String(sourceDef.requiresFeat).toLowerCase())) {
                    return;
                }
                if (sourceDef && sourceDef.label) {
                    lockers.push(sourceDef.label);
                } else {
                    lockers.push(sourceName);
                }
            });
            if (lockers.length > 0) {
                output.set(buffName, lockers);
            }
        });

        return {
            lockedBy: output,
            adjacency
        };
    }

    function initializeClassAttackToggleStateFromDefinitions(existingToggleState = null) {
        const source = existingToggleState && typeof existingToggleState === 'object' ? existingToggleState : {};
        const seeded = {};

        CLASS_ATTACK_BONUS_TOGGLE_DEFINITIONS.forEach(def => {
            seeded[def.key] = Object.prototype.hasOwnProperty.call(source, def.key)
                ? Boolean(source[def.key])
                : Boolean(def.defaultEnabled);
        });

        return seeded;
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
        const key = String(type || '').trim();
        if (!key) return {};
        const mapped = PROPERTY_DEFAULT_PARAMS_BY_TYPE.get(key);
        return mapped && typeof mapped === 'object'
            ? deepCloneJsonValue(mapped)
            : {};
    }

    async function init() {
        await loadItemEnhancementDefinitions();
        await loadItemMetaDefinitions();
        await loadCombatBuffDefinitions();
        await loadClassAttackRuleDefinitions();
        await loadSongRuleDefinitions();
        state.buffs = initializeBuffStateFromDefinitions(state.buffs);
        state.classAttackToggles = initializeClassAttackToggleStateFromDefinitions(state.classAttackToggles);
        state.classBonusOptions = {
            ...createDefaultClassBonusOptions(),
            ...(state.classBonusOptions && typeof state.classBonusOptions === 'object' ? state.classBonusOptions : {})
        };
        ensureClassBonusOptionsState();

        rootEls = {
            damageGear: document.getElementById('damageGear'),
            damageSubtabPlannerBtn: document.getElementById('damageGearSubtabPlanner'),
            damageSubtabBuffsBtn: document.getElementById('damageGearSubtabBuffs'),
            damageSubtabSongsBtn: document.getElementById('damageGearSubtabSongs'),
            damageSubtabClassAbBtn: document.getElementById('damageGearSubtabClassAb'),
            damageSubtabGraphBtn: document.getElementById('damageGearSubtabGraph'),
            damageSubtabDebugBtn: document.getElementById('damageGearSubtabDebug'),
            damageSubtabPlannerPanel: document.getElementById('damageGearPlannerPanel'),
            damageSubtabBuffsPanel: document.getElementById('damageGearBuffsPanel'),
            damageSubtabSongsPanel: document.getElementById('damageGearSongsPanel'),
            damageSubtabClassAbPanel: document.getElementById('damageGearClassAbPanel'),
            damageSubtabGraphPanel: document.getElementById('damageGearGraphPanel'),
            damageSubtabDebugPanel: document.getElementById('damageGearDebugPanel'),
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
            gearSummary: document.getElementById('gearDerivedSummary'),
            damageSimRunBtn: document.getElementById('runDamageSimulationBtn'),
            damageSimStatus: document.getElementById('damageSimStatus'),
            damageSimBuildSummary: document.getElementById('damageSimBuildSummary'),
            damageSimCanvas: document.getElementById('damageSimCanvas'),
            damageSimTraceOutput: document.getElementById('damageSimTraceOutput'),
            damageSimSamples: document.getElementById('damageSimSamples'),
            damageSimAcMin: document.getElementById('damageSimAcMin'),
            damageSimAcMax: document.getElementById('damageSimAcMax'),
            damageGraphTargetAlignment: document.getElementById('damageGraphTargetAlignment'),
            damageGraphTargetRace: document.getElementById('damageGraphTargetRace'),
            damageGraphTargetToggleList: document.getElementById('damageGraphTargetToggleList'),
            damageGraphTargetSummary: document.getElementById('damageGraphTargetSummary'),
            buffList: document.getElementById('damageBuffList'),
            classAttackBonusList: document.getElementById('damageClassAttackBonusList'),
            songEnabledToggle: document.getElementById('songEnabledToggle'),
            songNameSelect: document.getElementById('songNameSelect'),
            songLevelSelect: document.getElementById('songLevelSelect'),
            songUseSothToggle: document.getElementById('songUseSothToggle'),
            songPropagateToggle: document.getElementById('songPropagateToggle'),
            songEffectSummary: document.getElementById('songEffectSummary'),
            songUnmappedSummary: document.getElementById('songUnmappedSummary'),
            gearDebugRunBtn: document.getElementById('runGearDebugSnapshotBtn'),
            gearDebugOutput: document.getElementById('gearDebugSnapshotOutput'),
            debugSubtabSummaryBtn: document.getElementById('debugSubtabSummary'),
            debugSubtabVerboseBtn: document.getElementById('debugSubtabVerbose'),
            debugSubtabPresetsBtn: document.getElementById('debugSubtabPresets'),
            debugSubtabSummaryPanel: document.getElementById('debugSubtabSummaryPanel'),
            debugSubtabVerbosePanel: document.getElementById('debugSubtabVerbosePanel'),
            debugSubtabPresetsPanel: document.getElementById('debugSubtabPresetsPanel'),
            gearDebugVerboseOutput: document.getElementById('gearDebugVerboseOutput'),
            debugClassPresetSelect: document.getElementById('debugClassPresetSelect'),
            loadDebugClassPresetBtn: document.getElementById('loadDebugClassPresetBtn'),
            debugClassPresetDescription: document.getElementById('debugClassPresetDescription'),
            debugClassPresetStatus: document.getElementById('debugClassPresetStatus')
        };

        if (!rootEls.paperDoll) return;

        SLOT_CONFIG.forEach(slot => ensureSlotState(slot.key));
        bindGearRealtimeWatchers();
        renderPaperDoll();
        bindEditorEvents();
        renderEditor();
        switchDamageSubtab(state.ui.damageSubtab || 'planner');
        renderSummaries();
        patchPlannerHooks();
        hydrateGearPlannerStateFromPersistedCharacter();
        renderBuffsEditor();
        renderSummaries();

        loadCraftedTemplates().then(() => {
            renderEditor();
        });

        await loadBardSongTables();
        renderSongsEditor();
        renderSummaries();

        const knowWhatImDoingToggle = document.getElementById('knowWhatImDoingToggle');
        if (knowWhatImDoingToggle) {
            knowWhatImDoingToggle.addEventListener('change', () => {
                renderEditor();
                renderSummaries();
            });
        }

        if (rootEls.damageSubtabPlannerBtn) {
            rootEls.damageSubtabPlannerBtn.addEventListener('click', () => switchDamageSubtab('planner'));
        }

        if (rootEls.damageSubtabBuffsBtn) {
            rootEls.damageSubtabBuffsBtn.addEventListener('click', () => switchDamageSubtab('buffs'));
        }

        if (rootEls.damageSubtabSongsBtn) {
            rootEls.damageSubtabSongsBtn.addEventListener('click', () => switchDamageSubtab('songs'));
        }

        if (rootEls.damageSubtabClassAbBtn) {
            rootEls.damageSubtabClassAbBtn.addEventListener('click', () => switchDamageSubtab('classab'));
        }

        if (rootEls.damageSubtabGraphBtn) {
            rootEls.damageSubtabGraphBtn.addEventListener('click', () => switchDamageSubtab('graph'));
        }

        if (rootEls.damageSubtabDebugBtn) {
            rootEls.damageSubtabDebugBtn.addEventListener('click', () => switchDamageSubtab('debug'));
        }

        if (rootEls.debugSubtabSummaryBtn) {
            rootEls.debugSubtabSummaryBtn.addEventListener('click', () => switchDebugSubtab('summary'));
        }

        if (rootEls.debugSubtabVerboseBtn) {
            rootEls.debugSubtabVerboseBtn.addEventListener('click', () => switchDebugSubtab('verbose'));
        }

        if (rootEls.debugSubtabPresetsBtn) {
            rootEls.debugSubtabPresetsBtn.addEventListener('click', () => switchDebugSubtab('presets'));
        }

        if (rootEls.debugClassPresetSelect) {
            rootEls.debugClassPresetSelect.addEventListener('change', () => {
                const nextIndex = Number(rootEls.debugClassPresetSelect.value);
                state.ui.debugPresetIndex = Number.isFinite(nextIndex) ? nextIndex : 0;
                renderDebugClassPresetEditor();
            });
        }

        if (rootEls.loadDebugClassPresetBtn) {
            rootEls.loadDebugClassPresetBtn.addEventListener('click', () => {
                applySelectedDebugClassPreset();
            });
        }

        if (rootEls.damageSimRunBtn) {
            rootEls.damageSimRunBtn.addEventListener('click', () => {
                runDamageSimulationGraph();
            });
        }

        if (rootEls.damageSimTraceOutput && !String(rootEls.damageSimTraceOutput.textContent || '').trim()) {
            rootEls.damageSimTraceOutput.textContent = 'Run simulation to generate trace output.';
        }

        if (rootEls.gearDebugRunBtn) {
            rootEls.gearDebugRunBtn.addEventListener('click', () => {
                runGearDebugSnapshotCapture();
            });
        }

        await loadDebugClassPresets();
        renderDebugClassPresetEditor();

        switchDebugSubtab(state.ui.debugSubtab || 'summary');

        renderClassAttackBonusEditor();
        renderSongsEditor();
        renderDamageGraphTargetEditor();
    }

    function bindEditorEvents() {
        rootEls.itemName.addEventListener('change', () => {
            const slot = ensureSlotState(state.selectedSlot);
            slot.name = rootEls.itemName.value;
            renderPaperDoll();
        });

        rootEls.offHandType.addEventListener('change', () => {
            const slot = ensureSlotState('offHand');
            slot.offHandType = rootEls.offHandType.value;
            renderEditor();
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
                if (!property.innate && property.type === 'Attack Bonus') {
                    const params = property.params || {};
                    params.value = Math.min(1, Math.max(0, Number(params.value) || 0));
                    property.params = params;
                }
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
            const commitNumber = () => {
                p[key] = parseFloat(input.value) || 0;
                onChange();
            };
            input.addEventListener('input', commitNumber);
            input.addEventListener('change', commitNumber);
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
            const commitText = () => {
                p[key] = input.value;
                onChange();
            };
            input.addEventListener('input', commitText);
            input.addEventListener('change', commitText);
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

        const addDamageAddTypeEditor = () => {
            const parseDiceLabel = (rawLabel) => {
                const text = String(rawLabel || '').trim().toLowerCase();
                const match = text.match(/^(\d+)d(\d+)$/i);
                if (!match) return null;
                const count = Math.max(1, parseInt(match[1], 10) || 1);
                const size = Math.max(2, parseInt(match[2], 10) || 2);
                return { count, size };
            };

            const parsedDice = parseDiceLabel(p.diceLabel);
            if (!p.damageAddType) {
                p.damageAddType = parsedDice ? 'dice' : 'flat';
            }

            if (p.damageAddType !== 'flat' && p.damageAddType !== 'dice') {
                p.damageAddType = 'flat';
            }

            if (p.damageAddType === 'flat') {
                const defaultFlat = Number(p.flatAdd);
                if (!Number.isFinite(defaultFlat)) {
                    const fromAvg = Number(p.avgDamage);
                    p.flatAdd = Number.isFinite(fromAvg) ? Math.max(0, Math.round(fromAvg)) : 2;
                }
            } else {
                if (!Number.isFinite(Number(p.diceCount)) || Number(p.diceCount) <= 0) {
                    p.diceCount = parsedDice ? parsedDice.count : 1;
                }
                if (!Number.isFinite(Number(p.diceSize)) || Number(p.diceSize) < 2) {
                    p.diceSize = parsedDice ? parsedDice.size : 4;
                }
            }

            const syncDerivedDamageFields = () => {
                if (p.damageAddType === 'flat') {
                    const flat = Math.max(0, parseFloat(p.flatAdd) || 0);
                    p.flatAdd = flat;
                    p.avgDamage = flat;
                    p.diceLabel = `+${flat}`;
                    p.mode = 'flat2';
                    return;
                }

                const count = Math.max(1, Math.floor(parseFloat(p.diceCount) || 1));
                const size = Math.max(2, Math.floor(parseFloat(p.diceSize) || 4));
                p.diceCount = count;
                p.diceSize = size;
                p.avgDamage = count * ((size + 1) / 2);
                p.diceLabel = `${count}d${size}`;
                p.mode = 'd4';
            };

            addSelect('damageAddType', 'Add Type', [
                { value: 'flat', label: 'Flat Add' },
                { value: 'dice', label: 'Dice Add' }
            ]);

            if (p.damageAddType === 'flat') {
                const wrapper = document.createElement('div');
                wrapper.className = 'gear-field-row';

                const labelEl = document.createElement('label');
                labelEl.textContent = 'Flat Add';
                labelEl.style.minWidth = '68px';

                const input = document.createElement('input');
                input.type = 'number';
                input.min = '0';
                input.step = '1';
                input.value = String(Number.isFinite(Number(p.flatAdd)) ? p.flatAdd : 2);
                input.addEventListener('input', () => {
                    p.flatAdd = Math.max(0, parseFloat(input.value) || 0);
                    syncDerivedDamageFields();
                    onChange();
                });

                wrapper.appendChild(labelEl);
                wrapper.appendChild(input);
                container.appendChild(wrapper);
            } else {
                const countWrap = document.createElement('div');
                countWrap.className = 'gear-field-row';

                const countLabel = document.createElement('label');
                countLabel.textContent = 'Dice #';
                countLabel.style.minWidth = '68px';

                const countInput = document.createElement('input');
                countInput.type = 'number';
                countInput.min = '1';
                countInput.step = '1';
                countInput.value = String(Number.isFinite(Number(p.diceCount)) ? Math.max(1, Math.floor(Number(p.diceCount))) : 1);
                countInput.addEventListener('input', () => {
                    p.diceCount = Math.max(1, Math.floor(parseFloat(countInput.value) || 1));
                    syncDerivedDamageFields();
                    onChange();
                });

                countWrap.appendChild(countLabel);
                countWrap.appendChild(countInput);
                container.appendChild(countWrap);

                const sizeWrap = document.createElement('div');
                sizeWrap.className = 'gear-field-row';

                const sizeLabel = document.createElement('label');
                sizeLabel.textContent = 'Die Size';
                sizeLabel.style.minWidth = '68px';

                const sizeInput = document.createElement('input');
                sizeInput.type = 'number';
                sizeInput.min = '2';
                sizeInput.step = '1';
                sizeInput.value = String(Number.isFinite(Number(p.diceSize)) ? Math.max(2, Math.floor(Number(p.diceSize))) : 4);
                sizeInput.addEventListener('input', () => {
                    p.diceSize = Math.max(2, Math.floor(parseFloat(sizeInput.value) || 4));
                    syncDerivedDamageFields();
                    onChange();
                });

                sizeWrap.appendChild(sizeLabel);
                sizeWrap.appendChild(sizeInput);
                container.appendChild(sizeWrap);
            }

            syncDerivedDamageFields();
        };

        const externalTypeConfig = getItemEnhancementTypeConfig(property.type);
        const resolveFieldOptions = (field) => {
            if (Array.isArray(field.options) && field.options.length > 0) return field.options;
            const source = String(field.optionSource || '').trim();
            if (!source) return [];

            if (source === 'damageTypes') return DAMAGE_TYPES;
            if (source === 'skillOptions') return getSkillOptions();
            if (source === 'featOptions') return getFeatOptions(p.featName);
            if (source === 'spellSlotClassOptions') return Object.keys(SPELL_SLOT_CLASS_RANGES);
            if (source === 'spellSlotLevelsForClass') return getSpellLevelsForClass(p.casterClass);
            if (source === 'specificSaveTypes') return SPECIFIC_SAVE_TYPES;
            if (source === 'generalSaveTypes') {
                return [
                    { value: 'fort', label: 'Fortitude' },
                    { value: 'ref', label: 'Reflex' },
                    { value: 'will', label: 'Will' }
                ];
            }
            if (source === 'keenProfiles') {
                return [
                    { value: '20', label: '20 -> 19-20' },
                    { value: '19-20', label: '19-20 -> 17-20' },
                    { value: '18-20', label: '18-20 -> 15-20' }
                ];
            }
            if (source === 'massiveCritModes') return MASSIVE_CRIT_MODES;
            if (source === 'damageAddModes') return DAMAGE_ADD_MODES;
            if (source === 'weightReductionOptions') return [90, 80];
            return [];
        };

        if (externalTypeConfig && Array.isArray(externalTypeConfig.fields) && externalTypeConfig.fields.length > 0) {
            externalTypeConfig.fields
                .slice()
                .sort((left, right) => (Number(left.uiOrder) || 0) - (Number(right.uiOrder) || 0))
                .forEach(field => {
                    const control = String(field.control || 'number').trim().toLowerCase();
                    if (control === 'none') {
                        return;
                    }
                    if (control === 'staticnote') {
                        const note = document.createElement('div');
                        note.className = 'muted-note';
                        note.textContent = field.placeholder || field.label || '';
                        container.appendChild(note);
                        return;
                    }
                    if (control === 'damageaddtypeeditor') {
                        addDamageAddTypeEditor();
                        return;
                    }
                    if (control === 'text') {
                        addText(field.key, field.label || field.key, field.placeholder || '');
                        return;
                    }
                    if (control === 'select') {
                        const optionValues = resolveFieldOptions(field);
                        if (optionValues.length > 0) {
                            addSelect(field.key, field.label || field.key, optionValues);
                        } else {
                            addText(field.key, field.label || field.key, field.placeholder || '');
                        }
                        return;
                    }
                    addNumber(field.key, field.label || field.key, {
                        min: field.min,
                        max: field.max,
                        step: field.step,
                        defaultValue: field.defaultValue
                    });
                });
        } else {
            container.textContent = 'No parameters';
        }

        property.params = p;
    }

    function calcPropertyMotes(property) {
        if (property && property.innate) return 0;
        const externalMotes = calcExternalEnhancementMotes(property);
        if (externalMotes !== null && Number.isFinite(Number(externalMotes))) {
            return Number(externalMotes);
        }
        return 0;
    }

    function getAverageDamageFromMode(mode) {
        if (String(mode || '').toLowerCase() === 'd4') return 2.5;
        return 2;
    }

    function getAverageDamageFromParams(params) {
        const p = params || {};
        const direct = Number(p.avgDamage);
        if (Number.isFinite(direct) && direct > 0) return direct;

        const flatAdd = Number(p.flatAdd);
        if (Number.isFinite(flatAdd) && flatAdd > 0) return flatAdd;

        const diceCount = Number(p.diceCount);
        const diceSize = Number(p.diceSize);
        if (Number.isFinite(diceCount) && Number.isFinite(diceSize) && diceCount > 0 && diceSize > 1) {
            return diceCount * ((diceSize + 1) / 2);
        }

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
            acBase: {
                armor: 0,
                shield: 0
            },
            acBuckets: {
                armor: [],
                shield: [],
                natural: [],
                deflection: [],
                dodge: [],
                other: []
            },
            flatFootedExclusions: {
                other: 0
            },
            saveBonus: { fort: 0, ref: 0, will: 0 },
            attackBonus: 0,
            enhancementAttackBonus: 0,
            directAttackBonus: 0,
            damageBonus: 0,
            damageAdds: {
                flat: 0,
                flatByType: new Map(),
                diceByType: new Map()
            },
            critDamageBonus: 0,
            softStats: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
            maxSpellResistance: 0,
            mightyCap: 0,
            flags: new Set(),
            situational: [],
            itemGrantedFeats: new Map(),
            itemSkillBonuses: new Map(),
            sourceDetails: {
                directAttack: [],
                enhancementAttack: [],
                damageBonus: [],
                critDamageBonus: [],
                saveBonus: { fort: [], ref: [], will: [] },
                softStats: { str: [], dex: [], con: [], int: [], wis: [], cha: [] },
                acBase: {
                    armor: [],
                    shield: []
                },
                acBuckets: {
                    armor: [],
                    shield: [],
                    natural: [],
                    deflection: [],
                    dodge: [],
                    other: []
                },
                flatFootedExclusions: {
                    other: []
                },
                spellResistance: [],
                skillBonuses: [],
                mighty: []
            }
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
            const slotMeta = slotState && slotState.meta && typeof slotState.meta === 'object'
                ? slotState.meta
                : {};
            const slotBaseArmor = Math.max(0, Number(slotMeta.baseArmor) || 0);
            const slotAcType = getArmorTypeForSlot(slot.key);
            if (slotBaseArmor > 0 && (slotAcType === 'armor' || slotAcType === 'shield')) {
                effects.acBase[slotAcType] = Math.max(Number(effects.acBase[slotAcType]) || 0, slotBaseArmor);
                if (effects.sourceDetails && effects.sourceDetails.acBase && Array.isArray(effects.sourceDetails.acBase[slotAcType])) {
                    const sourceItemName = String(slotState.name || slot.label || slot.key || 'item').trim();
                    effects.sourceDetails.acBase[slotAcType].push({
                        label: `${sourceItemName} • base armor`,
                        value: slotBaseArmor
                    });
                }
            }
            slotState.properties.forEach(property => {
                enforceInnateOnlyProperty(property);
                const p = property.params || {};
                const rawValue = Number(p.value) || 0;
                const value = Math.max(0, rawValue);
                const sourceItemName = String(slotState.name || slot.label || slot.key || 'item').trim();
                const sourcePrefix = `${sourceItemName} • ${property.type}`;

                applyExternalEnhancementBehavior(property, effects, sourcePrefix, slot.key);
            });
        });

        ensureLazyProxyState();
        if (state.lazyProxy.enabled) {
            const lazyEntries = parseLazyDamageEntries(state.lazyProxy.damageEntries);
            lazyEntries.forEach((entry, index) => {
                const typeKey = String(entry.type || 'untyped').trim().toLowerCase() || 'untyped';
                const valueText = String(entry.valueText || '').trim().toLowerCase();
                const diceMatch = valueText.match(/^(\d+)d(\d+)$/i);
                if (diceMatch) {
                    const count = Math.max(0, parseInt(diceMatch[1], 10) || 0);
                    const size = Math.max(2, parseInt(diceMatch[2], 10) || 0);
                    if (count <= 0) return;
                    const key = `${typeKey}|d${size}`;
                    effects.damageAdds.diceByType.set(key, (effects.damageAdds.diceByType.get(key) || 0) + count);
                    const avgDamage = count * ((size + 1) / 2);
                    effects.damageBonus += avgDamage;
                    effects.sourceDetails.damageBonus.push({
                        label: `I'm Lazy damage #${index + 1} (${typeKey} ${count}d${size})`,
                        value: avgDamage
                    });
                    return;
                }

                const flat = Number(valueText);
                if (!Number.isFinite(flat) || flat === 0) return;
                effects.damageAdds.flat += flat;
                if (!(effects.damageAdds.flatByType instanceof Map)) {
                    effects.damageAdds.flatByType = new Map();
                }
                effects.damageAdds.flatByType.set(typeKey, (effects.damageAdds.flatByType.get(typeKey) || 0) + flat);
                effects.damageBonus += flat;
                effects.sourceDetails.damageBonus.push({
                    label: `I'm Lazy damage #${index + 1} (${typeKey} flat)`,
                    value: flat
                });
            });

            const lazyFlatDamage = Number(state.lazyProxy.damageBonus) || 0;
            if (lazyFlatDamage !== 0) {
                effects.damageBonus += lazyFlatDamage;
                effects.sourceDetails.damageBonus.push({
                    label: "I'm Lazy damage bonus",
                    value: lazyFlatDamage
                });
            }
        }

        effects.attackBonus = Math.max(effects.enhancementAttackBonus, effects.directAttackBonus);

        return effects;
    }

    function computeStackedAc(effects, level = null) {
        const numericLevel = Math.max(1, Math.min(30, parseInt(level, 10) || getCurrentCharacterLevel()));
        const armorBase = Math.max(0, Number(effects && effects.acBase ? effects.acBase.armor : 0) || 0);
        const shieldBase = Math.max(0, Number(effects && effects.acBase ? effects.acBase.shield : 0) || 0);
        const armorModifier = Math.max(0, ...effects.acBuckets.armor);
        const shieldModifier = Math.max(0, ...effects.acBuckets.shield);
        const armor = armorBase + armorModifier;
        const shield = shieldBase + shieldModifier;
        const natural = Math.max(0, ...effects.acBuckets.natural);
        const deflection = Math.max(0, ...effects.acBuckets.deflection);
        const dodge = Math.min(20, effects.acBuckets.dodge.reduce((sum, value) => sum + value, 0));
        const other = effects.acBuckets.other.reduce((sum, value) => sum + value, 0);
        const excludedOtherFlatFooted = Math.max(0, Number(effects && effects.flatFootedExclusions ? effects.flatFootedExclusions.other : 0) || 0);
        const otherInFlatFooted = other - excludedOtherFlatFooted;
        const softStats = getCharacterSoftStatsAtLevel(numericLevel);
        const mods = getAbilityModifiersFromStats(softStats);
        const dexModRaw = Number(mods.dex) || 0;
        const dexCap = getArmorDexCapForLevel(numericLevel);
        const dexMod = dexCap === null ? dexModRaw : Math.min(dexModRaw, dexCap);
        const ownedFeatSet = getOwnedFeatNameSetAtLevel(numericLevel);
        const hasDexRetainFlatFootedFeat = Boolean(ownedFeatSet && (
            ownedFeatSet.has('uncanny dodge i')
            || ownedFeatSet.has('defensive awareness i')
        ));
        const flatFootedDex = hasDexRetainFlatFootedFeat ? dexMod : 0;
        const baseAc = 10;
        const touch = baseAc + deflection + dodge + dexMod + other;
        const flatFooted = baseAc + armor + shield + natural + deflection + otherInFlatFooted + flatFootedDex;
        const touchFlatFooted = baseAc + deflection + otherInFlatFooted + flatFootedDex;

        return {
            baseAc,
            armorBase,
            shieldBase,
            armorModifier,
            shieldModifier,
            armor,
            shield,
            natural,
            deflection,
            dodge,
            other,
            excludedOtherFlatFooted,
            otherInFlatFooted,
            dexModRaw,
            dexCap,
            dexMod,
            hasDexRetainFlatFootedFeat,
            flatFootedDex,
            touch,
            flatFooted,
            touchFlatFooted,
            total: baseAc + armor + shield + natural + deflection + dodge + dexMod + other
        };
    }

    function addDamageAddToSummary(damageAdds, params) {
        if (!damageAdds || !params) return;

        if (!(damageAdds.flatByType instanceof Map)) {
            damageAdds.flatByType = new Map();
        }

        const addTypedFlat = (type, value) => {
            const numericValue = Number(value) || 0;
            if (numericValue <= 0) return;
            const normalizedType = String(type || 'untyped').trim().toLowerCase() || 'untyped';
            damageAdds.flat += numericValue;
            damageAdds.flatByType.set(normalizedType, (damageAdds.flatByType.get(normalizedType) || 0) + numericValue);
        };

        const damageAddType = String(params.damageAddType || '').trim().toLowerCase();
        const mode = String(params.mode || '').toLowerCase();
        const damageType = String(params.damageType || '').trim().toLowerCase() || 'untyped';

        if (damageAddType === 'flat') {
            const flatValue = Math.max(0, Number(params.flatAdd) || 0);
            if (flatValue > 0) {
                addTypedFlat(damageType, flatValue);
                return;
            }
        }

        if (damageAddType === 'dice') {
            const count = Math.max(1, Math.floor(Number(params.diceCount) || 0));
            const dieSize = Math.max(0, Math.floor(Number(params.diceSize) || 0));
            if (count > 0 && dieSize > 1) {
                const key = `${damageType}|d${dieSize}`;
                damageAdds.diceByType.set(key, (damageAdds.diceByType.get(key) || 0) + count);
                return;
            }
        }

        if (mode === 'flat2') {
            addTypedFlat(damageType, 2);
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
                addTypedFlat(damageType, avgDamage);
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
        let plannerLevel = 1;
        if (typeof getCurrentBuildLevel === 'function') {
            plannerLevel = Math.max(1, Math.min(30, parseInt(getCurrentBuildLevel(), 10) || 1));
        }

        const levels = getBestEffortPlannerLevels();
        if (Array.isArray(levels) && levels.length > 0) {
            for (let level = levels.length; level >= 1; level--) {
                const row = levels[level - 1];
                if (row && row.class) {
                    return Math.max(plannerLevel, level);
                }
            }
        }

        return plannerLevel;
    }

    function getIterativeAttackCountFromBab(babValue) {
        const bab = Math.max(0, Math.floor(Number(babValue) || 0));
        let attacks = 1;
        if (bab >= 6) attacks += 1;
        if (bab >= 11) attacks += 1;
        if (bab >= 16) attacks += 1;
        return Math.min(4, attacks);
    }

    function getAttackBonusSequence(totalAttackBonus, babValue) {
        const attacks = getIterativeAttackCountFromBab(babValue);
        const firstAttackBonus = Number(totalAttackBonus) || 0;
        const sequence = [];

        for (let index = 0; index < attacks; index++) {
            sequence.push(firstAttackBonus - (index * 5));
        }

        return sequence;
    }

    function formatAttackBonusSequence(sequence) {
        if (!Array.isArray(sequence) || sequence.length === 0) return '+0';
        return sequence
            .map(value => {
                const rounded = round2(value);
                return rounded >= 0 ? `+${rounded}` : `${rounded}`;
            })
            .join('/');
    }

    function getAverageDamageAddsValue(damageAdds) {
        if (!damageAdds || !(damageAdds.diceByType instanceof Map)) return 0;

        let total = Number(damageAdds.flat) || 0;
        damageAdds.diceByType.forEach((amount, key) => {
            const numericAmount = Number(amount) || 0;
            if (numericAmount <= 0) return;

            const [, die] = String(key || '').split('|');
            if (die === 'avg') {
                total += numericAmount;
                return;
            }

            const dieMatch = String(die || '').match(/^d(\d+)$/i);
            if (!dieMatch) return;
            const dieSize = parseInt(dieMatch[1], 10) || 0;
            if (dieSize <= 0) return;
            total += numericAmount * ((dieSize + 1) / 2);
        });

        return total;
    }

    function parseCritProfile(rawCritText) {
        const text = String(rawCritText || '').trim().toLowerCase();

        let threatMin = 20;
        let multiplier = 2;

        const rangeMatch = text.match(/(\d+)\s*-\s*20/);
        if (rangeMatch) {
            const parsedThreatMin = parseInt(rangeMatch[1], 10);
            if (Number.isFinite(parsedThreatMin)) {
                threatMin = Math.max(2, Math.min(20, parsedThreatMin));
            }
        }

        const multiplierMatch = text.match(/x\s*(\d+)/);
        if (multiplierMatch) {
            const parsedMultiplier = parseInt(multiplierMatch[1], 10);
            if (Number.isFinite(parsedMultiplier) && parsedMultiplier > 0) {
                multiplier = parsedMultiplier;
            }
        }

        if (!rangeMatch && /\b20\b/.test(text)) {
            threatMin = 20;
        }

        return {
            threatMin,
            multiplier,
            label: threatMin < 20 ? `${threatMin}-20/x${multiplier}` : `20/x${multiplier}`
        };
    }

    function normalizeFocusGroupName(rawGroup) {
        const normalized = String(rawGroup || '').trim().toLowerCase().replace(/[\s_]+/g, ' ');
        const aliases = {
            'missle': 'missile',
            'one handed edge': 'one-handed edge',
            'two handed': 'two-handed'
        };
        return aliases[normalized] || normalized;
    }

    function parseFocusGroupList(rawGroupText) {
        return String(rawGroupText || '')
            .split(',')
            .map(token => normalizeFocusGroupName(token))
            .filter(Boolean)
            .filter((value, index, array) => array.indexOf(value) === index);
    }

    function getMainHandFocusGroups() {
        const mainHandState = ensureSlotState('mainHand');
        const meta = (mainHandState && mainHandState.meta) ? mainHandState.meta : {};
        const explicitGroups = parseFocusGroupList(meta.focusGroup || '');
        if (explicitGroups.length > 0) return explicitGroups;

        if (meta.concussion) return ['concussion'];
        if (meta.twoHanded) return ['two-handed'];
        if (meta.polearm) return ['polearm'];
        if (meta.oneHandEdged) return ['one-handed edge'];
        if (meta.unarmed) return ['unarmed'];
        if (meta.missile) return ['missile'];
        if (meta.thrown) return ['thrown'];
        return [];
    }

    function getAbilityModifiersFromStats(stats) {
        if (typeof getAbilityModifiers === 'function') {
            try {
                const computed = getAbilityModifiers(stats);
                if (computed && typeof computed === 'object') {
                    return computed;
                }
            } catch {
                // no-op
            }
        }

        const read = (key) => Number(stats && stats[key]) || 10;
        return {
            str: Math.floor((read('str') - 10) / 2),
            dex: Math.floor((read('dex') - 10) / 2),
            con: Math.floor((read('con') - 10) / 2),
            int: Math.floor((read('int') - 10) / 2),
            wis: Math.floor((read('wis') - 10) / 2),
            cha: Math.floor((read('cha') - 10) / 2)
        };
    }

    function normalizeWeaponNameForRules(rawName) {
        return String(rawName || '')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '');
    }

    function isFinesseBaseWeapon(mainHandMeta) {
        const nameFromChart = normalizeWeaponNameForRules(mainHandMeta && mainHandMeta.baseWeaponChart);
        const nameFromType = normalizeWeaponNameForRules(mainHandMeta && mainHandMeta.baseWeaponType);
        const candidates = [nameFromChart, nameFromType].filter(Boolean);

        const exactAllowed = new Set([
            'dagger',
            'handaxe',
            'kama',
            'kukri',
            'lighthammer',
            'mace',
            'rapier',
            'shortsword',
            'sickle',
            'whip',
            'mace(lightmace)'.replace(/[^a-z0-9]/g, ''),
            'lightmace'
        ]);

        return candidates.some(candidate => {
            if (exactAllowed.has(candidate)) return true;
            if (candidate.includes('shortsword')) return true;
            if (candidate.includes('lighthammer')) return true;
            if (candidate.includes('lightmace')) return true;
            return false;
        });
    }

    function getWeaponAbilityModifiers(level, options = {}) {
        const numericLevel = Math.max(1, parseInt(level, 10) || 1);
        const stats = getCharacterSoftStatsAtLevel(numericLevel);
        const minStrength = Math.max(0, Number(options.strOverrideMin) || 0);
        const normalizedStats = {
            ...(stats || {})
        };
        if (minStrength > 0) {
            normalizedStats.str = Math.max(minStrength, Number(normalizedStats.str) || 0);
        }
        const mods = getAbilityModifiersFromStats(normalizedStats);
        const strMod = Number(mods.str) || 0;
        const dexModRaw = Number(mods.dex) || 0;
        const dexCap = getArmorDexCapForLevel(numericLevel);
        const dexMod = dexCap === null ? dexModRaw : Math.min(dexModRaw, dexCap);

        const featSet = getOwnedFeatNameSetAtLevel(numericLevel);
        const hasWeaponFinesse = featSet.has('weapon finesse');

        const mainHandState = ensureSlotState('mainHand');
        const mainHandMeta = (mainHandState && mainHandState.meta) ? mainHandState.meta : {};
        const finesseWeapon = isFinesseBaseWeapon(mainHandMeta);
        const isRangedAttackWeapon = Boolean(mainHandMeta && mainHandMeta.ranged)
            || (Boolean(mainHandMeta && mainHandMeta.missile) && !Boolean(mainHandMeta && mainHandMeta.thrown));

        const canUseDexForAttack = isRangedAttackWeapon || hasWeaponFinesse || finesseWeapon;
        const attackAbility = (canUseDexForAttack && dexMod > strMod) ? 'dex' : 'str';
        const isRangedMissileWeapon = Boolean(mainHandMeta && mainHandMeta.missile) && !Boolean(mainHandMeta && mainHandMeta.thrown);
        const mightyCap = Math.max(0, Number(options.mightyCap) || 0);

        let damageAbilityMod = strMod;
        let mightyApplied = 0;
        if (isRangedMissileWeapon) {
            const positiveStrMod = Math.max(0, strMod);
            mightyApplied = Math.min(positiveStrMod, mightyCap);
            damageAbilityMod = mightyApplied;
        }

        return {
            strMod,
            dexModRaw,
            dexMod,
            dexCap,
            attackAbility,
            attackAbilityMod: attackAbility === 'dex' ? dexMod : strMod,
            damageAbilityMod,
            isRangedMissileWeapon,
            isRangedAttackWeapon,
            mightyCap,
            mightyApplied,
            hasWeaponFinesse,
            finesseWeapon,
            weaponName: String(mainHandMeta.baseWeaponChart || mainHandMeta.baseWeaponType || '').trim()
        };
    }

    function getBuffSoftStatBonuses(level) {
        const stats = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
        const detail = [];
        const numericLevel = Math.max(1, Math.floor(Number(level) || 1));
        const featSet = getOwnedFeatNameSetAtLevel(numericLevel);

        const hasFeatLike = (prefixText, suffixText) => {
            const prefix = String(prefixText || '').toLowerCase();
            const suffix = String(suffixText || '').toLowerCase();
            if (!prefix || !suffix) return false;
            for (const featName of featSet) {
                const normalized = String(featName || '').toLowerCase();
                if (normalized.includes(prefix) && normalized.includes(suffix)) {
                    return true;
                }
            }
            return false;
        };

        const hasGsfTransmutation = hasFeatLike('greater spell focus', 'transmutation');
        const hasEsfTransmutation = hasFeatLike('epic spell focus', 'transmutation');
        const baseBonus = hasEsfTransmutation ? 6 : (hasGsfTransmutation ? 5 : 4);

        BUFF_DEFINITIONS.forEach(def => {
            if (!def || !def.statBuff) return;
            const statKey = normalizeStatRequirementKey(def.statBuff);
            if (!statKey || !Object.prototype.hasOwnProperty.call(stats, statKey)) return;

            const config = state.buffs && state.buffs[def.name];
            if (!config || !config.enabled) return;

            const secondCastBonus = config.secondCast ? 1 : 0;
            const totalBonus = baseBonus + secondCastBonus;
            stats[statKey] += totalBonus;
            detail.push({
                stat: statKey,
                label: def.label,
                value: totalBonus,
                secondCast: Boolean(config.secondCast)
            });
        });

        return {
            stats,
            detail,
            hasGsfTransmutation,
            hasEsfTransmutation,
            baseBonus
        };
    }

    function getOwnedFeatNameSetAtLevel(level) {
        const names = new Set();
        if (typeof getEffectiveOwnedFeatDetailsAtLevel !== 'function') {
            return names;
        }

        const ownedDetails = getEffectiveOwnedFeatDetailsAtLevel(level, { includeSelectedCurrentLevel: true });
        if (!ownedDetails || typeof ownedDetails.forEach !== 'function') {
            return names;
        }

        ownedDetails.forEach((detail, key) => {
            const byKey = String(key || '').trim();
            if (byKey) {
                names.add(byKey.toLowerCase());
            }

            if (detail && detail.name) {
                const resolved = typeof resolveFeatName === 'function'
                    ? resolveFeatName(detail.name)
                    : detail.name;
                if (resolved) {
                    names.add(String(resolved).trim().toLowerCase());
                }
            }
        });

        return names;
    }

    function parseFeatFocusGroup(featNameLower) {
        const match = String(featNameLower || '').match(/\(([^)]+)\)\s*$/);
        if (!match) return '';
        return normalizeFocusGroupName(match[1]);
    }

    function hasFeatPrefix(featNameLower, prefixLower) {
        const text = String(featNameLower || '').trim();
        const prefix = String(prefixLower || '').trim();
        return text === prefix || text.startsWith(`${prefix} (`);
    }

    function doesWeaponFeatApply(featNameLower, focusGroups, hasWeaponOfChoice) {
        const featGroup = parseFeatFocusGroup(featNameLower);
        if (!featGroup) return true;
        if (featGroup === 'chosen weapon') return hasWeaponOfChoice;
        const groups = Array.isArray(focusGroups)
            ? focusGroups
            : (focusGroups ? [focusGroups] : []);
        if (groups.length === 0) return false;
        return groups.includes(featGroup);
    }

    function getWeaponFeatCombatModifiers(level, effects, baseCritProfile) {
        const featSet = getOwnedFeatNameSetAtLevel(level);
        const focusGroups = getMainHandFocusGroups();
        const focusGroup = focusGroups.join(', ');
        const hasWeaponOfChoice = featSet.has('weapon of choice');

        let attackBonus = 0;
        let acBonus = 0;
        let damageBonus = 0;
        let improvedCriticalCount = 0;
        let increasedMultiplierCount = 0;
        let hasKiCritical = false;
        let hasOverwhelmingCritical = false;
        const attackSources = [];
        const acSources = [];
        const damageSources = [];
        const critSources = [];

        featSet.forEach(featNameLower => {
            const featName = String(featNameLower || '').trim();
            if (!featName) return;

            if (hasFeatPrefix(featName, 'weapon focus') && doesWeaponFeatApply(featName, focusGroups, hasWeaponOfChoice)) {
                attackBonus += 1;
                attackSources.push({ feat: featName, value: 1 });
                return;
            }

            if (hasFeatPrefix(featName, 'epic weapon focus') && doesWeaponFeatApply(featName, focusGroups, hasWeaponOfChoice)) {
                attackBonus += 2;
                attackSources.push({ feat: featName, value: 2 });
                return;
            }

            if (hasFeatPrefix(featName, 'weapon specialization') && doesWeaponFeatApply(featName, focusGroups, hasWeaponOfChoice)) {
                damageBonus += 2;
                damageSources.push({ feat: featName, value: 2 });
                return;
            }

            if (hasFeatPrefix(featName, 'epic weapon specialization') && doesWeaponFeatApply(featName, focusGroups, hasWeaponOfChoice)) {
                damageBonus += 4;
                damageSources.push({ feat: featName, value: 4 });
                return;
            }

            if (hasFeatPrefix(featName, 'improved critical') && doesWeaponFeatApply(featName, focusGroups, hasWeaponOfChoice)) {
                improvedCriticalCount += 1;
                critSources.push({ feat: featName, value: 1, kind: 'improvedCritical' });
                return;
            }

            if (hasFeatPrefix(featName, 'epic improved critical') && doesWeaponFeatApply(featName, focusGroups, hasWeaponOfChoice)) {
                improvedCriticalCount += 1;
                critSources.push({ feat: featName, value: 1, kind: 'improvedCritical' });
                return;
            }

            if (hasFeatPrefix(featName, 'overwhelming critical') && doesWeaponFeatApply(featName, focusGroups, hasWeaponOfChoice)) {
                hasOverwhelmingCritical = true;
                critSources.push({ feat: featName, value: 1, kind: 'overwhelmingCritical' });
                return;
            }

            if (featName === 'superior weapon focus' && hasWeaponOfChoice) {
                attackBonus += 1;
                attackSources.push({ feat: featName, value: 1 });
                return;
            }

            if (featName === 'epic prowess') {
                attackBonus += 1;
                attackSources.push({ feat: featName, value: 1 });
                return;
            }

            if (featName === 'small stature') {
                attackBonus += 1;
                acBonus += 1;
                attackSources.push({ feat: featName, value: 1 });
                acSources.push({ feat: featName, value: 1 });
                return;
            }

            if (featName === 'method: signature weapon') {
                attackBonus += 1;
                attackSources.push({ feat: featName, value: 1 });
                return;
            }

            if (featName === 'improved method: signature weapon mastery') {
                attackBonus += 2;
                attackSources.push({ feat: featName, value: 2 });
                return;
            }

            if (featName === 'increased multiplier' && hasWeaponOfChoice) {
                increasedMultiplierCount += 1;
                critSources.push({ feat: featName, value: 1, kind: 'multiplier' });
                return;
            }

            if (featName === 'ki critical' && hasWeaponOfChoice) {
                hasKiCritical = true;
                critSources.push({ feat: featName, value: 2, kind: 'kiCriticalRange' });
            }
        });

        const battleTrainingAttack = getBattleTrainingAttackBonus(level);
        attackBonus += battleTrainingAttack;
        if (battleTrainingAttack !== 0) {
            attackSources.push({ feat: 'battle training', value: battleTrainingAttack });
        }

        const baseThreatMin = Math.max(2, Math.min(20, Math.floor(Number(baseCritProfile && baseCritProfile.threatMin) || 20)));
        const baseMultiplier = Math.max(1, Math.floor(Number(baseCritProfile && baseCritProfile.multiplier) || 2));
        const baseThreatSpan = Math.max(1, 21 - baseThreatMin);

        const hasKeen = effects && effects.flags instanceof Set
            ? Array.from(effects.flags).some(flag => String(flag || '').trim().toLowerCase().startsWith('keen'))
            : false;

        const threatRangeIncreases = improvedCriticalCount + (hasKeen ? 1 : 0);
        let threatMin = baseThreatMin - (baseThreatSpan * threatRangeIncreases);
        if (hasKiCritical) threatMin -= 2;
        threatMin = Math.max(2, Math.min(20, threatMin));

        const multiplierBonus = Math.max(0, increasedMultiplierCount);
        const multiplier = Math.max(1, baseMultiplier + multiplierBonus);
        const overwhelmingCritDice = hasOverwhelmingCritical ? Math.max(0, multiplier - 1) : 0;
        const overwhelmingCritAverage = overwhelmingCritDice * 3.5;

        return {
            focusGroup,
            attackBonus,
            acBonus,
            damageBonus,
            attackSources,
            acSources,
            damageSources,
            critSources,
            hasKeen,
            improvedCriticalCount,
            hasKiCritical,
            multiplierBonus,
            overwhelmingCritDice,
            overwhelmingCritAverage,
            threatMin,
            multiplier,
            critLabel: threatMin < 20 ? `${threatMin}-20/x${multiplier}` : `20/x${multiplier}`
        };
    }

    function getCritProfileForSimulation(effects, featCombatMods = null) {
        const mainHandState = ensureSlotState('mainHand');
        const mainHandMeta = (mainHandState && mainHandState.meta) ? mainHandState.meta : {};
        const parsed = parseCritProfile(mainHandMeta.critRange || '');

        if (featCombatMods && typeof featCombatMods === 'object') {
            const threatMin = Math.max(2, Math.min(20, Math.floor(Number(featCombatMods.threatMin) || parsed.threatMin)));
            const multiplier = Math.max(1, Math.floor(Number(featCombatMods.multiplier) || parsed.multiplier));
            return {
                threatMin,
                multiplier,
                label: threatMin < 20 ? `${threatMin}-20/x${multiplier}` : `20/x${multiplier}`
            };
        }

        return {
            threatMin: parsed.threatMin,
            multiplier: parsed.multiplier,
            label: parsed.threatMin < 20 ? `${parsed.threatMin}-20/x${parsed.multiplier}` : `20/x${parsed.multiplier}`
        };
    }

    function normalizeSongNameKey(rawName) {
        return String(rawName || '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, ' ')
            .trim();
    }

    function parseSongNumeric(rawValue) {
        const text = String(rawValue || '').trim();
        if (!text || text === '-' || /^n\/?a$/i.test(text)) return null;

        const direct = text.match(/^[-+]?\d+(?:\.\d+)?$/);
        if (direct) return Number(direct[0]);

        const dice = text.match(/^(\d+)d(\d+)$/i);
        if (dice) {
            const count = Number(dice[1]) || 0;
            const size = Number(dice[2]) || 0;
            if (count > 0 && size > 1) return count * ((size + 1) / 2);
        }

        const percent = text.match(/^([-+]?\d+(?:\.\d+)?)%$/);
        if (percent) return Number(percent[1]);

        const firstNumber = text.match(/[-+]?\d+(?:\.\d+)?/);
        if (firstNumber) return Number(firstNumber[0]);

        return null;
    }

    function parseNumericBonus(rawValue) {
        if (rawValue === null || rawValue === undefined) return 0;
        if (typeof rawValue === 'number') return Number.isFinite(rawValue) ? rawValue : 0;

        const parsedSong = parseSongNumeric(rawValue);
        if (Number.isFinite(parsedSong)) return parsedSong;

        const text = String(rawValue || '').trim();
        const match = text.match(/[+-]?\d+(?:\.\d+)?/);
        if (!match) return 0;
        const numeric = Number(match[0]);
        return Number.isFinite(numeric) ? numeric : 0;
    }

    function parseLazyDamageEntries(rawText) {
        const entries = [];
        const text = String(rawText || '');
        if (!text.trim()) return entries;

        text.split(/\r?\n/).forEach(line => {
            const trimmed = String(line || '').trim();
            if (!trimmed) return;

            const withType = trimmed.match(/^([^:]+):\s*([+-]?\d+(?:\.\d+)?|\d+d\d+)$/i);
            if (withType) {
                entries.push({ type: String(withType[1]).trim(), valueText: String(withType[2]).trim() });
                return;
            }

            const bare = trimmed.match(/^([+-]?\d+(?:\.\d+)?|\d+d\d+)$/i);
            if (bare) {
                entries.push({ type: 'untyped', valueText: String(bare[1]).trim() });
            }
        });

        return entries;
    }

    function getLazyProxySoftStatBonus(statKey) {
        ensureLazyProxyState();
        if (!state.lazyProxy.enabled) return 0;
        if (!state.lazyProxy.stats || typeof state.lazyProxy.stats !== 'object') return 0;
        return Number(state.lazyProxy.stats[statKey]) || 0;
    }

    function getClassInfoByName(className) {
        const target = String(className || '').trim();
        if (!target) return null;

        try {
            if (classData && typeof classData === 'object') {
                if (classData[target]) {
                    return { key: target, info: classData[target] };
                }

                const lowered = target.toLowerCase();
                const matchedKey = Object.keys(classData).find(key => String(key || '').toLowerCase() === lowered);
                if (matchedKey) {
                    return { key: matchedKey, info: classData[matchedKey] };
                }
            }
        } catch {
            // no-op
        }

        return null;
    }

    function getClassExtraEntries(classInfo) {
        if (!classInfo || typeof classInfo !== 'object') return [];
        if (Array.isArray(classInfo.extras)) return classInfo.extras;
        if (Array.isArray(classInfo.Extras)) return classInfo.Extras;
        return [];
    }

    function getClassExtraProgressionBonus(className, extraNameCandidates, level) {
        const resolved = getClassInfoByName(className);
        if (!resolved || !resolved.info) {
            plannerDebugLog('Class extra bonus: class not found', { className, level });
            return 0;
        }

        const extras = getClassExtraEntries(resolved.info);
        if (!Array.isArray(extras) || extras.length === 0) {
            plannerDebugLog('Class extra bonus: no extras array', { className, resolvedKey: resolved.key, level });
            return 0;
        }

        const candidateSet = new Set((Array.isArray(extraNameCandidates) ? extraNameCandidates : [extraNameCandidates])
            .map(name => normalizeSongNameKey(name))
            .filter(Boolean));
        if (candidateSet.size === 0) {
            plannerDebugLog('Class extra bonus: empty candidate set', { className, level, extraNameCandidates });
            return 0;
        }

        const matchingExtra = extras.find(entry => {
            const normalizedName = normalizeSongNameKey(entry && entry.name);
            return normalizedName && candidateSet.has(normalizedName);
        });
        if (!matchingExtra || !Array.isArray(matchingExtra.values)) {
            plannerDebugLog('Class extra bonus: no matching extra row', {
                className,
                resolvedKey: resolved.key,
                level,
                requestedCandidates: Array.from(candidateSet),
                availableExtras: extras.map(entry => String(entry && entry.name ? entry.name : ''))
            });
            return 0;
        }

        const classLevel = getClassLevelAtBuildLevel(resolved.key, level);
        if (classLevel <= 0) {
            plannerDebugLog('Class extra bonus: class level is zero', {
                className,
                resolvedKey: resolved.key,
                level,
                matchedExtra: matchingExtra.name
            });
            return 0;
        }

        const progressionValues = matchingExtra.values;
        if (progressionValues.length === 0) {
            plannerDebugLog('Class extra bonus: extra has no values', {
                className,
                resolvedKey: resolved.key,
                level,
                matchedExtra: matchingExtra.name
            });
            return 0;
        }

        const clampedIndex = Math.max(0, Math.min(classLevel - 1, progressionValues.length - 1));

        const rawValue = progressionValues[clampedIndex];
        const parsedBonus = parseNumericBonus(rawValue);
        plannerDebugLog('Class extra bonus resolved', {
            className,
            resolvedKey: resolved.key,
            level,
            classLevel,
            matchedExtra: matchingExtra.name,
            requestedCandidates: Array.from(candidateSet),
            clampedIndex,
            rawValue,
            parsedBonus
        });
        return parsedBonus;
    }

    function getClassRuleBehaviorType(def) {
        const explicit = String(def && def.behaviorType || '').trim().toLowerCase();
        if (explicit) return explicit;

        const legacySpecial = String(def && def.special || '').trim();
        if (legacySpecial === 'spellswordWeaveAffinity') return 'spellswordweaveaffinity';
        if (legacySpecial === 'unholyAccuracy') return 'featflatcappedattack';
        if (legacySpecial === 'corruptWeapon') return 'featweaponfloorfromclasslevel';
        if (legacySpecial === 'divineSmite') return 'featmeleesmite';
        return 'classextra';
    }

    function normalizeRequiredFeatAnyOf(rawValue) {
        return Array.isArray(rawValue)
            ? rawValue.map(value => String(value || '').trim()).filter(Boolean)
            : [];
    }

    function evaluateRequiredFeatGate(featSet, requiredFeatValue, requiredFeatAnyOfValues) {
        const normalizedFeatSet = featSet instanceof Set ? featSet : new Set();
        const requiredFeat = String(requiredFeatValue || '').trim().toLowerCase();
        const requiredFeatAnyOf = normalizeRequiredFeatAnyOf(requiredFeatAnyOfValues)
            .map(value => ({ raw: value, key: String(value || '').trim().toLowerCase() }))
            .filter(entry => entry.key);

        if (requiredFeatAnyOf.length > 0) {
            const hasAny = requiredFeatAnyOf.some(entry => normalizedFeatSet.has(entry.key));
            if (!hasAny) {
                return {
                    available: false,
                    reason: `Requires one of: ${requiredFeatAnyOf.map(entry => entry.raw).join(' or ')}`
                };
            }
            return { available: true, reason: '' };
        }

        if (requiredFeat && !normalizedFeatSet.has(requiredFeat)) {
            return {
                available: false,
                reason: `Requires feat: ${String(requiredFeatValue || requiredFeat).trim()}`
            };
        }

        return { available: true, reason: '' };
    }

    function evaluateClassRuleRequirements(def, level, featSet = null) {
        const ownedFeatSet = featSet instanceof Set ? featSet : getOwnedFeatNameSetAtLevel(level);
        const config = def && def.behaviorConfig && typeof def.behaviorConfig === 'object'
            ? def.behaviorConfig
            : {};

        const featGate = evaluateRequiredFeatGate(
            ownedFeatSet,
            (def && def.requiresFeat) || config.requiredFeat,
            (def && def.requiresFeatAnyOf) || config.requiredFeatAnyOf
        );
        if (!featGate.available) {
            return featGate;
        }

        const resolvedClassName = String(def && def.requiresClass || config.className || def && def.className || '').trim();
        const resolvedRequiredClassLevel = Number.isFinite(Number(def && def.requiresClassLevel))
            ? Number(def.requiresClassLevel)
            : (resolvedClassName ? 1 : 0);
        if (resolvedClassName && resolvedRequiredClassLevel > 0) {
            const classLevel = getClassLevelAtBuildLevel(resolvedClassName, level);
            if (classLevel < resolvedRequiredClassLevel) {
                const needsText = resolvedRequiredClassLevel <= 1
                    ? `${resolvedClassName} class levels`
                    : `${resolvedClassName} level ${resolvedRequiredClassLevel}+`;
                return {
                    available: false,
                    reason: `Requires ${needsText}`
                };
            }
        }

        return {
            available: true,
            reason: ''
        };
    }

    function evaluateClassAttackRule(def, level) {
        const behaviorType = getClassRuleBehaviorType(def);
        const config = def && def.behaviorConfig && typeof def.behaviorConfig === 'object'
            ? def.behaviorConfig
            : {};
        const featSet = getOwnedFeatNameSetAtLevel(level);

        const result = {
            behaviorType,
            applies: false,
            disabledReason: '',
            detailsText: 'Inactive',
            attackSources: [],
            cappedSources: [],
            damageBonus: 0,
            damageSources: [],
            dodgeAcBonus: 0,
            dodgeSources: [],
            weaponBonusFloor: 0
        };

        if (behaviorType === 'classextra') {
            const classLevel = getClassLevelAtBuildLevel(def.className, level);
            const activeBonus = classLevel > 0
                ? getClassExtraProgressionBonus(def.className, def.extraNameCandidates, level)
                : 0;
            result.detailsText = classLevel > 0
                ? `Class Lvl ${classLevel} | Bonus ${activeBonus >= 0 ? '+' : ''}${round2(activeBonus)}`
                : 'Class not present in current build';
            if (activeBonus !== 0) {
                result.applies = true;
                result.attackSources.push({ key: def.key, label: def.sourceLabel, bonus: activeBonus });
            }
            return result;
        }

        if (behaviorType === 'spellswordweaveaffinity') {
            const className = String(config.className || def.className || 'Spellsword').trim() || 'Spellsword';
            const blockerClassName = String(config.blockerClassName || 'Monk').trim() || 'Monk';
            const levelsPerStep = Math.max(1, Math.floor(Number(config.levelsPerStep) || 7));
            const capAbilityStat = String(config.capAbilityStat || 'int').trim().toLowerCase() || 'int';
            const option = config.option && typeof config.option === 'object' ? config.option : {};
            const optionKey = String(option.key || 'spellswordPrimaryAttribute').trim() || 'spellswordPrimaryAttribute';
            const optionValues = Array.isArray(option.values)
                ? option.values.map(value => String(value || '').trim().toLowerCase()).filter(Boolean)
                : ['str', 'dex'];
            const defaultOption = String(option.defaultValue || optionValues[0] || 'str').trim().toLowerCase();
            const selectedPrimaryAttribute = String(state.classBonusOptions && state.classBonusOptions[optionKey] || defaultOption).trim().toLowerCase();
            const selectedPrimarySafe = optionValues.includes(selectedPrimaryAttribute) ? selectedPrimaryAttribute : defaultOption;

            const classLevel = getClassLevelAtBuildLevel(className, level);
            const blockerClassLevel = getClassLevelAtBuildLevel(blockerClassName, level);
            const progressionBonus = Math.max(0, Math.floor(classLevel / levelsPerStep));
            const hardStats = getCharacterStatsAtLevel(level);
            const hardAbilityMods = getAbilityModifiersFromStats(hardStats);
            const hardCapModifier = Math.max(0, Number(hardAbilityMods[capAbilityStat]) || 0);
            const appliedBonus = Math.max(0, Math.min(progressionBonus, hardCapModifier));

            result.detailsText = classLevel <= 0
                ? 'Class not present in current build'
                : blockerClassLevel > 0
                    ? `Class Lvl ${classLevel} | Disabled (${blockerClassName} levels: ${blockerClassLevel})`
                    : `Class Lvl ${classLevel} | Per-${levelsPerStep} levels +${round2(progressionBonus)} | Hard ${capAbilityStat.toUpperCase()} cap +${round2(hardCapModifier)} | Applied +${round2(appliedBonus)}`;

            if (classLevel <= 0 || blockerClassLevel > 0 || appliedBonus <= 0) {
                result.disabledReason = classLevel <= 0
                    ? 'Class not present in current build'
                    : (blockerClassLevel > 0 ? `Disabled (${blockerClassName} levels: ${blockerClassLevel})` : 'No bonus after cap');
                return result;
            }

            result.applies = true;
            result.attackSources.push({
                key: `${def.key}_attack`,
                label: `${def.sourceLabel} (${selectedPrimarySafe.toUpperCase()}) AB`,
                bonus: appliedBonus
            });

            const damageAttribute = String(config.damageAttribute || 'str').trim().toLowerCase() || 'str';
            const dodgeAttribute = String(config.dodgeAttribute || 'dex').trim().toLowerCase() || 'dex';
            if (selectedPrimarySafe === damageAttribute) {
                result.damageBonus += appliedBonus;
                result.damageSources.push({ label: `${def.sourceLabel} (${damageAttribute.toUpperCase()})`, value: appliedBonus });
            } else if (selectedPrimarySafe === dodgeAttribute) {
                result.dodgeAcBonus += appliedBonus;
                result.dodgeSources.push({ label: `${def.sourceLabel} (${dodgeAttribute.toUpperCase()})`, value: appliedBonus });
            }

            return result;
        }

        if (behaviorType === 'featflatcappedattack') {
            const requiredFeat = config.requiredFeat;
            const requiredFeatAnyOf = config.requiredFeatAnyOf;
            const attackBonus = Number(config.attackBonus) || 0;
            const featGate = evaluateRequiredFeatGate(featSet, requiredFeat, requiredFeatAnyOf);
            if (!featGate.available) {
                result.disabledReason = featGate.reason;
                result.detailsText = result.disabledReason;
                return result;
            }
            result.applies = attackBonus !== 0;
            result.detailsText = result.applies
                ? `Feat found | Capped AB +${round2(attackBonus)}`
                : 'No bonus';
            if (result.applies) {
                result.cappedSources.push({ key: def.key, label: def.sourceLabel, bonus: attackBonus });
            }
            return result;
        }

        if (behaviorType === 'featweaponfloorfromclasslevel') {
            const requiredFeat = config.requiredFeat;
            const requiredFeatAnyOf = config.requiredFeatAnyOf;
            const className = String(config.className || def.className || '').trim();
            const classLevel = getClassLevelAtBuildLevel(className, level);
            const featGate = evaluateRequiredFeatGate(featSet, requiredFeat, requiredFeatAnyOf);
            if (!featGate.available) {
                result.disabledReason = featGate.reason;
                result.detailsText = result.disabledReason;
                return result;
            }
            if (classLevel <= 0) {
                result.disabledReason = `Requires ${className} class levels`;
                result.detailsText = result.disabledReason;
                return result;
            }

            const base = Number(config.baseValue);
            const baseValue = Number.isFinite(base) ? base : 1;
            const levelsPerStep = Math.max(1, Math.floor(Number(config.levelsPerStep) || 5));
            const stepValue = Number.isFinite(Number(config.stepValue)) ? Number(config.stepValue) : 1;
            const minValue = Number.isFinite(Number(config.minValue)) ? Number(config.minValue) : 1;
            const maxValue = Number.isFinite(Number(config.maxValue)) ? Number(config.maxValue) : 5;
            const computed = baseValue + (Math.floor(Math.max(0, classLevel - 1) / levelsPerStep) * stepValue);
            const floorValue = Math.max(minValue, Math.min(maxValue, computed));

            result.applies = floorValue > 0;
            result.weaponBonusFloor = floorValue;
            result.detailsText = result.applies
                ? `${className} Lvl ${classLevel} | Weapon minimum +${round2(floorValue)} (main-hand)`
                : 'No weapon minimum bonus';
            return result;
        }

        if (behaviorType === 'featmeleesmite') {
            const requiredFeat = config.requiredFeat;
            const requiredFeatAnyOf = config.requiredFeatAnyOf;
            const className = String(config.className || def.className || 'Paladin').trim() || 'Paladin';
            const classLevel = getClassLevelAtBuildLevel(className, level);
            const attackAbility = String(config.attackAbilityStat || 'cha').trim().toLowerCase() || 'cha';
            const damageCap = Math.max(0, Number(config.damageCap) || 20);

            const featGate = evaluateRequiredFeatGate(featSet, requiredFeat, requiredFeatAnyOf);
            if (!featGate.available) {
                result.disabledReason = featGate.reason;
                result.detailsText = result.disabledReason;
                return result;
            }

            const mainHandState = ensureSlotState('mainHand');
            const mainHandMeta = (mainHandState && mainHandState.meta) ? mainHandState.meta : {};
            const isMeleeWeapon = !Boolean(mainHandMeta && (mainHandMeta.missile || mainHandMeta.thrown || mainHandMeta.ranged));
            if (Boolean(config.requiresMelee) && !isMeleeWeapon) {
                result.disabledReason = 'Only applies with melee weapons';
                result.detailsText = result.disabledReason;
                return result;
            }

            const hardStats = getCharacterStatsAtLevel(level);
            const hardMods = getAbilityModifiersFromStats(hardStats);
            const attackAdd = Number(hardMods && hardMods[attackAbility]) || 0;
            const damageAdd = Math.min(damageCap, Math.max(0, classLevel));

            result.applies = attackAdd !== 0 || damageAdd !== 0;
            result.detailsText = result.applies
                ? `Melee active | AB ${attackAdd >= 0 ? '+' : ''}${round2(attackAdd)} (${attackAbility.toUpperCase()}) | Damage +${round2(damageAdd)} (${className} cap ${damageCap})`
                : 'Inactive';
            if (attackAdd !== 0) {
                result.attackSources.push({ key: def.key, label: `${def.sourceLabel} (${attackAbility.toUpperCase()})`, bonus: attackAdd });
            }
            if (damageAdd !== 0) {
                result.damageBonus += damageAdd;
                result.damageSources.push({ label: `${def.sourceLabel} (${className} levels, cap ${damageCap})`, value: damageAdd });
            }
            return result;
        }

        result.detailsText = 'Unsupported rule behavior';
        return result;
    }

    function getClassHardAttackBonus(level) {
        ensureClassAttackToggleState();
        ensureClassBonusOptionsState();
        const featSet = getOwnedFeatNameSetAtLevel(level);

        const sources = [];
        const cappedSources = [];
        const damageSources = [];
        const dodgeSources = [];
        let damageBonus = 0;
        let dodgeAcBonus = 0;
        let weaponBonusFloor = 0;
        let cappedAttackBonusFromClass = 0;
        const ruleEvaluations = {};

        CLASS_ATTACK_BONUS_TOGGLE_DEFINITIONS.forEach(def => {
            if (!state.classAttackToggles[def.key]) return;
            const requirement = evaluateClassRuleRequirements(def, level, featSet);
            if (!requirement.available) {
                state.classAttackToggles[def.key] = false;
                return;
            }

            const evaluation = evaluateClassAttackRule(def, level);
            ruleEvaluations[def.key] = evaluation;

            if (Array.isArray(evaluation.attackSources)) {
                evaluation.attackSources.forEach(source => sources.push(source));
            }
            if (Array.isArray(evaluation.cappedSources)) {
                evaluation.cappedSources.forEach(source => {
                    cappedSources.push(source);
                    cappedAttackBonusFromClass += Number(source.bonus) || 0;
                });
            }

            damageBonus += Number(evaluation.damageBonus) || 0;
            dodgeAcBonus += Number(evaluation.dodgeAcBonus) || 0;
            weaponBonusFloor = Math.max(weaponBonusFloor, Number(evaluation.weaponBonusFloor) || 0);

            if (Array.isArray(evaluation.damageSources)) {
                evaluation.damageSources.forEach(source => damageSources.push(source));
            }
            if (Array.isArray(evaluation.dodgeSources)) {
                evaluation.dodgeSources.forEach(source => dodgeSources.push(source));
            }
        });

        const total = sources.reduce((sum, source) => sum + (Number(source.bonus) || 0), 0);
        plannerDebugLog('Class hard attack summary', {
            level,
            toggles: { ...(state.classAttackToggles || {}) },
            ruleEvaluations,
            sources,
            cappedSources,
            total,
            cappedAttackBonusFromClass,
            weaponBonusFloor,
            damageBonus,
            dodgeAcBonus
        });

        return {
            total,
            sources,
            cappedSources,
            cappedAttackBonusFromClass,
            weaponBonusFloor,
            damageBonus,
            damageSources,
            dodgeAcBonus,
            dodgeSources,
            ruleEvaluations
        };
    }

    function getFighterBabAtLevel(level) {
        const numericLevel = Math.max(1, Math.floor(Number(level) || 1));
        const fromClassData = getClassBabAtClassLevel('Fighter', numericLevel);
        return Number.isFinite(Number(fromClassData)) && Number(fromClassData) > 0
            ? Number(fromClassData)
            : numericLevel;
    }

    function getClassBabAtClassLevel(className, classLevel) {
        const resolved = getClassInfoByName(className);
        if (!resolved || !resolved.info) return 0;

        const progression = Array.isArray(resolved.info.levelProgression)
            ? resolved.info.levelProgression
            : [];
        if (progression.length === 0) return 0;

        const numericClassLevel = Math.max(1, Math.floor(Number(classLevel) || 1));
        const index = Math.max(0, Math.min(numericClassLevel - 1, progression.length - 1));
        const row = progression[index];
        return Array.isArray(row) ? (Number(row[0]) || 0) : 0;
    }

    function getBuffDefinitionByName(buffName) {
        const normalizedName = String(buffName || '').trim().toLowerCase();
        if (!normalizedName) return null;
        return BUFF_DEFINITIONS.find(def => String(def && def.name || '').trim().toLowerCase() === normalizedName) || null;
    }

    function resolveDerivedBuffEffectValue(rule, context) {
        const rawSource = String(rule && rule.valueSource || 'constant').trim();
        const source = rawSource.toLowerCase();
        const effectType = String(rule && rule.effectType || '').trim().toLowerCase();
        const baseValue = Number(rule && rule.value) || 0;
        const level = Number(context && context.level) || 1;
        const casterLevel = Number(context && context.casterLevel) || 1;
        const fighterSourceAliases = new Set([
            'fighterbabatlevel',
            'fighterbabatlvl',
            'fighterbab',
            'fighterbaboverride'
        ]);

        let resolved = baseValue;
        if (source === 'casterlevel') {
            resolved = casterLevel;
        } else if (fighterSourceAliases.has(source)) {
            resolved = getFighterBabAtLevel(level);
        } else if (effectType === 'setbaboverride') {
            const requestedClass = (!rawSource || source === 'constant' || source === 'casterlevel' || fighterSourceAliases.has(source))
                ? 'Fighter'
                : rawSource;
            const classLevelFromCaster = Math.max(1, Math.floor(casterLevel));
            const requestedBab = getClassBabAtClassLevel(requestedClass, classLevelFromCaster);
            resolved = Number.isFinite(Number(requestedBab)) && Number(requestedBab) > 0
                ? Number(requestedBab)
                : getFighterBabAtLevel(classLevelFromCaster);
        }

        const hasMinValue = rule
            && rule.minValue !== null
            && rule.minValue !== undefined
            && String(rule.minValue).trim() !== ''
            && Number.isFinite(Number(rule.minValue));
        const hasMaxValue = rule
            && rule.maxValue !== null
            && rule.maxValue !== undefined
            && String(rule.maxValue).trim() !== ''
            && Number.isFinite(Number(rule.maxValue));

        if (hasMinValue) {
            resolved = Math.max(Number(rule.minValue), resolved);
        }
        if (hasMaxValue) {
            resolved = Math.min(Number(rule.maxValue), resolved);
        }

        return resolved;
    }

    function applyDerivedBuffEffectsToComputedOut(buffDef, out, context) {
        const rules = Array.isArray(buffDef && buffDef.derivedEffects) ? buffDef.derivedEffects : [];
        if (!rules.length || !out || typeof out !== 'object') return;

        rules.forEach(rule => {
            const value = resolveDerivedBuffEffectValue(rule, context);
            const effectType = String(rule && rule.effectType || '').trim().toLowerCase();
            const effectTarget = String(rule && rule.target || '').trim().toLowerCase();
            const detailSuffix = String(rule && rule.label || '').trim();
            const detailLabel = detailSuffix ? `${buffDef.label} (${detailSuffix})` : buffDef.label;

            if (effectType === 'addhitpoints') {
                out.hpBonus += value;
                out.detail.hp.push({ label: detailLabel, value });
                return;
            }

            if (effectType === 'setabilityminimum' && effectTarget === 'str') {
                out.strOverrideMin = Number.isFinite(Number(out.strOverrideMin))
                    ? Math.max(Number(out.strOverrideMin), value)
                    : value;
                out.detail.strFloor.push({ label: detailLabel, value });
                return;
            }

            if (effectType === 'setbaboverride') {
                out.overrideBab = value;
                out.detail.bab.push({ label: detailLabel, value });
            }
        });
    }

    function appendDerivedBuffEffectsToActiveBuffList(output, buffDef, context) {
        const rules = Array.isArray(buffDef && buffDef.derivedEffects) ? buffDef.derivedEffects : [];
        if (!rules.length || !Array.isArray(output)) return;

        rules.forEach((rule, ruleIndex) => {
            const value = resolveDerivedBuffEffectValue(rule, context);
            const modifies = derivedEffectTypeToLegacyModifiers(rule && rule.effectType, rule && rule.target);
            if (!modifies.length) return;
            const labelSuffix = String(rule && rule.label || '').trim();
            output.push({
                name: `${buffDef.name}_derived_${String(rule && rule.id || ruleIndex + 1).trim().toLowerCase()}`,
                label: labelSuffix ? `${buffDef.label} (${labelSuffix})` : `${buffDef.label} (Derived)`,
                modifies,
                mode: String(rule && rule.mode || 'flat').trim().toLowerCase() || 'flat',
                value
            });
        });
    }

    function applyStandardBuffModifiersToComputedOut(out, def, value) {
        const modifiers = Array.isArray(def && def.modifies) ? def.modifies : [];
        const label = String(def && def.label || def && def.name || 'Buff').trim() || 'Buff';
        const numericValue = Number(value) || 0;
        if (!modifiers.length || numericValue === 0) return;

        modifiers.forEach(modifier => {
            const key = String(modifier || '').trim().toLowerCase();
            if (!key) return;

            if (key === 'attackbonus') {
                out.cappedAttackBonusFromBuffs += numericValue;
                out.detail.attack.push({ label, value: numericValue });
                return;
            }

            if (key === 'damagebonus') {
                out.damageBonus += numericValue;
                out.detail.damage.push({ label, value: numericValue });
                return;
            }

            if (key === 'fortsave') {
                out.saveBonus.fort += numericValue;
                out.detail.saveFort.push({ label, value: numericValue });
                return;
            }

            if (key === 'refsave') {
                out.saveBonus.ref += numericValue;
                out.detail.saveRef.push({ label, value: numericValue });
                return;
            }

            if (key === 'willsave') {
                out.saveBonus.will += numericValue;
                out.detail.saveWill.push({ label, value: numericValue });
                return;
            }

            if (key === 'dodgeac') {
                out.dodgeAcBonus += numericValue;
                out.detail.dodgeAc.push({ label, value: numericValue });
                return;
            }

            if (key === 'armorac') {
                out.acBonuses.armor += numericValue;
                out.detail.acArmor.push({ label, value: numericValue });
                return;
            }

            if (key === 'shieldac') {
                out.acBonuses.shield += numericValue;
                out.detail.acShield.push({ label, value: numericValue });
                return;
            }

            if (key === 'naturalac') {
                out.acBonuses.natural += numericValue;
                out.detail.acNatural.push({ label, value: numericValue });
                return;
            }

            if (key === 'deflectionac') {
                out.acBonuses.deflection += numericValue;
                out.detail.acDeflection.push({ label, value: numericValue });
                return;
            }

            if (key === 'otherac') {
                out.acBonuses.other += numericValue;
                out.detail.acOther.push({ label, value: numericValue });
                return;
            }

            if (key === 'extraapr') {
                out.extraHighestAbAttacks += numericValue;
                out.detail.attack.push({ label: `${label} (extra APR at highest AB)`, value: 0 });
                return;
            }

            if (key === 'weaponbonusfloor') {
                out.weaponBonusFloor = Math.max(out.weaponBonusFloor, numericValue);
                out.detail.attack.push({ label: `${label} (weapon minimum)`, value: 0 });
                return;
            }

            if (key === 'uncappedattackbonus') {
                out.uncappedAttackBonus += numericValue;
                out.detail.attack.push({ label: `${label} (uncapped)`, value: numericValue });
            }
        });
    }

    function computeBuffEffects(level, effects) {
        const featSet = getOwnedFeatNameSetAtLevel(level);
        const acValueModifierKeys = new Set(['armorac', 'shieldac', 'naturalac', 'deflectionac', 'dodgeac', 'otherac']);
        const out = {
            cappedAttackBonusFromBuffs: 0,
            uncappedAttackBonus: 0,
            weaponBonusFloor: 0,
            extraHighestAbAttacks: 0,
            damageBonus: 0,
            saveBonus: { fort: 0, ref: 0, will: 0 },
            dodgeAcBonus: 0,
            acBonuses: { armor: 0, shield: 0, natural: 0, deflection: 0, other: 0 },
            hpBonus: 0,
            overrideBab: null,
            strOverrideMin: null,
            notes: [],
            detail: {
                attack: [],
                damage: [],
                saveFort: [],
                saveRef: [],
                saveWill: [],
                dodgeAc: [],
                acArmor: [],
                acShield: [],
                acNatural: [],
                acDeflection: [],
                acOther: [],
                hp: [],
                bab: [],
                strFloor: []
            }
        };

        const getResolvedEnabledBuffNameSet = () => {
            const activeDefs = BUFF_DEFINITIONS.filter(def => {
                if (!def || !def.name) return false;
                const config = state.buffs && state.buffs[def.name];
                if (!config || !config.enabled) return false;
                if (def.requiresFeat && !featSet.has(String(def.requiresFeat).toLowerCase())) return false;
                return true;
            });

            const byName = new Map(
                activeDefs.map(def => [String(def.name || '').trim().toLowerCase(), def])
            );
            const allAdjacency = buildBuffMutualExclusionAdjacency(BUFF_DEFINITIONS);
            const adjacency = new Map();
            byName.forEach((_, key) => {
                const fullNeighbors = allAdjacency.get(key) || new Set();
                const activeNeighbors = new Set(Array.from(fullNeighbors).filter(neighbor => byName.has(neighbor)));
                adjacency.set(key, activeNeighbors);
            });

            const visited = new Set();
            const winners = new Set();
            const pickWinner = (defs) => defs
                .slice()
                .sort((left, right) => {
                    const leftOrder = Number(left && left.uiOrder) || 0;
                    const rightOrder = Number(right && right.uiOrder) || 0;
                    if (leftOrder !== rightOrder) return rightOrder - leftOrder;
                    return String(left && left.name || '').localeCompare(String(right && right.name || ''));
                })[0];

            byName.forEach((def, startKey) => {
                if (visited.has(startKey)) return;
                const stack = [startKey];
                const component = [];

                while (stack.length > 0) {
                    const key = stack.pop();
                    if (visited.has(key)) continue;
                    visited.add(key);
                    const nodeDef = byName.get(key);
                    if (nodeDef) component.push(nodeDef);
                    const neighbors = adjacency.get(key);
                    if (neighbors) {
                        neighbors.forEach(neighbor => {
                            if (!visited.has(neighbor)) stack.push(neighbor);
                        });
                    }
                }

                const winner = pickWinner(component);
                if (winner && winner.name) winners.add(String(winner.name).trim().toLowerCase());
            });

            return winners;
        };

        const resolvedEnabledBuffNames = getResolvedEnabledBuffNameSet();
        const isEnabled = (name) => resolvedEnabledBuffNames.has(String(name || '').trim().toLowerCase());
        const casterLevelFor = (name) => {
            const def = BUFF_DEFINITIONS.find(entry => String(entry && entry.name || '').trim().toLowerCase() === String(name || '').trim().toLowerCase());
            const min = Math.max(1, Math.floor(Number(def && def.minCasterLevel) || 1));
            const max = Math.max(min, Math.floor(Number(def && def.maxCasterLevel) || 30));
            const raw = Number(state.buffs && state.buffs[name] ? state.buffs[name].casterLevel : max);
            return Math.max(min, Math.min(max, Math.floor(raw) || min));
        };

        ensureLazyProxyState();
        if (state.lazyProxy.enabled) {
            const lazyCappedAb = Number(state.lazyProxy.cappedAbBonus) || 0;
            const lazyUncappedAb = Number(state.lazyProxy.uncappedAbBonus) || 0;
            const lazyWeaponFloor = Number(state.lazyProxy.weaponBonusFloor) || 0;

            if (lazyCappedAb !== 0) {
                out.cappedAttackBonusFromBuffs += lazyCappedAb;
                out.detail.attack.push({ label: "I'm Lazy capped AB", value: lazyCappedAb });
            }

            if (lazyUncappedAb !== 0) {
                out.uncappedAttackBonus += lazyUncappedAb;
                out.detail.attack.push({ label: "I'm Lazy uncapped AB", value: lazyUncappedAb });
            }

            if (lazyWeaponFloor !== 0) {
                out.weaponBonusFloor = Math.max(out.weaponBonusFloor, lazyWeaponFloor);
                out.detail.attack.push({ label: "I'm Lazy weapon AB floor", value: 0 });
            }
        }

        BUFF_DEFINITIONS.forEach(def => {
            if (!def || !def.name || !isEnabled(def.name)) return;

            const name = String(def.name || '').trim().toLowerCase();
            if (name === 'blood_frenzy' || name === 'battletide' || name === 'war_cry') {
                return;
            }

            let appliedValue = Number(def.value) || 0;
            const modifies = Array.isArray(def.modifies)
                ? def.modifies.map(modifier => String(modifier || '').trim().toLowerCase()).filter(Boolean)
                : [];
            const hasDataDrivenAcValueModifier = modifies.some(modifier => acValueModifierKeys.has(modifier));
            if (name === 'divine_favor') {
                const cl = casterLevelFor('divine_favor');
                appliedValue = Math.max(1, Math.min(5, Math.floor(cl / 3) || 1));
            } else if (def.hasCasterLevel && hasDataDrivenAcValueModifier) {
                appliedValue = casterLevelFor(def.name);
            }

            applyStandardBuffModifiersToComputedOut(out, def, appliedValue);
        });

        BUFF_DEFINITIONS.forEach(def => {
            if (!def || !def.name || !isEnabled(def.name)) return;
            if (!Array.isArray(def.derivedEffects) || def.derivedEffects.length === 0) return;
            applyDerivedBuffEffectsToComputedOut(def, out, {
                level,
                casterLevel: casterLevelFor(def.name)
            });
        });

        if (isEnabled('blood_frenzy')) {
            const hasSf = featSet.has('spell focus: transmutation');
            const hasGsf = featSet.has('greater spell focus: transmutation');
            const hasEsf = featSet.has('epic spell focus: transmutation');

            let ab = 2;
            let dmg = 2;
            let will = 2;

            if (hasSf || hasGsf || hasEsf) {
                will = 3;
            }
            if (hasGsf || hasEsf) {
                dmg = 3;
            }
            if (hasEsf) {
                ab = 3;
            }

            out.cappedAttackBonusFromBuffs += ab;
            out.damageBonus += dmg;
            out.saveBonus.will += will;
            out.saveBonus.ref -= 3;
            out.dodgeAcBonus -= 2;
            out.detail.attack.push({ label: 'Blood Frenzy', value: ab });
            out.detail.damage.push({ label: 'Blood Frenzy', value: dmg });
            out.detail.saveWill.push({ label: 'Blood Frenzy', value: will });
            out.detail.saveRef.push({ label: 'Blood Frenzy', value: -3 });
            out.detail.dodgeAc.push({ label: 'Blood Frenzy', value: -2 });
        }

        const battletideOn = isEnabled('battletide');
        const warCryOn = isEnabled('war_cry');
        const stackProtectedAb = (battletideOn || warCryOn) ? 2 : 0;
        const stackProtectedDamage = (battletideOn || warCryOn) ? 2 : 0;
        out.cappedAttackBonusFromBuffs += stackProtectedAb;
        out.damageBonus += stackProtectedDamage;
        if (stackProtectedAb !== 0) {
            out.detail.attack.push({ label: battletideOn ? 'Battletide' : 'War Cry', value: stackProtectedAb });
        }
        if (stackProtectedDamage !== 0) {
            out.detail.damage.push({ label: battletideOn ? 'Battletide' : 'War Cry', value: stackProtectedDamage });
        }
        if (battletideOn) {
            out.saveBonus.fort += 2;
            out.saveBonus.ref += 2;
            out.saveBonus.will += 2;
            out.detail.saveFort.push({ label: 'Battletide', value: 2 });
            out.detail.saveRef.push({ label: 'Battletide', value: 2 });
            out.detail.saveWill.push({ label: 'Battletide', value: 2 });
        }

        return out;
    }

    function getActiveBuffObjects(level, effects) {
        const featSet = getOwnedFeatNameSetAtLevel(level);
        const acValueModifierKeys = new Set(['armorac', 'shieldac', 'naturalac', 'deflectionac', 'dodgeac', 'otherac']);
        const output = [];
        const activeDefs = BUFF_DEFINITIONS.filter(def => {
            if (!def || !def.name) return false;
            const config = state.buffs && state.buffs[def.name];
            if (!config || !config.enabled) return false;
            if (def.requiresFeat && !featSet.has(String(def.requiresFeat).toLowerCase())) return false;
            return true;
        });

        const byName = new Map(activeDefs.map(def => [String(def.name || '').trim().toLowerCase(), def]));
        const allAdjacency = buildBuffMutualExclusionAdjacency(BUFF_DEFINITIONS);
        const adjacency = new Map();
        byName.forEach((_, key) => {
            const fullNeighbors = allAdjacency.get(key) || new Set();
            const activeNeighbors = new Set(Array.from(fullNeighbors).filter(neighbor => byName.has(neighbor)));
            adjacency.set(key, activeNeighbors);
        });

        const resolvedEnabledBuffNames = new Set();
        const visited = new Set();
        byName.forEach((_, startKey) => {
            if (visited.has(startKey)) return;
            const stack = [startKey];
            const component = [];
            while (stack.length > 0) {
                const key = stack.pop();
                if (visited.has(key)) continue;
                visited.add(key);
                const node = byName.get(key);
                if (node) component.push(node);
                const neighbors = adjacency.get(key);
                if (neighbors) {
                    neighbors.forEach(neighbor => {
                        if (!visited.has(neighbor)) stack.push(neighbor);
                    });
                }
            }

            const winner = component
                .slice()
                .sort((left, right) => {
                    const leftOrder = Number(left && left.uiOrder) || 0;
                    const rightOrder = Number(right && right.uiOrder) || 0;
                    if (leftOrder !== rightOrder) return rightOrder - leftOrder;
                    return String(left && left.name || '').localeCompare(String(right && right.name || ''));
                })[0];

            if (winner && winner.name) {
                resolvedEnabledBuffNames.add(String(winner.name).trim().toLowerCase());
            }
        });

        BUFF_DEFINITIONS.forEach(def => {
            const config = state.buffs && state.buffs[def.name];
            if (!config || !config.enabled) return;
            if (!resolvedEnabledBuffNames.has(String(def.name || '').trim().toLowerCase())) return;
            if (def.requiresFeat && !featSet.has(String(def.requiresFeat).toLowerCase())) return;

            let value = Number(def.value) || 0;
            const modifies = Array.isArray(def.modifies)
                ? def.modifies.map(modifier => String(modifier || '').trim().toLowerCase()).filter(Boolean)
                : [];
            const hasDataDrivenAcValueModifier = modifies.some(modifier => acValueModifierKeys.has(modifier));

            if (def.name === 'divine_favor') {
                const cl = Math.max(1, Math.floor(Number(config.casterLevel) || 1));
                value = Math.max(1, Math.min(5, Math.floor(cl / 3) || 1));
            } else if (def.hasCasterLevel && hasDataDrivenAcValueModifier) {
                const min = Math.max(1, Math.floor(Number(def.minCasterLevel) || 1));
                const max = Math.max(min, Math.floor(Number(def.maxCasterLevel) || 30));
                value = Math.max(min, Math.min(max, Math.floor(Number(config.casterLevel) || min)));
            } else if (def.name === 'blood_frenzy') {
                const hasSf = featSet.has('spell focus: transmutation');
                const hasGsf = featSet.has('greater spell focus: transmutation');
                const hasEsf = featSet.has('epic spell focus: transmutation');
                value = hasEsf ? 3 : 2;
                output.push({ name: `${def.name}_damage`, label: `${def.label} (Damage)`, modifies: ['damageBonus'], mode: 'flat', value: hasGsf || hasEsf ? 3 : 2 });
                output.push({ name: `${def.name}_will`, label: `${def.label} (Will)`, modifies: ['willSave'], mode: 'flat', value: (hasSf || hasGsf || hasEsf) ? 3 : 2 });
                output.push({ name: `${def.name}_ref`, label: `${def.label} (Ref)`, modifies: ['refSave'], mode: 'flat', value: -3 });
                output.push({ name: `${def.name}_ac`, label: `${def.label} (Dodge AC)`, modifies: ['dodgeAc'], mode: 'flat', value: -2 });
            }

            appendDerivedBuffEffectsToActiveBuffList(output, def, {
                level,
                casterLevel: Math.max(1, Math.floor(Number(config.casterLevel) || 1))
            });

            output.push({
                name: def.name,
                label: def.label,
                modifies: Array.isArray(def.modifies) ? def.modifies : [],
                mode: def.mode || 'flat',
                value
            });
        });

        if (state.buffs && state.buffs.battletide && state.buffs.battletide.enabled) {
            output.push({ name: 'battletide_saves', label: 'Battletide (Saves)', modifies: ['fortSave', 'refSave', 'willSave'], mode: 'flat', value: 2 });
        }

        return output;
    }

    function getSongEntryFromState() {
        const bardTable = state.songData && state.songData.bardSongTable;
        if (!bardTable || !bardTable.songsByName) return null;
        const key = normalizeSongNameKey(state.song && state.song.name);
        return bardTable.songsByName[key] || null;
    }

    function parseSongSkillTargets(effectLabel) {
        const normalized = normalizeSongNameKey(effectLabel);
        if (SONG_SKILL_LABEL_ALIASES[normalized]) return SONG_SKILL_LABEL_ALIASES[normalized];
        if (SONG_LABEL_GROUPS.allSkillsLabels.has(normalized)) return ['*all*'];

        if (SONG_LABEL_GROUPS.singleSkillLabels.has(normalized)) {
            return [normalized];
        }

        return [];
    }

    function getSongTargetToggleState(targetKey) {
        if (!targetKey) return false;
        const targeting = state.targeting || {};
        const alignment = String(targeting.alignment || 'any').toLowerCase();
        const selectedTargetRace = String(targeting.race || '');

        if (targetKey === 'evil') {
            return alignment.length === 2 && alignment.endsWith('e');
        }
        if (targetKey === 'lawful') {
            return alignment.length === 2 && alignment.startsWith('l');
        }

        return selectedTargetRace === targetKey;
    }

    function getBattleTrainingAttackBonus(level) {
        const featSet = getOwnedFeatNameSetAtLevel(level);
        if (!featSet || featSet.size === 0) return 0;

        const targetRace = state.targeting && state.targeting.race ? state.targeting.race : '';
        const tags = getTargetRaceTags(targetRace);
        if (tags.size === 0) return 0;

        let bonus = 0;
        if (tags.has('giant') && featSet.has('battle training vs. giants')) bonus += 2;
        if (tags.has('goblinoid') && (featSet.has('battle training vs. goblinoids') || featSet.has('battle training vs. goblins'))) bonus += 1;
        if (tags.has('orc') && featSet.has('battle training vs. orcs')) bonus += 1;
        return bonus;
    }

    function resolveSongConditionalTarget(effectLabel) {
        const key = normalizeSongNameKey(effectLabel);
        return SONG_CONDITIONAL_TARGET_MAP[key] || '';
    }

    function getActiveSongEffects(level) {
        const empty = {
            attackBonus: 0,
            damageBonus: 0,
            dodgeAcBonus: 0,
            concealment: 0,
            saveBonus: { fort: 0, ref: 0, will: 0 },
            skillBonuses: new Map(),
            statBonuses: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
            elementalImmunity: { fire: 0, acid: 0, cold: 0, electrical: 0 },
            featDetails: [],
            unmapped: [],
            summary: [],
            detail: {
                attack: [],
                damage: [],
                saveFort: [],
                saveRef: [],
                saveWill: [],
                dodgeAc: [],
                skills: []
            }
        };

        if (!state.song || !state.song.enabled) return empty;
        const songEntry = getSongEntryFromState();
        if (!songEntry || !songEntry.effects) return empty;

        const songLevel = Math.max(1, Math.min(30, Math.floor(Number(state.song.level) || 30)));
        const featSet = getOwnedFeatNameSetAtLevel(level);
        const canUseSoth = Boolean(state.song.useSoth)
            && songLevel === 30
            && featSet.has('song of the heart');

        Object.values(songEntry.effects).forEach(effect => {
            if (!effect || !effect.valuesByLevel) return;
            const baseValue = effect.valuesByLevel[String(songLevel)];
            if (baseValue === undefined) return;
            const numeric = parseSongNumeric(baseValue);
            const sothNumeric = canUseSoth ? parseSongNumeric(effect.sothBonus) : null;
            const totalNumeric = numeric === null
                ? null
                : numeric + (Number.isFinite(sothNumeric) ? sothNumeric : 0);

            const labelKey = normalizeSongNameKey(effect.label);

            const conditionalTarget = resolveSongConditionalTarget(effect.label);
            const isConditionalAttack = SONG_TOKEN_GROUPS.conditionalAttackPrefixes.some(prefix => labelKey.startsWith(prefix));
            const isConditionalAc = SONG_TOKEN_GROUPS.conditionalAcPrefixes.some(prefix => labelKey.startsWith(prefix));
            const isConditionalDodge = SONG_TOKEN_GROUPS.conditionalDodgePrefixes.some(prefix => labelKey.startsWith(prefix));
            if (isConditionalAttack || isConditionalAc || isConditionalDodge) {
                const enabled = getSongTargetToggleState(conditionalTarget);
                if (enabled && Number.isFinite(totalNumeric)) {
                    if (isConditionalAttack) {
                        empty.attackBonus += totalNumeric;
                        empty.detail.attack.push({ label: effect.label, value: totalNumeric });
                    } else {
                        empty.dodgeAcBonus += totalNumeric;
                        empty.detail.dodgeAc.push({ label: effect.label, value: totalNumeric });
                    }
                }
                return;
            }

            if (labelKey === 'ab') {
                if (Number.isFinite(totalNumeric)) empty.attackBonus += totalNumeric;
                if (Number.isFinite(totalNumeric)) empty.detail.attack.push({ label: effect.label, value: totalNumeric });
                empty.summary.push(`AB ${baseValue}${canUseSoth && effect.sothBonus ? ` (${effect.sothBonus} SOTH)` : ''}`);
                return;
            }

            if (SONG_LABEL_GROUPS.directDamageLabels.has(labelKey)) {
                if (Number.isFinite(totalNumeric)) empty.damageBonus += totalNumeric;
                if (Number.isFinite(totalNumeric)) empty.detail.damage.push({ label: effect.label, value: totalNumeric });
                return;
            }

            const matchesDamageInclude = SONG_TOKEN_GROUPS.directDamageIncludeTokens.some(token => labelKey.includes(token));
            const matchesDamageExclude = SONG_TOKEN_GROUPS.directDamageExcludeTokens.some(token => labelKey.includes(token));
            if (matchesDamageInclude && !matchesDamageExclude) {
                if (Number.isFinite(totalNumeric)) empty.damageBonus += totalNumeric;
                if (Number.isFinite(totalNumeric)) empty.detail.damage.push({ label: effect.label, value: totalNumeric });
                return;
            }

            if (SONG_LABEL_GROUPS.universalSaveLabels.has(labelKey)) {
                if (Number.isFinite(totalNumeric)) {
                    empty.saveBonus.fort += totalNumeric;
                    empty.saveBonus.ref += totalNumeric;
                    empty.saveBonus.will += totalNumeric;
                    empty.detail.saveFort.push({ label: effect.label, value: totalNumeric });
                    empty.detail.saveRef.push({ label: effect.label, value: totalNumeric });
                    empty.detail.saveWill.push({ label: effect.label, value: totalNumeric });
                }
                return;
            }

            if (labelKey === 'fortitude') {
                if (Number.isFinite(totalNumeric)) empty.saveBonus.fort += totalNumeric;
                if (Number.isFinite(totalNumeric)) empty.detail.saveFort.push({ label: effect.label, value: totalNumeric });
                return;
            }

            if (SONG_LABEL_GROUPS.multiSaveLabels.has(labelKey)) {
                if (Number.isFinite(totalNumeric)) {
                    empty.saveBonus.fort += totalNumeric;
                    empty.saveBonus.ref += totalNumeric;
                    empty.saveBonus.will += totalNumeric;
                    empty.detail.saveFort.push({ label: effect.label, value: totalNumeric });
                    empty.detail.saveRef.push({ label: effect.label, value: totalNumeric });
                    empty.detail.saveWill.push({ label: effect.label, value: totalNumeric });
                }
                return;
            }

            if (SONG_LABEL_GROUPS.dodgeLabels.has(labelKey)) {
                if (Number.isFinite(totalNumeric)) empty.dodgeAcBonus += totalNumeric;
                if (Number.isFinite(totalNumeric)) empty.detail.dodgeAc.push({ label: effect.label, value: totalNumeric });
                return;
            }

            if (labelKey === 'concealment') {
                if (Number.isFinite(totalNumeric)) empty.concealment += totalNumeric;
                return;
            }

            if (labelKey === 'imm fire acid cold elec') {
                if (Number.isFinite(totalNumeric)) {
                    empty.elementalImmunity.fire += totalNumeric;
                    empty.elementalImmunity.acid += totalNumeric;
                    empty.elementalImmunity.cold += totalNumeric;
                    empty.elementalImmunity.electrical += totalNumeric;
                }
                return;
            }

            const skillTargets = parseSongSkillTargets(effect.label);
            if (skillTargets.length > 0 && Number.isFinite(totalNumeric)) {
                skillTargets.forEach(skillName => {
                    if (skillName === '*all*') {
                        try {
                            if (Array.isArray(SKILL_LIST)) {
                                SKILL_LIST.forEach(skill => {
                                    const normalized = typeof normalizeSkillKey === 'function'
                                        ? normalizeSkillKey(skill)
                                        : String(skill || '').toLowerCase();
                                    if (!normalized) return;
                                    empty.skillBonuses.set(normalized, (empty.skillBonuses.get(normalized) || 0) + totalNumeric);
                                    empty.detail.skills.push({ label: `${effect.label} (${normalized})`, value: totalNumeric });
                                });
                            }
                        } catch {
                            // no-op
                        }
                        return;
                    }

                    const normalized = typeof normalizeSkillKey === 'function'
                        ? normalizeSkillKey(skillName)
                        : String(skillName || '').toLowerCase();
                    if (!normalized) return;
                    empty.skillBonuses.set(normalized, (empty.skillBonuses.get(normalized) || 0) + totalNumeric);
                    empty.detail.skills.push({ label: `${effect.label} (${normalized})`, value: totalNumeric });
                });
                return;
            }

            const shouldIgnoreUnmapped = SONG_TOKEN_GROUPS.unmappedIgnoreTokens.some(token => labelKey.includes(token));
            if (!shouldIgnoreUnmapped) {
                empty.unmapped.push(`${effect.label}: ${baseValue}${canUseSoth && effect.sothBonus ? ` (+ ${effect.sothBonus} SOTH)` : ''}`);
            }
        });

        return empty;
    }

    function getCappedAttackBonusComponents(base, effects, level, classHardAttack = null) {
        const buffEffects = computeBuffEffects(level, effects);
        const classWeaponFloor = Number(classHardAttack && classHardAttack.weaponBonusFloor) || 0;
        const classCappedAttackBonus = Number(classHardAttack && classHardAttack.cappedAttackBonusFromClass) || 0;
        const weaponBonus = Math.max(
            Number(effects && effects.enhancementAttackBonus) || 0,
            Number(effects && effects.directAttackBonus) || 0,
            Number(buffEffects.weaponBonusFloor) || 0,
            classWeaponFloor
        );
        const uncappedTotal = weaponBonus + (Number(buffEffects.cappedAttackBonusFromBuffs) || 0) + classCappedAttackBonus;
        return {
            weaponBonus,
            buffCappedBonus: Number(buffEffects.cappedAttackBonusFromBuffs) || 0,
            classCappedBonus: classCappedAttackBonus,
            cappedBonus: Math.min(20, Math.max(0, uncappedTotal)),
            uncappedTotal,
            buffEffects
        };
    }

    function renderBuffsEditor() {
        if (!rootEls || !rootEls.buffList) return;

        ensureLazyProxyState();
        ensureSkillAcState();
        state.ui.buffGroupDrawerOpen = state.ui && state.ui.buffGroupDrawerOpen && typeof state.ui.buffGroupDrawerOpen === 'object'
            ? state.ui.buffGroupDrawerOpen
            : {};

        const base = getBaseDerivedSummary();
        const summaryLevel = Math.max(1, Math.floor(Number(base && base.level) || 1));
        const featSet = getOwnedFeatNameSetAtLevel(summaryLevel);
        const acValueModifierKeys = new Set(['armorac', 'shieldac', 'naturalac', 'deflectionac', 'dodgeac', 'otherac']);
        const lockState = getBuffUiLockState(featSet);
        const exclusionAdjacency = lockState.adjacency;
        const lockedBy = lockState.lockedBy;

        rootEls.buffList.innerHTML = '';

        const renderBuffRow = (def, targetContainer) => {
            const row = document.createElement('div');
            row.className = 'gear-field-row';
            const normalizedName = String(def && def.name || '').trim().toLowerCase();
            const lockSources = Array.isArray(lockedBy.get(normalizedName)) ? lockedBy.get(normalizedName) : [];
            const currentlyEnabled = Boolean(state.buffs[def.name] && state.buffs[def.name].enabled);
            const isLocked = lockSources.length > 0;

            const toggle = document.createElement('input');
            toggle.type = 'checkbox';
            toggle.checked = currentlyEnabled;
            toggle.disabled = isLocked && !currentlyEnabled;
            if (toggle.disabled) {
                toggle.title = `Disabled by: ${lockSources.join(', ')}`;
            }
            toggle.addEventListener('change', () => {
                state.buffs[def.name].enabled = Boolean(toggle.checked);
                if (toggle.checked) {
                    const conflicts = exclusionAdjacency.get(normalizedName) || new Set();
                    conflicts.forEach(conflictName => {
                        if (state.buffs && state.buffs[conflictName]) {
                            state.buffs[conflictName].enabled = false;
                        }
                    });
                }
                renderBuffsEditor();
                scheduleGearRefreshAndValidation();
            });

            const label = document.createElement('label');
            label.style.minWidth = '220px';
            label.style.fontWeight = 'bold';
            label.textContent = def.label;

            row.appendChild(toggle);
            row.appendChild(label);

            if (def.hasCasterLevel) {
                const clWrap = document.createElement('span');
                clWrap.style.display = 'inline-flex';
                clWrap.style.alignItems = 'center';
                clWrap.style.gap = '6px';

                const clLabel = document.createElement('label');
                const modifies = Array.isArray(def.modifies)
                    ? def.modifies.map(modifier => String(modifier || '').trim().toLowerCase()).filter(Boolean)
                    : [];
                const usesAcValueSelector = modifies.some(modifier => acValueModifierKeys.has(modifier));
                clLabel.textContent = usesAcValueSelector ? 'Value' : 'Caster Lvl';

                const clInput = document.createElement('input');
                clInput.type = 'number';
                clInput.min = String(def.minCasterLevel || 1);
                clInput.max = String(def.maxCasterLevel || 30);
                clInput.step = '1';
                clInput.style.width = '86px';
                clInput.style.flex = '0 0 86px';
                clInput.disabled = toggle.disabled;
                const min = Number(def.minCasterLevel || 1);
                const max = Number(def.maxCasterLevel || 30);
                const initial = Math.max(min, Math.min(max, Math.floor(Number(state.buffs[def.name].casterLevel) || min)));
                state.buffs[def.name].casterLevel = initial;
                clInput.value = String(initial);
                clInput.addEventListener('input', () => {
                    const parsed = Math.max(min, Math.min(max, Math.floor(Number(clInput.value) || min)));
                    state.buffs[def.name].casterLevel = parsed;
                    clInput.value = String(parsed);
                    scheduleGearRefreshAndValidation();
                });

                clWrap.appendChild(clLabel);
                clWrap.appendChild(clInput);
                row.appendChild(clWrap);
            }

            if (def.hasSecondCast) {
                const secondCastLabel = document.createElement('label');
                secondCastLabel.textContent = '2nd Cast';
                secondCastLabel.style.minWidth = '70px';

                const secondCastToggle = document.createElement('input');
                secondCastToggle.type = 'checkbox';
                secondCastToggle.checked = Boolean(state.buffs[def.name].secondCast);
                secondCastToggle.disabled = toggle.disabled;
                secondCastToggle.addEventListener('change', () => {
                    state.buffs[def.name].secondCast = Boolean(secondCastToggle.checked);
                    scheduleGearRefreshAndValidation();
                });

                row.appendChild(secondCastLabel);
                row.appendChild(secondCastToggle);
            }

            if (toggle.disabled) {
                const lockNote = document.createElement('span');
                lockNote.className = 'muted-note';
                lockNote.textContent = `Locked by ${lockSources.join(', ')}`;
                row.appendChild(lockNote);
            }

            targetContainer.appendChild(row);
        };

        const buffsByGroup = new Map();
        BUFF_GROUP_DEFINITIONS.forEach(group => {
            buffsByGroup.set(String(group && group.id || '').trim().toLowerCase(), []);
        });

        BUFF_DEFINITIONS.forEach(def => {
            const groupId = String(def && def.groupId || '').trim().toLowerCase() || 'other';
            if (!buffsByGroup.has(groupId)) {
                buffsByGroup.set(groupId, []);
                BUFF_GROUP_DEFINITIONS.push({
                    id: groupId,
                    name: groupId,
                    label: groupId,
                    color: '',
                    uiOrder: 9999,
                    notes: null
                });
            }
            buffsByGroup.get(groupId).push(def);
        });

        BUFF_GROUP_DEFINITIONS
            .slice()
            .sort((left, right) => {
                const leftOrder = Number(left && left.uiOrder) || 0;
                const rightOrder = Number(right && right.uiOrder) || 0;
                if (leftOrder !== rightOrder) return leftOrder - rightOrder;
                return String(left && left.label || '').localeCompare(String(right && right.label || ''));
            })
            .forEach(group => {
                const groupId = String(group && group.id || '').trim().toLowerCase();
                const groupBuffs = buffsByGroup.get(groupId) || [];
                if (!groupBuffs.length) return;

                const isOpen = Object.prototype.hasOwnProperty.call(state.ui.buffGroupDrawerOpen, groupId)
                    ? Boolean(state.ui.buffGroupDrawerOpen[groupId])
                    : true;

                const drawer = document.createElement('div');
                drawer.className = `gear-drawer ${isOpen ? 'open' : ''}`;

                const header = document.createElement('button');
                header.type = 'button';
                header.className = 'gear-drawer-header';
                header.textContent = group.label || group.name || groupId;
                if (group.color) {
                    header.style.borderLeft = `4px solid ${group.color}`;
                }

                const body = document.createElement('div');
                body.className = 'gear-drawer-body';

                if (groupId === 'zoo_spells') {
                    const zooSoftBuff = getBuffSoftStatBonuses(summaryLevel);
                    const perCastBonus = Number(zooSoftBuff.baseBonus) || 4;
                    const transmutationSummary = document.createElement('div');
                    transmutationSummary.className = 'muted-note';
                    transmutationSummary.textContent = [
                        `Transmutation scaling at L${summaryLevel}: per cast +${perCastBonus}`,
                        `Greater Spell Focus: Transmutation ${zooSoftBuff.hasGsfTransmutation ? 'active (+1 tier)' : 'inactive'}`,
                        `Epic Spell Focus: Transmutation ${zooSoftBuff.hasEsfTransmutation ? 'active (+2 tier)' : 'inactive'}`,
                        'Second Cast toggle: +1 additional bonus'
                    ].join(' | ');
                    body.appendChild(transmutationSummary);
                }

                groupBuffs.forEach(def => renderBuffRow(def, body));

                drawer.appendChild(header);
                drawer.appendChild(body);
                rootEls.buffList.appendChild(drawer);

                attachDrawerHeaderToggle(header, drawer, (nextOpen) => {
                    state.ui.buffGroupDrawerOpen[groupId] = nextOpen;
                });
            });

        const skillAcGroupId = 'skill_ac_group';
        const skillAcBonuses = getSkillAcBonusesAtLevel30(base);
        const skillAcOpen = Object.prototype.hasOwnProperty.call(state.ui.buffGroupDrawerOpen, skillAcGroupId)
            ? Boolean(state.ui.buffGroupDrawerOpen[skillAcGroupId])
            : true;

        const skillDrawer = document.createElement('div');
        skillDrawer.className = `gear-drawer ${skillAcOpen ? 'open' : ''}`;

        const skillHeader = document.createElement('button');
        skillHeader.type = 'button';
        skillHeader.className = 'gear-drawer-header';
        skillHeader.textContent = 'Skill AC (L30 Hard Ranks)';

        const skillBody = document.createElement('div');
        skillBody.className = 'gear-drawer-body';

        const addSkillToggleRow = (key, labelText, mutuallyExclusiveKey = null) => {
            const row = document.createElement('div');
            row.className = 'gear-field-row';

            const toggle = document.createElement('input');
            toggle.type = 'checkbox';
            toggle.checked = Boolean(state.skillAc[key]);
            toggle.addEventListener('change', () => {
                const nextValue = Boolean(toggle.checked);
                state.skillAc[key] = nextValue;
                if (nextValue && mutuallyExclusiveKey) {
                    state.skillAc[mutuallyExclusiveKey] = false;
                }
                renderBuffsEditor();
                scheduleGearRefreshAndValidation();
            });

            const label = document.createElement('label');
            label.style.minWidth = '220px';
            label.style.fontWeight = 'bold';
            label.textContent = labelText;

            row.appendChild(toggle);
            row.appendChild(label);
            skillBody.appendChild(row);
        };

        addSkillToggleRow('tumbleEnabled', 'Enable Tumble AC', 'rideEnabled');
        addSkillToggleRow('rideEnabled', 'Enable Ride AC', 'tumbleEnabled');
        addSkillToggleRow('parryEnabled', 'Enable Parry AC');

        const lines = [
            `Hard ranks @ L30 — Tumble ${skillAcBonuses.hardRanks.tumble}, Ride ${skillAcBonuses.hardRanks.ride}, Parry ${skillAcBonuses.hardRanks.parry}`,
            `Tumble → Other AC: +${skillAcBonuses.tumble.bonus} (enabled ${skillAcBonuses.toggles.tumbleEnabled ? 'yes' : 'no'}; formula ⌊${skillAcBonuses.hardRanks.tumble}/5⌋; excluded when flat-footed)`,
            `Ride → Dodge AC: +${skillAcBonuses.ride.bonus} (enabled ${skillAcBonuses.toggles.rideEnabled ? 'yes' : 'no'}; formula ⌊(${skillAcBonuses.hardRanks.ride} + Cavalier ${skillAcBonuses.ride.cavalierLevel})/7⌋, cap +4)`
        ];

        if (!skillAcBonuses.ride.validation.passed && skillAcBonuses.ride.validation.failedBy) {
            lines.push(`Ride validation: failed (${skillAcBonuses.ride.validation.failedBy})`);
        } else {
            lines.push('Ride validation: passed');
        }

        const parryReq = skillAcBonuses.parry.requirements;
        lines.push(
            `Parry → Shield AC: +${skillAcBonuses.parry.bonus} (enabled ${skillAcBonuses.toggles.parryEnabled ? 'yes' : 'no'}; tier ${skillAcBonuses.parry.rankTier}, BAB cap ${skillAcBonuses.parry.babCap}; reqs: off-hand empty ${parryReq.offHandEmpty ? 'yes' : 'no'}, monk levels ${parryReq.noMonkLevels ? 'none' : 'present'}, weapon allowed ${parryReq.weaponAllowed ? 'yes' : 'no'})`
        );

        if (!skillAcBonuses.parry.validation.passed && Array.isArray(skillAcBonuses.parry.validation.failedBy) && skillAcBonuses.parry.validation.failedBy.length > 0) {
            lines.push(`Parry validation: failed (${skillAcBonuses.parry.validation.failedBy.join('; ')})`);
        } else {
            lines.push('Parry validation: passed');
        }

        lines.forEach(text => {
            const note = document.createElement('div');
            note.className = 'muted-note';
            note.textContent = text;
            skillBody.appendChild(note);
        });

        skillDrawer.appendChild(skillHeader);
        skillDrawer.appendChild(skillBody);
        rootEls.buffList.appendChild(skillDrawer);

        attachDrawerHeaderToggle(skillHeader, skillDrawer, (nextOpen) => {
            state.ui.buffGroupDrawerOpen[skillAcGroupId] = nextOpen;
        });

        const lazyContainer = document.createElement('div');
        lazyContainer.className = `gear-drawer ${state.ui.lazyDrawerOpen ? 'open' : ''}`;

        const lazyHeader = document.createElement('button');
        lazyHeader.type = 'button';
        lazyHeader.className = 'gear-drawer-header';
        lazyHeader.textContent = "I'm Lazy";

        const lazyBody = document.createElement('div');
        lazyBody.className = 'gear-drawer-body';

        const enabledRow = document.createElement('div');
        enabledRow.className = 'gear-field-row';
        const enabledLabel = document.createElement('label');
        enabledLabel.style.minWidth = '220px';
        enabledLabel.style.fontWeight = 'bold';
        enabledLabel.textContent = 'Enable quick proxy values';
        const enabledToggle = document.createElement('input');
        enabledToggle.type = 'checkbox';
        enabledToggle.checked = Boolean(state.lazyProxy.enabled);
        enabledToggle.addEventListener('change', () => {
            state.lazyProxy.enabled = Boolean(enabledToggle.checked);
            scheduleGearRefreshAndValidation();
        });
        enabledRow.appendChild(enabledToggle);
        enabledRow.appendChild(enabledLabel);
        lazyBody.appendChild(enabledRow);

        const addProxyNumberField = (labelText, key, min = -999, max = 999, step = 1) => {
            const row = document.createElement('div');
            row.className = 'gear-field-row';

            const label = document.createElement('label');
            label.style.minWidth = '220px';
            label.textContent = labelText;

            const input = document.createElement('input');
            input.type = 'number';
            input.min = String(min);
            input.max = String(max);
            input.step = String(step);
            input.style.width = '120px';
            input.value = String(Number(state.lazyProxy[key]) || 0);
            input.addEventListener('input', () => {
                const parsed = Number(input.value);
                state.lazyProxy[key] = Number.isFinite(parsed) ? parsed : 0;
                scheduleGearRefreshAndValidation();
            });

            row.appendChild(label);
            row.appendChild(input);
            lazyBody.appendChild(row);
        };

        addProxyNumberField('Capped AB proxy', 'cappedAbBonus');
        addProxyNumberField('Uncapped AB proxy', 'uncappedAbBonus');
        addProxyNumberField('Weapon AB minimum proxy', 'weaponBonusFloor', 0, 20);
        addProxyNumberField('Damage bonus proxy', 'damageBonus');

        const damageEntriesRow = document.createElement('div');
        damageEntriesRow.className = 'gear-field-row';
        damageEntriesRow.style.alignItems = 'flex-start';
        const damageEntriesLabel = document.createElement('label');
        damageEntriesLabel.style.minWidth = '220px';
        damageEntriesLabel.textContent = 'Damage entries (one per line)';
        const damageEntriesInput = document.createElement('textarea');
        damageEntriesInput.style.width = 'min(560px, 95%)';
        damageEntriesInput.style.minHeight = '92px';
        damageEntriesInput.placeholder = 'Examples:\nfire: 2d6\ndivine: 5\n3d4';
        damageEntriesInput.value = String(state.lazyProxy.damageEntries || '');
        damageEntriesInput.addEventListener('input', () => {
            state.lazyProxy.damageEntries = String(damageEntriesInput.value || '');
            scheduleGearRefreshAndValidation();
        });
        damageEntriesRow.appendChild(damageEntriesLabel);
        damageEntriesRow.appendChild(damageEntriesInput);
        lazyBody.appendChild(damageEntriesRow);

        const statHeader = document.createElement('div');
        statHeader.className = 'muted-note';
        statHeader.textContent = 'Stat proxies (soft): respects +12 soft-stat cap in planner propagation.';
        lazyBody.appendChild(statHeader);

        const statGrid = document.createElement('div');
        statGrid.className = 'gear-field-row';
        ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(statKey => {
            const wrap = document.createElement('label');
            wrap.style.display = 'flex';
            wrap.style.alignItems = 'center';
            wrap.style.gap = '6px';
            wrap.style.minWidth = '110px';
            wrap.textContent = statKey.toUpperCase();

            const statInput = document.createElement('input');
            statInput.type = 'number';
            statInput.min = '-99';
            statInput.max = '99';
            statInput.step = '1';
            statInput.style.width = '70px';
            statInput.value = String(Number(state.lazyProxy.stats[statKey]) || 0);
            statInput.addEventListener('input', () => {
                const parsed = Number(statInput.value);
                state.lazyProxy.stats[statKey] = Number.isFinite(parsed) ? parsed : 0;
                scheduleGearRefreshAndValidation();
            });

            wrap.appendChild(statInput);
            statGrid.appendChild(wrap);
        });
        lazyBody.appendChild(statGrid);

        lazyContainer.appendChild(lazyHeader);
        lazyContainer.appendChild(lazyBody);
        rootEls.buffList.appendChild(lazyContainer);
        attachDrawerHeaderToggle(lazyHeader, lazyContainer, (isOpen) => {
            state.ui.lazyDrawerOpen = isOpen;
        });
    }

    function renderClassAttackBonusEditor() {
        if (!rootEls || !rootEls.classAttackBonusList) return;

        ensureClassAttackToggleState();
        ensureClassBonusOptionsState();
        state.ui.classRuleDrawerOpen = state.ui && state.ui.classRuleDrawerOpen && typeof state.ui.classRuleDrawerOpen === 'object'
            ? state.ui.classRuleDrawerOpen
            : {};
        const base = getBaseDerivedSummary();
        const level = Math.max(1, Math.floor(Number(base && base.level) || 1));
        const featSet = getOwnedFeatNameSetAtLevel(level);

        rootEls.classAttackBonusList.innerHTML = '';

        const renderRuleRow = (def, targetContainer) => {
            const row = document.createElement('div');
            row.className = 'gear-field-row';

            const requirement = evaluateClassRuleRequirements(def, level, featSet);
            if (!requirement.available && state.classAttackToggles[def.key]) {
                state.classAttackToggles[def.key] = false;
            }

            const toggle = document.createElement('input');
            toggle.type = 'checkbox';
            toggle.checked = Boolean(state.classAttackToggles[def.key]);
            toggle.disabled = !requirement.available;
            if (!requirement.available) {
                toggle.title = requirement.reason;
            }
            toggle.addEventListener('change', () => {
                state.classAttackToggles[def.key] = Boolean(toggle.checked);
                renderSummaries();
            });
            const label = document.createElement('label');
            label.style.minWidth = '320px';
            label.style.fontWeight = 'bold';
            label.textContent = def.label;

            row.appendChild(toggle);
            row.appendChild(label);

            const config = def && def.behaviorConfig && typeof def.behaviorConfig === 'object'
                ? def.behaviorConfig
                : null;
            const option = config && config.option && typeof config.option === 'object'
                ? config.option
                : null;
            if (option) {
                const optionKey = String(option.key || '').trim();
                const values = Array.isArray(option.values)
                    ? option.values.map(value => String(value || '').trim().toLowerCase()).filter(Boolean)
                    : [];
                if (optionKey && values.length > 0) {
                    const optionLabel = document.createElement('label');
                    optionLabel.textContent = String(option.label || optionKey).trim() || optionKey;
                    optionLabel.style.minWidth = '64px';

                    const optionSelect = document.createElement('select');
                    values.forEach(value => {
                        const entry = document.createElement('option');
                        entry.value = value;
                        entry.textContent = value.toUpperCase();
                        optionSelect.appendChild(entry);
                    });

                    const defaultValue = String(option.defaultValue || values[0]).trim().toLowerCase();
                    const selectedValue = String(state.classBonusOptions && state.classBonusOptions[optionKey] || defaultValue).trim().toLowerCase();
                    optionSelect.value = values.includes(selectedValue) ? selectedValue : defaultValue;
                    optionSelect.addEventListener('change', () => {
                        state.classBonusOptions[optionKey] = String(optionSelect.value || defaultValue).trim().toLowerCase();
                        renderSummaries();
                    });

                    row.appendChild(optionLabel);
                    row.appendChild(optionSelect);
                }
            }

            const preview = evaluateClassAttackRule(def, level);
            const detailsText = requirement.available
                ? (preview.detailsText || preview.disabledReason || 'Inactive')
                : requirement.reason;

            const details = document.createElement('span');
            details.className = 'feat-label';
            details.textContent = detailsText;

            row.appendChild(details);
            targetContainer.appendChild(row);
        };

        const rulesByGroup = new Map();
        CLASS_ATTACK_GROUP_DEFINITIONS.forEach(group => {
            rulesByGroup.set(String(group && group.id || '').trim().toLowerCase(), []);
        });

        CLASS_ATTACK_BONUS_TOGGLE_DEFINITIONS.forEach(def => {
            const groupId = String(def && def.groupId || '').trim().toLowerCase() || 'class_specific';
            if (!rulesByGroup.has(groupId)) {
                rulesByGroup.set(groupId, []);
            }
            rulesByGroup.get(groupId).push(def);
        });

        const sortedGroups = CLASS_ATTACK_GROUP_DEFINITIONS
            .slice()
            .sort((left, right) => {
                const leftOrder = Number(left && left.uiOrder) || 0;
                const rightOrder = Number(right && right.uiOrder) || 0;
                if (leftOrder !== rightOrder) return leftOrder - rightOrder;
                return String(left && left.label || '').localeCompare(String(right && right.label || ''));
            });

        if (sortedGroups.length === 0) {
            const fallbackContainer = document.createElement('div');
            CLASS_ATTACK_BONUS_TOGGLE_DEFINITIONS.forEach(def => renderRuleRow(def, fallbackContainer));
            rootEls.classAttackBonusList.appendChild(fallbackContainer);
            return;
        }

        sortedGroups.forEach(group => {
            const groupId = String(group && group.id || '').trim().toLowerCase();
            const groupRules = rulesByGroup.get(groupId) || [];
            if (!groupRules.length) return;

            const isOpen = Object.prototype.hasOwnProperty.call(state.ui.classRuleDrawerOpen, groupId)
                ? Boolean(state.ui.classRuleDrawerOpen[groupId])
                : true;

            const drawer = document.createElement('div');
            drawer.className = `gear-drawer ${isOpen ? 'open' : ''}`;

            const header = document.createElement('button');
            header.type = 'button';
            header.className = 'gear-drawer-header';
            header.textContent = group.label || group.name || groupId;
            if (group.color) {
                header.style.borderLeft = `4px solid ${group.color}`;
            }

            const body = document.createElement('div');
            body.className = 'gear-drawer-body';

            groupRules.forEach(def => renderRuleRow(def, body));

            drawer.appendChild(header);
            drawer.appendChild(body);
            rootEls.classAttackBonusList.appendChild(drawer);

            attachDrawerHeaderToggle(header, drawer, (nextOpen) => {
                state.ui.classRuleDrawerOpen[groupId] = nextOpen;
            });
        });
    }

    function renderSongsEditor() {
        if (!rootEls) return;

        if (rootEls.songEnabledToggle) {
            rootEls.songEnabledToggle.checked = Boolean(state.song.enabled);
            rootEls.songEnabledToggle.onchange = () => {
                state.song.enabled = Boolean(rootEls.songEnabledToggle.checked);
                renderSummaries();
            };
        }

        if (rootEls.songUseSothToggle) {
            rootEls.songUseSothToggle.checked = Boolean(state.song.useSoth);
            rootEls.songUseSothToggle.onchange = () => {
                state.song.useSoth = Boolean(rootEls.songUseSothToggle.checked);
                renderSummaries();
            };
        }

        if (rootEls.songPropagateToggle) {
            rootEls.songPropagateToggle.checked = Boolean(state.song.propagateToPlanner);
            rootEls.songPropagateToggle.onchange = () => {
                state.song.propagateToPlanner = Boolean(rootEls.songPropagateToggle.checked);
                renderSummaries();
                scheduleGearRefreshAndValidation();
            };
        }

        if (rootEls.songLevelSelect) {
            rootEls.songLevelSelect.innerHTML = Array.from({ length: 30 }, (_, index) => {
                const level = index + 1;
                return `<option value="${level}">${level}</option>`;
            }).join('');
            rootEls.songLevelSelect.value = String(Math.max(1, Math.min(30, Number(state.song.level) || 30)));
            rootEls.songLevelSelect.onchange = () => {
                state.song.level = Math.max(1, Math.min(30, Number(rootEls.songLevelSelect.value) || 30));
                renderSummaries();
            };
        }

        if (rootEls.songNameSelect) {
            const songsByName = state.songData && state.songData.bardSongTable && state.songData.bardSongTable.songsByName
                ? state.songData.bardSongTable.songsByName
                : null;

            if (!songsByName) {
                rootEls.songNameSelect.innerHTML = '<option value="">No song table data loaded</option>';
                return;
            }

            const options = Object.values(songsByName)
                .map(entry => ({ key: normalizeSongNameKey(entry.name), label: entry.name }))
                .sort((left, right) => left.label.localeCompare(right.label));

            rootEls.songNameSelect.innerHTML = options
                .map(option => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)}</option>`)
                .join('');

            const selected = normalizeSongNameKey(state.song.name);
            const hasSelected = options.some(option => option.key === selected);
            rootEls.songNameSelect.value = hasSelected ? selected : (options[0] ? options[0].key : '');
            state.song.name = rootEls.songNameSelect.value;

            rootEls.songNameSelect.onchange = () => {
                state.song.name = rootEls.songNameSelect.value;
                renderSummaries();
            };
        }
    }

    function normalizeTargetText(rawValue) {
        return String(rawValue || '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, ' ')
            .trim();
    }

    function getTargetRaceTags(targetRaceValue) {
        const normalized = String(targetRaceValue || '').trim();
        const tags = new Set();

        if (!normalized) return tags;

        if (normalized === 'giantOgreHalfGiant') {
            tags.add('giant');
        }
        if (normalized === 'goblinoid') {
            tags.add('goblinoid');
        }
        if (normalized === 'orc') {
            tags.add('orc');
        }

        if (normalized === '__group_giant__') tags.add('giant');
        if (normalized === '__group_goblinoid__') tags.add('goblinoid');
        if (normalized === '__group_orc__') tags.add('orc');

        return tags;
    }

    function renderDamageGraphTargetEditor() {
        if (!rootEls) return;
        if (!state.targeting || typeof state.targeting !== 'object') {
            state.targeting = {
                alignment: 'any',
                race: '',
                targetConditions: createDefaultSongTargetConditions()
            };
        }
        if (!state.targeting.targetConditions || typeof state.targeting.targetConditions !== 'object') {
            state.targeting.targetConditions = createDefaultSongTargetConditions();
        }

        if (rootEls.damageGraphTargetAlignment) {
            rootEls.damageGraphTargetAlignment.innerHTML = TARGET_ALIGNMENT_OPTIONS
                .map(option => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`)
                .join('');
            rootEls.damageGraphTargetAlignment.value = String(state.targeting.alignment || 'any');
            rootEls.damageGraphTargetAlignment.onchange = () => {
                state.targeting.alignment = rootEls.damageGraphTargetAlignment.value || 'any';
                renderSummaries();
            };
        }

        if (rootEls.damageGraphTargetRace) {
            const allOptions = TARGET_RACE_GROUP_OPTIONS;
            rootEls.damageGraphTargetRace.innerHTML = allOptions
                .map(option => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`)
                .join('');

            const selectedRace = String(state.targeting.race || '');
            const hasSelected = allOptions.some(option => String(option.value) === selectedRace);
            rootEls.damageGraphTargetRace.value = hasSelected ? selectedRace : '';
            state.targeting.race = rootEls.damageGraphTargetRace.value || '';

            rootEls.damageGraphTargetRace.onchange = () => {
                state.targeting.race = rootEls.damageGraphTargetRace.value || '';
                renderSummaries();
            };
        }

        if (rootEls.damageGraphTargetToggleList) {
            rootEls.damageGraphTargetToggleList.innerHTML = '';
        }
    }

    function getSongPlannerPropagationBonuses(level) {
        const empty = {
            skills: new Map(),
            stats: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
            saves: { fort: 0, ref: 0, will: 0 },
            feats: []
        };

        const numericLevel = Math.max(1, Math.floor(Number(level) || 1));
        if (numericLevel < 30) return empty;
        if (!state.song || !state.song.enabled || !state.song.propagateToPlanner) return empty;

        const songEffects = getActiveSongEffects(numericLevel);
        return {
            skills: songEffects.skillBonuses,
            stats: songEffects.statBonuses,
            saves: songEffects.saveBonus,
            feats: songEffects.featDetails
        };
    }

    function getCombatSnapshot() {
        const base = getBaseDerivedSummary();
        const effects = buildGearEffects();
        const songEffects = getActiveSongEffects(base.level);
        const classHardAttack = getClassHardAttackBonus(base.level);
        const cappedAttack = getCappedAttackBonusComponents(base, effects, base.level, classHardAttack);
        const buffEffects = cappedAttack.buffEffects;
        const baseCritProfile = getCritProfileForSimulation(effects);
        const featCombatMods = getWeaponFeatCombatModifiers(base.level, effects, baseCritProfile);
        const critProfile = getCritProfileForSimulation(effects, featCombatMods);

        if (Number(buffEffects.dodgeAcBonus) !== 0) {
            effects.acBuckets.dodge.push(Number(buffEffects.dodgeAcBonus));
        }
        const applyTypedBuffAc = (bucketKey, totalValue, detailList) => {
            const amount = Number(totalValue) || 0;
            if (amount === 0) return;
            if (!effects.acBuckets || !Array.isArray(effects.acBuckets[bucketKey])) return;

            effects.acBuckets[bucketKey].push(amount);

            if (effects.sourceDetails && effects.sourceDetails.acBuckets && Array.isArray(effects.sourceDetails.acBuckets[bucketKey])) {
                const details = Array.isArray(detailList) ? detailList : [];
                if (details.length > 0) {
                    details.forEach(entry => {
                        effects.sourceDetails.acBuckets[bucketKey].push({
                            label: String(entry && entry.label ? entry.label : 'Buff'),
                            value: Number(entry && entry.value) || 0
                        });
                    });
                } else {
                    effects.sourceDetails.acBuckets[bucketKey].push({
                        label: `Buff ${bucketKey}`,
                        value: amount
                    });
                }
            }
        };
        applyTypedBuffAc('armor', buffEffects.acBonuses && buffEffects.acBonuses.armor, buffEffects.detail && buffEffects.detail.acArmor);
        applyTypedBuffAc('shield', buffEffects.acBonuses && buffEffects.acBonuses.shield, buffEffects.detail && buffEffects.detail.acShield);
        applyTypedBuffAc('natural', buffEffects.acBonuses && buffEffects.acBonuses.natural, buffEffects.detail && buffEffects.detail.acNatural);
        applyTypedBuffAc('deflection', buffEffects.acBonuses && buffEffects.acBonuses.deflection, buffEffects.detail && buffEffects.detail.acDeflection);
        applyTypedBuffAc('other', buffEffects.acBonuses && buffEffects.acBonuses.other, buffEffects.detail && buffEffects.detail.acOther);
        if (Number(songEffects.dodgeAcBonus) !== 0) {
            effects.acBuckets.dodge.push(Number(songEffects.dodgeAcBonus));
        }
        if (Number(featCombatMods.acBonus) !== 0) {
            effects.acBuckets.other.push(Number(featCombatMods.acBonus));
        }
        if (Number(classHardAttack.dodgeAcBonus) !== 0) {
            effects.acBuckets.dodge.push(Number(classHardAttack.dodgeAcBonus));
            if (effects.sourceDetails && effects.sourceDetails.acBuckets && Array.isArray(effects.sourceDetails.acBuckets.dodge)) {
                classHardAttack.dodgeSources.forEach(source => {
                    effects.sourceDetails.acBuckets.dodge.push({
                        label: source.label,
                        value: Number(source.value) || 0
                    });
                });
            }
        }

        const skillAcBonuses = getSkillAcBonusesAtLevel30(base);
        const tumbleOther = Math.max(0, Number(skillAcBonuses && skillAcBonuses.tumble ? skillAcBonuses.tumble.bonus : 0) || 0);
        const rideDodge = Math.max(0, Number(skillAcBonuses && skillAcBonuses.ride ? skillAcBonuses.ride.bonus : 0) || 0);
        const parryShield = Math.max(0, Number(skillAcBonuses && skillAcBonuses.parry ? skillAcBonuses.parry.bonus : 0) || 0);

        if (tumbleOther > 0) {
            effects.acBuckets.other.push(tumbleOther);
            effects.flatFootedExclusions.other += tumbleOther;
            if (effects.sourceDetails && effects.sourceDetails.acBuckets && Array.isArray(effects.sourceDetails.acBuckets.other)) {
                effects.sourceDetails.acBuckets.other.push({
                    label: 'Skill AC • Tumble hard ranks (L30)',
                    value: tumbleOther
                });
            }
            if (effects.sourceDetails && effects.sourceDetails.flatFootedExclusions && Array.isArray(effects.sourceDetails.flatFootedExclusions.other)) {
                effects.sourceDetails.flatFootedExclusions.other.push({
                    label: 'Tumble bonus excluded while flat-footed',
                    value: tumbleOther
                });
            }
        }

        if (rideDodge > 0) {
            effects.acBuckets.dodge.push(rideDodge);
            if (effects.sourceDetails && effects.sourceDetails.acBuckets && Array.isArray(effects.sourceDetails.acBuckets.dodge)) {
                effects.sourceDetails.acBuckets.dodge.push({
                    label: 'Skill AC • Ride hard ranks (mounted)',
                    value: rideDodge
                });
            }
        }

        if (parryShield > 0) {
            effects.acBuckets.shield.push(parryShield);
            if (effects.sourceDetails && effects.sourceDetails.acBuckets && Array.isArray(effects.sourceDetails.acBuckets.shield)) {
                effects.sourceDetails.acBuckets.shield.push({
                    label: 'Skill AC • Parry hard ranks',
                    value: parryShield
                });
            }
        }

        const ac = computeStackedAc(effects, base.level);
        const abilityCombatMods = getWeaponAbilityModifiers(base.level, {
            strOverrideMin: buffEffects.strOverrideMin,
            mightyCap: effects.mightyCap
        });
        const hasBabOverride = buffEffects.overrideBab !== null
            && buffEffects.overrideBab !== undefined
            && buffEffects.overrideBab !== ''
            && Number.isFinite(Number(buffEffects.overrideBab));
        const effectiveBab = hasBabOverride
            ? Number(buffEffects.overrideBab)
            : base.bab;
        lastCombatDebugSnapshot = buildCombatDebugSnapshot({
            base,
            buffEffects,
            effectiveBab,
            cappedAttack,
            hasBabOverride
        });
        maybeAutoLogCombatDebug(lastCombatDebugSnapshot);
        const derived = {
            attackBonus: effectiveBab + cappedAttack.cappedBonus,
            fort: base.fort + effects.saveBonus.fort + (Number(buffEffects.saveBonus.fort) || 0) + (Number(songEffects.saveBonus.fort) || 0),
            ref: base.ref + effects.saveBonus.ref + (Number(buffEffects.saveBonus.ref) || 0) + (Number(songEffects.saveBonus.ref) || 0),
            will: base.will + effects.saveBonus.will + (Number(buffEffects.saveBonus.will) || 0) + (Number(songEffects.saveBonus.will) || 0),
            hp: base.hp + (Number(buffEffects.hpBonus) || 0),
            bab: effectiveBab,
            damageBonus: effects.damageBonus + (Number(buffEffects.damageBonus) || 0) + (Number(songEffects.damageBonus) || 0),
            critDamageBonus: effects.critDamageBonus,
            spellResistance: effects.maxSpellResistance,
            ac,
            cappedAttack
        };

        derived.attackBonus += featCombatMods.attackBonus;
        derived.attackBonus += Number(classHardAttack.total) || 0;
        derived.attackBonus += Number(songEffects.attackBonus) || 0;
        derived.attackBonus += Number(buffEffects.uncappedAttackBonus) || 0;
        derived.damageBonus += featCombatMods.damageBonus;
        derived.damageBonus += Number(classHardAttack.damageBonus) || 0;
        derived.critDamageBonus += featCombatMods.overwhelmingCritAverage;
        derived.attackBonus += abilityCombatMods.attackAbilityMod;
        derived.damageBonus += abilityCombatMods.damageAbilityMod;

        const attackBonusSequence = getAttackBonusSequence(derived.attackBonus, effectiveBab);
        const extraHighestAbAttacks = Math.max(0, Math.floor(Number(buffEffects.extraHighestAbAttacks) || 0));
        for (let index = 0; index < extraHighestAbAttacks; index++) {
            attackBonusSequence.unshift(derived.attackBonus);
        }
        const sneakAttackDice = getSneakAttackDiceAtLevel(base.level, effects);
        const sneakAttackAverage = sneakAttackDice * 3.5;
        const extraDamageAverage = getAverageDamageAddsValue(effects.damageAdds);
        const gearBaseDamageWithoutAdds = (Number(effects.damageBonus) || 0) - Number(extraDamageAverage);
        const multipliableDamageBreakdown = {
            gearBaseDamage: round2(gearBaseDamageWithoutAdds),
            buffDamageBonus: round2(Number(buffEffects.damageBonus) || 0),
            songDamageBonus: round2(Number(songEffects.damageBonus) || 0),
            featDamageBonus: round2(Number(featCombatMods.damageBonus) || 0),
            classDamageBonus: round2(Number(classHardAttack.damageBonus) || 0),
            abilityDamageBonus: round2(Number(abilityCombatMods.damageAbilityMod) || 0)
        };
        multipliableDamageBreakdown.total = round2(
            multipliableDamageBreakdown.gearBaseDamage
            + multipliableDamageBreakdown.buffDamageBonus
            + multipliableDamageBreakdown.songDamageBonus
            + multipliableDamageBreakdown.featDamageBonus
            + multipliableDamageBreakdown.classDamageBonus
            + multipliableDamageBreakdown.abilityDamageBonus
        );
        const multipliableHitDamage = Math.max(0, Number(derived.damageBonus) - Number(extraDamageAverage));
        const nonMultipliableHitDamage = Math.max(0, Number(sneakAttackAverage) + Number(extraDamageAverage));
        const averageHitDamage = multipliableHitDamage + nonMultipliableHitDamage;
        const averageCritOnlyBonus = Math.max(
            0,
            Number(derived.critDamageBonus)
        );
        const averageCritHitDamage = Math.max(
            0,
            (multipliableHitDamage * Number(critProfile.multiplier || 2))
            + nonMultipliableHitDamage
            + averageCritOnlyBonus
        );

        return {
            base,
            effects,
            derived,
            baseCritProfile,
            featCombatMods,
            classHardAttack,
            abilityCombatMods,
            attackBonusSequence,
            buffEffects,
            extraHighestAbAttacks,
            songEffects,
            cappedAttack,
            sneakAttackDice,
            sneakAttackAverage,
            extraDamageAverage,
            multipliableDamageBreakdown,
            multipliableHitDamage,
            nonMultipliableHitDamage,
            averageHitDamage,
            averageCritHitDamage,
            averageCritOnlyBonus,
            critProfile,
            skillAcBonuses
        };
    }

    function simulateAverageDamageCurve(snapshot, rounds = 500000, acMin = 20, acMax = 80) {
        const attackBonuses = Array.isArray(snapshot && snapshot.attackBonusSequence)
            ? snapshot.attackBonusSequence
            : [];
        const normalHitDamage = Math.max(0, Number(snapshot && snapshot.averageHitDamage) || 0);
        const critHitDamage = Math.max(0, Number(snapshot && snapshot.averageCritHitDamage) || 0);
        const critProfile = (snapshot && snapshot.critProfile) ? snapshot.critProfile : { threatMin: 20, multiplier: 2 };
        const critThreatMin = Math.max(2, Math.min(20, Math.floor(Number(critProfile.threatMin) || 20)));

        const minAc = Math.max(0, Math.min(100, Math.floor(Number(acMin) || 20)));
        const maxAc = Math.max(minAc, Math.min(100, Math.floor(Number(acMax) || 80)));
        const totalRounds = Math.max(1, Math.floor(Number(rounds) || 500000));
        const pointCount = maxAc - minAc + 1;

        const addRange = (diffArray, startAc, endAc, value) => {
            if (!diffArray || !Number.isFinite(value) || value === 0) return;
            const clampedStart = Math.max(minAc, Math.min(maxAc, Math.floor(startAc)));
            const clampedEnd = Math.max(minAc, Math.min(maxAc, Math.floor(endAc)));
            if (clampedEnd < clampedStart) return;

            const startIndex = clampedStart - minAc;
            const endIndexExclusive = (clampedEnd - minAc) + 1;
            diffArray[startIndex] += value;
            if (endIndexExclusive < diffArray.length) {
                diffArray[endIndexExclusive] -= value;
            }
        };

        const diff = new Float64Array(pointCount + 1);
        if (attackBonuses.length === 0 || (normalHitDamage <= 0 && critHitDamage <= 0)) {
            return Array.from({ length: pointCount }, (_, index) => ({ ac: minAc + index, damage: 0 }));
        }

        for (let round = 0; round < totalRounds; round++) {
            for (let attackIndex = 0; attackIndex < attackBonuses.length; attackIndex++) {
                const attackBonus = Number(attackBonuses[attackIndex]) || 0;
                const roll = 1 + Math.floor(Math.random() * 20);
                if (roll === 1) continue;

                let maxHitAc = roll === 20 ? maxAc : Math.floor(attackBonus + roll);
                if (maxHitAc < minAc) continue;
                if (maxHitAc > maxAc) maxHitAc = maxAc;

                const isCritThreat = roll >= critThreatMin;
                if (!isCritThreat || critHitDamage <= normalHitDamage) {
                    addRange(diff, minAc, maxHitAc, normalHitDamage);
                    continue;
                }

                const threatRoll = 1 + Math.floor(Math.random() * 20);
                const maxConfirmAc = Math.floor(attackBonus + threatRoll);
                const maxCritAc = Math.min(maxHitAc, maxConfirmAc);

                if (maxCritAc < minAc) {
                    addRange(diff, minAc, maxHitAc, normalHitDamage);
                    continue;
                }

                addRange(diff, minAc, maxCritAc, critHitDamage);
                if (maxHitAc > maxCritAc) {
                    addRange(diff, maxCritAc + 1, maxHitAc, normalHitDamage);
                }
            }
        }

        const points = [];
        let cumulativeDamage = 0;
        for (let index = 0; index < pointCount; index++) {
            cumulativeDamage += diff[index];
            const averageDamage = cumulativeDamage / totalRounds;
            points.push({ ac: minAc + index, damage: averageDamage });
        }

        return points;
    }

    function simulateAverageDamageCurveWithSamples(snapshot, rounds = 500000, acMin = 20, acMax = 80, samples = 1) {
        const sampleCount = Math.max(1, Math.min(100, Math.floor(Number(samples) || 1)));
        const minAc = Math.max(0, Math.min(100, Math.floor(Number(acMin) || 20)));
        const maxAc = Math.max(minAc, Math.min(100, Math.floor(Number(acMax) || 80)));
        const totalPoints = maxAc - minAc + 1;

        if (totalPoints <= 0) return [];

        const totals = new Float64Array(totalPoints);
        for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex++) {
            const points = simulateAverageDamageCurve(snapshot, rounds, minAc, maxAc);
            for (let index = 0; index < points.length; index++) {
                totals[index] += Number(points[index].damage) || 0;
            }
        }

        return Array.from({ length: totalPoints }, (_, index) => ({
            ac: minAc + index,
            damage: totals[index] / sampleCount
        }));
    }

    function rollDie(sides) {
        const dieSides = Math.max(2, Math.floor(Number(sides) || 2));
        return 1 + Math.floor(Math.random() * dieSides);
    }

    function rollDicePool(count, sides) {
        const rolls = [];
        const diceCount = Math.max(0, Math.floor(Number(count) || 0));
        const dieSides = Math.max(2, Math.floor(Number(sides) || 2));

        for (let index = 0; index < diceCount; index++) {
            rolls.push(rollDie(dieSides));
        }

        return {
            rolls,
            sum: rolls.reduce((total, value) => total + value, 0)
        };
    }

    function getTraceDamageDiceComponents(damageAdds) {
        const result = {
            flat: Math.max(0, Number(damageAdds && damageAdds.flat) || 0),
            flatTerms: [],
            diceTerms: []
        };

        if (damageAdds && damageAdds.flatByType instanceof Map) {
            damageAdds.flatByType.forEach((amount, type) => {
                const numericAmount = Number(amount) || 0;
                if (numericAmount <= 0) return;
                const normalizedType = String(type || 'untyped').trim().toLowerCase() || 'untyped';
                result.flatTerms.push({
                    type: normalizedType,
                    value: numericAmount
                });
            });
            result.flatTerms.sort((left, right) => String(left.type).localeCompare(String(right.type)));
        }

        if (!damageAdds || !(damageAdds.diceByType instanceof Map)) {
            return result;
        }

        damageAdds.diceByType.forEach((amount, key) => {
            const numericAmount = Number(amount) || 0;
            if (numericAmount <= 0) return;

            const [rawType, rawDie] = String(key || '').split('|');
            const typeName = String(rawType || 'untyped').trim().toLowerCase() || 'untyped';
            const dieText = String(rawDie || '').trim().toLowerCase();

            if (dieText === 'avg') {
                result.flat += numericAmount;
                return;
            }

            const dieMatch = dieText.match(/^d(\d+)$/i);
            if (!dieMatch) {
                result.flat += numericAmount;
                return;
            }

            const dieSize = Math.max(2, parseInt(dieMatch[1], 10) || 0);
            const integerCount = Math.floor(numericAmount);
            const fractionalCount = numericAmount - integerCount;

            if (integerCount > 0) {
                result.diceTerms.push({
                    count: integerCount,
                    size: dieSize,
                    type: typeName
                });
            }

            if (fractionalCount > 0) {
                result.flat += fractionalCount * ((dieSize + 1) / 2);
            }
        });

        return result;
    }

    function formatSignedForTrace(value) {
        const numeric = round2(Number(value) || 0);
        return numeric >= 0 ? `+${numeric}` : `${numeric}`;
    }

    function buildDetailedAttackTraces(snapshot, options = {}) {
        const traceCount = Math.max(1, Math.floor(Number(options.traceCount) || 5));
        const traceAc = Math.max(1, Math.floor(Number(options.traceAc) || 50));
        const attackBonuses = Array.isArray(snapshot && snapshot.attackBonusSequence)
            ? snapshot.attackBonusSequence
            : [];

        if (attackBonuses.length === 0) {
            return [];
        }

        const critThreatMin = Math.max(2, Math.min(20, Math.floor(Number(snapshot && snapshot.critProfile && snapshot.critProfile.threatMin) || 20)));
        const critMultiplier = Math.max(1, Math.floor(Number(snapshot && snapshot.critProfile && snapshot.critProfile.multiplier) || 2));
        const multipliableStatic = Math.max(0, Number(snapshot && snapshot.multipliableHitDamage) || 0);
        const multipliableDamageBreakdown = snapshot && snapshot.multipliableDamageBreakdown && typeof snapshot.multipliableDamageBreakdown === 'object'
            ? snapshot.multipliableDamageBreakdown
            : null;
        const sneakAttackDice = Math.max(0, Math.floor(Number(snapshot && snapshot.sneakAttackDice) || 0));

        const damageAdds = getTraceDamageDiceComponents(snapshot && snapshot.effects ? snapshot.effects.damageAdds : null);
        const extraFlatDamage = Math.max(0, Number(damageAdds.flat) || 0);
        const extraDiceTerms = Array.isArray(damageAdds.diceTerms) ? damageAdds.diceTerms : [];

        const overwhelmingDice = Math.max(0, Math.floor(Number(snapshot && snapshot.featCombatMods && snapshot.featCombatMods.overwhelmingCritDice) || 0));
        const overwhelmingAverage = overwhelmingDice * 3.5;
        const critOnlyFlat = Math.max(0, (Number(snapshot && snapshot.averageCritOnlyBonus) || 0) - overwhelmingAverage);

        const traces = [];
        let round = 1;
        const maxRounds = Math.max(40, traceCount * 10);

        while (traces.length < traceCount && round <= maxRounds) {
            for (let attackIndex = 0; attackIndex < attackBonuses.length; attackIndex++) {
                if (traces.length >= traceCount) break;

                const attackBonus = Number(attackBonuses[attackIndex]) || 0;
                const attackRoll = rollDie(20);
                const attackTotal = attackBonus + attackRoll;
                const traceLines = [];
                const traceNumber = traces.length + 1;

                traceLines.push(`#${traceNumber} Round ${round}, Attack ${attackIndex + 1} (AB ${formatSignedForTrace(attackBonus)} vs AC ${traceAc})`);

                if (attackRoll === 1) {
                    traceLines.push(`Attack roll: d20[1] ${formatSignedForTrace(attackBonus)} = ${round2(attackTotal)} -> AUTO MISS`);
                    traceLines.push('Damage total: 0');
                    traces.push(traceLines.join('\n'));
                    continue;
                }

                const autoHit = attackRoll === 20;
                const hit = autoHit || attackTotal >= traceAc;
                traceLines.push(
                    autoHit
                        ? `Attack roll: d20[20] ${formatSignedForTrace(attackBonus)} = ${round2(attackTotal)} -> HIT (nat 20 auto-hit)`
                        : `Attack roll: d20[${attackRoll}] ${formatSignedForTrace(attackBonus)} = ${round2(attackTotal)} -> ${hit ? 'HIT' : 'MISS'}`
                );

                if (!hit) {
                    traceLines.push('Damage total: 0');
                    traces.push(traceLines.join('\n'));
                    continue;
                }

                let isThreat = attackRoll >= critThreatMin;
                let confirmedCrit = false;

                if (isThreat && critMultiplier > 1) {
                    const confirmRoll = rollDie(20);
                    const confirmTotal = attackBonus + confirmRoll;
                    confirmedCrit = confirmTotal >= traceAc;
                    traceLines.push(
                        `Critical check: threat on ${attackRoll} (range ${critThreatMin}-20), confirm d20[${confirmRoll}] ${formatSignedForTrace(attackBonus)} = ${round2(confirmTotal)} -> ${confirmedCrit ? 'CRIT CONFIRMED' : 'normal hit'}`
                    );
                } else if (isThreat) {
                    traceLines.push(`Critical check: threat on ${attackRoll}, but crit multiplier is x1 -> normal hit`);
                    isThreat = false;
                } else {
                    traceLines.push(`Critical check: no threat (need ${critThreatMin}-20)`);
                }

                const componentValues = [];

                if (multipliableStatic > 0) {
                    if (multipliableDamageBreakdown) {
                        const multipliableParts = [
                            { label: 'Gear base (no damage-add dice/flat)', value: Number(multipliableDamageBreakdown.gearBaseDamage) || 0 },
                            { label: 'Buff/spell damage', value: Number(multipliableDamageBreakdown.buffDamageBonus) || 0 },
                            { label: 'Song damage', value: Number(multipliableDamageBreakdown.songDamageBonus) || 0 },
                            { label: 'Feat damage', value: Number(multipliableDamageBreakdown.featDamageBonus) || 0 },
                            { label: 'Class damage', value: Number(multipliableDamageBreakdown.classDamageBonus) || 0 },
                            { label: 'Ability damage mod', value: Number(multipliableDamageBreakdown.abilityDamageBonus) || 0 }
                        ].filter(part => Number(part.value) !== 0);

                        if (multipliableParts.length > 0) {
                            multipliableParts.forEach(part => {
                                traceLines.push(`Flat damage add: ${part.label} ${formatSignedForTrace(part.value)}`);
                            });
                        }
                    }

                    if (confirmedCrit) {
                        const multiplied = multipliableStatic * critMultiplier;
                        traceLines.push(`Multipliable damage: (${round2(multipliableStatic)} x ${critMultiplier}) = ${round2(multiplied)}`);
                        componentValues.push(multiplied);
                    } else {
                        traceLines.push(`Multipliable damage: ${round2(multipliableStatic)}`);
                        componentValues.push(multipliableStatic);
                    }
                }

                extraDiceTerms.forEach(term => {
                    const rolled = rollDicePool(term.count, term.size);
                    const typeSuffix = term.type && term.type !== 'untyped' ? ` ${term.type}` : '';
                    traceLines.push(`Damage add${typeSuffix}: ${term.count}d${term.size} [${rolled.rolls.join(', ')}] = ${rolled.sum}`);
                    componentValues.push(rolled.sum);
                });

                if (extraFlatDamage > 0) {
                    traceLines.push(`Flat damage adds: ${round2(extraFlatDamage)}`);
                    componentValues.push(extraFlatDamage);
                }

                if (sneakAttackDice > 0) {
                    const sneakRoll = rollDicePool(sneakAttackDice, 6);
                    traceLines.push(`Sneak attack: ${sneakAttackDice}d6 [${sneakRoll.rolls.join(', ')}] = ${sneakRoll.sum}`);
                    componentValues.push(sneakRoll.sum);
                }

                if (confirmedCrit && overwhelmingDice > 0) {
                    const overwhelmingRoll = rollDicePool(overwhelmingDice, 6);
                    traceLines.push(`Overwhelming critical: ${overwhelmingDice}d6 [${overwhelmingRoll.rolls.join(', ')}] = ${overwhelmingRoll.sum}`);
                    componentValues.push(overwhelmingRoll.sum);
                }

                if (confirmedCrit && critOnlyFlat > 0) {
                    traceLines.push(`Other crit-only bonus: ${round2(critOnlyFlat)}`);
                    componentValues.push(critOnlyFlat);
                }

                const totalDamage = componentValues.reduce((sum, value) => sum + (Number(value) || 0), 0);
                const sumExpr = componentValues.length > 0
                    ? componentValues.map(value => round2(value)).join(' + ')
                    : '0';
                traceLines.push(`Damage total: ${sumExpr} = ${round2(totalDamage)}`);

                traces.push(traceLines.join('\n'));
            }

            round += 1;
        }

        return traces;
    }

    function renderDamageSimulationTrace(traceBlocks, traceAc) {
        if (!rootEls || !rootEls.damageSimTraceOutput) return;

        const blocks = Array.isArray(traceBlocks) ? traceBlocks : [];
        if (blocks.length === 0) {
            rootEls.damageSimTraceOutput.textContent = 'No attack trace available for this build.';
            return;
        }

        const header = `Trace target AC: ${traceAc}`;
        rootEls.damageSimTraceOutput.textContent = `${header}\n\n${blocks.join('\n\n')}`;

        if (isDebugLogsEnabled()) {
            console.groupCollapsed(`[Damage Sim] Detailed attack traces (${blocks.length})`);
            console.log(header);
            blocks.forEach(block => console.log(block));
            console.groupEnd();
        }
    }

    function drawDamageSimulationChart(points, options = {}) {
        const canvas = rootEls && rootEls.damageSimCanvas;
        if (!canvas) return;

        const rounds = Math.max(1, Math.floor(Number(options.rounds) || 500000));
        const context = canvas.getContext('2d');
        if (!context) return;

        const dpr = window.devicePixelRatio || 1;
        const cssWidth = canvas.clientWidth || 1100;
        const cssHeight = canvas.clientHeight || 430;
        const width = Math.max(1, Math.floor(cssWidth * dpr));
        const height = Math.max(1, Math.floor(cssHeight * dpr));

        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
        }

        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        context.clearRect(0, 0, cssWidth, cssHeight);

        const margin = { left: 64, right: 24, top: 40, bottom: 56 };
        const plotWidth = Math.max(10, cssWidth - margin.left - margin.right);
        const plotHeight = Math.max(10, cssHeight - margin.top - margin.bottom);

        const acValues = (Array.isArray(points) ? points : []).map(point => point.ac);
        const dmgValues = (Array.isArray(points) ? points : []).map(point => point.damage);

        const minAc = acValues.length > 0 ? Math.min(...acValues) : 20;
        const maxAc = acValues.length > 0 ? Math.max(...acValues) : 80;
        const maxDamageRaw = dmgValues.length > 0 ? Math.max(...dmgValues) : 0;
        const maxDamage = maxDamageRaw <= 0 ? 1 : Math.ceil(maxDamageRaw / 5) * 5;

        const xForAc = (ac) => {
            if (maxAc === minAc) return margin.left;
            return margin.left + ((ac - minAc) / (maxAc - minAc)) * plotWidth;
        };

        const yForDamage = (damage) => {
            const ratio = Math.max(0, Math.min(1, damage / maxDamage));
            return margin.top + (1 - ratio) * plotHeight;
        };

        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, cssWidth, cssHeight);

        context.strokeStyle = '#cfd8e3';
        context.lineWidth = 1;

        for (let acTick = minAc; acTick <= maxAc; acTick += 5) {
            const x = xForAc(acTick);
            context.beginPath();
            context.moveTo(x, margin.top);
            context.lineTo(x, margin.top + plotHeight);
            context.stroke();
        }

        const yTickCount = 6;
        for (let tick = 0; tick <= yTickCount; tick++) {
            const value = (maxDamage / yTickCount) * tick;
            const y = yForDamage(value);
            context.beginPath();
            context.moveTo(margin.left, y);
            context.lineTo(margin.left + plotWidth, y);
            context.stroke();
        }

        context.strokeStyle = '#2b3e57';
        context.lineWidth = 1.4;
        context.beginPath();
        context.moveTo(margin.left, margin.top);
        context.lineTo(margin.left, margin.top + plotHeight);
        context.lineTo(margin.left + plotWidth, margin.top + plotHeight);
        context.stroke();

        context.fillStyle = '#111';
        context.font = '12px Arial';
        context.textAlign = 'center';
        context.fillText(`Simulation of ${rounds} Rounds`, cssWidth / 2, 20);

        context.font = '11px Arial';
        for (let acTick = minAc; acTick <= maxAc; acTick += 5) {
            const x = xForAc(acTick);
            context.fillStyle = '#445';
            context.fillText(String(acTick), x, margin.top + plotHeight + 18);
        }

        context.textAlign = 'right';
        for (let tick = 0; tick <= yTickCount; tick++) {
            const value = (maxDamage / yTickCount) * tick;
            const y = yForDamage(value);
            context.fillStyle = '#445';
            context.fillText(String(round2(value)), margin.left - 8, y + 4);
        }

        context.textAlign = 'center';
        context.fillStyle = '#223';
        context.fillText('Target AC', margin.left + (plotWidth / 2), cssHeight - 12);

        context.save();
        context.translate(16, margin.top + (plotHeight / 2));
        context.rotate(-Math.PI / 2);
        context.fillStyle = '#223';
        context.fillText('Average Damage per Round', 0, 0);
        context.restore();

        if (!Array.isArray(points) || points.length === 0) return;

        context.strokeStyle = '#4f78d3';
        context.lineWidth = 2;
        context.beginPath();
        points.forEach((point, index) => {
            const x = xForAc(point.ac);
            const y = yForDamage(point.damage);
            if (index === 0) {
                context.moveTo(x, y);
            } else {
                context.lineTo(x, y);
            }
        });
        context.stroke();

        context.fillStyle = '#4f78d3';
        points.forEach((point, index) => {
            if (index % 5 !== 0 && index !== points.length - 1) return;
            const x = xForAc(point.ac);
            const y = yForDamage(point.damage);
            context.beginPath();
            context.arc(x, y, 2.5, 0, Math.PI * 2);
            context.fill();
        });
    }

    function switchDamageSubtab(tabName) {
        const allowed = new Set(['planner', 'buffs', 'songs', 'classab', 'graph', 'debug']);
        const targetTab = allowed.has(String(tabName || '').toLowerCase())
            ? String(tabName || '').toLowerCase()
            : 'planner';
        state.ui.damageSubtab = targetTab;

        if (rootEls.damageSubtabPlannerBtn) {
            rootEls.damageSubtabPlannerBtn.classList.toggle('active', targetTab === 'planner');
        }
        if (rootEls.damageSubtabBuffsBtn) {
            rootEls.damageSubtabBuffsBtn.classList.toggle('active', targetTab === 'buffs');
        }
        if (rootEls.damageSubtabSongsBtn) {
            rootEls.damageSubtabSongsBtn.classList.toggle('active', targetTab === 'songs');
        }
        if (rootEls.damageSubtabClassAbBtn) {
            rootEls.damageSubtabClassAbBtn.classList.toggle('active', targetTab === 'classab');
        }
        if (rootEls.damageSubtabGraphBtn) {
            rootEls.damageSubtabGraphBtn.classList.toggle('active', targetTab === 'graph');
        }
        if (rootEls.damageSubtabDebugBtn) {
            rootEls.damageSubtabDebugBtn.classList.toggle('active', targetTab === 'debug');
        }
        if (rootEls.damageSubtabPlannerPanel) {
            rootEls.damageSubtabPlannerPanel.classList.toggle('active', targetTab === 'planner');
        }
        if (rootEls.damageSubtabBuffsPanel) {
            rootEls.damageSubtabBuffsPanel.classList.toggle('active', targetTab === 'buffs');
        }
        if (rootEls.damageSubtabSongsPanel) {
            rootEls.damageSubtabSongsPanel.classList.toggle('active', targetTab === 'songs');
        }
        if (rootEls.damageSubtabClassAbPanel) {
            rootEls.damageSubtabClassAbPanel.classList.toggle('active', targetTab === 'classab');
        }
        if (rootEls.damageSubtabGraphPanel) {
            rootEls.damageSubtabGraphPanel.classList.toggle('active', targetTab === 'graph');
        }
        if (rootEls.damageSubtabDebugPanel) {
            rootEls.damageSubtabDebugPanel.classList.toggle('active', targetTab === 'debug');
        }

        if (targetTab === 'debug') {
            switchDebugSubtab(state.ui.debugSubtab || 'summary');
        }
    }

    function switchDebugSubtab(tabName) {
        const normalized = String(tabName || '').trim().toLowerCase();
        const targetTab = normalized === 'verbose'
            ? 'verbose'
            : normalized === 'presets'
                ? 'presets'
                : 'summary';
        state.ui.debugSubtab = targetTab;

        if (rootEls.debugSubtabSummaryBtn) {
            rootEls.debugSubtabSummaryBtn.classList.toggle('active', targetTab === 'summary');
        }
        if (rootEls.debugSubtabVerboseBtn) {
            rootEls.debugSubtabVerboseBtn.classList.toggle('active', targetTab === 'verbose');
        }
        if (rootEls.debugSubtabPresetsBtn) {
            rootEls.debugSubtabPresetsBtn.classList.toggle('active', targetTab === 'presets');
        }
        if (rootEls.debugSubtabSummaryPanel) {
            rootEls.debugSubtabSummaryPanel.classList.toggle('active', targetTab === 'summary');
        }
        if (rootEls.debugSubtabVerbosePanel) {
            rootEls.debugSubtabVerbosePanel.classList.toggle('active', targetTab === 'verbose');
        }
        if (rootEls.debugSubtabPresetsPanel) {
            rootEls.debugSubtabPresetsPanel.classList.toggle('active', targetTab === 'presets');
        }
    }

    function normalizeDebugTreeValue(value, seen = new WeakSet()) {
        if (value === null || value === undefined) return value;

        const valueType = typeof value;
        if (valueType === 'string' || valueType === 'boolean') return value;
        if (valueType === 'number') {
            return Number.isFinite(value) ? value : String(value);
        }
        if (valueType === 'bigint' || valueType === 'symbol' || valueType === 'function') {
            return String(value);
        }

        if (value instanceof Date) {
            return value.toISOString();
        }

        if (value instanceof Map) {
            const mapOut = {};
            Array.from(value.entries()).forEach(([key, entryValue]) => {
                mapOut[String(key)] = normalizeDebugTreeValue(entryValue, seen);
            });
            return mapOut;
        }

        if (value instanceof Set) {
            return Array.from(value.values()).map(entryValue => normalizeDebugTreeValue(entryValue, seen));
        }

        if (Array.isArray(value)) {
            return value.map(entryValue => normalizeDebugTreeValue(entryValue, seen));
        }

        if (valueType === 'object') {
            if (seen.has(value)) return '[Circular]';
            seen.add(value);
            const out = {};
            Object.keys(value).forEach(key => {
                out[key] = normalizeDebugTreeValue(value[key], seen);
            });
            return out;
        }

        return String(value);
    }

    function buildDebugSummaryLabel(value) {
        if (Array.isArray(value)) return `array (${value.length})`;
        if (value && typeof value === 'object') return `object (${Object.keys(value).length})`;
        if (value === null) return 'null';
        return typeof value;
    }

    function formatDebugLeafValue(value) {
        if (value === null) return 'null';
        if (typeof value === 'string') return JSON.stringify(value);
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        return JSON.stringify(value);
    }

    function createDebugJsonTreeNode(key, value, depth = 0) {
        const isArray = Array.isArray(value);
        const isObject = value && typeof value === 'object' && !isArray;
        if (!isArray && !isObject) {
            const leaf = document.createElement('div');
            leaf.className = 'debug-json-leaf';
            leaf.textContent = `${key}: ${formatDebugLeafValue(value)}`;
            return leaf;
        }

        const details = document.createElement('details');
        details.className = 'debug-json-node';
        details.open = depth <= 1;

        const summary = document.createElement('summary');
        summary.className = 'debug-json-summary';

        const keySpan = document.createElement('span');
        keySpan.className = 'debug-json-key';
        keySpan.textContent = key;

        const typeSpan = document.createElement('span');
        typeSpan.className = 'debug-json-type';
        typeSpan.textContent = ` (${buildDebugSummaryLabel(value)})`;

        summary.appendChild(keySpan);
        summary.appendChild(typeSpan);
        details.appendChild(summary);

        const entries = isArray
            ? value.map((entry, index) => [String(index), entry])
            : Object.keys(value).map(entryKey => [entryKey, value[entryKey]]);

        if (entries.length === 0) {
            const emptyLeaf = document.createElement('div');
            emptyLeaf.className = 'debug-json-leaf';
            emptyLeaf.textContent = '(empty)';
            details.appendChild(emptyLeaf);
            return details;
        }

        entries.forEach(([childKey, childValue]) => {
            details.appendChild(createDebugJsonTreeNode(childKey, childValue, depth + 1));
        });

        return details;
    }

    function renderSuperVerboseDebugOutput(payload) {
        if (!rootEls || !rootEls.gearDebugVerboseOutput) return;
        rootEls.gearDebugVerboseOutput.innerHTML = '';
        const normalized = normalizeDebugTreeValue(payload);
        rootEls.gearDebugVerboseOutput.appendChild(createDebugJsonTreeNode('superVerbose', normalized));
    }

    function buildSuperVerboseDebugPayload(combined, liveCombatSnapshot) {
        const snapshot = liveCombatSnapshot && typeof liveCombatSnapshot === 'object' ? liveCombatSnapshot : null;
        const base = snapshot && snapshot.base ? snapshot.base : {};
        const derived = snapshot && snapshot.derived ? snapshot.derived : {};
        const cappedAttack = snapshot && snapshot.cappedAttack ? snapshot.cappedAttack : {};
        const featCombatMods = snapshot && snapshot.featCombatMods ? snapshot.featCombatMods : {};
        const classHardAttack = snapshot && snapshot.classHardAttack ? snapshot.classHardAttack : {};
        const songEffects = snapshot && snapshot.songEffects ? snapshot.songEffects : {};
        const buffEffects = snapshot && snapshot.buffEffects ? snapshot.buffEffects : {};
        const abilityCombatMods = snapshot && snapshot.abilityCombatMods ? snapshot.abilityCombatMods : {};
        const ac = derived && derived.ac ? derived.ac : {};
        const combatDebug = combined && combined.combat_debug_snapshot ? combined.combat_debug_snapshot : {};
        const attackCalc = {
            formula: 'effectiveBab + cappedAttack + featAttack + classAttack + songAttack + uncappedBuffAttack + abilityAttackMod',
            inputs: {
                effectiveBab: Number(derived.bab) || 0,
                cappedAttack: Number(cappedAttack.cappedBonus) || 0,
                featAttack: Number(featCombatMods.attackBonus) || 0,
                classAttack: Number(classHardAttack.total) || 0,
                songAttack: Number(songEffects.attackBonus) || 0,
                uncappedBuffAttack: Number(buffEffects.uncappedAttackBonus) || 0,
                abilityAttackMod: Number(abilityCombatMods.attackAbilityMod) || 0
            },
            result: Number(derived.attackBonus) || 0
        };

        const damageCalc = {
            formula: 'gearDamage + buffDamage + songDamage + featDamage + classDamage + abilityDamage',
            inputs: {
                gearDamage: Number(snapshot && snapshot.effects ? snapshot.effects.damageBonus : 0) || 0,
                buffDamage: Number(buffEffects.damageBonus) || 0,
                songDamage: Number(songEffects.damageBonus) || 0,
                featDamage: Number(featCombatMods.damageBonus) || 0,
                classDamage: Number(classHardAttack.damageBonus) || 0,
                abilityDamage: Number(abilityCombatMods.damageAbilityMod) || 0
            },
            result: Number(derived.damageBonus) || 0
        };

        const requirementChecks = [
            {
                requirement: 'Planner level accessors wired',
                found: Boolean(combatDebug && combatDebug.wiring && combatDebug.wiring.hasGetCurrentBuildLevel),
                foundWhere: 'combat_debug_snapshot.wiring.hasGetCurrentBuildLevel',
                foundObject: combatDebug && combatDebug.wiring ? combatDebug.wiring : null
            },
            {
                requirement: 'Derived combat stats accessor wired',
                found: Boolean(combatDebug && combatDebug.wiring && combatDebug.wiring.hasGetDerivedCombatStatsAtLevel),
                foundWhere: 'combat_debug_snapshot.wiring.hasGetDerivedCombatStatsAtLevel',
                foundObject: combatDebug && combatDebug.wiring ? combatDebug.wiring : null
            },
            {
                requirement: 'Class data available',
                found: Boolean(combatDebug && combatDebug.wiring && combatDebug.wiring.hasClassData),
                foundWhere: 'combat_debug_snapshot.wiring.hasClassData',
                foundObject: combatDebug && combatDebug.wiring ? combatDebug.wiring : null
            },
            {
                requirement: 'Divine Power definition found',
                found: Boolean(combatDebug && combatDebug.divinePower && combatDebug.divinePower.definitionFound),
                foundWhere: 'combat_debug_snapshot.divinePower.definitionFound',
                foundObject: combatDebug && combatDebug.divinePower ? combatDebug.divinePower : null
            }
        ];

        const projectValidation = typeof window.getCharacterValidationDebugReport === 'function'
            ? window.getCharacterValidationDebugReport()
            : null;

        return {
            generatedAt: new Date().toISOString(),
            requirements: {
                checks: requirementChecks,
                plannerContext: {
                    level: Number(base.level) || 0,
                    classBreakdown: combatDebug && combatDebug.planner ? combatDebug.planner.classBreakdown : {}
                }
            },
            projectValidation: {
                fullReport: projectValidation
            },
            calculations: {
                attackBonus: attackCalc,
                damageBonus: damageCalc,
                armorClass: {
                    formulas: {
                        total: '10 + armor + shield + natural + deflection + dodge + dex + other',
                        touch: '10 + deflection + dodge + dex + other',
                        flatFooted: '10 + armor + shield + natural + deflection + otherInFlatFooted + flatFootedDex',
                        touchFlatFooted: '10 + deflection + otherInFlatFooted + flatFootedDex'
                    },
                    components: {
                        armor: Number(ac.armor) || 0,
                        shield: Number(ac.shield) || 0,
                        natural: Number(ac.natural) || 0,
                        deflection: Number(ac.deflection) || 0,
                        dodge: Number(ac.dodge) || 0,
                        dex: Number(ac.dexMod) || 0,
                        flatFootedDex: Number(ac.flatFootedDex) || 0,
                        other: Number(ac.other) || 0,
                        excludedOtherFlatFooted: Number(ac.excludedOtherFlatFooted) || 0,
                        otherInFlatFooted: Number(ac.otherInFlatFooted) || 0
                    },
                    results: {
                        total: Number(ac.total) || 0,
                        touch: Number(ac.touch) || 0,
                        flatFooted: Number(ac.flatFooted) || 0,
                        touchFlatFooted: Number(ac.touchFlatFooted) || 0
                    }
                }
            },
            sources: {
                attackSources: {
                    capped: cappedAttack,
                    feat: featCombatMods.attackSources || [],
                    class: classHardAttack.sources || [],
                    buffs: buffEffects.detail && buffEffects.detail.attackBonus ? buffEffects.detail.attackBonus : [],
                    song: songEffects.detail && songEffects.detail.attackBonus ? songEffects.detail.attackBonus : []
                },
                damageSources: {
                    gear: snapshot && snapshot.effects && snapshot.effects.sourceDetails ? snapshot.effects.sourceDetails.damageBonus : [],
                    feat: featCombatMods.damageSources || [],
                    class: classHardAttack.damageSources || [],
                    buffs: buffEffects.detail && buffEffects.detail.damage ? buffEffects.detail.damage : [],
                    song: songEffects.detail && songEffects.detail.damage ? songEffects.detail.damage : []
                },
                acSources: snapshot && snapshot.effects && snapshot.effects.sourceDetails ? snapshot.effects.sourceDetails.acBuckets : {}
            },
            runtime: {
                summaryPayload: combined,
                combatSnapshot: snapshot
            }
        };
    }

    function runGearDebugSnapshotCapture() {
        try {
            window.setGearCombatAutoLog(true);
        } catch {
            try {
                localStorage.setItem('gear_debug_autolog', '1');
            } catch {
                // no-op
            }
            renderSummaries();
        }

        let combatSnapshot = null;
        try {
            combatSnapshot = window.dumpGearCombatDebugSnapshot();
        } catch {
            combatSnapshot = window.getGearCombatDebugSnapshot ? window.getGearCombatDebugSnapshot() : null;
        }

        const gp = getGearPlannerSnapshot();
        const divinePowerState = gp && gp.buffs ? (gp.buffs.divine_power || null) : null;

        const combined = {
            generatedAt: new Date().toISOString(),
            commandsRun: [
                'setGearCombatAutoLog(true)',
                'dumpGearCombatDebugSnapshot()',
                'const gp = getGearPlannerSnapshot(); console.log(gp?.buffs?.divine_power)'
            ],
            divine_power_state: divinePowerState,
            combat_debug_snapshot: combatSnapshot
        };

        let liveCombatSnapshot = null;
        try {
            liveCombatSnapshot = getCombatSnapshot();
        } catch {
            liveCombatSnapshot = null;
        }

        const superVerbosePayload = buildSuperVerboseDebugPayload(combined, liveCombatSnapshot);

        if (rootEls && rootEls.gearDebugOutput) {
            rootEls.gearDebugOutput.textContent = JSON.stringify(combined, null, 2);
        }

        renderSuperVerboseDebugOutput(superVerbosePayload);

        try {
            console.log('[GearDebug] Combined debug payload', JSON.stringify(combined, null, 2));
        } catch {
            console.log('[GearDebug] Combined debug payload', combined);
        }
    }

    async function runDamageSimulationGraph() {
        if (!rootEls || !rootEls.damageSimCanvas) return;

        const rounds = 500000;
        const sampleCount = Math.max(1, Math.min(100, Math.floor(Number(rootEls.damageSimSamples && rootEls.damageSimSamples.value) || 1)));
        const rawAcMin = Math.max(0, Math.min(100, Math.floor(Number(rootEls.damageSimAcMin && rootEls.damageSimAcMin.value) || 20)));
        const rawAcMax = Math.max(0, Math.min(100, Math.floor(Number(rootEls.damageSimAcMax && rootEls.damageSimAcMax.value) || 80)));
        const acMin = Math.min(rawAcMin, rawAcMax);
        const acMax = Math.max(rawAcMin, rawAcMax);

        if (rootEls.damageSimSamples) rootEls.damageSimSamples.value = String(sampleCount);
        if (rootEls.damageSimAcMin) rootEls.damageSimAcMin.value = String(acMin);
        if (rootEls.damageSimAcMax) rootEls.damageSimAcMax.value = String(acMax);

        const snapshot = getCombatSnapshot();
        const attackText = formatAttackBonusSequence(snapshot.attackBonusSequence);
        if (rootEls.damageSimBuildSummary) {
            rootEls.damageSimBuildSummary.textContent = `AB ${attackText} (BAB ${round2(snapshot.derived.bab)} + ability ${round2(snapshot.abilityCombatMods.attackAbilityMod)} + capped ${round2(snapshot.cappedAttack.cappedBonus)} + feats ${round2(snapshot.featCombatMods.attackBonus)} + class ${round2(snapshot.classHardAttack.total)} + song ${round2(snapshot.songEffects.attackBonus)}) | Crit ${snapshot.critProfile.label} | Hit ${round2(snapshot.averageHitDamage)} | Crit Hit ${round2(snapshot.averageCritHitDamage)} | Sneak ${snapshot.sneakAttackDice}d6`;
        }

        if (rootEls.damageSimStatus) {
            rootEls.damageSimStatus.textContent = `Running simulation (${sampleCount} sample${sampleCount === 1 ? '' : 's'})...`;
        }
        if (rootEls.damageSimRunBtn) {
            rootEls.damageSimRunBtn.disabled = true;
        }
        if (rootEls.damageSimTraceOutput) {
            rootEls.damageSimTraceOutput.textContent = 'Generating trace output...';
        }

        await new Promise(resolve => setTimeout(resolve, 10));

        const startedAt = performance.now();
        const points = simulateAverageDamageCurveWithSamples(snapshot, rounds, acMin, acMax, sampleCount);
        const traceAc = Math.floor((acMin + acMax) / 2);
        const traceBlocks = buildDetailedAttackTraces(snapshot, { traceCount: 5, traceAc });
        renderDamageSimulationTrace(traceBlocks, traceAc);
        drawDamageSimulationChart(points, { rounds });
        const elapsedMs = round2(performance.now() - startedAt);

        if (rootEls.damageSimStatus) {
            rootEls.damageSimStatus.textContent = `Done (${elapsedMs} ms)`;
        }
        if (rootEls.damageSimRunBtn) {
            rootEls.damageSimRunBtn.disabled = false;
        }
    }

    function isSneakAttackFeatName(rawFeatName) {
        if (!rawFeatName || typeof rawFeatName !== 'string') return false;
        const resolved = typeof resolveFeatName === 'function'
            ? resolveFeatName(rawFeatName)
            : rawFeatName;
        const normalized = String(resolved || '').trim().toLowerCase();
        return normalized.includes('sneak attack') || normalized.includes('sneak attach');
    }

    function getSneakAttackDiceAtLevel(level, effects) {
        const cappedLevel = Math.max(1, parseInt(level, 10) || 1);
        let totalDice = 0;

        const countIfSneakAttack = (featName) => {
            if (isSneakAttackFeatName(featName)) {
                totalDice += 1;
            }
        };

        if (typeof getRaceFeatNames === 'function') {
            try {
                const raceFeats = getRaceFeatNames();
                if (Array.isArray(raceFeats)) {
                    raceFeats.forEach(countIfSneakAttack);
                }
            } catch {
                // no-op
            }
        }

        const levels = getPlannerLevelData();
        if (Array.isArray(levels)) {
            for (let lv = 1; lv <= Math.min(cappedLevel, levels.length); lv++) {
                const className = levels[lv - 1] && levels[lv - 1].class;
                if (className && typeof getClassFeatureParts === 'function') {
                    try {
                        const classFeatures = getClassFeatureParts(className, lv);
                        if (Array.isArray(classFeatures)) {
                            classFeatures.forEach(countIfSneakAttack);
                        }
                    } catch {
                        // no-op
                    }
                }

                if (typeof getSelectedFeatsAtLevel === 'function') {
                    try {
                        const selectedFeats = getSelectedFeatsAtLevel(lv);
                        if (Array.isArray(selectedFeats)) {
                            selectedFeats.forEach(countIfSneakAttack);
                        }
                    } catch {
                        // no-op
                    }
                }
            }
        }

        if (typeof getEffectiveOwnedFeatDetailsAtLevel === 'function'
            && typeof parseGrantedFeatEntry === 'function'
            && typeof doesGrantedFeatConditionMatch === 'function'
            && featData
            && typeof featData === 'object') {
            try {
                const ownedDetails = getEffectiveOwnedFeatDetailsAtLevel(cappedLevel, { includeSelectedCurrentLevel: true });
                const ownedFeatSet = new Set();

                if (ownedDetails && typeof ownedDetails.forEach === 'function') {
                    ownedDetails.forEach((detail, key) => {
                        const byKey = String(key || '').trim();
                        if (byKey) {
                            ownedFeatSet.add(byKey.toLowerCase());
                        }

                        if (detail && detail.name) {
                            const resolved = typeof resolveFeatName === 'function'
                                ? resolveFeatName(detail.name)
                                : detail.name;
                            if (resolved) {
                                ownedFeatSet.add(String(resolved).toLowerCase());
                            }
                        }
                    });
                }

                const processedGrantors = new Set();
                let expanded = true;

                while (expanded) {
                    expanded = false;

                    Array.from(ownedFeatSet).forEach(grantorKey => {
                        if (!grantorKey || processedGrantors.has(grantorKey)) return;
                        processedGrantors.add(grantorKey);

                        const grantorName = typeof resolveFeatName === 'function'
                            ? resolveFeatName(grantorKey)
                            : grantorKey;
                        const featInfo = featData[grantorName] || featData[String(grantorName || '').toLowerCase()];
                        const grantedFeats = featInfo && featInfo.effects ? featInfo.effects.grantedFeats : null;
                        if (!Array.isArray(grantedFeats)) return;

                        grantedFeats.forEach(rawGrant => {
                            const parsed = parseGrantedFeatEntry(rawGrant);
                            if (!parsed || !parsed.feat) return;
                            if (!doesGrantedFeatConditionMatch(parsed.when, cappedLevel, ownedFeatSet)) return;

                            if (isSneakAttackFeatName(parsed.feat)) {
                                totalDice += 1;
                            }

                            const resolvedGranted = typeof resolveFeatName === 'function'
                                ? resolveFeatName(parsed.feat)
                                : parsed.feat;
                            const grantedKey = String(resolvedGranted || '').trim().toLowerCase();
                            if (grantedKey && !ownedFeatSet.has(grantedKey)) {
                                ownedFeatSet.add(grantedKey);
                                expanded = true;
                            }
                        });
                    });
                }
            } catch {
                // no-op
            }
        }

        if (effects && effects.itemGrantedFeats instanceof Map) {
            effects.itemGrantedFeats.forEach(detail => {
                if (detail && isSneakAttackFeatName(detail.name)) {
                    totalDice += 1;
                }
            });
        }

        return Math.max(0, totalDice);
    }

    function getBaseDerivedSummary() {
        const level = getCurrentCharacterLevel();

        const computeFallbackBab = () => {
            const levels = getBestEffortPlannerLevels();
            if (!Array.isArray(levels) || levels.length === 0) return 0;

            const classLevels = new Map();
            for (let index = 0; index < level; index++) {
                const row = levels[index];
                const className = String(row && row.class || '').trim();
                if (!className) continue;
                classLevels.set(className, (classLevels.get(className) || 0) + 1);
            }

            if (classLevels.size === 0) return 0;

            let totalBab = 0;
            classLevels.forEach((classLevel, className) => {
                const classInfo = classData && classData[className];
                const progression = Array.isArray(classInfo && classInfo.levelProgression)
                    ? classInfo.levelProgression
                    : null;
                if (!progression || progression.length === 0) return;

                const progressionIndex = Math.max(0, Math.min(classLevel - 1, progression.length - 1));
                const progressionRow = progression[progressionIndex];
                totalBab += Array.isArray(progressionRow) ? (Number(progressionRow[0]) || 0) : 0;
            });

            return Math.max(0, totalBab);
        };

        if (typeof getDerivedCombatStatsAtLevel === 'function') {
            const stats = getDerivedCombatStatsAtLevel(level);
            if (stats && typeof stats === 'object') {
                const directBab = Number(stats.bab) || 0;
                const fallbackBab = computeFallbackBab();
                return {
                    level,
                    bab: directBab > 0 ? directBab : fallbackBab,
                    fort: Number(stats.fort) || 0,
                    ref: Number(stats.ref) || 0,
                    will: Number(stats.will) || 0,
                    hp: Number(stats.hp) || 0
                };
            }
        }

        const levels = getPlannerLevelData();
        const row = (Array.isArray(levels) && levels[level - 1]) ? levels[level - 1] : null;
        const directBab = row ? (Number(row.bab) || 0) : 0;
        const fallbackBab = computeFallbackBab();
        return {
            level,
            bab: directBab > 0 ? directBab : fallbackBab,
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

    function getBestEffortPlannerLevels() {
        const directLevels = getPlannerLevelData();
        const hasDirectClasses = Array.isArray(directLevels)
            && directLevels.some(row => row && row.class);
        if (hasDirectClasses) {
            return directLevels;
        }

        if (typeof getCharacterSnapshot === 'function') {
            try {
                const snapshot = getCharacterSnapshot();
                const snapshotLevels = Array.isArray(snapshot && snapshot.levels)
                    ? snapshot.levels
                    : [];
                if (snapshotLevels.some(row => row && row.class)) {
                    return snapshotLevels;
                }
            } catch {
                // no-op
            }
        }

        return directLevels;
    }

    function getPlannerClassBreakdown(levels, maxLevel) {
        const breakdown = {};
        if (!Array.isArray(levels)) return breakdown;

        const cappedLevel = Math.max(1, Math.min(30, Math.floor(Number(maxLevel) || 1)));
        for (let index = 0; index < cappedLevel; index++) {
            const row = levels[index];
            const className = String(row && row.class || '').trim();
            if (!className) continue;
            breakdown[className] = (breakdown[className] || 0) + 1;
        }
        return breakdown;
    }

    function buildCombatDebugSnapshot({ base, buffEffects, effectiveBab, cappedAttack, hasBabOverride }) {
        const levels = getBestEffortPlannerLevels();
        const level = Math.max(1, Math.min(30, Number(base && base.level) || 1));
        const plannerClasses = getPlannerClassBreakdown(levels, level);
        const divineDef = getBuffDefinitionByName('divine_power');
        const divineState = state && state.buffs ? state.buffs.divine_power : null;
        const divineDerived = Array.isArray(divineDef && divineDef.derivedEffects) ? divineDef.derivedEffects : [];

        const overrideRule = divineDerived.find(rule => String(rule && rule.effectType || '').trim().toLowerCase() === 'setbaboverride') || null;
        const overrideSource = String(overrideRule && overrideRule.valueSource || '').trim();
        const overrideCasterLevel = Math.max(1, Math.floor(Number(divineState && divineState.casterLevel) || 1));
        const overrideClassBab = overrideRule
            ? getClassBabAtClassLevel(overrideSource || 'Fighter', overrideCasterLevel)
            : null;

        return {
            timestamp: new Date().toISOString(),
            wiring: {
                hasGetCurrentBuildLevel: typeof getCurrentBuildLevel === 'function',
                hasGetDerivedCombatStatsAtLevel: typeof getDerivedCombatStatsAtLevel === 'function',
                hasClassData: Boolean(classData && typeof classData === 'object'),
                plannerLevelsPresent: Array.isArray(levels),
                plannerLevelsWithClass: Array.isArray(levels) ? levels.some(row => row && row.class) : false
            },
            planner: {
                level,
                classBreakdown: plannerClasses,
                base: {
                    bab: Number(base && base.bab) || 0,
                    fort: Number(base && base.fort) || 0,
                    ref: Number(base && base.ref) || 0,
                    will: Number(base && base.will) || 0,
                    hp: Number(base && base.hp) || 0
                }
            },
            divinePower: {
                state: divineState ? {
                    enabled: Boolean(divineState.enabled),
                    casterLevel: Math.max(1, Math.floor(Number(divineState.casterLevel) || 1)),
                    secondCast: Boolean(divineState.secondCast)
                } : null,
                definitionFound: Boolean(divineDef),
                derivedEffectsCount: divineDerived.length,
                overrideRule: overrideRule ? {
                    effectType: overrideRule.effectType || null,
                    valueSource: overrideSource || null,
                    resolvedClassBabAtCasterLevel: Number(overrideClassBab) || 0
                } : null
            },
            buffs: {
                hasBabOverride,
                overrideBab: buffEffects ? buffEffects.overrideBab : null,
                uncappedAttackBonus: Number(buffEffects && buffEffects.uncappedAttackBonus) || 0,
                cappedAttackBonusFromBuffs: Number(buffEffects && buffEffects.cappedAttackBonusFromBuffs) || 0
            },
            attack: {
                cappedBonus: Number(cappedAttack && cappedAttack.cappedBonus) || 0,
                effectiveBab: Number(effectiveBab) || 0
            }
        };
    }

    function maybeAutoLogCombatDebug(snapshot) {
        if (!snapshot || typeof snapshot !== 'object') return;

        try {
            if (localStorage.getItem('gear_debug_autolog') !== '1') return;
        } catch {
            return;
        }

        try {
            console.log('[GearDebug] Combat snapshot', JSON.stringify(snapshot, null, 2));
        } catch {
            // no-op
        }
    }

    function attachDrawerHeaderToggle(header, drawer, onToggle) {
        if (!header || !drawer) return;
        const syncAria = () => {
            header.setAttribute('aria-expanded', drawer.classList.contains('open') ? 'true' : 'false');
        };
        syncAria();
        header.addEventListener('click', () => {
            const nextOpen = !drawer.classList.contains('open');
            drawer.classList.toggle('open', nextOpen);
            if (typeof onToggle === 'function') {
                onToggle(nextOpen);
            }
            header.setAttribute('aria-expanded', nextOpen ? 'true' : 'false');
        });
    }

    function renderSummaries() {
        if (!rootEls || !rootEls.gearSummary) return;
        renderDamageGraphTargetEditor();
        renderClassAttackBonusEditor();

        const snapshot = getCombatSnapshot();
        const { base, effects, derived, baseCritProfile, featCombatMods, abilityCombatMods, attackBonusSequence, sneakAttackDice, sneakAttackAverage, critProfile } = snapshot;

        const totalMotes = SLOT_CONFIG.reduce((sum, slot) => {
            const slotState = ensureSlotState(slot.key);
            return sum + slotState.properties.reduce((inner, p) => inner + calcPropertyMotes(p), 0);
        }, 0);

        const sneakAttackAverageRounded = round2(sneakAttackAverage);
        const formatSigned = (value) => {
            const numeric = round2(Number(value) || 0);
            return numeric >= 0 ? `+${numeric}` : `${numeric}`;
        };
        const formatPlain = (value) => `${round2(Number(value) || 0)}`;
        const toArray = (value) => Array.isArray(value) ? value : [];
        const formatEntryLines = (entries, emptyLabel = 'none') => {
            const grouped = new Map();
            toArray(entries)
                .filter(entry => entry && typeof entry === 'object' && Number(entry.value ?? entry.bonus) !== 0)
                .forEach(entry => {
                    const rawLabel = String(
                        entry.label
                        || entry.feat
                        || entry.name
                        || entry.sourceLabel
                        || entry.key
                        || 'source'
                    ).trim();
                    const label = rawLabel || 'source';
                    const value = Number(entry.value ?? entry.bonus) || 0;
                    grouped.set(label, (grouped.get(label) || 0) + value);
                });

            const list = Array.from(grouped.entries())
                .map(([label, value]) => `${label}: ${formatSigned(value)}`);
            return list.length > 0 ? list : [emptyLabel];
        };
        const buildDrawerWithSources = (label, valueText, sourceLines) => {
            const lineItems = toArray(sourceLines)
                .map(line => String(line || '').trim())
                .filter(Boolean);
            const sourceHtml = lineItems.length > 0
                ? lineItems.map(line => `<div class="muted-note">${escapeHtml(line)}</div>`).join('')
                : '<div class="muted-note">No additional source details.</div>';
            return [
                '<div class="gear-drawer">',
                `  <button type="button" class="gear-drawer-header" aria-expanded="false">`,
                `    <span class="gear-drawer-label">${escapeHtml(label)}</span>`,
                `    <span class="gear-drawer-total">${escapeHtml(valueText)}</span>`,
                '  </button>',
                `  <div class="gear-drawer-body">${sourceHtml}</div>`,
                '</div>'
            ].join('');
        };
        const buildDrawerWithTable = (label, valueText, rows) => {
            const rowItems = toArray(rows).filter(row => row && typeof row === 'object');
            const tableHtml = rowItems.length > 0
                ? [
                    '<table class="gear-special-table">',
                    '  <tbody>',
                    ...rowItems.map(row => {
                        const key = escapeHtml(String(row.key || '').trim() || 'Detail');
                        const value = escapeHtml(String(row.value || '').trim() || '—');
                        const keyTooltip = escapeHtml(String(row.keyTooltip || row.tooltip || '').trim());
                        const valueTooltip = escapeHtml(String(row.valueTooltip || row.tooltip || '').trim());
                        const keyTitleAttr = keyTooltip ? ` title="${keyTooltip}"` : '';
                        const valueTitleAttr = valueTooltip ? ` title="${valueTooltip}"` : '';
                        return `    <tr class="gear-special-row"><td class="gear-special-key-col"${keyTitleAttr}>${key}</td><td${valueTitleAttr}>${value}</td></tr>`;
                    }),
                    '  </tbody>',
                    '</table>'
                ].join('')
                : '<div class="muted-note">No additional source details.</div>';

            return [
                '<div class="gear-drawer">',
                `  <button type="button" class="gear-drawer-header" aria-expanded="false">`,
                `    <span class="gear-drawer-label">${escapeHtml(label)}</span>`,
                `    <span class="gear-drawer-total">${escapeHtml(valueText)}</span>`,
                '  </button>',
                `  <div class="gear-drawer-body">${tableHtml}</div>`,
                '</div>'
            ].join('');
        };

        const damageAddComponents = getTraceDamageDiceComponents(effects.damageAdds);

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

        if (rootEls.baseSummary) {
            rootEls.baseSummary.innerHTML = [
                `<div class="gear-chip">Build Level: ${base.level}</div>`,
                `<div class="gear-chip">BAB: +${base.bab}</div>`,
                `<div class="gear-chip">Fort: +${base.fort}</div>`,
                `<div class="gear-chip">Ref: +${base.ref}</div>`,
                `<div class="gear-chip">Will: +${base.will}</div>`,
                `<div class="gear-chip">HP: ${base.hp}</div>`
            ].join('');
        }

        const classHardUncappedLines = formatEntryLines(
            toArray(snapshot.classHardAttack.sources).map(source => ({
                label: source.label,
                value: Number(source.bonus) || 0
            }))
        );
        const classHardCappedLines = formatEntryLines(
            toArray(snapshot.classHardAttack.cappedSources).map(source => ({
                label: source.label,
                value: Number(source.bonus) || 0
            }))
        );

        const weaponFloorUsed = Math.max(
            Number(snapshot.buffEffects.weaponBonusFloor) || 0,
            Number(snapshot.classHardAttack.weaponBonusFloor) || 0
        );

        const attackDetailRows = [
            { key: 'Base BAB', value: `${formatSigned(derived.bab)}` },
            {
                key: 'Capped (+20 cap)',
                value: `${formatSigned(snapshot.cappedAttack.cappedBonus)} total | weapon min input (enh ${formatSigned(effects.enhancementAttackBonus)} / direct ${formatSigned(effects.directAttackBonus)} / floor ${formatSigned(weaponFloorUsed)}) | buffs ${formatEntryLines(snapshot.buffEffects.detail.attack).join(' | ')} | class-capped ${classHardCappedLines.join(' | ')}`,
                tooltip: 'Weapon minimum feeds into the capped section as one candidate value (enhancement/direct/floor), with +20 cap applied after source resolution.'
            },
            { key: 'Uncapped Adds', value: `feats ${formatEntryLines(featCombatMods.attackSources).join(' | ')} | class ${classHardUncappedLines.join(' | ')} | song ${formatEntryLines(snapshot.songEffects.detail.attack).join(' | ')} | misc ${formatSigned(snapshot.buffEffects.uncappedAttackBonus)}` },
            { key: 'Ability Mod', value: `${formatSigned(abilityCombatMods.attackAbilityMod)} (STR ${formatSigned(abilityCombatMods.strMod)}, DEX ${formatSigned(abilityCombatMods.dexMod)})` }
        ];

        const multipliableDamageBreakdown = snapshot && snapshot.multipliableDamageBreakdown && typeof snapshot.multipliableDamageBreakdown === 'object'
            ? snapshot.multipliableDamageBreakdown
            : null;
        const damageAddRows = [];
        if (Array.isArray(damageAddComponents.flatTerms) && damageAddComponents.flatTerms.length > 0) {
            damageAddComponents.flatTerms.forEach(term => {
                const typeSuffix = term.type && term.type !== 'untyped' ? ` ${term.type}` : ' untyped';
                damageAddRows.push({
                    key: `Gear flat adds${typeSuffix}`,
                    value: formatSigned(term.value)
                });
            });
        } else if ((damageAddComponents.flat || 0) > 0) {
            damageAddRows.push({ key: 'Gear flat adds untyped', value: formatSigned(damageAddComponents.flat) });
        }
        (Array.isArray(damageAddComponents.diceTerms) ? damageAddComponents.diceTerms : []).forEach(term => {
            const typeSuffix = term.type && term.type !== 'untyped' ? ` ${term.type}` : '';
            damageAddRows.push({
                key: `Gear dice adds${typeSuffix}`,
                value: `${term.count}d${term.size}`
            });
        });
        if (damageAddRows.length === 0) {
            damageAddRows.push({ key: 'Gear damage adds', value: 'none' });
        }

        const damageDetailRows = [
            {
                key: 'Gear base damage',
                value: formatSigned(multipliableDamageBreakdown ? multipliableDamageBreakdown.gearBaseDamage : Math.max(0, (Number(effects.damageBonus) || 0) - (Number(snapshot.extraDamageAverage) || 0)))
            },
            { key: 'Buff/spell damage', value: `${formatSigned(snapshot.buffEffects.damageBonus)} | ${formatEntryLines(snapshot.buffEffects.detail.damage).join(' | ')}` },
            { key: 'Song damage', value: `${formatSigned(snapshot.songEffects.damageBonus)} | ${formatEntryLines(snapshot.songEffects.detail.damage).join(' | ')}` },
            { key: 'Feat damage', value: `${formatSigned(featCombatMods.damageBonus)} | ${formatEntryLines(featCombatMods.damageSources).join(' | ')}` },
            { key: 'Class damage', value: `${formatSigned(snapshot.classHardAttack.damageBonus)} | ${formatEntryLines(snapshot.classHardAttack.damageSources).join(' | ')}` },
            {
                key: 'Ability damage mod',
                value: abilityCombatMods.isRangedMissileWeapon
                    ? `${formatSigned(abilityCombatMods.damageAbilityMod)} | Mighty cap ${formatSigned(abilityCombatMods.mightyCap)} from STR ${formatSigned(abilityCombatMods.strMod)}`
                    : `${formatSigned(abilityCombatMods.damageAbilityMod)} | melee/thrown STR`
            },
            { key: 'Mighty properties', value: `${formatEntryLines(effects.sourceDetails.mighty).join(' | ')} (cap ${formatSigned(effects.mightyCap)})` },
            ...damageAddRows
        ];

        const critDetailLines = [
            `Base crit profile: ${baseCritProfile.label}`,
            `Improved critical feats: ${formatEntryLines((featCombatMods.critSources || []).filter(source => source.kind === 'improvedCritical')).join(' | ')}`,
            `Multiplier feats: ${formatEntryLines((featCombatMods.critSources || []).filter(source => source.kind === 'multiplier')).join(' | ')}`,
            `Ki critical: ${formatEntryLines((featCombatMods.critSources || []).filter(source => source.kind === 'kiCriticalRange')).join(' | ')}`,
            `Keen property active: ${featCombatMods.hasKeen ? 'yes' : 'no'}`
        ];

        const massiveCritDetailLines = [
            `Gear massive critical adds: ${formatEntryLines(effects.sourceDetails.critDamageBonus).join(' | ')}`,
            `Feat massive crit adds: ${featCombatMods.overwhelmingCritAverage !== 0 ? `Overwhelming critical: ${formatSigned(featCombatMods.overwhelmingCritAverage)}` : 'none'}`
        ];

        const saveFortLines = [
            `Base Fort: ${formatSigned(base.fort)}`,
            `Gear Fort adds: ${formatEntryLines(effects.sourceDetails.saveBonus.fort).join(' | ')}`,
            `Buff/spell Fort adds: ${formatEntryLines(snapshot.buffEffects.detail.saveFort).join(' | ')}`,
            `Song Fort adds: ${formatEntryLines(snapshot.songEffects.detail.saveFort).join(' | ')}`
        ];

        const saveRefLines = [
            `Base Ref: ${formatSigned(base.ref)}`,
            `Gear Ref adds: ${formatEntryLines(effects.sourceDetails.saveBonus.ref).join(' | ')}`,
            `Buff/spell Ref adds: ${formatEntryLines(snapshot.buffEffects.detail.saveRef).join(' | ')}`,
            `Song Ref adds: ${formatEntryLines(snapshot.songEffects.detail.saveRef).join(' | ')}`
        ];

        const saveWillLines = [
            `Base Will: ${formatSigned(base.will)}`,
            `Gear Will adds: ${formatEntryLines(effects.sourceDetails.saveBonus.will).join(' | ')}`,
            `Buff/spell Will adds: ${formatEntryLines(snapshot.buffEffects.detail.saveWill).join(' | ')}`,
            `Song Will adds: ${formatEntryLines(snapshot.songEffects.detail.saveWill).join(' | ')}`
        ];

        const acDetailRows = [
            { key: 'Total AC', value: formatPlain(derived.ac.total) },
            { key: 'Touch AC', value: formatPlain(derived.ac.touch), valueTooltip: 'Armor, shield, and natural bonuses are excluded for touch AC.' },
            {
                key: 'Flat-Footed AC',
                value: formatPlain(derived.ac.flatFooted),
                valueTooltip: derived.ac.hasDexRetainFlatFootedFeat
                    ? 'Dodge bonuses are lost. DEX is retained by Uncanny Dodge I or Defensive Awareness I.'
                    : 'Dodge and DEX bonuses are lost while flat-footed.'
            },
            {
                key: 'Touch + Flat-Footed',
                value: formatPlain(derived.ac.touchFlatFooted),
                valueTooltip: 'Combines touch exclusions with flat-footed losses.'
            },
            {
                key: 'DEX to AC',
                value: `${formatSigned(derived.ac.dexMod)}${derived.ac.dexCap === null ? '' : ` (cap +${derived.ac.dexCap})`}`,
                valueTooltip: derived.ac.dexCap === null
                    ? `Raw DEX modifier: ${formatSigned(derived.ac.dexModRaw)}`
                    : `Raw DEX modifier ${formatSigned(derived.ac.dexModRaw)} capped to ${formatSigned(derived.ac.dexMod)}`
            },
            {
                key: 'Flat-Footed DEX',
                value: `${formatSigned(derived.ac.flatFootedDex)} (${derived.ac.hasDexRetainFlatFootedFeat ? 'retained' : 'lost'})`
            },
            {
                key: 'Armor bucket',
                value: formatSigned(derived.ac.armor),
                valueTooltip: `Base ${formatSigned(derived.ac.armorBase)} + max stack ${formatSigned(derived.ac.armorModifier)} | base ${formatEntryLines(effects.sourceDetails.acBase && effects.sourceDetails.acBase.armor).join(' | ')} | mods ${formatEntryLines(effects.sourceDetails.acBuckets.armor).join(' | ')}`
            },
            {
                key: 'Shield bucket',
                value: formatSigned(derived.ac.shield),
                valueTooltip: `Base ${formatSigned(derived.ac.shieldBase)} + max stack ${formatSigned(derived.ac.shieldModifier)} | base ${formatEntryLines(effects.sourceDetails.acBase && effects.sourceDetails.acBase.shield).join(' | ')} | mods ${formatEntryLines(effects.sourceDetails.acBuckets.shield).join(' | ')}`
            },
            {
                key: 'Natural bucket',
                value: formatSigned(derived.ac.natural),
                valueTooltip: `Max stack from ${formatEntryLines(effects.sourceDetails.acBuckets.natural).join(' | ')}`
            },
            {
                key: 'Deflection bucket',
                value: formatSigned(derived.ac.deflection),
                valueTooltip: `Max stack from ${formatEntryLines(effects.sourceDetails.acBuckets.deflection).join(' | ')}`
            },
            {
                key: 'Dodge bucket',
                value: formatSigned(derived.ac.dodge),
                valueTooltip: `Capped at +20 | gear ${formatEntryLines(effects.sourceDetails.acBuckets.dodge).join(' | ')} | buffs ${formatEntryLines(snapshot.buffEffects.detail.dodgeAc).join(' | ')} | song ${formatEntryLines(snapshot.songEffects.detail.dodgeAc).join(' | ')} | feats ${formatEntryLines(featCombatMods.acSources).join(' | ')} | class ${formatEntryLines(snapshot.classHardAttack.dodgeSources).join(' | ')}`
            },
            {
                key: 'Other bucket',
                value: formatSigned(derived.ac.other),
                valueTooltip: `Uncapped sum from ${formatEntryLines(effects.sourceDetails.acBuckets.other).join(' | ')}${derived.ac.excludedOtherFlatFooted > 0 ? ` | flat-footed exclusion ${formatSigned(-derived.ac.excludedOtherFlatFooted)} (e.g. tumble)` : ''}`
            }
        ];

        const spellResistanceLines = [
            `Base spell resistance: 0`,
            `Gear spell resistance entries: ${formatEntryLines(effects.sourceDetails.spellResistance).join(' | ')}`
        ];

        const sneakSourceCounts = new Map();
        const addSneakSource = (name, sourceTag) => {
            const key = String(name || '').trim().toLowerCase();
            if (!key) return;
            if (!sneakSourceCounts.has(key)) {
                sneakSourceCounts.set(key, {
                    name: String(name || '').trim(),
                    count: 0,
                    sourceTags: new Set()
                });
            }
            const entry = sneakSourceCounts.get(key);
            entry.count += 1;
            if (sourceTag) entry.sourceTags.add(sourceTag);
        };

        try {
            if (typeof getEffectiveOwnedFeatDetailsAtLevel === 'function') {
                const ownedDetails = getEffectiveOwnedFeatDetailsAtLevel(base.level, { includeSelectedCurrentLevel: true });
                if (ownedDetails && typeof ownedDetails.forEach === 'function') {
                    ownedDetails.forEach(detail => {
                        if (!detail || !detail.name) return;
                        if (isSneakAttackFeatName(detail.name)) {
                            addSneakSource(detail.name, detail.sourceType || 'feat source');
                        }
                    });
                }
            }
        } catch {
            // no-op
        }

        if (effects && effects.itemGrantedFeats instanceof Map) {
            effects.itemGrantedFeats.forEach(itemFeatDetail => {
                if (!itemFeatDetail || !itemFeatDetail.name) return;
                if (!isSneakAttackFeatName(itemFeatDetail.name)) return;
                const sourceList = itemFeatDetail.sources instanceof Set
                    ? Array.from(itemFeatDetail.sources)
                    : ['item'];
                sourceList.forEach(sourceName => addSneakSource(itemFeatDetail.name, sourceName));
            });
        }

        const sneakAttackSourceLines = sneakSourceCounts.size > 0
            ? Array.from(sneakSourceCounts.values())
                .sort((left, right) => left.name.localeCompare(right.name))
                .map(entry => `${entry.name}: +${entry.count}d6 (${Array.from(entry.sourceTags).join(', ') || 'source unknown'})`)
            : ['none'];

        rootEls.gearSummary.innerHTML = [
            buildDrawerWithTable(
                'Attack Bonus',
                formatAttackBonusSequence(attackBonusSequence),
                attackDetailRows
            ),
            buildDrawerWithSources(
                'Attacks per Round',
                String(attackBonusSequence.length),
                [
                    `From BAB ${base.bab}`,
                    'Extra attacks unlock at BAB 6 / 11 / 16 (max 4 total)',
                    `Computed attack sequence: ${formatAttackBonusSequence(attackBonusSequence)}`
                ]
            ),
            buildDrawerWithTable(
                'Damage Bonus',
                'By Source',
                damageDetailRows
            ),
            buildDrawerWithSources(
                'Sneak Attack',
                `${sneakAttackDice}d6${sneakAttackDice > 0 ? ` (avg +${sneakAttackAverageRounded} on qualifying hit)` : ''}`,
                [
                    `Total sneak attack dice at level ${base.level}: ${sneakAttackDice}d6`,
                    `Exact sneak attack sources: ${sneakAttackSourceLines.join(' | ')}`
                ]
            ),
            buildDrawerWithSources(
                'Crit Profile',
                critProfile.label,
                critDetailLines
            ),
            buildDrawerWithSources(
                'Weapon Feat Mods',
                `AB ${formatSigned(featCombatMods.attackBonus)} | AC ${formatSigned(featCombatMods.acBonus)} | DMG ${formatSigned(featCombatMods.damageBonus)} | IC ${featCombatMods.improvedCriticalCount}${featCombatMods.hasKeen ? ' + Keen' : ''}`,
                [
                    `Active focus group: ${featCombatMods.focusGroup || 'none'}`,
                    `Attack feat lines: ${formatEntryLines(featCombatMods.attackSources).join(' | ')}`,
                    `AC feat lines: ${formatEntryLines(featCombatMods.acSources).join(' | ')}`,
                    `Damage feat lines: ${formatEntryLines(featCombatMods.damageSources).join(' | ')}`,
                    `Crit feat lines: ${formatEntryLines(featCombatMods.critSources).join(' | ')}`
                ]
            ),
            buildDrawerWithSources(
                'Massive Criticals',
                formatSigned(derived.critDamageBonus),
                massiveCritDetailLines
            ),
            buildDrawerWithSources('Fort', formatSigned(derived.fort), saveFortLines),
            buildDrawerWithSources('Ref', formatSigned(derived.ref), saveRefLines),
            buildDrawerWithSources('Will', formatSigned(derived.will), saveWillLines),
            buildDrawerWithSources('HP', `${derived.hp}`, [
                `Base HP: ${base.hp}`,
                `Buff HP adds: ${formatEntryLines(snapshot.buffEffects.detail.hp).join(' | ')}`
            ]),
            buildDrawerWithTable(
                'AC bonus total',
                formatPlain(derived.ac.total),
                acDetailRows
            ),
            buildDrawerWithSources(
                'Spell Resistance',
                `${derived.spellResistance || 0}`,
                spellResistanceLines
            )
        ].join('');

        const drawerHeaders = rootEls.gearSummary.querySelectorAll('.gear-drawer-header');
        drawerHeaders.forEach(header => {
            const drawer = header.closest('.gear-drawer');
            attachDrawerHeaderToggle(header, drawer);
        });

        if (rootEls.damageSimBuildSummary) {
            rootEls.damageSimBuildSummary.textContent = `AB ${formatAttackBonusSequence(attackBonusSequence)} (BAB ${round2(derived.bab)} + ability ${round2(abilityCombatMods.attackAbilityMod)} + capped ${round2(snapshot.cappedAttack.cappedBonus)} + feats ${round2(featCombatMods.attackBonus)} + class ${round2(snapshot.classHardAttack.total)} + song ${round2(snapshot.songEffects.attackBonus)}) | Crit ${snapshot.critProfile.label} | Hit ${round2(snapshot.averageHitDamage)} | Crit Hit ${round2(snapshot.averageCritHitDamage)} | Sneak ${sneakAttackDice}d6`;
        }

        if (rootEls.totalMotes) {
            rootEls.totalMotes.textContent = `Total Motes: ${formatMote(totalMotes)}`;
        }

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

        if (rootEls.flags) {
            rootEls.flags.innerHTML = flagLines.join('');
        }

        if (rootEls.songEffectSummary) {
            const activeSong = state.song && state.song.enabled ? (getSongEntryFromState() || { name: state.song.name }) : null;
            if (!activeSong) {
                rootEls.songEffectSummary.textContent = 'No active song effects.';
            } else {
                const coreParts = [];
                if (Number(snapshot.songEffects.attackBonus) !== 0) coreParts.push(`AB ${formatSigned(snapshot.songEffects.attackBonus)}`);
                if (Number(snapshot.songEffects.damageBonus) !== 0) coreParts.push(`DMG ${formatSigned(snapshot.songEffects.damageBonus)}`);
                if (Number(snapshot.songEffects.saveBonus.fort) !== 0 || Number(snapshot.songEffects.saveBonus.ref) !== 0 || Number(snapshot.songEffects.saveBonus.will) !== 0) {
                    coreParts.push(`Saves F/R/W ${formatSigned(snapshot.songEffects.saveBonus.fort)}/${formatSigned(snapshot.songEffects.saveBonus.ref)}/${formatSigned(snapshot.songEffects.saveBonus.will)}`);
                }
                if (Number(snapshot.songEffects.dodgeAcBonus) !== 0) coreParts.push(`Dodge AC ${formatSigned(snapshot.songEffects.dodgeAcBonus)}`);
                if (Number(snapshot.songEffects.concealment) !== 0) coreParts.push(`Conceal ${formatSigned(snapshot.songEffects.concealment)}%`);
                if (Number(snapshot.songEffects.elementalImmunity.fire) !== 0 || Number(snapshot.songEffects.elementalImmunity.acid) !== 0 || Number(snapshot.songEffects.elementalImmunity.cold) !== 0 || Number(snapshot.songEffects.elementalImmunity.electrical) !== 0) {
                    coreParts.push(`Imm F/A/C/E ${formatSigned(snapshot.songEffects.elementalImmunity.fire)}/${formatSigned(snapshot.songEffects.elementalImmunity.acid)}/${formatSigned(snapshot.songEffects.elementalImmunity.cold)}/${formatSigned(snapshot.songEffects.elementalImmunity.electrical)}%`);
                }
                coreParts.push(`Skills ${snapshot.songEffects.skillBonuses.size}`);
                rootEls.songEffectSummary.textContent = `Active: ${activeSong.name || state.song.name} L${state.song.level}${state.song.useSoth ? ' + SOTH' : ''} | ${coreParts.join(' | ')}`;
            }
        }

        if (rootEls.songUnmappedSummary) {
            const skillDetail = Array.from((snapshot.songEffects && snapshot.songEffects.skillBonuses instanceof Map ? snapshot.songEffects.skillBonuses : new Map()).entries())
                .filter(([, value]) => Number(value) !== 0)
                .sort((left, right) => left[0].localeCompare(right[0]))
                .map(([skill, value]) => `${skill} ${formatSigned(value)}`);

            const detailSegments = [];
            if (skillDetail.length > 0) {
                detailSegments.push(`Skill adjustments: ${skillDetail.join(', ')}`);
            }

            const unmapped = Array.isArray(snapshot.songEffects.unmapped) ? snapshot.songEffects.unmapped : [];
            if (unmapped.length > 0) {
                detailSegments.push(`Unmapped song fields: ${unmapped.slice(0, 8).join('; ')}${unmapped.length > 8 ? ' ...' : ''}`);
            } else {
                detailSegments.push('All selected song fields currently map to planner/combat modifiers.');
            }

            rootEls.songUnmappedSummary.textContent = detailSegments.join(' | ');
        }

        if (rootEls.damageGraphTargetSummary) {
            const alignmentValue = String(state.targeting && state.targeting.alignment ? state.targeting.alignment : 'any');
            const raceValue = String(state.targeting && state.targeting.race ? state.targeting.race : '');
            const alignmentLabel = (TARGET_ALIGNMENT_OPTIONS.find(option => option.value === alignmentValue) || TARGET_ALIGNMENT_OPTIONS[0]).label;
            rootEls.damageGraphTargetSummary.textContent = `Target profile: ${alignmentLabel} | ${raceValue || 'Any Race'}`;
        }
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

        const knownFocusGroups = new Set(WEAPON_FOCUS_GROUPS.map(group => normalizeFocusGroupName(group)).filter(Boolean));
        const currentFocusValue = String(meta.focusGroup || '').trim();
        const includeCustomFocusGroup = currentFocusValue
            && parseFocusGroupList(currentFocusValue).some(group => !knownFocusGroups.has(group));
        const focusOptions = ['<option value="">-- Select focus group --</option>']
            .concat(includeCustomFocusGroup ? [`<option value="${escapeHtml(currentFocusValue)}">${escapeHtml(currentFocusValue)}</option>`] : [])
            .concat(WEAPON_FOCUS_GROUPS.map(group => `<option value="${escapeHtml(group)}">${escapeHtml(group)}</option>`))
            .join('');
        const knownBaseWeaponNames = new Set(BASE_WEAPON_DATA.map(weapon => String(weapon.name || '').trim().toLowerCase()).filter(Boolean));
        const currentBaseWeaponValue = String(meta.baseWeaponChart || meta.baseWeaponType || '').trim();
        const includeCustomBaseWeapon = currentBaseWeaponValue && !knownBaseWeaponNames.has(currentBaseWeaponValue.toLowerCase());
        const baseWeaponOptions = ['<option value="">-- Select base weapon --</option>']
            .concat(includeCustomBaseWeapon ? [`<option value="${escapeHtml(currentBaseWeaponValue)}">${escapeHtml(currentBaseWeaponValue)}</option>`] : [])
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
        const isOffHandWeaponMode = state.selectedSlot === 'offHand' && slotState.offHandType === 'weapon';
        const isOffHandShieldMode = state.selectedSlot === 'offHand' && slotState.offHandType !== 'weapon';
        const showWeaponOptions = state.selectedSlot === 'mainHand' || isOffHandWeaponMode;
        const showWearableOptions = !showWeaponOptions;
        const showExtendedArmorFields = state.selectedSlot === 'chest' || isOffHandShieldMode;

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
                                <label><input id="meta_ranged" type="checkbox"> Ranged</label>
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
                            ${showExtendedArmorFields ? `
                            <div class="gear-field-row">
                                <label style="min-width:90px; font-weight:bold;" title="Maximum DEX modifier applied to AC from chest armor">Max Dex AC</label>
                                <input id="meta_maxDexAc" type="number" min="0" step="1" value="${meta.maxDexAc === null || meta.maxDexAc === undefined ? '' : (Number(meta.maxDexAc) || 0)}" placeholder="blank = unlimited">
                            </div>
                            <div class="gear-field-row">
                                <label style="min-width:90px; font-weight:bold;" title="Armor Check Penalty applied to STR/DEX skills at level 30">ACP</label>
                                <input id="meta_armorCheckPenalty" type="number" step="1" value="${Number(meta.armorCheckPenalty) || 0}">
                                <label style="min-width:80px; font-weight:bold;">Apply Details</label>
                                <label><input id="meta_applyArmorCheckPenalty" type="checkbox" ${isArmorCheckPenaltyDetailsEnabled(meta) ? 'checked' : ''}> Enabled</label>
                            </div>
                            <div class="muted-note" title="Derived from crafted template metadata where available.">
                                ${escapeHtml((() => {
                                    const notes = [];
                                    if (meta.baseArmorType) {
                                        notes.push(`Type: ${meta.baseArmorType}`);
                                    }
                                    if (selectedTemplateEntry && selectedTemplateEntry.template) {
                                        const sourcePage = String(selectedTemplateEntry.template.sourcePage || '').trim();
                                        if (sourcePage) {
                                            notes.push(`Source: ${sourcePage}`);
                                        }
                                    }
                                    return notes.length > 0 ? notes.join(' | ') : 'Source: Manual entry';
                                })())}
                            </div>
                            ` : ''}
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
            setChecked('#meta_ranged', meta.ranged);
        };
        syncTagCheckboxes();

        const bindInput = (selector, key, parser = (value) => value, options = {}) => {
            const live = Boolean(options && options.live);
            const input = section.querySelector(selector);
            if (!input) return;

            const applyValue = () => {
                meta[key] = parser(input.value);
                slotState.meta = meta;
                scheduleGearRefreshAndValidation();
            };

            input.addEventListener('change', applyValue);

            if (live) {
                input.addEventListener('input', applyValue);
            }
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

        attachDrawerHeaderToggle(baseDrawerBtn, baseDrawer, (isOpen) => {
            state.ui.baseDrawerOpen = isOpen;
        });

        attachDrawerHeaderToggle(restrictionDrawerBtn, restrictionDrawer, (isOpen) => {
            state.ui.restrictionDrawerOpen = isOpen;
        });

        attachDrawerHeaderToggle(specialDrawerBtn, specialDrawer, (isOpen) => {
            state.ui.specialDrawerOpen = isOpen;
        });

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

        attachDrawerHeaderToggle(weaponOptionsDrawerBtn, weaponOptionsDrawer, (isOpen) => {
            state.ui.weaponOptionsDrawerOpen = isOpen;
        });

        attachDrawerHeaderToggle(wearableOptionsDrawerBtn, wearableOptionsDrawer, (isOpen) => {
            state.ui.wearableOptionsDrawerOpen = isOpen;
        });

        bindInput('#meta_baseWeaponChart', 'baseWeaponChart', value => value || '');
        bindInput('#meta_baseWeaponType', 'baseWeaponType', value => value || '');
        bindInput('#meta_finesse', 'finesse', value => String(value || '').toLowerCase());
        bindInput('#meta_focusGroup', 'focusGroup', value => value || '');
        bindInput('#meta_proficiency', 'proficiency', value => value || '');
        bindInput('#meta_baseDamage', 'baseDamage', value => value || '');
        bindInput('#meta_critRange', 'critRange', value => value || '');
        bindInput('#meta_damageType', 'damageType', value => normalizeBaseDamageType(value));
        bindInput('#meta_baseArmor', 'baseArmor', value => Math.max(0, parseInt(value, 10) || 0), { live: true });
        bindInput('#meta_maxDexAc', 'maxDexAc', value => {
            const text = String(value === null || value === undefined ? '' : value).trim();
            if (!text) return null;
            const parsed = parseInt(text, 10);
            if (Number.isNaN(parsed)) return null;
            return Math.max(0, parsed);
        }, { live: true });
        bindInput('#meta_armorCheckPenalty', 'armorCheckPenalty', value => {
            const parsed = parseInt(String(value || '').trim(), 10);
            if (Number.isNaN(parsed)) return 0;
            return parsed > 0 ? -parsed : parsed;
        }, { live: true });
        bindCheckbox('#meta_applyArmorCheckPenalty', 'applyArmorCheckPenalty');
        bindCheckbox('#meta_ranged', 'ranged');
        bindInput('#meta_classRestriction', 'classRestriction', value => value || '');
        bindInput('#meta_minClassLevel', 'minClassLevel', value => Math.max(0, parseInt(value, 10) || 0));
        bindInput('#meta_raceRestriction', 'raceRestriction', value => value || '');
        bindInput('#meta_umdBypass', 'umdBypass', value => Math.max(0, parseInt(value, 10) || 0));
        bindInput('#meta_loreBypass', 'loreBypass', value => Math.max(0, parseInt(value, 10) || 0));

        const pulseApplyDetailsToggle = () => {
            const checkbox = section.querySelector('#meta_applyArmorCheckPenalty');
            if (!checkbox) return;
            const original = Boolean(checkbox.checked);
            checkbox.checked = !original;
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            checkbox.checked = original;
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        };

        if (showExtendedArmorFields) {
            const pulseKey = [
                state.selectedSlot,
                String(meta.craftedTemplateKey || ''),
                String(meta.baseArmor || 0),
                String(meta.maxDexAc == null ? '' : meta.maxDexAc),
                String(meta.armorCheckPenalty || 0),
                String(isArmorCheckPenaltyDetailsEnabled(meta))
            ].join('|');
            if (lastApplyDetailsPulseKey !== pulseKey) {
                lastApplyDetailsPulseKey = pulseKey;
                setTimeout(pulseApplyDetailsToggle, 260);
            }
        }
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

    function getChestArmorMeta() {
        const chestState = ensureSlotState('chest');
        const chestMeta = chestState && chestState.meta && typeof chestState.meta === 'object'
            ? chestState.meta
            : getDefaultItemMeta();
        const chestTemplate = getTemplateForSlot(chestState);
        return {
            slotState: chestState,
            meta: chestMeta,
            template: chestTemplate
        };
    }

    function getChestArmorSourceLabel() {
        const chestState = ensureSlotState('chest');
        const chestName = String(chestState && chestState.name ? chestState.name : '').trim();
        if (chestName) return chestName;
        const template = getTemplateForSlot(chestState);
        const itemName = String(template && template.itemName ? template.itemName : '').trim();
        return itemName || 'Chest armor';
    }

    function isArmorCheckPenaltyDetailsEnabled(meta) {
        if (!meta || typeof meta !== 'object') return true;
        const raw = meta.applyArmorCheckPenalty;
        if (raw === false) return false;
        if (raw === true || raw === null || raw === undefined) return true;
        if (typeof raw === 'string') {
            const normalized = raw.trim().toLowerCase();
            return normalized !== 'false' && normalized !== '0' && normalized !== 'off' && normalized !== 'no';
        }
        if (typeof raw === 'number') {
            return raw !== 0;
        }
        return Boolean(raw);
    }

    function getArmorDexCapForLevel(level) {
        const numericLevel = parseInt(level, 10) || 0;
        if (numericLevel < 30) return null;

        const chest = getChestArmorMeta();
        if (!chest || !chest.meta || !isArmorCheckPenaltyDetailsEnabled(chest.meta)) return null;
        const rawCap = chest && chest.meta ? chest.meta.maxDexAc : null;
        if (rawCap === null || rawCap === undefined || rawCap === '') return null;

        const parsedCap = parseInt(rawCap, 10);
        if (Number.isNaN(parsedCap)) return null;
        return Math.max(0, parsedCap);
    }

    function getArmorDexCapDetailsForLevel(level) {
        const numericLevel = parseInt(level, 10) || 0;
        if (numericLevel < 30) return [];

        const cap = getArmorDexCapForLevel(numericLevel);
        if (cap === null) return [];

        const chest = getChestArmorMeta();
        const sourcePage = String(chest && chest.template && chest.template.sourcePage ? chest.template.sourcePage : '').trim();
        const armorType = String(chest && chest.meta && chest.meta.baseArmorType ? chest.meta.baseArmorType : '').trim();
        const sourceName = getChestArmorSourceLabel();
        const labelBits = [sourceName, armorType].filter(Boolean);
        return [{
            label: labelBits.join(' | ') || 'Chest armor',
            value: cap,
            sourcePage
        }];
    }

    function getArmorCheckPenaltyValueForLevel(level) {
        const numericLevel = parseInt(level, 10) || 0;
        if (numericLevel < 30) return 0;

        const chest = getChestArmorMeta();
        if (!chest || !chest.meta || !isArmorCheckPenaltyDetailsEnabled(chest.meta)) return 0;

        const parsedPenalty = parseInt(chest.meta.armorCheckPenalty, 10);
        if (Number.isNaN(parsedPenalty)) return 0;
        return parsedPenalty > 0 ? -parsedPenalty : parsedPenalty;
    }

    function getArmorCheckPenaltyDetailsForLevel(level) {
        const numericLevel = parseInt(level, 10) || 0;
        if (numericLevel < 30) return [];

        const chest = getChestArmorMeta();
        const sourcePage = String(chest && chest.template && chest.template.sourcePage ? chest.template.sourcePage : '').trim();
        const armorType = String(chest && chest.meta && chest.meta.baseArmorType ? chest.meta.baseArmorType : '').trim();
        const sourceName = getChestArmorSourceLabel();
        const labelBits = [sourceName, armorType].filter(Boolean);
        const penalty = getArmorCheckPenaltyValueForLevel(numericLevel);

        return [{
            label: labelBits.join(' | ') || 'Chest armor',
            value: penalty,
            enabled: Boolean(chest && chest.meta && isArmorCheckPenaltyDetailsEnabled(chest.meta)),
            sourcePage
        }];
    }

    function getHardSkillRankAtLevel30(skillName) {
        const getter = typeof getRawSkillAtLevel === 'function'
            ? getRawSkillAtLevel
            : (typeof window !== 'undefined' && typeof window.getRawSkillAtLevel === 'function'
                ? window.getRawSkillAtLevel
                : null);
        if (!getter) return 0;

        const raw = Number(getter(30, skillName)) || 0;
        return Math.max(0, Math.floor(raw));
    }

    function getClassLevelAtLevel30(className) {
        const getter = typeof getClassLevelUpTo === 'function'
            ? getClassLevelUpTo
            : (typeof window !== 'undefined' && typeof window.getClassLevelUpTo === 'function'
                ? window.getClassLevelUpTo
                : null);
        if (!getter) return 0;

        const raw = Number(getter(className, 30)) || 0;
        return Math.max(0, Math.floor(raw));
    }

    function getOwnedFeatSetAtLevel30Normalized() {
        const getter = typeof getOwnedFeatNameSetAtLevel === 'function'
            ? getOwnedFeatNameSetAtLevel
            : (typeof window !== 'undefined' && typeof window.getOwnedFeatNameSetAtLevel === 'function'
                ? window.getOwnedFeatNameSetAtLevel
                : null);

        const rawSet = getter ? getter(30) : new Set();
        return new Set(Array.from(rawSet || []).map(name => String(name || '').trim().toLowerCase()).filter(Boolean));
    }

    function isOffHandEffectivelyEmpty() {
        const offHand = ensureSlotState('offHand');
        if (!offHand) return true;
        if (String(offHand.name || '').trim()) return false;
        if (Array.isArray(offHand.properties) && offHand.properties.length > 0) return false;

        const meta = offHand.meta && typeof offHand.meta === 'object' ? offHand.meta : {};
        if (String(meta.craftedTemplateKey || '').trim()) return false;
        if (String(meta.baseWeaponChart || meta.baseWeaponType || '').trim()) return false;
        if (Math.max(0, Number(meta.baseArmor) || 0) > 0) return false;
        return true;
    }

    function isParryBlockedByWeapon(mainHandMeta, mainHandState) {
        const weaponName = String(
            (mainHandMeta && (mainHandMeta.baseWeaponChart || mainHandMeta.baseWeaponType))
            || (mainHandState && mainHandState.name)
            || ''
        ).trim().toLowerCase();
        return /bow|crossbow|sling/.test(weaponName);
    }

    function evaluateWeaponProficiencyFeatRequirement(featSet, mainHandMeta, mainHandState) {
        const normalizedFeatSet = featSet instanceof Set ? featSet : new Set();
        const proficiencyText = String(mainHandMeta && mainHandMeta.proficiency || '').trim().toLowerCase();
        const weaponName = String(
            (mainHandMeta && (mainHandMeta.baseWeaponChart || mainHandMeta.baseWeaponType))
            || (mainHandState && mainHandState.name)
            || ''
        ).trim().toLowerCase();

        const candidates = new Set();
        proficiencyText
            .split(/[\/,|]/)
            .map(token => token.trim().toLowerCase())
            .filter(Boolean)
            .forEach(token => {
                if (token === 'simple' || token === 'martial' || token === 'exotic' || token === 'primitive') {
                    candidates.add(`weapon proficiency (${token})`);
                }
            });

        if (weaponName) {
            candidates.add(`weapon proficiency (${weaponName})`);
        }

        const candidateList = Array.from(candidates);
        const matchedFeat = candidateList.find(candidate => normalizedFeatSet.has(candidate)) || null;

        return {
            passed: Boolean(matchedFeat),
            candidates: candidateList,
            matchedFeat,
            weaponName,
            proficiencyText
        };
    }

    function getSkillAcBonusesAtLevel30(base = null) {
        ensureSkillAcState();

        const hardTumble = getHardSkillRankAtLevel30('tumble');
        const hardRide = getHardSkillRankAtLevel30('ride');
        const hardParry = getHardSkillRankAtLevel30('parry');
        const cavalierLevel = getClassLevelAtLevel30('cavalier');
        const monkLevel = getClassLevelAtLevel30('monk');
        const tumbleEnabled = Boolean(state.skillAc && state.skillAc.tumbleEnabled);
        const rideEnabled = Boolean(state.skillAc && state.skillAc.rideEnabled);
        const parryEnabled = Boolean(state.skillAc && state.skillAc.parryEnabled);
        const featSet = getOwnedFeatSetAtLevel30Normalized();
        const hasMountedCombat = featSet.has('mounted combat');

        const tumbleOtherRaw = Math.floor(hardTumble / 5);
        const tumbleOtherBonus = tumbleEnabled && !rideEnabled ? Math.max(0, tumbleOtherRaw) : 0;

        const rideRaw = Math.floor((hardRide + cavalierLevel) / 7);
        const rideDodgeBonus = (rideEnabled && hasMountedCombat)
            ? Math.min(4, Math.max(0, rideRaw))
            : 0;

        const baseBab = Math.max(0, Number(base && base.bab) || 0);
        const parryRankTier = Math.floor(hardParry / 5);
        const parryBabCap = baseBab >= 21 ? 6 : (baseBab >= 20 ? 4 : (baseBab >= 15 ? 3 : (baseBab >= 10 ? 2 : (baseBab >= 5 ? 1 : 0))));

        const mainHandState = ensureSlotState('mainHand');
        const mainHandMeta = mainHandState && mainHandState.meta && typeof mainHandState.meta === 'object'
            ? mainHandState.meta
            : {};
        const offHandEmpty = isOffHandEffectivelyEmpty();
        const weaponAllowed = !isParryBlockedByWeapon(mainHandMeta, mainHandState);
        const noMonkLevels = monkLevel === 0;

        const parryRequirementsMet = offHandEmpty && weaponAllowed && noMonkLevels;
        const parryShieldBonus = (parryEnabled && parryRequirementsMet)
            ? Math.max(0, Math.min(parryRankTier, parryBabCap))
            : 0;

        return {
            levelIndexed: 30,
            toggles: {
                tumbleEnabled,
                rideEnabled,
                parryEnabled
            },
            hardRanks: {
                tumble: hardTumble,
                ride: hardRide,
                parry: hardParry
            },
            ride: {
                hasMountedCombat,
                cavalierLevel,
                formulaRaw: rideRaw,
                bonus: rideDodgeBonus,
                maxBonus: 4,
                validation: {
                    enabled: rideEnabled,
                    passed: rideEnabled ? hasMountedCombat : true,
                    failedBy: rideEnabled && !hasMountedCombat ? 'Mounted Combat feat missing' : null
                }
            },
            tumble: {
                formulaRaw: tumbleOtherRaw,
                bonus: tumbleOtherBonus,
                validation: {
                    enabled: tumbleEnabled,
                    passed: tumbleEnabled ? !rideEnabled : true,
                    failedBy: tumbleEnabled && rideEnabled ? 'Ride is enabled (mutually exclusive)' : null
                }
            },
            parry: {
                baseBab,
                rankTier: parryRankTier,
                babCap: parryBabCap,
                bonus: parryShieldBonus,
                validation: {
                    enabled: parryEnabled,
                    passed: parryEnabled ? parryRequirementsMet : true,
                    failedBy: !parryEnabled
                        ? null
                        : [
                            offHandEmpty ? null : 'Off-hand is not empty',
                            noMonkLevels ? null : 'Monk levels present',
                            weaponAllowed ? null : 'Weapon is bow/crossbow/sling'
                        ].filter(Boolean)
                },
                requirements: {
                    offHandEmpty,
                    noMonkLevels,
                    weaponAllowed
                }
            }
        };
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

    function getCharacterSoftStatsAtLevel(level) {
        const hardStats = getCharacterStatsAtLevel(level);
        const softStats = hardStats && hardStats.softStats && typeof hardStats.softStats === 'object'
            ? hardStats.softStats
            : null;

        if (!softStats) {
            return {
                str: Number(hardStats && hardStats.str) || 10,
                dex: Number(hardStats && hardStats.dex) || 10,
                con: Number(hardStats && hardStats.con) || 10,
                int: Number(hardStats && hardStats.int) || 10,
                wis: Number(hardStats && hardStats.wis) || 10,
                cha: Number(hardStats && hardStats.cha) || 10
            };
        }

        return {
            str: Number(softStats.str) || Number(hardStats && hardStats.str) || 10,
            dex: Number(softStats.dex) || Number(hardStats && hardStats.dex) || 10,
            con: Number(softStats.con) || Number(hardStats && hardStats.con) || 10,
            int: Number(softStats.int) || Number(hardStats && hardStats.int) || 10,
            wis: Number(softStats.wis) || Number(hardStats && hardStats.wis) || 10,
            cha: Number(softStats.cha) || Number(hardStats && hardStats.cha) || 10
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

    function getSongSkillBonusForSkill(level, skillName) {
        const numericLevel = parseInt(level, 10) || 0;
        if (numericLevel < 30) return 0;

        const normalizedSkill = typeof normalizeSkillKey === 'function'
            ? normalizeSkillKey(skillName)
            : String(skillName || '').trim().toLowerCase();

        if (!normalizedSkill) return 0;

        const songPropagation = getSongPlannerPropagationBonuses(numericLevel);
        if (!(songPropagation.skills instanceof Map)) return 0;
        return songPropagation.skills.get(normalizedSkill) || 0;
    }

    function getItemStatBonusForStat(level, statName) {
        const numericLevel = parseInt(level, 10) || 0;
        if (numericLevel < 30) return 0;

        const normalizedStat = normalizeStatRequirementKey(statName);
        if (!normalizedStat) return 0;

        const effects = buildGearEffects();
        const songPropagation = getSongPlannerPropagationBonuses(numericLevel);
        const buffSoftStats = getBuffSoftStatBonuses(numericLevel).stats;
        const total = (Number(effects.softStats[normalizedStat]) || 0)
            + (Number(songPropagation.stats[normalizedStat]) || 0)
            + (Number(buffSoftStats[normalizedStat]) || 0)
            + getLazyProxySoftStatBonus(normalizedStat);
        return total > 12 ? 12 : total;
    }

    function getItemStatBonusDetailsForStat(level, statName) {
        const numericLevel = parseInt(level, 10) || 0;
        if (numericLevel < 30) return [];

        const normalizedStat = normalizeStatRequirementKey(statName);
        if (!normalizedStat) return [];

        const effects = buildGearEffects();
        const songPropagation = getSongPlannerPropagationBonuses(numericLevel);
        const buffSoftStats = getBuffSoftStatBonuses(numericLevel);
        const details = [];

        const gearDetails = effects && effects.sourceDetails && effects.sourceDetails.softStats
            ? effects.sourceDetails.softStats[normalizedStat]
            : null;
        if (Array.isArray(gearDetails)) {
            gearDetails.forEach(entry => {
                const value = Number(entry && entry.value) || 0;
                if (value === 0) return;
                details.push({
                    label: String(entry && entry.label ? entry.label : 'Gear'),
                    value
                });
            });
        }

        const songValue = Number(songPropagation && songPropagation.stats ? songPropagation.stats[normalizedStat] : 0) || 0;
        if (songValue !== 0) {
            details.push({
                label: 'Song propagation',
                value: songValue
            });
        }

        if (buffSoftStats && Array.isArray(buffSoftStats.detail)) {
            buffSoftStats.detail.forEach(entry => {
                if (!entry || entry.stat !== normalizedStat) return;
                const value = Number(entry.value) || 0;
                if (value === 0) return;
                details.push({
                    label: `${entry.label}${entry.secondCast ? ' (2nd Cast)' : ''}`,
                    value
                });
            });
        }

        const lazyStatValue = getLazyProxySoftStatBonus(normalizedStat);
        if (lazyStatValue !== 0) {
            details.push({
                label: "I'm Lazy stat proxy",
                value: lazyStatValue
            });
        }

        const rawTotal = details.reduce((sum, entry) => sum + (Number(entry && entry.value) || 0), 0);
        if (rawTotal > 12) {
            details.push({
                label: 'Soft stat cap (+12)',
                value: 12 - rawTotal
            });
        }

        return details;
    }

    function getExternalSaveBonusForType(level, saveType) {
        const numericLevel = parseInt(level, 10) || 0;
        if (numericLevel < 30) return 0;

        const normalizedSave = String(saveType || '').trim().toLowerCase();
        if (normalizedSave !== 'fort' && normalizedSave !== 'ref' && normalizedSave !== 'will') {
            return 0;
        }

        const songPropagation = getSongPlannerPropagationBonuses(numericLevel);
        return Number(songPropagation.saves[normalizedSave]) || 0;
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

        const itemDetails = Array.from(effects.itemGrantedFeats.values())
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

        const songPropagation = getSongPlannerPropagationBonuses(level);
        const songDetails = Array.isArray(songPropagation.feats)
            ? songPropagation.feats
                .map(detail => {
                    const normalizedName = typeof resolveFeatName === 'function'
                        ? resolveFeatName(detail && detail.name)
                        : String((detail && detail.name) || '').trim();
                    if (!normalizedName) return null;
                    const key = String(normalizedName).toLowerCase();
                    return {
                        name: normalizedName,
                        sources: Array.isArray(detail && detail.sources) ? detail.sources : ['song'],
                        stacks: !ownedFeatSet.has(key),
                        alreadyOwned: ownedFeatSet.has(key)
                    };
                })
                .filter(Boolean)
            : [];

        return itemDetails
            .concat(songDetails)
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

    function hydrateGearPlannerStateFromPersistedCharacter() {
        try {
            const saved = localStorage.getItem('dnd_character');
            if (!saved) return;

            const parsed = JSON.parse(saved);
            if (!parsed || typeof parsed !== 'object') return;
            if (!parsed.gearPlanner || typeof parsed.gearPlanner !== 'object') return;

            applyGearPlannerSnapshot(parsed.gearPlanner);
        } catch {
            // no-op
        }
    }

    function getGearPlannerSnapshot() {
        ensureLazyProxyState();
        ensureSkillAcState();
        return {
            selectedSlot: state.selectedSlot,
            buffs: JSON.parse(JSON.stringify(state.buffs || {})),
            lazyProxy: JSON.parse(JSON.stringify(state.lazyProxy || {})),
            classAttackToggles: JSON.parse(JSON.stringify(state.classAttackToggles || {})),
            classBonusOptions: JSON.parse(JSON.stringify(state.classBonusOptions || {})),
            skillAc: JSON.parse(JSON.stringify(state.skillAc || {})),
            targeting: JSON.parse(JSON.stringify(state.targeting || {})),
            song: JSON.parse(JSON.stringify(state.song || {})),
            slots: JSON.parse(JSON.stringify(state.slots))
        };
    }

    function applyGearPlannerSnapshot(snapshot) {
        if (!snapshot || typeof snapshot !== 'object') {
            resetGearPlannerState();
            return;
        }

        state.selectedSlot = snapshot.selectedSlot || 'mainHand';
        state.buffs = initializeBuffStateFromDefinitions(snapshot.buffs);
        state.lazyProxy = createDefaultLazyProxyState();
        const incomingLazyProxy = snapshot.lazyProxy && typeof snapshot.lazyProxy === 'object' ? snapshot.lazyProxy : null;
        if (incomingLazyProxy) {
            state.lazyProxy.enabled = Boolean(incomingLazyProxy.enabled);
            state.lazyProxy.cappedAbBonus = Number(incomingLazyProxy.cappedAbBonus) || 0;
            state.lazyProxy.uncappedAbBonus = Number(incomingLazyProxy.uncappedAbBonus) || 0;
            state.lazyProxy.weaponBonusFloor = Number(incomingLazyProxy.weaponBonusFloor) || 0;
            state.lazyProxy.damageBonus = Number(incomingLazyProxy.damageBonus) || 0;
            state.lazyProxy.damageEntries = String(incomingLazyProxy.damageEntries || '');

            const incomingStats = incomingLazyProxy.stats && typeof incomingLazyProxy.stats === 'object'
                ? incomingLazyProxy.stats
                : {};
            ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(statKey => {
                state.lazyProxy.stats[statKey] = Number(incomingStats[statKey]) || 0;
            });
        }
        ensureLazyProxyState();
        state.classAttackToggles = createDefaultClassAttackToggleState();
        const incomingClassAttackToggles = snapshot.classAttackToggles && typeof snapshot.classAttackToggles === 'object'
            ? snapshot.classAttackToggles
            : null;
        if (incomingClassAttackToggles) {
            CLASS_ATTACK_BONUS_TOGGLE_DEFINITIONS.forEach(def => {
                if (Object.prototype.hasOwnProperty.call(incomingClassAttackToggles, def.key)) {
                    state.classAttackToggles[def.key] = Boolean(incomingClassAttackToggles[def.key]);
                }
            });
        }

        state.classBonusOptions = createDefaultClassBonusOptions();
        const incomingClassBonusOptions = snapshot.classBonusOptions && typeof snapshot.classBonusOptions === 'object'
            ? snapshot.classBonusOptions
            : null;
        if (incomingClassBonusOptions) {
            Object.keys(state.classBonusOptions).forEach(optionKey => {
                if (!Object.prototype.hasOwnProperty.call(incomingClassBonusOptions, optionKey)) return;
                state.classBonusOptions[optionKey] = String(incomingClassBonusOptions[optionKey] || state.classBonusOptions[optionKey]).trim().toLowerCase();
            });
        }
        ensureClassBonusOptionsState();

        state.skillAc = createDefaultSkillAcState();
        const incomingSkillAc = snapshot.skillAc && typeof snapshot.skillAc === 'object'
            ? snapshot.skillAc
            : null;
        if (incomingSkillAc) {
            if (Object.prototype.hasOwnProperty.call(incomingSkillAc, 'tumbleEnabled')) {
                state.skillAc.tumbleEnabled = Boolean(incomingSkillAc.tumbleEnabled);
            }
            if (Object.prototype.hasOwnProperty.call(incomingSkillAc, 'rideEnabled')) {
                state.skillAc.rideEnabled = Boolean(incomingSkillAc.rideEnabled);
            }
            if (Object.prototype.hasOwnProperty.call(incomingSkillAc, 'parryEnabled')) {
                state.skillAc.parryEnabled = Boolean(incomingSkillAc.parryEnabled);
            }

            if (!Object.prototype.hasOwnProperty.call(incomingSkillAc, 'tumbleEnabled')
                && !Object.prototype.hasOwnProperty.call(incomingSkillAc, 'rideEnabled')
                && Object.prototype.hasOwnProperty.call(incomingSkillAc, 'mounted')) {
                state.skillAc.rideEnabled = Boolean(incomingSkillAc.mounted);
                state.skillAc.tumbleEnabled = !state.skillAc.rideEnabled;
                state.skillAc.parryEnabled = true;
            }
        }
        ensureSkillAcState();

        const incomingSong = snapshot.song && typeof snapshot.song === 'object' ? snapshot.song : null;
        const incomingTargeting = snapshot.targeting && typeof snapshot.targeting === 'object' ? snapshot.targeting : null;
        const incomingTargets = incomingTargeting && incomingTargeting.targetConditions && typeof incomingTargeting.targetConditions === 'object'
            ? incomingTargeting.targetConditions
            : (incomingSong && incomingSong.targetConditions && typeof incomingSong.targetConditions === 'object' ? incomingSong.targetConditions : {});
        const mergedTargets = createDefaultSongTargetConditions();
        Object.keys(mergedTargets).forEach(key => {
            mergedTargets[key] = Boolean(incomingTargets[key]);
        });

        state.targeting = {
            alignment: String(incomingTargeting && incomingTargeting.alignment ? incomingTargeting.alignment : 'any'),
            race: String(incomingTargeting && incomingTargeting.race ? incomingTargeting.race : ''),
            targetConditions: mergedTargets
        };

        state.song = {
            enabled: Boolean(incomingSong && incomingSong.enabled),
            name: normalizeSongNameKey(incomingSong && incomingSong.name ? incomingSong.name : 'bardic rhythm'),
            level: Math.max(1, Math.min(30, Math.floor(Number(incomingSong && incomingSong.level) || 30))),
            useSoth: Boolean(incomingSong && incomingSong.useSoth),
            propagateToPlanner: Boolean(incomingSong && incomingSong.propagateToPlanner)
        };

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
        renderBuffsEditor();
        renderSongsEditor();
        scheduleGearRefreshAndValidation();
    }

    function resetGearPlannerState() {
        state.selectedSlot = 'mainHand';
        state.buffs = initializeBuffStateFromDefinitions(null);
        state.lazyProxy = createDefaultLazyProxyState();
        state.classAttackToggles = createDefaultClassAttackToggleState();
        state.classBonusOptions = createDefaultClassBonusOptions();
        state.skillAc = createDefaultSkillAcState();
        state.song = {
            enabled: false,
            name: 'bardic rhythm',
            level: 30,
            useSoth: false,
            propagateToPlanner: false
        };
        state.targeting = {
            alignment: 'any',
            race: '',
            targetConditions: createDefaultSongTargetConditions()
        };
        state.slots = {};
        SLOT_CONFIG.forEach(slot => ensureSlotState(slot.key));
        renderPaperDoll();
        renderEditor();
        renderBuffsEditor();
        renderSongsEditor();
        scheduleGearRefreshAndValidation();
    }

    window.getGearPlannerSnapshot = getGearPlannerSnapshot;
    window.applyGearPlannerSnapshot = applyGearPlannerSnapshot;
    window.resetGearPlannerState = resetGearPlannerState;
    window.refreshGearPlannerDerivedSummary = renderSummaries;
    window.getGearCombatDebugSnapshot = function () {
        return lastCombatDebugSnapshot
            ? JSON.parse(JSON.stringify(lastCombatDebugSnapshot))
            : null;
    };
    window.dumpGearCombatDebugSnapshot = function () {
        const snapshot = window.getGearCombatDebugSnapshot();
        if (!snapshot) {
            console.log('[GearDebug] No combat snapshot available yet.');
            return null;
        }
        try {
            console.log('[GearDebug] Manual dump', JSON.stringify(snapshot, null, 2));
        } catch {
            console.log('[GearDebug] Manual dump', snapshot);
        }
        return snapshot;
    };
    window.setGearCombatAutoLog = function (enabled) {
        const on = Boolean(enabled);
        try {
            localStorage.setItem('gear_debug_autolog', on ? '1' : '0');
        } catch {
            // no-op
        }
        console.log(`[GearDebug] Auto log ${on ? 'enabled' : 'disabled'}.`);
        if (on) {
            renderSummaries();
        }
    };
    window.getItemGrantedFeatDetails = getItemGrantedFeatDetails;
    window.getItemSkillBonusForSkill = getItemSkillBonusForSkill;
    window.getSongSkillBonusForSkill = getSongSkillBonusForSkill;
    window.getItemStatBonusForStat = getItemStatBonusForStat;
    window.getItemStatBonusDetailsForStat = getItemStatBonusDetailsForStat;
    window.getArmorDexCapForLevel = getArmorDexCapForLevel;
    window.getArmorDexCapDetailsForLevel = getArmorDexCapDetailsForLevel;
    window.getArmorCheckPenaltyValueForLevel = getArmorCheckPenaltyValueForLevel;
    window.getArmorCheckPenaltyDetailsForLevel = getArmorCheckPenaltyDetailsForLevel;
    window.getExternalSaveBonusForType = getExternalSaveBonusForType;
    window.getActiveBuffObjects = () => getActiveBuffObjects(getCurrentCharacterLevel(), buildGearEffects());

    document.addEventListener('DOMContentLoaded', () => {
        init().catch(error => {
            console.error('[Damage Gear Planner] Initialization failed', error);
        });
    });
})();

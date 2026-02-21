let raceData = {};
let classData = {};
let featData = {};

// List of all skills in order
const SKILL_LIST = [
    'animal empathy', 'appraise', 'bluff', 'climb', 'concentration',
    'craft mastery', 'disable trap', 'heal', 'hide', 'intimidate',
    'listen', 'lore', 'move silently', 'open lock', 'parry',
    'perform', 'ride', 'search', 'sleight of hand', 'spellcraft',
    'use magic device', 'use trap', 'spot', 'taunt', 'tumble'
];

const STAT_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const STAT_LABELS = {
    str: 'STR',
    dex: 'DEX',
    con: 'CON',
    int: 'INT',
    wis: 'WIS',
    cha: 'CHA'
};

const SKILL_ALIAS_MAP = {
    'sleight hand': 'sleight of hand',
    'use magic': 'use magic device',
    'disable traps': 'disable trap'
};

// Initialize level data with skills
let levelData = Array(30).fill(null).map(() => ({
    class: '',
    feats: [],
    statIncrease: '',
    skills: Array(SKILL_LIST.length).fill(0),
    bab: 0,
    fort: 0,
    ref: 0,
    will: 0,
    hp: 0
}));

let levelStatData = Array(30).fill(null).map(() => ({
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10,
    appliedBonuses: []
}));

const BONUS_FEAT_LEVELS = [1, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30];

async function fetchJsonWithFallback(fileName) {
    const sources = [
        `http://localhost:8000/${fileName}`,
        fileName,
        `https://raw.githubusercontent.com/dripbilliam/Dripbilliam.github.io/main/CharacterCalculator/${fileName}`,
        `https://raw.githubusercontent.com/dripbilliam/Dripbilliam.github.io/master/CharacterCalculator/${fileName}`
    ];

    let lastError = null;
    for (const url of sources) {
        try {
            const response = await fetch(url, { cache: 'no-store' });
            if (!response.ok) {
                throw new Error(`${response.status} ${response.statusText}`);
            }
            console.log(`Loaded ${fileName} from: ${url}`);
            return await response.json();
        } catch (error) {
            lastError = error;
            console.warn(`Failed loading ${fileName} from ${url}:`, error.message || error);
        }
    }

    throw new Error(`Unable to load ${fileName} from any source. Last error: ${lastError?.message || lastError}`);
}

async function loadData() {
    try {
        console.log('Loading data files...');
        const [racesJson, classJson, featsJson] = await Promise.all([
            fetchJsonWithFallback('races.json'),
            fetchJsonWithFallback('classData.json'),
            fetchJsonWithFallback('feats.json')
        ]);

        raceData = racesJson;
        classData = classJson;
        featData = featsJson;

        console.log(`Loaded: ${Object.keys(raceData).length} races, ${Object.keys(classData).length} classes, ${Object.keys(featData).length} feats`);

        populateRaceSelect();
        updateGrid();
        updateSkillGrid();
        updateStatGrid();
        loadCharacter();
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('validationOutput').textContent = 'ERROR: Could not load data files';
    }
}

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

function populateRaceSelect() {
    const select = document.getElementById('raceSelect');
    select.innerHTML = '<option value="">-- Select Race --</option>';
    const races = Object.keys(raceData).sort();
    races.forEach(race => {
        const option = document.createElement('option');
        option.value = race;
        option.textContent = race;
        select.appendChild(option);
    });
    select.addEventListener('change', () => {
        calculateMulticlassProgression();
        updateGrid();
        updateSkillGrid();
        validateCharacterRealtime();
    });
}

// Handle stat changes with real-time validation
function handleStatChange() {
    calculateMulticlassProgression();
    updateGrid();
    validateCharacterRealtime();
}

function getStats() {
    return {
        str: parseInt(document.getElementById('stat_str').value) || 10,
        dex: parseInt(document.getElementById('stat_dex').value) || 10,
        con: parseInt(document.getElementById('stat_con').value) || 10,
        int: parseInt(document.getElementById('stat_int').value) || 10,
        wis: parseInt(document.getElementById('stat_wis').value) || 10,
        cha: parseInt(document.getElementById('stat_cha').value) || 10
    };
}

function getSelectedRace() {
    const race = document.getElementById('raceSelect').value;
    return raceData[race] || null;
}

function getRaceFeatNames() {
    const race = getSelectedRace();
    if (!race || !Array.isArray(race.feats)) return [];
    return race.feats.filter(Boolean);
}

function getRaceProficiencyFeats() {
    return getRaceFeatNames().filter(feat => /proficienc/i.test(feat));
}

function normalizeProficiencyName(proficiencyName) {
    if (!proficiencyName) return [];
    const raw = proficiencyName.toString().trim();
    const lower = raw.toLowerCase();

    if (lower === 'shield proficiency' || lower === 'shields') {
        return ['shield proficiency'];
    }

    const armorMatch = lower.match(/^armor(?: proficiency)?\s*\(([^)]+)\)$/);
    if (armorMatch) {
        return armorMatch[1]
            .split(',')
            .map(part => part.trim())
            .filter(Boolean)
            .map(type => `armor proficiency (${type})`);
    }

    const weaponMatch = lower.match(/^weapons?\s*\(([^)]+)\)$/) || lower.match(/^weapon proficiency\s*\(([^)]+)\)$/);
    if (weaponMatch) {
        return weaponMatch[1]
            .split(',')
            .map(part => part.trim())
            .filter(Boolean)
            .map(type => `weapon proficiency (${type})`);
    }

    return [lower];
}

function getClassProficiencyFeatsForClass(className) {
    const classInfo = classData[className];
    if (!classInfo) return [];

    const rawList = [
        ...(Array.isArray(classInfo.proficiencies) ? classInfo.proficiencies : []),
        ...(classInfo.requirements && Array.isArray(classInfo.requirements.proficiencies)
            ? classInfo.requirements.proficiencies
            : [])
    ];

    const normalized = [];
    rawList.forEach(item => {
        normalized.push(...normalizeProficiencyName(item));
    });

    return Array.from(new Set(normalized));
}

function getClassProficiencyFeatsUpTo(level) {
    const classNames = new Set();
    for (let i = 0; i < level; i++) {
        const className = levelData[i].class;
        if (className) classNames.add(className);
    }

    const proficiencies = [];
    classNames.forEach(className => {
        proficiencies.push(...getClassProficiencyFeatsForClass(className));
    });

    return Array.from(new Set(proficiencies));
}

function getAllOwnedFeatNamesPriorTo(beforeLevel) {
    const selectedFeats = getSelectedFeatsPriorTo(beforeLevel);
    const raceFeats = getRaceFeatNames();
    const classProficiencies = getClassProficiencyFeatsUpTo(beforeLevel);
    return [...raceFeats, ...classProficiencies, ...selectedFeats];
}

function getSaveBonus(stat) {
    return Math.floor((stat - 10) / 2);
}

function formatStatWithModifier(value) {
    const modifier = getSaveBonus(value);
    const modifierText = modifier >= 0 ? `+${modifier}` : `${modifier}`;
    return `${value} (${modifierText})`;
}

function getAbilityModifiers(stats) {
    return {
        str: getSaveBonus(stats.str),
        dex: getSaveBonus(stats.dex),
        con: getSaveBonus(stats.con),
        int: getSaveBonus(stats.int),
        wis: getSaveBonus(stats.wis),
        cha: getSaveBonus(stats.cha)
    };
}

function normalizeStatKey(statName) {
    if (!statName) return null;
    const value = statName.toString().trim().toLowerCase();
    const map = {
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
    return map[value] || null;
}

function normalizeSkillKey(skillName) {
    if (!skillName) return null;
    const raw = skillName.toString().trim().toLowerCase();
    const aliasResolved = SKILL_ALIAS_MAP[raw] || raw;
    const normalized = aliasResolved.replace(/\s+/g, ' ').trim();

    if (SKILL_LIST.includes(normalized)) {
        return normalized;
    }

    return null;
}

function getRaceSkillBonus(skillKey) {
    const raceInfo = getSelectedRace();
    if (!raceInfo || !raceInfo.skills) return 0;

    const normalizedSkill = normalizeSkillKey(skillKey);
    if (!normalizedSkill) return 0;

    const direct = raceInfo.skills[normalizedSkill];
    if (direct !== undefined && direct !== null) {
        return parseInt(direct, 10) || 0;
    }

    const raw = raceInfo.skills[skillKey];
    return parseInt(raw, 10) || 0;
}

function getEffectiveSkillAtLevel(level, skillName) {
    const normalizedSkill = normalizeSkillKey(skillName);
    if (!normalizedSkill) return null;

    const skillIdx = SKILL_LIST.findIndex(s => s === normalizedSkill);
    if (skillIdx < 0) return null;

    let skillTotal = 0;
    for (let i = 0; i < level; i++) {
        skillTotal = Math.max(skillTotal, levelData[i].skills[skillIdx]);
    }

    return skillTotal + getRaceSkillBonus(normalizedSkill);
}

function parseClassSkillRequirements(rawRequirements) {
    const parsed = [];
    if (!rawRequirements) return parsed;

    if (Array.isArray(rawRequirements)) {
        rawRequirements.forEach(entry => {
            if (typeof entry !== 'string') return;
            const match = entry.trim().match(/^(.*?)(\d+)$/);
            if (!match) return;
            const skillName = match[1].trim();
            const required = parseInt(match[2], 10);
            const normalizedSkill = normalizeSkillKey(skillName);
            if (normalizedSkill && !Number.isNaN(required)) {
                parsed.push({ skill: normalizedSkill, required });
            }
        });
        return parsed;
    }

    if (typeof rawRequirements === 'object') {
        for (const [skillName, required] of Object.entries(rawRequirements)) {
            const normalizedSkill = normalizeSkillKey(skillName);
            const requiredValue = parseInt(required, 10);
            if (normalizedSkill && !Number.isNaN(requiredValue)) {
                parsed.push({ skill: normalizedSkill, required: requiredValue });
            }
        }
    }

    return parsed;
}

function parseStatBonusValue(rawValue) {
    if (rawValue === null || rawValue === undefined) return 0;
    if (typeof rawValue === 'number') return rawValue;
    const text = rawValue.toString().trim();
    if (!text || text === '-') return 0;
    const match = text.match(/[+-]?\d+/);
    return match ? parseInt(match[0], 10) : 0;
}

function calculateStatProgression() {
    const baseStats = getStats();
    const raceInfo = getSelectedRace();
    const racialStats = (raceInfo && raceInfo.stats) ? raceInfo.stats : {};
    const computed = [];

    for (let level = 1; level <= 30; level++) {
        const previous = level === 1
            ? {
                str: baseStats.str + (parseInt(racialStats.str, 10) || 0),
                dex: baseStats.dex + (parseInt(racialStats.dex, 10) || 0),
                con: baseStats.con + (parseInt(racialStats.con, 10) || 0),
                int: baseStats.int + (parseInt(racialStats.int, 10) || 0),
                wis: baseStats.wis + (parseInt(racialStats.wis, 10) || 0),
                cha: baseStats.cha + (parseInt(racialStats.cha, 10) || 0)
            }
            : computed[level - 2];
        const current = {
            str: previous.str,
            dex: previous.dex,
            con: previous.con,
            int: previous.int,
            wis: previous.wis,
            cha: previous.cha
        };
        const appliedBonuses = [];

        if (level === 1 && raceInfo) {
            STAT_KEYS.forEach(statKey => {
                const bonus = parseInt(racialStats[statKey], 10) || 0;
                if (bonus !== 0) {
                    appliedBonuses.push(`${raceInfo.name} ${bonus > 0 ? '+' : ''}${bonus} ${STAT_LABELS[statKey]}`);
                }
            });
        }

        const increaseChoice = levelData[level - 1].statIncrease || '';
        if (level % 4 === 0 && increaseChoice && STAT_KEYS.includes(increaseChoice)) {
            current[increaseChoice] += 1;
            appliedBonuses.push(`Level-up +1 ${STAT_LABELS[increaseChoice]}`);
        }

        const selectedClass = levelData[level - 1].class;
        if (selectedClass && classData[selectedClass]) {
            const classLevel = getClassLevelUpTo(selectedClass, level);
            const extras = classData[selectedClass].extras || [];

            extras.forEach(extra => {
                const statKey = normalizeStatKey(extra.name);
                if (!statKey || !Array.isArray(extra.values)) return;
                const bonus = parseStatBonusValue(extra.values[classLevel - 1]);
                if (bonus !== 0) {
                    current[statKey] += bonus;
                    appliedBonuses.push(`${selectedClass} ${bonus > 0 ? '+' : ''}${bonus} ${STAT_LABELS[statKey]}`);
                }
            });
        }

        const selectedFeat = levelData[level - 1].feats && levelData[level - 1].feats[0];
        if (selectedFeat && featData[selectedFeat] && featData[selectedFeat].effects && featData[selectedFeat].effects.stats) {
            const featStats = featData[selectedFeat].effects.stats;
            for (const [rawKey, rawValue] of Object.entries(featStats)) {
                const statKey = normalizeStatKey(rawKey);
                if (!statKey) continue;
                const bonus = parseStatBonusValue(rawValue);
                if (bonus !== 0) {
                    current[statKey] += bonus;
                    appliedBonuses.push(`${selectedFeat} ${bonus > 0 ? '+' : ''}${bonus} ${STAT_LABELS[statKey]}`);
                }
            }
        }

        computed.push({ ...current, appliedBonuses });
    }

    levelStatData = computed;
}

function getStatsAtLevel(level) {
    if (!level || level < 1 || level > 30) return getStats();
    if (!levelStatData[level - 1]) {
        calculateStatProgression();
    }
    return levelStatData[level - 1] || getStats();
}

function calculateMulticlassProgression() {
    console.log('\n%c=== MULTICLASS PROGRESSION CALCULATION ===', 'color: blue; font-weight: bold;');
    calculateStatProgression();

    // Calculate for each level
    for (let level = 1; level <= 30; level++) {
        const selectedClass = levelData[level - 1].class;
        
        if (!selectedClass) {
            // No class selected at this level - carry forward previous level's stats
            if (level > 1) {
                levelData[level - 1].bab = levelData[level - 2].bab;
                levelData[level - 1].fort = levelData[level - 2].fort;
                levelData[level - 1].ref = levelData[level - 2].ref;
                levelData[level - 1].will = levelData[level - 2].will;
                levelData[level - 1].hp = levelData[level - 2].hp;
            } else {
                levelData[level - 1].bab = 0;
                levelData[level - 1].fort = 0;
                levelData[level - 1].ref = 0;
                levelData[level - 1].will = 0;
                levelData[level - 1].hp = 0;
            }
            continue;
        }

        console.log(`%cLevel ${level}`, 'color: green; font-weight: bold;');
        console.log(`  Selected class: ${selectedClass}`);

        const classInfo = classData[selectedClass];
        if (!classInfo) {
            console.warn(`  ⚠ Class ${selectedClass} not found in classData`);
            continue;
        }

        // Track class levels only UP TO this level
        const classLevels = {};
        for (let lv = 1; lv <= level; lv++) {
            const cls = levelData[lv - 1].class;
            if (cls) {
                if (!classLevels[cls]) classLevels[cls] = [];
                classLevels[cls].push(lv);
            }
        }

        console.log('  Classes selected up to this level:', classLevels);

        // Use class LEVEL COUNT of each class selected so far
        let totalBAB = 0;
        let maxFort = 0, maxRef = 0, maxWill = 0;
        let totalHP = 0;
        let fortBonus = 0, refBonus = 0, willBonus = 0;

        console.log('  Checking all classes selected so far:');
        
        for (const [cls, levels] of Object.entries(classLevels)) {
            const classLevel = levels.length;
            console.log(`    ${cls}: class level = ${classLevel} (taken at character levels ${levels.join(', ')})`);

            const clsInfo = classData[cls];
            if (!clsInfo) {
                console.warn(`      ⚠ Class ${cls} not found`);
                continue;
            }

            // levelProgression is [BAB, Fort, Ref, Will, HP] - 0-indexed
            const progressionLength = clsInfo.levelProgression ? clsInfo.levelProgression.length : 0;
            const progressionIndex = Math.min(classLevel, progressionLength) - 1;

            if (progressionIndex >= 0 && clsInfo.levelProgression && clsInfo.levelProgression[progressionIndex]) {
                const prog = clsInfo.levelProgression[progressionIndex];
                const bab = prog[0];
                const baseFort = prog[1];
                const baseRef = prog[2];
                const baseWill = prog[3];
                const hp = prog[4];
                
                console.log(`      levelProgression[${progressionIndex}] = [BAB:${bab}, Fort:${baseFort}, Ref:${baseRef}, Will:${baseWill}, HP:${hp}]`);
                
                totalBAB += bab;
                maxFort = Math.max(maxFort, baseFort);
                maxRef = Math.max(maxRef, baseRef);
                maxWill = Math.max(maxWill, baseWill);
                totalHP += hp;
                
                console.log(`      Running totals - BAB sum: ${totalBAB}, Fort max: ${maxFort}, Ref max: ${maxRef}, Will max: ${maxWill}, HP sum: ${totalHP}`);
            } else {
                console.warn(`      ⚠ No levelProgression data for ${cls} class level ${classLevel}`);
            }
        }

        // Apply ability modifier bonuses from stats at this level
        const levelStats = getStatsAtLevel(level);
        const levelMods = getAbilityModifiers(levelStats);
        fortBonus = levelMods.con;
        refBonus = levelMods.dex;
        willBonus = levelMods.wis;

        // Check for feat bonuses to saves
        const selectedFeat = levelData[level - 1].feats[0];
        if (selectedFeat && featData[selectedFeat] && featData[selectedFeat].effects && featData[selectedFeat].effects.ac) {
            // Feats might have save bonuses in their effects
            // This would be custom logic per game
        }

        const finalFort = maxFort + fortBonus;
        const finalRef = maxRef + refBonus;
        const finalWill = maxWill + willBonus;

        levelData[level - 1].bab = totalBAB;
        levelData[level - 1].fort = finalFort;
        levelData[level - 1].ref = finalRef;
        levelData[level - 1].will = finalWill;
        levelData[level - 1].hp = totalHP;

        console.log(`  Final values (with ability bonuses):`);
        console.log(`    BAB: ${totalBAB} (sum of all classes)`);
        console.log(`    Fort: ${finalFort} (max ${maxFort} + ability ${fortBonus})`);
        console.log(`    Ref: ${finalRef} (max ${maxRef} + ability ${refBonus})`);
        console.log(`    Will: ${finalWill} (max ${maxWill} + ability ${willBonus})`);
        console.log(`    HP: ${totalHP} (sum of all classes)`);
    }

    console.log('\n%c=== END MULTICLASS CALCULATION ===\n', 'color: blue; font-weight: bold;');
}

function updateGrid() {
    console.log('%c=== UPDATING GRID ===', 'color: purple; font-weight: bold;');
    calculateMulticlassProgression();

    const tbody = document.getElementById('levelGrid');
    tbody.innerHTML = '';
    const classes = [''].concat(Object.keys(classData).sort());

    for (let level = 1; level <= 30; level++) {
        const row = document.createElement('tr');
        
        // Level number
        const lvlCell = document.createElement('td');
        lvlCell.textContent = level;
        row.appendChild(lvlCell);

        // Class select
        const classCell = document.createElement('td');
        const classSelect = document.createElement('select');
        classSelect.id = `class_${level}`;
        classSelect.onchange = () => {
            const previousClass = levelData[level - 1].class;
            const newClass = classSelect.value;
            console.log(`User changed level ${level} class to: ${newClass}`);
            
            // Validate class requirements before allowing selection
            if (newClass) {
                const classInfo = classData[newClass];
                if (classInfo) {
                    const classReqs = classInfo.requirements || {};
                    const errors = [];
                    calculateStatProgression();
                    const stats = getStatsAtLevel(level);
                    const race = document.getElementById('raceSelect').value;

                    // Check class max level cap
                    if (classInfo.maxLevel) {
                        let classCountExcludingCurrent = 0;
                        for (let i = 0; i < levelData.length; i++) {
                            if (i === (level - 1)) continue;
                            if (levelData[i].class && levelData[i].class.toLowerCase() === newClass.toLowerCase()) {
                                classCountExcludingCurrent++;
                            }
                        }
                        const resultingClassLevel = classCountExcludingCurrent + 1;
                        const maxLevel = parseInt(classInfo.maxLevel);
                        if (resultingClassLevel > maxLevel) {
                            errors.push(`${newClass} max level is ${maxLevel} (this would make class level ${resultingClassLevel})`);
                        }
                    }

                    // Check race requirement
                    if (race && classReqs.race) {
                        const raceValid = classReqs.race.some(r => r.toLowerCase() === race.toLowerCase());
                        if (!raceValid) {
                            errors.push(`${newClass} requires race: ${classReqs.race.join(' or ')}`);
                        }
                    }

                    // Check BAB requirement
                    if (classReqs.bab) {
                        const babRequired = parseInt(classReqs.bab);
                        const babHave = levelData[level - 1].bab;
                        if (babHave < babRequired) {
                            errors.push(`${newClass} requires BAB +${babRequired} (you have +${babHave} at level ${level})`);
                        }
                    }

                    // Check feat requirements
                    if (classReqs.feats && Array.isArray(classReqs.feats) && classReqs.feats.length > 0) {
                        const priorFeats = getAllOwnedFeatNamesPriorTo(level);
                        const missingFeats = classReqs.feats.filter(reqFeat => 
                            !priorFeats.some(f => f.toLowerCase() === reqFeat.toLowerCase())
                        );
                        if (missingFeats.length > 0) {
                            errors.push(`${newClass} requires feats: ${missingFeats.join(', ')} (take them at earlier levels)`);
                        }
                    }

                    // Check class skill requirements
                    const classSkillReqs = parseClassSkillRequirements(classReqs.skills);
                    classSkillReqs.forEach(({ skill, required }) => {
                        const effectiveSkill = getEffectiveSkillAtLevel(level, skill);
                        if (effectiveSkill === null) {
                            errors.push(`${newClass} has unsupported skill requirement key: ${skill}`);
                            return;
                        }
                        if (effectiveSkill < required) {
                            errors.push(`${newClass} requires ${skill} ${required} (you have ${effectiveSkill} at level ${level})`);
                        }
                    });

                    if (errors.length > 0) {
                        alert(`Cannot select ${newClass} at level ${level}:\n\n${errors.join('\n')}`);
                        classSelect.value = previousClass;
                        return;
                    }
                }
            }

            levelData[level - 1].class = newClass;
            calculateMulticlassProgression();
            updateGrid();
            validateCharacterRealtime();
        };
        classes.forEach(cls => {
            const option = document.createElement('option');
            option.value = cls;
            option.textContent = cls || '---';
            if (levelData[level - 1].class === cls) option.selected = true;
            classSelect.appendChild(option);
        });
        classCell.appendChild(classSelect);
        row.appendChild(classCell);

        // BAB
        const babCell = document.createElement('td');
        const babVal = levelData[level - 1].bab;
        babCell.textContent = babVal >= 0 ? '+' + babVal : babVal;
        row.appendChild(babCell);

        // Fort
        const fortCell = document.createElement('td');
        const fortVal = levelData[level - 1].fort;
        fortCell.textContent = fortVal >= 0 ? '+' + fortVal : fortVal;
        row.appendChild(fortCell);

        // Ref
        const refCell = document.createElement('td');
        const refVal = levelData[level - 1].ref;
        refCell.textContent = refVal >= 0 ? '+' + refVal : refVal;
        row.appendChild(refCell);

        // Will
        const willCell = document.createElement('td');
        const willVal = levelData[level - 1].will;
        willCell.textContent = willVal >= 0 ? '+' + willVal : willVal;
        row.appendChild(willCell);

        // HP
        const hpCell = document.createElement('td');
        hpCell.textContent = levelData[level - 1].hp;
        row.appendChild(hpCell);

        // Class feats
        const classFeatsCell = document.createElement('td');
        const selectedClass = levelData[level - 1].class;

        if (selectedClass) {
            const classLevelForRow = getClassLevelUpTo(selectedClass, level);
            if (classLevelForRow === 1) {
                const classProficiencies = getClassProficiencyFeatsForClass(selectedClass);
                classProficiencies.forEach(prof => {
                    const label = document.createElement('span');
                    label.className = 'feat-label';
                    label.textContent = `Class: ${prof}`;
                    classFeatsCell.appendChild(label);
                });
            }
        }

        if (level === 1) {
            const racialProficiencies = getRaceProficiencyFeats();
            racialProficiencies.forEach(racialFeat => {
                const label = document.createElement('span');
                label.className = 'feat-label';
                label.textContent = `Racial: ${racialFeat}`;
                classFeatsCell.appendChild(label);
            });
        }

        if (selectedClass && classData[selectedClass] && classData[selectedClass].feats) {
            const classFeat = classData[selectedClass].feats[level - 1];
            if (classFeat && classFeat !== 'Bonus Feat') {
                const label = document.createElement('span');
                label.className = 'feat-label';
                label.textContent = classFeat;
                classFeatsCell.appendChild(label);
            }
        }
        row.appendChild(classFeatsCell);

        // Feats selector
        const featsCell = document.createElement('td');
        const isBonus = BONUS_FEAT_LEVELS.includes(level);
        const hasClassFeat = selectedClass && classData[selectedClass] && classData[selectedClass].feats && classData[selectedClass].feats[level - 1] === 'Bonus Feat';

        if (isBonus || hasClassFeat) {
            const existingFeat = (levelData[level - 1].feats && levelData[level - 1].feats[0]) || '';
            if (existingFeat) {
                const stats = getStats();
                const mods = getAbilityModifiers(stats);
                const existingFeatErrors = validateFeatRequirements(level, existingFeat, stats, mods)
                    .filter(issue => issue.severity === 'error');
                if (existingFeatErrors.length > 0) {
                    levelData[level - 1].feats = [];
                }
            }

            const featSelect = document.createElement('select');
            featSelect.id = `feat_${level}`;
            featSelect.onchange = () => {
                const previousFeat = (levelData[level - 1].feats && levelData[level - 1].feats[0]) || '';
                const newFeat = featSelect.value;

                if (newFeat) {
                    const stats = getStats();
                    const mods = getAbilityModifiers(stats);
                    const featErrors = validateFeatRequirements(level, newFeat, stats, mods)
                        .filter(issue => issue.severity === 'error');

                    if (featErrors.length > 0) {
                        alert(`Cannot select ${newFeat} at level ${level}:\n\n${featErrors.map(issue => issue.message.replace(/^❌\s*/, '')).join('\n')}`);
                        featSelect.value = previousFeat;
                        return;
                    }
                }

                levelData[level - 1].feats = [newFeat].filter(f => f);
                console.log(`Level ${level} feat changed to: ${newFeat}`);
                updateGrid();
                validateCharacterRealtime();
            };
            
            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = '-- Select Feat --';
            featSelect.appendChild(emptyOption);

            Object.keys(featData).sort().forEach(feat => {
                // Filter out epic feats if not at epic level (21+)
                const isEpicFeat = selectedClass && classData[selectedClass] && 
                                   classData[selectedClass].epicBonusFeats && 
                                   classData[selectedClass].epicBonusFeats.includes(feat);
                
                if (isEpicFeat && level < 21) {
                    return; // Skip epic feats for non-epic levels
                }
                
                const option = document.createElement('option');
                option.value = feat;
                option.textContent = feat;
                if (levelData[level - 1].feats.includes(feat)) option.selected = true;
                featSelect.appendChild(option);
            });
            featsCell.appendChild(featSelect);
        } else {
            featsCell.textContent = '---';
        }
        row.appendChild(featsCell);

        tbody.appendChild(row);
    }

    updateStatGrid();
}

function updateSkillGrid() {
    const tbody = document.getElementById('skillGrid');
    tbody.innerHTML = '';

    for (let level = 1; level <= 30; level++) {
        const row = document.createElement('tr');
        
        // Level number
        const lvlCell = document.createElement('td');
        lvlCell.textContent = level;
        row.appendChild(lvlCell);

        // Skills
        for (let skillIdx = 0; skillIdx < SKILL_LIST.length; skillIdx++) {
            const skillCell = document.createElement('td');
            const skillInput = document.createElement('input');
            skillInput.type = 'number';
            skillInput.className = 'skill-input';
            skillInput.min = '0';
            skillInput.max = '50';
            const skillKey = SKILL_LIST[skillIdx];
            const raceBonus = getRaceSkillBonus(skillKey);
            const baseValue = levelData[level - 1].skills[skillIdx];
            skillInput.value = baseValue + raceBonus;
            skillInput.onchange = () => {
                const effectiveValue = Math.max(0, parseInt(skillInput.value) || 0);
                const baseRankValue = Math.max(0, effectiveValue - raceBonus);
                levelData[level - 1].skills[skillIdx] = baseRankValue;
                // Carry skills down to future levels (supports both increase and decrease)
                for (let nextLevel = level; nextLevel < 30; nextLevel++) {
                    levelData[nextLevel].skills[skillIdx] = baseRankValue;
                }
                updateSkillGrid();
                validateCharacterRealtime();
            };
            skillCell.appendChild(skillInput);
            row.appendChild(skillCell);
        }

        tbody.appendChild(row);
    }
}

function updateStatGrid() {
    const tbody = document.getElementById('statGrid');
    if (!tbody) return;

    calculateStatProgression();
    tbody.innerHTML = '';

    for (let level = 1; level <= 30; level++) {
        const row = document.createElement('tr');
        const levelStats = getStatsAtLevel(level);

        const lvlCell = document.createElement('td');
        lvlCell.textContent = level;
        row.appendChild(lvlCell);

        const increaseCell = document.createElement('td');
        if (level % 4 === 0) {
            const statSelect = document.createElement('select');
            statSelect.id = `stat_increase_${level}`;

            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = '-- Select Stat --';
            statSelect.appendChild(emptyOption);

            STAT_KEYS.forEach(statKey => {
                const option = document.createElement('option');
                option.value = statKey;
                option.textContent = STAT_LABELS[statKey];
                if ((levelData[level - 1].statIncrease || '') === statKey) {
                    option.selected = true;
                }
                statSelect.appendChild(option);
            });

            statSelect.onchange = () => {
                levelData[level - 1].statIncrease = statSelect.value || '';
                calculateMulticlassProgression();
                updateGrid();
                validateCharacterRealtime();
            };

            increaseCell.appendChild(statSelect);
        } else {
            increaseCell.textContent = '---';
        }
        row.appendChild(increaseCell);

        STAT_KEYS.forEach(statKey => {
            const statCell = document.createElement('td');
            statCell.textContent = formatStatWithModifier(levelStats[statKey]);
            row.appendChild(statCell);
        });

        const sourceCell = document.createElement('td');
        sourceCell.className = 'stat-source';
        sourceCell.textContent = levelStats.appliedBonuses && levelStats.appliedBonuses.length > 0
            ? levelStats.appliedBonuses.join(', ')
            : '---';
        row.appendChild(sourceCell);

        tbody.appendChild(row);
    }
}

function getSelectedFeatsPriorTo(beforeLevel) {
    const feats = [];
    for (let i = 0; i < beforeLevel; i++) {
        if (levelData[i].feats && levelData[i].feats.length > 0) {
            feats.push(...levelData[i].feats);
        }
    }
    return feats;
}

function getClassLevelUpTo(className, upToLevel) {
    if (!className) return 0;
    let count = 0;
    for (let i = 0; i < upToLevel; i++) {
        const selectedClass = levelData[i].class;
        if (selectedClass && selectedClass.toLowerCase() === className.toLowerCase()) {
            count++;
        }
    }
    return count;
}

function hasFeatPrerequisite(featName, beforeLevel) {
    if (!featData[featName]) return false;
    const reqs = featData[featName].requirements || {};
    
    if (!reqs.feats || reqs.feats.length === 0) return true;
    
    const priorFeats = getAllOwnedFeatNamesPriorTo(beforeLevel);
    return reqs.feats.some(prereqFeat =>
        priorFeats.some(owned => owned.toLowerCase() === prereqFeat.toLowerCase())
    );
}

function validateFeatRequirements(level, featName, stats, mods) {
    const issues = [];
    
    if (!featData[featName]) {
        issues.push({ level, type: 'feat', message: `❌ Feat "${featName}" not found in database` });
        return issues;
    }

    const reqs = featData[featName].requirements || {};

    // Check minimum character level requirement
    if (reqs.level) {
        const levelRequired = parseInt(reqs.level);
        if (level < levelRequired) {
            issues.push({ level, type: 'feat', message: `❌ ${featName} requires character level ${levelRequired} (current level ${level})`, severity: 'error' });
        }
    }

    // Check BAB requirement
    if (reqs.bab) {
        const babNeeded = parseInt(reqs.bab);
        const babHave = levelData[level - 1].bab;
        if (babHave < babNeeded) {
            issues.push({ level, type: 'feat', message: `❌ ${featName} requires BAB +${babNeeded} (have +${babHave})`, severity: 'error' });
        }
    }

    // Check stat requirements
    if (reqs.stats && Object.keys(reqs.stats).length > 0) {
        for (const [stat, required] of Object.entries(reqs.stats)) {
            const statKey = normalizeStatKey(stat) || stat.toLowerCase();
            const statHave = stats[statKey];
            if (statHave && statHave < required) {
                issues.push({ level, type: 'feat', message: `❌ ${featName} requires ${stat} ${required} (have ${statHave})`, severity: 'error' });
            }
        }
    }

    // Check feat prerequisites (other feats must be taken first)
    if (reqs.feats && reqs.feats.length > 0) {
        const priorFeats = [
            ...getAllOwnedFeatNamesPriorTo(level),
            ...getClassProficiencyFeatsUpTo(level + 1)
        ];
        const missingPrereqs = reqs.feats.filter(prereq =>
            !priorFeats.some(f => f.toLowerCase() === prereq.toLowerCase())
        );
        if (missingPrereqs.length > 0) {
            issues.push({ level, type: 'feat', message: `❌ ${featName} requires prior feats: ${missingPrereqs.join(', ')}`, severity: 'error' });
        }
    }

    // Check skill requirements
    if (reqs.skills && Object.keys(reqs.skills).length > 0) {
        const raceInfo = getSelectedRace();
        const raceSkillBonuses = raceInfo && raceInfo.skills ? raceInfo.skills : {};

        for (const [skill, required] of Object.entries(reqs.skills)) {
            const normalizedSkill = normalizeSkillKey(skill);
            if (!normalizedSkill) {
                issues.push({ level, type: 'feat', message: `⚠️ ${featName} has unsupported skill requirement key: ${skill}`, severity: 'warning' });
                continue;
            }

            const skillIdx = SKILL_LIST.findIndex(s => s === normalizedSkill);
            let skillTotal = 0;
            for (let i = 0; i < level; i++) {
                skillTotal = Math.max(skillTotal, levelData[i].skills[skillIdx]);
            }

            const raceSkillBonusRaw = raceSkillBonuses[normalizedSkill] ?? raceSkillBonuses[skill] ?? 0;
            const raceSkillBonus = parseInt(raceSkillBonusRaw, 10) || 0;
            const effectiveSkillTotal = skillTotal + raceSkillBonus;

            const requiredValue = parseInt(required, 10) || 0;
            if (effectiveSkillTotal < requiredValue) {
                issues.push({ level, type: 'feat', message: `❌ ${featName} requires ${normalizedSkill} ${requiredValue} (have ${effectiveSkillTotal})`, severity: 'error' });
            }
        }
    }

    // Check class requirements
    if (reqs.class && Array.isArray(reqs.class) && reqs.class.length > 0) {
        const classReqs = reqs.class;
        const requirementLabels = [];
        let meetsAnyClassRequirement = false;

        for (const classReq of classReqs) {
            if (typeof classReq === 'string') {
                const classLevel = getClassLevelUpTo(classReq, level);
                requirementLabels.push(classReq);
                if (classLevel > 0) {
                    meetsAnyClassRequirement = true;
                }
                continue;
            }

            if (typeof classReq === 'object' && classReq.name) {
                const requiredClassName = classReq.name;
                const requiredClassLevel = parseInt(classReq.level ?? classReq.levels ?? 1);
                const classLevel = getClassLevelUpTo(requiredClassName, level);
                requirementLabels.push(`${requiredClassName} ${requiredClassLevel}`);
                if (classLevel >= requiredClassLevel) {
                    meetsAnyClassRequirement = true;
                }
            }
        }

        if (!meetsAnyClassRequirement && requirementLabels.length > 0) {
            issues.push({ level, type: 'feat', message: `❌ ${featName} requires class progression: ${requirementLabels.join(' or ')}`, severity: 'error' });
        }
    }

    return issues;
}

function validateCharacterRealtime() {
    console.log('\n%c=== REAL-TIME CHARACTER VALIDATION ===', 'color: orange; font-weight: bold;');
    const race = document.getElementById('raceSelect').value;
    calculateStatProgression();
    const issues = [];

    if (!race) {
        issues.push({ level: 0, type: 'race', message: '❌ No race selected', severity: 'error' });
    }

    // Validate each level
    for (let level = 1; level <= 30; level++) {
        const selectedClass = levelData[level - 1].class;
        const levelStats = getStatsAtLevel(level);
        const levelMods = getAbilityModifiers(levelStats);

        if (!selectedClass) continue;

        const classInfo = classData[selectedClass];
        if (!classInfo) {
            issues.push({ level, type: 'class', message: `❌ Class ${selectedClass} not found`, severity: 'error' });
            continue;
        }

        // Check class REQUIREMENTS first (race, alignment, BAB, feats, stats)
        const classReqs = classInfo.requirements || {};

        // Check class max level cap
        if (classInfo.maxLevel) {
            const classLevelAtThisPoint = getClassLevelUpTo(selectedClass, level);
            const maxLevel = parseInt(classInfo.maxLevel);
            if (classLevelAtThisPoint > maxLevel) {
                issues.push({ level, type: 'class', message: `❌ Level ${level}: ${selectedClass} exceeds max class level ${maxLevel} (currently ${classLevelAtThisPoint})`, severity: 'error' });
            }
        }

        // Check race/class compatibility
        if (race && classReqs.race) {
            const requiredRaces = classReqs.race;
            const raceValid = requiredRaces.some(r => r.toLowerCase() === race.toLowerCase());
            if (!raceValid) {
                issues.push({ level, type: 'class', message: `❌ Level ${level}: ${selectedClass} requires race: ${requiredRaces.join(' or ')}`, severity: 'error' });
            }
        }

        // Check alignment requirement
        if (classReqs.alignment) {
            // Note: This would need alignment tracking in the UI
            // For now, just log it exists
            console.log(`  Alignment requirement: ${classReqs.alignment}`);
        }

        // Check BAB requirement
        if (classReqs.bab) {
            const babRequired = parseInt(classReqs.bab);
            const babHave = levelData[level - 1].bab;
            if (babHave < babRequired) {
                issues.push({ level, type: 'class', message: `❌ Level ${level}: ${selectedClass} requires BAB +${babRequired} (have +${babHave})`, severity: 'error' });
            }
        }

        // Check feat requirements (must have taken these feats previously)
        if (classReqs.feats && Array.isArray(classReqs.feats) && classReqs.feats.length > 0) {
            const priorFeats = getAllOwnedFeatNamesPriorTo(level);
            const missingFeats = classReqs.feats.filter(reqFeat => 
                !priorFeats.some(f => f.toLowerCase() === reqFeat.toLowerCase())
            );
            if (missingFeats.length > 0) {
                issues.push({ level, type: 'class', message: `❌ Level ${level}: ${selectedClass} requires feats: ${missingFeats.join(', ')}`, severity: 'error' });
            }
        }

        // Check stat requirements
        if (classReqs.stats && typeof classReqs.stats === 'object') {
            for (const [stat, required] of Object.entries(classReqs.stats)) {
                const statKey = normalizeStatKey(stat) || stat.toLowerCase();
                const statHave = levelStats[statKey];
                if (statHave && statHave < parseInt(required)) {
                    issues.push({ level, type: 'class', message: `❌ Level ${level}: ${selectedClass} requires ${stat} ${required} (have ${statHave})`, severity: 'error' });
                }
            }
        }

        // Check class skill requirements
        const classSkillReqs = parseClassSkillRequirements(classReqs.skills);
        classSkillReqs.forEach(({ skill, required }) => {
            const effectiveSkill = getEffectiveSkillAtLevel(level, skill);
            if (effectiveSkill === null) {
                issues.push({ level, type: 'class', message: `⚠️ Level ${level}: ${selectedClass} has unsupported skill requirement key: ${skill}`, severity: 'warning' });
                return;
            }
            if (effectiveSkill < required) {
                issues.push({ level, type: 'class', message: `❌ Level ${level}: ${selectedClass} requires ${skill} ${required} (have ${effectiveSkill})`, severity: 'error' });
            }
        });

        // Check feat requirements
        const feat = levelData[level - 1].feats[0];
        if (feat) {
            const featIssues = validateFeatRequirements(level, feat, levelStats, levelMods);
            issues.push(...featIssues);
        }
    }

    console.log(`Total issues found: ${issues.length}`);
    const outputDiv = document.getElementById('validationOutput');
    
    if (issues.length === 0) {
        outputDiv.innerHTML = '<span class="valid">✅ Character is valid!</span>';
    } else {
        const errorCount = issues.filter(i => i.severity === 'error').length;
        const warningCount = issues.filter(i => i.severity === 'warning').length;
        const html = `<span class="invalid">Issues found: ${errorCount} errors, ${warningCount} warnings</span><ul>` + 
            issues.map(issue => `<li>Lvl ${issue.level}: ${issue.message}</li>`).join('') + 
            '</ul>';
        outputDiv.innerHTML = html;
    }
}

function validateCharacter() {
    validateCharacterRealtime();
}

function saveCharacter() {
    const character = {
        name: document.getElementById('charName').value,
        race: document.getElementById('raceSelect').value,
        stats: getStats(),
        levels: levelData.map(level => ({
            class: level.class || '',
            feats: level.feats || [],
            statIncrease: level.statIncrease || '',
            skills: level.skills || Array(SKILL_LIST.length).fill(0)
        }))
    };
    localStorage.setItem('dnd_character', JSON.stringify(character));
    console.log('Character saved:', character);
    alert('Character saved!');
}

function loadCharacter() {
    const saved = localStorage.getItem('dnd_character');
    if (saved) {
        try {
            console.log('Loading saved character...');
            const character = JSON.parse(saved);
            document.getElementById('charName').value = character.name || 'New Character';
            document.getElementById('raceSelect').value = character.race || '';
            
            if (character.stats) {
                document.getElementById('stat_str').value = character.stats.str;
                document.getElementById('stat_dex').value = character.stats.dex;
                document.getElementById('stat_con').value = character.stats.con;
                document.getElementById('stat_int').value = character.stats.int;
                document.getElementById('stat_wis').value = character.stats.wis;
                document.getElementById('stat_cha').value = character.stats.cha;
            }

            if (character.levels) {
                levelData = character.levels.map(level => ({
                    class: level.class || '',
                    feats: level.feats || [],
                    statIncrease: level.statIncrease || '',
                    skills: level.skills || Array(SKILL_LIST.length).fill(0),
                    bab: 0,
                    fort: 0,
                    ref: 0,
                    will: 0,
                    hp: 0
                }));
            }

            console.log('Character loaded successfully');
            calculateMulticlassProgression();
            updateGrid();
            updateSkillGrid();
            updateStatGrid();
            validateCharacterRealtime();
        } catch (error) {
            console.error('Error loading character:', error);
        }
    }
}

function newCharacter() {
    console.log('Creating new character');
    document.getElementById('charName').value = 'New Character';
    document.getElementById('raceSelect').value = '';
    document.getElementById('stat_str').value = 10;
    document.getElementById('stat_dex').value = 10;
    document.getElementById('stat_con').value = 10;
    document.getElementById('stat_int').value = 10;
    document.getElementById('stat_wis').value = 10;
    document.getElementById('stat_cha').value = 10;
    levelData = Array(30).fill(null).map(() => ({
        class: '',
        feats: [],
        statIncrease: '',
        skills: Array(SKILL_LIST.length).fill(0),
        bab: 0,
        fort: 0,
        ref: 0,
        will: 0,
        hp: 0
    }));
    document.getElementById('validationOutput').textContent = 'Character created. Ready to build.';
    updateGrid();
    updateSkillGrid();
    updateStatGrid();
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('%c🎭 D&D Character Planner - Initializing...', 'color: green; font-weight: bold;');
    loadData();
});

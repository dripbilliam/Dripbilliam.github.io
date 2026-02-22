let raceData = {};
let classData = {};
let featData = {};

// List of all skills in order
const SKILL_LIST = [
    'animal empathy', 'appraise', 'bluff', 'climb', 'concentration',
    'craft mastery', 'disable trap', 'discipline', 'heal', 'hide', 'intimidate',
    'leadership', 'listen', 'lore', 'move silently', 'open lock', 'parry',
    'perform', 'ride', 'sail', 'search', 'sleight of hand', 'spellcraft',
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

const SKILL_ABILITY_MAP = {
    'animal empathy': ['cha'],
    'appraise': ['int'],
    'bluff': ['cha'],
    'climb': ['str', 'dex'],
    'concentration': ['con'],
    'craft mastery': [],
    'disable trap': ['int'],
    'discipline': ['str'],
    'heal': ['wis'],
    'hide': ['dex'],
    'intimidate': ['cha'],
    'leadership': ['cha'],
    'listen': ['wis'],
    'lore': ['int'],
    'move silently': ['dex'],
    'open lock': ['dex'],
    'parry': ['dex'],
    'perform': ['cha'],
    'ride': ['dex'],
    'sail': ['wis'],
    'search': ['int'],
    'sleight of hand': ['dex'],
    'spellcraft': ['int'],
    'spot': ['wis'],
    'taunt': ['cha'],
    'tumble': ['dex'],
    'use magic device': ['cha'],
    'use trap': ['dex']
};

// Initialize level data with skills
let levelData = Array(30).fill(null).map(() => ({
    class: '',
    feats: [],
    generalFeat: '',
    extraGeneralFeat: '',
    classFeat: '',
    bonusFeat: '',
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
    appliedBonuses: [],
    softStats: {
        str: 10,
        dex: 10,
        con: 10,
        int: 10,
        wis: 10,
        cha: 10
    },
    softBonusTotals: {
        str: 0,
        dex: 0,
        con: 0,
        int: 0,
        wis: 0,
        cha: 0
    },
    softAppliedBonuses: []
}));

const GENERAL_FEAT_LEVELS = [1, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30];
const UI_REFRESH_DEBOUNCE_MS = 80;
let refreshTimer = null;
let pendingSkillGridRefresh = false;
let debugLogsEnabled = false;

function debugLog(...args) {
    if (debugLogsEnabled) console.log(...args);
}

function debugWarn(...args) {
    if (debugLogsEnabled) console.warn(...args);
}

function schedulePlannerRefresh({ includeSkills = false } = {}) {
    pendingSkillGridRefresh = pendingSkillGridRefresh || includeSkills;

    if (refreshTimer) {
        clearTimeout(refreshTimer);
    }

    refreshTimer = setTimeout(() => {
        const shouldRefreshSkills = pendingSkillGridRefresh;
        pendingSkillGridRefresh = false;
        refreshTimer = null;

        updateGrid();
        if (shouldRefreshSkills) {
            updateSkillGrid();
        }
        validateCharacterRealtime();
    }, UI_REFRESH_DEBOUNCE_MS);
}

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
        schedulePlannerRefresh({ includeSkills: true });
    });
}

// Handle stat changes with real-time validation
function handleStatChange() {
    schedulePlannerRefresh({ includeSkills: true });
}

function isKnowWhatImDoingEnabled() {
    const toggle = document.getElementById('knowWhatImDoingToggle');
    return Boolean(toggle && toggle.checked);
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

function hasQuickToMasterFeat() {
    return getRaceFeatNames().some(feat => {
        if (!feat || typeof feat !== 'string') return false;
        const normalizedRaw = feat.trim().toLowerCase();
        const normalizedResolved = (resolveFeatName(feat) || '').toString().trim().toLowerCase();
        return normalizedRaw === 'quick to master' || normalizedResolved === 'quick to master';
    });
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

function shouldIncludeClassFeatureAsFeat(featureName) {
    if (!featureName || typeof featureName !== 'string') return false;
    const normalized = featureName.trim().toLowerCase();
    if (!normalized) return false;
    if (/^(epic\s+)?class\s+feat$/.test(normalized)) return false;
    if (/^(epic\s+)?bonus\s+feat$/.test(normalized)) return false;
    return true;
}

function getClassFeatureFeatNamesUpTo(level, includeCurrentLevel = false) {
    const cappedLevel = Math.min(levelData.length, Math.max(0, includeCurrentLevel ? level : (level - 1)));
    const featureNames = [];

    for (let lv = 1; lv <= cappedLevel; lv++) {
        const selectedClass = levelData[lv - 1].class;
        if (!selectedClass) continue;

        const classFeatureParts = getClassFeatureParts(selectedClass, lv);
        classFeatureParts.forEach(part => {
            if (shouldIncludeClassFeatureAsFeat(part)) {
                featureNames.push(part);
            }
        });
    }

    return Array.from(new Set(featureNames));
}

function addOwnedFeatDetail(container, rawFeatName, sourceLabel, grantedBy = null, gainedLevel = null) {
    if (!rawFeatName || typeof rawFeatName !== 'string') return;
    const resolvedName = resolveFeatName(rawFeatName);
    const key = resolvedName.toLowerCase();

    if (!container.has(key)) {
        container.set(key, {
            name: resolvedName,
            sources: new Set(),
            grantedBy: new Set(),
            gainedLevel: null
        });
    }

    const detail = container.get(key);
    if (sourceLabel) detail.sources.add(sourceLabel);
    if (grantedBy) detail.grantedBy.add(grantedBy);
    if (Number.isInteger(gainedLevel) && gainedLevel > 0) {
        if (!detail.gainedLevel || gainedLevel < detail.gainedLevel) {
            detail.gainedLevel = gainedLevel;
        }
    }
}

function addRemovedFeatDetail(container, rawFeatName, removedBy, reasonText = '', gainedLevel = null) {
    if (!rawFeatName || typeof rawFeatName !== 'string') return;
    const resolvedName = resolveFeatName(rawFeatName);
    const key = resolvedName.toLowerCase();

    if (!container.has(key)) {
        container.set(key, {
            name: resolvedName,
            removedBy: new Set(),
            reasons: new Set(),
            sources: new Set(),
            grantedLevel: null
        });
    }

    const detail = container.get(key);
    if (removedBy) detail.removedBy.add(removedBy);
    if (reasonText) detail.reasons.add(reasonText);
    if (Number.isInteger(gainedLevel) && gainedLevel > 0) {
        if (!detail.grantedLevel || gainedLevel < detail.grantedLevel) {
            detail.grantedLevel = gainedLevel;
        }
    }
}

function addRemovedFeatSources(container, rawFeatName, sourceLabels) {
    if (!rawFeatName || typeof rawFeatName !== 'string') return;
    const key = resolveFeatName(rawFeatName).toLowerCase();
    if (!container.has(key)) return;

    const detail = container.get(key);
    if (!detail || !(detail.sources instanceof Set)) return;

    if (sourceLabels instanceof Set) {
        sourceLabels.forEach(source => {
            if (source) detail.sources.add(source);
        });
        return;
    }

    if (Array.isArray(sourceLabels)) {
        sourceLabels.forEach(source => {
            if (source) detail.sources.add(source);
        });
    }
}

function parseGrantedFeatEntry(entry) {
    if (!entry) return null;
    if (typeof entry === 'string') {
        return { feat: entry, when: 'always' };
    }

    if (typeof entry === 'object' && typeof entry.feat === 'string') {
        return {
            feat: entry.feat,
            when: entry.when ?? 'always'
        };
    }

    return null;
}

function parseRemovedFeatEntry(entry) {
    if (!entry) return null;

    const toExceptSet = (values) => {
        const list = Array.isArray(values) ? values : [];
        return new Set(
            list
                .filter(value => typeof value === 'string' && value.trim())
                .map(value => resolveFeatName(value).toLowerCase())
        );
    };

    if (typeof entry === 'string') {
        return {
            mode: 'exact',
            value: entry,
            when: 'always',
            exceptSet: new Set(),
            reason: ''
        };
    }

    if (typeof entry !== 'object') return null;

    const when = entry.when ?? 'always';
    const exceptSet = toExceptSet(entry.except);
    const reason = typeof entry.reason === 'string' ? entry.reason : '';

    if (typeof entry.feat === 'string') {
        return {
            mode: 'exact',
            value: entry.feat,
            when,
            exceptSet,
            reason
        };
    }

    if (typeof entry.startsWith === 'string') {
        return {
            mode: 'startsWith',
            value: entry.startsWith,
            when,
            exceptSet,
            reason
        };
    }

    if (typeof entry.includes === 'string') {
        return {
            mode: 'includes',
            value: entry.includes,
            when,
            exceptSet,
            reason
        };
    }

    if (typeof entry.regex === 'string') {
        try {
            return {
                mode: 'regex',
                value: new RegExp(entry.regex, 'i'),
                when,
                exceptSet,
                reason
            };
        } catch (error) {
            console.warn('Invalid removeFeats regex rule:', entry.regex, error);
            return null;
        }
    }

    return null;
}

function getRemovedRuleDescription(rule) {
    if (!rule) return 'feat removal rule';
    if (rule.reason) return rule.reason;

    if (rule.mode === 'exact') {
        return `removes ${resolveFeatName(rule.value)}`;
    }

    if (rule.mode === 'startsWith') {
        return `removes feats starting with "${rule.value}"`;
    }

    if (rule.mode === 'includes') {
        return `removes feats containing "${rule.value}"`;
    }

    if (rule.mode === 'regex') {
        return 'removes feats matching configured pattern';
    }

    return 'feat removal rule';
}

function doesRemovedFeatEntryMatch(rule, featName) {
    if (!rule || !featName || typeof featName !== 'string') return false;

    const resolvedName = resolveFeatName(featName);
    const normalizedName = resolvedName.toLowerCase();

    if (rule.exceptSet && rule.exceptSet.has(normalizedName)) {
        return false;
    }

    if (rule.mode === 'exact') {
        return normalizedName === resolveFeatName(rule.value).toLowerCase();
    }

    if (rule.mode === 'startsWith') {
        return normalizedName.startsWith(rule.value.toString().trim().toLowerCase());
    }

    if (rule.mode === 'includes') {
        return normalizedName.includes(rule.value.toString().trim().toLowerCase());
    }

    if (rule.mode === 'regex') {
        return rule.value.test(resolvedName);
    }

    return false;
}

function doesGrantedFeatConditionMatch(when, level, ownedFeatSet = null) {
    const hasOwnedFeat = (featName) => {
        if (!featName || typeof featName !== 'string' || !ownedFeatSet) return false;
        return ownedFeatSet.has(resolveFeatName(featName).toLowerCase());
    };

    if (!when || when === 'always') return true;

    if (typeof when === 'string') {
        const text = when.trim().toLowerCase();
        if (!text || text === 'always') return true;

        const classMatch = text.match(/^class\s*:\s*([^>=<\s]+)\s*>=\s*(\d+)$/);
        if (classMatch) {
            const className = classMatch[1].trim();
            const requiredLevel = parseInt(classMatch[2], 10) || 0;
            return getClassLevelUpTo(className, level) >= requiredLevel;
        }

        const featMatch = text.match(/^feat\s*:\s*(.+)$/);
        if (featMatch) {
            return hasOwnedFeat(featMatch[1].trim());
        }

        return false;
    }

    if (typeof when === 'object') {
        const checks = [];

        const classLevelRule = when.classLevel;
        if (classLevelRule && typeof classLevelRule === 'object') {
            const className = classLevelRule.class;
            const requiredLevel = parseInt(classLevelRule.min, 10) || 0;
            if (!className || typeof className !== 'string') {
                checks.push(false);
            } else {
                checks.push(getClassLevelUpTo(className, level) >= requiredLevel);
            }
        }

        const featsAll = Array.isArray(when.featsAll)
            ? when.featsAll
            : (Array.isArray(when.feats) ? when.feats : []);
        if (featsAll.length > 0) {
            checks.push(featsAll.every(featName => hasOwnedFeat(featName)));
        }

        const featsAny = Array.isArray(when.featsAny) ? when.featsAny : [];
        if (featsAny.length > 0) {
            checks.push(featsAny.some(featName => hasOwnedFeat(featName)));
        }

        const allOf = Array.isArray(when.allOf) ? when.allOf : [];
        if (allOf.length > 0) {
            checks.push(allOf.every(condition => doesGrantedFeatConditionMatch(condition, level, ownedFeatSet)));
        }

        const anyOf = Array.isArray(when.anyOf) ? when.anyOf : [];
        if (anyOf.length > 0) {
            checks.push(anyOf.some(condition => doesGrantedFeatConditionMatch(condition, level, ownedFeatSet)));
        }

        if (checks.length > 0) {
            return checks.every(Boolean);
        }
    }

    return false;
}

function getEffectiveFeatStateAtLevel(level, options = {}) {
    const includeSelectedCurrentLevel = options.includeSelectedCurrentLevel !== false;
    const cappedLevel = Math.max(0, Math.min(levelData.length, level));
    const details = new Map();
    const removedDetails = new Map();

    getRaceFeatNames().forEach(featName => addOwnedFeatDetail(details, featName, 'race', null, 1));

    const classFirstLevels = new Map();
    for (let lv = 1; lv <= cappedLevel; lv++) {
        const selectedClass = levelData[lv - 1].class;
        if (selectedClass) {
            const key = selectedClass.toLowerCase();
            if (!classFirstLevels.has(key)) {
                classFirstLevels.set(key, { className: selectedClass, level: lv });
            }
        }
    }

    Array.from(classFirstLevels.values()).forEach(entry => {
        getClassProficiencyFeatsForClass(entry.className).forEach(featName => {
            addOwnedFeatDetail(details, featName, 'class proficiency', null, entry.level);
        });
    });

    for (let lv = 1; lv <= cappedLevel; lv++) {
        const selectedClass = levelData[lv - 1].class;
        if (selectedClass) {
            const classFeatureParts = getClassFeatureParts(selectedClass, lv);
            classFeatureParts.forEach(part => {
                if (shouldIncludeClassFeatureAsFeat(part)) {
                    addOwnedFeatDetail(details, part, 'class feature', null, lv);
                }
            });
        }

        if (lv < cappedLevel || includeSelectedCurrentLevel) {
            getSelectedFeatsAtLevel(lv).forEach(featName => addOwnedFeatDetail(details, featName, 'selected', null, lv));
        }
    }

    const processedGrantors = new Set();
    let expanded = true;
    while (expanded) {
        expanded = false;

        Array.from(details.values()).forEach(detail => {
            const grantorKey = detail.name.toLowerCase();
            if (processedGrantors.has(grantorKey)) return;
            processedGrantors.add(grantorKey);

            const featInfo = featData[resolveFeatName(detail.name)];
            const grantedFeats = featInfo && featInfo.effects ? featInfo.effects.grantedFeats : null;
            if (!Array.isArray(grantedFeats)) return;
            const ownedFeatSet = new Set(Array.from(details.keys()));

            grantedFeats.forEach(rawGrant => {
                const parsed = parseGrantedFeatEntry(rawGrant);
                if (!parsed || !parsed.feat) return;
                if (!doesGrantedFeatConditionMatch(parsed.when, cappedLevel, ownedFeatSet)) return;

                const grantedName = resolveFeatName(parsed.feat);
                const grantedKey = grantedName.toLowerCase();
                const hadEntry = details.has(grantedKey);
                const grantedLevel = detail.gainedLevel || cappedLevel;
                addOwnedFeatDetail(details, grantedName, 'granted', detail.name, grantedLevel);
                if (!hadEntry) {
                    expanded = true;
                }
            });
        });
    }

    let removedAny = true;
    while (removedAny) {
        removedAny = false;

        const removalSources = Array.from(details.values());
        removalSources.forEach(sourceDetail => {
            const sourceFeatInfo = featData[resolveFeatName(sourceDetail.name)];
            const removalRules = sourceFeatInfo && sourceFeatInfo.effects
                ? sourceFeatInfo.effects.removedFeats
                : null;
            if (!Array.isArray(removalRules) || removalRules.length === 0) return;

            const ownedFeatSet = new Set(Array.from(details.keys()));

            removalRules.forEach(rawRule => {
                const parsedRule = parseRemovedFeatEntry(rawRule);
                if (!parsedRule) return;
                if (!doesGrantedFeatConditionMatch(parsedRule.when, cappedLevel, ownedFeatSet)) return;

                const targetFeats = Array.from(details.values());
                targetFeats.forEach(targetDetail => {
                    const targetKey = targetDetail.name.toLowerCase();
                    const sourceKey = sourceDetail.name.toLowerCase();
                    if (targetKey === sourceKey) return;
                    if (!details.has(targetKey)) return;

                    if (doesRemovedFeatEntryMatch(parsedRule, targetDetail.name)) {
                        const reasonText = getRemovedRuleDescription(parsedRule);
                        addRemovedFeatDetail(removedDetails, targetDetail.name, sourceDetail.name, reasonText, targetDetail.gainedLevel);
                        addRemovedFeatSources(removedDetails, targetDetail.name, targetDetail.sources);
                        details.delete(targetKey);
                        removedAny = true;
                    }
                });
            });
        });
    }

    return {
        details,
        removedDetails
    };
}

function getEffectiveOwnedFeatDetailsAtLevel(level, options = {}) {
    return getEffectiveFeatStateAtLevel(level, options).details;
}

function getGrantedFeatDetailsAtLevel(level) {
    return Array.from(getEffectiveOwnedFeatDetailsAtLevel(level).values())
        .filter(detail => detail.grantedBy.size > 0)
        .sort((left, right) => left.name.localeCompare(right.name));
}

function getRemovedFeatDetailsAtLevel(level) {
    return Array.from(getEffectiveFeatStateAtLevel(level).removedDetails.values())
        .sort((left, right) => left.name.localeCompare(right.name));
}

function getRemovedFeatDetailsGainedAtLevel(level) {
    if (level <= 1) {
        return getRemovedFeatDetailsAtLevel(level);
    }

    const current = getRemovedFeatDetailsAtLevel(level);
    const previousNames = new Set(
        getRemovedFeatDetailsAtLevel(level - 1)
            .map(detail => detail.name.toLowerCase())
    );

    return current.filter(detail => !previousNames.has(detail.name.toLowerCase()));
}

function getGrantedFeatDetailsGainedAtLevel(level) {
    if (level <= 1) {
        return getGrantedFeatDetailsAtLevel(level);
    }

    const current = getGrantedFeatDetailsAtLevel(level);
    const previousNames = new Set(
        getGrantedFeatDetailsAtLevel(level - 1)
            .map(detail => detail.name.toLowerCase())
    );

    return current.filter(detail => !previousNames.has(detail.name.toLowerCase()));
}

function getAllOwnedFeatNamesPriorTo(beforeLevel) {
    const cappedLevel = Math.max(0, beforeLevel - 1);
    return Array.from(getEffectiveOwnedFeatDetailsAtLevel(cappedLevel).values()).map(detail => detail.name);
}

function getSaveBonus(stat) {
    return Math.floor((stat - 10) / 2);
}

function normalizeSkillsArray(skills) {
    const normalized = Array(SKILL_LIST.length).fill(0);
    if (!Array.isArray(skills)) return normalized;

    for (let index = 0; index < SKILL_LIST.length; index++) {
        normalized[index] = parseInt(skills[index], 10) || 0;
    }

    return normalized;
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

function getFeatSkillBonusAtLevel(level, skillKey) {
    const normalizedSkill = normalizeSkillKey(skillKey);
    if (!normalizedSkill) return 0;

    let totalBonus = 0;
    const ownedFeats = getEffectiveOwnedFeatDetailsAtLevel(level);
    ownedFeats.forEach(detail => {
        const featName = resolveFeatName(detail.name);
        const featInfo = featData[featName];
        if (!featInfo || !featInfo.effects || !featInfo.effects.skills) return;

        Object.entries(featInfo.effects.skills).forEach(([rawSkillKey, rawBonus]) => {
            const normalizedEffectSkill = normalizeSkillKey(rawSkillKey);
            if (normalizedEffectSkill !== normalizedSkill) return;
            totalBonus += parseStatBonusValue(rawBonus);
        });
    });

    return totalBonus;
}

function getClassSkillBonusAtLevel(level, skillKey) {
    const normalizedSkill = normalizeSkillKey(skillKey);
    if (!normalizedSkill) return 0;

    let totalBonus = 0;
    const classNames = new Set();
    for (let i = 0; i < level; i++) {
        const className = levelData[i].class;
        if (className) classNames.add(className);
    }

    classNames.forEach(className => {
        const classInfo = classData[className];
        if (!classInfo || !Array.isArray(classInfo.extras)) return;
        const classLevel = getClassLevelUpTo(className, level);
        if (classLevel <= 0) return;

        classInfo.extras.forEach(extra => {
            if (!extra || typeof extra !== 'object') return;
            const normalizedExtraSkill = normalizeSkillKey(extra.name);
            if (normalizedExtraSkill !== normalizedSkill) return;
            if (!Array.isArray(extra.values)) return;

            const rawBonus = extra.values[classLevel - 1];
            totalBonus += parseStatBonusValue(rawBonus);
        });
    });

    return totalBonus;
}

function getTotalSkillBonusAtLevel(level, skillKey) {
    return getRaceSkillBonus(skillKey)
        + getFeatSkillBonusAtLevel(level, skillKey)
        + getClassSkillBonusAtLevel(level, skillKey);
}

function getSkillAbilityBonusAtLevel(level, skillName) {
    const normalizedSkill = normalizeSkillKey(skillName) || (typeof skillName === 'string' ? skillName.toLowerCase() : '');
    const abilityKeys = SKILL_ABILITY_MAP[normalizedSkill];
    if (!Array.isArray(abilityKeys) || abilityKeys.length === 0) return 0;

    const levelStats = getStatsAtLevel(level);
    const mods = getAbilityModifiers(levelStats);

    return abilityKeys.reduce((sum, key) => sum + (mods[key] || 0), 0);
}

function getRawSkillAtLevel(level, skillName) {
    const normalizedSkill = normalizeSkillKey(skillName);
    if (!normalizedSkill) return null;

    const skillIdx = SKILL_LIST.findIndex(s => s === normalizedSkill);
    if (skillIdx < 0) return null;

    let rawSkill = 0;
    for (let i = 0; i < level; i++) {
        const skillValue = parseInt(levelData[i].skills[skillIdx], 10) || 0;
        rawSkill = Math.max(rawSkill, skillValue);
    }

    return rawSkill;
}

function getDisplaySkillTotalAtLevel(level, skillName) {
    const raw = getRawSkillAtLevel(level, skillName);
    if (raw === null) return null;
    return raw + getTotalSkillBonusAtLevel(level, skillName) + getSkillAbilityBonusAtLevel(level, skillName);
}

function getEffectiveSkillAtLevel(level, skillName) {
    return getRawSkillAtLevel(level, skillName);
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

function resolveFeatName(featName) {
    if (!featName || typeof featName !== 'string') return featName;
    if (featData[featName]) return featName;

    const normalized = featName.trim().toLowerCase();
    const match = Object.keys(featData).find(key => key.toLowerCase() === normalized);
    return match || featName;
}

function parseStatBonusValue(rawValue) {
    if (rawValue === null || rawValue === undefined) return 0;
    if (typeof rawValue === 'number') return rawValue;
    const text = rawValue.toString().trim();
    if (!text || text === '-') return 0;
    const match = text.match(/[+-]?\d+/);
    return match ? parseInt(match[0], 10) : 0;
}

function parseStatEffectEntry(rawValue) {
    if (rawValue && typeof rawValue === 'object' && !Array.isArray(rawValue)) {
        const valueRaw = rawValue.value ?? rawValue.amount ?? rawValue.bonus ?? rawValue.modifier ?? 0;
        const value = parseStatBonusValue(valueRaw);
        const isSoft = Boolean(rawValue.soft || rawValue.isSoft || rawValue.softOnly || rawValue.softStat);
        const rawCap = rawValue.softCap ?? rawValue.cap ?? rawValue.softCapTotal;
        const parsedCap = rawCap === null || rawCap === undefined ? null : parseInt(rawCap, 10);
        const softCap = Number.isNaN(parsedCap) ? null : parsedCap;
        return { value, isSoft, softCap };
    }

    return {
        value: parseStatBonusValue(rawValue),
        isSoft: false,
        softCap: null
    };
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
        const previousSoftBonusTotals = level === 1
            ? { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 }
            : { ...(computed[level - 2].softBonusTotals || { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 }) };
        const currentSoftBonusTotals = { ...previousSoftBonusTotals };
        const softAppliedBonuses = [];

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
                const parsedEffect = parseStatEffectEntry(extra.values[classLevel - 1]);
                const bonus = parsedEffect.value;
                if (bonus !== 0) {
                    if (parsedEffect.isSoft) {
                        let appliedSoftBonus = bonus;
                        if (parsedEffect.softCap !== null) {
                            const alreadyApplied = currentSoftBonusTotals[statKey] || 0;
                            const remaining = parsedEffect.softCap - alreadyApplied;
                            appliedSoftBonus = Math.max(0, Math.min(bonus, remaining));
                        }

                        if (appliedSoftBonus !== 0) {
                            currentSoftBonusTotals[statKey] += appliedSoftBonus;
                            const capText = parsedEffect.softCap !== null ? ` (soft cap ${parsedEffect.softCap})` : '';
                            softAppliedBonuses.push(`${selectedClass} ${appliedSoftBonus > 0 ? '+' : ''}${appliedSoftBonus} ${STAT_LABELS[statKey]} (soft)${capText}`);
                        }
                    } else {
                        current[statKey] += bonus;
                        appliedBonuses.push(`${selectedClass} ${bonus > 0 ? '+' : ''}${bonus} ${STAT_LABELS[statKey]}`);
                    }
                }
            });
        }

        const selectedFeats = getSelectedFeatsAtLevel(level);
        selectedFeats.forEach(selectedFeat => {
            if (!selectedFeat || !featData[selectedFeat] || !featData[selectedFeat].effects || !featData[selectedFeat].effects.stats) {
                return;
            }
            const featStats = featData[selectedFeat].effects.stats;
            for (const [rawKey, rawValue] of Object.entries(featStats)) {
                const statKey = normalizeStatKey(rawKey);
                if (!statKey) continue;
                const parsedEffect = parseStatEffectEntry(rawValue);
                const bonus = parsedEffect.value;
                if (bonus !== 0) {
                    if (parsedEffect.isSoft) {
                        let appliedSoftBonus = bonus;
                        if (parsedEffect.softCap !== null) {
                            const alreadyApplied = currentSoftBonusTotals[statKey] || 0;
                            const remaining = parsedEffect.softCap - alreadyApplied;
                            appliedSoftBonus = Math.max(0, Math.min(bonus, remaining));
                        }

                        if (appliedSoftBonus !== 0) {
                            currentSoftBonusTotals[statKey] += appliedSoftBonus;
                            const capText = parsedEffect.softCap !== null ? ` (soft cap ${parsedEffect.softCap})` : '';
                            softAppliedBonuses.push(`${selectedFeat} ${appliedSoftBonus > 0 ? '+' : ''}${appliedSoftBonus} ${STAT_LABELS[statKey]} (soft)${capText}`);
                        }
                    } else {
                        current[statKey] += bonus;
                        appliedBonuses.push(`${selectedFeat} ${bonus > 0 ? '+' : ''}${bonus} ${STAT_LABELS[statKey]}`);
                    }
                }
            }
        });

        const softStats = {
            str: current.str + (currentSoftBonusTotals.str || 0),
            dex: current.dex + (currentSoftBonusTotals.dex || 0),
            con: current.con + (currentSoftBonusTotals.con || 0),
            int: current.int + (currentSoftBonusTotals.int || 0),
            wis: current.wis + (currentSoftBonusTotals.wis || 0),
            cha: current.cha + (currentSoftBonusTotals.cha || 0)
        };

        computed.push({
            ...current,
            appliedBonuses,
            softStats,
            softBonusTotals: currentSoftBonusTotals,
            softAppliedBonuses
        });
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
    debugLog('\n%c=== MULTICLASS PROGRESSION CALCULATION ===', 'color: blue; font-weight: bold;');
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

        debugLog(`%cLevel ${level}`, 'color: green; font-weight: bold;');
        debugLog(`  Selected class: ${selectedClass}`);

        const classInfo = classData[selectedClass];
        if (!classInfo) {
            debugWarn(`  ⚠ Class ${selectedClass} not found in classData`);
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

        debugLog('  Classes selected up to this level:', classLevels);

        // Use class LEVEL COUNT of each class selected so far
        let totalBAB = 0;
        let totalFort = 0, totalRef = 0, totalWill = 0;
        let totalHP = 0;
        let fortBonus = 0, refBonus = 0, willBonus = 0;

        debugLog('  Checking all classes selected so far:');
        
        for (const [cls, levels] of Object.entries(classLevels)) {
            const classLevel = levels.length;
            debugLog(`    ${cls}: class level = ${classLevel} (taken at character levels ${levels.join(', ')})`);

            const clsInfo = classData[cls];
            if (!clsInfo) {
                debugWarn(`      ⚠ Class ${cls} not found`);
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
                
                debugLog(`      levelProgression[${progressionIndex}] = [BAB:${bab}, Fort:${baseFort}, Ref:${baseRef}, Will:${baseWill}, HP:${hp}]`);
                
                totalBAB += bab;
                totalFort += baseFort;
                totalRef += baseRef;
                totalWill += baseWill;
                totalHP += hp;
                
                debugLog(`      Running totals - BAB sum: ${totalBAB}, Fort sum: ${totalFort}, Ref sum: ${totalRef}, Will sum: ${totalWill}, HP sum: ${totalHP}`);
            } else {
                debugWarn(`      ⚠ No levelProgression data for ${cls} class level ${classLevel}`);
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

        const finalFort = totalFort + fortBonus;
        const finalRef = totalRef + refBonus;
        const finalWill = totalWill + willBonus;

        levelData[level - 1].bab = totalBAB;
        levelData[level - 1].fort = finalFort;
        levelData[level - 1].ref = finalRef;
        levelData[level - 1].will = finalWill;
        levelData[level - 1].hp = totalHP;

        debugLog(`  Final values (with ability bonuses):`);
        debugLog(`    BAB: ${totalBAB} (sum of all classes)`);
        debugLog(`    Fort: ${finalFort} (sum ${totalFort} + ability ${fortBonus})`);
        debugLog(`    Ref: ${finalRef} (sum ${totalRef} + ability ${refBonus})`);
        debugLog(`    Will: ${finalWill} (sum ${totalWill} + ability ${willBonus})`);
        debugLog(`    HP: ${totalHP} (sum of all classes)`);
    }

    debugLog('\n%c=== END MULTICLASS CALCULATION ===\n', 'color: blue; font-weight: bold;');
}

function updateGrid() {
    debugLog('%c=== UPDATING GRID ===', 'color: purple; font-weight: bold;');
    calculateMulticlassProgression();

    const tbody = document.getElementById('levelGrid');
    tbody.innerHTML = '';
    const classes = [''].concat(Object.keys(classData).sort());
    const removedFeatDetailsByBuild = getRemovedFeatDetailsAtLevel(levelData.length);

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
            debugLog(`User changed level ${level} class to: ${newClass}`);
            
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
                    const babRequired = getClassBabRequirement(classReqs);
                    if (babRequired !== null) {
                        const babHave = levelData[level - 1].bab;
                        if (babHave < babRequired) {
                            errors.push(`${newClass} requires BAB +${babRequired} (you have +${babHave} at level ${level})`);
                        }
                    }

                    // Check feat requirements
                    if (classReqs.feats) {
                        const priorFeats = getAllOwnedFeatNamesPriorTo(level);
                        const missingFeats = getMissingClassFeatRequirements(classReqs.feats, priorFeats);
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

                    // Check class progression requirements (anyOf / noneOf class blocks)
                    const classRequirementErrors = getClassRequirementErrors(classReqs.class, level);
                    classRequirementErrors.forEach(message => {
                        errors.push(`${newClass} ${message}`);
                    });

                    if (errors.length > 0 && !isKnowWhatImDoingEnabled()) {
                        alert(`Cannot select ${newClass} at level ${level}:\n\n${errors.join('\n')}`);
                        classSelect.value = previousClass;
                        return;
                    }
                }
            }

            levelData[level - 1].class = newClass;
            calculateMulticlassProgression();
            schedulePlannerRefresh({ includeSkills: true });
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
        const classFeatureParts = getClassFeatureParts(selectedClass, level);
        const classFeatSlotContext = getClassFeatSlotContext(selectedClass, level);
        const hasClassFeatSlotFromTrack = Boolean(classFeatSlotContext);
        const hasClassFeatSlot = hasClassFeatSlotFromTrack || hasClassFeatureFlag(selectedClass, level, 'class feat');
        const classFeatSlotLabel = getClassFeatSlotLabel(classFeatSlotContext);
        const hasBonusFeatFromClass = hasClassFeatureFlag(selectedClass, level, 'bonus feat');
        const hasGeneralFeatSlot = GENERAL_FEAT_LEVELS.includes(level);
        const hasQuickToMasterSlot = level === 1 && hasQuickToMasterFeat();
        const hasBonusFeatSlot = hasBonusFeatFromClass;
        const removedFeatDetailsAtLevel = getRemovedFeatDetailsAtLevel(level);
        const removedFeatDetails = removedFeatDetailsByBuild.filter(detail => detail.grantedLevel === level);
        const removedFeatDetailsByName = removedFeatDetailsByBuild;
        const removedFeatNameSet = new Set([
            ...removedFeatDetailsAtLevel.map(detail => detail.name.toLowerCase()),
            ...removedFeatDetails.map(detail => detail.name.toLowerCase()),
            ...removedFeatDetailsByName.map(detail => detail.name.toLowerCase())
        ]);
        const removedFeatDetailMap = new Map();
        removedFeatDetailsAtLevel.forEach(detail => {
            removedFeatDetailMap.set(detail.name.toLowerCase(), detail);
        });
        removedFeatDetails.forEach(detail => {
            const key = detail.name.toLowerCase();
            if (!removedFeatDetailMap.has(key)) {
                removedFeatDetailMap.set(key, detail);
            }
        });
        removedFeatDetailsByName.forEach(detail => {
            const key = detail.name.toLowerCase();
            if (!removedFeatDetailMap.has(key)) {
                removedFeatDetailMap.set(key, detail);
            }
        });
        const renderedRemovedClassFeatNames = new Set();
        const renderedRemovedRacialFeatNames = new Set();

        const createRemovedFeatLabel = (detail) => {
            const label = document.createElement('span');
            label.className = 'feat-label removed-feat';
            label.textContent = detail.name;

            const removedByText = Array.from(detail.removedBy).join(', ');
            const reasonText = Array.from(detail.reasons).join('; ');
            const tooltipParts = [];
            if (removedByText) tooltipParts.push(`Removed by: ${removedByText}`);
            if (reasonText) tooltipParts.push(`Reason: ${reasonText}`);
            label.title = tooltipParts.join('\n');

            return label;
        };

        const appendRemovedClassFeatLabel = (featName) => {
            const key = resolveFeatName(featName).toLowerCase();
            const detail = removedFeatDetailMap.get(key);
            if (!detail || renderedRemovedClassFeatNames.has(key)) return;
            classFeatsCell.appendChild(createRemovedFeatLabel(detail));
            renderedRemovedClassFeatNames.add(key);
        };

        const appendRemovedRacialFeatLabel = (featName) => {
            const key = resolveFeatName(featName).toLowerCase();
            const detail = removedFeatDetailMap.get(key);
            if (!detail || renderedRemovedRacialFeatNames.has(key)) return;
            racialFeatsCell.appendChild(createRemovedFeatLabel(detail));
            renderedRemovedRacialFeatNames.add(key);
        };

        if (selectedClass) {
            const classLevelForRow = getClassLevelUpTo(selectedClass, level);
            if (classLevelForRow === 1) {
                const classProficiencies = getClassProficiencyFeatsForClass(selectedClass);
                classProficiencies.forEach(prof => {
                    if (removedFeatNameSet.has(resolveFeatName(prof).toLowerCase())) {
                        appendRemovedClassFeatLabel(prof);
                        return;
                    }
                    const label = document.createElement('span');
                    label.className = 'feat-label';
                    label.textContent = `Class: ${prof}`;
                    classFeatsCell.appendChild(label);
                });
            }
        }

        if (classFeatureParts.length > 0) {
            classFeatureParts.forEach(classFeat => {
                if (removedFeatNameSet.has(resolveFeatName(classFeat).toLowerCase())) {
                    appendRemovedClassFeatLabel(classFeat);
                    return;
                }
                const label = document.createElement('span');
                label.className = 'feat-label';
                label.textContent = classFeat;
                classFeatsCell.appendChild(label);
            });
        }

        const grantedFeatDetails = getGrantedFeatDetailsGainedAtLevel(level);
        grantedFeatDetails.forEach(detail => {
            if (removedFeatNameSet.has(detail.name.toLowerCase())) {
                appendRemovedClassFeatLabel(detail.name);
                return;
            }
            const label = document.createElement('span');
            label.className = 'feat-label granted-feat';
            label.textContent = detail.name;
            label.title = `Granted by: ${Array.from(detail.grantedBy).join(', ')}`;
            classFeatsCell.appendChild(label);
        });

        const removedClassFeatDetails = removedFeatDetails.filter(detail => !detail.sources.has('race'));
        removedClassFeatDetails.forEach(detail => {
            appendRemovedClassFeatLabel(detail.name);
        });
        row.appendChild(classFeatsCell);

        const racialFeatsCell = document.createElement('td');
        const removedRacialFeatDetails = removedFeatDetails.filter(detail => detail.sources.has('race'));
        if (level === 1) {
            const racialFeats = getRaceFeatNames();
            if (racialFeats.length > 0) {
                racialFeats.forEach(racialFeat => {
                    if (removedFeatNameSet.has(resolveFeatName(racialFeat).toLowerCase())) {
                        appendRemovedRacialFeatLabel(racialFeat);
                        return;
                    }
                    const label = document.createElement('span');
                    label.className = 'feat-label';
                    label.textContent = racialFeat;
                    racialFeatsCell.appendChild(label);
                });
            }

            if (removedRacialFeatDetails.length > 0) {
                removedRacialFeatDetails.forEach(detail => {
                    appendRemovedRacialFeatLabel(detail.name);
                });
            }

            if (racialFeats.length === 0 && removedRacialFeatDetails.length === 0) {
                racialFeatsCell.textContent = '---';
            }
        } else {
            if (removedRacialFeatDetails.length > 0) {
                removedRacialFeatDetails.forEach(detail => {
                    appendRemovedRacialFeatLabel(detail.name);
                });
            } else {
                racialFeatsCell.textContent = '---';
            }
        }
        row.appendChild(racialFeatsCell);

        const legacyFeat = (Array.isArray(levelData[level - 1].feats) && levelData[level - 1].feats[0]) || '';
        const legacyExtraFeat = (Array.isArray(levelData[level - 1].feats) && levelData[level - 1].feats[1]) || '';
        if (legacyFeat && !levelData[level - 1].classFeat && !levelData[level - 1].bonusFeat && !levelData[level - 1].generalFeat) {
            if (hasGeneralFeatSlot) {
                levelData[level - 1].generalFeat = legacyFeat;
            } else if (hasClassFeatSlot && !hasBonusFeatSlot) {
                levelData[level - 1].classFeat = legacyFeat;
            } else {
                levelData[level - 1].bonusFeat = legacyFeat;
            }
            levelData[level - 1].feats = [];
        }

        if (hasQuickToMasterSlot && legacyExtraFeat && !levelData[level - 1].extraGeneralFeat) {
            levelData[level - 1].extraGeneralFeat = legacyExtraFeat;
        }

        // Class feat selector
        const classFeatCell = document.createElement('td');
        const classFeatSelect = document.createElement('select');
        classFeatSelect.id = `classFeat_${level}`;
        const classFeatBlankOption = document.createElement('option');
        classFeatBlankOption.value = '';
        classFeatBlankOption.textContent = `-- Select ${classFeatSlotLabel} --`;
        classFeatSelect.appendChild(classFeatBlankOption);

        // Bonus feat selector
        const bonusFeatCell = document.createElement('td');
        const bonusFeatSelect = document.createElement('select');
        bonusFeatSelect.id = `bonusFeat_${level}`;
        const bonusFeatBlankOption = document.createElement('option');
        bonusFeatBlankOption.value = '';
        bonusFeatBlankOption.textContent = '-- Select Bonus Feat --';
        bonusFeatSelect.appendChild(bonusFeatBlankOption);
        const bonusFeatOptionsRaw = getAvailableBonusFeatOptions(selectedClass, level);

        // General feat selector
        const generalFeatCell = document.createElement('td');
        const generalFeatSelect = document.createElement('select');
        generalFeatSelect.id = `generalFeat_${level}`;
        const generalFeatBlankOption = document.createElement('option');
        generalFeatBlankOption.value = '';
        generalFeatBlankOption.textContent = '-- Select General Feat --';
        generalFeatSelect.appendChild(generalFeatBlankOption);

        let quickToMasterFeatSelect = null;
        if (hasQuickToMasterSlot) {
            quickToMasterFeatSelect = document.createElement('select');
            quickToMasterFeatSelect.id = `quickToMasterFeat_${level}`;
            const quickToMasterBlankOption = document.createElement('option');
            quickToMasterBlankOption.value = '';
            quickToMasterBlankOption.textContent = '-- Select Quick To Master Feat --';
            quickToMasterFeatSelect.appendChild(quickToMasterBlankOption);
        } else if (levelData[level - 1].extraGeneralFeat) {
            levelData[level - 1].extraGeneralFeat = '';
        }

        const allFeatNames = Object.keys(featData).sort();
        const classFeatOptionsRaw = hasClassFeatSlotFromTrack
            ? getAvailableClassFeatOptions(selectedClass, level, classFeatSlotContext)
            : allFeatNames;
        const classFeatOptions = filterAlreadyTakenFeats(
            classFeatOptionsRaw,
            level,
            'classFeat',
            levelData[level - 1].classFeat || ''
        );
        const generalFeatOptions = filterAlreadyTakenFeats(
            allFeatNames,
            level,
            'generalFeat',
            levelData[level - 1].generalFeat || ''
        );
        const quickToMasterFeatOptions = quickToMasterFeatSelect
            ? filterAlreadyTakenFeats(
                allFeatNames,
                level,
                'extraGeneralFeat',
                levelData[level - 1].extraGeneralFeat || ''
            )
            : [];
        const bonusFeatOptions = filterAlreadyTakenFeats(
            bonusFeatOptionsRaw,
            level,
            'bonusFeat',
            levelData[level - 1].bonusFeat || ''
        );

        classFeatOptions.forEach(feat => {
            const classOption = document.createElement('option');
            classOption.value = feat;
            classOption.textContent = feat;
            if (levelData[level - 1].classFeat === feat) classOption.selected = true;
            classFeatSelect.appendChild(classOption);
        });

        generalFeatOptions.forEach(feat => {
            const generalOption = document.createElement('option');
            generalOption.value = feat;
            generalOption.textContent = feat;
            if (levelData[level - 1].generalFeat === feat) generalOption.selected = true;
            generalFeatSelect.appendChild(generalOption);
        });

        if (quickToMasterFeatSelect) {
            quickToMasterFeatOptions.forEach(feat => {
                const quickToMasterOption = document.createElement('option');
                quickToMasterOption.value = feat;
                quickToMasterOption.textContent = feat;
                if (levelData[level - 1].extraGeneralFeat === feat) quickToMasterOption.selected = true;
                quickToMasterFeatSelect.appendChild(quickToMasterOption);
            });
        }

        bonusFeatOptions.forEach(feat => {
            const bonusOption = document.createElement('option');
            bonusOption.value = feat;
            bonusOption.textContent = feat;
            if (levelData[level - 1].bonusFeat === feat) bonusOption.selected = true;
            bonusFeatSelect.appendChild(bonusOption);
        });

        if (!hasClassFeatSlot) {
            levelData[level - 1].classFeat = '';
            classFeatSelect.value = '';
            classFeatSelect.disabled = true;
            classFeatSelect.title = 'No class feat available at this level';
        } else if (hasClassFeatSlotFromTrack) {
            const selectedClassFeat = levelData[level - 1].classFeat || '';
            const matchingClassFeat = selectedClassFeat
                ? classFeatOptions.find(feat => feat.toLowerCase() === selectedClassFeat.toLowerCase())
                : '';
            const isAllowedClassFeat = selectedClassFeat ? Boolean(matchingClassFeat) : true;

            if (!isAllowedClassFeat) {
                levelData[level - 1].classFeat = '';
                classFeatSelect.value = '';
            } else if (matchingClassFeat && matchingClassFeat !== selectedClassFeat) {
                levelData[level - 1].classFeat = matchingClassFeat;
                classFeatSelect.value = matchingClassFeat;
            }

            if (classFeatOptions.length === 0) {
                classFeatSelect.title = `No available ${classFeatSlotLabel} options configured`;
            }
        }

        if (!hasBonusFeatSlot) {
            levelData[level - 1].bonusFeat = '';
            bonusFeatSelect.value = '';
            bonusFeatSelect.disabled = true;
            bonusFeatSelect.title = 'No bonus feat available at this level';
        } else {
            const selectedBonusFeat = levelData[level - 1].bonusFeat || '';
            const matchingBonusFeat = selectedBonusFeat
                ? bonusFeatOptions.find(feat => feat.toLowerCase() === selectedBonusFeat.toLowerCase())
                : '';
            const isAllowedBonusFeat = selectedBonusFeat ? Boolean(matchingBonusFeat) : true;

            if (!isAllowedBonusFeat) {
                levelData[level - 1].bonusFeat = '';
                bonusFeatSelect.value = '';
            } else if (matchingBonusFeat && matchingBonusFeat !== selectedBonusFeat) {
                levelData[level - 1].bonusFeat = matchingBonusFeat;
                bonusFeatSelect.value = matchingBonusFeat;
            }

            if (bonusFeatOptions.length === 0) {
                bonusFeatSelect.title = level >= 21
                    ? 'No epicBonusFeats configured for this class'
                    : 'No availableBonusFeats configured for this class';
            }
        }

        if (!hasGeneralFeatSlot) {
            levelData[level - 1].generalFeat = '';
            generalFeatSelect.value = '';
            generalFeatSelect.disabled = true;
            generalFeatSelect.title = 'No general feat available at this level';
        }

        classFeatSelect.onchange = () => {
            const previousFeat = levelData[level - 1].classFeat || '';
            const newFeat = classFeatSelect.value;

            if (newFeat) {
                const stats = getStats();
                const mods = getAbilityModifiers(stats);
                const featErrors = validateFeatRequirements(level, newFeat, stats, mods)
                    .filter(issue => issue.severity === 'error');

                if (featErrors.length > 0 && !isKnowWhatImDoingEnabled()) {
                    alert(`Cannot select ${newFeat} at level ${level}:\n\n${featErrors.map(issue => issue.message.replace(/^❌\s*/, '')).join('\n')}`);
                    classFeatSelect.value = previousFeat;
                    return;
                }
            }

            levelData[level - 1].classFeat = newFeat;
            levelData[level - 1].feats = [];
            console.log(`Level ${level} class feat changed to: ${newFeat}`);
            schedulePlannerRefresh({ includeSkills: true });
        };

        bonusFeatSelect.onchange = () => {
            const previousFeat = levelData[level - 1].bonusFeat || '';
            const newFeat = bonusFeatSelect.value;

            if (newFeat) {
                const stats = getStats();
                const mods = getAbilityModifiers(stats);
                const featErrors = validateFeatRequirements(level, newFeat, stats, mods)
                    .filter(issue => issue.severity === 'error');

                if (featErrors.length > 0 && !isKnowWhatImDoingEnabled()) {
                    alert(`Cannot select ${newFeat} at level ${level}:\n\n${featErrors.map(issue => issue.message.replace(/^❌\s*/, '')).join('\n')}`);
                    bonusFeatSelect.value = previousFeat;
                    return;
                }
            }

            levelData[level - 1].bonusFeat = newFeat;
            levelData[level - 1].feats = [];
            console.log(`Level ${level} bonus feat changed to: ${newFeat}`);
            schedulePlannerRefresh({ includeSkills: true });
        };

        generalFeatSelect.onchange = () => {
            const previousFeat = levelData[level - 1].generalFeat || '';
            const newFeat = generalFeatSelect.value;

            if (newFeat) {
                const stats = getStats();
                const mods = getAbilityModifiers(stats);
                const featErrors = validateFeatRequirements(level, newFeat, stats, mods)
                    .filter(issue => issue.severity === 'error');

                if (featErrors.length > 0 && !isKnowWhatImDoingEnabled()) {
                    alert(`Cannot select ${newFeat} at level ${level}:\n\n${featErrors.map(issue => issue.message.replace(/^❌\s*/, '')).join('\n')}`);
                    generalFeatSelect.value = previousFeat;
                    return;
                }
            }

            levelData[level - 1].generalFeat = newFeat;
            levelData[level - 1].feats = [];
            console.log(`Level ${level} general feat changed to: ${newFeat}`);
            schedulePlannerRefresh({ includeSkills: true });
        };

        if (quickToMasterFeatSelect) {
            quickToMasterFeatSelect.onchange = () => {
                const previousFeat = levelData[level - 1].extraGeneralFeat || '';
                const newFeat = quickToMasterFeatSelect.value;

                if (newFeat) {
                    const stats = getStats();
                    const mods = getAbilityModifiers(stats);
                    const featErrors = validateFeatRequirements(level, newFeat, stats, mods)
                        .filter(issue => issue.severity === 'error');

                    if (featErrors.length > 0 && !isKnowWhatImDoingEnabled()) {
                        alert(`Cannot select ${newFeat} at level ${level}:\n\n${featErrors.map(issue => issue.message.replace(/^❌\s*/, '')).join('\n')}`);
                        quickToMasterFeatSelect.value = previousFeat;
                        return;
                    }
                }

                levelData[level - 1].extraGeneralFeat = newFeat;
                levelData[level - 1].feats = [];
                console.log(`Level ${level} quick-to-master feat changed to: ${newFeat}`);
                schedulePlannerRefresh({ includeSkills: true });
            };
        }

        classFeatCell.appendChild(classFeatSelect);
        bonusFeatCell.appendChild(bonusFeatSelect);
        generalFeatCell.appendChild(generalFeatSelect);
        if (quickToMasterFeatSelect) {
            generalFeatCell.appendChild(quickToMasterFeatSelect);
        }
        row.appendChild(classFeatCell);
        row.appendChild(bonusFeatCell);
        row.appendChild(generalFeatCell);

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
            const skillContainer = document.createElement('div');
            skillContainer.className = 'skill-cell-wrap';
            const skillInput = document.createElement('input');
            skillInput.type = 'number';
            skillInput.className = 'skill-input';
            skillInput.min = '0';
            skillInput.max = '50';
            const skillKey = SKILL_LIST[skillIdx];
            const rawValue = parseInt(levelData[level - 1].skills[skillIdx], 10) || 0;
            const totalValue = getDisplaySkillTotalAtLevel(level, skillKey);
            skillInput.value = rawValue;

            const skillTotal = document.createElement('span');
            skillTotal.className = 'skill-total';
            skillTotal.textContent = `/ ${totalValue}`;

            skillInput.onchange = () => {
                const baseRankValue = Math.max(0, parseInt(skillInput.value) || 0);
                levelData[level - 1].skills[skillIdx] = baseRankValue;
                // Carry skills down to future levels (supports both increase and decrease)
                for (let nextLevel = level; nextLevel < 30; nextLevel++) {
                    levelData[nextLevel].skills[skillIdx] = baseRankValue;
                }
                updateSkillGrid();
                validateCharacterRealtime();
            };

            skillContainer.appendChild(skillInput);
            skillContainer.appendChild(skillTotal);
            skillCell.appendChild(skillContainer);
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
                updateSkillGrid();
                validateCharacterRealtime();
            };

            increaseCell.appendChild(statSelect);
        } else {
            increaseCell.textContent = '---';
        }
        row.appendChild(increaseCell);

        STAT_KEYS.forEach(statKey => {
            const statCell = document.createElement('td');
            const hardValue = levelStats[statKey];
            const softValue = levelStats.softStats && typeof levelStats.softStats[statKey] === 'number'
                ? levelStats.softStats[statKey]
                : hardValue;

            const statWrap = document.createElement('div');
            statWrap.className = 'skill-cell-wrap';

            const hardValueLabel = document.createElement('span');
            hardValueLabel.className = 'skill-total';
            hardValueLabel.textContent = `${formatStatWithModifier(hardValue)} /`;

            const softValueLabel = document.createElement('span');
            softValueLabel.className = 'skill-total';
            softValueLabel.textContent = formatStatWithModifier(softValue);
            softValueLabel.title = `${STAT_LABELS[statKey]} soft score (not used for prerequisites)`;

            statWrap.appendChild(hardValueLabel);
            statWrap.appendChild(softValueLabel);
            statCell.appendChild(statWrap);
            row.appendChild(statCell);
        });

        const sourceCell = document.createElement('td');
        sourceCell.className = 'stat-source';
        const hardBonusText = levelStats.appliedBonuses && levelStats.appliedBonuses.length > 0
            ? levelStats.appliedBonuses.join(', ')
            : '';
        const softBonusText = levelStats.softAppliedBonuses && levelStats.softAppliedBonuses.length > 0
            ? levelStats.softAppliedBonuses.join(', ')
            : '';

        sourceCell.textContent = [hardBonusText, softBonusText].filter(Boolean).join(', ')
            ? [hardBonusText, softBonusText].filter(Boolean).join(', ')
            : '---';
        row.appendChild(sourceCell);

        tbody.appendChild(row);
    }
}

function getSelectedFeatsPriorTo(beforeLevel) {
    const feats = [];
    for (let i = 0; i < beforeLevel; i++) {
        feats.push(...getSelectedFeatsAtLevel(i + 1));
    }
    return feats;
}

function getSelectedFeatsAtLevel(level) {
    const entry = levelData[level - 1] || {};
    const selected = [];

    if (entry.generalFeat) selected.push(entry.generalFeat);
    if (entry.extraGeneralFeat) selected.push(entry.extraGeneralFeat);
    if (entry.classFeat) selected.push(entry.classFeat);
    if (entry.bonusFeat) selected.push(entry.bonusFeat);

    if (Array.isArray(entry.feats) && entry.feats.length > 0) {
        entry.feats.forEach(feat => {
            if (feat && !selected.some(existing => existing.toLowerCase() === feat.toLowerCase())) {
                selected.push(feat);
            }
        });
    }

    return selected;
}

function getTakenFeatNameSet({ excludeLevel = null, excludeField = '' } = {}) {
    const taken = new Set();

    for (let lv = 1; lv <= levelData.length; lv++) {
        const entry = levelData[lv - 1] || {};
        const selectedByField = [
            { key: 'generalFeat', value: entry.generalFeat },
            { key: 'extraGeneralFeat', value: entry.extraGeneralFeat },
            { key: 'classFeat', value: entry.classFeat },
            { key: 'bonusFeat', value: entry.bonusFeat }
        ];

        selectedByField.forEach(item => {
            if (!item.value) return;
            if (excludeLevel === lv && excludeField === item.key) return;
            taken.add(resolveFeatName(item.value).toLowerCase());
        });

        if (Array.isArray(entry.feats)) {
            entry.feats.forEach(feat => {
                if (!feat || typeof feat !== 'string') return;
                taken.add(resolveFeatName(feat).toLowerCase());
            });
        }
    }

    return taken;
}

function filterAlreadyTakenFeats(options, level, fieldKey, currentValue = '') {
    const taken = getTakenFeatNameSet({ excludeLevel: level, excludeField: fieldKey });
    const currentKey = currentValue
        ? resolveFeatName(currentValue).toLowerCase()
        : '';

    return options.filter(featName => {
        const resolvedName = resolveFeatName(featName);
        const key = resolvedName.toLowerCase();
        if (currentKey && key === currentKey) return true;
        return !taken.has(key);
    });
}

function getClassFeatureParts(selectedClass, level) {
    if (!selectedClass || !classData[selectedClass] || !Array.isArray(classData[selectedClass].feats)) {
        return [];
    }

    const classLevel = getClassLevelUpTo(selectedClass, level);
    if (classLevel <= 0) return [];

    const raw = classData[selectedClass].feats[classLevel - 1];
    if (!raw || typeof raw !== 'string') return [];
    return raw.split(',').map(part => part.trim()).filter(Boolean);
}

function hasClassFeatureFlag(selectedClass, level, flagName) {
    const parts = getClassFeatureParts(selectedClass, level);
    const target = flagName.toLowerCase().trim();
    return parts.some(part => {
        const normalized = part.toLowerCase().trim();
        if (normalized === target) return true;
        if (normalized === `epic ${target}`) return true;
        return false;
    });
}

function getClassFeatTrackEntries(selectedClass) {
    if (!selectedClass || !classData[selectedClass]) return [];
    const rawTracks = classData[selectedClass].classFeatTracks;
    if (!rawTracks) return [];

    if (Array.isArray(rawTracks)) {
        return rawTracks
            .filter(track => track && typeof track === 'object')
            .map((track, index) => ({
                id: track.id || `track_${index + 1}`,
                track
            }));
    }

    if (typeof rawTracks === 'object') {
        return Object.entries(rawTracks)
            .filter(([, track]) => track && typeof track === 'object')
            .map(([id, track]) => ({ id, track }));
    }

    return [];
}

function doesClassFeatSlotMatch(slot, classLevel, characterLevel) {
    if (!slot || typeof slot !== 'object') return false;

    if (Array.isArray(slot.classLevels) && slot.classLevels.length > 0) {
        return slot.classLevels.map(value => parseInt(value, 10)).includes(classLevel);
    }

    if (Array.isArray(slot.levels) && slot.levels.length > 0) {
        return slot.levels.map(value => parseInt(value, 10)).includes(classLevel);
    }

    const classLevelValue = slot.classLevel ?? slot.level;
    if (classLevelValue !== undefined && classLevelValue !== null) {
        return classLevel === (parseInt(classLevelValue, 10) || 0);
    }

    const minClassLevel = slot.minClassLevel;
    const maxClassLevel = slot.maxClassLevel;
    if (minClassLevel !== undefined || maxClassLevel !== undefined) {
        const min = minClassLevel !== undefined ? parseInt(minClassLevel, 10) : Number.NEGATIVE_INFINITY;
        const max = maxClassLevel !== undefined ? parseInt(maxClassLevel, 10) : Number.POSITIVE_INFINITY;
        return classLevel >= min && classLevel <= max;
    }

    const minCharacterLevel = slot.minCharacterLevel;
    const maxCharacterLevel = slot.maxCharacterLevel;
    if (minCharacterLevel !== undefined || maxCharacterLevel !== undefined) {
        const min = minCharacterLevel !== undefined ? parseInt(minCharacterLevel, 10) : Number.NEGATIVE_INFINITY;
        const max = maxCharacterLevel !== undefined ? parseInt(maxCharacterLevel, 10) : Number.POSITIVE_INFINITY;
        return characterLevel >= min && characterLevel <= max;
    }

    return false;
}

function getClassFeatSlotContexts(selectedClass, level) {
    if (!selectedClass || !classData[selectedClass]) return [];
    const classLevel = getClassLevelUpTo(selectedClass, level);
    if (classLevel <= 0) return [];

    const contexts = [];
    getClassFeatTrackEntries(selectedClass).forEach(entry => {
        const slots = Array.isArray(entry.track.slots) ? entry.track.slots : [];
        slots.forEach((slot, slotIndex) => {
            if (!doesClassFeatSlotMatch(slot, classLevel, level)) return;
            const count = Math.max(1, parseInt(slot.count, 10) || 1);
            for (let index = 0; index < count; index++) {
                contexts.push({
                    trackId: entry.id,
                    track: entry.track,
                    slot,
                    slotIndex,
                    optionIndex: index
                });
            }
        });
    });

    return contexts;
}

function getClassFeatSlotContext(selectedClass, level) {
    const contexts = getClassFeatSlotContexts(selectedClass, level);
    return contexts.length > 0 ? contexts[0] : null;
}

function getClassFeatSlotLabel(slotContext) {
    if (!slotContext || !slotContext.track) return 'Class Feat';
    if (slotContext.slot && typeof slotContext.slot.label === 'string' && slotContext.slot.label.trim()) {
        return slotContext.slot.label.trim();
    }
    const tier = (slotContext.slot && slotContext.slot.tier)
        ? slotContext.slot.tier.toString().trim().toLowerCase()
        : '';

    if (tier === 'epic') {
        return slotContext.track.epicLabel || slotContext.track.label || 'Epic Class Feat';
    }

    return slotContext.track.label || 'Class Feat';
}

function getAvailableClassFeatOptions(selectedClass, level, slotContext = null) {
    const effectiveContext = slotContext || getClassFeatSlotContext(selectedClass, level);
    if (!effectiveContext || !effectiveContext.track) return [];

    const optionEntries = Array.isArray(effectiveContext.track.options)
        ? effectiveContext.track.options
        : [];
    const slotTier = effectiveContext.slot && effectiveContext.slot.tier
        ? effectiveContext.slot.tier.toString().trim().toLowerCase()
        : '';

    const priorOwnedFeatSet = new Set(
        Array.from(getEffectiveOwnedFeatDetailsAtLevel(level, { includeSelectedCurrentLevel: false }).keys())
    );

    const seen = new Set();
    const options = [];

    optionEntries.forEach(entry => {
        let featName = '';
        let when = 'always';
        let optionTier = '';

        if (typeof entry === 'string') {
            featName = entry;
        } else if (entry && typeof entry === 'object') {
            featName = entry.feat || '';
            when = entry.when ?? 'always';
            optionTier = entry.tier ? entry.tier.toString().trim().toLowerCase() : '';
        }

        if (!featName || typeof featName !== 'string') return;
        if (slotTier && optionTier && slotTier !== optionTier) return;
        if (!doesGrantedFeatConditionMatch(when, level, priorOwnedFeatSet)) return;

        const resolvedFeatName = resolveFeatName(featName);
        const key = resolvedFeatName.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        options.push(resolvedFeatName);
    });

    return options.sort((left, right) => left.localeCompare(right));
}

function getAvailableBonusFeatOptions(selectedClass, level) {
    if (!selectedClass || !classData[selectedClass]) return [];

    const classInfo = classData[selectedClass];
    const sourceList = level >= 21
        ? (Array.isArray(classInfo.epicBonusFeats) ? classInfo.epicBonusFeats : [])
        : (Array.isArray(classInfo.availableBonusFeats) ? classInfo.availableBonusFeats : []);

    const seen = new Set();
    const options = [];

    sourceList.forEach(featName => {
        if (!featName || typeof featName !== 'string') return;
        const resolvedFeatName = resolveFeatName(featName);
        const key = resolvedFeatName.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        options.push(resolvedFeatName);
    });

    return options.sort((a, b) => a.localeCompare(b));
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

function getClassBabRequirement(classReqs) {
    const raw = classReqs?.bab ?? classReqs?.baseAttackBonus;
    if (raw === null || raw === undefined) return null;
    const match = raw.toString().match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
}

function getClassLevelMapPriorTo(level) {
    const levelLimit = Math.max(0, (parseInt(level, 10) || 0) - 1);
    const counts = new Map();

    for (let index = 0; index < levelLimit; index++) {
        const className = (levelData[index] && levelData[index].class) ? levelData[index].class : '';
        if (!className) continue;
        const key = className.toLowerCase();
        counts.set(key, (counts.get(key) || 0) + 1);
    }

    return counts;
}

function getClassLevelsFromMap(classLevelMap, className) {
    if (!className || !classLevelMap) return 0;
    return classLevelMap.get(className.toLowerCase()) || 0;
}

function getClassRequirementErrors(rawClassRequirement, level) {
    if (!rawClassRequirement) return [];

    const classLevelMap = getClassLevelMapPriorTo(level);
    const errors = [];

    const evaluateRequirement = (requirement, fallbackType = null) => {
        if (!requirement || typeof requirement !== 'object') return;

        const type = (requirement.type || fallbackType || '').toString().toLowerCase();
        const classList = Array.isArray(requirement.classes)
            ? requirement.classes.filter(name => typeof name === 'string' && name.trim().length > 0)
            : [];
        const requiredLevels = Math.max(1, parseInt(requirement.levels ?? requirement.level ?? 1, 10) || 1);
        const excludeList = Array.isArray(requirement.exclude)
            ? requirement.exclude.filter(name => typeof name === 'string' && name.trim().length > 0)
            : [];

        if (type === 'anyof') {
            if (classList.length > 0) {
                const meetsAny = classList.some(className => getClassLevelsFromMap(classLevelMap, className) >= requiredLevels);
                if (!meetsAny) {
                    errors.push(`requires ${requiredLevels} level(s) in one of: ${classList.join(' / ')}`);
                }
            }

            if (excludeList.length > 0) {
                const invalidOwned = excludeList.filter(className => getClassLevelsFromMap(classLevelMap, className) > 0);
                if (invalidOwned.length > 0) {
                    errors.push(`cannot have levels in: ${invalidOwned.join(', ')}`);
                }
            }

            return;
        }

        if (type === 'noneof') {
            if (classList.length > 0) {
                const invalidOwned = classList.filter(className => getClassLevelsFromMap(classLevelMap, className) > 0);
                if (invalidOwned.length > 0) {
                    errors.push(`cannot have levels in: ${invalidOwned.join(', ')}`);
                }
            }

            return;
        }

        if (classList.length > 0) {
            const meetsAny = classList.some(className => getClassLevelsFromMap(classLevelMap, className) >= requiredLevels);
            if (!meetsAny) {
                errors.push(`requires ${requiredLevels} level(s) in one of: ${classList.join(' / ')}`);
            }
        }
    };

    if (Array.isArray(rawClassRequirement)) {
        rawClassRequirement.forEach(requirement => {
            if (typeof requirement === 'string') {
                evaluateRequirement({ type: 'anyOf', levels: 1, classes: [requirement] });
                return;
            }
            evaluateRequirement(requirement);
        });
        return errors;
    }

    if (typeof rawClassRequirement === 'object') {
        if (rawClassRequirement.anyOf) {
            evaluateRequirement(rawClassRequirement.anyOf, 'anyOf');
        }

        if (rawClassRequirement.noneOf) {
            evaluateRequirement(rawClassRequirement.noneOf, 'noneOf');
        }

        if (rawClassRequirement.type || rawClassRequirement.classes || rawClassRequirement.exclude) {
            evaluateRequirement(rawClassRequirement);
        }
    }

    return errors;
}

function getMissingClassFeatRequirements(rawFeatRequirements, priorFeats) {
    if (!Array.isArray(rawFeatRequirements) || rawFeatRequirements.length === 0) return [];

    const priorFeatSet = new Set(
        priorFeats
            .filter(Boolean)
            .map(feat => resolveFeatName(feat).toLowerCase())
    );

    const hasFeat = (featName) => {
        if (!featName || typeof featName !== 'string') return false;
        return priorFeatSet.has(resolveFeatName(featName).toLowerCase());
    };

    const missing = [];

    rawFeatRequirements.forEach(req => {
        if (typeof req === 'string') {
            if (!hasFeat(req)) {
                missing.push(req);
            }
            return;
        }

        if (!req || typeof req !== 'object' || !req.type || !Array.isArray(req.values)) {
            return;
        }

        const values = req.values.filter(v => typeof v === 'string');
        if (values.length === 0) return;

        if (req.type === 'anyOf') {
            const hasAny = values.some(value => hasFeat(value));
            if (!hasAny) {
                missing.push(`one of: ${values.join(' / ')}`);
            }
            return;
        }

        if (req.type === 'allOf') {
            values.forEach(value => {
                if (!hasFeat(value)) {
                    missing.push(value);
                }
            });
            return;
        }

        if (req.type === 'noneOf') {
            const invalidOwned = values.filter(value => hasFeat(value));
            if (invalidOwned.length > 0) {
                missing.push(`must not have: ${invalidOwned.join(', ')}`);
            }
        }
    });

    return missing;
}

function validateFeatRequirements(level, featName, stats, mods) {
    const issues = [];
    const resolvedFeatName = resolveFeatName(featName);
    
    if (!featData[resolvedFeatName]) {
        issues.push({ level, type: 'feat', message: `❌ Feat "${featName}" not found in database` });
        return issues;
    }

    const reqs = featData[resolvedFeatName].requirements || {};

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
    if (reqs.feats) {
        const priorFeats = Array.from(
            getEffectiveOwnedFeatDetailsAtLevel(level, { includeSelectedCurrentLevel: false }).values()
        ).map(detail => detail.name);

        const priorFeatSet = new Set(
            priorFeats
                .filter(Boolean)
                .map(f => resolveFeatName(f).toLowerCase())
        );

        const hasFeat = (name) => {
            if (!name || typeof name !== 'string') return false;
            return priorFeatSet.has(resolveFeatName(name).toLowerCase());
        };

        const missingPrereqs = [];

        const processRequirement = (requirement) => {
            if (!requirement) return;

            if (typeof requirement === 'string') {
                if (!hasFeat(requirement)) {
                    missingPrereqs.push(requirement);
                }
                return;
            }

            if (Array.isArray(requirement)) {
                requirement.forEach(processRequirement);
                return;
            }

            if (typeof requirement !== 'object') return;

            if (requirement.type && Array.isArray(requirement.values)) {
                const values = requirement.values.filter(v => typeof v === 'string');
                if (values.length === 0) return;

                if (requirement.type === 'anyOf') {
                    if (!values.some(hasFeat)) {
                        missingPrereqs.push(`one of: ${values.join(' / ')}`);
                    }
                    return;
                }

                if (requirement.type === 'allOf') {
                    values.forEach(value => {
                        if (!hasFeat(value)) missingPrereqs.push(value);
                    });
                    return;
                }

                if (requirement.type === 'noneOf') {
                    const invalidOwned = values.filter(hasFeat);
                    if (invalidOwned.length > 0) {
                        missingPrereqs.push(`must not have: ${invalidOwned.join(', ')}`);
                    }
                }
                return;
            }

            const anyOf = Array.isArray(requirement.anyOf) ? requirement.anyOf.filter(v => typeof v === 'string') : [];
            const allOf = Array.isArray(requirement.allOf) ? requirement.allOf.filter(v => typeof v === 'string') : [];
            const noneOf = Array.isArray(requirement.noneOf) ? requirement.noneOf.filter(v => typeof v === 'string') : [];

            if (anyOf.length > 0 && !anyOf.some(hasFeat)) {
                missingPrereqs.push(`one of: ${anyOf.join(' / ')}`);
            }
            allOf.forEach(value => {
                if (!hasFeat(value)) missingPrereqs.push(value);
            });
            if (noneOf.length > 0) {
                const invalidOwned = noneOf.filter(hasFeat);
                if (invalidOwned.length > 0) {
                    missingPrereqs.push(`must not have: ${invalidOwned.join(', ')}`);
                }
            }
        };

        processRequirement(reqs.feats);

        if (missingPrereqs.length > 0) {
            issues.push({ level, type: 'feat', message: `❌ ${featName} requires prior feats: ${missingPrereqs.join(', ')}`, severity: 'error' });
        }
    }

    // Check skill requirements
    if (reqs.skills && Object.keys(reqs.skills).length > 0) {
        for (const [skill, required] of Object.entries(reqs.skills)) {
            const normalizedSkill = normalizeSkillKey(skill);
            if (!normalizedSkill) {
                issues.push({ level, type: 'feat', message: `⚠️ ${featName} has unsupported skill requirement key: ${skill}`, severity: 'warning' });
                continue;
            }

            const rawSkillValue = getRawSkillAtLevel(level, normalizedSkill);
            if (rawSkillValue === null) {
                issues.push({ level, type: 'feat', message: `⚠️ ${featName} has unsupported skill requirement key: ${skill}`, severity: 'warning' });
                continue;
            }

            const requiredValue = parseInt(required, 10) || 0;
            if (rawSkillValue < requiredValue) {
                issues.push({ level, type: 'feat', message: `❌ ${featName} requires ${normalizedSkill} ${requiredValue} (have ${rawSkillValue})`, severity: 'error' });
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
    debugLog('\n%c=== REAL-TIME CHARACTER VALIDATION ===', 'color: orange; font-weight: bold;');
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
        const babRequired = getClassBabRequirement(classReqs);
        if (babRequired !== null) {
            const babHave = levelData[level - 1].bab;
            if (babHave < babRequired) {
                issues.push({ level, type: 'class', message: `❌ Level ${level}: ${selectedClass} requires BAB +${babRequired} (have +${babHave})`, severity: 'error' });
            }
        }

        // Check feat requirements (must have taken these feats previously)
        if (classReqs.feats) {
            const priorFeats = getAllOwnedFeatNamesPriorTo(level);
            const missingFeats = getMissingClassFeatRequirements(classReqs.feats, priorFeats);
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

        // Check class progression requirements (anyOf / noneOf class blocks)
        const classRequirementErrors = getClassRequirementErrors(classReqs.class, level);
        classRequirementErrors.forEach(message => {
            issues.push({ level, type: 'class', message: `❌ Level ${level}: ${selectedClass} ${message}`, severity: 'error' });
        });

        // Check feat requirements
        const selectedFeats = getSelectedFeatsAtLevel(level);
        selectedFeats.forEach(feat => {
            const featIssues = validateFeatRequirements(level, feat, levelStats, levelMods);
            issues.push(...featIssues);
        });
    }

    // Soft rules for class commitment:
    // 1) Any class taken must have at least 3 total levels.
    // 2) The first time a class is taken, it must be taken 3 levels in a row.
    const classCommitment = new Map();
    for (let levelIndex = 0; levelIndex < levelData.length; levelIndex++) {
        const selectedClass = levelData[levelIndex].class;
        if (!selectedClass) continue;

        const key = selectedClass.toLowerCase();
        if (!classCommitment.has(key)) {
            classCommitment.set(key, {
                className: selectedClass,
                count: 0,
                firstIndex: levelIndex
            });
        }

        const entry = classCommitment.get(key);
        entry.count += 1;
    }

    classCommitment.forEach(entry => {
        if (entry.count < 3) {
            issues.push({
                level: entry.firstIndex + 1,
                type: 'class',
                message: `⚠️ ${entry.className} is taken ${entry.count} time(s); each class must be taken at least 3 times in the 30-level build`,
                severity: 'warning'
            });
        }

        let firstStreak = 0;
        for (let levelIndex = entry.firstIndex; levelIndex < levelData.length; levelIndex++) {
            const selectedClass = levelData[levelIndex].class;
            if (!selectedClass || selectedClass.toLowerCase() !== entry.className.toLowerCase()) {
                break;
            }
            firstStreak += 1;
        }

        if (firstStreak < 3) {
            issues.push({
                level: entry.firstIndex + 1,
                type: 'class',
                message: `⚠️ ${entry.className} first appears for ${firstStreak} consecutive level(s); first class pick must be 3 levels in a row`,
                severity: 'warning'
            });
        }
    });

    // Soft rules:
    // 3) Max 3 distinct classes in the build.
    // 4) If Commoner is taken, it must be taken at level 1.
    // 5) Commoner can only multiclass with Specialist and Zhent/Harper classes.
    const distinctClasses = Array.from(classCommitment.values());
    if (distinctClasses.length > 3) {
        issues.push({
            level: 1,
            type: 'class',
            message: `⚠️ Build uses ${distinctClasses.length} classes; maximum allowed is 3`,
            severity: 'warning'
        });
    }

    const commonerEntry = classCommitment.get('commoner');
    if (commonerEntry) {
        const level1Class = (levelData[0] && levelData[0].class) ? levelData[0].class.trim().toLowerCase() : '';
        if (level1Class !== 'commoner') {
            issues.push({
                level: commonerEntry.firstIndex + 1,
                type: 'class',
                message: '⚠️ Commoner must be taken at level 1',
                severity: 'warning'
            });
        }

        const invalidWithCommoner = distinctClasses
            .map(entry => entry.className)
            .filter(className => {
                const normalized = className.toLowerCase();
                if (normalized === 'commoner') return false;
                return !(normalized.includes('specialist') || normalized.includes('zhent') || normalized.includes('harper'));
            });

        if (invalidWithCommoner.length > 0) {
            issues.push({
                level: 1,
                type: 'class',
                message: `⚠️ Commoner may only multiclass with Specialist and Zhent/Harper classes (invalid: ${invalidWithCommoner.join(', ')})`,
                severity: 'warning'
            });
        }
    }

    const knowWhatImDoing = isKnowWhatImDoingEnabled();
    const displayIssues = knowWhatImDoing
        ? issues.map(issue => {
            if (!issue || issue.severity !== 'error') return issue;
            return {
                ...issue,
                severity: 'warning',
                message: typeof issue.message === 'string'
                    ? issue.message.replace(/^❌/u, '⚠️')
                    : issue.message
            };
        })
        : issues;

    debugLog(`Total issues found: ${displayIssues.length}`);
    const outputDiv = document.getElementById('validationOutput');
    
    if (displayIssues.length === 0) {
        outputDiv.innerHTML = '<span class="valid">✅ Character is valid!</span>';
    } else {
        const errorCount = displayIssues.filter(i => i.severity === 'error').length;
        const warningCount = displayIssues.filter(i => i.severity === 'warning').length;
        const html = `<span class="invalid">Issues found: ${errorCount} errors, ${warningCount} warnings</span><ul>` + 
            displayIssues.map(issue => `<li>Lvl ${issue.level}: ${issue.message}</li>`).join('') + 
            '</ul>';
        outputDiv.innerHTML = html;
    }
}

function validateCharacter() {
    validateCharacterRealtime();
}

function getCharacterSnapshot() {
    return {
        formatVersion: 1,
        exportedAt: new Date().toISOString(),
        knowWhatImDoing: isKnowWhatImDoingEnabled(),
        name: document.getElementById('charName').value,
        race: document.getElementById('raceSelect').value,
        stats: getStats(),
        levels: levelData.map(level => ({
            class: level.class || '',
            feats: level.feats || [],
            generalFeat: level.generalFeat || '',
            extraGeneralFeat: level.extraGeneralFeat || '',
            classFeat: level.classFeat || '',
            bonusFeat: level.bonusFeat || '',
            statIncrease: level.statIncrease || '',
            skills: normalizeSkillsArray(level.skills)
        }))
    };
}

function applyCharacterSnapshot(character) {
    if (!character || typeof character !== 'object') {
        throw new Error('Invalid character data');
    }

    document.getElementById('charName').value = character.name || 'New Character';
    document.getElementById('raceSelect').value = character.race || '';

    const stats = character.stats || {};
    document.getElementById('stat_str').value = parseInt(stats.str, 10) || 10;
    document.getElementById('stat_dex').value = parseInt(stats.dex, 10) || 10;
    document.getElementById('stat_con').value = parseInt(stats.con, 10) || 10;
    document.getElementById('stat_int').value = parseInt(stats.int, 10) || 10;
    document.getElementById('stat_wis').value = parseInt(stats.wis, 10) || 10;
    document.getElementById('stat_cha').value = parseInt(stats.cha, 10) || 10;

    const incomingLevels = Array.isArray(character.levels) ? character.levels.slice(0, 30) : [];
    const normalizedLevels = [];

    for (let index = 0; index < 30; index++) {
        const level = incomingLevels[index] || {};
        normalizedLevels.push({
            class: level.class || '',
            feats: Array.isArray(level.feats) ? level.feats : [],
            generalFeat: level.generalFeat || '',
            extraGeneralFeat: level.extraGeneralFeat || '',
            classFeat: level.classFeat || '',
            bonusFeat: level.bonusFeat || '',
            statIncrease: level.statIncrease || '',
            skills: normalizeSkillsArray(level.skills),
            bab: 0,
            fort: 0,
            ref: 0,
            will: 0,
            hp: 0
        });
    }

    levelData = normalizedLevels;

    const knowWhatImDoingToggle = document.getElementById('knowWhatImDoingToggle');
    if (knowWhatImDoingToggle && Object.prototype.hasOwnProperty.call(character, 'knowWhatImDoing')) {
        knowWhatImDoingToggle.checked = Boolean(character.knowWhatImDoing);
    }

    calculateMulticlassProgression();
    updateGrid();
    updateSkillGrid();
    updateStatGrid();
    validateCharacterRealtime();
}

function saveCharacter() {
    const character = getCharacterSnapshot();
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
            applyCharacterSnapshot(character);

            console.log('Character loaded successfully');
        } catch (error) {
            console.error('Error loading character:', error);
        }
    }
}

function openShareModal(mode, text = '') {
    const modal = document.getElementById('shareModal');
    const title = document.getElementById('shareModalTitle');
    const note = document.getElementById('shareModalNote');
    const textarea = document.getElementById('shareModalText');
    const exportActions = document.getElementById('shareExportActions');
    const importActions = document.getElementById('shareImportActions');

    if (!modal || !title || !note || !textarea || !exportActions || !importActions) {
        alert('Share UI is unavailable.');
        return;
    }

    const isExport = mode === 'export';
    title.textContent = isExport ? 'Export Build JSON' : 'Import Build JSON';
    note.textContent = isExport
        ? 'Copy this JSON to share, or save it as a file.'
        : 'Paste a build JSON string here or load a JSON file, then click Import.';

    textarea.value = text || '';
    textarea.readOnly = isExport;
    exportActions.style.display = isExport ? 'flex' : 'none';
    importActions.style.display = isExport ? 'none' : 'flex';

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    textarea.focus();
    textarea.select();
}

function closeShareModal() {
    const modal = document.getElementById('shareModal');
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
}

function copyShareText() {
    const textarea = document.getElementById('shareModalText');
    if (!textarea) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textarea.value)
            .then(() => alert('Build JSON copied to clipboard.'))
            .catch(() => {
                textarea.focus();
                textarea.select();
                document.execCommand('copy');
                alert('Build JSON copied to clipboard.');
            });
        return;
    }

    textarea.focus();
    textarea.select();
    document.execCommand('copy');
    alert('Build JSON copied to clipboard.');
}

function saveShareTextToFile() {
    try {
        const textarea = document.getElementById('shareModalText');
        if (!textarea) return;

        const payload = textarea.value || '';
        const blob = new Blob([payload], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const characterName = (document.getElementById('charName').value || 'character')
            .trim()
            .replace(/[^a-z0-9-_ ]/gi, '')
            .replace(/\s+/g, '_') || 'character';

        const link = document.createElement('a');
        link.href = url;
        link.download = `${characterName}_build.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error saving share text to file:', error);
        alert('Failed to save JSON file.');
    }
}

function triggerShareImportFile() {
    const input = document.getElementById('shareImportFileInput');
    if (!input) return;
    input.value = '';
    input.click();
}

function applyImportedShareText() {
    try {
        const textarea = document.getElementById('shareModalText');
        if (!textarea) return;

        const text = (textarea.value || '').trim();
        if (!text) {
            alert('Paste JSON or load a JSON file first.');
            return;
        }

        const parsed = JSON.parse(text);
        applyCharacterSnapshot(parsed);
        localStorage.setItem('dnd_character', JSON.stringify(getCharacterSnapshot()));
        closeShareModal();
        alert('Character build imported!');
    } catch (error) {
        console.error('Error importing character:', error);
        alert('Invalid character JSON.');
    }
}

function exportCharacter() {
    try {
        const character = getCharacterSnapshot();
        const payload = JSON.stringify(character, null, 2);
        openShareModal('export', payload);
    } catch (error) {
        console.error('Error exporting character:', error);
        alert('Failed to export character build.');
    }
}

function importCharacter() {
    openShareModal('import', '');
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
        generalFeat: '',
        extraGeneralFeat: '',
        classFeat: '',
        bonusFeat: '',
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
    console.log('%c D&D Character Planner - Initializing...', 'color: green; font-weight: bold;');

    const debugLogsToggle = document.getElementById('debugLogsToggle');
    if (debugLogsToggle) {
        const savedDebugLogs = localStorage.getItem('planner_debug_logs');
        debugLogsEnabled = savedDebugLogs === '1';
        debugLogsToggle.checked = debugLogsEnabled;

        debugLogsToggle.addEventListener('change', () => {
            debugLogsEnabled = Boolean(debugLogsToggle.checked);
            localStorage.setItem('planner_debug_logs', debugLogsEnabled ? '1' : '0');
            if (debugLogsEnabled) {
                console.log('Debug logs enabled');
            }
        });
    }

    const knowWhatImDoingToggle = document.getElementById('knowWhatImDoingToggle');
    if (knowWhatImDoingToggle) {
        knowWhatImDoingToggle.addEventListener('change', () => {
            schedulePlannerRefresh({ includeSkills: true });
        });
    }

    const shareImportFileInput = document.getElementById('shareImportFileInput');
    if (shareImportFileInput) {
        shareImportFileInput.addEventListener('change', () => {
            const file = shareImportFileInput.files && shareImportFileInput.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = () => {
                const text = typeof reader.result === 'string' ? reader.result : '';
                const textarea = document.getElementById('shareModalText');
                if (textarea) {
                    textarea.value = text;
                }
            };
            reader.onerror = () => {
                console.error('Error reading import file:', reader.error);
                alert('Failed to read build file.');
            };
            reader.readAsText(file);
        });
    }

    const shareModal = document.getElementById('shareModal');
    if (shareModal) {
        shareModal.addEventListener('click', (event) => {
            if (event.target === shareModal) {
                closeShareModal();
            }
        });
    }

    loadData();
});

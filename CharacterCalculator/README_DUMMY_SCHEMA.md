# Character Calculator Dummy Data Cookbook

This file gives copy/paste dummy examples for one class, one feat, and one race with as many supported fields and conditionals as the current planner runtime supports.

Use these as a template when adding real data.

---

## 1) Dummy Class (classData.json)

```json
"Dummy Archon": {
  "name": "Dummy Archon",
  "requirements": {
    "alignment": "Any non-evil",
    "bab": "+4",
    "feats": [
      "Power Attack",
      { "type": "anyOf", "values": ["Cleave", "Knockdown"] },
      { "type": "allOf", "values": ["Toughness", "Weapon Focus (Simple)"] },
      { "type": "noneOf", "values": ["Curse of Cowardice"] }
    ],
    "race": ["human", "half-elf"],
    "class": {
      "anyOf": {
        "levels": 3,
        "classes": ["Fighter", "Bard"],
        "exclude": ["Assassin"]
      },
      "noneOf": {
        "classes": ["Blackguard"]
      }
    },
    "skills": {
      "discipline": 4,
      "lore": 4
    },
    "proficiencies": [
      "armor proficiency (light)",
      "armor proficiency (medium)",
      "weapon proficiency (martial)",
      "shield proficiency"
    ],
    "other": "Dummy requirement notes"
  },
  "unavailableFeats": [
    "Weapon Specialization"
  ],

  "classFeatTracks": {
    "dummy_path": {
      "label": "Path Feat",
      "epicLabel": "Epic Path Feat",
      "slots": [
        { "classLevel": 1, "tier": "standard", "count": 1, "label": "Path" },
        { "levels": [6, 11], "tier": "standard", "count": 1 },
        { "classLevels": [16], "tier": "epic", "count": 1 },
        { "minClassLevel": 21, "maxClassLevel": 30, "tier": "epic", "count": 1 },
        { "minCharacterLevel": 26, "maxCharacterLevel": 30, "tier": "epic", "count": 1 }
      ],
      "options": [
        { "feat": "Dummy Path: Ember", "tier": "standard", "when": "always" },
        { "feat": "Dummy Path: Frost", "tier": "standard", "when": "always" },
        { "feat": "Dummy Path: Storm", "tier": "standard", "when": "always" },

        { "feat": "Dummy Technique I", "tier": "standard", "when": "always" },
        { "feat": "Dummy Technique II", "tier": "standard", "when": { "featsAll": ["Dummy Technique I"] } },

        {
          "feat": "Dummy Epic Method",
          "tier": "epic",
          "when": {
            "allOf": [
              { "classLevel": { "class": "dummy archon", "min": 21 } },
              { "anyOf": [
                { "featsAll": ["Dummy Path: Ember"] },
                { "featsAll": ["Dummy Path: Frost"] }
              ] }
            ]
          }
        }
      ]
    }
  },

  "skillPointsPerLevel": "(6 + ${int})",
  "skillPointsAtFirstLevel": "(6 + ${int}) * 4",
  "classSkills": [
    "discipline",
    "lore",
    "concentration",
    "craft mastery",
    "taunt",
    "use magic device"
  ],

  "hitDie": "d8",
  "proficiencies": [
    "armor proficiency (light)",
    "armor proficiency (medium)",
    "weapon proficiency (martial)",
    "shield proficiency"
  ],

  "bonusFeatsAtLevels": [6, 11, 16, 21, 26, 29],
  "availableBonusFeats": [
    "Dummy Bonus I",
    "Dummy Bonus II"
  ],
  "epicBonusFeats": [
    "Dummy Epic Bonus I",
    "Dummy Epic Bonus II"
  ],

  "hasSpellcasting": true,
  "spellcasting": {
    "type": "spontaneous",
    "stat": "charisma",
    "spellsKnown": {
      "0": [4, 4, 4, 4, 4],
      "1": [2, 3, 4, 4, 5],
      "2": [0, 0, 1, 2, 3]
    },
    "spellsPerDay": {
      "0": "unlimited",
      "1": [1, 2, 3, 4, 5],
      "2": ["-", "-", 1, 2, 3]
    }
  },

  "maxLevel": 30,
  "levelProgression": [
    [1, 2, 0, 2, 8],
    [2, 3, 0, 3, 16],
    [3, 3, 1, 3, 24],
    [4, 4, 1, 4, 32],
    [5, 4, 1, 4, 40]
  ],
  "feats": [
    "Dummy Feature I",
    "Dummy Feature II",
    "",
    "Dummy Feature III",
    ""
  ],
  "extras": [
    {
      "name": "ac",
      "values": [0, 1, 1, 2, 2]
    },
    {
      "name": "discipline",
      "values": [0, 1, 1, 2, 2]
    },
    {
      "name": "str",
      "values": [
        { "value": 1, "isSoft": true, "softCap": 4 },
        { "value": 1, "isSoft": true, "softCap": 4 },
        0,
        1,
        1
      ]
    }
  ]
}
```

---

## 2) Dummy Feat (feats.json)

```json
"Dummy Apex Protocol": {
  "name": "Dummy Apex Protocol",
  "requirements": {
    "level": 10,
    "feats": [
      "Power Attack",
      { "type": "anyOf", "values": ["Cleave", "Great Cleave"] },
      { "type": "allOf", "values": ["Toughness", "Blind Fight"] },
      { "type": "noneOf", "values": ["Coward's Mark"] },
      {
        "anyOf": ["Weapon Focus (Martial)", "Weapon Focus (Simple)"],
        "allOf": ["Dodge"],
        "noneOf": ["Curse of Cowardice"]
      }
    ],
    "skills": {
      "discipline": 8,
      "lore": 6
    },
    "stats": {
      "str": 13,
      "cha": 12
    },
    "bab": 6,
    "class": [
      "fighter",
      { "name": "dummy archon", "level": 3 }
    ],
    "race": ["human", "half-elf"],
    "alignment": "non-evil",
    "spells": {
      "maxCircle": 2,
      "casterLevel": 5
    },
    "other": ["dummy note"],
    "repeatable": false,
    "repeatableCount": 0,
    "levelGate": null
  },
  "effects": {
    "stats": {
      "str": 1,
      "cha": { "value": 2, "isSoft": true, "softCap": 6 }
    },
    "ac": {
      "dodge": 1,
      "deflection": 1
    },
    "skills": {
      "discipline": 2,
      "lore": 2,
      "use trap": 2
    },
    "hp": 10,

    "grantedFeats": [
      "Dummy Granted Always",
      { "feat": "Dummy Granted Class String", "when": "class:dummy archon>=5" },
      { "feat": "Dummy Granted Feat String", "when": "feat:Power Attack" },
      {
        "feat": "Dummy Granted Object",
        "when": {
          "classLevel": { "class": "dummy archon", "min": 10 },
          "featsAll": ["Power Attack"],
          "featsAny": ["Cleave", "Great Cleave"],
          "allOf": [
            { "classLevel": { "class": "fighter", "min": 3 } },
            { "featsAll": ["Dodge"] }
          ],
          "anyOf": [
            { "featsAll": ["Blind Fight"] },
            { "classLevel": { "class": "bard", "min": 5 } }
          ]
        }
      }
    ],

    "removedFeats": [
      "Dummy Removed Exact",
      {
        "feat": "Dummy Removed ByFeat",
        "when": "class:dummy archon>=10",
        "except": ["Dummy Removed ByFeat (Protected)"],
        "reason": "Dummy exact removal rule"
      },
      {
        "startsWith": "Dummy Prefix",
        "when": "always",
        "except": ["Dummy Prefix Keep"],
        "reason": "Dummy startsWith rule"
      },
      {
        "includes": "Dummy Substring",
        "when": {
          "classLevel": { "class": "dummy archon", "min": 12 }
        },
        "reason": "Dummy includes rule"
      },
      {
        "regex": "^Dummy Regex.*$",
        "when": {
          "anyOf": [
            { "classLevel": { "class": "fighter", "min": 8 } },
            { "featsAll": ["Power Attack", "Cleave"] }
          ]
        },
        "reason": "Dummy regex rule"
      }
    ],

    "other": [
      "dummy planner note"
    ]
  },
  "source": {
    "type": "class",
    "desc": "Dummy feat with full requirement and conditional examples."
  }
}
```

---

## 3) Dummy Race (races.json)

```json
"Dummy Lineage": {
  "name": "Dummy Lineage",
  "stats": {
    "str": 2,
    "dex": 0,
    "con": -2,
    "int": 0,
    "wis": 2,
    "cha": 0
  },
  "feats": [
    "Darkvision",
    "Quick To Master",
    "Skilled",
    "Dummy Racial Feat"
  ],
  "skills": {
    "discipline": 2,
    "lore": 2,
    "sail": 2
  },
  "ecl": 1
}
```

---

## Conditional Syntax Reference (Supported by runtime)

### A) when for class feat options and granted/removed feat rules

Supported forms:

1. String:
- always
- class:classname>=N
- feat:Feat Name

2. Object:
- classLevel: { class: classname, min: N }
- featsAll: ["Feat A", "Feat B"]
- featsAny: ["Feat A", "Feat B"]
- allOf: [ condition, condition ]
- anyOf: [ condition, condition ]

Notes:
- Multiple keys in one object are ANDed together.
- allOf and anyOf can nest conditions recursively.

### B) removedFeats rule object modes

Supported match modes:
- feat: "Exact Name"
- startsWith: "Prefix"
- includes: "Substring"
- regex: "Pattern"

Optional keys on each rule:
- when
- except: ["Feat To Keep"]
- reason: "Message shown in tooltip/diagnostics"

---

## Important Runtime Notes

- Unknown fields are usually ignored by planner logic.
- Skill requirement checks use raw skill ranks (not displayed total with bonuses).
- Class skill determination for spending uses the class taken on that level.
- Use Magic Device is blocked from rank increases on levels where it is not a class skill.
- If a non-class cap becomes lower after class change, existing ranks are kept; only new purchases are blocked.

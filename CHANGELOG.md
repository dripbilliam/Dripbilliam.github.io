# Changelog

All notable changes to this repository are documented in this file.

## 2026-02-21

### Added
- Full class/feat evolution systems in the character planner, including conditional feat granting/removal, class-feat tracks, and soft stat/skill handling (`802f124`).
- Import/export plus override toggle and stronger build-layout checks (`a783476`).
- Class order enforcement and class-feature-as-feat tracking (`d173592`).
- Feat selection enforcement improvements across levels (`e7821af`).

### Changed
- Character planner validation/progression and data loading fallbacks were expanded (`36e51d4`).
- Navigation behavior was improved in planner/site flow (`34839ea`).
- Cache prevention for planner JavaScript in HTML (`f8de809`).
- Legacy proficiency format compatibility and logging toggle updates (`4fb984a`).
- Skill/soft adjustments and related data updates (`5b5cc7f`).

### Fixed
- Multi-feat removal handling bug (`4edd014`).
- Class data cleanup/fixes, including SF-related corrections (`e7bf680`).

### Maintenance
- Minor site index update (`c2b9518`).
- Class data formatting/spacing cleanup commits (`3bd8522`, `e49b78f`, `ef13814`).

## 2026-02-20

### Added
- Large source-data import pass: race/xml documentation and major class data bootstrap (`162bdeb`).

### Changed
- Class data aligned with feat data; custom Arelith feats added; feat DB v1 completed (`e1769e7`).

## 2026-02-18

### Changed
- SpellSearch damage extraction logic and local/URL data load pathways improved (`5298c9a`).
- Source/docs visibility adjusted via ignore rules (`ee1181e`).

## 2026-02-17

### Added
- Initial repository structure and core modules:
  - Sequence builder pages and rebuild pipeline.
  - SpellSearch parser/data/UI scaffolding.
  - Parsed datasets and docs/assets foundations (`9e327c7`).

---

## Commit Notes (for vague messages)

These entries were clarified using file-level diffs where commit messages were non-descriptive:
- `162bdeb` (“More stuffs”): introduced substantial baseline data (`classData.json` + multiple XML/doc imports), 28k+ inserted lines.
- `c2b9518` (“Updated”): small `index.html` adjustment (1 line changed).
- `3bd8522`, `e49b78f`, `ef13814`: formatting/spacing-only changes in `CharacterCalculator/classData.json`.

# The Gnomes Shopkeeping Style Guide

## Visual Direction
- Mood: warm guildhall ledger with polished fantasy utility.
- Contrast: bright content surfaces over a textured parchment-like page field.
- Personality: bold navigation, rounded controls, soft depth, and deliberate highlights.

## Typography
- Heading font: `Bricolage Grotesque`.
- Body/UI font: `Outfit`.
- Use headings for section hierarchy and keep body copy compact and readable.

## Color Tokens
- Sidebar/night ink: deep teal family.
- Action accent: amber for active navigation and emphasis.
- Interactive accent: sea-teal for links/focus.
- Surface system:
  - `--surface`: primary card/table base.
  - `--surface-soft`: nested editor sections.
  - `--line` and `--line-strong`: warm border contrast.

## Components
- Navigation: pill links with active amber gradient and slight hover travel.
- Cards/Tables: rounded corners, subtle gradients, and soft warm shadows.
- Buttons: pill shape, compact weight, lift-on-hover.
- Inputs: rounded with clear focus rings and distinct disabled state.

## Motion
- Use `fade-slide` reveal for page sections.
- Keep motion short and purposeful (no looping or distracting effects).

## Layout Rules
- Desktop: fixed left navigation rail.
- Mobile: top-stacked navigation with full-width content.
- Preserve current app structure/classes; style changes should remain global via `styles.css`.

## Accessibility
- Maintain visible `:focus-visible` outlines on controls and links.
- Keep sufficient contrast for text against gradients and tinted surfaces.
- Disabled controls must be visually obvious and non-interactive.

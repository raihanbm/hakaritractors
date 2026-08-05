# Approved Design Specification

## Visual language

- Primary orange: `#f4510b` with a brighter gradient endpoint `#ff640d`.
- Header/utility black: `#101419` to `#171c22`.
- White commerce surfaces with thin neutral borders and restrained shadows.
- Compact typography and high information density, matching large marketplace product grids.
- Diagrams use `object-fit: contain`; tractor photography uses `object-fit: cover` only where appropriate.

## Desktop structure

- Maximum content width: 1,540 px.
- Utility bar: 34 px.
- Main header: 80 px.
- Primary navigation: 48 px.
- Tractor model strip: 38 px.
- Catalog sidebar: 218 px with an 18 px gap.
- Catalog grid: four columns at full desktop, 10 px gaps.
- Detail page: diagram and parts area split approximately 1.12 / 0.88 with a 500 px minimum right panel.

## Responsive rules

- ≤ 1,380 px: catalog cards reduce to three columns.
- ≤ 1,100 px: header condenses; detail page stacks.
- ≤ 820 px: catalog becomes two columns; filters become a bottom drawer.
- ≤ 520 px: catalog becomes one column; cards use a compact image/content split; header and horizontal scrollers condense.

## Interaction language

- Orange is reserved for primary commerce actions and active navigation.
- Stock status uses semantic green/amber/muted indicators.
- RFQ wording is used instead of fake checkout wording.
- Every diagram action preserves tractor model, diagram code and callout context.

## Reference images

- `references/01-home-reference.png`
- `references/02-catalog-reference.png`
- `references/03-diagram-reference.png`
- `REFERENCE-BOARD.png`

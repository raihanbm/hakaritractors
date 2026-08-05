# Hikari Storefront Reference V5 — Start Here

This package is the finished replacement storefront. Do **not** ask an agent to redesign it and do **not** merge it with older storefront markup or CSS.

## Deployment rule

Replace the existing storefront project with this entire folder. Preserve the directory structure exactly, especially:

- `assets/data/`
- `assets/diagrams/`
- `assets/diagrams-visual/`
- `assets/images/`
- `assets/css/main.css`
- `assets/js/app.js`

The presentation layer is already rebuilt against the three approved reference images in `docs/hermes/reference/`. The implementation screenshots are in `docs/hermes/proof/`.

## Required validation

Run:

```bash
npm run audit
```

Expected result:

- verification passes with no missing local assets;
- 16/16 regression tests pass;
- audit passes 15/15 checks;
- 913 assembly diagrams;
- 14,237 orderable part rows;
- 7 tractor models.

## Routes to inspect

```text
/#home
/#catalog?model=L3608&category=Engine
```

Open any assembly card for the diagram-detail page.

Use a desktop viewport of `1672 × 941`, browser zoom `100%`, and device scale factor `1` for visual comparison.

## RFQ behavior

A part row starts with **Add to RFQ**. Once added, it changes into a marketplace quantity control:

```text
−  quantity  +  ×
```

The minus button reduces quantity, zero removes the row from RFQ, plus increases quantity, and the cart badge updates immediately.

## Important distinction

The reference images use illustrative model names, prices, and diagram examples. This implementation keeps the user's real catalog data. Visual geometry and component structure follow the references while names, prices, stock, quantities, and diagrams remain real.

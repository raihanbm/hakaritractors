# One-Shot Hermes Deployment Instruction

Upload the full Hikari Storefront Reference V5 package and give Hermes this exact instruction:

> Deploy this folder as a full storefront replacement. Do not redesign, summarize, restyle, merge, or regenerate the HTML/CSS. Do not copy components from an older branch. Keep every directory and filename intact. First run `npm run audit`; stop if it does not report 16/16 tests and 15/15 audit checks. Then serve the project root and verify `/#home`, `/#catalog?model=L3608&category=Engine`, and one diagram-detail route at 1672×941, 100% zoom. Compare against `docs/hermes/reference/` and confirm the implementation screenshots in `docs/hermes/proof/`. Preserve real catalog data, diagram files, search, filters, RFQ submission, and the `− quantity + ×` row control. Do not declare completion until all assets load without 404s and the cart badge stays synchronized after add, plus, minus, and remove.

## Forbidden actions

- Do not merge `main.css` with old CSS.
- Do not reintroduce `marketplace.css` or `exploded-sheet.css` into the active HTML.
- Do not remove `assets/diagrams-visual`.
- Do not replace real catalog JSON with demo data.
- Do not shrink the desktop interface to fit by changing browser zoom.
- Do not make a new interpretation of the screenshots.

## Production configuration

Before public launch, review `assets/js/runtime-config.js` for production phone, email, currency, API base, and public endpoint settings. Never place a Supabase service-role key or another private secret in browser code.

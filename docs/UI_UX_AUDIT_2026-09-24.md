# UI/UX Audit — 2026-09-24

Method: dual-agent (A: `/root/design_review` · B: `/root/detector_review`)

## Scope and baseline

- Git branch: `feature/v13-frontend-fusion`; V19 source: `apps/miniapp/v19-preview.html`.
- Formal miniapp pages/components are under `apps/miniapp`; V19 content, routes, five tabs, local cart and content preview are present.
- `apps/admin/src` has only bootstrap/model files. The currently visible backend surface is the local preview in `apps/miniapp/pages/admin-preview/index.vue`, not a production admin application.
- Production photography is not confirmed. Some product images use demo URLs or branded text fallbacks.
- Design review used source inspection; the independent detector review also captured the existing home and admin preview in a browser at 1266×712. Post-edit browser capture could not be completed because browser automation became unavailable.

## Heuristic scores

Scores describe the pre-change surfaces: 0 = serious gap, 4 = strong evidence.

| Heuristic | Score | Evidence |
| --- | ---: | --- |
| Visibility of system status | 3 | Local preview limits are stated; loading/error/empty coverage is incomplete. |
| Match to real world | 3 | Zhouqu and seasonal product language fit the business. |
| User control and freedom | 2 | Detail text could be clipped; mobile navigation had no swipe cue. |
| Consistency and standards | 3 | Palette, product cards, and tabs are consistent. |
| Error prevention | 2 | Some preview form validation exists; storefront recovery cues are limited. |
| Recognition rather than recall | 3 | Category tabs and product metadata aid recognition; admin menu has many destinations. |
| Flexibility and efficiency | 2 | Home shortcuts help; there is no real admin UI in `apps/admin`. |
| Aesthetic and minimalist design | 3 | Editorial structure is clear; image fallbacks and implementation copy weaken it. |
| Error recovery | 2 | Image errors are labeled; clipped details lacked a recovery path. |
| Help and documentation | 2 | Preview constraints are stated; task-specific operator guidance is limited. |
| **Total** | **25/40** | Distinctive V19 foundation; substantial production readiness remains. |

## Priorities

1. **P1 — Real admin UI is not implemented.** The current workbench, product list, and editor are local preview surfaces with local data. Treat them as prototype-only until `apps/admin` has a real authenticated UI and API integration.
2. **P1 — Approved production photography is missing.** Image-led product and origin storytelling loses credibility when a demo image fails or a text fallback appears. Obtain stable, approved product/origin images; retain transparent fallback labels until then.
3. **P2 — Product details were truncated in the fixed sheet.** The detail area now scrolls independently while the sheet and purchase footer stay fixed.
4. **P2 — Mobile admin navigation had no cue that more destinations existed.** A swipe hint and adequate row height have been added to the local preview.
5. **P2 — Search looks active but only reports that the preview API is disconnected.** Keep this limitation explicit until catalog search is implemented.

## Detector and browser evidence

- Before implementation, detector warnings: `side-tab` at the report callout's 3px left accent, and `layout-transition` on animated report-bar width. Both were addressed with a 1px top accent and transform-based bar animation.
- The detector passed with `[]` on the first implementation pass.
- Browser screenshots before the edits showed the miniapp home and admin preview. No overlay was injected; no critique-only server was started. A post-edit browser verification attempt failed because the browser surface was unavailable; H5 build and local route availability remain the available checks.

## Design direction and first implementation

- Preserve V19's forest green, warm paper, copper detail, regional editorial copy, and existing page relationships.
- Extend shared semantic color, spacing, typography, radius, motion, and admin-layout tokens in `apps/miniapp/styles/tokens.css`.
- Use home, category, ProductTile/ProductSheet and the existing admin preview as the first visual surfaces. Keep all existing data and business actions unchanged.
- Do not claim that the local admin preview is a production admin application.

See [`DESIGN.md`](../DESIGN.md) for the current design-language contract and next-surface checklist.

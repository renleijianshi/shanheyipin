# Design Language — Editorial Commerce

山禾颐品的界面以 V19 的西北山野、新中式与精品食品方向为基准。小程序用暖纸色承托真实产地与商品影像，森林绿建立品牌识别，柿橙只强调商品价格和少量重点；运营界面保留同一品牌色，以清晰和效率为先。

> One-liner: Use the warm canvas and forest-green brand tokens from [`tokens.css`](apps/miniapp/styles/tokens.css), keep product storytelling image-led and typography-led, use persimmon orange only for price or one small emphasis, prefer open editorial layouts over nested cards, and keep purchase actions fixed and unmistakable.

The canonical storefront surface is [`home/index.vue`](apps/miniapp/pages/home/index.vue). Its published product data comes from the public catalog API; story, trace, selection, user and cart pages show explicit unavailable states until their services are connected. Shared product surfaces live in [`ProductTile.vue`](apps/miniapp/components/ProductTile.vue) and [`ProductSheet.vue`](apps/miniapp/components/ProductSheet.vue). The former miniapp operator preview source remains local-only and is excluded from [`pages.json`](apps/miniapp/pages.json). The separate [`apps/admin/web/App.vue`](apps/admin/web/App.vue) contains a Vue/Vite workbench, product table, category view and product form; admin sessions, RBAC and catalog management APIs exist, while real database login and write acceptance remain pending.

## 1. Foundations

### Fonts

- Body and interface text use the system sans stack defined in [`tokens.css`](apps/miniapp/styles/tokens.css): PingFang SC, Microsoft YaHei, system-ui.
- Songti is a limited brand accent for short marks such as the product fallback wordmark. Do not use it for controls, long text, or small labels.
- No external font files are currently loaded.

### Color

| Role | Token |
| --- | --- |
| Page canvas | `--color-canvas` |
| Raised surface | `--color-surface` |
| Muted surface | `--color-surface-muted` |
| Primary text | `--color-text-primary` |
| Secondary text | `--color-text-secondary` |
| Primary action | `--color-brand` |
| Product price/accent | `--color-accent` |
| Borders | `--color-border` |
| Success / warning / danger | `--color-success`, `--color-warning`, `--color-danger` |

Use one small accent pairing per view. Orange belongs to product prices or a single seasonal emphasis; copper/gold is limited to brand details. Existing token declarations are the only routine color source; artwork may carry its own photographic color.

### Elevation

Prefer a single border or a surface shift. Use `--shadow-soft` only for a raised primary surface. Never place a card inside another card, and do not add shadows to every list row.

## 2. Surfaces & rounding

| Token | Use |
| --- | --- |
| `--radius-control` | Small controls and fields |
| `--radius-surface` | Product media and standard panels |
| `--radius-feature` | Hero-adjacent or primary surfaces |

- Product tile: `product-tile` / `product-image` in [`ProductTile.vue`](apps/miniapp/components/ProductTile.vue); media keeps a 4:5 crop and the product copy stays outside the image.
- Product detail: `product-sheet` / `sheet-content` / `sheet-footer` in [`ProductSheet.vue`](apps/miniapp/components/ProductSheet.vue); the sheet stays at roughly three quarters of the viewport and the purchase footer remains visible while detail content scrolls.
- Admin preview: `admin-menu`, `admin-main`, and `metric-card` in [`admin-preview/index.vue`](apps/miniapp/pages/admin-preview/index.vue); use borders and alignment to organize operational information.
- Admin application: `--admin-*` tokens in [`tokens.css`](apps/admin/web/tokens.css) echo the forest-green and warm-paper storefront palette; the sidebar, topbar, metrics, empty states, table and editor prioritize alignment, readable status and operational density. Keep navigation limited to modules backed by existing domain services.

## 3. Typography patterns

| Element | Pattern |
| --- | --- |
| Brand display | `--type-display`, weight 600 |
| Page/section title | `--type-title` or page-specific 42–48rpx, weight 600 |
| Product title | 28rpx, line-height 1.45, weight 600 |
| Body | `--type-body`, `--leading-body` |
| Caption | `--type-caption`; keep readable contrast |
| Price | 34rpx, weight 600, `--color-accent` |

Keep English uppercase labels short and secondary. Chinese copy should describe the place, product, or action; do not show implementation instructions to shoppers.

## 4. Layout & spacing

- Use the spacing scale `--space-1` through `--space-6` in [`tokens.css`](apps/miniapp/styles/tokens.css). Preserve larger breaks above section headings.
- Storefront pages use the V19 narrow mobile composition, 40rpx page gutters, and a two-column product grid where products need comparison.
- The home page order is brand/hero, four shortcuts, then the product section. Do not restore the removed story block below the home products.
- Admin preview is a desktop workspace with a 232px grouped sidebar; mobile uses a horizontally scrollable menu with a visible swipe cue.
- Keep tabBar order and page destinations defined in [`pages.json`](apps/miniapp/pages.json).

## 5. Components & motifs

- `ProductTile` is the common product card; keep product image, title, subtitle, and price in that order.
- `ProductSheet` keeps the close affordance and fixed price/add-to-cart footer visible.
- Category filters remain the four existing V12 categories; selected state uses brand color and an underline.
- Use V19's forest, paper, and copper palette without inventing decorative scenery. Missing photography must be honestly marked as pending; do not replace it with unapproved stock or AI imagery.
- Existing text glyphs are legacy V19 affordances. Do not add a second icon style; a dedicated approved icon set remains an open question.

## 6. Motion

- Interactive transitions use the named `--motion-quick` (160ms) and `--motion-standard` (220ms) tokens.
- Product image press feedback is a subtle scale transform. Report bars animate their transform, not their layout width.
- Do not animate page content on first paint or use `transition: all`. Honor reduced-motion settings where the target platform exposes them.

## 7. Checklist

- [x] Primary storefront surfaces (home, category, selection, cart, story, trace, profile, address and product detail) use semantic color/spacing/radius tokens; continue migrating remaining local-admin styles.
- [ ] Each view uses no more than one small orange/copper emphasis pairing.
- [ ] Product image fallbacks say photography is pending and do not imply an unavailable asset loaded.
- [x] Product detail can reveal its complete descriptive content while the purchase footer stays fixed.
- [ ] Page scrolling, bottom navigation, and safe-area padding remain intact.
- [x] Admin preview content and navigation remain clearly marked as local-only where API data is not connected.
- [x] The independent admin application has responsive workbench, product, category, table, and product editor surfaces; reads use documented management paths and show API/authorization errors without invented records.
- [x] Management authentication and catalog write APIs exist; the UI distinguishes local read-only preview from a real API session.
- [ ] Real database authentication and catalog create/edit/publish are verified before the admin UI is used for real operations.
- [ ] No business action, API contract, or data shape changes as part of visual work.

## Open questions

- Approved production product and origin photography is still needed. Product object keys resolve only through configured `VITE_MEDIA_BASE_URL`; external preview URLs are not used as production imagery.
- The public catalog and admin catalog APIs are connected in code, but MySQL-backed cross-device sync is not runtime-verified. Admin local preview remains read-only and explicitly marked.
- The catalog search API exists, but the home search affordance remains unavailable until a search page is connected.

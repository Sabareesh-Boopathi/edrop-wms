# Frontend instructions and Copilot guide

This guide captures the current frontend architecture, theming, reusable components, and UI patterns in eDrop WMS. It’s designed for engineers and GitHub Copilot so contributions are consistent and fast.

## TL;DR for Copilot

- Stack: React 18 + TypeScript. UI built with custom CSS tokens and utilities; minimal MUI usage. Icons: lucide-react.
- Theme: use CSS tokens (var(--color-…)) and utility classes (btn-primary-token, btn-outline-token, etc.). Avoid inline hex colors.
- Lists/tables: wrap in `TableCard` with title + header slots (search/actions) + optional footer (pagination summary + pager buttons).
- Row actions: non-destructive = primary/neutral; edit/save = success (green); delete = error (red). Prefer labeled action links (icon + text) for clarity.
- Confirmations: quick `window.confirm(...)` for destructive actions, or `notify.show(...)` when a richer confirm is needed.
- Notify: use `lib/notify` for success/error/info messages.
- Services: call APIs through `src/pages/.../services/*Service.ts` modules; keep DTOs/types in services or `types/`.

## Stack and conventions

- React 18 + TypeScript
- CSS: custom theme tokens (`src/theme/tokens.css`) and utilities (`src/theme/utilities.css`)
- Icons: `lucide-react`
- Animations: `framer-motion` (for modals/overlays)
- Optional MUI v6 (ensure compatibility with React 18). Prefer our tokens/utilities for new UI.

Coding conventions:
- Functional components with hooks
- Keep state local to pages unless a shared state is clearly needed
- Use services for data access; keep components presentational where possible
- Prefer small, page-scoped CSS files for page-specific styling (e.g., `VendorDetails.css`)
- Avoid ad-hoc inline styles for colors; use tokens/utilities; inline layout styles are okay for quick spacing if not reusable

## Project structure (frontend)

Key folders under `frontend/src/`:

- `components/` reusable building blocks
  - `ui/button.tsx` — shared Button
  - `table/TableCard.tsx` — standard card wrapper for tables
  - Other page-agnostic widgets
- `pages/` feature pages
  - `administration/` (e.g., `VendorDetails.tsx`, `Vendors.tsx`)
  - `inventory/` (e.g., stock pages)
  - `inbound/` (e.g., `GoodsIn.tsx`, `QualityCheck.tsx`)
- `services/` API modules per domain (e.g., `vendorService.ts`, `storeService.ts`, `productService.ts`)
- `theme/` tokens and utility classes
  - `tokens.css` — color palette, radii, spacing, etc.
  - `utilities.css` — buttons, chips, focus outlines, trends
- `types/`, `utils/`, `hooks/`, `contexts/` as needed

## Theme tokens and utilities

Always use CSS variables from `tokens.css`. Common ones seen in code:
- Colors: `--color-primary`, `--color-primary-hover`, `--color-primary-soft`,
  `--color-success`, `--color-error`, `--color-warning`,
  `--color-text`, `--color-text-soft`, `--color-text-muted`, `--color-text-subtle`,
  `--color-border`, `--color-border-strong`, `--color-surface`, `--color-surface-alt`.
- Radii/spacing/shadows/font sizes: `--radius-sm`, `--radius-pill`, `--space-*`, `--shadow-sm`, `--font-size-sm`, etc.

Utility classes from `utilities.css` (use these before reinventing styles):
- Buttons: `.btn-primary-token`, `.btn-outline-token`
- Chips: `.chip-neutral`
- Focus: `.focus-outline-primary`
- Trend badges: `.trend-up`, `.trend-down`

Page-local helpers (example: `VendorDetails.css`):
- Tabs: `.vd-tab-chip`, `.vd-tabs`
- Icon-only: `.icon-btn-plain` with color modifiers `.icon-success`, `.icon-danger`, `.icon-muted`
- Link actions: `.action-link` with variants `.primary`, `.success`, `.danger`, `.muted`
- Pager: `.pager-btn`

## Reusable components

### Button
- Import from `components/ui/button`.
- Prefer `.btn-primary-token` and `.btn-outline-token` via `className` for theme styling.

### TableCard
- A standard wrapper for list/table pages with consistent header and body.
- Props pattern (semantic):
  - `title: ReactNode` — section title
  - `search?: ReactNode` — search/filter input slot (right of title)
  - `actions?: ReactNode` — primary/secondary header actions
  - `footer?: ReactNode` — footer area, typically pagination summary and pager controls
  - `variant?: 'inbound' | 'default'` — style variant used across app
- Usage:
  - Always supply `title`.
  - Put search and call-to-action in header via `search` and `actions`.
  - For lists, add `footer` with page summary and `.pager-btn` controls.

### LocationPicker
- Used for picking lat/lng; opens in an overlay. Returns coordinates via callbacks.

## Tables and list patterns

When building a new list view:
1) Wrap content in `TableCard` with `title`, `search`, `actions`.
2) Use a standard `<table>` with `<thead>`, `<tbody>` and an empty state when data length is 0.
3) Filtering: store filter text in state and derive a filtered array via `useMemo`.
4) Pagination: track `page`, `pageSize`, compute `pageCount`, slice a `paged` array via `useMemo`.
5) Footer: show summary and pager buttons
   - Pager buttons use `.pager-btn` and lucide `ChevronLeft`/`ChevronRight` icons
   - Disabled state when at bounds; keep color as `--color-primary` (disabled => `--color-text-muted`)

Row actions:
- Non-destructive navigation/toggles: `.action-link.primary` (e.g., “Products”)
- Edit/Save: `.action-link.success` or `.icon-btn-plain.icon-success` (compact in edit mode)
- Delete/Remove: `.action-link.danger` or `.icon-btn-plain.icon-danger`
- Prefer labeled action links (icon + text) when clarity matters; icon-only for very common/compact actions

Destructive actions:
- Use `window.confirm('...')` for quick in-table confirms
- Use `notify.show(...)` for richer confirmations with custom actions

Notifications:
- Use `notify.success(...)`, `notify.error(...)`, etc., after API calls**

## Forms

- Keep forms simple and styled with tokens/utilities
- Inputs/selects generally styled inline using tokens (height, border, background)
- Primary submits: `.btn-primary-token`; secondary/cancel: `.btn-outline-token`
- Use small grid helpers in page CSS (`.form-grid`, `.form-group`, etc.) where present

## Services and data flow

- Domain services encapsulate API calls (e.g., `vendorService`, `storeService`, `productService`)
- Keep DTO types close to services; pass typed data into components
- Typical pattern:
  - `useEffect` to load list on mount/open
  - Async handlers for create/update/delete with try/catch and notifications
  - Local component state for edit forms or expanded rows

## Accessibility and UX

- Use `aria-pressed` for toggle-like tabs or buttons
- Respect `:focus-visible`; utilities include `.focus-outline-primary`
- Keep interactive targets at least the small control height (`--control-height-sm`)

## Example patterns (sketches)

Header with search and primary action:

```tsx
<TableCard
  title="Items"
  search={<input className="filter-input" placeholder="Filter…" value={q} onChange={e=>setQ(e.target.value)} />}
  actions={<Button className="btn-primary-token" onClick={openCreate}>+ Add Item</Button>}
>
  {/* table here */}
</TableCard>
```

Footer pager:

```tsx
footer={
  <>
    <span style={{fontSize:12,color:'var(--color-text-dim)'}}>Total: {filtered.length}</span>
    <div style={{display:'inline-flex',gap:6,alignItems:'center'}}>
      <button className="pager-btn" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}><ChevronLeft size={16}/></button>
      <span style={{fontSize:12}}>Page {page} / {pageCount}</span>
      <button className="pager-btn" disabled={page>=pageCount} onClick={()=>setPage(p=>Math.min(pageCount,p+1))}><ChevronRight size={16}/></button>
    </div>
  </>
}
```

Row actions (labeled):

```tsx
<div className="row-actions" style={{display:'inline-flex',gap:10}}>
  <button type="button" className="action-link success" onClick={onEdit}>
    <Edit size={16}/> Edit
  </button>
  <button type="button" className="action-link danger" onClick={() => window.confirm('Delete?') && onDelete()}>
    <Trash2 size={16}/> Delete
  </button>
</div>
```

Row actions (compact in edit mode):

```tsx
<div className="row-actions" style={{display:'inline-flex',gap:8}}>
  <button type="button" className="icon-btn-plain icon-success" title="Save" onClick={onSave}><Save size={16}/></button>
  <button type="button" className="icon-btn-plain icon-danger" title="Cancel" onClick={onCancel}><X size={16}/></button>
</div>
```

## Do/Don’t

Do
- Reuse `TableCard` and token/utility styles
- Use labeled actions where identification matters (e.g., products list)
- Keep colors semantic via tokens (primary/success/error)
- Show quick confirmations for destructive actions

Don’t
- Hardcode colors (hex/rgb); avoid inline style colors
- Mix unrelated layout in shared components; prefer page-level composition
- Introduce new UI patterns without checking existing tokens/utilities

## Where to add styles

- Global/semantic utilities: `src/theme/utilities.css`
- Page-specific tweaks: co-located `*.css` next to the page (e.g., `VendorDetails.css`)

## Testing notes

- `src/setupTests.ts` present; prefer React Testing Library for components
- Test happy path + an edge (empty list, error state) when touching core list screens

## Adding a new list screen (checklist)

1) Create page under `src/pages/<area>/` and optional `PageName.css`
2) Implement data service in `src/services/` if needed
3) Compose with `TableCard`: title, search, actions
4) Implement filter + pagination via `useMemo`
5) Render table + empty state
6) Footer with summary + pager
7) Row actions with `.action-link` or `.icon-btn-plain`
8) Confirm destructive actions, notify outcomes
9) Keep styling token-driven; add page CSS only if needed

---

Questions or improvements? Propose updates to this guide in a PR under `docs/frontend/INSTRUCTIONS.md`.

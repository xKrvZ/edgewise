# Edgewise — "Meridian" Style Guide

The visual language for the Edgewise trading journal. It exists so the product
reads as a **deliberately crafted trading terminal**, not a default shadcn/ui
scaffold. Keep shadcn/ui as the component base — but every surface is re-skinned
through the tokens documented here.

> **Single source of truth:** all design tokens live in
> `apps/web/app/globals.css` (`:root`, `.dark`, and the `@theme inline` block).
> Components must consume **semantic tokens** (`bg-card`, `text-muted-foreground`,
> `text-success`, …) and must not hardcode hex values or Tailwind palette colors
> (`bg-zinc-800`, `text-emerald-500`, …).

---

## 1. Design direction

**Meridian** is dark-first, indigo-ink, and disciplined — with an intentional
**light mode** that mixes palettes: the main canvas stays clean off-white while
the left navigation uses a **deep indigo sidebar** for contrast. Dark mode
weaves the same indigo hue family through canvas, cards, and sidebar (deeper and
cooler than light) so both themes feel related without copying each other. The references
that shaped it: Bloomberg/terminal data density, Linear/Vercel-grade surface
craftsmanship, and modern fintech dashboards (KlindrOS "Twilight Trading Floor",
Kraken-style trading consoles).

Three rules carry the whole system:

1. **One brand accent, used sparingly.** A confident **indigo blue-purple** is reserved
   for interactive chrome — buttons, links, focus rings, active nav, selection,
   KPI gauges. It is _never_ used to encode data direction.
2. **Green and red are sacred, and only for data.** Profit/up is `--success`,
   loss/down is `--destructive`. Decoupling brand from P&L is the single biggest
   reason the UI no longer looks AI-generated (the default scaffold makes both
   emerald).
3. **Depth from flat surface steps, not decoration.** Four indigo-tinted
   background-color steps plus hairline borders and minimal shadows — no
   gradients, aurora washes, or glow orbs. Cards read as panels because they are
   a lighter step than the canvas, not because of a top-light gradient.

The "tells" we deliberately avoid: neutral zinc surfaces, the default `0.625rem`
radius everywhere, emerald-as-brand, pure-black backgrounds, system fonts.

---

## 2. Color system

Colors are stored as **HSL channel triplets** (`H S% L%`) so opacity modifiers
(`bg-success/15`) work everywhere. Consume them via the generated utilities
(`bg-*`, `text-*`, `border-*`) or `hsl(var(--token))` inside inline styles /
chart props.

### 2.1 Semantic roles

| Role | Token | Dark | Light | Usage |
| --- | --- | --- | --- | --- |
| Canvas | `--background` | `238 35% 7%` | `220 33% 96%` | App background (darkest step; indigo ink, never pure black) |
| Body text | `--foreground` | `238 20% 95%` | `224 32% 12%` | Primary text |
| Raised surface | `--card` | `238 28% 10%` | `220 28% 99%` | Cards, inputs, panels (lighter than canvas) |
| Overlay surface | `--popover` | `238 30% 13%` | `0 0% 100%` | Menus, dialogs, tooltips, toasts (lighter than card) |
| Control fill | `--secondary` | `238 22% 16%` | `220 18% 91%` | Secondary buttons, chips, alternate rows |
| Quiet fill | `--muted` | `238 22% 12%` | `220 22% 93%` | Filter bars, tracks, skeletons, table zebra |
| Quiet text | `--muted-foreground` | `238 16% 58%` | `220 14% 38%` | Labels, captions, secondary text |
| Hover fill | `--accent` | `238 28% 21%` | `238 40% 93%` | Hover/active surface for ghost items (indigo-tinted, not neutral gray) |
| Hover text | `--accent-foreground` | `238 20% 95%` | `238 28% 14%` | **Always** pair with `bg-accent` / `hover:bg-accent` |
| Text selection | `--selection` | `238 42% 36%` | `238 55% 84%` | `::selection` on main canvas |
| Selection text | `--selection-foreground` | `238 90% 96%` | `238 32% 12%` | Selected text color on main canvas |
| Hairline | `--border` | `238 20% 19%` | `220 18% 88%` | Dividers, card edges |
| Field edge | `--input` | `238 18% 23%` | `220 18% 86%` | Input/select borders + toggle tracks |
| Focus | `--ring` | = primary | = primary | Focus rings |

### 2.2 Brand accent — interactive ONLY

| Token | Dark | Light |
| --- | --- | --- |
| `--primary` (indigo) | `238 75% 68%` | `238 65% 55%` |
| `--primary-foreground` | `238 50% 9%` | `238 100% 99%` |

Use for: primary buttons, links, focus rings, active sidebar item, text
selection, KPI gauges (win-rate/profit-factor donuts, trader score radar).
**Do not** use to color a P&L number, candle, or up/down bar.

### 2.3 Status & data semantics

| Role | Token | Dark | Meaning |
| --- | --- | --- | --- |
| Gain / up / pass | `--success` | `152 58% 50%` | Positive P&L, winners, healthy thresholds |
| Loss / down / danger | `--destructive` | `356 78% 62%` | Negative P&L, losers, destructive actions, errors |
| Caution | `--warning` | `38 95% 58%` | At-risk states, mid thresholds, "checking" |
| Neutral info | `--info` | `205 90% 62%` | Informational accents, neutral series |

Helper: `pnlColor()` in `lib/format.ts` returns `text-success` / `text-destructive` /
`text-muted-foreground` — always route P&L coloring through it (or `<PnlValue>`).

### 2.4 Data-viz palette

A categorical palette tuned for dark surfaces (lifted luminance, mutual
contrast). Distinct from the gain/loss pair so series never read as P&L.

| Token | Dark | Hue |
| --- | --- | --- |
| `--chart-1` | `238 75% 68%` | Indigo |
| `--chart-2` | `172 70% 50%` | Teal |
| `--chart-3` | `38 95% 62%` | Amber |
| `--chart-4` | `205 90% 64%` | Sky |
| `--chart-5` | `330 78% 66%` | Rose |

Chart conventions: grid/axes use `hsl(var(--border))`; tick labels use
`hsl(var(--muted-foreground))` at 11px; tooltips use `--popover` + `--border` +
`--radius`; directional bars/areas/candles use `--success`/`--destructive`;
categorical series use `--chart-*`.

### 2.5 Sidebar tokens (theme-specific)

The sidebar is a **separate surface** from the main canvas. Both themes use the
same indigo hue family (`238°`); light mode is a saturated mid-depth indigo,
dark mode is a deeper indigo-navy that stays distinctly "dark mode".

| Token | Dark (indigo-navy) | Light (indigo) | Usage |
| --- | --- | --- | --- |
| `--sidebar` | `240 40% 18%` | `238 45% 22%` | Sidebar background |
| `--sidebar-foreground` | `238 20% 78%` | `238 18% 93%` | Nav labels, wordmark |
| `--sidebar-muted-foreground` | `238 18% 60%` | `238 22% 74%` | Eyebrows, secondary icons |
| `--sidebar-primary` | `238 75% 68%` | `238 80% 78%` | Active indicator, accent icon (periwinkle) |
| `--sidebar-accent` | `238 38% 22%` | `238 38% 32%` | Active/hover nav fill |
| `--sidebar-accent-foreground` | `238 22% 96%` | `0 0% 100%` | **Always** pair with `bg-sidebar-accent` |
| `--sidebar-primary-foreground` | `238 50% 9%` | `238 55% 14%` | Text on solid `bg-sidebar-primary` chips |
| `--sidebar-selection` | `238 38% 30%` | `238 50% 52%` | Text selection inside sidebar |
| `--sidebar-selection-foreground` | `238 22% 96%` | `0 0% 100%` | Selected text inside sidebar |
| `--sidebar-border` | `238 32% 16%` | `238 42% 34%` | Sidebar dividers |

**Rationale:** sharing the `238°` indigo family across themes ties dark and
light modes together without making dark mode a copy of light. Dark surfaces
stay deeper and cooler; P&L green/red and indigo brand accent on the canvas remain
unchanged.

### 2.5.1 Foreground/background pairs (contrast rules)

Every fill token has a matching foreground. **Never mix surfaces** — e.g. do not
put `text-foreground` on `bg-sidebar` or `hover:bg-accent` without
`hover:text-accent-foreground`.

| Surface | Background | Foreground | Muted text |
| --- | --- | --- | --- |
| Main canvas | `bg-background` / `bg-card` | `text-foreground` | `text-muted-foreground` |
| Hover / highlight (main) | `bg-accent` | `text-accent-foreground` | — |
| Overlays (menus, dialogs) | `bg-popover` | `text-popover-foreground` | `text-muted-foreground` |
| Sidebar | `bg-sidebar` | `text-sidebar-foreground` | `text-sidebar-muted-foreground` |
| Sidebar hover / active | `bg-sidebar-accent` | `text-sidebar-accent-foreground` | — |

**Sidebar components** (`sidebar-nav`, `account-selector`, `user-menu`, mobile
sheet, collapse toggle) must use the sidebar column — not generic `text-foreground`,
`bg-accent`, or `hover:bg-accent`. Use `Button` variants `sidebar` and
`sidebarOutline` for sidebar chrome.

**Main content** ghost/outline buttons, dropdown items, select options, table row
hover, and badges use `bg-accent` + `text-accent-foreground` together.

WCAG AA: body text ≥ 4.5:1, large text ≥ 3:1 on its background token pair.
Selection (`::selection`) uses `--selection` / `--selection-foreground` on the
main canvas; `.bg-sidebar ::selection` uses `--sidebar-selection` /
`--sidebar-selection-foreground`.

### 2.6 Flat surface hierarchy

Surfaces are distinguished by **background-color steps only** — no radial
aurora, mesh gradients, or card top-light washes.

**Dark mode (lightest → darkest):** `--popover` → `--card` → `--muted` /
`--secondary` (contextual) → `--background`.

**Light mode:** off-white `--background` canvas; `--card` is a tinted near-white
panel; `--popover` is pure white for overlays; `--muted` is a gray-indigo inset
for filter bars and quiet tracks.

Compose pages as `bg-background` with `bg-card` panels and `bg-muted` inset
toolbars (`PageFilterBar`). Never stack decorative gradients on top of tokens.

### 2.7 Theme switching

- **Provider:** `next-themes` via `components/theme-provider.tsx` in
  `app/layout.tsx` (`attribute="class"`, `defaultTheme="system"`).
- **Toggle:** User menu → **Theme** → Light / Dark / System. Preference persists
  in `localStorage`.
- **Charts:** TradingView and Lightweight Charts read CSS tokens and remount on
  `resolvedTheme` changes.

### 2.8 Accessibility

- Body and label text meet **WCAG AA** (≥ 4.5:1) on their surfaces; large/numeric
  display text meets ≥ 3:1. See §2.5.1 for required token pairs per surface.
- Never rely on color alone for gain/loss — pair with sign (`+`/`-`), arrows
  (`DirectionBadge`), or position (above/below zero line).
- Focus is always visible: `focus-visible:ring-2 ring-ring/70 ring-offset-2
  ring-offset-background` on main-content primitives; sidebar chrome uses
  `ring-sidebar-ring ring-offset-sidebar`.
- Text selection uses `--selection` tokens on the main canvas and
  `--sidebar-selection` inside `.bg-sidebar` — never bare `primary/28` overlays
  without a foreground color.

---

## 3. Typography

Wired via `next/font` (the `geist` package — bundled, no network at build) in
`app/layout.tsx`; exposed as `--font-sans` / `--font-mono` in `@theme`.

- **Geist Sans** — UI text. Mapped to `font-sans` (the default body font).
- **Geist Mono** — reserved for code/keyboard hints via `font-mono`.
- **Tabular figures** — all money/metrics use `tabular-nums` so columns align.
  Enabled globally for `.tabular-nums`; default body sets `cv02/cv03/cv04/cv11`
  Geist stylistic sets for cleaner glyphs.

### Scale & weight

| Token | Size | Weight | Use |
| --- | --- | --- | --- |
| Page title | `text-2xl` (24px) | `font-semibold` `tracking-tight` | `PageHeader` h1 |
| Card title | `text-base` (16px) | `font-semibold` | `CardTitle` |
| KPI value | `text-2xl`/`text-3xl` | `font-semibold` `tabular-nums` `tracking-tight` | Stat cards, gauges |
| Body | `text-sm` (14px) | `font-normal` | Default copy |
| Label / caption | `text-xs` (12px) | `font-medium` | Muted labels |
| Eyebrow | `text-[0.6875rem]` | `font-semibold` `uppercase` `tracking-widest` | Section dividers (sidebar, table heads) |

Limit weights to Regular / Medium / Semibold. Establish hierarchy with
weight + color (`foreground` vs `muted-foreground`), not many sizes.

---

## 4. Spacing, radius, elevation

- **Spacing:** 4px grid. Page gutter `px-4 sm:px-6 lg:px-8`, page width
  `max-w-screen-2xl`, top inset `pt-14 sm:pt-8 lg:pt-10` (immersive routes
  exempt). Card grids gap `gap-4`; stacked sections `mt-4`.
- **Radius:** base `--radius: 0.5rem` (8px). Scale: `sm` 4px, `md` 6px,
  `lg` 8px, `xl` 12px (cards), `2xl` 16px (auth/marketing). Crisper than the
  default scaffold's 10px-everywhere.
- **Elevation:** indigo-tinted shadow tokens `--shadow-xs|sm|md|lg`
  (`hsl(238 50% 4% / …)`). Cards rest at `shadow-sm`; overlays at `shadow-lg`.
  Prefer **flat surface steps** (`bg-background` → `bg-card` → `bg-popover`)
  plus hairline borders over heavy drop shadows or gradients.
- **No decorative gradients:** body canvas, cards, marketing hero, and sign-in
  use solid token backgrounds only. Chart area fills (SVG `linearGradient`) are
  allowed for data visualization.

---

## 5. Motion

- Keep it quick and physical: `transition-[…] duration-150`. Buttons depress with
  `active:translate-y-px`.
- Overlays use the shadcn `data-[state]` enter/exit (`fade`+`zoom-95`,
  directional `slide-in-from-*`); dialogs/sheets dim with a blurred
  `bg-background/70 backdrop-blur-sm` scrim.
- Animate `color/background/border/box-shadow/transform` — never layout. Respect
  reduced-motion (no large/looping motion introduced).

---

## 6. Component conventions

General: edit shared primitives in `components/ui/`, not per-page overrides.
Compose with tokens. Keep component APIs unchanged.

### Buttons (`button.tsx`)
- `default` = indigo brand, `shadow-sm` → `hover:shadow-md`.
- `outline` = `border-border bg-card` (sits on the canvas as a real surface).
- `secondary` = muted fill; `ghost` = accent hover; `destructive` = solid red.
- `sidebar` / `sidebarOutline` = sidebar token pairs (`bg-sidebar-accent`,
  `text-sidebar-accent-foreground`); use only inside `bg-sidebar`.
- `link` = brand underline. All share the ring-offset focus treatment.

### Badges (`badge.tsx`)
- Status badges are **tinted**, not solid: `bg-{role}/12 text-{role}
  border-{role}/25`. Variants: `default` (brand solid), `secondary`, `success`,
  `warning`, `destructive`, `outline`, `ghost`. Radius `rounded-md`.

### Cards (`card.tsx`)
- `rounded-xl border border-border bg-card shadow-sm` — flat fill, no gradient.
  Don't nest cards inside cards — use `--muted` panels for nested grouping.

### Inputs / Select / Textarea
- `border-input bg-card/60`, `hover:border-muted-foreground/40`,
  focus `border-ring ring-2 ring-ring/40`. Consistent across all field types.

### Tabs (`tabs.tsx`)
- Segmented control: `border-border bg-muted/60` track; active tab lifts to
  `bg-card shadow-sm`.

### Tables (`table.tsx`)
- Headers are quiet uppercase eyebrows (`text-xs uppercase tracking-wide
  text-muted-foreground`). Rows hover with `bg-accent/50`; selected rows use
  `bg-accent/60 text-accent-foreground`. Numerics `tabular-nums`, right-aligned
  for money.

### Overlays (dialog/sheet/popover/dropdown/select/tooltip)
- Surface `bg-popover`, `border-border`, `rounded-lg`/`rounded-xl`, `shadow-lg`.
- Modal/sheet scrim: `bg-background/70 backdrop-blur-sm`. Sheets adopt the
  sidebar surface for nav parity.

### App shell
- **Sidebar:** `bg-sidebar` with `text-sidebar-foreground`; active item =
  `bg-sidebar-accent` with a left `bg-sidebar-primary` indicator bar;
  secondary labels use `text-sidebar-muted-foreground`. Logo uses
  `variant="sidebar"` for on-indigo wordmark tokens. Light mode = saturated
  indigo; dark mode = deep indigo-navy (same hue family, lower lightness).
- **Top bar:** sticky, `bg-background/80 backdrop-blur`, hairline bottom border.
- **Empty/loading:** `EmptyState` uses a brand-tinted icon chip; `Skeleton`
  pulses on `bg-muted/70`.

### Stepper / Wizard (`stepper.tsx`)
- Brand for the active step circle and progress; completed steps use
  `bg-primary/15 text-primary`; future steps use `border-input`. Brand here is
  "interactive progress", not data.

---

## 7. Do / Don't

✅ **Do**
- `className="text-success tabular-nums"` for a positive P&L figure.
- `<Badge variant="warning">At risk</Badge>` for a caution chip.
- `stroke="hsl(var(--success))"` for an up area/line in Recharts.
- Reach for `--chart-*` for categorical series.

❌ **Don't**
- `text-primary` / `text-emerald-500` to color a profit number (brand ≠ data).
- `bg-zinc-900` / hex literals for a surface — use `bg-card` / `bg-muted`.
- Solid bright `bg-destructive` status pills — use the tinted badge variant.
- Add a new one-off color in a component — add a token, then consume it.

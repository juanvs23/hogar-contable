# DESIGN.md — Hogar Contable

## 1. Visual Theme & Atmosphere
- **Density**: Comfortable, readable whitespace. Not data-dense — designed for a single user without technical background.
- **Tone**: Friendly, trustworthy, warm. Financial data should feel safe and clear.
- **Dark mode**: Full support with automatic detection via `prefers-color-scheme`.
- **Philosophy**: Big text, clear hierarchy, no clutter. The user should understand their finances at a glance.

## 2. Color Palette & Roles

### Base (Mauve)

| Token | Light (OKLCH) | Dark (OKLCH) | Role |
|-------|---------------|--------------|------|
| `--background` | `1 0 0` (white) | `0.145 0.008 326` | Page background |
| `--foreground` | `0.145 0.008 326` | `0.985 0 0` (white) | Primary text |
| `--card` | `1 0 0` | `0.212 0.019 322.12` | Card/surface background |
| `--border` | `0.922 0.005 325.62` | `1 0 0 / 10%` | Borders, dividers |
| `--input` | `0.922 0.005 325.62` | `1 0 0 / 15%` | Input field borders |
| `--ring` | `0.711 0.019 323.02` | `0.542 0.034 322.5` | Focus ring outlines |

### Semantic

| Token | Light (OKLCH) | Dark (OKLCH) | Role |
|-------|---------------|--------------|------|
| `--primary` | `0.508 0.118 165.612` (teal) | `0.432 0.095 166.913` | Main CTAs, active state |
| `--primary-foreground` | `0.979 0.021 166.113` | `0.979 0.021 166.113` | Text on primary |
| `--secondary` | `0.967 0.001 286.375` | `0.274 0.006 286.033` | Secondary buttons |
| `--destructive` | `0.577 0.245 27.325` (red) | `0.704 0.191 22.216` | Delete, danger actions |
| `--muted` | `0.96 0.003 325.6` | `0.263 0.024 320.12` | Subtle backgrounds |
| `--accent` | `0.96 0.003 325.6` | `0.263 0.024 320.12` | Hover, highlight surfaces |

### Charts

| Token | Color | Use |
|-------|-------|-----|
| `--chart-1` | Teal `0.845 0.143 164.978` | Primary data series |
| `--chart-2` | Green `0.696 0.17 162.48` | Secondary series |
| `--chart-3` | Deep green `0.596 0.145 163.225` | Tertiary series |
| `--chart-4` | Teal `0.508 0.118 165.612` | Quaternary |
| `--chart-5` | Dark teal `0.432 0.095 166.913` | Quinary |

## 3. Typography

- **Font family**: `'Inter Variable', sans-serif` (loaded via `@fontsource-variable/inter`)
- **Fallback**: `system-ui, -apple-system, sans-serif`

### Type Scale

| Level | Size | Weight | Line Height | Token |
|-------|------|--------|-------------|-------|
| Display | 3rem (48px) | 700 | 1.1 | Tailwind `text-5xl` |
| H1 | 2.25rem (36px) | 700 | 1.2 | `text-4xl` |
| H2 | 1.875rem (30px) | 600 | 1.3 | `text-3xl` |
| H3 | 1.5rem (24px) | 600 | 1.35 | `text-2xl` |
| H4 | 1.25rem (20px) | 600 | 1.4 | `text-xl` |
| Body | 0.9375rem (15px) | 400 | 1.6 | `text-base` |
| Body Small | 0.875rem (14px) | 400 | 1.5 | `text-sm` |
| Caption | 0.75rem (12px) | 400 | 1.4 | `text-xs` |
| Monetary | 1.25rem (20px) | 700 | 1 | `font-bold text-xl` for amounts |
| Monetary Large | 2.25rem (36px) | 800 | 1 | Balance display |

## 4. Component Stylings

### Button (shadcn/ui `Button`)

| Variant | Light | Dark | Use |
|---------|-------|------|-----|
| `default` (teal) | `bg-primary` on white bg | `bg-primary` on dark bg | Primary CTAs |
| `secondary` | `bg-secondary` | `bg-secondary` | Secondary actions |
| `outline` | `border-border bg-background` | Same with dark bg | Tertiary, cancel |
| `ghost` | `hover:bg-muted` | Same | Toolbar, icon buttons |
| `destructive` | `bg-destructive/10 text-destructive` | Same on dark | Delete |
| `link` | `text-primary underline-offset-4` | Same | Inline links |

**Sizes**: `xs` (h-6), `sm` (h-7), `default` (h-8), `lg` (h-9), `icon` (w-8 h-8)

**Interaction**: Active state pushes down 1px. Focus-visible shows ring outline.

### Input Fields

- Background: `bg-background`
- Border: `border-input` 
- Focus: `ring-3 ring-ring/50 border-ring`
- Placeholder: `text-muted-foreground`
- Disabled: `opacity-50 cursor-not-allowed`
- Error: `border-destructive ring-destructive/20`
- Shape: Rounded with `--radius` 0.625rem

### Cards

- Background: `bg-card`
- Border: `border-border`
- Shadow: none (flat), elevation via surface hierarchy
- Padding: `p-4` (1rem) standard, `p-6` for hero cards

### Tabs

- Active: `bg-background text-foreground shadow-sm`
- Inactive: `text-muted-foreground hover:text-foreground`
- Border bottom indicators for tab groups

### Table / Data Grid (for transaction list)

- Header: `bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider`
- Row hover: `hover:bg-muted/50`
- Monetary column: right-aligned, tabular-nums
- Density: comfortable, `py-3` per row

### Badge / Chip

- `bg-primary/10 text-primary` for positive (income)
- `bg-destructive/10 text-destructive` for negative (expenses)
- `bg-muted text-muted-foreground` for neutral

### Dialog / Modal

- Overlay: `bg-black/50` (light), `bg-black/80` (dark)
- Content: `bg-card shadow-lg rounded-lg max-w-md mx-auto`
- Animation: fade in + scale (via framer or native)

## 5. Layout Principles

- **Spacing scale**: Tailwind defaults (`0.25rem` increments from `p-1` to `p-8`)
- **Max content width**: `max-w-7xl` (1280px) for desktop screens
- **Sidebar**: Collapsible sidebar navigation with `w-64` expanded, `w-16` collapsed
- **Header**: Compact top bar with month/year selector and currency indicator
- **Grid**: 2-column on desktop (sidebar + content), 1-column on mobile
- **Whitespace**: Generous; financial data needs breathing room

### Page Structure
```
┌─────────────────────────────────────┐
│ Header (month selector, balance)    │
├────────┬────────────────────────────┤
│ Sidebar│ Content                    │
│        │ ┌──────────────────────┐   │
│ • Dash │ │ Dashboard cards      │   │
│ • Trans│ │ (income, expenses,   │   │
│ • Rep. │ │  balance)            │   │
│ • Cierre│ └──────────────────────┘   │
│        │ ┌──────────────────────┐   │
│        │ │ Recent transactions   │   │
│        │ └──────────────────────┘   │
└────────┴────────────────────────────┘
```

## 6. Depth & Elevation

- **Flat by default**: No box shadows on cards on light mode
- **Hover**: `shadow-sm` on interactive cards
- **Modals**: `shadow-lg`
- **Dropdowns / Popovers**: `shadow-md` with `border-border`
- **Dark mode**: Slight glow via `border-white/10` rather than shadows

## 7. Do's and Don'ts

| Do | Don't |
|----|-------|
| Use monetary font weight (700-800) for all amounts | Never use light/cursive text for money |
| Always show both Bs and USD when currency toggle is active | Don't hide currency context |
| Confirm destructive actions with a dialog | Don't delete without confirmation |
| Keep month context always visible in header | Don't let user lose track of "what month am I looking at" |
| Show a loading skeleton for data-heavy screens | Don't show raw spinners for data tables |
| Use chart-1..5 colors in consistent order | Don't reuse chart colors for UI elements |
| Show empty state with icon + message when no data | Don't show empty tables with no context |

## 8. Responsive Behavior

- **Desktop (1024px+)**: Sidebar visible, 2-column layout
- **Tablet (768-1023px)**: Sidebar collapsed to icons, content full width
- **Mobile (<768px)**: Bottom navigation bar, full-width content
- **Touch targets**: Minimum 44px for interactive elements on touch devices
- **Font scaling**: No scaling down below 14px body text

## 9. Accessibility

- **Contrast**: All text/background pairs meet WCAG AA standard
- **Focus indicators**: `ring-3 ring-ring/50` on all interactive elements
- **Labels**: Every input has an associated label (not placeholder-only)
- **Color not sole indicator**: Monetary values also show + / - prefix

## 10. Agent Prompt

When generating UI for Hogar Contable:
- Use shadcn/ui components from `src/components/ui/`
- Import utility: `import { cn } from "@/lib/utils"`
- Use Tailwind CSS classes for layout; CSS variables for colors
- Default to light mode with `dark:` variants for dark mode
- Use `lucide-react` for icons (already in dependency)
- Monetary amounts: use `new Intl.NumberFormat("es-VE", { style: "currency", currency: "VES" })` for bolívars
- USD: `new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })`
- Always show both currencies when available

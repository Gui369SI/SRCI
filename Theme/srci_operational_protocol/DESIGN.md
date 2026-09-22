---
name: SRCI Operational Protocol
colors:
  surface: '#fff8f4'
  surface-dim: '#e2d8cf'
  surface-bright: '#fff8f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fcf2e9'
  surface-container: '#f6ece3'
  surface-container-high: '#f1e6dd'
  surface-container-highest: '#ebe1d8'
  on-surface: '#1f1b15'
  on-surface-variant: '#454650'
  inverse-surface: '#35302a'
  inverse-on-surface: '#f9efe6'
  outline: '#767681'
  outline-variant: '#c6c5d2'
  surface-tint: '#4c5a9d'
  primary: '#00062e'
  on-primary: '#ffffff'
  primary-container: '#071a5c'
  on-primary-container: '#7685cb'
  inverse-primary: '#b8c3ff'
  secondary: '#4a43dd'
  on-secondary: '#ffffff'
  secondary-container: '#635ff7'
  on-secondary-container: '#fffbff'
  tertiary: '#000c1c'
  on-tertiary: '#ffffff'
  tertiary-container: '#002341'
  on-tertiary-container: '#438dd6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b8c3ff'
  on-primary-fixed: '#001356'
  on-primary-fixed-variant: '#334283'
  secondary-fixed: '#e2dfff'
  secondary-fixed-dim: '#c2c1ff'
  on-secondary-fixed: '#0d006a'
  on-secondary-fixed-variant: '#3226c8'
  tertiary-fixed: '#d2e4ff'
  tertiary-fixed-dim: '#9fcaff'
  on-tertiary-fixed: '#001d36'
  on-tertiary-fixed-variant: '#00497e'
  background: '#fff8f4'
  on-background: '#1f1b15'
  surface-variant: '#ebe1d8'
  charcoal-black: '#050505'
  surface-card: '#FFFFFF'
  surface-canvas: '#F7F6F4'
  surface-subtle: '#EEE9E4'
  status-pending: '#D97706'
  status-pending-bg: '#FEF3C7'
  status-approved: '#2563EB'
  status-approved-bg: '#EFF6FF'
  status-rejected: '#DC2626'
  status-rejected-bg: '#FEF2F2'
  status-delivered: '#059669'
  status-delivered-bg: '#ECFDF5'
  status-cancelled: '#6B7280'
  status-cancelled-bg: '#F3F4F6'
  stock-critical-border: '#B91C1C'
  stock-critical-bg: '#FFF1F2'
  stock-critical-text: '#991B1B'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.03em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 26px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
  code-num:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: -0.01em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system serves the internal requisition and inventory governance workflow (SRCI), an enterprise-grade utility that enforces zero loss, end-to-end traceability, and multi-tier departmental approvals. The target audience spans warehouse supervisors (almoxarifes), department approvers, IT directors, and standard internal requesters.

The visual direction adopts **Corporate Modernism with Precision High-Density Utility**. It fuses military-grade audit clarity with refined executive polish:
- **Tone:** Authoritative, methodical, tamper-proof, and responsive.
- **Atmosphere:** Deep navy anchor foundations balanced by metallic champagne/sand neutral surfaces, bright cobalt action triggers, and high-legibility state indicators.
- **Ergonomics:** Prioritizes dense tabular throughput, frictionless scanability of stock levels, visual anti-duplication alerts, and immediate transactional feedback.

## Colors

The palette establishes an unshakeable institutional hierarchy rooted in the brand insignia:

- **Primary (`#071A5C` — Deep Midnight Navy):** Governs foundational navigation shells, executive summary hero bars, primary buttons, modal headers, and active state indicators.
- **Secondary (`#3327C9` — Electric Indigo):** Applied to active navigation indicators, hover states of high-priority triggers, dynamic counter badges, and focus boundary rings.
- **Tertiary (`#3581CA` — Operational Azure):** Powers supportive interactive elements, table row highlights, data links, secondary filter controls, and interactive stock chart vectors.
- **Neutral (`#E6DCD3` — Metallic Champagne / Sand):** The structural bedrock for subtle divider rules, card borders, table column strokes, and contextual secondary containers, preventing pure sterile gray fatigue and echoing physical hardware casing.
- **Base Canvas & Surfaces:** `#F7F6F4` for main application canvas, `#FFFFFF` for primary data cards and tabular records, and `#050505` for deep contrast typographic labels and numerical telemetry.

### Workflow & State Tokens
- **Pendente:** Amber (`#D97706` text, `#FEF3C7` fill) denoting triage required.
- **Aprovada:** Corporate Blue (`#2563EB` text, `#EFF6FF` fill) signaling clearance for fulfillment.
- **Rejeitada:** Crimson (`#DC2626` text, `#FEF2F2` fill) with persistent mandatory rejection annotation.
- **Entregue:** Emerald (`#059669` text, `#ECFDF5` fill) indicating immutable warehouse discharge.
- **Cancelada:** Slate (`#6B7280` text, `#F3F4F6` fill) for voided cycles.
- **Estoque Crítico (≤ Estoque Mínimo):** High-urgency alert state (`#991B1B` text, `#FFF1F2` background, `#B91C1C` border) with pulsating icon indicator.

## Typography

The typographic architecture balances technical rigor with structural authority:
- **Headings (Plus Jakarta Sans):** Employs tight letter tracking and robust geometric forms to communicate structural precision and institutional authority across dashboard hero metrics and requisition flow titles.
- **Body & Tabular Layouts (Inter):** Highly legible, neutral sans-serif designed for micro-reading, dense inventory tables, audit stamps, and form inputs.
- **Data & Telemetry (`code-num`):** Utilizes `font-feature-settings: 'tnum' on, 'zero' on` to force tabular lining numbers, ensuring that numerical stock counters, SKUs, timestamps, and balance deltas remain mathematically aligned across vertical table rows.

## Layout & Spacing

The system implements a rigid 12-column fluid grid calibrated for administrative data density:
- **Mobile (< 768px):** 4-column flow, `1rem` edge margins, stacked full-width requisition approval cards, and horizontally scrollable mini-tables.
- **Tablet (768px – 1024px):** 8-column layout with a collapsed 64px icon rail sidebar and `1.5rem` gutter grid.
- **Desktop (> 1024px):** 12-column layout with a fixed 260px administrative navigation sidebar, 1440px maximum viewport constraint for inner views, and `1.5rem` structural gutters.

Internal component spacing adheres to an 8px grid (with 4px half-steps for compact data rows, badges, and inline status chips), keeping metric density high without visual clutter.

## Elevation & Depth

Visual hierarchy leverages crisp surface borders combined with low-diffusion ambient shadows:
- **Base Canvas:** Flat background (`#F7F6F4`) with zero elevation.
- **Level 1 (Data Cards & Table Containers):** Pure white background (`#FFFFFF`) framed by a 1px solid stroke in `#E6DCD3`, reinforced by an ambient drop shadow: `0 1px 3px rgba(7, 26, 92, 0.04), 0 1px 2px rgba(5, 5, 5, 0.02)`.
- **Level 2 (Dropdowns, Popovers & Hover Cards):** Floated surface with `0 4px 12px rgba(7, 26, 92, 0.08), 0 2px 4px rgba(5, 5, 5, 0.04)` and border `#D3C6B9`.
- **Level 3 (Modals & Confirmation Drawers):** High-priority focus layer backed by a 40% opacity Midnight Navy overlay (`rgba(7, 26, 92, 0.45)`) with backdrop blur of `4px` and shadow `0 20px 25px -5px rgba(7, 26, 92, 0.15), 0 8px 10px -6px rgba(5, 5, 5, 0.1)`.
- **Critical Alert Surface:** Subtle inner perimeter glow for out-of-stock items (`box-shadow: inset 0 0 0 1px #B91C1C, 0 1px 2px rgba(185, 28, 28, 0.06)`).

## Shapes

The design system maintains a refined, slightly softened industrial aesthetic (`roundedness: 1`):
- **Inputs, Buttons, and Table Headers:** 4px (`0.25rem`) corner radius.
- **Cards, Panels, and Container Shells:** 8px (`0.5rem`) corner radius (`rounded-lg`).
- **Modal Dialogs and Drawers:** 12px (`0.75rem`) corner radius (`rounded-xl`).
- **Status Pills and Counter Tags:** Capsule pill shape (`9999px`) to create an unmistakable semantic contrast against rectilinear inputs and structural layout containers.

## Components

### Buttons
- **Primary:** Solid Deep Navy (`#071A5C`) fill, white text, 4px border radius, font-weight 600. Hover: Electric Indigo (`#3327C9`). Focus: 2px offset ring in `#3581CA`.
- **Secondary:** Surface white fill with 1.5px solid border in `#E6DCD3`, text in `#071A5C`. Hover: Background `#EEE9E4`.
- **Destructive:** Solid Crimson (`#DC2626`) fill or 1px Crimson border with `#DC2626` text for rejection/cancellation actions.
- **Action (In-table):** Compact padding (`4px 8px`), font size 12px, instant response states.

### Status Chips & Stock Badges
- **Status Chips:** Height 22px, padding `2px 8px`, uppercase tracking (`0.04em`), 11px font size, semi-bold weight. Applied to request stages:
  - *Pendente:* Amber background (`#FEF3C7`), text `#D97706`.
  - *Aprovada:* Light Azure background (`#EFF6FF`), text `#2563EB`.
  - *Rejeitada:* Soft Rose background (`#FEF2F2`), text `#DC2626`.
  - *Entregue:* Soft Emerald background (`#ECFDF5`), text `#059669`.
  - *Cancelada:* Neutral Gray background (`#F3F4F6`), text `#6B7280`.
- **Estoque Crítico (Inventory Alert):** Warning badge featuring a pulsing dot (`#DC2626`) alongside `ESTOQUE CRÍTICO: ≤ {qtd_minima}` inside a `#FFF1F2` container bordered by `#FCA5A5`.

### Input Fields & Select Controls
- **Standard Input:** Height 38px, background `#FFFFFF`, border 1px solid `#E6DCD3`, text `#050505`.
- **Focus State:** Border color `#3327C9` paired with an electric focus halo (`0 0 0 3px rgba(51, 39, 201, 0.15)`).
- **Anti-Duplicity Guard Box:** Reactive inline warning card triggered during item selection if the user possesses an open order for that item. Background `#FFFBEB`, border 1px solid `#F59E0B`, text `#92400E`, with immediate link to view the existing order.

### Tables (Data Grid)
- **Header:** Background `#EEE9E4`, border-bottom 2px solid `#E6DCD3`, uppercase 11px labels (`#071A5C`), height 36px.
- **Rows:** Alternating subtle row zebra striping optional; default `#FFFFFF` with 1px border-bottom `#F0EAE4`. Row height 44px for standard items, 38px for dense audit lists. Hover state triggers a tertiary wash (`rgba(53, 129, 202, 0.05)`).
- **Numbers & Units:** Tabular figures aligned right; status badges centered.

### Cards & Metric Panels
- Constructed on pure white (`#FFFFFF`) with a 1px border in `#E6DCD3`.
- Header section separated by a hairline divider. KPI metric panels highlight quantities in 28px `Plus Jakarta Sans` Bold in `#071A5C`, flanked by auxiliary delta indicators.
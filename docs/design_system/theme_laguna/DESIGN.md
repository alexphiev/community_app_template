---
name: Lagune
colors:
  surface: '#f6faf9'
  surface-dim: '#d7dbd9'
  surface-bright: '#f6faf9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f4f3'
  surface-container: '#ebefed'
  surface-container-high: '#e5e9e7'
  surface-container-highest: '#dfe3e2'
  on-surface: '#181d1c'
  on-surface-variant: '#3e4948'
  inverse-surface: '#2c3131'
  inverse-on-surface: '#edf2f0'
  outline: '#6e7978'
  outline-variant: '#bdc9c7'
  surface-tint: '#006a65'
  primary: '#006560'
  on-primary: '#ffffff'
  primary-container: '#00807a'
  on-primary-container: '#e0fffb'
  inverse-primary: '#76d6cf'
  secondary: '#a33d2a'
  on-secondary: '#ffffff'
  secondary-container: '#fe8269'
  on-secondary-container: '#731b0b'
  tertiary: '#8b4627'
  on-tertiary: '#ffffff'
  tertiary-container: '#a95e3d'
  on-tertiary-container: '#fff6f4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#93f3eb'
  primary-fixed-dim: '#76d6cf'
  on-primary-fixed: '#00201e'
  on-primary-fixed-variant: '#00504c'
  secondary-fixed: '#ffdad3'
  secondary-fixed-dim: '#ffb4a5'
  on-secondary-fixed: '#3e0400'
  on-secondary-fixed-variant: '#832615'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb597'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#743417'
  background: '#f6faf9'
  on-background: '#181d1c'
  surface-variant: '#dfe3e2'
  teal-50: '#F0F9F9'
  teal-700: '#00807A'
  teal-900: '#00403D'
  coral-700: '#BB4F3A'
  neutral-900: '#1A2020'
  neutral-50: '#F4F7F7'
typography:
  hero-title:
    fontFamily: Bricolage Grotesque
    fontSize: 49px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-h1:
    fontFamily: Bricolage Grotesque
    fontSize: 39px
    fontWeight: '700'
    lineHeight: '1.15'
  headline-h2:
    fontFamily: Bricolage Grotesque
    fontSize: 31px
    fontWeight: '600'
    lineHeight: '1.25'
  headline-h3:
    fontFamily: Bricolage Grotesque
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.35'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.55'
  body-base:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-xs:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.5'
    letterSpacing: 0.02em
  label-2xs:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: '1.45'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  gutter-mobile: 16px
  gutter-desktop: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  target-touch: 44px
  target-mobile: 48px
---

## Brand & Style

The design system establishes a **Corporate Modern** aesthetic tailored for institutional SaaS, balancing the authority of a public service with the efficiency of a high-performance tool. The brand personality is professional, calm, and "accessible by construction," ensuring clarity for a diverse user base.

The visual narrative is driven by **generous whitespace** and a **flat, high-contrast** execution inspired by the Shadcn/ui aesthetic. To honor the visual identity of Info Jeunes, the system incorporates a subtle 15-degree kinetic slant in specific decorative elements and uses a unique "Coral Accent Line" (a 3px vertical signature) to signal active states and focus, reflecting the dynamic and forward-leaning nature of the brand.

## Colors

The palette is anchored in **perceptual uniformity** using OKLCH to ensure WCAG 2.2 AA compliance across all interactive states.

- **Primary (Teal):** Used for core branding and primary actions. The base `#00807A` is optimized for accessibility on light backgrounds.
- **Accent (Coral):** Reserved for "punctuation"—used for secondary CTAs, highlights, and the signature 3px accent bar. It should never exceed 10% of the screen surface.
- **Neutrals:** A teal-tinted gray scale (Hue 200-215) maintains a cohesive, cool-toned professional atmosphere.
- **Dark Mode:** In dark environments, primary and accent colors shift to lighter LCH values (Teal-400/Coral-400) to maintain legibility without causing eye strain.

## Typography

This design system uses a dual-font strategy to differentiate editorial impact from functional clarity.

- **Display & Headlines:** *Bricolage Grotesque* provides a distinctive, characterful voice for titles. Its quirky, geometric construction reflects modern SaaS sensibilities.
- **Body & UI:** *Inter Variable* is the workhorse for all functional text. It is set to a base of 16px to ensure maximum readability.
- **Tabular Data:** Use *JetBrains Mono* for numerical alignment in tables or dashboards to ensure vertical scanning accuracy.
- **Hierarchy:** High-contrast scaling (1.25 ratio) is used for titles, while body text remains linear for density.

## Layout & Spacing

The layout is built on a **4px rigid grid** with a focus on progressive density. 

- **Grid Model:** A 12-column fluid grid for desktop, collapsing to 4 columns for mobile.
- **Touch Targets:** A strict minimum of 44px for desktop and 48px for mobile icon buttons to ensure accessibility for all users.
- **Philosophy:** Generous whitespace is a core principle. Cards and panels use 24px internal padding on desktop, reducing to 16px on mobile to preserve screen real estate.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Tinted Shadows** rather than traditional black dropshadows.

- **Shadow Character:** Shadows use a Teal-tinted gray (Hue 215) with low opacity. This creates a "submerged" depth effect that feels integrated into the interface.
- **Rest State:** Elements like cards use a very soft `shadow-sm` for definition against the background.
- **Interactive State:** Hovering over interactive cards or dropdowns triggers `shadow-md` for a clear "lift" effect.
- **Dark Mode:** Shadows are disabled. Depth is instead conveyed via surface luminosity—higher elevation elements use lighter shades of neutral-900.

## Shapes

The shape language is **Refined and Modern**, utilizing medium roundedness to soften the institutional nature of the product.

- **Base Radius:** 0.5rem (8px) for primary containers.
- **Buttons & Inputs:** 6px (sm) for a crisp, precise feel.
- **Modals:** 14px (lg) to create a distinct, friendly separation from the main UI.
- **Specialty Shapes:** 9999px (Pills) are reserved exclusively for status badges and tags.
- **Info Jeunes Motif:** Large brand containers should adopt a 15-degree slant on vertical edges where appropriate to mirror the brand logo's energy.

## Components

- **Buttons:** Primary buttons use `teal-700` with white text. Secondary buttons use a flat outline or ghost style. All buttons use 6px corner radius.
- **The Coral Accent:** On sidebars, active navigation items, or hovered cards, a 3px vertical Coral bar must appear on the left edge.
- **Input Fields:** Use a subtle `neutral-200` border that thickens and changes to `teal-600` on focus.
- **Cards:** White background with a 1px `neutral-200` border and `shadow-sm`. Padding is strictly 24px.
- **Icons:** Use *Lucide-react* with a 1.5px stroke. For "Destructive" or "Danger" actions, icons are mandatory to ensure the Coral accent isn't confused with a status indicator.
- **Badges:** Use small, all-caps text with a `full` pill radius and low-saturation backgrounds (`teal-100` or `coral-100`).
---
name: EncontreAqui Imóveis Design System
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#4e4634'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#807662'
  outline-variant: '#d1c5ae'
  surface-tint: '#765b00'
  primary: '#765b00'
  on-primary: '#ffffff'
  primary-container: '#ffce44'
  on-primary-container: '#725800'
  inverse-primary: '#f0c037'
  secondary: '#545f73'
  on-secondary: '#ffffff'
  secondary-container: '#d5e0f8'
  on-secondary-container: '#586377'
  tertiary: '#505f76'
  on-tertiary: '#ffffff'
  tertiary-container: '#c5d5ef'
  on-tertiary-container: '#4c5c72'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdf93'
  primary-fixed-dim: '#f0c037'
  on-primary-fixed: '#241a00'
  on-primary-fixed-variant: '#594400'
  secondary-fixed: '#d8e3fb'
  secondary-fixed-dim: '#bcc7de'
  on-secondary-fixed: '#111c2d'
  on-secondary-fixed-variant: '#3c475a'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  headline-xl:
    fontFamily: DM Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: DM Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: DM Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  headline-md:
    fontFamily: DM Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
  price-display:
    fontFamily: DM Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: -0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-max: 1280px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The visual identity of the design system is anchored in **Professional Modernism**. It aims to evoke feelings of reliability, transparency, and optimism. By combining a high-energy primary yellow with a stable, corporate slate palette, the interface balances the excitement of finding a new home with the seriousness of a high-value real estate transaction.

The style utilizes **Soft Minimalism** with subtle **Tonal Layering**. It avoids harsh lines in favor of approachable rounded corners, while maintaining a clean, systematic grid that communicates precision. Whitespace is used strategically to ensure property imagery remains the focal point, reducing cognitive load during the search process.

## Colors

The palette is designed for high legibility and clear action hierarchy.

*   **Primary Yellow (#FFCE44):** Used exclusively for primary calls-to-action (CTAs), highlights, and active states. It represents the "key" to the property and provides high visibility.
*   **Deep Slate (#1E293B):** Used for primary headings and body text to ensure maximum contrast and a sophisticated, professional feel.
*   **Muted Blue-Grey (#64748B):** Reserved for secondary text, icons, and borders to create a clear visual hierarchy.
*   **Foundation Greys (#F8FAFC & #FFFFFF):** These provide the "canvas." Light grey is used for section backgrounds and input fields to differentiate them from the pure white surface of cards and containers.

## Typography

The typographic system uses a dual-font approach to balance character with utility. 

**DM Sans** is the primary display face, used for headlines and price points. Its geometric nature provides a modern, clean look that feels architectural. 

**Hanken Grotesk** is the workhorse font for body copy and UI labels. It offers exceptional legibility at smaller sizes and a slightly more "tech-forward" feel that suits a modern platform. 

For property prices, always use the `price-display` token to ensure the financial information is the most prominent element in the card hierarchy.

## Layout & Spacing

This design system employs a **Fixed Grid** model for desktop to ensure content remains readable on ultra-wide monitors, transitioning to a **Fluid Grid** for tablet and mobile devices.

*   **Desktop (1280px+):** 12-column grid with 24px gutters. Content is centered with wide margins to create a premium, breathable feel.
*   **Tablet (768px - 1279px):** 8-column fluid grid. Margins reduce to 32px.
*   **Mobile (<767px):** 4-column fluid grid. Margins are 20px. 

Vertical rhythm follows a 4px baseline. Components like property cards should use `stack-md` (16px) for internal padding to maintain a compact yet clear information density.

## Elevation & Depth

Visual hierarchy is achieved through a combination of **Tonal Layering** and **Soft Ambient Shadows**. 

1.  **Level 0 (Background):** #F8FAFC. The base layer for the entire application.
2.  **Level 1 (Cards/Containers):** #FFFFFF with a very soft, diffused shadow (0px 4px 20px rgba(30, 41, 59, 0.05)). This is the primary surface for property listings and search filters.
3.  **Level 2 (Hover/Active):** A slightly more pronounced shadow (0px 10px 25px rgba(30, 41, 59, 0.1)) to indicate interactivity.
4.  **Overlays (Modals/Dropdowns):** Pure white background with a 1px border of #E2E8F0 to ensure crisp edges against other white surfaces.

Shadows should always use the `secondary_color` (Slate) as their base tint rather than pure black to maintain a cohesive, natural appearance.

## Shapes

The shape language is consistently **Rounded**, reflecting the friendly and welcoming nature of finding a home. 

*   **Standard Components:** Buttons, input fields, and small tags use a 0.5rem (8px) radius.
*   **Container Elements:** Property cards and search modules use 1rem (16px) radius to create a soft, distinct frame for imagery.
*   **Images:** When nested inside cards, image top-corners must match the container's 1rem radius.

## Components

### Buttons
*   **Primary:** Background `#FFCE44`, Text `#1E293B`, Bold weight. No border. On hover, darken by 5%.
*   **Secondary/Outline:** Transparent background, 2px border `#1E293B`, Text `#1E293B`.
*   **Ghost:** No background or border. Used for "Cancel" or "Início" navigation links.

### Input Fields
*   Background `#F8FAFC`, 1px border `#E2E8F0`. 
*   Icons (like the search magnifying glass) should be `#64748B`.
*   On focus, the border changes to `#FFCE44` with a 2px outer glow.

### Property Cards
*   White background, 16px border radius.
*   High-quality photography is mandatory.
*   Price is placed at the bottom left using `price-display`.
*   Status chips (e.g., "Venda", "Disponível") are placed as overlays on the image top-left.

### Chips & Badges
*   Used for property features (e.g., "3 Quartos", "2 Vagas").
*   Light grey background `#F1F5F9` with `#64748B` text.
*   Pill-shaped (fully rounded) to contrast against the 8px radius of buttons.

### Search Bar (Hero)
*   A large, integrated component with multiple dropdown selectors.
*   Uses a white background with Level 2 elevation to float over hero imagery.
*   The final "Buscar" button must be the most prominent Primary Yellow element.
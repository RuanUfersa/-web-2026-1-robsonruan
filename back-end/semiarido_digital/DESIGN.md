# Design System Strategy: The Institutional Curator

## 1. Overview & Creative North Star
The design system for UFERSA is anchored by the **"The Institutional Curator"** Creative North Star. For a university library management platform, the interface must move beyond a utilitarian database and transform into an authoritative, serene, and organized space for knowledge.

This system rejects the "standard dashboard" look. Instead of cluttered grids and heavy borders, it uses **Atmospheric Professionalism**. We achieve this through:
- **Intentional Asymmetry:** Strategic use of white space to draw the eye to critical data and primary actions.
- **Tonal Depth:** Replacing harsh lines with shifts in background luminosity.
- **Editorial Typography:** Utilizing high-contrast scales that prioritize readability while maintaining an elite academic feel.

The goal is to feel "Academic-Modern"—a blend of traditional institutional trust (the deep Azul Ufersa) and the forward-thinking vitality of the Semi-Arid region (the vibrant Verde Ufersa).

---

## 2. Colors
Our palette is rooted in the academic prestige of the institution, utilized through a sophisticated layering logic.

### Core Palette Roles
- **Primary (`#082853`):** The "Azul Ufersa" anchor. Used for high-impact brand moments and deep navigation.
- **Secondary (`#496800` / `#99CC33`):** The "Verde Ufersa" accent. Used for success states, active book status, and growth-related metrics.
- **Tertiary (`#002F1D`):** Deep botanical tones for high-level data visualization and sophisticated labeling.
- **Neutral Surface Palette:** Ranging from `surface-container-lowest` (#FFFFFF) to `surface-dim` (#CADAFF).

### The "No-Line" Rule
To ensure a premium feel, **1px solid borders are prohibited for sectioning.** Boundaries must be defined solely through background color shifts. For example, a search panel (`surface-container-low`) should sit on the main page background (`surface`) without a stroke. Use the color hierarchy to define the edge.

### Surface Hierarchy & Nesting
Treat the UI as physical layers of "Academic Vellum." 
- **Base Layer:** `surface` (#F9F9FF).
- **Embedded Content:** `surface-container` (#E8EDFF).
- **Elevated Interactive Objects:** `surface-container-lowest` (#FFFFFF).

### Signature Textures (The Gradient Rule)
Avoid flat digital fills on large surfaces. Utilize the provided "Gradientes Ufersa" for hero backgrounds or primary call-to-actions. Transitioning from **Azul Ufersa 1** (#243E6A) to **Verde Ufersa 4** (#14C286) creates a visual "soul" that mimics the light of the Semi-Arid landscape.

---

## 3. Typography
The system uses a pairing of **Manrope** for structural authority and **Public Sans** for neutral, high-legibility data reading.

| Level | Token | Font | Size | Weight | Intent |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display** | `display-lg` | Manrope | 3.5rem | 700 | Heroic landing headers |
| **Headline**| `headline-md` | Manrope | 1.75rem | 600 | Library Section Titles |
| **Title**   | `title-md` | Public Sans | 1.125rem | 600 | Book Titles, Card Headers |
| **Body**    | `body-md` | Public Sans | 0.875rem | 400 | General metadata, abstracts |
| **Label**   | `label-md` | Public Sans | 0.75rem | 500 | Tags, status labels |

**Editorial Contrast:** Always pair a large `headline-lg` in **Azul Ufersa** with `body-md` in `on-surface-variant` (#44474F) to create a clear information hierarchy that feels like a published journal.

---

## 4. Elevation & Depth
Depth is achieved through **Tonal Layering** and light physics, not drop-shadow effects.

- **The Layering Principle:** To create a card, do not use a border. Use a `surface-container-lowest` (#FFFFFF) card on a `surface-container-low` (#F1F3FF) background. The subtle shift in hex code provides all the separation the eye needs.
- **Ambient Shadows:** For "floating" components like Modals or Floating Action Buttons (FABs), use extra-diffused shadows:
  - `Blur: 24px`, `Spread: 0`, `Opacity: 6%`, `Color: #001A40` (tinted blue).
- **Glassmorphism:** For top navigation bars, use `surface` at 80% opacity with a `backdrop-blur: 12px`. This keeps the library content visible as the user scrolls, creating a sense of transparency and modern flow.
- **The "Ghost Border" Fallback:** If accessibility requires a border, use the `outline-variant` (#C4C6D0) at **15% opacity**.

---

## 5. Components

### Buttons
- **Primary:** Gradient fill (Azul 1 to Azul 2) with `on-primary` text. No border. Roundedness: `md` (0.375rem).
- **Secondary:** `surface-container-highest` background with `primary` text.
- **Tertiary:** No background. `primary` text with a subtle underline on hover.

### Cards & Lists
- **Rule:** **No divider lines.**
- Separate list items using vertical white space (`1.5rem`) or alternating `surface` and `surface-container-low` backgrounds.
- For library cards, use a `surface-container-lowest` base and a `primary` left-accent bar (4px) to denote "Featured" or "New Arrival" status.

### Input Fields
- **Administrative Style:** Inputs should use `surface-container` background with a `Ghost Border` (outline-variant at 20%). On focus, the border becomes 100% opaque `primary`.

### Chips (Availability Tags)
- **Available:** Background `secondary-container` (#BEF458), Text `on-secondary-container` (#4D6E00).
- **Borrowed:** Background `surface-variant`, Text `on-surface-variant`.

---

## 6. Do's and Don'ts

### Do
- **Do** use the `surface-container` tiers to create hierarchy.
- **Do** allow for generous white space (32px+) between library sections to reduce cognitive load.
- **Do** use the Azul-to-Verde gradient for "Discovery" sections (e.g., *Recommendations for You*).
- **Do** ensure all text on `primary` surfaces uses `on-primary` (#FFFFFF).

### Don't
- **Don't** use 1px solid black or dark grey borders to separate sections.
- **Don't** use "Default" blue (#0000FF) or pure black (#000000). Use the institutional tokens.
- **Don't** stack high-saturation colors (e.g., Verde text on Azul background) as it creates vibration and reduces accessibility.
- **Don't** use sharp corners. Use the `DEFAULT` (0.25rem) or `md` (0.375rem) roundedness scale for an approachable institutional feel.
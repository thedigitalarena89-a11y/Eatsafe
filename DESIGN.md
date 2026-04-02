# Design System Document

## 1. Overview & Creative North Star: "The Living Ledger"
This design system moves beyond the utility of a standard tracker to create **"The Living Ledger."** The goal is to transform the clinical act of food weighing into a premium, editorial experience. We reject the "boxed-in" look of traditional apps in favor of a fluid, organic interface that breathes. 

The Creative North Star is **Soft Minimalism**. We achieve this through:
*   **Intentional Asymmetry:** Breaking the vertical axis with staggered card heights and oversized display type.
*   **Tonal Depth:** Replacing harsh lines with a hierarchy of "nested surfaces" that mimic the layering of high-end stationery.
*   **Breathing Room:** Utilizing aggressive white space (Spacing 6 and 8) to ensure the mobile-first PWA feels expansive, not cramped.

---

## 2. Colors: The Fresh Palette
We use a palette of "Living Greens" and "Clinical Whites" to evoke health and precision.

### The "No-Line" Rule
**Borders are prohibited.** Do not use 1px solid lines to separate sections. Structure must be defined through background shifts. A section should transition from `surface` to `surface-container-low` to create a boundary.

### Surface Hierarchy & Nesting
Treat the UI as physical layers. Each layer "lifts" the content closer to the user:
*   **Base Layer:** `surface` (#f9f9fe)
*   **Section Layer:** `surface-container-low` (#f3f3f8)
*   **Interactive Cards:** `surface-container-lowest` (#ffffff)
*   **Floating Elements:** `primary-container` (#20c93d)

### The "Glass & Gradient" Rule
For hero elements (e.g., daily totals), use **Glassmorphism**. Apply a `surface-container-lowest` color at 70% opacity with a `backdrop-blur` of 12px. For primary CTAs, apply a subtle linear gradient from `primary` (#006e1a) to `primary-container` (#20c93d) at a 135-degree angle to add "soul" and dimension.

---

## 3. Typography: Editorial Authority
We pair the geometric precision of **Manrope** for high-level data with the functional clarity of **Inter** for utility.

*   **Display (Manrope):** Used for "Hero Numbers" (e.g., total weight). Use `display-lg` (3.5rem) to make data the focal point.
*   **Headline (Manrope):** Used for page titles and section headers. `headline-sm` (1.5rem) provides a bold, confident anchor.
*   **Title (Inter):** Used for card headings and food names. `title-md` (1.125rem) ensures immediate scannability.
*   **Body & Labels (Inter):** For metadata and descriptions. Use `body-md` (0.875rem) for readability and `label-sm` (0.6875rem) for secondary timestamps.

**Rule:** Always use `on-surface-variant` (#3d4a3c) for body text to reduce visual vibration against the white background, reserving `on-surface` (#1a1c1f) for headlines.

---

## 4. Elevation & Depth: Tonal Layering
Traditional dropshadows are a last resort. We communicate hierarchy through the **Layering Principle**.

### Ambient Shadows
When a card must "float" (e.g., the Weight Entry FAB), use a custom Ambient Shadow:
*   **X: 0, Y: 8px, Blur: 24px.**
*   **Color:** Use `on-surface` (#1a1c1f) at **6% opacity**. 
*   **Tone Matching:** The shadow should feel like a soft glow, never a dark smudge.

### The "Ghost Border" Fallback
If a container sits on an identical color background, use a **Ghost Border**: `outline-variant` (#bccbb8) at **15% opacity**. Never use a 100% opaque border.

### Roundedness Scale
To maintain the "Soft" aesthetic, apply `xl` (1.5rem) to all main content cards. Use `full` for FABs and Chips to create a "pill" shape that feels tactile and approachable.

---

## 5. Components: Precision Primitives

### Cards & Lists
*   **Rule:** Forbid divider lines. 
*   **Implementation:** Use a `3` (1rem) spacing gap between list items. For food logs, use a `surface-container-lowest` card with a `20px` (xl) radius.
*   **Interactions:** On press, a card should scale down slightly (98%) and shift to `surface-container-high`.

### Floating Action Button (FAB)
*   **Style:** Large, circular (`full` radius), using the `primary` color.
*   **Placement:** Bottom-right, offset by `Spacing 6` from the screen edge.
*   **Shadow:** Use the **Ambient Shadow** rule above to make it feel physically suspended over the content.

### Selection Chips
*   **Visuals:** Use `surface-container-high` for unselected states and `primary-container` with `on-primary-container` text for active states.
*   **Shape:** Always `full` radius.

### Input Fields
*   **Layout:** "Float-label" style. No bottom border.
*   **Container:** Use a `surface-container-low` background with an `xl` corner radius.
*   **Focus State:** Shift background to `surface-container-lowest` and add a `Ghost Border` of `primary` at 40% opacity.

### Featured Component: The "Weight Arc"
For the dashboard, use a semi-circular progress gauge. Use a `secondary` (#4c4aca) stroke for the background path and a `primary` (#006e1a) stroke for the progress. This introduces the "Secondary" blue-purple as a high-contrast accent for achievement.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical margins. For example, a page title can have a `Spacing 10` left margin while content has `Spacing 4` to create a "pushed" editorial look.
*   **Do** use `primary-fixed-dim` for subtle background highlights behind important data points.
*   **Do** prioritize "Over-sized" touch targets (min 48x48px) for mobile-first ergonomics.

### Don’t:
*   **Don't** use pure black (#000000). Use `on-background` (#1a1c1f) for all "black" elements.
*   **Don't** use standard Material Design "elevated" shadows. They are too aggressive for this premium aesthetic. Stick to Tonal Layering.
*   **Don't** crowd the edges. If a card is near the screen edge, it must have at least `Spacing 4` of breathing room.
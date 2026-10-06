# Design System — Premium Food Scientist Portfolio

## Design direction
Use **Modern Food Laboratory**: editorial, confident, precise, warm, and approachable. Food should feel tangible through restrained ingredient/product photography; science should feel credible through clear process diagrams, measured data, citations, and careful language. Do not use decorative lab glassware stock photos as a substitute for real expertise.

## Brand principles
1. Clarity before decoration.
2. Evidence before self-promotion.
3. Food warmth without a recipe-blog cliché.
4. Scientific precision without cold institutional styling.
5. Quiet premium details rather than gradients, glassmorphism, oversized animation, or excessive rounded cards.

## Starting palette (provisional; validate in code)
Light theme:
- `--color-canvas: #F7F5EF`
- `--color-surface: #FFFFFF`
- `--color-surface-muted: #EAEDE5`
- `--color-text: #202923`
- `--color-text-muted: #505C53`
- `--color-brand: #24563F`
- `--color-brand-hover: #193E2D`
- `--color-accent: #D7A936`
- `--color-border: #D6DBD2`
- `--color-focus: #2456A6`

Dark theme (optional):
- `--color-canvas: #151A17`
- `--color-surface: #202823`
- `--color-surface-muted: #29332C`
- `--color-text: #F2F3EC`
- `--color-text-muted: #C0C9BF`
- `--color-brand: #9ED3AE`
- `--color-brand-hover: #B9E4C5`
- `--color-accent: #F0C85F`
- `--color-border: #455148`
- `--color-focus: #A9C7FF`

**Important:** These are starting tokens, not certified contrast pairs. Do not assume every pairing passes. Calculate contrast for each actual foreground/background pairing and adjust tokens where needed. Never use accent yellow/gold as small body text on a light background. Use accent mainly for decorative marks, small filled areas with validated foreground, or large elements. Muted text must pass contrast requirements; if it fails, darken it.

## Contrast and color requirements
- Meet WCAG 2.2 AA: normal text contrast at least 4.5:1; large text at least 3:1. Non-text controls and meaningful graphics should generally achieve at least 3:1 against adjacent colors.
- Do not rely on color alone to communicate status, category, focus, required fields, errors, or links.
- Links in paragraphs must be visually distinguishable without relying solely on hue; use underlines by default or another clear persistent treatment.
- Focus indicators must be visible on every interactive control and remain visible against both themes.
- Test the actual computed colors, including hover, focus, disabled, badge, card, button, and image-overlay states. No rounding a failing contrast ratio up to a pass.
- Prefer a solid overlay or place text outside imagery rather than laying text over unpredictable food photography.

## Typography
Preferred pairing:
- Display: `DM Serif Display` or `Fraunces` (use one, not both).
- Body/UI: `Inter` or `Manrope` (use one).
- Fallbacks: `Georgia, 'Times New Roman', serif` for display; `system-ui, -apple-system, 'Segoe UI', sans-serif` for body.
- Prefer self-hosted WOFF2 with only required weights/subsets and appropriate licences. If self-hosting is unavailable, use a reliable system stack rather than blocking content on a third-party font.
- Set `font-display: swap` or another justified strategy; tune fallback metrics to reduce layout shift.
- Body copy: target 16–18px minimum on desktop, comfortable 16px minimum on mobile; line-height about 1.55–1.75 for long-form text.
- Long-form measure: target 60–75 characters per line, using a constrained text column around 65–75ch.
- Avoid ultra-light weights, long all-caps paragraphs, tightly tracked body text, and display type for scientific detail.
- Use tabular numerals for data tables and measurements when helpful.
- Use fluid type with `clamp()` but preserve readable minimums and avoid oversized mobile headings.
- Ensure text remains usable at 200% zoom and when user text-spacing overrides are applied.

## Layout and responsive behaviour
- Mobile-first, content-first, with stable reading order.
- Main container max width around 72–76rem; long-form article column around 42–48rem / 65–75ch.
- Spacing scale based on 4px increments; use consistent tokens rather than arbitrary values.
- Desktop grids must collapse to one column without horizontal overflow.
- Use whitespace to establish hierarchy, not to push essential content far below the fold.
- Ensure key role/specialism, evidence, and primary contact CTA are visible quickly.
- Sticky headers are optional; if used, keep compact and ensure focused elements are not obscured.
- Tap targets: aim for at least 44×44 CSS px; meet WCAG 2.2 target-size minimums or their applicable exceptions.
- Never use fixed-width text columns or card heights that clip content.

## Image and data visualisation
- Use real, owner-approved photos and diagrams. No invented lab scenes presented as the owner’s own work.
- Export raster photos as AVIF/WebP with sensible JPEG fallback where required; provide responsive `srcset`/`sizes`.
- Include width/height or aspect ratio; lazy-load below-the-fold images; do not lazy-load the actual LCP/hero image.
- Keep informative scientific figures legible on mobile; offer captions and a textual explanation. Never encode all meaning in a chart colour.
- Provide source/caption/units for charts and cite the source of any externally sourced data.
- Avoid stock-photo overload. One strong portrait or authentic work image plus a few contextual images is preferable to a generic collage.

## Components
Build reusable, semantic components:
- Site header, skip link, primary navigation, mobile menu, footer.
- Primary and secondary CTA links.
- Email contact link and copy-email button with live status feedback.
- Project/case-study card with type, title, summary, role, and evidence/impact only when verified.
- Article card with title, excerpt, author, publish/update date, reading time if computed reliably.
- Recipe card only for tested/real recipes; show yield and times only when known.
- Credential list with issuer, title, date/status, and verification URL if supplied.
- Pull quote only when it is a real, attributable quote and permission exists.
- Figure, caption, source citation, data table, related-content list, breadcrumb.
- Empty states should not appear on the public site; omit empty collections/sections.
- Error, success, focus, hover, pressed, and disabled states must be designed and tested.

## Homepage content hierarchy
1. Clear professional identity and specialism (owner-confirmed; no invented claims).
2. Primary CTA: “Discuss a project” or “Contact me”; secondary: “View selected work” or “Download CV” if available.
3. Evidence: selected projects, research, methods, or verified experience.
4. Expertise: only confirmed specialisms, explained in plain language.
5. About/credentials preview.
6. Latest writing or recipes only when useful and populated.
7. Contact invitation with email and LinkedIn.

Draft headline “Science behind better food.” is a hypothesis, not final copy. Refine it after confirming real expertise. Never present placeholder text as finished content.

## Interaction and motion
- Default transitions 120–220ms; larger reveal transitions 180–350ms.
- Prefer transform and opacity; avoid animating layout properties and large blur/filter effects.
- No scroll-jacking, parallax as a requirement, autoplay carousels, or constant ambient animation.
- Lottie is optional and should be used only when it explains a concept or adds clear brand value. Provide static fallback, lazy-load below fold, keep asset small, and stop animation under reduced motion.
- Use `prefers-reduced-motion: reduce` to remove nonessential movement and disable looping.
- `navigator.vibrate()` is optional, never required, and only on an intentional user action; keep it brief (about 10–15ms), handle unsupported devices, and do not vibrate on load/scroll.
- Every interaction must have a meaningful state and keyboard equivalent.

## Theme behaviour
- Light is the default.
- Dark mode is optional; do not implement it if the project cannot test its contrast independently.
- Respect OS theme until the user makes an explicit choice; persist explicit choice only. Avoid flash of the wrong theme on initial load.
- Theme toggle must have an accessible name and visible focus, and should not unexpectedly change contrast/brand semantics.

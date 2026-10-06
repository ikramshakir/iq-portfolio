# Quality Assurance and Acceptance Checklist

The coding agent must execute these checks and report actual outcomes. Do not state that a test passed unless it was run.

## 1. Accessibility — WCAG 2.2 AA target
- [ ] All pages have a skip link and semantic landmarks.
- [ ] Exactly one descriptive H1 per page; heading levels follow a logical hierarchy.
- [ ] Every interactive control works using keyboard only.
- [ ] Keyboard focus is visible, high contrast, and not hidden behind sticky UI.
- [ ] No keyboard trap; Escape closes dismissible overlays/menus where expected.
- [ ] Normal text contrast ≥ 4.5:1; large text ≥ 3:1.
- [ ] Meaningful non-text UI and focus indicators have sufficient contrast (target ≥ 3:1).
- [ ] Contrast is calculated for every foreground/background state in light and dark themes, including hover, focus, pressed, disabled, tags, borders, and error states.
- [ ] Links in body copy are identifiable without color alone.
- [ ] Form controls do not exist unless they have a real submission destination; contact uses direct links.
- [ ] Buttons have accessible names; icon-only buttons are labelled.
- [ ] Copy-email feedback is announced through a polite live region and has a fallback if Clipboard API is unavailable.
- [ ] Images have appropriate alt text; decorative images use empty alt.
- [ ] Content remains usable at 200% zoom and narrow viewport widths without horizontal page scrolling.
- [ ] Test text spacing overrides and browser text enlargement.
- [ ] Motion respects `prefers-reduced-motion`; no essential information is animated.
- [ ] Test with keyboard, screen-reader smoke test, axe-core, and Lighthouse. Automated tools do not replace manual testing.

## 2. Typography and readability
- [ ] Body copy is at least 16px on mobile and generally 16–18px on larger screens.
- [ ] Long-form line length is approximately 60–75 characters.
- [ ] Long-form line height is approximately 1.55–1.75.
- [ ] Headings wrap cleanly at 320px width; no clipped or overlapping text.
- [ ] Font loading has a robust system fallback and does not hide text.
- [ ] Layout shift from font swap is inspected.
- [ ] Scientific terms, units, citations, tables, superscripts, and footnotes remain readable.
- [ ] All font files are licensed, subsetted, and only required weights are loaded.

## 3. UX and content integrity
- [ ] The first screen explains who the professional is, their confirmed specialism, and the next useful action.
- [ ] Recruiters can find experience, qualifications, selected work, CV, and contact without hunting.
- [ ] Consulting clients can identify confirmed services, relevant evidence, working approach, and contact route.
- [ ] Do not publish placeholder copy, invented project outcomes, fake client logos, fake testimonials, fake reviews, or unverified credentials.
- [ ] Academic/independent work is labelled accurately and not represented as client work.
- [ ] Contact email and LinkedIn URLs work; CV link works if shown.
- [ ] Empty collections are hidden from public navigation.
- [ ] Mobile menu opens/closes and exposes correct ARIA state.
- [ ] Copy-to-clipboard works or provides a usable fallback.
- [ ] Theme toggle works only if dark theme is implemented and validated.

## 4. Performance targets
Aim for Lighthouse scores ≥95 for Performance, Accessibility, Best Practices, and SEO on representative pages, while prioritizing real user experience over score-chasing.
- [ ] Core Web Vitals targets: LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 (field target at 75th percentile where data is available).
- [ ] Lab testing includes Lighthouse mobile emulation and a real device/network spot check.
- [ ] Hero/LCP image is not lazy-loaded; below-fold images are lazy-loaded.
- [ ] Images are compressed and responsive; intrinsic dimensions/aspect ratios prevent layout shift.
- [ ] Fonts are self-hosted where practical; no unnecessary third-party font request.
- [ ] No large JS framework or unused libraries.
- [ ] Lottie is absent unless it has a documented purpose; if present, it is lazy-loaded and has a static fallback.
- [ ] No unnecessary third-party scripts, trackers, or embeds.
- [ ] Inspect bundle size and identify unexpected dependencies.

## 5. SEO and metadata
- [ ] Every indexable page has a unique title, description, canonical URL, and suitable social preview metadata.
- [ ] Sitemap contains only canonical, public, published URLs.
- [ ] `robots.txt` points to sitemap and does not block public pages.
- [ ] RSS contains published articles only and correct absolute URLs.
- [ ] Structured data matches visible page content and is valid JSON-LD.
- [ ] Person/ProfilePage, Article/BlogPosting, Recipe, and BreadcrumbList are used only where appropriate.
- [ ] Recipe structured data is only emitted when content qualifies; no fake ratings/nutrition.
- [ ] Validate structured data with Google Rich Results Test where supported and Schema Markup Validator for general schema.
- [ ] Social preview image has sensible dimensions and readable crop.
- [ ] Internal links work; external links use meaningful labels.
- [ ] 404 page returns the correct status/behaviour on Netlify.

## 6. Static build and CMS
- [ ] `npm run build` succeeds from a clean install.
- [ ] Build fails with clear error messages for missing required fields, duplicate slugs, invalid URLs, or broken required assets.
- [ ] CMS draft content does not appear in public build, sitemap, or RSS.
- [ ] No secret values exist in repository content or `dist/`.
- [ ] `/admin/` loads and authenticates using the selected maintained backend.
- [ ] Test CMS create, edit, image upload, publish, and logout.
- [ ] Netlify deployment uses `npm run build` and publishes `dist`.
- [ ] Redirects, headers, caching, and 404 behaviour are tested in a deploy preview.
- [ ] Test production build with no network except required CMS login, confirming site content works without client-side content APIs.

## 7. Responsive test matrix
Test at minimum:
- [ ] 320px mobile
- [ ] 375–390px mobile
- [ ] 768px tablet
- [ ] 1024px small desktop/tablet landscape
- [ ] 1440px desktop
- [ ] Keyboard-only navigation
- [ ] 200% zoom
- [ ] Reduced motion enabled
- [ ] Light and dark theme if supported
- [ ] Long titles, missing optional fields, no image, long URL, large table, and empty collection

## 8. Required handover report
Include:
- Implemented pages and features.
- Exact commands run.
- Build/test results, with failures not hidden.
- Lighthouse results by page and device profile.
- Contrast-check report for all palette pairs.
- Known limitations and deferred items.
- How the owner logs into `/admin/`, edits content, publishes, updates dependencies, and restores a previous version.

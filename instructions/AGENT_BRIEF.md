# Implementation Brief — Premium Food Scientist Portfolio

## Your role
Act as a senior product designer, accessibility specialist, SEO engineer, and front-end developer. Build a polished, production-ready portfolio for a Food Scientist. This website must serve **both prospective consulting clients and recruiters/employers**. The owner edits content alone through Decap CMS at `/admin`.

## Non-negotiable stack and constraints
- Static site deployed on Netlify.
- Vite + npm + Tailwind CSS + vanilla JavaScript. Do not introduce React, Vue, Angular, a database, a server API, or a contact-form backend.
- Generate real static HTML at build time from Markdown/YAML content. Do not make the main content depend on client-side rendering.
- Decap CMS at `/admin/`; content lives in Git and is compiled into the site during the build.
- Contact methods are direct email and LinkedIn links. Include a copy-email button with accessible feedback. Do not create a nonfunctional form.
- English only at launch.
- Light theme is the default. Optional dark theme is allowed only if both themes are accessible and the preference can be changed using a clearly labelled control.
- Mobile-first, keyboard accessible, WCAG 2.2 AA target.
- No fabricated degrees, employers, clients, results, certifications, publications, testimonials, or numerical impact. If proof is not supplied, use honest placeholders in the CMS and do not publish them.
- Keep content useful when JavaScript is disabled. JavaScript may enhance, but must not be required to read core content or navigate essential pages.
- Do not expose secrets in client-side files, `VITE_*` variables, committed configuration, or the published `dist/` folder.

## Product goal
A credible, modern scientific professional site: calm, evidence-led, food-aware, human, and premium. Avoid a generic tech startup look, a restaurant template, a wellness influencer aesthetic, or a sterile hospital/laboratory visual language.

## Primary user journeys
1. Recruiter: understand role/specialism in the first screen → scan relevant experience and qualifications → inspect selected work → download CV → contact via email or LinkedIn.
2. Consulting client: understand the problems the scientist can help solve → inspect evidence and working method → understand scope/limitations → contact with a clear next step.
3. Returning reader: browse scientific explainers/recipes → understand author and evidence → share or contact.
4. Site owner: sign in to `/admin/` → edit page/project/article/recipe → preview if supported → publish → verify the production page.

## Positioning and content integrity
Use “Science behind better food.” only as a draft headline until the owner’s real background and expertise are confirmed. Keep all services, credentials, outcomes, and case studies evidence-based. If the owner has academic or personal projects but no commercial projects, label them accurately (e.g. “Academic project” or “Independent study”). Never imply that a hypothetical brief was a real client engagement.

Candidate service categories may be offered as editable suggestions, not assumed claims: food product formulation, ingredient functionality, quality and safety, shelf-life/preservation, sensory evaluation, research interpretation, and scientific communication. Publish only the areas the owner confirms.

## Required pages
- `/` homepage
- `/about/`
- `/work/` case-study index
- `/work/{slug}/` case-study detail
- `/blog/` index
- `/blog/{slug}/` article
- `/recipes/` index only if the owner has legitimate recipe/test content
- `/recipes/{slug}/` recipe detail only if populated with real tested information
- `/credentials/`
- `/resume/` or a clearly labelled CV download section
- `/contact/`
- `/404.html`
- `/admin/`
- `/sitemap.xml`, `/robots.txt`, `/rss.xml` when blog content exists

Do not ship empty pages or empty categories. If there is no recipe content, omit Recipes from navigation until there is useful content.

## Required implementation behaviours
- Semantic HTML landmarks; one clear `<h1>` per page; logical heading order.
- Skip-to-content link.
- Visible keyboard focus; never remove outlines without a replacement.
- Mobile navigation button exposes `aria-expanded`, `aria-controls`, and a working keyboard interaction. Escape closes overlays/menus when appropriate.
- All icon-only controls have accessible names. Prefer text labels for key actions.
- Email link uses `mailto:` and LinkedIn uses the owner-supplied URL. Validate links and provide clear labels.
- Copy-email action has a fallback when Clipboard API is unavailable and announces success/failure in an `aria-live` region.
- Theme toggle, if implemented, uses a button with a clear accessible name/state. Avoid theme flash; preserve explicit preference without overriding OS preference before a choice is made.
- Images have intrinsic width/height or aspect ratio to prevent layout shifts; informative images have meaningful alt text, decorative images have empty alt.
- No autoplay video, auto-advancing carousels, cursor hijacking, scroll-jacking, or required motion.
- Motion is enhancement only and respects `prefers-reduced-motion`.
- No fake counters, fake ratings, fake testimonials, invented client logos, or vague unsupported claims.

## Definition of done
Follow every requirement in `DESIGN_SYSTEM.md`, `CONTENT_MODEL.md`, and `QA_ACCEPTANCE.md`. Before declaring completion:
1. Run production build and fix warnings/errors.
2. Validate content and internal links.
3. Test all templates at mobile, tablet, and desktop widths.
4. Run automated accessibility checks and manually test keyboard navigation.
5. Test dark theme if provided, reduced motion, zoom to 200%, long titles, missing images, and empty CMS fields.
6. Run Lighthouse on homepage, one case study, one article, and one recipe if recipes exist.
7. Verify sitemap, RSS if applicable, canonical URLs, structured data, 404 behaviour, and CMS authentication.
8. Provide a concise README with setup, content editing, deployment, secrets, and recovery instructions.
9. Report real test results. Do not claim tests passed unless they were run.

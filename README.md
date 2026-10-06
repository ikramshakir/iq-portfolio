# Iqra Shakir — Food Scientist

A static portfolio generated at build time from Markdown and YAML. Its public pages work without client-side JavaScript; JavaScript only enhances the mobile navigation and copy-email control.

## Run locally

```sh
npm install
npm run dev
```

Build and preview the static output:

```sh
npm run build
npm run preview
```

`npm run generate` regenerates the root homepage and the HTML routes under `public/`. The generator preserves `public/admin/` and media uploaded there.

## Pages and published content

- Home, About, Work, work detail pages, Education & Training, CV, Contact, and 404 are generated as static HTML.
- The Blog and Recipes sections are intentionally omitted until there is genuine owner-approved content to publish.
- Academic work and professional experience are labelled separately. Do not add project methods, findings, credentials, dates, or client claims unless the owner can verify them.
- The CV is the source of the currently published background. The current completion status of the degree should be confirmed before launch.

Content source files:

- `content/site.yml` — identity, contact links, portrait, and optional site URL.
- `portrait_gallery` in `content/site.yml` — ordered photo list (image, alternative text, and optional caption); at least two items enable automatic rotation without visitor controls. The five owner-supplied photos are currently configured.
- `content/pages/about.md` — About-page title, summary, and Markdown body.
- `content/work/*.md` — published work entries; set `draft: true` to withhold an entry.
- `content/credentials/*.md` — education and training; set `draft: true` to withhold an entry.
- `content/blog/*.md` — articles; the Blog navigation and routes appear only when at least one non-draft article exists.

The build validates required fields, safe unique work slugs, HTTPS LinkedIn/site URLs, and required local media. Markdown raw HTML is escaped, and unsafe link/image protocols are rejected.
Optional services are managed in `content/site.yml`; list only services the owner has confirmed. They are omitted from the public site when the list is empty.
The source portrait is preserved in `image/`; its optimized WebP derivative and the 1200 x 630 social preview are used in public output.

## Site URL and SEO

Set `SITE_URL` to the final HTTPS origin in the deployment environment (for example, `https://your-real-domain.example`). When it is set, the generator emits canonical URLs, Open Graph URLs, `sitemap.xml`, and the sitemap reference in `robots.txt`. Until the final domain is selected, these origin-dependent values are intentionally omitted rather than guessed.

There is no RSS feed while there are no published articles. When articles exist, the build writes `rss.xml` once `SITE_URL` is configured.

## Decap CMS and deployment (not yet live)

The `/admin/` interface and GitHub-backend configuration are scaffolds, not a live authenticated CMS. Before deployment:

1. Connect the actual GitHub repository to Netlify.
2. Replace `YOUR_GITHUB_OWNER/YOUR_GITHUB_REPOSITORY` in `public/admin/config.yml`.
3. Configure the supported GitHub OAuth/provider flow using current Netlify guidance; do not enable deprecated Git Gateway.
4. Set `SITE_URL` to the site's exact HTTPS origin in the Netlify build environment.
5. Set build command to `npm run build` and publish directory to `dist`. Netlify builds fail if the deployment URL is missing.
6. Test login, content edits, image upload, publication, logout, 404 responses, and a deploy preview.

Never commit OAuth client secrets or tokens. Keep provider secrets in the provider/Netlify dashboard.

## Handover limitations

- Deployment, production CMS authentication, and live-domain verification have not been completed.
- The portfolio's content is intentionally limited to claims supported by the supplied CV; detailed project evidence and confirmation of current degree status are still needed for a final content sign-off.
- A real browser 200% zoom check, axe-core scan, screen-reader smoke test, real-device/network spot check, and full assistive-technology review remain outstanding. These require a final manual pass and are not implied by Lighthouse scores.

## Local QA handover

Checks run against the local static build:

- `npm run build` — passed. Static routes, content validation, compiled CSS injection, HTML metadata/landmark checks, local-link checks, and source-map exclusion all passed.
- `npm audit` — passed with 0 vulnerabilities.
- Responsive browser pass — the home, About, Work, both work details, Credentials, CV, and Contact routes returned HTTP 200, each had exactly one H1 and a main landmark, and none overflowed horizontally at 320, 390, 768, 1024, or 1440 CSS pixels (40 route/viewport combinations).
- Zoom/text-spacing proxy — at a 640 CSS-pixel viewport (a 200%-zoom-equivalent width for a 1280-pixel layout), the homepage had no horizontal overflow with WCAG text-spacing overrides applied: 1.5 line height, 2em paragraph spacing, 0.12em letter spacing, and 0.16em word spacing. This is not a substitute for testing actual browser zoom.
- Keyboard/interaction spot checks — the skip link is first in the tab order and visibly focused; the mobile menu opens with its keyboard control, exposes `aria-expanded`, allows focus into navigation, and Escape closes it and restores focus. Copy-email feedback works when Clipboard API access is unavailable and its status uses a polite live region.
- JavaScript-disabled check — page content and navigation remain available without JavaScript. The mobile menu is not collapsed when its enhancement script is unavailable.
- Reduced motion — `prefers-reduced-motion` disables smooth scrolling and reduces transitions.
- Portrait gallery — five owner-supplied photos use an editorial layered frame and automatic crossfade/slide transitions with no visitor controls. Reduced-motion preferences disable auto-rotation. CMS gallery entries require corresponding files under `public/media/`.
- Conditional blog fixtures — a published-article fixture generated the Blog/article routes, Article data, RSS, and sitemap entries; a draft-only fixture generated none of those public blog outputs. Temporary fixtures were removed.

Lighthouse was run against the local built site; each representative run scored 100 in Performance, Accessibility, Best Practices, and SEO:

| Page | Profile | LCP | CLS | TBT |
| --- | --- | ---: | ---: | ---: |
| Home | Mobile | ~1,293 ms | 0 | ~8 ms |
| Work detail | Mobile | ~1,188 ms | 0 | 0 ms |
| Home | Desktop | ~355 ms | 0 | 0 ms |

Lighthouse also reported forced-reflow and network-dependency-tree diagnostic insights on the homepage. They did not fail scoring audits or lower category scores.

WCAG relative-luminance contrast calculations for the implemented light-theme text and key focus states:

| Foreground / background | Ratio | Result |
| --- | ---: | --- |
| Body text `#3b413c` / canvas `#f8fcfc` | 10.12:1 | Pass |
| Muted text `#5f6961` / canvas `#f8fcfc` | 5.52:1 | Pass |
| Muted text `#5f6961` / white `#ffffff` | 5.71:1 | Pass |
| Muted text `#5f6961` / muted surface `#f1f9f8` | 5.34:1 | Pass |
| Muted text `#5f6961` / light cyan `#daf0ee` | 4.80:1 | Pass |
| Link/focus `#2b6452` / canvas `#f8fcfc` | 6.67:1 | Pass |
| Link/focus `#2b6452` / white `#ffffff` | 6.89:1 | Pass |
| Link `#2b6452` / light cyan `#daf0ee` | 5.80:1 | Pass |
| Tag text `#2b6452` / rendered pearl-aqua tint on light surfaces | 5.41–6.29:1 | Pass |
| Button text `#3b413c` / pearl aqua `#94d1be` | 6.04:1 | Pass |
| Button text `#3b413c` / hover surface `#bfe3d8` | 7.57:1 | Pass |
| Skip-link text `#ffffff` / deep green `#2b6452` | 6.89:1 | Pass |

These calculations cover the text and primary interactive combinations listed, not an exhaustive manual audit of every decorative border or browser-rendered state. The light theme is the only theme implemented; there are no disabled controls or forms.

Before launch, the owner still needs to confirm degree completion/status, approve the CV-derived content and any services, supply the actual GitHub repository and production domain, configure GitHub OAuth/Netlify, and test CMS login/edit/upload/publish/logout and deployed 404 behavior in a deploy preview. `SITE_URL` is blank locally, so local canonical URLs, sitemap, and RSS are intentionally omitted unless testing with a configured origin. Blog and Recipes remain hidden until genuine approved content exists.

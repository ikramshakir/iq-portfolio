# Content Model and Decap CMS Instructions

## General content rules
- Content is stored in Git as Markdown/YAML and rendered to static HTML at build time.
- Public pages must not fetch content from an API at runtime.
- CMS editing is for one owner. Use simple publishing by default; do not add editorial workflow unless requested.
- Validate required fields and references at build time. Fail the build with a helpful message when required content is malformed.
- Do not publish draft/unpublished content. Exclude drafts from sitemap and RSS.
- Never create fabricated experience, client names, credentials, claims, results, dates, citations, testimonials, or recipe nutrition data.
- Keep the owner’s factual bio, work history, qualifications, links, and services in editable content rather than hard-coded templates.

## Suggested collections
Use Decap CMS collections with clear labels, help text, and sensible widgets.

### 1. Site settings (single file)
Fields:
- `site_name` (required)
- `site_url` (required at production build)
- `person_name` (required)
- `professional_title` (required, owner-confirmed)
- `short_bio` (required)
- `portrait` (optional image)
- `email` (required)
- `linkedin_url` (required if owner has a profile)
- `cv_file` (optional)
- `default_seo_title` (required)
- `default_seo_description` (required)
- `social_image` (optional)
- `navigation` (curated list of published routes)
- `show_recipes` (boolean; false until useful recipe content exists)
- `theme_mode` (optional: light-only or light-and-dark)

### 2. Pages
For about, credentials, contact, and other standalone pages:
- `title`, `slug`, `description`, `body`, `seo_title`, `seo_description`, `social_image`, `draft`.
Do not make the owner enter arbitrary HTML.

### 3. Case studies
Fields:
- `title`, `slug`, `summary`, `project_type` (academic / independent / professional / research / other), `status` (draft/published), `date_or_period` (optional), `role`, `context`, `problem_or_question`, `approach`, `methods` (list), `findings_or_outcomes`, `limitations`, `sources` (list of title + URL), `images` (list with alt/caption/credit), `related_links`, `seo_title`, `seo_description`.
- Only include quantitative outcomes if documented and approved for public disclosure.
- Include confidentiality toggle/notice and never expose confidential employer/client information.

### 4. Blog articles
Fields:
- `title`, `slug`, `excerpt`, `author`, `publish_date`, `updated_date`, `hero_image`, `hero_alt`, `body`, `references` (title + URL + publication/date where available), `tags`, `draft`, `seo_title`, `seo_description`, `social_image`.
- Distinguish evidence from opinion and explain uncertainty.
- Avoid medical/nutrition claims beyond the author’s expertise and sources. Include publication/update dates and references when making scientific claims.

### 5. Recipes (optional)
Only enable if owner has real, tested recipes or food experiments worth publishing.
Fields:
- `title`, `slug`, `summary`, `image`, `image_alt`, `author`, `publish_date`, `prep_time_minutes`, `cook_time_minutes`, `total_time_minutes`, `yield_text`, `ingredients` (structured quantity/unit/name/notes), `instructions` (ordered steps), `nutrition` (optional; only verified/calculated by a disclosed method), `allergens`, `storage_notes`, `testing_notes`, `references`, `draft`, `seo_title`, `seo_description`.
- Never invent nutrition facts, review ratings, cooking results, or “tested” status.
- Only emit `Recipe` JSON-LD if the visible page contains the same accurate information and meets current Google structured-data guidelines.

### 6. Credentials and experience
Fields:
- `title`, `issuer_or_organization`, `credential_type`, `start_date`, `end_date`, `status`, `description`, `verification_url`, `supporting_file`, `sort_order`, `draft`.
- Do not imply that an in-progress qualification is completed.
- Add verification links only when supplied and checked.

## Static build requirements
- Build templates from content data using a safe Markdown renderer.
- Sanitize rendered HTML; never trust raw HTML pasted into CMS fields.
- Escape text and attribute values. Validate and normalize URLs; allow only safe protocols (`https:`, `http:` where needed, `mailto:`) and reject `javascript:`.
- Generate static pages, metadata, canonical URLs, sitemap, and RSS from the same content source.
- Include only published, non-draft pages in navigation, sitemap, and feeds.
- Use stable slugs; prevent collisions and unsafe path characters.
- Add breadcrumbs to detail pages.
- Use ISO 8601 dates in machine-readable metadata and human-readable dates in visible content.
- JSON-LD must be generated from validated content, not hand-copied page snippets. Escape JSON correctly.
- Generate `Person` or `ProfilePage` markup for the professional identity as appropriate, `Article`/`BlogPosting` for articles, `Recipe` only for eligible real recipes, and `BreadcrumbList` where relevant.
- Never include fake `aggregateRating`, review, or rating markup.
- If there are no articles, do not generate an empty RSS feed unless the implementation documents a valid empty feed strategy.
- Build output must contain no secrets, CMS draft content, source maps that reveal secrets, or unneeded source files.

## Decap CMS setup
- Publish admin interface at `/admin/` with `index.html` and `config.yml`.
- For the GitHub backend, configure the real `owner/repository` and publication branch; never leave placeholder values in production.
- Confirm the current Netlify OAuth provider flow during implementation. Netlify Git Gateway is deprecated and must not be selected for a new project.
- OAuth callback commonly used in the Netlify flow: `https://api.netlify.com/auth/done`; confirm current dashboard instructions rather than relying solely on this note.
- The owner must have write access to the configured repository when using the standard GitHub backend.
- Do not commit OAuth client secrets. Configure secrets only in the appropriate provider dashboard.
- If GitHub OAuth setup is too burdensome, evaluate Decap Turbo or another maintained CMS/auth approach and clearly explain any service, cost, or lock-in trade-off before changing architecture.
- Test login, create/edit/publish, image upload, logout, and access from a second browser session before handover.

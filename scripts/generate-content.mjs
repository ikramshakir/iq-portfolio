import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { marked } from 'marked'
import { parse as parseYaml } from 'yaml'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const publicDir = path.join(rootDir, 'public')
const mediaDir = path.join(publicDir, 'media')
const sourceImagesDir = path.join(rootDir, 'image')
const contentDir = path.join(rootDir, 'content')

let site
let aboutPage
let caseStudies
let credentials
let articles

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]))

const isSafeMarkdownUrl = (value) => {
  const target = String(value || '').trim()
  if (!target || /[\u0000-\u001f\u007f\\]/.test(target) || target.startsWith('//')) return false
  try {
    const parsed = new URL(target, 'https://portfolio.invalid')
    return parsed.origin === 'https://portfolio.invalid'
      || ['https:', 'http:', 'mailto:', 'tel:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

marked.use({
  renderer: {
    html(token) {
      return escapeHtml(token.text)
    },
    link(token) {
      const label = this.parser.parseInline(token.tokens)
      if (!isSafeMarkdownUrl(token.href)) return label
      const title = token.title ? ` title="${escapeHtml(token.title)}"` : ''
      return `<a href="${escapeHtml(token.href)}"${title}>${label}</a>`
    },
    image(token) {
      if (!isSafeMarkdownUrl(token.href)) return escapeHtml(token.text)
      const title = token.title ? ` title="${escapeHtml(token.title)}"` : ''
      return `<img src="${escapeHtml(token.href)}" alt="${escapeHtml(token.text)}"${title} loading="lazy" decoding="async" />`
    },
  },
})

const readMarkdown = async (filePath) => {
  const source = await fs.readFile(filePath, 'utf8')
  const match = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)([\s\S]*)$/)
  if (!match) {
    throw new Error(`${path.relative(rootDir, filePath)} must start with YAML front matter delimited by --- lines.`)
  }
  try {
    return {
      data: parseYaml(match[1]) || {},
      content: match[2].trim(),
    }
  } catch (error) {
    throw new Error(`${path.relative(rootDir, filePath)} has invalid YAML front matter: ${error.message}`)
  }
}

const requiredText = (value, label, filePath) => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${path.relative(rootDir, filePath)} is missing required field "${label}".`)
  }
  return value.trim()
}

const validIsoDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

const formatDate = (value) => new Date(`${value}T00:00:00Z`).toLocaleDateString('en-GB', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
})

const loadContent = async () => {
  const sitePath = path.join(contentDir, 'site.yml')
  const siteSource = await fs.readFile(sitePath, 'utf8')
  let siteData
  try {
    siteData = parseYaml(siteSource) || {}
  } catch (error) {
    throw new Error(`${path.relative(rootDir, sitePath)} contains invalid YAML: ${error.message}`)
  }
  const siteUrl = process.env.SITE_URL?.replace(/\/+$/, '') || siteData.site_url || ''
  if (siteData.services !== undefined && !Array.isArray(siteData.services)) {
    throw new Error(`${path.relative(rootDir, sitePath)} services must be a list.`)
  }
  if (siteData.portrait_gallery !== undefined && !Array.isArray(siteData.portrait_gallery)) {
    throw new Error(`${path.relative(rootDir, sitePath)} portrait_gallery must be a list.`)
  }
  site = {
    name: requiredText(siteData.site_name, 'site_name', sitePath),
    title: requiredText(siteData.professional_title, 'professional_title', sitePath),
    headline: requiredText(siteData.hero_headline, 'hero_headline', sitePath),
    shortBio: requiredText(siteData.short_bio, 'short_bio', sitePath),
    email: requiredText(siteData.email, 'email', sitePath),
    linkedin: requiredText(siteData.linkedin_url, 'linkedin_url', sitePath),
    phone: requiredText(siteData.phone, 'phone', sitePath),
    location: requiredText(siteData.location, 'location', sitePath),
    portrait: requiredText(siteData.portrait, 'portrait', sitePath),
    portraitGallery: (siteData.portrait_gallery || []).map((item, index) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        throw new Error(`${path.relative(rootDir, sitePath)} portrait_gallery item ${index + 1} must be an object.`)
      }
      return {
        image: requiredText(item.image, `portrait_gallery[${index}].image`, sitePath),
        alt: requiredText(item.alt, `portrait_gallery[${index}].alt`, sitePath),
        caption: typeof item.caption === 'string' && item.caption.trim() ? item.caption.trim() : '',
      }
    }),
    cvFile: typeof siteData.cv_file === 'string' && siteData.cv_file.trim()
      ? siteData.cv_file.trim()
      : '/media/iqra%20shakir_food_science_cv%20(1).pdf',
    socialImage: typeof siteData.social_image === 'string' ? siteData.social_image.trim() : '',
    services: (siteData.services || []).map((service) => requiredText(service, 'services[]', sitePath)),
    siteUrl: siteUrl.trim(),
  }
  for (const [label, assetPath] of [
    ['portrait', site.portrait],
    ...site.portraitGallery.map((item, index) => [`portrait_gallery[${index}].image`, item.image]),
    ['cv_file', site.cvFile],
    ...(site.socialImage ? [['social_image', site.socialImage]] : []),
  ]) {
    let decodedAssetPath
    try {
      decodedAssetPath = decodeURIComponent(assetPath)
    } catch {
      throw new Error(`${path.relative(rootDir, sitePath)} ${label} contains invalid URL encoding.`)
    }
    if (!decodedAssetPath.startsWith('/media/') || decodedAssetPath.includes('\\') || decodedAssetPath.split('/').some((part) => part === '.' || part === '..')) {
      throw new Error(`${path.relative(rootDir, sitePath)} ${label} must be a local path under /media/.`)
    }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(site.email)) {
    throw new Error(`${path.relative(rootDir, sitePath)} contains an invalid email address.`)
  }
  try {
    if (new URL(site.linkedin).protocol !== 'https:') throw new Error()
  } catch {
    throw new Error(`${path.relative(rootDir, sitePath)} must contain a valid HTTPS LinkedIn URL.`)
  }
  if (site.siteUrl) {
    try {
      const parsedSiteUrl = new URL(site.siteUrl)
      if (parsedSiteUrl.protocol !== 'https:' || parsedSiteUrl.origin !== site.siteUrl) throw new Error()
    } catch {
      throw new Error('SITE_URL must be a valid HTTPS origin without a path, query, or fragment.')
    }
  }

  const aboutPath = path.join(contentDir, 'pages', 'about.md')
  const about = await readMarkdown(aboutPath)
  if (about.data.draft !== undefined && typeof about.data.draft !== 'boolean') {
    throw new Error(`${path.relative(rootDir, aboutPath)} draft must be true or false.`)
  }
  aboutPage = {
    title: requiredText(about.data.title, 'title', aboutPath),
    summary: requiredText(about.data.summary, 'summary', aboutPath),
    body: requiredText(about.content, 'body', aboutPath),
  }
  if (about.data.draft === true) {
    throw new Error('The required About page cannot be marked as a draft.')
  }

  const workDir = path.join(contentDir, 'work')
  const workFiles = (await fs.readdir(workDir)).filter((name) => name.endsWith('.md')).sort()
  caseStudies = []
  for (const filename of workFiles) {
    const filePath = path.join(workDir, filename)
    const entry = await readMarkdown(filePath)
    if (entry.data.draft !== undefined && typeof entry.data.draft !== 'boolean') {
      throw new Error(`${path.relative(rootDir, filePath)} draft must be true or false.`)
    }
    if (entry.data.draft === true) continue
    const slug = requiredText(entry.data.slug, 'slug', filePath)
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new Error(`${path.relative(rootDir, filePath)} has an unsafe slug "${slug}".`)
    }
    caseStudies.push({
      slug,
      title: requiredText(entry.data.title, 'title', filePath),
      type: requiredText(entry.data.project_type, 'project_type', filePath),
      summary: requiredText(entry.data.summary, 'summary', filePath),
      body: requiredText(entry.content, 'body', filePath),
    })
  }
  const slugs = caseStudies.map((entry) => entry.slug)
  if (new Set(slugs).size !== slugs.length) {
    throw new Error('Published work entries must have unique slugs.')
  }
  if (caseStudies.length === 0) {
    throw new Error('Add at least one published entry to content/work before building the portfolio.')
  }

  const credentialsDir = path.join(contentDir, 'credentials')
  const credentialFiles = (await fs.readdir(credentialsDir)).filter((name) => name.endsWith('.md')).sort()
  credentials = []
  for (const filename of credentialFiles) {
    const filePath = path.join(credentialsDir, filename)
    const entry = await readMarkdown(filePath)
    if (entry.data.draft !== undefined && typeof entry.data.draft !== 'boolean') {
      throw new Error(`${path.relative(rootDir, filePath)} draft must be true or false.`)
    }
    if (entry.data.draft === true) continue
    credentials.push({
      title: requiredText(entry.data.title, 'title', filePath),
      detail: requiredText(entry.data.detail, 'detail', filePath),
      order: Number(entry.data.sort_order) || 100,
      issuer: typeof entry.data.issuer_or_organization === 'string' ? entry.data.issuer_or_organization.trim() : '',
      credentialType: typeof entry.data.credential_type === 'string' ? entry.data.credential_type.trim() : '',
      status: typeof entry.data.status === 'string' ? entry.data.status.trim() : '',
      startDate: typeof entry.data.start_date === 'string' ? entry.data.start_date.trim() : '',
      endDate: typeof entry.data.end_date === 'string' ? entry.data.end_date.trim() : '',
      verificationUrl: typeof entry.data.verification_url === 'string' ? entry.data.verification_url.trim() : '',
    })
  }
  for (const entry of credentials) {
    if (entry.verificationUrl && !isSafeMarkdownUrl(entry.verificationUrl)) {
      throw new Error(`Credential "${entry.title}" has an unsafe verification_url.`)
    }
    for (const [field, date] of [['start_date', entry.startDate], ['end_date', entry.endDate]]) {
      if (date && !validIsoDate(date)) {
        throw new Error(`Credential "${entry.title}" ${field} must be a valid ISO 8601 date (YYYY-MM-DD).`)
      }
    }
  }
  credentials.sort((first, second) => first.order - second.order || first.title.localeCompare(second.title))
  if (credentials.length === 0) {
    throw new Error('Add at least one published education or training entry to content/credentials before building.')
  }

  const articlesDir = path.join(contentDir, 'blog')
  await fs.mkdir(articlesDir, { recursive: true })
  const articleFiles = (await fs.readdir(articlesDir)).filter((name) => name.endsWith('.md')).sort()
  articles = []
  for (const filename of articleFiles) {
    const filePath = path.join(articlesDir, filename)
    const entry = await readMarkdown(filePath)
    if (entry.data.draft !== undefined && typeof entry.data.draft !== 'boolean') {
      throw new Error(`${path.relative(rootDir, filePath)} draft must be true or false.`)
    }
    if (entry.data.draft === true) continue
    const slug = requiredText(entry.data.slug, 'slug', filePath)
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new Error(`${path.relative(rootDir, filePath)} has an unsafe slug "${slug}".`)
    }
    const publishDate = requiredText(entry.data.publish_date, 'publish_date', filePath)
    if (!validIsoDate(publishDate)) {
      throw new Error(`${path.relative(rootDir, filePath)} publish_date must be a valid ISO 8601 date (YYYY-MM-DD).`)
    }
    const updatedDate = typeof entry.data.updated_date === 'string' ? entry.data.updated_date : publishDate
    if (!validIsoDate(updatedDate) || updatedDate < publishDate) {
      throw new Error(`${path.relative(rootDir, filePath)} updated_date must be a valid ISO 8601 date (YYYY-MM-DD).`)
    }
    const references = Array.isArray(entry.data.references) ? entry.data.references.map((reference, index) => {
      const title = requiredText(reference?.title, `references[${index}].title`, filePath)
      const url = requiredText(reference?.url, `references[${index}].url`, filePath)
      let parsedUrl
      try {
        parsedUrl = new URL(url)
      } catch {
        throw new Error(`${path.relative(rootDir, filePath)} reference "${title}" must use an absolute HTTP(S) URL.`)
      }
      if (!['https:', 'http:'].includes(parsedUrl.protocol)) {
        throw new Error(`${path.relative(rootDir, filePath)} reference "${title}" must use an HTTP(S) URL.`)
      }
      return {
        title,
        url: parsedUrl.href,
        publication: typeof reference.publication === 'string' ? reference.publication.trim() : '',
      }
    }) : []
    if (entry.data.references !== undefined && !Array.isArray(entry.data.references)) {
      throw new Error(`${path.relative(rootDir, filePath)} references must be a list.`)
    }
    articles.push({
      slug,
      title: requiredText(entry.data.title, 'title', filePath),
      excerpt: requiredText(entry.data.excerpt, 'excerpt', filePath),
      author: typeof entry.data.author === 'string' && entry.data.author.trim() ? entry.data.author.trim() : site.name,
      date: publishDate,
      updatedDate,
      body: requiredText(entry.content, 'body', filePath),
      references,
    })
  }
  const articleSlugs = articles.map((article) => article.slug)
  if (new Set(articleSlugs).size !== articleSlugs.length) {
    throw new Error('Published blog articles must have unique slugs.')
  }
}

const baseNavItems = [
  { label: 'About', href: '/about/' },
  { label: 'Work', href: '/work/' },
  { label: 'Credentials', href: '/credentials/' },
  { label: 'CV', href: '/resume/' },
  { label: 'Contact', href: '/contact/' },
]

const getNavItems = () => [
  ...baseNavItems.slice(0, 2),
  ...(articles.length ? [{ label: 'Blog', href: '/blog/' }] : []),
  ...baseNavItems.slice(2),
]

const xmlEscape = (value) => escapeHtml(value)

const pageTitle = (title) => `${escapeHtml(title)} | ${escapeHtml(site.name)}`

const renderLayout = ({ title, description, path, body, currentPage = '', structuredData = null, noIndex = false }) => {
  const navMarkup = getNavItems()
    .map((item) => {
      const active = item.href === currentPage ? 'aria-current="page"' : ''
      return `<a href="${item.href}" ${active}>${item.label}</a>`
    })
    .join('')
  const structuredDataItems = structuredData ? (Array.isArray(structuredData) ? structuredData : [structuredData]) : []
  const structuredDataMarkup = structuredDataItems
    .map((item) => `<script type="application/ld+json">${JSON.stringify(item).replace(/</g, '\\u003c')}</script>`)
    .join('\n')

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="theme-color" content="#f8fcfc" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${pageTitle(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta name="twitter:card" content="summary_large_image" />
    ${site.siteUrl && site.socialImage ? `<meta property="og:image" content="${escapeHtml(site.siteUrl)}${escapeHtml(site.socialImage)}" />` : ''}
    ${site.siteUrl && site.socialImage ? `<meta property="og:image:alt" content="Portfolio profile of ${escapeHtml(site.name)}, ${escapeHtml(site.title)}" />` : ''}
    ${site.siteUrl && site.socialImage ? `<meta name="twitter:image" content="${escapeHtml(site.siteUrl)}${escapeHtml(site.socialImage)}" />` : ''}
    ${site.siteUrl ? `<meta property="og:url" content="${escapeHtml(site.siteUrl)}${escapeHtml(path)}" />` : ''}
    ${site.siteUrl ? `<link rel="canonical" href="${escapeHtml(site.siteUrl)}${escapeHtml(path)}" />` : ''}
    ${noIndex ? '<meta name="robots" content="noindex,follow" />' : ''}
    ${structuredDataMarkup}
    <title>${pageTitle(title)}</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="stylesheet" href="/src/style.css" />
  </head>
  <body>
    <a class="skip-link" href="#main-content">Skip to content</a>
    <header class="site-header">
      <div class="container nav-wrap">
        <a href="/" class="brand">
          <span class="brand-mark" aria-hidden="true">IS</span>
          <span>
            <strong>${escapeHtml(site.name)}</strong>
            <small>${escapeHtml(site.title)}</small>
          </span>
        </a>
        <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav">
          Menu
        </button>
        <nav id="site-nav" class="site-nav" aria-label="Main navigation">
          ${navMarkup}
        </nav>
      </div>
    </header>
    <main id="main-content" class="page-shell">
      ${body}
    </main>
    <footer class="site-footer">
      <div class="container footer-wrap">
        <div>
          <strong>${escapeHtml(site.name)}</strong>
          <p>${escapeHtml(site.title)}</p>
        </div>
        <div class="footer-links">
          <a href="mailto:${escapeHtml(site.email)}">Email</a>
          <a href="${escapeHtml(site.linkedin)}" target="_blank" rel="noreferrer">LinkedIn</a>
          <a href="/resume/">CV</a>
        </div>
      </div>
    </footer>
    <script src="/app.js"></script>
  </body>
</html>`
}

const renderPageIntro = ({ eyebrow, heading, lead }) => `
  <section class="section hero-post">
    <div class="container narrow-copy">
      <p class="eyebrow">${escapeHtml(eyebrow)}</p>
      <h1>${escapeHtml(heading)}</h1>
      ${lead ? `<p class="lead">${escapeHtml(lead)}</p>` : ''}
    </div>
  </section>
`

const renderCaseStudyCard = (item) => `
  <article class="feature-card">
    <span class="tag">${escapeHtml(item.type)}</span>
    <h3>${escapeHtml(item.title)}</h3>
    <p>${escapeHtml(item.summary)}</p>
    <a href="/work/${encodeURIComponent(item.slug)}/">Read project</a>
  </article>
`

const renderHomePage = () => `
  <section class="section hero">
    <div class="container hero-grid">
      <div class="hero-copy">
        <p class="eyebrow">Food Scientist · Food Science &amp; Technology</p>
        <h1>${escapeHtml(site.headline)}</h1>
        <p class="lead">I’m ${escapeHtml(site.name)}. ${escapeHtml(site.shortBio)}</p>
        <div class="cta-row">
          <a class="button primary" href="/contact/">Contact me</a>
          <a class="button secondary" href="/work/">Explore selected work</a>
        </div>
        <ul class="inline-meta" aria-label="Professional details">
          <li>${escapeHtml(site.location)}</li>
          <li><a href="mailto:${escapeHtml(site.email)}">Email Iqra</a></li>
          <li><a href="${escapeHtml(site.linkedin)}" target="_blank" rel="noreferrer">LinkedIn profile</a></li>
        </ul>
      </div>
      ${renderPortraitGallery()}
    </div>
  </section>
  <section class="section section-muted">
    <div class="container">
      <div class="section-heading">
        <p class="eyebrow">Selected work</p>
        <h2>Academic study and professional experience.</h2>
        <p class="section-intro">These entries are labelled by their actual context. No client work or unverified outcomes are implied.</p>
      </div>
      <div class="card-grid">
        ${caseStudies.map(renderCaseStudyCard).join('')}
      </div>
    </div>
  </section>
  <section class="section">
    <div class="container split-layout">
      <div>
        <p class="eyebrow">Areas represented in my background</p>
        <h2>Food science explored through study and experience.</h2>
        <ul class="check-list">
          <li>Food Science &amp; Technology studies</li>
          <li>Microbial analysis and shelf-life evaluation as an academic project topic</li>
          <li>A six-week internship with the Punjab Food Authority</li>
        </ul>
      </div>
      <div class="stack-box">
        <p class="eyebrow">A note on scope</p>
        <h3>Clear about what the evidence supports.</h3>
        <p>This portfolio shares the information available in the supplied CV. Detailed project methods and outcomes are not presented without supporting material.</p>
        <a class="text-link" href="/credentials/">View education and training</a>
      </div>
    </div>
  </section>
  <section class="section">
    <div class="container">
      <div class="section-heading">
        <p class="eyebrow">Education &amp; training</p>
        <h2>Learning that supports my food-science background.</h2>
      </div>
      <div class="credentials-list">
        ${credentials.map((item) => `
          <div class="credential-item">
            <strong>${escapeHtml(item.title)}</strong>
            <span>${escapeHtml(item.detail)}</span>
            ${(item.issuer || item.credentialType || item.status || item.startDate || item.endDate) ? `<span class="credential-meta">${[item.issuer, item.credentialType, item.status, item.startDate, item.endDate].filter(Boolean).map(escapeHtml).join(' · ')}</span>` : ''}
            ${item.verificationUrl ? `<a href="${escapeHtml(item.verificationUrl)}" rel="noreferrer">Verify credential</a>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  </section>
  ${site.services.length ? `<section class="section section-muted"><div class="container"><div class="section-heading"><p class="eyebrow">Confirmed services</p><h2>Ways I can help.</h2></div><ul class="service-list">${site.services.map((service) => `<li>${escapeHtml(service)}</li>`).join('')}</ul></div></section>` : ''}
  <section class="section section-contact">
    <div class="container contact-invitation">
      <div>
        <p class="eyebrow">Get in touch</p>
        <h2>Would you like to connect?</h2>
        <p>Reach out by email or connect with me on LinkedIn.</p>
      </div>
      <div class="cta-row">
        <a class="button primary" href="mailto:${escapeHtml(site.email)}">Email Iqra</a>
        <a class="button secondary" href="${escapeHtml(site.linkedin)}" target="_blank" rel="noreferrer">Connect on LinkedIn</a>
      </div>
    </div>
  </section>
`

const renderPortraitGallery = () => {
  const images = site.portraitGallery.length
    ? site.portraitGallery
    : [{ image: site.portrait, alt: `Portrait of ${site.name}`, caption: '' }]
  const isCarousel = images.length > 1
  return `
    <div class="portrait-wrap">
      <div class="portrait-gallery"${isCarousel ? ' data-portrait-gallery role="region" aria-roledescription="carousel" aria-label="Portrait gallery"' : ''}>
        ${isCarousel ? `
          <div class="portrait-gallery-heading">
            <span>Visual notes</span>
          </div>
        ` : ''}
        <div class="portrait-window">
          ${images.map((image, index) => `
            <figure class="portrait-slide${index === 0 ? ' is-active' : ''}" data-caption="${escapeHtml(image.caption || 'Food Scientist')}"${isCarousel ? ` role="group" aria-roledescription="slide" aria-label="${index + 1} of ${images.length}" aria-hidden="${index !== 0}"` : ''}>
              <img ${index === 0 ? `src="${escapeHtml(image.image)}" fetchpriority="high"` : `data-src="${escapeHtml(image.image)}" loading="lazy"`} alt="${escapeHtml(image.alt)}" class="portrait" width="648" height="810" decoding="async" />
            </figure>
          `).join('')}
          <div class="portrait-image-meta" aria-hidden="true">
            <p class="portrait-image-caption" data-portrait-caption>${escapeHtml(images[0].caption || 'Food Scientist')}</p>
            <p class="portrait-image-context">Food science <span aria-hidden="true">/</span> Selected moments</p>
          </div>
        </div>
        <div class="portrait-gallery-footer">
          <p class="portrait-caption">Iqra Shakir <span>Food Scientist · Lodhran, Pakistan</span></p>
          ${isCarousel ? `<span class="portrait-counter" data-portrait-counter aria-hidden="true">01 <span>/ ${String(images.length).padStart(2, '0')}</span></span>` : ''}
        </div>
      </div>
    </div>
  `
}

const renderAboutPage = () => `
  ${renderPageIntro({ eyebrow: 'About', heading: aboutPage.title, lead: aboutPage.summary })}
  <section class="section">
    <div class="container narrow-copy">
      <div class="article-body">
        ${marked.parse(aboutPage.body)}
        <div class="cta-row"><a class="button primary" href="/resume/">View my CV</a><a class="button secondary" href="/contact/">Contact me</a></div>
      </div>
    </div>
  </section>
`

const renderWorkPage = () => `
  ${renderPageIntro({ eyebrow: 'Selected work', heading: 'Academic work and professional experience.', lead: 'The items below are identified by context. Project methods and results are not added where supporting detail has not been verified.' })}
  <section class="section">
    <div class="container">
      <div class="card-grid">
        ${caseStudies.map(renderCaseStudyCard).join('')}
      </div>
    </div>
  </section>
`

const renderCaseStudyPage = (item) => `
  <nav class="breadcrumbs container" aria-label="Breadcrumb"><a href="/work/">Selected work</a><span aria-hidden="true">/</span><span>${escapeHtml(item.type)}</span></nav>
  ${renderPageIntro({ eyebrow: item.type, heading: item.title, lead: item.summary })}
  <section class="section">
    <div class="container narrow-copy article-body">
      ${marked.parse(item.body)}
      <p class="source-note">This entry reflects information listed in the supplied CV.</p>
      <a class="text-link" href="/work/">Back to selected work</a>
    </div>
  </section>
`

const renderArticleCard = (article) => `
  <article class="feature-card">
    <p class="meta">${formatDate(article.date)}</p>
    <h2><a href="/blog/${encodeURIComponent(article.slug)}/">${escapeHtml(article.title)}</a></h2>
    <p>${escapeHtml(article.excerpt)}</p>
    <a href="/blog/${encodeURIComponent(article.slug)}/">Read article</a>
  </article>
`

const renderBlogPage = () => `
  ${renderPageIntro({ eyebrow: 'Writing', heading: 'Food-science articles.', lead: 'Articles and explainers from Iqra Shakir.' })}
  <section class="section">
    <div class="container card-grid small-grid">
      ${articles.map(renderArticleCard).join('')}
    </div>
  </section>
`

const renderArticlePage = (article) => `
  <nav class="breadcrumbs container" aria-label="Breadcrumb"><a href="/blog/">Writing</a><span aria-hidden="true">/</span><span>${escapeHtml(article.title)}</span></nav>
  ${renderPageIntro({ eyebrow: 'Article', heading: article.title, lead: article.excerpt })}
  <section class="section">
    <div class="container narrow-copy article-body">
      <p class="meta-row"><span>By ${escapeHtml(article.author)}</span><time datetime="${escapeHtml(article.date)}">${formatDate(article.date)}</time>${article.updatedDate !== article.date ? `<span>Updated <time datetime="${escapeHtml(article.updatedDate)}">${formatDate(article.updatedDate)}</time></span>` : ''}</p>
      ${marked.parse(article.body)}
      ${article.references.length ? `<h2>References</h2><ol>${article.references.map((reference) => `<li><a href="${escapeHtml(reference.url)}" target="_blank" rel="noreferrer">${escapeHtml(reference.title)}</a>${reference.publication ? ` <span>${escapeHtml(reference.publication)}</span>` : ''}</li>`).join('')}</ol>` : ''}
      <a class="text-link" href="/blog/">Back to writing</a>
    </div>
  </section>
`

const renderCredentialsPage = () => `
  ${renderPageIntro({ eyebrow: 'Education & training', heading: 'My academic and training background.', lead: 'Education and training documented in the supplied CV.' })}
  <section class="section">
    <div class="container">
      <div class="credentials-list">
        ${credentials.map((item) => `
          <div class="credential-item">
            <strong>${escapeHtml(item.title)}</strong>
            <span>${escapeHtml(item.detail)}</span>
            ${(item.issuer || item.credentialType || item.status || item.startDate || item.endDate) ? `<span class="credential-meta">${[item.issuer, item.credentialType, item.status, item.startDate, item.endDate].filter(Boolean).map(escapeHtml).join(' · ')}</span>` : ''}
            ${item.verificationUrl ? `<a href="${escapeHtml(item.verificationUrl)}" rel="noreferrer">Verify credential</a>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  </section>
`

const renderContactPage = () => `
  ${renderPageIntro({ eyebrow: 'Contact', heading: 'Get in touch with Iqra.', lead: 'For professional enquiries, collaboration, or to learn more about my background, contact me directly.' })}
  <section class="section">
    <div class="container narrow-copy">
      <div class="stack-box contact-box">
        <p><strong>Email:</strong> <a href="mailto:${escapeHtml(site.email)}">${escapeHtml(site.email)}</a></p>
        <p><strong>LinkedIn:</strong> <a href="${escapeHtml(site.linkedin)}" target="_blank" rel="noreferrer">LinkedIn profile</a></p>
        <p><strong>Phone:</strong> <a href="tel:${escapeHtml(site.phone.replace(/\s+/g, ''))}">${escapeHtml(site.phone)}</a></p>
        <div class="cta-row">
          <button class="button primary" type="button" data-copy-email="${escapeHtml(site.email)}">Copy email</button>
          <a class="button secondary" href="mailto:${escapeHtml(site.email)}">Email directly</a>
        </div>
        <p class="copy-status" data-copy-status aria-live="polite"></p>
      </div>
    </div>
  </section>
`

const renderResumePage = () => `
  ${renderPageIntro({ eyebrow: 'CV', heading: 'View or download my CV.', lead: 'The supplied CV is available as a PDF.' })}
  <section class="section">
    <div class="container narrow-copy">
      <div class="stack-box">
        <p>For the full details of my education, experience, and training, view or download the PDF below.</p>
        <div class="cta-row">
          <a class="button primary" href="/media/iqra%20shakir_food_science_cv%20(1).pdf" target="_blank" rel="noreferrer">View CV PDF</a>
          <a class="button secondary" href="/media/iqra%20shakir_food_science_cv%20(1).pdf" download>Download CV</a>
          <a class="button secondary" href="/contact/">Contact me</a>
        </div>
      </div>
    </div>
  </section>
`

const renderNotFoundPage = () => `
  ${renderPageIntro({ eyebrow: '404', heading: 'This page is not available.', lead: 'The page you were looking for has moved or does not exist.' })}
  <section class="section">
    <div class="container narrow-copy">
      <div class="stack-box">
        <p>You can return to the homepage or browse selected academic and professional work.</p>
        <div class="cta-row">
          <a class="button primary" href="/">Back to home</a>
          <a class="button secondary" href="/work/">View work</a>
        </div>
      </div>
    </div>
  </section>
`

const writeFile = async (filePath, content) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, content, 'utf8')
}

const generateAppScript = async () => {
  const appScript = `
    document.documentElement.classList.add('js');

    const toggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.site-nav');
    const closeMenu = () => {
      if (!toggle || !nav) return;
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    };

    if (toggle && nav) {
      toggle.addEventListener('click', () => {
        const open = toggle.getAttribute('aria-expanded') !== 'true';
        toggle.setAttribute('aria-expanded', String(open));
        nav.classList.toggle('is-open', open);
      });
      nav.addEventListener('click', (event) => {
        if (event.target instanceof HTMLAnchorElement) closeMenu();
      });
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
          closeMenu();
          toggle.focus();
        }
      });
    }

    const gallery = document.querySelector('[data-portrait-gallery]');
    if (gallery) {
      const slides = [...gallery.querySelectorAll('.portrait-slide')];
      const counter = gallery.querySelector('[data-portrait-counter]');
      const caption = gallery.querySelector('[data-portrait-caption]');
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      let current = 0;
      let timer;

      const loadSlide = async (index) => {
        const image = slides[index].querySelector('img');
        if (image.dataset.src) {
          image.src = image.dataset.src;
          delete image.dataset.src;
        }
        await image.decode();
      };
      const showSlide = async (index) => {
        const next = (index + slides.length) % slides.length;
        try {
          await loadSlide(next);
        } catch (error) {
          console.error('Unable to load portrait gallery image.', error);
          return false;
        }
        current = next;
        slides.forEach((slide, slideIndex) => {
          const active = slideIndex === current;
          slide.classList.toggle('is-active', active);
          slide.setAttribute('aria-hidden', String(!active));
          slide.setAttribute('aria-label', (slideIndex + 1) + ' of ' + slides.length);
        });
        counter.firstChild.textContent = String(current + 1).padStart(2, '0') + ' ';
        caption.textContent = slides[current].dataset.caption;
        return true;
      };
      const clearRotation = () => {
        window.clearTimeout(timer);
        timer = undefined;
      };
      const scheduleRotation = () => {
        clearRotation();
        if (reducedMotion.matches || document.hidden) return;
        timer = window.setTimeout(async () => {
          const shown = await showSlide(current + 1);
          if (shown) scheduleRotation();
        }, 6500);
      };
      document.addEventListener('visibilitychange', scheduleRotation);
      reducedMotion.addEventListener('change', scheduleRotation);
      if (!reducedMotion.matches) {
        loadSlide((current + 1) % slides.length).catch((error) => {
          console.error('Unable to preload portrait gallery image.', error);
        });
      }
      scheduleRotation();
    }

    const copyButton = document.querySelector('[data-copy-email]');
    const copyStatus = document.querySelector('[data-copy-status]');
    if (copyButton && copyStatus) {
      copyButton.addEventListener('click', async () => {
        const email = copyButton.dataset.copyEmail;
        let copied = false;
        if (navigator.clipboard && window.isSecureContext) {
          try {
            await navigator.clipboard.writeText(email);
            copied = true;
          } catch {
            copied = false;
          }
        }
        if (!copied) {
          try {
            const fallback = document.createElement('textarea');
            fallback.value = email;
            fallback.setAttribute('readonly', '');
            fallback.style.position = 'fixed';
            fallback.style.opacity = '0';
            document.body.append(fallback);
            fallback.select();
            copied = document.execCommand('copy');
            fallback.remove();
          } catch {
            copied = false;
          }
        }
        copyStatus.textContent = copied
          ? 'Email address copied.'
          : 'Copy is unavailable. Select the email address above or use the email link.';
      });
    }
  `
  await writeFile(path.join(publicDir, 'app.js'), appScript.trim())
}

const generateSitemap = () => {
  const urls = [
    '/',
    '/about/',
    '/work/',
    ...caseStudies.map((item) => `/work/${item.slug}/`),
    ...(articles.length ? ['/blog/', ...articles.map((item) => `/blog/${item.slug}/`)] : []),
    '/credentials/',
    '/resume/',
    '/contact/',
  ]
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.map((url) => `  <url><loc>${site.siteUrl}${url}</loc></url>`).join('\n')}
</urlset>`
}

const generateRss = () => {
const items = articles.map((article) => `
  <item>
    <title>${xmlEscape(article.title)}</title>
    <link>${site.siteUrl}/blog/${encodeURIComponent(article.slug)}/</link>
    <guid isPermaLink="true">${site.siteUrl}/blog/${encodeURIComponent(article.slug)}/</guid>
    <pubDate>${new Date(`${article.date}T00:00:00Z`).toUTCString()}</pubDate>
    <description>${xmlEscape(article.excerpt)}</description>
  </item>
`).join('')

return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${xmlEscape(site.name)} | Food Scientist</title>
  <link>${site.siteUrl}</link>
  <description>Food-science articles by ${xmlEscape(site.name)}.</description>
  ${items}
</channel>
</rss>`
}

const generateRobots = () => `User-agent: *\nAllow: /\n${site.siteUrl ? `Sitemap: ${site.siteUrl}/sitemap.xml\n` : ''}`

const copyMedia = async () => {
  await fs.mkdir(mediaDir, { recursive: true })
  const requiredAssets = [
    ['my-pic.webp', site.portrait, '/media/my-pic.webp'],
    ['iqra shakir_food_science_cv (1).pdf', site.cvFile, '/media/iqra%20shakir_food_science_cv%20(1).pdf'],
    ['iqra-social-card.webp', site.socialImage, '/media/iqra-social-card.webp'],
  ]
  for (const [filename, publicPath, defaultPath] of requiredAssets) {
    if (!publicPath) continue
    const source = path.join(sourceImagesDir, filename)
    const destination = path.join(publicDir, decodeURIComponent(publicPath.replace(/^\//, '')))
    try {
      const stats = await fs.stat(destination)
      if (!stats.isFile()) throw new Error()
    } catch {
      if (publicPath !== defaultPath) {
        throw new Error(`Configured portfolio asset does not exist: ${publicPath}`)
      }

      try {
        await fs.access(source)
      } catch {
        throw new Error(`Required portfolio asset is missing: ${path.relative(rootDir, source)}`)
      }
      await fs.copyFile(source, destination)
    }
  }
}

const validatePortraitGalleryMedia = async () => {
  for (const image of site.portraitGallery) {
    const destination = path.join(publicDir, decodeURIComponent(image.image.slice(1)))
    try {
      const stats = await fs.stat(destination)
      if (!stats.isFile()) throw new Error()
    } catch {
      throw new Error(`Configured portrait gallery image does not exist: ${image.image}`)
    }
  }
}

const main = async () => {
  await loadContent()
  await fs.mkdir(publicDir, { recursive: true })
  for (const target of ['about', 'work', 'blog', 'credentials', 'resume', 'contact', '404.html', 'styles.css', 'app.js', 'sitemap.xml', 'rss.xml', 'robots.txt']) {
    await fs.rm(path.join(publicDir, target), { recursive: true, force: true })
  }
  await generateAppScript()
  await copyMedia()
  await validatePortraitGalleryMedia()

  await writeFile(path.join(rootDir, 'index.html'), renderLayout({
    title: site.title,
    description: `${site.name} is a Food Scientist based in Lodhran, Pakistan. Explore her academic work, experience, education, and contact details.`,
    path: '/',
    body: renderHomePage(),
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: site.name,
      jobTitle: site.title,
      email: `mailto:${site.email}`,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Lodhran',
        addressRegion: 'Punjab',
        addressCountry: 'PK',
      },
      ...(site.siteUrl ? { url: site.siteUrl } : {}),
      sameAs: [site.linkedin],
    },
  }))

  await writeFile(path.join(publicDir, 'about', 'index.html'), renderLayout({
    title: 'About',
    description: aboutPage.summary,
    path: '/about/',
    body: renderAboutPage(),
    currentPage: '/about/',
  }))

  await writeFile(path.join(publicDir, 'work', 'index.html'), renderLayout({
    title: 'Work',
    description: 'Academic and professional food science work by Iqra Shakir.',
    path: '/work/',
    body: renderWorkPage(),
    currentPage: '/work/',
  }))

  for (const item of caseStudies) {
    await writeFile(path.join(publicDir, 'work', item.slug, 'index.html'), renderLayout({
      title: item.title,
      description: item.summary,
      path: `/work/${item.slug}/`,
      body: renderCaseStudyPage(item),
      currentPage: '/work/',
      structuredData: site.siteUrl ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: site.siteUrl || '/' },
          { '@type': 'ListItem', position: 2, name: 'Selected work', item: `${site.siteUrl}/work/` },
          { '@type': 'ListItem', position: 3, name: item.title, item: `${site.siteUrl}/work/${item.slug}/` },
        ],
      } : null,
    }))
  }

  if (articles.length) {
    await writeFile(path.join(publicDir, 'blog', 'index.html'), renderLayout({
      title: 'Writing',
      description: `Food-science articles by ${site.name}.`,
      path: '/blog/',
      body: renderBlogPage(),
      currentPage: '/blog/',
    }))
    for (const article of articles) {
      const articleUrl = `${site.siteUrl}/blog/${encodeURIComponent(article.slug)}/`
      const articleSchemas = site.siteUrl ? [
        {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: article.title,
          description: article.excerpt,
          author: { '@type': 'Person', name: article.author },
          datePublished: article.date,
          dateModified: article.updatedDate,
          mainEntityOfPage: articleUrl,
          url: articleUrl,
          ...(article.references.length ? { citation: article.references.map((reference) => reference.url) } : {}),
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: site.siteUrl },
            { '@type': 'ListItem', position: 2, name: 'Writing', item: `${site.siteUrl}/blog/` },
            { '@type': 'ListItem', position: 3, name: article.title, item: articleUrl },
          ],
        },
      ] : null
      await writeFile(path.join(publicDir, 'blog', article.slug, 'index.html'), renderLayout({
        title: article.title,
        description: article.excerpt,
        path: `/blog/${article.slug}/`,
        body: renderArticlePage(article),
        currentPage: '/blog/',
        structuredData: articleSchemas,
      }))
    }
  }

  await writeFile(path.join(publicDir, 'credentials', 'index.html'), renderLayout({
    title: 'Credentials',
    description: 'Credentials and professional experience for Iqra Shakir.',
    path: '/credentials/',
    body: renderCredentialsPage(),
    currentPage: '/credentials/',
  }))

  await writeFile(path.join(publicDir, 'resume', 'index.html'), renderLayout({
    title: 'Resume',
    description: 'Download the CV for Iqra Shakir.',
    path: '/resume/',
    body: renderResumePage(),
    currentPage: '/resume/',
  }))

  await writeFile(path.join(publicDir, 'contact', 'index.html'), renderLayout({
    title: 'Contact',
    description: 'Contact Iqra Shakir for food science and quality discussions.',
    path: '/contact/',
    body: renderContactPage(),
    currentPage: '/contact/',
  }))

  await writeFile(path.join(publicDir, '404.html'), renderLayout({
    title: 'Page not found',
    description: 'The requested page could not be found.',
    path: '/404.html',
    body: renderNotFoundPage(),
    currentPage: '/',
    noIndex: true,
  }))

  if (site.siteUrl) {
    const parsedSiteUrl = new URL(site.siteUrl)
    if (parsedSiteUrl.protocol !== 'https:') {
      throw new Error('SITE_URL must use HTTPS.')
    }
    await writeFile(path.join(publicDir, 'sitemap.xml'), generateSitemap())
    await writeFile(path.join(publicDir, 'robots.txt'), generateRobots())
    if (articles.length) await writeFile(path.join(publicDir, 'rss.xml'), generateRss())
  } else {
    if (process.env.NETLIFY && !site.siteUrl) {
      throw new Error('Set SITE_URL to the final HTTPS origin in Netlify before building for deployment.')
    }
    await writeFile(path.join(publicDir, 'robots.txt'), generateRobots())
    console.warn('SITE_URL is not set; canonical URLs, sitemap.xml, and RSS.xml are omitted until deployment configuration.')
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

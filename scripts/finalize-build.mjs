import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(rootDir, 'dist')
const siteUrl = process.env.SITE_URL?.replace(/\/+$/, '')
const homePath = path.join(distDir, 'index.html')
const homeHtml = await fs.readFile(homePath, 'utf8')
const stylesheetPath = homeHtml.match(/href="([^"]+\.css)"/)?.[1]

if (!stylesheetPath) {
  throw new Error('The Vite build did not emit the required portfolio stylesheet.')
}

const htmlFiles = []
const visitHtmlFiles = async (directory) => {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      await visitHtmlFiles(entryPath)
    } else if (entry.isFile() && entry.name.endsWith('.html') && entryPath !== homePath) {
      const html = await fs.readFile(entryPath, 'utf8')
      const finalizedHtml = html.replaceAll('href="/src/style.css"', `href="${stylesheetPath}"`)
      await fs.writeFile(entryPath, finalizedHtml, 'utf8')
      htmlFiles.push({ path: entryPath, html: finalizedHtml })
    }
  }
}

await visitHtmlFiles(distDir)
htmlFiles.push({ path: homePath, html: homeHtml })

const pageTitles = new Set()
const pageDescriptions = new Set()
for (const file of htmlFiles) {
  if (file.path.includes(`${path.sep}admin${path.sep}`)) continue
  const headingCount = [...file.html.matchAll(/<h1(?:\s|>)/g)].length
  if (headingCount !== 1) {
    throw new Error(`${path.relative(distDir, file.path)} must contain exactly one H1; found ${headingCount}.`)
  }
  if (!file.html.includes('id="main-content"') || !file.html.includes('class="skip-link"')) {
    throw new Error(`${path.relative(distDir, file.path)} is missing its main landmark or skip link.`)
  }
  if (!file.html.includes(`href="${stylesheetPath}"`) || file.html.includes('/src/style.css')) {
    throw new Error(`${path.relative(distDir, file.path)} does not reference the compiled stylesheet.`)
  }
  if (!/<meta name="description" content="[^"]+"/.test(file.html)) {
    throw new Error(`${path.relative(distDir, file.path)} is missing its meta description.`)
  }
  if (file.html.includes('id="app"')) {
    throw new Error(`${path.relative(distDir, file.path)} depends on a client-rendered content shell.`)
  }
  const title = file.html.match(/<title>(.*?)<\/title>/)?.[1]
  const description = file.html.match(/<meta name="description" content="([^"]+)"/)?.[1]
  if (pageTitles.has(title)) throw new Error(`Duplicate page title found: "${title}".`)
  if (pageDescriptions.has(description)) throw new Error(`Duplicate page description found: "${description}".`)
  pageTitles.add(title)
  pageDescriptions.add(description)
  if (siteUrl && !file.html.includes('rel="canonical"')) {
    throw new Error(`${path.relative(distDir, file.path)} is missing its production canonical URL.`)
  }

  const links = [...file.html.matchAll(/href="([^"]+)"/g)].map((match) => match[1])
  for (const href of links) {
    if (!href.startsWith('/') || href.startsWith('//')) continue
    let decodedPath
    try {
      decodedPath = decodeURIComponent(new URL(href, 'https://portfolio.invalid').pathname)
    } catch {
      throw new Error(`${path.relative(distDir, file.path)} contains an invalid internal link: ${href}`)
    }
    const destination = path.resolve(distDir, `.${decodedPath}`)
    if (!destination.startsWith(distDir)) {
      throw new Error(`${path.relative(distDir, file.path)} contains a path traversal link: ${href}`)
    }
    let stats
    try {
      stats = await fs.stat(destination)
      if (stats.isDirectory()) await fs.stat(path.join(destination, 'index.html'))
    } catch {
      throw new Error(`${path.relative(distDir, file.path)} links to a missing local path: ${href}`)
    }
  }
}

const outputFiles = []
const listOutputFiles = async (directory) => {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) await listOutputFiles(entryPath)
    else outputFiles.push(entryPath)
  }
}
await listOutputFiles(distDir)
if (outputFiles.some((file) => file.endsWith('.map'))) {
  throw new Error('Source map files are not expected in the public dist output.')
}

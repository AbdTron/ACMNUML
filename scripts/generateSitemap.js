/**
 * Sitemap Generator for ACM NUML Website
 * Generates a static sitemap.xml for all public routes
 * 
 * Run: node scripts/generateSitemap.js
 * 
 * NOTE: For dynamic routes (events, forum posts), you would need to 
 * fetch data from Firestore at build time. This is a future enhancement.
 */

import { writeFileSync } from 'fs'
import { join } from 'path'

const SITE_URL = 'https://acmnuml.com'
const CURRENT_DATE = new Date().toISOString().split('T')[0]

// Static routes with priorities
const staticRoutes = [
    { path: '/', priority: 1.0, changefreq: 'weekly' },
    { path: '/events', priority: 0.9, changefreq: 'daily' },
    { path: '/gallery', priority: 0.7, changefreq: 'weekly' },
    { path: '/team', priority: 0.7, changefreq: 'monthly' },
    { path: '/about', priority: 0.6, changefreq: 'monthly' },
    { path: '/contact', priority: 0.6, changefreq: 'monthly' },
    { path: '/join', priority: 0.8, changefreq: 'monthly' },
    { path: '/forum', priority: 0.8, changefreq: 'daily' },
    { path: '/members', priority: 0.6, changefreq: 'weekly' },
    { path: '/feedback', priority: 0.5, changefreq: 'monthly' }
]

function generateSitemap() {
    const urls = staticRoutes.map(route => `
  <url>
    <loc>${SITE_URL}${route.path}</loc>
    <lastmod>${CURRENT_DATE}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('')

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`

    // Write to public directory
    const outputPath = join(process.cwd(), 'public', 'sitemap.xml')
    writeFileSync(outputPath, sitemap.trim(), 'utf8')
    console.log(`✓ Sitemap generated: ${outputPath}`)
    console.log(`  - ${staticRoutes.length} static routes included`)

    // Future enhancement note
    console.log('\nNote: Dynamic routes (events, forum posts) can be added by')
    console.log('fetching data from Firestore at build time.')
}

generateSitemap()

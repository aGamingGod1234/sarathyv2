const fs = require('fs')
const path = require('path')

const pagePath = path.join(process.cwd(), 'app', 'page.tsx')
const source = fs.readFileSync(pagePath, 'utf8')
const compactSource = source.replace(/\s+/g, ' ').trim()

console.log(`Landing source check: ${compactSource}`)

if (!source.includes("import LandingPageClient from './LandingPageClient'")) {
  throw new Error('Railway build is not seeing the landing page import.')
}

if (!source.includes("export const dynamic = 'force-dynamic'")) {
  throw new Error('Railway build is not seeing the dynamic landing page setting.')
}

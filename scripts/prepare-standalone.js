const fs = require('fs')
const path = require('path')

const root = process.cwd()
const nextDir = path.join(root, '.next')
const standaloneDir = path.join(nextDir, 'standalone')

function copyDirectory(source, target) {
  if (!fs.existsSync(source)) return false
  fs.rmSync(target, { recursive: true, force: true })
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.cpSync(source, target, { recursive: true })
  return true
}

if (!fs.existsSync(standaloneDir)) {
  console.warn('Standalone output not found. Skipping standalone asset copy.')
  process.exit(0)
}

const copiedStatic = copyDirectory(
  path.join(nextDir, 'static'),
  path.join(standaloneDir, '.next', 'static'),
)

const copiedPublic = copyDirectory(
  path.join(root, 'public'),
  path.join(standaloneDir, 'public'),
)

console.log(`Prepared standalone output: static=${copiedStatic}, public=${copiedPublic}`)

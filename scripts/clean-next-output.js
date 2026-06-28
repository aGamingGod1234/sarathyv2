const fs = require('fs')
const path = require('path')

const nextDir = path.join(process.cwd(), '.next')

if (!fs.existsSync(nextDir)) {
  process.exit(0)
}

for (const entry of fs.readdirSync(nextDir)) {
  if (entry === 'cache') {
    continue
  }

  fs.rmSync(path.join(nextDir, entry), {
    recursive: true,
    force: true,
  })
}

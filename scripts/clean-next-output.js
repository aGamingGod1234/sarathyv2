const fs = require('fs')
const path = require('path')

const nextDir = path.join(process.cwd(), '.next')

if (!fs.existsSync(nextDir)) {
  process.exit(0)
}

function emptyDirectory(directory) {
  if (!fs.existsSync(directory)) {
    return
  }

  for (const entry of fs.readdirSync(directory)) {
    fs.rmSync(path.join(directory, entry), {
      recursive: true,
      force: true,
    })
  }
}

for (const entry of fs.readdirSync(nextDir)) {
  if (entry === 'cache') {
    emptyDirectory(path.join(nextDir, entry))
    continue
  }

  fs.rmSync(path.join(nextDir, entry), {
    recursive: true,
    force: true,
  })
}

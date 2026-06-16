const fs = require('fs')
const path = require('path')

const ignoredDirs = new Set(['.git', 'node_modules', 'dist', '.wrangler'])
const checkedExts = new Set([
  '.js',
  '.jsx',
  '.json',
  '.html',
  '.css',
  '.sql',
  '.toml',
  '.yml',
  '.yaml',
  '.md',
])

const mojibakeTokens = [
  '\u99c3',
  '\u7487',
  '\u7025',
  '\u6942',
  '\u936b',
  '\u9411',
  '\u95b2',
  '\u8ca1',
  '\u921e',
  '\u9251',
  '\u6fbe',
  '\u93c0',
  '\u8de8',
  '\ufffd',
  '\u00c3',
  '\u00c2',
  '\u00e2',
  '\u00e5',
  '\u00e6',
  '\u00e7',
  '\u00e8',
  '\u00e9',
  '\u00e4',
  '\u20ac',
]

let found = 0

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue

    const filePath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(filePath)
      continue
    }

    if (!checkedExts.has(path.extname(entry.name))) continue

    const text = fs.readFileSync(filePath, 'utf8')
    text.split(/\r?\n/).forEach((line, index) => {
      if (!mojibakeTokens.some((token) => line.includes(token))) return
      found += 1
      console.error(`${filePath}:${index + 1}: ${line}`)
    })
  }
}

walk(process.cwd())

if (found > 0) {
  console.error(`Found ${found} possible mojibake line(s).`)
  process.exit(1)
}

console.log('Encoding check passed.')


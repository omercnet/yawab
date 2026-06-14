// Guard: the packaged app must ship with ZERO production dependencies so that
// electron-builder never runs its (flaky on macOS) pnpm node-modules collector.
// The main/preload bundles may therefore only import `electron` and Node
// built-ins; any other bare import means a dependency leaked back to external.
//
// electron-vite leaves the main/preload output un-minified, so rollup keeps real
// external imports as top-level `import ... from "x"` statements on their own
// lines. We only inspect those — scanning the whole bundle would false-match
// `require("x")` strings inside bundled library code. We scan the main entry and
// all of its chunks (lazy imports like electron-updater land in chunks).
import { readdirSync, readFileSync } from 'node:fs'
import { builtinModules } from 'node:module'
import { join } from 'node:path'

const allowed = new Set([
  'electron',
  ...builtinModules,
  ...builtinModules.map((m) => `node:${m}`)
])

const mainFiles = readdirSync('out/main', { recursive: true })
  .filter((f) => typeof f === 'string' && f.endsWith('.js'))
  .map((f) => join('out/main', f))
const files = [...mainFiles, 'out/preload/index.mjs']

const offenders = []
for (const file of files) {
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (!/^\s*import\b/.test(line)) continue
    const spec = line.match(/["']([^"']+)["']/)?.[1]
    if (
      !spec ||
      spec.startsWith('.') ||
      spec.startsWith('node:') ||
      spec.startsWith('electron/')
    ) {
      continue
    }
    if (!allowed.has(spec)) offenders.push(`${file}: external import "${spec}"`)
  }
}

if (offenders.length > 0) {
  console.error(
    'Bundle guard failed — these dependencies are externalized but must be bundled\n' +
      '(electron-builder would then collect node_modules, which breaks macOS packaging):\n  ' +
      offenders.join('\n  ')
  )
  process.exit(1)
}

console.log(
  `Bundle guard OK (${files.length} files): only electron + Node built-ins are external.`
)

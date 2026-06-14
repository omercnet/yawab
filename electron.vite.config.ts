import { builtinModules, createRequire } from 'node:module'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'electron-vite'

const require = createRequire(import.meta.url)
const pkg = require('./package.json') as {
  dependencies?: Record<string, string>
}

// Node built-ins + the electron runtime module must never be bundled (electron
// provides them at runtime). Bundling the `electron` npm package pulls in its
// install shim, whose default export is the binary *path string* — so
// `import { app } from 'electron'` resolves to `undefined` and the app crashes
// on launch. Externalize them explicitly.
const nodeAndElectronExternals: (string | RegExp)[] = [
  'electron',
  /^electron\/.+/,
  ...builtinModules.flatMap((m) => [m, `node:${m}`])
]

// Runtime dependencies are externalized in the main process and shipped in
// node_modules by electron-builder (which only packages `dependencies`).
const runtimeDeps = Object.keys(pkg.dependencies ?? {})
const mainExternals: (string | RegExp)[] = [
  ...nodeAndElectronExternals,
  ...runtimeDeps,
  ...runtimeDeps.map((dep) => new RegExp(`^${dep}/.+`))
]

export default defineConfig({
  main: {
    resolve: {
      alias: {
        '@shared': resolve('src/shared')
      }
    },
    build: {
      rollupOptions: {
        external: mainExternals,
        input: { index: resolve('src/main/index.ts') }
      }
    }
  },
  preload: {
    resolve: {
      alias: {
        '@shared': resolve('src/shared')
      }
    },
    build: {
      rollupOptions: {
        // Preload runs in the (potentially sandboxed) renderer context, so it
        // cannot load packages from node_modules — bundle dependencies and only
        // keep electron + node built-ins external.
        external: nodeAndElectronExternals,
        input: { index: resolve('src/preload/index.ts') },
        // main process loads `../preload/index.mjs`; electron-vite 5 would
        // otherwise emit `index.js` for an ESM project.
        output: { format: 'es', entryFileNames: '[name].mjs' }
      }
    }
  },
  renderer: {
    root: 'src/renderer',
    resolve: {
      alias: {
        '@shared': resolve('src/shared'),
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react()],
    build: {
      rollupOptions: {
        input: { index: resolve('src/renderer/index.html') }
      }
    }
  }
})

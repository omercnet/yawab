import { builtinModules } from 'node:module'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'electron-vite'

// Only `electron` and Node built-ins stay external. `electron` is provided by
// the runtime (bundling its npm package pulls in an install shim whose default
// export is the binary path string, which crashes the app). EVERYTHING else is
// bundled into the main/preload output, so the packaged app ships with zero
// production dependencies. That removes electron-builder's pnpm node-modules
// collector from the packaging path entirely — it was non-deterministically
// failing on macOS with `⨯ <projectDir> not a file`.
const externals: (string | RegExp)[] = [
  'electron',
  /^electron\/.+/,
  ...builtinModules.flatMap((m) => [m, `node:${m}`])
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
        external: externals,
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
        external: externals,
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

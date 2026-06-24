import { builtinModules } from 'node:module'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'electron-vite'

// Only `electron` and Node built-ins stay external. `electron` is provided by
// the runtime (bundling its npm package pulls in an install shim whose default
// export is the binary path string, which crashes the app). Other package
// dependencies stay bundled into the main/preload output unless listed here,
// which keeps electron-builder's pnpm node-modules collector off that path.
const externals: (string | RegExp)[] = [
  'electron',
  /^electron\/.+/,
  ...builtinModules.flatMap((m) => [m, `node:${m}`])
]

const sentryBuildConstants = {
  __YAWAB_SENTRY_DSN__: JSON.stringify(process.env.YAWAB_SENTRY_DSN ?? ''),
  __YAWAB_SENTRY_ENVIRONMENT__: JSON.stringify(
    process.env.YAWAB_SENTRY_ENVIRONMENT ?? ''
  ),
  __YAWAB_SENTRY_RELEASE__: JSON.stringify(process.env.YAWAB_SENTRY_RELEASE ?? '')
} as const

export default defineConfig({
  main: {
    define: sentryBuildConstants,
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
    define: sentryBuildConstants,
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
    define: sentryBuildConstants,
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

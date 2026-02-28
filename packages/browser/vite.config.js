import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  build: {
    outDir: 'browser',

    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'TypescriptCliTemplate',
      fileName: 'typescript-cli-template'
    },

    // We're not using any external dependencies, but these options are important for these
    rollupOptions: {
      external: [],
      output: {
        globals: {}
      }
    }
  }
})

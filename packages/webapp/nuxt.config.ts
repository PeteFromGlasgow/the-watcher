// https://nuxt.com/docs/api/configuration/nuxt-config
import tsconfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  nitro: {
    rollupConfig: {
      plugins: [
        {
          name: 'mock-client-precomputed',
          resolveId(id) {
            if (id.includes('client.precomputed.mjs')) {
              return { id, external: false }
            }
          },
          load(id) {
            if (id.includes('client.precomputed.mjs')) {
              return 'export default {}'
            }
          }
        }
      ]
    }
  },
  buildDir: '.nuxt',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  modules: [
    '@nuxt/eslint',
    '@nuxt/test-utils',
    'shadcn-nuxt'
  ],
  vite: {
    plugins: [
      tsconfigPaths(),
      tailwindcss()
    ]
  },
  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: '',
    /**
     * Directory that the component lives in.
     * @default "./components/ui"
     */
    componentDir: './components/ui'
  },
  dir: {
    pages: 'pages'
  },
  runtimeConfig: {
    public: {
      kratosPublicUrl: process.env.NUXT_PUBLIC_KRATOS_PUBLIC_URL ?? 'http://localhost:4433'
    }
  }
})

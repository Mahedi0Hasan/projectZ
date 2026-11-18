import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// `vite build --mode shopify` builds the embeddable section (src/shopify.tsx):
// tokens move from :root to .lucid-root so they don't leak into the theme.
const scopeTokens = (): Plugin => ({
  name: 'lucid-scope-tokens',
  enforce: 'pre',
  transform(code, id) {
    if (id.split('?')[0].endsWith('/styles/tokens.css')) return code.replaceAll(':root', '.lucid-root')
  },
})

export default defineConfig(({ mode }) =>
  mode === 'shopify'
    ? {
        plugins: [react(), scopeTokens()],
        build: {
          outDir: 'dist-shopify',
          rollupOptions: {
            input: 'src/shopify.tsx',
            output: {
              entryFileNames: 'assets/lucid-embed.js',
              chunkFileNames: 'assets/lucid-embed-[name].js',
              assetFileNames: 'assets/lucid-embed[extname]',
            },
          },
        },
      }
    : {
        // Fixed file names, so the Shopify theme can reference assets/lucid.js and assets/lucid.css.
        plugins: [react()],
        build: {
          rollupOptions: {
            output: {
              entryFileNames: 'assets/lucid.js',
              chunkFileNames: 'assets/lucid-[name].js',
              assetFileNames: 'assets/lucid[extname]',
            },
          },
        },
      },
)

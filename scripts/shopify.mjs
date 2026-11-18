// Copies the production build into the Shopify theme folder (shopify/assets).
import { copyFileSync, readdirSync } from 'node:fs'

for (const f of readdirSync('dist/assets')) {
  copyFileSync(`dist/assets/${f}`, `shopify/assets/${f}`)
  console.log(`shopify/assets/${f}`)
}

import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

export default defineConfig({
  plugins: [preact()],
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment'
  },
  server: {
    host: true,
    allowedHosts: ['.trycloudflare.com'], // allow Cloudflare Tunnel access
  }
})

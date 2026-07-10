import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Plain React SPA — no Next.js. base: './' keeps built asset paths
// relative, which matters when this build is served from a
// non-root path and dropped into an <iframe> on another site.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
    // Allow the dev server to be framed while you're building locally.
    // (Your production host's headers are what actually control this
    // once deployed — see README.md for the CSP / X-Frame-Options note.)
    headers: {
      'X-Frame-Options': 'ALLOWALL',
    },
  },
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Set GITHUB_PAGES=true when publishing to the project subpath on GitHub Pages.
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES === 'true' ? '/reporevive-ai/' : '/',
  server: { port: 5173 },
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'fs'
import { join, resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  plugins: [
    react(),
    // ✅ 7. Copy service workers to dist root after build
    {
      name: 'copy-service-workers',
      closeBundle() {
        const publicDir = join(process.cwd(), 'public')
        const distDir = join(process.cwd(), 'dist')
        
        try {
          // Copy sw.js
          copyFileSync(
            join(publicDir, 'sw.js'),
            join(distDir, 'sw.js')
          )
          console.log('✓ Copied sw.js to dist')
          
          // Copy firebase-messaging-sw.js
          copyFileSync(
            join(publicDir, 'firebase-messaging-sw.js'),
            join(distDir, 'firebase-messaging-sw.js')
          )
          console.log('✓ Copied firebase-messaging-sw.js to dist')
        } catch (error) {
          console.error('Error copying service workers:', error)
        }
      }
    }
  ],
  server: {
    port: 3000
  },
  build: {
    rollupOptions: {
      output: {
        // Ensure JS/CSS files have content hashes for cache busting
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
})

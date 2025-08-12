/**
 * MLG.clan Build Script
 * Simple build system for production optimization
 */

import { build } from 'vite'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { resolve } from 'path'

const config = {
  // Build configuration
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    
    rollupOptions: {
      input: {
        main: resolve(process.cwd(), 'index.html'),
        voting: resolve(process.cwd(), 'voting.html'),
        clans: resolve(process.cwd(), 'clans.html'),
        content: resolve(process.cwd(), 'content.html'),
        profile: resolve(process.cwd(), 'profile.html'),
        dao: resolve(process.cwd(), 'dao.html'),
        analytics: resolve(process.cwd(), 'analytics.html')
      }
    },
    
    minify: 'esbuild',
    sourcemap: true
  },
  
  // Exclude problematic files from the build for now
  optimizeDeps: {
    exclude: ['src/js/mlg-cache-manager.js']
  }
}

async function runBuild() {
  try {
    console.log('🏗️ Starting MLG.clan build process...')
    
    // Create dist directory if it doesn't exist
    if (!existsSync('dist')) {
      mkdirSync('dist', { recursive: true })
    }
    
    // Run Vite build with simplified config
    await build(config)
    
    // Create build manifest
    const manifest = {
      buildTime: new Date().toISOString(),
      version: '1.0.0',
      environment: 'production',
      features: [
        'Modern ES modules',
        'Optimized assets',
        'Code splitting',
        'Source maps'
      ]
    }
    
    writeFileSync('dist/build-manifest.json', JSON.stringify(manifest, null, 2))
    
    console.log('✅ Build completed successfully!')
    console.log('📁 Output directory: dist/')
    console.log('🚀 Ready for deployment')
    
  } catch (error) {
    console.error('❌ Build failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runBuild()
}

export { runBuild, config }
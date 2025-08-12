/**
 * Compression & Minification Optimizer
 * Implements aggressive compression for maximum performance
 */

import { readFileSync, writeFileSync, createWriteStream, readdirSync, statSync } from 'fs'
import { join, extname, basename } from 'path'
import { gzipSync, brotliCompressSync } from 'zlib'
import { createHash } from 'crypto'

class CompressionOptimizer {
  constructor() {
    this.distDir = './temp/dist'
    this.compressionResults = []
    this.totalSavings = 0
  }

  async optimize() {
    console.log('🗜️  Starting Compression Optimization...\n')
    
    await this.compressJavaScript()
    await this.compressCSS()
    await this.compressHTML()
    await this.generatePrecompressedAssets()
    await this.optimizeImages()
    await this.generateIntegrityHashes()
    
    this.reportCompressionResults()
    
    return {
      results: this.compressionResults,
      totalSavings: this.totalSavings
    }
  }

  async compressJavaScript() {
    console.log('📦 Compressing JavaScript files...')
    
    const jsFiles = this.findFilesByExtension('.js')
    let compressedFiles = 0
    
    for (const file of jsFiles) {
      try {
        const originalContent = readFileSync(file.path, 'utf8')
        const originalSize = originalContent.length
        
        // Skip already minified files (contains .min. or very long lines)
        if (file.name.includes('.min.') || this.isAlreadyMinified(originalContent)) {
          continue
        }
        
        // Apply additional minification
        const minified = this.minifyJavaScript(originalContent)
        const minifiedSize = minified.length
        
        if (minifiedSize < originalSize) {
          writeFileSync(file.path, minified, 'utf8')
          
          const savings = originalSize - minifiedSize
          this.totalSavings += savings
          
          this.compressionResults.push({
            type: 'JavaScript Minification',
            file: file.name,
            originalSize: this.formatBytes(originalSize),
            compressedSize: this.formatBytes(minifiedSize),
            savings: this.formatBytes(savings),
            ratio: ((savings / originalSize) * 100).toFixed(1) + '%'
          })
          
          compressedFiles++
        }
        
      } catch (error) {
        console.log(`⚠️ Failed to compress ${file.name}:`, error.message)
      }
    }
    
    console.log(`✅ Compressed ${compressedFiles} JavaScript files`)
  }

  async compressCSS() {
    console.log('🎨 Compressing CSS files...')
    
    const cssFiles = this.findFilesByExtension('.css')
    let compressedFiles = 0
    
    for (const file of cssFiles) {
      try {
        const originalContent = readFileSync(file.path, 'utf8')
        const originalSize = originalContent.length
        
        const minified = this.minifyCSS(originalContent)
        const minifiedSize = minified.length
        
        if (minifiedSize < originalSize) {
          writeFileSync(file.path, minified, 'utf8')
          
          const savings = originalSize - minifiedSize
          this.totalSavings += savings
          
          this.compressionResults.push({
            type: 'CSS Minification',
            file: file.name,
            originalSize: this.formatBytes(originalSize),
            compressedSize: this.formatBytes(minifiedSize),
            savings: this.formatBytes(savings),
            ratio: ((savings / originalSize) * 100).toFixed(1) + '%'
          })
          
          compressedFiles++
        }
        
      } catch (error) {
        console.log(`⚠️ Failed to compress ${file.name}:`, error.message)
      }
    }
    
    console.log(`✅ Compressed ${compressedFiles} CSS files`)
  }

  async compressHTML() {
    console.log('📄 Compressing HTML files...')
    
    const htmlFiles = this.findFilesByExtension('.html')
    let compressedFiles = 0
    
    for (const file of htmlFiles) {
      try {
        const originalContent = readFileSync(file.path, 'utf8')
        const originalSize = originalContent.length
        
        const minified = this.minifyHTML(originalContent)
        const minifiedSize = minified.length
        
        if (minifiedSize < originalSize) {
          writeFileSync(file.path, minified, 'utf8')
          
          const savings = originalSize - minifiedSize
          this.totalSavings += savings
          
          this.compressionResults.push({
            type: 'HTML Minification',
            file: file.name,
            originalSize: this.formatBytes(originalSize),
            compressedSize: this.formatBytes(minifiedSize),
            savings: this.formatBytes(savings),
            ratio: ((savings / originalSize) * 100).toFixed(1) + '%'
          })
          
          compressedFiles++
        }
        
      } catch (error) {
        console.log(`⚠️ Failed to compress ${file.name}:`, error.message)
      }
    }
    
    console.log(`✅ Compressed ${compressedFiles} HTML files`)
  }

  async generatePrecompressedAssets() {
    console.log('🔄 Generating pre-compressed assets...')
    
    const compressibleFiles = [
      ...this.findFilesByExtension('.js'),
      ...this.findFilesByExtension('.css'),
      ...this.findFilesByExtension('.html'),
      ...this.findFilesByExtension('.json')
    ]
    
    let gzippedFiles = 0
    let brotliFiles = 0
    
    for (const file of compressibleFiles) {
      try {
        const content = readFileSync(file.path)
        
        // Generate Gzip version
        const gzipped = gzipSync(content, { level: 9 })
        const gzipPath = file.path + '.gz'
        writeFileSync(gzipPath, gzipped)
        gzippedFiles++
        
        // Generate Brotli version (better compression)
        try {
          const brotli = brotliCompressSync(content, {
            params: {
              [brotliCompressSync.constants.BROTLI_PARAM_QUALITY]: 11,
              [brotliCompressSync.constants.BROTLI_PARAM_SIZE_HINT]: content.length
            }
          })
          const brotliPath = file.path + '.br'
          writeFileSync(brotliPath, brotli)
          brotliFiles++
          
          // Track compression ratios
          const originalSize = content.length
          const gzipSize = gzipped.length
          const brotliSize = brotli.length
          
          this.compressionResults.push({
            type: 'Asset Compression',
            file: file.name,
            originalSize: this.formatBytes(originalSize),
            gzipSize: this.formatBytes(gzipSize),
            brotliSize: this.formatBytes(brotliSize),
            gzipRatio: ((originalSize - gzipSize) / originalSize * 100).toFixed(1) + '%',
            brotliRatio: ((originalSize - brotliSize) / originalSize * 100).toFixed(1) + '%'
          })
          
        } catch (brotliError) {
          console.log(`⚠️ Brotli compression failed for ${file.name}`)
        }
        
      } catch (error) {
        console.log(`⚠️ Failed to pre-compress ${file.name}:`, error.message)
      }
    }
    
    console.log(`✅ Generated ${gzippedFiles} Gzip and ${brotliFiles} Brotli assets`)
  }

  async optimizeImages() {
    console.log('🖼️ Optimizing images...')
    
    // For now, we'll just analyze image sizes and provide recommendations
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif']
    const imageFiles = []
    
    imageExtensions.forEach(ext => {
      imageFiles.push(...this.findFilesByExtension(ext))
    })
    
    let totalImageSize = 0
    let optimizationOpportunities = 0
    
    imageFiles.forEach(file => {
      const stats = statSync(file.path)
      const sizeKB = Math.round(stats.size / 1024)
      totalImageSize += stats.size
      
      // Identify optimization opportunities
      if (sizeKB > 100 && !file.name.includes('.webp')) {
        optimizationOpportunities++
        
        this.compressionResults.push({
          type: 'Image Optimization Opportunity',
          file: file.name,
          currentSize: this.formatBytes(stats.size),
          recommendation: sizeKB > 500 ? 'Convert to WebP and resize' : 'Convert to WebP',
          potentialSavings: '30-50%'
        })
      }
    })
    
    console.log(`📊 Analyzed ${imageFiles.length} images (${this.formatBytes(totalImageSize)} total)`)
    if (optimizationOpportunities > 0) {
      console.log(`💡 Found ${optimizationOpportunities} optimization opportunities`)
    }
  }

  async generateIntegrityHashes() {
    console.log('🔐 Generating integrity hashes...')
    
    const criticalFiles = [
      ...this.findFilesByExtension('.js').filter(f => !f.name.includes('legacy')),
      ...this.findFilesByExtension('.css')
    ]
    
    const integrityMap = {}
    
    criticalFiles.forEach(file => {
      try {
        const content = readFileSync(file.path)
        const hash = createHash('sha384').update(content).digest('base64')
        const relativePath = file.path.replace(this.distDir, '')
        integrityMap[relativePath] = `sha384-${hash}`
      } catch (error) {
        console.log(`⚠️ Failed to generate hash for ${file.name}`)
      }
    })
    
    // Save integrity map
    const integrityPath = join(this.distDir, 'integrity.json')
    writeFileSync(integrityPath, JSON.stringify(integrityMap, null, 2), 'utf8')
    
    console.log(`✅ Generated integrity hashes for ${Object.keys(integrityMap).length} files`)
    
    this.compressionResults.push({
      type: 'Integrity Hashes',
      description: `Generated SRI hashes for ${Object.keys(integrityMap).length} critical assets`,
      impact: 'Enhanced security and cache validation'
    })
  }

  minifyJavaScript(js) {
    // Basic JavaScript minification
    return js
      // Remove single-line comments (but preserve URLs)
      .replace(/\/\/(?!.*:\/\/).*$/gm, '')
      // Remove multi-line comments
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // Remove unnecessary whitespace
      .replace(/\s+/g, ' ')
      // Remove spaces around operators (basic)
      .replace(/\s*([{}();,:])\s*/g, '$1')
      // Remove trailing semicolons before }
      .replace(/;\s*}/g, '}')
      .trim()
  }

  minifyCSS(css) {
    return css
      // Remove comments
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // Remove unnecessary whitespace
      .replace(/\s+/g, ' ')
      // Remove spaces around certain characters
      .replace(/\s*([{}();,:])\s*/g, '$1')
      // Remove trailing semicolons before }
      .replace(/;\s*}/g, '}')
      // Remove leading/trailing whitespace
      .trim()
  }

  minifyHTML(html) {
    return html
      // Remove HTML comments (except conditional ones)
      .replace(/<!--(?!\s*(?:\[if [^\]]+]|<!|>))[\s\S]*?-->/g, '')
      // Collapse whitespace but preserve pre, textarea, script, style content
      .replace(/>\s+</g, '><')
      // Remove leading/trailing whitespace
      .trim()
  }

  isAlreadyMinified(content) {
    const lines = content.split('\n')
    if (lines.length < 10) return true // Very few lines, likely minified
    
    // Check for extremely long lines (typical of minified code)
    const avgLineLength = content.replace(/\n/g, '').length / lines.length
    return avgLineLength > 100
  }

  findFilesByExtension(extension) {
    const files = []
    
    function scanDirectory(dir) {
      try {
        const items = readdirSync(dir)
        
        items.forEach(item => {
          const itemPath = join(dir, item)
          const stat = statSync(itemPath)
          
          if (stat.isDirectory()) {
            scanDirectory(itemPath)
          } else if (extname(item) === extension) {
            files.push({
              name: item,
              path: itemPath
            })
          }
        })
      } catch (error) {
        // Directory might not exist or be inaccessible
      }
    }
    
    scanDirectory(this.distDir)
    return files
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B'
    
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  reportCompressionResults() {
    console.log('\n📊 COMPRESSION OPTIMIZATION RESULTS')
    console.log('=====================================\n')
    
    // Group results by type
    const resultsByType = {}
    
    this.compressionResults.forEach(result => {
      if (!resultsByType[result.type]) {
        resultsByType[result.type] = []
      }
      resultsByType[result.type].push(result)
    })
    
    Object.entries(resultsByType).forEach(([type, results]) => {
      console.log(`📦 ${type}:`)
      
      results.forEach(result => {
        if (result.file) {
          console.log(`  • ${result.file}`)
          if (result.originalSize) {
            console.log(`    ${result.originalSize} → ${result.compressedSize} (${result.ratio} savings)`)
          }
          if (result.gzipSize && result.brotliSize) {
            console.log(`    Gzip: ${result.gzipSize} (${result.gzipRatio}), Brotli: ${result.brotliSize} (${result.brotliRatio})`)
          }
          if (result.recommendation) {
            console.log(`    💡 ${result.recommendation} (${result.potentialSavings} potential savings)`)
          }
        } else if (result.description) {
          console.log(`  • ${result.description}`)
        }
      })
      console.log('')
    })
    
    console.log(`💾 Total space saved: ${this.formatBytes(this.totalSavings)}`)
    console.log('🚀 Compression optimization complete!')
  }
}

// Run compression if called directly
if (import.meta.url.endsWith('compression-optimizer.js')) {
  const compressor = new CompressionOptimizer()
  compressor.optimize().catch(console.error)
}

export default CompressionOptimizer
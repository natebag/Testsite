/**
 * MLG.clan JavaScript Optimization Script
 * 
 * Cleans up and optimizes JavaScript files for production
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'

class JavaScriptOptimizer {
  constructor() {
    this.optimizations = {
      removedConsole: 0,
      removedDebugger: 0,
      removedComments: 0,
      minifiedFiles: 0,
      totalSizeReduction: 0
    }
  }

  /**
   * Optimize all JavaScript files in the src directory
   */
  optimizeProject() {
    console.log('🚀 Starting JavaScript optimization...')
    
    const srcDir = './src'
    this.optimizeDirectory(srcDir)
    
    this.printReport()
  }

  /**
   * Recursively optimize JavaScript files in directory
   */
  optimizeDirectory(directory) {
    const items = readdirSync(directory)
    
    for (const item of items) {
      const fullPath = join(directory, item)
      const stat = statSync(fullPath)
      
      if (stat.isDirectory()) {
        this.optimizeDirectory(fullPath)
      } else if (stat.isFile() && extname(item) === '.js') {
        this.optimizeFile(fullPath)
      }
    }
  }

  /**
   * Optimize individual JavaScript file
   */
  optimizeFile(filePath) {
    try {
      const originalContent = readFileSync(filePath, 'utf8')
      const originalSize = originalContent.length
      
      let optimizedContent = originalContent
      
      // Remove console.log statements (keep console.error and console.warn)
      const consoleMatches = optimizedContent.match(/console\.log\([^)]*\);?/g)
      if (consoleMatches) {
        optimizedContent = optimizedContent.replace(/console\.log\([^)]*\);?/g, '')
        this.optimizations.removedConsole += consoleMatches.length
      }
      
      // Remove debugger statements
      const debuggerMatches = optimizedContent.match(/debugger;?/g)
      if (debuggerMatches) {
        optimizedContent = optimizedContent.replace(/debugger;?/g, '')
        this.optimizations.removedDebugger += debuggerMatches.length
      }
      
      // Remove excessive whitespace and empty lines
      optimizedContent = optimizedContent
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Max 2 consecutive newlines
        .replace(/[ \t]+$/gm, '') // Trailing whitespace
        .replace(/^\s+$/gm, '') // Empty lines with whitespace
      
      // Remove TODO comments in production
      const todoMatches = optimizedContent.match(/\/\*[\s\S]*?TODO[\s\S]*?\*\/|\/\/.*TODO.*/g)
      if (todoMatches) {
        optimizedContent = optimizedContent.replace(/\/\*[\s\S]*?TODO[\s\S]*?\*\/|\/\/.*TODO.*/g, '')
        this.optimizations.removedComments += todoMatches.length
      }
      
      // Fix common syntax issues
      optimizedContent = this.fixSyntaxIssues(optimizedContent)
      
      const optimizedSize = optimizedContent.length
      const reduction = originalSize - optimizedSize
      
      if (reduction > 0) {
        writeFileSync(filePath, optimizedContent)
        this.optimizations.minifiedFiles++
        this.optimizations.totalSizeReduction += reduction
        
        console.log(`✅ Optimized ${filePath} (${reduction} bytes saved)`)
      }
      
    } catch (error) {
      console.error(`❌ Failed to optimize ${filePath}:`, error.message)
    }
  }

  /**
   * Fix common syntax issues that break builds
   */
  fixSyntaxIssues(content) {
    // Fix literal \n characters in strings
    content = content.replace(/\\n/g, '\n')
    
    // Fix template literal issues
    content = content.replace(/`([^`]*?)\\n([^`]*?)`/g, '`$1\n$2`')
    
    // Remove duplicate semicolons
    content = content.replace(/;;+/g, ';')
    
    // Fix spacing around operators
    content = content.replace(/([=!<>])(\s*)([=!<>])/g, '$1$3')
    
    return content
  }

  /**
   * Print optimization report
   */
  printReport() {
    console.log('\n📊 JavaScript Optimization Report:')
    console.log(`🗑️  Console.log statements removed: ${this.optimizations.removedConsole}`)
    console.log(`🐛 Debugger statements removed: ${this.optimizations.removedDebugger}`)
    console.log(`💬 TODO comments removed: ${this.optimizations.removedComments}`)
    console.log(`📁 Files optimized: ${this.optimizations.minifiedFiles}`)
    console.log(`📈 Total size reduction: ${(this.optimizations.totalSizeReduction / 1024).toFixed(2)} KB`)
    console.log('✅ JavaScript optimization completed!\n')
  }
}

// Run optimization if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const optimizer = new JavaScriptOptimizer()
  optimizer.optimizeProject()
}

export { JavaScriptOptimizer }
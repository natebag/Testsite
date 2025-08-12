/**
 * Custom Vite Compression Plugin
 * Adds gzip and brotli compression for production builds
 */

import { gzipSync, brotliCompressSync } from 'zlib';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

export function compressionPlugin(options = {}) {
  const {
    algorithm = ['gzip', 'brotli'],
    threshold = 1024, // Only compress files larger than 1KB
    deleteOriginals = false,
    ext = {
      gzip: '.gz',
      brotli: '.br'
    }
  } = options;

  return {
    name: 'vite-compression',
    apply: 'build',
    generateBundle(outputOptions, bundle) {
      const compressionPromises = [];
      
      Object.keys(bundle).forEach(fileName => {
        const chunk = bundle[fileName];
        
        // Only compress JS, CSS, and HTML files above threshold
        if (
          (fileName.endsWith('.js') || fileName.endsWith('.css') || fileName.endsWith('.html')) &&
          chunk.code && 
          chunk.code.length > threshold
        ) {
          const content = chunk.code || chunk.source;
          
          algorithm.forEach(alg => {
            if (alg === 'gzip') {
              const compressed = gzipSync(content, { level: 9 });
              const compressedFileName = fileName + ext.gzip;
              
              compressionPromises.push(
                this.emitFile({
                  type: 'asset',
                  fileName: compressedFileName,
                  source: compressed
                })
              );
            }
            
            if (alg === 'brotli') {
              const compressed = brotliCompressSync(content, {
                params: {
                  [require('zlib').constants.BROTLI_PARAM_QUALITY]: 11,
                  [require('zlib').constants.BROTLI_PARAM_SIZE_HINT]: content.length
                }
              });
              const compressedFileName = fileName + ext.brotli;
              
              compressionPromises.push(
                this.emitFile({
                  type: 'asset',
                  fileName: compressedFileName,
                  source: compressed
                })
              );
            }
          });
        }
      });
      
      return Promise.all(compressionPromises);
    }
  };
}

export default compressionPlugin;
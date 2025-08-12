/**
 * @fileoverview CDN Configuration and Management System for MLG Gaming Platform
 * Provides comprehensive CDN architecture for global gaming content delivery
 */

/**
 * CDN Configuration for different environments
 */
export const CDN_CONFIGS = {
  production: {
    primary: {
      provider: 'cloudflare',
      baseUrl: 'https://cdn.mlg.clan',
      zones: {
        static: 'https://static.mlg.clan',
        media: 'https://media.mlg.clan',
        gaming: 'https://gaming.mlg.clan',
        textures: 'https://textures.mlg.clan',
        audio: 'https://audio.mlg.clan',
        video: 'https://video.mlg.clan'
      },
      regions: ['us-east-1', 'us-west-2', 'eu-central-1', 'ap-southeast-1', 'ap-northeast-1'],
      features: {
        compression: true,
        webp: true,
        avif: true,
        streaming: true,
        edgeCompute: true,
        bot_protection: true,
        ddos_protection: true
      }
    },
    fallback: {
      provider: 'aws_cloudfront',
      baseUrl: 'https://d1234567890.cloudfront.net',
      zones: {
        static: 'https://d1234567891.cloudfront.net',
        media: 'https://d1234567892.cloudfront.net',
        gaming: 'https://d1234567893.cloudfront.net'
      }
    }
  },
  staging: {
    primary: {
      provider: 'cloudflare',
      baseUrl: 'https://cdn-staging.mlg.clan',
      zones: {
        static: 'https://static-staging.mlg.clan',
        media: 'https://media-staging.mlg.clan'
      }
    }
  },
  development: {
    primary: {
      provider: 'local',
      baseUrl: 'http://localhost:8080',
      zones: {
        static: 'http://localhost:8080/static',
        media: 'http://localhost:8080/media'
      }
    }
  }
};

/**
 * Content type mappings for CDN routing
 */
export const CONTENT_TYPE_MAPPING = {
  // Static Assets
  'text/css': 'static',
  'application/javascript': 'static',
  'application/json': 'static',
  'font/woff': 'static',
  'font/woff2': 'static',
  'font/ttf': 'static',
  
  // Images
  'image/jpeg': 'media',
  'image/png': 'media',
  'image/webp': 'media',
  'image/avif': 'media',
  'image/gif': 'media',
  'image/svg+xml': 'media',
  
  // Gaming Assets
  'application/x-texture': 'textures',
  'application/x-model': 'gaming',
  'application/x-shader': 'gaming',
  'application/x-unity-package': 'gaming',
  
  // Audio
  'audio/mpeg': 'audio',
  'audio/wav': 'audio',
  'audio/ogg': 'audio',
  'audio/webm': 'audio',
  
  // Video
  'video/mp4': 'video',
  'video/webm': 'video',
  'video/ogg': 'video',
  'application/x-mpegURL': 'video', // HLS
  'application/dash+xml': 'video'    // DASH
};

/**
 * Geographic routing configuration
 */
export const GEO_ROUTING_CONFIG = {
  regions: {
    'us-east': {
      primary: 'us-east-1',
      fallback: ['us-west-2', 'us-central-1'],
      countries: ['US-east', 'CA-east'],
      latency_threshold: 50
    },
    'us-west': {
      primary: 'us-west-2',
      fallback: ['us-west-1', 'us-central-1'],
      countries: ['US-west', 'CA-west'],
      latency_threshold: 50
    },
    'europe': {
      primary: 'eu-central-1',
      fallback: ['eu-west-1', 'eu-north-1'],
      countries: ['DE', 'FR', 'GB', 'NL', 'ES', 'IT', 'PL'],
      latency_threshold: 60
    },
    'asia-pacific': {
      primary: 'ap-southeast-1',
      fallback: ['ap-northeast-1', 'ap-south-1'],
      countries: ['SG', 'JP', 'KR', 'AU', 'IN', 'TH', 'VN'],
      latency_threshold: 80
    }
  },
  default_region: 'us-east'
};

/**
 * Caching strategies for different content types
 */
export const CACHE_STRATEGIES = {
  static_assets: {
    ttl: 31536000, // 1 year
    edge_ttl: 86400, // 1 day
    browser_ttl: 3600, // 1 hour
    compression: true,
    versioning: true
  },
  media_images: {
    ttl: 604800, // 1 week
    edge_ttl: 86400, // 1 day
    browser_ttl: 3600, // 1 hour
    compression: true,
    optimization: {
      webp: true,
      avif: true,
      quality: 85,
      progressive: true
    }
  },
  gaming_assets: {
    ttl: 86400, // 1 day
    edge_ttl: 3600, // 1 hour
    browser_ttl: 1800, // 30 minutes
    compression: true,
    preload: true
  },
  audio_video: {
    ttl: 604800, // 1 week
    edge_ttl: 86400, // 1 day
    browser_ttl: 7200, // 2 hours
    streaming: true,
    transcoding: {
      enabled: true,
      formats: ['mp4', 'webm', 'hls']
    }
  },
  api_responses: {
    ttl: 300, // 5 minutes
    edge_ttl: 60, // 1 minute
    browser_ttl: 0, // No browser cache
    compression: true,
    conditional: true
  }
};

/**
 * Security configuration for CDN endpoints
 */
export const SECURITY_CONFIG = {
  authentication: {
    api_key_header: 'X-MLG-API-KEY',
    signed_urls: {
      enabled: true,
      expiry: 3600, // 1 hour
      algorithm: 'sha256'
    },
    referrer_policy: {
      enabled: true,
      allowed_domains: ['mlg.clan', '*.mlg.clan', 'localhost']
    }
  },
  rate_limiting: {
    requests_per_minute: 1000,
    burst_limit: 100,
    penalty_duration: 300, // 5 minutes
    whitelist: ['verified_bots', 'internal_services']
  },
  ddos_protection: {
    enabled: true,
    threshold: 10000, // requests per minute
    block_duration: 3600, // 1 hour
    challenge_mode: 'javascript'
  },
  bot_protection: {
    enabled: true,
    challenge_static_assets: false,
    challenge_api_endpoints: true,
    verified_bots: ['googlebot', 'bingbot', 'facebookexternalhit']
  }
};

/**
 * Performance optimization settings
 */
export const PERFORMANCE_CONFIG = {
  compression: {
    gzip: {
      enabled: true,
      level: 6,
      min_size: 1024
    },
    brotli: {
      enabled: true,
      level: 4,
      min_size: 1024
    }
  },
  image_optimization: {
    auto_webp: true,
    auto_avif: true,
    quality_adaptive: true,
    lazy_loading: true,
    responsive_images: true
  },
  prefetching: {
    dns_prefetch: true,
    preconnect: true,
    resource_hints: true,
    critical_path: true
  },
  http2_push: {
    enabled: true,
    critical_assets: ['/css/main.css', '/js/main.js']
  }
};

/**
 * Monitoring and analytics configuration
 */
export const MONITORING_CONFIG = {
  metrics: {
    real_time: {
      enabled: true,
      interval: 30, // seconds
      retention: 86400 // 24 hours
    },
    historical: {
      enabled: true,
      aggregation: ['hourly', 'daily', 'weekly'],
      retention: 2592000 // 30 days
    }
  },
  alerts: {
    error_rate_threshold: 5, // percent
    latency_threshold: 500, // milliseconds
    availability_threshold: 99.9, // percent
    bandwidth_threshold: 10000000000 // 10GB
  },
  cost_tracking: {
    enabled: true,
    budget_alerts: true,
    monthly_budget: 5000, // USD
    usage_reports: true
  }
};
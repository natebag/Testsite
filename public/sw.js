/**
 * MLG.clan Service Worker
 * Provides offline functionality, caching, background sync, and push notifications
 * for the MLG gaming platform
 */

const CACHE_VERSION = '1.0.0';
const CACHE_PREFIX = 'mlg-clan';
const STATIC_CACHE = `${CACHE_PREFIX}-static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE = `${CACHE_PREFIX}-dynamic-v${CACHE_VERSION}`;
const API_CACHE = `${CACHE_PREFIX}-api-v${CACHE_VERSION}`;
const GAMING_ASSETS_CACHE = `${CACHE_PREFIX}-gaming-v${CACHE_VERSION}`;

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
};

// Static assets to precache
const STATIC_ASSETS = [
  '/pages/index.html',
  '/pages/clans.html',
  '/pages/dao.html',
  '/pages/content.html',
  '/pages/profile.html',
  '/pages/voting.html',
  '/pages/analytics.html',
  '/src/main.js',
  '/src/styles/main.css',
  '/manifest.json',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png'
];

// Gaming-specific assets
const GAMING_ASSETS = [
  '/src/js/mlg-api-client-consolidated.js',
  '/src/js/mlg-wallet-init-consolidated.js',
  '/src/utils/cache/mlg-cache-manager.js',
  '/src/utils/offline/mlg-offline-manager.js',
  '/src/utils/state/state-management.js'
];

// API endpoints that should be cached
const CACHEABLE_API_ENDPOINTS = [
  '/api/clans',
  '/api/content',
  '/api/user/profile',
  '/api/leaderboard',
  '/api/tournaments'
];

// Background sync tags
const SYNC_TAGS = {
  GAMING_DATA: 'sync-gaming-data',
  USER_ACTIONS: 'sync-user-actions',
  CLAN_UPDATES: 'sync-clan-updates',
  VOTING_DATA: 'sync-voting-data'
};

/**
 * Service Worker Installation
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    (async () => {
      try {
        // Cache static assets
        const staticCache = await caches.open(STATIC_CACHE);
        await staticCache.addAll(STATIC_ASSETS);
        
        // Cache gaming assets
        const gamingCache = await caches.open(GAMING_ASSETS_CACHE);
        await gamingCache.addAll(GAMING_ASSETS);
        
        console.log('[SW] Static assets cached successfully');
        
        // Skip waiting to activate immediately
        await self.skipWaiting();
      } catch (error) {
        console.error('[SW] Installation failed:', error);
      }
    })()
  );
});

/**
 * Service Worker Activation
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    (async () => {
      try {
        // Clean up old caches
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames.filter(name => 
          name.startsWith(CACHE_PREFIX) && 
          !name.includes(CACHE_VERSION)
        );
        
        await Promise.all(
          oldCaches.map(cacheName => caches.delete(cacheName))
        );
        
        console.log('[SW] Old caches cleaned up');
        
        // Take control of all clients
        await self.clients.claim();
        
        // Initialize background sync
        await initializeBackgroundSync();
        
      } catch (error) {
        console.error('[SW] Activation failed:', error);
      }
    })()
  );
});

/**
 * Fetch Event Handler - Main request interception
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-HTTP requests
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Determine caching strategy based on request type
  if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isAPIRequest(url)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isGamingAsset(url)) {
    event.respondWith(handleGamingAsset(request));
  } else if (isNavigationRequest(request)) {
    event.respondWith(handleNavigation(request));
  } else {
    event.respondWith(handleDynamic(request));
  }
});

/**
 * Background Sync Event Handler
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  switch (event.tag) {
    case SYNC_TAGS.GAMING_DATA:
      event.waitUntil(syncGamingData());
      break;
    case SYNC_TAGS.USER_ACTIONS:
      event.waitUntil(syncUserActions());
      break;
    case SYNC_TAGS.CLAN_UPDATES:
      event.waitUntil(syncClanUpdates());
      break;
    case SYNC_TAGS.VOTING_DATA:
      event.waitUntil(syncVotingData());
      break;
    default:
      console.warn('[SW] Unknown sync tag:', event.tag);
  }
});

/**
 * Push Notification Event Handler
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let notificationData;
  
  try {
    notificationData = event.data ? event.data.json() : {};
  } catch (error) {
    console.error('[SW] Failed to parse push data:', error);
    notificationData = { title: 'MLG.clan Update', body: 'New activity available!' };
  }
  
  const options = {
    body: notificationData.body || 'New activity in your gaming platform!',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: notificationData.data || {},
    actions: generateNotificationActions(notificationData.type),
    tag: notificationData.tag || 'mlg-general',
    requireInteraction: notificationData.requireInteraction || false
  };
  
  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || 'MLG.clan',
      options
    )
  );
});

/**
 * Notification Click Event Handler
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  const clickedAction = event.action;
  const notificationData = event.notification.data;
  
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll();
      const clientUrl = determineNavigationUrl(clickedAction, notificationData);
      
      // Try to focus existing client or open new one
      for (const client of clients) {
        if (client.url.includes(clientUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window/tab
      if (self.clients.openWindow) {
        return self.clients.openWindow(clientUrl);
      }
    })()
  );
});

/**
 * Message Event Handler - Communication with main thread
 */
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'CACHE_GAMING_DATA':
      cacheGamingData(payload);
      break;
    case 'REQUEST_SYNC':
      requestBackgroundSync(payload.tag);
      break;
    case 'CLEAR_CACHE':
      clearSpecificCache(payload.cacheType);
      break;
    default:
      console.warn('[SW] Unknown message type:', type);
  }
});

// === Helper Functions ===

/**
 * Check if URL is a static asset
 */
function isStaticAsset(url) {
  return STATIC_ASSETS.some(asset => url.pathname.endsWith(asset)) ||
         url.pathname.includes('/assets/') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.png') ||
         url.pathname.endsWith('.jpg') ||
         url.pathname.endsWith('.svg');
}

/**
 * Check if URL is an API request
 */
function isAPIRequest(url) {
  return url.pathname.startsWith('/api/') ||
         CACHEABLE_API_ENDPOINTS.some(endpoint => url.pathname.includes(endpoint));
}

/**
 * Check if URL is a gaming-specific asset
 */
function isGamingAsset(url) {
  return GAMING_ASSETS.some(asset => url.pathname.includes(asset)) ||
         url.pathname.includes('mlg-') ||
         url.pathname.includes('gaming-');
}

/**
 * Check if request is a navigation request
 */
function isNavigationRequest(request) {
  return request.mode === 'navigate' ||
         (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

/**
 * Handle static assets with cache-first strategy
 */
async function handleStaticAsset(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Static asset fetch failed:', error);
    return new Response('Asset not available offline', { status: 503 });
  }
}

/**
 * Handle API requests with network-first strategy
 */
async function handleAPIRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache for API request');
    
    const cache = await caches.open(API_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback for API requests
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'This data is not available offline' 
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Handle gaming assets with cache-first strategy
 */
async function handleGamingAsset(request) {
  try {
    const cache = await caches.open(GAMING_ASSETS_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Gaming asset fetch failed:', error);
    return new Response('Gaming feature not available offline', { status: 503 });
  }
}

/**
 * Handle navigation requests with offline fallback
 */
async function handleNavigation(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Navigation failed, trying cache');
    
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    return cache.match('/pages/offline.html') ||
           new Response('Offline - Please check your connection', { status: 503 });
  }
}

/**
 * Handle dynamic requests with stale-while-revalidate
 */
async function handleDynamic(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  // Return cached response immediately
  if (cachedResponse) {
    // Update cache in background
    fetch(request).then(networkResponse => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
    }).catch(error => {
      console.log('[SW] Background update failed:', error);
    });
    
    return cachedResponse;
  }
  
  // No cache available, try network
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    return new Response('Content not available offline', { status: 503 });
  }
}

/**
 * Initialize background sync
 */
async function initializeBackgroundSync() {
  try {
    // Register sync events if supported
    if ('sync' in self.registration) {
      console.log('[SW] Background sync initialized');
    }
  } catch (error) {
    console.error('[SW] Background sync initialization failed:', error);
  }
}

/**
 * Sync gaming data in background
 */
async function syncGamingData() {
  try {
    console.log('[SW] Syncing gaming data...');
    
    // Get pending gaming data from IndexedDB
    const pendingData = await getPendingGamingData();
    
    for (const data of pendingData) {
      try {
        const response = await fetch('/api/sync/gaming', {
          method: 'POST',
          body: JSON.stringify(data),
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          await removePendingGamingData(data.id);
          console.log('[SW] Gaming data synced:', data.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync gaming data:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Gaming data sync failed:', error);
  }
}

/**
 * Sync user actions in background
 */
async function syncUserActions() {
  try {
    console.log('[SW] Syncing user actions...');
    
    const pendingActions = await getPendingUserActions();
    
    for (const action of pendingActions) {
      try {
        const response = await fetch('/api/sync/actions', {
          method: 'POST',
          body: JSON.stringify(action),
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          await removePendingUserAction(action.id);
          console.log('[SW] User action synced:', action.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync user action:', error);
      }
    }
  } catch (error) {
    console.error('[SW] User actions sync failed:', error);
  }
}

/**
 * Sync clan updates in background
 */
async function syncClanUpdates() {
  try {
    console.log('[SW] Syncing clan updates...');
    
    const pendingUpdates = await getPendingClanUpdates();
    
    for (const update of pendingUpdates) {
      try {
        const response = await fetch('/api/sync/clans', {
          method: 'POST',
          body: JSON.stringify(update),
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          await removePendingClanUpdate(update.id);
          console.log('[SW] Clan update synced:', update.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync clan update:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Clan updates sync failed:', error);
  }
}

/**
 * Sync voting data in background
 */
async function syncVotingData() {
  try {
    console.log('[SW] Syncing voting data...');
    
    const pendingVotes = await getPendingVotingData();
    
    for (const vote of pendingVotes) {
      try {
        const response = await fetch('/api/sync/voting', {
          method: 'POST',
          body: JSON.stringify(vote),
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          await removePendingVotingData(vote.id);
          console.log('[SW] Voting data synced:', vote.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync voting data:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Voting data sync failed:', error);
  }
}

/**
 * Generate notification actions based on type
 */
function generateNotificationActions(type) {
  const actions = {
    clan: [
      { action: 'view-clan', title: 'View Clan' },
      { action: 'join-activity', title: 'Join Activity' }
    ],
    tournament: [
      { action: 'view-tournament', title: 'View Tournament' },
      { action: 'register', title: 'Register' }
    ],
    voting: [
      { action: 'view-proposal', title: 'View Proposal' },
      { action: 'vote-now', title: 'Vote Now' }
    ],
    default: [
      { action: 'open-app', title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };
  
  return actions[type] || actions.default;
}

/**
 * Determine navigation URL based on notification action
 */
function determineNavigationUrl(action, data) {
  const urls = {
    'view-clan': '/pages/clans.html',
    'join-activity': '/pages/clans.html',
    'view-tournament': '/pages/content.html',
    'register': '/pages/content.html',
    'view-proposal': '/pages/dao.html',
    'vote-now': '/pages/voting.html',
    'open-app': '/pages/index.html'
  };
  
  let baseUrl = urls[action] || '/pages/index.html';
  
  // Add data parameters if available
  if (data && data.id) {
    baseUrl += `?id=${data.id}`;
  }
  
  return baseUrl;
}

/**
 * Cache gaming data for offline use
 */
async function cacheGamingData(data) {
  try {
    const cache = await caches.open(GAMING_ASSETS_CACHE);
    const response = new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
    
    await cache.put(`/cache/gaming-data/${data.id}`, response);
    console.log('[SW] Gaming data cached:', data.id);
  } catch (error) {
    console.error('[SW] Failed to cache gaming data:', error);
  }
}

/**
 * Request background sync
 */
async function requestBackgroundSync(tag) {
  try {
    if ('sync' in self.registration) {
      await self.registration.sync.register(tag);
      console.log('[SW] Background sync requested:', tag);
    }
  } catch (error) {
    console.error('[SW] Failed to request background sync:', error);
  }
}

/**
 * Clear specific cache
 */
async function clearSpecificCache(cacheType) {
  try {
    const cacheNames = {
      static: STATIC_CACHE,
      dynamic: DYNAMIC_CACHE,
      api: API_CACHE,
      gaming: GAMING_ASSETS_CACHE
    };
    
    const cacheName = cacheNames[cacheType];
    if (cacheName) {
      await caches.delete(cacheName);
      console.log('[SW] Cache cleared:', cacheName);
    }
  } catch (error) {
    console.error('[SW] Failed to clear cache:', error);
  }
}

// === IndexedDB Helper Functions ===

/**
 * Get pending gaming data from IndexedDB
 */
async function getPendingGamingData() {
  // This would connect to IndexedDB to retrieve pending data
  // For now, return empty array as placeholder
  return [];
}

/**
 * Remove pending gaming data from IndexedDB
 */
async function removePendingGamingData(id) {
  // This would remove the item from IndexedDB
  console.log('[SW] Would remove pending gaming data:', id);
}

/**
 * Get pending user actions from IndexedDB
 */
async function getPendingUserActions() {
  return [];
}

/**
 * Remove pending user action from IndexedDB
 */
async function removePendingUserAction(id) {
  console.log('[SW] Would remove pending user action:', id);
}

/**
 * Get pending clan updates from IndexedDB
 */
async function getPendingClanUpdates() {
  return [];
}

/**
 * Remove pending clan update from IndexedDB
 */
async function removePendingClanUpdate(id) {
  console.log('[SW] Would remove pending clan update:', id);
}

/**
 * Get pending voting data from IndexedDB
 */
async function getPendingVotingData() {
  return [];
}

/**
 * Remove pending voting data from IndexedDB
 */
async function removePendingVotingData(id) {
  console.log('[SW] Would remove pending voting data:', id);
}

console.log('[SW] MLG.clan Service Worker loaded successfully');
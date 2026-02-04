// Service Worker for SchemeAssist AI
const CACHE_NAME = 'schemeassist-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Files to cache for offline functionality
const CACHE_FILES = [
    '/',
    '/index.html',
    '/login.html',
    '/profile.html',
    '/style.css',
    '/js/main.js',
    '/js/auth.js',
    '/js/ui.js',
    '/js/config.js',
    '/js/validation.js',
    '/js/api.js',
    '/js/sanitizer.js',
    '/manifest.json',
    '/assets/civora_logo.png',
    // External resources
    'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
    /\/api\/health/,
    /\/api\/statistics/
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching app shell and static assets...');
                return cache.addAll(CACHE_FILES);
            })
            .then(() => {
                console.log('[SW] All resources cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Failed to cache resources:', error);
            })
    );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Service Worker activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Handle navigation requests
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .catch(() => {
                    return caches.open(CACHE_NAME)
                        .then((cache) => {
                            return cache.match('/index.html');
                        });
                })
        );
        return;
    }
    
    // Handle API requests
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            handleApiRequest(request)
        );
        return;
    }
    
    // Handle static assets
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                return fetch(request)
                    .then((response) => {
                        // Cache successful responses
                        if (response.status === 200) {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(request, responseClone);
                                });
                        }
                        return response;
                    })
                                        .catch(() => {
                                            // Return fallback for failed requests
                                            if (request.destination === 'image') {
                                                return new Response(
                                                    '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#f0f0f0"/><text x="50" y="50" text-anchor="middle" dy=".3em" font-family="Arial" font-size="12" fill="#999">Offline</text></svg>',
                                                    { headers: { 'Content-Type': 'image/svg+xml' } }
                                                );
                                            }
                                            
                                            return caches.match('/offline.html') || 
                                                   new Response('Offline - Please check your internet connection', {
                                                       status: 503,
                                                       headers: { 'Content-Type': 'text/plain' }
                                                   });
                                        });
                                })
                        );
                    });
                    
                    // Handle API requests with caching strategy
                    function handleApiRequest(request) {
                        const url = new URL(request.url);
                        
                        // Cache safe GET requests
                        if (request.method === 'GET' && shouldCacheApi(url.pathname)) {
                            return caches.open(CACHE_NAME)
                                .then((cache) => {
                                    return cache.match(request)
                                        .then((cachedResponse) => {
                                            const networkFetch = fetch(request)
                                                .then((response) => {
                                                    if (response.status === 200) {
                                                        cache.put(request, response.clone());
                                                    }
                                                    return response;
                                                });
                                            
                                            // Return cached version immediately, update in background
                                            return cachedResponse || networkFetch;
                                        });
                                });
                        }
                        
                        // For POST/PUT requests, try network first
                        return fetch(request)
                            .catch(() => {
                                // Return error response when offline
                                return new Response(
                                    JSON.stringify({
                                        success: false,
                                        error: 'You are offline. Please check your internet connection.',
                                        offline: true
                                    }),
                                    {
                                        status: 503,
                                        headers: { 'Content-Type': 'application/json' }
                                    }
                                );
                            });
                    }
                    
                    // Check if API endpoint should be cached
                    function shouldCacheApi(pathname) {
                        return API_CACHE_PATTERNS.some(pattern => pattern.test(pathname));
                    }
                    
                    // Background sync for offline actions
                    self.addEventListener('sync', (event) => {
                        console.log('[SW] Background sync triggered:', event.tag);
                        
                        if (event.tag === 'background-sync-schemes') {
                            event.waitUntil(
                                syncOfflineActions()
                            );
                        }
                    });
                    
                    // Sync offline actions when back online
                    function syncOfflineActions() {
                        return new Promise((resolve, reject) => {
                            // Get offline actions from IndexedDB and sync
                            // This would integrate with your offline storage
                            console.log('[SW] Syncing offline actions...');
                            resolve();
                        });
                    }
                    
                    // Push notification handling
                    self.addEventListener('push', (event) => {
                        console.log('[SW] Push notification received');
                        
                        const options = {
                            body: 'You have new scheme recommendations available!',
                            icon: '/assets/icon-192x192.png',
                            badge: '/assets/icon-96x96.png',
                            tag: 'scheme-update',
                            requireInteraction: true,
                            actions: [
                                {
                                    action: 'view',
                                    title: 'View Schemes',
                                    icon: '/assets/icon-96x96.png'
                                },
                                {
                                    action: 'dismiss',
                                    title: 'Dismiss'
                                }
                            ],
                            data: {
                                url: '/#recommend',
                                timestamp: Date.now()
                            }
                        };
                        
                        if (event.data) {
                            try {
                                const payload = event.data.json();
                                options.body = payload.body || options.body;
                                options.data = { ...options.data, ...payload.data };
                            } catch (e) {
                                console.log('[SW] Error parsing push data:', e);
                            }
                        }
                        
                        event.waitUntil(
                            self.registration.showNotification('SchemeAssist AI', options)
                        );
                    });
                    
                    // Handle notification clicks
                    self.addEventListener('notificationclick', (event) => {
                        console.log('[SW] Notification clicked:', event.action);
                        
                        event.notification.close();
                        
                        if (event.action === 'view' || !event.action) {
                            const urlToOpen = event.notification.data?.url || '/';
                            
                            event.waitUntil(
                                clients.matchAll({ type: 'window' })
                                    .then((clientList) => {
                                        // Focus existing window if available
                                        for (const client of clientList) {
                                            if (client.url.includes(urlToOpen) && 'focus' in client) {
                                                return client.focus();
                                            }
                                        }
                                        
                                        // Open new window
                                        if (clients.openWindow) {
                                            return clients.openWindow(urlToOpen);
                                        }
                                    })
                            );
                        }
                    });
                    
                    // Message handling from main thread
                    self.addEventListener('message', (event) => {
                        console.log('[SW] Message received:', event.data);
                        
                        if (event.data?.type === 'SKIP_WAITING') {
                            self.skipWaiting();
                        }
                        
                        if (event.data?.type === 'CACHE_UPDATE') {
                            event.waitUntil(
                                caches.open(CACHE_NAME)
                                    .then((cache) => {
                                        return cache.addAll(event.data.urls);
                                    })
                            );
                        }
                    });
                    
                    // Error handling
                    self.addEventListener('error', (event) => {
                        console.error('[SW] Service Worker error:', event.error);
                    });
                    
                    self.addEventListener('unhandledrejection', (event) => {
                        console.error('[SW] Unhandled promise rejection:', event.reason);
                    });
                    
                    console.log('[SW] Service Worker script loaded successfully');
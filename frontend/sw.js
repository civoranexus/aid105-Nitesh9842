// Service Worker for SchemeAssist AI
const CACHE_NAME = 'schemeassist-v1.1.0';
const OFFLINE_URL = '/offline.html';

// Files to cache for offline functionality
const CACHE_FILES = [
    '/',
    '/index.html',
    '/offline.html',
    '/login.html',
    '/profile.html',
    '/style.css',
    '/script.js',
    '/js/main.js',
    '/js/ui-enhanced.js',
    '/js/validation-enhanced.js',
    '/js/error-boundary.js',
    '/js/lazy-loader.js',
    '/js/app-enhanced.js',
    '/js/performance-monitor.js',
    '/manifest.json',
    '/assets/civora_logo.png'
];

// External resources to cache
const EXTERNAL_CACHE = [
    'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// API endpoints to cache (GET only)
const API_CACHE_PATTERNS = [
    /\/api\/health/,
    /\/api\/statistics/
];

// Install event - pre-cache resources
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching app shell and static assets...');
                // Cache local files first (critical)
                return cache.addAll(CACHE_FILES)
                    .then(() => {
                        // Try to cache external resources (non-critical)
                        return Promise.allSettled(
                            EXTERNAL_CACHE.map((url) =>
                                cache.add(url).catch((err) => {
                                    console.warn('[SW] Failed to cache external:', url, err);
                                })
                            )
                        );
                    });
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

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Handle navigation requests (HTML pages)
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cache the latest version of navigated pages
                    if (response.status === 200) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    }
                    return response;
                })
                .catch(() => {
                    // Network failed — try cache, then offline page
                    return caches.match(request)
                        .then((cached) => {
                            return cached || caches.match(OFFLINE_URL);
                        });
                })
        );
        return;
    }

    // Handle API requests
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(handleApiRequest(request));
        return;
    }

    // Handle static assets — cache-first strategy
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Return cached, but update in background
                    fetch(request).then((response) => {
                        if (response && response.status === 200) {
                            caches.open(CACHE_NAME).then((cache) => cache.put(request, response));
                        }
                    }).catch(() => { /* ignore background update failure */ });
                    return cachedResponse;
                }

                // Not in cache — fetch from network
                return fetch(request)
                    .then((response) => {
                        if (response && response.status === 200) {
                            const clone = response.clone();
                            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                        }
                        return response;
                    })
                    .catch(() => {
                        // Return SVG placeholder for failed images
                        if (request.destination === 'image') {
                            return new Response(
                                '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#f0f0f0"/><text x="50" y="50" text-anchor="middle" dy=".3em" font-family="Arial" font-size="12" fill="#999">Offline</text></svg>',
                                { headers: { 'Content-Type': 'image/svg+xml' } }
                            );
                        }
                        return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
                    });
            })
    );
});

// Handle API requests — network-first with cache fallback for GET
function handleApiRequest(request) {
    const url = new URL(request.url);

    if (request.method === 'GET' && shouldCacheApi(url.pathname)) {
        // Stale-while-revalidate for cacheable APIs
        return caches.open(CACHE_NAME).then((cache) => {
            return fetch(request)
                .then((response) => {
                    if (response.status === 200) {
                        cache.put(request, response.clone());
                    }
                    return response;
                })
                .catch(() => {
                    return cache.match(request).then((cached) => {
                        return cached || offlineApiResponse();
                    });
                });
        });
    }

    // Non-cacheable or mutating requests — network only
    return fetch(request).catch(() => offlineApiResponse());
}

// Check if API endpoint should be cached
function shouldCacheApi(pathname) {
    return API_CACHE_PATTERNS.some((pattern) => pattern.test(pathname));
}

// Standard offline API response
function offlineApiResponse() {
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
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync triggered:', event.tag);

    if (event.tag === 'background-sync-schemes') {
        event.waitUntil(syncOfflineActions());
    }
});

function syncOfflineActions() {
    return new Promise((resolve) => {
        console.log('[SW] Syncing offline actions...');
        resolve();
    });
}

// Push notification handling
self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received');

    const options = {
        body: 'You have new scheme recommendations available!',
        icon: '/assets/civora_logo.png',
        badge: '/assets/civora_logo.png',
        tag: 'scheme-update',
        requireInteraction: true,
        actions: [
            { action: 'view', title: 'View Schemes' },
            { action: 'dismiss', title: 'Dismiss' }
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
            clients.matchAll({ type: 'window' }).then((clientList) => {
                for (const client of clientList) {
                    if (client.url.includes(urlToOpen) && 'focus' in client) {
                        return client.focus();
                    }
                }
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
            caches.open(CACHE_NAME).then((cache) => cache.addAll(event.data.urls))
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

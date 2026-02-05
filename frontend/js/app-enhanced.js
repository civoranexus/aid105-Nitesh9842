/**
 * Enhanced main.js with error handling and lazy loading
 * This file adds error boundaries and lazy loading capabilities to the app
 */

// Import error boundary and lazy loader before anything else
import errorBoundary from './error-boundary.js';
import lazyLoadManager from './lazy-loader.js';

// Wrap all imports with error handling
let CONFIG, RateLimiter, sanitizeInput, sanitizeObject, login, logout, checkAuth, getProfile;
let makeRequest, themeManager, toastManager, skeletonLoader, lazyLoader;
let FormValidator, SubmitButtonHandler;

/**
 * Lazy load modules as needed
 */
async function loadCoreModules() {
    try {
        const [configModule, sanitizerModule, authModule, apiModule, uiModule, validationModule] = await Promise.all([
            lazyLoadManager.loadModule('./config.js'),
            lazyLoadManager.loadModule('./sanitizer.js'),
            lazyLoadManager.loadModule('./auth.js'),
            lazyLoadManager.loadModule('./api.js'),
            lazyLoadManager.loadModule('./ui-enhanced.js'),
            lazyLoadManager.loadModule('./validation-enhanced.js')
        ]);

        CONFIG = configModule.CONFIG;
        RateLimiter = configModule.RateLimiter;
        sanitizeInput = sanitizerModule.sanitizeInput;
        sanitizeObject = sanitizerModule.sanitizeObject;
        login = authModule.login;
        logout = authModule.logout;
        checkAuth = authModule.checkAuth;
        getProfile = authModule.getProfile;
        makeRequest = apiModule.makeRequest;
        themeManager = uiModule.themeManager;
        toastManager = uiModule.toastManager;
        skeletonLoader = uiModule.skeletonLoader;
        lazyLoader = uiModule.lazyLoader;
        FormValidator = validationModule.FormValidator;
        SubmitButtonHandler = validationModule.SubmitButtonHandler;

        return true;
    } catch (error) {
        console.error('Failed to load core modules:', error);
        errorBoundary.handleError({
            type: 'module_load_error',
            message: 'Failed to load required modules',
            error: error,
            timestamp: new Date().toISOString()
        });
        return false;
    }
}

/**
 * Setup lazy loading for images
 */
function setupLazyLoading() {
    // Observe all images with data-src
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => {
        if (lazyLoadManager.imageObserver) {
            lazyLoadManager.imageObserver.observe(img);
        }
    });

    // Setup lazy loading for non-critical assets
    if ('loading' in HTMLImageElement.prototype) {
        // Browser supports native lazy loading
        document.querySelectorAll('img:not([loading])').forEach(img => {
            img.loading = 'lazy';
        });
    }
}

/**
 * Enhance existing SchemeAssistApp with lazy loading
 */
export function enhanceApp() {
    // Setup lazy loading immediately
    setupLazyLoading();

    // Prefetch modules that might be needed
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
            // Preload non-critical modules
            lazyLoadManager.preloadModule('./config.js');
            lazyLoadManager.preloadModule('./sanitizer.js');
        });
    }

    // Setup image lazy loading observer
    if (lazyLoadManager.imageObserver) {
        // Re-observe images when DOM changes
        const observer = new MutationObserver(() => {
            setupLazyLoading();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

/**
 * Initialize the application with error handling
 */
async function initializeApp() {
    try {
        console.log('🚀 Loading SchemeAssist AI...');

        // Load core modules first
        const modulesLoaded = await loadCoreModules();
        if (!modulesLoaded) {
            throw new Error('Failed to load required modules');
        }

        // Setup lazy loading
        enhanceApp();

        // Check if main app is already initialized
        if (window.app) {
            console.log('✅ App already initialized');
            return;
        }

        // The main SchemeAssistApp is loaded from main.js
        console.log('✅ Core modules loaded, app ready');

    } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        
        // Show user-friendly error
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
                <div style="text-align: center; max-width: 500px; padding: 2rem;">
                    <h1 style="color: #e53e3e;">⚠️ Application Error</h1>
                    <p style="color: #4a5568; margin: 1rem 0;">
                        We're having trouble loading the application. Please try refreshing the page.
                    </p>
                    <button onclick="location.reload()" style="
                        background: #16808D; 
                        color: white; 
                        border: none; 
                        padding: 0.75rem 1.5rem; 
                        border-radius: 0.5rem; 
                        cursor: pointer; 
                        font-size: 1rem;
                    ">
                        Refresh Page
                    </button>
                </div>
            </div>
        `;
    }
}

// Export for testing
export { initializeApp, loadCoreModules, setupLazyLoading };

// Auto-initialize when this module is imported
// This ensures error boundary and lazy loading are active
console.log('🔧 Enhanced app features loaded');

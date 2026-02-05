/**
 * Lazy Loading System for SchemeAssist AI
 * Implements code splitting and lazy loading for better performance
 */

class LazyLoadManager {
    constructor() {
        this.loadedModules = new Map();
        this.loadingModules = new Map();
        this.observers = new Map();
        this.setupImageLazyLoading();
    }

    /**
     * Lazily load a JavaScript module
     * @param {string} modulePath - Path to the module
     * @param {Object} options - Loading options
     * @returns {Promise} Module exports
     */
    async loadModule(modulePath, options = {}) {
        const {
            cache = true,
            retries = 3,
            timeout = 10000
        } = options;

        // Return from cache if available
        if (cache && this.loadedModules.has(modulePath)) {
            return this.loadedModules.get(modulePath);
        }

        // Return existing loading promise if module is being loaded
        if (this.loadingModules.has(modulePath)) {
            return this.loadingModules.get(modulePath);
        }

        // Create loading promise
        const loadPromise = this._loadModuleWithRetry(modulePath, retries, timeout);
        this.loadingModules.set(modulePath, loadPromise);

        try {
            const module = await loadPromise;
            
            if (cache) {
                this.loadedModules.set(modulePath, module);
            }
            
            this.loadingModules.delete(modulePath);
            return module;
        } catch (error) {
            this.loadingModules.delete(modulePath);
            throw error;
        }
    }

    /**
     * Load module with retry logic
     */
    async _loadModuleWithRetry(modulePath, retries, timeout) {
        let lastError;

        for (let i = 0; i <= retries; i++) {
            try {
                return await this._loadModuleWithTimeout(modulePath, timeout);
            } catch (error) {
                lastError = error;
                
                if (i < retries) {
                    // Wait before retry (exponential backoff)
                    await this._sleep(Math.pow(2, i) * 1000);
                }
            }
        }

        throw lastError;
    }

    /**
     * Load module with timeout
     */
    async _loadModuleWithTimeout(modulePath, timeout) {
        return Promise.race([
            import(modulePath),
            new Promise((_, reject) => {
                setTimeout(() => reject(new Error(`Module load timeout: ${modulePath}`)), timeout);
            })
        ]);
    }

    /**
     * Preload a module without executing it
     */
    preloadModule(modulePath) {
        if (this.loadedModules.has(modulePath) || this.loadingModules.has(modulePath)) {
            return Promise.resolve();
        }

        const link = document.createElement('link');
        link.rel = 'modulepreload';
        link.href = modulePath;
        document.head.appendChild(link);

        return new Promise((resolve, reject) => {
            link.onload = resolve;
            link.onerror = reject;
        });
    }

    /**
     * Setup lazy loading for images
     */
    setupImageLazyLoading() {
        // Use Intersection Observer for lazy loading images
        if ('IntersectionObserver' in window) {
            this.imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadImage(entry.target);
                        this.imageObserver.unobserve(entry.target);
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.01
            });

            // Observe all images with data-src attribute
            this.observeImages();
        } else {
            // Fallback for browsers without Intersection Observer
            this.loadAllImages();
        }
    }

    /**
     * Observe images for lazy loading
     */
    observeImages() {
        const images = document.querySelectorAll('img[data-src], img[data-srcset]');
        images.forEach(img => {
            this.imageObserver.observe(img);
        });
    }

    /**
     * Load a single image
     */
    loadImage(img) {
        const src = img.getAttribute('data-src');
        const srcset = img.getAttribute('data-srcset');

        if (src) {
            img.src = src;
            img.removeAttribute('data-src');
        }

        if (srcset) {
            img.srcset = srcset;
            img.removeAttribute('data-srcset');
        }

        img.classList.add('loaded');
    }

    /**
     * Load all images immediately (fallback)
     */
    loadAllImages() {
        const images = document.querySelectorAll('img[data-src], img[data-srcset]');
        images.forEach(img => this.loadImage(img));
    }

    /**
     * Setup lazy loading for a section
     */
    setupSectionLazyLoad(sectionId, moduleMap) {
        const section = document.getElementById(sectionId);
        if (!section) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(async (entry) => {
                if (entry.isIntersecting && moduleMap[sectionId]) {
                    try {
                        await this.loadModule(moduleMap[sectionId]);
                        observer.unobserve(entry.target);
                    } catch (error) {
                        console.error(`Failed to load module for ${sectionId}:`, error);
                    }
                }
            });
        }, {
            rootMargin: '100px 0px',
            threshold: 0.01
        });

        observer.observe(section);
        this.observers.set(sectionId, observer);
    }

    /**
     * Load component on demand
     */
    async loadComponent(componentName, containerSelector) {
        const container = document.querySelector(containerSelector);
        if (!container) {
            throw new Error(`Container not found: ${containerSelector}`);
        }

        // Show loading state
        container.innerHTML = '<div class="loading-spinner"></div>';

        try {
            const module = await this.loadModule(`./components/${componentName}.js`);
            
            if (module.default) {
                return module.default(container);
            }
            
            return module;
        } catch (error) {
            container.innerHTML = '<div class="error-message">Failed to load component</div>';
            throw error;
        }
    }

    /**
     * Lazy load CSS file
     */
    async loadCSS(href) {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (document.querySelector(`link[href="${href}"]`)) {
                resolve();
                return;
            }

            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            
            link.onload = resolve;
            link.onerror = reject;
            
            document.head.appendChild(link);
        });
    }

    /**
     * Prefetch resources for faster loading
     */
    prefetch(url, type = 'fetch') {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.as = type;
        link.href = url;
        document.head.appendChild(link);
    }

    /**
     * Preconnect to external domains
     */
    preconnect(url) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = url;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
    }

    /**
     * Utility: Sleep function
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get loading statistics
     */
    getStats() {
        return {
            loadedModules: this.loadedModules.size,
            loadingModules: this.loadingModules.size,
            modules: Array.from(this.loadedModules.keys())
        };
    }

    /**
     * Clear module cache
     */
    clearCache() {
        this.loadedModules.clear();
    }

    /**
     * Cleanup observers
     */
    cleanup() {
        if (this.imageObserver) {
            this.imageObserver.disconnect();
        }

        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
    }
}

// Create global instance
const lazyLoadManager = new LazyLoadManager();

// Export for use in modules
export default lazyLoadManager;

// Also make available globally
window.lazyLoadManager = lazyLoadManager;

// Auto-observe new images when DOM changes
if ('MutationObserver' in window) {
    const mutationObserver = new MutationObserver(() => {
        lazyLoadManager.observeImages();
    });

    mutationObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
}

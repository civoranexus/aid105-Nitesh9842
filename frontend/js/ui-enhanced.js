// Enhanced UI utilities with dark mode and improved UX

/**
 * Theme Management
 */
class ThemeManager {
    constructor() {
        this.themes = {
            LIGHT: 'light',
            DARK: 'dark',
            AUTO: 'auto'
        };
        
        this.currentTheme = this.getStoredTheme() || this.themes.AUTO;
        this.applyTheme();
        this.initThemeToggle();
        this.watchSystemTheme();
    }
    
    getStoredTheme() {
        return localStorage.getItem('theme');
    }
    
    setStoredTheme(theme) {
        localStorage.setItem('theme', theme);
    }
    
    getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? this.themes.DARK : this.themes.LIGHT;
    }
    
    applyTheme() {
        const themeToApply = this.currentTheme === this.themes.AUTO ? this.getSystemTheme() : this.currentTheme;
        
        document.documentElement.setAttribute('data-theme', themeToApply);
        
        // Update meta theme-color for mobile browsers
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.content = themeToApply === this.themes.DARK ? '#1a1a1a' : '#16808D';
        }
        
        this.updateToggleIcon(themeToApply);
    }
    
    updateToggleIcon(theme) {
        const toggle = document.getElementById('themeToggle');
        if (!toggle) return;
        
        const isDark = theme === this.themes.DARK;
        toggle.classList.toggle('dark-mode', isDark);
        toggle.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} mode`);
        toggle.title = `Switch to ${isDark ? 'light' : 'dark'} mode`;
    }
    
    toggleTheme() {
        if (this.currentTheme === this.themes.AUTO) {
            // If auto, switch to opposite of current system theme
            this.currentTheme = this.getSystemTheme() === this.themes.DARK ? this.themes.LIGHT : this.themes.DARK;
        } else {
            // Toggle between light and dark
            this.currentTheme = this.currentTheme === this.themes.DARK ? this.themes.LIGHT : this.themes.DARK;
        }
        
        this.setStoredTheme(this.currentTheme);
        this.applyTheme();
        
        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: this.currentTheme }
        }));
    }
    
    initThemeToggle() {
        const toggle = document.getElementById('themeToggle');
        if (!toggle) {
            console.warn('Theme toggle button not found');
            return;
        }
        
        toggle.addEventListener('click', () => {
            this.toggleTheme();
            
            // Add animation
            toggle.style.transform = 'translateY(-50%) scale(0.8)';
            setTimeout(() => {
                toggle.style.transform = 'translateY(-50%) scale(1)';
            }, 150);
        });
        
        // Keyboard support
        toggle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggleTheme();
            }
        });
        
        console.log('Theme toggle initialized');
    }
    
    watchSystemTheme() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addListener(() => {
            if (this.currentTheme === this.themes.AUTO) {
                this.applyTheme();
            }
        });
    }
}

/**
 * Enhanced Toast Notifications
 */
class ToastManager {
    constructor() {
        this.container = this.createContainer();
        this.toasts = new Map();
    }
    
    createContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            container.setAttribute('aria-live', 'polite');
            container.setAttribute('aria-atomic', 'false');
            document.body.appendChild(container);
        }
        return container;
    }
    
    show(message, type = 'info', duration = 4000, actions = []) {
        const id = Date.now() + Math.random();
        const toast = this.createToast(id, message, type, duration, actions);
        
        this.container.appendChild(toast);
        this.toasts.set(id, toast);
        
        // Animate in
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
        
        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                this.hide(id);
            }, duration);
        }
        
        return id;
    }
    
    createToast(id, message, type, duration, actions) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        
        const icon = this.getIcon(type);
        
        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon">
                    <i class="fas fa-${icon}"></i>
                </div>
                <div class="toast-message">${message}</div>
                <div class="toast-actions">
                    ${actions.map(action => `
                        <button class="toast-action" data-action="${action.key}">
                            ${action.label}
                        </button>
                    `).join('')}
                    <button class="toast-close" aria-label="Close notification">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            ${duration > 0 ? `<div class="toast-progress" style="animation-duration: ${duration}ms"></div>` : ''}
        `;
        
        // Add event listeners
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.hide(id));
        
        // Action buttons
        const actionButtons = toast.querySelectorAll('.toast-action');
        actionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = actions.find(a => a.key === e.target.dataset.action);
                if (action && action.handler) {
                    action.handler();
                }
                this.hide(id);
            });
        });
        
        return toast;
    }
    
    getIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle',
            loading: 'spinner fa-spin'
        };
        return icons[type] || icons.info;
    }
    
    hide(id) {
        const toast = this.toasts.get(id);
        if (!toast) return;
        
        toast.classList.add('hide');
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            this.toasts.delete(id);
        }, 300);
    }
    
    clear() {
        this.toasts.forEach((_, id) => this.hide(id));
    }
}

/**
 * Enhanced Skeleton Loader
 */
class SkeletonLoader {
    constructor() {
        this.activeSkeletons = new Set();
    }
    
    show(containerId, type = 'card', count = 3) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        container.classList.remove('hidden');
        container.setAttribute('aria-busy', 'true');
        
        const skeletonHTML = this.generateSkeleton(type, count);
        container.innerHTML = skeletonHTML;
        
        this.activeSkeletons.add(containerId);
        
        // Announce to screen readers
        this.announceLoading(container);
    }
    
    hide(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.classList.add('hidden');
        container.setAttribute('aria-busy', 'false');
        container.innerHTML = '';
        
        this.activeSkeletons.delete(containerId);
    }
    
    generateSkeleton(type, count) {
        const templates = {
            card: this.cardTemplate,
            list: this.listTemplate,
            profile: this.profileTemplate,
            stats: this.statsTemplate
        };
        
        const template = templates[type] || templates.card;
        return Array.from({ length: count }, () => template()).join('');
    }
    
    cardTemplate() {
        return `
            <div class="skeleton-card">
                <div class="skeleton-header"></div>
                <div class="skeleton-line"></div>
                <div class="skeleton-line short"></div>
                <div class="skeleton-line medium"></div>
                <div class="skeleton-actions">
                    <div class="skeleton-button"></div>
                    <div class="skeleton-button small"></div>
                </div>
            </div>
        `;
    }
    
    listTemplate() {
        return `
            <div class="skeleton-list-item">
                <div class="skeleton-avatar"></div>
                <div class="skeleton-content">
                    <div class="skeleton-line medium"></div>
                    <div class="skeleton-line short"></div>
                </div>
            </div>
        `;
    }
    
    profileTemplate() {
        return `
            <div class="skeleton-profile">
                <div class="skeleton-avatar large"></div>
                <div class="skeleton-profile-info">
                    <div class="skeleton-line large"></div>
                    <div class="skeleton-line medium"></div>
                    <div class="skeleton-line short"></div>
                </div>
            </div>
        `;
    }
    
    statsTemplate() {
        return `
            <div class="skeleton-stat">
                <div class="skeleton-stat-number"></div>
                <div class="skeleton-line short"></div>
            </div>
        `;
    }
    
    announceLoading(container) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = 'Loading content, please wait...';
        
        container.appendChild(announcement);
        
        setTimeout(() => {
            if (announcement.parentNode) {
                announcement.parentNode.removeChild(announcement);
            }
        }, 1000);
    }
}

/**
 * Enhanced Lazy Loading
 */
class LazyLoader {
    constructor(options = {}) {
        this.options = {
            rootMargin: '50px',
            threshold: 0.1,
            ...options
        };
        
        this.observer = null;
        this.init();
    }
    
    init() {
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver(
                this.handleIntersection.bind(this),
                this.options
            );
            
            this.observeImages();
            this.observeSections();
        } else {
            // Fallback: load all images immediately
            this.loadAllImages();
        }
    }
    
    observeImages() {
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => {
            this.observer.observe(img);
        });
    }
    
    observeSections() {
        const lazySections = document.querySelectorAll('[data-lazy-load]');
        lazySections.forEach(section => {
            this.observer.observe(section);
        });
    }
    
    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (entry.target.tagName === 'IMG') {
                    this.loadImage(entry.target);
                } else {
                    this.loadSection(entry.target);
                }
                
                this.observer.unobserve(entry.target);
            }
        });
    }
    
    loadImage(img) {
        const src = img.getAttribute('data-src');
        if (!src) return;
        
        img.addEventListener('load', () => {
            img.classList.add('loaded');
            img.removeAttribute('data-src');
        });
        
        img.addEventListener('error', () => {
            img.classList.add('error');
            img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23f0f0f0"/><text x="50" y="50" text-anchor="middle" dy=".3em" font-family="Arial" font-size="12" fill="%23999">Error</text></svg>';
        });
        
        img.src = src;
    }
    
    loadSection(section) {
        const loadHandler = section.getAttribute('data-lazy-load');
        if (loadHandler && window[loadHandler]) {
            window[loadHandler](section);
        }
        
        section.removeAttribute('data-lazy-load');
        section.classList.add('lazy-loaded');
    }
    
    loadAllImages() {
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => {
            this.loadImage(img);
        });
    }
    
    observe(element) {
        if (this.observer) {
            this.observer.observe(element);
        }
    }
    
    unobserve(element) {
        if (this.observer) {
            this.observer.unobserve(element);
        }
    }
}

// Initialize managers
const themeManager = new ThemeManager();
const toastManager = new ToastManager();
const skeletonLoader = new SkeletonLoader();
const lazyLoader = new LazyLoader();

// Export for use in other modules
export {
    ThemeManager,
    ToastManager,
    SkeletonLoader,
    LazyLoader,
    themeManager,
    toastManager,
    skeletonLoader,
    lazyLoader
};

// Legacy global functions for backward compatibility
window.showToast = (message, type, duration) => {
    return toastManager.show(message, type, duration);
};

window.showSkeleton = (containerId, type, count) => {
    return skeletonLoader.show(containerId, type, count);
};

window.hideSkeleton = (containerId) => {
    return skeletonLoader.hide(containerId);
};

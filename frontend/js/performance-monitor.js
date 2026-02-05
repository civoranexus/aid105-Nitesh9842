/**
 * Performance Monitor for SchemeAssist AI
 * Tracks loading times, errors, and user interactions
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            pageLoad: {},
            resources: [],
            errors: [],
            interactions: []
        };
        
        this.setupPerformanceObserver();
        this.capturePageLoadMetrics();
    }

    /**
     * Setup Performance Observer for resource timing
     */
    setupPerformanceObserver() {
        if ('PerformanceObserver' in window) {
            try {
                // Observe resource loading
                const resourceObserver = new PerformanceObserver((list) => {
                    list.getEntries().forEach(entry => {
                        this.metrics.resources.push({
                            name: entry.name,
                            type: entry.initiatorType,
                            duration: entry.duration,
                            size: entry.transferSize || 0,
                            timestamp: entry.startTime
                        });
                    });
                });

                resourceObserver.observe({ entryTypes: ['resource'] });

                // Observe navigation timing
                const navigationObserver = new PerformanceObserver((list) => {
                    list.getEntries().forEach(entry => {
                        this.metrics.pageLoad = {
                            domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
                            loadComplete: entry.loadEventEnd - entry.loadEventStart,
                            domInteractive: entry.domInteractive - entry.fetchStart,
                            requestStart: entry.requestStart - entry.fetchStart,
                            responseEnd: entry.responseEnd - entry.fetchStart
                        };
                    });
                });

                navigationObserver.observe({ entryTypes: ['navigation'] });
            } catch (error) {
                console.warn('Performance Observer not fully supported:', error);
            }
        }
    }

    /**
     * Capture page load metrics
     */
    capturePageLoadMetrics() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                if (window.performance && window.performance.timing) {
                    const timing = window.performance.timing;
                    
                    this.metrics.pageLoad = {
                        ...this.metrics.pageLoad,
                        dns: timing.domainLookupEnd - timing.domainLookupStart,
                        tcp: timing.connectEnd - timing.connectStart,
                        request: timing.responseStart - timing.requestStart,
                        response: timing.responseEnd - timing.responseStart,
                        dom: timing.domComplete - timing.domLoading,
                        total: timing.loadEventEnd - timing.navigationStart
                    };
                }

                // Capture paint timing
                if (window.performance && window.performance.getEntriesByType) {
                    const paintEntries = window.performance.getEntriesByType('paint');
                    paintEntries.forEach(entry => {
                        this.metrics.pageLoad[entry.name] = entry.startTime;
                    });
                }

                console.log('📊 Page Load Metrics:', this.metrics.pageLoad);
            }, 0);
        });
    }

    /**
     * Track custom metric
     */
    trackMetric(name, value, tags = {}) {
        if (!this.metrics.custom) {
            this.metrics.custom = [];
        }

        this.metrics.custom.push({
            name,
            value,
            tags,
            timestamp: Date.now()
        });
    }

    /**
     * Track user interaction
     */
    trackInteraction(action, details = {}) {
        this.metrics.interactions.push({
            action,
            details,
            timestamp: Date.now()
        });
    }

    /**
     * Get performance summary
     */
    getSummary() {
        const resourcesByType = {};
        this.metrics.resources.forEach(resource => {
            if (!resourcesByType[resource.type]) {
                resourcesByType[resource.type] = {
                    count: 0,
                    totalSize: 0,
                    totalDuration: 0
                };
            }
            resourcesByType[resource.type].count++;
            resourcesByType[resource.type].totalSize += resource.size;
            resourcesByType[resource.type].totalDuration += resource.duration;
        });

        return {
            pageLoad: this.metrics.pageLoad,
            resources: {
                total: this.metrics.resources.length,
                byType: resourcesByType
            },
            errors: this.metrics.errors.length,
            interactions: this.metrics.interactions.length
        };
    }

    /**
     * Get Core Web Vitals
     */
    getCoreWebVitals() {
        const vitals = {};

        // Largest Contentful Paint (LCP)
        if (window.performance && window.performance.getEntriesByType) {
            const lcpEntries = window.performance.getEntriesByType('largest-contentful-paint');
            if (lcpEntries.length > 0) {
                vitals.LCP = lcpEntries[lcpEntries.length - 1].startTime;
            }
        }

        // First Input Delay (FID) - approximation
        if (this.metrics.interactions.length > 0) {
            vitals.FID = this.metrics.interactions[0].timestamp;
        }

        // Cumulative Layout Shift (CLS) - requires layout-shift entries
        const layoutShifts = window.performance?.getEntriesByType?.('layout-shift') || [];
        vitals.CLS = layoutShifts.reduce((sum, entry) => sum + entry.value, 0);

        return vitals;
    }

    /**
     * Export metrics as JSON
     */
    exportMetrics() {
        return JSON.stringify({
            summary: this.getSummary(),
            coreWebVitals: this.getCoreWebVitals(),
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        }, null, 2);
    }

    /**
     * Log metrics to console
     */
    logMetrics() {
        console.group('📊 Performance Metrics');
        console.log('Page Load:', this.metrics.pageLoad);
        console.log('Resources:', this.getSummary().resources);
        console.log('Core Web Vitals:', this.getCoreWebVitals());
        console.groupEnd();
    }

    /**
     * Send metrics to analytics endpoint
     */
    async sendToAnalytics() {
        try {
            await fetch('/api/analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: this.exportMetrics()
            });
        } catch (error) {
            console.warn('Failed to send analytics:', error);
        }
    }
}

// Create global instance
const performanceMonitor = new PerformanceMonitor();

// Export for use in modules
export default performanceMonitor;

// Make available globally
window.performanceMonitor = performanceMonitor;

// Log metrics after page load (dev only)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.addEventListener('load', () => {
        setTimeout(() => {
            performanceMonitor.logMetrics();
        }, 3000);
    });
}

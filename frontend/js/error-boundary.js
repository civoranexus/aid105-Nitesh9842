/**
 * Error Boundary System for SchemeAssist AI
 * Provides comprehensive error handling for the frontend application
 */

class ErrorBoundary {
    constructor() {
        this.errors = [];
        this.maxErrors = 50;
        this.setupGlobalHandlers();
        this.setupNetworkErrorHandling();
        this.setupUnhandledRejectionHandler();
    }

    /**
     * Setup global error handlers
     */
    setupGlobalHandlers() {
        // Handle uncaught JavaScript errors
        window.addEventListener('error', (event) => {
            this.handleError({
                type: 'script_error',
                message: event.message,
                source: event.filename,
                line: event.lineno,
                column: event.colno,
                error: event.error,
                timestamp: new Date().toISOString()
            });
            
            // Prevent default error display in console
            event.preventDefault();
        });

        // Handle errors in event handlers
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: 'unhandled_promise_rejection',
                message: event.reason?.message || 'Unhandled promise rejection',
                error: event.reason,
                timestamp: new Date().toISOString()
            });
            
            event.preventDefault();
        });
    }

    /**
     * Setup network error handling
     */
    setupNetworkErrorHandling() {
        // Intercept fetch errors
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args);
                
                // Log failed HTTP requests
                if (!response.ok) {
                    this.handleError({
                        type: 'network_error',
                        message: `HTTP ${response.status}: ${response.statusText}`,
                        url: args[0],
                        status: response.status,
                        timestamp: new Date().toISOString()
                    });
                }
                
                return response;
            } catch (error) {
                this.handleError({
                    type: 'network_error',
                    message: `Network request failed: ${error.message}`,
                    url: args[0],
                    error: error,
                    timestamp: new Date().toISOString()
                });
                throw error;
            }
        };
    }

    /**
     * Setup unhandled promise rejection handler
     */
    setupUnhandledRejectionHandler() {
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            
            this.showErrorMessage({
                title: 'Operation Failed',
                message: 'An unexpected error occurred. Please try again.',
                type: 'error'
            });
        });
    }

    /**
     * Handle and log errors
     */
    handleError(errorInfo) {
        // Log to console in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.error('Error caught by boundary:', errorInfo);
        }

        // Store error
        this.errors.push(errorInfo);
        
        // Limit stored errors
        if (this.errors.length > this.maxErrors) {
            this.errors.shift();
        }

        // Show user-friendly error message
        this.showErrorMessage({
            title: this.getErrorTitle(errorInfo.type),
            message: this.getErrorMessage(errorInfo),
            type: 'error'
        });

        // Send to logging service (if configured)
        this.logToServer(errorInfo);
    }

    /**
     * Get user-friendly error title
     */
    getErrorTitle(type) {
        const titles = {
            'script_error': 'Application Error',
            'network_error': 'Connection Error',
            'unhandled_promise_rejection': 'Operation Failed',
            'api_error': 'Service Error'
        };
        return titles[type] || 'Error';
    }

    /**
     * Get user-friendly error message
     */
    getErrorMessage(errorInfo) {
        if (errorInfo.type === 'network_error') {
            if (!navigator.onLine) {
                return 'You appear to be offline. Please check your internet connection.';
            }
            return 'Unable to connect to the server. Please try again.';
        }

        if (errorInfo.message.includes('fetch')) {
            return 'Failed to load data. Please refresh the page.';
        }

        return 'An unexpected error occurred. Our team has been notified.';
    }

    /**
     * Show error message to user
     */
    showErrorMessage({ title, message, type = 'error' }) {
        // Use toast manager if available
        if (window.toastManager) {
            window.toastManager.show(message, type, 5000);
            return;
        }

        // Fallback to alert
        console.error(`${title}: ${message}`);
    }

    /**
     * Log error to server
     */
    async logToServer(errorInfo) {
        try {
            // Only log in production
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                return;
            }

            await fetch('/api/log-error', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...errorInfo,
                    userAgent: navigator.userAgent,
                    url: window.location.href
                })
            }).catch(() => {
                // Silently fail if logging fails
            });
        } catch (e) {
            // Ignore logging errors
        }
    }

    /**
     * Wrap async function with error handling
     */
    wrapAsync(fn, context = null) {
        return async (...args) => {
            try {
                return await fn.apply(context, args);
            } catch (error) {
                this.handleError({
                    type: 'async_error',
                    message: error.message,
                    error: error,
                    timestamp: new Date().toISOString()
                });
                throw error;
            }
        };
    }

    /**
     * Wrap sync function with error handling
     */
    wrapSync(fn, context = null) {
        return (...args) => {
            try {
                return fn.apply(context, args);
            } catch (error) {
                this.handleError({
                    type: 'sync_error',
                    message: error.message,
                    error: error,
                    timestamp: new Date().toISOString()
                });
                throw error;
            }
        };
    }

    /**
     * Get all logged errors
     */
    getErrors() {
        return [...this.errors];
    }

    /**
     * Clear all logged errors
     */
    clearErrors() {
        this.errors = [];
    }

    /**
     * Get error statistics
     */
    getErrorStats() {
        const stats = {
            total: this.errors.length,
            byType: {}
        };

        this.errors.forEach(error => {
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
        });

        return stats;
    }
}

// Create global error boundary instance
const errorBoundary = new ErrorBoundary();

// Export for use in modules
export default errorBoundary;

// Also make available globally
window.errorBoundary = errorBoundary;

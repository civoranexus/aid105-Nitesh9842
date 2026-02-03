// Configuration Module
export const CONFIG = {
    API_URL: window.location.origin + '/api',
    MAX_REQUESTS_PER_MINUTE: 20,
    DEBOUNCE_DELAY: 300,
    TOAST_DURATION: 4000,
    SCROLL_THRESHOLD: 300,
    LAZY_LOAD_MARGIN: '50px'
};

// Rate limiting state
export const rateLimiter = {
    requests: [],
    isLimited: false
};

// Check if rate limit exceeded
export function checkRateLimit() {
    const now = Date.now();
    // Remove requests older than 1 minute
    rateLimiter.requests = rateLimiter.requests.filter(time => now - time < 60000);
    
    if (rateLimiter.requests.length >= CONFIG.MAX_REQUESTS_PER_MINUTE) {
        rateLimiter.isLimited = true;
        return false;
    }
    
    rateLimiter.requests.push(now);
    rateLimiter.isLimited = false;
    return true;
}

export function getRateLimitStatus() {
    return {
        isLimited: rateLimiter.isLimited,
        remainingRequests: CONFIG.MAX_REQUESTS_PER_MINUTE - rateLimiter.requests.length,
        resetTime: rateLimiter.requests.length > 0 
            ? new Date(rateLimiter.requests[0] + 60000) 
            : new Date()
    };
}

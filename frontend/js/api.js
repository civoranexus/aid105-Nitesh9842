// API Module for scheme operations
import { CONFIG, checkRateLimit } from './config.js';
import { showToast, showSkeleton, hideSkeleton } from './ui.js';
import { sanitizeObject } from './sanitizer.js';

/**
 * Make API request with rate limiting
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Response data
 */
async function apiRequest(endpoint, options = {}) {
    if (!checkRateLimit()) {
        showToast('Too many requests. Please wait a moment.', 'error');
        throw new Error('Rate limit exceeded');
    }
    
    const response = await fetch(`${CONFIG.API_URL}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        ...options
    });
    
    if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
    }
    
    return response.json();
}

/**
 * Get scheme recommendations
 * @param {Object} userProfile - User profile data
 * @returns {Promise<Object>} Recommendations
 */
export async function getRecommendations(userProfile) {
    showSkeleton('results');
    
    try {
        const sanitizedProfile = sanitizeObject(userProfile);
        const data = await apiRequest('/recommend', {
            method: 'POST',
            body: JSON.stringify(sanitizedProfile)
        });
        
        return data;
    } finally {
        hideSkeleton('results');
    }
}

/**
 * Get alerts for user
 * @param {Object} userProfile - User profile data
 * @returns {Promise<Object>} Alerts data
 */
export async function getAlerts(userProfile) {
    const sanitizedProfile = sanitizeObject(userProfile);
    return apiRequest('/alerts', {
        method: 'POST',
        body: JSON.stringify(sanitizedProfile)
    });
}

/**
 * Compare schemes
 * @param {Array<string>} schemeNames - Scheme names to compare
 * @param {Object} userProfile - User profile data
 * @returns {Promise<Object>} Comparison data
 */
export async function compareSchemes(schemeNames, userProfile = {}) {
    const sanitizedProfile = sanitizeObject(userProfile);
    return apiRequest('/compare', {
        method: 'POST',
        body: JSON.stringify({
            scheme_names: schemeNames,
            user_profile: sanitizedProfile
        })
    });
}

/**
 * Search schemes
 * @param {string} query - Search query
 * @param {Object} filters - Search filters
 * @returns {Promise<Object>} Search results
 */
export async function searchSchemes(query, filters = {}) {
    const sanitizedFilters = sanitizeObject(filters);
    return apiRequest('/search', {
        method: 'POST',
        body: JSON.stringify({
            query: query,
            ...sanitizedFilters
        })
    });
}

/**
 * Get scheme statistics
 * @returns {Promise<Object>} Statistics data
 */
export async function getStatistics() {
    return apiRequest('/statistics');
}

/**
 * Get user favorites
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Favorites data
 */
export async function getFavorites(userId = 'default_user') {
    return apiRequest(`/favorites?user_id=${encodeURIComponent(userId)}`);
}

/**
 * Add to favorites
 * @param {string} schemeName - Scheme name
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Response data
 */
export async function addToFavorites(schemeName, userId = 'default_user') {
    return apiRequest(`/favorites?user_id=${encodeURIComponent(userId)}`, {
        method: 'POST',
        body: JSON.stringify({ scheme_name: schemeName })
    });
}

/**
 * Remove from favorites
 * @param {string} schemeName - Scheme name
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Response data
 */
export async function removeFromFavorites(schemeName, userId = 'default_user') {
    return apiRequest(`/favorites?user_id=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
        body: JSON.stringify({ scheme_name: schemeName })
    });
}

/**
 * Get user applications
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Applications data
 */
export async function getApplications(userId = 'default_user') {
    return apiRequest(`/applications?user_id=${encodeURIComponent(userId)}`);
}

/**
 * Add application
 * @param {Object} application - Application data
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Response data
 */
export async function addApplication(application, userId = 'default_user') {
    const sanitizedApp = sanitizeObject(application);
    return apiRequest(`/applications?user_id=${encodeURIComponent(userId)}`, {
        method: 'POST',
        body: JSON.stringify(sanitizedApp)
    });
}

/**
 * Update application
 * @param {Object} application - Application data
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Response data
 */
export async function updateApplication(application, userId = 'default_user') {
    const sanitizedApp = sanitizeObject(application);
    return apiRequest(`/applications?user_id=${encodeURIComponent(userId)}`, {
        method: 'PUT',
        body: JSON.stringify(sanitizedApp)
    });
}

/**
 * Export data
 * @param {Array} schemes - Schemes to export
 * @param {string} format - Export format (csv or json)
 * @returns {Promise<Object>} Export data
 */
export async function exportData(schemes, format = 'json') {
    return apiRequest('/export', {
        method: 'POST',
        body: JSON.stringify({
            schemes: schemes,
            format: format
        })
    });
}

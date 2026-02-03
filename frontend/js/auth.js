// Authentication Module with httpOnly cookie support
import { CONFIG, checkRateLimit } from './config.js';
import { sanitizeInput } from './sanitizer.js';
import { showToast } from './ui.js';

/**
 * Login user with credentials
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<Object>} Response data
 */
export async function login(username, password) {
    if (!checkRateLimit()) {
        throw new Error('Too many requests. Please wait a moment.');
    }
    
    const response = await fetch(`${CONFIG.API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies
        body: JSON.stringify({
            username: sanitizeInput(username),
            password: password // Don't sanitize password
        })
    });
    
    const data = await response.json();
    
    if (data.success) {
        // Store only username in localStorage, token in httpOnly cookie
        localStorage.setItem('username', sanitizeInput(username));
        return data;
    } else {
        throw new Error(data.message || 'Login failed');
    }
}

/**
 * Register new user
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<Object>} Response data
 */
export async function register(username, password) {
    if (!checkRateLimit()) {
        throw new Error('Too many requests. Please wait a moment.');
    }
    
    const response = await fetch(`${CONFIG.API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
            username: sanitizeInput(username),
            password: password
        })
    });
    
    const data = await response.json();
    
    if (!data.success) {
        throw new Error(data.message || 'Registration failed');
    }
    
    return data;
}

/**
 * Logout current user
 * @returns {Promise<void>}
 */
export async function logout() {
    try {
        await fetch(`${CONFIG.API_URL}/logout`, {
            method: 'POST',
            credentials: 'include'
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        localStorage.removeItem('username');
        window.location.href = 'login.html';
    }
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated
 */
export function isAuthenticated() {
    return localStorage.getItem('username') !== null;
}

/**
 * Get current username
 * @returns {string|null} Username or null
 */
export function getCurrentUsername() {
    return localStorage.getItem('username');
}

/**
 * Make authenticated API request
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Response data
 */
export async function authenticatedRequest(endpoint, options = {}) {
    if (!checkRateLimit()) {
        showToast('Too many requests. Please wait a moment.', 'error');
        throw new Error('Rate limit exceeded');
    }
    
    const defaultOptions = {
        credentials: 'include', // Send httpOnly cookie
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...(options.headers || {})
        }
    };
    
    const response = await fetch(`${CONFIG.API_URL}${endpoint}`, mergedOptions);
    
    // Handle unauthorized
    if (response.status === 401) {
        localStorage.removeItem('username');
        window.location.href = 'login.html';
        throw new Error('Unauthorized');
    }
    
    return response.json();
}

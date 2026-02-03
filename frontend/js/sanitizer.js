// Input Sanitization Module

/**
 * Sanitize HTML to prevent XSS attacks
 * @param {string} html - Raw HTML string
 * @returns {string} Sanitized HTML
 */
export function sanitizeHTML(html) {
    const temp = document.createElement('div');
    temp.textContent = html;
    return temp.innerHTML;
}

/**
 * Sanitize user input for display
 * @param {string} input - User input string
 * @returns {string} Sanitized string
 */
export function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize URL to prevent javascript: and data: URLs
 * @param {string} url - URL string
 * @returns {string} Sanitized URL or empty string if invalid
 */
export function sanitizeURL(url) {
    if (!url) return '';
    
    const trimmed = url.trim().toLowerCase();
    if (trimmed.startsWith('javascript:') || 
        trimmed.startsWith('data:') || 
        trimmed.startsWith('vbscript:')) {
        return '';
    }
    
    try {
        const parsed = new URL(url, window.location.origin);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return url;
        }
    } catch (e) {
        return '';
    }
    
    return '';
}

/**
 * Validate and sanitize number input
 * @param {*} value - Input value
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number|null} Sanitized number or null if invalid
 */
export function sanitizeNumber(value, min = -Infinity, max = Infinity) {
    const num = Number(value);
    if (isNaN(num) || !isFinite(num)) return null;
    if (num < min || num > max) return null;
    return num;
}

/**
 * Sanitize object properties recursively
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
export function sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const sanitized = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            if (typeof value === 'string') {
                sanitized[key] = sanitizeInput(value);
            } else if (typeof value === 'object') {
                sanitized[key] = sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        }
    }
    return sanitized;
}

/**
 * Create safe DOM element with sanitized content
 * @param {string} tag - HTML tag name
 * @param {Object} attributes - Element attributes
 * @param {string} textContent - Text content
 * @returns {HTMLElement} Safe DOM element
 */
export function createSafeElement(tag, attributes = {}, textContent = '') {
    const element = document.createElement(tag);
    
    // Sanitize and set attributes
    for (const [key, value] of Object.entries(attributes)) {
        if (key === 'href' || key === 'src') {
            const sanitizedURL = sanitizeURL(value);
            if (sanitizedURL) {
                element.setAttribute(key, sanitizedURL);
            }
        } else if (key.startsWith('on')) {
            // Block event handler attributes
            console.warn('Event handler attributes are not allowed');
        } else {
            element.setAttribute(key, sanitizeInput(String(value)));
        }
    }
    
    // Set text content safely
    if (textContent) {
        element.textContent = textContent;
    }
    
    return element;
}

/**
 * Validate email format
 * @param {string} email - Email string
 * @returns {boolean} True if valid email format
 */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Strip dangerous characters from filename
 * @param {string} filename - Filename to sanitize
 * @returns {string} Safe filename
 */
export function sanitizeFilename(filename) {
    return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

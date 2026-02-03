// Form Validation Module
import { sanitizeInput, sanitizeNumber } from './sanitizer.js';

/**
 * Validate required field
 * @param {HTMLElement} field - Input element
 * @returns {boolean} True if valid
 */
function validateRequired(field) {
    const value = field.value.trim();
    if (!value) {
        showFieldError(field, 'This field is required');
        return false;
    }
    clearFieldError(field);
    return true;
}

/**
 * Validate number field
 * @param {HTMLElement} field - Input element
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean} True if valid
 */
function validateNumber(field, min = -Infinity, max = Infinity) {
    const value = sanitizeNumber(field.value, min, max);
    
    if (value === null) {
        showFieldError(field, `Please enter a valid number between ${min} and ${max}`);
        return false;
    }
    
    clearFieldError(field);
    return true;
}

/**
 * Validate select field
 * @param {HTMLElement} field - Select element
 * @returns {boolean} True if valid
 */
function validateSelect(field) {
    if (!field.value || field.value === '') {
        showFieldError(field, 'Please select an option');
        return false;
    }
    clearFieldError(field);
    return true;
}

/**
 * Show error message for field
 * @param {HTMLElement} field - Input element
 * @param {string} message - Error message
 */
function showFieldError(field, message) {
    field.classList.add('error');
    field.classList.remove('success');
    field.setAttribute('aria-invalid', 'true');
    
    const errorId = `${field.id}-error`;
    let errorElement = document.getElementById(errorId);
    
    if (!errorElement) {
        errorElement = document.createElement('span');
        errorElement.id = errorId;
        errorElement.className = 'error-message';
        errorElement.setAttribute('role', 'alert');
        field.parentNode.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

/**
 * Clear error for field
 * @param {HTMLElement} field - Input element
 */
function clearFieldError(field) {
    field.classList.remove('error');
    field.classList.add('success');
    field.setAttribute('aria-invalid', 'false');
    
    const errorId = `${field.id}-error`;
    const errorElement = document.getElementById(errorId);
    
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

/**
 * Validate profile form
 * @param {HTMLFormElement} form - Form element
 * @returns {boolean} True if valid
 */
export function validateProfileForm(form) {
    let isValid = true;
    
    const state = form.querySelector('#state');
    const income = form.querySelector('#income');
    const category = form.querySelector('#category');
    const casteCategory = form.querySelector('#caste_category');
    const age = form.querySelector('#age');
    
    if (state && !validateSelect(state)) isValid = false;
    if (income && !validateNumber(income, 0, 100000000)) isValid = false;
    if (category && !validateSelect(category)) isValid = false;
    if (casteCategory && !validateSelect(casteCategory)) isValid = false;
    if (age && !validateNumber(age, 0, 120)) isValid = false;
    
    return isValid;
}

/**
 * Setup form validation
 * @param {HTMLFormElement} form - Form element
 * @param {Function} onSubmit - Submit callback
 */
export function setupFormValidation(form, onSubmit) {
    if (!form) return;
    
    // Validate on blur
    form.querySelectorAll('input, select').forEach(field => {
        field.addEventListener('blur', () => {
            if (field.type === 'number') {
                const min = parseFloat(field.min) || -Infinity;
                const max = parseFloat(field.max) || Infinity;
                validateNumber(field, min, max);
            } else if (field.tagName === 'SELECT') {
                validateSelect(field);
            } else if (field.required) {
                validateRequired(field);
            }
        });
        
        // Clear error on input
        field.addEventListener('input', () => {
            if (field.classList.contains('error')) {
                clearFieldError(field);
            }
        });
    });
    
    // Validate on submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!validateProfileForm(form)) {
            return;
        }
        
        if (onSubmit) {
            await onSubmit(form);
        }
    });
}

/**
 * Get sanitized form data
 * @param {HTMLFormElement} form - Form element
 * @returns {Object} Sanitized form data
 */
export function getSanitizedFormData(form) {
    const formData = new FormData(form);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
        const field = form.querySelector(`[name="${key}"]`);
        
        if (field && field.type === 'number') {
            data[key] = sanitizeNumber(value);
        } else {
            data[key] = sanitizeInput(value);
        }
    }
    
    return data;
}

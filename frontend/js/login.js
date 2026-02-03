// Login page module
import { login, register } from './auth.js';
import { showToast } from './ui.js';
import { sanitizeInput } from './sanitizer.js';

/**
 * Initialize login page
 */
function initLogin() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const formError = document.getElementById('formError');
    
    // Login form handler
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            
            if (formError) formError.style.display = 'none';
            
            if (!username || !password) {
                if (formError) {
                    formError.textContent = 'Please enter both username and password.';
                    formError.style.display = 'block';
                }
                return;
            }
            
            try {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
                
                await login(username, password);
                showToast('Login successful!', 'success');
                
                // Redirect after short delay
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 500);
                
            } catch (error) {
                if (formError) {
                    formError.textContent = error.message;
                    formError.style.display = 'block';
                }
                showToast(error.message, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
            }
        });
    }
    
    // Register form handler
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('regUsername').value.trim();
            const password = document.getElementById('regPassword').value.trim();
            const confirmPassword = document.getElementById('regConfirmPassword')?.value.trim();
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            
            if (formError) formError.style.display = 'none';
            
            // Validate
            if (!username || !password) {
                if (formError) {
                    formError.textContent = 'Please fill all fields.';
                    formError.style.display = 'block';
                }
                return;
            }
            
            if (password.length < 6) {
                if (formError) {
                    formError.textContent = 'Password must be at least 6 characters long.';
                    formError.style.display = 'block';
                }
                return;
            }
            
            if (confirmPassword && password !== confirmPassword) {
                if (formError) {
                    formError.textContent = 'Passwords do not match.';
                    formError.style.display = 'block';
                }
                return;
            }
            
            try {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';
                
                await register(username, password);
                showToast('Registration successful! Please login.', 'success');
                
                // Switch to login tab or redirect
                const loginTab = document.querySelector('[data-tab="login"]');
                if (loginTab) {
                    loginTab.click();
                }
                
            } catch (error) {
                if (formError) {
                    formError.textContent = error.message;
                    formError.style.display = 'block';
                }
                showToast(error.message, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Register';
            }
        });
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLogin);
} else {
    initLogin();
}

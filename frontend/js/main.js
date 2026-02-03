// Main Application Module
import { getCurrentUsername, isAuthenticated, logout } from './auth.js';
import { setupBackToTop, setupHamburgerMenu, setupLazyLoading, navigateToSection } from './ui.js';
import { setupFormValidation, getSanitizedFormData } from './validation.js';
import { getRecommendations } from './api.js';
import { showToast } from './ui.js';
import { debugNavigation } from './debug.js';

/**
 * Initialize application
 */
function init() {
    console.log('Initializing SchemeAssist AI...');
    
    // Make functions globally available for onclick handlers
    window.navigateToSection = navigateToSection;
    window.debugNav = debugNavigation;
    window.viewSchemeDetails = viewSchemeDetails;
    window.addToFavoritesClick = addToFavoritesClick;
    
    // Setup UI components
    setupBackToTop();
    setupHamburgerMenu();
    setupLazyLoading();
    
    // Setup authentication UI
    setupAuthUI();
    
    // Setup navigation
    setupNavigation();
    
    // Setup profile form
    setupProfileForm();
    
    // Load user profile if authenticated
    if (isAuthenticated()) {
        loadUserProfile();
    }
    
    console.log('Initialization complete!');
    console.log('Tip: Type debugNav() in console to see navigation state');
}

/**
 * View scheme details (placeholder for modal/page)
 * @param {string} schemeName - Scheme name
 */
function viewSchemeDetails(schemeName) {
    console.log('Viewing details for:', schemeName);
    showToast(`Viewing details for: ${schemeName}`, 'info');
    // TODO: Implement modal or details view
}

/**
 * Add scheme to favorites
 * @param {string} schemeName - Scheme name
 */
async function addToFavoritesClick(schemeName) {
    try {
        const { addToFavorites } = await import('./api.js');
        await addToFavorites(schemeName);
        showToast(`Added "${schemeName}" to favorites!`, 'success');
    } catch (error) {
        console.error('Error adding to favorites:', error);
        showToast('Failed to add to favorites', 'error');
    }
}

/**
 * Setup authentication UI
 */
function setupAuthUI() {
    const userDropdown = document.getElementById('userDropdown');
    const usernameDisplay = document.getElementById('usernameDisplay');
    const loginLink = document.getElementById('loginLink');
    const userBtn = document.getElementById('userBtn');
    const dropdownLogout = document.getElementById('dropdownLogout');
    
    if (isAuthenticated()) {
        const username = getCurrentUsername();
        
        if (userDropdown && usernameDisplay && loginLink) {
            userDropdown.style.display = 'block';
            usernameDisplay.textContent = username;
            loginLink.style.display = 'none';
            
            // Dropdown toggle
            if (userBtn) {
                userBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    userDropdown.classList.toggle('active');
                });
            }
            
            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (userDropdown && !userDropdown.contains(e.target)) {
                    userDropdown.classList.remove('active');
                }
            });
            
            // Logout handler
            if (dropdownLogout) {
                dropdownLogout.addEventListener('click', async (e) => {
                    e.preventDefault();
                    await logout();
                });
            }
        }
    } else {
        if (userDropdown) userDropdown.style.display = 'none';
        if (loginLink) loginLink.style.display = 'inline';
    }
}

/**
 * Setup navigation
 */
function setupNavigation() {
    // Add click handlers to navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            console.log('Nav link clicked:', section);
            if (section) {
                navigateToSection(section);
            }
        });
    });
    
    // Handle hash changes for direct navigation
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.substring(1); // Remove #
        if (hash) {
            navigateToSection(hash);
        }
    });
    
    // Handle initial hash if present
    const initialHash = window.location.hash.substring(1);
    if (initialHash) {
        navigateToSection(initialHash);
    }
}

/**
 * Setup profile form
 */
function setupProfileForm() {
    const form = document.getElementById('profileForm');
    if (!form) return;
    
    setupFormValidation(form, handleProfileSubmit);
}

/**
 * Handle profile form submission
 * @param {HTMLFormElement} form - Form element
 */
async function handleProfileSubmit(form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
        // Disable button and show loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Finding Schemes...';
        
        // Get form values directly from form elements
        const state = document.getElementById('state').value;
        const income = document.getElementById('income').value;
        const category = document.getElementById('category').value;
        const casteCategory = document.getElementById('caste_category').value;
        const age = document.getElementById('age').value;
        const minMatch = document.getElementById('min_match').value;
        
        console.log('Form values:', { state, income, category, casteCategory, age, minMatch });
        
        // Validate all fields are filled
        if (!state || !income || !category || !casteCategory || !age) {
            showToast('Please fill all required fields', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            return;
        }
        
        // Build user profile object
        const userProfile = {
            state: state,
            income: parseInt(income),
            category: category,
            caste_category: casteCategory,
            age: parseInt(age),
            min_match_score: parseInt(minMatch || 95)
        };
        
        console.log('Sending profile:', userProfile);
        
        // Get recommendations
        const data = await getRecommendations(userProfile);
        
        console.log('Received data:', data);
        
        if (data.success) {
            showToast(`Found ${data.count} matching schemes!`, 'success');
            displayResults(data.schemes);
        } else {
            showToast(data.error || 'Failed to get recommendations', 'error');
        }
        
    } catch (error) {
        console.error('Error:', error);
        showToast(error.message || 'Failed to get recommendations', 'error');
    } finally {
        // Re-enable button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

/**
 * Display recommendation results
 * @param {Array} schemes - Schemes array
 */
function displayResults(schemes) {
    const resultsContainer = document.getElementById('results');
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = '';
    
    if (!schemes || schemes.length === 0) {
        resultsContainer.innerHTML = `
            <div class="info-message">
                <i class="fas fa-info-circle"></i>
                <p>No schemes found matching your criteria. Try adjusting your filters.</p>
            </div>
        `;
        return;
    }
    
    // Show export controls
    const exportControls = document.getElementById('exportControls');
    if (exportControls) {
        exportControls.classList.remove('hidden');
    }
    
    console.log('Displaying', schemes.length, 'schemes');
    
    // Display schemes
    schemes.forEach(scheme => {
        const card = createSchemeCard(scheme);
        resultsContainer.appendChild(card);
    });
    
    // Scroll to results
    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Create scheme card element
 * @param {Object} scheme - Scheme data
 * @returns {HTMLElement} Card element
 */
function createSchemeCard(scheme) {
    const card = document.createElement('div');
    card.className = 'scheme-card';
    
    const eligibilityScore = scheme.eligibility_score || scheme.match_score || 0;
    const minIncome = parseInt(scheme.min_income) || 0;
    const maxIncome = parseInt(scheme.max_income) || 0;
    
    card.innerHTML = `
        <div class="scheme-header">
            <h3>${escapeHtml(scheme.scheme_name)}</h3>
            <span class="match-score">${eligibilityScore}% Match</span>
        </div>
        <div class="scheme-body">
            <p><strong>Category:</strong> ${escapeHtml(scheme.category)}</p>
            <p><strong>State:</strong> ${escapeHtml(scheme.state)}</p>
            <p><strong>Benefit:</strong> ${escapeHtml(scheme.benefit || 'View details')}</p>
            <p><strong>Income Range:</strong> ₹${minIncome.toLocaleString('en-IN')} - ₹${maxIncome.toLocaleString('en-IN')}</p>
        </div>
        <div class="card-actions">
            <button class="btn-primary" onclick="viewSchemeDetails('${escapeHtml(scheme.scheme_name).replace(/'/g, "\\'")}')">
                <i class="fas fa-info-circle"></i> Details
            </button>
            <button class="btn-secondary" onclick="addToFavoritesClick('${escapeHtml(scheme.scheme_name).replace(/'/g, "\\'")}')">
                <i class="fas fa-heart"></i> Favorite
            </button>
        </div>
    `;
    
    return card;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Load user profile
 */
async function loadUserProfile() {
    // Implementation for loading user profile
    console.log('Loading user profile...');
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export for other modules
export { init, displayResults };

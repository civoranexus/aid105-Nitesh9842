// ===== CONFIGURATION =====
const API_URL = 'http://localhost:5000/api';

// Global state
let currentRecommendations = [];
let userProfile = null;
let selectedForComparison = [];

// ===== DOM READY =====
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// ===== INITIALIZATION =====
function initializeApp() {
    setupNavigation();
    setupFormHandler();
    setupMobileMenu();
    checkBackendHealth();
}

// ===== NAVIGATION =====
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            navigateToSection(section);
        });
    });
}

function navigateToSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Hide hero section
    const hero = document.querySelector('.hero');
    if (hero) {
        hero.style.display = 'none';
    }

    // Show target section
    if (sectionId === 'home') {
        // Show hero section for home
        if (hero) {
            hero.style.display = 'block';
        }
    } else {
        // Show the requested section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }
    }

    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.section === sectionId) {
            link.classList.add('active');
        }
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== MOBILE MENU =====
function setupMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (hamburger) {
        hamburger.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            if (hamburger) {
                hamburger.classList.remove('active');
            }
        });
    });
}

// ===== FORM HANDLER =====
function setupFormHandler() {
    const form = document.getElementById('profileForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();

    // Get form values
    const state = document.getElementById('state').value;
    const income = document.getElementById('income').value;
    const category = document.getElementById('category').value;
    const age = document.getElementById('age').value;

    // Validate
    if (!state || !income || !category) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    // Store user profile
    userProfile = {
        state,
        income: parseInt(income),
        category,
        age: age ? parseInt(age) : null
    };

    // Show loading
    showLoading();

    try {
        // Make API call
        const response = await fetch(`${API_URL}/recommend`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userProfile)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Hide loading
        hideLoading();

        if (data.success && data.schemes.length > 0) {
            currentRecommendations = data.schemes;
            displayRecommendations(data.schemes);
            displayPriorityView(data.schemes);
            updateCompareOptions(data.schemes);
            showToast(`Found ${data.schemes.length} schemes for you!`, 'success');
        } else {
            displayNoResults();
            showToast('No schemes found for your profile', 'error');
        }

    } catch (error) {
        hideLoading();
        console.error('Error:', error);
        displayError(error.message);
        showToast('Failed to fetch recommendations. Check if backend is running.', 'error');
    }
}

// ===== DISPLAY RECOMMENDATIONS =====
function displayRecommendations(schemes) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '<h3><i class="fas fa-list"></i> Your Recommended Schemes</h3>';

    const grid = document.createElement('div');
    grid.className = 'scheme-grid';

    schemes.forEach((scheme, index) => {
        const card = createSchemeCard(scheme, index);
        grid.appendChild(card);
    });

    resultsDiv.appendChild(grid);
}

function createSchemeCard(scheme, index) {
    const card = document.createElement('div');
    card.className = 'card';
    
    const scoreClass = scheme.score >= 70 ? 'score-high' : 
                       scheme.score >= 40 ? 'score-medium' : 'score-low';

    card.innerHTML = `
        <h3>${scheme.scheme_name}</h3>
        <p><strong>Category:</strong> ${scheme.category}</p>
        <p><strong>Last Updated:</strong> ${scheme.last_updated}</p>
        <div>
            <span class="score-badge ${scoreClass}">
                <i class="fas fa-star"></i> Score: ${scheme.score}
            </span>
        </div>
        <div class="card-actions">
            <button class="btn-compare" onclick="toggleCompare(${index})">
                <i class="fas fa-plus"></i> Compare
            </button>
        </div>
    `;

    return card;
}

function displayPriorityView(schemes) {
    const priorityView = document.getElementById('priorityView');
    const high = schemes.filter(s => s.score >= 70);
    const medium = schemes.filter(s => s.score >= 40 && s.score < 70);
    const low = schemes.filter(s => s.score < 40);

    document.getElementById('highPriority').innerHTML = '';
    document.getElementById('mediumPriority').innerHTML = '';
    document.getElementById('lowPriority').innerHTML = '';

    if (high.length > 0) {
        high.forEach((scheme, index) => {
            document.getElementById('highPriority').appendChild(
                createSchemeCard(scheme, schemes.indexOf(scheme))
            );
        });
    } else {
        document.getElementById('highPriority').innerHTML = '<p>No high priority schemes</p>';
    }

    if (medium.length > 0) {
        medium.forEach((scheme, index) => {
            document.getElementById('mediumPriority').appendChild(
                createSchemeCard(scheme, schemes.indexOf(scheme))
            );
        });
    } else {
        document.getElementById('mediumPriority').innerHTML = '<p>No medium priority schemes</p>';
    }

    if (low.length > 0) {
        low.forEach((scheme, index) => {
            document.getElementById('lowPriority').appendChild(
                createSchemeCard(scheme, schemes.indexOf(scheme))
            );
        });
    } else {
        document.getElementById('lowPriority').innerHTML = '<p>No low priority schemes</p>';
    }

    priorityView.classList.remove('hidden');
}

function displayNoResults() {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `
        <div class="alert-placeholder">
            <i class="fas fa-search"></i>
            <p>No schemes found for your profile. Try adjusting your criteria.</p>
        </div>
    `;
    document.getElementById('priorityView').classList.add('hidden');
}

function displayError(message) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `
        <div class="alert-item warning">
            <div class="alert-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="alert-content">
                <h4>Connection Error</h4>
                <p>Could not connect to the backend server.</p>
                <p>Please ensure the backend is running on port 5000.</p>
                <p style="font-size: 0.9rem; margin-top: 0.5rem;"><code>cd backend && python app.py</code></p>
            </div>
        </div>
    `;
}

// ===== COMPARISON FUNCTIONALITY =====
function updateCompareOptions(schemes) {
    const container = document.getElementById('compareSelectContainer');
    container.innerHTML = '<p style="margin-bottom: 1rem; font-weight: 600;">Select up to 3 schemes to compare:</p>';
    
    const checkboxGroup = document.createElement('div');
    checkboxGroup.className = 'compare-checkbox-group';

    schemes.forEach((scheme, index) => {
        const label = document.createElement('label');
        label.className = 'compare-checkbox';
        label.innerHTML = `
            <input type="checkbox" value="${index}" onchange="updateCompareSelection(this)">
            <span>${scheme.scheme_name}</span>
        `;
        checkboxGroup.appendChild(label);
    });

    container.appendChild(checkboxGroup);
    selectedForComparison = [];
    document.getElementById('compareBtn').disabled = true;
}

function toggleCompare(index) {
    const indexPos = selectedForComparison.indexOf(index);
    
    if (indexPos > -1) {
        selectedForComparison.splice(indexPos, 1);
    } else {
        if (selectedForComparison.length < 3) {
            selectedForComparison.push(index);
        } else {
            showToast('You can only compare up to 3 schemes', 'error');
            return;
        }
    }

    updateCompareUI();
}

function updateCompareSelection(checkbox) {
    const index = parseInt(checkbox.value);
    
    if (checkbox.checked) {
        if (selectedForComparison.length < 3) {
            selectedForComparison.push(index);
        } else {
            checkbox.checked = false;
            showToast('You can only compare up to 3 schemes', 'error');
        }
    } else {
        const pos = selectedForComparison.indexOf(index);
        if (pos > -1) {
            selectedForComparison.splice(pos, 1);
        }
    }

    updateCompareUI();
}

function updateCompareUI() {
    const compareBtn = document.getElementById('compareBtn');
    compareBtn.disabled = selectedForComparison.length < 2;

    // Update button text
    if (selectedForComparison.length > 0) {
        compareBtn.innerHTML = `<i class="fas fa-exchange-alt"></i> Compare Selected (${selectedForComparison.length})`;
    } else {
        compareBtn.innerHTML = `<i class="fas fa-exchange-alt"></i> Compare Selected`;
    }
}

function compareSelected() {
    if (selectedForComparison.length < 2) {
        showToast('Please select at least 2 schemes to compare', 'error');
        return;
    }

    const schemesToCompare = selectedForComparison.map(i => currentRecommendations[i]);
    displayComparison(schemesToCompare);
    navigateToSection('compare');
}

function displayComparison(schemes) {
    const container = document.getElementById('comparisonResults');
    container.innerHTML = '<h3><i class="fas fa-chart-bar"></i> Scheme Comparison</h3>';

    const grid = document.createElement('div');
    grid.className = 'comparison-grid';

    schemes.forEach(scheme => {
        const card = document.createElement('div');
        card.className = 'comparison-card';
        
        card.innerHTML = `
            <h3>${scheme.scheme_name}</h3>
            <div class="comparison-row">
                <span class="comparison-label">Category</span>
                <span class="comparison-value">${scheme.category}</span>
            </div>
            <div class="comparison-row">
                <span class="comparison-label">Eligibility Score</span>
                <span class="comparison-value">${scheme.score}</span>
            </div>
            <div class="comparison-row">
                <span class="comparison-label">Last Updated</span>
                <span class="comparison-value">${scheme.last_updated}</span>
            </div>
            <div class="comparison-row">
                <span class="comparison-label">Priority</span>
                <span class="comparison-value">${
                    scheme.score >= 70 ? 'High' : 
                    scheme.score >= 40 ? 'Medium' : 'Low'
                }</span>
            </div>
        `;

        grid.appendChild(card);
    });

    container.appendChild(grid);
}

// ===== ALERTS FUNCTIONALITY =====
async function checkUpdates() {
    if (!userProfile) {
        showToast('Please get recommendations first', 'error');
        navigateToSection('recommend');
        return;
    }

    showLoading();

    // Simulate checking for updates (since backend might not have this endpoint)
    setTimeout(() => {
        hideLoading();
        
        const recentSchemes = currentRecommendations.filter(scheme => {
            const updateDate = new Date(scheme.last_updated);
            const daysAgo = Math.floor((new Date() - updateDate) / (1000 * 60 * 60 * 24));
            return daysAgo <= 30;
        });

        displayAlerts(recentSchemes);
        
        if (recentSchemes.length > 0) {
            showToast(`Found ${recentSchemes.length} recently updated schemes`, 'success');
        } else {
            showToast('No recent updates found', 'error');
        }
    }, 1000);
}

function displayAlerts(schemes) {
    const container = document.getElementById('alertsContainer');
    container.innerHTML = '';

    if (schemes.length === 0) {
        container.innerHTML = `
            <div class="alert-placeholder">
                <i class="fas fa-check-circle"></i>
                <p>No recent updates found for your profile.</p>
            </div>
        `;
        return;
    }

    schemes.forEach(scheme => {
        const updateDate = new Date(scheme.last_updated);
        const daysAgo = Math.floor((new Date() - updateDate) / (1000 * 60 * 60 * 24));

        const alert = document.createElement('div');
        alert.className = 'alert-item update';
        alert.innerHTML = `
            <div class="alert-icon">
                <i class="fas fa-bell"></i>
            </div>
            <div class="alert-content">
                <h4>${scheme.scheme_name}</h4>
                <p>Category: ${scheme.category}</p>
                <p>Updated ${daysAgo} days ago</p>
                <p style="font-size: 0.9rem; color: #10b981; margin-top: 0.5rem;">
                    <i class="fas fa-star"></i> Eligibility Score: ${scheme.score}
                </p>
            </div>
        `;
        container.appendChild(alert);
    });
}

function checkEligibilityChanges() {
    if (!userProfile) {
        showToast('Please get recommendations first', 'error');
        navigateToSection('recommend');
        return;
    }

    // Simulate eligibility analysis
    showLoading();
    
    setTimeout(() => {
        hideLoading();
        
        const container = document.getElementById('alertsContainer');
        container.innerHTML = `
            <div class="alert-item priority">
                <div class="alert-icon">
                    <i class="fas fa-info-circle"></i>
                </div>
                <div class="alert-content">
                    <h4>Eligibility Analysis</h4>
                    <p>Currently eligible for ${currentRecommendations.length} schemes</p>
                    <p>Based on your income of ₹${userProfile.income.toLocaleString()}</p>
                    <p style="margin-top: 0.5rem; font-size: 0.9rem;">
                        Income changes may affect eligibility. Consult with scheme officials for accurate information.
                    </p>
                </div>
            </div>
        `;
        
        showToast('Eligibility analysis complete', 'success');
    }, 1000);
}

// ===== BACKEND HEALTH CHECK =====
async function checkBackendHealth() {
    try {
        const response = await fetch(`${API_URL}/health`);
        if (response.ok) {
            console.log('✓ Backend is running');
        }
    } catch (error) {
        console.warn('⚠ Backend might not be running. Start it with: cd backend && python app.py');
    }
}

// ===== UI HELPERS =====
function showLoading() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ===== UTILITY FUNCTIONS =====
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
}

// Make functions available globally
window.navigateToSection = navigateToSection;
window.toggleCompare = toggleCompare;
window.compareSelected = compareSelected;
window.updateCompareSelection = updateCompareSelection;
window.checkUpdates = checkUpdates;
window.checkEligibilityChanges = checkEligibilityChanges;

// ===== CONFIGURATION =====
const API_URL = 'http://localhost:5000/api';

// Global state
let currentRecommendations = [];
let userProfile = null;
let selectedForComparison = [];
let alertsCache = null;

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

    const ageStatus = scheme.age_eligible !== false ? 
        '<span class="eligibility-badge eligible"><i class="fas fa-check"></i> Age Eligible</span>' :
        '<span class="eligibility-badge not-eligible"><i class="fas fa-times"></i> Age Not Eligible</span>';

    card.innerHTML = `
        <h3>${scheme.scheme_name}</h3>
        <p><strong>Category:</strong> ${scheme.category}</p>
        <p><strong>Benefits:</strong> ${scheme.benefits || 'Various benefits'}</p>
        <p><strong>Target:</strong> ${scheme.target_group || 'All eligible citizens'}</p>
        <p><strong>Last Updated:</strong> ${scheme.last_updated}</p>
        <div class="card-badges">
            <span class="score-badge ${scoreClass}">
                <i class="fas fa-star"></i> Score: ${scheme.score}
            </span>
            ${ageStatus}
        </div>
        <div class="card-actions">
            <button class="btn-compare" onclick="toggleCompare(${index})" id="compare-btn-${index}">
                <i class="fas fa-plus"></i> Compare
            </button>
            <button class="btn-details" onclick="showSchemeDetails(${index})">
                <i class="fas fa-info-circle"></i> Details
            </button>
        </div>
    `;

    return card;
}

function showSchemeDetails(index) {
    const scheme = currentRecommendations[index];
    if (!scheme) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
            <h2>${scheme.scheme_name}</h2>
            <div class="modal-body">
                <div class="detail-row">
                    <span class="detail-label"><i class="fas fa-th-large"></i> Category</span>
                    <span class="detail-value">${scheme.category}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><i class="fas fa-gift"></i> Benefits</span>
                    <span class="detail-value">${scheme.benefits || 'Various benefits'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><i class="fas fa-users"></i> Target Group</span>
                    <span class="detail-value">${scheme.target_group || 'All eligible citizens'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><i class="fas fa-rupee-sign"></i> Income Range</span>
                    <span class="detail-value">${formatIncomeRange(scheme.min_income, scheme.max_income)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><i class="fas fa-user"></i> Age Range</span>
                    <span class="detail-value">${scheme.min_age || 0} - ${scheme.max_age || 100} years</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><i class="fas fa-map-marker-alt"></i> Level</span>
                    <span class="detail-value">${scheme.level || 'Central'} ${scheme.state !== 'All' ? `(${scheme.state})` : ''}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><i class="fas fa-star"></i> Eligibility Score</span>
                    <span class="detail-value score-badge ${scheme.score >= 70 ? 'score-high' : scheme.score >= 40 ? 'score-medium' : 'score-low'}">${scheme.score}</span>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

function formatIncomeRange(min, max) {
    if (!min && !max) return 'No income restrictions';
    if (max >= 999999) return `₹${(min || 0).toLocaleString()}+`;
    return `₹${(min || 0).toLocaleString()} - ₹${max.toLocaleString()}`;
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
        document.getElementById(`compare-btn-${index}`)?.classList.remove('selected');
    } else {
        if (selectedForComparison.length < 4) {
            selectedForComparison.push(index);
            document.getElementById(`compare-btn-${index}`)?.classList.add('selected');
        } else {
            showToast('You can only compare up to 4 schemes', 'error');
            return;
        }
    }

    updateCompareUI();
}

function updateCompareSelection(checkbox) {
    const index = parseInt(checkbox.value);
    
    if (checkbox.checked) {
        if (selectedForComparison.length < 4) {
            selectedForComparison.push(index);
        } else {
            checkbox.checked = false;
            showToast('You can only compare up to 4 schemes', 'error');
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
    fetchDetailedComparison(schemesToCompare);
}

async function fetchDetailedComparison(schemes) {
    showLoading();
    
    try {
        const response = await fetch(`${API_URL}/compare`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                scheme_names: schemes.map(s => s.scheme_name),
                user_profile: userProfile
            })
        });

        hideLoading();

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                displayEnhancedComparison(data.comparison);
                navigateToSection('compare');
                return;
            }
        }
        
        // Fallback to local comparison
        displayComparison(schemes);
        navigateToSection('compare');
    } catch (error) {
        hideLoading();
        // Fallback to local comparison
        displayComparison(schemes);
        navigateToSection('compare');
    }
}

function displayEnhancedComparison(comparison) {
    const container = document.getElementById('comparisonResults');
    container.innerHTML = '';

    // Header with recommendation
    if (comparison.recommendation) {
        const recDiv = document.createElement('div');
        recDiv.className = 'comparison-recommendation';
        recDiv.innerHTML = `
            <div class="recommendation-badge">
                <i class="fas fa-trophy"></i>
                <span>Best Match: <strong>${comparison.recommendation.scheme_name}</strong></span>
                ${comparison.recommendation.score ? `<span class="rec-score">Score: ${comparison.recommendation.score}</span>` : ''}
            </div>
            <p>${comparison.recommendation.reason}</p>
        `;
        container.appendChild(recDiv);
    }

    // Insights section
    if (comparison.insights && comparison.insights.length > 0) {
        const insightsDiv = document.createElement('div');
        insightsDiv.className = 'comparison-insights';
        insightsDiv.innerHTML = `
            <h3><i class="fas fa-lightbulb"></i> Comparison Insights</h3>
            <div class="insights-grid">
                ${comparison.insights.map(insight => `
                    <div class="insight-card">
                        <i class="fas fa-${insight.icon}"></i>
                        <h4>${insight.title}</h4>
                        <p>${insight.message}</p>
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(insightsDiv);
    }

    // Comparison table
    const tableDiv = document.createElement('div');
    tableDiv.className = 'comparison-table-container';
    
    const schemes = comparison.schemes;
    const attributes = [
        { key: 'category', label: 'Category', icon: 'th-large' },
        { key: 'benefits', label: 'Benefits', icon: 'gift' },
        { key: 'target_group', label: 'Target Group', icon: 'users' },
        { key: 'income_range', label: 'Income Range', icon: 'rupee-sign' },
        { key: 'age_range', label: 'Age Range', icon: 'user' },
        { key: 'level', label: 'Level', icon: 'flag' },
        { key: 'eligibility_score', label: 'Your Score', icon: 'star' },
        { key: 'last_updated', label: 'Last Updated', icon: 'calendar' }
    ];

    let tableHTML = `
        <table class="comparison-table">
            <thead>
                <tr>
                    <th>Attribute</th>
                    ${schemes.map(s => `<th>${s.scheme_name}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
    `;

    attributes.forEach(attr => {
        tableHTML += `
            <tr>
                <td class="attr-label"><i class="fas fa-${attr.icon}"></i> ${attr.label}</td>
                ${schemes.map(s => {
                    let value = s[attr.key] || '-';
                    if (attr.key === 'eligibility_score') {
                        const scoreClass = value >= 70 ? 'score-high' : value >= 40 ? 'score-medium' : 'score-low';
                        value = `<span class="score-badge ${scoreClass}">${value}</span>`;
                    }
                    return `<td>${value}</td>`;
                }).join('')}
            </tr>
        `;
    });

    tableHTML += '</tbody></table>';
    tableDiv.innerHTML = tableHTML;
    container.appendChild(tableDiv);

    // Visual comparison chart
    const chartDiv = document.createElement('div');
    chartDiv.className = 'comparison-chart';
    chartDiv.innerHTML = `
        <h3><i class="fas fa-chart-bar"></i> Score Comparison</h3>
        <div class="chart-bars">
            ${schemes.map((s, i) => {
                const score = s.eligibility_score || 0;
                const colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444'];
                return `
                    <div class="chart-bar-item">
                        <div class="chart-bar-label">${s.scheme_name.length > 20 ? s.scheme_name.substring(0, 20) + '...' : s.scheme_name}</div>
                        <div class="chart-bar-container">
                            <div class="chart-bar" style="width: ${score}%; background-color: ${colors[i % colors.length]}"></div>
                            <span class="chart-bar-value">${score}</span>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    container.appendChild(chartDiv);

    // Export button
    const exportDiv = document.createElement('div');
    exportDiv.className = 'comparison-export';
    exportDiv.innerHTML = `
        <button class="btn-secondary" onclick="exportComparison()">
            <i class="fas fa-download"></i> Export Comparison
        </button>
        <button class="btn-secondary" onclick="printComparison()">
            <i class="fas fa-print"></i> Print
        </button>
    `;
    container.appendChild(exportDiv);
}

function exportComparison() {
    const schemes = selectedForComparison.map(i => currentRecommendations[i]);
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Attribute," + schemes.map(s => s.scheme_name).join(",") + "\n";
    
    const attrs = ['category', 'benefits', 'target_group', 'score', 'last_updated'];
    attrs.forEach(attr => {
        csvContent += attr.charAt(0).toUpperCase() + attr.slice(1) + ",";
        csvContent += schemes.map(s => `"${s[attr] || '-'}"`).join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "scheme_comparison.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Comparison exported successfully', 'success');
}

function printComparison() {
    window.print();
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

    try {
        const response = await fetch(`${API_URL}/alerts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userProfile)
        });

        hideLoading();

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                alertsCache = data;
                displayEnhancedAlerts(data);
                showToast(`Found ${data.total_count} alerts for you`, 'success');
                return;
            }
        }
        
        // Fallback to local alerts
        displayLocalAlerts();
    } catch (error) {
        hideLoading();
        displayLocalAlerts();
    }
}

function displayEnhancedAlerts(data) {
    const container = document.getElementById('alertsContainer');
    container.innerHTML = '';

    // Alert summary
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'alerts-summary';
    summaryDiv.innerHTML = `
        <div class="summary-card">
            <i class="fas fa-bell"></i>
            <h4>${data.total_count}</h4>
            <p>Total Alerts</p>
        </div>
        <div class="summary-card">
            <i class="fas fa-sync-alt"></i>
            <h4>${data.alerts.recent_updates?.length || 0}</h4>
            <p>Recent Updates</p>
        </div>
        <div class="summary-card priority">
            <i class="fas fa-exclamation-circle"></i>
            <h4>${data.alerts.high_priority?.length || 0}</h4>
            <p>High Priority</p>
        </div>
        <div class="summary-card deadline">
            <i class="fas fa-clock"></i>
            <h4>${data.deadlines?.length || 0}</h4>
            <p>Deadlines</p>
        </div>
    `;
    container.appendChild(summaryDiv);

    // Alert filters
    const filterDiv = document.createElement('div');
    filterDiv.className = 'alert-filters';
    filterDiv.innerHTML = `
        <button class="filter-btn active" onclick="filterAlerts('all')">All</button>
        <button class="filter-btn" onclick="filterAlerts('priority')">High Priority</button>
        <button class="filter-btn" onclick="filterAlerts('updates')">Updates</button>
        <button class="filter-btn" onclick="filterAlerts('deadlines')">Deadlines</button>
        <button class="filter-btn" onclick="filterAlerts('category')">Category Match</button>
    `;
    container.appendChild(filterDiv);

    // Alerts list container
    const alertsList = document.createElement('div');
    alertsList.id = 'alertsList';
    alertsList.className = 'alerts-grid';
    container.appendChild(alertsList);

    // Display all alerts
    displayAlertsByFilter('all', data);
}

function filterAlerts(type) {
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    if (alertsCache) {
        displayAlertsByFilter(type, alertsCache);
    }
}

function displayAlertsByFilter(type, data) {
    const alertsList = document.getElementById('alertsList');
    alertsList.innerHTML = '';

    let alertsToShow = [];

    switch(type) {
        case 'priority':
            alertsToShow = data.alerts.high_priority || [];
            break;
        case 'updates':
            alertsToShow = data.alerts.recent_updates || [];
            break;
        case 'deadlines':
            alertsToShow = data.deadlines || [];
            break;
        case 'category':
            alertsToShow = data.alerts.category_alerts || [];
            break;
        default:
            alertsToShow = [
                ...(data.alerts.high_priority || []),
                ...(data.deadlines || []),
                ...(data.alerts.recent_updates || []),
                ...(data.alerts.category_alerts || [])
            ];
    }

    if (alertsToShow.length === 0) {
        alertsList.innerHTML = `
            <div class="alert-placeholder">
                <i class="fas fa-check-circle"></i>
                <p>No ${type === 'all' ? '' : type} alerts found.</p>
            </div>
        `;
        return;
    }

    alertsToShow.forEach(alert => {
        const alertEl = createAlertElement(alert);
        alertsList.appendChild(alertEl);
    });
}

function createAlertElement(alert) {
    const el = document.createElement('div');
    const priorityClass = alert.priority === 'critical' ? 'critical' : 
                         alert.priority === 'high' ? 'priority' : 
                         alert.alert_type === 'deadline' ? 'deadline' :
                         alert.alert_type === 'update' ? 'update' : 'info';
    
    const icon = alert.alert_type === 'deadline' ? 'clock' :
                alert.alert_type === 'priority' ? 'exclamation-triangle' :
                alert.alert_type === 'update' ? 'sync-alt' :
                alert.alert_type === 'new' ? 'star' :
                alert.alert_type === 'category_match' ? 'bookmark' : 'bell';

    el.className = `alert-item ${priorityClass}`;
    el.innerHTML = `
        <div class="alert-icon">
            <i class="fas fa-${icon}"></i>
        </div>
        <div class="alert-content">
            <div class="alert-header">
                <h4>${alert.scheme_name}</h4>
                <span class="alert-badge ${priorityClass}">${alert.priority || alert.alert_type}</span>
            </div>
            <p class="alert-category"><i class="fas fa-tag"></i> ${alert.category}</p>
            <p class="alert-message">${alert.message || alert.reason || ''}</p>
            ${alert.benefits ? `<p class="alert-benefits"><i class="fas fa-gift"></i> ${alert.benefits}</p>` : ''}
            ${alert.deadline_info ? `<p class="alert-deadline"><i class="fas fa-calendar-alt"></i> ${alert.deadline_info}</p>` : ''}
            ${alert.action_required ? `<p class="alert-action"><i class="fas fa-hand-point-right"></i> ${alert.action_required}</p>` : ''}
        </div>
    `;
    return el;
}

function displayLocalAlerts() {
    const recentSchemes = currentRecommendations.filter(scheme => {
        const updateDate = new Date(scheme.last_updated);
        const daysAgo = Math.floor((new Date() - updateDate) / (1000 * 60 * 60 * 24));
        return daysAgo <= 30;
    });

    displayAlerts(recentSchemes);
    
    if (recentSchemes.length > 0) {
        showToast(`Found ${recentSchemes.length} recently updated schemes`, 'success');
    } else {
        showToast('No recent updates found', 'info');
    }
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

async function checkEligibilityChanges() {
    if (!userProfile) {
        showToast('Please get recommendations first', 'error');
        navigateToSection('recommend');
        return;
    }

    // Show eligibility modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content eligibility-modal">
            <button class="modal-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
            <h2><i class="fas fa-calculator"></i> Eligibility Calculator</h2>
            <div class="modal-body">
                <p>Current Income: <strong>₹${userProfile.income.toLocaleString()}</strong></p>
                <p>Check how income changes affect your scheme eligibility:</p>
                
                <div class="income-change-input">
                    <label>Income Change Amount (₹)</label>
                    <input type="number" id="incomeChangeInput" placeholder="e.g., 50000 or -30000">
                    <small>Use negative number for decrease</small>
                </div>
                
                <div class="quick-buttons">
                    <button onclick="setIncomeChange(50000)">+₹50,000</button>
                    <button onclick="setIncomeChange(100000)">+₹1,00,000</button>
                    <button onclick="setIncomeChange(-50000)">-₹50,000</button>
                    <button onclick="setIncomeChange(-100000)">-₹1,00,000</button>
                </div>
                
                <button class="btn-primary" onclick="analyzeEligibilityChange()">
                    <i class="fas fa-search"></i> Analyze Impact
                </button>
                
                <div id="eligibilityResults" class="eligibility-results"></div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

function setIncomeChange(amount) {
    document.getElementById('incomeChangeInput').value = amount;
}

async function analyzeEligibilityChange() {
    const incomeChange = parseInt(document.getElementById('incomeChangeInput').value) || 0;
    
    if (incomeChange === 0) {
        showToast('Please enter an income change amount', 'error');
        return;
    }

    const resultsDiv = document.getElementById('eligibilityResults');
    resultsDiv.innerHTML = '<div class="loading-small"><i class="fas fa-spinner fa-spin"></i> Analyzing...</div>';

    try {
        const response = await fetch(`${API_URL}/eligibility`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...userProfile,
                income_change: incomeChange
            })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                displayEligibilityResults(data.eligibility_changes, resultsDiv);
                return;
            }
        }
        
        // Fallback
        resultsDiv.innerHTML = `
            <div class="eligibility-summary">
                <p>Income change from ₹${userProfile.income.toLocaleString()} to ₹${(userProfile.income + incomeChange).toLocaleString()}</p>
                <p class="info-text">Detailed analysis requires backend connection.</p>
            </div>
        `;
    } catch (error) {
        resultsDiv.innerHTML = `
            <div class="eligibility-summary">
                <p>Unable to fetch detailed analysis. Please ensure backend is running.</p>
            </div>
        `;
    }
}

function displayEligibilityResults(results, container) {
    const direction = results.income_change > 0 ? 'increase' : 'decrease';
    const arrow = results.income_change > 0 ? 'arrow-up' : 'arrow-down';
    const color = results.gained.length >= results.lost.length ? '#10b981' : '#ef4444';

    container.innerHTML = `
        <div class="eligibility-summary">
            <div class="income-change-display">
                <i class="fas fa-${arrow}" style="color: ${color}"></i>
                <span>₹${Math.abs(results.income_change).toLocaleString()} ${direction}</span>
            </div>
            <p class="impact-summary">${results.impact_summary}</p>
            
            <div class="eligibility-stats">
                <div class="stat gained">
                    <i class="fas fa-plus-circle"></i>
                    <span>${results.gained.length} schemes gained</span>
                </div>
                <div class="stat lost">
                    <i class="fas fa-minus-circle"></i>
                    <span>${results.lost.length} schemes lost</span>
                </div>
            </div>
            
            ${results.gained.length > 0 ? `
                <div class="scheme-list gained">
                    <h4><i class="fas fa-check"></i> New Eligible Schemes</h4>
                    ${results.gained.slice(0, 5).map(s => `
                        <div class="scheme-item">
                            <span>${s.scheme_name}</span>
                            <small>${s.category}</small>
                        </div>
                    `).join('')}
                    ${results.gained.length > 5 ? `<p class="more">+${results.gained.length - 5} more...</p>` : ''}
                </div>
            ` : ''}
            
            ${results.lost.length > 0 ? `
                <div class="scheme-list lost">
                    <h4><i class="fas fa-times"></i> Schemes You May Lose</h4>
                    ${results.lost.slice(0, 5).map(s => `
                        <div class="scheme-item">
                            <span>${s.scheme_name}</span>
                            <small>${s.category}</small>
                        </div>
                    `).join('')}
                    ${results.lost.length > 5 ? `<p class="more">+${results.lost.length - 5} more...</p>` : ''}
                </div>
            ` : ''}
        </div>
    `;
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
window.showSchemeDetails = showSchemeDetails;
window.filterAlerts = filterAlerts;
window.setIncomeChange = setIncomeChange;
window.analyzeEligibilityChange = analyzeEligibilityChange;
window.exportComparison = exportComparison;
window.printComparison = printComparison;

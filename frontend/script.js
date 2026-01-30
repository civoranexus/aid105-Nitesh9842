// ===== CONFIGURATION =====
const API_URL = 'http://localhost:5000/api';

// Global state
let currentRecommendations = [];
let searchResults = [];
let userProfile = null;
let selectedForComparison = [];
let alertsCache = null;

// Apply link mapping for schemes
const APPLY_LINKS = {
    // Central Government Portals
    'default_central': 'https://www.india.gov.in/my-government/schemes',
    'pm_kisan': 'https://pmkisan.gov.in/',
    'pmayg': 'https://pmayg.nic.in/',
    'pmaymis': 'https://pmaymis.gov.in/',
    'ayushman_bharat': 'https://beneficiary.nha.gov.in/',
    'pmjdy': 'https://pmjdy.gov.in/',
    'mudra_yojana': 'https://www.mudra.org.in/',
    'standup_india': 'https://www.standupmitra.in/',
    'pmsby': 'https://jansuraksha.gov.in/',
    'pmjjby': 'https://jansuraksha.gov.in/',
    'apy': 'https://www.npscra.nsdl.co.in/',
    'nps': 'https://enps.nsdl.com/',
    'ppf': 'https://www.indiapost.gov.in/',
    'sukanya_samriddhi': 'https://www.indiapost.gov.in/',
    'maandhan': 'https://maandhan.in/',
    'swayam': 'https://swayam.gov.in/',
    'skill_india': 'https://www.skillindia.gov.in/',
    'make_in_india': 'https://www.makeinindia.com/',
    'digital_india': 'https://www.digitalindia.gov.in/',
    'startup_india': 'https://www.startupindia.gov.in/',
    'ncs': 'https://www.ncs.gov.in/',
    'mgnrega': 'https://nrega.nic.in/',
    'pmgsy': 'https://pmgsy.nic.in/',
    'nrlm': 'https://aajeevika.gov.in/',
    'nsap': 'https://nsap.nic.in/',
    'ddugjy': 'https://ddugjy.gov.in/',
    'pmfby': 'https://pmfby.gov.in/',
    'nfsm': 'https://nfsn.mofpi.gov.in/',
    'pm_dhan_dhaanya': 'https://www.agricoop.gov.in/',
    'pmsvanidhi': 'https://pmsvanidhi.mohua.gov.in/',
    'micro_enterprise_credit_card': 'https://www.mudra.org.in/',
    'swamih_fund': 'https://www.swamih.co.in/',
    'pm_vishwakarma': 'https://pmvishwakarma.gov.in/',
    'pm_surya_ghar': 'https://pmsuryaghar.gov.in/',
    'nam_ayush': 'https://namayush.gov.in/',
    'beti_bachao': 'https://wcd.nic.in/',
    'swachh_bharat': 'https://swachhbharatmission.gov.in/',
    'ndlm': 'https://www.pmgdisha.in/',
    'pm_poshan': 'https://pmposhan.education.gov.in/',
    'operation_greens': 'https://mofpi.gov.in/',
    'ncap': 'https://moef.gov.in/',
    'pm_cares_children': 'https://pmcaresforchildren.in/',
    'pmkkky': 'https://www.mines.gov.in/',
    'bio_energy_mission': 'https://mnre.gov.in/',
    'nsp': 'https://scholarships.gov.in/',
    'pmss': 'https://www.desw.gov.in/',
    'kvpy': 'https://www.iisc.ac.in/',
    'inspire': 'https://online-inspire.gov.in/',
    'ntse': 'https://ncert.nic.in/',
    'cbse_sgc': 'https://www.cbse.gov.in/',
    'ugc': 'https://www.ugc.gov.in/',
    'vidyasaarathi': 'https://www.vidyasaarathi.co.in/',
    'lic': 'https://www.licindia.in/',
    'hdfc_scholarship': 'https://www.hdfcbank.com/',
    'jindal_scholarship': 'https://www.sitaramjindalfoundation.org/',
    'ongc_scholarship': 'https://www.ongcindia.com/',
    'pmksy': 'https://pmksy.gov.in/',
    'soil_health_card': 'https://soilhealth.dac.gov.in/',
    'enam': 'https://www.enam.gov.in/',
    'pkvy': 'https://pgsindia-ncof.gov.in/',
    'rkvy': 'https://rkvy.nic.in/',
    'nmsa': 'https://nmsa.dac.gov.in/',
    'aif': 'https://agriinfra.dac.gov.in/',
    'ahidf': 'https://ahidf.udyamimitra.in/',
    'dairy_fund': 'https://dahd.nic.in/',
    'cgtmse': 'https://www.cgtmse.in/',
    'pmegp': 'https://www.kviconline.gov.in/pmegpeportal/',
    'sfurti': 'https://msme.gov.in/',
    'msme_lean': 'https://msme.gov.in/',
    'tufs': 'https://texmin.nic.in/',
    'epcg': 'https://www.dgft.gov.in/',
    'meis': 'https://www.dgft.gov.in/',
    'msme_interest_subvention': 'https://msme.gov.in/',
    'eclgs': 'https://www.ncgtc.in/',
    'rsby': 'https://www.esic.gov.in/',
    'jsy': 'https://nhm.gov.in/',
    'pmsma': 'https://pmsma.nhp.gov.in/',
    'indradhanush': 'https://nhm.gov.in/',
    'nhm': 'https://nhm.gov.in/',
    'pm_dialysis': 'https://nhm.gov.in/',
    'nphce': 'https://nhm.gov.in/',
    'rbsk': 'https://nhm.gov.in/',
    'nikshay': 'https://nikshay.in/',
    'nmhp': 'https://nhm.gov.in/',
    // State portals - add more as needed
    'maharashtra': 'https://aaplesarkar.mahaonline.gov.in/',
    'karnataka': 'https://sevasindhu.karnataka.gov.in/',
    'tamil_nadu': 'https://www.tn.gov.in/scheme',
    'kerala': 'https://keralapsc.gov.in/',
    'uttar_pradesh': 'https://edistrict.up.gov.in/',
    'rajasthan': 'https://sso.rajasthan.gov.in/',
    'gujarat': 'https://www.digitalgujarat.gov.in/',
    'delhi': 'https://edistrict.delhigovt.nic.in/',
    'west_bengal': 'https://wb.gov.in/portal/web/guest/schemes'
};

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
    const caste_category = document.getElementById('caste_category').value;
    const age = document.getElementById('age').value;
    const min_match = document.getElementById('min_match')?.value || '95';

    // Validate
    if (!state || !income || !category || !caste_category) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    // Store user profile
    userProfile = {
        state,
        income: parseInt(income),
        category,
        caste_category,
        age: age ? parseInt(age) : 30,
        min_match_score: parseInt(min_match)
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

    // Show export controls
    const exportControls = document.getElementById('exportControls');
    if (exportControls) {
        exportControls.classList.remove('hidden');
    }

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
    
    const scoreClass = scheme.score >= 95 ? 'score-excellent' : 
                       scheme.score >= 90 ? 'score-high' : 
                       scheme.score >= 80 ? 'score-medium' : 'score-low';

    const ageStatus = scheme.age_eligible !== false ? 
        '<span class="eligibility-badge eligible"><i class="fas fa-check"></i> Age Eligible</span>' :
        '<span class="eligibility-badge not-eligible"><i class="fas fa-times"></i> Age Not Eligible</span>';

    const casteStatus = scheme.caste_eligible !== false ? 
        '<span class="eligibility-badge eligible"><i class="fas fa-check"></i> Caste Eligible</span>' :
        '<span class="eligibility-badge not-eligible"><i class="fas fa-times"></i> Caste Not Eligible</span>';

    const casteCategoryBadge = scheme.caste_category ? 
        `<span class="caste-badge caste-${scheme.caste_category.toLowerCase().replace(', ', '-')}">
            <i class="fas fa-users"></i> ${scheme.caste_category}
        </span>` : '';

    // Generate apply link
    let applyLink = generateApplyLink(scheme);
    let isValidLink = typeof applyLink === 'string' && applyLink.startsWith('http');

    card.innerHTML = `
        <div class="card-header">
            <h3>${scheme.scheme_name}</h3>
            <span class="match-percentage ${scoreClass}">${scheme.match_percentage || scheme.score + '%'}</span>
        </div>
        <p><strong>Category:</strong> ${scheme.category}</p>
        <p><strong>For:</strong> ${scheme.caste_category || 'All Categories'}</p>
        <p><strong>Benefits:</strong> ${truncateText(scheme.benefits || 'Various benefits', 100)}</p>
        <p><strong>Target:</strong> ${scheme.target_group || 'All eligible citizens'}</p>
        <div class="card-badges">
            <span class="score-badge ${scoreClass}">
                <i class="fas fa-star"></i> Match: ${scheme.score}%
            </span>
            ${casteCategoryBadge}
            ${ageStatus}
        </div>
        <div class="card-actions">
            <button class="btn-apply" onclick="${isValidLink ? `window.open('${applyLink}', '_blank')` : ''}" ${isValidLink ? '' : 'disabled style="opacity:0.6;cursor:not-allowed;"'}>
                <i class="fas fa-external-link-alt"></i> ${isValidLink ? 'Apply Now' : 'No Link'}
            </button>
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

function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function generateApplyLink(scheme) {
    const schemeName = scheme.scheme_name.toLowerCase();
    const state = scheme.state ? scheme.state.toLowerCase().replace(/\s+/g, '_') : '';

    // Map of keywords to APPLY_LINKS keys (ordered by specificity)
    const keywordMap = [
        { key: 'pm_kisan', keywords: ['pm kisan samman', 'pm kisan', 'kisan credit card', 'kcc'] },
        { key: 'pmayg', keywords: ['pmayg', 'awas yojana gramin', 'pradhan mantri awas yojana (gramin)'] },
        { key: 'pmaymis', keywords: ['pmaymis', 'awas yojana urban', 'pradhan mantri awas yojana (urban)'] },
        { key: 'ayushman_bharat', keywords: ['ayushman', 'pmjay', 'pm-jay'] },
        { key: 'pmjdy', keywords: ['jan dhan', 'pmjdy'] },
        { key: 'mudra_yojana', keywords: ['mudra', 'micro-enterprise credit card'] },
        { key: 'standup_india', keywords: ['stand up india', 'standup india'] },
        { key: 'pmsby', keywords: ['suraksha bima', 'pmsby'] },
        { key: 'pmjjby', keywords: ['jeevan jyoti', 'pmjjby'] },
        { key: 'apy', keywords: ['atal pension', 'apy'] },
        { key: 'nps', keywords: ['national pension scheme', 'nps'] },
        { key: 'ppf', keywords: ['public provident fund', 'ppf'] },
        { key: 'sukanya_samriddhi', keywords: ['sukanya samriddhi'] },
        { key: 'maandhan', keywords: ['shram yogi maandhan', 'maandhan'] },
        { key: 'swayam', keywords: ['swayam'] },
        { key: 'skill_india', keywords: ['skill india'] },
        { key: 'make_in_india', keywords: ['make in india'] },
        { key: 'digital_india', keywords: ['digital india'] },
        { key: 'startup_india', keywords: ['startup india'] },
        { key: 'ncs', keywords: ['national career service', 'ncs job portal'] },
        { key: 'mgnrega', keywords: ['mgnrega'] },
        { key: 'pmgsy', keywords: ['gram sadak', 'pmgsy'] },
        { key: 'nrlm', keywords: ['livelihood mission', 'nrlm'] },
        { key: 'nsap', keywords: ['social assistance', 'nsap'] },
        { key: 'ddugjy', keywords: ['jyoti yojana', 'ddugjy'] },
        { key: 'pmfby', keywords: ['fasal bima', 'pmfby'] },
        { key: 'nfsm', keywords: ['food security mission', 'nfsm'] },
        { key: 'pm_dhan_dhaanya', keywords: ['dhan-dhaanya', 'krishi yojana'] },
        { key: 'pmsvanidhi', keywords: ['svanidhi'] },
        { key: 'swamih_fund', keywords: ['swamih'] },
        { key: 'pm_vishwakarma', keywords: ['vishwakarma'] },
        { key: 'pm_surya_ghar', keywords: ['surya ghar'] },
        { key: 'nam_ayush', keywords: ['ayush mission'] },
        { key: 'beti_bachao', keywords: ['beti bachao'] },
        { key: 'swachh_bharat', keywords: ['swachh bharat'] },
        { key: 'ndlm', keywords: ['digital literacy mission', 'ndlm'] },
        { key: 'pm_poshan', keywords: ['pm poshan', 'mid day meal'] },
        { key: 'operation_greens', keywords: ['operation greens'] },
        { key: 'ncap', keywords: ['clean air programme', 'ncap'] },
        { key: 'pm_cares_children', keywords: ['pm-cares for children'] },
        { key: 'pmkkky', keywords: ['khanij kshetra', 'pmkkky'] },
        { key: 'bio_energy_mission', keywords: ['bio-energy mission'] },
        { key: 'nsp', keywords: ['scholarship', 'nsp', 'pragati', 'saksham', 'pre matric', 'post matric', 'merit-cum-means', 'begum hazrat mahal', 'central sector scholarship', 'aicte', 'ishan uday'] },
        { key: 'pmss', keywords: ['prime minister’s scholarship', 'pmss'] },
        { key: 'kvpy', keywords: ['kvpy'] },
        { key: 'inspire', keywords: ['inspire'] },
        { key: 'ntse', keywords: ['ntse'] },
        { key: 'cbse_sgc', keywords: ['single girl child', 'cbse'] },
        { key: 'ugc', keywords: ['ugc', 'indira gandhi', 'maulana azad', 'national fellowship', 'post graduate', 'pg professional'] },
        { key: 'vidyasaarathi', keywords: ['vidyasaarathi'] },
        { key: 'lic', keywords: ['lic golden jubilee'] },
        { key: 'hdfc_scholarship', keywords: ['hdfc parivartan'] },
        { key: 'jindal_scholarship', keywords: ['sitaram jindal'] },
        { key: 'ongc_scholarship', keywords: ['ongc foundation'] },
        { key: 'pmksy', keywords: ['sinchai', 'pmksy'] },
        { key: 'soil_health_card', keywords: ['soil health card'] },
        { key: 'enam', keywords: ['e-nam', 'enam'] },
        { key: 'pkvy', keywords: ['paramparagat krishi', 'pkvy'] },
        { key: 'rkvy', keywords: ['krishi vikas', 'rkvy'] },
        { key: 'nmsa', keywords: ['sustainable agriculture', 'nmsa'] },
        { key: 'aif', keywords: ['agriculture infrastructure fund', 'aif'] },
        { key: 'ahidf', keywords: ['animal husbandry', 'ahidf'] },
        { key: 'dairy_fund', keywords: ['dairy processing'] },
        { key: 'cgtmse', keywords: ['cgtmse'] },
        { key: 'pmegp', keywords: ['pmegp'] },
        { key: 'sfurti', keywords: ['sfurti'] },
        { key: 'msme_lean', keywords: ['lean scheme'] },
        { key: 'tufs', keywords: ['technology upgradation fund', 'tufs'] },
        { key: 'epcg', keywords: ['epcg'] },
        { key: 'meis', keywords: ['meis'] },
        { key: 'msme_interest_subvention', keywords: ['interest subvention'] },
        { key: 'eclgs', keywords: ['eclgs'] },
        { key: 'rsby', keywords: ['rsby'] },
        { key: 'jsy', keywords: ['janani suraksha', 'jsy'] },
        { key: 'pmsma', keywords: ['matritva abhiyan', 'pmsma'] },
        { key: 'indradhanush', keywords: ['indradhanush'] },
        { key: 'nhm', keywords: ['national health mission', 'nhm'] },
        { key: 'pm_dialysis', keywords: ['dialysis'] },
        { key: 'nphce', keywords: ['elderly', 'nphce'] },
        { key: 'rbsk', keywords: ['bal swasthya', 'rbsk'] },
        { key: 'nikshay', keywords: ['nikshay'] },
        { key: 'nmhp', keywords: ['mental health', 'nmhp'] },
    ];

    // Try to match scheme name to a specific link
    for (const map of keywordMap) {
        for (const kw of map.keywords) {
            if (schemeName.includes(kw)) {
                if (APPLY_LINKS[map.key]) return APPLY_LINKS[map.key];
            }
        }
    }

    // Check for state-specific portals
    if (state && APPLY_LINKS[state]) {
        return APPLY_LINKS[state];
    }

    // Check if it's a central scheme
    if (scheme.level === 'Central' || scheme.state === 'All') {
        return APPLY_LINKS.default_central;
    }

    // Default to main government schemes portal
    return APPLY_LINKS.default_central;
}

function showSchemeDetails(indexOrScheme) {
    // Handle both index number and scheme object
    let scheme;
    if (typeof indexOrScheme === 'number') {
        scheme = currentRecommendations[indexOrScheme];
    } else if (typeof indexOrScheme === 'object') {
        scheme = indexOrScheme;
    } else {
        // If it's a string (scheme name), find it in search results or recommendations
        const schemeName = indexOrScheme;
        scheme = searchResults.find(s => s.scheme_name === schemeName) || 
                 currentRecommendations.find(s => s.scheme_name === schemeName);
    }
    
    if (!scheme) {
        showToast('Scheme details not found', 'error');
        return;
    }

    const applyLink = generateApplyLink(scheme);

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
            <div class="modal-actions">
                <button class="btn-apply" onclick="window.open('${applyLink}', '_blank')" style="width: 100%; padding: 1rem; font-size: 1.1rem; margin-top: 1rem;">
                    <i class="fas fa-external-link-alt"></i> Apply for this Scheme
                </button>
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

    // Timestamp formatting
    let timestamp = '';
    if (alert.timestamp || alert.date || alert.deadline_info) {
        const dateStr = alert.timestamp || alert.date || alert.deadline_info;
        const dateObj = new Date(dateStr);
        if (!isNaN(dateObj)) {
            timestamp = `<span class="alert-timestamp"><i class='fas fa-clock'></i> ${dateObj.toLocaleString()}</span>`;
        } else if (alert.deadline_info) {
            timestamp = `<span class="alert-timestamp"><i class='fas fa-clock'></i> ${alert.deadline_info}</span>`;
        }
    }

    // Mark as read/dismiss logic
    el.className = `alert-item ${priorityClass}`;
    el.innerHTML = `
        <div class="alert-icon">
            <i class="fas fa-${icon}"></i>
        </div>
        <div class="alert-content">
            <div class="alert-header">
                <h4>${alert.scheme_name}</h4>
                <span class="alert-badge ${priorityClass}">${alert.priority || alert.alert_type}</span>
                <button class="alert-dismiss" title="Dismiss" onclick="this.closest('.alert-item').remove()"><i class="fas fa-times"></i></button>
            </div>
            <p class="alert-category"><i class="fas fa-tag"></i> ${alert.category || ''}</p>
            <p class="alert-message">${alert.message || alert.reason || ''}</p>
            ${alert.benefits ? `<p class="alert-benefits"><i class="fas fa-gift"></i> ${alert.benefits}</p>` : ''}
            ${alert.deadline_info ? `<p class="alert-deadline"><i class="fas fa-calendar-alt"></i> ${alert.deadline_info}</p>` : ''}
            ${alert.action_required ? `<p class="alert-action"><i class="fas fa-hand-point-right"></i> ${alert.action_required}</p>` : ''}
            ${timestamp}
            <button class="alert-read-btn" onclick="this.closest('.alert-item').classList.add('read');this.remove();" title="Mark as Read"><i class="fas fa-check"></i> Mark as Read</button>
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
    const incomeChangeInput = document.getElementById('incomeChangeInput');
    if (!incomeChangeInput) {
        showToast('Income change input not found', 'error');
        return;
    }
    
    const incomeChange = parseInt(incomeChangeInput.value) || 0;
    
    if (incomeChange === 0) {
        showToast('Please enter an income change amount', 'error');
        return;
    }

    const resultsDiv = document.getElementById('eligibilityResults');
    if (!resultsDiv) return;
    
    resultsDiv.innerHTML = '<div class="loading-small"><i class="fas fa-spinner fa-spin"></i> Analyzing...</div>';

    try {
        const newIncome = userProfile.income + incomeChange;
        
        const response = await fetch(`${API_URL}/eligibility`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                state: userProfile.state,
                income: userProfile.income,
                category: userProfile.category,
                age: userProfile.age || 30,
                caste_category: userProfile.caste_category || 'General',
                income_change: incomeChange
            })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                displayEligibilityResults(data.eligibility_changes, resultsDiv);
                showToast('Analysis complete!', 'success');
                return;
            } else {
                throw new Error(data.error || 'Analysis failed');
            }
        } else {
            throw new Error('Server returned an error');
        }
    } catch (error) {
        console.error('Eligibility analysis error:', error);
        
        // Provide a more helpful fallback
        const newIncome = userProfile.income + incomeChange;
        const direction = incomeChange > 0 ? 'increase' : 'decrease';
        
        resultsDiv.innerHTML = `
            <div class="eligibility-summary">
                <h4>Income Change Analysis</h4>
                <p><strong>Current Income:</strong> ₹${userProfile.income.toLocaleString()}</p>
                <p><strong>New Income:</strong> ₹${newIncome.toLocaleString()}</p>
                <p><strong>Change:</strong> ${incomeChange > 0 ? '+' : ''}₹${incomeChange.toLocaleString()} (${direction})</p>
                <div class="info-message" style="margin-top: 1rem;">
                    <i class="fas fa-info-circle"></i>
                    <p>For detailed eligibility analysis, please ensure the backend server is running.</p>
                    <p style="margin-top: 0.5rem; font-size: 0.9rem;">Error: ${error.message}</p>
                </div>
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

// ===== SEARCH FUNCTIONALITY =====
async function performSearch() {
    const query = document.getElementById('searchQuery').value;
    const state = document.getElementById('searchState').value;
    const category = document.getElementById('searchCategory').value;
    
    showLoading();
    
    try {
        const response = await fetch(`${API_URL}/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: query,
                state: state,
                category: category
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            displaySearchResults(data.schemes);
            showToast(`Found ${data.count} schemes`, 'success');
        } else {
            showToast(data.error || 'Search failed', 'error');
        }
    } catch (error) {
        showToast('Failed to search schemes', 'error');
        console.error(error);
    } finally {
        hideLoading();
    }
}

function displaySearchResults(schemes) {
    const container = document.getElementById('searchResults');
    
    // Store search results globally
    searchResults = schemes;
    
    if (schemes.length === 0) {
        container.innerHTML = '<div class="info-message"><i class="fas fa-search"></i><p>No schemes found matching your criteria</p></div>';
        return;
    }
    
    let html = `<div class="section-header"><h3>Found ${schemes.length} Schemes</h3></div><div class="scheme-grid">`;
    
    schemes.forEach((scheme, index) => {
        const applyLink = generateApplyLink(scheme);
        const isValidLink = typeof applyLink === 'string' && applyLink.startsWith('http');
        html += `
            <div class="scheme-card">
                <div class="scheme-header">
                    <h3>${scheme.scheme_name}</h3>
                    <button class="favorite-btn" onclick="toggleFavorite('${scheme.scheme_name.replace(/'/g, "\\'")}')'>
                        <i class="far fa-heart"></i>
                    </button>
                </div>
                <div class="scheme-details">
                    <p><strong>Category:</strong> ${scheme.category}</p>
                    <p><strong>State:</strong> ${scheme.state}</p>
                    <p><strong>Benefit:</strong> ${scheme.benefits || scheme.benefit || 'Various benefits'}</p>
                    <p><strong>Income Range:</strong> ${formatCurrency(scheme.min_income)} - ${formatCurrency(scheme.max_income)}</p>
                </div>
                <div class="card-actions">
                    <button class="btn-apply" onclick="${isValidLink ? `window.open('${applyLink}', '_blank')` : ''}" ${isValidLink ? '' : 'disabled style=\"opacity:0.6;cursor:not-allowed;\"'}>
                        <i class="fas fa-external-link-alt"></i> ${isValidLink ? 'Apply' : 'No Link'}
                    </button>
                    <button class="btn-details" onclick='showSearchSchemeDetails(${index})'>
                        <i class="fas fa-info-circle"></i> Details
                    </button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function showSearchSchemeDetails(index) {
    const scheme = searchResults[index];
    if (!scheme) {
        showToast('Scheme details not found', 'error');
        return;
    }
    showSchemeDetails(scheme);
}

function clearSearchFilters() {
    document.getElementById('searchQuery').value = '';
    document.getElementById('searchState').value = '';
    document.getElementById('searchCategory').value = '';
    document.getElementById('searchResults').innerHTML = '';
    searchResults = [];
}

// ===== FAVORITES FUNCTIONALITY =====
async function toggleFavorite(schemeName) {
    try {
        const response = await fetch(`${API_URL}/favorites?user_id=default_user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scheme_name: schemeName })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Added to favorites!', 'success');
            // Update UI
            const btn = event.target.closest('.favorite-btn');
            if (btn) {
                btn.innerHTML = '<i class="fas fa-heart"></i>';
                btn.style.color = '#e74c3c';
            }
        }
    } catch (error) {
        showToast('Failed to add to favorites', 'error');
    }
}

async function loadFavorites() {
    showLoading();
    
    try {
        const response = await fetch(`${API_URL}/favorites?user_id=default_user`);
        const data = await response.json();
        
        if (data.success) {
            displayFavorites(data.favorites);
            showToast(`Loaded ${data.count} favorites`, 'success');
        }
    } catch (error) {
        showToast('Failed to load favorites', 'error');
    } finally {
        hideLoading();
    }
}

function displayFavorites(favorites) {
    const container = document.getElementById('favoritesContainer');
    
    if (favorites.length === 0) {
        container.innerHTML = '<div class="info-message"><i class="fas fa-heart"></i><p>No favorites yet</p></div>';
        return;
    }
    
    let html = `<div class="scheme-grid">`;
    
    favorites.forEach(schemeName => {
        html += `
            <div class="scheme-card">
                <div class="scheme-header">
                    <h3>${schemeName}</h3>
                    <button class="favorite-btn active" onclick="removeFavorite('${schemeName}')">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
                <button class="btn-primary" onclick="showSchemeDetails('${schemeName}')">
                    View Details
                </button>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

async function removeFavorite(schemeName) {
    try {
        const response = await fetch(`${API_URL}/favorites?user_id=default_user`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scheme_name: schemeName })
        });
        
        if (response.ok) {
            showToast('Removed from favorites', 'success');
            loadFavorites();
        }
    } catch (error) {
        showToast('Failed to remove from favorites', 'error');
    }
}

async function exportFavorites() {
    showToast('Exporting favorites...', 'info');
    // Implementation for export
}

// ===== APPLICATION TRACKER =====
async function loadApplications() {
    showLoading();
    
    try {
        const response = await fetch(`${API_URL}/applications?user_id=default_user`);
        const data = await response.json();
        
        if (data.success) {
            displayApplications(data.applications);
            updateTrackerStats(data.applications);
            showToast(`Loaded ${data.count} applications`, 'success');
        }
    } catch (error) {
        showToast('Failed to load applications', 'error');
    } finally {
        hideLoading();
    }
}

function displayApplications(applications) {
    const container = document.getElementById('applicationsContainer');
    
    if (applications.length === 0) {
        container.innerHTML = '<div class="info-message"><i class="fas fa-clipboard-list"></i><p>No applications tracked</p></div>';
        return;
    }
    
    let html = '';
    
    applications.forEach(app => {
        const statusClass = app.status.toLowerCase().replace(' ', '-');
        html += `
            <div class="application-card ${statusClass}">
                <h4>${app.scheme_name}</h4>
                <div class="app-details">
                    <p><strong>Status:</strong> <span class="status-badge ${statusClass}">${app.status}</span></p>
                    ${app.applied_date ? `<p><strong>Applied:</strong> ${app.applied_date}</p>` : ''}
                    ${app.notes ? `<p><strong>Notes:</strong> ${app.notes}</p>` : ''}
                </div>
                <div class="app-actions">
                    <select onchange="updateApplicationStatus('${app.scheme_name}', this.value)">
                        <option value="planned" ${app.status === 'planned' ? 'selected' : ''}>Planned</option>
                        <option value="applied" ${app.status === 'applied' ? 'selected' : ''}>Applied</option>
                        <option value="pending" ${app.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="approved" ${app.status === 'approved' ? 'selected' : ''}>Approved</option>
                        <option value="rejected" ${app.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                    </select>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function updateTrackerStats(applications) {
    const stats = {
        planned: 0,
        applied: 0,
        pending: 0,
        approved: 0
    };
    
    applications.forEach(app => {
        if (stats[app.status] !== undefined) {
            stats[app.status]++;
        }
    });
    
    document.getElementById('trackerPlanned').textContent = stats.planned;
    document.getElementById('trackerApplied').textContent = stats.applied;
    document.getElementById('trackerPending').textContent = stats.pending;
    document.getElementById('trackerApproved').textContent = stats.approved;
}

async function updateApplicationStatus(schemeName, newStatus) {
    try {
        const response = await fetch(`${API_URL}/applications?user_id=default_user`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                scheme_name: schemeName,
                status: newStatus
            })
        });
        
        if (response.ok) {
            showToast('Status updated!', 'success');
            loadApplications();
        }
    } catch (error) {
        showToast('Failed to update status', 'error');
    }
}

function showAddApplicationModal() {
    showToast('Feature coming soon!', 'info');
}

// ===== STATISTICS FUNCTIONALITY =====
async function loadStatistics() {
    showLoading();
    
    try {
        const response = await fetch(`${API_URL}/statistics`);
        const data = await response.json();
        
        if (data.success) {
            displayStatistics(data.statistics);
            showToast('Statistics loaded!', 'success');
        }
    } catch (error) {
        showToast('Failed to load statistics', 'error');
    } finally {
        hideLoading();
    }
}

function displayStatistics(stats) {
    const container = document.getElementById('statisticsContainer');
    
    let html = `
        <div class="stats-overview">
            <div class="stat-card large">
                <i class="fas fa-file-alt"></i>
                <h3>${stats.total_schemes}</h3>
                <p>Total Schemes</p>
            </div>
            <div class="stat-card large active">
                <i class="fas fa-check-circle"></i>
                <h3>${stats.active_schemes}</h3>
                <p>Active Schemes</p>
            </div>
            <div class="stat-card large">
                <i class="fas fa-pause-circle"></i>
                <h3>${stats.inactive_schemes}</h3>
                <p>Inactive Schemes</p>
            </div>
        </div>
        
        <div class="stats-section">
            <h3><i class="fas fa-chart-pie"></i> Top Categories</h3>
            <div class="category-stats">
                ${stats.top_categories.map(([cat, count]) => `
                    <div class="stat-bar">
                        <span class="stat-label">${cat}</span>
                        <div class="stat-progress">
                            <div class="stat-fill" style="width: ${(count/stats.active_schemes)*100}%"></div>
                        </div>
                        <span class="stat-value">${count}</span>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="stats-section">
            <h3><i class="fas fa-map-marker-alt"></i> Schemes by State</h3>
            <div class="stats-grid">
                ${Object.entries(stats.states).slice(0, 10).map(([state, count]) => `
                    <div class="stat-item">
                        <strong>${state}</strong>
                        <span>${count} schemes</span>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="stats-section">
            <h3><i class="fas fa-rupee-sign"></i> Income Range Distribution</h3>
            <div class="stats-grid">
                ${Object.entries(stats.income_ranges).map(([range, count]) => `
                    <div class="stat-item">
                        <strong>${range}</strong>
                        <span>${count} schemes</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// ===== EXPORT FUNCTIONALITY =====
async function exportRecommendations(format = 'csv') {
    if (currentRecommendations.length === 0) {
        showToast('No recommendations to export', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/export`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                schemes: currentRecommendations,
                format: format
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (format === 'csv') {
                downloadCSV(data.data, 'scheme_recommendations.csv');
            } else {
                downloadJSON(data.data, 'scheme_recommendations.json');
            }
            showToast('Recommendations exported!', 'success');
        }
    } catch (error) {
        showToast('Export failed', 'error');
    }
}

function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

function downloadJSON(jsonData, filename) {
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
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
window.performSearch = performSearch;
window.clearSearchFilters = clearSearchFilters;
window.toggleFavorite = toggleFavorite;
window.loadFavorites = loadFavorites;
window.removeFavorite = removeFavorite;
window.exportFavorites = exportFavorites;
window.loadApplications = loadApplications;
window.updateApplicationStatus = updateApplicationStatus;
window.showAddApplicationModal = showAddApplicationModal;
window.loadStatistics = loadStatistics;
window.exportRecommendations = exportRecommendations;

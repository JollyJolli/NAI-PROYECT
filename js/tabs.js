// Cache DOM elements
const tabs = document.querySelectorAll('.nav-tabs a');
const tabContents = document.querySelectorAll('.tab-content');

// Tab switching functionality
function switchTab(e) {
    e.preventDefault();
    const targetId = e.target.closest('a').getAttribute('href').slice(1);
    
    // Update active states
    tabs.forEach(tab => tab.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    e.target.closest('a').classList.add('active');
    document.getElementById(targetId).classList.add('active');
    
    // Load tab-specific content
    loadTabContent(targetId);
}

// Load content for specific tabs
async function loadTabContent(tabId) {
    try {
        const response = await fetch(`data/${tabId}.json`);
        const data = await response.json();
        
        switch(tabId) {
            case 'sobrenosotros':
                loadAboutContent(data);
                break;
            case 'calendario':
                loadCalendarContent(data);
                break;
            case 'extra':
                loadExtraContent(data);
                break;
        }
    } catch (error) {
        console.error(`Error loading ${tabId} content:`, error);
    }
}

// Load About Us content
function loadAboutContent(data) {
    const aboutSection = document.querySelector('#sobrenosotros');
    
    // Who We Are section
    aboutSection.querySelector('.section-intro .content').innerHTML = `
        <p>${data.whoWeAre.content}</p>
    `;
    
    // What We Offer section
    const servicesList = data.whatWeOffer.services
        .map(service => `<li><i class="fas fa-check"></i> ${service}</li>`)
        .join('');
    aboutSection.querySelector('.services .content').innerHTML = `
        <ul class="services-list">${servicesList}</ul>
    `;
    
    // Team section
    const teamGrid = aboutSection.querySelector('.team-grid');
    teamGrid.innerHTML = data.team
        .map(member => `
            <div class="team-member card">
                <img src="${member.photo}" alt="${member.name}">
                <h3>${member.name}</h3>
                <p class="role">${member.role}</p>
                <div class="social-links">
                    ${Object.entries(member.social)
                        .map(([platform, handle]) => `
                            <a href="https://${platform}.com/${handle}" class="social-link">
                                <i class="fab fa-${platform}"></i>
                            </a>
                        `)
                        .join('')}
                </div>
            </div>
        `)
        .join('');
}

// Load Calendar content
function loadCalendarContent(data) {
    const seriesGrid = document.querySelector('.series-grid');
    seriesGrid.innerHTML = data.series
        .map(series => `
            <div class="series-card" style="border-left: 4px solid ${series.color}">
                <div class="series-header">
                    <i class="fas ${series.icon} series-icon"></i>
                    <h3>${series.name}</h3>
                </div>
                <div class="races-list">
                    ${series.races.map(race => `
                        <div class="race-item">
                            <h4>${race.name}</h4>
                            <p><i class="fas fa-flag-checkered"></i> Ronda ${race.round}</p>
                            <p><i class="fas fa-calendar"></i> ${new Date(race.date).toLocaleDateString()}</p>
                            <p><i class="fas fa-map-marker-alt"></i> ${race.track}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `)
        .join('');
}

// Load Extra content
function loadExtraContent(data) {
    const extraSection = document.querySelector('#extra');
    
    // FAQ section
    const faqGrid = extraSection.querySelector('.faq-grid');
    faqGrid.innerHTML = data.faq
        .map(item => `
            <div class="faq-item">
                <h3 class="faq-question"><i class="fas fa-question-circle"></i> ${item.question}</h3>
                <p class="faq-answer">${item.answer}</p>
            </div>
        `)
        .join('');
    
    // Useful links section
    const linksGrid = extraSection.querySelector('.social-grid');
    linksGrid.innerHTML = data.usefulLinks
        .map(link => `
            <a href="${link.url}" class="btn">
                <i class="fas ${link.icon}"></i> ${link.name}
            </a>
        `)
        .join('');
}

// Event listeners
tabs.forEach(tab => tab.addEventListener('click', switchTab));

// Load initial tab content
document.addEventListener('DOMContentLoaded', () => {
    // Load content for the initial active tab
    const activeTab = document.querySelector('.nav-tabs a.active');
    if (activeTab) {
        const targetId = activeTab.getAttribute('href').slice(1);
        loadTabContent(targetId);
    }
});

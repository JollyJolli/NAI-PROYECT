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

// Variable global para mantener los datos del calendario
let calendarData = null;

// Load Calendar content
function loadCalendarContent(data) {
    // Guardar datos en variable global
    calendarData = data;
    
    // Update stats
    updateCalendarStats(data.stats);
    // Initialize filters
    initializeFilters(data.filters);
    // Load series grid
    updateSeriesGrid(data.series);
    // Load featured events
    updateFeaturedEvents(data.series);

    // Setup search and filter handlers
    setupSearchAndFilters();
}

function updateCalendarStats(stats) {
    const statValues = document.querySelectorAll('.stat-value');
    statValues[0].textContent = stats.totalRaces;
    statValues[1].textContent = stats.activeSeries;
    statValues[2].textContent = stats.uniqueTracks;
}

function initializeFilters(filters) {
    const monthFilter = document.getElementById('month-filter');
    const trackFilter = document.getElementById('track-filter');

    // Populate month filter
    monthFilter.innerHTML = `
        <option value="all">Todos los Meses</option>
        ${filters.months.map(month => `
            <option value="${month.toLowerCase()}">${month}</option>
        `).join('')}
    `;

    // Populate track filter
    trackFilter.innerHTML = `
        <option value="all">Todos los Circuitos</option>
        ${filters.tracks.map(track => `
            <option value="${track.toLowerCase()}">${track}</option>
        `).join('')}
    `;
}

function updateSeriesGrid(series) {
    const seriesGrid = document.querySelector('.series-grid');
    seriesGrid.innerHTML = series
        .map(series => `
            <div class="series-card" style="border-left: 4px solid ${series.color}" data-series="${series.id}">
                <div class="series-header">
                    <i class="fas ${series.icon} series-icon"></i>
                    <h3>${series.name}</h3>
                </div>
                <p class="series-description">${series.description}</p>
                <div class="races-list">
                    ${series.races.map(race => `
                        <div class="race-item" data-track="${race.track.toLowerCase()}" data-date="${race.date}">
                            <div class="race-header">
                                <h4>${race.name}</h4>
                                ${race.featured ? '<span class="featured-badge"><i class="fas fa-star"></i> Destacado</span>' : ''}
                            </div>
                            <div class="race-details">
                                <p><i class="fas fa-flag-checkered"></i> Ronda ${race.round}</p>
                                <p><i class="fas fa-calendar"></i> ${formatDate(race.date)}</p>
                                <p><i class="fas fa-map-marker-alt"></i> ${race.track}</p>
                                <p><i class="fas fa-location-dot"></i> ${race.location}</p>
                                ${race.duration ? 
                                    `<p><i class="fas fa-clock"></i> ${race.duration}</p>` :
                                    `<p><i class="fas fa-route"></i> ${race.distance} (${race.laps} vueltas)</p>`
                                }
                                <p><i class="fas fa-gauge-high"></i> Dificultad: ${'★'.repeat(race.difficulty)}${'☆'.repeat(5-race.difficulty)}</p>
                                <p><i class="fas fa-cloud"></i> Clima: ${race.weather}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `)
        .join('');
}

function updateFeaturedEvents(series) {
    const featuredGrid = document.querySelector('.featured-grid');
    const featuredRaces = series
        .flatMap(s => s.races.filter(r => r.featured)
        .map(r => ({...r, series: s})));

    featuredGrid.innerHTML = featuredRaces
        .map(race => `
            <div class="featured-card">
                <img src="data/things/LOGO.png" alt="${race.name}">
                <div class="featured-info">
                    <h3>${race.name}</h3>
                    <p><i class="fas ${race.series.icon}"></i> ${race.series.name}</p>
                    <p><i class="fas fa-calendar"></i> ${formatDate(race.date)}</p>
                </div>
            </div>
        `)
        .join('');
}

function setupSearchAndFilters() {
    const searchInput = document.getElementById('race-search');
    const seriesFilter = document.getElementById('series-filter');
    const monthFilter = document.getElementById('month-filter');
    const trackFilter = document.getElementById('track-filter');
    const viewToggleButtons = document.querySelectorAll('.view-toggle button');

    // Remover eventos anteriores si existen
    searchInput.removeEventListener('input', handleSearch);
    seriesFilter.removeEventListener('change', handleSearch);
    monthFilter.removeEventListener('change', handleSearch);
    trackFilter.removeEventListener('change', handleSearch);

    // Search handler
    searchInput.addEventListener('input', handleSearch);

    // Filter handlers
    seriesFilter.addEventListener('change', handleSearch);
    monthFilter.addEventListener('change', handleSearch);
    trackFilter.addEventListener('change', handleSearch);

    // View toggle handlers
    // View toggle handlers
    viewToggleButtons.forEach(button => {
        button.removeEventListener('click', handleViewToggle);
        button.addEventListener('click', handleViewToggle);
    });
}

function handleViewToggle(e) {
    const viewToggleButtons = document.querySelectorAll('.view-toggle button');
    viewToggleButtons.forEach(b => b.classList.remove('active'));
    e.currentTarget.classList.add('active');
    
    const view = e.currentTarget.dataset.view;
    const seriesGrid = document.querySelector('.series-grid');
    
    if (view === 'list') {
        seriesGrid.classList.add('list-view');
        // Ajustar estilos para vista de lista
        seriesGrid.style.gridTemplateColumns = '1fr';
    } else {
        seriesGrid.classList.remove('list-view');
        // Restaurar vista de grid
        seriesGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
    }
}

// Función manejadora de búsqueda y filtros
function handleSearch() {
    if (!calendarData) return;
    filterRaces();
}

// Función para filtrar las carreras
function filterRaces() {
    const searchTerm = document.getElementById('race-search').value.toLowerCase();
    const selectedSeries = document.getElementById('series-filter').value;
    const selectedMonth = document.getElementById('month-filter').value;
    const selectedTrack = document.getElementById('track-filter').value;

    // Crear una copia profunda de los datos originales
    const filteredData = JSON.parse(JSON.stringify(calendarData));

    const filteredSeries = filteredData.series.filter(series => {
        if (selectedSeries !== 'all' && series.id !== selectedSeries) return false;

        const filteredRaces = series.races.filter(race => {
            const raceDate = new Date(race.date);
            const raceMonth = raceDate.toLocaleString('es', { month: 'long' }).toLowerCase();
            
            return (
                (searchTerm === '' || 
                    race.name.toLowerCase().includes(searchTerm) ||
                    race.track.toLowerCase().includes(searchTerm) ||
                    race.location.toLowerCase().includes(searchTerm)) &&
                (selectedMonth === 'all' || raceMonth === selectedMonth) &&
                (selectedTrack === 'all' || race.track.toLowerCase().includes(selectedTrack))
            );
        });

        series.races = filteredRaces;
        return filteredRaces.length > 0;
    });

    updateSeriesGrid(filteredSeries);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('es', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
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

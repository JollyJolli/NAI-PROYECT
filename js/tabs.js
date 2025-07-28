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
        let data;
        
        if (tabId === 'calendario') {
            // Cargar datos del calendario desde Google Sheets API
            data = await loadCalendarFromAPI();
        } else {
            // Cargar otros datos desde archivos JSON locales
            const response = await fetch(`data/${tabId}.json`);
            data = await response.json();
        }
        
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
            case 'contacto':
                loadContactContent(data);
                break;
        }
    } catch (error) {
        console.error(`Error loading ${tabId} content:`, error);
    }
}

// Función para cargar datos del calendario desde Google Sheets API
async function loadCalendarFromAPI() {
    try {
        const response = await fetch('https://api.sheetbest.com/sheets/cf4f265a-7a01-4f7b-87ca-ca52ed1425cc');
        const flatData = await response.json();
        
        // Transformar datos planos a estructura anidada
        return transformCalendarData(flatData);
    } catch (error) {
        console.error('Error loading calendar from API:', error);
        // Fallback a datos locales si falla la API
        const response = await fetch('data/calendario.json');
        return await response.json();
    }
}

// Función para transformar datos planos del CSV a estructura anidada
function transformCalendarData(flatData) {
    const seriesMap = new Map();
    const months = new Set();
    const tracks = new Set();
    const difficulties = new Set();
    const types = new Set();
    
    // Valores por defecto
    const defaults = {
        icon: 'fa-car-racing',
        color: '#ff0000',
        description: 'Serie de carreras',
        status: 'upcoming',
        trackType: 'permanent',
        difficulty: 3,
        weather: 'variable',
        distance: 'TBD',
        location: 'Por definir'
    };
    
    // Procesar cada fila del CSV
    flatData.forEach(row => {
        const serieId = row.Serie_ID || 'unknown';
        
        // Crear serie si no existe
        if (!seriesMap.has(serieId)) {
            seriesMap.set(serieId, {
                id: serieId,
                name: row.Serie_Nombre || 'Serie Sin Nombre',
                icon: row.Serie_Icono || defaults.icon,
                color: row.Serie_Color || defaults.color,
                description: row.Serie_Descripcion || defaults.description,
                races: []
            });
        }
        
        // Agregar carrera a la serie
        const race = {
            id: row.Carrera_ID || `race-${Date.now()}`,
            name: row.Carrera_Nombre || 'Carrera Sin Nombre',
            round: parseInt(row.Ronda) || 1,
            date: row.Fecha_Hora || 'Fecha por Definir',
            track: row.Circuito || 'Circuito Por Definir',
            location: row.Ubicacion || defaults.location,
            distance: row.Distancia || defaults.distance,
            featured: row.Destacada === 'TRUE' || row.Destacada === true || row.Destacada === 'true',
            status: row.Estado || defaults.status,
            trackType: row.Tipo_Circuito || defaults.trackType,
            difficulty: parseInt(row.Dificultad) || defaults.difficulty,
            weather: row.Clima || defaults.weather
        };
        
        // Agregar vueltas o duración según corresponda
        if (row.Vueltas && row.Vueltas !== '' && !isNaN(parseInt(row.Vueltas))) {
            race.laps = parseInt(row.Vueltas);
        }
        if (row.Duracion && row.Duracion !== '') {
            race.duration = row.Duracion;
        }
        
        seriesMap.get(serieId).races.push(race);
        
        // Recopilar datos para filtros (solo si los datos son válidos)
        if (race.date && race.date !== '') {
            try {
                const raceDate = new Date(race.date);
                if (!isNaN(raceDate.getTime())) {
                    const monthName = raceDate.toLocaleString('es', { month: 'long' });
                    months.add(monthName.charAt(0).toUpperCase() + monthName.slice(1));
                }
            } catch (e) {
                console.warn('Fecha inválida:', race.date);
            }
        }
        
        if (race.track && race.track !== '') {
            tracks.add(race.track);
        }
        if (!isNaN(race.difficulty)) {
            difficulties.add(race.difficulty);
        }
        if (race.trackType && race.trackType !== '') {
            types.add(race.trackType);
        }
    });
    
    const series = Array.from(seriesMap.values());
    
    // Calcular estadísticas
    const totalRaces = flatData.length;
    const activeSeries = series.length;
    const uniqueTracks = tracks.size;
    
    return {
        series: series,
        stats: {
            totalRaces: totalRaces,
            activeSeries: activeSeries,
            uniqueTracks: uniqueTracks
        },
        filters: {
            months: Array.from(months).sort(),
            tracks: Array.from(tracks).sort(),
            difficulties: Array.from(difficulties).sort(),
            types: Array.from(types).sort()
        }
    };
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
    let teamHTML = '';
    
    // Country to flag emoji mapping
    const countryFlags = {
        'Alemania': '🇩🇪',
        'México': '🇲🇽',
        'Venezuela': '🇻🇪',
        'Perú': '🇵🇪',
        'Colombia': '🇨🇴',
        'Chile': '🇨🇱',
        'Uruguay': '🇺🇾',
        'Argentina': '🇦🇷'
    };
    
    Object.entries(data.team).forEach(([key, department]) => {
        teamHTML += `<div class="department-section">`;
        teamHTML += `<h2 class="department-title">${department.title}</h2>`;
        
        // Check if this is commentators or marketing section for list format
        if (key === 'commentators' || key === 'marketing') {
            teamHTML += `<div class="department-members-list">`;
            
            department.members.forEach(member => {
                let socialLinksHTML = '';
                
                if (member.socialNetworks && member.socialNetworks.length > 0) {
                    socialLinksHTML = '<div class="social-links-compact">';
                    member.socialNetworks.forEach(social => {
                        socialLinksHTML += `
                            <a href="${social.url}" class="social-link-compact" title="${social.platform}" target="_blank" rel="noopener noreferrer">
                                <i class="${social.icon}"></i>
                            </a>
                        `;
                    });
                    socialLinksHTML += '</div>';
                }
                
                const flag = countryFlags[member.country] || '🌍';
                
                teamHTML += `
                    <div class="team-member-compact">
                        <img src="${member.photo}" alt="${member.name}" loading="lazy" class="member-photo-compact">
                        <div class="member-info-compact">
                            <h3>${member.name} ${flag}</h3>
                            ${socialLinksHTML}
                        </div>
                    </div>
                `;
            });
            
            teamHTML += `</div>`;
        } else {
            // Keep original format for management and development
            teamHTML += `<div class="department-members">`;
            
            department.members.forEach(member => {
                let socialLinksHTML = '';
                
                if (member.socialNetworks && member.socialNetworks.length > 0) {
                    socialLinksHTML = '<div class="social-links">';
                    member.socialNetworks.forEach(social => {
                        socialLinksHTML += `
                            <a href="${social.url}" class="social-link" title="${social.platform}" target="_blank" rel="noopener noreferrer">
                                <i class="${social.icon}"></i>
                            </a>
                        `;
                    });
                    socialLinksHTML += '</div>';
                }
                
                const flag = countryFlags[member.country] || '🌍';
                
                teamHTML += `
                    <div class="team-member">
                        <img src="${member.photo}" alt="${member.name}" loading="lazy">
                        <h3>${member.name} ${flag}</h3>
                        <p class="role">${member.role || 'Miembro del Equipo'}</p>
                        ${socialLinksHTML}
                    </div>
                `;
            });
            
            teamHTML += `</div>`;
        }
        
        teamHTML += `</div>`;
    });
    
    teamGrid.innerHTML = teamHTML;
    
    // Sponsors section
    const sponsorsGrid = aboutSection.querySelector('.sponsors-grid');
    if (data.sponsors && data.sponsors.list) {
        sponsorsGrid.innerHTML = data.sponsors.list
            .map(sponsor => `
                <div class="sponsor-card">
                    <a href="${sponsor.website}" target="_blank" rel="noopener noreferrer">
                        <img src="${sponsor.logo}" alt="${sponsor.name}" loading="lazy">
                        <div class="sponsor-info">
                            <h3>${sponsor.name}</h3>
                            <p>${sponsor.description}</p>
                        </div>
                    </a>
                </div>
            `)
            .join('');
    }
    
    // Contact methods section
    if (data.contactMethods && data.contactMethods.length > 0) {
        const contactMethodsGrid = document.querySelector('.contact-methods-grid');
        if (contactMethodsGrid) {
            contactMethodsGrid.innerHTML = data.contactMethods.map(method => `
                <div class="contact-method-card">
                    <div class="contact-icon">
                        <i class="${method.icon}"></i>
                    </div>
                    <div class="contact-info">
                        <h4>${method.name}</h4>
                        <p>${method.description}</p>
                        <a href="${method.url}" target="_blank" rel="noopener noreferrer" class="contact-link">
                            Contactar
                        </a>
                    </div>
                </div>
            `).join('');
        }
    }
    
    // Social networks section
    if (data.socialNetworks && data.socialNetworks.length > 0) {
        const socialNetworksGrid = document.querySelector('.social-networks-grid');
        if (socialNetworksGrid) {
            socialNetworksGrid.innerHTML = data.socialNetworks.map(network => `
                <div class="social-network-card">
                    <div class="social-header">
                        <i class="${network.icon}"></i>
                        <div class="social-info">
                            <h4>${network.name}</h4>
                            <span class="social-username">${network.username}</span>
                        </div>
                    </div>
                    <div class="social-stats">
                        <span class="followers">${network.followers} seguidores</span>
                    </div>
                    <a href="${network.url}" target="_blank" rel="noopener noreferrer" class="social-follow-btn">
                        <i class="fas fa-plus"></i> Seguir
                    </a>
                </div>
            `).join('');
        }
    }
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
    const isListView = seriesGrid.classList.contains('list-view');
    
    seriesGrid.innerHTML = series
        .map(series => `
            <div class="series-card" style="border-left: 4px solid ${series.color}" data-series="${series.id}">
                <div class="series-header">
                    <i class="fas ${series.icon} series-icon"></i>
                    <h3>${series.name}</h3>
                </div>
                ${!isListView ? `<p class="series-description">${series.description}</p>` : ''}
                <div class="races-list">
                    ${series.races.map(race => `
                        <div class="race-item" data-track="${race.track.toLowerCase()}" data-date="${race.date}">
                            <div class="race-header">
                                <h4>${race.name}</h4>
                                ${race.featured ? '<span class="featured-badge"><i class="fas fa-star"></i> Destacado</span>' : ''}
                            </div>
                            <div class="race-details">
                                ${isListView ? `
                                    <div class="race-primary-info">
                                        <p class="race-date"><i class="fas fa-calendar"></i> ${formatDateShort(race.date)}</p>
                                        <p class="race-track"><i class="fas fa-map-marker-alt"></i> ${race.track}</p>
                                        <p class="race-round"><i class="fas fa-flag-checkered"></i> R${race.round}</p>
                                    </div>
                                ` : `
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
                                `}
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
    const eventFilter = document.getElementById('event-filter');
    const viewToggleButtons = document.querySelectorAll('.view-toggle button');

    // Remover eventos anteriores si existen
    searchInput.removeEventListener('input', handleSearch);
    seriesFilter.removeEventListener('change', handleSearch);
    monthFilter.removeEventListener('change', handleSearch);
    trackFilter.removeEventListener('change', handleSearch);
    eventFilter.removeEventListener('change', handleSearch);

    // Search handler
    searchInput.addEventListener('input', handleSearch);

    // Filter handlers
    seriesFilter.addEventListener('change', handleSearch);
    monthFilter.addEventListener('change', handleSearch);
    trackFilter.addEventListener('change', handleSearch);
    eventFilter.addEventListener('change', handleSearch);
    
    // Set default to show only next race per league
    eventFilter.value = 'next-only';
    handleSearch();

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
    
    // Recargar el contenido para aplicar los cambios de vista
    if (calendarData) {
        filterRaces();
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
    const selectedEvent = document.getElementById('event-filter').value;

    // Crear una copia profunda de los datos originales
    const filteredData = JSON.parse(JSON.stringify(calendarData));

    const filteredSeries = filteredData.series.filter(series => {
        if (selectedSeries !== 'all' && series.id !== selectedSeries) return false;

        let filteredRaces = series.races.filter(race => {
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

        // Aplicar filtro de eventos
        if (selectedEvent === 'next-only') {
            // Mostrar solo la próxima carrera (la más cercana en el tiempo)
            const now = new Date();
            const upcomingRaces = filteredRaces
                .filter(race => new Date(race.date) > now)
                .sort((a, b) => new Date(a.date) - new Date(b.date));
            filteredRaces = upcomingRaces.length > 0 ? [upcomingRaces[0]] : [];
        } else if (selectedEvent === 'featured') {
            // Mostrar solo eventos destacados
            filteredRaces = filteredRaces.filter(race => race.featured);
        }
        // Si selectedEvent === 'all', no se aplica filtro adicional

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

function formatDateShort(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('es', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Load Extra content
function loadExtraContent(data) {
    const extraSection = document.querySelector('#extra');
    
    // Leagues Discord section
    const leaguesGrid = extraSection.querySelector('.leagues-grid');
    if (data.leagues) {
        leaguesGrid.innerHTML = data.leagues
            .map(league => {
                const socialIcons = Object.entries(league.social)
                    .map(([platform, url]) => {
                        const iconMap = {
                            'twitter': 'fab fa-twitter',
                            'instagram': 'fab fa-instagram',
                            'youtube': 'fab fa-youtube',
                            'discord': 'fab fa-discord',
                            'facebook': 'fab fa-facebook',
                            'twitch': 'fab fa-twitch',
                            'reddit': 'fab fa-reddit',
                            'tiktok': 'fab fa-tiktok',
                            'linkedin': 'fab fa-linkedin',
                            'telegram': 'fab fa-telegram',
                            'whatsapp': 'fab fa-whatsapp',
                            'spotify': 'fab fa-spotify'
                        };
                        const icon = iconMap[platform] || 'fas fa-link';
                        return `
                            <a href="${url}" target="_blank" rel="noopener noreferrer" class="social-link" title="${platform}">
                                <i class="${icon}"></i>
                            </a>
                        `;
                    })
                    .join('');
                
                return `
                    <div class="league-card">
                        <div class="league-header">
                            <img src="${league.logo}" alt="${league.name}" class="league-logo">
                            <h3>${league.name}</h3>
                        </div>
                        <div class="league-discord">
                            <a href="${league.discord}" target="_blank" rel="noopener noreferrer" class="discord-btn">
                                <i class="fab fa-discord"></i> Únete al Discord
                            </a>
                        </div>
                        <div class="league-social">
                            ${socialIcons}
                        </div>
                    </div>
                `;
            })
            .join('');
    }
    
    // Useful links section
    const linksGrid = extraSection.querySelector('.social-grid');
    if (data.usefulLinks) {
        linksGrid.innerHTML = data.usefulLinks
            .map(link => `
                <a href="${link.url}" class="btn" target="_blank" rel="noopener noreferrer">
                    <i class="fas ${link.icon}"></i> ${link.name}
                </a>
            `)
            .join('');
    }
}

// Load Contact content
function loadContactContent(data) {
    const contactSection = document.getElementById('contacto');
    if (!contactSection) return;

    contactSection.innerHTML = `
        <div class="broadcast-intro">
            <h2>${data.introduction.title}</h2>
            <p>${data.introduction.description}</p>
        </div>
        
        <div class="broadcast-form-container">
            <form id="broadcast-request-form" class="broadcast-form">
                ${data.form.steps.map((step, stepIndex) => `
                    <div class="form-step">
                        <h3>${step.title}</h3>
                        <div class="form-fields">
                            ${step.fields.map(field => {
                                if (field.type === 'select') {
                                    return `
                                        <div class="form-group">
                                            <label for="${field.name}">${field.label}${field.required ? ' *' : ''}</label>
                                            <select id="${field.name}" name="${field.name}" ${field.required ? 'required' : ''}>
                                                <option value="">${field.placeholder || 'Seleccionar...'}</option>
                                                ${field.options.map(option => `<option value="${option}">${option}</option>`).join('')}
                                            </select>
                                        </div>
                                    `;
                                } else if (field.type === 'textarea') {
                                    return `
                                        <div class="form-group">
                                            <label for="${field.name}">${field.label}${field.required ? ' *' : ''}</label>
                                            <textarea id="${field.name}" name="${field.name}" placeholder="${field.placeholder}" rows="4" ${field.required ? 'required' : ''}></textarea>
                                        </div>
                                    `;
                                } else if (field.type === 'radio') {
                                    return `
                                        <div class="form-group radio-group">
                                            <label class="group-label">${field.label}${field.required ? ' *' : ''}</label>
                                            <div class="radio-options">
                                                ${field.options.map(option => `
                                                    <label class="radio-option">
                                                        <input type="radio" name="${field.name}" value="${option.value}" ${field.required ? 'required' : ''}>
                                                        <span class="radio-label">${option.label}</span>
                                                    </label>
                                                `).join('')}
                                            </div>
                                        </div>
                                    `;
                                } else {
                                    return `
                                        <div class="form-group">
                                            <label for="${field.name}">${field.label}${field.required ? ' *' : ''}</label>
                                            <input type="${field.type}" id="${field.name}" name="${field.name}" placeholder="${field.placeholder}" ${field.required ? 'required' : ''}>
                                        </div>
                                    `;
                                }
                            }).join('')}
                        </div>
                    </div>
                `).join('')}
                
                <div class="form-disclaimer">
                    <p><em>${data.form.disclaimer}</em></p>
                </div>
                
                <button type="submit" class="submit-btn">
                    <i class="fas fa-paper-plane"></i> Enviar Solicitud
                </button>
            </form>
        </div>
    `;
    
    // Setup form submission handler
    const form = document.getElementById('broadcast-request-form');
    if (form) {
        form.addEventListener('submit', handleBroadcastFormSubmission);
    }
}

// Handle broadcast form submission
function handleBroadcastFormSubmission(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Create email body
    const emailBody = `
SOLICITUD DE BROADCAST - SimRacingAmericaTV

=== INFORMACIÓN BÁSICA ===
Nombre Completo: ${data.fullname}
Email: ${data.email}
Simulador: ${data.simulator}

=== SERVICIOS REQUERIDOS ===
Tipo de Servicio: ${data.services}

=== DETALLES DEL EVENTO ===
Nombre del Evento/Serie: ${data.eventName}
Sitio Web/Foro: ${data.website || 'No especificado'}

Sobre el Evento:
${data.aboutEvent}

Cronograma Provisional:
${data.schedule}

---
Solicitud enviada desde: ${window.location.href}
Fecha: ${new Date().toLocaleString()}
    `;
    
    // Create mailto link
    const subject = encodeURIComponent(`Solicitud de Broadcast - ${data.eventName}`);
    const body = encodeURIComponent(emailBody);
    const mailtoLink = `mailto:simracingamericatv@gmail.com?subject=${subject}&body=${body}`;
    
    // Open email client
    window.location.href = mailtoLink;
    
    // Show success message
    const submitBtn = e.target.querySelector('.submit-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-check"></i> Solicitud enviada';
    submitBtn.disabled = true;
    
    setTimeout(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        e.target.reset();
    }, 3000);
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

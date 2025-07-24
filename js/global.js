// Global state
const state = {
    isLive: false,
    nextRace: null,
    content: {
        inicio: null,
        sobrenosotros: null,
        calendario: null,
        extra: null
    }
};

// Load JSON data
async function loadContent() {
    try {
        const modules = ['inicio', 'sobrenosotros', 'calendario', 'extra'];
        const promises = modules.map(module => 
            fetch(`data/${module}.json`).then(res => res.json())
        );
        
        const results = await Promise.all(promises);
        modules.forEach((module, index) => {
            state.content[module] = results[index];
        });

        initializeContent();
    } catch (error) {
        console.error('Error loading content:', error);
    }
}

// Initialize content after JSON is loaded
function initializeContent() {
    updateStreamStatus();
    updateNextRace();
    updateAboutSection();
    updateCalendar();
    updateExtra();
}

// Stream status simulation
function updateStreamStatus() {
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.querySelector('.status-text');
    
    // Simulate random stream status - replace with actual Twitch API integration
    state.isLive = Math.random() > 0.5;
    
    if (state.isLive) {
        statusIndicator.classList.add('live');
        statusText.textContent = 'EN VIVO';
    } else {
        statusIndicator.classList.remove('live');
        statusText.textContent = 'DESCONECTADO';
    }
}

// Update next race information and countdown
function updateNextRace() {
    if (!state.content.inicio) return;

    const { nextRace } = state.content.inicio;
    state.nextRace = nextRace;

    const raceInfo = document.querySelector('.race-info');
    raceInfo.innerHTML = `
        <h3>${nextRace.name}</h3>
        <p>${nextRace.round}</p>
        <p>${new Date(nextRace.date).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}</p>
    `;

    updateCountdown();
    setInterval(updateCountdown, 1000);
}

function updateCountdown() {
    if (!state.nextRace) return;

    const now = new Date().getTime();
    const raceTime = new Date(state.nextRace.date).getTime();
    const distance = raceTime - now;

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.querySelector('.countdown .days').textContent = String(days).padStart(2, '0');
    document.querySelector('.countdown .hours').textContent = String(hours).padStart(2, '0');
    document.querySelector('.countdown .minutes').textContent = String(minutes).padStart(2, '0');
    document.querySelector('.countdown .seconds').textContent = String(seconds).padStart(2, '0');
}

// Update about section content
function updateAboutSection() {
    if (!state.content.sobrenosotros) return;

    const { index, sections, team } = state.content.sobrenosotros;
    const indexContainer = document.querySelector('.about-index');
    const contentContainer = document.querySelector('.about-content');
    const teamGrid = document.querySelector('.team-grid');

    // Create index
    indexContainer.innerHTML = `
        <h3>Índice</h3>
        <ul>
            ${index.map(item => `<li><a href="#${item.id}">${item.title}</a></li>`).join('')}
        </ul>
    `;

    // Create content sections
    contentContainer.innerHTML = sections.map(section => `
        <section id="${section.id}">
            <h2>${section.title}</h2>
            ${section.content}
        </section>
    `).join('');

    // Create team grid
    teamGrid.innerHTML = team.map(member => `
        <div class="team-member">
            <img src="${member.photo}" alt="${member.name}">
            <h3>${member.name}</h3>
            <p>${member.role}</p>
            <div class="social-links">
                ${Object.entries(member.social).map(([platform, url]) => `
                    <a href="${url}" target="_blank" rel="noopener noreferrer">
                        <i class="fab fa-${platform}"></i>
                    </a>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// Update calendar content
function updateCalendar() {
    if (!state.content.calendario) return;

    const seriesGrid = document.querySelector('.series-grid');
    const series = state.content.calendario;

    seriesGrid.innerHTML = Object.entries(series).map(([seriesName, races]) => `
        <div class="series-card ${seriesName.toLowerCase().replace(/\s+/g, '-')}">
            <h3>${seriesName}</h3>
            <div class="races-list">
                ${races.map(race => `
                    <div class="race-item">
                        <h4>${race.name}</h4>
                        <p>${race.track}</p>
                        <p>${new Date(race.date).toLocaleDateString('es-ES', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// Update extra content
function updateExtra() {
    if (!state.content.extra) return;

    const { social, contact, additional } = state.content.extra;
    const socialLinks = document.querySelector('.social-links');
    const contactInfo = document.querySelector('.contact-info');
    const additionalModules = document.querySelector('.additional-modules');

    socialLinks.innerHTML = `
        <h2>Redes Sociales</h2>
        ${social.map(platform => `
            <a href="${platform.url}" class="social-link" target="_blank" rel="noopener noreferrer">
                <i class="fab fa-${platform.icon}"></i>
                <span>${platform.name}</span>
            </a>
        `).join('')}
    `;

    contactInfo.innerHTML = `
        <h2>Información de Contacto</h2>
        ${contact.map(item => `
            <div class="contact-item">
                <i class="${item.icon}"></i>
                <span>${item.value}</span>
            </div>
        `).join('')}
    `;

    if (additional && additional.length > 0) {
        additionalModules.innerHTML = additional.map(module => `
            <div class="module">
                <h3>${module.title}</h3>
                ${module.content}
            </div>
        `).join('');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', loadContent);

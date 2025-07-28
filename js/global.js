// Global state
let config = null;
let seoConfig = null;
let currentTab = 'inicio';

// Performance monitoring
const performanceMetrics = {
    startTime: Date.now(),
    firstContentPaint: 0,
    contentLoaded: 0,
    
    measure(label) {
        this[label] = Date.now() - this.startTime;
        console.debug(`Performance [${label}]:`, this[label] + 'ms');
    }
};

// Intersection Observer for lazy loading
const lazyLoadObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            observer.unobserve(img);
        }
    });
});

// Cache DOM elements
const streamStatus = document.querySelector('.stream-status');
const countdownElements = {
    days: document.querySelector('.count.days'),
    hours: document.querySelector('.count.hours'),
    minutes: document.querySelector('.count.minutes'),
    seconds: document.querySelector('.count.seconds')
};

// Load configuration
async function loadConfig() {
    try {
        const response = await fetch('data/config.json');
        config = await response.json();
        updateSiteTitle();
        updateSocialLinks();
    } catch (error) {
        console.error('Error loading config:', error);
    }
}

// Update site title and branding
function updateSiteTitle() {
    document.title = config.siteName;
    document.querySelector('.copyright').textContent = `© ${new Date().getFullYear()} ${config.siteName}`;
}

// Update social media links
function updateSocialLinks() {
    const socialIcons = document.querySelectorAll('.social-icons a');
    const socialLinks = config.socialLinks;
    
    socialIcons.forEach(icon => {
        const network = icon.querySelector('i').classList[1].split('-')[1];
        if (socialLinks[network]) {
            icon.href = socialLinks[network];
        }
    });
}

// Countdown timer function
function updateCountdown(targetDate) {
    const now = new Date().getTime();
    const target = new Date(targetDate).getTime();
    const difference = target - now;

    if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        countdownElements.days.textContent = days.toString().padStart(2, '0');
        countdownElements.hours.textContent = hours.toString().padStart(2, '0');
        countdownElements.minutes.textContent = minutes.toString().padStart(2, '0');
        countdownElements.seconds.textContent = seconds.toString().padStart(2, '0');
    }
}

// Simulate Twitch stream status check
async function checkStreamStatus() {
    try {
        const response = await fetch('data/inicio.json');
        const data = await response.json();
        
        const statusIndicator = document.querySelector('.status-indicator');
        const statusText = document.querySelector('.status-text');
        
        if (data.streamStatus.isLive) {
            statusIndicator.classList.add('live');
            statusText.textContent = 'EN VIVO';
        } else {
            statusIndicator.classList.remove('live');
            statusText.textContent = 'DESCONECTADO';
        }
    } catch (error) {
        console.error('Error checking stream status:', error);
    }
}

// Load sponsors for LED scroller
async function loadSponsorsScroller() {
    try {
        const response = await fetch('data/sobrenosotros.json');
        const data = await response.json();
        
        if (data.sponsors && data.sponsors.length > 0) {
            const sponsorNames = data.sponsors.map(sponsor => sponsor.name);
            const sponsorText = sponsorNames.join(' • ') + ' • ';
            
            const scrollerElement = document.querySelector('.sponsor-text');
            if (scrollerElement) {
                scrollerElement.textContent = sponsorText.repeat(3); // Repetir para efecto continuo
            }
        }
    } catch (error) {
        console.error('Error loading sponsors:', error);
        const scrollerElement = document.querySelector('.sponsor-text');
        if (scrollerElement) {
            scrollerElement.textContent = 'SIMRACING AMERICA TV • TRANSMISIONES EN VIVO • CARRERAS VIRTUALES • ';
        }
    }
}

// Mobile menu functionality
function initMobileMenu() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navTabs = document.querySelector('.nav-tabs');
    const navLinks = document.querySelectorAll('.nav-tabs a');
    
    if (!mobileMenuToggle || !navTabs) return;
    
    // Toggle mobile menu
    mobileMenuToggle.addEventListener('click', () => {
        const isActive = navTabs.classList.contains('active');
        
        if (isActive) {
            navTabs.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
            mobileMenuToggle.querySelector('i').className = 'fas fa-bars';
            mobileMenuToggle.setAttribute('aria-expanded', 'false');
        } else {
            navTabs.classList.add('active');
            mobileMenuToggle.classList.add('active');
            mobileMenuToggle.querySelector('i').className = 'fas fa-times';
            mobileMenuToggle.setAttribute('aria-expanded', 'true');
        }
    });
    
    // Close menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navTabs.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
            mobileMenuToggle.querySelector('i').className = 'fas fa-bars';
            mobileMenuToggle.setAttribute('aria-expanded', 'false');
        });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!mobileMenuToggle.contains(e.target) && !navTabs.contains(e.target)) {
            navTabs.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
            mobileMenuToggle.querySelector('i').className = 'fas fa-bars';
            mobileMenuToggle.setAttribute('aria-expanded', 'false');
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            navTabs.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
            mobileMenuToggle.querySelector('i').className = 'fas fa-bars';
            mobileMenuToggle.setAttribute('aria-expanded', 'false');
        }
    });
}

// Initialize the application
async function init() {
    await loadConfig();
    checkStreamStatus();
    setInterval(checkStreamStatus, 60000); // Check stream status every minute

    // Initialize mobile menu
    initMobileMenu();

    // Load sponsors scroller
    await loadSponsorsScroller();

    // Load next race info and start countdown
    try {
        const response = await fetch('data/inicio.json');
        const data = await response.json();
        
        const nextRace = data.nextRace;
        document.querySelector('.race-name').textContent = nextRace.name;
        document.querySelector('.race-round').textContent = `Ronda: ${nextRace.round}`;
        
        setInterval(() => updateCountdown(nextRace.date), 1000);
    } catch (error) {
        console.error('Error loading next race info:', error);
    }
}

// Start the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);

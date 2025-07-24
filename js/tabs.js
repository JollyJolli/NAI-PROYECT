// Tab switching functionality
document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    function switchTab(tabId) {
        // Update button states
        tabButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.tab === tabId);
        });

        // Update content visibility
        tabContents.forEach(content => {
            if (content.id === tabId) {
                content.classList.add('active');
                // Trigger any necessary content updates
                switch(tabId) {
                    case 'inicio':
                        updateStreamStatus();
                        break;
                    case 'calendario':
                        // Refresh calendar data if needed
                        break;
                    // Add other tab-specific updates as needed
                }
            } else {
                content.classList.remove('active');
            }
        });

        // Update URL without page reload
        history.pushState({}, '', `#${tabId}`);
    }

    // Add click handlers to tab buttons
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            switchTab(tabId);
        });
    });

    // Handle browser back/forward
    window.addEventListener('popstate', () => {
        const hash = window.location.hash.slice(1) || 'inicio';
        switchTab(hash);
    });

    // Handle initial load
    const initialTab = window.location.hash.slice(1) || 'inicio';
    switchTab(initialTab);
});

/**
 * SkyWatch Radar - UI Controller
 * 
 * Handles all user interface interactions and updates
 */

const UI = (function() {
    'use strict';
    
    // DOM elements (cached)
    let elements = {};
    
    /**
     * Initialize UI
     */
    function init() {
        cacheElements();
        attachEventListeners();
        setupMobileOptimizations();
    }
    
    /**
     * Cache DOM elements
     */
    function cacheElements() {
        elements = {
            // Containers
            app: document.getElementById('app'),
            map: document.getElementById('map'),
            loadingScreen: document.getElementById('loading-screen'),
            
            // Top bar
            aircraftCount: document.getElementById('aircraft-count'),
            militaryCount: document.getElementById('military-count'),
            menuToggle: document.getElementById('menu-toggle'),
            
            // Side panel
            sidePanel: document.getElementById('side-panel'),
            panelClose: document.getElementById('panel-close'),
            
            // Search
            searchInput: document.getElementById('search-input'),
            searchClear: document.getElementById('search-clear'),
            
            // Filters
            filterCivilian: document.getElementById('filter-civilian'),
            filterMilitary: document.getElementById('filter-military'),
            minAltitude: document.getElementById('min-altitude'),
            maxAltitude: document.getElementById('max-altitude'),
            minAltitudeValue: document.getElementById('min-altitude-value'),
            maxAltitudeValue: document.getElementById('max-altitude-value'),
            
            // Display options
            showTrails: document.getElementById('show-trails'),
            showLabels: document.getElementById('show-labels'),
            clusterMode: document.getElementById('cluster-mode'),
            
            // Time controls
            timeLive: document.getElementById('time-live'),
            timeHistory: document.getElementById('time-history'),
            timeScrubber: document.getElementById('time-scrubber'),
            timeSlider: document.getElementById('time-slider'),
            timeLabel: document.getElementById('time-label'),
            
            // Aircraft card
            aircraftCard: document.getElementById('aircraft-card'),
            cardClose: document.getElementById('card-close'),
            cardCallsign: document.getElementById('card-callsign'),
            cardType: document.getElementById('card-type'),
            cardAltitude: document.getElementById('card-altitude'),
            cardSpeed: document.getElementById('card-speed'),
            cardHeading: document.getElementById('card-heading'),
            cardVertical: document.getElementById('card-vertical'),
            cardRegistration: document.getElementById('card-registration'),
            cardIcao: document.getElementById('card-icao'),
            cardOrigin: document.getElementById('card-origin'),
            cardTrack: document.getElementById('card-track'),
            
            // Toast container
            toastContainer: document.getElementById('toast-container'),
        };
        
        // Region buttons
        elements.regionButtons = document.querySelectorAll('.region-button');
    }
    
    /**
     * Attach event listeners
     */
    function attachEventListeners() {
        // Menu toggle
        elements.menuToggle.addEventListener('click', toggleSidePanel);
        elements.panelClose.addEventListener('click', closeSidePanel);
        
        // Search
        elements.searchInput.addEventListener('input', handleSearchInput);
        elements.searchClear.addEventListener('click', clearSearch);
        
        // Filters
        elements.filterCivilian.addEventListener('change', handleFilterChange);
        elements.filterMilitary.addEventListener('change', handleFilterChange);
        elements.minAltitude.addEventListener('input', handleAltitudeChange);
        elements.maxAltitude.addEventListener('input', handleAltitudeChange);
        
        // Display options
        elements.showTrails.addEventListener('change', handleDisplayOptions);
        elements.showLabels.addEventListener('change', handleDisplayOptions);
        elements.clusterMode.addEventListener('change', handleDisplayOptions);
        
        // Time controls
        elements.timeLive.addEventListener('click', () => setTimeMode('live'));
        elements.timeHistory.addEventListener('click', () => setTimeMode('history'));
        
        // Region buttons
        elements.regionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const region = e.target.dataset.region;
                MapManager.focusRegion(region);
                closeSidePanel();
            });
        });
        
        // Aircraft card
        elements.cardClose.addEventListener('click', hideAircraftCard);
        elements.cardTrack.addEventListener('click', handleTrackAircraft);
        
        // Backdrop (close panel when clicking outside)
        document.addEventListener('click', handleBackdropClick);
        
        // Keyboard shortcuts
        document.addEventListener('keydown', handleKeyboard);
    }
    
    /**
     * Setup mobile-specific optimizations
     */
    function setupMobileOptimizations() {
        // Prevent double-tap zoom
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
        
        // Handle viewport height on mobile (account for address bar)
        const setViewportHeight = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        
        setViewportHeight();
        window.addEventListener('resize', setViewportHeight);
        window.addEventListener('orientationchange', setViewportHeight);
    }
    
    /**
     * Toggle side panel
     */
    function toggleSidePanel() {
        elements.sidePanel.classList.toggle('open');
        elements.menuToggle.classList.toggle('active');
        
        // Add/remove backdrop
        if (elements.sidePanel.classList.contains('open')) {
            createBackdrop();
        } else {
            removeBackdrop();
        }
    }
    
    /**
     * Close side panel
     */
    function closeSidePanel() {
        elements.sidePanel.classList.remove('open');
        elements.menuToggle.classList.remove('active');
        removeBackdrop();
    }
    
    /**
     * Create backdrop
     */
    function createBackdrop() {
        if (!document.querySelector('.backdrop')) {
            const backdrop = document.createElement('div');
            backdrop.className = 'backdrop';
            document.body.appendChild(backdrop);
            
            // Trigger reflow for animation
            requestAnimationFrame(() => {
                backdrop.classList.add('visible');
            });
        }
    }
    
    /**
     * Remove backdrop
     */
    function removeBackdrop() {
        const backdrop = document.querySelector('.backdrop');
        if (backdrop) {
            backdrop.classList.remove('visible');
            setTimeout(() => backdrop.remove(), 250);
        }
    }
    
    /**
     * Handle backdrop click
     */
    function handleBackdropClick(e) {
        if (e.target.classList.contains('backdrop')) {
            closeSidePanel();
        }
    }
    
    /**
     * Handle search input
     */
    function handleSearchInput(e) {
        const query = e.target.value;
        
        // Show/hide clear button
        if (query.length > 0) {
            elements.searchClear.classList.add('visible');
        } else {
            elements.searchClear.classList.remove('visible');
        }
        
        // Update filter
        AircraftManager.setFilter('searchQuery', query);
        
        // Update map
        if (window.App && window.App.updateDisplay) {
            window.App.updateDisplay();
        }
    }
    
    /**
     * Clear search
     */
    function clearSearch() {
        elements.searchInput.value = '';
        elements.searchClear.classList.remove('visible');
        AircraftManager.setFilter('searchQuery', '');
        
        if (window.App && window.App.updateDisplay) {
            window.App.updateDisplay();
        }
    }
    
    /**
     * Handle filter changes
     */
    function handleFilterChange(e) {
        const filterName = e.target.id.replace('filter-', '');
        const value = e.target.checked;
        
        AircraftManager.setFilter(filterName, value);
        
        if (window.App && window.App.updateDisplay) {
            window.App.updateDisplay();
        }
    }
    
    /**
     * Handle altitude filter changes
     */
    function handleAltitudeChange(e) {
        const filterName = e.target.id.replace('-', '');
        const value = parseInt(e.target.value);
        
        // Update display
        const valueElement = document.getElementById(`${e.target.id}-value`);
        if (valueElement) {
            valueElement.textContent = value.toLocaleString();
        }
        
        // Update filter
        AircraftManager.setFilter(filterName, value);
        
        if (window.App && window.App.updateDisplay) {
            window.App.updateDisplay();
        }
    }
    
    /**
     * Handle display option changes
     */
    function handleDisplayOptions(e) {
        const option = e.target.id.replace('show-', '').replace('-mode', '');
        const enabled = e.target.checked;
        
        switch (option) {
            case 'trails':
                CONFIG.features.trails = enabled;
                MapManager.toggleTrails(enabled);
                break;
            case 'labels':
                CONFIG.features.labels = enabled;
                MapManager.toggleLabels(enabled);
                break;
            case 'cluster':
                CONFIG.features.clustering = enabled;
                showToast('Cluster mode coming soon', 'warning');
                break;
        }
    }
    
    /**
     * Set time mode (live/history)
     */
    function setTimeMode(mode) {
        elements.timeLive.classList.remove('active');
        elements.timeHistory.classList.remove('active');
        
        if (mode === 'live') {
            elements.timeLive.classList.add('active');
            elements.timeScrubber.style.display = 'none';
            
            if (window.App && window.App.startLiveMode) {
                window.App.startLiveMode();
            }
        } else {
            elements.timeHistory.classList.add('active');
            elements.timeScrubber.style.display = 'block';
            showToast('History mode coming soon', 'warning');
        }
    }
    
    /**
     * Show aircraft card
     */
    function showAircraftCard(aircraft) {
        const formatted = AircraftManager.formatAircraftData(aircraft);
        
        elements.cardCallsign.textContent = formatted.callsign;
        elements.cardType.textContent = formatted.type;
        elements.cardType.className = `card-badge ${aircraft.isMilitary ? 'military' : ''}`;
        
        elements.cardAltitude.textContent = formatted.altitude;
        elements.cardSpeed.textContent = formatted.speed;
        elements.cardHeading.textContent = formatted.heading;
        elements.cardVertical.textContent = formatted.verticalRate;
        
        elements.cardRegistration.textContent = formatted.callsign;
        elements.cardIcao.textContent = formatted.icao24;
        elements.cardOrigin.textContent = formatted.origin;
        
        elements.aircraftCard.style.display = 'block';
    }
    
    /**
     * Hide aircraft card
     */
    function hideAircraftCard() {
        elements.aircraftCard.style.display = 'none';
        MapManager.deselectAircraft();
    }
    
    /**
     * Handle track aircraft button
     */
    function handleTrackAircraft() {
        const aircraft = AircraftManager.getSelectedAircraft();
        if (aircraft) {
            MapManager.trackAircraft(aircraft.icao24);
            showToast(`Tracking ${aircraft.callsign}`, 'success');
        }
    }
    
    /**
     * Update stats display
     */
    function updateStats() {
        const stats = AircraftManager.getStats();
        
        elements.aircraftCount.textContent = stats.filtered;
        elements.militaryCount.textContent = stats.military;
    }
    
    /**
     * Show loading screen
     */
    function showLoading(message = 'Loading...') {
        const status = elements.loadingScreen.querySelector('.loading-status');
        if (status) {
            status.textContent = message;
        }
        elements.loadingScreen.classList.remove('hidden');
    }
    
    /**
     * Hide loading screen
     */
    function hideLoading() {
        elements.loadingScreen.classList.add('hidden');
    }
    
    /**
     * Show toast notification
     */
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span class="toast-message">${message}</span>`;
        
        elements.toastContainer.appendChild(toast);
        
        // Remove after duration
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, CONFIG.notifications.duration);
        
        // Limit visible toasts
        const toasts = elements.toastContainer.querySelectorAll('.toast');
        if (toasts.length > CONFIG.notifications.maxVisible) {
            toasts[0].remove();
        }
    }
    
    /**
     * Handle keyboard shortcuts
     */
    function handleKeyboard(e) {
        // ESC - Close panel/card
        if (e.key === 'Escape') {
            closeSidePanel();
            hideAircraftCard();
        }
        
        // M - Toggle menu
        if (e.key === 'm' || e.key === 'M') {
            toggleSidePanel();
        }
        
        // Space - Toggle live/history (when implemented)
        if (e.key === ' ' && e.target.tagName !== 'INPUT') {
            e.preventDefault();
            // Toggle mode
        }
    }
    
    /**
     * Show error message
     */
    function showError(message) {
        showToast(message, 'error');
    }
    
    // Public API
    return {
        init,
        updateStats,
        showLoading,
        hideLoading,
        showToast,
        showError,
        showAircraftCard,
        hideAircraftCard,
        closeSidePanel,
    };
    
})();

// Make globally accessible
window.UI = UI;
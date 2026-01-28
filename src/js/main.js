/**
 * SkyWatch Radar - Main Application
 * 
 * Orchestrates all modules and handles application lifecycle
 */

const App = (function() {
    'use strict';
    
    let updateInterval = null;
    let isLiveMode = true;
    let isInitialized = false;
    
    /**
     * Initialize application
     */
    async function init() {
        if (isInitialized) {
            console.warn('App already initialized');
            return;
        }
        
        try {
            UI.showLoading('Initializing SkyWatch...');
            
            // Initialize UI
            UI.init();
            
            // Initialize map
            UI.showLoading('Loading map...');
            MapManager.init();
            
            // Fetch initial data
            UI.showLoading('Fetching aircraft data...');
            await fetchAndUpdate();
            
            // Start live updates
            startLiveMode();
            
            // Hide loading screen
            setTimeout(() => {
                UI.hideLoading();
                UI.showToast('SkyWatch Radar ready', 'success');
            }, 500);
            
            isInitialized = true;
            
        } catch (error) {
            console.error('Initialization error:', error);
            UI.showError('Failed to initialize: ' + error.message);
            UI.hideLoading();
        }
    }
    
    /**
     * Fetch data and update display
     */
    async function fetchAndUpdate() {
        try {
            // Check if we can make a request (rate limiting)
            if (!API.canMakeRequest()) {
                console.log('Rate limit active, skipping update');
                return;
            }
            
            // Fetch aircraft data
            const aircraft = await API.getAllStates();
            
            // Update aircraft manager
            const stats = AircraftManager.updateAircraft(aircraft);
            
            // Update display
            updateDisplay();
            
            // Update stats
            UI.updateStats();
            
            console.log(`Updated: ${stats.total} aircraft, ${stats.military} military`);
            
        } catch (error) {
            console.error('Update error:', error);
            
            if (error.message.includes('Rate limit')) {
                UI.showToast('Rate limit reached. Slowing updates.', 'warning');
            } else {
                UI.showToast('Failed to fetch data: ' + error.message, 'error');
            }
        }
    }
    
    /**
     * Update map display with current aircraft
     */
    function updateDisplay() {
        const aircraft = AircraftManager.getFilteredAircraft();
        MapManager.updateMarkers(aircraft);
        
        // Update selected aircraft card if open
        const selected = AircraftManager.getSelectedAircraft();
        if (selected) {
            const updated = AircraftManager.getAircraft(selected.icao24);
            if (updated) {
                UI.showAircraftCard(updated);
            }
        }
    }
    
    /**
     * Start live mode
     */
    function startLiveMode() {
        isLiveMode = true;
        
        // Clear any existing interval
        if (updateInterval) {
            clearInterval(updateInterval);
        }
        
        // Start update loop
        updateInterval = setInterval(async () => {
            if (isLiveMode) {
                await fetchAndUpdate();
            }
        }, CONFIG.intervals.liveUpdate);
        
        console.log('Live mode started');
    }
    
    /**
     * Stop live mode
     */
    function stopLiveMode() {
        isLiveMode = false;
        
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }
        
        console.log('Live mode stopped');
    }
    
    /**
     * Handle visibility change (pause updates when tab not visible)
     */
    function handleVisibilityChange() {
        if (document.hidden) {
            console.log('Tab hidden, pausing updates');
            stopLiveMode();
        } else {
            console.log('Tab visible, resuming updates');
            startLiveMode();
            // Immediate update when tab becomes visible
            fetchAndUpdate();
        }
    }
    
    /**
     * Handle online/offline events
     */
    function handleOnline() {
        UI.showToast('Connection restored', 'success');
        startLiveMode();
        fetchAndUpdate();
    }
    
    function handleOffline() {
        UI.showToast('Connection lost. Updates paused.', 'warning');
        stopLiveMode();
    }
    
    /**
     * Clean up and destroy
     */
    function destroy() {
        stopLiveMode();
        MapManager.destroy();
        AircraftManager.clearAll();
        isInitialized = false;
    }
    
    /**
     * Export current data (for debugging/analysis)
     */
    function exportData() {
        const data = AircraftManager.exportData();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `skywatch-export-${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        UI.showToast('Data exported', 'success');
    }
    
    // Event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Expose some methods to console for debugging
    window.SkyWatch = {
        stats: () => AircraftManager.getStats(),
        aircraft: () => AircraftManager.getFilteredAircraft(),
        export: exportData,
        refresh: fetchAndUpdate,
    };
    
    // Public API
    return {
        init,
        startLiveMode,
        stopLiveMode,
        updateDisplay,
        fetchAndUpdate,
        destroy,
        exportData,
    };
    
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        App.init();
    });
} else {
    App.init();
}

// Make App globally accessible
window.App = App;
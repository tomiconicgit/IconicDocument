/**
 * SkyWatch Radar - Map Module
 * 
 * Handles map rendering, aircraft markers, and trails using Leaflet
 */

const MapManager = (function() {
    'use strict';
    
    let map = null;
    let markers = new Map(); // icao24 -> marker object
    let trails = new Map(); // icao24 -> polyline object
    let selectedMarker = null;
    
    // Custom aircraft icon
    const aircraftIconSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
        </svg>
    `;
    
    /**
     * Initialize map
     */
    function init() {
        if (map) {
            console.warn('Map already initialized');
            return map;
        }
        
        const { defaultView, tiles, minZoom, maxZoom, maxBounds, maxBoundsViscosity } = CONFIG.map;
        
        // Create map
        map = L.map('map', {
            center: defaultView.center,
            zoom: defaultView.zoom,
            minZoom: minZoom,
            maxZoom: maxZoom,
            maxBounds: maxBounds,
            maxBoundsViscosity: maxBoundsViscosity,
            zoomControl: true,
            attributionControl: true,
        });
        
        // Add tile layer
        L.tileLayer(tiles.dark.url, {
            attribution: tiles.dark.attribution,
            maxZoom: tiles.dark.maxZoom,
        }).addTo(map);
        
        // Map event handlers
        map.on('click', handleMapClick);
        map.on('moveend', handleMapMove);
        
        return map;
    }
    
    /**
     * Handle map click (deselect aircraft)
     */
    function handleMapClick(e) {
        // Only deselect if clicking on map, not on marker
        if (!e.originalEvent.target.closest('.leaflet-marker-icon')) {
            deselectAircraft();
        }
    }
    
    /**
     * Handle map movement
     */
    function handleMapMove() {
        // Could implement bounds-based filtering here
        // For now, we fetch global data due to API limitations
    }
    
    /**
     * Update all aircraft markers
     */
    function updateMarkers(aircraft) {
        if (!map) return;
        
        const currentIcaos = new Set(aircraft.map(a => a.icao24));
        
        // Remove markers for aircraft no longer in view
        for (const [icao, marker] of markers.entries()) {
            if (!currentIcaos.has(icao)) {
                map.removeLayer(marker);
                markers.delete(icao);
                
                // Also remove trail
                if (trails.has(icao)) {
                    map.removeLayer(trails.get(icao));
                    trails.delete(icao);
                }
            }
        }
        
        // Update or create markers
        aircraft.forEach(ac => {
            if (markers.has(ac.icao24)) {
                updateMarker(ac);
            } else {
                createMarker(ac);
            }
            
            // Update trail
            if (CONFIG.features.trails && ac.trail && ac.trail.length > 1) {
                updateTrail(ac);
            }
        });
    }
    
    /**
     * Create marker for aircraft
     */
    function createMarker(aircraft) {
        const color = aircraft.isMilitary ? 
            CONFIG.aircraft.display.militaryColor || '#dc2626' : 
            AircraftManager.getAltitudeColor(aircraft.altitude);
        
        const icon = L.divIcon({
            className: 'aircraft-marker',
            html: createMarkerHTML(aircraft, color),
            iconSize: [CONFIG.aircraft.display.iconSize, CONFIG.aircraft.display.iconSize],
            iconAnchor: [CONFIG.aircraft.display.iconSize / 2, CONFIG.aircraft.display.iconSize / 2],
        });
        
        const marker = L.marker([aircraft.lat, aircraft.lon], {
            icon: icon,
            rotationAngle: aircraft.heading || 0,
            zIndexOffset: aircraft.isMilitary ? 1000 : 0,
        }).addTo(map);
        
        // Store aircraft data on marker
        marker.aircraftData = aircraft;
        
        // Click handler
        marker.on('click', () => {
            handleMarkerClick(aircraft.icao24);
        });
        
        markers.set(aircraft.icao24, marker);
    }
    
    /**
     * Create marker HTML with rotation
     */
    function createMarkerHTML(aircraft, color) {
        const rotation = aircraft.heading || 0;
        const size = CONFIG.aircraft.display.iconSize;
        
        return `
            <div class="aircraft-icon" style="
                width: ${size}px;
                height: ${size}px;
                color: ${color};
                transform: rotate(${rotation}deg);
                filter: drop-shadow(0 0 4px ${color});
                transition: all 0.3s ease;
            ">
                ${aircraftIconSVG}
            </div>
            ${CONFIG.features.labels ? `
                <div class="aircraft-label" style="
                    position: absolute;
                    top: ${size + 2}px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(10, 14, 26, 0.9);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                    padding: 2px 6px;
                    font-size: 10px;
                    white-space: nowrap;
                    color: white;
                    font-weight: 500;
                    pointer-events: none;
                ">
                    ${aircraft.callsign}
                </div>
            ` : ''}
        `;
    }
    
    /**
     * Update existing marker
     */
    function updateMarker(aircraft) {
        const marker = markers.get(aircraft.icao24);
        if (!marker) return;
        
        // Update position
        marker.setLatLng([aircraft.lat, aircraft.lon]);
        
        // Update icon if needed (color/rotation changes)
        const color = aircraft.isMilitary ? 
            CONFIG.aircraft.display.militaryColor || '#dc2626' : 
            AircraftManager.getAltitudeColor(aircraft.altitude);
        
        const icon = L.divIcon({
            className: 'aircraft-marker',
            html: createMarkerHTML(aircraft, color),
            iconSize: [CONFIG.aircraft.display.iconSize, CONFIG.aircraft.display.iconSize],
            iconAnchor: [CONFIG.aircraft.display.iconSize / 2, CONFIG.aircraft.display.iconSize / 2],
        });
        
        marker.setIcon(icon);
        
        // Update stored data
        marker.aircraftData = aircraft;
    }
    
    /**
     * Update or create trail for aircraft
     */
    function updateTrail(aircraft) {
        if (!aircraft.trail || aircraft.trail.length < 2) return;
        
        const latLngs = aircraft.trail.map(point => [point.lat, point.lon]);
        
        const color = aircraft.isMilitary ? 
            'rgba(220, 38, 38, 0.6)' : 
            'rgba(59, 130, 246, 0.6)';
        
        if (trails.has(aircraft.icao24)) {
            // Update existing trail
            const trail = trails.get(aircraft.icao24);
            trail.setLatLngs(latLngs);
        } else {
            // Create new trail
            const trail = L.polyline(latLngs, {
                color: color,
                weight: 2,
                opacity: 0.6,
                smoothFactor: 1,
            }).addTo(map);
            
            trails.set(aircraft.icao24, trail);
        }
    }
    
    /**
     * Handle marker click
     */
    function handleMarkerClick(icao24) {
        const aircraft = AircraftManager.selectAircraft(icao24);
        
        if (aircraft) {
            // Highlight selected marker
            highlightMarker(icao24);
            
            // Pan to aircraft
            map.panTo([aircraft.lat, aircraft.lon]);
            
            // Notify UI
            if (window.UI && window.UI.showAircraftCard) {
                window.UI.showAircraftCard(aircraft);
            }
        }
    }
    
    /**
     * Highlight selected marker
     */
    function highlightMarker(icao24) {
        // Reset previous selection
        if (selectedMarker) {
            const prevAircraft = selectedMarker.aircraftData;
            updateMarker(prevAircraft);
        }
        
        // Highlight new selection
        const marker = markers.get(icao24);
        if (marker) {
            const aircraft = marker.aircraftData;
            const size = CONFIG.aircraft.display.selectedIconSize;
            
            const icon = L.divIcon({
                className: 'aircraft-marker selected',
                html: `
                    <div class="aircraft-icon" style="
                        width: ${size}px;
                        height: ${size}px;
                        color: #fbbf24;
                        transform: rotate(${aircraft.heading || 0}deg);
                        filter: drop-shadow(0 0 8px #fbbf24);
                        transition: all 0.3s ease;
                    ">
                        ${aircraftIconSVG}
                    </div>
                `,
                iconSize: [size, size],
                iconAnchor: [size / 2, size / 2],
            });
            
            marker.setIcon(icon);
            selectedMarker = marker;
        }
    }
    
    /**
     * Deselect aircraft
     */
    function deselectAircraft() {
        if (selectedMarker) {
            const aircraft = selectedMarker.aircraftData;
            updateMarker(aircraft);
            selectedMarker = null;
        }
        
        AircraftManager.deselectAircraft();
        
        // Notify UI
        if (window.UI && window.UI.hideAircraftCard) {
            window.UI.hideAircraftCard();
        }
    }
    
    /**
     * Focus on region
     */
    function focusRegion(regionKey) {
        if (!map) return;
        
        const region = CONFIG.regions[regionKey];
        if (!region) return;
        
        if (region.bounds) {
            map.fitBounds(region.bounds);
        } else {
            map.setView(region.center, region.zoom);
        }
    }
    
    /**
     * Track specific aircraft (center and follow)
     */
    function trackAircraft(icao24) {
        const aircraft = AircraftManager.getAircraft(icao24);
        if (!aircraft) return;
        
        // Center on aircraft
        map.setView([aircraft.lat, aircraft.lon], 10);
        
        // TODO: Implement follow mode that keeps aircraft centered
    }
    
    /**
     * Toggle trail visibility
     */
    function toggleTrails(visible) {
        for (const [icao, trail] of trails.entries()) {
            if (visible) {
                trail.addTo(map);
            } else {
                map.removeLayer(trail);
            }
        }
    }
    
    /**
     * Toggle label visibility
     */
    function toggleLabels(visible) {
        // Re-render all markers with/without labels
        const aircraft = AircraftManager.getFilteredAircraft();
        aircraft.forEach(ac => {
            if (markers.has(ac.icao24)) {
                updateMarker(ac);
            }
        });
    }
    
    /**
     * Get map instance
     */
    function getMap() {
        return map;
    }
    
    /**
     * Clean up
     */
    function destroy() {
        if (map) {
            map.remove();
            map = null;
        }
        markers.clear();
        trails.clear();
    }
    
    // Public API
    return {
        init,
        updateMarkers,
        deselectAircraft,
        focusRegion,
        trackAircraft,
        toggleTrails,
        toggleLabels,
        getMap,
        destroy,
    };
    
})();

// Make globally accessible
window.MapManager = MapManager;
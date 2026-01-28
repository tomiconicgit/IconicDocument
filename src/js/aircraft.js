/**
 * SkyWatch Radar - Aircraft Management
 * 
 * Handles aircraft state, filtering, and trail management
 */

const AircraftManager = (function() {
    'use strict';
    
    // Aircraft storage
    let aircraftMap = new Map(); // icao24 -> aircraft object
    let filteredAircraft = [];
    let selectedAircraft = null;
    
    // Filter state
    let filters = {
        civilian: true,
        military: true,
        minAltitude: 0,
        maxAltitude: 45000,
        searchQuery: '',
    };
    
    /**
     * Update aircraft from API data
     */
    function updateAircraft(newAircraftList) {
        const now = Date.now();
        const currentIcaos = new Set();
        
        newAircraftList.forEach(aircraft => {
            const icao = aircraft.icao24;
            currentIcaos.add(icao);
            
            if (aircraftMap.has(icao)) {
                // Update existing aircraft
                const existing = aircraftMap.get(icao);
                
                // Add current position to trail
                if (CONFIG.features.trails) {
                    addTrailPoint(existing, aircraft);
                }
                
                // Update properties
                Object.assign(existing, aircraft);
                existing._lastSeen = now;
            } else {
                // Add new aircraft
                aircraft._lastSeen = now;
                aircraft.trail = [];
                aircraftMap.set(icao, aircraft);
            }
        });
        
        // Remove aircraft not seen in this update (timeout after 2 minutes)
        const timeout = 120000; // 2 minutes
        for (const [icao, aircraft] of aircraftMap.entries()) {
            if (!currentIcaos.has(icao) && now - aircraft._lastSeen > timeout) {
                aircraftMap.delete(icao);
                
                // If deleted aircraft was selected, deselect
                if (selectedAircraft && selectedAircraft.icao24 === icao) {
                    selectedAircraft = null;
                }
            }
        }
        
        // Apply filters
        applyFilters();
        
        return {
            total: aircraftMap.size,
            filtered: filteredAircraft.length,
            military: countMilitary(),
        };
    }
    
    /**
     * Add point to aircraft trail
     */
    function addTrailPoint(aircraft, newData) {
        if (!aircraft.trail) {
            aircraft.trail = [];
        }
        
        // Only add if position has changed significantly
        const lastTrail = aircraft.trail[aircraft.trail.length - 1];
        if (lastTrail) {
            const distance = calculateDistance(
                lastTrail.lat, lastTrail.lon,
                newData.lat, newData.lon
            );
            
            // Skip if moved less than 100 meters
            if (distance < 0.1) {
                return;
            }
        }
        
        // Add new trail point
        aircraft.trail.push({
            lat: newData.lat,
            lon: newData.lon,
            altitude: newData.altitude,
            time: Date.now(),
        });
        
        // Limit trail length
        const maxPoints = CONFIG.aircraft.display.trailMaxPoints;
        if (aircraft.trail.length > maxPoints) {
            aircraft.trail = aircraft.trail.slice(-maxPoints);
        }
        
        // Remove old trail points
        const maxAge = CONFIG.aircraft.display.trailDuration;
        const now = Date.now();
        aircraft.trail = aircraft.trail.filter(point => now - point.time < maxAge);
    }
    
    /**
     * Calculate distance between two coordinates (km)
     * Using Haversine formula
     */
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth radius in km
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    
    function toRad(degrees) {
        return degrees * (Math.PI / 180);
    }
    
    /**
     * Apply current filters
     */
    function applyFilters() {
        filteredAircraft = Array.from(aircraftMap.values()).filter(aircraft => {
            // Military filter
            if (aircraft.isMilitary && !filters.military) return false;
            if (!aircraft.isMilitary && !filters.civilian) return false;
            
            // Altitude filter
            if (aircraft.altitude !== null) {
                if (aircraft.altitude < filters.minAltitude || 
                    aircraft.altitude > filters.maxAltitude) {
                    return false;
                }
            }
            
            // Search filter
            if (filters.searchQuery) {
                const query = filters.searchQuery.toLowerCase();
                const callsign = aircraft.callsign.toLowerCase();
                const icao = aircraft.icao24.toLowerCase();
                
                if (!callsign.includes(query) && !icao.includes(query)) {
                    return false;
                }
            }
            
            return true;
        });
    }
    
    /**
     * Update filter settings
     */
    function setFilter(filterName, value) {
        if (filterName in filters) {
            filters[filterName] = value;
            applyFilters();
            return true;
        }
        return false;
    }
    
    /**
     * Get filter settings
     */
    function getFilters() {
        return { ...filters };
    }
    
    /**
     * Get all filtered aircraft
     */
    function getFilteredAircraft() {
        return filteredAircraft;
    }
    
    /**
     * Get aircraft by ICAO24
     */
    function getAircraft(icao24) {
        return aircraftMap.get(icao24);
    }
    
    /**
     * Select aircraft
     */
    function selectAircraft(icao24) {
        selectedAircraft = getAircraft(icao24);
        return selectedAircraft;
    }
    
    /**
     * Get selected aircraft
     */
    function getSelectedAircraft() {
        return selectedAircraft;
    }
    
    /**
     * Deselect aircraft
     */
    function deselectAircraft() {
        selectedAircraft = null;
    }
    
    /**
     * Count military aircraft
     */
    function countMilitary() {
        return Array.from(aircraftMap.values()).filter(a => a.isMilitary).length;
    }
    
    /**
     * Get statistics
     */
    function getStats() {
        return {
            total: aircraftMap.size,
            filtered: filteredAircraft.length,
            military: countMilitary(),
            civilian: aircraftMap.size - countMilitary(),
            onGround: Array.from(aircraftMap.values()).filter(a => a.onGround).length,
        };
    }
    
    /**
     * Get aircraft by region bounds
     */
    function getAircraftInBounds(bounds) {
        const [latMin, lonMin, latMax, lonMax] = bounds;
        
        return filteredAircraft.filter(aircraft => {
            return aircraft.lat >= latMin && aircraft.lat <= latMax &&
                   aircraft.lon >= lonMin && aircraft.lon <= lonMax;
        });
    }
    
    /**
     * Get altitude color for aircraft
     */
    function getAltitudeColor(altitude) {
        if (altitude === null) return CONFIG.aircraft.altitudeRanges.ground.color;
        
        const ranges = CONFIG.aircraft.altitudeRanges;
        
        if (altitude <= ranges.ground.max) return ranges.ground.color;
        if (altitude <= ranges.low.max) return ranges.low.color;
        if (altitude <= ranges.medium.max) return ranges.medium.color;
        if (altitude <= ranges.high.max) return ranges.high.color;
        return ranges.extreme.color;
    }
    
    /**
     * Format aircraft data for display
     */
    function formatAircraftData(aircraft) {
        return {
            callsign: aircraft.callsign || 'N/A',
            icao24: aircraft.icao24.toUpperCase(),
            altitude: aircraft.altitude !== null ? 
                `${aircraft.altitude.toLocaleString()} ft` : 'N/A',
            speed: aircraft.speed !== null ? 
                `${aircraft.speed} kts` : 'N/A',
            heading: aircraft.heading !== null ? 
                `${aircraft.heading}°` : 'N/A',
            verticalRate: formatVerticalRate(aircraft.verticalRate),
            origin: aircraft.origin,
            type: aircraft.isMilitary ? 'MILITARY' : 'CIVILIAN',
            squawk: aircraft.squawk || 'N/A',
            source: aircraft.positionSource,
        };
    }
    
    /**
     * Format vertical rate with arrow
     */
    function formatVerticalRate(rate) {
        if (rate === null || rate === 0) return '→ Level';
        if (rate > 0) return `↑ ${Math.abs(rate)} ft/min`;
        return `↓ ${Math.abs(rate)} ft/min`;
    }
    
    /**
     * Clear all aircraft data
     */
    function clearAll() {
        aircraftMap.clear();
        filteredAircraft = [];
        selectedAircraft = null;
    }
    
    /**
     * Export aircraft data (for debugging/analysis)
     */
    function exportData() {
        return {
            aircraft: Array.from(aircraftMap.values()),
            filters: filters,
            stats: getStats(),
            timestamp: new Date().toISOString(),
        };
    }
    
    // Public API
    return {
        updateAircraft,
        getFilteredAircraft,
        getAircraft,
        selectAircraft,
        getSelectedAircraft,
        deselectAircraft,
        setFilter,
        getFilters,
        getStats,
        getAircraftInBounds,
        getAltitudeColor,
        formatAircraftData,
        clearAll,
        exportData,
    };
    
})();

// Make globally accessible
window.AircraftManager = AircraftManager;
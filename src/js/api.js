/**
 * SkyWatch Radar - API Module
 * 
 * Handles all external API requests with rate limiting and error handling
 */

const API = (function() {
    'use strict';
    
    // Rate limiting state
    let lastRequestTime = 0;
    let requestQueue = [];
    let isProcessingQueue = false;
    
    /**
     * Enforce rate limiting
     */
    function canMakeRequest() {
        const now = Date.now();
        const timeSinceLastRequest = now - lastRequestTime;
        return timeSinceLastRequest >= CONFIG.api.opensky.rateLimit.minInterval;
    }
    
    /**
     * Wait for rate limit clearance
     */
    async function waitForRateLimit() {
        if (canMakeRequest()) {
            return;
        }
        
        const now = Date.now();
        const timeSinceLastRequest = now - lastRequestTime;
        const waitTime = CONFIG.api.opensky.rateLimit.minInterval - timeSinceLastRequest;
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    /**
     * Fetch all current aircraft states
     * 
     * @param {Object} options - Optional parameters
     * @param {number} options.time - Unix timestamp (seconds) for historical data
     * @param {Array} options.bbox - Bounding box [lat_min, lon_min, lat_max, lon_max]
     * @returns {Promise<Array>} Aircraft state data
     */
    async function getAllStates(options = {}) {
        await waitForRateLimit();
        
        try {
            const params = new URLSearchParams();
            
            // Add optional parameters
            if (options.time) {
                params.append('time', options.time);
            }
            if (options.bbox && options.bbox.length === 4) {
                params.append('lamin', options.bbox[0]);
                params.append('lomin', options.bbox[1]);
                params.append('lamax', options.bbox[2]);
                params.append('lomax', options.bbox[3]);
            }
            
            const url = `${CONFIG.api.opensky.baseUrl}${CONFIG.api.opensky.endpoints.states}?${params}`;
            
            const response = await fetch(url);
            lastRequestTime = Date.now();
            
            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error('Rate limit exceeded. Please wait before refreshing.');
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // OpenSky API response format:
            // {
            //   time: number,
            //   states: [array of state vectors]
            // }
            
            if (!data || !data.states) {
                return [];
            }
            
            // Transform state vectors into usable aircraft objects
            return data.states.map(state => parseStateVector(state)).filter(Boolean);
            
        } catch (error) {
            console.error('Error fetching aircraft states:', error);
            throw error;
        }
    }
    
    /**
     * Parse OpenSky Network state vector into aircraft object
     * 
     * State vector format (indices):
     * 0: icao24 - unique ICAO 24-bit address
     * 1: callsign - callsign (can be null)
     * 2: origin_country - country of origin
     * 3: time_position - Unix timestamp of last position update
     * 4: last_contact - Unix timestamp of last update
     * 5: longitude - in decimal degrees
     * 6: latitude - in decimal degrees
     * 7: baro_altitude - barometric altitude in meters
     * 8: on_ground - boolean
     * 9: velocity - in m/s
     * 10: true_track - in degrees (0-360)
     * 11: vertical_rate - in m/s
     * 12: sensors - array of sensor IDs
     * 13: geo_altitude - geometric altitude in meters
     * 14: squawk - transponder code
     * 15: spi - special position indicator
     * 16: position_source - 0=ADS-B, 1=ASTERIX, 2=MLAT
     */
    function parseStateVector(state) {
        // Validate required fields
        if (!state || state.length < 17) {
            return null;
        }
        
        const [
            icao24,
            callsign,
            origin_country,
            time_position,
            last_contact,
            longitude,
            latitude,
            baro_altitude,
            on_ground,
            velocity,
            true_track,
            vertical_rate,
            sensors,
            geo_altitude,
            squawk,
            spi,
            position_source
        ] = state;
        
        // Skip aircraft without position data
        if (latitude === null || longitude === null) {
            return null;
        }
        
        // Convert units
        const altitude = baro_altitude !== null ? Math.round(baro_altitude * 3.28084) : null; // meters to feet
        const speed = velocity !== null ? Math.round(velocity * 1.94384) : null; // m/s to knots
        const verticalRate = vertical_rate !== null ? Math.round(vertical_rate * 196.85) : null; // m/s to ft/min
        const heading = true_track !== null ? Math.round(true_track) : null;
        
        // Data quality check
        if (!isValidAircraftData({ latitude, longitude, altitude, speed })) {
            return null;
        }
        
        // Determine if military
        const isMilitary = isMilitaryAircraft(icao24, callsign);
        
        return {
            icao24: icao24.trim(),
            callsign: callsign ? callsign.trim() : 'N/A',
            origin: origin_country || 'Unknown',
            
            // Position
            lat: latitude,
            lon: longitude,
            altitude: altitude,
            onGround: on_ground || false,
            
            // Velocity
            speed: speed,
            heading: heading,
            verticalRate: verticalRate,
            
            // Metadata
            lastUpdate: last_contact,
            positionUpdate: time_position,
            squawk: squawk,
            positionSource: ['ADS-B', 'ASTERIX', 'MLAT'][position_source] || 'Unknown',
            
            // Classification
            isMilitary: isMilitary,
            
            // Trail history
            trail: [],
            
            // Internal tracking
            _lastSeen: Date.now(),
        };
    }
    
    /**
     * Validate aircraft data quality
     */
    function isValidAircraftData(data) {
        const { latitude, longitude, altitude, speed } = data;
        const { minSpeed, maxSpeed, minAltitude, maxAltitude } = CONFIG.dataQuality;
        
        // Check position bounds
        if (latitude < -90 || latitude > 90) return false;
        if (longitude < -180 || longitude > 180) return false;
        
        // Check altitude if present
        if (altitude !== null && (altitude < minAltitude || altitude > maxAltitude)) {
            return false;
        }
        
        // Check speed if present
        if (speed !== null && (speed < minSpeed || speed > maxSpeed)) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Determine if aircraft is military based on ICAO hex code and callsign
     * 
     * DISCLAIMER: This is heuristic and not 100% accurate. True military
     * identification requires comprehensive, maintained databases.
     */
    function isMilitaryAircraft(icao24, callsign) {
        if (!icao24) return false;
        
        // Convert ICAO hex to number for range comparison
        const icaoNum = parseInt(icao24.trim(), 16);
        
        // Check ICAO ranges
        const { icaoRanges } = CONFIG.aircraft.militaryIndicators;
        const inMilitaryRange = icaoRanges.some(range => 
            icaoNum >= range.start && icaoNum <= range.end
        );
        
        if (inMilitaryRange) return true;
        
        // Check callsign prefixes
        if (callsign) {
            const cleanCallsign = callsign.trim().toUpperCase();
            const { callsignPrefixes } = CONFIG.aircraft.militaryIndicators;
            
            const hasMilitaryCallsign = callsignPrefixes.some(prefix =>
                cleanCallsign.startsWith(prefix)
            );
            
            if (hasMilitaryCallsign) return true;
        }
        
        return false;
    }
    
    /**
     * Get aircraft track history (requires specific ICAO24 and timeframe)
     * Note: This endpoint has stricter rate limits
     */
    async function getAircraftTrack(icao24, timeStart) {
        // This feature requires more API credits or registration
        // For now, we'll track trails client-side from live data
        console.warn('Historical track API not implemented in free tier');
        return [];
    }
    
    /**
     * Get bounding box from current map view
     */
    function getBoundsFromMap(map) {
        const bounds = map.getBounds();
        return [
            bounds.getSouth(),
            bounds.getWest(),
            bounds.getNorth(),
            bounds.getEast()
        ];
    }
    
    // Public API
    return {
        getAllStates,
        getAircraftTrack,
        getBoundsFromMap,
        isMilitaryAircraft,
        canMakeRequest,
    };
    
})();

// Make API globally accessible
window.API = API;
/**
 * SkyWatch Radar - Configuration
 * 
 * API endpoints, application constants, and region definitions
 */

const CONFIG = {
    // API Configuration
    api: {
        // OpenSky Network - Free, public ADS-B data
        // Documentation: https://openskynetwork.github.io/opensky-api/
        opensky: {
            baseUrl: 'https://opensky-network.org/api',
            endpoints: {
                states: '/states/all',  // All current aircraft states
                ownStates: '/states/own',  // User's receivers (requires auth)
                tracks: '/tracks/all',  // Historical track for specific aircraft
            },
            // Rate limits: 10 requests per second for anonymous users
            rateLimit: {
                requestsPerSecond: 4,  // Conservative to avoid hitting limits
                minInterval: 10000,  // 10 seconds between updates (recommended)
            }
        },
        
        // IMPORTANT: Military aircraft tracking limitations
        // Most military aircraft do NOT broadcast ADS-B or use encrypted transponders
        // What we can track:
        // - Military transport/cargo aircraft (often broadcast ADS-B)
        // - Training flights
        // - Some NATO aircraft during certain operations
        // - Military aircraft in civilian airspace (regulatory requirement)
        //
        // What we CANNOT track:
        // - Combat aircraft on active missions
        // - Stealth aircraft
        // - Aircraft with ADS-B disabled
        // - Classified operations
    },
    
    // Update intervals
    intervals: {
        liveUpdate: 10000,  // 10 seconds for live mode
        historyUpdate: 5000,  // 5 seconds when playing back history
        trailCleanup: 30000,  // 30 seconds to clean old trail points
    },
    
    // Map configuration
    map: {
        // Default view (global)
        defaultView: {
            center: [20, 0],
            zoom: 3
        },
        
        // Map tile layers
        tiles: {
            // CartoDB Dark Matter - Perfect for flight tracking
            dark: {
                url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                maxZoom: 19
            }
        },
        
        // Zoom levels
        minZoom: 2,
        maxZoom: 18,
        
        // Bounds
        maxBounds: [[-90, -180], [90, 180]],
        maxBoundsViscosity: 0.95,
    },
    
    // Region definitions for quick focus
    regions: {
        'middle-east': {
            name: 'Middle East',
            bounds: [[15, 25], [42, 65]],
            center: [28.5, 45],
            zoom: 5,
            description: 'Focus on Iran, Iraq, Israel, Saudi Arabia, UAE'
        },
        'europe': {
            name: 'Europe',
            bounds: [[35, -10], [70, 40]],
            center: [52.5, 15],
            zoom: 4,
            description: 'Focus on European airspace'
        },
        'north-america': {
            name: 'North America',
            bounds: [[25, -130], [50, -60]],
            center: [37.5, -95],
            zoom: 4,
            description: 'Focus on USA and Canada'
        },
        'asia': {
            name: 'Asia Pacific',
            bounds: [[0, 90], [50, 150]],
            center: [25, 120],
            zoom: 4,
            description: 'Focus on East and Southeast Asia'
        },
        'global': {
            name: 'Global',
            center: [20, 0],
            zoom: 3,
            description: 'Worldwide view'
        }
    },
    
    // Aircraft classification
    aircraft: {
        // Military aircraft identification (based on ICAO hex ranges and callsigns)
        // This is approximate - true military identification requires comprehensive databases
        militaryIndicators: {
            // ICAO hex ranges commonly used by military
            // US Military: https://en.wikipedia.org/wiki/Aviation_transponder_interrogation_modes
            icaoRanges: [
                { start: 0xADF7C8, end: 0xAFFFFF }, // US Military
                { start: 0x43C000, end: 0x43CFFF }, // UK Military (RAF)
                { start: 0x3AA000, end: 0x3AFFFF }, // Germany Military
                { start: 0x3BA000, end: 0x3BFFFF }, // France Military
            ],
            
            // Common military callsign prefixes
            callsignPrefixes: [
                'RCH',    // Reach (USAF)
                'EVAL',   // US Military eval
                'ARMY',   // US Army
                'NAVY',   // US Navy
                'CNV',    // US Air Force (Convoy)
                'SPAR',   // USAF Special Air Mission
                'JAKE',   // USAF tanker
                'CHIEF',  // USAF transport
                'BOXER',  // Various military
                'HUNT',   // Various military
                'NATO',   // NATO
                'RAF',    // Royal Air Force
                'GAF',    // German Air Force
                'RSAF',   // Royal Saudi Air Force
            ],
            
            // Aircraft types that are typically military
            aircraftTypes: [
                'C130',   // Hercules
                'C17',    // Globemaster
                'KC135',  // Stratotanker
                'KC10',   // Extender
                'E3',     // AWACS
                'P8',     // Poseidon
                'C5',     // Galaxy
                'A400M',  // Atlas
            ]
        },
        
        // Display settings
        display: {
            iconSize: 24,
            selectedIconSize: 32,
            minSpeedForRotation: 50,  // knots
            trailMaxPoints: 100,
            trailDuration: 600000,  // 10 minutes in milliseconds
        },
        
        // Altitude ranges for color coding
        altitudeRanges: {
            ground: { max: 1000, color: '#94a3b8' },
            low: { min: 1000, max: 10000, color: '#60a5fa' },
            medium: { min: 10000, max: 25000, color: '#3b82f6' },
            high: { min: 25000, max: 40000, color: '#2563eb' },
            extreme: { min: 40000, color: '#1e40af' }
        }
    },
    
    // Performance settings
    performance: {
        maxAircraftDisplay: 500,  // Max aircraft to render
        clusterDistance: 80,  // Pixels for clustering
        trailUpdateInterval: 2000,  // Update trails every 2 seconds
    },
    
    // Feature flags
    features: {
        trails: true,
        labels: true,
        clustering: false,
        heatmap: false,  // Future feature
        predictions: false,  // Future feature
    },
    
    // Data quality thresholds
    dataQuality: {
        minUpdateInterval: 5,  // Seconds - data older than this is stale
        maxUpdateInterval: 60,  // Seconds - data older than this is discarded
        minSpeed: 30,  // Knots - below this is likely ground vehicle
        maxSpeed: 700,  // Knots - above this is likely erroneous
        minAltitude: -1000,  // Feet - account for airports below sea level
        maxAltitude: 60000,  // Feet - above this is likely erroneous
    },
    
    // Toast notification settings
    notifications: {
        duration: 3000,  // milliseconds
        maxVisible: 3,
    },
    
    // Storage keys for persistence
    storage: {
        preferences: 'skywatch_preferences',
        history: 'skywatch_history',
        favorites: 'skywatch_favorites',
    },
    
    // App metadata
    app: {
        name: 'SkyWatch Radar',
        version: '1.0.0',
        repo: 'https://github.com/yourusername/skywatch-radar',
        credits: 'Data provided by OpenSky Network',
    }
};

// Make config globally accessible
window.CONFIG = CONFIG;

// Freeze config to prevent modifications
Object.freeze(CONFIG);
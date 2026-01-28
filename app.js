/* ========================================
   INTEL MOTION STUDIO - APPLICATION
   2026 Production Build
   ======================================== */

// ====== APPLICATION STATE ======

const AppState = {
    map: null,
    layers: {
        seismic: null,
        aviation: null,
        regions: null
    },
    regions: {},
    newsCache: [],
    timeline: {
        playing: false,
        currentScene: 0,
        progress: 0,
        scenes: []
    },
    captureMode: false,
    panelMinimized: false
};

// ====== INITIALIZATION ======

document.addEventListener('DOMContentLoaded', async () => {
    await initializeApp();
});

async function initializeApp() {
    console.log('[IMS] Initializing Intel Motion Studio...');
    
    try {
        // Stage 0: Initialize renderer
        await updateLoadingStage(0);
        await sleep(500);
        
        // Stage 1: Load base map
        await updateLoadingStage(1);
        await initializeMap();
        await sleep(500);
        
        // Stage 2: Fetch public data
        await updateLoadingStage(2);
        await Promise.allSettled([
            loadRegions(),
            loadNewsFeeds(),
            loadSeismicData()
        ]);
        await sleep(500);
        
        // Stage 3: Prepare timeline
        await updateLoadingStage(3);
        initializeTimeline();
        await sleep(500);
        
        // Stage 4: Ready
        await updateLoadingStage(4);
        await sleep(800);
        
        // Initialize UI components
        initializeUI();
        
        // Hide loading screen
        hideLoadingScreen();
        
        console.log('[IMS] Initialization complete');
        
    } catch (error) {
        console.error('[IMS] Initialization error:', error);
        // App still loads with degraded functionality
        hideLoadingScreen();
        showNotification('Some features may be unavailable', 'warning');
    }
}

// ====== LOADING SYSTEM ======

function updateLoadingStage(stageIndex) {
    return new Promise(resolve => {
        const stages = document.querySelectorAll('.stage');
        
        // Mark previous stages as complete
        stages.forEach((stage, index) => {
            if (index < stageIndex) {
                stage.classList.remove('active');
                stage.classList.add('complete');
            } else if (index === stageIndex) {
                stage.classList.add('active');
                stage.classList.remove('complete');
            } else {
                stage.classList.remove('active', 'complete');
            }
        });
        
        console.log(`[IMS] Loading stage ${stageIndex}: ${stages[stageIndex]?.textContent.trim()}`);
        resolve();
    });
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.classList.remove('active');
    setTimeout(() => {
        loadingScreen.style.display = 'none';
    }, 500);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ====== MAP INITIALIZATION ======

async function initializeMap() {
    console.log('[IMS] Initializing map...');
    
    // Create Leaflet map instance
    AppState.map = L.map('map', {
        center: [20, 0],
        zoom: 3,
        zoomControl: true,
        minZoom: 2,
        maxZoom: 18,
        worldCopyJump: true,
        zoomAnimation: true,
        fadeAnimation: true,
        markerZoomAnimation: true
    });
    
    // Add dark tile layer (CartoDB Dark Matter - free, no API key)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(AppState.map);
    
    // Initialize layer groups
    AppState.layers.seismic = L.layerGroup().addTo(AppState.map);
    AppState.layers.aviation = L.layerGroup(); // Not added by default
    AppState.layers.regions = L.layerGroup().addTo(AppState.map);
    
    console.log('[IMS] Map initialized successfully');
}

// ====== DATA LOADING ======

async function loadRegions() {
    console.log('[IMS] Loading regions...');
    
    try {
        const response = await fetch('data/regions.json');
        const data = await response.json();
        AppState.regions = data.regions;
        
        // Draw region overlays
        drawRegionOverlays();
        
        console.log('[IMS] Regions loaded:', Object.keys(AppState.regions).length);
    } catch (error) {
        console.error('[IMS] Failed to load regions:', error);
        // Fallback: hardcode basic regions
        AppState.regions = {
            middle_east: { name: 'Middle East', center: [29, 47], zoom: 5 },
            europe: { name: 'Europe', center: [50, 10], zoom: 4 },
            uk: { name: 'UK', center: [54, -2.5], zoom: 6 }
        };
    }
}

function drawRegionOverlays() {
    // Draw subtle region boundaries for context
    const regionBounds = {
        middle_east: [[15, 25], [40, 65]],
        europe: [[35, -10], [70, 40]],
        uk: [[49, -8], [61, 2]]
    };
    
    Object.entries(regionBounds).forEach(([key, bounds]) => {
        const rectangle = L.rectangle(bounds, {
            color: 'rgba(0, 255, 200, 0.3)',
            weight: 1,
            fill: false,
            dashArray: '5, 10',
            interactive: false
        });
        
        AppState.layers.regions.addLayer(rectangle);
    });
}

// ====== SEISMIC DATA (USGS) ======

async function loadSeismicData() {
    console.log('[IMS] Loading seismic data from USGS...');
    
    try {
        // USGS Earthquake API - public, no key required, 15min delay
        const response = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson');
        
        if (!response.ok) throw new Error('USGS feed unavailable');
        
        const data = await response.json();
        
        // Clear existing markers
        AppState.layers.seismic.clearLayers();
        
        // Add earthquake markers
        data.features.forEach(feature => {
            const coords = feature.geometry.coordinates;
            const props = feature.properties;
            
            // Size and color based on magnitude
            const mag = props.mag;
            const radius = Math.max(3, mag * 2);
            const color = mag >= 5 ? '#ff453a' : mag >= 4 ? '#ff9500' : '#00ffc8';
            
            const marker = L.circleMarker([coords[1], coords[0]], {
                radius: radius,
                fillColor: color,
                color: color,
                weight: 1,
                opacity: 0.8,
                fillOpacity: 0.4
            });
            
            marker.bindPopup(`
                <strong>M${mag.toFixed(1)} Earthquake</strong><br>
                ${props.place}<br>
                <small>${new Date(props.time).toLocaleString()}</small><br>
                <small>Source: USGS (15min delay)</small>
            `);
            
            AppState.layers.seismic.addLayer(marker);
        });
        
        console.log('[IMS] Seismic data loaded:', data.features.length, 'events');
        updateOverlayStatus(`${data.features.length} seismic events (USGS)`);
        
    } catch (error) {
        console.error('[IMS] Failed to load seismic data:', error);
        updateOverlayStatus('Seismic data unavailable');
    }
}

// ====== AVIATION DATA (SIMULATED) ======

function loadAviationData() {
    console.log('[IMS] Loading aviation density data...');
    
    // Clear existing
    AppState.layers.aviation.clearLayers();
    
    // Major airport hubs (public knowledge, static data)
    const hubs = [
        { name: 'London', pos: [51.5, -0.1], density: 'high' },
        { name: 'Dubai', pos: [25.2, 55.3], density: 'high' },
        { name: 'Istanbul', pos: [41.0, 28.9], density: 'high' },
        { name: 'Frankfurt', pos: [50.0, 8.6], density: 'medium' },
        { name: 'Paris', pos: [49.0, 2.5], density: 'medium' },
        { name: 'Amsterdam', pos: [52.3, 4.8], density: 'medium' }
    ];
    
    hubs.forEach(hub => {
        const radius = hub.density === 'high' ? 40 : 25;
        const circle = L.circle(hub.pos, {
            radius: radius * 1000,
            color: 'rgba(100, 150, 255, 0.6)',
            fillColor: 'rgba(100, 150, 255, 0.2)',
            fillOpacity: 0.3,
            weight: 1
        });
        
        circle.bindPopup(`
            <strong>${hub.name}</strong><br>
            Aviation density: ${hub.density}<br>
            <small>Aggregated public data</small>
        `);
        
        AppState.layers.aviation.addLayer(circle);
    });
    
    console.log('[IMS] Aviation data loaded');
}

// ====== NEWS FEEDS ======

async function loadNewsFeeds() {
    console.log('[IMS] Loading news feeds...');
    
    const newsFeed = document.getElementById('news-feed');
    
    try {
        // Use RSS2JSON service (free tier, CORS-friendly)
        // Fallback approach: fetch multiple sources
        const feeds = [
            { name: 'BBC', url: 'http://feeds.bbci.co.uk/news/world/rss.xml' },
            { name: 'Reuters', url: 'https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best' }
        ];
        
        // Clear loading state
        newsFeed.innerHTML = '';
        
        // For this demo, we'll show a curated list since RSS feeds can be blocked by CORS
        // In production with a backend, these would be live feeds
        const demoNews = [
            {
                source: 'BBC',
                title: 'Middle East tensions continue amid diplomatic efforts',
                time: '2 hours ago',
                link: '#'
            },
            {
                source: 'Reuters',
                title: 'European leaders discuss regional security cooperation',
                time: '3 hours ago',
                link: '#'
            },
            {
                source: 'Al Jazeera',
                title: 'UN reports on humanitarian situation in conflict zones',
                time: '5 hours ago',
                link: '#'
            },
            {
                source: 'BBC',
                title: 'Seismic activity monitored in Mediterranean region',
                time: '6 hours ago',
                link: '#'
            },
            {
                source: 'AP',
                title: 'NATO conducts routine air exercises over eastern Europe',
                time: '8 hours ago',
                link: '#'
            }
        ];
        
        AppState.newsCache = demoNews;
        displayNews(demoNews);
        
        console.log('[IMS] News feeds loaded');
        
    } catch (error) {
        console.error('[IMS] Failed to load news feeds:', error);
        newsFeed.innerHTML = '<div class="news-error">News feeds temporarily unavailable. Using cached data.</div>';
    }
}

function displayNews(items) {
    const newsFeed = document.getElementById('news-feed');
    newsFeed.innerHTML = '';
    
    items.forEach(item => {
        const newsItem = document.createElement('div');
        newsItem.className = 'news-item';
        newsItem.innerHTML = `
            <div class="news-source">${item.source}</div>
            <div class="news-title">${item.title}</div>
            <div class="news-time">${item.time}</div>
        `;
        
        newsItem.addEventListener('click', () => {
            // In production, would open article
            showNotification('News article view (demo mode)', 'info');
        });
        
        newsFeed.appendChild(newsItem);
    });
}

// ====== TIMELINE SYSTEM ======

function initializeTimeline() {
    console.log('[IMS] Initializing timeline...');
    
    // Define animation scenes
    AppState.timeline.scenes = [
        {
            name: 'Global Overview',
            duration: 3000,
            center: [20, 0],
            zoom: 3,
            caption: 'Global intelligence overview - Public data sources',
            layers: ['seismic', 'regions']
        },
        {
            name: 'Middle East Focus',
            duration: 4000,
            center: [29, 47],
            zoom: 5,
            caption: 'Middle East region - Geopolitical monitoring',
            layers: ['seismic', 'regions']
        },
        {
            name: 'Eastern Mediterranean',
            duration: 4000,
            center: [35, 28],
            zoom: 6,
            caption: 'Eastern Mediterranean - Strategic waterways',
            layers: ['seismic', 'aviation', 'regions']
        },
        {
            name: 'Europe Overview',
            duration: 3500,
            center: [50, 10],
            zoom: 4,
            caption: 'European region - Continental security context',
            layers: ['seismic', 'aviation', 'regions']
        },
        {
            name: 'UK Focus',
            duration: 3000,
            center: [54, -2.5],
            zoom: 6,
            caption: 'United Kingdom - Regional analysis',
            layers: ['seismic', 'regions']
        }
    ];
    
    // Render scene blocks
    renderTimelineScenes();
    
    console.log('[IMS] Timeline initialized with', AppState.timeline.scenes.length, 'scenes');
}

function renderTimelineScenes() {
    const scenesContainer = document.getElementById('timeline-scenes');
    scenesContainer.innerHTML = '';
    
    AppState.timeline.scenes.forEach((scene, index) => {
        const block = document.createElement('div');
        block.className = 'scene-block';
        block.dataset.index = index + 1;
        block.title = scene.name;
        
        block.addEventListener('click', () => {
            jumpToScene(index);
        });
        
        scenesContainer.appendChild(block);
    });
}

function jumpToScene(sceneIndex) {
    if (AppState.timeline.playing) {
        stopTimeline();
    }
    
    AppState.timeline.currentScene = sceneIndex;
    const scene = AppState.timeline.scenes[sceneIndex];
    
    // Update UI
    updateActiveScene(sceneIndex);
    
    // Animate to scene
    animateToScene(scene);
}

function animateToScene(scene) {
    console.log('[IMS] Animating to scene:', scene.name);
    
    // Update layers
    updateSceneLayers(scene.layers);
    
    // Animate map
    AppState.map.flyTo(scene.center, scene.zoom, {
        duration: 2,
        easeLinearity: 0.5
    });
    
    // Show caption
    showCaption(scene.caption);
    
    // Update overlay status
    updateOverlayStatus(scene.layers.map(l => l.toUpperCase()).join(' • '));
}

function updateSceneLayers(activeLayers) {
    // Seismic layer
    if (activeLayers.includes('seismic')) {
        if (!AppState.map.hasLayer(AppState.layers.seismic)) {
            AppState.map.addLayer(AppState.layers.seismic);
        }
    } else {
        AppState.map.removeLayer(AppState.layers.seismic);
    }
    
    // Aviation layer
    if (activeLayers.includes('aviation')) {
        if (!AppState.map.hasLayer(AppState.layers.aviation)) {
            // Load aviation data if needed
            if (!AppState.layers.aviation.getLayers().length) {
                loadAviationData();
            }
            AppState.map.addLayer(AppState.layers.aviation);
        }
    } else {
        AppState.map.removeLayer(AppState.layers.aviation);
    }
    
    // Regions layer
    if (activeLayers.includes('regions')) {
        if (!AppState.map.hasLayer(AppState.layers.regions)) {
            AppState.map.addLayer(AppState.layers.regions);
        }
    } else {
        AppState.map.removeLayer(AppState.layers.regions);
    }
}

function updateActiveScene(sceneIndex) {
    document.querySelectorAll('.scene-block').forEach((block, index) => {
        block.classList.toggle('active', index === sceneIndex);
    });
}

// ====== TIMELINE PLAYBACK ======

let timelineInterval = null;
let sceneStartTime = 0;

function playTimeline() {
    if (AppState.timeline.playing) return;
    
    console.log('[IMS] Starting timeline playback');
    AppState.timeline.playing = true;
    document.getElementById('btn-play').classList.add('active');
    
    sceneStartTime = Date.now();
    const scene = AppState.timeline.scenes[AppState.timeline.currentScene];
    
    // Animate to current scene
    animateToScene(scene);
    
    // Start progress tracking
    timelineInterval = setInterval(updateTimelineProgress, 50);
}

function pauseTimeline() {
    if (!AppState.timeline.playing) return;
    
    console.log('[IMS] Pausing timeline');
    AppState.timeline.playing = false;
    document.getElementById('btn-play').classList.remove('active');
    
    clearInterval(timelineInterval);
}

function stopTimeline() {
    pauseTimeline();
    AppState.timeline.currentScene = 0;
    AppState.timeline.progress = 0;
    updateTimelineProgressBar(0);
    hideCaption();
}

function restartTimeline() {
    console.log('[IMS] Restarting timeline');
    stopTimeline();
    AppState.timeline.currentScene = 0;
    playTimeline();
}

function updateTimelineProgress() {
    const scene = AppState.timeline.scenes[AppState.timeline.currentScene];
    const elapsed = Date.now() - sceneStartTime;
    const sceneProgress = elapsed / scene.duration;
    
    if (sceneProgress >= 1) {
        // Move to next scene
        if (AppState.timeline.currentScene < AppState.timeline.scenes.length - 1) {
            AppState.timeline.currentScene++;
            sceneStartTime = Date.now();
            const nextScene = AppState.timeline.scenes[AppState.timeline.currentScene];
            animateToScene(nextScene);
            updateActiveScene(AppState.timeline.currentScene);
        } else {
            // End of timeline
            stopTimeline();
            return;
        }
    }
    
    // Calculate overall progress
    const totalDuration = AppState.timeline.scenes.reduce((sum, s) => sum + s.duration, 0);
    const passedDuration = AppState.timeline.scenes
        .slice(0, AppState.timeline.currentScene)
        .reduce((sum, s) => sum + s.duration, 0) + elapsed;
    
    const overallProgress = (passedDuration / totalDuration) * 100;
    updateTimelineProgressBar(overallProgress);
}

function updateTimelineProgressBar(percent) {
    document.getElementById('timeline-progress').style.width = percent + '%';
}

// ====== CAPTION SYSTEM ======

function showCaption(text) {
    const captionOverlay = document.getElementById('caption-overlay');
    const captionText = document.getElementById('caption-text');
    
    captionText.textContent = text;
    captionOverlay.classList.add('active');
    
    // Auto-hide after 3 seconds unless in animation
    if (!AppState.timeline.playing) {
        setTimeout(() => {
            hideCaption();
        }, 3000);
    }
}

function hideCaption() {
    document.getElementById('caption-overlay').classList.remove('active');
}

// ====== OVERLAY STATUS ======

function updateOverlayStatus(text) {
    document.getElementById('overlay-status').textContent = text;
}

// ====== UI INITIALIZATION ======

function initializeUI() {
    console.log('[IMS] Initializing UI controls...');
    
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });
    
    // Panel minimize
    document.getElementById('btn-minimize').addEventListener('click', togglePanel);
    
    // Timeline controls
    document.getElementById('btn-play').addEventListener('click', playTimeline);
    document.getElementById('btn-pause').addEventListener('click', pauseTimeline);
    document.getElementById('btn-restart').addEventListener('click', restartTimeline);
    
    // Layer toggles
    document.getElementById('layer-seismic').addEventListener('change', (e) => {
        if (e.target.checked) {
            AppState.map.addLayer(AppState.layers.seismic);
        } else {
            AppState.map.removeLayer(AppState.layers.seismic);
        }
    });
    
    document.getElementById('layer-aviation').addEventListener('change', (e) => {
        if (e.target.checked) {
            if (!AppState.layers.aviation.getLayers().length) {
                loadAviationData();
            }
            AppState.map.addLayer(AppState.layers.aviation);
        } else {
            AppState.map.removeLayer(AppState.layers.aviation);
        }
    });
    
    document.getElementById('layer-regions').addEventListener('change', (e) => {
        if (e.target.checked) {
            AppState.map.addLayer(AppState.layers.regions);
        } else {
            AppState.map.removeLayer(AppState.layers.regions);
        }
    });
    
    // Floating controls
    document.getElementById('btn-capture').addEventListener('click', toggleCaptureMode);
    document.getElementById('btn-regions').addEventListener('click', toggleRegionsMenu);
    
    // Quick regions
    document.querySelectorAll('.region-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const regionKey = btn.dataset.region;
            flyToRegion(regionKey);
        });
    });
    
    console.log('[IMS] UI initialized');
}

// ====== UI CONTROLS ======

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.dataset.tabContent === tabName);
    });
}

function togglePanel() {
    AppState.panelMinimized = !AppState.panelMinimized;
    const panel = document.getElementById('control-panel');
    panel.classList.toggle('minimized', AppState.panelMinimized);
    
    // Update button text
    document.getElementById('btn-minimize').textContent = AppState.panelMinimized ? '+' : '−';
}

function toggleCaptureMode() {
    AppState.captureMode = !AppState.captureMode;
    document.body.classList.toggle('capture-mode', AppState.captureMode);
    document.getElementById('btn-capture').classList.toggle('active', AppState.captureMode);
    
    if (AppState.captureMode) {
        showNotification('Capture Mode: UI hidden, ready for recording', 'info');
        // Hide caption after brief delay
        setTimeout(hideCaption, 2000);
    } else {
        showNotification('Capture Mode: Off', 'info');
    }
}

let regionsMenuVisible = false;

function toggleRegionsMenu() {
    regionsMenuVisible = !regionsMenuVisible;
    const menu = document.getElementById('quick-regions');
    menu.classList.toggle('visible', regionsMenuVisible);
    document.getElementById('btn-regions').classList.toggle('active', regionsMenuVisible);
}

function flyToRegion(regionKey) {
    const region = AppState.regions[regionKey];
    if (!region) return;
    
    console.log('[IMS] Flying to region:', region.name);
    
    AppState.map.flyTo(region.center, region.zoom, {
        duration: 2,
        easeLinearity: 0.5
    });
    
    showCaption(region.description || region.name);
    
    // Close menu
    regionsMenuVisible = false;
    document.getElementById('quick-regions').classList.remove('visible');
    document.getElementById('btn-regions').classList.remove('active');
}

// ====== NOTIFICATION SYSTEM ======

function showNotification(message, type = 'info') {
    // Simple console-based notification for now
    // In production, could add a toast notification system
    console.log(`[IMS] ${type.toUpperCase()}: ${message}`);
    
    // Update overlay status temporarily
    const originalStatus = document.getElementById('overlay-status').textContent;
    updateOverlayStatus(message);
    
    setTimeout(() => {
        updateOverlayStatus(originalStatus);
    }, 3000);
}

// ====== KEYBOARD SHORTCUTS ======

document.addEventListener('keydown', (e) => {
    // Space: Play/Pause timeline
    if (e.code === 'Space' && !e.target.matches('input, textarea')) {
        e.preventDefault();
        if (AppState.timeline.playing) {
            pauseTimeline();
        } else {
            playTimeline();
        }
    }
    
    // C: Toggle capture mode
    if (e.code === 'KeyC' && e.ctrlKey) {
        e.preventDefault();
        toggleCaptureMode();
    }
    
    // R: Restart timeline
    if (e.code === 'KeyR' && e.ctrlKey) {
        e.preventDefault();
        restartTimeline();
    }
    
    // M: Toggle panel
    if (e.code === 'KeyM' && e.ctrlKey) {
        e.preventDefault();
        togglePanel();
    }
});

// ====== MOBILE OPTIMIZATIONS ======

// Prevent double-tap zoom on iOS
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Handle orientation changes
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        AppState.map.invalidateSize();
    }, 100);
});

// Handle window resize
window.addEventListener('resize', () => {
    AppState.map.invalidateSize();
});

// ====== ERROR HANDLING ======

window.addEventListener('error', (e) => {
    console.error('[IMS] Runtime error:', e.error);
    // App continues to function
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('[IMS] Unhandled promise rejection:', e.reason);
    // App continues to function
});

// ====== EXPORT FOR DEBUGGING ======

if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.IMS = AppState;
    console.log('[IMS] Debug mode: window.IMS available');
}

console.log('[IMS] Application script loaded');
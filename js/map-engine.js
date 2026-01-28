/**
 * MAP ENGINE MODULE
 * Handles all Mapbox GL operations, markers, layers, animations
 */

export class MapEngine {
    constructor(containerId) {
        this.containerId = containerId;
        this.map = null;
        this.markers = new Map();
        this.layers = new Map();
        
        // Use free Mapbox token - REPLACE WITH YOUR OWN
        // Get free token at: https://account.mapbox.com/access-tokens/
        mapboxgl.accessToken = 'pk.eyJ1IjoiZXhhbXBsZXVzZXIiLCJhIjoiY2t4eHh4eHh4eHh4In0.example_token_replace_me';
    }
    
    init() {
        // Set loading background
        document.getElementById(this.containerId).style.backgroundColor = '#0a1929';
        
        try {
            this.map = new mapboxgl.Map({
                container: this.containerId,
                style: 'mapbox://styles/mapbox/dark-v11',
                center: [54.0, 27.0], // Persian Gulf
                zoom: 4.5,
                pitch: 0,
                bearing: 0,
                antialias: true,
                attributionControl: false
            });
            
            this.map.on('load', () => {
                this.onMapLoad();
            });
            
            this.map.on('error', (e) => {
                console.error('Mapbox error:', e);
                this.showMapError();
            });
            
            // Add navigation controls
            this.map.addControl(new mapboxgl.NavigationControl({
                showCompass: true,
                showZoom: true,
                visualizePitch: true
            }), 'bottom-right');
            
            // Add scale
            this.map.addControl(new mapboxgl.ScaleControl({
                maxWidth: 100,
                unit: 'metric'
            }));
            
        } catch (error) {
            console.error('Failed to initialize map:', error);
            this.showMapError();
        }
    }
    
    showMapError() {
        const container = document.getElementById(this.containerId);
        container.innerHTML = `
            <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                background: linear-gradient(135deg, #0a1929 0%, #1a2940 100%);
                color: #fff;
                flex-direction: column;
                padding: 20px;
                text-align: center;
            ">
                <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
                <h2 style="margin-bottom: 10px; color: #4a9eff;">Map Loading Issue</h2>
                <p style="color: #8a9bb5; max-width: 400px; line-height: 1.6;">
                    Unable to load Mapbox map. Please:<br><br>
                    1. Get a free token at <a href="https://account.mapbox.com" target="_blank" style="color: #4a9eff;">mapbox.com</a><br>
                    2. Replace token in js/map-engine.js (line 14)<br>
                    3. Refresh the page
                </p>
            </div>
        `;
    }
    
    onMapLoad() {
        console.log('Map loaded successfully');
        
        // Style water
        if (this.map.getLayer('water')) {
            this.map.setPaintProperty('water', 'water-color', '#0a1929');
        }
        
        // Add atmosphere
        this.map.setFog({
            'color': 'rgb(186, 210, 235)',
            'high-color': 'rgb(36, 92, 223)',
            'horizon-blend': 0.02,
            'space-color': 'rgb(11, 11, 25)',
            'star-intensity': 0.6
        });
    }
    
    flyTo(options) {
        if (!this.map) return;
        this.map.flyTo({
            ...options,
            duration: 2000,
            essential: true
        });
    }
    
    addMarker({ id, coordinates, type, data, onClick }) {
        if (!this.map) return;
        
        // Create custom marker element
        const el = document.createElement('div');
        el.className = `custom-marker marker-${type}`;
        el.style.width = this.getMarkerSize(type) + 'px';
        el.style.height = this.getMarkerSize(type) + 'px';
        el.style.backgroundColor = this.getMarkerColor(type);
        el.style.borderRadius = type === 'airbase' ? '4px' : '50%';
        el.style.border = `2px solid ${this.getMarkerBorderColor(type)}`;
        el.style.boxShadow = `0 0 20px ${this.getMarkerColor(type)}`;
        el.style.cursor = 'pointer';
        el.style.transition = 'all 0.3s ease';
        
        // Add pulse animation for carriers
        if (type === 'carrier') {
            el.style.animation = 'marker-pulse 2s ease-in-out infinite';
        }
        
        // Hover effect
        el.addEventListener('mouseenter', () => {
            el.style.transform = 'scale(1.3)';
        });
        
        el.addEventListener('mouseleave', () => {
            el.style.transform = 'scale(1)';
        });
        
        // Click handler
        if (onClick) {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                onClick();
            });
        }
        
        // Create and add marker
        const marker = new mapboxgl.Marker(el)
            .setLngLat(coordinates)
            .addTo(this.map);
        
        this.markers.set(id, { marker, data, type });
        
        // Add CSS animation if not already present
        this.addMarkerAnimationStyle();
    }
    
    addMarkerAnimationStyle() {
        if (!document.getElementById('marker-animations')) {
            const style = document.createElement('style');
            style.id = 'marker-animations';
            style.textContent = `
                @keyframes marker-pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(1.1); }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    getMarkerSize(type) {
        const sizes = {
            carrier: 20,
            destroyer: 14,
            airbase: 16,
            allied: 12,
            target: 12
        };
        return sizes[type] || 12;
    }
    
    getMarkerColor(type) {
        const colors = {
            carrier: '#4a9eff',
            destroyer: '#4a9eff',
            airbase: '#ffbb4a',
            allied: '#4aff88',
            target: '#ff4a5f'
        };
        return colors[type] || '#ffffff';
    }
    
    getMarkerBorderColor(type) {
        const colors = {
            carrier: 'rgba(74, 158, 255, 0.8)',
            destroyer: 'rgba(74, 158, 255, 0.6)',
            airbase: 'rgba(255, 187, 74, 0.8)',
            allied: 'rgba(74, 255, 136, 0.8)',
            target: 'rgba(255, 74, 95, 0.8)'
        };
        return colors[type] || 'rgba(255, 255, 255, 0.5)';
    }
    
    addCircle({ id, center, radius, color, borderColor }) {
        if (!this.map) return;
        
        const circleGeoJSON = turf.circle(center, radius / 1000, {
            steps: 64,
            units: 'kilometers'
        });
        
        // Add source
        this.map.addSource(id, {
            type: 'geojson',
            data: circleGeoJSON
        });
        
        // Add fill layer
        this.map.addLayer({
            id: `${id}-fill`,
            type: 'fill',
            source: id,
            paint: {
                'fill-color': color,
                'fill-opacity': 0.3
            }
        });
        
        // Add border layer
        this.map.addLayer({
            id: `${id}-border`,
            type: 'line',
            source: id,
            paint: {
                'line-color': borderColor,
                'line-width': 2,
                'line-opacity': 0.6
            }
        });
        
        this.layers.set(id, { type: 'circle', sourceId: id });
    }
    
    addLine({ id, coordinates, color, width, animated }) {
        if (!this.map) return;
        
        this.map.addSource(id, {
            type: 'geojson',
            data: {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: coordinates
                }
            }
        });
        
        this.map.addLayer({
            id: id,
            type: 'line',
            source: id,
            paint: {
                'line-color': color,
                'line-width': width || 3,
                'line-opacity': 0.8
            }
        });
        
        this.layers.set(id, { type: 'line', sourceId: id });
    }
    
    addArc({ id, start, end, color, height }) {
        if (!this.map) return;
        
        // Create curved arc using Turf.js
        const line = turf.lineString([start, end]);
        const bezier = turf.bezierSpline(line);
        
        this.addLine({
            id: id,
            coordinates: bezier.geometry.coordinates,
            color: color,
            width: 2,
            animated: true
        });
    }
    
    clearLayers() {
        // Remove all markers
        this.markers.forEach(({ marker }) => marker.remove());
        this.markers.clear();
        
        // Remove all layers
        this.layers.forEach(({ sourceId }, layerId) => {
            if (this.map.getLayer(layerId)) {
                this.map.removeLayer(layerId);
            }
            if (this.map.getLayer(`${layerId}-fill`)) {
                this.map.removeLayer(`${layerId}-fill`);
            }
            if (this.map.getLayer(`${layerId}-border`)) {
                this.map.removeLayer(`${layerId}-border`);
            }
            if (this.map.getSource(sourceId)) {
                this.map.removeSource(sourceId);
            }
        });
        this.layers.clear();
    }
    
    removeLayer(id) {
        const layer = this.layers.get(id);
        if (layer && this.map) {
            if (this.map.getLayer(id)) {
                this.map.removeLayer(id);
            }
            if (this.map.getLayer(`${id}-fill`)) {
                this.map.removeLayer(`${id}-fill`);
            }
            if (this.map.getLayer(`${id}-border`)) {
                this.map.removeLayer(`${id}-border`);
            }
            if (this.map.getSource(layer.sourceId)) {
                this.map.removeSource(layer.sourceId);
            }
            this.layers.delete(id);
        }
    }
}

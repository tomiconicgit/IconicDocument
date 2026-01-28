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
        
        // Mapbox access token (free tier - replace with your own)
        mapboxgl.accessToken = 'pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGV4YW1wbGUifQ.example';
    }
    
    init() {
        this.map = new mapboxgl.Map({
            container: this.containerId,
            style: 'mapbox://styles/mapbox/dark-v11',
            center: [54.0, 27.0], // Persian Gulf
            zoom: 5,
            pitch: 45,
            bearing: 0,
            antialias: true
        });
        
        this.map.on('load', () => {
            this.onMapLoad();
        });
        
        // Add navigation controls
        this.map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    }
    
    onMapLoad() {
        console.log('Map loaded successfully');
        
        // Add custom styling
        this.map.setPaintProperty('water', 'water-color', '#0a1929');
        
        // Enable 3D terrain (if available)
        if (this.map.getSource('mapbox-dem')) {
            this.map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
        }
    }
    
    flyTo(options) {
        this.map.flyTo({
            ...options,
            duration: 2000,
            essential: true
        });
    }
    
    addMarker({ id, coordinates, type, data, onClick }) {
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
            el.addEventListener('click', onClick);
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
        
        if (animated) {
            this.animateLine(id);
        }
        
        this.layers.set(id, { type: 'line', sourceId: id });
    }
    
    animateLine(layerId) {
        let offset = 0;
        const animate = () => {
            offset = (offset + 1) % 200;
            this.map.setPaintProperty(layerId, 'line-dasharray', [0, 4, 3]);
            this.map.setPaintProperty(layerId, 'line-gap-width', offset);
            requestAnimationFrame(animate);
        };
        animate();
    }
    
    addArc({ id, start, end, color, height }) {
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
        if (layer) {
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

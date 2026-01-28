/**
 * MAP ENGINE MODULE - GOOGLE MAPS VERSION
 * Handles all Google Maps operations, markers, layers, animations
 */

export class MapEngine {
    constructor(containerId) {
        this.containerId = containerId;
        this.map = null;
        this.markers = new Map();
        this.circles = new Map();
        this.polylines = new Map();
        this.polygons = new Map();
        this.infoWindows = new Map();
        this.isInitialized = false;
    }
    
    async init() {
        // Set loading background
        const container = document.getElementById(this.containerId);
        container.style.backgroundColor = '#0a1929';
        
        try {
            // Wait for Google Maps to load
            await this.waitForGoogleMaps();
            
            // Initialize map with dark theme
            this.map = new google.maps.Map(container, {
                center: { lat: 27.0, lng: 54.0 }, // Persian Gulf
                zoom: 6,
                mapTypeId: 'hybrid', // Satellite with labels
                styles: this.getDarkMapStyles(),
                disableDefaultUI: true,
                zoomControl: true,
                mapTypeControl: false,
                scaleControl: true,
                streetViewControl: false,
                rotateControl: true,
                fullscreenControl: false,
                gestureHandling: 'greedy',
                tilt: 45,
                backgroundColor: '#0a1929'
            });
            
            this.isInitialized = true;
            console.log('Google Maps loaded successfully');
            
            // Add custom controls
            this.addCustomControls();
            
        } catch (error) {
            console.error('Failed to initialize Google Maps:', error);
            this.showMapError();
        }
    }
    
    async waitForGoogleMaps() {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Google Maps failed to load'));
            }, 10000);
            
            const checkGoogle = setInterval(() => {
                if (typeof google !== 'undefined' && google.maps) {
                    clearInterval(checkGoogle);
                    clearTimeout(timeout);
                    resolve();
                }
            }, 100);
        });
    }
    
    getDarkMapStyles() {
        return [
            { elementType: "geometry", stylers: [{ color: "#0a1929" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#0a1929" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#4a9eff" }] },
            {
                featureType: "administrative.locality",
                elementType: "labels.text.fill",
                stylers: [{ color: "#4a9eff" }]
            },
            {
                featureType: "poi",
                elementType: "labels.text.fill",
                stylers: [{ color: "#8a9bb5" }]
            },
            {
                featureType: "poi.park",
                elementType: "geometry",
                stylers: [{ color: "#1a2940" }]
            },
            {
                featureType: "poi.park",
                elementType: "labels.text.fill",
                stylers: [{ color: "#6b9a76" }]
            },
            {
                featureType: "road",
                elementType: "geometry",
                stylers: [{ color: "#1a2940" }]
            },
            {
                featureType: "road",
                elementType: "geometry.stroke",
                stylers: [{ color: "#0a1929" }]
            },
            {
                featureType: "road",
                elementType: "labels.text.fill",
                stylers: [{ color: "#8a9bb5" }]
            },
            {
                featureType: "road.highway",
                elementType: "geometry",
                stylers: [{ color: "#2a3950" }]
            },
            {
                featureType: "road.highway",
                elementType: "geometry.stroke",
                stylers: [{ color: "#1a2940" }]
            },
            {
                featureType: "road.highway",
                elementType: "labels.text.fill",
                stylers: [{ color: "#4a9eff" }]
            },
            {
                featureType: "transit",
                elementType: "geometry",
                stylers: [{ color: "#1a2940" }]
            },
            {
                featureType: "transit.station",
                elementType: "labels.text.fill",
                stylers: [{ color: "#8a9bb5" }]
            },
            {
                featureType: "water",
                elementType: "geometry",
                stylers: [{ color: "#0a1929" }]
            },
            {
                featureType: "water",
                elementType: "labels.text.fill",
                stylers: [{ color: "#4a9eff" }]
            },
            {
                featureType: "water",
                elementType: "labels.text.stroke",
                stylers: [{ color: "#0a1929" }]
            }
        ];
    }
    
    addCustomControls() {
        // Map type toggle button
        const mapTypeButton = document.createElement('button');
        mapTypeButton.textContent = 'Satellite';
        mapTypeButton.className = 'custom-map-control';
        mapTypeButton.style.cssText = `
            background: rgba(18, 24, 38, 0.95);
            border: 1px solid rgba(74, 158, 255, 0.3);
            color: #4a9eff;
            padding: 8px 12px;
            margin: 10px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
            backdrop-filter: blur(10px);
        `;
        
        let isSatellite = true;
        mapTypeButton.addEventListener('click', () => {
            isSatellite = !isSatellite;
            this.map.setMapTypeId(isSatellite ? 'hybrid' : 'roadmap');
            mapTypeButton.textContent = isSatellite ? 'Satellite' : 'Map';
        });
        
        this.map.controls[google.maps.ControlPosition.TOP_RIGHT].push(mapTypeButton);
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
                    Unable to load Google Maps. Please:<br><br>
                    1. Get a free API key at <a href="https://console.cloud.google.com/google/maps-apis" target="_blank" style="color: #4a9eff;">Google Cloud Console</a><br>
                    2. Enable Maps JavaScript API<br>
                    3. Replace key in index.html (line 95)<br>
                    4. Refresh the page
                </p>
            </div>
        `;
    }
    
    flyTo(options) {
        if (!this.map) return;
        
        this.map.panTo({ lat: options.center[1], lng: options.center[0] });
        this.map.setZoom(options.zoom || 6);
        
        if (options.tilt !== undefined) {
            this.map.setTilt(options.tilt);
        }
        if (options.heading !== undefined) {
            this.map.setHeading(options.heading);
        }
    }
    
    addMarker({ id, coordinates, type, data, onClick }) {
        if (!this.map) return;
        
        const position = { lat: coordinates[1], lng: coordinates[0] };
        
        // Create custom marker icon
        const icon = {
            path: type === 'airbase' 
                ? 'M 0,-2 L 2,2 L 0,1.5 L -2,2 Z' // Square for airbase
                : google.maps.SymbolPath.CIRCLE, // Circle for others
            fillColor: this.getMarkerColor(type),
            fillOpacity: 1,
            strokeColor: this.getMarkerBorderColor(type),
            strokeWeight: 2,
            scale: this.getMarkerSize(type),
            anchor: new google.maps.Point(0, 0)
        };
        
        const marker = new google.maps.Marker({
            position: position,
            map: this.map,
            icon: icon,
            title: data.name,
            animation: type === 'carrier' ? google.maps.Animation.BOUNCE : null,
            zIndex: type === 'carrier' ? 1000 : 500
        });
        
        // Stop bounce animation after 2 seconds for carriers
        if (type === 'carrier') {
            setTimeout(() => {
                marker.setAnimation(null);
            }, 2000);
        }
        
        // Add click handler
        if (onClick) {
            marker.addListener('click', onClick);
        }
        
        // Add hover effect
        marker.addListener('mouseover', () => {
            marker.setIcon({
                ...icon,
                scale: icon.scale * 1.3
            });
        });
        
        marker.addListener('mouseout', () => {
            marker.setIcon(icon);
        });
        
        this.markers.set(id, { marker, data, type });
    }
    
    getMarkerSize(type) {
        const sizes = {
            carrier: 12,
            destroyer: 8,
            airbase: 10,
            allied: 7,
            target: 7
        };
        return sizes[type] || 7;
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
            carrier: '#ffffff',
            destroyer: '#ffffff',
            airbase: '#ffffff',
            allied: '#ffffff',
            target: '#ffffff'
        };
        return colors[type] || '#ffffff';
    }
    
    addCircle({ id, center, radius, color, borderColor }) {
        if (!this.map) return;
        
        const circle = new google.maps.Circle({
            strokeColor: borderColor,
            strokeOpacity: 0.6,
            strokeWeight: 2,
            fillColor: color,
            fillOpacity: 0.2,
            map: this.map,
            center: { lat: center[1], lng: center[0] },
            radius: radius
        });
        
        this.circles.set(id, circle);
    }
    
    addLine({ id, coordinates, color, width }) {
        if (!this.map) return;
        
        const path = coordinates.map(coord => ({
            lat: coord[1],
            lng: coord[0]
        }));
        
        const polyline = new google.maps.Polyline({
            path: path,
            geodesic: true,
            strokeColor: color,
            strokeOpacity: 0.8,
            strokeWeight: width || 3,
            map: this.map
        });
        
        this.polylines.set(id, polyline);
    }
    
    addArc({ id, start, end, color }) {
        if (!this.map) return;
        
        // Create curved path using intermediate points
        const startLatLng = { lat: start[1], lng: start[0] };
        const endLatLng = { lat: end[1], lng: end[0] };
        
        // Calculate midpoint with elevation
        const midLat = (start[1] + end[1]) / 2;
        const midLng = (start[0] + end[0]) / 2;
        
        // Add curvature
        const latOffset = (end[1] - start[1]) * 0.2;
        const lngOffset = (end[0] - start[0]) * 0.2;
        
        const path = [
            startLatLng,
            { lat: midLat + latOffset, lng: midLng + lngOffset },
            endLatLng
        ];
        
        const polyline = new google.maps.Polyline({
            path: path,
            geodesic: false,
            strokeColor: color,
            strokeOpacity: 0.7,
            strokeWeight: 2,
            map: this.map,
            icons: [{
                icon: {
                    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                    scale: 3,
                    fillColor: color,
                    fillOpacity: 0.8,
                    strokeWeight: 1,
                    strokeColor: '#ffffff'
                },
                offset: '100%'
            }]
        });
        
        this.polylines.set(id, polyline);
        
        // Animate the arc
        this.animateArc(polyline, color);
    }
    
    animateArc(polyline, color) {
        let count = 0;
        const animate = () => {
            count = (count + 1) % 200;
            const icons = polyline.get('icons');
            icons[0].offset = (count / 2) + '%';
            polyline.set('icons', icons);
            
            setTimeout(() => {
                if (this.polylines.size > 0) {
                    requestAnimationFrame(animate);
                }
            }, 50);
        };
        animate();
    }
    
    clearLayers() {
        // Remove all markers
        this.markers.forEach(({ marker }) => marker.setMap(null));
        this.markers.clear();
        
        // Remove all circles
        this.circles.forEach(circle => circle.setMap(null));
        this.circles.clear();
        
        // Remove all polylines
        this.polylines.forEach(polyline => polyline.setMap(null));
        this.polylines.clear();
        
        // Remove all polygons
        this.polygons.forEach(polygon => polygon.setMap(null));
        this.polygons.clear();
    }
    
    removeLayer(id) {
        // Remove marker
        const marker = this.markers.get(id);
        if (marker) {
            marker.marker.setMap(null);
            this.markers.delete(id);
        }
        
        // Remove circle
        const circle = this.circles.get(id);
        if (circle) {
            circle.setMap(null);
            this.circles.delete(id);
        }
        
        // Remove polyline
        const polyline = this.polylines.get(id);
        if (polyline) {
            polyline.setMap(null);
            this.polylines.delete(id);
        }
        
        // Remove polygon
        const polygon = this.polygons.get(id);
        if (polygon) {
            polygon.setMap(null);
            this.polygons.delete(id);
        }
    }
}

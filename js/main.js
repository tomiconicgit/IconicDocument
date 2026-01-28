/**
 * IRAN STRIKE ANALYSIS VISUALIZER
 * Main Application Entry Point
 * Orchestrates all modules and initializes the app
 */

import { MapEngine } from './map-engine.js';
import { ScenarioManager } from './scenario-manager.js';
import { TimelineController } from './timeline-controller.js';
import { UIManager } from './ui-manager.js';

class App {
    constructor() {
        this.mapEngine = null;
        this.scenarioManager = null;
        this.timelineController = null;
        this.uiManager = null;
        
        this.data = {
            forces: null,
            scenarios: null,
            allies: null,
            timeline: null
        };
        
        this.state = {
            currentScenario: null,
            timelinePosition: 0,
            layers: {
                forces: true,
                allies: true,
                targets: false,
                ranges: false
            }
        };
    }
    
    async init() {
        console.log('Initializing Iran Strike Analysis Visualizer...');
        
        try {
            // Load all data
            await this.loadData();
            
            // Initialize modules
            this.initializeModules();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            // Load initial view
            this.loadInitialView();
            
            console.log('Application initialized successfully');
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showError('Failed to load application. Please refresh the page.');
        }
    }
    
    async loadData() {
        console.log('Loading data...');
        
        const dataFiles = [
            { key: 'forces', path: 'data/forces.json' },
            { key: 'scenarios', path: 'data/scenarios.json' },
            { key: 'allies', path: 'data/allies.json' },
            { key: 'timeline', path: 'data/timeline.json' }
        ];
        
        const promises = dataFiles.map(({ key, path }) =>
            fetch(path)
                .then(response => response.json())
                .then(data => { this.data[key] = data; })
        );
        
        await Promise.all(promises);
        console.log('All data loaded successfully');
    }
    
    initializeModules() {
        console.log('Initializing modules...');
        
        // Initialize map engine
        this.mapEngine = new MapEngine('map');
        this.mapEngine.init();
        
        // Initialize scenario manager
        this.scenarioManager = new ScenarioManager(this.mapEngine, this.data.scenarios);
        
        // Initialize timeline controller
        this.timelineController = new TimelineController(this.data.timeline);
        
        // Initialize UI manager
        this.uiManager = new UIManager(this);
    }
    
    setupEventListeners() {
        // Layer toggles
        document.getElementById('toggle-forces').addEventListener('change', (e) => {
            this.state.layers.forces = e.target.checked;
            this.updateLayers();
        });
        
        document.getElementById('toggle-allies').addEventListener('change', (e) => {
            this.state.layers.allies = e.target.checked;
            this.updateLayers();
        });
        
        document.getElementById('toggle-targets').addEventListener('change', (e) => {
            this.state.layers.targets = e.target.checked;
            this.updateLayers();
        });
        
        document.getElementById('toggle-ranges').addEventListener('change', (e) => {
            this.state.layers.ranges = e.target.checked;
            this.updateLayers();
        });
        
        // Timeline slider
        document.getElementById('timeline-slider').addEventListener('input', (e) => {
            this.state.timelinePosition = parseInt(e.target.value);
            this.timelineController.updatePosition(this.state.timelinePosition);
            this.updateTimelineView();
        });
        
        // Auto-play button
        document.getElementById('autoplay-btn').addEventListener('click', () => {
            this.startAutoPlay();
        });
        
        // Info panel close
        document.getElementById('close-info').addEventListener('click', () => {
            this.uiManager.hideInfoPanel();
        });
        
        // Mobile menu toggle
        document.getElementById('mobile-menu-toggle').addEventListener('click', () => {
            this.uiManager.toggleMobileMenu();
        });
    }
    
    loadInitialView() {
        // Set initial camera position (Persian Gulf focus)
        this.mapEngine.flyTo({
            center: [54.0, 27.0], // Persian Gulf
            zoom: 5.5,
            pitch: 45,
            bearing: 0
        });
        
        // Load forces
        this.updateLayers();
        
        // Render scenario buttons
        this.renderScenarioButtons();
    }
    
    renderScenarioButtons() {
        const container = document.getElementById('scenario-buttons');
        container.innerHTML = '';
        
        this.data.scenarios.forEach((scenario, index) => {
            const button = document.createElement('button');
            button.className = 'scenario-btn';
            button.innerHTML = `
                <div class="scenario-btn-title">${scenario.name}</div>
                <div class="scenario-btn-desc">${scenario.description}</div>
            `;
            
            button.addEventListener('click', () => {
                this.loadScenario(index);
            });
            
            container.appendChild(button);
        });
    }
    
    loadScenario(index) {
        // Remove active class from all buttons
        document.querySelectorAll('.scenario-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to clicked button
        document.querySelectorAll('.scenario-btn')[index].classList.add('active');
        
        // Load scenario
        this.state.currentScenario = index;
        this.scenarioManager.loadScenario(this.data.scenarios[index]);
        
        // Update status
        document.getElementById('current-status').textContent = this.data.scenarios[index].name;
    }
    
    updateLayers() {
        // Clear existing layers
        this.mapEngine.clearLayers();
        
        // Add forces if enabled
        if (this.state.layers.forces) {
            this.addForcesLayer();
        }
        
        // Add allies if enabled
        if (this.state.layers.allies) {
            this.addAlliesLayer();
        }
        
        // Add targets if enabled
        if (this.state.layers.targets) {
            this.addTargetsLayer();
        }
        
        // Add ranges if enabled
        if (this.state.layers.ranges) {
            this.addRangesLayer();
        }
    }
    
    addForcesLayer() {
        this.data.forces.carriers.forEach(carrier => {
            this.mapEngine.addMarker({
                id: carrier.id,
                coordinates: carrier.coordinates,
                type: 'carrier',
                data: carrier,
                onClick: () => this.showForceInfo(carrier)
            });
        });
        
        this.data.forces.escorts.forEach(escort => {
            this.mapEngine.addMarker({
                id: escort.id,
                coordinates: escort.coordinates,
                type: 'destroyer',
                data: escort,
                onClick: () => this.showForceInfo(escort)
            });
        });
        
        this.data.forces.airbases.forEach(base => {
            this.mapEngine.addMarker({
                id: base.id,
                coordinates: base.coordinates,
                type: 'airbase',
                data: base,
                onClick: () => this.showForceInfo(base)
            });
        });
    }
    
    addAlliesLayer() {
        this.data.allies.forEach(ally => {
            this.mapEngine.addMarker({
                id: ally.id,
                coordinates: ally.coordinates,
                type: 'allied',
                data: ally,
                onClick: () => this.showAllyInfo(ally)
            });
        });
    }
    
    addTargetsLayer() {
        // Add strategic sites
        const targets = [
            { id: 'natanz', name: 'Natanz Nuclear Facility', coordinates: [51.7295, 33.7247], type: 'nuclear' },
            { id: 'fordow', name: 'Fordow Enrichment Site', coordinates: [50.9881, 34.9517], type: 'nuclear' },
            { id: 'arak', name: 'Arak Heavy Water Reactor', coordinates: [49.6917, 34.0964], type: 'nuclear' },
            { id: 'parchin', name: 'Parchin Military Complex', coordinates: [51.7833, 35.5167], type: 'military' },
            { id: 'irgc_hq', name: 'IRGC Headquarters', coordinates: [51.4215, 35.6892], type: 'command' }
        ];
        
        targets.forEach(target => {
            this.mapEngine.addMarker({
                id: target.id,
                coordinates: target.coordinates,
                type: 'target',
                data: target,
                onClick: () => this.showTargetInfo(target)
            });
        });
    }
    
    addRangesLayer() {
        // Add strike range circles from airbases
        this.data.forces.airbases.forEach(base => {
            this.mapEngine.addCircle({
                id: `range-${base.id}`,
                center: base.coordinates,
                radius: base.range * 1000, // Convert km to meters
                color: 'rgba(74, 158, 255, 0.1)',
                borderColor: 'rgba(74, 158, 255, 0.3)'
            });
        });
    }
    
    showForceInfo(force) {
        const content = `
            <h3>${force.name}</h3>
            <p><strong>Type:</strong> ${force.type}</p>
            <p><strong>Location:</strong> ${force.location}</p>
            <p><strong>Status:</strong> ${force.status}</p>
            <p>${force.description}</p>
            <div class="info-meta">
                <p><strong>Capabilities:</strong> ${force.capabilities.join(', ')}</p>
                <p><strong>Last Updated:</strong> ${force.lastUpdate}</p>
            </div>
        `;
        this.uiManager.showInfoPanel(content);
    }
    
    showAllyInfo(ally) {
        const content = `
            <h3>${ally.name}</h3>
            <p><strong>Country:</strong> ${ally.country}</p>
            <p><strong>Type:</strong> ${ally.type}</p>
            <p>${ally.description}</p>
            <div class="info-meta">
                <p><strong>Role:</strong> ${ally.role}</p>
            </div>
        `;
        this.uiManager.showInfoPanel(content);
    }
    
    showTargetInfo(target) {
        const content = `
            <h3>${target.name}</h3>
            <p><strong>Type:</strong> ${target.type.toUpperCase()}</p>
            <p>Strategic site identified by analysts as potential focus of liberation operations.</p>
            <div class="info-meta">
                <p><strong>Note:</strong> Illustrative purposes for analysis</p>
            </div>
        `;
        this.uiManager.showInfoPanel(content);
    }
    
    updateTimelineView() {
        const position = this.state.timelinePosition;
        const phase = this.timelineController.getCurrentPhase(position);
        
        if (phase) {
            document.getElementById('timeline-date').textContent = phase.date;
            document.getElementById('current-status').textContent = phase.name;
        }
    }
    
    startAutoPlay() {
        const button = document.getElementById('autoplay-btn');
        const icon = button.querySelector('.btn-icon');
        
        if (this.autoPlayInterval) {
            // Stop auto-play
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
            icon.textContent = '▶';
            button.querySelector('span:last-child').textContent = 'Start Presentation';
        } else {
            // Start auto-play
            icon.textContent = '⏸';
            button.querySelector('span:last-child').textContent = 'Pause Presentation';
            
            let position = 0;
            const slider = document.getElementById('timeline-slider');
            
            this.autoPlayInterval = setInterval(() => {
                position += 2;
                if (position > 100) position = 0;
                
                slider.value = position;
                this.state.timelinePosition = position;
                this.timelineController.updatePosition(position);
                this.updateTimelineView();
            }, 1000);
        }
    }
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
        }, 500);
    }
    
    showError(message) {
        alert(message); // Simple error handling - can be enhanced
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});

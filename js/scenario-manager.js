/**
 * SCENARIO MANAGER MODULE
 * Handles scenario loading, visualization, and animations
 */

export class ScenarioManager {
    constructor(mapEngine, scenarios) {
        this.mapEngine = mapEngine;
        this.scenarios = scenarios;
        this.currentScenario = null;
        this.activeAnimations = [];
    }
    
    loadScenario(scenario) {
        console.log(`Loading scenario: ${scenario.name}`);
        
        // Clear previous scenario
        this.clearScenario();
        
        this.currentScenario = scenario;
        
        // Fly to scenario focal point
        if (scenario.camera) {
            this.mapEngine.flyTo(scenario.camera);
        }
        
        // Add scenario layers
        this.addScenarioLayers(scenario);
        
        // Start animations
        if (scenario.animations) {
            this.startAnimations(scenario.animations);
        }
    }
    
    addScenarioLayers(scenario) {
        // Add strike paths
        if (scenario.strikePaths) {
            scenario.strikePaths.forEach((path, index) => {
                this.mapEngine.addArc({
                    id: `strike-path-${index}`,
                    start: path.origin,
                    end: path.target,
                    color: path.color || '#ff4a5f',
                    height: path.height || 0.5
                });
            });
        }
        
        // Add zones
        if (scenario.zones) {
            scenario.zones.forEach((zone, index) => {
                this.mapEngine.addCircle({
                    id: `zone-${index}`,
                    center: zone.center,
                    radius: zone.radius,
                    color: zone.color || 'rgba(255, 74, 95, 0.1)',
                    borderColor: zone.borderColor || 'rgba(255, 74, 95, 0.3)'
                });
            });
        }
        
        // Add movement paths
        if (scenario.movements) {
            scenario.movements.forEach((movement, index) => {
                this.mapEngine.addLine({
                    id: `movement-${index}`,
                    coordinates: movement.path,
                    color: movement.color || '#4a9eff',
                    width: 3,
                    animated: true
                });
            });
        }
    }
    
    startAnimations(animations) {
        animations.forEach((animation, index) => {
            const timeout = setTimeout(() => {
                this.executeAnimation(animation);
            }, animation.delay || index * 1000);
            
            this.activeAnimations.push(timeout);
        });
    }
    
    executeAnimation(animation) {
        switch (animation.type) {
            case 'flyTo':
                this.mapEngine.flyTo(animation.camera);
                break;
            case 'addLayer':
                // Add layer dynamically
                break;
            case 'removeLayer':
                this.mapEngine.removeLayer(animation.layerId);
                break;
        }
    }
    
    clearScenario() {
        // Clear animations
        this.activeAnimations.forEach(timeout => clearTimeout(timeout));
        this.activeAnimations = [];
        
        // Clear scenario-specific layers
        if (this.currentScenario) {
            // Strike paths
            if (this.currentScenario.strikePaths) {
                this.currentScenario.strikePaths.forEach((_, index) => {
                    this.mapEngine.removeLayer(`strike-path-${index}`);
                });
            }
            
            // Zones
            if (this.currentScenario.zones) {
                this.currentScenario.zones.forEach((_, index) => {
                    this.mapEngine.removeLayer(`zone-${index}`);
                });
            }
            
            // Movements
            if (this.currentScenario.movements) {
                this.currentScenario.movements.forEach((_, index) => {
                    this.mapEngine.removeLayer(`movement-${index}`);
                });
            }
        }
        
        this.currentScenario = null;
    }
}

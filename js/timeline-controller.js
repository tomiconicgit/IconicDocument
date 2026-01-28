/**
 * TIMELINE CONTROLLER MODULE
 * Manages timeline phases and date progression
 */

export class TimelineController {
    constructor(timelineData) {
        this.timelineData = timelineData;
        this.currentPhase = null;
        this.initializeMarkers();
    }
    
    initializeMarkers() {
        const markersContainer = document.getElementById('timeline-markers');
        if (!markersContainer) return;
        
        this.timelineData.phases.forEach(() => {
            const marker = document.createElement('div');
            marker.className = 'timeline-marker';
            markersContainer.appendChild(marker);
        });
    }
    
    updatePosition(position) {
        const phaseIndex = Math.floor(position / (100 / this.timelineData.phases.length));
        const phase = this.timelineData.phases[Math.min(phaseIndex, this.timelineData.phases.length - 1)];
        
        if (phase !== this.currentPhase) {
            this.currentPhase = phase;
            this.onPhaseChange(phase);
        }
    }
    
    getCurrentPhase(position) {
        const phaseIndex = Math.floor(position / (100 / this.timelineData.phases.length));
        return this.timelineData.phases[Math.min(phaseIndex, this.timelineData.phases.length - 1)];
    }
    
    onPhaseChange(phase) {
        console.log(`Timeline phase changed: ${phase.name}`);
        // Additional phase change logic can be added here
    }
}
